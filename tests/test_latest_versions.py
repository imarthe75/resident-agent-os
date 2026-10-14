"""scripts/latest_versions.py and the versions_current verifier.
Parsers are tested with the SHAPE of the real answers (trimmed copies of what npm, endoflife.date and Adoptium returned on 2026-10-13); the network
layer is exercised separately against a local server. The live end-to-end run is reported in the ADR, not asserted here (the world moves on)."""
import importlib.util
import json
import tempfile
import threading
import unittest
from datetime import date
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

from verifiers import checks as c

ROOT = Path(__file__).resolve().parents[1]
_spec = importlib.util.spec_from_file_location("latest_versions", ROOT / "scripts" / "latest_versions.py")
lv = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(lv)

TODAY = date(2026, 10, 13)
NODE = [{"cycle": "26", "lts": "2026-10-28", "eol": "2029-04-30", "latest": "26.11.1"},
        {"cycle": "25", "lts": False, "eol": "2026-06-01", "latest": "25.9.0"},
        {"cycle": "24", "lts": "2025-10-28", "eol": "2028-04-30", "latest": "24.21.0"},
        {"cycle": "22", "lts": "2024-10-29", "eol": "2027-04-30", "latest": "22.22.2"}]
SPRING = [{"cycle": "4.1", "eol": "2027-07-31", "latest": "4.1.1", "lts": False}, {"cycle": "3.5", "eol": "2026-06-30", "latest": "3.5.9", "lts": False}]
ADOPTIUM = {"available_lts_releases": [8, 11, 17, 21, 25], "most_recent_lts": 25, "most_recent_feature_release": 27}
NPM = {"name": "@angular/core", "version": "22.2.2"}


class TestParsers(unittest.TestCase):
    def test_lts_is_lts_today_not_in_the_future(self):
        self.assertEqual(lv.parse_endoflife(NODE, "lts", TODAY), "24.21.0")           # 26 becomes LTS on 2026-10-28: not yet
        self.assertEqual(lv.parse_endoflife(NODE, "lts", date(2026, 11, 1)), "26.11.1")
        self.assertEqual(lv.parse_endoflife(NODE, "latest", TODAY), "26.11.1")

    def test_end_of_life_cycles_are_skipped(self):
        self.assertEqual(lv.parse_endoflife(SPRING, "latest", TODAY), "4.1.1")
        eol_only = [{"cycle": "1", "eol": "2020-01-01", "latest": "1.9"}]
        with self.assertRaises(lv.ResolveError):
            lv.parse_endoflife(eol_only, "latest", TODAY)

    def test_bad_inputs_raise(self):
        for bad in ([], None, {"x": 1}):
            with self.assertRaises(lv.ResolveError):
                lv.parse_endoflife(bad, "latest", TODAY)
        with self.assertRaises(lv.ResolveError):
            lv.parse_endoflife(NODE, "newest", TODAY)

    def test_adoptium_and_npm(self):
        self.assertEqual(lv.parse_adoptium(ADOPTIUM, "lts"), "25")
        self.assertEqual(lv.parse_adoptium(ADOPTIUM, "latest"), "27")
        with self.assertRaises(lv.ResolveError):
            lv.parse_adoptium({}, "lts")
        self.assertEqual(lv.parse_npm(NPM), "22.2.2")
        for v in ("23.0.0-rc.1", None, ""):
            with self.assertRaises(lv.ResolveError):
                lv.parse_npm({"version": v})


TEMURIN = [{"cycle": "27", "lts": False, "eol": "2027-03-23"}, {"cycle": "26", "lts": False, "eol": "2026-09-22"},
           {"cycle": "25", "lts": True, "eol": "2031-09-30"}, {"cycle": "24", "lts": False, "eol": "2025-09-22"}]
SPRING_41 = [{"cycle": "4.1", "supportedJavaVersions": "17 - 26", "eol": "2027-07-31", "latest": "4.1.1"},
             {"cycle": "4.0", "supportedJavaVersions": "17 - 25", "eol": "2026-12-31", "latest": "4.0.8"}]


class TestJavaCompatible(unittest.TestCase):
    def test_final_java_that_spring_does_not_support_is_not_chosen_and_says_why(self):
        v, extra = lv.parse_java_compatible(SPRING_41, TEMURIN, ADOPTIUM, TODAY)
        self.assertEqual(v, "25")                                  # 27 is GA but above Spring's ceiling 26; 26 is past end of life
        self.assertEqual((extra["spring_boot_java_ceiling"], extra["latest_ga_java"]), (26, 27))
        self.assertIn("Java 27 es versión final pero no se usa", extra["note"])
        self.assertIn("hasta Java 26", extra["note"])

    def test_it_switches_by_itself_when_spring_adds_support(self):
        spring = [{"cycle": "4.2", "supportedJavaVersions": "17 - 27", "eol": "2028-01-01", "latest": "4.2.0"}]
        v, extra = lv.parse_java_compatible(spring, TEMURIN, ADOPTIUM, TODAY)
        self.assertEqual(v, "27")
        self.assertNotIn("note", extra)

    def test_a_non_lts_java_is_fine_while_it_is_still_supported(self):
        v, _ = lv.parse_java_compatible(SPRING_41, TEMURIN, ADOPTIUM, date(2026, 9, 1))      # 26 not yet EOL on that day
        self.assertEqual(v, "26")

    def test_unreadable_inputs_raise(self):
        for sb, tm in (([], TEMURIN), ([{"cycle": "4.1", "eol": "2027-07-31"}], TEMURIN), (SPRING_41, [])):
            with self.assertRaises(lv.ResolveError):
                lv.parse_java_compatible(sb, tm, ADOPTIUM, TODAY)

    def test_resolve_tool_wires_the_compatible_channel(self):
        def fetch(url, timeout=0):
            return ADOPTIUM if "adoptium" in url else TEMURIN if "temurin" in url else SPRING_41
        r = lv.resolve_tool("java", {"source": "adoptium", "channel": "compatible", "with": "spring-boot"}, fetch, TODAY)
        self.assertEqual((r["version"], r["major"], r["latest_ga_java"]), ("25", 25, 27))
        bad = lv.resolve_tool("java", {"source": "adoptium", "channel": "compatible"}, fetch, TODAY)
        self.assertIsNone(bad["version"])


class TestNpmCompatible(unittest.TestCase):
    VERSIONS = {v: {} for v in ("5.9.3", "6.0.2", "6.0.3", "7.0.0-rc.1", "7.0.2", "6.1.0-beta")}

    def test_range_checks(self):
        r = ">=4.8.4 <6.1.0"
        for v, ok in (("5.9.3", True), ("6.0.3", True), ("6.1.0", False), ("7.0.2", False), ("4.8.3", False), ("6.0.0-rc.1", False)):
            self.assertEqual(lv.satisfies(v, r), ok, v)
        self.assertTrue(lv.satisfies("22.22.3", "^22.22.3 || >=26.0.0".replace("^", ">=")))
        self.assertTrue(lv.satisfies("26.1.0", ">=22.0.0 <23.0.0 || >=26.0.0"))
        with self.assertRaises(lv.ResolveError):
            lv.satisfies("1.2.3", "^1.0.0")                       # unsupported syntax is an error, not a guess

    def test_picks_the_highest_stable_inside_the_range_and_explains(self):
        v, extra = lv.parse_npm_compatible(self.VERSIONS, ">=4.8.4 <6.1.0", "7.0.2")
        self.assertEqual(v, "6.0.3")                              # not the pre-release 6.1.0-beta, not 7.x
        self.assertIn("7.0.2 es la última publicada pero no se usa", extra["note"])

    def test_no_note_when_the_latest_is_inside_the_range(self):
        v, extra = lv.parse_npm_compatible(self.VERSIONS, ">=4.8.4", "7.0.2")
        self.assertEqual(v, "7.0.2")
        self.assertNotIn("note", extra)

    def test_nothing_in_range_raises(self):
        with self.assertRaises(lv.ResolveError):
            lv.parse_npm_compatible(self.VERSIONS, ">=9.0.0", "7.0.2")

    def test_resolve_tool_wiring_and_missing_pieces(self):
        def fetch(url, timeout=0):
            if url.endswith("/typescript-eslint/latest"):
                return {"version": "8.71.2", "peerDependencies": {"typescript": ">=4.8.4 <6.1.0"}}
            if url.endswith("/typescript"):
                return {"dist-tags": {"latest": "7.0.2"}, "versions": self.VERSIONS}
            raise lv.ResolveError("unexpected " + url)
        spec = {"source": "npm", "package": "typescript", "channel": "compatible", "with": "typescript-eslint"}
        r = lv.resolve_tool("typescript", spec, fetch, TODAY)
        self.assertEqual((r["version"], r["major"], r["limited_by"], r["latest_published"]), ("6.0.3", 6, "typescript-eslint", "7.0.2"))
        self.assertIsNone(lv.resolve_tool("typescript", {**spec, "with": None}, fetch, TODAY)["version"])
        self.assertIsNone(lv.resolve_tool("typescript", {**spec, "package": "react"}, fetch, TODAY)["version"])   # host declares no peer range for it


class TestResolve(unittest.TestCase):
    POLICY = {"tools": {"angular": {"source": "npm", "package": "@angular/core", "channel": "latest"},
                        "node": {"source": "endoflife", "product": "nodejs", "channel": "lts"},
                        "java": {"source": "adoptium", "channel": "lts"},
                        "ghost": {"source": "nowhere", "channel": "latest"}}}

    @staticmethod
    def fetch(url, timeout=0):
        if "registry.npmjs.org" in url:
            return NPM
        if "nodejs" in url:
            return NODE
        if "adoptium" in url:
            return ADOPTIUM
        raise lv.ResolveError("unreachable")

    def test_resolution_and_failures_are_explicit(self):
        r = lv.resolve_all(self.POLICY, fetch=self.fetch, today=TODAY)
        self.assertEqual((r["angular"]["version"], r["angular"]["major"]), ("22.2.2", 22))
        self.assertEqual(r["node"]["version"], "24.21.0")
        self.assertEqual(r["java"]["version"], "25")
        self.assertIsNone(r["ghost"]["version"])                       # unknown source: unresolved, never a default
        self.assertIn("unknown source", r["ghost"]["error"])

    def test_network_failure_gives_none_not_a_fallback_version(self):
        def down(url, timeout=0):
            raise lv.ResolveError("no network")
        r = lv.resolve_all(self.POLICY, ["angular"], fetch=down)
        self.assertIsNone(r["angular"]["version"])
        self.assertEqual(r["angular"]["error"], "no network")

    def test_unknown_tool_requested(self):
        with self.assertRaises(SystemExit):
            lv.resolve_all(self.POLICY, ["cobol"], fetch=self.fetch)

    def test_compare_lock(self):
        now = lv.resolve_all(self.POLICY, ["angular", "node"], fetch=self.fetch, today=TODAY)
        lock = {"tools": {"angular": {"version": "21.2.25"}, "node": {"version": "24.20.0"}}}
        self.assertEqual(sorted(lv.compare_lock(lock, now)), [("angular", "21.2.25", "22.2.2", "major"), ("node", "24.20.0", "24.21.0", "minor")])
        self.assertEqual(lv.compare_lock({"tools": {"angular": {"version": "22.2.2"}, "node": {"version": "24.21.0"}}}, now), [])

    def test_shipped_policy_is_valid(self):
        pol = json.loads((ROOT / ".agent" / "versions-policy.json").read_text(encoding="utf-8"))
        for name, spec in pol["tools"].items():
            self.assertIn(spec["source"], ("npm", "endoflife", "adoptium"), name)
            self.assertIn(spec["channel"], ("latest", "lts", "compatible"), name)

    def test_http_layer_against_a_local_server(self):
        class H(BaseHTTPRequestHandler):
            def do_GET(self):
                body = b"not json" if self.path == "/bad" else json.dumps(NPM).encode()
                self.send_response(200)
                self.end_headers()
                self.wfile.write(body)

            def log_message(self, *a):
                pass
        srv = HTTPServer(("127.0.0.1", 0), H)
        threading.Thread(target=srv.serve_forever, daemon=True).start()
        try:
            self.assertEqual(lv.http_json(f"http://127.0.0.1:{srv.server_port}/ok")["version"], "22.2.2")
            with self.assertRaises(lv.ResolveError):
                lv.http_json(f"http://127.0.0.1:{srv.server_port}/bad")
        finally:
            srv.shutdown()
            srv.server_close()
        with self.assertRaises(lv.ResolveError):
            lv.http_json("http://127.0.0.1:9/none", timeout=1)


CUR = {"angular": {"version": "22.2.2", "channel": "latest"}, "react": {"version": "19.3.0", "channel": "latest"},
       "typescript": {"version": "7.0.2", "channel": "latest"}, "node": {"version": "24.21.0", "channel": "lts"},
       "java": {"version": "25", "channel": "lts"}, "spring-boot": {"version": "4.1.1", "channel": "latest"},
       "python": {"version": "3.15.0", "channel": "latest"}, "postgresql": {"version": "18.6", "channel": "latest"},
       "valkey": {"version": "9.1.2", "channel": "latest"}}


def tree(files):
    t = tempfile.TemporaryDirectory()
    for rel, text in files.items():
        p = Path(t.name) / rel
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(text, encoding="utf-8")
    return t, Path(t.name)


class TestVerifier(unittest.TestCase):
    def run_v(self, files, cur=CUR):
        t, root = tree(files)
        self.addCleanup(t.cleanup)
        return c.versions_current(root, cur)

    def test_current_project_passes(self):
        r = self.run_v({"web/package.json": json.dumps({"dependencies": {"@angular/core": "^22.1.0"}}),
                        "api/pom.xml": "<project><parent><artifactId>spring-boot-starter-parent</artifactId><version>4.1.1</version></parent>"
                                       "<properties><java.version>25</java.version></properties></project>",
                        "Dockerfile": "FROM node:24-alpine\n", "docker-compose.yml": "services:\n  c:\n    image: valkey/valkey:9.1\n  d:\n    image: pgvector/pgvector:pg18\n"})
        self.assertEqual((r.status, r.detail), (c.CUMPLE, []))
        self.assertEqual(r.checked, 6)

    def test_outdated_things_are_listed(self):
        r = self.run_v({"package.json": json.dumps({"dependencies": {"@angular/core": "~20.3.0"}, "devDependencies": {"typescript": "5.9.2"}}),
                        "pom.xml": "<project><parent><artifactId>spring-boot-starter-parent</artifactId><version>3.5.9</version></parent>"
                                   "<properties><java.version>17</java.version></properties></project>",
                        "Dockerfile": "FROM python:3.12-slim\nFROM node:20\n",
                        "docker-compose.yml": "services:\n  d:\n    image: postgres:15\n  c:\n    image: valkey/valkey:8\n"})
        self.assertEqual(r.status, c.NO_CUMPLE)
        text = "\n".join(r.detail)
        for expected in ("@angular/core 20.3.0", "typescript 5.9.2", "Spring Boot 3.5.9", "Java 17", "python:3.12", "node (imagen) 20", "postgres (imagen) 15", "valkey (imagen) 8"):
            self.assertIn(expected, text)

    def test_unresolvable_current_version_is_never_assumed_current(self):
        none = {k: {"version": None} for k in CUR}
        r = self.run_v({"package.json": json.dumps({"dependencies": {"@angular/core": "^22.0.0"}})}, none)
        self.assertEqual(r.status, c.NO_EVALUADO)
        self.assertIn("sin red", " ".join(r.detail))

    def test_nothing_comparable_is_not_evaluated(self):
        self.assertEqual(self.run_v({"README.md": "x"}).status, c.NO_EVALUADO)
        self.assertEqual(self.run_v({"Dockerfile": "FROM scratch\nFROM ${BASE}\n"}).status, c.NO_EVALUADO)

    def test_registered(self):
        self.assertIn("versions_current", c.REGISTRY)


if __name__ == "__main__":
    unittest.main()
