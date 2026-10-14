import json
import re
import tempfile
import unittest
from pathlib import Path

from agent import gates as g
from agent import human_validation as hv


class TestRegistry(unittest.TestCase):
    def setUp(self):
        t = tempfile.TemporaryDirectory()
        self.addCleanup(t.cleanup)
        self.reg = hv.HumanValidationRegistry(Path(t.name) / "v.jsonl")

    def test_uuid7_shape_and_order(self):
        a, b = hv.uuid7(), hv.uuid7()
        self.assertRegex(a, r"^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$")
        self.assertLessEqual(a[:13], b[:13])

    def test_lifecycle(self):
        rid = self.reg.request("código del cambio X", produced_by="claude-agent", ref="PR-12")
        self.assertEqual(self.reg.get(rid)["status"], hv.PENDING)
        self.assertFalse(self.reg.is_approved("código del cambio X"))
        rec = self.reg.resolve(rid, "ana.revisora", hv.APPROVED, "revisado con checklist")
        self.assertEqual((rec["status"], rec["validated_by"]), (hv.APPROVED, "ana.revisora"))
        self.assertTrue(self.reg.is_approved("código del cambio X"))
        self.assertEqual(self.reg.pending(), [])

    def test_the_producer_cannot_validate_itself_and_identity_is_required(self):
        rid = self.reg.request("s", produced_by="Claude-Agent")
        for who in ("claude-agent", " CLAUDE-AGENT ", "", "   "):
            with self.assertRaises(hv.ValidationError):
                self.reg.resolve(rid, who, hv.APPROVED)
        self.assertEqual(self.reg.get(rid)["status"], hv.PENDING)

    def test_no_double_resolution_and_rejection_needs_a_reason(self):
        rid = self.reg.request("s", produced_by="bot")
        with self.assertRaises(hv.ValidationError):
            self.reg.resolve(rid, "ana", hv.REJECTED, "")
        self.reg.resolve(rid, "ana", hv.REJECTED, "falta cobertura")
        with self.assertRaises(hv.ValidationError):
            self.reg.resolve(rid, "beto", hv.APPROVED)               # a rejection is not silently overturned
        with self.assertRaises(hv.ValidationError):
            self.reg.resolve("no-such-id", "ana", hv.APPROVED)

    def test_new_request_for_same_subject_revokes_prior_approval(self):
        r1 = self.reg.request("s", produced_by="bot")
        self.reg.resolve(r1, "ana", hv.APPROVED)
        self.reg.request("s", produced_by="bot")                       # the AI produced a new version of the same thing
        self.assertFalse(self.reg.is_approved("s"))

    def test_hash_chain_detects_tampering(self):
        rid = self.reg.request("s", produced_by="bot")
        self.reg.resolve(rid, "ana", hv.APPROVED)
        self.assertEqual(self.reg.verify_chain(), [])
        lines = self.reg.path.read_text(encoding="utf-8").splitlines()
        e = json.loads(lines[0])
        e["produced_by"] = "someone-else"                              # edit the first record after the fact
        lines[0] = json.dumps(e, ensure_ascii=False, sort_keys=True)
        self.reg.path.write_text("\n".join(lines) + "\n", encoding="utf-8")
        self.assertTrue(self.reg.verify_chain())


class TestGates(unittest.TestCase):
    def setUp(self):
        t = tempfile.TemporaryDirectory()
        self.addCleanup(t.cleanup)
        self.root = Path(t.name)
        (self.root / "ok.txt").write_text("x")
        self.reg = hv.HumanValidationRegistry(self.root / "v.jsonl")

    def gate(self, exit_):
        return {"stage": 3, "name": "t", "exit": exit_}

    def test_all_pass_but_same_person_verifies_is_not_closed(self):
        gate = self.gate([{"type": "file_exists", "path": "ok.txt"}, {"type": "command_exit0", "cmd": "python3 -c 'import sys; sys.exit(0)'"}])
        self.assertEqual(g.evaluate_gate(gate, self.root, closer="luis", verifier="luis", registry=self.reg)["status"], g.PENDING_VERIFICATION)
        self.assertEqual(g.evaluate_gate(gate, self.root, closer="luis", verifier=None, registry=self.reg)["status"], g.PENDING_VERIFICATION)
        self.assertEqual(g.evaluate_gate(gate, self.root, closer="luis", verifier="marta", registry=self.reg)["status"], g.CLOSED)

    def test_a_failing_criterion_keeps_it_open(self):
        gate = self.gate([{"type": "file_exists", "path": "ok.txt"}, {"type": "command_exit0", "cmd": "python3 -c 'import sys; sys.exit(3)'"}])
        r = g.evaluate_gate(gate, self.root, "luis", "marta", self.reg)
        self.assertEqual(r["status"], g.OPEN)
        self.assertEqual([x["status"] for x in r["results"]], [g.PASS, g.FAIL])

    def test_empty_gate_never_closes(self):
        self.assertEqual(g.evaluate_gate(self.gate([]), self.root, "luis", "marta", self.reg)["status"], g.OPEN)

    def test_human_validation_criterion_uses_the_register(self):
        gate = self.gate([{"type": "human_validation", "subject": "código IA"}])
        self.assertEqual(g.evaluate_gate(gate, self.root, "luis", "marta", self.reg)["status"], g.OPEN)
        rid = self.reg.request("código IA", produced_by="bot")
        self.reg.resolve(rid, "ana", hv.APPROVED)
        self.assertEqual(g.evaluate_gate(gate, self.root, "luis", "marta", self.reg)["status"], g.CLOSED)

    def test_unevaluable_command_and_verifier_do_not_pass(self):
        gate = self.gate([{"type": "command_exit0", "cmd": "no-such-binary-xyz --v"}])
        self.assertEqual(g.evaluate_gate(gate, self.root, "a", "b", self.reg)["results"][0]["status"], g.NOT_EVALUATED)
        gate = self.gate([{"type": "verifier", "name": "pk_uuid"}])                 # no .sql in the folder: NO_EVALUADO is not a PASS
        r = g.evaluate_gate(gate, self.root, "a", "b", self.reg)
        self.assertEqual((r["results"][0]["status"], r["status"]), (g.NOT_EVALUATED, g.OPEN))

    def test_malformed_gate_files_are_rejected(self):
        p = self.root / "bad.yml"
        p.write_text("stage: 1\nname: x\nexit:\n  - {type: magic}\n")
        with self.assertRaises(g.GateError):
            g.load_gate(p)

    def test_shipped_example_loads(self):
        gate = g.load_gate(Path(__file__).resolve().parents[1] / ".agent" / "gates" / "etapa-3.example.yml")
        self.assertEqual(len(gate["exit"]), 3)


if __name__ == "__main__":
    unittest.main()
