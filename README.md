# Resident Agent Framework

Framework de referencia para inicializar un **Agente Residente Soberano** con memoria local multinivel, heurísticas cognitivas y workflows de desarrollo estructurado.

> **Atribución:** Este proyecto integra y adapta las mejores prácticas de [affaan-m/ECC](https://github.com/affaan-m/ECC), [obra/superpowers](https://github.com/obra/superpowers), [Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec) y [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) — todos bajo Licencia MIT.

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
│   └── ponytail-debt.md        # /ponytail-debt — ledger de deuda
│
├── contexts/                   # Cargadores de contexto
│   ├── dev.md                  # Contexto de desarrollo
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
│   │   ├── efficiency.md       # Ponytail efficiency ladder (6 peldaños)
│   │   ├── git-workflow.md
│   │   ├── security.md
│   │   └── testing.md
│   ├── python/rules.md
│   └── typescript/rules.md
│
├── scripts/
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
oficiales y se fijan en un lock (ver `commands/new-project.md`).

```bash
python scripts/latest_versions.py --write versions.lock.json   # política en .agent/versions-policy.json (latest / lts por herramienta)
python verifiers/run.py --path <proyecto> --only versions_current   # avisa si un proyecto se quedó atrás
```

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

Copia `.agent/`, `rules/`, `skills/`, `commands/`, `contexts/`, `hooks/` al proyecto destino.

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

## Novedades 2.1 (ADR-0003)

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
| Reglas Java y Angular | cómo escribir el código para no generar el hallazgo | `rules/java/`, `rules/angular/` |
| Hooks en formato Claude Code | el de sintaxis bloquea (exit 2) | `.claude/settings.json`, `scripts/hooks/` |
| Distribución con detección de deriva | `--check` lista repos desviados | `scripts/distribute_framework.py`, `VERSION` |
| Versiones vigentes al crear un proyecto | se resuelven en el momento desde fuentes oficiales y se fijan en un lock; `versions_current` avisa del atraso | `scripts/latest_versions.py`, `.agent/versions-policy.json`, `commands/new-project.md` |
| Biblioteca de prompts versionada | dueño, origen y conjunto de evaluación declarados | `prompts/`, `scripts/check_prompts.py` |

Pruebas: `python -m pytest tests -q` (la caché necesita un Valkey: `VALKEY_HOST=...`; sin él esas pruebas se saltan y lo dicen).
Qué NO está verificado: ver «Estado de implementación» en `DECISIONS/0003-decisiones-tipadas-verificacion-y-gobierno.md`.
