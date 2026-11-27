# ADR-0005 — Observabilidad real del agente, panel conectado sin maquetas, telemetría unificada en hooks y monitor de flota

- **Fecha:** 2026-11-26
- **Estado:** Implementado

## Contexto
Al auditar el propio `resident-agent-os` v2.20.0 contra sus reglas (`rules/common/honesty.md` y `rules/common/observability.md`) se verificaron cinco brechas:
1. `resident-ui/` mostraba métricas, claves Valkey y memorias fijas en `agentStore.ts` sin ningún backend conectado.
2. `agent/loop.py` emitía logs de texto plano con emojis sin formato JSON estructurado, sin tiempos por fase ni evaluación contra umbrales escritos.
3. Los hooks de Claude Code / Gemini CLI (`post-edit.js`, `compress-output.js`, `pre-compact.js`, `session-end.js`) no registraban telemetría compartida y `session-end.js` insertaba texto sin vector en `memory.lessons` por interpolación de cadenas.
4. `observability_min` no evaluaba backends Next.js App Router ni las reglas de producción de v2.17–v2.20 (sonda de preparación separada, `503`, logs JSON y umbrales), `RESIDENT_AGENT_OS_QUICKSTART.md` citaba nombres viejos de servicios (`valkey`/`postgres`) y faltaba una prueba de integración real contra PostgreSQL + pgvector.
5. No existía un comando único que agregara deriva del framework, verificadores, dependencias y telemetría a través de múltiples repositorios.

## Decisiones
1. **Telemetría estructurada y umbrales (`agent/telemetry.py`, `.agent/thresholds.json`, `scripts/check_thresholds.py`):**
   - `JsonFormatter` + `redact()` para logs JSON con `correlation_id` y sin secretos.
   - Stream JSONL compartido `.agent/telemetry/events.jsonl` alimentado tanto por `ResidentAgentLoop` como por los hooks Node.
   - Cálculo real de las 4 señales de producción (latencia p95, tasa de error, costo por corrida, tasa de abstención) y evaluación contra `.agent/thresholds.json` (`NO_MONITOREADA` si falta umbral, exit code `1` en cron/CI al superarlo).
2. **Hooks unificados y tabla dedicada (`scripts/hooks/telemetry-lib.js`, `sql/agent_memory.sql`):**
   - `post-edit.js` y `compress-output.js` registran eventos reales (errores de sintaxis, reintentos en `STATE.md`, caracteres/tokens ahorrados) en el mismo JSONL.
   - `session-end.js` persiste resúmenes operativos en la nueva tabla no vectorial `memory.session_summaries` mediante variables parametrizadas de `psql` (`:'var'`), dejando `memory.agent_memory` y `memory.lessons` exclusivamente para embeddings reales.
3. **`resident-ui/` 100% real (cero datos simulados):**
   - Route Handlers en `/api/health`, `/api/health/ready` (`503` si falla), `/api/state`, `/api/memory` (sonda RESP real a Valkey + consulta real a PostgreSQL), `/api/specs` (`GET`/`PUT`), `/api/files`, `/api/fleet` y `/api/events` (SSE en vivo).
   - Middleware `src/middleware.ts` con `X-Request-Id` y logs JSON.
   - Todos los componentes muestran estados reales (`DESCONECTADO` / `SIN_DATOS` cuando un servicio está apagado).
4. **Verificadores y pruebas de integración (`verifiers/checks.py`, `tests/test_pgvector_integration.py`, `tests/hooks/hooks-lifecycle.test.js`):**
   - `observability_min` incorpora `nextjs-api` y se agrega `observability_production` (readiness separada, logs JSON, `503`, umbrales).
   - Prueba real de `sql/agent_memory.sql` (idempotente) + `LongTermMemory` contra PostgreSQL + pgvector aislada por `ROS_TEST_PG_DSN`, y prueba de ciclo completo de los 5 hooks.
5. **Monitor de flota (`scripts/fleet_status.py` + vista `/fleet` en `resident-ui`):**
   - Escanea múltiples repositorios y genera `data/fleet-status.json` con deriva, verificadores, dependencias opcionales y alertas de telemetría/ahorro de hooks.
