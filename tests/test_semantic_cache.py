"""SemanticCache against a REAL Valkey (set VALKEY_HOST / VALKEY_PORT; the tests skip, and say so, if none answers)."""
import os
import unittest

import redis

from memory import semantic_cache as sc


def _client():
    try:
        c = sc.SemanticCache(host=os.getenv("VALKEY_HOST", "localhost"), port=int(os.getenv("VALKEY_PORT", "6379")))
        return c
    except redis.exceptions.ConnectionError:
        return None


@unittest.skipIf(_client() is None, "no Valkey reachable (VALKEY_HOST): cache tests NOT executed")
class TestCache(unittest.TestCase):
    def setUp(self):
        self.c = _client()
        self.c.client.flushdb()

    def test_key_is_stable_across_processes(self):
        # sha256, not hash(): the same text must give the same key in a brand-new interpreter
        import subprocess, sys
        out = subprocess.run([sys.executable, "-c", "from memory.semantic_cache import cache_key; print(cache_key('Hola  Mundo '))"],
                             capture_output=True, text=True, cwd=os.getcwd(), env={**os.environ, "PYTHONHASHSEED": "random"})
        self.assertEqual(out.stdout.strip(), sc.cache_key("hola mundo"))

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
