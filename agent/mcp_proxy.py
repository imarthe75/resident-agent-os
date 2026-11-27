"""Proxy MCP por stdio: acota la salida de las herramientas de CUALQUIER servidor MCP, no solo del propio.

    ros mcp-proxy -- <comando del servidor> [args...]

Se pone entre el asistente y el servidor (en la configuración del asistente, el comando del servidor se reemplaza por este). Los bytes
pasan sin tocar en ambos sentidos, salvo la respuesta a una petición `tools/call`: sus bloques `content[]` de tipo texto se acotan con
`bound_mcp_text` (cabeza y cola, original completo guardado en privado 0600). Todo lo demás (initialize, tools/list, notificaciones,
recursos, líneas que no son JSON) se reenvía idéntico.

No se acotan, a propósito:
  - herramientas de lectura o edición de archivos (read_file, get_file_contents, edit_file...): su salida alimenta ediciones exactas;
  - `structuredContent`: se deja como llega;
  - respuestas con `isError`: el error completo es lo que el agente necesita.
Si algo falla al procesar una línea, se reenvía la original: el proxy nunca rompe al servidor.
Idea tomada del proxy MCP de Chisle (MIT); el código es propio.
"""
from __future__ import annotations

import json
import logging
import re
import subprocess
import sys
import threading
from typing import Any, Optional

from agent.mcp_server import bound_mcp_text

logger = logging.getLogger(__name__)

EXACT_TOOL_RE = re.compile(r"(?i)(^|[_\-.])(read|get|open|cat|view|show)[_\-.]?(file|files|file_contents|contents|text)|edit|write|patch|"
                           r"replace|apply|str_replace|insert")


def is_exact_tool(name: Optional[str]) -> bool:
    """Herramientas cuyo resultado se usa tal cual (leer o editar archivos): nunca se acotan."""
    return bool(name) and bool(EXACT_TOOL_RE.search(name))


def bound_response(msg: dict[str, Any], tool_name: Optional[str]) -> bool:
    """Acota en sitio los bloques de texto de un resultado de `tools/call`. Devuelve True si cambió algo."""
    result = msg.get("result")
    if not isinstance(result, dict) or result.get("isError") or is_exact_tool(tool_name):
        return False
    changed = False
    for block in result.get("content") or []:
        if isinstance(block, dict) and block.get("type") == "text" and isinstance(block.get("text"), str):
            new = bound_mcp_text(block["text"])
            if new != block["text"]:
                block["text"] = new
                changed = True
    return changed


class _Pending:
    """ids de las peticiones tools/call en curso y el nombre de su herramienta (los ids son del cliente)."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._by_id: dict[str, str] = {}

    def add(self, req_id: Any, name: str) -> None:
        with self._lock:
            self._by_id[json.dumps(req_id)] = name

    def pop(self, req_id: Any) -> Optional[str]:
        with self._lock:
            return self._by_id.pop(json.dumps(req_id), None)

    def has(self, req_id: Any) -> bool:
        with self._lock:
            return json.dumps(req_id) in self._by_id


def note_request(line: bytes, pending: _Pending) -> None:
    """Registra las peticiones tools/call que pasan del cliente al servidor (la línea se reenvía igual)."""
    try:
        msg = json.loads(line)
    except ValueError:
        return
    for m in msg if isinstance(msg, list) else [msg]:
        if isinstance(m, dict) and m.get("method") == "tools/call" and "id" in m:
            pending.add(m["id"], str((m.get("params") or {}).get("name") or ""))


def transform_response(line: bytes, pending: _Pending) -> bytes:
    """Línea del servidor hacia el cliente: si responde a un tools/call registrado, acota su texto; si no, la devuelve igual."""
    try:
        msg = json.loads(line)
    except ValueError:
        return line
    if not isinstance(msg, dict) or "id" not in msg or not pending.has(msg["id"]):
        return line
    try:
        name = pending.pop(msg["id"])
        if not bound_response(msg, name):
            return line
        return (json.dumps(msg, ensure_ascii=False) + "\n").encode("utf-8")
    except Exception:
        logger.error("mcp-proxy: no se pudo acotar la respuesta; se reenvía la original", exc_info=True)
        return line


def run_proxy(command: list[str]) -> int:
    if not command:
        print("uso: ros mcp-proxy -- <comando del servidor MCP> [args...]", file=sys.stderr)
        return 2
    child = subprocess.Popen(command, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=None)
    pending = _Pending()

    def pump_in() -> None:
        try:
            for line in iter(sys.stdin.buffer.readline, b""):
                note_request(line, pending)
                child.stdin.write(line)
                child.stdin.flush()
        except (BrokenPipeError, OSError):
            logger.debug("mcp-proxy: el servidor cerró su entrada")
        finally:
            try:
                child.stdin.close()
            except OSError:
                logger.debug("mcp-proxy: entrada del servidor ya cerrada")

    threading.Thread(target=pump_in, daemon=True).start()
    out = sys.stdout.buffer
    for line in iter(child.stdout.readline, b""):
        out.write(transform_response(line, pending))
        out.flush()
    return child.wait()


def main(argv: Optional[list[str]] = None) -> int:
    args = list(sys.argv[1:] if argv is None else argv)
    if args and args[0] == "--":
        args = args[1:]
    return run_proxy(args)


if __name__ == "__main__":
    sys.exit(main())
