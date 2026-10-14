"""Resident Agent OS loop: the core execution engine."""

import logging
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
    ) -> None:
        self.agent_dir = Path(agent_dir)
        self.heuristics_path = Path(heuristics_path) if heuristics_path else (self.agent_dir / "heuristics.json")
        self.state_path = Path(state_path) if state_path else (self.agent_dir / "STATE.md")

        self._ltm: Optional[LongTermMemory] = None
        self._cache: Optional[SemanticCache] = None
        self._engine: Optional[HeuristicEngine] = None
        self.state: LoopState = LoopState()
        self._context: dict[str, Any] = {}
        self._decision_layer = None

    def boot(self) -> None:
        """
        Phase 1: Boot and health check.
        - Load environment from .env
        - Ping Valkey and PostgreSQL
        - Instantiate HeuristicEngine
        - Graceful degradation on service unavailability
        """
        self.state.advance_phase("boot")
        logger.info("🚀 Bootstrapping Resident Agent")

        load_dotenv()

        try:
            self._cache = SemanticCache()
            if not self._cache.ping():
                logger.warning("Valkey unavailable, continuing in degraded mode")
                self._cache = None
        except Exception as e:
            logger.warning(f"Valkey initialization failed: {e}, continuing degraded")
            self._cache = None

        try:
            self._ltm = LongTermMemory()
            if not self._ltm.ping():
                logger.warning(
                    "PostgreSQL unavailable, continuing in degraded mode"
                )
                self._ltm = None
            elif not self._ltm.schema_ready():
                logger.warning(
                    "PostgreSQL schema not ready. Run: sql/agent_memory.sql"
                )
        except Exception as e:
            logger.warning(f"PostgreSQL initialization failed: {e}, continuing degraded")
            self._ltm = None

        try:
            self._engine = HeuristicEngine(self.heuristics_path)
        except Exception as e:
            logger.warning(f"Heuristics engine failed to load: {e}")
            self._engine = None

        logger.info("✅ Bootstrap complete (services may be degraded)")

    def load_context(self) -> dict[str, Any]:
        """
        Phase 2: Load all context from .agent/*.md files.
        Also load machine state from STATE.md.
        """
        self.state.advance_phase("load_context")
        logger.info("📖 Loading agent context")

        self._context = {}
        if self.agent_dir.exists():
            for md_file in sorted(self.agent_dir.glob("*.md")):
                try:
                    self._context[md_file.stem] = md_file.read_text(encoding="utf-8")
                except OSError as e:
                    logger.warning(f"Failed to read {md_file}: {e}")

        self._context["_machine_state"] = read_state(self.state_path)
        # Project profile (declared, never inferred). A missing profile means "unknown": every rule applies.
        profile = load_profile(self.agent_dir / "PROFILE.json")
        self._context["profile"] = profile
        rules_dir = self.agent_dir.parent / "rules"
        if rules_dir.is_dir():
            self._context["applicable_rules"] = [str(p.relative_to(rules_dir.parent)) for p in applicable_rule_files(rules_dir, profile)]
        logger.info(f"✅ Context loaded ({len(self._context)} sections)")
        return self._context

    def retrieve_memory(
        self, query: str = "", embedding: Optional[list] = None, allow_semantic: bool = False
    ) -> Optional[str]:
        """
        Phase 3: memory lookup.
        - Exact cache hit on the normalised query text (safe for decisions) when a query is given.
        - Semantic cache (most similar earlier answer) ONLY when the caller opts in with allow_semantic=True: a near-duplicate question can
          have a different right answer.
        - Long-term lessons (pgvector) when an embedding is given. Returns None gracefully if nothing is available.
        """
        self.state.advance_phase("retrieve_memory")

        if self._cache and query:
            exact = self._cache.get_exact(query)
            if exact:
                logger.info("✅ Memory retrieved from exact cache")
                return exact

        if embedding is None:
            logger.debug("No embedding provided, skipping semantic/long-term retrieval")
            return None

        if self._cache and allow_semantic:
            cached = self._cache.get(embedding, allow_semantic=True)
            if cached:
                logger.info("✅ Memory retrieved from semantic cache")
                return cached

        if self._ltm:
            results = self._ltm.search_lessons(embedding, limit=1)
            if results:
                logger.info("✅ Memory retrieved from long-term storage")
                return results[0][0]

        logger.debug("No relevant memory found")
        return None

    def ask_decisions(self, state: Any, names: Optional[list] = None) -> dict:
        """
        Optional phase 3b: ask the configured decision backend the closed questions of .agent/decisions.json about `state` and expose the
        probabilities to the heuristics as context["decisions"] (rules use gte/lte on them). With no backend configured, or if it fails, the
        framework behaves exactly as before: context["decisions"] = {"available": False, "reason": ...} and the failure is LOGGED, not hidden.
        Returns the validated answers ({} when unavailable). The action is never chosen by the model: see agent.decisions.decide().
        """
        self.state.advance_phase("ask_decisions")
        cat = self.agent_dir / "decisions.json"
        try:
            backend = decisions_mod.backend_from_env()
            if backend is None or not cat.exists():
                self._context["decisions"] = {"available": False, "reason": "no backend configured" if backend is None else "no decisions.json"}
                return {}
            questions, thresholds = decisions_mod.load_catalogue(cat)
            layer = decisions_mod.DecisionLayer(questions, thresholds, backend)
            answers = layer.ask(state, names)
        except (decisions_mod.DecisionError, OSError, ValueError, KeyError) as e:
            logger.error("Typed decisions unavailable: %s", e, exc_info=True)
            self._context["decisions"] = {"available": False, "reason": str(e)}
            return {}
        self._context["decisions"] = {"available": True, "calibrated": backend.calibrated, **layer.facts(answers)}
        self._decision_layer = layer
        return answers

    def apply_heuristics(self, context: dict[str, Any]) -> list[str]:
        """
        Phase 4: Evaluate heuristic rules against context.
        Returns ordered list of applicable action strings.
        """
        self.state.advance_phase("apply_heuristics")

        if not self._engine:
            logger.warning("Heuristics engine not initialized, returning empty")
            return []

        actions = self._engine.evaluate(context)
        logger.info(f"✅ Heuristics evaluated: {actions}")
        return actions

    def ensure_spec(self, spec_id: str) -> None:
        """
        Phase 5: the spec contract gate. Raises SpecMissingError if no spec has EXACTLY this id in SPECS.md, and SpecNotApprovedError if
        that spec's own status is not APROBADO (agent/specs.py explains why the old substring check was not a control).
        """
        self.state.advance_phase("ensure_spec")
        logger.info("🔍 Ensuring spec %s exists and is approved", spec_id)

        specs = parse_specs(self._context.get("SPECS", ""))
        spec = specs.get(spec_id)
        if spec is None:
            raise SpecMissingError(f"Spec {spec_id} not found in SPECS.md. Define it before implementing.")
        if spec["status"] != APPROVED:
            raise SpecNotApprovedError(f"Spec {spec_id} has status {spec['status']!r}, not {APPROVED!r}: it is not a contract yet.")

        logger.info("✅ Spec %s verified", spec_id)

    def plan_tasks(
        self, skills: list[Skill], inputs: list[dict]
    ) -> list[tuple[Skill, dict]]:
        """
        Phase 6: Validate skill inputs against their schemas.
        Returns validated queue of (Skill, raw_input) tuples.
        """
        self.state.advance_phase("plan_tasks")
        logger.info(f"📋 Planning {len(skills)} tasks")

        queue = []
        for skill, raw_input in zip(skills, inputs):
            try:
                skill.input_schema.model_validate(raw_input)
                queue.append((skill, raw_input))
                logger.debug(f"✅ Task {skill.name} validated")
            except Exception as e:
                raise SchemaValidationError(
                    f"Failed to validate input for {skill.name}: {e}"
                ) from e

        logger.info(f"✅ {len(queue)} tasks planned and validated")
        return queue

    def execute(self, skill: Skill, input_data: dict) -> dict:
        """
        Phase 7: Execute a skill with retry tracking.
        On ECCLimitError, records error and re-raises.
        On other exceptions, increments retry and re-raises if within limit.
        """
        self.state.advance_phase("execute")
        self.state.current_skill = skill.name

        logger.info(f"⚙️  Executing skill: {skill.name}")

        try:
            result = skill.run(input_data)
            usage = result.get("_usage") if isinstance(result, dict) else None     # optional: a skill that called a model reports it here
            if usage:
                self.state.record_usage(skill.name, usage.get("tokens_in", 0), usage.get("tokens_out", 0), usage.get("usd", 0.0))
            self.state.completed_skills.append(skill.name)
            logger.info(f"✅ Skill {skill.name} succeeded")
            return result
        except ECCLimitError as e:
            self.state.record_error(skill.name, str(e), "execute")
            logger.error(f"❌ Skill {skill.name} exceeded ECC limit")
            raise
        except Exception as e:
            retry_count = self.state.increment_retry(skill.name)
            self.state.record_error(skill.name, str(e), "execute")
            logger.warning(
                f"Skill {skill.name} failed (attempt {retry_count}/{MAX_RETRIES}): {e}"
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
        self.state.advance_phase("verify")
        logger.info(f"✔️  Verifying output for {skill.name}")

        try:
            skill.output_schema.model_validate(output)
            logger.info(f"✅ Output verified for {skill.name}")
            return True
        except Exception as e:
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
        Phase 9: Store lesson/knowledge to long-term memory (pgvector). `evidence_level`: CIERTO (reproduced), PROBABLE (inferred, not run) or
        HIPOTESIS (default: nobody has verified it).
        Gracefully skips if LTM unavailable.
        """
        self.state.advance_phase("store_memory")
        logger.info(f"💾 Storing memory: {memory_type}")

        if not self._ltm:
            logger.warning("PostgreSQL unavailable, memory not persisted")
            return

        if embedding is None:
            # Never invent a vector: a made-up one would be searched as if it meant something (the old code stored 1536 zeros).
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
            )
            logger.info(f"✅ Memory persisted")
        except Exception as e:
            logger.error(f"Failed to store memory: {e}")
            raise AgentMemoryError(f"Memory storage failed: {e}") from e

    def update_state(self, summary: Optional[dict] = None) -> None:
        """
        Phase 10: Persist session state to STATE.md.
        Merges summary dict into the saved state.
        """
        self.state.advance_phase("update_state")
        logger.info("📝 Updating session state")

        state_data = self.state.to_dict()
        if summary:
            state_data["summary"] = summary

        try:
            write_state(self.state_path, state_data)
            logger.info("✅ State persisted to STATE.md")
        except Exception as e:
            logger.error(f"Failed to update state: {e}")
            raise

    def close(self) -> None:
        """Close all connections and clean up resources."""
        logger.info("🔌 Closing agent loop")
        if self._ltm:
            try:
                self._ltm.close()
                logger.info("✅ PostgreSQL connection pool closed")
            except Exception as e:
                logger.error(f"Error closing PostgreSQL pool: {e}")

        logger.info("✅ Agent loop closed")
