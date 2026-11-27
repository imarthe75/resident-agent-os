"""End-to-end tests for the unified `ros` CLI, multi-host init-host, and local stdio MCP server."""

import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from agent import cli
from agent.mcp_server import PROTOCOL_VERSION, bound_mcp_text, handle_request

ROOT = Path(__file__).resolve().parents[1]


class TestCliAndMcp(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.repo = Path(self.tmp.name)

    def test_doctor_and_init_host_multi_provider_non_destructive(self):
        (self.repo / "AGENTS.md").write_text("existing custom instructions\n", encoding="utf-8")
        rep = cli.init_host(self.repo, "all")
        self.assertIn("AGENTS.md", rep["skipped_existing"])
        self.assertEqual((self.repo / "AGENTS.md").read_text(encoding="utf-8"), "existing custom instructions\n")
        self.assertTrue((self.repo / ".mcp.json").is_file())
        self.assertTrue((self.repo / ".gemini" / "settings.json").is_file())
        self.assertTrue((self.repo / ".cursor" / "rules" / "resident-agent-os.mdc").is_file())
        self.assertTrue((self.repo / ".github" / "copilot-instructions.md").is_file())

        doc = cli.run_doctor(self.repo)
        self.assertTrue(doc["detected_hosts"]["mcp"])
        self.assertTrue(doc["detected_hosts"]["gemini"])
        self.assertTrue(doc["detected_hosts"]["antigravity"])
        self.assertTrue(doc["detected_hosts"]["cursor"])
        self.assertTrue(doc["detected_hosts"]["copilot"])

    def test_mcp_protocol_initialize_list_and_call_in_process_and_stdio(self):
        init_resp = handle_request({"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {}})
        self.assertEqual(init_resp["result"]["protocolVersion"], PROTOCOL_VERSION)

        list_resp = handle_request({"jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {}})
        tool_names = [t["name"] for t in list_resp["result"]["tools"]]
        for expected in ("ros_doctor", "ros_verify", "ros_review_prepare", "ros_relocate_finding", "ros_check_thresholds", "ros_fleet_status", "ros_memory_status"):
            self.assertIn(expected, tool_names)

        # Real subprocess stdio JSON-RPC handshake via `python -m agent mcp`
        sample_file = self.repo / "demo.py"
        sample_file.write_text("a = 1\ndef hello():\n    return 42\n", encoding="utf-8")
        requests_ndjson = "\n".join([
            json.dumps({"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {}}),
            json.dumps({"jsonrpc": "2.0", "method": "notifications/initialized"}),
            json.dumps({
                "jsonrpc": "2.0",
                "id": 2,
                "method": "tools/call",
                "params": {
                    "name": "ros_relocate_finding",
                    "arguments": {"file_path": str(sample_file), "reported_line": 1, "snippet": "def hello():"},
                },
            }),
        ]) + "\n"

        env = {**os.environ, "PYTHONPATH": str(ROOT)}
        cp = subprocess.run(
            [sys.executable, "-m", "agent", "mcp"],
            input=requests_ndjson,
            capture_output=True,
            text=True,
            env=env,
            timeout=15,
            check=True,
        )
        responses = [json.loads(line) for line in cp.stdout.splitlines() if line.strip()]
        self.assertEqual(len(responses), 2)
        rel_payload = json.loads(responses[1]["result"]["content"][0]["text"])
        self.assertEqual(rel_payload["status"], "relocated")
        self.assertEqual(rel_payload["verified_line"], 2)

    def test_bound_mcp_text_spills_privately_and_truncates(self):
        spill_dir = self.repo / "spill"
        old = os.environ.get("ROS_MCP_SPILL_DIR")
        os.environ["ROS_MCP_SPILL_DIR"] = str(spill_dir)
        try:
            huge = "A" * 5000 + "ERROR_MARKER" + "B" * 5000
            bounded = bound_mcp_text(huge, max_chars=2000)
            self.assertLess(len(bounded), len(huge))
            self.assertIn("salida completa en", bounded)
            spilled_files = list(spill_dir.glob("*.txt"))
            self.assertEqual(len(spilled_files), 1)
            self.assertEqual(spilled_files[0].read_text(encoding="utf-8"), huge)
            self.assertEqual(spilled_files[0].stat().st_mode & 0o777, 0o600)
        finally:
            if old is None:
                os.environ.pop("ROS_MCP_SPILL_DIR", None)
            else:
                os.environ["ROS_MCP_SPILL_DIR"] = old


if __name__ == "__main__":
    unittest.main()
