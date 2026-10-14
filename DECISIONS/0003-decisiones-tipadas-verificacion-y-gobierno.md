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
Suite: `python -m pytest tests -q` → **100 pruebas, todas pasan** (la caché se probó contra un Valkey 9.1 desechable; sin `ROS_TEST_VALKEY_HOST` esas 6 se saltan y lo dicen) (la caché se probó contra un Valkey desechable).

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
| D8 cliente de preflight, skill, reglas Java/Angular | HECHO con límite | Cliente probado contra un servidor local que reproduce el contrato; el contrato puede implementarlo cualquier escáner de seguridad que exponga hallazgos por archivo. Las reglas de `rules/java` y `rules/angular` son texto, sin prueba automática. |
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
Decisión del dueño (2026-10-14): las skills restantes de `docs/skills/` (Angular, PrimeNG, servicios, DTOs, pruebas) **se conservan** porque son útiles; solo debían quedar sin menciones a otra organización, y no las tienen.

## D9 · Versiones vigentes al generar un proyecto (añadido 2026-10-13, ampliado 2026-10-14)
Regla del dueño: **siempre la última versión final que FUNCIONE** (no solo la más nueva publicada).
- `scripts/latest_versions.py` resuelve, en el momento, Angular, Angular CLI, TypeScript, React, Node, Java, Spring Boot, Python, PostgreSQL y Valkey desde fuentes oficiales (npm, endoflife.date, Eclipse Adoptium), según `.agent/versions-policy.json`. Un fallo devuelve `NO RESUELTA`, nunca una versión de reserva. `--write` guarda el lock; `--check` lo compara con hoy.
- Canales: `latest` (última estable), `lts` (último LTS *vigente hoy*) y **`compatible`** (la más nueva que el resto del stack soporta, con la razón escrita cuando una versión más nueva se descarta y cambio automático cuando el stack la alcance):
  - **Java → `compatible` con Spring Boot.** Hoy: Java 27 es versión final (GA 2026-09-21) pero Spring Boot 4.1.1 declara soporte solo hasta Java 26 y Java 26 ya salió de soporte → se usa **Java 25 (LTS)**. Cuando Spring Boot declare Java 27, la herramienta lo elige sola.
  - **TypeScript → `compatible` con typescript-eslint.** Hoy: TypeScript 7.0.2 es la última, pero `typescript-eslint` 8.71.2 solo admite `<6.1.0` y con 7.x el lint falla al arrancar → se usa **TypeScript 6.0.3**.
  - **Node → `latest`.** Node 26 es versión final (la 26.11.1) y Angular 22 la admite (`>=26.0.0`); pasa a LTS el 2026-10-28.
- `commands/new-project.md` impone el orden: resolver versiones → spec → manifiestos con las versiones exactas del lock (nunca `latest`) → verificar. La regla 1 de `.agent/AGENT.md` ya no lista versiones fijas.
- Verificador `versions_current`: compara `package.json` (Angular, React, TypeScript), `pom.xml` (Java, Spring Boot), `Dockerfile` y compose con lo vigente hoy. Sin red → `NO_EVALUADO`.
- **`resident-ui` actualizado y verificado (2026-10-14):** todas sus dependencias a lo último (Next 16.4, React 19.3, ESLint 10, Tailwind 4.3.3, `@types/node` 26, TypeScript 6.0.3) y la imagen a `node:26-alpine`. En Node 26.11.1: `next build` OK, `tsc --noEmit` OK, `eslint` OK, y la imagen Docker se construye y arranca como usuario no root. `versions_current` sobre el repositorio: **CUMPLE**. Se corrigieron de paso un error de lint que ya existía (`main.js` es el proceso principal de Electron, CommonJS) y una variable sin uso.
- Seguridad de dependencias de `resident-ui`: `npm audit --omit=dev` → **0 vulnerabilidades**. Con las de desarrollo quedan 5 (alta) por un aviso de `braces` **sin versión corregida publicada**, solo en la cadena de herramientas de lint. `npm audit fix` empeoraba el resultado y se descartó; se añadieron `overrides` para `dompurify`, `browserslist`, `baseline-browser-mapping` y `source-map-js`.
- Pruebas: `tests/test_latest_versions.py` (25): parsers con la forma de las respuestas reales, el nivel LTS «vigente hoy», los canales `compatible`, fallos explícitos sin versión de reserva y capa HTTP contra servidor local. Ejecución en vivo el 2026-10-14: Angular 22.2.2, TypeScript 6.0.3, React 19.3.0, Node 26.11.1, Java 25, Spring Boot 4.1.1, Python 3.15.0, PostgreSQL 18.6, Valkey 9.1.2.

## Incidente de pruebas (2026-10-14) y su corrección
Las pruebas de la caché leían `VALKEY_HOST` del entorno y su `setUp` llamaba a `flushdb()`. Corridas dentro de un contenedor cuyo `VALKEY_HOST` apunta a un servicio real **vaciaron la base 0 de ese servicio** (dos corridas, 12 `flushdb`). Se verificó, solo con lecturas, que ese Valkey solo tenía clientes del mismo host y sirve de cola de alertas que se consume cada segundo, así que lo perdido fue, como mucho, lo encolado en ese instante; no se puede demostrar que fuera cero. Corrección: las pruebas **solo corren si se nombra un Valkey de pruebas** en `ROS_TEST_VALKEY_HOST` (variable distinta de la de la aplicación), usan la base 15 y un prefijo único por prueba, **borran solo lo que crearon** y se niegan a correr si la base tiene claves ajenas; `flushdb()` ya no existe. `SemanticCache` acepta `db=` (o `VALKEY_DB`).
Lección general para quien use este framework: una prueba que destruye datos nunca debe heredar su destino del entorno de la aplicación.


## D10 · Honestidad, aislamiento y código limpio por construcción (añadido 2026-10-14)
Origen: las reglas de entrega y de pruebas que más errores evitaron en otro proyecto de seguridad. Se incorporan de forma genérica.
**Reglas nuevas** (`rules/common/`): `honesty.md` (qué NO es «terminado», estados `COMPLETADO/PARCIAL/FALLIDO`, «validado solo con mocks», `NO EVALUADO`, formato de entrega de 4 bloques, parches verificados, agentes sin éxito falso), `test-isolation.md` (una prueba destructiva nunca hereda su destino del entorno de la aplicación), `error-handling.md` (no silenciar excepciones, fallo parcial ≠ éxito), `lessons.md` (errores operativos repetidos) y la sección *fail-closed* en `security.md`.
**Corrección:** `testing.md` decía «mockea todo servicio externo» y exigía 80 % de cobertura; contradecía `honesty.md`. Ahora prefiere dependencias reales desechables, trata la cobertura como señal y exige declarar lo probado solo con mocks.
**Verificadores** (`verifiers/checks.py`, todos con pruebas positivas y negativas en `tests/test_verifiers_honesty.py`): `no_stubs` (heurístico), `tests_isolated` (heurístico), `no_silent_except` (estático, AST) y `webhooks_fail_closed` (heurístico, solo FastAPI). Corridos sobre este mismo repositorio hallaron dos problemas reales que se corrigieron: un `except Exception` sin traza en `skills/example_mcp_skill.py` y una clase heredada sin lógica (`ResidentAgentGraph`, sin usos) que se eliminó.
**Utilidades:** `scripts/patch_validator.py` (`git apply --check` contra el repositorio real; un parche con contexto inventado se rechaza) y `scripts/build_public_release.py` (copia saneada de un solo commit con gates: IPs privadas, bloques de llave privada, lista configurable de nombres prohibidos y trufflehog si está instalado; no publica nada).
**Skills:** nuevas `clean-code-contract` (qué no escribir y cómo entregar) y `triage-findings` (clasificar hallazgos con evidencia); ampliadas `verification-before-completion` (estados y formato), `test-driven-development` (pares positivo/negativo) y `systematic-debugging` (evidencia cruda); los agentes `security-reviewer` y `code-reviewer` citan las reglas y ejecutan los verificadores.
**Auditoría de base de datos:** `sql/auditoria.sql` se reemplazó por el instalador único `sql/auditoria_estandar_completo.sql` (diagnostica antes de cambiar nada; bitácora de solo inserción, particionada, con hash encadenado; reparación y actualización conservando registros) con su `sql/AUDITORIA_LEEME.md`. El verificador `audit_triggers` reconoce `auditoria.habilitar_auditoria('<esquema>.<tabla>')`; `postgres-audit`, `database-liquibase-postgresql`, `database-style.md` y la plantilla de tareas se actualizaron. El script no se ejecutó contra ninguna base desde esta sesión; su verificación es la documentada en su LEEME (PostgreSQL 18.4).
**Límites:** los verificadores heurísticos pueden omitir casos (se declaran `heuristic`); `webhooks_fail_closed` no evalúa otros frameworks; el punto «lo probado solo con mocks se declara» es una regla, no un verificador (no se puede decidir mecánicamente). Las 6 pruebas de caché siguen omitidas sin `ROS_TEST_VALKEY_HOST`.
