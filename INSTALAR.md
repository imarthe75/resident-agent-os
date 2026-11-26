# Instalación guiada por el agente

Para instalar el framework en un repositorio, abre el agente en la raíz del proyecto, con esta carpeta a la mano, y pídele:
«Lee `<ruta del framework>/INSTALAR.md` y síguelo para instalarlo en este proyecto».

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
   `scripts/latest_versions.py`, `scripts/outdated_dependencies.py`, `scripts/patch_validator.py`, `scripts/codebase-map.js` y
   `.agent/versions-policy.json`; y `skills/estandares-desarrollo/templates/AGENTS.md` y `CLAUDE.md` como `AGENTS.md` y `CLAUDE.md`. Si un
   archivo ya existe, **no lo reemplaces**: anótalo como conflicto.
3. **Skills, subagentes y comandos:** copia `skills/` a `.claude/skills/` y a `.agents/skills/` (Claude Code y Gemini CLI), `agents/*.md` a
   `.claude/agents/` y `commands/*.md` a `.claude/commands/`. Mismo criterio: lo existente no se pisa.
4. **Hooks:** si el proyecto no tiene `.claude/settings.json`, copia el del framework. Si ya existe, agrega solo la sección `hooks`, sin
   quitar nada, y muestra el resultado.
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
    atrasadas, salida de los verificadores y lo que falta para fusionar.

Privacidad: no envíes nada del proyecto a servicios externos durante la instalación (`rules/common/privacidad-y-herramientas.md`). Las
consultas de versiones solo envían nombres de paquetes públicos a sus registros oficiales.
