# Instalación guiada por el agente

Para instalar el framework en un repositorio, abre el agente en la raíz del proyecto, con esta carpeta a la mano, y pídele:
«Lee `<ruta del framework>/INSTALAR.md` y síguelo para instalarlo en este proyecto».

> Para el manual completo orientado a personas (prompts listos para Claude/Gemini/Antigravity/Codex/Cursor, conexión MCP, arranque del frontend `resident-ui` y compatibilidad Linux/macOS/Windows), consulta [`docs/MANUAL_INSTALACION_Y_USO.md`](docs/MANUAL_INSTALACION_Y_USO.md).

- **Proyecto nuevo:** usa `/new-project` (`commands/new-project.md`). Las plataformas y cada dependencia salen en su última versión estable
  compatible, resueltas ese día: `scripts/latest_versions.py` y `scripts/outdated_dependencies.py --strict`, que debe terminar en 0.
- **Proyecto existente:** sigue los pasos de abajo.
- **Capa de una organización:** si tu organización mantiene una capa propia sobre este framework (sus reglas, su metodología, sus skills con
  otro nombre), instálala **después** con su propia guía. Sus archivos reemplazan a los genéricos que sustituyen, y su manifiesto dice qué
  skills genéricas se retiran.

## Instrucciones para el agente
Sigue estos pasos en orden. **No hagas commit, push ni instales dependencias**: al final, una persona revisa y fusiona por Merge Request.

1. **Rama:** confirma que estás en una rama de trabajo, no en la principal; si no, pide a la persona que la cree, o créala con el nombre
   `chore/agent-os` si te lo autoriza.
2. **Copiar sin sobrescribir:** copia a la raíz del proyecto `rules/`, `agents/`, `contexts/`, `verifiers/`, `templates/`, `scripts/hooks/`,
   `scripts/latest_versions.py`, `scripts/outdated_dependencies.py`, `scripts/patch_validator.py`, `scripts/codebase-map.js`,
   `scripts/sync_agent_dirs.py` y `.agent/versions-policy.json`; y `skills/estandares-desarrollo/templates/AGENTS.md` y `CLAUDE.md` como
   `AGENTS.md` y `CLAUDE.md`. Si un archivo ya existe, **no lo reemplaces**: anótalo como conflicto.
3. **Skills, subagentes, comandos y hosts de IA (SSOT + proyección automática, agnóstico de proveedor):** copia `skills/` **una sola vez** a
   `.agents/skills/` (fuente única estándar leída nativamente por Antigravity, Gemini CLI, Codex, Cursor y OpenCode). No copies ni edites a
   mano `.claude/skills/`, `.claude/agents/` ni `.claude/commands/`: sincronízalos desde las fuentes canónicas con
   `python3 scripts/sync_agent_dirs.py --target .` (o `ros sync-hosts --target .`, que además inyecta `model:` en `.claude/agents/*.md`
   según `.agent/model-routing.json` y detecta deriva con `--check`). Para conectar el servidor MCP local y generar la configuración del
   asistente que use el equipo (Claude, Gemini, Antigravity, Codex, Cursor, Copilot, OpenCode o genérico), corre
   `python3 -m agent init-host --host <host|all> --target . --dry-run` y aplica tras aprobación. Si el equipo usa servidores MCP de terceros
   con salidas largas, envuélvelos con `python3 -m agent mcp-proxy -- <comando del servidor>` en la configuración del asistente: acota el
   texto de sus resultados sin tocar las herramientas que leen o editan archivos.
4. **Hooks, ruteo de modelos y reglas por ruta:** si el proyecto no tiene `.claude/settings.json`, copia el del framework. Si ya existe, agrega solo las secciones `hooks` y `statusLine` (barra de estado con fase, ahorro y errores de `scripts/hooks/statusline.sh`), sin quitar nada, y muestra el resultado. El hook `run-filtered.js` (PreToolUse) no hace nada hasta que se activa con
   `ROS_FILTER_FAILED=1` o el agente corre en modo `bypassPermissions`; activado en modo normal, agrega una regla `allow` para
   `Bash(node *run-filtered.js*)` si no quieres que cada prueba pida permiso. Copia `.agent/thresholds.json`, `.agent/path-rules.json` y
   `.agent/model-routing.json` solo si el proyecto aún no los tiene.
5. **Conflictos:** para cada archivo que ya existía, muestra las diferencias y propone cómo combinarlos: se conserva lo propio del proyecto
   y se agregan las reglas del framework; si dos reglas se contradicen, gana la más estricta. No combines sin que la persona lo apruebe.
6. **Sección «Proyecto» de `AGENTS.md`:** llénala leyendo el repositorio (manifiestos `pom.xml`/`build.gradle`/`package.json`/
   `pyproject.toml`, Dockerfile, `docker-compose`, README): qué es, stack con versiones, cómo se levanta y se prueba, servicios externos
   **sin credenciales**. Lo que no puedas deducir déjalo como pregunta; no lo inventes.
7. **Versiones:** corre `python scripts/outdated_dependencies.py --path .` y entrega la salida tal cual. Lo atrasado o marcado obsoleto se
   convierte en tareas (una por salto de versión mayor; no se mezclan con cambios funcionales), no se actualiza ahora.
8. **Línea base:** corre `python verifiers/run.py` y entrega la salida tal cual: es el punto de partida del proyecto, no un examen. Los
   `NO_CUMPLE` se convierten en tareas.
9. **Rutas públicas:** si el proyecto tiene rutas públicas a propósito (inicio de sesión, registro), propón el contenido de
   `.agent/public-routes.txt` con el motivo de cada una para que la persona lo confirme.
10. **Reporte final:** lo copiado, conflictos y cómo se propone resolverlos, preguntas abiertas de la sección «Proyecto», dependencias
    atrasadas, salida de los verificadores y lo que falta para fusionar. Si `versions_current` reporta plataformas o imágenes atrasadas
    (p. ej. `postgres`/`pgvector`, `valkey`, `node`, `java`), **destácalas al cierre y ofrece explícitamente aplicar la actualización**
    (con respaldo previo `pg_dump` si ya existe un volumen de datos) en cuanto la persona lo confirme.

Privacidad: no envíes nada del proyecto a servicios externos durante la instalación (`rules/common/privacidad-y-herramientas.md`). Las
consultas de versiones solo envían nombres de paquetes públicos a sus registros oficiales.
