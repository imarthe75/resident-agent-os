"""Tests for multi-repo fleet monitor (scripts/fleet_status.py)."""

import json
import tempfile
import unittest
from pathlib import Path

from agent.telemetry import TelemetryWriter
from scripts import distribute_framework as dist
from scripts import fleet_status as fleet


def _write(root: Path, rel: str, text: str) -> None:
    p = root / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding="utf-8")


class TestFleetStatus(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.src = self.root / "fw"
        self.parent = self.root / "repos"
        _write(self.src, "VERSION", "2.21.0\n")
        _write(self.src, ".agent/AGENT.md", "laws")
        _write(self.src, ".agent/thresholds.json", json.dumps({"signals": {"latency_p95_ms": 1000, "error_rate": 0.1}}))
        _write(self.src, "rules/common/security.md", "sec")

        for name in ("repo-ok", "repo-drift"):
            (self.parent / name / ".git").mkdir(parents=True)

        dist.main(["--source", str(self.src), "--parent", str(self.parent), "--no-git-add"])

        # Introduce real drift, verifier failure (stub), and telemetry threshold breach in repo-drift.
        _write(self.parent / "repo-drift", "rules/common/security.md", "tampered")
        _write(self.parent / "repo-drift", "app/service.py", "def pending():\n    pass\n")
        w = TelemetryWriter(self.parent / "repo-drift" / ".agent" / "telemetry" / "events.jsonl", session_id="s1")
        w.emit("skill_execute", phase="execute", skill="x", outcome="error", duration_ms=4000, cost_usd=0.05)
        w.emit("compress_output", source="hook", phase="post_tool_use", outcome="ok", chars_saved=800, tokens_saved_est=200)

    def test_fleet_report_aggregates_drift_verifiers_and_telemetry_and_writes_json(self):
        out_file = self.root / "data" / "fleet-status.json"
        rc = fleet.main([
            "--source", str(self.src),
            "--parent", str(self.parent),
            "--out", str(out_file),
            "--json",
        ])
        self.assertEqual(rc, 0)
        self.assertTrue(out_file.is_file())

        report = json.loads(out_file.read_text(encoding="utf-8"))
        self.assertEqual(report["totals"]["repos"], 2)
        self.assertEqual(report["totals"]["drifted"], 1)
        self.assertEqual(report["totals"]["threshold_alerts"], 1)
        self.assertEqual(report["totals"]["tokens_saved_by_hooks_est"], 200)

        by_name = {r["name"]: r for r in report["repos"]}
        self.assertFalse(by_name["repo-ok"]["drift"])
        self.assertTrue(by_name["repo-drift"]["drift"])
        self.assertIn("no_stubs", by_name["repo-drift"]["verifiers"]["failed_names"])
        self.assertEqual(by_name["repo-drift"]["telemetry"]["threshold_status"], "ALERTA")
        self.assertIsNone(by_name["repo-ok"]["outdated_dependencies"])

    def test_fail_flags_return_nonzero_and_empty_targets_returns_2(self):
        self.assertEqual(fleet.main(["--source", str(self.src)]), 2)
        self.assertEqual(
            fleet.main(["--source", str(self.src), "--parent", str(self.parent), "--fail-on-drift"]),
            1,
        )
        self.assertEqual(
            fleet.main(["--source", str(self.src), "--parent", str(self.parent), "--fail-on-breach"]),
            1,
        )
        self.assertEqual(
            fleet.main(["--source", str(self.src), "--parent", str(self.parent), "--fail-on-verifier"]),
            1,
        )
        self.assertEqual(
            fleet.main(["--source", str(self.src), "--target", str(self.parent / "repo-ok"), "--fail-on-drift", "--fail-on-breach"]),
            0,
        )

    def test_graceful_degradation_when_distribute_framework_missing(self):
        orig_load = fleet._load_script
        fleet._load_script = lambda name, rel: None if "distribute_framework" in rel else orig_load(name, rel)
        try:
            report = fleet.build_fleet_report(self.src, [self.parent / "repo-drift"])
        finally:
            fleet._load_script = orig_load

        self.assertFalse(report["drift_available"])
        self.assertEqual(report["totals"]["repos"], 1)
        self.assertEqual(report["totals"]["drift_not_evaluated"], 1)
        repo_row = report["repos"][0]
        self.assertEqual(repo_row["drift_status"], "NO_EVALUADO")
        self.assertIn("distribute_framework.py", repo_row["drift_reason"])
        self.assertIn("no_stubs", repo_row["verifiers"]["failed_names"])
        self.assertEqual(repo_row["telemetry"]["threshold_status"], "ALERTA")


if __name__ == "__main__":
    unittest.main()
