#!/usr/bin/env python3
"""Evaluate Resident Agent OS telemetry against written alert thresholds (rules/common/observability.md §9).

Usage:
    python scripts/check_thresholds.py [--agent-dir .agent] [--events path.jsonl] [--thresholds path.json] [--json]

Exit codes:
    0 = all configured signals are within thresholds (or SIN_DATOS unless --require-data)
    1 = at least one signal breached its written threshold (usable in cron / CI)
    2 = invalid arguments or --require-data with zero telemetry events
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from agent.telemetry import (  # noqa: E402
    DEFAULT_TELEMETRY_REL,
    DEFAULT_THRESHOLDS_REL,
    evaluate_thresholds,
    load_thresholds,
    read_events,
    summarize_events,
)


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--agent-dir", default=".agent", help="Path to .agent directory")
    ap.add_argument("--events", default=None, help="Explicit path to telemetry JSONL file")
    ap.add_argument("--thresholds", default=None, help="Explicit path to thresholds JSON file")
    ap.add_argument("--limit", type=int, default=None, help="Only evaluate the last N events")
    ap.add_argument("--require-data", action="store_true", help="Exit 2 when no events have been recorded yet")
    ap.add_argument("--json", action="store_true", help="Emit machine-readable JSON report")
    args = ap.parse_args(argv)

    agent_dir = Path(args.agent_dir).resolve()
    events_path = Path(args.events).resolve() if args.events else (agent_dir / DEFAULT_TELEMETRY_REL)
    thresholds_path = Path(args.thresholds).resolve() if args.thresholds else (agent_dir / DEFAULT_THRESHOLDS_REL)

    events = read_events(events_path, limit=args.limit)
    thresholds = load_thresholds(thresholds_path)
    summary = summarize_events(events)
    evaluation = evaluate_thresholds(summary, thresholds)

    report = {
        "events_path": str(events_path),
        "thresholds_path": str(thresholds_path),
        "summary": summary,
        "evaluation": evaluation,
    }

    if args.json:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        print(f"Estado global: {evaluation['status']} ({summary['measured_runs']} ejecuciones medidas, {summary['total_events']} eventos)")
        for name, item in evaluation["checks"].items():
            print(f"  {item['status']:<15} {name:<20} medido={item['measured']}  umbral={item['threshold']}")
        if summary["chars_saved_by_hooks"]:
            print(
                f"  Ahorro hooks: {summary['chars_saved_by_hooks']} chars "
                f"(~{summary['tokens_saved_by_hooks_est']} tokens estimados)"
            )
        for breach in evaluation["breaches"]:
            print(f"  ALERTA: {breach}", file=sys.stderr)

    if evaluation["breaches"]:
        return 1
    if args.require_data and summary["measured_runs"] == 0:
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
