#!/usr/bin/env python3
"""Micro-auditor local de estándares (Seguridad, Desarrollo/BD, Accesibilidad WCAG, CMMI v3.0, ISO/IEC 27001).

Analiza un repositorio en modo solo lectura para indicarle al desarrollador exactamente
QUÉ parte del desarrollo (módulo, archivo y línea) incumple qué estándar y cómo corregirlo,
antes de abrir un Merge Request o correr un escáner corporativo completo.

Fuentes reales que integra:
  1. Verificadores deterministas del framework (`verifiers/checks.py`)
  2. Reglas SAST / Secretos / IaC en Python puro (Python, Java/Spring, TS/JS, Dockerfile, Compose)
  3. Reglas estáticas de Accesibilidad WCAG 2.1 (HTML / JSX / TSX)
  4. Controles verificables en repositorio de CMMI v3.0 e ISO/IEC 27001:2022
     (todo control organizacional/humano fuera del repo se declara honestamente NO_EVALUADO)
  5. Señales de deuda/código muerto (`scripts/ponytail_audit.py` si hay herramientas instaladas)
  6. Dependencias desactualizadas (`data/outdated-dependencies.json` o `--with-network`)
  7. Reportes previos importados (`data/hallazgos.json` de `auditoria-codigo`, `data/*.sarif`)
  8. Herramientas opcionales instaladas en PATH (`semgrep`, `gitleaks`, `trivy` — nunca descarga binarios)
  9. Escáner corporativo opcional vía `PREFLIGHT_URL` (`agent/preflight_client.py`)

Uso:
    python3 scripts/micro_audit.py --path . --json
    python3 scripts/micro_audit.py --path . --with-tools --out data/micro-audit-report.json
"""

from __future__ import annotations

import argparse
import datetime
import json
import logging
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from verifiers import checks as vchecks  # noqa: E402

logger = logging.getLogger(__name__)

SKIP_DIRS = {
    ".git",
    "node_modules",
    "target",
    "build",
    "dist",
    "__pycache__",
    ".venv",
    "venv",
    "data",
    ".angular",
    ".next",
    ".nuxt",
    "coverage",
    ".cache",
    ".pytest_cache",
}

DOC_OR_TEST_PREFIXES = (
    "tests/",
    "test/",
    "__tests__/",
    "docs/",
    "rules/",
    "DECISIONS/",
    "changes/",
    "templates/",
    "examples/",
    "verifiers/",
    "skills/",
    ".agents/",
    ".claude/",
)

SEVERITY_ORDER = {"CRITICA": 0, "ALTA": 1, "MEDIA": 2, "BAJA": 3}

SECRET_MASK_PATTERNS = (
    re.compile(r"(?i)(password|passwd|pwd|secret|token|api[_-]?key|private[_-]?key)\s*([:=]\s*['\"])([^'\"]{4,})(['\"])"),
    re.compile(r"(AKIA[0-9A-Z]{4})[0-9A-Z]{12}"),
    re.compile(r"(gh[pousr]_[A-Za-z0-9]{4})[A-Za-z0-9]{20,}"),
    re.compile(r"(glpat-[A-Za-z0-9_-]{4})[A-Za-z0-9_-]{12,}"),
)

# Patrones deterministas de seguridad sobre código fuente de aplicación
SAST_RULES: List[Dict[str, Any]] = [
    {
        "rule": "SEC-HARDCODED-SECRET",
        "pillar": "seguridad",
        "standard": "OWASP A07 / ISO 27001 A.8.24 / CWE-798",
        "severity": "CRITICA",
        "suffixes": (".py", ".java", ".ts", ".tsx", ".js", ".jsx", ".yml", ".yaml", ".properties", ".env.example"),
        "pattern": re.compile(
            r"(?:AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{30,}|glpat-[A-Za-z0-9_-]{20,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)"
        ),
        "title": "Credencial o llave privada embebida en el código",
        "remediation": "Elimina el secreto del repositorio, rótalo de inmediato y cárgalo exclusivamente desde variables de entorno o un gestor de secretos.",
    },
    {
        "rule": "SEC-HARDCODED-PASSWORD",
        "pillar": "seguridad",
        "standard": "OWASP A07 / ISO 27001 A.8.24 / CWE-798",
        "severity": "ALTA",
        "suffixes": (".py", ".java", ".ts", ".tsx", ".js", ".jsx", ".properties"),
        "pattern": re.compile(
            r"""(?i)\b(?:db_password|postgres_password|jwt_secret|secret_key|api_secret|client_secret)\s*=\s*["'](?!\s*$|\$\{|changeme|example|placeholder|test|dummy|your_|<)([^"'\n]{8,})["']"""
        ),
        "title": "Contraseña o secreto fijo asignado directamente en el código",
        "remediation": "Lee el valor desde `os.getenv(...)` / `process.env` / configuración inyectada sin valores por omisión hardcodeados.",
    },
    {
        "rule": "SEC-SQL-INJECTION",
        "pillar": "seguridad",
        "standard": "OWASP A03 / ISO 27001 A.8.28 / CWE-89",
        "severity": "CRITICA",
        "suffixes": (".py", ".java", ".ts", ".tsx", ".js", ".jsx"),
        "pattern": re.compile(
            r"""(?:execute|query|createNativeQuery)\s*\(\s*(?:f["'][^"']*\b(?:SELECT|INSERT|UPDATE|DELETE)\b[^"']*\{|["'][^"']*\b(?:SELECT|INSERT|UPDATE|DELETE)\b[^"']*["']\s*(?:\+|%\s*\())""",
            re.IGNORECASE,
        ),
        "title": "Posible inyección SQL por concatenación o interpolación directa en consulta",
        "remediation": "Sustituye la concatenación por consultas parametrizadas (`%s` / `:param` / `$1` / `PreparedStatement`).",
    },
    {
        "rule": "SEC-CMD-INJECTION",
        "pillar": "seguridad",
        "standard": "OWASP A03 / ISO 27001 A.8.28 / CWE-78",
        "severity": "ALTA",
        "suffixes": (".py", ".ts", ".tsx", ".js", ".jsx", ".java"),
        "pattern": re.compile(
            r"""(?:\bsubprocess\.(?:run|Popen|call|check_output|check_call)\([^)]*shell\s*=\s*True|\bos\.system\s*\(|\bchild_process\.exec\s*\(|\bRuntime\.getRuntime\(\)\.exec\s*\()"""
        ),
        "title": "Invocación de shell o comando sin separación de argumentos",
        "remediation": "Pasa argumentos como lista sin shell (`shell=False`, `execFile`/`spawnSync` con arreglo de argumentos) y valida cualquier entrada.",
    },
    {
        "rule": "SEC-DYNAMIC-EVAL",
        "pillar": "seguridad",
        "standard": "OWASP A03 / ISO 27001 A.8.28 / CWE-95",
        "severity": "ALTA",
        "suffixes": (".py", ".ts", ".tsx", ".js", ".jsx"),
        "pattern": re.compile(r"""(?<!\.)\b(?:eval|exec)\s*\(|new\s+Function\s*\("""),
        "title": "Ejecución dinámica de código (`eval` / `exec` / `new Function`)",
        "remediation": "Elimina la evaluación dinámica; usa parsers seguros (`json.loads`, `ast.literal_eval`) o tablas de despacho explícitas.",
    },
    {
        "rule": "SEC-XSS-SINK",
        "pillar": "seguridad",
        "standard": "OWASP A03 / CWE-79",
        "severity": "ALTA",
        "suffixes": (".ts", ".tsx", ".js", ".jsx"),
        "pattern": re.compile(r"""(?:dangerouslySetInnerHTML|\binnerHTML\s*=|\bdocument\.write\s*\(|\bbypassSecurityTrust(?:Html|Script|Url)\s*\()"""),
        "title": "Inyección directa de HTML/DOM sin sanitización verificada",
        "remediation": "Renderiza datos como texto/JSX normal o sanitiza explícitamente con una política estricta (DOMPurify) antes de inyectar HTML.",
    },
    {
        "rule": "SEC-TLS-VERIFY-DISABLED",
        "pillar": "seguridad",
        "standard": "OWASP A02 / ISO 27001 A.8.24 / CWE-295",
        "severity": "ALTA",
        "suffixes": (".py", ".ts", ".tsx", ".js", ".jsx", ".java", ".yml", ".yaml"),
        "pattern": re.compile(r"""(?:verify\s*=\s*False|NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*['"]?0|rejectUnauthorized\s*:\s*false|InsecureSkipVerify\s*:\s*true)"""),
        "title": "Validación de certificados TLS deshabilitada",
        "remediation": "Habilita la verificación TLS (`verify=True`) y configura el certificado CA corporativo mediante truststore/bundle.",
    },
    {
        "rule": "SEC-CORS-WILDCARD-CREDS",
        "pillar": "seguridad",
        "standard": "OWASP A05 / CWE-942",
        "severity": "ALTA",
        "suffixes": (".py", ".ts", ".tsx", ".js", ".jsx", ".java"),
        "pattern": re.compile(r"""allow_origins\s*=\s*\[\s*['"]\*['"]\s*\][^)\n]*allow_credentials\s*=\s*True|Access-Control-Allow-Origin['":\s]+\*"""),
        "title": "Política CORS permisiva con comodín `*`",
        "remediation": "Restringe CORS a una lista blanca explícita de orígenes autorizados por entorno.",
    },
    {
        "rule": "IAC-DOCKER-LATEST",
        "pillar": "seguridad",
        "standard": "ISO 27001 A.8.9 / CIS Docker",
        "severity": "MEDIA",
        "suffixes": ("Dockerfile",),
        "pattern": re.compile(r"""^\s*FROM\s+\S+:latest(?:\s|$)""", re.IGNORECASE),
        "title": "Imagen base fijada con etiqueta mutable `:latest` en Dockerfile",
        "remediation": "Fija una versión explícita y reproducible (por ejemplo `node:26-alpine` o `python:3.14-slim`) en lugar de `:latest`.",
    },
    {
        "rule": "IAC-COMPOSE-PRIVILEGED",
        "pillar": "seguridad",
        "standard": "ISO 27001 A.8.9 / CIS Docker",
        "severity": "ALTA",
        "suffixes": (".yml", ".yaml"),
        "pattern": re.compile(r"""^\s*privileged\s*:\s*true\b""", re.IGNORECASE),
        "title": "Contenedor configurado en modo privilegiado (`privileged: true`)",
        "remediation": "Elimina `privileged: true` y otorga únicamente las capabilities estrictamente necesarias.",
    },
]

# Reglas estáticas de accesibilidad WCAG 2.1 AA sobre plantillas/componentes UI
WCAG_RULES: List[Dict[str, Any]] = [
    {
        "rule": "WCAG-IMG-ALT",
        "pillar": "accesibilidad",
        "standard": "WCAG 2.1 AA (1.1.1 Contenido no textual)",
        "severity": "MEDIA",
        "pattern": re.compile(r"""<img\b(?![^>]*\balt\s*=)[^>]*>""", re.IGNORECASE),
        "title": "Imagen `<img>` sin atributo `alt`",
        "remediation": "Añade `alt=\"descripción concisa\"` (o `alt=\"\"` si es puramente decorativa).",
    },
    {
        "rule": "WCAG-HTML-LANG",
        "pillar": "accesibilidad",
        "standard": "WCAG 2.1 AA (3.1.1 Idioma de la página)",
        "severity": "MEDIA",
        "pattern": re.compile(r"""<html\b(?![^>]*\blang\s*=)[^>]*>""", re.IGNORECASE),
        "title": "Etiqueta `<html>` sin atributo `lang`",
        "remediation": "Define el idioma del documento en el elemento raíz (por ejemplo `<html lang=\"es\">`).",
    },
    {
        "rule": "WCAG-POSITIVE-TABINDEX",
        "pillar": "accesibilidad",
        "standard": "WCAG 2.1 AA (2.4.3 Orden del foco)",
        "severity": "BAJA",
        "pattern": re.compile(r"""\btabIndex\s*=\s*\{?\s*['"]?[1-9]\d*['"]?\s*\}?|\btabindex\s*=\s*['"][1-9]\d*['"]"""),
        "title": "Uso de `tabIndex` positivo que altera el orden natural del teclado",
        "remediation": "Usa `tabIndex={0}` o `tabIndex={-1}` y respeta el orden semántico del DOM.",
    },
    {
        "rule": "WCAG-OUTLINE-NONE",
        "pillar": "accesibilidad",
        "standard": "WCAG 2.1 AA (2.4.7 Foco visible)",
        "severity": "BAJA",
        "pattern": re.compile(r"""outline\s*:\s*(?:none|0)\b"""),
        "title": "Contorno de foco eliminado (`outline: none`) sin reemplazo visible",
        "remediation": "Conserva un indicador visible de foco en `:focus-visible` (borde o anillo con contraste >= 3:1).",
    },
]

VERIFIER_META: Dict[str, Dict[str, str]] = {
    "pk_uuid": {
        "pillar": "desarrollo",
        "standard": "Estándar de Base de Datos / Arquitectura",
        "severity": "ALTA",
        "title": "Llave primaria que no utiliza tipo `uuid` (`uuidv7()`)",
        "remediation": "Migra la llave primaria a `uuid DEFAULT uuidv7()` evitando `serial`/`bigserial`/`integer`.",
    },
    "compose_volumes": {
        "pillar": "desarrollo",
        "standard": "ISO 27001 A.8.13 / Persistencia Local",
        "severity": "ALTA",
        "title": "Servicio con estado sin persistencia montada en `./data`",
        "remediation": "Monta el volumen de datos del servicio en una carpeta bajo `./data/` del host.",
    },
    "audit_triggers": {
        "pillar": "desarrollo",
        "standard": "Estándar de Auditoría de Base de Datos / ISO 27001 A.8.15",
        "severity": "ALTA",
        "title": "Tabla SQL sin trigger de auditoría declarado",
        "remediation": "Agrega el trigger de auditoría o `auditoria.asignar_triggers` en la migración SQL.",
    },
    "endpoints_auth": {
        "pillar": "seguridad",
        "standard": "OWASP A01 / ISO 27001 A.8.3",
        "severity": "CRITICA",
        "title": "Endpoint mutante sin autorización explícita ni justificación en `.agent/public-routes.txt`",
        "remediation": "Añade control de acceso (`@PreAuthorize`, `Depends(get_current_user)`, guard) o documenta la ruta pública en `.agent/public-routes.txt`.",
    },
    "versions_current": {
        "pillar": "dependencias",
        "standard": "ISO 27001 A.8.8 / Política de Versiones Vigentes",
        "severity": "ALTA",
        "title": "Plataforma o imagen Docker por debajo del piso vigente",
        "remediation": "Actualiza la versión en el manifiesto/Dockerfile/compose según `.agent/versions-policy.json`.",
    },
    "dependencies_current": {
        "pillar": "dependencias",
        "standard": "OWASP A06 / ISO 27001 A.8.8",
        "severity": "MEDIA",
        "title": "Dependencia directa con versión menor o mayor atrasada",
        "remediation": "Actualiza la dependencia directa en el manifiesto y su lockfile o registra una excepción motivada en `.agent/versions-policy.json`.",
    },
    "no_stubs": {
        "pillar": "desarrollo",
        "standard": "Estándar de Honestidad Técnica / CMMI v3.0 (TS)",
        "severity": "ALTA",
        "title": "Código incompleto, `TODO`/`FIXME` o stub detectado en código productivo",
        "remediation": "Implementa la lógica real o retira el bloque incompleto; si falta una dependencia, declara el módulo como PARCIAL.",
    },
    "tests_isolated": {
        "pillar": "desarrollo",
        "standard": "Estándar de Aislamiento de Pruebas / CMMI v3.0 (VER)",
        "severity": "ALTA",
        "title": "Prueba que apunta a una base de datos compartida o de producción",
        "remediation": "Usa bases de datos desechables, contenedores efímeros o transacciones con `ROLLBACK` obligatorio.",
    },
    "no_silent_except": {
        "pillar": "desarrollo",
        "standard": "Estándar de Manejo de Errores / ISO 27001 A.8.15",
        "severity": "ALTA",
        "title": "Excepción capturada y silenciada sin registro de error ni propagación",
        "remediation": "Registra la excepción con `logger.error(..., exc_info=True)` o propágala en lugar de usar `except Exception: pass`.",
    },
    "webhooks_fail_closed": {
        "pillar": "seguridad",
        "standard": "OWASP A07 / Principio Fail-Closed",
        "severity": "CRITICA",
        "title": "Endpoint webhook sin verificación criptográfica estricta (fail-closed)",
        "remediation": "Valida la firma/token con comparación en tiempo constante y rechaza con HTTP 401/403 si falta el secreto o no coincide.",
    },
    "spec_traceability": {
        "pillar": "cmmi",
        "standard": "CMMI v3.0 (RD / VER — Trazabilidad Bidireccional)",
        "severity": "MEDIA",
        "title": "Requisito aprobado sin prueba automatizada que lo referencie",
        "remediation": "Cita el identificador del requisito (p. ej. `RF-01`) en al menos una prueba automatizada.",
    },
    "observability_min": {
        "pillar": "desarrollo",
        "standard": "Observabilidad / ISO 27001 A.8.15",
        "severity": "MEDIA",
        "title": "Falta endpoint `/health` o propagación de identificador de correlación",
        "remediation": "Expone `/health` y propaga `X-Request-Id` en los logs estructurados del servicio.",
    },
    "observability_production": {
        "pillar": "desarrollo",
        "standard": "Observabilidad / CMMI v3.0 (MPM)",
        "severity": "MEDIA",
        "title": "Faltan umbrales de observabilidad en producción (`.agent/thresholds.json`)",
        "remediation": "Define los límites de alerta en `.agent/thresholds.json` y el script de evaluación de señales.",
    },
}


def mask_snippet(line: str) -> str:
    """Enmascara posibles valores secretos antes de persistir o mostrar un fragmento."""
    masked = line.strip()
    for pat in SECRET_MASK_PATTERNS:
        if pat.groups == 4:
            masked = pat.sub(r"\1\2***REDACTED***\4", masked)
        elif pat.groups == 1:
            masked = pat.sub(r"\1***REDACTED***", masked)
    return masked[:220]


def infer_module(rel_path: Optional[str]) -> str:
    """Agrupa un archivo por el módulo o capa del desarrollo al que pertenece."""
    if not rel_path:
        return "Repositorio / Gobierno"
    clean = rel_path.replace("\\", "/").lstrip("./")
    parts = [p for p in clean.split("/") if p]
    if len(parts) <= 1:
        return "Raíz / Configuración"
    if parts[0] in ("src", "app", "packages", "services", "apps", "modules") and len(parts) >= 3:
        return f"{parts[0]}/{parts[1]}"
    if len(parts) >= 3 and parts[1] == "src":
        return f"{parts[0]}/src/{parts[2]}" if len(parts) >= 4 else f"{parts[0]}/src"
    return parts[0]


def _is_doc_or_test(rel_path: str) -> bool:
    norm = rel_path.replace("\\", "/").lstrip("./")
    if norm.startswith(DOC_OR_TEST_PREFIXES):
        return True
    lower = norm.lower()
    if any(tok in lower for tok in ("/tests/", "/test/", "/__tests__/", "/fixtures/", "/examples/", "/mock")):
        return True
    if re.search(r"\.(?:test|spec)\.[a-z0-9]+$", lower):
        return True
    if norm == "scripts/micro_audit.py":
        return True
    return False


def _walk_source_files(root: Path) -> List[Path]:
    out: List[Path] = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = sorted(d for d in dirnames if d not in SKIP_DIRS)
        for fn in sorted(filenames):
            out.append(Path(dirpath) / fn)
    return out


def _make_finding(
    *,
    rule: str,
    pillar: str,
    standard: str,
    severity: str,
    file_path: Optional[str],
    line: Optional[int],
    snippet: str,
    title: str,
    remediation: str,
    source: str,
) -> Dict[str, Any]:
    norm_file = file_path.replace("\\", "/").lstrip("./") if file_path else None
    sev = severity.upper()
    if sev not in SEVERITY_ORDER:
        sev = "MEDIA"
    loc = f"{norm_file}:{line}" if norm_file and line else (norm_file or "repositorio")
    fid = f"{rule}:{norm_file or 'repo'}:{line or 0}"
    fix_prompt = (
        f"Corrige el hallazgo {rule} ({standard}, severidad {sev}) en `{loc}`: {title}. "
        f"Remediación esperada: {remediation} Verifica la corrección ejecutando pruebas y `python3 scripts/micro_audit.py --path .`."
    )
    return {
        "id": fid,
        "rule": rule,
        "pillar": pillar,
        "standard": standard,
        "severity": sev,
        "module": infer_module(norm_file),
        "file": norm_file,
        "line": line,
        "snippet": mask_snippet(snippet) if snippet else "",
        "title": title,
        "remediation": remediation,
        "fix_prompt": fix_prompt,
        "source": source,
        "diff_status": "SIN_BASE",
    }


def _parse_file_line_from_detail(detail_line: str) -> Tuple[Optional[str], Optional[int]]:
    m = re.match(r"^([^\s:]+):(\d+)(?::|\s|$)", detail_line.strip())
    if m:
        return m.group(1), int(m.group(2))
    m2 = re.match(r"^([^\s:]+):\s+", detail_line.strip())
    if m2 and ("/" in m2.group(1) or "." in m2.group(1)):
        return m2.group(1), None
    return None, None


def scan_sast_and_wcag(root: Path) -> Tuple[List[Dict[str, Any]], int]:
    """Escaneo determinista en Python puro de Seguridad (SAST/IaC) y Accesibilidad (WCAG 2.1)."""
    findings: List[Dict[str, Any]] = []
    scanned_files = 0
    for fpath in _walk_source_files(root):
        rel = fpath.relative_to(root).as_posix()
        if _is_doc_or_test(rel):
            continue
        name = fpath.name
        suffix = fpath.suffix.lower()

        is_sast_candidate = (
            name == "Dockerfile"
            or name.startswith("Dockerfile.")
            or suffix in (".py", ".java", ".ts", ".tsx", ".js", ".jsx", ".yml", ".yaml", ".properties")
        )
        is_wcag_candidate = suffix in (".html", ".htm", ".jsx", ".tsx")
        if not is_sast_candidate and not is_wcag_candidate:
            continue

        try:
            if fpath.stat().st_size > 512 * 1024:
                continue
            text = fpath.read_text(encoding="utf-8", errors="replace")
        except OSError as exc:
            logger.error("No se pudo leer %s: %s", rel, exc, exc_info=True)
            continue

        scanned_files += 1
        lines = text.splitlines()

        # Verificar Dockerfile sin USER no-root
        if name == "Dockerfile" or name.startswith("Dockerfile."):
            has_from = any(re.match(r"^\s*FROM\s+", ln, re.IGNORECASE) for ln in lines)
            has_non_root_user = any(
                re.match(r"^\s*USER\s+(?!root\b|0\b)\S+", ln, re.IGNORECASE) for ln in lines
            )
            if has_from and not has_non_root_user:
                findings.append(
                    _make_finding(
                        rule="IAC-DOCKER-ROOT",
                        pillar="seguridad",
                        standard="ISO 27001 A.8.9 / CIS Docker",
                        severity="MEDIA",
                        file_path=rel,
                        line=1,
                        snippet=lines[0] if lines else "",
                        title="Dockerfile sin directiva `USER` no-root",
                        remediation="Agrega un usuario sin privilegios (`USER node` / `USER appuser`) antes de `CMD`/`ENTRYPOINT`.",
                        source="micro-sast",
                    )
                )

        if is_sast_candidate:
            for idx, ln in enumerate(lines, start=1):
                stripped = ln.strip()
                if not stripped or stripped.startswith(("#", "//", "/*", "*")):
                    continue
                for rule in SAST_RULES:
                    sufs = rule["suffixes"]
                    if "Dockerfile" in sufs:
                        if not (name == "Dockerfile" or name.startswith("Dockerfile.")):
                            continue
                    elif suffix not in sufs:
                        continue
                    if rule["pattern"].search(ln):
                        findings.append(
                            _make_finding(
                                rule=rule["rule"],
                                pillar=rule["pillar"],
                                standard=rule["standard"],
                                severity=rule["severity"],
                                file_path=rel,
                                line=idx,
                                snippet=ln,
                                title=rule["title"],
                                remediation=rule["remediation"],
                                source="micro-sast",
                            )
                        )

        if is_wcag_candidate:
            for idx, ln in enumerate(lines, start=1):
                stripped = ln.strip()
                if not stripped or stripped.startswith(("//", "/*", "*", "<!--")):
                    continue
                for rule in WCAG_RULES:
                    if rule["pattern"].search(ln):
                        findings.append(
                            _make_finding(
                                rule=rule["rule"],
                                pillar=rule["pillar"],
                                standard=rule["standard"],
                                severity=rule["severity"],
                                file_path=rel,
                                line=idx,
                                snippet=ln,
                                title=rule["title"],
                                remediation=rule["remediation"],
                                source="wcag-static",
                            )
                        )

    return findings, scanned_files


def collect_verifiers(root: Path, with_network: bool = False) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """Ejecuta los verificadores del framework y transforma cada NO_CUMPLE en hallazgo accionable."""
    selected = list(vchecks.REGISTRY.values())
    if not with_network:
        selected = [fn for fn in selected if fn.__name__ not in ("versions_current", "dependencies_current")]

    raw_results = [fn(root) for fn in selected]
    by_name: Dict[str, Dict[str, Any]] = {}
    findings: List[Dict[str, Any]] = []

    for res in raw_results:
        by_name[res.verifier] = {
            "status": res.status,
            "method": res.method,
            "checked": res.checked,
            "detail": res.detail,
        }
        if res.status != vchecks.NO_CUMPLE:
            continue
        meta = VERIFIER_META.get(
            res.verifier,
            {
                "pillar": "desarrollo",
                "standard": "Verificadores del Framework",
                "severity": "MEDIA",
                "title": f"Incumplimiento en verificador `{res.verifier}`",
                "remediation": "Revisa los detalles del verificador y corrige los archivos señalados.",
            },
        )
        details = res.detail or [f"El verificador {res.verifier} reportó NO_CUMPLE."]
        for dline in details:
            fpath, lno = _parse_file_line_from_detail(dline)
            findings.append(
                _make_finding(
                    rule=f"VERIFIER-{res.verifier.upper()}",
                    pillar=meta["pillar"],
                    standard=meta["standard"],
                    severity=meta["severity"],
                    file_path=fpath,
                    line=lno,
                    snippet=dline,
                    title=meta["title"],
                    remediation=meta["remediation"],
                    source="verifiers",
                )
            )
    return findings, by_name


def _classify_doc(rel_path: str) -> str:
    low = rel_path.lower()
    name = Path(rel_path).name.lower()
    if "art-" in name or "/entregas/" in f"/{low}":
        return "Entregable C&A"
    if "adr" in low or low.startswith("decisions/"):
        return "Arquitectura / ADR"
    if "spec" in low:
        return "Especificación"
    if "instal" in name or "setup" in name or "desplieg" in name or "deploy" in name:
        return "Manual de Instalación"
    if "usuario" in low or "user" in name or "guia" in name or "manual" in low:
        return "Manual de Usuario / Operación"
    if name in ("readme.md", "changelog.md", "practicas.md", "contributing.md"):
        return "Documentación Base"
    return "Documentación Técnica"


def evaluate_documentation_and_manuals(root: Path) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
    """Audita documentación base, manuales (usuario/instalación/técnicos), enlaces rotos, SQL COMMENT ON y OpenAPI."""
    findings: List[Dict[str, Any]] = []
    manuals: List[Dict[str, Any]] = []
    checks: List[Dict[str, Any]] = []

    draft_marker_re = re.compile(r"\b(?:LOREM\s+IPSUM|TBD|PENDIENTE\s+DE\s+LLENAR)\b|\[COMPLETAR\]", re.IGNORECASE)
    md_link_re = re.compile(r"!?\[[^\]]*\]\(([^)\s]+)(?:\s+\"[^\"]*\")?\)")

    # 1. Inventario real de documentación y manuales
    doc_roots = ("docs", "documentacion", "manuales", "DECISIONS", "entregas")
    root_docs = ("README.md", "INSTALAR.md", "CHANGELOG.md", "PRACTICAS.md", "CONTRIBUTING.md")

    candidate_docs: List[Path] = []
    for name in root_docs:
        p = root / name
        if p.is_file():
            candidate_docs.append(p)
    for dname in doc_roots:
        dpath = root / dname
        if not dpath.is_dir():
            continue
        for fpath in _walk_source_files(dpath):
            if fpath.suffix.lower() in (".md", ".docx", ".pdf", ".html"):
                candidate_docs.append(fpath)

    seen_docs = set()
    broken_links_count = 0
    draft_docs_count = 0

    for fpath in candidate_docs:
        rel = fpath.relative_to(root).as_posix()
        if rel in seen_docs:
            continue
        seen_docs.add(rel)
        kind = _classify_doc(rel)
        size_bytes = 0
        has_h1 = False
        has_draft_marker = False
        broken_links: List[str] = []

        try:
            size_bytes = fpath.stat().st_size
            if fpath.suffix.lower() == ".md":
                text = fpath.read_text(encoding="utf-8", errors="replace")
                lines = text.splitlines()
                has_h1 = any(ln.lstrip().startswith("# ") for ln in lines[:25])
                in_fence = False
                for idx, ln in enumerate(lines, start=1):
                    if ln.strip().startswith("```"):
                        in_fence = not in_fence
                        continue
                    if in_fence:
                        continue
                    if draft_marker_re.search(ln):
                        has_draft_marker = True
                        draft_docs_count += 1
                        findings.append(
                            _make_finding(
                                rule="DOC-DRAFT-PLACEHOLDER",
                                pillar="documentacion",
                                standard="Estándar de Documentación y Manuales",
                                severity="MEDIA",
                                file_path=rel,
                                line=idx,
                                snippet=ln,
                                title="Marcador de borrador o texto sin completar en documento/manual",
                                remediation="Reemplaza los marcadores de borrador (`TBD`, `LOREM IPSUM`, `[COMPLETAR]`) con contenido real verificado.",
                                source="docs-audit",
                            )
                        )
                    for m in md_link_re.finditer(ln):
                        target = m.group(1).strip()
                        if not target or target.startswith(("#", "http://", "https://", "mailto:", "file://", "<")):
                            continue
                        clean_target = target.split("#", 1)[0].split("?", 1)[0]
                        if not clean_target or "<" in clean_target or ">" in clean_target or "*" in clean_target:
                            continue
                        resolved = (fpath.parent / clean_target).resolve()
                        if not resolved.exists() and not (root / clean_target.lstrip("/")).exists():
                            broken_links.append(f"L{idx}:{clean_target}")
                            broken_links_count += 1
                            findings.append(
                                _make_finding(
                                    rule="DOC-BROKEN-LINK",
                                    pillar="documentacion",
                                    standard="Estándar de Documentación y Manuales",
                                    severity="BAJA",
                                    file_path=rel,
                                    line=idx,
                                    snippet=ln,
                                    title=f"Enlace local roto en documentación (`{clean_target}`)",
                                    remediation="Corrige la ruta del enlace o elimina la referencia al archivo inexistente.",
                                    source="docs-audit",
                                )
                            )
        except OSError as exc:
            logger.error("No se pudo inspeccionar documento %s: %s", rel, exc, exc_info=True)

        manuals.append(
            {
                "path": rel,
                "kind": kind,
                "format": fpath.suffix.lower().lstrip(".") or "txt",
                "size_bytes": size_bytes,
                "has_h1": has_h1 if fpath.suffix.lower() == ".md" else None,
                "has_draft_marker": has_draft_marker,
                "broken_links": broken_links,
            }
        )

    # 2. README.md principal
    readme_path = root / "README.md"
    readme_ok = readme_path.is_file() and readme_path.stat().st_size >= 80
    checks.append(
        {
            "id": "DOC-README",
            "name": "README.md principal completo",
            "status": "CUMPLE" if readme_ok else "NO_CUMPLE",
            "evidence": f"README.md ({readme_path.stat().st_size} B)" if readme_path.is_file() else "No existe README.md en la raíz",
        }
    )
    if not readme_ok:
        findings.append(
            _make_finding(
                rule="DOC-README-MISSING",
                pillar="documentacion",
                standard="Estándar de Documentación / CMMI v3.0 (TS)",
                severity="MEDIA",
                file_path="README.md",
                line=None,
                snippet="README.md ausente o con menos de 80 bytes",
                title="Falta `README.md` principal o está prácticamente vacío",
                remediation="Documenta propósito, requisitos, cómo levantar el proyecto y cómo correr pruebas en `README.md`.",
                source="docs-audit",
            )
        )

    # 3. Manuales de instalación / usuario
    has_manual = any(
        m["kind"] in ("Manual de Instalación", "Manual de Usuario / Operación", "Entregable C&A") for m in manuals
    )
    checks.append(
        {
            "id": "DOC-MANUALS",
            "name": "Manuales de instalación / usuario presentes",
            "status": "CUMPLE" if has_manual else "NO_EVALUADO",
            "evidence": (
                f"{sum(1 for m in manuals if m['kind'] in ('Manual de Instalación', 'Manual de Usuario / Operación', 'Entregable C&A'))} manual(es) detectado(s)"
                if has_manual
                else "No se detectaron archivos dedicados en docs/, documentacion/, manuales/ o INSTALAR.md"
            ),
        }
    )

    # 4. Comentarios COMMENT ON en archivos SQL de aplicación
    sql_files = [
        p for p in _walk_source_files(root) if p.suffix.lower() == ".sql" and not _is_doc_or_test(p.relative_to(root).as_posix())
    ]
    sql_tables_total = 0
    sql_files_missing_comments: List[str] = []
    for sf in sql_files:
        rel = sf.relative_to(root).as_posix()
        txt = sf.read_text(encoding="utf-8", errors="replace")
        if re.search(r"\bCREATE\s+TABLE\b", txt, re.IGNORECASE):
            sql_tables_total += 1
            if not re.search(r"\bCOMMENT\s+ON\s+(?:TABLE|COLUMN)\b", txt, re.IGNORECASE):
                sql_files_missing_comments.append(rel)
                findings.append(
                    _make_finding(
                        rule="DOC-SQL-COMMENT-MISSING",
                        pillar="documentacion",
                        standard="Estándar de Documentación de BD (`COMMENT ON`)",
                        severity="BAJA",
                        file_path=rel,
                        line=1,
                        snippet="CREATE TABLE sin COMMENT ON TABLE/COLUMN",
                        title="Migración/esquema SQL crea tablas sin sentencias `COMMENT ON`",
                        remediation="Agrega `COMMENT ON TABLE` y `COMMENT ON COLUMN` para documentar el modelo de datos en PostgreSQL.",
                        source="docs-audit",
                    )
                )
    checks.append(
        {
            "id": "DOC-SQL-COMMENTS",
            "name": "Diccionario de datos en SQL (`COMMENT ON`)",
            "status": "NO_EVALUADO" if sql_tables_total == 0 else ("NO_CUMPLE" if sql_files_missing_comments else "CUMPLE"),
            "evidence": (
                "Sin archivos SQL con CREATE TABLE"
                if sql_tables_total == 0
                else f"{sql_tables_total - len(sql_files_missing_comments)}/{sql_tables_total} archivo(s) SQL documentados con COMMENT ON"
            ),
        }
    )

    # 5. Documentación OpenAPI / Swagger en endpoints de backend
    api_files_checked = 0
    api_files_missing_openapi: List[str] = []
    has_openapi_spec = any((root / p).is_file() for p in ("openapi.yaml", "openapi.yml", "openapi.json", "docs/openapi.yaml", "docs/openapi.json"))
    for fp in _walk_source_files(root):
        rel = fp.relative_to(root).as_posix()
        if _is_doc_or_test(rel):
            continue
        if fp.suffix.lower() not in (".java", ".py"):
            continue
        txt = fp.read_text(encoding="utf-8", errors="replace")
        is_spring_ctrl = fp.suffix.lower() == ".java" and "@RestController" in txt
        is_fastapi_ctrl = fp.suffix.lower() == ".py" and bool(re.search(r"@(?:router|app)\.(?:get|post|put|patch|delete)\s*\(", txt))
        if not is_spring_ctrl and not is_fastapi_ctrl:
            continue
        api_files_checked += 1
        documented = (
            ("@Operation" in txt or "@Tag" in txt or "@ApiResponse" in txt)
            if is_spring_ctrl
            else bool(re.search(r"\b(?:summary|description|responses)\s*=", txt) or '"""' in txt)
        )
        if not documented:
            api_files_missing_openapi.append(rel)
            findings.append(
                _make_finding(
                    rule="DOC-API-OPENAPI-MISSING",
                    pillar="documentacion",
                    standard="Estándar de Documentación API (OpenAPI / Swagger)",
                    severity="MEDIA",
                    file_path=rel,
                    line=1,
                    snippet="Controlador API sin anotaciones/resúmenes OpenAPI",
                    title="Controlador de API sin documentación OpenAPI (`@Operation` / `summary=` / respuestas)",
                    remediation="Documenta cada endpoint con `@Operation` + `@ApiResponses` (Spring) o `summary=`/`responses=` + docstring (FastAPI).",
                    source="docs-audit",
                )
            )
    checks.append(
        {
            "id": "DOC-API-OPENAPI",
            "name": "Contratos OpenAPI / Swagger en endpoints",
            "status": (
                "CUMPLE"
                if (api_files_checked > 0 and not api_files_missing_openapi) or has_openapi_spec
                else ("NO_CUMPLE" if api_files_missing_openapi else "NO_EVALUADO")
            ),
            "evidence": (
                f"{api_files_checked - len(api_files_missing_openapi)}/{api_files_checked} controladores documentados (spec raíz={has_openapi_spec})"
                if api_files_checked > 0
                else ("Especificación OpenAPI encontrada" if has_openapi_spec else "Sin controladores FastAPI/Spring en el repositorio")
            ),
        }
    )

    # 6. Enlaces y borradores en documentación
    checks.append(
        {
            "id": "DOC-INTEGRITY",
            "name": "Integridad de manuales (sin enlaces rotos ni marcadores borrador)",
            "status": "NO_CUMPLE" if (broken_links_count > 0 or draft_docs_count > 0) else ("CUMPLE" if manuals else "NO_EVALUADO"),
            "evidence": f"{len(manuals)} documento(s) revisado(s) · enlaces rotos={broken_links_count} · marcadores borrador={draft_docs_count}",
        }
    )

    doc_report = {
        "total_documents": len(manuals),
        "broken_links": broken_links_count,
        "draft_markers": draft_docs_count,
        "checks": checks,
        "documents": manuals,
    }
    return doc_report, findings


def evaluate_casmarts_standards(
    root: Path,
    verifier_map: Dict[str, Any],
    existing_findings: Optional[List[Dict[str, Any]]] = None,
) -> Tuple[Dict[str, Any], List[Dict[str, Any]], List[Dict[str, Any]]]:
    """Detecta si el Kit CASMARTS está instalado y verifica el cumplimiento de la Metodología C&A y estándares CASMARTS."""
    marker_paths = (
        ".agents/skills/estandares-desarrollo-casmarts",
        "skills/estandares-desarrollo-casmarts",
        ".agents/skills/metodologia-ca",
        "skills/metodologia-ca",
        "rules/centinela/rules.md",
        ".agents/skills/postgres-audit",
        ".agents/skills/reglas-negocio-core-starter",
        ".agents/skills/manuales-usuario-ca",
        "kit/overlay.json",
    )
    found_markers = [m for m in marker_paths if (root / m).exists()]
    detected = len(found_markers) > 0
    existing_findings = existing_findings or []

    if not detected:
        profile = {
            "detected": False,
            "profile": "Estándar base (Kit CASMARTS no instalado)",
            "markers": [],
        }
        controls = [
            {
                "framework": "Metodología y Estándares CASMARTS",
                "control_id": "KIT-CASMARTS",
                "name": "Metodología C&A (Manual v3.7) y estándares específicos del Kit CASMARTS",
                "status": "NO_EVALUADO",
                "evidence": "Kit CASMARTS no detectado en este repositorio; se aplican únicamente los estándares base del framework.",
            }
        ]
        return profile, controls, []

    profile = {
        "detected": True,
        "profile": "Kit CASMARTS / Metodología C&A activa",
        "markers": found_markers,
    }
    controls: List[Dict[str, Any]] = []
    findings: List[Dict[str, Any]] = []

    # 1. Metodología C&A — Etapa 1: Especificaciones con los 6 campos obligatorios (Guía de Análisis v1.2)
    spec_files: List[Path] = []
    if (root / "docs" / "specs").is_dir():
        spec_files.extend(sorted((root / "docs" / "specs").rglob("spec.md")))
    if (root / ".agent" / "SPECS.md").is_file() and not spec_files:
        spec_files.append(root / ".agent" / "SPECS.md")

    six_field_checks = (
        ("Actor", re.compile(r"\bactor(?:es)?\b", re.IGNORECASE)),
        ("Camino principal", re.compile(r"\bcamino\s+principal|flujo\s+principal\b", re.IGNORECASE)),
        ("Alternos", re.compile(r"\balterno(?:s)?|flujos?\s+alterno|desv[ií]o", re.IGNORECASE)),
        ("Reglas de negocio", re.compile(r"\breglas?\s+de\s+negocio|\bRN[-_ ]?\d+", re.IGNORECASE)),
        ("Criterios de aceptación", re.compile(r"\bcriterios?\s+de\s+aceptaci[oó]n\b", re.IGNORECASE)),
    )
    subjective_re = re.compile(r"\b(?:r[aá]pido|f[aá]cil\s+de\s+usar|amigable|intuitivo|bonito|agradable)\b", re.IGNORECASE)

    incomplete_specs: List[str] = []
    subjective_hits = 0
    for sf in spec_files:
        rel = sf.relative_to(root).as_posix()
        txt = sf.read_text(encoding="utf-8", errors="replace")
        has_title = any(ln.lstrip().startswith("#") for ln in txt.splitlines()[:15])
        missing_fields = [label for label, pat in six_field_checks if not pat.search(txt)]
        if not has_title:
            missing_fields.insert(0, "Nombre")
        if missing_fields:
            incomplete_specs.append(f"{rel} (faltan: {', '.join(missing_fields)})")
            findings.append(
                _make_finding(
                    rule="CASMART-MET-6CAMPOS",
                    pillar="casmarts",
                    standard="Metodología C&A — Etapa 1 · Guía de Análisis v1.2 (ART-F1-03)",
                    severity="MEDIA",
                    file_path=rel,
                    line=1,
                    snippet=f"Campos faltantes en especificación: {', '.join(missing_fields)}",
                    title="Especificación incompleta frente a los 6 campos de la Metodología C&A",
                    remediation="Completa los 6 campos obligatorios: Nombre (verbo + resultado), Actor, Camino principal, Alternos, Reglas de negocio (RN) y Criterios de aceptación comprobables.",
                    source="casmarts-kit",
                )
            )
        for idx, ln in enumerate(txt.splitlines(), start=1):
            if subjective_re.search(ln):
                subjective_hits += 1
                findings.append(
                    _make_finding(
                        rule="CASMART-MET-CRITERIO-SUBJETIVO",
                        pillar="casmarts",
                        standard="Metodología C&A — Etapa 1 · Guía de Análisis v1.2",
                        severity="BAJA",
                        file_path=rel,
                        line=idx,
                        snippet=ln,
                        title="Criterio o redacción subjetiva no comprobable en especificación",
                        remediation="Sustituye adjetivos subjetivos («rápido», «fácil», «amigable», «intuitivo») por criterios medibles y verificables sin opinión.",
                        source="casmarts-kit",
                    )
                )

    controls.append(
        {
            "framework": "Metodología y Estándares CASMARTS",
            "control_id": "CASMART-MET-ETAPA1",
            "name": "Etapa 1 · Requerimientos con los 6 campos C&A y criterios comprobables",
            "status": (
                "NO_EVALUADO"
                if not spec_files
                else ("NO_CUMPLE" if (incomplete_specs or subjective_hits > 0) else "CUMPLE")
            ),
            "evidence": (
                "Sin especificaciones en docs/specs/*/spec.md ni .agent/SPECS.md"
                if not spec_files
                else f"{len(spec_files) - len(incomplete_specs)}/{len(spec_files)} especificación(es) completas; criterios subjetivos={subjective_hits}"
            ),
        }
    )

    # 2. Etapa 1–3 · Trazabilidad (ART-F1-04 / spec_traceability) y calidad de pruebas
    spec_tr = verifier_map.get("spec_traceability", {}).get("status", "NO_EVALUADO")
    tests_iso = verifier_map.get("tests_isolated", {}).get("status", "NO_EVALUADO")
    no_stubs_st = verifier_map.get("no_stubs", {}).get("status", "NO_EVALUADO")
    no_silent_st = verifier_map.get("no_silent_except", {}).get("status", "NO_EVALUADO")
    qa_statuses = (tests_iso, no_stubs_st, no_silent_st)
    controls.append(
        {
            "framework": "Metodología y Estándares CASMARTS",
            "control_id": "CASMART-MET-ETAPA3-QA",
            "name": "Etapa 3 · Construcción y QA (código real sin stubs, manejo de errores y pruebas aisladas)",
            "status": (
                "NO_CUMPLE"
                if "NO_CUMPLE" in qa_statuses or spec_tr == "NO_CUMPLE"
                else ("CUMPLE" if "CUMPLE" in qa_statuses else "NO_EVALUADO")
            ),
            "evidence": f"no_stubs={no_stubs_st}; no_silent_except={no_silent_st}; tests_isolated={tests_iso}; spec_traceability={spec_tr}",
        }
    )

    # 3. Etapa 2 · Accesibilidad WCAG 2.1 AA (requisito legal obligatorio en CASMARTS)
    wcag_findings = [f for f in existing_findings if f["pillar"] == "accesibilidad"]
    controls.append(
        {
            "framework": "Metodología y Estándares CASMARTS",
            "control_id": "CASMART-MET-WCAG",
            "name": "Etapa 2 · Accesibilidad WCAG 2.1 AA (obligatoria en proyectos CASMARTS)",
            "status": "NO_CUMPLE" if wcag_findings else "CUMPLE",
            "evidence": f"{len(wcag_findings)} hallazgo(s) estáticos WCAG 2.1 detectados en plantillas UI",
        }
    )

    # 4. Estándar de Auditoría PostgreSQL CASMART (uuidv7 + triggers de auditoría)
    pk_st = verifier_map.get("pk_uuid", {}).get("status", "NO_EVALUADO")
    trig_st = verifier_map.get("audit_triggers", {}).get("status", "NO_EVALUADO")
    sql_audit_status = (
        "NO_CUMPLE"
        if "NO_CUMPLE" in (pk_st, trig_st)
        else ("CUMPLE" if "CUMPLE" in (pk_st, trig_st) else "NO_EVALUADO")
    )
    controls.append(
        {
            "framework": "Metodología y Estándares CASMARTS",
            "control_id": "CASMART-SQL-AUDIT",
            "name": "Estándar de Auditoría PostgreSQL CASMART (PK UUIDv7 + triggers de auditoría)",
            "status": sql_audit_status,
            "evidence": f"pk_uuid={pk_st}; audit_triggers={trig_st}",
        }
    )

    # 5. Autorización Spring @PreAuthorize y delegación OIDC (Authentik)
    spring_ctrls = []
    missing_preauth = []
    for fp in _walk_source_files(root):
        rel = fp.relative_to(root).as_posix()
        if _is_doc_or_test(rel) or fp.suffix.lower() != ".java":
            continue
        txt = fp.read_text(encoding="utf-8", errors="replace")
        if "@RestController" in txt:
            spring_ctrls.append(rel)
            if "@PreAuthorize" not in txt:
                missing_preauth.append(rel)
                findings.append(
                    _make_finding(
                        rule="CASMART-SPRING-PREAUTHORIZE",
                        pillar="casmarts",
                        standard="Estándar CASMARTS / Seguridad Spring Boot",
                        severity="CRITICA",
                        file_path=rel,
                        line=1,
                        snippet="@RestController sin anotación @PreAuthorize",
                        title="Controlador Spring Boot sin `@PreAuthorize` explícito",
                        remediation="Anota cada endpoint con `@PreAuthorize(...)` o justifica rutas públicas en `.agent/public-routes.txt`.",
                        source="casmarts-kit",
                    )
                )
    controls.append(
        {
            "framework": "Metodología y Estándares CASMARTS",
            "control_id": "CASMART-AUTHZ-OIDC",
            "name": "Autorización por método (`@PreAuthorize`) y delegación OIDC (Authentik)",
            "status": (
                "NO_EVALUADO"
                if not spring_ctrls
                else ("NO_CUMPLE" if missing_preauth else "CUMPLE")
            ),
            "evidence": (
                "Sin controladores Spring Boot (`@RestController`) en este repositorio"
                if not spring_ctrls
                else f"{len(spring_ctrls) - len(missing_preauth)}/{len(spring_ctrls)} controladores con @PreAuthorize"
            ),
        }
    )

    # 6. Integridad del kit y reglas obligatorias (AGENTS.md + rules/centinela/rules.md)
    has_agents_md = (root / "AGENTS.md").is_file() or (root / ".agents" / "AGENTS.md").is_file()
    has_centinela_rules = (root / "rules" / "centinela" / "rules.md").is_file() or (
        root / "kit" / "add" / "rules" / "centinela" / "rules.md"
    ).is_file()
    kit_ok = has_agents_md and has_centinela_rules
    controls.append(
        {
            "framework": "Metodología y Estándares CASMARTS",
            "control_id": "CASMART-KIT-RULES",
            "name": "Reglas obligatorias del Kit (`AGENTS.md` + `rules/centinela/rules.md`)",
            "status": "CUMPLE" if kit_ok else "NO_CUMPLE",
            "evidence": f"AGENTS.md={has_agents_md}; rules/centinela/rules.md={has_centinela_rules}",
        }
    )
    if not kit_ok:
        findings.append(
            _make_finding(
                rule="CASMART-KIT-INCOMPLETE",
                pillar="casmarts",
                standard="Estándar CASMARTS (Kit de Agente)",
                severity="MEDIA",
                file_path="AGENTS.md",
                line=None,
                snippet=f"AGENTS.md={has_agents_md}, rules/centinela/rules.md={has_centinela_rules}",
                title="Instalación incompleta del Kit CASMARTS en el repositorio",
                remediation="Reinstala o sincroniza el Kit CASMARTS vigente asegurando `AGENTS.md` y `rules/centinela/rules.md`.",
                source="casmarts-kit",
            )
        )

    # 7. Cierre de etapa (Checklist 0A-4 / ART-MC-02, tailoring 0A-2b, entregables firmados ART-* y UAT)
    art_files = [
        p.relative_to(root).as_posix()
        for p in _walk_source_files(root)
        if re.search(r"ART-[A-Z0-9]+-\d+", p.name, re.IGNORECASE)
    ]
    controls.append(
        {
            "framework": "Metodología y Estándares CASMARTS",
            "control_id": "CASMART-MET-CIERRE",
            "name": "Etapas 4–5 · UAT, entregables firmados (`ART-*`), tailoring 0A-2b y checklist 0A-4 (`ART-MC-02`)",
            "status": "NO_EVALUADO",
            "evidence": (
                f"{len(art_files)} artefacto(s) ART-* detectado(s) en el repo ({', '.join(art_files[:4])}); las firmas humanas, UAT y checklist 0A-4 se validan fuera del análisis estático."
                if art_files
                else "No se detectaron artefactos ART-* en el repositorio; las firmas, UAT, tailoring 0A-2b y checklist 0A-4 deben validarse con `generador-entregables-ca`."
            ),
        }
    )

    return profile, controls, findings


def evaluate_cmmi_and_iso(
    root: Path,
    verifier_map: Dict[str, Any],
    all_findings: List[Dict[str, Any]],
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """Evalúa honestamente controles verificables en el repositorio para CMMI v3.0 e ISO/IEC 27001:2022.

    Controles que requieren evidencia fuera del repositorio (actas, aprobaciones de MR, controles físicos)
    se declaran explícitamente como NO_EVALUADO.
    """
    controls: List[Dict[str, Any]] = []
    findings: List[Dict[str, Any]] = []

    has_specs = (root / ".agent" / "SPECS.md").is_file() or (root / "docs" / "specs").is_dir()
    has_adrs = any((root / d).is_dir() and any((root / d).glob("*.md")) for d in ("DECISIONS", "documentacion/adr", "docs/adr"))
    has_readme = (root / "README.md").is_file()
    has_tests = (root / "tests").is_dir() or any(
        p.name.endswith((".test.ts", ".test.tsx", ".test.js", ".spec.ts", ".spec.js"))
        for p in _walk_source_files(root)[:400]
    )
    has_ci = (root / ".gitlab-ci.yml").is_file() or (root / ".github" / "workflows").is_dir()
    has_secret_hooks = any(
        (root / f).is_file()
        for f in ("lefthook.yml", ".lefthook.yml", ".pre-commit-config.yaml", "templates/git-hooks/lefthook.yml")
    )
    has_changelog = (root / "CHANGELOG.md").is_file()

    sec_findings = [f for f in all_findings if f["pillar"] == "seguridad"]
    dep_findings = [f for f in all_findings if f["pillar"] == "dependencias"]
    obs_min = verifier_map.get("observability_min", {}).get("status", "NO_EVALUADO")
    obs_prod = verifier_map.get("observability_production", {}).get("status", "NO_EVALUADO")
    spec_tr = verifier_map.get("spec_traceability", {}).get("status", "NO_EVALUADO")
    tests_iso = verifier_map.get("tests_isolated", {}).get("status", "NO_EVALUADO")
    compose_vol = verifier_map.get("compose_volumes", {}).get("status", "NO_EVALUADO")

    def add_control(
        framework: str,
        control_id: str,
        name: str,
        status: str,
        evidence: str,
        rule_id: Optional[str] = None,
        remediation: Optional[str] = None,
        severity: str = "MEDIA",
    ) -> None:
        controls.append(
            {
                "framework": framework,
                "control_id": control_id,
                "name": name,
                "status": status,
                "evidence": evidence,
            }
        )
        if status == "NO_CUMPLE" and rule_id and remediation:
            findings.append(
                _make_finding(
                    rule=rule_id,
                    pillar="cmmi" if framework == "CMMI v3.0" else "iso27001",
                    standard=f"{framework} ({control_id})",
                    severity=severity,
                    file_path=None,
                    line=None,
                    snippet=evidence,
                    title=f"{name} ({control_id}): sin evidencia requerida en el repositorio",
                    remediation=remediation,
                    source="cmmi-iso",
                )
            )

    # --- CMMI v3.0 ---
    add_control(
        "CMMI v3.0",
        "RD (Requisitos y Trazabilidad)",
        "Especificaciones versionadas y trazabilidad a pruebas",
        "NO_CUMPLE" if (not has_specs or spec_tr == "NO_CUMPLE") else "CUMPLE",
        f"Specs presentes={has_specs}; spec_traceability={spec_tr}",
        rule_id="CMMI-RD-SPECS",
        remediation="Documenta requisitos en `.agent/SPECS.md` o `docs/specs/` y enlázalos desde las pruebas automatizadas.",
    )
    add_control(
        "CMMI v3.0",
        "TS (Solución Técnica)",
        "Documentación técnica (README y ADRs)",
        "CUMPLE" if (has_readme and has_adrs) else "NO_CUMPLE",
        f"README.md={has_readme}; ADRs en DECISIONS/={has_adrs}",
        rule_id="CMMI-TS-DOCS",
        remediation="Mantén `README.md` actualizado y registra decisiones arquitectónicas en `DECISIONS/`.",
        severity="BAJA",
    )
    add_control(
        "CMMI v3.0",
        "VER (Verificación)",
        "Suite de pruebas automatizadas y aisladas",
        "NO_CUMPLE" if (not has_tests or tests_iso == "NO_CUMPLE") else "CUMPLE",
        f"Pruebas presentes={has_tests}; tests_isolated={tests_iso}",
        rule_id="CMMI-VER-TESTS",
        remediation="Agrega pruebas automatizadas aisladas de ambientes productivos.",
        severity="ALTA",
    )
    add_control(
        "CMMI v3.0",
        "CM (Gestión de Configuración)",
        "Control de cambios (CI y CHANGELOG)",
        "CUMPLE" if (has_ci or has_changelog) else "NO_CUMPLE",
        f"Pipeline CI={has_ci}; CHANGELOG.md={has_changelog}",
        rule_id="CMMI-CM-CONFIG",
        remediation="Configura pipeline CI (`.gitlab-ci.yml` o `.github/workflows/`) y mantén `CHANGELOG.md`.",
        severity="BAJA",
    )
    add_control(
        "CMMI v3.0",
        "PPQA / GOV (Revisión por pares y gobierno)",
        "Aprobaciones de Merge Request, actas y auditorías de proceso",
        "NO_EVALUADO",
        "Requiere consultar el servidor Git/actas de gobierno; no es medible solo desde el árbol local.",
    )

    # --- ISO/IEC 27001:2022 Anexo A ---
    add_control(
        "ISO 27001",
        "A.8.25 / A.8.28",
        "Desarrollo y codificación segura",
        "NO_CUMPLE" if sec_findings else "CUMPLE",
        f"{len(sec_findings)} hallazgo(s) de seguridad detectados en el árbol local",
    )
    add_control(
        "ISO 27001",
        "A.8.24 / A.8.9",
        "Prevención de fuga de secretos y hooks de configuración",
        "CUMPLE" if has_secret_hooks else "NO_CUMPLE",
        f"Configuración de hooks anti-secretos (lefthook/pre-commit)={has_secret_hooks}",
        rule_id="ISO-A824-SECRET-HOOKS",
        remediation="Configura `lefthook.yml` con `gitleaks` o `.pre-commit-config.yaml` para bloquear secretos antes del commit.",
    )
    add_control(
        "ISO 27001",
        "A.8.8",
        "Gestión de vulnerabilidades técnicas y dependencias",
        "NO_CUMPLE" if dep_findings else ("CUMPLE" if "dependencies_current" in verifier_map else "NO_EVALUADO"),
        (
            f"{len(dep_findings)} hallazgo(s) de versiones/dependencias"
            if (dep_findings or "dependencies_current" in verifier_map)
            else "Ejecuta con `--with-network` o genera `data/outdated-dependencies.json` para evaluar versiones en registros."
        ),
    )
    add_control(
        "ISO 27001",
        "A.8.15",
        "Registro de eventos y observabilidad",
        "NO_CUMPLE" if ("NO_CUMPLE" in (obs_min, obs_prod)) else ("CUMPLE" if "CUMPLE" in (obs_min, obs_prod) else "NO_EVALUADO"),
        f"observability_min={obs_min}; observability_production={obs_prod}; compose_volumes={compose_vol}",
    )
    add_control(
        "ISO 27001",
        "A.5 / A.6 / A.7",
        "Controles organizacionales, de personal y seguridad física",
        "NO_EVALUADO",
        "Fuera de alcance del análisis estático de código; requiere evidencia documental y auditoría organizacional.",
    )

    return controls, findings


def load_imported_reports(root: Path, data_dir: Path) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """Importa hallazgos reales desde `data/hallazgos.json`, `data/outdated-dependencies.json` y `data/*.sarif`."""
    findings: List[Dict[str, Any]] = []
    sources_meta: List[Dict[str, Any]] = []

    # 1. data/hallazgos.json (formato de skill auditoria-codigo)
    hallazgos_path = data_dir / "hallazgos.json"
    if hallazgos_path.is_file():
        try:
            raw = json.loads(hallazgos_path.read_text(encoding="utf-8"))
            items = raw.get("hallazgos", []) if isinstance(raw, dict) else []
            count = 0
            for item in items:
                if str(item.get("estado", "abierto")).lower() in ("corregido", "falso_positivo"):
                    continue
                lineas = item.get("lineas") or []
                lno = int(lineas[0]) if isinstance(lineas, list) and lineas and str(lineas[0]).isdigit() else None
                cat = str(item.get("categoria", "VULNERABILIDAD")).upper()
                pillar = "seguridad" if "VULN" in cat else ("accesibilidad" if "ACCES" in cat else "desarrollo")
                findings.append(
                    _make_finding(
                        rule=str(item.get("regla") or item.get("id") or "AUDIT-FINDING"),
                        pillar=pillar,
                        standard=f"Auditoría de código ({cat})",
                        severity=str(item.get("severidad") or "MEDIA").replace("Í", "I"),
                        file_path=item.get("archivo"),
                        line=lno,
                        snippet=str(item.get("evidencia") or ""),
                        title=str(item.get("titulo") or item.get("regla") or "Hallazgo de auditoría"),
                        remediation=str(item.get("remediacion") or "Revisar y corregir según el catálogo de reglas."),
                        source="hallazgos.json",
                    )
                )
                count += 1
            sources_meta.append({"source": "data/hallazgos.json", "status": "CARGADO", "findings": count})
        except (OSError, json.JSONDecodeError) as exc:
            logger.error("No se pudo leer %s: %s", hallazgos_path, exc, exc_info=True)
            sources_meta.append({"source": "data/hallazgos.json", "status": "ERROR", "error": str(exc)})

    # 2. data/outdated-dependencies.json
    deps_path = data_dir / "outdated-dependencies.json"
    if deps_path.is_file():
        try:
            raw = json.loads(deps_path.read_text(encoding="utf-8"))
            deps = raw.get("dependencies", []) if isinstance(raw, dict) else []
            count = 0
            for dep in deps:
                st = str(dep.get("status", "")).lower()
                if st not in ("outdated_major", "outdated_minor"):
                    continue
                sev = "ALTA" if st == "outdated_major" else "MEDIA"
                findings.append(
                    _make_finding(
                        rule="DEPS-OUTDATED",
                        pillar="dependencias",
                        standard="OWASP A06 / ISO 27001 A.8.8",
                        severity=sev,
                        file_path=dep.get("manifest"),
                        line=None,
                        snippet=f"{dep.get('name')}: {dep.get('current')} -> {dep.get('latest')} ({st})",
                        title=f"Dependencia desactualizada: {dep.get('name')} ({dep.get('current')} → {dep.get('latest')})",
                        remediation="Actualiza la dependencia al rango vigente y regenera el lockfile.",
                        source="outdated-deps",
                    )
                )
                count += 1
            sources_meta.append({"source": "data/outdated-dependencies.json", "status": "CARGADO", "findings": count})
        except (OSError, json.JSONDecodeError) as exc:
            logger.error("No se pudo leer %s: %s", deps_path, exc, exc_info=True)
            sources_meta.append({"source": "data/outdated-dependencies.json", "status": "ERROR", "error": str(exc)})

    # 3. data/*.sarif (OASIS SARIF 2.1.0)
    if data_dir.is_dir():
        for sarif_file in sorted(data_dir.glob("*.sarif")):
            try:
                raw = json.loads(sarif_file.read_text(encoding="utf-8"))
                count = 0
                for run in raw.get("runs", []) or []:
                    tool_name = (run.get("tool", {}).get("driver", {}).get("name") or "sarif").lower()
                    for res in run.get("results", []) or []:
                        rule_id = str(res.get("ruleId") or "SARIF-RULE")
                        level = str(res.get("level") or "warning").lower()
                        sev = "ALTA" if level == "error" else ("MEDIA" if level == "warning" else "BAJA")
                        locs = res.get("locations") or []
                        phys = locs[0].get("physicalLocation", {}) if locs else {}
                        uri = phys.get("artifactLocation", {}).get("uri")
                        lno = phys.get("region", {}).get("startLine")
                        msg = (res.get("message") or {}).get("text") or rule_id
                        findings.append(
                            _make_finding(
                                rule=rule_id,
                                pillar="seguridad",
                                standard=f"SARIF ({tool_name})",
                                severity=sev,
                                file_path=uri,
                                line=int(lno) if isinstance(lno, int) else None,
                                snippet=msg,
                                title=msg[:160],
                                remediation="Revisa la regla reportada en el archivo SARIF y aplica la mitigación correspondiente.",
                                source="sarif",
                            )
                        )
                        count += 1
                sources_meta.append({"source": f"data/{sarif_file.name}", "status": "CARGADO", "findings": count})
            except (OSError, json.JSONDecodeError) as exc:
                logger.error("No se pudo leer %s: %s", sarif_file, exc, exc_info=True)
                sources_meta.append({"source": f"data/{sarif_file.name}", "status": "ERROR", "error": str(exc)})

    return findings, sources_meta


def run_optional_external_tools(root: Path, enabled: bool = True, timeout: int = 30) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """Ejecuta herramientas externas opcionales SOLO si ya están instaladas en PATH (semgrep, gitleaks, trivy)."""
    tool_specs = [
        ("semgrep", "Análisis SAST multi-lenguaje", "pip install semgrep"),
        ("gitleaks", "Detección especializada de secretos", "https://github.com/gitleaks/gitleaks"),
        ("trivy", "Escáner IaC y vulnerabilidades de dependencias", "https://trivy.dev"),
    ]
    findings: List[Dict[str, Any]] = []
    statuses: List[Dict[str, Any]] = []

    for tool, desc, install_hint in tool_specs:
        exe = shutil.which(tool)
        if not exe:
            statuses.append(
                {
                    "tool": tool,
                    "description": desc,
                    "status": "NO_INSTALADO",
                    "findings": 0,
                    "hint": install_hint,
                }
            )
            continue
        if not enabled:
            statuses.append(
                {
                    "tool": tool,
                    "description": desc,
                    "status": "OMITIDO",
                    "findings": 0,
                    "hint": "Activa la opción de herramientas externas para ejecutarlo.",
                }
            )
            continue

        try:
            count = 0
            if tool == "gitleaks":
                with tempfile.TemporaryDirectory() as tmpd:
                    rep = Path(tmpd) / "gitleaks.json"
                    proc = subprocess.run(
                        [exe, "detect", "--source", str(root), "--no-git", "--report-format", "json", "--report-path", str(rep)],
                        capture_output=True,
                        text=True,
                        timeout=timeout,
                    )
                    if rep.is_file():
                        data = json.loads(rep.read_text(encoding="utf-8") or "[]")
                        for item in data if isinstance(data, list) else []:
                            findings.append(
                                _make_finding(
                                    rule=f"GITLEAKS-{item.get('RuleID', 'SECRET')}",
                                    pillar="seguridad",
                                    standard="OWASP A07 / ISO 27001 A.8.24",
                                    severity="CRITICA",
                                    file_path=item.get("File"),
                                    line=item.get("StartLine"),
                                    snippet=str(item.get("Description") or "Secreto detectado por gitleaks"),
                                    title=str(item.get("Description") or "Secreto potencial detectado por Gitleaks"),
                                    remediation="Rota el secreto y elimínalo del código fuente y del historial.",
                                    source="gitleaks",
                                )
                            )
                            count += 1
                    elif proc.returncode not in (0, 1):
                        raise RuntimeError((proc.stderr or f"exit {proc.returncode}").strip()[:200])
            elif tool == "semgrep":
                proc = subprocess.run(
                    [exe, "scan", "--config", "auto", "--json", "--quiet", "--metrics=off", str(root)],
                    capture_output=True,
                    text=True,
                    timeout=timeout,
                )
                if proc.stdout.strip():
                    data = json.loads(proc.stdout)
                    for item in data.get("results", []) or []:
                        extra = item.get("extra") or {}
                        sev_raw = str(extra.get("severity") or "WARNING").upper()
                        sev = "ALTA" if sev_raw == "ERROR" else ("MEDIA" if sev_raw == "WARNING" else "BAJA")
                        fpath = item.get("path", "")
                        try:
                            rel = Path(fpath).resolve().relative_to(root.resolve()).as_posix()
                        except ValueError:
                            rel = fpath
                        findings.append(
                            _make_finding(
                                rule=str(item.get("check_id") or "SEMGREP"),
                                pillar="seguridad",
                                standard="Semgrep SAST",
                                severity=sev,
                                file_path=rel,
                                line=(item.get("start") or {}).get("line"),
                                snippet=str(extra.get("message") or ""),
                                title=str(extra.get("message") or item.get("check_id") or "Hallazgo Semgrep")[:180],
                                remediation="Aplica la mitigación recomendada por la regla Semgrep.",
                                source="semgrep",
                            )
                        )
                        count += 1
            elif tool == "trivy":
                proc = subprocess.run(
                    [exe, "fs", "--scanners", "vuln,misconfig", "--format", "json", "--quiet", str(root)],
                    capture_output=True,
                    text=True,
                    timeout=timeout,
                )
                if proc.stdout.strip():
                    data = json.loads(proc.stdout)
                    for res in data.get("Results", []) or []:
                        target = res.get("Target")
                        for v in res.get("Vulnerabilities", []) or []:
                            sev_map = {"CRITICAL": "CRITICA", "HIGH": "ALTA", "MEDIUM": "MEDIA", "LOW": "BAJA"}
                            findings.append(
                                _make_finding(
                                    rule=str(v.get("VulnerabilityID") or "TRIVY-CVE"),
                                    pillar="dependencias",
                                    standard="OWASP A06 / Trivy SCA",
                                    severity=sev_map.get(str(v.get("Severity", "")).upper(), "MEDIA"),
                                    file_path=target,
                                    line=None,
                                    snippet=f"{v.get('PkgName')} {v.get('InstalledVersion')} -> fix {v.get('FixedVersion') or 'N/D'}",
                                    title=str(v.get("Title") or v.get("VulnerabilityID") or "Vulnerabilidad en dependencia")[:180],
                                    remediation=f"Actualiza `{v.get('PkgName')}` a `{v.get('FixedVersion')}`." if v.get("FixedVersion") else "Revisa mitigación o reemplazo del paquete vulnerable.",
                                    source="trivy",
                                )
                            )
                            count += 1
            statuses.append({"tool": tool, "description": desc, "status": "EJECUTADO", "findings": count, "hint": None})
        except (OSError, subprocess.TimeoutExpired, json.JSONDecodeError, RuntimeError) as exc:
            logger.error("Error ejecutando herramienta externa %s: %s", tool, exc, exc_info=True)
            statuses.append(
                {
                    "tool": tool,
                    "description": desc,
                    "status": "ERROR",
                    "findings": 0,
                    "hint": str(exc)[:180],
                }
            )

    return findings, statuses


def query_optional_preflight(root: Path, findings: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Consulta opcional al escáner corporativo (p. ej. Centinela) si PREFLIGHT_URL está configurado."""
    base_url = os.getenv("PREFLIGHT_URL", "").strip()
    if not base_url:
        return {
            "configured": False,
            "available": False,
            "asset": os.getenv("ROS_PROJECT_ID") or root.name,
            "findings": [],
            "reason": "PREFLIGHT_URL no está configurado (modo 100% local).",
        }
    try:
        from agent import preflight_client

        asset = os.getenv("ROS_PROJECT_ID") or root.name
        candidate_paths = sorted({f["file"] for f in findings if f.get("file")})[:25]
        if not candidate_paths:
            candidate_paths = [
                p.relative_to(root).as_posix()
                for p in _walk_source_files(root)
                if not _is_doc_or_test(p.relative_to(root).as_posix())
            ][:15]
        res = preflight_client.query(asset=asset, paths=candidate_paths, base_url=base_url, timeout=8.0)
        return {
            "configured": True,
            "available": bool(res.get("available")),
            "asset": asset,
            "known_asset": res.get("known_asset"),
            "last_audit": res.get("last_audit"),
            "engines_seen": res.get("engines_seen") or [],
            "findings": res.get("findings") or [],
            "reason": res.get("reason"),
        }
    except Exception as exc:  # noqa: BLE001
        logger.error("Fallo al consultar PREFLIGHT_URL: %s", exc, exc_info=True)
        return {
            "configured": True,
            "available": False,
            "asset": os.getenv("ROS_PROJECT_ID") or root.name,
            "findings": [],
            "reason": f"Error consultando PREFLIGHT_URL: {exc}",
        }


def run_micro_audit(
    root: Path,
    *,
    data_dir: Optional[Path] = None,
    with_network: bool = False,
    with_tools: bool = True,
    previous_report_path: Optional[Path] = None,
) -> Dict[str, Any]:
    """Ejecuta el micro-auditor completo sobre `root` y devuelve un informe JSON estructurado."""
    root = Path(root).resolve()
    data_dir = Path(data_dir).resolve() if data_dir else (root / "data")

    sast_findings, scanned_files = scan_sast_and_wcag(root)
    verifier_findings, verifier_map = collect_verifiers(root, with_network=with_network)
    imported_findings, imported_sources = load_imported_reports(root, data_dir)
    tool_findings, external_tools = run_optional_external_tools(root, enabled=with_tools)
    doc_audit, doc_findings = evaluate_documentation_and_manuals(root)
    base_findings = sast_findings + verifier_findings + imported_findings + tool_findings + doc_findings
    casmarts_profile, casmarts_controls, casmarts_findings = evaluate_casmarts_standards(
        root, verifier_map, base_findings
    )

    combined = base_findings + casmarts_findings
    cmmi_iso_controls, compliance_findings = evaluate_cmmi_and_iso(root, verifier_map, combined)
    standards_matrix = cmmi_iso_controls + casmarts_controls
    all_findings = combined + compliance_findings

    # Deduplicar por ID conservando el orden de severidad
    dedup: Dict[str, Dict[str, Any]] = {}
    for item in all_findings:
        dedup.setdefault(item["id"], item)
    findings = sorted(
        dedup.values(),
        key=lambda f: (SEVERITY_ORDER.get(f["severity"], 9), f["pillar"], f["file"] or "", f["line"] or 0),
    )

    # Comparativo contra la corrida anterior (si existe)
    prev_path = previous_report_path or (data_dir / "micro-audit-report.json")
    resolved_count = 0
    has_baseline = False
    if prev_path.is_file():
        try:
            prev = json.loads(prev_path.read_text(encoding="utf-8"))
            prev_ids = {f.get("id") for f in (prev.get("findings") or []) if isinstance(f, dict) and f.get("id")}
            has_baseline = True
            curr_ids = {f["id"] for f in findings}
            resolved_count = len(prev_ids - curr_ids)
            for f in findings:
                f["diff_status"] = "PERSISTE" if f["id"] in prev_ids else "NUEVO"
        except (OSError, json.JSONDecodeError) as exc:
            logger.error("No se pudo leer corrida previa %s: %s", prev_path, exc, exc_info=True)

    # Resumen por severidad, pilar y módulo del desarrollo
    by_severity = {"CRITICA": 0, "ALTA": 0, "MEDIA": 0, "BAJA": 0}
    by_pillar = {
        "seguridad": 0,
        "desarrollo": 0,
        "accesibilidad": 0,
        "documentacion": 0,
        "casmarts": 0,
        "cmmi": 0,
        "iso27001": 0,
        "dependencias": 0,
    }
    modules_acc: Dict[str, Dict[str, Any]] = {}

    for f in findings:
        by_severity[f["severity"]] = by_severity.get(f["severity"], 0) + 1
        by_pillar[f["pillar"]] = by_pillar.get(f["pillar"], 0) + 1
        mod = f["module"]
        entry = modules_acc.setdefault(
            mod,
            {"module": mod, "total": 0, "critica": 0, "alta": 0, "media": 0, "baja": 0, "pillars": set()},
        )
        entry["total"] += 1
        entry[f["severity"].lower()] += 1
        entry["pillars"].add(f["pillar"])

    modules_summary = sorted(
        [
            {
                "module": m["module"],
                "total": m["total"],
                "critica": m["critica"],
                "alta": m["alta"],
                "media": m["media"],
                "baja": m["baja"],
                "pillars": sorted(m["pillars"]),
            }
            for m in modules_acc.values()
        ],
        key=lambda x: (-x["critica"], -x["alta"], -x["total"], x["module"]),
    )

    preflight = query_optional_preflight(root, findings)

    return {
        "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "repo": str(root),
        "scanned_files": scanned_files,
        "with_network": with_network,
        "with_tools": with_tools,
        "summary": {
            "total_findings": len(findings),
            "by_severity": by_severity,
            "by_pillar": by_pillar,
            "modules_affected": len(modules_summary),
            "controls_cumple": sum(1 for c in standards_matrix if c["status"] == "CUMPLE"),
            "controls_no_cumple": sum(1 for c in standards_matrix if c["status"] == "NO_CUMPLE"),
            "controls_no_evaluado": sum(1 for c in standards_matrix if c["status"] == "NO_EVALUADO"),
            "baseline_compared": has_baseline,
            "new_findings": sum(1 for f in findings if f["diff_status"] == "NUEVO"),
            "persisted_findings": sum(1 for f in findings if f["diff_status"] == "PERSISTE"),
            "resolved_since_previous": resolved_count,
        },
        "modules": modules_summary,
        "standards_matrix": standards_matrix,
        "documentation_audit": doc_audit,
        "casmarts_profile": casmarts_profile,
        "findings": findings,
        "external_tools": external_tools,
        "imported_sources": imported_sources,
        "preflight": preflight,
        "scope_notice": (
            "Auditoría local shift-left sobre código, configuración y artefactos del repositorio. "
            "No sustituye un escáner perimetral completo (DAST, TLS de red, SonarQube, OSV con alcanzabilidad, CIS/SSH o gobierno en servidor Git); "
            "los controles fuera del árbol local se declaran explícitamente como NO_EVALUADO."
        ),
    }


def main(argv: Optional[List[str]] = None) -> int:
    ap = argparse.ArgumentParser(description="Micro-auditor local de estándares (Seguridad, Desarrollo/BD, WCAG, CMMI, ISO 27001)")
    ap.add_argument("--path", default=".", help="Ruta del repositorio a auditar")
    ap.add_argument("--data-dir", default=None, help="Directorio de datos (por omisión <path>/data)")
    ap.add_argument("--with-network", action="store_true", help="Incluye verificación de versiones y dependencias contra registros")
    ap.add_argument("--no-tools", action="store_true", help="Omite herramientas externas aunque estén instaladas en PATH")
    ap.add_argument("--out", default=None, help="Ruta opcional para guardar el reporte JSON de forma atómica")
    ap.add_argument("--json", action="store_true", help="Imprime el reporte completo en JSON")
    ap.add_argument("--fail-on-high", action="store_true", help="Retorna código 1 si hay hallazgos CRITICA o ALTA")
    args = ap.parse_args(argv)

    root = Path(args.path).resolve()
    data_dir = Path(args.data_dir).resolve() if args.data_dir else (root / "data")
    out_path = Path(args.out).resolve() if args.out else None

    report = run_micro_audit(
        root,
        data_dir=data_dir,
        with_network=args.with_network,
        with_tools=not args.no_tools,
        previous_report_path=out_path,
    )

    if out_path:
        out_path.parent.mkdir(parents=True, exist_ok=True)
        tmp = out_path.with_suffix(f".{os.getpid()}.tmp")
        tmp.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        tmp.replace(out_path)

    if args.json:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        s = report["summary"]
        sev = s["by_severity"]
        print(
            f"Auditoría Local ({report['repo']}): {s['total_findings']} hallazgo(s) en {s['modules_affected']} módulo(s) "
            f"[CRITICA={sev['CRITICA']} ALTA={sev['ALTA']} MEDIA={sev['MEDIA']} BAJA={sev['BAJA']}]"
        )
        print(
            f"Controles CMMI/ISO: CUMPLE={s['controls_cumple']} NO_CUMPLE={s['controls_no_cumple']} NO_EVALUADO={s['controls_no_evaluado']}"
        )
        for f in report["findings"][:25]:
            loc = f"{f['file']}:{f['line']}" if f["file"] and f["line"] else (f["file"] or "repo")
            print(f"  [{f['severity']:7s}] {f['rule']} ({f['pillar']}) @ {loc} — {f['title']}")

    if args.fail_on_high:
        sev = report["summary"]["by_severity"]
        if sev["CRITICA"] > 0 or sev["ALTA"] > 0:
            return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
