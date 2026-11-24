"""observability_min: health check e id de correlación en backends Spring Boot, FastAPI y Node."""
import json
import unittest

from verifiers import checks as c
from tests.test_verifiers import tree


def run(files, test):
    t, root = tree(files)
    test.addCleanup(t.cleanup)
    return c.observability_min(root)


GRADLE = "plugins { id 'org.springframework.boot' version '4.0.1' }\ndependencies {\n%s\n}\n"


class TestObservabilityMin(unittest.TestCase):
    def test_spring_without_health_nor_correlation_fails(self):
        r = run({"build.gradle": GRADLE % "implementation 'org.springframework.boot:spring-boot-starter-web'"}, self)
        self.assertEqual(r.status, c.NO_CUMPLE)
        self.assertEqual(len(r.detail), 2)

    def test_spring_with_actuator_and_tracing_passes(self):
        deps = "implementation 'org.springframework.boot:spring-boot-starter-actuator'\nimplementation 'io.micrometer:micrometer-tracing-bridge-otel'"
        self.assertEqual(run({"build.gradle": GRADLE % deps}, self).status, c.CUMPLE)

    def test_spring_with_own_health_route_and_mdc_filter_passes(self):
        r = run({"pom.xml": "<parent><artifactId>spring-boot-starter-parent</artifactId></parent>",
                 "src/main/java/HealthController.java": '@GetMapping("/api/health") public String h() { return "ok"; }',
                 "src/main/java/CorrelationFilter.java": 'MDC.put("requestId", request.getHeader("X-Request-Id"));'}, self)
        self.assertEqual(r.status, c.CUMPLE)

    def test_fastapi_and_node(self):
        py = {"app/main.py": "app = FastAPI()\n@app.get('/health')\ndef h():\n    return {}\n"}
        r = run(py, self)
        self.assertEqual(r.status, c.NO_CUMPLE)
        self.assertIn("correlación", r.detail[0])
        node = {"package.json": json.dumps({"dependencies": {"express": "^5.0.0", "pino-http": "^10"}}),
                "src/app.js": "app.get('/healthz', (q, s) => s.send('ok'));\napp.use(pinoHttp({ genReqId: (req) => req.headers['x-request-id'] }));\n"}
        self.assertEqual(run(node, self).status, c.CUMPLE)

    def test_frontend_or_library_is_not_evaluated(self):
        r = run({"package.json": json.dumps({"dependencies": {"@angular/core": "^21.0.0"}})}, self)
        self.assertEqual(r.status, c.NO_EVALUADO)


if __name__ == "__main__":
    unittest.main()
