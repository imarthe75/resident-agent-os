import json
import tempfile
import unittest
from pathlib import Path

from agent.exceptions import HeuristicRuleError
from agent.heuristic_engine import HeuristicEngine


def engine(rules):
    d = tempfile.mkdtemp()
    p = Path(d) / "h.json"
    p.write_text(json.dumps({"rules": rules}), encoding="utf-8")
    return HeuristicEngine(p)


class TestEngine(unittest.TestCase):
    def test_priority_order_and_operators(self):
        e = engine([
            {"id": "b", "priority": 5, "condition": {"gte": ["context.retry_count", 3]}, "action": "halt"},
            {"id": "a", "priority": 1, "condition": {"and": [{"eq": ["context.x", True]}, {"not": {"eq": ["context.y", True]}}]}, "action": "first"},
            {"id": "c", "priority": 9, "condition": {"in": ["context.env", ["dev", "test"]]}, "action": "relaxed"},
            {"id": "d", "priority": 9, "condition": {"ne": ["context.env", "prod"]}, "action": "not-prod"},
        ])
        self.assertEqual(e.evaluate({"retry_count": 3, "x": True, "y": False, "env": "dev"}), ["first", "halt", "relaxed", "not-prod"])
        self.assertEqual(e.evaluate({"retry_count": 1, "env": "prod"}), [])

    def test_missing_field_does_not_match_a_comparison(self):
        e = engine([{"id": "a", "priority": 5, "condition": {"gte": ["context.retry_count", 3]}, "action": "halt"}])
        self.assertEqual(e.evaluate({}), [])

    def test_unknown_operator_fails_at_load_not_silently_at_runtime(self):
        with self.assertRaises(HeuristicRuleError):
            engine([{"id": "a", "priority": 5, "condition": {"gtee": ["context.n", 1]}, "action": "x"}])
        with self.assertRaises(HeuristicRuleError):
            engine([{"id": "a", "priority": 5, "condition": {"gte": ["context.n"]}, "action": "x"}])

    def test_broken_normal_rule_is_reported_as_rule_error(self):
        e = engine([{"id": "n", "priority": 5, "condition": {"gte": ["context.n", 3]}, "action": "x"}])
        self.assertEqual(e.evaluate({"n": "texto"}), ["rule_error:n"])            # "texto" >= 3 raises TypeError

    def test_broken_guard_rule_fails_closed(self):
        e = engine([{"id": "ECC_001", "priority": 1, "condition": {"gte": ["context.retry_count", 3]}, "action": "halt_and_reflect"}])
        with self.assertRaises(HeuristicRuleError):
            e.evaluate({"retry_count": "tres"})

    def test_shipped_rules_file_loads_and_halts_at_three_retries(self):
        e = HeuristicEngine(Path(__file__).resolve().parents[1] / ".agent" / "heuristics.json")
        self.assertIn("halt_and_reflect", e.evaluate({"retry_count": 3}))
        self.assertNotIn("halt_and_reflect", e.evaluate({"retry_count": 2}))


if __name__ == "__main__":
    unittest.main()
