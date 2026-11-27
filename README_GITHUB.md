# Resident Agent OS (`v1.0.0`)

> **Local-first, provider-agnostic Agentic OS & control plane for cognitive coding assistants: unified CLI (`ros`), zero-dependency stdio MCP server, deterministic verifiers, multi-host hooks, Hub-and-Spoke memory, and real-time observability UI.**

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](VERSION)
[![Python 3.10+](https://img.shields.io/badge/python-3.10%2B-blue.svg)](https://www.python.org/downloads/)
[![Node.js 18+](https://img.shields.io/badge/node-18%2B-339933.svg)](https://nodejs.org/)
[![PostgreSQL 18 + pgvector](https://img.shields.io/badge/postgresql-18%20%2B%20pgvector-336791.svg)](sql/agent_memory.sql)
[![Valkey 8](https://img.shields.io/badge/valkey-8-ff0000.svg)](docker-compose.yml)

---

## What It Is

**Resident Agent OS** is a generic, organization-agnostic framework that equips **any AI coding assistant** (Claude Code, Gemini CLI, Antigravity, Codex, Cursor, Windsurf, Copilot CLI, OpenCode, or any MCP-compatible client) with:

1. **Unified CLI (`ros`)** (`agent/cli.py`, `pyproject.toml`):
   `ros doctor`, `ros init-host <host|all>`, `ros verify`, `ros review-prepare`, `ros relocate`, `ros thresholds`, `ros fleet`, `ros memory`, and `ros mcp`.
2. **Local Provider-Agnostic MCP Server** (`agent/mcp_server.py`, `templates/mcp/mcp.json.example`):
   Pure-stdlib JSON-RPC 2.0 stdio server exposing 7 deterministic tools (`ros_doctor`, `ros_verify`, `ros_review_prepare`, `ros_relocate_finding`, `ros_check_thresholds`, `ros_fleet_status`, `ros_memory_status`) with bounded outputs and `0600` private spill files.
3. **Deterministic 10-Phase Loop & Guardrails** (`agent/loop.py`, `verifiers/checks.py`):
   Structured JSONL telemetry (`agent/telemetry.py`), optional OTLP/HTTP export (`ROS_OTLP_ENDPOINT`), explicit alert thresholds (`.agent/thresholds.json`), token/failure-streak budgets, and 12 mechanical verifiers including `observability_min` and `observability_production`.
4. **Multi-Host Hooks & CLI Output Compression** (`scripts/hooks/`):
   Syntax gate (`post-edit.js`), command filters (`command-filters.js`, `compress-output.js`) preserving 100% of errors/summaries while cutting noisy CLI output, `pre-compact.js`, `session-end.js`, terminal `statusline.sh`, and deterministic `scripts/benchmark_filters.py`.
5. **Deterministic Review Preparation & Line Relocation** (`agent/review_prepare.py`, `.agent/path-rules.json`):
   Secret/binary/lockfile exclusion, module bundling, per-path surgical rules, and deterministic line relocation for code reviews and CI (`templates/ci/mr-review.gitlab-ci.yml`).
6. **Hub-and-Spoke Memory & Real-Time Control Plane UI (`resident-ui/`)**:
   PostgreSQL 18 + pgvector + `memory.session_summaries` isolated by `project_id`, Valkey 8 cache, and Next.js 16 live dashboard (`/dashboard`, `/fleet`, `/memory`, `/specs`, `/editor`, `/debug`) with SSE streaming, DNS-rebinding `Host` guard, and CSP security headers (`resident-ui/src/proxy.ts`).

---

## Quick Start

```bash
# Install the unified CLI
pip install -e .

# Check runtime health, hooks, verifiers, and optional backends
ros doctor

# Configure your preferred AI host (claude, gemini, antigravity, codex, cursor, copilot, opencode, generic, all)
ros init-host all

# Run deterministic repository verifiers and alert thresholds
ros verify
ros thresholds

# Start local MCP server (configure in your host using templates/mcp/mcp.json.example)
ros mcp
```

For full documentation, architecture, installation, and role guides see:
- [`README.md`](README.md) — complete guide in Spanish
- [`ARCHITECTURE.md`](ARCHITECTURE.md) — full system architecture
- [`RESIDENT_AGENT_OS_QUICKSTART.md`](RESIDENT_AGENT_OS_QUICKSTART.md) — 5-minute walkthrough
- [`INSTALAR.md`](INSTALAR.md) — guided installation into target repositories
- [`resident-ui/README.md`](resident-ui/README.md) — live observability frontend & Docker setup
- [`INDEX.md`](INDEX.md) — complete file and module index
