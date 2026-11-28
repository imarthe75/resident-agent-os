"""Tests for scripts/micro_audit.py (Micro-Centinela local standards auditor)."""

from __future__ import annotations

import json
from pathlib import Path

from scripts.micro_audit import mask_snippet, run_micro_audit


def test_micro_audit_detects_security_wcag_dev_and_cmmi_iso_violations(tmp_path: Path):
    # Código vulnerable en módulo backend/
    backend = tmp_path / "backend"
    backend.mkdir()
    (backend / "auth.py").write_text(
        'API_KEY = "AKIAIOSFODNN7EXAMPLE"\n'
        "def run_q(cur, uid):\n"
        '    cur.execute(f"SELECT * FROM users WHERE id = {uid}")\n'
        "    import subprocess\n"
        '    subprocess.run("ls -la", shell=True)\n'
        "    return True\n",
        encoding="utf-8",
    )

    # Plantilla con incumplimientos WCAG en frontend/
    frontend = tmp_path / "frontend"
    frontend.mkdir()
    (frontend / "Page.tsx").write_text(
        "export function Page() {\n"
        '  return <div><img src="/logo.png" /><span tabIndex={3}>hola</span></div>;\n'
        "}\n",
        encoding="utf-8",
    )

    # Dockerfile con :latest y sin USER no-root
    (tmp_path / "Dockerfile").write_text("FROM node:latest\nWORKDIR /app\nCMD [\"node\"]\n", encoding="utf-8")

    # Hallazgo importado desde data/hallazgos.json
    data_dir = tmp_path / "data"
    data_dir.mkdir()
    (data_dir / "hallazgos.json").write_text(
        json.dumps(
            {
                "hallazgos": [
                    {
                        "id": "SEC-99",
                        "regla": "AUTHZ-NO-METHOD-AUTHZ",
                        "titulo": "Controlador sin @PreAuthorize",
                        "severidad": "ALTA",
                        "categoria": "VULNERABILIDAD",
                        "archivo": "backend/OrderController.java",
                        "lineas": [42],
                        "estado": "abierto",
                    }
                ]
            }
        ),
        encoding="utf-8",
    )

    rep = run_micro_audit(tmp_path, data_dir=data_dir, with_network=False, with_tools=False)
    rules = {f["rule"] for f in rep["findings"]}

    assert "SEC-HARDCODED-SECRET" in rules
    assert "SEC-SQL-INJECTION" in rules
    assert "SEC-CMD-INJECTION" in rules
    assert "WCAG-IMG-ALT" in rules
    assert "WCAG-POSITIVE-TABINDEX" in rules
    assert "IAC-DOCKER-LATEST" in rules
    assert "IAC-DOCKER-ROOT" in rules
    assert "AUTHZ-NO-METHOD-AUTHZ" in rules

    # Verifica que ningún secreto aparezca en texto plano en snippets
    for f in rep["findings"]:
        assert "AKIAIOSFODNN7EXAMPLE" not in f["snippet"]

    # Verifica agrupación por módulo del desarrollo
    mod_names = {m["module"] for m in rep["modules"]}
    assert "backend" in mod_names
    assert "frontend" in mod_names

    # Verifica controles CMMI / ISO honestos (incluye NO_EVALUADO para controles humanos/físicos)
    statuses = {c["status"] for c in rep["standards_matrix"]}
    assert "NO_EVALUADO" in statuses
    assert "NO_CUMPLE" in statuses
    assert rep["summary"]["controls_no_evaluado"] >= 2


def test_micro_audit_baseline_diff_tracks_new_persisted_and_resolved(tmp_path: Path):
    app = tmp_path / "app"
    app.mkdir()
    bad_file = app / "views.py"
    bad_file.write_text('import os\ndef x(cmd):\n    os.system(cmd)\n', encoding="utf-8")
    data_dir = tmp_path / "data"
    data_dir.mkdir()

    rep1 = run_micro_audit(tmp_path, data_dir=data_dir, with_network=False, with_tools=False)
    prev_path = data_dir / "micro-audit-report.json"
    prev_path.write_text(json.dumps(rep1), encoding="utf-8")

    # Corregimos os.system y agregamos otro problema distinto
    bad_file.write_text("def safe():\n    return eval('1+1')\n", encoding="utf-8")
    rep2 = run_micro_audit(tmp_path, data_dir=data_dir, with_network=False, with_tools=False, previous_report_path=prev_path)

    assert rep2["summary"]["baseline_compared"] is True
    assert rep2["summary"]["resolved_since_previous"] >= 1
    eval_f = next(f for f in rep2["findings"] if f["rule"] == "SEC-DYNAMIC-EVAL")
    assert eval_f["diff_status"] == "NUEVO"


def test_mask_snippet_redacts_secrets():
    raw = 'API_KEY = "ghp_1234567890abcdefghij1234567890abcd"'
    masked = mask_snippet(raw)
    assert "abcdefghij1234567890abcd" not in masked
    assert "REDACTED" in masked


def test_micro_audit_checks_documentation_manuals_and_casmarts_when_installed(tmp_path: Path):
    # Simula un proyecto con Kit CASMARTS instalado
    (tmp_path / ".agents" / "skills" / "estandares-desarrollo-casmarts").mkdir(parents=True)
    (tmp_path / "rules" / "centinela").mkdir(parents=True)
    (tmp_path / "rules" / "centinela" / "rules.md").write_text("# Reglas Centinela\n", encoding="utf-8")
    (tmp_path / "AGENTS.md").write_text("# Agentes\n", encoding="utf-8")
    (tmp_path / "README.md").write_text("# Proyecto Demo\n\nDescripción extensa de instalación y operación del sistema.\n", encoding="utf-8")

    # Manual con enlace roto y marcador borrador
    docs = tmp_path / "docs"
    docs.mkdir()
    (docs / "manual-usuario.md").write_text(
        "# Manual de Usuario\n\nVer [guía perdida](./no-existe.md).\nSección TBD.\n",
        encoding="utf-8",
    )

    # Controlador Spring sin @PreAuthorize ni @Operation
    java_dir = tmp_path / "src" / "main" / "java"
    java_dir.mkdir(parents=True)
    (java_dir / "OrderController.java").write_text(
        "@RestController\npublic class OrderController { public String ok() { return \"ok\"; } }\n",
        encoding="utf-8",
    )

    # Especificación incompleta respecto a los 6 campos de la Metodología C&A + criterio subjetivo
    spec_dir = tmp_path / "docs" / "specs" / "pedidos"
    spec_dir.mkdir(parents=True)
    (spec_dir / "spec.md").write_text(
        "# Registro de pedido\n\nEl sistema debe ser rápido y amigable para el usuario.\n",
        encoding="utf-8",
    )

    # Migración SQL sin COMMENT ON
    sql_dir = tmp_path / "sql"
    sql_dir.mkdir()
    (sql_dir / "001_init.sql").write_text(
        "CREATE TABLE pedidos (id uuid PRIMARY KEY DEFAULT uuidv7());\n",
        encoding="utf-8",
    )

    rep = run_micro_audit(tmp_path, with_network=False, with_tools=False)
    assert rep["casmarts_profile"]["detected"] is True
    assert rep["documentation_audit"]["total_documents"] >= 2
    assert rep["documentation_audit"]["broken_links"] == 1
    assert rep["documentation_audit"]["draft_markers"] == 1

    rules = {f["rule"] for f in rep["findings"]}
    assert "DOC-BROKEN-LINK" in rules
    assert "DOC-DRAFT-PLACEHOLDER" in rules
    assert "DOC-SQL-COMMENT-MISSING" in rules
    assert "DOC-API-OPENAPI-MISSING" in rules
    assert "CASMART-SPRING-PREAUTHORIZE" in rules
    assert "CASMART-MET-6CAMPOS" in rules
    assert "CASMART-MET-CRITERIO-SUBJETIVO" in rules

