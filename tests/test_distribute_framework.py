"""distribute_framework on real temporary directories: copy, project files preserved, drift detection."""
import importlib.util
import tempfile
import unittest
from pathlib import Path

_spec = importlib.util.spec_from_file_location("distribute", Path(__file__).resolve().parents[1] / "scripts" / "distribute_framework.py")
dist = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(dist)


def w(root, rel, text):
    p = Path(root) / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding="utf-8")


class TestDistribute(unittest.TestCase):
    def setUp(self):
        t = tempfile.TemporaryDirectory()
        self.addCleanup(t.cleanup)
        self.root = Path(t.name)
        self.src, self.parent = self.root / "fw", self.root / "repos"
        w(self.src, "VERSION", "9.9.9\n")
        w(self.src, ".agent/AGENT.md", "laws v1")
        w(self.src, ".agent/STATE.md", "framework template state")
        w(self.src, "rules/common/security.md", "sec v1")
        w(self.src, "skills/x/__pycache__/junk.pyc", "junk")
        for r in ("a", "b"):
            (self.parent / r / ".git").mkdir(parents=True)
        (self.parent / "not-a-repo").mkdir()
        w(self.parent / "b", ".agent/STATE.md", "B's own state")

    def test_distribute_then_check_is_clean_and_project_state_survives(self):
        self.assertEqual(dist.main(["--source", str(self.src), "--parent", str(self.parent), "--no-git-add"]), 0)
        self.assertTrue((self.parent / "a/rules/common/security.md").is_file())
        self.assertFalse((self.parent / "a/skills/x/__pycache__/junk.pyc").exists())
        self.assertFalse((self.parent / "not-a-repo/VERSION").exists())
        self.assertEqual((self.parent / "b/.agent/STATE.md").read_text(), "B's own state")        # not overwritten
        self.assertEqual((self.parent / "a/.agent/STATE.md").read_text(), "framework template state")   # first time: seeded
        self.assertEqual(dist.main(["--source", str(self.src), "--parent", str(self.parent), "--check"]), 0)

    def test_check_reports_modified_missing_and_outdated(self):
        dist.main(["--source", str(self.src), "--parent", str(self.parent), "--no-git-add"])
        (self.parent / "a/rules/common/security.md").write_text("hand edited")
        (self.parent / "b/.agent/AGENT.md").unlink()
        r = dist.check_target(self.src, self.parent / "a")
        self.assertEqual(r["modified"], ["rules/common/security.md"])
        self.assertTrue(r["drift"])
        self.assertEqual(dist.check_target(self.src, self.parent / "b")["missing"], [".agent/AGENT.md"])
        w(self.src, "VERSION", "10.0.0\n")                                                         # framework moved on
        self.assertTrue(dist.check_target(self.src, self.parent / "a")["drift"])
        self.assertEqual(dist.main(["--source", str(self.src), "--parent", str(self.parent), "--check"]), 1)

    def test_dry_run_changes_nothing(self):
        dist.main(["--source", str(self.src), "--parent", str(self.parent), "--dry-run"])
        self.assertFalse((self.parent / "a/rules").exists())
        self.assertFalse((self.parent / "a/.framework-manifest.json").exists())

    def test_no_targets_is_an_error_not_a_silent_success(self):
        self.assertEqual(dist.main(["--source", str(self.src)]), 2)


if __name__ == "__main__":
    unittest.main()
