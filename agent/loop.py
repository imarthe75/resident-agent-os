"""Resident Agent OS loop: the core execution engine with structured telemetry."""

import logging
import time
from pathlib import Path
from typing import Any, Optional

from dotenv import load_dotenv

from agent.exceptions import (
    AgentMemoryError,
    ECCLimitError,
    SchemaValidationError,
    SpecMissingError,
    SpecNotApprovedError,
)
from agent.specs import APPROVED, parse_specs
from agent import decisions as decisions_mod
from agent.heuristic_engine import HeuristicEngine
from agent.profile import applicable_rule_files, load_profile
from agent.skill_base import Skill
from agent.state_parser import read_state, write_state
from agent.telemetry import DEFAULT_TELEMETRY_REL, TelemetryWriter
from memory.agent_state import LoopState
from memory.long_term_memory import LongTermMemory
from memory.semantic_cache import SemanticCache

logger = logging.getLogger(__name__)
MAX_RETRIES = 3


class ResidentAgentLoop:
    """
    10-phase execution loop for the Resident Agent OS.
    Implements: boot → load_context → retrieve_memory → apply_heuristics →
    ensure_spec → plan_tasks → execute → verify → store_memory → update_state
    """

    def __init__(
        self,
        agent_dir: Path | str = Path(".agent"),
        heuristics_path: Optional[Path | str] = None,
        state_path: Optional[Path | str] = None,
        telemetry_path: Optional[Path | str] = None,
        correlation_id: Optional[str] = None,
        project_id: Optional[str] = None,
        max_token_budget: int = 0,
        max_failure_streak: int = 0,
    ) -> None:
        self.agent_dir = Path(agent_dir)
        self.heuristics_path = Path(heuristics_path) if heuristics_path else (self.agent_dir / "heuristics.json")
        self.state_path = Path(state_path) if state_path else (self.agent_dir / "STATE.md")
        self.project_id = project_id or self.agent_dir.resolve().parent.name or "default"
        self.max_token_budget = max(0, int(max_token_budget))
        self.max_failure_streak = max(0, int(max_failure_streak))
        self._failure_streak = 0

        self._ltm: Optional[LongTermMemory] = None
        self._cache: Optional[SemanticCache] = None
        self._engine: Optional[HeuristicEngine] = None
        self.state: LoopState = LoopState()
        self._context: dict[str, Any] = {}
        self._decision_layer = None
        self._service_health: dict[str, Any] = {
            "valkey": "unknown",
            "postgres": "unknown",
            "schema_ready": False,
            "heuristics": "unknown",
        }
        t_path = Path(telemetry_path) if telemetry_path else (self.agent_dir / DEFAULT_TELEMETRY_REL)
        self.telemetry = TelemetryWriter(
            path=t_path,
            session_id=self.state.session_id,
            correlation_id=correlation_id,
            project_id=self.project_id,
        )

    def _log_extra(self, phase: str, skill: Optional[str] = None, **kwargs: Any) -> dict[str, Any]:
        data: dict[str, Any] = {
            "session_id": self.state.session_id,
            "correlation_id": self.telemetry.correlation_id,
            "phase": phase,
        }
        if skill:
            data["skill"] = skill
        data.update(kwargs)
        return data

    def boot(self) -> None:
        """
        Phase 1: Boot and health check.
        - Load environment from .env
        - Ping Valkey and PostgreSQL
        - Instantiate HeuristicEngine
        - Graceful degradation on service unavailability
        """
        t0 = time.perf_counter()
        self.state.advance_phase("boot")
        logger.info("Bootstrapping Resident Agent", extra=self._log_extra("boot"))

        load_dotenv()

        try:
            self._cache = SemanticCache()
            if not self._cache.ping():
                logger.warning("Valkey unavailable, continuing in degraded mode", extra=self._log_extra("boot"))
                self._cache = None
                self._service_health["valkey"] = "down"
            else:
                self._service_health["valkey"] = "up"
        except Exception as e:
            logger.warning("Valkey initialization failed: %s, continuing degraded", e, exc_info=True, extra=self._log_extra("boot"))
            self._cache = None
            self._service_health["valkey"] = "down"

        try:
            self._ltm = LongTermMemory()
            if not self._ltm.ping():
                logger.warning("PostgreSQL unavailable, continuing in degraded mode", extra=self._log_extra("boot"))
                self._ltm = None
                self._service_health["postgres"] = "down"
                self._service_health["schema_ready"] = False
            else:
                self._service_health["postgres"] = "up"
                ready = self._ltm.schema_ready()
                self._service_health["schema_ready"] = bool(ready)
                if not ready:
                    logger.warning(
                        "PostgreSQL schema not ready. Run: sql/agent_memory.sql",
                        extra=self._log_extra("boot"),
                    )
        except Exception as e:
            logger.warning("PostgreSQL initialization failed: %s, continuing degraded", e, exc_info=True, extra=self._log_extra("boot"))
            self._ltm = None
            self._service_health["postgres"] = "down"
            self._service_health["schema_ready"] = False

        try:
            self._engine = HeuristicEngine(self.heuristics_path)
            self._service_health["heuristics"] = "up"
        except Exception as e:
            logger.warning("Heuristics engine failed to load: %s", e, exc_info=True, extra=self._log_extra("boot"))
            self._engine = None
            self._service_health["heuristics"] = "down"

        degraded = any(self._service_health[k] != "up" for k in ("valkey", "postgres", "heuristics"))
        outcome = "degraded" if degraded else "ok"
        elapsed = (time.perf_counter() - t0) * 1000.0
        self.telemetry.emit(
            "phase_boot",
            phase="boot",
            outcome=outcome,
            duration_ms=elapsed,
            level="WARNING" if degraded else "INFO",
            detail={"services": dict(self._service_health)},
        )
        logger.info("Bootstrap complete (outcome=%s)", outcome, extra=self._log_extra("boot", outcome=outcome, duration_ms=elapsed))

    def load_context(self) -> dict[str, Any]:
        """
        Phase 2: Load all context from .agent/*.md files.
        Also load machine state from STATE.md.
        """
        t0 = time.perf_counter()
        self.state.advance_phase("load_context")
        logger.info("Loading agent context", extra=self._log_extra("load_context"))

        self._context = {}
        if self.agent_dir.exists():
            for md_file in sorted(self.agent_dir.glob("*.md")):
                try:
                    self._context[md_file.stem] = md_file.read_text(encoding="utf-8")
                except OSError as e:
                    logger.warning("Failed to read %s: %s", md_file, e, exc_info=True, extra=self._log_extra("load_context"))

        self._context["_machine_state"] = read_state(self.state_path)
        profile = load_profile(self.agent_dir / "PROFILE.json")
        self._context["profile"] = profile
        rules_dir = self.agent_dir.parent / "rules"
        if rules_dir.is_dir():
            self._context["applicable_rules"] = [str(p.relative_to(rules_dir.parent)) for p in applicable_rule_files(rules_dir, profile)]
        elapsed = (time.perf_counter() - t0) * 1000.0
        self.telemetry.emit(
            "phase_load_context",
            phase="load_context",
            outcome="ok",
            duration_ms=elapsed,
            detail={"sections": len(self._context)},
        )
        logger.info("Context loaded (%d sections)", len(self._context), extra=self._log_extra("load_context", duration_ms=elapsed))
        return self._context

    def retrieve_memory(
        self, query: str = "", embedding: Optional[list] = None, allow_semantic: bool = False
    ) -> Optional[str]:
        """
        Phase 3: memory lookup.
        - Exact cache hit on the normalised query text (safe for decisions) when a query is given.
        - Semantic cache (most similar earlier answer) ONLY when the caller opts in with allow_semantic=True.
        - Long-term lessons (pgvector) when an embedding is given. Returns None gracefully if nothing is available.
        """
        t0 = time.perf_counter()
        self.state.advance_phase("retrieve_memory")

        if self._cache and query:
            exact = self._cache.get_exact(query)
            if exact:
                elapsed = (time.perf_counter() - t0) * 1000.0
                self.telemetry.emit("memory_lookup", phase="retrieve_memory", outcome="cache_hit", duration_ms=elapsed, detail={"layer": "exact_cache"})
                logger.info("Memory retrieved from exact cache", extra=self._log_extra("retrieve_memory", outcome="cache_hit"))
                return exact

        if embedding is None:
            elapsed = (time.perf_counter() - t0) * 1000.0
            self.telemetry.emit("memory_lookup", phase="retrieve_memory", outcome="cache_miss", duration_ms=elapsed, detail={"reason": "no_embedding"})
            logger.debug("No embedding provided, skipping semantic/long-term retrieval", extra=self._log_extra("retrieve_memory"))
            return None

        if self._cache and allow_semantic:
            cached = self._cache.get(embedding, allow_semantic=True)
            if cached:
                elapsed = (time.perf_counter() - t0) * 1000.0
                self.telemetry.emit("memory_lookup", phase="retrieve_memory", outcome="cache_hit", duration_ms=elapsed, detail={"layer": "semantic_cache"})
                logger.info("Memory retrieved from semantic cache", extra=self._log_extra("retrieve_memory", outcome="cache_hit"))
                return cached

        if self._ltm:
            results = self._ltm.search_lessons(embedding, limit=1)
            if results:
                elapsed = (time.perf_counter() - t0) * 1000.0
                self.telemetry.emit("memory_lookup", phase="retrieve_memory", outcome="ok", duration_ms=elapsed, detail={"layer": "pgvector"})
                logger.info("Memory retrieved from long-term storage", extra=self._log_extra("retrieve_memory"))
                return results[0][0]

        elapsed = (time.perf_counter() - t0) * 1000.0
        self.telemetry.emit("memory_lookup", phase="retrieve_memory", outcome="cache_miss", duration_ms=elapsed)
        logger.debug("No relevant memory found", extra=self._log_extra("retrieve_memory"))
        return None

    def ask_decisions(self, state: Any, names: Optional[list] = None) -> dict:
        """
        Optional phase 3b: ask the configured decision backend the closed questions of .agent/decisions.json about `state`.
        """
        t0 = time.perf_counter()
        self.state.advance_phase("ask_decisions")
        cat = self.agent_dir / "decisions.json"
        try:
            backend = decisions_mod.backend_from_env()
            if backend is None or not cat.exists():
                reason = "no backend configured" if backend is None else "no decisions.json"
                self._context["decisions"] = {"available": False, "reason": reason}
                self.telemetry.emit(
                    "ask_decisions",
                    phase="ask_decisions",
                    outcome="degraded",
                    duration_ms=(time.perf_counter() - t0) * 1000.0,
                    detail={"reason": reason},
                )
                return {}
            questions, thresholds = decisions_mod.load_catalogue(cat)
            layer = decisions_mod.DecisionLayer(questions, thresholds, backend)
            answers = layer.ask(state, names)
        except (decisions_mod.DecisionError, OSError, ValueError, KeyError) as e:
            logger.error("Typed decisions unavailable: %s", e, exc_info=True, extra=self._log_extra("ask_decisions"))
            self._context["decisions"] = {"available": False, "reason": str(e)}
            self.telemetry.emit(
                "ask_decisions",
                phase="ask_decisions",
                outcome="error",
                level="ERROR",
                duration_ms=(time.perf_counter() - t0) * 1000.0,
                detail={"error": str(e)},
            )
            return {}
        self._context["decisions"] = {"available": True, "calibrated": backend.calibrated, **layer.facts(answers)}
        self._decision_layer = layer
        self.telemetry.emit(
            "ask_decisions",
            phase="ask_decisions",
            outcome="ok",
            duration_ms=(time.perf_counter() - t0) * 1000.0,
            detail={"questions": len(answers), "calibrated": backend.calibrated},
        )
        return answers

    def apply_heuristics(self, context: dict[str, Any]) -> list[str]:
        """
        Phase 4: Evaluate heuristic rules against context.
        Returns ordered list of applicable action strings.
        """
        t0 = time.perf_counter()
        self.state.advance_phase("apply_heuristics")

        if not self._engine:
            logger.warning("Heuristics engine not initialized, returning empty", extra=self._log_extra("apply_heuristics"))
            self.telemetry.emit("apply_heuristics", phase="apply_heuristics", outcome="degraded", duration_ms=(time.perf_counter() - t0) * 1000.0)
            return []

        actions = self._engine.evaluate(context)
        outcome = "escalate_to_human" if "escalate_to_human" in actions else "ok"
        elapsed = (time.perf_counter() - t0) * 1000.0
        self.telemetry.emit(
            "apply_heuristics",
            phase="apply_heuristics",
            outcome=outcome,
            duration_ms=elapsed,
            detail={"actions": actions},
        )
        logger.info("Heuristics evaluated: %s", actions, extra=self._log_extra("apply_heuristics", outcome=outcome, duration_ms=elapsed))
        return actions

    def ensure_spec(self, spec_id: str) -> None:
        """
        Phase 5: the spec contract gate. Raises SpecMissingError if no spec has EXACTLY this id in SPECS.md,
        and SpecNotApprovedError if that spec's own status is not APROBADO.
        """
        t0 = time.perf_counter()
        self.state.advance_phase("ensure_spec")
        logger.info("Ensuring spec %s exists and is approved", spec_id, extra=self._log_extra("ensure_spec"))

        specs = parse_specs(self._context.get("SPECS", ""))
        spec = specs.get(spec_id)
        if spec is None:
            self.telemetry.emit(
                "ensure_spec",
                phase="ensure_spec",
                outcome="error",
                level="ERROR",
                duration_ms=(time.perf_counter() - t0) * 1000.0,
                detail={"spec_id": spec_id, "reason": "missing"},
            )
            raise SpecMissingError(f"Spec {spec_id} not found in SPECS.md. Define it before implementing.")
        if spec["status"] != APPROVED:
            self.telemetry.emit(
                "ensure_spec",
                phase="ensure_spec",
                outcome="error",
                level="ERROR",
                duration_ms=(time.perf_counter() - t0) * 1000.0,
                detail={"spec_id": spec_id, "status": spec["status"]},
            )
            raise SpecNotApprovedError(f"Spec {spec_id} has status {spec['status']!r}, not {APPROVED!r}: it is not a contract yet.")

        self.telemetry.emit(
            "ensure_spec",
            phase="ensure_spec",
            outcome="ok",
            duration_ms=(time.perf_counter() - t0) * 1000.0,
            detail={"spec_id": spec_id},
        )
        logger.info("Spec %s verified", spec_id, extra=self._log_extra("ensure_spec"))

    def plan_tasks(
        self, skills: list[Skill], inputs: list[dict]
    ) -> list[tuple[Skill, dict]]:
        """
        Phase 6: Validate skill inputs against their schemas.
        Returns validated queue of (Skill, raw_input) tuples.
        """
        t0 = time.perf_counter()
        self.state.advance_phase("plan_tasks")
        logger.info("Planning %d tasks", len(skills), extra=self._log_extra("plan_tasks"))

        queue = []
        for skill, raw_input in zip(skills, inputs):
            try:
                skill.input_schema.model_validate(raw_input)
                queue.append((skill, raw_input))
                logger.debug("Task %s validated", skill.name, extra=self._log_extra("plan_tasks", skill=skill.name))
            except Exception as e:
                self.telemetry.emit(
                    "plan_tasks",
                    phase="plan_tasks",
                    skill=skill.name,
                    outcome="error",
                    level="ERROR",
                    duration_ms=(time.perf_counter() - t0) * 1000.0,
                    detail={"error": str(e)},
                )
                raise SchemaValidationError(
                    f"Failed to validate input for {skill.name}: {e}"
                ) from e

        self.telemetry.emit(
            "plan_tasks",
            phase="plan_tasks",
            outcome="ok",
            duration_ms=(time.perf_counter() - t0) * 1000.0,
            detail={"planned": len(queue)},
        )
        logger.info("%d tasks planned and validated", len(queue), extra=self._log_extra("plan_tasks"))
        return queue

    def execute(self, skill: Skill, input_data: dict) -> dict:
        """
        Phase 7: Execute a skill with retry tracking and structured telemetry.
        On ECCLimitError, records error and re-raises.
        On other exceptions, increments retry and re-raises if within limit.
        """
        t0 = time.perf_counter()
        self.state.advance_phase("execute")
        self.state.current_skill = skill.name

        if self.max_token_budget > 0:
            totals = self.state.usage_totals()
            used = totals["tokens_in"] + totals["tokens_out"]
            if used >= self.max_token_budget:
                msg = f"Session token budget exhausted ({used} >= {self.max_token_budget})"
                self.state.record_error(skill.name, msg, "execute")
                self.telemetry.emit("skill_execute", phase="execute", skill=skill.name, outcome="error", level="ERROR", detail={"error": msg, "budget_exhausted": True})
                raise ECCLimitError(msg)

        if self.max_failure_streak > 0 and self._failure_streak >= self.max_failure_streak:
            msg = f"Consecutive tool failure streak reached ({self._failure_streak} >= {self.max_failure_streak})"
            self.state.record_error(skill.name, msg, "execute")
            self.telemetry.emit("skill_execute", phase="execute", skill=skill.name, outcome="error", level="ERROR", detail={"error": msg, "failure_streak": self._failure_streak})
            raise ECCLimitError(msg)

        logger.info("Executing skill: %s", skill.name, extra=self._log_extra("execute", skill=skill.name))

        try:
            result = skill.run(input_data)
            self._failure_streak = 0
            usage = result.get("_usage") if isinstance(result, dict) else None
            tokens_in = int(usage.get("tokens_in", 0)) if usage else 0
            tokens_out = int(usage.get("tokens_out", 0)) if usage else 0
            cost_usd = float(usage.get("usd", 0.0)) if usage else 0.0
            if usage:
                self.state.record_usage(skill.name, tokens_in, tokens_out, cost_usd)
            self.state.completed_skills.append(skill.name)
            elapsed = (time.perf_counter() - t0) * 1000.0
            outcome = "abstention" if (isinstance(result, dict) and result.get("_abstained")) else "ok"
            self.telemetry.emit(
                "skill_execute",
                phase="execute",
                skill=skill.name,
                outcome=outcome,
                duration_ms=elapsed,
                tokens_in=tokens_in,
                tokens_out=tokens_out,
                cost_usd=cost_usd,
                retries=self.state.get_retry(skill.name),
            )
            logger.info(
                "Skill %s succeeded",
                skill.name,
                extra=self._log_extra("execute", skill=skill.name, outcome=outcome, duration_ms=elapsed, cost_usd=cost_usd),
            )
            return result
        except ECCLimitError as e:
            elapsed = (time.perf_counter() - t0) * 1000.0
            self.state.record_error(skill.name, str(e), "execute")
            self.telemetry.emit(
                "skill_execute",
                phase="execute",
                skill=skill.name,
                outcome="error",
                level="ERROR",
                duration_ms=elapsed,
                retries=self.state.get_retry(skill.name),
                detail={"error": str(e), "ecc_limit": True},
            )
            logger.error("Skill %s exceeded ECC limit", skill.name, exc_info=True, extra=self._log_extra("execute", skill=skill.name))
            raise
        except Exception as e:
            elapsed = (time.perf_counter() - t0) * 1000.0
            self._failure_streak += 1
            retry_count = self.state.increment_retry(skill.name)
            self.state.record_error(skill.name, str(e), "execute")
            self.telemetry.emit(
                "skill_execute",
                phase="execute",
                skill=skill.name,
                outcome="error",
                level="ERROR" if retry_count >= MAX_RETRIES else "WARNING",
                duration_ms=elapsed,
                retries=retry_count,
                detail={"error": str(e), "ecc_limit": retry_count >= MAX_RETRIES},
            )
            logger.warning(
                "Skill %s failed (attempt %d/%d): %s",
                skill.name,
                retry_count,
                MAX_RETRIES,
                e,
                exc_info=True,
                extra=self._log_extra("execute", skill=skill.name),
            )
            if retry_count >= MAX_RETRIES:
                raise ECCLimitError(
                    f"Skill '{skill.name}' exceeded ECC retry limit"
                ) from e
            raise

    def verify(self, skill: Skill, output: dict) -> bool:
        """
        Phase 8: Validate skill output against output_schema.
        Raises SchemaValidationError if validation fails.
        Returns True on success.
        """
        t0 = time.perf_counter()
        self.state.advance_phase("verify")
        logger.info("Verifying output for %s", skill.name, extra=self._log_extra("verify", skill=skill.name))

        try:
            skill.output_schema.model_validate(output)
            elapsed = (time.perf_counter() - t0) * 1000.0
            self.telemetry.emit("skill_verify", phase="verify", skill=skill.name, outcome="ok", duration_ms=elapsed)
            logger.info("Output verified for %s", skill.name, extra=self._log_extra("verify", skill=skill.name, duration_ms=elapsed))
            return True
        except Exception as e:
            elapsed = (time.perf_counter() - t0) * 1000.0
            self.telemetry.emit(
                "skill_verify",
                phase="verify",
                skill=skill.name,
                outcome="error",
                level="ERROR",
                duration_ms=elapsed,
                detail={"error": str(e)},
            )
            raise SchemaValidationError(
                f"Output validation failed for {skill.name}: {e}"
            ) from e

    def store_memory(
        self,
        lesson: str,
        embedding: Optional[list] = None,
        memory_type: str = "lesson",
        importance_score: float = 0.5,
        evidence_level: str = "HIPOTESIS",
    ) -> None:
        """
        Phase 9: Store lesson/knowledge to long-term memory (pgvector).
        Gracefully skips if LTM unavailable.
        """
        t0 = time.perf_counter()
        self.state.advance_phase("store_memory")
        logger.info("Storing memory: %s", memory_type, extra=self._log_extra("store_memory"))

        if not self._ltm:
            logger.warning("PostgreSQL unavailable, memory not persisted", extra=self._log_extra("store_memory"))
            self.telemetry.emit("store_memory", phase="store_memory", outcome="degraded", duration_ms=(time.perf_counter() - t0) * 1000.0)
            return

        if embedding is None:
            self.telemetry.emit(
                "store_memory",
                phase="store_memory",
                outcome="error",
                level="ERROR",
                duration_ms=(time.perf_counter() - t0) * 1000.0,
                detail={"reason": "missing_embedding"},
            )
            raise AgentMemoryError("store_memory needs a real embedding; refusing to fabricate one")
        try:
            self._ltm.store_memory(
                content=lesson,
                embedding=embedding,
                session_id=self.state.session_id,
                memory_type=memory_type,
                importance_score=importance_score,
                metadata={"phase": self.state.current_phase},
                evidence_level=evidence_level,
                project_id=self.project_id,
            )
            self.telemetry.emit(
                "store_memory",
                phase="store_memory",
                outcome="ok",
                duration_ms=(time.perf_counter() - t0) * 1000.0,
                detail={"memory_type": memory_type, "evidence_level": evidence_level},
            )
            logger.info("Memory persisted", extra=self._log_extra("store_memory"))
        except Exception as e:
            logger.error("Failed to store memory: %s", e, exc_info=True, extra=self._log_extra("store_memory"))
            self.telemetry.emit(
                "store_memory",
                phase="store_memory",
                outcome="error",
                level="ERROR",
                duration_ms=(time.perf_counter() - t0) * 1000.0,
                detail={"error": str(e)},
            )
            raise AgentMemoryError(f"Memory storage failed: {e}") from e

    def update_state(self, summary: Optional[dict] = None) -> None:
        """
        Phase 10: Persist session state to STATE.md.
        Merges summary dict into the saved state.
        """
        t0 = time.perf_counter()
        self.state.advance_phase("update_state")
        logger.info("Updating session state", extra=self._log_extra("update_state"))

        state_data = self.state.to_dict()
        if summary:
            state_data["summary"] = summary

        try:
            write_state(self.state_path, state_data)
            self.telemetry.emit(
                "update_state",
                phase="update_state",
                outcome="ok",
                duration_ms=(time.perf_counter() - t0) * 1000.0,
            )
            logger.info("State persisted to STATE.md", extra=self._log_extra("update_state"))
        except Exception as e:
            logger.error("Failed to update state: %s", e, exc_info=True, extra=self._log_extra("update_state"))
            self.telemetry.emit(
                "update_state",
                phase="update_state",
                outcome="error",
                level="ERROR",
                duration_ms=(time.perf_counter() - t0) * 1000.0,
                detail={"error": str(e)},
            )
            raise

    def close(self) -> None:
        """Close all connections and clean up resources."""
        logger.info("Closing agent loop", extra=self._log_extra("close"))
        if self._ltm:
            try:
                self._ltm.close()
                logger.info("PostgreSQL connection pool closed", extra=self._log_extra("close"))
            except Exception as e:
                logger.error("Error closing PostgreSQL pool: %s", e, exc_info=True, extra=self._log_extra("close"))

        self.telemetry.emit("session_end", phase="close", outcome="ok")
        logger.info("Agent loop closed", extra=self._log_extra("close"))
