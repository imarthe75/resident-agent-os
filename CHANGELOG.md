# Historial de versiones

Bitácora de cambios por versión (el README describe el estado vigente).

## 1.0.5 (2026-11-27)
- **Detección más precisa de imágenes en `verifiers/checks.py` (`versions_current`):** `valkey` ahora compara `(mayor, menor)` (detecta atrasos como `valkey:9.1` frente a `9.2.1`) y `pgvector` reconoce también etiquetas con prefijo de versión de extensión (`0.8.0-pg18`, `0.8.7-pg18-bookworm`), con pruebas unitarias en `tests/test_latest_versions.py`.
- **Guía de instalación en proyectos existentes (`INSTALAR.md`):** mantiene la regla de no romper volúmenes sin aprobación, pero exige destacar al cierre cualquier plataforma o imagen atrasada (`postgres`/`pgvector`, `valkey`, `node`, `java`) y ofrecer explícitamente su migración controlada (con respaldo previo si ya hay datos).

## 1.0.4 (2026-11-27)
- **Infraestructura al día (`docker-compose.yml`, `commands/new-project.md`):** actualización a `pgvector/pgvector:pg19` (PostgreSQL 19.0 + `uuidv7()` nativo + pgvector 0.8.7) y `valkey/valkey:9.2`, verificada contra `sql/agent_memory.sql` (idempotente) y `tests/test_pgvector_integration.py`. Quienes migren un volumen previo `./data/postgres` de PostgreSQL 18 requieren respaldo y restauración (`pg_dump`/`pg_restore`).
- **Compatibilidad transitiva por política en `scripts/outdated_dependencies.py`:** al analizar `package.json`, consulta los pares `channel: compatible` de `.agent/versions-policy.json` (p. ej. `typescript` con `typescript-eslint`) cuando el paquete restrictivo aparece en el `package-lock.json` hermano (como dependencia transitiva de `eslint-config-next`), evitando falsos positivos en `verifiers/run.py --only dependencies_current` hasta que el ecosistema amplíe su soporte.

## 1.0.3 (2026-11-27)
- **Ruteo de modelos agnóstico a proveedor** (`.agent/model-routing.json`, `agent/model_routing.py`, `ros route`, herramienta MCP `ros_resolve_model`): niveles semánticos `fast`, `balanced` y `reasoning` con mapeo configurable por proveedor (`claude`, `antigravity`, `gemini`, `codex`, `cursor`, `copilot`, `opencode`, `ollama`, `generic`), promoción automática por tipo de tarea sin degradar revisores de seguridad/adversarios, y overrides por entorno (`ROS_MODEL_<TIER>`, `ROS_MODEL_<PROVIDER>_<TIER>`).
- **Subagente `agents/general-purpose.md` y mejoras en `delegacion-subagentes`:** 7.º subagente canónico en nivel `fast` por defecto con regla de auto-escalado honesto; la skill añade el campo `Modelo / Nivel` en el encargo, reduce el límite paralelo a `2–3` y compacta el ciclo de convergencia §5b.
- **Sincronización SSOT multi-host sin copias manuales** (`scripts/sync_agent_dirs.py`, `ros sync-hosts`, integrado en `ros init-host` y `ros doctor`): mantiene `.agents/skills/`, `agents/*.md` y `commands/*.md` como fuente única y proyecta `.claude/{agents,commands,skills}/` inyectando automáticamente `model:` por subagente desde `.agent/model-routing.json`, con `--mode copy|symlink` (Windows/Docker nativo por defecto) y `--check` para detectar deriva.

## 1.0.2 (2026-11-27)
Lo que faltaba de las ideas de open-code-review (Apache-2.0) y Chisle (MIT); el código es propio.
- **Revisión de archivos completos** (`ros review-prepare --scan [--scan-path <dir>]`, herramienta MCP `ros_review_prepare` con `scan`):
  revisa archivos enteros sin diff ni historial, con las mismas exclusiones (secretos, binarios, generados, más de 512 KB) y rutas
  limitadas al repositorio.
- **Sesiones de revisión reanudables** (`--session`, `ros review-session list|resume|mark`, herramienta MCP `ros_review_session`): cada
  lote guarda estado y huella del contenido; al reanudar quedan los pendientes y fallidos, y un lote terminado cuyos archivos cambiaron se
  reabre. Escritura atómica en `.agent/reviews/`.
- **Proxy MCP para servidores de terceros** (`ros mcp-proxy -- <servidor>`): acota el texto de los resultados de `tools/call` con el
  mismo mecanismo del servidor propio (original completo en archivo `0600`); no toca herramientas de lectura o edición de archivos, las
  respuestas con error ni ningún otro mensaje.
- **Salida de comandos que fallan** (`scripts/hooks/run-filtered.js`, PreToolUse): pruebas, compilaciones e instalaciones corren a través
  de un filtro que conserva errores y resúmenes y devuelve el mismo código de salida. Solo con `ROS_FILTER_FAILED=1` o en
  `bypassPermissions`; nunca si una regla `deny`/`ask` nombra al programa, ni en comandos con tuberías, redirecciones o sustituciones.
  Incluye soporte nativo para Windows (`win32` vía `--b64`) y fallback `bash` → `sh` para Alpine/entornos sin Bash.
- **Pruebas aisladas multiplataforma y manual unificado** (`scripts/sandboxed_tests.py`, `docs/MANUAL_INSTALACION_Y_USO.md`,
  `scripts/hooks/statusline.sh`): ejecutor aislado mediante Docker (`--network none --read-only`, compatible con Windows nativo, macOS y
  Linux), fallback `python3`/`python` en `statusline.sh` y manual único de instalación, prompts por asistente, arranque de `resident-ui` y
  compatibilidad por sistema operativo.

## 1.0.1 (2026-11-27)
La serie 1.x sucede a la 2.x: 1.0.0 es la línea base del framework y es **más nueva** que 2.20.0 (las herramientas del kit fijan la etiqueta
exacta; ninguna compara números de versión).
- Versión en una sola fuente (`agent/version.py`, con prueba de que coincide con `VERSION` y `pyproject.toml`); el servidor MCP, la
  telemetría y la barra de estado ya no llevan la versión escrita a mano.
- Barra de estado registrada en `.claude/settings.json` (`statusLine`); `INSTALAR.md` la incluye al combinar la configuración.
- `resident-ui`: el borrador de `SpecPanel` se reinicia durante el render y no en un efecto (el lint fallaba); la imagen instala con `npm ci`.

## 1.0.0 (2026-11-26) — Baseline Agentic OS / MCP / Framework
Primera línea base consolidada `1.0.0` (parte de la serie previa `2.x` incorporando Agentic OS, servidor MCP agnóstico de proveedor, arquitectura Hub-and-Spoke, telemetría real e ideas de Chisle v3.13 y Alibaba Open Code Review):
- **Plantilla CI de MR en GitLab** (`templates/ci/mr-review.gitlab-ci.yml`): `resource_group` por MR, `interruptible: true`, `ros review-prepare` y verificadores deterministas.
- **Telemetría estructurada, exportador OTLP opcional y umbrales del propio agente** (`agent/telemetry.py`, `.agent/thresholds.json`, `scripts/check_thresholds.py`):
  `ResidentAgentLoop` emite logs JSON con `correlation_id` y redacción de secretos, escribe eventos con latencia/costo/resultado en `.agent/telemetry/events.jsonl` y exporta opcionalmente por OTLP/HTTP JSON cuando se configura `ROS_OTLP_ENDPOINT`. `check_thresholds.py` evalúa las 4 señales de producción y sale con código `1` al superar umbrales.
- **Hooks unificados, statusline, benchmark y persistencia honesta** (`scripts/hooks/telemetry-lib.js`, `post-edit.js`, `compress-output.js`, `command-filters.js`, `pre-compact.js`, `session-end.js`, `statusline.sh`, `scripts/benchmark_filters.py`, `sql/agent_memory.sql`):
  todos los hooks escriben al mismo JSONL (incluyendo tokens ahorrados y errores de sintaxis en `STATE.md`), `session-end.js` guarda resúmenes parametrizados en `memory.session_summaries` sin contaminar `memory.lessons`, `statusline.sh` muestra ahorro/estado en terminal y `benchmark_filters.py` verifica 0% pérdida de errores en los filtros.
- **`resident-ui/` conectado a datos reales y endurecido**: endpoints `/api/health`, `/api/health/ready` (`503`), `/api/state`, `/api/memory` (sonda RESP real a Valkey y `psql` a PostgreSQL), `/api/specs` (`GET`/`PUT`), `/api/files`, `/api/fleet`, `/api/events` (SSE) y `src/proxy.ts` con `X-Request-Id`, protección anti-DNS-rebinding (`Host` allowlist + `ROS_UI_ALLOWED_HOSTS`) y cabeceras CSP/seguridad; cero datos simulados en `agentStore.ts`.
- **Verificadores y pruebas de integración** (`verifiers/checks.py`, `tests/test_pgvector_integration.py`, `tests/hooks/hooks-lifecycle.test.js`):
  `observability_min` soporta backends Next.js App Router, nuevo verificador `observability_production`, prueba de integración real contra PostgreSQL + pgvector (`ROS_TEST_PG_DSN`), y actualización de `RESIDENT_AGENT_OS_QUICKSTART.md` y `resident-ui/README.md`.
- **Monitor de flota multi-repositorio** (`scripts/fleet_status.py` + vista `/fleet` en `resident-ui`):
  agrega deriva (`distribute_framework`), verificadores, dependencias y telemetría/ahorro de hooks en un solo reporte JSON/CLI.
- **CLI unificado `ros` y soporte multi-proveedor** (`agent/cli.py`, `agent/__main__.py`, `pyproject.toml`, `templates/mcp/mcp.json.example`):
  `ros doctor | init-host | verify | thresholds | fleet | review-prepare | relocate | memory | mcp`. Funciona con Claude Code, Gemini CLI, Antigravity, Codex, Cursor, Windsurf, Cline, Copilot CLI, OpenCode y cualquier cliente MCP.
- **Servidor MCP local agnóstico** (`agent/mcp_server.py`): JSON-RPC 2.0 sobre stdio (7 herramientas) con acotado de salidas largas y *spill* privado `0600`.
- **Arquitectura Hub-and-Spoke (`project_id`)**: aislamiento por proyecto en `sql/agent_memory.sql`, `LongTermMemory`, telemetría, hooks y `resident-ui` (`/api/memory?project=`, migrado a `src/proxy.ts`).
- **Revisión determinista + filtros conscientes del comando** (`agent/review_prepare.py`, `.agent/path-rules.json`, `scripts/hooks/command-filters.js`, `agents/code-reviewer.md`):
  selección exacta de diffs sin secretos/binarios, *smart bundling*, reglas por ruta, reubicación de líneas (`relocate_finding`), presupuestos duros de tokens y racha de fallos en `ResidentAgentLoop`, listas «Qué NO reportar», y filtros de salida para `git`, `pytest`, `node --test`, `jest`/`vitest`, `mvn`/`gradle`, `npm`/`pip`/`docker` y `grep`/`rg`.

## 2.20.0
Ideas tomadas del repositorio público `jev-demo` de LIDR; el texto es propio.
- **El modelo responde, el código decide** (`rules/common/ai-features.md`): preguntas cerradas con probabilidad, umbrales versionados y
  probados que deciden entre aplicar, aplicar y marcar o escalar; lo ambiguo se escala con etiqueta; el texto de usuarios y repositorios
  es dato, no instrucción.
- **Ruteo por costo**: reglas sin modelo para lo trivial, modelo pequeño para lo intermedio, el grande para lo complejo, lo que toca dinero
  o permisos y lo dudoso; el caro trabaja solo sobre lo que marcó el filtro; el ahorro se demuestra contra «todo al modelo grande».
- **`preflight` sin escáner**: revisión de las funciones que la tarea va a tocar (varias responsabilidades, errores ocultos, mutación de la
  entrada, números mágicos, lógica duplicada) con recomendación de orden.
- **Skills que escriben fuera del repositorio** (`skills/README.md`): `disable-model-invocation: true` y `allowed-tools` limitado; la skill
  ejecuta y resume, no decide ni inventa cifras.

## 2.19.0
- **Versiones más recientes en cada dependencia** (`scripts/outdated_dependencies.py`, verificador `dependencies_current`): compara cada
  dependencia directa de npm, Maven, Gradle (coordenadas, plugins, catálogo `libs.versions.toml` y wrapper) y Python con la última versión
  estable de su registro oficial. En npm propone la más nueva que instala junto con las demás (rangos de *peer dependencies*, con las
  plataformas primero y lo demás adaptándose), dice qué bloquea a la que no se puede subir y marca las versiones obsoletas. `/new-project`
  exige `--strict` en 0, compilar y probar con esas versiones; `INSTALAR.md` reporta lo atrasado de un proyecto existente. Probado contra
  dos frontends Angular y un backend Spring Boot reales (29, 27 y 15 dependencias atrasadas; eslint 9 obsoleto y bloqueado por
  `eslint-plugin-import`).
- **Equivalentes genéricos que faltaban:** skills `sdd` (desarrollo dirigido por especificación con el flujo `/opsx-*`), `reglas-negocio`
  (catálogo por módulo con origen y plantilla) y `evidencia-entregables` (dato medido por entregable y límites); regla
  `rules/common/scanner.md` (trabajo con el escáner); `theming-tokens/references/arquitectura-temas.md` (varios presets, configurador,
  tokens semánticos, personalización avanzada); `INSTALAR.md` (instalación guiada) y `docs/PRACTICAS.md` (prácticas en lenguaje llano).

## 2.18.0
- **Consolidación de auditorías de seguridad** (`skills/consolidacion-auditorias-seguridad/`): de varias fuentes (auditoría manual, análisis de
  segundo nivel, escáneres) a un informe con dictamen, un libro de triage por causa raíz (vulnerabilidad / falso positivo / calidad) con plan de
  trabajo en horas y una matriz de seguimiento con SLA en dos tiempos, responsables y firmas. Entrada normalizada
  (`references/formato-hallazgos.md`) con dos lectores: `parse_sarif.py` (cualquier SARIF 2.1.0; severidad CVSS, CWE y paquete/versiones de
  dependencias) y `parse_hallazgos.py` (el `hallazgos.json` de `auditoria-codigo`). `comparar_corridas.py` verifica el cierre entre dos corridas.
  Probado con SARIF real de Semgrep y Trivy.
- **Evidencia forense** (`skills/secure-forensic-audit/`, `skills/secure-forensic-audit-ui/`): bitácora de acciones de negocio con cifrado,
  cadena de hashes y firmas HMAC en Spring Boot, y su pantalla de consulta y verificación en Angular + PrimeNG; complementa (no sustituye) la
  auditoría de cambios de datos de `postgres-audit`.

## 2.17.0
Ideas tomadas de los repositorios públicos `lidr-specboot` y `ai-engineering` de LIDR (licencia MIT); el texto y las reglas son propios.
- **Revisión adversaria** (`agents/adversarial-reviewer.md`, `/adversarial`): especificación primero, diff completo, cómo falla cada criterio,
  volver a correr la evidencia citada, mutantes sobrevivientes (con herramienta o a mano) y discrepancias spec↔código como hallazgos.
- **Ciclo de convergencia** (`delegacion-subagentes` §5b, `/team`, `contexts/orquestacion.md`): revisión por una instancia nueva en cada
  vuelta y detención cuando el mismo bloqueo se repite sin cambios; trabajo en paralelo en worktrees.
- **Cierre obligatorio con reporte por paso** (`changes/TEMPLATE-tasks.md`) y **carril rápido** con compuerta de tamaño (`/opsx-propose`).
- **Catálogo de escenarios de QA** (`bdd-spec-driven-development/references/catalogo-escenarios.md`) y comando **`/demo`**.
- **Excusas que no cierran una tarea** (`verification-before-completion`).
- **Observabilidad**: vida y preparación separadas, 503 para dependencias caídas, cuatro señales por petición, umbrales de alerta fijos y
  fallos de producción convertidos en pruebas. Regla nueva **`ai-features.md`** para funciones construidas con modelos de IA.

## 2.16.0
- **Observabilidad desde el diseño** (`rules/common/observability.md`): la spec dice qué señal demuestra cada requisito en producción
  (sección nueva en `changes/TEMPLATE-spec.md` y en `/opsx-verify`); todo backend con health check e id de correlación (verificador
  `observability_min`, para Spring Boot, FastAPI y Express/NestJS/Fastify); logs estructurados sin datos sensibles. Medido en 97 backends
  reales: cumplen 7.
- **Trazabilidad requisito ↔ prueba** (verificador `spec_traceability`): cada requisito funcional de una spec aprobada lo cita al menos una
  prueba (nombre, comentario o etiqueta `@RF-01`).
- **Ritmo con agentes** (`metodologia-entrega`, `delivery-process.md`, `docs/GUIA_POR_ROL.md`): ciclos cortos por tarea, MR pequeños, tablero
  continuo y roles que se solapan (QA y desarrollo desde los requerimientos).

## 2.15.0
- **Verificadores para Spring, NestJS, Express, Angular y React** (`verifiers/stacks.py`): `endpoints_auth` lee Spring (Java y Kotlin: anotaciones del método o de la clase y, si no hay, la primera regla por URL de la configuración de seguridad, como la evalúa Spring), NestJS (guards del método, de la clase o globales) y Express (middleware de la ruta o `use` previo); `webhooks_fail_closed` exige comparación en tiempo constante y rechazo 401/403/503 en Spring, NestJS y Express; `no_silent_except` revisa `catch` de Java, Kotlin, TypeScript y JavaScript, `.catch(() => {})` y `error: () => {}` de una suscripción.
- **`.agent/public-routes.txt`**: lista revisable de las rutas públicas a propósito, cada una con su motivo; una ruta con `permitAll`/`@PermitAll`/`@Public()` que no esté ahí no cumple.
- Medido sobre 202 repositorios reales: un `catch` que asigna un valor por omisión, toma otro camino o explica con un comentario por qué no hace nada es una decisión visible y no se reporta; el código de terceros copiado al repositorio y las cachés generadas no se revisan.

## 2.14.0
- **Subagentes y contextos** reescritos sin directivas propias del entorno del framework (Valkey, persistencia en `./data`): revisión por lista con archivo:línea, verificadores y escáner antes de aprobar; arquitecto que entrega un ADR; planificador con trazabilidad al requisito.
- **`preflight`** consulta el escáner con `curl` (el cliente `agent.preflight_client` solo existe dentro del repositorio del framework).
- **`rules/python`**: conexiones con pool y descarte de conexiones muertas, excepciones con traza, parches validados y SQL parametrizado.
- `blueprint`, `clean-code-contract` y las descripciones de `systematic-debugging`, `test-driven-development`, `using-git-worktrees` y `verification-before-completion` dicen cuándo usarlas; `generacion-estilos` cita las reglas de accesibilidad renderizada.
- **Hook `post-edit.js`**: sin intérprete de Python ya no bloquea la edición de un `.py` (antes lo reportaba como error de sintaxis) y valida con `compile()` en lugar de `py_compile`, que dejaba un `__pycache__` junto al archivo editado.
- **`versions_current`** lee también `build.gradle` y `build.gradle.kts` (plugin de Spring Boot y toolchain o compatibilidad de Java); antes un backend Gradle quedaba sin evaluar.
- `primeng21-expert` remite a `rules/angular/rules.md`; `tests/test_skill_references.py` comprueba que las rutas dentro de una skill y las skills citadas existan.

## 2.13.0
- **Plantillas de la metodología** (`skills/metodologia-entrega/plantillas/`): 21 entregables en Markdown con la convención de quién llena cada sección, pendientes y firmas; `verificar_entregable.py` y `render_docx.mjs` (generador `.docx` con identidad configurable y las mismas compuertas).

## 2.12.0
- **`metodologia-entrega`**: metodología genérica de entrega por etapas con compuertas de cierre (`references/compuertas.md`) y roles y papel del agente por etapa (`references/etapas.md`).

## 2.11.0
- **`auditoria-codigo`**: auditoría sin escáner con las reglas del catálogo, `scripts/auditoria.py` (validar, resumen con matriz y plazos, comparativo con alcance declarado). Incluye la metodología y el estándar maestro que estaban en `docs/` sin cargarse como skill.
- **`theming-tokens`**: tema desde un JSON con generador sin dependencias y reporte de contraste WCAG.
- **`backend-fastapi`**: guía de rutas y servicios FastAPI.

## 2.10.0
- **`backend-proyecto-gradle`**: configuración inicial de un backend Spring Boot nuevo (build, paquetes, 12-factor, tareas asíncronas, contenedor), versión genérica de la skill del kit.
- **Reportes del CI** en `backend-pruebas-unitarias` (JUnit/JaCoCo publicados; 401/403/409 en el nombre de la prueba) y **etiquetas de trazabilidad** en `bdd-spec-driven-development`.

## 2.9.1
- **Skill `manuales-usuario` sin referencias de ninguna organización** (códigos de artefactos y rutas del ejemplo neutralizados).
- **Guía técnica de implementación de un componente** (`skills/manuales-usuario/references/guia-tecnica-componente.md`): estructura y reglas para la documentación técnica dirigida a desarrolladores, con la misma evidencia `archivo:línea`.

## 2.9
- **Manuales de usuario** (`skills/manuales-usuario`): reglas contrastadas contra el código, capturas reproducibles y `.docx` determinista con hoja de validación; identidad configurable en `references/marca.json`.
- README y guía por rol como versión vigente; historial movido a este archivo.

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
