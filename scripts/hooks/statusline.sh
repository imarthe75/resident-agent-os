#!/usr/bin/env bash
# Compact terminal statusline for Resident Agent OS (Claude Code statusLine or any shell prompt).
# Reads .agent/telemetry/events.jsonl (or $ROS_TELEMETRY_PATH) without third-party dependencies.
set -euo pipefail

AGENT_DIR="${AGENT_DIR:-${ROS_PROJECT_DIR:-.}/.agent}"
TELEMETRY_FILE="${ROS_TELEMETRY_PATH:-$AGENT_DIR/telemetry/events.jsonl}"
PROJECT_ID="${ROS_PROJECT_ID:-$(basename "$(cd "$(dirname "$AGENT_DIR")" 2>/dev/null && pwd || pwd)")}"
AGENT_HOST="${ROS_AGENT_HOST:-generic}"

PYTHON_BIN="python3"
if ! command -v "$PYTHON_BIN" >/dev/null 2>&1; then
  if command -v python >/dev/null 2>&1; then
    PYTHON_BIN="python"
  else
    echo "[ROS | $PROJECT_ID | $AGENT_HOST | python not found]"
    exit 0
  fi
fi

"$PYTHON_BIN" - "$TELEMETRY_FILE" "$PROJECT_ID" "$AGENT_HOST" <<'PY'
import json
import sys
from pathlib import Path

path = Path(sys.argv[1])
project_id = sys.argv[2]
agent_host = sys.argv[3]

events = 0
errors = 0
tokens_saved = 0
cost_usd = 0.0
last_phase = "idle"

if path.is_file():
    for raw in path.read_text(encoding="utf-8", errors="replace").splitlines()[-500:]:
        raw = raw.strip()
        if not raw:
            continue
        try:
            ev = json.loads(raw)
        except ValueError:
            continue
        if not isinstance(ev, dict):
            continue
        events += 1
        tokens_saved += int(ev.get("tokens_saved_est") or 0)
        cost_usd += float(ev.get("cost_usd") or 0.0)
        if ev.get("project_id"):
            project_id = str(ev["project_id"])
        if ev.get("agent_host"):
            agent_host = str(ev["agent_host"])
        if ev.get("phase"):
            last_phase = str(ev["phase"])
        if str(ev.get("outcome") or "").lower() in ("error", "failed", "syntax_error"):
            errors += 1

err_pct = (errors / events * 100.0) if events else 0.0
saved_fmt = f"{tokens_saved / 1000:.1f}k" if tokens_saved >= 1000 else str(tokens_saved)
print(f"[ROS | {project_id} | {agent_host} | phase:{last_phase} | saved:{saved_fmt} tok | err:{err_pct:.1f}% | ${cost_usd:.3f}]")
PY
