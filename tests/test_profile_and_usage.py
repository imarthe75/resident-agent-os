import json
import tempfile
import unittest
from pathlib import Path

from agent import profile as pf
from agent.loop import ResidentAgentLoop
from memory.agent_state import LoopState

ROOT = Path(__file__).resolve().parents[1]


class TestProfile(unittest.TestCase):
    def test_applies(self):
        ui = {"has_ui": True, "lifecycle": "iterative", "modules": ["migrations"]}
        self.assertTrue(pf.applies("has_ui", ui))
        self.assertFalse(pf.applies("has_ui", {"has_ui": False}))
        self.assertTrue(pf.applies("has_ui, module=migrations, lifecycle=iterative", ui))
        self.assertFalse(pf.applies("has_ui, module=integrations", ui))      # ALL conditions must hold
        self.assertTrue(pf.applies("has_ui", {}))                            # unknown profile -> every rule applies
        self.assertTrue(pf.applies("", ui))

    def test_validation(self):
        t = tempfile.TemporaryDirectory()
        self.addCleanup(t.cleanup)
        p = Path(t.name) / "PROFILE.json"
        for bad in ({"lifecycle": "waterfall"}, {"has_ui": "yes"}, {"modules": "x"}):
            p.write_text(json.dumps(bad))
            with self.assertRaises(pf.ProfileError):
                pf.load_profile(p)
        self.assertEqual(pf.load_profile(Path(t.name) / "none.json"), {})

    def test_rule_files_follow_the_profile(self):
        with_ui = [p.name for p in pf.applicable_rule_files(ROOT / "rules", {"has_ui": True})]
        no_ui = [p.name for p in pf.applicable_rule_files(ROOT / "rules", {"has_ui": False})]
        unknown = [p.name for p in pf.applicable_rule_files(ROOT / "rules", {})]
        self.assertIn("accessibility.md", with_ui)
        self.assertNotIn("accessibility.md", no_ui)
        self.assertIn("accessibility.md", unknown)
        self.assertIn("security.md", no_ui)                                  # unconditional rules always apply

    def test_loop_loads_profile_and_filters_rules(self):
        t = tempfile.TemporaryDirectory()
        self.addCleanup(t.cleanup)
        d = Path(t.name)
        (d / ".agent").mkdir()
        (d / ".agent" / "PROFILE.json").write_text('{"has_ui": false}')
        (d / "rules").mkdir()
        (d / "rules" / "a11y.md").write_text("applies_when: has_ui\n# x")
        (d / "rules" / "sec.md").write_text("# y")
        loop = ResidentAgentLoop(agent_dir=d / ".agent")
        ctx = loop.load_context()
        self.assertEqual(ctx["applicable_rules"], ["rules/sec.md"])


class TestUsage(unittest.TestCase):
    def test_accumulates_roundtrips_and_rejects_negatives(self):
        s = LoopState()
        s.record_usage("a", 100, 20, 0.002)
        s.record_usage("a", 50, 10, 0.001)
        s.record_usage("b", 5, 5, 0)
        self.assertEqual(s.usage["a"], {"calls": 2, "tokens_in": 150, "tokens_out": 30, "usd": 0.003})
        self.assertEqual(s.usage_totals(), {"calls": 3, "tokens_in": 155, "tokens_out": 35, "usd": 0.003})
        s2 = LoopState.from_dict(s.to_dict())
        self.assertEqual(s2.usage_totals(), s.usage_totals())
        with self.assertRaises(ValueError):
            s.record_usage("a", -1)


if __name__ == "__main__":
    unittest.main()
