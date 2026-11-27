# ADR-0006 — CLI unificado (`ros`), servidor MCP agnóstico de proveedor, arquitectura Hub-and-Spoke y preparación determinista de revisiones

- **Fecha:** 2026-11-26
- **Estado:** Implementado
- **Referencias externas analizadas (solo ideas, implementación propia):** JayPokale/Chisle v3.13+ (MIT) y alibaba/open-code-review (Apache-2.0).

## Contexto
Tras conectar `resident-ui/` y añadir telemetría real en ADR-0005, quedaron cuatro fricciones para usar `resident-agent-os` como un verdadero sistema operativo de agentes en el día a día y con **cualquier proveedor o asistente de IA** (no solo Claude Code o Gemini CLI/Antigravity, sino también Codex, Cursor, Windsurf, Cline, Copilot CLI, OpenCode u otros):
1. La operación dependía de recordar múltiples scripts sueltos (`verifiers/run.py`, `scripts/fleet_status.py`, `scripts/check_thresholds.py`, etc.).
2. Los agentes dentro del IDE no tenían una interfaz estándar para invocar verificadores, telemetría, memoria o preparación de revisiones sin scripts ad-hoc; además, los hosts sin hook de reescritura de salida sufrían respuestas grandes.
3. Levantar `agent-cache` + `agent-db` + `resident-ui` por cada repositorio duplicaba RAM y provocaba colisión de puertos (`5432`/`6379`/`3000`).
4. Las revisiones de MRs grandes dependían de que el agente eligiera archivos manualmente, sin bundling determinista, reglas por ruta ni reubicación de líneas.

## Decisiones
1. **CLI unificado `ros` (`agent/cli.py`, `agent/__main__.py`, `pyproject.toml`):**
   - Un único entrypoint (`ros` o `python -m agent`) con `doctor`, `init-host`, `verify`, `thresholds`, `fleet`, `review-prepare`, `relocate`, `memory` y `mcp`.
   - `ros init-host --host <all|claude|gemini|antigravity|codex|cursor|copilot|opencode|generic>` genera configuración no destructiva (`.mcp.json`, `.gemini/settings.json`, `.cursor/rules/`, `.github/copilot-instructions.md`, `AGENTS.md`, `.claude/settings.json`) sin acoplar el núcleo a ningún proveedor.
2. **Servidor MCP local agnóstico de proveedor (`agent/mcp_server.py`, `templates/mcp/mcp.json.example`):**
   - JSON-RPC 2.0 sobre stdio (sin SDK externo pesado; soporta tanto NDJSON como framing `Content-Length`), exponiendo 7 herramientas reales (`ros_doctor`, `ros_verify`, `ros_review_prepare`, `ros_relocate_finding`, `ros_check_thresholds`, `ros_fleet_status`, `ros_memory_status`).
   - Acotado de respuestas grandes con *spill* privado (`0600` en directorio `0700`), protegiendo el contexto en cualquier host MCP.
3. **Arquitectura Hub-and-Spoke (`project_id`):**
   - Columna `project_id` + índice en `memory.agent_memory` y `memory.session_summaries` (`sql/agent_memory.sql`), filtrado en `LongTermMemory`, `agent/telemetry.py`, `scripts/hooks/telemetry-lib.js`, `session-end.js` y `resident-ui` (`/api/memory?project=...`).
   - Un solo Hub central (`agent-cache` + `agent-db` + `resident-ui`) sirve a toda la flota; cada repo solo lleva la capa ligera.
   - `resident-ui/src/middleware.ts` migra a `src/proxy.ts` (convención vigente de Next.js 16).
4. **Preparación determinista de revisión + filtros por comando (`agent/review_prepare.py`, `.agent/path-rules.json`, `scripts/hooks/command-filters.js`):**
   - Selección determinista de cambios Git (workspace, rango o commit) excluyendo secretos/binarios/lockfiles con motivo explícito, *smart bundling* por módulo, emparejamiento de `.agent/path-rules.json`, verificación/reubicación de líneas (`relocate_finding`), presupuestos duros de tokens y corte por racha de fallos en `ResidentAgentLoop`, y listas «Qué NO reportar» en `agents/code-reviewer.md`.
   - Filtros conscientes del comando (`git`, `pytest`, `node --test`, `jest`/`vitest`, `mvn`/`gradle`, `npm`/`pip`/`docker`, `grep`/`rg`) integrados en `compress-output.js`.
