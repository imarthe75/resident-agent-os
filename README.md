# Resident Agent Framework

Framework de referencia para inicializar un **Agente Residente Soberano** con memoria local multinivel, heurísticas cognitivas y workflows de desarrollo estructurado.

> **Atribución:** Este proyecto integra y adapta las mejores prácticas de [affaan-m/ECC](https://github.com/affaan-m/ECC), [obra/superpowers](https://github.com/obra/superpowers), [Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec) y [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) — todos bajo Licencia MIT. También toma ideas (no código) de [JayPokale/Chisle](https://github.com/JayPokale/Chisle) (MIT) y [JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman) (Apache-2.0): recorte de salidas de herramientas, dieta de contexto y método de depuración/verificación. La implementación es propia.

---

## Qué es

Un **Agente Residente** es un agente de IA que:
- Mantiene estado cognitivo entre sesiones (no empieza desde cero cada vez)
- Persiste memoria a corto plazo en **Valkey** (Redis-compatible) y a largo plazo en **PostgreSQL + pgvector**
- Tiene reglas, heurísticas y límites operacionales definidos en `.agent/`
- Sigue workflows estructurados de desarrollo (TDD, debugging sistemático, verificación antes de declarar "listo")

---

## Estructura del repositorio

```
resident-agent-framework/
├── .agent/                     # Estado cognitivo del agente (por sesión)
│   ├── AGENT.md                # Leyes operacionales del agente
│   ├── CONTEXT.md              # Propósito del proyecto
│   ├── HEURISTICS.md           # Heurísticas cognitivas (Nielsen + Sweller)
│   ├── MAP.md                  # Mapa de puertos y directorios
│   ├── RULES.md                # Reglas de flujo y hooks
│   ├── SPECS.md                # Especificaciones activas (capa OpenSpec)
│   ├── STATE.md                # Bitácora de sesión (Rito de Inicio/Cierre)
│   └── SYSTEM_PROMPT.md        # Prompt cognitivo del sistema v3
│
├── agents/                     # Personas de sub-agentes
│   ├── architect.md
│   ├── code-reviewer.md
│   ├── debugger.md             # Causa raíz + prueba de regresión
│   ├── planner.md
│   └── security-reviewer.md
│
├── changes/                    # Workflow OpenSpec (cambios activos e histórico)
│   ├── README.md               # Cómo usar el workflow
│   ├── TEMPLATE-proposal.md    # Plantilla de proposal
│   ├── TEMPLATE-spec.md        # Plantilla de spec
│   ├── TEMPLATE-tasks.md       # Plantilla de tasks
│   └── archive/                # Cambios completados
│
├── commands/                   # Slash commands del agente
│   ├── plan.md                 # /plan — diseño sin código
│   ├── quality-gate.md         # /quality-gate — gate de calidad
│   ├── opsx-propose.md         # /opsx-propose — iniciar cambio formal
│   ├── opsx-apply.md           # /opsx-apply — ejecutar tareas
│   ├── opsx-archive.md         # /opsx-archive — cerrar cambio
│   ├── opsx-verify.md          # /opsx-verify — validar vs spec
│   ├── ponytail-review.md      # /ponytail-review — auditar diff
│   ├── ponytail-audit.md       # /ponytail-audit — escanear repo
│   ├── ponytail-debt.md        # /ponytail-debt — ledger de deuda
│   ├── team.md                 # /team — orquestar subagentes
│   ├── review.md               # /review — revisión de código (solo lectura)
│   ├── audit.md                # /audit — revisión de seguridad (solo lectura)
│   └── debug.md                # /debug — depuración con prueba de regresión
│
├── contexts/                   # Cargadores de contexto
│   ├── dev.md                  # Contexto de desarrollo
│   ├── orquestacion.md         # Agente principal que reparte en subagentes
│   ├── research.md             # Contexto de investigación
│   └── review.md               # Contexto de revisión
│
├── DECISIONS/                  # ADRs (Architecture Decision Records)
│   ├── 0001-genesis-architecture.md
│   └── 0002-heuristics-mandate.md
│
├── docs/                       # Documentación del framework
│   ├── resident_agent_genesis.md     # Manual maestro de operaciones
│   ├── HEURISTICAS_MASTER_GUIDE.md   # Fundamento de heurísticas
│   ├── guia-de-estilo-sql.md         # Estándares SQL corporativos
│   ├── instalacion-postgresql.md     # Guía PostgreSQL 18
│   └── instalacion-pgpool.md         # Guía PgPool
│
├── hooks/                      # Automatizaciones del harness
│   └── hooks.json
│
├── memory/                     # Módulos de memoria (Python)
│   ├── agent_state.py          # Estado del agente
│   ├── long_term_memory.py     # Persistencia en PostgreSQL + pgvector
│   └── semantic_cache.py       # Caché semántica en Valkey
│
├── resident-ui/                # UI de monitoreo (Next.js)
│
├── rules/                      # Reglas de código por lenguaje
│   ├── common/
│   │   ├── coding-style.md
│   │   ├── database-style.md
│   │   ├── context-diet.md     # Leer menos al contexto
│   │   ├── privacidad-y-herramientas.md  # Asistentes aprobados; nada de terceros sin autorización
│   │   ├── efficiency.md       # Escalera de eficiencia (7 peldaños)
│   │   ├── git-workflow.md
│   │   ├── security.md
│   │   └── testing.md
│   ├── python/rules.md
│   └── typescript/rules.md
│
├── templates/                  # lefthook + gitleaks + commitlint, renovate.json (ADR-0004)
├── scripts/
│   ├── codebase-map.js         # Mapa de lo que ya existe (hook SessionStart)
│   ├── ponytail_audit.py       # Medición de /ponytail-audit (vulture, deptry, knip, jscpd, scc)
│   ├── hooks/compress-output.js # Recorta salidas largas de Bash (hook PostToolUse)
│   └── distribute_framework.py # Distribuye el framework a otros proyectos
│
├── skills/                     # Skills del agente Claude Code
│   ├── blueprint/              # Generación de blueprints
│   ├── database-liquibase-postgresql/
│   ├── postgres-audit/         # Setup de audit triggers
│   ├── systematic-debugging/   # Debugging de 4 fases (Superpowers)
│   ├── test-driven-development/ # TDD RED-GREEN-REFACTOR (Superpowers)
│   ├── using-git-worktrees/    # Desarrollo aislado (Superpowers)
│   ├── verification-before-completion/ # No "listo" sin evidencia (Superpowers)
│   └── writing-plans/          # Planes sin ambigüedad (Superpowers)
│
├── sql/
│   └── auditoria.sql           # Setup de audit trail (schema + triggers)
│
├── docker-compose.yml          # Stack: PostgreSQL 18 + pgvector + Valkey
├── .gitignore
└── README.md
```

---

## Instalación rápida

### Requisitos

- Docker & Docker Compose
- Python 3.12+
- `pip install -r requirements.txt` (redis, psycopg2, numpy, pydantic, pyyaml…)

### 1. Levantar infraestructura soberana

```bash
echo "POSTGRES_PASSWORD=$(openssl rand -hex 24)" >> .env     # obligatoria; .env está en .gitignore
docker compose up -d
# Crea ./data/postgres y ./data/valkey (persistentes, en .gitignore) y aplica sql/agent_memory.sql en el primer arranque
```

### 2. Inicializar el audit trail

```bash
psql -U admin -d db_resident_knowledge -h localhost < sql/auditoria.sql
```

### 3. Leer el estado del agente (Rito de Inicio)

```bash
cat .agent/STATE.md     # pendientes de la última sesión
cat .agent/AGENT.md     # leyes operacionales
cat .agent/HEURISTICS.md
```

### 4. Crear un proyecto nuevo con las versiones vigentes

Las versiones de Angular, Java, Spring Boot, Node, Python, PostgreSQL, Valkey… **no se escriben de memoria**: se resuelven en el momento desde fuentes
oficiales y se fijan en un lock (ver `commands/new-project.md`). Lo mismo para cada dependencia directa del proyecto: la última versión estable que
sea compatible con las demás.

```bash
python scripts/latest_versions.py --write versions.lock.json      # plataformas; política en .agent/versions-policy.json
python scripts/outdated_dependencies.py --path <proyecto> --strict  # cada dependencia de npm, Maven, Gradle y Python; debe terminar en 0
python verifiers/run.py --path <proyecto> --only versions_current,dependencies_current   # avisa si un proyecto se quedó atrás
```

`outdated_dependencies.py` consulta los registros oficiales (npm, Maven Central, portal de plugins de Gradle, PyPI). En npm propone la versión más nueva
que respeta los rangos de *peer dependencies* (p. ej. la TypeScript más nueva que acepta el compilador de Angular) y, si una no se puede subir, dice
qué la bloquea; marca las versiones que el registro declara obsoletas. En Maven, Gradle y Python no hay datos de compatibilidad: la compilación y
las pruebas deciden, y lo que no funcione se registra como excepción.

### 5. Usar la memoria

```python
from memory.semantic_cache import SemanticCache
from memory.long_term_memory import LongTermMemory

cache = SemanticCache(host="localhost", port=6379)
db_mem = LongTermMemory()

# Búsqueda semántica (0 tokens si hay cache hit)
response = cache.get(query_embedding)
if not response:
    response = await llm.generate(query)
    cache.set(query_text, query_embedding, response)

# Persistencia de lecciones
db_mem.store_lesson("Usar uuid7() en PG18+ para PKs", embedding)
lessons = db_mem.search_lessons(query_embedding, limit=3)
```

---

## Workflows

### Workflow de desarrollo (feature nueva)

```
/opsx-propose "descripción"   → proposal.md + spec.md + tasks.md
/plan                          → plan detallado en docs/plans/
/opsx-apply                    → ejecutar tareas (TDD + verificación)
/opsx-verify                   → validar vs spec antes del PR
/opsx-archive --with-lesson    → cerrar y persistir lección en memory.lessons
```

### Workflow con subagentes

```
/team "misión"      → el agente principal reparte en subagentes (contexts/orquestacion.md)
/review             → revisión de código, solo lectura, veredicto APTO / APTO CON OBSERVACIONES / NO APTO
/audit              → revisión de seguridad, solo lectura, mismo veredicto
/debug "fallo"      → causa raíz + cambio mínimo + prueba de regresión
```

### Workflow de debugging

```
1. skill: systematic-debugging  → 4 fases: root cause → pattern → hypothesis → fix
2. skill: test-driven-development → test que reproduce el bug primero
3. skill: verification-before-completion → confirmar fix con evidencia
```

### Workflow de calidad

```
/ponytail-review    → auditar diff actual contra efficiency ladder
/ponytail-audit     → escanear repo completo
/quality-gate       → gate de calidad pre-merge
```

---

## Heurísticas cognitivas

El framework implementa los 10 principios de Nielsen y heurísticas de Sweller en el código generado. Ver [docs/HEURISTICAS_MASTER_GUIDE.md](docs/HEURISTICAS_MASTER_GUIDE.md).

**Limit ECC: máximo 3 intentos de auto-corrección.** Al cuarto: halt y consulta a `memory.lessons`.

---

## Distribución a otros proyectos

```bash
python scripts/distribute_framework.py --target /ruta/al/nuevo-proyecto
```

Copia `.agent/`, `agents/`, `rules/`, `skills/`, `commands/`, `contexts/`, `hooks/`, `verifiers/`, `prompts/` y `templates/` (lista completa en `ITEMS` del script) al proyecto destino.

Instalación guiada por el agente (sin pisar lo existente, con reporte de conflictos, dependencias atrasadas y línea base): `INSTALAR.md`.

**Capas de organización.** El framework es genérico a propósito: cada skill, regla y comando cubre una función completa sin datos de
ninguna organización. Una organización que necesita su propia personalidad (su metodología, su plantilla base, su escáner, su catálogo de
reglas de negocio) arma una capa encima que **especializa** piezas del framework: renombra una skill genérica a la suya, reemplaza un
archivo o agrega una sección al final, y declara para cada pieza propia cuál pieza genérica cubre. Un proyecto de esa organización instala
la capa; cualquier otro, solo el framework. Las mejoras genéricas se hacen aquí primero y la capa las recibe al subir de versión.

**Claude Code y Gemini CLI con las mismas skills.** El formato `SKILL.md` es el mismo en ambos: copia `skills/` a `.claude/skills/` (Claude
Code) y a `.agents/skills/` (Gemini CLI, que también lee `.gemini/skills/`). Copia `agents/*.md` a `.claude/agents/` para usarlos como
subagentes de Claude Code. Para que Gemini CLI lea `AGENTS.md` (por omisión solo lee `GEMINI.md`), copia
`templates/.gemini/settings.json` a la raíz del proyecto. No hace falta ninguna extensión para compartir las skills.

---

## Gobernanza de base de datos

Ver [rules/common/database-style.md](rules/common/database-style.md).

**Regla obligatoria:** Todas las PKs son `UUID` (no `INTEGER`, `SERIAL`, ni `BIGINT`).

El script [sql/auditoria.sql](sql/auditoria.sql) instala:
- Schema `auditoria` con tabla `log_auditoria` (JSONB + SHA256)
- Trigger `auditoria_biu` — fechas y `row_version` (concurrencia optimista)
- Trigger `auditoria_aiud` — delta log con hash de integridad

Skill interactivo: [skills/postgres-audit/SKILL.md](skills/postgres-audit/SKILL.md)

---

## Rito de Cierre

Al terminar cada sesión:

1. Ejecutar `/opsx-verify` en cambios activos
2. Actualizar `.agent/STATE.md` con tareas completadas y próximos pasos
3. Ejecutar `/opsx-archive --with-lesson` para persistir aprendizajes
4. Verificar que `docker compose ps` muestra todos los servicios running

---

## Componentes

| Pieza | Para qué | Dónde |
|---|---|---|
| Caché exacta + semántica opcional | claves sha256 estables, índice acotado con expiración; la caché semántica está apagada por omisión | `memory/semantic_cache.py` |
| Memoria sin vectores inventados + nivel de evidencia | se niega a guardar sin embedding real; `CIERTO/PROBABLE/HIPOTESIS` | `memory/long_term_memory.py`, `sql/agent_memory.sql`, `memory/lesson_check.py` |
| Motor de heurísticas que no traga errores | valida operadores al cargar; las reglas guarda fallan cerradas | `agent/heuristic_engine.py` |
| Contrato de spec real | id exacto + estado propio `APROBADO`; requisitos en EARS y convergencia contra la salida real de las pruebas | `agent/specs.py`, `commands/opsx-*.md`, `changes/TEMPLATE-spec.md` |
| Decisiones tipadas | preguntas cerradas + probabilidad; el código decide con umbrales | `agent/decisions.py`, `.agent/decisions.json` |
| Verificadores de restricciones | `CUMPLE / NO_CUMPLE / NO_EVALUADO`: PK uuid, auditoría, autorización de endpoints y webhooks fail-closed (FastAPI, Spring, NestJS, Express; rutas públicas declaradas en `.agent/public-routes.txt`), errores silenciados (Python, Java, Kotlin, TypeScript, JavaScript), versiones vigentes de plataformas (npm, Maven, Gradle, imágenes) y de cada dependencia directa, stubs, pruebas aisladas, volúmenes en `./data`, trazabilidad requisito ↔ prueba y observabilidad mínima (health check e id de correlación) | `verifiers/` |
| Observabilidad desde el diseño | cada requisito con la señal que lo demuestra en producción; health check, id de correlación y logs estructurados | `rules/common/observability.md`, `changes/TEMPLATE-spec.md` |
| Ritmo con agentes | ciclos cortos por tarea (planear, implementar y revisar en horas), MR pequeños y roles que se solapan | `skills/metodologia-entrega/`, `rules/common/delivery-process.md` |
| Revisión adversaria y convergencia | subagente que parte de que algo falla, vuelve a correr la evidencia citada y busca mutantes sobrevivientes; ciclo implementar → revisión por una instancia nueva → verificar, que se detiene si el bloqueo se repite sin cambios | `agents/adversarial-reviewer.md`, `commands/adversarial.md`, `skills/delegacion-subagentes/` |
| Cierre con evidencia y carril rápido | tareas de cierre que ejecuta el agente con un reporte por paso; cambios de hasta 5 archivos sin BD ni contrato con una spec corta | `changes/TEMPLATE-tasks.md`, `commands/opsx-propose.md` |
| Catálogo de escenarios de QA | matriz de restricciones, diez categorías de casos, capa de prueba y política de dobles | `skills/bdd-spec-driven-development/references/catalogo-escenarios.md` |
| Demostración | la funcionalidad ejecutada contra sus criterios de aceptación, no un resumen | `commands/demo.md` |
| Funciones con IA | CI sin llamadas al modelo, evaluación aparte con golden set y abstención, costo por etapa, umbrales de alerta fijos | `rules/common/ai-features.md`, `rules/common/observability.md` |
| Validación humana y compuertas | la IA no firma; cierra alguien distinto | `agent/human_validation.py`, `agent/gates.py`, `.agent/gates/` |
| Perfil del proyecto | qué reglas aplican (p. ej. accesibilidad solo con interfaz) | `.agent/PROFILE.json`, `agent/profile.py` |
| Preflight con escáner opcional | hallazgos abiertos de los archivos que vas a tocar | `agent/preflight_client.py`, `skills/preflight/` |
| Prevención de hallazgos | catálogo de reglas de un escáner de seguridad con cómo escribir el código para no provocarlas; cada skill que genera código indica qué reglas evita y qué documentación exige (OpenAPI, Javadoc/TSDoc, `COMMENT ON`) | `skills/prevencion-hallazgos-seguridad-calidad/` |
| Reglas Java, Angular y PostgreSQL | cómo escribir el código para no generar el hallazgo | `rules/java/`, `rules/angular/`, `rules/postgres/` |
| Privacidad y herramientas | solo asistentes aprobados; nada de skills, plugins, MCP o scripts de terceros sin autorización; dependencias por Merge Request | `rules/common/privacidad-y-herramientas.md` |
| Subagentes de solo lectura con veredicto único | revisión P0–P4 con APTO / APTO CON OBSERVACIONES / NO APTO; depurador con prueba de regresión; encabezado de subagente de Claude Code | `agents/` |
| Orquestación y delegación | escala de esfuerzo, encargo completo, entrega por archivo, límite de reintentos y verificación | `contexts/orquestacion.md`, `skills/delegacion-subagentes/`, comandos `/team`, `/review`, `/audit`, `/debug` |
| Mutation testing | PIT y Stryker solo sobre lo que cambia el MR, umbral que solo sube | `skills/pruebas-mutacion/`, `templates/ci/mutation-testing.gitlab-ci.yml` |
| Especificación viva y prueba de lectura | máximo 5 preguntas; la spec se corrige antes que el código; un agente sin contexto prueba cada documento | `bdd-spec-driven-development`, `writing-plans`, `documentacion-codigo-y-api` |
| Formato Agent Skills verificado | YAML estricto, `name` igual a la carpeta, descripción ≤ 1024 caracteres; guía para escribir skills | `tests/test_skill_descriptions.py`, `skills/README.md` |
| Gemini CLI | lee `AGENTS.md` como contexto y comparte las skills en `.agents/skills/` | `templates/.gemini/settings.json` |
| Hooks en formato Claude Code | el de sintaxis bloquea (exit 2) | `.claude/settings.json`, `scripts/hooks/` |
| Distribución con detección de deriva | `--check` lista repos desviados | `scripts/distribute_framework.py`, `VERSION` |
| Versiones vigentes al crear un proyecto | plataformas resueltas en el momento desde fuentes oficiales y fijadas en un lock; cada dependencia directa en la última versión estable compatible (rangos de *peer dependencies* en npm), con lo que la bloquea y las obsoletas marcadas; `versions_current` y `dependencies_current` avisan del atraso | `scripts/latest_versions.py`, `scripts/outdated_dependencies.py`, `.agent/versions-policy.json`, `commands/new-project.md` |
| Biblioteca de prompts versionada | dueño, origen y conjunto de evaluación declarados | `prompts/`, `scripts/check_prompts.py` |
| Metodología de entrega | etapas 0–5 más soporte con 21 plantillas Markdown de entregables (verificador y generador `.docx` con la identidad de la organización), roles, compuertas de cierre, adaptación por proyecto, control de cambios y trazabilidad a CMMI V3.0 | `skills/metodologia-entrega/` |
| Desarrollo dirigido por especificación | propuesta, spec EARS con criterios verificables, tareas con requisito de origen, convergencia contra la salida real de las pruebas y carril rápido | `skills/sdd/`, `commands/opsx-*.md`, `changes/` |
| Reglas de negocio | catálogo por módulo con identificador estable y origen (explícita / inferida / propuesta), qué detecta el escáner y qué revisar antes de cerrar | `skills/reglas-negocio/`, `rules/common/business-rules.md` |
| Evidencia para entregables | qué dato medido va en cada entregable, cómo consultarlo sin inflar cifras y qué límites declarar | `skills/evidencia-entregables/` |
| Trabajo con el escáner | qué revisar antes de cambiar código, criterio de aceptación de un MR, cómo leer severidad y plazos, cuándo no se corrige | `rules/common/scanner.md` |
| Instalación guiada | el agente instala el framework en un proyecto sin pisar lo existente, reporta conflictos, versiones atrasadas y línea base; una capa de organización va encima | `INSTALAR.md` |
| Auditoría sin escáner | catálogo de reglas, método de detección, evidencia Cierto/Probable/Hipótesis, matriz con plazos y comparativo entre corridas (Solventado / Persiste / Nuevo / Reaparecido / No re-verificado) | `skills/auditoria-codigo/` |
| Consolidación de auditorías | lee SARIF (Semgrep, CodeQL, Trivy, Checkov…) y el `hallazgos.json` de `auditoria-codigo`; triage por causa raíz con catálogo del analista, libro con plan de trabajo en horas, matriz con SLA en dos tiempos, responsables y firmas, y verificación de cierre entre corridas | `skills/consolidacion-auditorias-seguridad/` |
| Evidencia forense | bitácora de acciones de negocio con cifrado, cadena de hashes y firmas HMAC (Spring Boot) y su pantalla de consulta y verificación (Angular + PrimeNG) | `skills/secure-forensic-audit/`, `skills/secure-forensic-audit-ui/` |
| Theming por tokens | un `tema.json` genera escalas, variables CSS claro/oscuro, Tailwind 4, preset de PrimeNG y reporte de contraste WCAG | `skills/theming-tokens/` |
| Backend FastAPI | autorización por dependencia y propiedad, DTOs, secretos cifrados, migraciones versionadas | `skills/backend-fastapi/` |
| Manuales de usuario | reglas de negocio contrastadas contra el código con evidencia archivo:línea, capturas reproducibles con Playwright y `.docx` determinista con hoja de validación; la identidad de la organización se configura en un archivo | `skills/manuales-usuario/` |
| Guía por rol | instalación y uso para desarrolladores, líderes de proyecto/PM, testers/QA y seguridad | `docs/GUIA_POR_ROL.md` |

El historial por versión está en `CHANGELOG.md`.

Pruebas: `python -m pytest tests -q`. Las 6 pruebas de la caché solo corren si nombras un Valkey **de pruebas** en `ROS_TEST_VALKEY_HOST` (usan la base 15 y borran solo lo suyo); sin esa variable se saltan y lo dicen. Nunca apuntes esa variable a un servicio real. Para correrlas sin red ni variables heredadas: `scripts/sandboxed-tests.sh` (requiere `srt`, bubblewrap y socat; ver ADR-0004 C1). Regresión de skills con un modelo gratuito: `node scripts/eval-skills.js --base origin/main` (ver ADR-0004 C2).
Qué NO está verificado: ver «Estado de implementación» en `DECISIONS/0003-decisiones-tipadas-verificacion-y-gobierno.md`.
