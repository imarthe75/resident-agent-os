#!/usr/bin/env python3
"""Multi-repo fleet monitor for Resident Agent OS.

Aggregates real measured status across repositories in one pass:
1. Framework version & drift (via `scripts/distribute_framework.py`)
2. Verifiers status (`verifiers/run.py`: CUMPLE / NO_CUMPLE / NO_EVALUADO)
3. Outdated dependencies count (optional `--with-deps`, via `scripts/outdated_dependencies.py`; `null` when skipped)
4. Agent telemetry signals, hook token savings, and written threshold alerts (`agent/telemetry.py`)

Usage:
    python scripts/fleet_status.py --parent /path/to/repos --out data/fleet-status.json
    python scripts/fleet_status.py --target /repo/a --target /repo/b --json --fail-on-drift --fail-on-breach
"""

from __future__ import annotations

import argparse
import importlib.util
import json
import os
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from agent.telemetry import (  # noqa: E402
    DEFAULT_TELEMETRY_REL,
    DEFAULT_THRESHOLDS_REL,
    evaluate_thresholds,
    load_thresholds,
    read_events,
    summarize_events,
)
from verifiers.checks import CUMPLE, NO_CUMPLE, NO_EVALUADO, REGISTRY  # noqa: E402

NETWORK_VERIFIERS = {"dependencies_current", "versions_current"}


def _load_script(name: str, rel_path: str):
    target = ROOT / rel_path
    if not target.is_file():
        return None
    spec = importlib.util.spec_from_file_location(name, target)
    if spec is None or spec.loader is None:
        return None
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def find_targets_fallback(parent: Path, source: Path) -> list[Path]:
    """Discover child git repositories under `parent` without requiring distribute_framework.py."""
    parent = Path(parent).resolve()
    source = Path(source).resolve()
    if not parent.is_dir():
        return []
    found: list[Path] = []
    for child in sorted(parent.iterdir()):
        if not child.is_dir() or child.resolve() == source:
            continue
        if (child / ".git").exists():
            found.append(child.resolve())
    return found


def inspect_repo(
    repo: Path,
    source: Path,
    dist_mod: Any,
    src_files: dict[str, str] | None,
    *,
    with_network: bool = False,
    with_deps: bool = False,
    outdated_mod: Any = None,
) -> dict[str, Any]:
    """Inspect a single repository and return real measured drift, verifiers, deps, and telemetry."""
    if dist_mod is not None and src_files is not None:
        drift_info = dist_mod.check_target(source, repo, src_files)
        drift_flag = bool(drift_info["drift"])
        drift_status = "DESVIADO" if drift_flag else "OK"
        drift_reason: str | None = None
        fw_ver, exp_ver = drift_info["version"][0], drift_info["version"][1]
        missing_paths = [str(p) for p in drift_info["missing"]][:30]
        modified_paths = [str(p) for p in drift_info["modified"]][:30]
        missing_n, modified_n = len(drift_info["missing"]), len(drift_info["modified"])
    else:
        drift_flag = False
        drift_status = NO_EVALUADO
        drift_reason = "scripts/distribute_framework.py no está presente en este proyecto"
        fw_ver, exp_ver = None, None
        missing_paths, modified_paths = [], []
        missing_n, modified_n = 0, 0

    selected = [name for name in REGISTRY if with_network or name not in NETWORK_VERIFIERS]
    v_results = [REGISTRY[name](repo) for name in selected]
    cumple = sum(1 for r in v_results if r.status == CUMPLE)
    no_cumple = sum(1 for r in v_results if r.status == NO_CUMPLE)
    no_evaluado = sum(1 for r in v_results if r.status == NO_EVALUADO)
    failed_names = [r.verifier for r in v_results if r.status == NO_CUMPLE]
    verifier_details = [
        {
            "verifier": r.verifier,
            "status": r.status,
            "method": r.method,
            "checked": r.checked,
            "detail": list(r.detail)[:25],
        }
        for r in v_results
    ]

    outdated_count: int | None = None
    outdated_details: list[dict[str, Any]] = []
    if with_deps and outdated_mod is not None:
        rows = outdated_mod.analyze(repo)
        flagged = [
            r for r in rows if not r.get("unresolved") and (r.get("deprecated") or r.get("lag") in ("major", "minor"))
        ]
        outdated_count = len(flagged)
        outdated_details = [
            {
                "file": r.get("file"),
                "name": r.get("name"),
                "current": r.get("current"),
                "target": r.get("target") or r.get("latest"),
                "lag": r.get("lag"),
                "deprecated": bool(r.get("deprecated")),
            }
            for r in flagged[:40]
        ]

    agent_dir = repo / ".agent"
    events = read_events(agent_dir / DEFAULT_TELEMETRY_REL)
    thresholds = load_thresholds(agent_dir / DEFAULT_THRESHOLDS_REL)
    summary = summarize_events(events)
    evaluation = evaluate_thresholds(summary, thresholds)

    return {
        "name": repo.name,
        "path": str(repo),
        "drift": drift_flag,
        "drift_status": drift_status,
        "drift_reason": drift_reason,
        "framework_version": fw_ver,
        "expected_version": exp_ver,
        "missing_files": missing_n,
        "modified_files": modified_n,
        "missing_paths": missing_paths,
        "modified_paths": modified_paths,
        "verifiers": {
            "cumple": cumple,
            "no_cumple": no_cumple,
            "no_evaluado": no_evaluado,
            "failed_names": failed_names,
            "results": verifier_details,
        },
        "outdated_dependencies": outdated_count,
        "outdated_details": outdated_details,
        "telemetry": {
            "total_events": summary["total_events"],
            "measured_runs": summary["measured_runs"],
            "errors": summary["errors"],
            "latency_p95_ms": summary["latency_p95_ms"],
            "total_cost_usd": summary["total_cost_usd"],
            "chars_saved_by_hooks": summary["chars_saved_by_hooks"],
            "tokens_saved_by_hooks_est": summary["tokens_saved_by_hooks_est"],
            "threshold_status": evaluation["status"],
            "breaches": evaluation["breaches"],
        },
    }


def build_fleet_report(
    source: Path,
    targets: list[Path],
    *,
    with_network: bool = False,
    with_deps: bool = False,
) -> dict[str, Any]:
    dist_mod = _load_script("distribute_framework_fleet", "scripts/distribute_framework.py")
    outdated_mod = _load_script("outdated_deps_fleet", "scripts/outdated_dependencies.py") if with_deps else None
    src_files = dist_mod.generic_files(source) if dist_mod is not None else None

    repos = [
        inspect_repo(
            t,
            source,
            dist_mod,
            src_files,
            with_network=with_network,
            with_deps=with_deps,
            outdated_mod=outdated_mod,
        )
        for t in targets
    ]

    totals = {
        "repos": len(repos),
        "drifted": sum(1 for r in repos if r["drift"]),
        "drift_not_evaluated": sum(1 for r in repos if r.get("drift_status") == NO_EVALUADO),
        "verifiers_cumple": sum(r["verifiers"]["cumple"] for r in repos),
        "verifiers_no_cumple": sum(r["verifiers"]["no_cumple"] for r in repos),
        "threshold_alerts": sum(1 for r in repos if r["telemetry"]["threshold_status"] == "ALERTA"),
        "total_events": sum(r["telemetry"]["total_events"] for r in repos),
        "total_cost_usd": round(sum(r["telemetry"]["total_cost_usd"] for r in repos), 6),
        "tokens_saved_by_hooks_est": sum(r["telemetry"]["tokens_saved_by_hooks_est"] for r in repos),
    }

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source": str(source),
        "drift_available": dist_mod is not None,
        "network_checks_enabled": with_network,
        "deps_checks_enabled": with_deps,
        "totals": totals,
        "repos": repos,
    }


def write_json_atomic(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=path.parent, suffix=".tmp", text=True)
    try:
        os.write(fd, (json.dumps(payload, ensure_ascii=False, indent=2) + "\n").encode("utf-8"))
        os.close(fd)
        fd = -1
        os.replace(tmp, path)
    except Exception:
        if fd >= 0:
            os.close(fd)
        if os.path.exists(tmp):
            os.unlink(tmp)
        raise


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--source", default=os.getenv("FRAMEWORK_SOURCE", str(ROOT)))
    ap.add_argument("--parent", default=os.getenv("FRAMEWORK_TARGET_PARENT"))
    ap.add_argument("--target", action="append", default=[])
    ap.add_argument("--out", default=None, help="Write JSON report atomically to this path (e.g. data/fleet-status.json)")
    ap.add_argument("--with-network", action="store_true", help="Include network verifiers (versions_current, dependencies_current)")
    ap.add_argument("--with-deps", action="store_true", help="Query registries for outdated_dependencies count per repo")
    ap.add_argument("--fail-on-drift", action="store_true", help="Exit 1 if any repository drifted from framework source")
    ap.add_argument("--fail-on-verifier", action="store_true", help="Exit 1 if any verifier returned NO_CUMPLE")
    ap.add_argument("--fail-on-breach", action="store_true", help="Exit 1 if any repo breached its telemetry thresholds")
    ap.add_argument("--json", action="store_true", help="Print JSON report to stdout")
    args = ap.parse_args(argv)

    source = Path(args.source).resolve()
    dist_mod = _load_script("distribute_framework_cli", "scripts/distribute_framework.py")
    targets = [Path(t).resolve() for t in args.target]
    if args.parent:
        if dist_mod is not None:
            targets += dist_mod.find_targets(Path(args.parent).resolve(), source)
        else:
            targets += find_targets_fallback(Path(args.parent).resolve(), source)
    if not targets:
        print("Nada que escanear: indica --parent o --target (o FRAMEWORK_TARGET_PARENT).", file=sys.stderr)
        return 2

    report = build_fleet_report(source, targets, with_network=args.with_network, with_deps=args.with_deps)
    if args.out:
        write_json_atomic(Path(args.out).resolve(), report)

    if args.json:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        t = report["totals"]
        print(
            f"Flota: {t['repos']} repo(s) | deriva: {t['drifted']} | "
            f"verifiers NO_CUMPLE: {t['verifiers_no_cumple']} | alertas umbral: {t['threshold_alerts']} | "
            f"ahorro hooks: ~{t['tokens_saved_by_hooks_est']} tokens"
        )
        for r in report["repos"]:
            drift_s = "N/E" if r.get("drift_status") == NO_EVALUADO else ("DESVIADO" if r["drift"] else "al día")
            v = r["verifiers"]
            tel = r["telemetry"]
            print(
                f"  - {r['name']:<24} {drift_s:<9} "
                f"verifiers={v['cumple']}ok/{v['no_cumple']}fail/{v['no_evaluado']}ne  "
                f"umbrales={tel['threshold_status']} ({tel['total_events']} ev, ${tel['total_cost_usd']})"
            )

    failed = (
        (args.fail_on_drift and report["totals"]["drifted"] > 0)
        or (args.fail_on_verifier and report["totals"]["verifiers_no_cumple"] > 0)
        or (args.fail_on_breach and report["totals"]["threshold_alerts"] > 0)
    )
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
