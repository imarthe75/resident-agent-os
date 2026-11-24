"""Las rutas que un texto cita dentro de una skill (`otra-skill/references/x.md`) y las skills que nombra (skill `x`) existen.

Una referencia rota no falla en ningún lado: el agente simplemente no encuentra la guía y sigue sin ella.
"""
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKILLS = ROOT / "skills"
SKILL_REF = re.compile(r"(?<![\w-])(?:\.\./)?([a-z0-9]+(?:-[a-z0-9]+)+)/([A-Za-z0-9_][A-Za-z0-9_./-]*[A-Za-z0-9])")
EXTERNAL = {"xlsx", "docx", "pdf", "pptx", "chrome-browser"}   # skills de documentos y navegador del propio agente
DIRS = ("skills", "rules", "agents", "contexts", "commands")


def _texts():
    for d in DIRS:
        for f in sorted((ROOT / d).rglob("*.md")):
            if "node_modules" not in f.parts:
                yield f, f.read_text(encoding="utf-8", errors="ignore")


class SkillReferencesTest(unittest.TestCase):
    def test_paths_inside_skills_exist(self):
        skills = {p.name for p in SKILLS.iterdir() if p.is_dir()}
        bad = []
        for f, text in _texts():
            for m in SKILL_REF.finditer(text):
                skill, sub = m.group(1), m.group(2)
                if skill in skills and not re.match(r"[\w.-]*[*<{]", text[m.end():m.end() + 40]) and not (SKILLS / skill / sub).exists():
                    bad.append(f"{f.relative_to(ROOT)}: {skill}/{sub}")
        self.assertEqual(bad, [])

    def test_named_skills_exist(self):
        skills = {p.name for p in SKILLS.iterdir() if p.is_dir()}
        bad = sorted({f"{f.relative_to(ROOT)}: {m.group(1)}" for f, text in _texts()
                      for m in re.finditer(r"skill `([a-z0-9-]+)`", text) if m.group(1) not in skills | EXTERNAL})
        self.assertEqual(bad, [])


if __name__ == "__main__":
    unittest.main()
