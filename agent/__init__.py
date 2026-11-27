"""Resident Agent OS: Core loop, heuristics, and skill framework.

Optional third-party-dependent exports (`ResidentAgentLoop`, `Skill`) are resolved
lazily via PEP 562 `__getattr__` so pure-stdlib CLI and MCP entrypoints
(`python3 -m agent route|sync-hosts|doctor|init-host|mcp`) run without requiring
`pydantic` or database drivers installed on the host.
"""

from __future__ import annotations

from typing import Any

from agent.exceptions import (
    AgentMemoryError,
    ECCLimitError,
    HeuristicRuleError,
    ResidentAgentError,
    SchemaValidationError,
    ServiceUnavailableError,
    SpecMissingError,
    SpecNotApprovedError,
    StateParseError,
)
from agent.heuristic_engine import HeuristicEngine
from agent.model_routing import list_agent_routing, resolve_model
from agent.state_parser import read_state, write_state
from agent.telemetry import (
    JsonFormatter,
    TelemetryWriter,
    configure_structured_logging,
    evaluate_thresholds,
    load_thresholds,
    read_events,
    redact,
    summarize_events,
)

__all__ = [
    "ResidentAgentError",
    "ServiceUnavailableError",
    "ECCLimitError",
    "SpecMissingError",
    "SpecNotApprovedError",
    "SchemaValidationError",
    "StateParseError",
    "HeuristicRuleError",
    "AgentMemoryError",
    "HeuristicEngine",
    "ResidentAgentLoop",
    "Skill",
    "list_agent_routing",
    "resolve_model",
    "read_state",
    "write_state",
    "JsonFormatter",
    "TelemetryWriter",
    "configure_structured_logging",
    "evaluate_thresholds",
    "load_thresholds",
    "read_events",
    "redact",
    "summarize_events",
]


def __getattr__(name: str) -> Any:
    if name == "ResidentAgentLoop":
        from agent.loop import ResidentAgentLoop

        return ResidentAgentLoop
    if name == "Skill":
        from agent.skill_base import Skill

        return Skill
    raise AttributeError(f"module 'agent' has no attribute {name!r}")
