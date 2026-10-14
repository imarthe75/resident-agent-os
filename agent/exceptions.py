"""Custom exception hierarchy for the Resident Agent OS."""


class ResidentAgentError(Exception):
    """Base exception; catch-all for the entire framework."""

    pass


class ServiceUnavailableError(ResidentAgentError):
    """Raised when Valkey or PostgreSQL cannot be reached during boot or operation."""

    pass


class ECCLimitError(ResidentAgentError):
    """
    Raised when a skill exceeds the ECC retry limit (3 attempts).
    The loop must halt and reflect — never re-queue the same skill immediately.
    """

    pass


class SpecMissingError(ResidentAgentError):
    """Raised when no approved spec contract is found for a requested code change."""

    pass


class SpecNotApprovedError(SpecMissingError):
    """The spec exists but its own status is not APROBADO (borrador, rechazado...): it is not a contract yet."""

    pass


class SchemaValidationError(ResidentAgentError):
    """Raised when Pydantic input or output validation fails for a Skill."""

    pass


class StateParseError(ResidentAgentError):
    """Raised when the ```json block in STATE.md cannot be parsed."""

    pass


class HeuristicRuleError(ResidentAgentError):
    """Raised when heuristics.json is malformed or a condition type is unknown."""

    pass


class AgentMemoryError(ResidentAgentError):
    """Raised on memory read/write failures (psycopg2 or redis errors)."""

    pass
