"""Unit tests for cross-platform Docker sandbox test runner (`scripts/sandboxed_tests.py`)."""
import io
import json
import unittest
from contextlib import redirect_stdout
from pathlib import Path

from scripts import sandboxed_tests


class TestSandboxedTests(unittest.TestCase):
    def test_build_docker_cmd_enforces_network_none_readonly_and_scrubs_secrets(self):
        fake_env = {
            "POSTGRES_PASSWORD": "super-secret-prod-password",
            "AWS_SECRET_ACCESS_KEY": "AKIA_FAKE_SECRET",
            "VALKEY_HOST": "10.0.0.5",
            "ROS_TEST_MODE": "strict",
        }
        cmd = sandboxed_tests.build_docker_cmd(
            repo_root=Path("/tmp/sample-repo"),
            image="python:3.12-slim",
            inner_cmd=["python3", "-m", "pytest", "tests"],
            env=fake_env,
            docker_bin="docker",
        )
        joined = " ".join(cmd)
        self.assertIn("--network none", joined)
        self.assertIn("--read-only", joined)
        self.assertIn(":/work:ro", joined)
        self.assertIn("ROS_SANDBOXED=1", cmd)
        self.assertIn("ROS_TEST_MODE=strict", cmd)
        self.assertNotIn("super-secret-prod-password", joined)
        self.assertNotIn("AKIA_FAKE_SECRET", joined)
        self.assertNotIn("VALKEY_HOST=10.0.0.5", joined)

    def test_fail_closed_when_docker_missing(self):
        rc = sandboxed_tests.run_sandboxed(docker_bin="")
        self.assertEqual(rc, 2)

    def test_dry_run_emits_pytest_and_optional_node_commands(self):
        buf = io.StringIO()
        with redirect_stdout(buf):
            rc = sandboxed_tests.run_sandboxed(
                py_image="python:3.12-slim",
                node_image="node:26-alpine",
                dry_run=True,
                docker_bin="docker",
                env={"ROS_TEST_TAG": "ci"},
            )
        self.assertEqual(rc, 0)
        data = json.loads(buf.getvalue())
        self.assertIn("pytest", data)
        self.assertIn("node", data)
        self.assertIn("--network", data["pytest"])
        self.assertIn("none", data["node"])


if __name__ == "__main__":
    unittest.main()
