"""Tests for deterministic review preparation, smart bundling, path rules, and line relocation."""

import json
import subprocess
import tempfile
import unittest
from pathlib import Path

from agent.review_prepare import bundle_files, classify_exclusion, prepare_review, relocate_finding


def _git(repo: Path, *args: str) -> None:
    subprocess.run(["git", "-C", str(repo), *args], check=True, capture_output=True, text=True)


class TestReviewPrepare(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.repo = Path(self.tmp.name)
        _git(self.repo, "init", "-q")
        _git(self.repo, "config", "user.name", "Tester")
        _git(self.repo, "config", "user.email", "tester@example.invalid")

        (self.repo / ".agent").mkdir()
        (self.repo / ".agent" / "path-rules.json").write_text(
            json.dumps({
                "rules": [
                    {"id": "R-CTRL", "paths": ["src/*Controller.java"], "severity": "P1", "rule": "Require @PreAuthorize"}
                ]
            }),
            encoding="utf-8",
        )
        (self.repo / "rules" / "java").mkdir(parents=True)
        (self.repo / "rules" / "java" / "rules.md").write_text("# Java rules\n", encoding="utf-8")
        (self.repo / "src").mkdir()
        (self.repo / "src" / "OrderController.java").write_text("class OrderController {\n  void get() {}\n}\n", encoding="utf-8")
        _git(self.repo, "add", ".")
        _git(self.repo, "commit", "-q", "-m", "initial")

    def test_classify_exclusion_blocks_secrets_and_lockfiles(self):
        self.assertEqual(classify_exclusion(".env"), "secret_or_credential_path")
        self.assertEqual(classify_exclusion("certs/prod.pem"), "secret_or_credential_path")
        self.assertEqual(classify_exclusion("frontend/package-lock.json"), "lockfile_binary_or_generated")
        self.assertEqual(classify_exclusion("node_modules/a/index.js"), "excluded_directory")
        self.assertIsNone(classify_exclusion("src/OrderController.java"))

    def test_prepare_review_workspace_selects_bundles_and_matches_path_rules(self):
        (self.repo / "src" / "OrderController.java").write_text("class OrderController {\n  void get() { return; }\n}\n", encoding="utf-8")
        (self.repo / ".env").write_text("SECRET=123\n", encoding="utf-8")
        (self.repo / "package-lock.json").write_text("{}\n", encoding="utf-8")

        report = prepare_review(self.repo)
        self.assertEqual(report["meta"]["mode"], "workspace")
        self.assertEqual(report["counts"]["reviewable"], 1)
        self.assertEqual(report["counts"]["excluded"], 2)
        self.assertEqual(report["bundles"][0]["files"], ["src/OrderController.java"])
        rule_ids = [g["id"] for g in report["rule_groups"]]
        self.assertIn("R-CTRL", rule_ids)
        self.assertIn("STACK-JAVA", rule_ids)

    def test_bundle_files_splits_large_groups_deterministically(self):
        files = [{"path": f"src/mod/file_{i}.py", "language": "python"} for i in range(10)]
        bundles = bundle_files(files, max_bundle_size=4)
        self.assertEqual(len(bundles), 3)
        self.assertEqual(sum(len(b["files"]) for b in bundles), 10)

    def test_relocate_finding_detects_exact_drifted_and_missing(self):
        f = self.repo / "sample.py"
        f.write_text("line1\nline2\ndef target_fn(x):\n    return x + 1\n", encoding="utf-8")

        exact = relocate_finding(f, 3, "def target_fn(x):")
        self.assertEqual(exact["status"], "exact")
        self.assertEqual(exact["verified_line"], 3)

        drifted = relocate_finding(f, 1, "def target_fn(x):")
        self.assertEqual(drifted["status"], "relocated")
        self.assertEqual(drifted["verified_line"], 3)
        self.assertEqual(drifted["drift"], 2)

        missing = relocate_finding(f, 2, "def non_existent():")
        self.assertEqual(missing["status"], "not_found")


if __name__ == "__main__":
    unittest.main()
