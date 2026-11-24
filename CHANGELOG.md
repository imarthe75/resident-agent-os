# Historial de versiones

Bitácora de cambios por versión (el README describe el estado vigente).

## 2.8
- **Mutation testing** (`skills/pruebas-mutacion`, `templates/ci/mutation-testing.gitlab-ci.yml`): PIT y Stryker solo sobre lo que cambia el MR,
  umbral que solo sube.
- **Delegación a subagentes** (`skills/delegacion-subagentes`): encargo completo, entrega por archivo, límite de reintentos y verificación.
- **Revisores de solo lectura con veredicto único** (`agents/`): APTO / APTO CON OBSERVACIONES / NO APTO con severidad P0–P4; los cuatro
  agentes tienen encabezado para usarse como subagentes de Claude Code.
- **Especificación viva** y preguntas acotadas (máximo 5) en `bdd-spec-driven-development`, `writing-plans` y `agents/planner.md`.
- **Prueba de lectura** de documentos con un agente sin contexto (`documentacion-codigo-y-api`).
- **Formato Agent Skills verificado** (`tests/test_skill_descriptions.py`): YAML estricto, `name` igual a la carpeta; se corrigieron 8 skills
  cuyo encabezado era YAML inválido. Guía para escribir skills en `skills/README.md`.
- **Gemini CLI**: `templates/.gemini/settings.json` para que lea `AGENTS.md`; las skills se comparten en `.agents/skills/`.
- **Orquestación**: `contexts/orquestacion.md` y comandos `/team`, `/review`, `/audit`, `/debug`; subagente `debugger`; escala de
  esfuerzo y requisito de origen en `delegacion-subagentes`.
- **Privacidad y herramientas** (`rules/common/privacidad-y-herramientas.md`): solo asistentes aprobados, nada de skills, plugins, MCP
  o scripts de terceros sin autorización, dependencias solo por Merge Request.
- **Specs en EARS** y convergencia contra la salida real de las pruebas en `/opsx-propose` y `/opsx-verify`.

## 2.3

- **Guía por rol** (`docs/GUIA_POR_ROL.md`): instalación y uso del framework para desarrolladores, líderes de proyecto/PM, testers/QA y seguridad.
- **Skill `prevencion-hallazgos-seguridad-calidad`**: prácticas obligatorias, lista de chequeo de entrega y catálogo de reglas de un escáner de
  seguridad (identificadores estables) con cómo escribir el código para no provocarlas y la skill de detalle. No requiere tener el escáner.
- Las skills que generan código o configuración indican qué reglas evitan; las que generan endpoints, servicios o migraciones exigen
  documentación en el mismo cambio (OpenAPI con `@Operation`/`@ApiResponses`, Javadoc/TSDoc, `COMMENT ON`).

## 2.1 (ADR-0003)

| Pieza | Para qué | Dónde |
|---|---|---|
| Caché exacta + semántica opt-in | claves sha256 estables, índice acotado con expiración; lo semántico ya no se usa por omisión | `memory/semantic_cache.py` |
| Memoria sin vectores inventados + nivel de evidencia | se niega a guardar sin embedding real; `CIERTO/PROBABLE/HIPOTESIS` | `memory/long_term_memory.py`, `sql/agent_memory.sql`, `memory/lesson_check.py` |
| Motor de heurísticas que no traga errores | valida operadores al cargar; las reglas guarda fallan cerradas | `agent/heuristic_engine.py` |
| Contrato de spec real | id exacto + estado propio `APROBADO` | `agent/specs.py` |
| Decisiones tipadas | preguntas cerradas + probabilidad; el código decide con umbrales | `agent/decisions.py`, `.agent/decisions.json` |
| Verificadores de restricciones | `CUMPLE / NO_CUMPLE / NO_EVALUADO` | `verifiers/` |
| Validación humana y compuertas | la IA no firma; cierra alguien distinto | `agent/human_validation.py`, `agent/gates.py`, `.agent/gates/` |
| Perfil del proyecto | qué reglas aplican (p. ej. accesibilidad solo con interfaz) | `.agent/PROFILE.json`, `agent/profile.py` |
| Preflight con escáner opcional | hallazgos abiertos de los archivos que vas a tocar | `agent/preflight_client.py`, `skills/preflight/` |
| Reglas Java, Angular y PostgreSQL | cómo escribir el código para no generar el hallazgo | `rules/java/`, `rules/angular/`, `rules/postgres/` |
| Hooks en formato Claude Code | el de sintaxis bloquea (exit 2) | `.claude/settings.json`, `scripts/hooks/` |
| Distribución con detección de deriva | `--check` lista repos desviados | `scripts/distribute_framework.py`, `VERSION` |
| Versiones vigentes al crear un proyecto | se resuelven en el momento desde fuentes oficiales y se fijan en un lock; `versions_current` avisa del atraso | `scripts/latest_versions.py`, `.agent/versions-policy.json`, `commands/new-project.md` |
| Biblioteca de prompts versionada | dueño, origen y conjunto de evaluación declarados | `prompts/`, `scripts/check_prompts.py` |
