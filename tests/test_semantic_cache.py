"""SemanticCache against a REAL Valkey -- but ONLY one you name explicitly for tests.

Safety (learned the hard way, 2026-10-14): these tests used to read VALKEY_HOST from the environment and call flushdb(). Inside a container whose
VALKEY_HOST points at a real service, that WIPED the real database. Now:
  * the tests run only if ROS_TEST_VALKEY_HOST is set (a different variable from the one the application uses; unset => skipped, and the skip says so);
  * they use database 15 and a unique key prefix per test, and delete ONLY the keys they created (SCAN by prefix). flushdb() is never called;
  * they refuse to run against a database that already holds keys outside their own prefix.
"""
import hashlib
import os
import unittest
import uuid

import redis

from memory import semantic_cache as sc

TEST_HOST = os.getenv("ROS_TEST_VALKEY_HOST")
TEST_PORT = int(os.getenv("ROS_TEST_VALKEY_PORT", "6379"))
TEST_DB = 15


def _client():
    if not TEST_HOST:
        return None
    try:
        return sc.SemanticCache(host=TEST_HOST, port=TEST_PORT, db=TEST_DB)
    except redis.exceptions.ConnectionError:
        return None


@unittest.skipIf(_client() is None, "ROS_TEST_VALKEY_HOST not set or unreachable: cache tests NOT executed")
class TestCache(unittest.TestCase):
    def setUp(self):
        self.c = _client()
        self.prefix = f"test-{uuid.uuid4().hex[:10]}:"
        foreign = [k for k in self.c.client.scan_iter(count=200) if not k.startswith("test-")]
        if foreign:
            self.skipTest(f"database {TEST_DB} on the test host holds keys that are not tests' own ({foreign[:3]}...): refusing to touch it")
        self._saved = (sc.KEY_PREFIX, sc.INDEX_KEY)
        sc.KEY_PREFIX, sc.INDEX_KEY = self.prefix + "query:", self.prefix + "index"
        self.addCleanup(self._cleanup)

    def _cleanup(self):
        sc.KEY_PREFIX, sc.INDEX_KEY = self._saved
        keys = list(self.c.client.scan_iter(match=self.prefix + "*", count=500))
        if keys:
            self.c.client.delete(*keys)

    def test_key_is_stable_across_processes(self):
        # sha256, not hash(): the same text must give the same key in a brand-new interpreter
        import subprocess, sys
        out = subprocess.run([sys.executable, "-c", "from memory.semantic_cache import cache_key; print(cache_key('Hola  Mundo '))"],
                             capture_output=True, text=True, cwd=os.getcwd(), env={**os.environ, "PYTHONHASHSEED": "random"})
        self.assertEqual(out.stdout.strip(), "cache:query:" + hashlib.sha256(b"hola mundo").hexdigest())      # default prefix in a fresh interpreter

    def test_exact_hit_ignores_case_and_whitespace(self):
        self.c.set("¿Qué es   XSS?", None, "respuesta")
        self.assertEqual(self.c.get_exact("¿qué es xss?"), "respuesta")
        self.assertIsNone(self.c.get_exact("¿qué es sqli?"))

    def test_semantic_lookup_is_opt_in(self):
        self.c.set("q1", [1.0, 0.0, 0.0], "A")
        self.assertEqual(self.c.get([0.99, 0.05, 0.0]), "A")                          # explicit default of get(): semantic
        self.assertIsNone(self.c.get([0.99, 0.05, 0.0], allow_semantic=False))        # the loop's default
        self.assertIsNone(self.c.get([0.0, 1.0, 0.0]))                                # below threshold

    def test_zero_embedding_is_never_stored_or_matched(self):
        self.c.set("q0", [0.0, 0.0, 0.0], "Z")
        self.assertEqual(self.c.get_exact("q0"), "Z")                                  # exact entry is still valid
        self.assertIsNone(self.c.get([0.0, 0.0, 0.0]))
        self.assertNotIn("embedding", self.c.client.hgetall(sc.cache_key("q0")))

    def test_index_is_bounded_and_dangling_members_are_dropped(self):
        old = sc.MAX_ENTRIES
        sc.MAX_ENTRIES = 5
        try:
            for i in range(12):
                self.c.set(f"query {i}", [1.0, float(i), 0.0], f"r{i}")
            self.assertEqual(self.c.size(), 5)
            self.assertIsNone(self.c.get_exact("query 0"))     # evicted from the index...
            self.assertEqual(self.c.get_exact("query 11"), "r11")
        finally:
            sc.MAX_ENTRIES = old
        self.c.client.delete(sc.cache_key("query 11"))          # an entry that expired but is still in the index
        self.c.get([1.0, 11.0, 0.0])
        self.assertEqual(self.c.size(), 4)

    def test_entries_expire(self):
        self.c.set("ttl", None, "x")
        self.assertGreater(self.c.client.ttl(sc.cache_key("ttl")), 0)


if __name__ == "__main__":
    unittest.main()
