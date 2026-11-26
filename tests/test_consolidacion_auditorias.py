"""Skill consolidacion-auditorias-seguridad: lectores SARIF y hallazgos.json, triage de punta a punta y comparación de corridas."""
import json
import subprocess
import sys
from pathlib import Path

import pytest

SKILL = Path(__file__).resolve().parents[1] / "skills" / "consolidacion-auditorias-seguridad"
SCRIPTS = SKILL / "scripts"

# Recortes de SARIF real (Semgrep 1.x con p/security-audit y Trivy fs): mismas claves y forma que la salida de cada herramienta.
SEMGREP = {"version": "2.1.0", "runs": [{"tool": {"driver": {"name": "Semgrep OSS", "rules": [
    {"id": "python.lang.security.audit.subprocess-shell-true.subprocess-shell-true",
     "shortDescription": {"text": "subprocess con shell=True"}, "defaultConfiguration": {"level": "error"},
     "properties": {"tags": ["CWE-78: Improper Neutralization of Special Elements used in an OS Command", "security"]}},
    {"id": "python.lang.security.audit.eval-detected.eval-detected", "shortDescription": {"text": "uso de eval()"},
     "defaultConfiguration": {"level": "warning"}, "properties": {"tags": ["CWE-95: Eval Injection"]}}]}},
    "results": [
        {"ruleId": "python.lang.security.audit.subprocess-shell-true.subprocess-shell-true", "level": "error", "message": {"text": "shell"},
         "locations": [{"physicalLocation": {"artifactLocation": {"uri": "svc.py"}, "region": {"startLine": 4}}}]},
        {"ruleId": "python.lang.security.audit.eval-detected.eval-detected", "level": "warning", "message": {"text": "eval"},
         "locations": [{"physicalLocation": {"artifactLocation": {"uri": "svc.py"}, "region": {"startLine": 3}}}]},
        {"ruleId": "python.lang.security.audit.eval-detected.eval-detected", "level": "warning", "message": {"text": "eval"},
         "locations": [{"physicalLocation": {"artifactLocation": {"uri": "otro.py"}, "region": {"startLine": 9}}}]},
        {"ruleId": "python.lang.security.audit.eval-detected.eval-detected", "level": "warning", "message": {"text": "eval"},
         "suppressions": [{"kind": "inSource"}],
         "locations": [{"physicalLocation": {"artifactLocation": {"uri": "otro.py"}, "region": {"startLine": 20}}}]}]}]}
TRIVY = {"version": "2.1.0", "runs": [{"tool": {"driver": {"name": "Trivy", "rules": [
    {"id": "CVE-2018-18074", "shortDescription": {"text": "python-requests: Redirect from HTTPS to HTTP does not remove Authorization header"},
     "properties": {"security-severity": "7.5", "tags": ["vulnerability", "security", "HIGH"]}},
    {"id": "CVE-2023-32681", "shortDescription": {"text": "python-requests: Unintended leak of Proxy-Authorization header"},
     "properties": {"security-severity": "6.1"}}]}},
    "results": [
        {"ruleId": "CVE-2018-18074", "level": "error",
         "message": {"text": "Package: requests\nInstalled Version: 2.19.1\nVulnerability CVE-2018-18074\nSeverity: HIGH\nFixed Version: 2.20.0"},
         "locations": [{"physicalLocation": {"artifactLocation": {"uri": "requirements.txt"}, "region": {"startLine": 2}}}]},
        {"ruleId": "CVE-2023-32681", "level": "warning",
         "message": {"text": "Package: requests\nInstalled Version: 2.19.1\nVulnerability CVE-2023-32681\nSeverity: MEDIUM\nFixed Version: 2.31.0"},
         "locations": [{"physicalLocation": {"artifactLocation": {"uri": "requirements.txt"}, "region": {"startLine": 2}}}]}]}]}


def run(script, *args):
    r = subprocess.run([sys.executable, "-I", str(SCRIPTS / script), *map(str, args)], capture_output=True, text=True, cwd=SKILL)
    assert r.returncode == 0, r.stderr + r.stdout
    return r.stdout


@pytest.fixture
def sarifs(tmp_path):
    (tmp_path / "semgrep.sarif").write_text(json.dumps(SEMGREP))
    (tmp_path / "trivy.sarif").write_text(json.dumps(TRIVY))
    return tmp_path


def test_parse_sarif_groups_by_rule_with_cvss_cwe_and_dependency(sarifs):
    out = run("parse_sarif.py", sarifs / "n.json", f"back={sarifs / 'semgrep.sarif'}", f"back={sarifs / 'trivy.sarif'}")
    assert "1 suprimidas" in out
    items = {i["rule"]: i for i in json.loads((sarifs / "n.json").read_text())["back"]}
    ev = items["python.lang.security.audit.eval-detected.eval-detected"]
    assert ev["motor"] == "semgrep" and ev["n"] == 2 and ev["sev"] == "MEDIUM" and ev["cwe"] == ["CWE-95"]
    assert {u["file"]: u["lines"] for u in ev["ubicaciones"]} == {"svc.py": [3], "otro.py": [9]}
    assert items["python.lang.security.audit.subprocess-shell-true.subprocess-shell-true"]["sev"] == "HIGH"
    cve = items["CVE-2018-18074"]
    assert cve["sev"] == "HIGH" and cve["sca"] == ["requests", "2.19.1", "2.20.0", ""]
    assert items["CVE-2023-32681"]["sev"] == "MEDIUM"  # CVSS 6.1, no el nivel SARIF
    assert not any(i["truncado"] for i in items.values())


def test_parse_sarif_without_cvss_uses_level():
    sys.path.insert(0, str(SCRIPTS))
    try:
        import parse_sarif
        assert parse_sarif.cvss_to_sev("9.8") == "CRITICAL" and parse_sarif.cvss_to_sev("4.0") == "MEDIUM"
        assert parse_sarif.cvss_to_sev(None) is None
    finally:
        sys.path.remove(str(SCRIPTS))


def test_parse_hallazgos_keeps_only_open_and_maps_severity(tmp_path):
    src = SKILL.parent / "auditoria-codigo" / "examples" / "hallazgos.corrida1.json"
    out = run("parse_hallazgos.py", tmp_path / "a.json", f"app={src}")
    assert "falso positivo" in out
    items = json.loads((tmp_path / "a.json").read_text())["app"]
    doc = json.loads(src.read_text())["hallazgos"]
    assert len(items) == sum(1 for h in doc if h["estado"] == "abierto")
    sqli = next(i for i in items if i["rule"] == "SQL-INJECTION-CONCAT")
    assert sqli["sev"] == "CRITICAL" and sqli["motor"] == "auditoria-codigo" and sqli["esfuerzo_min"] == 180


def test_triage_end_to_end_produces_workbook_and_matrix(sarifs):
    pytest.importorskip("xlsxwriter")
    openpyxl = pytest.importorskip("openpyxl")
    run("parse_sarif.py", sarifs / "n.json", f"back={sarifs / 'semgrep.sarif'}", f"back={sarifs / 'trivy.sarif'}")
    out = run("triage_report.py", sarifs / "n.json", SKILL / "assets" / "catalogo_ejemplo.json", sarifs / "libro.xlsx",
              "--matriz", sarifs / "m.json", "--pendientes", sarifs / "p.json", "--titulo", "PRUEBA", "--fuente", "Semgrep y Trivy")
    assert "Ocurrencias: 5 (las fuentes declaran 5)" in out
    wb = openpyxl.load_workbook(sarifs / "libro.xlsx")
    assert {"Resumen", "Detalle", "Versiones desactualizadas", "Criterios"} <= set(wb.sheetnames)
    versions = [r for r in wb["Versiones desactualizadas"].iter_rows(values_only=True) if r and r[0] == "requests"]
    by_cve = [r for r in versions if str(r[2]).startswith("CVE-")]
    by_pkg = [r for r in versions if r[2] == 2]
    assert len(by_cve) == 2  # los dos CVE de Trivy
    assert len(by_pkg) == 1 and by_pkg[0][3] == "2.31.0"  # una actualización del paquete cierra los dos
    pend = json.loads((sarifs / "p.json").read_text())
    assert {p["regla"] for p in pend} == {"python.lang.security.audit.eval-detected.eval-detected",
                                          "python.lang.security.audit.subprocess-shell-true.subprocess-shell-true"}
    assert json.loads((sarifs / "m.json").read_text())


def test_compare_runs_detects_resolved_and_persisting(sarifs, tmp_path):
    run("parse_sarif.py", tmp_path / "antes.json", f"back={sarifs / 'semgrep.sarif'}")
    after = json.loads(json.dumps(SEMGREP))
    after["runs"][0]["results"] = after["runs"][0]["results"][:1]  # solo queda el shell=True
    (tmp_path / "after.sarif").write_text(json.dumps(after))
    run("parse_sarif.py", tmp_path / "despues.json", f"back={tmp_path / 'after.sarif'}")
    run("comparar_corridas.py", tmp_path / "antes.json", tmp_path / "despues.json", "--salida", tmp_path / "c.json")
    res = json.loads((tmp_path / "c.json").read_text())
    eval_rule = "python.lang.security.audit.eval-detected.eval-detected"
    assert sorted(map(tuple, res["resueltas"])) == [("back", eval_rule, "otro.py", 9), ("back", eval_rule, "svc.py", 3)]
    assert [r[1] for r in res["persisten"]] == ["python.lang.security.audit.subprocess-shell-true.subprocess-shell-true"]
    assert res["nuevas"] == [] and res["no_concluyente"] == []


def test_skill_has_no_organization_terms():
    bad = ("centinela", "casmart", "c&a", "authentik", "art-sop", "0b-2", "edomex")
    for p in SKILL.rglob("*"):
        if p.is_file() and p.suffix in (".py", ".md", ".json"):
            low = p.read_text(encoding="utf-8").lower()
            assert not [b for b in bad if b in low], p
