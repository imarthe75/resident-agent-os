import importlib.util
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
_spec = importlib.util.spec_from_file_location("check_prompts", ROOT / "scripts" / "check_prompts.py")
cp = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(cp)

GOOD = "---\nid: p1\nversion: 1.2.3\nowner: me\nderived_from: src.md\neval_set: none\nlast_reviewed: 2026-10-13\n---\nbody\n"


class T(unittest.TestCase):
    def root(self, files):
        t = tempfile.TemporaryDirectory()
        self.addCleanup(t.cleanup)
        r = Path(t.name)
        (r / "prompts").mkdir()
        (r / "src.md").write_text("x")
        for n, c in files.items():
            (r / "prompts" / n).write_text(c)
        return r

    def test_shipped_prompts_are_valid(self):
        self.assertEqual(cp.check(ROOT), [])

    def test_good_and_bad_headers(self):
        self.assertEqual(cp.check(self.root({"a.md": GOOD})), [])
        bad = cp.check(self.root({"a.md": GOOD.replace("1.2.3", "v1").replace("src.md", "gone.md").replace("eval_set: none", "eval_set: ev.json")}))
        self.assertEqual(len(bad), 3)
        self.assertTrue(any("semver" in b for b in bad))
        self.assertTrue(cp.check(self.root({"a.md": "no header"})))
        self.assertTrue(cp.check(self.root({"a.md": GOOD, "b.md": GOOD})))                    # duplicate id
        self.assertTrue(cp.check(self.root({"a.md": GOOD.replace("owner: me\n", "")})))       # missing owner


if __name__ == "__main__":
    unittest.main()
