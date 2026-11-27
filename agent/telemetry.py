"""Structured JSON telemetry, production signals, and alert threshold evaluation for Resident Agent OS.

Implements `rules/common/observability.md` for the agent runtime itself:
- Structured JSON logs with ISO-8601 UTC timestamp, level, service, correlation/session id, and secret redaction.
- Append-only JSONL event stream (`.agent/telemetry/events.jsonl`) shared with hooks and resident-ui.
- Four production signals computed from real events: latency (avg & p95), cost (total & per run), error rate,
  and abstention rate, plus hook token savings and ordered pipeline phase trace.
- Explicit written thresholds (`.agent/thresholds.json`); signals without a written threshold are honestly
  reported as `NO_MONITOREADA`.
"""

from __future__ import annotations

import json
import logging
import math
import os
import re
import sys
import uuid

from agent.version import __version__
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable, Optional

SERVICE_NAME = "resident-agent-os"
DEFAULT_TELEMETRY_REL = Path("telemetry") / "events.jsonl"
DEFAULT_THRESHOLDS_REL = Path("thresholds.json")
LOOP_PHASES = (
    "boot",
    "load_context",
    "retrieve_memory",
    "ask_decisions",
    "apply_heuristics",
    "ensure_spec",
    "plan_tasks",
    "execute",
    "verify",
    "store_memory",
    "update_state",
)

_SENSITIVE_KEY_RE = re.compile(
    r"(password|passwd|secret|token|api[_-]?key|authorization|cookie|private[_-]?key|dsn)",
    re.IGNORECASE,
)
_SENSITIVE_VAL_RE = re.compile(
    r"(?i)(bearer\s+[A-Za-z0-9._\-]{12,}|(?:sk|ghp|glpat|xoxb)-[A-Za-z0-9_\-]{12,}|postgres(?:ql)?://[^:\s]+:[^@\s]+@)"
)

logger = logging.getLogger(__name__)


def redact(value: Any, key_hint: str = "") -> Any:
    """Recursively redact sensitive keys and credential-like substrings before writing logs/events."""
    if key_hint and _SENSITIVE_KEY_RE.search(key_hint):
        return "[REDACTED]"
    if isinstance(value, dict):
        return {str(k): redact(v, str(k)) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [redact(v) for v in value]
    if isinstance(value, str):
        return _SENSITIVE_VAL_RE.sub("[REDACTED]", value)
    return value


class JsonFormatter(logging.Formatter):
    """Structured JSON log formatter compliant with rules/common/observability.md §3-§5."""

    def __init__(self, service: str = SERVICE_NAME) -> None:
        super().__init__()
        self.service = service

    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "timestamp": datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat(),
            "level": record.levelname,
            "service": self.service,
            "logger": record.name,
            "correlation_id": getattr(record, "correlation_id", None) or getattr(record, "session_id", None) or "-",
            "message": redact(record.getMessage()),
        }
        for attr in ("session_id", "phase", "skill", "event", "outcome", "duration_ms", "cost_usd"):
            val = getattr(record, attr, None)
            if val is not None:
                payload[attr] = redact(val, attr)
        if record.exc_info and record.exc_info[0] is not None:
            payload["exception"] = self.formatException(record.exc_info)
        return json.dumps(payload, ensure_ascii=False)


def configure_structured_logging(level: int = logging.INFO, service: str = SERVICE_NAME) -> logging.Logger:
    """Attach a JsonFormatter StreamHandler to the `agent` logger hierarchy if none is present."""
    root = logging.getLogger("agent")
    root.setLevel(level)
    if not any(isinstance(getattr(h, "formatter", None), JsonFormatter) for h in root.handlers):
        handler = logging.StreamHandler()
        handler.setFormatter(JsonFormatter(service=service))
        root.addHandler(handler)
    return root


class TelemetryWriter:
    """Append-only JSONL telemetry writer for agent loop phases, skills, and service health."""

    def __init__(
        self,
        path: Path | str,
        session_id: Optional[str] = None,
        correlation_id: Optional[str] = None,
        service: str = SERVICE_NAME,
        project_id: Optional[str] = None,
        agent_host: Optional[str] = None,
    ) -> None:
        env_path = os.getenv("ROS_TELEMETRY_PATH")
        self.path = Path(env_path) if env_path else Path(path)
        self.session_id = session_id or str(uuid.uuid4())
        self.correlation_id = correlation_id or os.getenv("X_REQUEST_ID") or self.session_id
        self.service = service
        self.project_id = project_id or os.getenv("ROS_PROJECT_ID") or self.path.resolve().parents[2].name if len(self.path.resolve().parents) >= 3 else "default"
        self.agent_host = agent_host or os.getenv("ROS_AGENT_HOST") or "generic"

    def emit(
        self,
        event: str,
        *,
        phase: Optional[str] = None,
        skill: Optional[str] = None,
        outcome: str = "ok",
        duration_ms: Optional[float] = None,
        tokens_in: int = 0,
        tokens_out: int = 0,
        cost_usd: float = 0.0,
        retries: int = 0,
        chars_saved: int = 0,
        tokens_saved_est: int = 0,
        level: str = "INFO",
        detail: Optional[dict[str, Any]] = None,
        source: str = "loop",
    ) -> dict[str, Any]:
        """Build, redact, and append a single JSONL telemetry record. Returns the written record."""
        record: dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "service": self.service,
            "project_id": self.project_id,
            "agent_host": self.agent_host,
            "source": source,
            "level": level.upper(),
            "session_id": self.session_id,
            "correlation_id": self.correlation_id,
            "event": event,
            "phase": phase,
            "skill": skill,
            "outcome": outcome,
            "duration_ms": round(float(duration_ms), 3) if duration_ms is not None else None,
            "tokens_in": int(tokens_in),
            "tokens_out": int(tokens_out),
            "cost_usd": round(float(cost_usd), 6),
            "retries": int(retries),
            "chars_saved": int(chars_saved),
            "tokens_saved_est": int(tokens_saved_est),
        }
        if detail:
            record["detail"] = redact(detail)

        if os.getenv("ROS_TELEMETRY_DISABLED") == "1":
            return record

        # Prevent unit tests that point ResidentAgentLoop at the repo's own .agent/ from polluting local telemetry.
        repo_default_telemetry = (Path(__file__).resolve().parents[1] / ".agent" / DEFAULT_TELEMETRY_REL).resolve()
        in_pytest = bool(os.getenv("PYTEST_CURRENT_TEST") or "pytest" in sys.modules)
        if in_pytest and not os.getenv("ROS_TELEMETRY_PATH") and self.path.resolve() == repo_default_telemetry:
            return record

        try:
            self.path.parent.mkdir(parents=True, exist_ok=True)
            line = json.dumps(record, ensure_ascii=False) + "\n"
            with open(self.path, "a", encoding="utf-8") as fh:
                fh.write(line)
        except OSError as e:
            logger.error("Failed to append telemetry event to %s: %s", self.path, e, exc_info=True)

        otlp_endpoint = os.getenv("ROS_OTLP_ENDPOINT", "").strip()
        if otlp_endpoint:
            export_event_otlp(record, endpoint=otlp_endpoint)
        return record


def build_otlp_log_payload(record: dict[str, Any]) -> dict[str, Any]:
    """Build an OTLP/HTTP JSON (`resourceLogs`) payload from a single redacted telemetry event."""
    now_ns = str(int(datetime.now(timezone.utc).timestamp() * 1_000_000_000))
    attributes = [
        {"key": k, "value": {"stringValue": str(record[k])}}
        for k in ("project_id", "agent_host", "source", "session_id", "correlation_id", "event", "phase", "outcome")
        if record.get(k) is not None
    ]
    for num_key in ("duration_ms", "cost_usd"):
        if record.get(num_key) is not None:
            attributes.append({"key": num_key, "value": {"doubleValue": float(record[num_key])}})
    for int_key in ("tokens_in", "tokens_out", "retries", "chars_saved", "tokens_saved_est"):
        if record.get(int_key):
            attributes.append({"key": int_key, "value": {"intValue": str(int(record[int_key]))}})

    return {
        "resourceLogs": [
            {
                "resource": {
                    "attributes": [
                        {"key": "service.name", "value": {"stringValue": str(record.get("service") or SERVICE_NAME)}},
                        {"key": "ros.project_id", "value": {"stringValue": str(record.get("project_id") or "default")}},
                    ]
                },
                "scopeLogs": [
                    {
                        "scope": {"name": "resident-agent-os.telemetry", "version": __version__},
                        "logRecords": [
                            {
                                "timeUnixNano": now_ns,
                                "severityText": str(record.get("level") or "INFO"),
                                "body": {"stringValue": str(record.get("event") or "telemetry_event")},
                                "attributes": attributes,
                            }
                        ],
                    }
                ],
            }
        ]
    }


def export_event_otlp(
    record: dict[str, Any],
    *,
    endpoint: Optional[str] = None,
    timeout: float = 1.5,
) -> bool:
    """Export a single redacted telemetry record to an OTLP/HTTP JSON endpoint (`ROS_OTLP_ENDPOINT`).

    Uses only Python stdlib (`urllib.request`). Returns True iff the endpoint responded with HTTP 2xx.
    """
    from urllib.error import URLError
    from urllib.parse import urlparse
    from urllib.request import Request, urlopen

    url = (endpoint or os.getenv("ROS_OTLP_ENDPOINT", "")).strip()
    if not url:
        return False
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        logger.error("Invalid ROS_OTLP_ENDPOINT '%s': only http:// or https:// URLs are allowed", url)
        return False

    body = json.dumps(build_otlp_log_payload(record), ensure_ascii=False).encode("utf-8")
    req = Request(url, data=body, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urlopen(req, timeout=timeout) as resp:  # nosec B310 - scheme validated above
            return 200 <= getattr(resp, "status", 0) < 300
    except (URLError, OSError, TimeoutError) as exc:
        logger.error("Failed to export OTLP telemetry event to %s: %s", url, exc, exc_info=True)
        return False


def read_events(path: Path | str, limit: Optional[int] = None) -> list[dict[str, Any]]:
    """Read JSONL telemetry events from `path`. Skips malformed lines with a logged warning."""
    p = Path(path)
    if not p.is_file():
        return []
    events: list[dict[str, Any]] = []
    try:
        lines = p.read_text(encoding="utf-8", errors="replace").splitlines()
    except OSError as e:
        logger.error("Failed to read telemetry file %s: %s", p, e, exc_info=True)
        return []
    if limit is not None and limit > 0:
        lines = lines[-limit:]
    for idx, raw in enumerate(lines, start=1):
        s = raw.strip()
        if not s:
            continue
        try:
            obj = json.loads(s)
            if isinstance(obj, dict):
                events.append(obj)
        except json.JSONDecodeError as e:
            logger.warning("Skipping malformed telemetry JSONL line %d in %s: %s", idx, p, e)
    return events


def percentile(values: list[float], p: float) -> Optional[float]:
    """Nearest-rank percentile (e.g. p=95 for p95). Returns None when empty."""
    if not values:
        return None
    ordered = sorted(values)
    rank = max(1, math.ceil((p / 100.0) * len(ordered)))
    return round(ordered[min(rank, len(ordered)) - 1], 3)


def build_phase_trace(events: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Derive the ordered pipeline phase status for the most recent session present in `events`."""
    if not events:
        return [{"step": ph, "status": "pending", "duration_ms": None, "outcome": None} for ph in LOOP_PHASES]

    latest_session = None
    for ev in reversed(events):
        if ev.get("source") == "loop" and ev.get("session_id"):
            latest_session = ev["session_id"]
            break

    session_events = [
        ev for ev in events if ev.get("source") == "loop" and (latest_session is None or ev.get("session_id") == latest_session)
    ]
    by_phase: dict[str, dict[str, Any]] = {}
    for ev in session_events:
        ph = ev.get("phase")
        if not ph:
            continue
        outcome = str(ev.get("outcome") or "ok")
        if outcome in ("error", "failed"):
            status = "failed"
        elif outcome == "running":
            status = "running"
        else:
            status = "done"
        by_phase[ph] = {
            "step": ph,
            "status": status,
            "duration_ms": ev.get("duration_ms"),
            "outcome": outcome,
            "timestamp": ev.get("timestamp"),
        }

    trace = []
    for ph in LOOP_PHASES:
        trace.append(by_phase.get(ph, {"step": ph, "status": "pending", "duration_ms": None, "outcome": None}))
    return trace


def summarize_events(events: Iterable[dict[str, Any]]) -> dict[str, Any]:
    """Compute the four production signals + hook efficiency metrics from real JSONL events."""
    ev_list = list(events)
    durations: list[float] = []
    measured_runs = 0
    error_runs = 0
    abstention_runs = 0
    tokens_in = 0
    tokens_out = 0
    cost_usd = 0.0
    chars_saved = 0
    tokens_saved_est = 0
    hook_events = 0
    sessions: set[str] = set()

    for ev in ev_list:
        sid = ev.get("session_id")
        if sid:
            sessions.add(str(sid))
        if ev.get("source") == "hook":
            hook_events += 1
        chars_saved += int(ev.get("chars_saved") or 0)
        tokens_saved_est += int(ev.get("tokens_saved_est") or 0)
        tokens_in += int(ev.get("tokens_in") or 0)
        tokens_out += int(ev.get("tokens_out") or 0)
        cost_usd += float(ev.get("cost_usd") or 0.0)

        # Health-check probes do not count toward request/run error rate or latency (observability.md §8).
        if ev.get("event") in ("health_check", "session_start", "session_end"):
            continue

        dur = ev.get("duration_ms")
        if isinstance(dur, (int, float)) and dur >= 0:
            durations.append(float(dur))

        outcome = str(ev.get("outcome") or "ok").lower()
        if ev.get("source") in ("loop", "hook"):
            measured_runs += 1
            if outcome in ("error", "failed", "syntax_error"):
                error_runs += 1
            elif outcome in ("abstention", "escalate_to_human", "no_information"):
                abstention_runs += 1

    latency_avg = round(sum(durations) / len(durations), 3) if durations else None
    latency_p95 = percentile(durations, 95.0)
    error_rate = round(error_runs / measured_runs, 4) if measured_runs else None
    abstention_rate = round(abstention_runs / measured_runs, 4) if measured_runs else None
    cost_per_run = round(cost_usd / measured_runs, 6) if measured_runs else None

    return {
        "total_events": len(ev_list),
        "sessions": len(sessions),
        "measured_runs": measured_runs,
        "hook_events": hook_events,
        "errors": error_runs,
        "error_rate": error_rate,
        "abstentions": abstention_runs,
        "abstention_rate": abstention_rate,
        "latency_avg_ms": latency_avg,
        "latency_p95_ms": latency_p95,
        "total_tokens_in": tokens_in,
        "total_tokens_out": tokens_out,
        "total_cost_usd": round(cost_usd, 6),
        "cost_per_run_usd": cost_per_run,
        "chars_saved_by_hooks": chars_saved,
        "tokens_saved_by_hooks_est": tokens_saved_est,
        "last_event_at": ev_list[-1].get("timestamp") if ev_list else None,
        "phase_trace": build_phase_trace(ev_list),
    }


def load_thresholds(path: Path | str) -> dict[str, float]:
    """Load written alert thresholds from `.agent/thresholds.json`. Returns {} if missing."""
    p = Path(path)
    if not p.is_file():
        return {}
    raw = json.loads(p.read_text(encoding="utf-8"))
    signals = raw.get("signals", raw) if isinstance(raw, dict) else {}
    out: dict[str, float] = {}
    for key, val in signals.items():
        if isinstance(val, (int, float)) and not isinstance(val, bool):
            out[str(key)] = float(val)
    return out


SIGNAL_KEYS = ("latency_p95_ms", "error_rate", "cost_per_run_usd", "abstention_rate")


def evaluate_thresholds(summary: dict[str, Any], thresholds: dict[str, float]) -> dict[str, Any]:
    """Compare measured signals against written thresholds.

    Per rules/common/observability.md §9:
    - A signal without a written threshold is declared `NO_MONITOREADA`.
    - A signal with a threshold but no measured samples is `SIN_DATOS`.
    - A signal above its written threshold is `ALERTA` (added to `breaches`).
    """
    checks: dict[str, dict[str, Any]] = {}
    breaches: list[str] = []

    for key in SIGNAL_KEYS:
        measured = summary.get(key)
        limit = thresholds.get(key)
        if limit is None:
            checks[key] = {"status": "NO_MONITOREADA", "measured": measured, "threshold": None}
            continue
        if measured is None:
            checks[key] = {"status": "SIN_DATOS", "measured": None, "threshold": limit}
            continue
        if float(measured) > float(limit):
            checks[key] = {"status": "ALERTA", "measured": measured, "threshold": limit}
            breaches.append(f"{key}={measured} supera umbral {limit}")
        else:
            checks[key] = {"status": "OK", "measured": measured, "threshold": limit}

    return {
        "status": "ALERTA" if breaches else ("SIN_DATOS" if summary.get("measured_runs", 0) == 0 else "OK"),
        "breaches": breaches,
        "checks": checks,
    }
