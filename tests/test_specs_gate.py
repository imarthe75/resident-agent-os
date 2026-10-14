import tempfile
import unittest
from pathlib import Path

from agent.exceptions import SpecMissingError, SpecNotApprovedError
from agent.loop import ResidentAgentLoop
from agent.specs import parse_specs

SPECS = """# Specs
### [SPEC-1] Primera
- **Estado:** `APROBADO`
- Requisitos: x

### [SPEC-12] Doce
- **Estado:** `BORRADOR`

### [SPEC-3] Tres
- **Estado:** `APROBADO`
"""


class TestParse(unittest.TestCase):
    def test_ids_titles_and_own_status(self):
        s = parse_specs(SPECS)
        self.assertEqual(set(s), {"SPEC-1", "SPEC-12", "SPEC-3"})
        self.assertEqual(s["SPEC-1"]["status"], "APROBADO")
        self.assertEqual(s["SPEC-12"]["status"], "BORRADOR")
        self.assertEqual(s["SPEC-12"]["title"], "Doce")

    def test_shipped_specs_file_parses(self):
        txt = (Path(__file__).resolve().parents[1] / ".agent" / "SPECS.md").read_text(encoding="utf-8")
        self.assertEqual(parse_specs(txt)["EJEMPLO-001"]["status"], "APROBADO")


class TestGate(unittest.TestCase):
    def loop(self):
        d = tempfile.mkdtemp()
        (Path(d) / "SPECS.md").write_text(SPECS, encoding="utf-8")
        l = ResidentAgentLoop(agent_dir=d)
        l.load_context()
        return l

    def test_approved_spec_passes(self):
        self.loop().ensure_spec("SPEC-1")

    def test_prefix_is_not_a_match(self):
        with self.assertRaises(SpecMissingError):
            self.loop().ensure_spec("SPEC")                 # used to be "found" as a substring of SPEC-1

    def test_draft_spec_is_not_a_contract_even_if_other_specs_are_approved(self):
        with self.assertRaises(SpecNotApprovedError):
            self.loop().ensure_spec("SPEC-12")              # the file contains APROBADO elsewhere; that no longer counts

    def test_unknown_spec(self):
        with self.assertRaises(SpecMissingError):
            self.loop().ensure_spec("NOPE-9")


if __name__ == "__main__":
    unittest.main()
