#!/usr/bin/env python3
"""Measured part of /ponytail-audit: run the dead-code, unused-dependency, duplication and size tools that are installed, and
report their findings in one format. The model's own judgement comes after, on the files these tools point at.

    python scripts/ponytail_audit.py [path] [--json] [--timeout 300]

Tools (each one only if it is already installed; nothing is downloaded, a missing tool is reported as "no medido", never as clean):
    vulture  Python dead code (confidence >= 60: unused functions score 60) pip install vulture
    deptry   Python dependencies declared but unused / used undeclared  pip install deptry
    knip     JS/TS unused files, exports and dependencies (project's node_modules/.bin or PATH)
    jscpd    duplicated code in any language (project's node_modules/.bin or PATH)
    scc      size and complexity per language, for before/after comparison (PATH)

Findings are evidence, not verdicts: vulture and knip report false positives (reflection, entry points, framework wiring); each one
is reviewed before it is called real. No line or token savings are estimated.

Idea: the Ponytail project's audit command (DietrichGebert, MIT) turned from opinion into measurement. Our own implementation.
"""
import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

VULTURE_LINE = re.compile(r"^(?P<file>.+?):(?P<line>\d+): (?P<msg>.+?)(?: \((?P<conf>\d+)% confidence(?:, \d+ lines?)?\))?$")
SKIP_DIRS = ("node_modules", ".git", "dist", "build", "target", ".venv", "venv", "__pycache__", "coverage")


def finding(tool, file, line, message):
    return {"tool": tool, "file": file, "line": int(line) if line else None, "message": message}


def locate(tool, root):
    """Installed executable for a tool: the project's own node_modules/.bin first (JS tools), then PATH. Never a download."""
    local = Path(root) / "node_modules" / ".bin" / tool
    if local.is_file() and os.access(local, os.X_OK):
        return str(local)
    return shutil.which(tool)


def run(cmd, cwd, timeout):
    return subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, timeout=timeout)


def has_python(root):
    return any(Path(root).rglob("*.py"))


def has_js(root):
    return (Path(root) / "package.json").is_file()


def audit_vulture(root, exe, timeout):
    excludes = ",".join(f"*/{d}/*" for d in SKIP_DIRS)
    p = run([exe, ".", "--min-confidence", os.getenv("PONYTAIL_VULTURE_CONFIDENCE", "60"), "--exclude", excludes], root, timeout)
    if p.returncode not in (0, 3):  # 3 = dead code found
        raise RuntimeError(p.stderr.strip() or f"exit {p.returncode}")
    out = []
    for line in p.stdout.splitlines():
        m = VULTURE_LINE.match(line.strip())
        if m:
            conf = f" ({m['conf']}% confianza)" if m["conf"] else ""
            out.append(finding("vulture", m["file"].removeprefix("./"), m["line"], m["msg"] + conf))
    return out


def audit_deptry(root, exe, timeout):
    with tempfile.TemporaryDirectory() as d:
        report = Path(d) / "deptry.json"
        p = run([exe, ".", "--json-output", str(report)], root, timeout)
        if not report.is_file():
            raise RuntimeError(p.stderr.strip() or f"exit {p.returncode}")
        data = json.loads(report.read_text() or "[]")
    out = []
    for v in data:
        err, loc = v.get("error") or {}, v.get("location") or {}
        out.append(finding("deptry", loc.get("file"), loc.get("line"), f"{err.get('code')}: {err.get('message')}"))
    return out


def audit_knip(root, exe, timeout):
    p = run([exe, "--reporter", "json", "--no-progress"], root, timeout)
    # knip exits 0 (clean), 1 (issues found) or 2 (error). An empty or non-JSON stdout is a crash, never "clean".
    if p.returncode not in (0, 1) or not p.stdout.strip():
        raise RuntimeError((p.stderr.strip().splitlines() or [f"exit {p.returncode}"])[-1])
    try:
        data = json.loads(p.stdout)
    except json.JSONDecodeError:
        raise RuntimeError(p.stdout[:300])
    out = [finding("knip", f, None, "archivo sin usar") for f in data.get("files", [])]  # knip <= 5 lists files at the top level
    labels = {"files": "archivo sin usar", "dependencies": "dependencia sin usar", "unresolved": "import sin resolver",
              "binaries": "binario usado sin declarar", "devDependencies": "dependencia de desarrollo sin usar",
              "exports": "exportación sin usar", "types": "tipo exportado sin usar", "unlisted": "dependencia usada sin declarar",
              "duplicates": "exportación duplicada"}
    for issue in data.get("issues", []):
        for key, label in labels.items():
            items = issue.get(key) or []
            if isinstance(items, dict):
                items = list(items.values())
            for it in items:
                it = it[0] if isinstance(it, list) and it else it
                name = it.get("name") if isinstance(it, dict) else it
                line = it.get("line") if isinstance(it, dict) else None
                out.append(finding("knip", issue.get("file"), line, f"{label}: {name}"))
    return out


def audit_jscpd(root, exe, timeout):
    with tempfile.TemporaryDirectory() as d:
        ignore = ",".join(f"**/{x}/**" for x in SKIP_DIRS)
        p = run([exe, ".", "--reporters", "json", "--output", d, "--silent", "--ignore", ignore], root, timeout)
        report = Path(d) / "jscpd-report.json"
        if p.returncode != 0:
            raise RuntimeError(p.stderr.strip() or f"exit {p.returncode}")
        # jscpd writes no report when it finds no duplicates and exits 0.
        data = json.loads(report.read_text()) if report.is_file() else {"duplicates": []}
    out = []
    for dup in data.get("duplicates", []):
        a, b = dup.get("firstFile", {}), dup.get("secondFile", {})
        out.append(finding("jscpd", a.get("name"), a.get("start"),
                           f"{dup.get('lines')} líneas duplicadas con {b.get('name')}:{b.get('start')} (candidato a reutilizar)"))
    return out


def audit_scc(root, exe, timeout):
    p = run([exe, "--format", "json", "--exclude-dir", ",".join(SKIP_DIRS), "."], root, timeout)
    if p.returncode != 0:
        raise RuntimeError(p.stderr.strip() or f"exit {p.returncode}")
    rows = json.loads(p.stdout or "[]")
    return [finding("scc", None, None, f"{r['Name']}: {r['Code']} líneas de código, complejidad {r['Complexity']}, {r['Count']} archivos")
            for r in sorted(rows, key=lambda r: -r.get("Code", 0))]


TOOLS = [  # (name, applies to this repo?, runner)
    ("vulture", has_python, audit_vulture),
    ("deptry", has_python, audit_deptry),
    ("knip", has_js, audit_knip),
    ("jscpd", lambda r: True, audit_jscpd),
    ("scc", lambda r: True, audit_scc),
]


def audit(root, timeout=300):
    """{"findings": [...], "measured": [tool...], "not_measured": {tool: reason}}."""
    result = {"findings": [], "measured": [], "not_measured": {}}
    for name, applies, runner in TOOLS:
        if not applies(root):
            result["not_measured"][name] = "no aplica a este repositorio"
            continue
        exe = locate(name, root)
        if not exe:
            result["not_measured"][name] = "no instalado"
            continue
        try:
            result["findings"] += runner(root, exe, timeout)
            result["measured"].append(name)
        except (RuntimeError, subprocess.TimeoutExpired, json.JSONDecodeError, OSError) as e:
            result["not_measured"][name] = f"falló: {str(e).splitlines()[0][:200] if str(e) else type(e).__name__}"
    return result


def render(result):
    lines = []
    for f in result["findings"]:
        where = f"{f['file']}:{f['line']}" if f["file"] and f["line"] else (f["file"] or "repositorio")
        lines.append(f"{where} — {f['tool']}: {f['message']}")
    measured = ", ".join(result["measured"]) or "ninguna"
    missing = "; ".join(f"{k} ({v})" for k, v in result["not_measured"].items()) or "nada"
    lines.append(f"\nMedido con: {measured}. No medido: {missing}.")
    lines.append(f"{sum(1 for f in result['findings'] if f['tool'] != 'scc')} avisos por revisar (pueden incluir falsos positivos).")
    return "\n".join(lines)


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("path", nargs="?", default=".")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--timeout", type=int, default=300)
    a = ap.parse_args(argv)
    root = str(Path(a.path).resolve())
    result = audit(root, a.timeout)
    print(json.dumps(result, ensure_ascii=False, indent=2) if a.json else render(result))
    return 0


if __name__ == "__main__":
    sys.exit(main())
