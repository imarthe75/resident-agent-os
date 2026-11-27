"""Provider-agnostic local MCP server for Resident Agent OS (JSON-RPC 2.0 over stdio).

Works with any MCP-compatible AI host: Claude Code, Gemini CLI, Antigravity, Codex, Cursor, Windsurf,
Cline, Copilot CLI, OpenCode, Kiro, or custom clients — zero external MCP SDK dependency.

Includes built-in output bounding with private 0600 spill files (inspired by Chisle's MCP proxy) so
oversized verifier or fleet outputs never bloat the host model's context window on any provider.
"""

from __future__ import annotations

import hashlib
import json
import logging
import os
import sys
import tempfile
import time
from pathlib import Path
from typing import Any, Callable, Optional

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from agent.review_prepare import prepare_review, relocate_finding  # noqa: E402
from agent.telemetry import (  # noqa: E402
    DEFAULT_TELEMETRY_REL,
    DEFAULT_THRESHOLDS_REL,
    evaluate_thresholds,
    load_thresholds,
    read_events,
    summarize_events,
)
from verifiers.checks import NO_CUMPLE, REGISTRY  # noqa: E402

logger = logging.getLogger(__name__)

PROTOCOL_VERSION = "2024-11-05"
SERVER_INFO = {"name": "resident-agent-os", "version": "1.0.0"}
DEFAULT_MAX_CHARS = 12000


def _spill_dir() -> Path:
    custom = os.getenv("ROS_MCP_SPILL_DIR")
    if custom:
        return Path(custom)
    uid = os.getuid() if hasattr(os, "getuid") else "user"
    return Path(tempfile.gettempdir()) / f"ros-mcp-output-{uid}"


def bound_mcp_text(text: str, max_chars: Optional[int] = None) -> str:
    """Bound oversized MCP tool text output; spill byte-identical original privately (0600 in 0700 dir)."""
    limit = max_chars if max_chars is not None else int(os.getenv("ROS_MCP_MAX_CHARS", str(DEFAULT_MAX_CHARS)))
    if limit <= 0 or len(text) <= limit:
        return text

    spill_path: Optional[Path] = None
    try:
        sdir = _spill_dir()
        sdir.mkdir(parents=True, exist_ok=True, mode=0o700)
        os.chmod(sdir, 0o700)
        digest = hashlib.sha256(text.encode("utf-8")).hexdigest()[:12]
        spill_path = sdir / f"{int(time.time() * 1000)}-{digest}.txt"
        fd = os.open(spill_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        try:
            os.write(fd, text.encode("utf-8"))
        finally:
            os.close(fd)
    except OSError as e:
        logger.warning("Failed to spill oversized MCP output: %s", e, exc_info=True)
        return text

    head_size = max(500, int(limit * 0.55))
    tail_size = max(300, int(limit * 0.30))
    omitted = len(text) - head_size - tail_size
    if omitted <= 0:
        return text
    return (
        f"{text[:head_size]}\n"
        f"[… {omitted} chars omitidos por límite MCP; salida completa en {spill_path} …]\n"
        f"{text[-tail_size:]}"
    )


def _tool_doctor(args: dict[str, Any]) -> dict[str, Any]:
    from agent.cli import run_doctor

    return run_doctor(Path(args.get("path") or ".").resolve())


def _tool_verify(args: dict[str, Any]) -> dict[str, Any]:
    target = Path(args.get("path") or ".").resolve()
    only = args.get("only")
    names = [x.strip() for x in only.split(",") if x.strip()] if isinstance(only, str) else list(REGISTRY)
    if not args.get("with_network", False) and not isinstance(only, str):
        names = [n for n in names if n not in ("dependencies_current", "versions_current")]
    unknown = [n for n in names if n not in REGISTRY]
    if unknown:
        raise ValueError(f"Unknown verifier(s): {', '.join(unknown)}")
    results = [REGISTRY[n](target) for n in names]
    return {
        "path": str(target),
        "failed": any(r.status == NO_CUMPLE for r in results),
        "results": [r.__dict__ for r in results],
    }


def _tool_review_prepare(args: dict[str, Any]) -> dict[str, Any]:
    return prepare_review(
        Path(args.get("path") or ".").resolve(),
        from_ref=args.get("from_ref"),
        to_ref=args.get("to_ref"),
        commit=args.get("commit"),
        max_bundle_size=int(args.get("max_bundle_size") or 8),
    )


def _tool_relocate_finding(args: dict[str, Any]) -> dict[str, Any]:
    return relocate_finding(
        args["file_path"],
        int(args["reported_line"]),
        str(args["snippet"]),
        window=int(args.get("window") or 40),
    )


def _tool_check_thresholds(args: dict[str, Any]) -> dict[str, Any]:
    agent_dir = Path(args.get("agent_dir") or ".agent").resolve()
    events = read_events(agent_dir / DEFAULT_TELEMETRY_REL)
    thresholds = load_thresholds(agent_dir / DEFAULT_THRESHOLDS_REL)
    summary = summarize_events(events)
    evaluation = evaluate_thresholds(summary, thresholds)
    return {"agent_dir": str(agent_dir), "summary": summary, "evaluation": evaluation}


def _tool_fleet_status(args: dict[str, Any]) -> dict[str, Any]:
    from scripts import distribute_framework as dist
    from scripts import fleet_status as fleet

    source = Path(args.get("source") or ROOT).resolve()
    targets = [Path(t).resolve() for t in (args.get("targets") or [])]
    if args.get("parent"):
        targets += dist.find_targets(Path(args["parent"]).resolve(), source)
    if not targets:
        raise ValueError("Provide `parent` or `targets` to scan")
    return fleet.build_fleet_report(
        source,
        targets,
        with_network=bool(args.get("with_network", False)),
        with_deps=bool(args.get("with_deps", False)),
    )


def _tool_memory_status(args: dict[str, Any]) -> dict[str, Any]:
    from agent.cli import inspect_memory

    return inspect_memory(project_id=args.get("project_id"), limit=int(args.get("limit") or 10))


TOOL_SPECS: list[dict[str, Any]] = [
    {
        "name": "ros_doctor",
        "description": "Diagnose Resident Agent OS runtimes, .agent state, Hub Valkey/PostgreSQL health, and multi-agent host configs.",
        "inputSchema": {
            "type": "object",
            "properties": {"path": {"type": "string", "description": "Repository path (default: current directory)"}},
        },
        "handler": _tool_doctor,
    },
    {
        "name": "ros_verify",
        "description": "Run deterministic Resident Agent OS verifiers (pk_uuid, endpoints_auth, no_stubs, observability_min, observability_production, etc.).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Repository path to verify"},
                "only": {"type": "string", "description": "Comma-separated subset of verifier names"},
                "with_network": {"type": "boolean", "description": "Include registry network checks (default: false)"},
            },
        },
        "handler": _tool_verify,
    },
    {
        "name": "ros_review_prepare",
        "description": "Deterministically select changed files, filter secrets/binaries, bundle related files, and resolve .agent/path-rules.json for any AI reviewer.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Git repository path"},
                "from_ref": {"type": "string", "description": "Base git ref (e.g. main)"},
                "to_ref": {"type": "string", "description": "Target git ref (default: HEAD)"},
                "commit": {"type": "string", "description": "Single commit SHA (mutually exclusive with from_ref)"},
                "max_bundle_size": {"type": "integer", "description": "Max files per review bundle (default: 8)"},
            },
        },
        "handler": _tool_review_prepare,
    },
    {
        "name": "ros_relocate_finding",
        "description": "Verify and relocate a review finding's line number against the actual file to prevent LLM position drift.",
        "inputSchema": {
            "type": "object",
            "required": ["file_path", "reported_line", "snippet"],
            "properties": {
                "file_path": {"type": "string"},
                "reported_line": {"type": "integer"},
                "snippet": {"type": "string"},
                "window": {"type": "integer"},
            },
        },
        "handler": _tool_relocate_finding,
    },
    {
        "name": "ros_check_thresholds",
        "description": "Evaluate .agent/telemetry/events.jsonl against written production alert thresholds (.agent/thresholds.json).",
        "inputSchema": {
            "type": "object",
            "properties": {"agent_dir": {"type": "string", "description": "Path to .agent directory"}},
        },
        "handler": _tool_check_thresholds,
    },
    {
        "name": "ros_fleet_status",
        "description": "Aggregate framework drift, verifier status, and telemetry/savings across multiple repositories.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "parent": {"type": "string", "description": "Parent directory containing git repositories"},
                "targets": {"type": "array", "items": {"type": "string"}, "description": "Explicit repo paths"},
                "with_network": {"type": "boolean"},
                "with_deps": {"type": "boolean"},
            },
        },
        "handler": _tool_fleet_status,
    },
    {
        "name": "ros_memory_status",
        "description": "Check Hub Valkey/PostgreSQL connectivity and list recent memories and session summaries scoped by project_id.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "project_id": {"type": "string", "description": "Optional Hub-and-Spoke project filter"},
                "limit": {"type": "integer", "description": "Max rows per table (default: 10)"},
            },
        },
        "handler": _tool_memory_status,
    },
]

_HANDLERS: dict[str, Callable[[dict[str, Any]], dict[str, Any]]] = {t["name"]: t["handler"] for t in TOOL_SPECS}


def handle_request(req: dict[str, Any]) -> Optional[dict[str, Any]]:
    """Process one JSON-RPC 2.0 MCP request; returns None for notifications."""
    method = req.get("method")
    req_id = req.get("id")
    params = req.get("params") or {}

    if method == "notifications/initialized":
        return None

    if method == "initialize":
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "protocolVersion": PROTOCOL_VERSION,
                "capabilities": {"tools": {}},
                "serverInfo": SERVER_INFO,
            },
        }

    if method == "ping":
        return {"jsonrpc": "2.0", "id": req_id, "result": {}}

    if method == "tools/list":
        tools = [
            {"name": t["name"], "description": t["description"], "inputSchema": t["inputSchema"]}
            for t in TOOL_SPECS
        ]
        return {"jsonrpc": "2.0", "id": req_id, "result": {"tools": tools}}

    if method == "tools/call":
        name = params.get("name")
        arguments = params.get("arguments") or {}
        handler = _HANDLERS.get(name)
        if not handler:
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "error": {"code": -32601, "message": f"Unknown tool: {name}"},
            }
        try:
            payload = handler(arguments)
            text = bound_mcp_text(json.dumps(payload, ensure_ascii=False, indent=2))
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {"content": [{"type": "text", "text": text}], "isError": False},
            }
        except Exception as e:
            logger.error("MCP tool %s failed: %s", name, e, exc_info=True)
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {"content": [{"type": "text", "text": f"Error: {e}"}], "isError": True},
            }

    if req_id is None:
        return None
    return {"jsonrpc": "2.0", "id": req_id, "error": {"code": -32601, "message": f"Method not found: {method}"}}


def _read_message(stream) -> tuple[Optional[dict[str, Any]], bool]:
    """Read either a Content-Length framed message or a newline-delimited JSON-RPC message."""
    line = stream.readline()
    if not line:
        return None, False
    text = line.decode("utf-8", errors="replace").strip()
    if not text:
        return {}, False
    if text.lower().startswith("content-length:"):
        length = int(text.split(":", 1)[1].strip())
        while True:
            hdr = stream.readline()
            if not hdr or hdr in (b"\r\n", b"\n"):
                break
        body = stream.read(length)
        return json.loads(body.decode("utf-8")), True
    return json.loads(text), False


def _write_message(stream, msg: dict[str, Any], framed: bool) -> None:
    raw = json.dumps(msg, ensure_ascii=False).encode("utf-8")
    if framed:
        stream.write(f"Content-Length: {len(raw)}\r\n\r\n".encode("ascii") + raw)
    else:
        stream.write(raw + b"\n")
    stream.flush()


def serve_stdio() -> int:
    """Run the MCP JSON-RPC loop over stdin/stdout until EOF."""
    stdin = sys.stdin.buffer
    stdout = sys.stdout.buffer
    while True:
        try:
            msg, framed = _read_message(stdin)
        except (ValueError, json.JSONDecodeError) as e:
            logger.error("Malformed JSON-RPC input: %s", e, exc_info=True)
            _write_message(stdout, {"jsonrpc": "2.0", "id": None, "error": {"code": -32700, "message": str(e)}}, False)
            continue
        if msg is None:
            return 0
        if not msg:
            continue
        resp = handle_request(msg)
        if resp is not None:
            _write_message(stdout, resp, framed)


if __name__ == "__main__":
    sys.exit(serve_stdio())
