"""Shared helpers for the parsers that write the normalized findings file (references/formato-hallazgos.md)."""
import json
from collections import OrderedDict
from typing import Any, Dict, Iterable, List, Optional

SEVERITIES = ("CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO")


def item(*, asset: str, rule: str, sev: str, motor: str, locations: Iterable[tuple], n: Optional[int] = None,
         que: str = "", riesgo: str = "", cwe: Optional[List[str]] = None, esfuerzo_min: Optional[float] = None,
         sev_herramienta: Optional[str] = None, norisk: bool = False, sca: Optional[list] = None) -> Dict[str, Any]:
    """One normalized item: a rule in a repository with all its locations. `locations` = (file, line|None) pairs."""
    if sev not in SEVERITIES:
        raise ValueError(f"severidad desconocida: {sev!r} (use {', '.join(SEVERITIES)})")
    by_file: "OrderedDict[str, List[int]]" = OrderedDict()
    count = 0
    for file_, line in locations:
        count += 1
        lines = by_file.setdefault(file_, [])
        if line is not None and line not in lines:
            lines.append(line)
    ubic = [{"file": f, "lines": sorted(ls)} for f, ls in by_file.items()]
    n = count if n is None else n
    shown = sum(max(1, len(u["lines"])) for u in ubic)
    return {"asset": asset, "sev": sev, "sev_herramienta": sev_herramienta or sev, "norisk": norisk, "rule": rule, "n": n, "motor": motor,
            "ubicaciones": ubic, "n_ubic_declaradas": n, "n_archivos_declarados": len(ubic), "truncado": shown < n,
            "cwe": sorted(set(cwe or [])), "que": que, "riesgo": riesgo, "esfuerzo_min": esfuerzo_min, "noact": False, "patch": "",
            "sca": sca}


def write(path: str, data: Dict[str, List[Dict[str, Any]]]) -> None:
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(data, fh, ensure_ascii=False, indent=1)


def parse_pairs(args: List[str]) -> List[tuple]:
    """['repo=archivo', ...] -> [('repo', 'archivo'), ...]; the repository name is what the report shows."""
    out = []
    for a in args:
        if "=" not in a:
            raise SystemExit(f"argumento sin repositorio: {a!r} (use repositorio=archivo)")
        repo, path = a.split("=", 1)
        out.append((repo.strip(), path.strip()))
    return out
