# ADR-0003 — Defectos de memoria y heurísticas, capa de decisiones tipadas, verificadores reales y gobierno de la validación humana

**Estado:** IMPLEMENTADO con límites declarados (2026-10-13). El estado real de cada punto está en «Estado de implementación», al final.
**Origen:** lectura completa de este framework contra (a) `LIDR-academy/jev-demo` y proyectos afines, (b) lecciones de operar un detector de vulnerabilidades en producción y (c) una metodología de proceso organizacional de referencia (ideas, no su contenido).

## Contexto — defectos verificados leyendo el código
| # | Dónde | Defecto |
|---|---|---|
| 1 | `memory/semantic_cache.py` | La clave usa `hash(query_text)`: en Python cambia en cada proceso, así que tras un reinicio las entradas se duplican. |
| 2 | `memory/semantic_cache.py` | `get()` recorre **todas** las claves y decodifica un JSON por entrada; y devuelve la respuesta de una pregunta «parecida» (coseno ≥ 0.90) sin que exista un camino de coincidencia exacta. |
| 3 | `agent/loop.py::store_memory` | Si no hay embedding, guarda un vector de ceros (`[0.0]*1536`): contamina la búsqueda con un dato inventado. |
| 4 | `agent/heuristic_engine.py` | `evaluate()` captura cualquier error de una regla y solo lo registra: la regla se salta en silencio (incluida `ECC_001`, el freno de 3 reintentos). |
| 5 | `agent/loop.py::ensure_spec` | Busca el id como subcadena y, si falta «APROBADO», solo avisa: «no hay código sin spec» no es un control. |
| 6 | `hooks/hooks.json` | Formato propio (`condition`, `command`), distinto del esquema de hooks de Claude Code (`matcher` + `hooks[].type`); probablemente no se ejecuta. `post-edit` falla con exit 1 (Claude Code bloquea con 2). |
| 7 | `scripts/audit_starters.py` (ELIMINADO después, ver «Limpieza del repositorio») | «Hay confirmación» = la palabra *confirm* aparece **en cualquier parte** del archivo: la sobreestimación por presencia que condena su propio `docs/SKILL.md` §0. |
| 8 | `scripts/distribute_framework.py` | Rutas fijas de un servidor concreto, copia sin versión y sin modo de comprobación de deriva. Sin versión ni comprobación de deriva, cada proyecto termina bifurcando el framework y se pierde la base común. |
| 9 | repo | No existe carpeta `tests/`, aunque `ARCHITECTURE.md` describe una estrategia de pruebas. |
| 10 | `docs/starters/AuraAudit` (ELIMINADO después, ver «Limpieza del repositorio») | Copia divergente del bucle del agente (544 líneas) con su propio escáner, duplicando lo que hace un escáner de vulnerabilidades dedicado. |

## Alcance (instrucción del dueño, 2026-10-13)
Este framework es **genérico**: sirve a los proyectos de Setag y puede usarse también en otras organizaciones (sin acoplarse a ninguna), pero **no se generaliza hacia ninguna** en particular. Solo se toman ideas de fuera (jev-demo y afines, una metodología organizacional de referencia, un detector de vulnerabilidades en producción) y se implementan aquí de forma neutral:
- Nada se acopla a un cliente, dominio, ruta o herramienta concretos. Todo lo que apunte a un servicio externo (un escáner de vulnerabilidades, un modelo de decisión) es **configuración opcional** (variables de entorno) y el framework funciona igual sin él.
- Las restricciones específicas de una organización ya presentes en plantillas existentes (`changes/TEMPLATE-spec.md`, `MAP.md`) no se amplían ni se copian a código nuevo; los verificadores nuevos reciben sus parámetros por configuración.

## Decisiones

### D1 · Corregir los defectos 1–5 y 7–8, con pruebas
- Caché: clave `sha256(texto normalizado)`; **coincidencia exacta primero**, similitud semántica solo si el llamador la pide (`allow_semantic=True`); índice de claves acotado.
- Memoria: `store_memory` se niega (`AgentMemoryError`) a guardar sin embedding; nunca fabrica uno.
- Motor de heurísticas: un error al evaluar una regla **no se traga**: se registra con traza y la regla produce la acción `rule_error:<id>`; las reglas de prioridad ≤ 2 (`ECC_001`, soberanía) fallan **cerradas** (lanzan `HeuristicRuleError`).
- `ensure_spec`: coincidencia exacta del id y estado `APROBADO` **de esa spec**; si no, `SpecMissingError`.
- `distribute_framework.py`: rutas por argumento/entorno, `VERSION` + manifiesto de hashes y `--check` que lista los repos desviados.

### D2 · Hooks en el formato de Claude Code
- `.claude/settings.json` con `PostToolUse` (`Edit|Write`) y `Stop`; el hook de sintaxis sale con **2** ante error para bloquear. Los scripts leen el JSON por stdin como lo entrega Claude Code.

### D3 · Capa de decisiones tipadas (`agent/decisions.py`, `.agent/decisions.json`)
- Preguntas cerradas (`choice`/`noul`/`score`), umbrales en un archivo versionado y una función `decide()` con pruebas. Un *backend* enchufable devuelve respuestas con probabilidad; el `HeuristicEngine` ya soporta `gte`, de modo que los «hechos» de contexto (`has_external_api`…) dejan de inventarlos quien llama y pasan a salir de probabilidades.
- Backends: compatible con el formato `/v1/systemone` (jevos u otro servicio) y uno basado en un LLM local OpenAI-compatible. **Ninguno se instala aquí**; se prueban contra un servidor HTTP local que reproduce el formato (y así se declara).

### D4 · Verificadores reales para las restricciones del spec (`verifiers/`)
- Cada «restricción mandatoria» de `changes/TEMPLATE-spec.md` pasa a ser un script con salida `CUMPLE | NO_CUMPLE | NO_EVALUADO`: PK `uuid`, volúmenes en `./data`, triggers de auditoría y OIDC (los dos últimos, por heurística declarada). `/opsx-verify` los ejecuta.

### D5 · Registro de validación humana y compuertas por etapa (`agent/human_validation.py`, `agent/gates.py`)
- Principio: la IA acelera, no firma. Toda salida marcada `requires_human_validation` queda **pendiente** hasta que una persona con identidad la valida; el ejecutor y el validador no pueden ser la misma identidad. Almacenamiento: JSONL de solo anexar (por defecto) o PostgreSQL (`sql/human_validations.sql`).
- Las compuertas de entrada/salida de cada etapa son datos (`.agent/gates/etapa-N.yml`) con criterios de tipo `file_exists`, `command_exit0` y `human_validation`; el verificador debe ser distinto de quien cerró.

### D6 · Memoria con nivel de evidencia
- Cada lección guarda `evidence_level` (`CIERTO`/`PROBABLE`/`HIPOTESIS`); la recuperación puede filtrar por nivel y una hipótesis nunca se devuelve como hecho. Antes de actuar sobre una lección que nombra un archivo o función, se comprueba que siga existiendo (`verify_reference`).

### D7 · Consciencia de perfil de proyecto y costo por sesión
- `.agent/PROFILE.json` (ciclo de vida, módulos, ¿tiene interfaz?, ¿parte de una base reutilizable?) se carga en el contexto y decide qué reglas/comandos aplican (p. ej. las de accesibilidad solo con interfaz).
- `LoopState` registra tokens y USD por skill y el cierre de sesión los resume; `STATE.md` suma los campos *desviación, causa, acción*.

### D8 · Preflight con un escáner opcional y reglas de stack
- `agent/preflight_client.py` + skill `preflight`: antes de tocar archivos consulta, si está configurado (`PREFLIGHT_URL`, `PREFLIGHT_TOKEN`), un servicio que devuelva hallazgos abiertos por archivo (contrato JSON documentado en la skill; Centinela-AI lo implementa, pero cualquier otro sirve). Sin configuración o sin respuesta lo dice; no inventa hallazgos.
- `rules/java/rules.md` y `rules/angular/rules.md`, derivadas de reglas públicas y habituales de revisión de Spring/Angular: cómo escribir el código para no generar el hallazgo.
- `AuraAudit` y `audit_starters.py` duplicaban a un escáner dedicado: primero se marcaron obsoletos y después el dueño pidió retirar `docs/starters/` por completo (ver «Limpieza del repositorio»).

## Fuera de alcance
- `resident-ui/src` (no revisado a fondo), el modelo local de decisión en producción y la copia de `AuraAudit` (solo se marca obsoleta).
- PostgreSQL + pgvector no se puede levantar en este entorno (la imagen no está disponible); el camino de base de datos de `LongTermMemory` se valida solo en lo que no necesita el servidor, y se declara.

## Estado de implementación (2026-10-13)
Suite: `python -m pytest tests -q` → **90 pruebas, todas pasan** (78 al subir el primer lote; −3 por retirar `audit_starters.py`; +15 de versiones vigentes) (la caché se probó contra un Valkey 8 real; sin Valkey esas pruebas se saltan y lo dicen).

| Punto | Estado | Evidencia / límite |
|---|---|---|
| D1 caché (sha256, exacta primero, semántica opt-in, índice acotado y borrado de lo evicto, TTL) | HECHO | `tests/test_semantic_cache.py` contra Valkey real. Una prueba encontró un defecto propio del primer intento (el índice se acotaba pero los datos no se borraban) y se corrigió. |
| D1 memoria sin embeddings inventados | HECHO (validación) | `tests/test_memory_validation.py`. El camino de PostgreSQL + pgvector **NO se ejecutó**: no hay imagen pgvector disponible aquí. |
| D1 motor de heurísticas | HECHO | validación al cargar, guardas fallan cerradas, `rule_error:<id>` visible; `tests/test_heuristic_engine.py`. |
| D1 contrato de spec | HECHO | `agent/specs.py`; `tests/test_specs_gate.py`. |
| D1 `distribute_framework.py` (rutas por argumento, VERSION, manifiesto, `--check`, `--dry-run`) | HECHO | `tests/test_distribute_framework.py` sobre directorios reales. No se ejecutó contra los repositorios reales de Setag. |
| D2 hooks en formato Claude Code | PARCIAL | JSON válido y `post-edit.js` probado con Node 26 (exit 0 / 2 / 0 para archivo inexistente). **No se verificó que Claude Code ejecute estos hooks**; el hook de Python (`py_compile`) no se probó (la imagen de Node no trae Python). |
| D3 decisiones tipadas | HECHO con límite | `tests/test_decisions.py`: validación estricta, umbrales y las dos clases de *backend* contra un servidor HTTP **local que reproduce el formato** (no contra un modelo real). Ningún backend real se instaló ni probó. |
| D4 verificadores | HECHO | `tests/test_verifiers.py`. Ejecutados sobre este mismo repositorio dieron hallazgos reales: `compose_volumes` NO_CUMPLE en tres servicios de `services/plane` (redis, rabbitmq, minio sin ruta `./data`) y `audit_triggers` NO_CUMPLE en `agent_memory`/`lessons`. No se corrigieron: son decisiones del dueño. `endpoints_auth` y `audit_triggers` son heurísticos y lo declaran. |
| D5 registro de validación humana y compuertas | HECHO | `tests/test_human_validation_and_gates.py` (cadena de hash que detecta ediciones, ejecutor ≠ validador, sin doble resolución). Almacenamiento solo JSONL; **no hay adaptador PostgreSQL**. |
| D6 nivel de evidencia | HECHO / PARCIAL | La columna y su restricción se ejecutaron en PostgreSQL 18 real (legado → HIPOTESIS, valor inválido rechazado, idempotente). Las consultas con pgvector no se ejecutaron. |
| D7 perfil del proyecto y costo por sesión | HECHO | `tests/test_profile_and_usage.py`. El costo en USD lo calcula quien llama; el framework no guarda precios. |
| D8 cliente de preflight, skill, reglas Java/Angular | HECHO con límite | Cliente probado contra un servidor local que reproduce el contrato; el contrato también lo implementa Centinela-AI (`/api/preflight`). Las reglas de `rules/java` y `rules/angular` son texto, sin prueba automática. |
| D9 versiones vigentes (`scripts/latest_versions.py`, `versions_current`, `/new-project`) | HECHO con límite | `tests/test_latest_versions.py` (15): parsers con la forma de las respuestas reales, el nivel LTS «vigente hoy», fallos explícitos sin versión de reserva, capa HTTP contra servidor local. Ejecución **en vivo** el 2026-10-13 contra npm, endoflife.date y Adoptium: Angular 22.2.2, CLI 22.2.2, TypeScript 7.0.2, React 19.3.0, Node 24.21.0 (LTS), Java 25 (LTS), Spring Boot 4.1.1, Python 3.15.0, PostgreSQL 18.6, Valkey 9.1.2. Una prueba encontró un fallo propio: las etiquetas `pg18` de pgvector no se reconocían. |
| Biblioteca de prompts | HECHO | `scripts/check_prompts.py` + pruebas. El único prompt incluido declara `eval_set: none`. |
| `resident-ui/src` | NO REVISADO | |

## Pendientes y deuda declarada
- Verificar en una sesión real de Claude Code que los hooks de `.claude/settings.json` se disparan.
- Levantar PostgreSQL + pgvector y ejecutar `sql/agent_memory.sql` completo y las consultas de `LongTermMemory`.
- Decidir qué hacer con los NO_CUMPLE reales del propio repositorio (servicios de `services/plane`, triggers de auditoría).
- `docker-compose.yml` usa `chrislusf/seaweedfs:latest` (imagen sin versión fija): fuera de este cambio.

## Limpieza del repositorio (2026-10-13, por indicación del dueño)
Este framework es genérico (proyectos de Setag; reutilizable por otras organizaciones) y no debe cargar con material de otros productos ni de una organización concreta. Se retiró del árbol actual (el historial de git conserva todo):
- los punteros a otros productos y los documentos `CA-*` de otra organización;
- `docs/starters/` completo (punteros a starters, reportes de auditoría, `AuraAudit`, `.rar`) y `scripts/audit_starters.py` con su prueba;
- `services/` (despliegues de herramientas satélite), `nginx/` (configuración y certificados autofirmados de dominios internos de otra organización), los scripts y notas de integración con un proveedor de identidad concreto, `setup.sh`, `db_setup.sql` (contenía una **contraseña literal**: sigue en el historial de git; rotarla si alguna vez fue real), `.claudecode.json` (rutas fijas de un servidor), el informe de un producto ajeno y el manual técnico de ese producto;
- las skills de `docs/skills/` ligadas a la marca/arquitectura de otra organización (`theming-architecture`, `auth-architecture`, `generacion-estilos`, `generacion-componentes-react`, `generacion-servicios-fastapi`).
Se reescribieron para este entorno: `docs/ESTANDAR_CMMI_UNIVERSAL.md` (ya sin el diagnóstico de un producto ajeno ni el mandato de otra organización), los ejemplos de `docs/HEURISTICAS_MASTER_GUIDE.md`, la plantilla `.agent/CONTEXT.md|MAP.md|STATE.md`, `docker-compose.yml` (Valkey + PostgreSQL/pgvector + panel, sin servicios de otros), rutas absolutas de enlaces → relativas, y el encabezado de `sql/auditoria.sql`.
**No se inventaron convenciones de Setag**: donde un estándar dependía de decisiones propias (paleta, tema, identidad), se dejó «lo que defina el proyecto».
Pendiente de decisión del dueño: las skills restantes de `docs/skills/` (stack Angular/PrimeNG/Spring) siguen siendo las de una arquitectura concreta; confirmar si son las de Setag.

## D9 · Versiones vigentes al generar un proyecto (añadido 2026-10-13, a petición del dueño)
- `scripts/latest_versions.py` resuelve, en el momento, Angular, Angular CLI, TypeScript, React, Node, Java, Spring Boot, Python, PostgreSQL y Valkey desde fuentes oficiales (npm, endoflife.date, Eclipse Adoptium), según `.agent/versions-policy.json` (canal `latest` o `lts` por herramienta). Un fallo devuelve `NO RESUELTA`, nunca una versión de reserva. `--write` guarda el lock; `--check` lo compara con hoy.
- Canal por omisión: `latest` para todo salvo **Java y Node en `lts`** (el último LTS *vigente hoy*, no uno futuro). Es una decisión de política: cambiar a `latest` es una línea en el JSON.
- `commands/new-project.md` impone el orden: resolver versiones → spec → manifiestos con las versiones exactas del lock (nunca `latest`) → verificar. La regla 1 de `.agent/AGENT.md` ya no lista versiones fijas.
- Verificador `versions_current`: compara `package.json` (Angular, React, TypeScript), `pom.xml` (Java, Spring Boot), `Dockerfile` y compose (node, python, temurin, postgres, pgvector, valkey) con lo vigente hoy. Sin red → `NO_EVALUADO`.
- Resultado real de ejecutarlo contra este mismo repositorio: **`NO_CUMPLE`** en `resident-ui/package.json` (TypeScript 5 frente a 7.0.2) y `resident-ui/Dockerfile` (`node:22-alpine` frente a 24.21.0 LTS). El `docker-compose.yml` sí se actualizó (Valkey 9.1, imagen verificada en el registro). `resident-ui` **no se actualizó**: exige probar que el panel de Next.js compile con TypeScript 7 y Node 24, y eso no se ejecutó.
