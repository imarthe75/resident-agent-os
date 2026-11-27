"""Provider-agnostic deterministic model routing for subagents and tasks.

Reads `.agent/model-routing.json` (project-local first, falling back to framework default)
and resolves the recommended semantic tier (`fast`, `balanced`, `reasoning`) and concrete
model identifier for any supported AI host/provider (Claude Code, Antigravity, Gemini CLI,
Codex, Cursor, Copilot, OpenCode, Ollama, or generic).
"""

from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from typing import Any, Optional

logger = logging.getLogger(__name__)

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_ROUTING_REL = Path(".agent") / "model-routing.json"
TIER_RANK = {"fast": 0, "balanced": 1, "reasoning": 2}


def find_routing_config(repo_root: Optional[Path] = None, config_path: Optional[Path] = None) -> Path:
    """Locate `.agent/model-routing.json`: explicit path -> project repo -> framework default."""
    if config_path is not None:
        cfg = Path(config_path).resolve()
        if not cfg.is_file():
            raise FileNotFoundError(f"Model routing config not found: {cfg}")
        return cfg

    if repo_root is not None:
        local = Path(repo_root).resolve() / DEFAULT_ROUTING_REL
        if local.is_file():
            return local

    fallback = ROOT / DEFAULT_ROUTING_REL
    if fallback.is_file():
        return fallback
    raise FileNotFoundError(f"Default model routing config not found: {fallback}")


def load_routing_config(
    repo_root: Optional[Path] = None,
    config_path: Optional[Path] = None,
) -> tuple[dict[str, Any], Path]:
    """Load and validate `.agent/model-routing.json`."""
    path = find_routing_config(repo_root=repo_root, config_path=config_path)
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        logger.error("Failed to read model routing config %s: %s", path, exc, exc_info=True)
        raise ValueError(f"Invalid model routing config {path}: {exc}") from exc

    if not isinstance(data, dict) or not isinstance(data.get("tiers"), dict) or not data["tiers"]:
        raise ValueError(f"Model routing config {path} must define a non-empty 'tiers' object")
    return data, path


def _tier_rank(tier: str) -> int:
    return TIER_RANK.get(tier, 1)


def _apply_env_overrides(tier: str, provider_map: dict[str, str]) -> tuple[dict[str, str], list[str]]:
    """Apply optional `ROS_MODEL_<TIER>` or `ROS_MODEL_<PROVIDER>_<TIER>` env overrides."""
    resolved = dict(provider_map)
    applied: list[str] = []
    tier_upper = tier.upper()

    global_var = f"ROS_MODEL_{tier_upper}"
    global_val = os.getenv(global_var)
    if global_val:
        for prov in list(resolved):
            resolved[prov] = global_val
        applied.append(global_var)

    for prov in list(resolved):
        prov_var = f"ROS_MODEL_{prov.upper()}_{tier_upper}"
        prov_val = os.getenv(prov_var)
        if prov_val:
            resolved[prov] = prov_val
            applied.append(prov_var)

    return resolved, applied


def resolve_model(
    *,
    agent_name: Optional[str] = None,
    task: Optional[str] = None,
    tier: Optional[str] = None,
    provider: str = "all",
    repo_root: Optional[Path] = None,
    config_path: Optional[Path] = None,
) -> dict[str, Any]:
    """Deterministically resolve semantic tier and concrete model(s) for an agent/task/provider.

    Resolution precedence:
    1. Explicit `tier` override (must exist in config `tiers`).
    2. Higher semantic tier between `agents[agent_name].tier` and `tasks[task]` so a task
       requiring deeper judgment promotes a fast agent (e.g. `general-purpose` + `business-logic`
       -> `balanced`) without accidentally downgrading a reasoning reviewer.
    3. Config `default_tier` (fallback: `balanced`).
    """
    cfg, path = load_routing_config(repo_root=repo_root, config_path=config_path)
    tiers_cfg: dict[str, Any] = cfg["tiers"]
    agents_cfg: dict[str, Any] = cfg.get("agents") or {}
    tasks_cfg: dict[str, str] = cfg.get("tasks") or {}
    default_tier = str(cfg.get("default_tier") or "balanced")

    norm_agent = agent_name.strip().lower() if agent_name else None
    norm_task = task.strip().lower() if task else None
    norm_provider = (provider or "all").strip().lower()

    agent_entry = agents_cfg.get(norm_agent) if norm_agent else None
    agent_tier = agent_entry.get("tier") if isinstance(agent_entry, dict) else None
    task_tier = tasks_cfg.get(norm_task) if norm_task else None

    if tier is not None:
        chosen_tier = tier.strip().lower()
        if chosen_tier not in tiers_cfg:
            raise ValueError(f"Unknown tier '{tier}' (valid: {', '.join(sorted(tiers_cfg))})")
        selection_source = "explicit_tier"
    elif agent_tier and task_tier:
        if _tier_rank(task_tier) > _tier_rank(agent_tier):
            chosen_tier = task_tier
            selection_source = "task_promotion"
        else:
            chosen_tier = agent_tier
            selection_source = "agent_default"
    elif agent_tier:
        chosen_tier = agent_tier
        selection_source = "agent_default"
    elif task_tier:
        chosen_tier = task_tier
        selection_source = "task_default"
    else:
        chosen_tier = default_tier
        selection_source = "config_default"

    if chosen_tier not in tiers_cfg:
        raise ValueError(f"Resolved tier '{chosen_tier}' is not defined in {path}")

    tier_info = tiers_cfg[chosen_tier]
    raw_providers = tier_info.get("providers") or {}
    if not isinstance(raw_providers, dict) or not raw_providers:
        raise ValueError(f"Tier '{chosen_tier}' in {path} has no 'providers' mapping")

    models_by_provider, env_overrides = _apply_env_overrides(chosen_tier, {k.lower(): str(v) for k, v in raw_providers.items()})

    selected_model: Optional[str] = None
    if norm_provider != "all":
        if norm_provider not in models_by_provider:
            raise ValueError(
                f"Unknown provider '{provider}' (valid: {', '.join(sorted(models_by_provider))}, all)"
            )
        selected_model = models_by_provider[norm_provider]

    return {
        "tier": chosen_tier,
        "tier_description": tier_info.get("description", ""),
        "selection_source": selection_source,
        "agent": norm_agent,
        "task": norm_task,
        "provider": norm_provider,
        "model": selected_model,
        "models_by_provider": models_by_provider,
        "escalate_to": agent_entry.get("escalate_to") if isinstance(agent_entry, dict) else None,
        "reason": agent_entry.get("reason") if isinstance(agent_entry, dict) else None,
        "env_overrides": env_overrides,
        "config_path": str(path),
    }


def list_agent_routing(
    *,
    provider: str = "all",
    repo_root: Optional[Path] = None,
    config_path: Optional[Path] = None,
) -> dict[str, Any]:
    """Return resolved routing table for every configured subagent."""
    cfg, path = load_routing_config(repo_root=repo_root, config_path=config_path)
    agents_cfg: dict[str, Any] = cfg.get("agents") or {}
    rows = [
        resolve_model(agent_name=name, provider=provider, repo_root=repo_root, config_path=path)
        for name in sorted(agents_cfg)
    ]
    return {
        "provider": (provider or "all").strip().lower(),
        "config_path": str(path),
        "default_tier": cfg.get("default_tier", "balanced"),
        "agents": rows,
        "tasks": cfg.get("tasks") or {},
    }
