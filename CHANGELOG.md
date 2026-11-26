# Historial de versiones

Bitácora de cambios por versión (el README describe el estado vigente).

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
