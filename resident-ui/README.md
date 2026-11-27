# Resident UI — Panel de Observabilidad y Control

Interfaz Next.js 16 + Electron (opcional) conectada **únicamente a datos reales** del Agente Residente: `.agent/STATE.md`, `.agent/SPECS.md`, `.agent/heuristics.json`, `.agent/thresholds.json`, `.agent/telemetry/events.jsonl`, `data/fleet-status.json`, Valkey (`agent-cache`) y PostgreSQL + pgvector (`agent-db`).

Cuando un servicio externo está apagado o una variable no está configurada, el panel lo declara explícitamente como `DESCONECTADO` o `SIN_DATOS` — nunca muestra métricas simuladas.

## Endpoints de backend (`/api/*`)

| Ruta | Método | Propósito |
| :--- | :---: | :--- |
| `/api/health` | `GET` | Liveness probe (sin dependencias externas, siempre rápido). |
| `/api/health/ready` | `GET` | Readiness probe: verifica `.agent/`, `PING` TCP/RESP a Valkey y conexión a PostgreSQL (`503` si `.agent/` no es legible o `?strict=1` y alguna dependencia cayó). |
| `/api/state` | `GET` | Estado de máquina (`STATE.md`), specs (`SPECS.md`), reglas (`heuristics.json`), perfil (`PROFILE.json`), telemetría, 4 señales de producción y evaluación contra `thresholds.json`. |
| `/api/memory` | `GET` | Claves reales de Valkey (`SCAN`) y registros de `memory.agent_memory` y `memory.session_summaries` en PostgreSQL (soporta `?project=<id>` para modo Hub-and-Spoke). |
| `/api/specs` | `GET` / `PUT` | Lectura y guardado atómico de `.agent/SPECS.md`. |
| `/api/files` | `GET` | Explorador de solo lectura acotado a `.agent/`, `rules/`, `changes/` y `DECISIONS/`. |
| `/api/fleet` | `GET` | Reporte multi-repositorio generado por `scripts/fleet_status.py` (`ros fleet`). |
| `/api/events` | `GET` | Stream SSE (`text/event-stream`) en vivo de `.agent/telemetry/events.jsonl`. |

Todas las rutas `/api/*` propagan o generan `X-Request-Id` vía `src/proxy.ts` (convención Next.js 16) y emiten logs estructurados JSON (excluyendo el probe `/api/health`).

## Variables de entorno

| Variable | Valor por omisión | Uso |
| :--- | :--- | :--- |
| `AGENT_DIR` | `../.agent` (o `/app/.agent` en Docker) | Directorio de estado, specs, umbrales y telemetría |
| `DATA_DIR` | `../data` (o `/app/data` en Docker) | Directorio donde vive `fleet-status.json` |
| `WORKSPACE_ROOT` | `..` (o `/workspace` en Docker) | Raíz para el explorador de `rules/`, `changes/`, `DECISIONS/` |
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
npm install
npm run dev
# http://localhost:3000
```
