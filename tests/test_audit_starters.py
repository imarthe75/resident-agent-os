import importlib.util
import unittest
from pathlib import Path

_spec = importlib.util.spec_from_file_location("audit_starters", Path(__file__).resolve().parents[1] / "scripts" / "audit_starters.py")
au = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(au)


class TestConfirmProximity(unittest.TestCase):
    def test_confirmation_far_away_does_not_excuse_a_delete(self):
        lines = ["this.confirmationService.confirm({...})"] + ["// filler"] * 40 + ["this.service.delete(id);"]
        self.assertFalse(au.has_confirmation_near(lines, len(lines) - 1))

    def test_confirmation_next_to_the_delete_does(self):
        lines = ["x();", "this.confirmationService.confirm({ accept: () => {", "   this.service.delete(id);", "}});"]
        self.assertTrue(au.has_confirmation_near(lines, 2))

    def test_unreadable_file_is_reported_not_called_clean(self):
        out = au.audit_file(Path("/nonexistent/dir/x.java"), "p")
        self.assertEqual(len(out), 1)
        self.assertIn("NO cuenta como limpio", out[0]["description"])


if __name__ == "__main__":
    unittest.main()
