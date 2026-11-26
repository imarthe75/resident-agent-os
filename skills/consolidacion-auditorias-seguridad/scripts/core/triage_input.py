"""Input of the triage report: turns the normalized findings file (references/formato-hallazgos.md; written by parse_sarif.py and
parse_hallazgos.py) into the finding dicts core.triage classifies.

What a source cannot carry is declared, not invented: when a source lists fewer locations than the occurrences it counts, the missing ones become
«No listado en la fuente» pseudo-occurrences that only generic (path-less) rules can classify; the effort a tool reports once per rule is applied to
each of that rule's occurrences (an assumption, flagged in the report).
"""
from typing import Any, Dict, List

from core.triage import parse_location

UNLISTED_FILE = "(No listado en la fuente: el reporte muestra solo parte de las ubicaciones)"


def findings_from_parsed(parsed: Dict[str, List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    for repo, items in parsed.items():
        for k, it in enumerate(items):
            asset = it.get("asset") or repo
            shown: List[tuple] = []
            for u in it.get("ubicaciones") or []:
                for ln in (u.get("lines") or [None]):
                    shown.append((u["file"], ln))
            n = int(it.get("n") or 0)
            slots = shown[:n] if n else shown
            missing = max(0, n - len(slots))
            sca = it.get("sca") or []
            dep = {"package": sca[0], "installed": sca[1], "fixed": sca[2]} if len(sca) >= 3 else {}
            sev_raw = it.get("sev_herramienta") or it["sev"]
            sev_eff = "INFO" if it.get("norisk") else it["sev"]
            for i, (file_, ln) in enumerate(slots + [(UNLISTED_FILE, None)] * missing):
                url_path = f"{file_}:{ln}" if ln is not None else file_
                f_, l_ = (file_, ln) if file_ != UNLISTED_FILE else (UNLISTED_FILE, None)
                out.append(dict(
                    db_id=f"{repo}|{k:03d}|{i:04d}", asset_name=asset, repo=repo, rule=it["rule"], engine=it.get("motor") or "",
                    url_path=url_path, file=f_, line=l_, severity_raw=sev_raw, severity_eff=sev_eff, no_risk=bool(it.get("norisk")),
                    reach=(sca[3] if len(sca) > 3 and sca[3] else ""), description=it.get("que") or "", title=(it.get("que") or "")[:220],
                    effort_min=it.get("esfuerzo_min"), outdated=bool(dep) or it["rule"].startswith("SCA-CVE-"), dep=dep, unlisted=(file_ == UNLISTED_FILE),
                    cwe=it.get("cwe") or []))
    return out


def coverage_from_parsed(parsed: Dict[str, List[Dict[str, Any]]], findings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    counts: Dict[str, int] = {}
    for f in findings:
        counts[f["repo"]] = counts.get(f["repo"], 0) + 1
    rows = []
    for repo, items in sorted(parsed.items()):
        asset = (items[0].get("asset") if items else "") or repo
        rows.append(dict(asset_name=asset, repo=repo, path=asset, status="Escaneado (según la fuente recibida)", last_audit="", findings=counts.get(repo, 0),
                         note="Lista tomada de las fuentes recibidas; un repositorio sin reporte no aparece aquí."))
    return rows
