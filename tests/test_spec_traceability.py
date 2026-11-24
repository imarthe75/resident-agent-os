"""spec_traceability: cada requisito funcional de una especificación aprobada lo cita al menos una prueba."""
import unittest

from verifiers import checks as c
from tests.test_verifiers import tree

SPEC = ("# Spec: pedidos\n**Estado:** APROBADO\n\n| ID | Requisito | Criterio |\n|---|---|---|\n"
        "| RF-01 | CUANDO … | … |\n| RF-02 | SI … | … |\n| RNF-01 | Tiempo de respuesta | < 200 ms |\n")


def run(files, test):
    t, root = tree(files)
    test.addCleanup(t.cleanup)
    return c.spec_traceability(root)


class TestSpecTraceability(unittest.TestCase):
    def test_requirement_without_test_fails(self):
        r = run({"changes/2026-11-24-pedidos/spec.md": SPEC, "tests/test_pedidos.py": "def test_crear_RF01():\n    assert True\n"}, self)
        self.assertEqual((r.status, r.checked), (c.NO_CUMPLE, 2))
        self.assertEqual(len(r.detail), 1)
        self.assertIn("RF-02", r.detail[0])

    def test_all_cited_in_names_comments_and_tags(self):
        r = run({"docs/specs/pedidos/spec.md": SPEC,
                 "src/test/java/PedidoServiceTest.java": "class T { // RF-01\n void crear() {} }",
                 "e2e/pedidos.feature": "@RF-02\nEscenario: rechazo\n"}, self)
        self.assertEqual(r.status, c.CUMPLE)

    def test_similar_ids_do_not_count(self):
        r = run({"specs/s.md": SPEC.replace("RF-02", "RF-12"), "tests/test_a.py": "# RF-01 RF-1 RF-120\n"}, self)
        self.assertEqual(r.status, c.NO_CUMPLE)
        self.assertIn("RF-12", r.detail[0])

    def test_draft_specs_and_templates_are_skipped(self):
        draft = SPEC.replace("APROBADO", "BORRADOR")
        r = run({"changes/x/spec.md": draft, "changes/TEMPLATE-spec.md": SPEC}, self)
        self.assertEqual(r.status, c.NO_EVALUADO)

    def test_specs_without_any_test_fail(self):
        self.assertEqual(run({".agent/SPECS.md": SPEC}, self).status, c.NO_CUMPLE)


if __name__ == "__main__":
    unittest.main()
