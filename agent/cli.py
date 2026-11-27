"""Unified `ros` CLI for Resident Agent OS (works via `ros <cmd>` or `python -m agent <cmd>`).

Provider- and AI-host-agnostic: supports Claude Code, Gemini CLI, Antigravity, Codex, Cursor,
Windsurf, Cline, Copilot CLI, OpenCode, or any generic MCP-capable assistant.
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import shutil
import socket
import sys
from pathlib import Path
from typing import Any, Optional

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from agent.model_routing import list_agent_routing, resolve_model  # noqa: E402
from agent.review_prepare import prepare_review, relocate_finding  # noqa: E402
from agent.telemetry import (  # noqa: E402
    DEFAULT_TELEMETRY_REL,
    DEFAULT_THRESHOLDS_REL,
    evaluate_thresholds,
    load_thresholds,
    read_events,
    summarize_events,
)

logger = logging.getLogger(__name__)

SUPPORTED_HOSTS = ("claude", "gemini", "antigravity", "codex", "cursor", "copilot", "opencode", "generic")


def _tcp_check(host: str, port: int, timeout: float = 1.0) -> tuple[bool, Optional[str]]:
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True, None
    except OSError as e:
        return False, str(e)


def run_doctor(target: Path) -> dict[str, Any]:
    """Inspect runtimes, .agent files, Hub Valkey/PostgreSQL connectivity, and detected AI host configs."""
    target = Path(target).resolve()
    agent_dir = target / ".agent"
    valkey_host = os.getenv("VALKEY_HOST", "127.0.0.1")
    valkey_port = int(os.getenv("VALKEY_PORT", "6379"))
    pg_host = os.getenv("POSTGRES_HOST", "127.0.0.1")
    pg_port = int(os.getenv("POSTGRES_PORT", "5432"))

    valkey_ok, valkey_err = _tcp_check(valkey_host, valkey_port)
    pg_ok, pg_err = _tcp_check(pg_host, pg_port)

    events = read_events(agent_dir / DEFAULT_TELEMETRY_REL)
    thresholds = load_thresholds(agent_dir / DEFAULT_THRESHOLDS_REL)
    summary = summarize_events(events)
    evaluation = evaluate_thresholds(summary, thresholds)

    detected_hosts = {
        "claude": (target / ".claude" / "settings.json").is_file() or (target / "CLAUDE.md").is_file(),
        "gemini": (target / ".gemini" / "settings.json").is_file() or (target / ".agents" / "skills").is_dir(),
        "antigravity": (target / ".agents" / "skills").is_dir() or (target / "AGENTS.md").is_file(),
        "codex": (target / "AGENTS.md").is_file(),
        "cursor": (target / ".cursor" / "rules").is_dir(),
        "copilot": (target / ".github" / "copilot-instructions.md").is_file(),
        "opencode": (target / ".opencode").is_dir() or (target / "AGENTS.md").is_file(),
        "mcp": (target / ".mcp.json").is_file(),
    }

    host_sync_summary: dict[str, Any] = {"checked": False, "in_sync": True, "missing": 0, "drifted": 0}
    has_claude_projections = any(
        (target / ".claude" / sub).is_dir() for sub in ("agents", "commands", "skills")
    )
    if has_claude_projections:
        from scripts.sync_agent_dirs import sync_hosts

        active_sections = [s for s in ("agents", "commands", "skills") if (target / ".claude" / s).is_dir()]
        sync_rep = sync_hosts(target, only=active_sections, check=True)
        host_sync_summary = {
            "checked": True,
            "in_sync": sync_rep["in_sync"],
            "missing": len(sync_rep["missing"]),
            "drifted": len(sync_rep["drifted"]),
        }

    return {
        "repo": str(target),
        "framework_root": str(ROOT),
        "project_id": os.getenv("ROS_PROJECT_ID") or target.name,
        "runtimes": {
            "python": sys.version.split()[0],
            "git": shutil.which("git") is not None,
            "node": shutil.which("node") is not None,
            "psql": shutil.which("psql") is not None,
        },
        "agent_files": {
            "agent_dir": agent_dir.is_dir(),
            "state_md": (agent_dir / "STATE.md").is_file(),
            "specs_md": (agent_dir / "SPECS.md").is_file(),
            "heuristics_json": (agent_dir / "heuristics.json").is_file(),
            "thresholds_json": (agent_dir / "thresholds.json").is_file(),
            "path_rules_json": (agent_dir / "path-rules.json").is_file(),
            "model_routing_json": (agent_dir / "model-routing.json").is_file(),
        },
        "hub_services": {
            "valkey": {"host": valkey_host, "port": valkey_port, "connected": valkey_ok, "error": valkey_err},
            "postgres": {"host": pg_host, "port": pg_port, "connected": pg_ok, "error": pg_err},
        },
        "telemetry": {"events": summary["total_events"], "threshold_status": evaluation["status"]},
        "detected_hosts": detected_hosts,
        "host_sync": host_sync_summary,
    }


def _mcp_server_config(framework_root: Path, project_id: str) -> dict[str, Any]:
    return {
        "mcpServers": {
            "resident-agent-os": {
                "command": "python3",
                "args": ["-m", "agent", "mcp"],
                "env": {
                    "PYTHONPATH": str(framework_root),
                    "ROS_PROJECT_ID": project_id,
                    "VALKEY_HOST": os.getenv("VALKEY_HOST", "127.0.0.1"),
                    "POSTGRES_HOST": os.getenv("POSTGRES_HOST", "127.0.0.1"),
                },
            }
        }
    }


def init_host(target: Path, host: str, *, dry_run: bool = False) -> dict[str, Any]:
    """Generate clean, non-destructive provider-agnostic host config files for any AI assistant."""
    target = Path(target).resolve()
    hosts = list(SUPPORTED_HOSTS) if host == "all" else [host]
    invalid = [h for h in hosts if h not in SUPPORTED_HOSTS]
    if invalid:
        raise ValueError(f"Unsupported host(s): {', '.join(invalid)} (valid: {', '.join(SUPPORTED_HOSTS)}, all)")

    project_id = os.getenv("ROS_PROJECT_ID") or target.name
    created: list[str] = []
    skipped: list[str] = []

    def _seed(rel: str, content: str) -> None:
        dst = target / rel
        if dst.exists():
            skipped.append(rel)
            return
        created.append(rel)
        if not dry_run:
            dst.parent.mkdir(parents=True, exist_ok=True)
            dst.write_text(content, encoding="utf-8")

    # Universal MCP descriptor usable by Claude Code, Gemini CLI, Antigravity, Cursor, Codex, Windsurf, Cline, OpenCode.
    _seed(".mcp.json", json.dumps(_mcp_server_config(ROOT, project_id), indent=2) + "\n")

    # Provider-agnostic subagent model routing table (non-destructive)
    src_routing = ROOT / ".agent" / "model-routing.json"
    if src_routing.is_file():
        _seed(".agent/model-routing.json", src_routing.read_text(encoding="utf-8"))

    if "gemini" in hosts or "antigravity" in hosts:
        _seed(".gemini/settings.json", json.dumps({"context": {"fileName": ["AGENTS.md", "GEMINI.md"]}}, indent=2) + "\n")

    if "cursor" in hosts:
        _seed(
            ".cursor/rules/resident-agent-os.mdc",
            "---\ndescription: Resident Agent OS project rules\nalwaysApply: true\n---\n\n"
            "Sigue obligatoriamente `AGENTS.md`, `rules/common/` y `.agent/SPECS.md`.\n"
            "Antes de cerrar un cambio ejecuta `ros verify` (o la herramienta MCP `ros_verify`).\n",
        )

    if "copilot" in hosts:
        _seed(
            ".github/copilot-instructions.md",
            "# Resident Agent OS Instructions\n\n"
            "Sigue `AGENTS.md`, `rules/common/` y `.agent/SPECS.md` en cada cambio.\n"
            "Usa `ros review-prepare` y `ros verify` antes de dar una tarea por terminada.\n",
        )

    host_sync_report: Optional[dict[str, Any]] = None
    if "claude" in hosts:
        src_settings = ROOT / ".claude" / "settings.json"
        if src_settings.is_file():
            _seed(".claude/settings.json", src_settings.read_text(encoding="utf-8"))
        if any((target / p).is_dir() for p in ("agents", "commands", ".agents/skills")):
            from scripts.sync_agent_dirs import sync_hosts

            host_sync_report = sync_hosts(target, mode="copy", check=dry_run)

    if "generic" in hosts or "codex" in hosts or "opencode" in hosts:
        _seed(
            "AGENTS.md",
            "# Instrucciones del proyecto (Resident Agent OS)\n\n"
            "Lee `.agent/AGENT.md`, `.agent/SPECS.md` y `rules/common/` antes de modificar código.\n"
            "Conecta el servidor MCP `.mcp.json` (`python3 -m agent mcp`) o ejecuta `python3 -m agent verify`.\n",
        )

    out: dict[str, Any] = {
        "target": str(target),
        "hosts": hosts,
        "dry_run": dry_run,
        "created": created,
        "skipped_existing": skipped,
    }
    if host_sync_report is not None:
        out["host_sync"] = host_sync_report
    return out


def inspect_memory(project_id: Optional[str] = None, limit: int = 10) -> dict[str, Any]:
    """Query Hub Valkey + PostgreSQL connectivity and list recent memories & summaries honestly."""
    valkey_host = os.getenv("VALKEY_HOST", "127.0.0.1")
    valkey_port = int(os.getenv("VALKEY_PORT", "6379"))
    pg_host = os.getenv("POSTGRES_HOST", "127.0.0.1")
    pg_port = int(os.getenv("POSTGRES_PORT", "5432"))

    valkey_ok, valkey_err = _tcp_check(valkey_host, valkey_port)
    pg_ok, pg_err = _tcp_check(pg_host, pg_port)

    memories: list[dict[str, Any]] = []
    summaries: list[dict[str, Any]] = []
    schema_ready = False
    if pg_ok and os.getenv("POSTGRES_PASSWORD"):
        try:
            from memory.long_term_memory import LongTermMemory

            ltm = LongTermMemory()
            try:
                schema_ready = ltm.schema_ready()
                if schema_ready:
                    memories = ltm.list_memories(project_id=project_id, limit=limit)
                    summaries = ltm.list_session_summaries(project_id=project_id, limit=limit)
            finally:
                ltm.close()
        except Exception as e:
            logger.warning("PostgreSQL query failed in inspect_memory: %s", e, exc_info=True)
            pg_err = str(e)
    elif pg_ok and not os.getenv("POSTGRES_PASSWORD"):
        pg_err = "POSTGRES_PASSWORD not set (TCP reachable only)"

    return {
        "project_id": project_id or "all",
        "valkey": {"host": valkey_host, "port": valkey_port, "connected": valkey_ok, "error": valkey_err},
        "postgres": {
            "host": pg_host,
            "port": pg_port,
            "connected": pg_ok,
            "schema_ready": schema_ready,
            "error": pg_err,
            "memories": memories,
            "session_summaries": summaries,
        },
    }


def main(argv: Optional[list[str]] = None) -> int:
    ap = argparse.ArgumentParser(prog="ros", description="Resident Agent OS — Unified CLI (provider-agnostic)")
    sub = ap.add_subparsers(dest="command")

    p_doc = sub.add_parser("doctor", help="Check runtimes, .agent/, Hub services, and AI host configs")
    p_doc.add_argument("--path", default=".")
    p_doc.add_argument("--json", action="store_true")

    p_init = sub.add_parser("init-host", help="Seed non-destructive config for any AI host + .mcp.json")
    p_init.add_argument("--host", default="all", help=f"One of: {', '.join(SUPPORTED_HOSTS)}, all")
    p_init.add_argument("--target", default=".")
    p_init.add_argument("--dry-run", action="store_true")
    p_init.add_argument("--json", action="store_true")

    p_ver = sub.add_parser("verify", help="Run framework verifiers")
    p_ver.add_argument("--path", default=".")
    p_ver.add_argument("--only", default=None)
    p_ver.add_argument("--json", action="store_true")

    p_th = sub.add_parser("thresholds", help="Evaluate telemetry against .agent/thresholds.json")
    p_th.add_argument("--agent-dir", default=".agent")
    p_th.add_argument("--require-data", action="store_true")
    p_th.add_argument("--json", action="store_true")

    p_fl = sub.add_parser("fleet", help="Scan multiple repositories for drift, verifiers, and telemetry")
    p_fl.add_argument("--parent", default=None)
    p_fl.add_argument("--target", action="append", default=[])
    p_fl.add_argument("--out", default=None)
    p_fl.add_argument("--with-network", action="store_true")
    p_fl.add_argument("--with-deps", action="store_true")
    p_fl.add_argument("--fail-on-drift", action="store_true")
    p_fl.add_argument("--fail-on-verifier", action="store_true")
    p_fl.add_argument("--fail-on-breach", action="store_true")
    p_fl.add_argument("--json", action="store_true")

    p_rev = sub.add_parser("review-prepare", help="Deterministic diff selection, bundling, and path rules (any AI host)")
    p_rev.add_argument("--path", default=".")
    p_rev.add_argument("--from", dest="from_ref", default=None)
    p_rev.add_argument("--to", dest="to_ref", default=None)
    p_rev.add_argument("--commit", default=None)
    p_rev.add_argument("--max-bundle-size", type=int, default=8)
    p_rev.add_argument("--scan", action="store_true", help="Review whole files instead of a diff (no git history needed)")
    p_rev.add_argument("--scan-path", action="append", default=[], help="Limit --scan to a directory or file (repeatable)")
    p_rev.add_argument("--session", nargs="?", const="new", default=None,
                       help="Open a resumable review session (optional id); resume it with `ros review-session resume <id>`")

    p_ses = sub.add_parser("review-session", help="Resumable review sessions: list, resume, mark")
    p_ses.add_argument("action", choices=["list", "resume", "mark"])
    p_ses.add_argument("session_id", nargs="?")
    p_ses.add_argument("bundle_id", nargs="?")
    p_ses.add_argument("--status", choices=["pending", "done", "failed"])
    p_ses.add_argument("--findings", type=int, default=None)
    p_ses.add_argument("--note", default=None)
    p_ses.add_argument("--path", default=".")
    p_ses.add_argument("--json", action="store_true")
    p_rev.add_argument("--json", action="store_true")

    p_rel = sub.add_parser("relocate", help="Verify/relocate a finding's line number against the real file")
    p_rel.add_argument("--file", required=True)
    p_rel.add_argument("--line", type=int, required=True)
    p_rel.add_argument("--snippet", required=True)
    p_rel.add_argument("--json", action="store_true")

    p_mem = sub.add_parser("memory", help="Inspect Hub Valkey/PostgreSQL health and memories by project")
    p_mem.add_argument("--project", default=None)
    p_mem.add_argument("--limit", type=int, default=10)
    p_mem.add_argument("--json", action="store_true")

    p_rt = sub.add_parser("route", help="Resolve recommended model/tier for a subagent or task (provider-agnostic)")
    p_rt.add_argument("--agent", default=None, help="Subagent name (e.g. general-purpose, debugger, security-reviewer)")
    p_rt.add_argument("--task", default=None, help="Task category (e.g. search, crud, business-logic, security, architecture)")
    p_rt.add_argument("--tier", default=None, help="Explicit semantic tier override: fast, balanced, reasoning")
    p_rt.add_argument("--provider", default="all", help="AI host/provider (claude, antigravity, gemini, codex, cursor, copilot, opencode, ollama, all)")
    p_rt.add_argument("--path", default=".", help="Repository root containing .agent/model-routing.json")
    p_rt.add_argument("--list", action="store_true", help="Print the full subagent routing table")
    p_rt.add_argument("--json", action="store_true")

    p_sy = sub.add_parser("sync-hosts", help="Sync canonical agents/, commands/, .agents/skills/ into .claude/ host adapters")
    p_sy.add_argument("--target", default=".")
    p_sy.add_argument("--mode", choices=["copy", "symlink"], default="copy")
    p_sy.add_argument("--only", default=None, help="Comma-separated subset: agents,commands,skills")
    p_sy.add_argument("--skills-source", default=None)
    p_sy.add_argument("--check", action="store_true", help="Check drift without writing (exits 1 if out of sync)")
    p_sy.add_argument("--json", action="store_true")

    sub.add_parser("mcp", help="Start the local provider-agnostic MCP server over stdio")
    p_px = sub.add_parser("mcp-proxy", help="Wrap any MCP server and bound its tool output (ros mcp-proxy -- <command>)")
    p_px.add_argument("server", nargs=argparse.REMAINDER)

    args = ap.parse_args(argv)
    if not args.command:
        ap.print_help()
        return 0

    if args.command == "doctor":
        rep = run_doctor(Path(args.path))
        if args.json:
            print(json.dumps(rep, ensure_ascii=False, indent=2))
        else:
            print(f"Resident Agent OS Doctor — {rep['repo']} (project_id={rep['project_id']})")
            print(f"  Runtimes: python={rep['runtimes']['python']} git={rep['runtimes']['git']} node={rep['runtimes']['node']} psql={rep['runtimes']['psql']}")
            print(f"  Hub: valkey={'up' if rep['hub_services']['valkey']['connected'] else 'down'} postgres={'up' if rep['hub_services']['postgres']['connected'] else 'down'}")
            print(f"  Telemetría: {rep['telemetry']['events']} eventos (umbrales={rep['telemetry']['threshold_status']})")
            active_hosts = [k for k, v in rep["detected_hosts"].items() if v]
            print(f"  Hosts detectados: {', '.join(active_hosts) or 'ninguno'}")
            hs = rep["host_sync"]
            if hs["checked"]:
                print(f"  Sincronización .claude/: in_sync={hs['in_sync']} (faltantes={hs['missing']}, deriva={hs['drifted']})")
        return 0

    if args.command == "init-host":
        rep = init_host(Path(args.target), args.host, dry_run=args.dry_run)
        if args.json:
            print(json.dumps(rep, ensure_ascii=False, indent=2))
        else:
            prefix = "(simulación) " if args.dry_run else ""
            print(f"{prefix}init-host ({', '.join(rep['hosts'])}) en {rep['target']}:")
            print(f"  creados:    {', '.join(rep['created']) or '-'}")
            print(f"  conservados: {', '.join(rep['skipped_existing']) or '-'}")
        return 0

    if args.command == "verify":
        from verifiers import run as vrun

        v_args = ["--path", args.path]
        if args.only:
            v_args += ["--only", args.only]
        if args.json:
            v_args.append("--json")
        return vrun.main(v_args)

    if args.command == "thresholds":
        from scripts import check_thresholds as ct

        c_args = ["--agent-dir", args.agent_dir]
        if args.require_data:
            c_args.append("--require-data")
        if args.json:
            c_args.append("--json")
        return ct.main(c_args)

    if args.command == "fleet":
        from scripts import fleet_status as fs_mod

        f_args: list[str] = []
        if args.parent:
            f_args += ["--parent", args.parent]
        for t in args.target:
            f_args += ["--target", t]
        if args.out:
            f_args += ["--out", args.out]
        if args.with_network:
            f_args.append("--with-network")
        if args.with_deps:
            f_args.append("--with-deps")
        if args.fail_on_drift:
            f_args.append("--fail-on-drift")
        if args.fail_on_verifier:
            f_args.append("--fail-on-verifier")
        if args.fail_on_breach:
            f_args.append("--fail-on-breach")
        if args.json:
            f_args.append("--json")
        return fs_mod.main(f_args)

    if args.command == "review-prepare":
        rep = prepare_review(
            Path(args.path),
            from_ref=args.from_ref,
            to_ref=args.to_ref,
            commit=args.commit,
            max_bundle_size=args.max_bundle_size,
            scan=args.scan,
            scan_paths=args.scan_path or None,
        )
        if args.session:
            from agent import review_session
            rep["session"] = review_session.create(Path(args.path), rep, None if args.session == "new" else args.session)["session_id"]
        if args.json:
            print(json.dumps(rep, ensure_ascii=False, indent=2))
        else:
            c = rep["counts"]
            print(f"review-prepare ({rep['meta']['mode']}): {c['reviewable']} revisables, {c['excluded']} excluidos, {c['bundles']} lotes, {c['rule_groups']} grupos de reglas")
            for b in rep["bundles"]:
                print(f"  [{b['bundle_id']}] ({b['scope']}): {', '.join(b['files'])}")
            for g in rep["rule_groups"]:
                print(f"  regla {g['id']} [{g['severity']}] -> {len(g['files'])} archivo(s)")
            if rep.get("session"):
                print(f"  sesión {rep['session']}: marca cada lote con `ros review-session mark {rep['session']} <lote> --status done`")
        return 0

    if args.command == "review-session":
        from agent import review_session
        root = Path(args.path)
        if args.action == "list":
            rep = {"sessions": review_session.list_sessions(root)}
        elif not args.session_id:
            print("falta el id de la sesión", file=sys.stderr)
            return 2
        elif args.action == "resume":
            rep = review_session.resume(root, args.session_id)
        else:
            if not args.bundle_id or not args.status:
                print("mark necesita <lote> y --status", file=sys.stderr)
                return 2
            rep = review_session.mark(root, args.session_id, args.bundle_id, args.status, args.findings, args.note)
        if args.json or args.action == "mark":
            print(json.dumps(rep, ensure_ascii=False, indent=2))
        elif args.action == "list":
            for s in rep["sessions"]:
                print(f"  {s['session_id']}  {s.get('mode')}  {s.get('done', 0)}/{s.get('total', 0)} lotes  {s.get('updated_at')}")
        else:
            print(f"sesión {rep['session_id']}: {rep['done']}/{rep['total']} lotes revisados; pendientes: "
                  + (", ".join(b["bundle_id"] for b in rep["pending"]) or "ninguno")
                  + (f"; reabiertos por cambios: {', '.join(rep['reopened'])}" if rep["reopened"] else ""))
        return 0

    if args.command == "mcp-proxy":
        from agent.mcp_proxy import main as proxy_main
        return proxy_main(args.server)

    if args.command == "relocate":
        rep = relocate_finding(args.file, args.line, args.snippet)
        if args.json:
            print(json.dumps(rep, ensure_ascii=False, indent=2))
        else:
            print(f"{rep['status']}: reported={rep['reported_line']} verified={rep['verified_line']} ({rep['path']})")
        return 0 if rep["status"] in ("exact", "relocated") else 1

    if args.command == "memory":
        rep = inspect_memory(project_id=args.project, limit=args.limit)
        if args.json:
            print(json.dumps(rep, ensure_ascii=False, indent=2))
        else:
            pg = rep["postgres"]
            vk = rep["valkey"]
            print(f"Hub Memory (project={rep['project_id']}):")
            print(f"  Valkey ({vk['host']}:{vk['port']}): {'up' if vk['connected'] else 'down'} {vk['error'] or ''}")
            print(f"  PostgreSQL ({pg['host']}:{pg['port']}): {'up' if pg['connected'] else 'down'} schema_ready={pg['schema_ready']} {pg['error'] or ''}")
            print(f"  Memorias: {len(pg['memories'])} | Resúmenes de sesión: {len(pg['session_summaries'])}")
        return 0

    if args.command == "route":
        repo_path = Path(args.path)
        if args.list:
            rep = list_agent_routing(provider=args.provider, repo_root=repo_path)
            if args.json:
                print(json.dumps(rep, ensure_ascii=False, indent=2))
            else:
                print(f"Model routing ({rep['config_path']}):")
                for row in rep["agents"]:
                    if args.provider != "all":
                        print(f"  {row['agent']:22s} tier={row['tier']:9s} {args.provider}={row['model']}")
                    else:
                        provs = " ".join(f"{k}={v}" for k, v in sorted(row["models_by_provider"].items()))
                        print(f"  {row['agent']:22s} tier={row['tier']:9s} {provs}")
            return 0

        rep = resolve_model(
            agent_name=args.agent,
            task=args.task,
            tier=args.tier,
            provider=args.provider,
            repo_root=repo_path,
        )
        if args.json:
            print(json.dumps(rep, ensure_ascii=False, indent=2))
        else:
            print(f"tier={rep['tier']} (source={rep['selection_source']}, agent={rep['agent'] or '-'}, task={rep['task'] or '-'})")
            if rep["model"] is not None:
                print(f"  {rep['provider']}: {rep['model']}")
            else:
                for prov, model in sorted(rep["models_by_provider"].items()):
                    print(f"  {prov:12s}: {model}")
            if rep.get("escalate_to"):
                print(f"  escalate_to: {rep['escalate_to']}")
        return 0

    if args.command == "sync-hosts":
        from scripts import sync_agent_dirs as sync_mod

        s_args = ["--target", args.target, "--mode", args.mode]
        if args.only:
            s_args += ["--only", args.only]
        if args.skills_source:
            s_args += ["--skills-source", args.skills_source]
        if args.check:
            s_args.append("--check")
        if args.json:
            s_args.append("--json")
        return sync_mod.main(s_args)

    if args.command == "mcp":
        from agent.mcp_server import serve_stdio

        return serve_stdio()

    return 2


if __name__ == "__main__":
    sys.exit(main())
