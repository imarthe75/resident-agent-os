"""Preflight client against a LOCAL server that reproduces the documented contract (isolated test of the client, not of any scanner)."""
import json
import os
import threading
import unittest
from http.server import BaseHTTPRequestHandler, HTTPServer
from unittest import mock

from agent import preflight_client as pc

BODY = {"asset": "GitLab/x/y", "known_asset": True, "paths": ["a.java", "b.java"], "last_audit": "2026-10-13", "engines_seen": ["sast-native"],
        "findings": [{"path": "a.java", "line": 12, "rule": "JPA-EAGER-FETCH", "severity": "MEDIUM", "status": "OPEN"},
                     {"path": "a.java", "line": 3, "rule": "HARDCODED-SECRET", "severity": "CRITICAL", "status": "OPEN"}],
        "paths_without_findings": ["b.java"]}


class H(BaseHTTPRequestHandler):
    seen, body, code = [], BODY, 200

    def do_GET(self):
        H.seen.append((self.path, self.headers.get("Authorization")))
        self.send_response(H.code)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(H.body).encode())

    def log_message(self, *a):
        pass


class Srv:
    def __enter__(self):
        self.s = HTTPServer(("127.0.0.1", 0), H)
        threading.Thread(target=self.s.serve_forever, daemon=True).start()
        H.seen, H.body, H.code = [], BODY, 200
        return f"http://127.0.0.1:{self.s.server_port}"

    def __exit__(self, *a):
        self.s.shutdown()
        self.s.server_close()


class TestClient(unittest.TestCase):
    def test_roundtrip_and_summary_orders_by_severity(self):
        with Srv() as url:
            r = pc.query("GitLab/x/y", ["a.java", "b.java"], base_url=url, token="tok")
        self.assertEqual(H.seen[0][1], "Bearer tok")
        self.assertIn("asset=GitLab%2Fx%2Fy", H.seen[0][0])
        self.assertTrue(r["available"])
        text = pc.summarize(r)
        self.assertLess(text.index("CRITICAL"), text.index("MEDIUM"))
        self.assertIn("NO equivale a limpio", text)

    def test_not_configured_unreachable_and_off_contract_are_reported_not_hidden(self):
        with mock.patch.dict(os.environ, {}, clear=True):
            r = pc.query("a", ["x"])
        self.assertFalse(r["available"])
        self.assertIn("SIN información", pc.summarize(r))
        self.assertFalse(pc.query("a", ["x"], base_url="http://127.0.0.1:9", timeout=1)["available"])
        with Srv() as url:
            H.body = {"hello": "world"}
            r = pc.query("a", ["x"], base_url=url)
        self.assertFalse(r["available"])
        self.assertIn("fuera de contrato", r["reason"])

    def test_unknown_asset_is_not_zero_findings(self):
        with Srv() as url:
            H.body = {**BODY, "known_asset": False, "findings": []}
            r = pc.query("nope", ["a.java"], base_url=url)
        self.assertIn("no conoce este activo", pc.summarize(r))


if __name__ == "__main__":
    unittest.main()
