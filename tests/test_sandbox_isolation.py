"""Checks that the sandbox used by scripts/sandboxed-tests.sh really isolates the tests (ADR-0004, C1).

These tests run only when ROS_SANDBOXED=1, which the wrapper sets. Outside the sandbox they are skipped and say so. If someone sets
ROS_SANDBOXED=1 without the sandbox, they fail: that is the point, the variable must never claim an isolation that is not there.
"""
import os
import socket
import unittest
from pathlib import Path

SANDBOXED = os.environ.get("ROS_SANDBOXED") == "1"

# Names of variables an application of this kind reads to reach real services. None may cross into the sandbox.
PRODUCTION_VARS = ("VALKEY_HOST", "REDIS_URL", "DATABASE_URL", "DB_HOST", "DB_PASSWORD", "PGPASSWORD", "VAULT_ADDR", "VAULT_TOKEN",
                   "BAO_TOKEN", "GITLAB_TOKEN", "GITHUB_TOKEN", "AWS_SECRET_ACCESS_KEY", "OPENAI_API_KEY", "ANTHROPIC_API_KEY")


@unittest.skipUnless(SANDBOXED, "ROS_SANDBOXED != 1: isolation checks NOT executed (run scripts/sandboxed-tests.sh)")
class SandboxIsolation(unittest.TestCase):
    def _connect(self, host, port):
        # A plain socket does not use the sandbox's HTTP proxy, so it must not reach anything at all.
        with socket.create_connection((host, port), timeout=3):
            pass

    def test_direct_connection_to_an_ip_fails(self):
        with self.assertRaises(OSError):
            self._connect("1.1.1.1", 443)

    def test_direct_connection_to_a_hostname_fails(self):
        with self.assertRaises(OSError):
            self._connect("example.com", 443)

    def test_proxy_refuses_a_destination_outside_the_allowlist(self):
        import urllib.error
        import urllib.request
        self.assertTrue(os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy"), "srt did not set its proxy")
        with self.assertRaises((urllib.error.URLError, OSError)):
            urllib.request.urlopen("https://example.com", timeout=5)

    def test_no_production_variable_is_inherited(self):
        leaked = [v for v in PRODUCTION_VARS if v in os.environ]
        self.assertEqual(leaked, [], f"variables inherited into the sandbox: {leaked}")

    def test_writing_outside_the_repository_and_tmp_fails(self):
        target = Path.home() / ".ros-sandbox-write-probe"
        with self.assertRaises(OSError):
            target.write_text("x")
        self.assertFalse(target.exists())


if __name__ == "__main__":
    unittest.main()
