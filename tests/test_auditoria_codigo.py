"""scripts/auditoria.py de la skill auditoria-codigo: validación, resumen y comparativo entre corridas."""
import json
import subprocess
import sys
from pathlib import Path

SKILL = Path(__file__).resolve().parents[1] / "skills" / "auditoria-codigo"
SCRIPT = SKILL / "scripts" / "auditoria.py"


def run(*args, cwd=None):
    return subprocess.run([sys.executable, "-I", str(SCRIPT), *args], capture_output=True, text=True, cwd=cwd)


def test_examples_are_valid():
    for f in ("hallazgos.corrida1.json", "hallazgos.corrida2.json"):
        assert run("validar", str(SKILL / "examples" / f)).returncode == 0


def test_rejects_unjustified_false_positive_and_long_accepted_risk(tmp_path):
    base = {"regla": "X", "titulo": "t", "severidad": "ALTA", "categoria": "VULNERABILIDAD", "evidencia": "Cierto", "detectado": "2026-01-01"}
    data = {"hallazgos": [dict(base, archivo="a", estado="falso_positivo"),
                          dict(base, archivo="b", estado="riesgo_aceptado", justificacion="x", vence_aceptacion="2027-06-01"),
                          dict(base, archivo="c", estado="abierto", evidencia="Hipotesis")]}
    p = tmp_path / "h.json"; p.write_text(json.dumps(data))
    r = run("validar", str(p))
    assert r.returncode == 1
    assert "falso positivo necesita" in r.stderr and "365" in r.stderr and "hipótesis" in r.stderr


def test_summary_and_matrix_with_sla(tmp_path):
    r = run("resumen", str(SKILL / "examples" / "hallazgos.corrida1.json"), "--out", str(tmp_path), "--hoy", "2026-11-24")
    assert r.returncode == 0
    matriz = (tmp_path / "matriz.csv").read_text()
    assert "SQL-INJECTION-CONCAT" in matriz and "2026-11-02" in matriz  # Crítica: 24 h
    assert "Esfuerzo estimado de lo abierto: 5.5 h" in (tmp_path / "resumen.md").read_text()


def test_comparison_uses_declared_scope(tmp_path):
    r = run("comparar", str(SKILL / "examples" / "hallazgos.corrida1.json"), str(SKILL / "examples" / "hallazgos.corrida2.json"), "--out", str(tmp_path))
    assert r.returncode == 0
    t = (tmp_path / "comparativo.md").read_text()
    assert "| Nuevo | ALTA | `CORS-WILDCARD-ORIGIN`" in t
    assert "| Persiste (cambió de línea) | ALTA | `AUTHZ-NO-METHOD-AUTHZ`" in t
    assert "| No re-verificado | BAJA | `WCAG-1.1.1-IMG-NO-ALT`" in t
    assert "| Solventado | CRITICA | `SQL-INJECTION-CONCAT`" in t
