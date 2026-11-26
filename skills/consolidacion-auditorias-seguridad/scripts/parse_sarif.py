#!/usr/bin/env python3
"""Convierte reportes SARIF 2.1.0 (Semgrep, CodeQL, Trivy, Checkov, Bandit, ESLint, ...) al archivo normalizado de hallazgos.

Uso:
  python parse_sarif.py <salida.json> <repositorio>=<reporte.sarif> [<repositorio>=<otro.sarif> ...]

Una fila por regla x repositorio con todas sus ubicaciones (archivo + líneas). Varios SARIF del mismo repositorio se unen; la misma regla de dos
herramientas queda en dos filas (el triage deduplica la misma línea entre motores). La severidad sale de `security-severity` (CVSS, como la
publican CodeQL, Trivy y Semgrep) y, si la regla no la trae, del nivel SARIF: error=HIGH, warning=MEDIUM, note=LOW. Un resultado suprimido en el
propio SARIF (`suppressions`) no se cuenta: se informa cuántos hubo.
"""
import json
import os
import re
import sys
from collections import OrderedDict, defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from core import normalize  # noqa: E402

LEVEL_SEV = {"error": "HIGH", "warning": "MEDIUM", "note": "LOW", "none": "INFO"}


def cvss_to_sev(score):
    try:
        s = float(score)
    except (TypeError, ValueError):
        return None
    if s >= 9.0:
        return "CRITICAL"
    if s >= 7.0:
        return "HIGH"
    if s >= 4.0:
        return "MEDIUM"
    return "LOW" if s > 0 else "INFO"


def _text(obj):
    if isinstance(obj, dict):
        return (obj.get("text") or obj.get("markdown") or "").strip()
    return ""


def _cwes(rule):
    tags = list((rule.get("properties") or {}).get("tags") or [])
    for rel in rule.get("relationships") or []:
        tags.append(((rel.get("target") or {}).get("id")) or "")
    out = set()
    for t in tags:
        m = re.search(r"CWE[-_:\s]*(\d+)", str(t), re.I)
        if m:
            out.add(f"CWE-{m.group(1)}")
    return sorted(out)


def _dependency(msg):
    """Trivy (and tools that copy its format) state the vulnerable package in the message: 'Package: x / Installed Version: y / Fixed Version: z'.
    Returns [package, installed, fixed, reach] or None. Reachability is unknown from SARIF, so it stays empty (never assumed)."""
    pkg = re.search(r"^Package:\s*(\S+)", msg, re.M)
    inst = re.search(r"^Installed Version:\s*(\S+)", msg, re.M)
    if not (pkg and inst):
        return None
    fixed = re.search(r"^Fixed Version:\s*(.+)$", msg, re.M)
    return [pkg.group(1), inst.group(1), (fixed.group(1).strip() if fixed else ""), ""]


def _uri(loc):
    phys = loc.get("physicalLocation") or {}
    uri = ((phys.get("artifactLocation") or {}).get("uri") or "").strip()
    uri = re.sub(r"^file://", "", uri)
    line = (phys.get("region") or {}).get("startLine")
    return uri or "(sin archivo en el SARIF)", (int(line) if line else None)


def parse_sarif(doc, repo):
    """Returns ({rule_key: item}, suppressed_count) for one SARIF document."""
    rows, suppressed = OrderedDict(), 0
    for run in doc.get("runs") or []:
        driver = ((run.get("tool") or {}).get("driver") or {})
        tool = ((driver.get("name") or "sarif").strip().lower().split() or ["sarif"])[0]
        rules = {r.get("id"): r for r in driver.get("rules") or []}
        for ext in (run.get("tool") or {}).get("extensions") or []:
            rules.update({r.get("id"): r for r in ext.get("rules") or []})
        acc = defaultdict(lambda: {"locs": [], "sevs": [], "msg": "", "sca": None})
        for res in run.get("results") or []:
            if res.get("suppressions"):
                suppressed += 1
                continue
            rid = res.get("ruleId") or ((res.get("rule") or {}).get("id")) or "SIN-REGLA"
            rule = rules.get(rid, {})
            sev = cvss_to_sev((rule.get("properties") or {}).get("security-severity")) or cvss_to_sev(
                (res.get("properties") or {}).get("security-severity"))
            level = res.get("level") or ((rule.get("defaultConfiguration") or {}).get("level")) or "warning"
            dep = _dependency(_text(res.get("message")))
            a = acc[(rid, dep[0] if dep else None)]  # one CVE in two packages = two rows (each has its own upgrade)
            a["sevs"].append(sev or LEVEL_SEV.get(level, "MEDIUM"))
            a["msg"] = a["msg"] or _text(res.get("message"))
            a["sca"] = a["sca"] or dep
            locs = res.get("locations") or [{}]
            a["locs"].append(_uri(locs[0]))
        order = list(normalize.SEVERITIES)
        for (rid, pkg), a in acc.items():
            rule = rules.get(rid, {})
            worst = min(a["sevs"], key=order.index)
            que = _text(rule.get("shortDescription")) or a["msg"]
            rows[(tool, rid, pkg)] = normalize.item(asset=repo, rule=rid, sev=worst, motor=tool, locations=a["locs"], que=que,
                                               riesgo=_text(rule.get("fullDescription")) or a["msg"], cwe=_cwes(rule), sca=a["sca"])
    return rows, suppressed


def main(out, pairs):
    data = OrderedDict()
    for repo, path in normalize.parse_pairs(pairs):
        with open(path, encoding="utf-8") as fh:
            rows, suppressed = parse_sarif(json.load(fh), repo)
        lst = data.setdefault(repo, [])
        lst.extend(rows.values())
        total = sum(r["n"] for r in rows.values())
        print(f"{repo}: {os.path.basename(path)} -> {len(rows)} reglas, {total} ocurrencias"
              + (f", {suppressed} suprimidas en el SARIF (no contadas)" if suppressed else ""))
    normalize.write(out, data)
    print(f"Escrito {out}: {sum(len(v) for v in data.values())} filas en {len(data)} repositorio(s)")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2:])
