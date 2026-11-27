#!/usr/bin/env python3
"""Deterministic token-savings benchmark for Resident Agent OS command filters and output compression.

Exercises `scripts/hooks/command-filters.js` on representative realistic CLI outputs (`pytest`,
`git status`, `npm install`, `mvn test`, `rg`) and verifies:
  1. Zero loss of critical failure/error/summary markers.
  2. Measurable character and estimated token savings (chars / 4).

Usage:
  python3 scripts/benchmark_filters.py [--json]
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
FILTERS_JS = ROOT / "scripts" / "hooks" / "command-filters.js"


def _find_node() -> str:
    env_node = os.getenv("ROS_NODE_BIN")
    if env_node and Path(env_node).is_file():
        return env_node
    found = shutil.which("node")
    if found:
        return found
    raise RuntimeError("node binary not found on PATH (set ROS_NODE_BIN to override)")


def _build_samples() -> list[dict[str, Any]]:
    pytest_lines = [f"tests/test_mod_{i}.py::test_case_{i} PASSED" for i in range(180)]
    pytest_lines += [
        "FAILED tests/test_billing.py::test_zero_division - ZeroDivisionError: division by zero",
        "AssertionError: expected 200 got 500",
        "1 failed, 180 passed in 4.21s",
    ]
    git_status_lines = [f" M src/module_{i}/service.py" for i in range(85)]
    git_status_lines += ["?? src/new_feature.py", "UU src/conflict.py"]

    npm_lines = [f"added package-{i}@1.2.{i}" for i in range(90)]
    npm_lines += [
        "npm WARN deprecated old-pkg@0.1.0: upgrade",
        "added 90 packages, and audited 91 packages in 3s",
        "found 0 vulnerabilities",
    ]

    rg_lines = [f"src/app/file_{i % 6}.py:{10 + i}:    match_value = compute({i})" for i in range(120)]

    return [
        {
            "name": "pytest_180_passed_1_failed",
            "command": "pytest tests/ -v",
            "output": "\n".join(pytest_lines),
            "must_keep": ["FAILED tests/test_billing.py", "ZeroDivisionError", "1 failed, 180 passed"],
        },
        {
            "name": "git_status_large_tree",
            "command": "git status -s",
            "output": "\n".join(git_status_lines),
            "must_keep": ["UU src/conflict.py"],
        },
        {
            "name": "npm_install_noisy",
            "command": "npm install",
            "output": "\n".join(npm_lines),
            "must_keep": ["added 90 packages", "found 0 vulnerabilities"],
        },
        {
            "name": "rg_120_matches",
            "command": "rg compute src/",
            "output": "\n".join(rg_lines),
            "must_keep": ["src/app/file_0.py"],
        },
    ]


def run_benchmark(node_bin: str | None = None) -> dict[str, Any]:
    node = node_bin or _find_node()
    samples = _build_samples()
    js_runner = (
        "const { filterCommandOutput } = require(process.argv[1]);\n"
        "const samples = JSON.parse(require('fs').readFileSync(0, 'utf8'));\n"
        "const results = samples.map(s => {\n"
        "  const out = filterCommandOutput(s.command, s.output);\n"
        "  const text = out === null ? s.output : out;\n"
        "  return { name: s.name, command: s.command, filtered: out !== null, output: text };\n"
        "});\n"
        "process.stdout.write(JSON.stringify(results));\n"
    )
    proc = subprocess.run(
        [node, "-e", js_runner, str(FILTERS_JS)],
        input=json.dumps(samples),
        capture_output=True,
        text=True,
        check=True,
        timeout=30,
    )
    raw_results = json.loads(proc.stdout)

    cases = []
    total_before = 0
    total_after = 0
    all_preserved = True

    for sample, res in zip(samples, raw_results):
        before = len(sample["output"])
        after = len(res["output"])
        saved = max(0, before - after)
        pct = round((saved / before) * 100.0, 2) if before else 0.0
        missing = [marker for marker in sample["must_keep"] if marker not in res["output"]]
        if missing:
            all_preserved = False
        total_before += before
        total_after += after
        cases.append({
            "name": sample["name"],
            "command": sample["command"],
            "filtered": bool(res["filtered"]),
            "chars_before": before,
            "chars_after": after,
            "chars_saved": saved,
            "tokens_saved_est": saved // 4,
            "reduction_pct": pct,
            "missing_markers": missing,
        })

    total_saved = max(0, total_before - total_after)
    return {
        "ok": all_preserved and total_saved > 0,
        "all_markers_preserved": all_preserved,
        "total_chars_before": total_before,
        "total_chars_after": total_after,
        "total_chars_saved": total_saved,
        "total_tokens_saved_est": total_saved // 4,
        "total_reduction_pct": round((total_saved / total_before) * 100.0, 2) if total_before else 0.0,
        "cases": cases,
    }


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Benchmark deterministic CLI command filters.")
    ap.add_argument("--json", action="store_true", help="Emit JSON summary.")
    args = ap.parse_args(argv)
    report = run_benchmark()
    if args.json:
        print(json.dumps(report, indent=2, ensure_ascii=False))
    else:
        print(
            f"Resident Agent OS Filter Benchmark — saved {report['total_chars_saved']} chars "
            f"(~{report['total_tokens_saved_est']} tok, {report['total_reduction_pct']}%) | "
            f"markers_preserved={report['all_markers_preserved']}"
        )
        for c in report["cases"]:
            print(f"  - {c['name']}: {c['chars_before']} -> {c['chars_after']} chars (-{c['reduction_pct']}%) missing={c['missing_markers']}")
    return 0 if report["ok"] else 1


if __name__ == "__main__":
    sys.exit(main())
