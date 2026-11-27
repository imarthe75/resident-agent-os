# Manual de Instalación, Prompts por Asistente y Arranque del Frontend (`resident-ui`)

Guía práctica única y autocontenida para instalar **Resident Agent OS** en un proyecto nuevo o existente, configurar cualquier asistente de IA (**Claude Code, Gemini CLI, Antigravity, Codex, Cursor, Copilot CLI, OpenCode** o cualquier cliente MCP), levantar el panel web **`resident-ui`**, y entender con honestidad qué funciona en **Linux, macOS y Windows**.

---

## 1. Preparación única del Hub (una vez por equipo o estación)

Descarga el paquete `.zip` (o clona el repositorio) en una carpeta fija fuera de tus proyectos, por ejemplo `~/tools/resident-agent-os` (Linux/macOS) o `C:\tools\resident-agent-os` (Windows):

```bash
# Linux / macOS
git clone <url-del-repo>/resident-agent-os.git ~/tools/resident-agent-os
# o descomprime el ZIP:
unzip resident-agent-os_v*.zip -d ~/tools/
```

```powershell
# Windows (PowerShell)
Expand-Archive .\resident-agent-os_v*.zip -DestinationPath C:\tools\
```

**Requisitos previos:**
- **Git**
- **Python 3.10+** (`pip install pyyaml` o `pip install -e .` para la CLI `ros` y los verificadores)
- **Node.js 18+** (para los hooks de sintaxis, compresión de salidas, mapa de código y `resident-ui`)
- **Docker / Docker Compose** *(opcional: solo si deseas levantar PostgreSQL 18 + pgvector, Valkey y `resident-ui` en contenedores)*

---

## 2. Instalar Resident Agent OS en un proyecto

### Opción A — Instalación guiada por el agente (recomendada)

1. Crea una rama en tu proyecto (`git checkout -b chore/agent-os`).
2. Abre tu asistente (**Claude Code, Gemini CLI, Antigravity, Codex, Cursor, Copilot o OpenCode**) en la raíz del proyecto.
3. Pégale uno de estos prompts:

**Para un proyecto NUEVO desde cero:**
> Lee `<ruta>/resident-agent-os/commands/new-project.md` y `<ruta>/resident-agent-os/INSTALAR.md`. Crea la base del proyecto con las últimas versiones estables compatibles (`scripts/latest_versions.py` y `scripts/outdated_dependencies.py --strict`), instala Resident Agent OS sin sobrescribir archivos propios y al terminar corre `python3 verifiers/run.py` y entrégame el reporte.

**Para un proyecto EXISTENTE:**
> Lee `<ruta>/resident-agent-os/INSTALAR.md` y síguelo paso a paso para instalar Resident Agent OS en este proyecto. No hagas commit ni push; al terminar entrégame el reporte de conflictos, dependencias atrasadas y salida de `verifiers/run.py`.

*(Si tu organización usa una capa propia sobre este framework —p. ej. un kit corporativo con su metodología y reglas—, instálala después siguiendo su propio `INSTALAR.md`.)*

### Opción B — Por CLI unificada `ros` (agnóstica al proveedor de IA)

```bash
# 1. Instalar la CLI `ros` (una sola vez en tu entorno/venv)
pip install -e ~/tools/resident-agent-os

# 2. Previsualizar y aplicar la configuración de hosts de IA en tu proyecto
#    Hosts soportados: claude | gemini | antigravity | codex | cursor | copilot | opencode | generic | all
ros init-host --host all --target /ruta/a/tu-proyecto --dry-run
ros init-host --host all --target /ruta/a/tu-proyecto

# 3. Verificar estado de Python, Node, hooks, MCP, umbrales y conexiones opcionales
cd /ruta/a/tu-proyecto
ros doctor
```

En Windows PowerShell usa `python -m agent` si `ros` no está en `PATH`:
```powershell
python -m agent init-host --host all --target C:\proyectos\mi-app --dry-run
python -m agent doctor
```

---

## 3. Cómo conectar cada asistente de IA y el servidor MCP local

Resident Agent OS es **agnóstico al proveedor**: no te ata a Claude ni a Gemini.

| Asistente / Host | Archivos que lee tras instalar | Conexión MCP local (`ros mcp`) |
| :--- | :--- | :--- |
| **Claude Code** | `CLAUDE.md` → `AGENTS.md`, `.claude/skills/`, `.claude/agents/`, `.claude/commands/`, `.claude/settings.json` (hooks + `statusLine`) | Usa `.mcp.json` generado por `ros init-host` (plantilla en `templates/mcp/mcp.json.example`) |
| **Gemini CLI** | `.gemini/settings.json` (le indica leer `AGENTS.md`) + `.agents/skills/` | Configura `mcpServers` apuntando a `python3 -m agent mcp` |
| **Antigravity** | `AGENTS.md` + `.agents/skills/` | Configura el servidor MCP stdio con `python3 -m agent mcp` |
| **Codex / Cursor / Copilot CLI / OpenCode** | `AGENTS.md` + `.agents/skills/` (+ `.cursor/rules/` o `.github/copilot-instructions.md` si aplica) | Mismo bloque JSON stdio de `templates/mcp/mcp.json.example` |

**Proxy MCP opcional para servidores de terceros ruidosos:** si conectas otros servidores MCP que devuelven salidas gigantes, envuélvelos con `python3 -m agent mcp-proxy -- <comando del servidor>` para acotar resultados sin truncar lecturas ni ediciones de archivos.

**Prompt recomendado al abrir una sesión de trabajo:**
> Lee `AGENTS.md` y `.agent/STATE.md`. Vamos a trabajar en `[describe tu tarea o requisito RF-xxx]`. Aplica las reglas obligatorias y las skills del stack que corresponda; antes de declarar terminado corre las pruebas, `python3 verifiers/run.py` y `ros thresholds`.

---

## 4. Cómo levantar y ver el frontend del agente (`resident-ui`)

La arquitectura es **Hub-and-Spoke**: levantas **una sola instancia** del panel (`resident-ui`) y opcionalmente PostgreSQL 18 (`pgvector`) + Valkey, y observas un proyecto específico o toda tu flota (`/fleet` y `/memory?project=<project_id>`).

### Opción 1 — Con Docker Compose (PostgreSQL 18 + Valkey + Frontend)

Desde la raíz de `resident-agent-os`:

```bash
# Linux / macOS
cd ~/tools/resident-agent-os
echo "POSTGRES_PASSWORD=pon_una_clave_local_segura" > .env
docker compose up -d --build agent-cache agent-db resident-ui
```

```powershell
# Windows (PowerShell con Docker Desktop)
cd C:\tools\resident-agent-os
Set-Content -Path .env -Value "POSTGRES_PASSWORD=pon_una_clave_local_segura"
docker compose up -d --build agent-cache agent-db resident-ui
```

Abre en tu navegador: **`http://localhost:3000`**

### Opción 2 — Solo el frontend en local (sin Docker, apuntando directo a tu proyecto)

```bash
# Linux / macOS
cd ~/tools/resident-agent-os/resident-ui
npm install
AGENT_DIR=/ruta/a/tu-proyecto/.agent \
WORKSPACE_ROOT=/ruta/a/tu-proyecto \
DATA_DIR=~/tools/resident-agent-os/data \
npm run dev
```

```powershell
# Windows (PowerShell)
cd C:\tools\resident-agent-os\resident-ui
npm install
$env:AGENT_DIR="C:\proyectos\mi-app\.agent"
$env:WORKSPACE_ROOT="C:\proyectos\mi-app"
$env:DATA_DIR="C:\tools\resident-agent-os\data"
npm run dev
```

Abre en tu navegador: **`http://localhost:3000`**

*(Si Valkey o PostgreSQL están apagados, el panel nunca falla ni inventa métricas: declara honestamente `DESCONECTADO` o `SIN_DATOS`.)*

### Qué muestra cada pantalla de `resident-ui`

| Ruta | Qué muestra |
| :--- | :--- |
| `/dashboard` | Estado vivo (`STATE.md`), traza de las 10 fases del bucle, **stream SSE en tiempo real** de `.agent/telemetry/events.jsonl`, las 4 señales de producción (latencia p95, tasa de error, costo, abstención), ahorro de tokens por hooks y alertas contra `.agent/thresholds.json`. |
| `/fleet` | Estado multi-repositorio (deriva del framework, verificadores, dependencias y telemetría) generado con `ros fleet --roots /ruta/a/repos --out data/fleet-status.json`. |
| `/memory` | Claves reales de Valkey (`SCAN`) y recuerdos/resúmenes en PostgreSQL filtrables por `?project=<project_id>`. |
| `/specs` | Lectura y guardado atómico de `.agent/SPECS.md`. |
| `/editor` | Explorador de solo lectura de `.agent/`, `rules/`, `changes/` y `DECISIONS/`. |
| `/debug` | Sonda de salud (`/api/health/ready`), errores recientes y reglas heurísticas cargadas. |

**Seguridad (`hostguard`):** `resident-ui` valida la cabecera `Host` contra `localhost`, `127.0.0.1`, `[::1]` y `resident-ui` (responde `403` ante otros hosts para prevenir DNS-rebinding) y añade cabeceras CSP/`X-Frame-Options: DENY`. Si lo despliegas en una intranet, agrega el hostname en `ROS_UI_ALLOWED_HOSTS=mi-host.interno` detrás de un proxy con autenticación.

---

## 5. Compatibilidad por sistema operativo (Linux, macOS y Windows)

Matriz verificada directamente contra el código del repositorio:

| Componente | Linux | macOS | Windows (nativo: PowerShell + Git Bash) | Windows (WSL2) |
| :--- | :---: | :---: | :---: | :---: |
| CLI `ros` (`agent/cli.py`), `review-prepare`, `relocate`, `thresholds`, `fleet` | Nativo | Nativo | Nativo (`python -m agent ...`) | Nativo |
| Servidor MCP local (`ros mcp`) y `mcp-proxy` | Nativo | Nativo | Nativo | Nativo |
| Verificadores (`python verifiers/run.py`) | Nativo | Nativo | Nativo | Nativo |
| Frontend `resident-ui` (local o Docker Compose) | Nativo | Nativo | Nativo (`npm run dev` / Docker Desktop) | Nativo |
| Hooks Node principales (`post-edit`, `compress-output`, `command-filters`, `pre-compact`, `session-end`, `codebase-map`) | Nativo | Nativo | Nativo (usa `path.join`, `os.tmpdir()` y `process.execPath`) | Nativo |
| Hook `statusline.sh` (`.claude/settings.json`) | Nativo | Nativo | Requiere **Git Bash** (Claude Code en Windows lo usa por defecto; fallback `python3`/`python`) | Nativo |
| Hook `run-filtered.js` (filtra comandos fallidos `exit ≠ 0`) | Nativo (`-- bash -c`) | Nativo (`-- bash -c`) | **Nativo** (`--b64 <base64>` + `spawnSync(..., { shell: true })`, sin choques de comillas) | Nativo |
| Pruebas aisladas sin red ni credenciales heredadas | `scripts/sandboxed-tests.sh` (`srt`/`bwrap`) o `scripts/sandboxed_tests.py` (Docker) | `scripts/sandboxed-tests.sh` (`srt`) o `scripts/sandboxed_tests.py` (Docker) | **Nativo con Docker Desktop:** `python scripts/sandboxed_tests.py --image <img-py> --node-image node:26-alpine` (`--network none --read-only`) | Ambos (`.sh` y `.py`) |

**Recomendación en Windows:**
- **Windows nativo** (PowerShell + Git Bash + Docker Desktop) ya soporta **todo el framework**: `ros`, servidor MCP, `mcp-proxy`, verificadores, todos los hooks incluido `run-filtered.js`, `resident-ui` y pruebas aisladas con `scripts/sandboxed_tests.py --network none`.
- **WSL2 (Ubuntu)** sigue siendo ideal si prefieres usar `scripts/sandboxed-tests.sh` con `bubblewrap` sin Docker.

---

## 6. Referencias relacionadas
- [`INSTALAR.md`](../INSTALAR.md) — instrucciones paso a paso que ejecuta el agente al instalar.
- [`RESIDENT_AGENT_OS_QUICKSTART.md`](../RESIDENT_AGENT_OS_QUICKSTART.md) — inicio rápido orientado a desarrollo con `ResidentAgentLoop`.
- [`resident-ui/README.md`](../resident-ui/README.md) — endpoints `/api/*` y variables de entorno del panel.
- [`docs/GUIA_POR_ROL.md`](GUIA_POR_ROL.md) — flujo de trabajo por rol (Dev, LP/PM, QA, Seguridad).
