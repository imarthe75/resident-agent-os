"""Agent cognitive state machine and session tracking."""

from __future__ import annotations

import uuid
import warnings
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Annotated, Optional, Sequence, TypedDict, operator


class AgentCognitiveState(TypedDict):
    """
    Legacy TypedDict for backwards compatibility.
    Use LoopState dataclass for new code.
    """

    messages: Annotated[Sequence[dict], operator.add]
    next_step: str
    long_term_context: list
    plan: list


@dataclass
class LoopState:
    """Single source of truth for the loop's state machine and session tracking."""

    session_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    current_phase: str = "boot"
    current_skill: Optional[str] = None
    retry_counts: dict[str, int] = field(default_factory=dict)
    errors: list[dict] = field(default_factory=list)
    completed_skills: list[str] = field(default_factory=list)
    context_token_estimate: int = 0
    started_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )

    def increment_retry(self, skill_name: str) -> int:
        """Increment retry counter for a skill; returns new count."""
        self.retry_counts[skill_name] = self.retry_counts.get(skill_name, 0) + 1
        self._touch()
        return self.retry_counts[skill_name]

    def get_retry(self, skill_name: str) -> int:
        """Get current retry count for a skill."""
        return self.retry_counts.get(skill_name, 0)

    def advance_phase(self, phase: str) -> None:
        """Advance to the next phase in the loop."""
        self.current_phase = phase
        self._touch()

    def record_error(self, skill: str, error: str, phase: str) -> None:
        """Record an error event in the session."""
        self.errors.append(
            {
                "skill": skill,
                "error": error,
                "phase": phase,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        )
        self._touch()

    def _touch(self) -> None:
        """Update the modified timestamp."""
        self.updated_at = datetime.now(timezone.utc).isoformat()

    def to_dict(self) -> dict:
        """Serialize state to dict for JSON serialization."""
        return {
            "session_id": self.session_id,
            "current_phase": self.current_phase,
            "current_skill": self.current_skill,
            "retry_counts": self.retry_counts,
            "errors": self.errors,
            "completed_skills": self.completed_skills,
            "context_token_estimate": self.context_token_estimate,
            "started_at": self.started_at,
            "updated_at": self.updated_at,
        }

    @classmethod
    def from_dict(cls, data: dict) -> LoopState:
        """Deserialize state from dict."""
        obj = cls.__new__(cls)
        obj.session_id = data.get("session_id", str(uuid.uuid4()))
        obj.current_phase = data.get("current_phase", "boot")
        obj.current_skill = data.get("current_skill")
        obj.retry_counts = data.get("retry_counts", {})
        obj.errors = data.get("errors", [])
        obj.completed_skills = data.get("completed_skills", [])
        obj.context_token_estimate = data.get("context_token_estimate", 0)
        obj.started_at = data.get(
            "started_at", datetime.now(timezone.utc).isoformat()
        )
        obj.updated_at = data.get(
            "updated_at", datetime.now(timezone.utc).isoformat()
        )
        return obj


class ResidentAgentGraph:
    """
    Legacy stub for backwards compatibility.
    LangGraph dependency removed in favour of LoopState state machine.
    """

    def __init__(self) -> None:
        warnings.warn(
            "ResidentAgentGraph is deprecated. Use LoopState and ResidentAgentLoop instead.",
            DeprecationWarning,
            stacklevel=2,
        )

    def run_step(self, state: AgentCognitiveState) -> AgentCognitiveState:
        raise NotImplementedError(
            "Use ResidentAgentLoop.boot() and subsequent phase methods instead."
        )
