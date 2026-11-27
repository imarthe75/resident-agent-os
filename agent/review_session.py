"""Sesiones de revisión reanudables: qué lotes de una revisión ya se revisaron y cuáles faltan.

Una revisión grande (muchos lotes) se corta: cuota agotada, sesión cerrada, error. La sesión guarda cada lote con su estado
(`pending`, `done`, `failed`) y la huella del contenido de sus archivos al prepararlo. Al reanudar:
  - los lotes `pending` y `failed` siguen pendientes;
  - un lote `done` cuyos archivos cambiaron desde entonces vuelve a `pending` (lo revisado ya no es lo que hay);
  - un lote `done` sin cambios no se repite.
Se guarda en `.agent/reviews/<id>.json` con escritura atómica. Idea tomada de `ocr review --resume` (open-code-review, Apache-2.0);
el código es propio.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import tempfile
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

STATUSES = ("pending", "done", "failed")
_ID_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$")


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def sessions_dir(repo: Path) -> Path:
    return Path(repo).resolve() / ".agent" / "reviews"


def _path(repo: Path, session_id: str) -> Path:
    if not _ID_RE.fullmatch(session_id or ""):
        raise ValueError(f"id de sesión inválido: {session_id!r}")
    return sessions_dir(repo) / f"{session_id}.json"


def fingerprint(repo: Path, files: list[str]) -> str:
    """Huella del contenido de los archivos de un lote (un archivo borrado también cuenta como cambio)."""
    h = hashlib.sha256()
    for rel in sorted(files):
        h.update(rel.encode("utf-8") + b"\0")
        full = Path(repo) / rel
        h.update(full.read_bytes() if full.is_file() else b"<missing>")
        h.update(b"\0")
    return h.hexdigest()


def _write(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=path.parent, prefix=".review-", suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            json.dump(data, fh, ensure_ascii=False, indent=2)
            fh.write("\n")
        os.replace(tmp, path)
    except Exception:
        if os.path.exists(tmp):
            os.unlink(tmp)
        raise


def create(repo: Path, prepared: dict[str, Any], session_id: Optional[str] = None) -> dict[str, Any]:
    """Abre una sesión a partir del resultado de `prepare_review`."""
    repo = Path(repo).resolve()
    sid = session_id or datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S-") + uuid.uuid4().hex[:6]
    path = _path(repo, sid)
    if path.exists():
        raise ValueError(f"la sesión {sid} ya existe: usa resume")
    data = {
        "session_id": sid, "created_at": _now(), "updated_at": _now(), "meta": prepared.get("meta"),
        "rule_groups": prepared.get("rule_groups", []),
        "bundles": [dict(b, status="pending", fingerprint=fingerprint(repo, b["files"]), findings=None, note=None)
                    for b in prepared.get("bundles", [])],
    }
    _write(path, data)
    return data


def load(repo: Path, session_id: str) -> dict[str, Any]:
    path = _path(repo, session_id)
    if not path.is_file():
        raise FileNotFoundError(f"no existe la sesión {session_id}")
    return json.loads(path.read_text(encoding="utf-8"))


def mark(repo: Path, session_id: str, bundle_id: str, status: str, findings: Optional[int] = None,
         note: Optional[str] = None) -> dict[str, Any]:
    """Marca un lote. `done` guarda la huella actual: si los archivos cambian después, el lote vuelve a estar pendiente."""
    if status not in STATUSES:
        raise ValueError(f"estado inválido: {status} (válidos: {', '.join(STATUSES)})")
    data = load(repo, session_id)
    for b in data["bundles"]:
        if b["bundle_id"] == bundle_id:
            b["status"], b["findings"], b["note"] = status, findings, note
            if status == "done":
                b["fingerprint"] = fingerprint(repo, b["files"])
            data["updated_at"] = _now()
            _write(_path(repo, session_id), data)
            return b
    raise KeyError(f"la sesión {session_id} no tiene el lote {bundle_id}")


def resume(repo: Path, session_id: str) -> dict[str, Any]:
    """Lotes que faltan revisar. Un lote terminado cuyos archivos cambiaron se reabre (y se guarda así)."""
    data = load(repo, session_id)
    reopened = []
    for b in data["bundles"]:
        if b["status"] == "done" and fingerprint(repo, b["files"]) != b["fingerprint"]:
            b["status"], b["note"] = "pending", "reabierto: sus archivos cambiaron después de revisarlo"
            reopened.append(b["bundle_id"])
    if reopened:
        data["updated_at"] = _now()
        _write(_path(repo, session_id), data)
    pending = [b for b in data["bundles"] if b["status"] in ("pending", "failed")]
    done = sum(1 for b in data["bundles"] if b["status"] == "done")
    return {"session_id": session_id, "total": len(data["bundles"]), "done": done, "pending": pending,
            "reopened": reopened, "rule_groups": data.get("rule_groups", []), "meta": data.get("meta")}


def list_sessions(repo: Path) -> list[dict[str, Any]]:
    out = []
    d = sessions_dir(repo)
    for p in sorted(d.glob("*.json")) if d.is_dir() else []:
        try:
            data = json.loads(p.read_text(encoding="utf-8"))
        except (OSError, ValueError) as e:
            out.append({"session_id": p.stem, "error": str(e)})
            continue
        bs = data.get("bundles", [])
        out.append({"session_id": data.get("session_id", p.stem), "mode": (data.get("meta") or {}).get("mode"),
                    "updated_at": data.get("updated_at"), "total": len(bs),
                    "done": sum(1 for b in bs if b.get("status") == "done")})
    return out
