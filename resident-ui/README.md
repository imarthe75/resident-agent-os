# Resident UI — Panel de Observabilidad y Control

Interfaz Next.js 16 + Electron (opcional) en **español** con tooltips explicativos integrados («for dummies») y Monaco Editor 100% local (`/vs`, sin CDNs externos), conectada **únicamente a datos reales** del Agente Residente: `.agent/STATE.md`, `.agent/SPECS.md`, `.agent/heuristics.json`, `.agent/thresholds.json`, `.agent/model-routing.json`, `.agent/path-rules.json`, `.agent/versions-policy.json`, `.agent/telemetry/events.jsonl`, `verifiers/`, `agents/`, `commands/`, `skills/`, `DECISIONS/`, `data/*.json`, Valkey (`agent-cache`) y PostgreSQL + pgvector (`agent-db`).

Cuando un servicio externo está apagado o un artefacto aún no existe, el panel lo declara explícitamente como `DESCONECTADO`, `SIN_DATOS` o `NO_EVALUADO` e incluye una guía copiable («¿Cómo genero estos datos?») — nunca muestra métricas simuladas.

## Vistas principales

- `/dashboard` — **Núcleo del Agente**: estado de fase, KPIs de telemetría, ahorro real de tokens por hooks, historial seleccionable de sesiones, traza del ciclo cognitivo y flujo de telemetría con filtros y exportación JSONL.
- `/fleet` — **Monitor de Flota**: estado multi-repositorio de `data/fleet-status.json`.
- `/gates` — **Compuertas y Verificadores**: ejecución y consulta de `verifiers/run.py`, filtros por estado, rutas públicas justificadas (`.agent/public-routes.txt`), compuertas de etapa (`.agent/gates/*.yml`) y salud de dependencias (`.agent/versions-policy.json` + `data/outdated-dependencies.json`).
- `/audit` — **Auditoría Local (Micro-Centinela)**: identifica qué módulo, archivo y línea incumple estándares de Seguridad, Desarrollo/BD, Accesibilidad WCAG, Documentación y Manuales, CMMI v3.0, ISO 27001 y Estándares CASMARTS (si el kit está instalado), con prompts copiables de corrección, herramientas externas opcionales (`semgrep`/`gitleaks`/`trivy`) y consulta opcional a `PREFLIGHT_URL`.
- `/capabilities` — **Catálogo de Capacidades**: buscador en tiempo real de skills (`SKILL.md`), comandos slash (`commands/*.md`) y reglas por ruta (`.agent/path-rules.json`).
- `/editor` — **Archivos del Espacio**: visor de solo lectura con Monaco Editor servido localmente desde `/vs`.
- `/specs` — **Especificaciones y ADRs**: editor atómico de `.agent/SPECS.md`, trazabilidad con `docs/specs/*/spec.md` y registro de decisiones técnicas (`.agent/decisions.json` + `DECISIONS/*.md`).
- `/memory` — **Memoria Semántica**: claves de Valkey y registros de PostgreSQL (`memory.agent_memory`, `memory.session_summaries`) filtrables por `project_id`.
- `/debug` — **Depuración y Reglas**: sonda de disponibilidad (`/api/health/ready`), diagnóstico del entorno (`ros doctor` + deriva SSOT `.agents/` → `.claude/`), ruteo de subagentes y modelos, errores recientes y heurísticas.

## Endpoints de backend (`/api/*`)

| Ruta | Método | Propósito |
| :--- | :---: | :--- |
| `/api/health` | `GET` | Liveness probe (sin dependencias externas, siempre rápido). |
| `/api/health/ready` | `GET` | Readiness probe: verifica `.agent/`, `PING` TCP/RESP a Valkey y conexión a PostgreSQL (`503` si `.agent/` no es legible o `?strict=1` y alguna dependencia cayó). |
| `/api/state` | `GET` | Estado de máquina (`STATE.md`), specs (`SPECS.md`), reglas (`heuristics.json`), perfil (`PROFILE.json`), telemetría (incluyendo ahorro de hooks e historial de sesiones), 4 señales de producción y evaluación contra `thresholds.json`. |
| `/api/memory` | `GET` | Claves reales de Valkey (`SCAN`), lista de `project_id` disponibles y registros de `memory.agent_memory` y `memory.session_summaries` en PostgreSQL (soporta `?project=<id>`). |
| `/api/specs` | `GET` / `PUT` | Lectura y guardado atómico de `.agent/SPECS.md`. |
| `/api/files` | `GET` | Explorador de solo lectura acotado a `.agent/`, `rules/`, `changes/` y `DECISIONS/`. |
| `/api/fleet` | `GET` | Reporte multi-repositorio generado por `scripts/fleet_status.py` (`ros fleet`). |
| `/api/events` | `GET` | Stream SSE (`text/event-stream`) en vivo de `.agent/telemetry/events.jsonl`. |
| `/api/verifiers` | `GET` / `POST` | Lee `data/verifiers-report.json`, `.agent/public-routes.txt` y `.agent/gates/*.yml`; `POST` ejecuta `verifiers/run.py --json` (sin red por defecto; `with_network: true` opcional) con argumentos seguros y timeout acotado. |
| `/api/audit` | `GET` / `POST` | Lee `data/micro-audit-report.json` o ejecuta `scripts/micro_audit.py --json` (Seguridad, Desarrollo/BD, WCAG, Documentación/Manuales, CMMI, ISO 27001, Estándares CASMARTS si el kit está instalado, herramientas externas opcionales y `PREFLIGHT_URL`). |
| `/api/dependencies` | `GET` | Lee `.agent/versions-policy.json` y `data/outdated-dependencies.json` con política de pisos mínimos y dependencias vencidas. |
| `/api/doctor` | `GET` | Diagnóstico equivalente a `ros doctor`: runtimes, hosts de IA detectados, sincronización SSOT `.agents/` → `.claude/` y hooks configurados. |
| `/api/routing` | `GET` | Política `.agent/model-routing.json` e inventario de subagentes (`agents/*.md`) con nivel (`fast`/`balanced`/`reasoning`) y modelo resuelto por proveedor. |
| `/api/capabilities` | `GET` | Inventario de skills (`SKILL.md`), comandos slash (`commands/*.md`) y reglas por ruta (`.agent/path-rules.json`). |
| `/api/decisions` | `GET` | Trazabilidad de requisitos (`.agent/SPECS.md` + `docs/specs/*/spec.md`) y decisiones técnicas (`.agent/decisions.json` + `DECISIONS/*.md`). |

Todas las rutas `/api/*` propagan o generan `X-Request-Id` vía `src/proxy.ts` (convención Next.js 16) y emiten logs estructurados JSON (excluyendo el probe `/api/health`). La CSP mantiene `'unsafe-eval'` **estrictamente prohibido en producción** (solo habilitado en modo desarrollo para React 19) y permite `font-src 'self' data:` y `worker-src 'self' blob:` para Monaco local.

## Variables de entorno

| Variable | Valor por omisión | Uso |
| :--- | :--- | :--- |
| `AGENT_DIR` | `../.agent` (o `/workspace/.agent` en Docker) | Directorio de estado, specs, umbrales y telemetría (montado fuera de `/app` para que Turbopack/Tailwind v4 no escanee volúmenes de datos) |
| `DATA_DIR` | `../data` (o `/workspace/data` en Docker) | Directorio donde viven `fleet-status.json`, `verifiers-report.json` y `outdated-dependencies.json` |
| `WORKSPACE_ROOT` | `..` (o `/workspace` en Docker) | Raíz del repositorio para `rules/`, `changes/`, `DECISIONS/`, `verifiers/`, `agents/`, `commands/`, `skills/` |
| `VALKEY_HOST` / `VALKEY_PORT` | `127.0.0.1` / `6379` | Sonda RESP y listado de claves |
| `POSTGRES_HOST` / `POSTGRES_PORT` | `127.0.0.1` / `5432` | Sonda TCP y consulta `psql` a `memory.*` |
| `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` | `db_resident_knowledge` / `admin` / *(vacío)* | Credenciales de lectura para `/api/memory` |

## Arranque

Con Docker Compose desde la raíz de `resident-agent-os`:

```bash
docker compose up -d --build agent-cache agent-db resident-ui
```

En local (sin Docker):

```bash
npm install   # ejecuta scripts/sync-monaco.mjs para enlazar /public/vs
npm run dev
# http://localhost:3000
```

## Pruebas automatizadas (unitarias + E2E en navegador real)

```bash
# Pruebas unitarias de inspectores y telemetría
npm test

# Suite E2E real en Chromium (verifica 0 errores de consola/hidratación, 0 CDNs externos, Monaco local y tooltips)
BASE_URL=http://127.0.0.1:3000 node tests/e2e-browser.mjs
```
