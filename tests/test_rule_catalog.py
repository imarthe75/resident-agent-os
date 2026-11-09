"""The developer rule catalogue (skills/prevencion-hallazgos-seguridad-calidad) stays consistent with the skills that cite it."""
import glob
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKILL = ROOT / "skills" / "prevencion-hallazgos-seguridad-calidad"


def catalog():
    text = (SKILL / "references" / "catalogo-reglas.md").read_text(encoding="utf-8")
    toks = set(re.findall(r"`([^`]+)`", text))
    prefixes = [t[:-1].replace("<criterio>", "") for t in toks if t.endswith("*")]
    return text, toks, prefixes


class TestRuleCatalog(unittest.TestCase):
    def test_skills_cited_by_the_catalogue_exist(self):
        text, _, _ = catalog()
        cited = set(re.findall(r"\| ([a-z0-9-]+) \|\s*$", text, re.M))
        self.assertTrue(cited)
        self.assertEqual(sorted(s for s in cited if not (ROOT / "skills" / s).is_dir()), [])

    def test_rules_a_skill_claims_to_prevent_are_in_the_catalogue(self):
        _, toks, prefixes = catalog()
        bad = []
        for p in glob.glob(str(ROOT / "skills" / "*" / "SKILL.md")):
            parts = Path(p).read_text(encoding="utf-8").split("## Reglas del escáner que esta skill evita", 1)
            if len(parts) < 2:
                continue
            for rule in re.findall(r"`([A-Z][A-Z0-9<>*.-]+)`", parts[1].split("\n## ", 1)[0]):
                if rule not in toks and not any(rule.startswith(x) for x in prefixes):
                    bad.append((Path(p).parent.name, rule))
        self.assertEqual(bad, [])

    def test_generic_framework_names_no_organization_or_product(self):
        pat = re.compile(r"(?i)centinela|casmart|c&a\b")
        hits = [str(p.relative_to(ROOT)) for p in list((ROOT / "skills").rglob("*.md")) + [ROOT / "docs" / "GUIA_POR_ROL.md"]
                if pat.search(p.read_text(encoding="utf-8"))]
        self.assertEqual(hits, [])


if __name__ == "__main__":
    unittest.main()
