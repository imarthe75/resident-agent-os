"""Preflight: before touching files, ask an (optional) scanner service which findings it already holds for them (ADR-0003 D8).

Generic on purpose: the framework knows only this contract, configured by environment, and works the same without it.
    PREFLIGHT_URL    base URL of a service exposing   GET /api/preflight?asset=<name>&paths=a,b,c
    PREFLIGHT_TOKEN  optional bearer token
Response contract: {"asset", "known_asset": bool, "paths": [...], "findings": [{"path","line","rule","severity","status",...}],
                    "paths_without_findings": [...], "last_audit", "engines_seen": [...], "note"}
Rules of interpretation (enforced in summarize()): "no findings" is NOT "clean" -- it only means no engine flagged that file at the last scan;
an unknown asset or an unreachable service is reported as such and never as zero findings.
"""
import json
import logging
import os
import urllib.error
import urllib.parse
import urllib.request
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)
REQUIRED_KEYS = ("asset", "known_asset", "paths", "findings", "paths_without_findings")
SEVERITY_ORDER = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3, "INFO": 4}


def query(asset: str, paths: List[str], base_url: Optional[str] = None, token: Optional[str] = None, timeout: float = 15.0) -> Dict:
    base_url = (base_url or os.getenv("PREFLIGHT_URL", "")).rstrip("/")
    token = token or os.getenv("PREFLIGHT_TOKEN", "")
    if not base_url:
        return {"available": False, "reason": "PREFLIGHT_URL no está configurado"}
    url = f"{base_url}/api/preflight?" + urllib.parse.urlencode({"asset": asset, "paths": ",".join(paths)})
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"} if token else {})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            data = json.loads(r.read().decode())
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as e:
        logger.error("preflight service unavailable: %s", e, exc_info=True)
        return {"available": False, "reason": f"servicio no disponible: {e}"}
    missing = [k for k in REQUIRED_KEYS if k not in data]
    if missing:
        logger.error("preflight response does not follow the contract (missing %s)", missing)
        return {"available": False, "reason": f"respuesta fuera de contrato (faltan {missing})"}
    return {"available": True, **data}


def summarize(result: Dict) -> str:
    """Plain-text summary for the agent/human, with the honest reading rules built in."""
    if not result.get("available"):
        return f"Preflight no disponible: {result.get('reason')}. Continúa SIN información de hallazgos (no significa que el código esté limpio)."
    if not result.get("known_asset"):
        return "El escáner no conoce este activo: sin información (no significa que esté limpio)."
    fs = sorted(result["findings"], key=lambda f: (SEVERITY_ORDER.get(str(f.get("severity")).upper(), 9), f.get("path", ""), f.get("line") or 0))
    lines = [f"{len(fs)} hallazgo(s) abiertos en los archivos consultados (último escaneo: {result.get('last_audit') or 'desconocido'}):"]
    lines += [f"  - [{f.get('severity')}] {f.get('path')}:{f.get('line') or '?'} {f.get('rule')}" for f in fs[:30]]
    if len(fs) > 30:
        lines.append(f"  … y {len(fs) - 30} más")
    if result["paths_without_findings"]:
        lines.append("Sin hallazgos (NO equivale a limpio; motores que han corrido: "
                     f"{', '.join(result.get('engines_seen') or []) or 'ninguno'}): {', '.join(result['paths_without_findings'][:15])}")
    return "\n".join(lines)
