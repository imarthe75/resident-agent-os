"""Triage logic of the consolidation: normalized findings -> classified by the analyst's root-cause catalog, deduplicated and planned.

What is MEASURED (straight from the scanner and audit files): counts, severities, engines, file:line, duplicates across engines, outdated
dependencies and the effort estimate a tool reports (e.g. SonarQube).
What is the ANALYST'S judgement (the catalog file): Vulnerabilidad / Falso positivo / Calidad, the rationale, strategy, owner and the
work-plan estimate. A finding no rule matches is reported as SIN CLASIFICAR -- never guessed.

All functions take plain dicts, so they are testable without a database.
"""
import re
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple



UNCLASSIFIED = "SIN CLASIFICAR"
CLASSES = ("Vulnerabilidad", "Falso positivo", "Calidad")
CRIT_ORDER = {"Crítico": 0, "Alto": 1, "Medio": 2, "Bajo": 3}
SEV_TO_CRIT = {"CRITICAL": "Crítico", "HIGH": "Alto", "MEDIUM": "Medio", "LOW": "Bajo"}
# Which finding to keep when several engines report the same line (the others become "Duplicado de").
ENGINE_RANK = {"sonarqube": 0, "codeql": 1, "semgrep": 2, "trivy": 3, "checkov": 4, "auditoria-codigo": 5}


def class_of_code(code: Optional[str]) -> str:
    c = code or ""
    if c.startswith("V-"):
        return "Vulnerabilidad"
    if c.startswith("FP-"):
        return "Falso positivo"
    if c.startswith("C-"):
        return "Calidad"
    return "Sin clasificar"


# --------------------------------------------------------------------------------------------- parsing
def parse_location(url_path: Optional[str]) -> Tuple[str, Optional[int]]:
    """'src/Foo.java:57' -> ('src/Foo.java', 57); 'gitlab:group/repo#merge-gate' or no line -> (whole value, None)."""
    up = (url_path or "").strip()
    m = re.match(r"^(.*?):(\d+)$", up)
    if m and not up.startswith("gitlab:"):
        return m.group(1), int(m.group(2))
    return up, None


def parse_effort_minutes(description: Optional[str]) -> Optional[float]:
    """SonarQube's own 'Esfuerzo estimado: 1h30min' -> minutes. None when the finding carries no estimate (only SonarQube does)."""
    m = re.search(r"Esfuerzo estimado:\*{0,2}\s*((?:\d+d)?\s*(?:\d+h)?\s*(?:\d+min)?)", description or "")
    if not m or not m.group(1).strip():
        return None
    txt = m.group(1)
    total = 0.0
    for val, unit in re.findall(r"(\d+)\s*(d|h|min)", txt):
        total += int(val) * {"d": 480, "h": 60, "min": 1}[unit]
    return total or None


def parse_dependency(description: Optional[str]) -> Dict[str, str]:
    d = description or ""
    out = {}
    for key, label in (("package", "Paquete"), ("installed", "Versión instalada"), ("fixed", "Versión segura")):
        m = re.search(r"\*\*%s:\*\*\s*([^\n]+)" % re.escape(label), d)
        out[key] = m.group(1).strip() if m else ""
    return out


def short_title(description: Optional[str], limit: int = 220) -> str:
    """First meaningful line of the finding text, markdown stripped."""
    for line in (description or "").splitlines():
        t = re.sub(r"\*\*|`|^\[[^\]]*\]\s*", "", line).strip()
        if t and not t.lower().startswith(("archivo:", "sonarqube ")):
            return t[:limit]
    return (description or "")[:limit]


# --------------------------------------------------------------------------------------------- rules
_re_cache: Dict[str, "re.Pattern"] = {}


def _rx(p: str) -> "re.Pattern":
    if p not in _re_cache:
        _re_cache[p] = re.compile(p)
    return _re_cache[p]


def match_rule(finding: Dict[str, Any], rules: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Highest-priority rule matching the finding (ties: the most specific, then the most recently added -- rules arrive ordered)."""
    best = None
    # Assets are named "<project>@<branch>" since 2026-10-12. The analyst's rules were written against the project name (e.g. "/fe\-app$"), so they
    # match the project part: otherwise renaming the assets silently un-classified every rule anchored with "$" (53 false-positive decisions lost the first time).
    project_name = finding["asset_name"].split("@", 1)[0]
    for r in rules:
        if r.get("engine") and r["engine"] != finding["engine"]:
            continue
        if not _rx(r["rule_regex"]).search(finding["rule"] or ""):
            continue
        if r.get("asset_regex") and not _rx(r["asset_regex"]).search(project_name):
            continue
        if r.get("path_regex") and not _rx(r["path_regex"]).search(finding["url_path"] or ""):
            continue
        if r.get("line") is not None and r["line"] != finding["line"]:
            continue
        if best is None or r.get("priority", 0) >= best.get("priority", 0):
            best = r
    return best


def classify(findings: List[Dict[str, Any]], rules: List[Dict[str, Any]], causes: Dict[str, Dict[str, Any]]) -> None:
    """Sets finding['cause'] (a catalog code or UNCLASSIFIED), ['classification'], ['note'], ['rule_id']."""
    for f in findings:
        r = match_rule(f, rules)
        if r and r["root_cause_code"] in causes:
            f["cause"], f["note"], f["rule_id"] = r["root_cause_code"], r.get("note") or "", r.get("id")
        else:
            f["cause"], f["note"], f["rule_id"] = UNCLASSIFIED, "", None
        f["classification"] = class_of_code(f["cause"])


def mark_duplicates(findings: List[Dict[str, Any]], causes: Optional[Dict[str, Dict[str, Any]]] = None) -> None:
    """Duplicates inside one root cause of one repo.
    scope 'line' (default): the same file:line reported by DIFFERENT engines -> the best-ranked engine's finding(s) are kept, the others point at
      them. Several findings of one engine on one line are distinct findings.
    scope 'file' (analyst-declared, e.g. a Dockerfile reported by 3 engines on different lines, or two adjacent properties): every finding of the
      cause in the same file collapses onto the first.
    A finding without a real file:line (repo-level checks) is never merged."""
    causes = causes or {}
    groups: Dict[tuple, List[Dict[str, Any]]] = {}
    for f in findings:
        f["duplicate_of"] = ""
        if f["cause"] == UNCLASSIFIED or f["url_path"].startswith("gitlab:") or f["line"] is None:
            continue
        scope = (causes.get(f["cause"]) or {}).get("dedup_scope") or "line"
        k = (f["asset_name"], f["file"], f["cause"], scope) + ((f["line"],) if scope == "line" else ())
        groups.setdefault(k, []).append(f)
    for k, items in groups.items():
        if len(items) < 2:
            continue
        if k[3] == "file":
            items.sort(key=lambda x: (ENGINE_RANK.get(x["engine"], 9), x["line"], x["rule"], x["db_id"]))
            for other in items[1:]:
                other["duplicate_of"] = items[0]["occ_id"]
            continue
        engines = sorted({x["engine"] for x in items}, key=lambda e: (ENGINE_RANK.get(e, 9), e))
        if len(engines) < 2:
            continue
        keeper = min((x for x in items if x["engine"] == engines[0]), key=lambda x: (x["rule"], x["db_id"]))
        for other in items:
            if other["engine"] != engines[0]:
                other["duplicate_of"] = keeper["occ_id"]


def number_occurrences(findings: List[Dict[str, Any]]) -> None:
    findings.sort(key=lambda f: (f["repo"], {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}.get(f["severity_eff"], 4),
                                 f["rule"], f["file"], f["line"] or 0, f["db_id"]))
    for i, f in enumerate(findings, 1):
        f["occ_id"] = f"OC-{i:04d}"


# --------------------------------------------------------------------------------------------- plan
def compute_plan(group: Dict[str, Any], causes: Dict[str, Dict[str, Any]], findings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """One row per V-/C- root cause that has a plan estimate AND at least one finding. Pure arithmetic over the analyst's parameters; the
    minutes/extra hours are the analyst's assumptions (flagged by minutes_source), only the tool column (e.g. SonarQube's effort) is the scanner's own estimate."""
    hpd = float(group.get("hours_per_day") or 8)
    test_pct = float(group.get("test_pct") if group.get("test_pct") is not None else 0.3)
    rows = []
    for code, c in causes.items():
        plan = c.get("plan")
        if not plan or class_of_code(code) == "Falso positivo":
            continue
        mine = [f for f in findings if f["cause"] == code]
        if not mine:
            continue
        uniq = [f for f in mine if not f["duplicate_of"]]
        # normally one work unit per unique occurrence; the analyst can declare a fixed number of units instead (e.g. 5 major-version upgrades),
        # which applies as long as at least one finding remains
        fixed = plan.get("fixed_qty")
        qty = (fixed if fixed is not None else len(uniq)) if uniq else 0
        tool_h = sum((f["effort_min"] or 0) for f in uniq) / 60.0
        correction = qty * float(plan.get("minutes") or 0) / 60.0
        extra = float(plan.get("extra_hours") or 0)
        confirm = float(plan.get("confirm_hours") or 0)
        tests = (correction + extra) * test_pct if qty > 0 else 0.0
        total = confirm + ((correction + extra + tests) if qty > 0 else 0.0)
        crit = (c.get("severity") if class_of_code(code) == "Vulnerabilidad" else plan.get("default_criticality")) or "Medio"
        rows.append(dict(code=code, classification=class_of_code(code), criticality=crit, phase=plan.get("phase"), activity=plan.get("activity"),
                         unit=plan.get("unit"), qty=qty, fixed_qty=fixed, minutes=float(plan.get("minutes") or 0), minutes_source=plan.get("minutes_source"),
                         tool_h=tool_h, correction=correction, extra=extra, extra_text=plan.get("extra_text"), confirm=confirm,
                         tests=tests, total=total, days=(total / hpd if hpd else 0.0),
                         area_pct=list(plan.get("area_pct") or [0, 0, 0, 0]),
                         repos=sorted({f["repo"] for f in mine}), order=plan.get("order", 999)))
    rows.sort(key=lambda r: (CRIT_ORDER.get(r["criticality"], 9), 0 if r["classification"] == "Vulnerabilidad" else 1, r["order"]))
    return rows


def assemble_report_data(group, causes, rules, findings, coverage, instance, informational=None, coverage_error=None, now=None, source_text=None):
    """Classifies, dedups and plans an in-memory findings list (built by core.triage_input from the normalized findings file)."""
    number_occurrences(findings)
    classify(findings, rules, causes)
    mark_duplicates(findings, causes)
    return dict(group=group, instance=instance, causes=causes, rules=rules, findings=findings, coverage=coverage, coverage_error=coverage_error,
                informational=informational, plan=compute_plan(group, causes, findings), generated_at=now or datetime.now(), source_text=source_text)


