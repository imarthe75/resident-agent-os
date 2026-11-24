"""metodologia-entrega: plantillas con la convención y verificador de entregables."""
import re
import subprocess
import sys
from pathlib import Path

SKILL = Path(__file__).resolve().parents[1] / "skills" / "metodologia-entrega"
VERIF = SKILL / "scripts" / "verificar_entregable.py"
PLANTILLAS = sorted((SKILL / "plantillas").glob("[0-9]*.md"))


def run(*args):
    return subprocess.run([sys.executable, "-I", str(VERIF), *args], capture_output=True, text=True)


def test_catalog_lists_every_template():
    readme = (SKILL / "plantillas" / "README.md").read_text()
    assert len(PLANTILLAS) == 21
    for p in PLANTILLAS:
        assert f"`{p.name}`" in readme, p.name


def test_every_template_follows_the_convention():
    for p in PLANTILLAS:
        t = p.read_text()
        assert re.search(r"^\| Documento \| .+ \|$", t, re.M), p.name
        assert "| Versión | 1.0 |" in t, p.name
        for sec in re.split(r"^## ", t, flags=re.M)[1:]:
            assert re.search(r"^> Llena: (persona|IA \(revisión obligatoria\)|derivado de .+)$", sec, re.M), f"{p.name}: {sec.splitlines()[0]}"


def test_filled_example_passes_and_templates_fail():
    assert run(str(SKILL / "examples" / "adr-0001-motor-de-colas.md")).returncode == 0
    r = run(str(SKILL / "plantillas" / "20-adr.md"))
    assert r.returncode == 1 and "pendiente sin llenar" in r.stderr and "Revisó" in r.stderr


def test_detects_missing_section_and_secret(tmp_path):
    t = (SKILL / "examples" / "adr-0001-motor-de-colas.md").read_text()
    t = re.sub(r"## Consecuencias.*?(?=## Requerimientos)", "", t, flags=re.S) + "\npassword = SuperSecreta123\n"
    p = tmp_path / "adr.md"; p.write_text(t)
    r = run(str(p))
    assert r.returncode == 1 and "Consecuencias" in r.stderr and "secreto" in r.stderr
