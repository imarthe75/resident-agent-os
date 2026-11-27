# Resident Agent OS v1.0.0 — Consolidated Architecture Summary

**Version:** `1.0.0` (`VERSION`)  
**Date:** 2026-11-26  
**Scope:** Generic, provider-agnostic Agentic OS, unified CLI (`ros`), local stdio MCP server, multi-host hooks, deterministic verifiers, Hub-and-Spoke memory, and live observability frontend (`resident-ui`).

---

## Core Components

### 1. Python Runtime, CLI & Local MCP Server (`agent/`, `pyproject.toml`)
- `agent/cli.py` + `agent/__main__.py`: Unified CLI `ros` (`doctor`, `init-host`, `verify`, `review-prepare`, `relocate`, `thresholds`, `fleet`, `memory`, `mcp`).
- `agent/mcp_server.py`: Pure-stdlib JSON-RPC 2.0 stdio MCP server exposing 7 deterministic tools with output bounding and `0600` spill files (`templates/mcp/mcp.json.example`).
- `agent/telemetry.py`: Structured JSON logs (`JsonFormatter`), secret redaction, unified JSONL stream (`.agent/telemetry/events.jsonl`), production signal summaries, threshold evaluation (`NO_MONITOREADA` when unspecified), and optional OTLP/HTTP export (`ROS_OTLP_ENDPOINT`).
- `agent/review_prepare.py`: Deterministic git diff selection, secret/binary/lockfile exclusion, module bundling, `.agent/path-rules.json` matching, and line relocation.
- `agent/loop.py`: 10-phase deterministic loop with `project_id`, `max_token_budget`, `max_failure_streak`, and per-phase timing telemetry.

### 2. Multi-Host Hooks, Compression & Benchmarks (`scripts/`)
- `scripts/hooks/telemetry-lib.js`: Host-agnostic path/project/host detection, atomic `STATE.md` writes, and unified JSONL telemetry.
- `scripts/hooks/command-filters.js` + `compress-output.js`: Deterministic CLI filters (`pytest`, `git`, `npm`/`pip`/`uv`/`docker`, `mvn`/`gradle`, `jest`/`vitest`, `rg`/`grep`) that preserve 100% of error/summary lines and keep recoverable originals.
- `scripts/hooks/post-edit.js`, `pre-compact.js`, `session-end.js`, `statusline.sh`: Lifecycle hooks, PostgreSQL `memory.session_summaries` persistence, and terminal statusline.
- `scripts/benchmark_filters.py`, `scripts/check_thresholds.py`, `scripts/fleet_status.py`, `scripts/distribute_framework.py`.

### 3. Hub-and-Spoke Memory (`memory/`, `sql/agent_memory.sql`)
- PostgreSQL 18 + pgvector (`memory.agent_memory` with `project_id` + HNSW index + `evidence_level` isolation, plus non-vector `memory.session_summaries` with UUIDv7 PK) and Valkey 8 semantic cache.

### 4. Live Observability Frontend (`resident-ui/`)
- Next.js 16.4 + React 19 + TypeScript 6 with 6 live pages (`/dashboard`, `/fleet`, `/memory`, `/specs`, `/editor`, `/debug`), 8 live API routes (`/api/health`, `/api/health/ready`, `/api/state`, `/api/events` SSE, `/api/memory?project=`, `/api/specs`, `/api/files`, `/api/fleet`), and `src/proxy.ts` enforcing DNS-rebinding `Host` allowlisting, CSP, and security headers.

### 5. Deterministic Verifiers & CI (`verifiers/`, `templates/`)
- 12 mechanical verifiers (`python3 verifiers/run.py` / `ros verify`) including `observability_min` (with Next.js API support) and `observability_production`.
- CI templates: `templates/ci/mr-review.gitlab-ci.yml` (`resource_group` + `interruptible`) and `templates/ci/mutation-testing.gitlab-ci.yml`.

---

## Architectural Decisions
- [`DECISIONS/0005-observabilidad-real-ui-hooks-y-flota.md`](DECISIONS/0005-observabilidad-real-ui-hooks-y-flota.md)
- [`DECISIONS/0006-cli-mcp-hub-and-spoke-multiagente.md`](DECISIONS/0006-cli-mcp-hub-and-spoke-multiagente.md)
