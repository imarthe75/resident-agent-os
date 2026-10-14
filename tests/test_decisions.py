"""agent/decisions.py. The two HTTP backends are exercised against a LOCAL server that reproduces the wire formats (an isolated test of our
client and validation, not of any real model): that is how it is reported."""
import json
import os
import threading
import unittest
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from unittest import mock

from agent import decisions as d
from agent.heuristic_engine import HeuristicEngine
from agent.loop import ResidentAgentLoop

ROOT = Path(__file__).resolve().parents[1]
QUESTIONS = {
    "task_complexity": d.choice("how hard?", {"trivial": "t", "medium": "m", "high": "h"}),
    "needs_human": d.noul("ask a person?"),
    "risk": d.score("risk", ["none", "low", "high"]),
}


class Handler(BaseHTTPRequestHandler):
    answers = {}
    seen = []
    status = 200

    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        Handler.seen.append((self.path, self.headers.get("Authorization"), body))
        payload = Handler.answers
        if self.path.endswith("/chat/completions"):
            payload = {"choices": [{"message": {"content": json.dumps(Handler.answers)}}]}
        else:
            payload = {"answers": Handler.answers, "usage": {"input_tokens": 1, "output_tokens": 0}}
        self.send_response(Handler.status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(payload).encode())

    def log_message(self, *a):
        pass


class Server:
    def __enter__(self):
        self.srv = HTTPServer(("127.0.0.1", 0), Handler)
        threading.Thread(target=self.srv.serve_forever, daemon=True).start()
        Handler.seen, Handler.status = [], 200
        self.url = f"http://127.0.0.1:{self.srv.server_port}"
        return self

    def __exit__(self, *a):
        self.srv.shutdown()
        self.srv.server_close()


GOOD = {"task_complexity": {"type": "choice", "choice": "high", "confidence": 0.91, "probabilities": {"high": 0.91, "medium": 0.07, "trivial": 0.02}},
        "needs_human": {"type": "noul", "noul": 0.12},
        "risk": {"type": "score", "score": 1.4, "confidence": 0.8, "probabilities": {}}}


class TestDecide(unittest.TestCase):
    def test_table(self):
        t = d.Thresholds(0.7, 0.5, 0.5)
        self.assertEqual(d.decide(0.95, 0.1, t), d.APPLY)
        self.assertEqual(d.decide(0.6, 0.1, t), d.APPLY_AND_FLAG)
        self.assertEqual(d.decide(0.4, 0.1, t), d.ESCALATE)
        self.assertEqual(d.decide(0.99, 0.5, t), d.ESCALATE)           # a person is called first, however sure the model is
        self.assertEqual(d.decide(0.7, 0.49, t), d.APPLY)              # boundaries are inclusive

    def test_env_moves_thresholds(self):
        with mock.patch.dict(os.environ, {"DECISION_THRESHOLD_APPLY": "0.9"}):
            self.assertEqual(d.Thresholds.from_env().apply, 0.9)


class TestValidation(unittest.TestCase):
    def test_option_outside_the_catalogue_is_an_error(self):
        with self.assertRaises(d.DecisionError):
            QUESTIONS["task_complexity"].validate_answer("t", {"choice": "enorme", "confidence": 0.9})

    def test_bad_probabilities_and_scores(self):
        for q, a in ((QUESTIONS["needs_human"], {"noul": 1.5}), (QUESTIONS["needs_human"], {"noul": True}), (QUESTIONS["needs_human"], {"noul": "0.2"}),
                     (QUESTIONS["risk"], {"score": 3, "confidence": 0.5}), (QUESTIONS["risk"], {"score": -1, "confidence": 0.5}),
                     (QUESTIONS["needs_human"], None)):
            with self.assertRaises(d.DecisionError):
                q.validate_answer("x", a)


class TestBackends(unittest.TestCase):
    def test_systemone_roundtrip_and_wire_format(self):
        with Server() as s:
            Handler.answers = GOOD
            b = d.HttpSystemOneBackend(base_url=s.url, api_key="k", model="m")
            out = b.ask({"title": "x"}, QUESTIONS)
        path, auth, body = Handler.seen[0]
        self.assertEqual((path, auth), ("/v1/systemone", "Bearer k"))
        self.assertEqual(body["model"], "m")
        self.assertEqual(body["questions"]["task_complexity"]["criteria"]["high"], "h")
        self.assertEqual(out["task_complexity"]["choice"], "high")
        self.assertEqual(out["needs_human"]["noul"], 0.12)
        self.assertTrue(b.calibrated)

    def test_invented_option_from_the_service_is_rejected(self):
        with Server() as s:
            Handler.answers = {**GOOD, "task_complexity": {"type": "choice", "choice": "extreme", "confidence": 0.9}}
            with self.assertRaises(d.DecisionError):
                d.HttpSystemOneBackend(base_url=s.url).ask({}, QUESTIONS)

    def test_service_down_and_server_error_are_decision_errors(self):
        with self.assertRaises(d.DecisionError):
            d.HttpSystemOneBackend(base_url="http://127.0.0.1:9", timeout=1).ask({}, QUESTIONS)
        with Server() as s:
            Handler.status = 500
            with self.assertRaises(d.DecisionError):
                d.HttpSystemOneBackend(base_url=s.url).ask({}, QUESTIONS)

    def test_chat_backend_is_marked_uncalibrated(self):
        with Server() as s:
            Handler.answers = GOOD
            b = d.ChatJsonBackend(base_url=s.url, model="m")
            out = b.ask({"title": "x"}, QUESTIONS)
        self.assertFalse(b.calibrated)
        self.assertEqual(out["risk"]["score"], 1.4)
        self.assertIn("untrusted", Handler.seen[0][2]["messages"][0]["content"])      # state is declared as data, not instructions

    def test_unconfigured_backend(self):
        with mock.patch.dict(os.environ, {}, clear=True):
            self.assertIsNone(d.backend_from_env())
            with self.assertRaises(d.DecisionError):
                d.HttpSystemOneBackend()


class TestCatalogueAndLoop(unittest.TestCase):
    def test_shipped_catalogue_loads(self):
        qs, t = d.load_catalogue(ROOT / ".agent" / "decisions.json")
        self.assertEqual(set(qs), {"task_complexity", "touches_sensitive_data", "needs_human"})
        self.assertEqual(t.apply, 0.7)

    def test_loop_without_backend_degrades_visibly(self):
        loop = ResidentAgentLoop(agent_dir=ROOT / ".agent")
        with mock.patch.dict(os.environ, {}, clear=True):
            self.assertEqual(loop.ask_decisions({"title": "x"}), {})
        self.assertEqual(loop._context["decisions"]["available"], False)

    def test_probability_drives_a_real_heuristic_rule(self):
        with Server() as s:
            Handler.answers = {"task_complexity": GOOD["task_complexity"], "touches_sensitive_data": {"type": "noul", "noul": 0.1},
                               "needs_human": {"type": "noul", "noul": 0.83}}
            loop = ResidentAgentLoop(agent_dir=ROOT / ".agent")
            with mock.patch.dict(os.environ, {"DECISION_BACKEND_URL": s.url}):
                answers = loop.ask_decisions({"title": "x"})
        self.assertEqual(loop._context["decisions"]["needs_human"], 0.83)
        engine = HeuristicEngine(ROOT / ".agent" / "heuristics.json")
        self.assertIn("escalate_to_human", engine.evaluate(loop._context))
        self.assertEqual(loop._decision_layer.decide(answers, "task_complexity"), d.ESCALATE)    # needs_human 0.83 >= 0.5 wins over confidence 0.91
        loop2 = ResidentAgentLoop(agent_dir=ROOT / ".agent")
        loop2._context["decisions"] = {"needs_human": 0.1}
        self.assertNotIn("escalate_to_human", engine.evaluate(loop2._context))


if __name__ == "__main__":
    unittest.main()
