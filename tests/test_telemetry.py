"""Tests for structured JSON telemetry, redaction, signal computation, thresholds, and loop instrumentation."""

import io
import json
import logging
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from pydantic import BaseModel

from agent import ResidentAgentLoop, Skill
from agent.telemetry import (
    JsonFormatter,
    TelemetryWriter,
    evaluate_thresholds,
    load_thresholds,
    read_events,
    redact,
    summarize_events,
)
from scripts import check_thresholds as ct


class _In(BaseModel):
    x: int


class _Out(BaseModel):
    y: int


class _DoubleSkill(Skill):
    name = "double"
    description = "Doubles input"
    input_schema = _In
    output_schema = _Out

    def execute(self, validated_input: _In) -> dict:
        return {"y": validated_input.x * 2, "_usage": {"tokens_in": 40, "tokens_out": 10, "usd": 0.002}}


class _FailingSkill(Skill):
    name = "failing"
    description = "Always raises"
    input_schema = _In
    output_schema = _Out

    def execute(self, validated_input: _In) -> dict:
        raise RuntimeError("boom")


class TestTelemetry(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.agent_dir = self.root / ".agent"
        self.agent_dir.mkdir()
        (self.agent_dir / "SPECS.md").write_text("### [SPEC-1] Test\n- **Estado:** `APROBADO`\n", encoding="utf-8")
        (self.agent_dir / "heuristics.json").write_text('{"rules": []}', encoding="utf-8")

    def test_redact_masks_keys_and_token_patterns(self):
        cleaned = redact({
            "password": "s3cr3t",
            "api_key": "abc",
            "note": "Authorization: Bearer abcdefghijklmnop12345 and postgresql://admin:pw@localhost:5432/db",
            "safe": "hello",
        })
        self.assertEqual(cleaned["password"], "[REDACTED]")
        self.assertEqual(cleaned["api_key"], "[REDACTED]")
        self.assertNotIn("abcdefghijklmnop12345", cleaned["note"])
        self.assertNotIn(":pw@", cleaned["note"])
        self.assertEqual(cleaned["safe"], "hello")

    def test_json_formatter_emits_structured_json_with_correlation(self):
        stream = io.StringIO()
        handler = logging.StreamHandler(stream)
        handler.setFormatter(JsonFormatter())
        log = logging.getLogger("test.structured")
        log.handlers = [handler]
        log.setLevel(logging.INFO)
        log.propagate = False
        log.info("token Bearer secretvalue123456789", extra={"correlation_id": "req-42", "phase": "execute"})
        payload = json.loads(stream.getvalue().strip())
        self.assertEqual(payload["service"], "resident-agent-os")
        self.assertEqual(payload["correlation_id"], "req-42")
        self.assertEqual(payload["phase"], "execute")
        self.assertNotIn("secretvalue123456789", payload["message"])

    def test_loop_emits_real_jsonl_events_and_phase_trace(self):
        loop = ResidentAgentLoop(agent_dir=self.agent_dir, correlation_id="corr-1")
        loop.load_context()
        loop.ensure_spec("SPEC-1")
        skill = _DoubleSkill()
        loop.plan_tasks([skill], [{"x": 5}])
        out = loop.execute(skill, {"x": 5})
        loop.verify(skill, out)
        loop.update_state({"ok": True})
        loop.close()

        events = read_events(self.agent_dir / "telemetry" / "events.jsonl")
        self.assertGreaterEqual(len(events), 6)
        self.assertTrue(all(ev["correlation_id"] == "corr-1" for ev in events))
        summary = summarize_events(events)
        self.assertEqual(summary["errors"], 0)
        self.assertEqual(summary["total_tokens_in"], 40)
        self.assertEqual(summary["total_tokens_out"], 10)
        self.assertAlmostEqual(summary["total_cost_usd"], 0.002, places=6)
        self.assertIsNotNone(summary["latency_p95_ms"])
        trace_map = {t["step"]: t["status"] for t in summary["phase_trace"]}
        self.assertEqual(trace_map["execute"], "done")
        self.assertEqual(trace_map["verify"], "done")
        self.assertEqual(trace_map["boot"], "pending")

    def test_thresholds_flag_breaches_and_mark_unmonitored(self):
        writer = TelemetryWriter(self.agent_dir / "telemetry" / "events.jsonl", session_id="s1")
        writer.emit("skill_execute", phase="execute", skill="a", outcome="ok", duration_ms=100, cost_usd=0.5)
        writer.emit("skill_execute", phase="execute", skill="b", outcome="error", duration_ms=9000, cost_usd=0.5)

        summary = summarize_events(read_events(writer.path))
        ev = evaluate_thresholds(summary, {"latency_p95_ms": 5000, "error_rate": 0.1, "cost_per_run_usd": 0.25})
        self.assertEqual(ev["status"], "ALERTA")
        self.assertEqual(len(ev["breaches"]), 3)
        self.assertEqual(ev["checks"]["abstention_rate"]["status"], "NO_MONITOREADA")

        th_file = self.agent_dir / "thresholds.json"
        th_file.write_text(json.dumps({"signals": {"latency_p95_ms": 5000}}), encoding="utf-8")
        self.assertEqual(load_thresholds(th_file), {"latency_p95_ms": 5000.0})
        self.assertEqual(ct.main(["--agent-dir", str(self.agent_dir), "--json"]), 1)

        th_file.write_text(json.dumps({"signals": {"latency_p95_ms": 20000, "error_rate": 1.0}}), encoding="utf-8")
        self.assertEqual(ct.main(["--agent-dir", str(self.agent_dir), "--json"]), 0)

    def test_loop_records_error_events_on_skill_failure(self):
        loop = ResidentAgentLoop(agent_dir=self.agent_dir)
        with self.assertRaises(RuntimeError):
            loop.execute(_FailingSkill(), {"x": 1})
        events = read_events(self.agent_dir / "telemetry" / "events.jsonl")
        self.assertEqual(events[-1]["outcome"], "error")
        self.assertEqual(events[-1]["retries"], 1)

    def test_otlp_http_exporter_posts_valid_resource_logs(self):
        import threading
        from http.server import BaseHTTPRequestHandler, HTTPServer
        from agent.telemetry import export_event_otlp

        received = []

        class _Handler(BaseHTTPRequestHandler):
            def do_POST(self):
                length = int(self.headers.get("Content-Length", "0"))
                body = self.rfile.read(length).decode("utf-8")
                received.append(json.loads(body))
                self.send_response(200)
                self.end_headers()

            def log_message(self, format, *args):
                return

        srv = HTTPServer(("127.0.0.1", 0), _Handler)
        port = srv.server_address[1]
        t = threading.Thread(target=srv.serve_forever, daemon=True)
        t.start()
        try:
            url = f"http://127.0.0.1:{port}/v1/logs"
            writer = TelemetryWriter(self.agent_dir / "telemetry" / "events.jsonl", session_id="s-otlp", project_id="proj-z")
            prev = os.environ.get("ROS_OTLP_ENDPOINT")
            os.environ["ROS_OTLP_ENDPOINT"] = url
            try:
                writer.emit("skill_execute", phase="execute", outcome="ok", duration_ms=42.5, tokens_saved_est=120)
            finally:
                if prev is None:
                    os.environ.pop("ROS_OTLP_ENDPOINT", None)
                else:
                    os.environ["ROS_OTLP_ENDPOINT"] = prev

            self.assertEqual(len(received), 1)
            res_logs = received[0]["resourceLogs"][0]
            log_rec = res_logs["scopeLogs"][0]["logRecords"][0]
            self.assertEqual(log_rec["body"]["stringValue"], "skill_execute")
            # Reject invalid non-http(s) scheme
            self.assertFalse(export_event_otlp({"event": "x"}, endpoint="file:///etc/passwd"))
        finally:
            srv.shutdown()
            srv.server_close()

    def test_statusline_and_filter_benchmark(self):
        import shutil
        import subprocess
        from scripts import benchmark_filters

        writer = TelemetryWriter(self.agent_dir / "telemetry" / "events.jsonl", session_id="s-st", project_id="proj-st")
        writer.emit("compress_output", phase="post_tool_use", outcome="ok", chars_saved=8000, tokens_saved_est=2000)
        statusline_sh = Path(__file__).resolve().parents[1] / "scripts" / "hooks" / "statusline.sh"
        env = {**os.environ, "ROS_TELEMETRY_PATH": str(writer.path), "AGENT_DIR": str(self.agent_dir)}
        proc = subprocess.run(["bash", str(statusline_sh)], capture_output=True, text=True, check=True, env=env)
        self.assertIn("[ROS v1.0.0 | proj-st |", proc.stdout)
        self.assertIn("saved:2.0k tok", proc.stdout)

        if shutil.which("node") or os.getenv("ROS_NODE_BIN"):
            report = benchmark_filters.run_benchmark()
            self.assertTrue(report["ok"])
            self.assertTrue(report["all_markers_preserved"])
            self.assertGreater(report["total_reduction_pct"], 50.0)


if __name__ == "__main__":
    unittest.main()
