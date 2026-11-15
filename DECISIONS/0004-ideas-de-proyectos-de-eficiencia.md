# ADR-0004 — Ideas de Chisle, Caveman, Ponytail y herramientas afines: qué se incorporó, qué queda propuesto

**Estado:** ACEPTADO (2026-11-15). Partes A y B implementadas y probadas; pilotos de la parte C ejecutados: C1 y C2 adoptados con sus límites, C3 recomendado como opción.
**Origen:** lectura del código de Chisle (JayPokale, MIT), Caveman (Julius Brussee, Apache-2.0; el nombre es marca registrada) y Ponytail (DietrichGebert, MIT), más herramientas de código abierto que resuelven el mismo problema con medición en lugar de opinión.
**Regla aplicada:** de esos proyectos se toman ideas; el código es propio. Solo se reutilizaría código ajeno si escribirlo de nuevo no fuera posible y la licencia lo permitiera.

## Hallazgo que orienta las decisiones
Las propias mediciones de Caveman muestran que pedirle al modelo que hable corto ya casi no ahorra en los modelos actuales («responde conciso» captura casi todo; su estilo añade ~3 %), y que su ahorro grande está en **leer menos**: recortar la salida de herramientas antes de que entre al contexto. Por eso este ADR prioriza la entrada (lo que el agente lee) sobre el estilo de las respuestas. Esas cifras son de sus autores, no medidas aquí.

## A. Implementado — eficiencia del agente
| Qué | Idea de | Dónde | Prueba |
|---|---|---|---|
| Recorte de salidas largas de Bash (conserva inicio, final, errores y resumen de pruebas; guarda el original; si no puede guardarlo, no recorta; solo Bash, que es la única herramienta con forma de salida documentada) | Chisle | `scripts/hooks/compress-output.js` | `tests/hooks/compress-output.test.js` (8) |
| Mapa de lo que ya existe, al iniciar la sesión, para el peldaño «reutilizar» (expresiones regulares, no parser: puede faltar algo) | Ponytail | `scripts/codebase-map.js` | `tests/hooks/codebase-map.test.js` (3) |
| Escalera corregida: peldaño «ya existe», alcance antes de escribir, lo que nunca se omite, lógica nueva con su prueba, marcador `shortcut:` | Ponytail, Chisle | `rules/common/efficiency.md`, `/ponytail-*` | — (texto) |
| Dieta de contexto (leer menos, no releer, razonar sin repetir) | Chisle, Caveman | `rules/common/context-diet.md` | — (texto) |
| Método de depuración (observado vs. inferido, hipótesis por costo de descarte, capa más estrecha) y de verificación (pasa/falla/no disponible/bloqueado, detenerse al cumplir) | Caveman | skills `systematic-debugging`, `verification-before-completion` | — (texto) |
| Límite de 1024 caracteres por descripción de skill (se cargan en cada petición) | Chisle | `tests/test_skill_descriptions.py` | 1 |

Se quitaron afirmaciones no medidas que ya estaban publicadas («80–94 % menos código», «ahorro estimado ~320 líneas») y la descripción equivocada de Ponytail en `ARCHITECTURE.md`.

## B. Implementado — medición y barreras automáticas
| Qué | Herramienta | Dónde | Prueba |
|---|---|---|---|
| `/ponytail-audit` mide antes de opinar: código muerto, dependencias sin usar o sin declarar, duplicados, tamaño. Solo usa lo instalado; lo ausente o caído se reporta como «no medido», nunca como limpio | vulture, deptry, knip, jscpd, scc | `scripts/ponytail_audit.py` | `tests/test_ponytail_audit.py` (5; uno corre las herramientas reales si están instaladas) |
| Barreras antes del commit: secretos en staging (con `--redact`), sintaxis Python, mensajes Conventional Commits; si falta gitleaks el commit falla | lefthook 2.2, gitleaks 8.30, commitlint 21 | `templates/git-hooks/` | Probado en un repositorio desechable: limpio aceptado, secreto bloqueado sin imprimirse, mensaje inválido bloqueado, sintaxis rota bloqueada, sin gitleaks bloqueado |
| Actualización de dependencias sin depender de que alguien corra el script: agrupa menores, separa mayores, alertas de vulnerabilidad sin espera, espera de 14 días en versiones nuevas | Renovate | `templates/renovate.json` | Validada con `renovate-config-validator` 44.239.1 (una configuración con un error de escritura es rechazada) |

Hallazgo durante la prueba real: knip 5 se cae con Node 26 sin escribir nada en la salida; la primera versión del script lo tomaba por «0 avisos». Ahora una salida vacía es un fallo. vulture califica las funciones sin uso con 60 % de confianza, así que un umbral de 80 las ocultaba: el umbral por omisión es 60.

`scripts/distribute_framework.py` no copiaba `commands/` ni `scripts/` a los proyectos (los comandos `/ponytail-*` y los hooks nunca llegaban); ahora distribuye `commands/`, `templates/`, `scripts/hooks/`, `scripts/codebase-map.js` y `scripts/ponytail_audit.py`.

**Límites:** Renovate necesita un bot ejecutándose contra el GitLab/GitHub del proyecto (servicio o tarea de CI); la plantilla sola no hace nada. Los hooks de Claude Code y lefthook requieren Node en la máquina del desarrollador.

## C. Propuesto — requiere decisión
### C1. Aislar al agente (sandbox-runtime de Anthropic o container-use de Dagger)
**Problema real:** una prueba heredó del entorno la dirección de un Valkey de producción y ejecutó `flushdb` sobre él. Una regla escrita (`rules/common/test-isolation.md`) depende de que el agente la cumpla; un aislamiento de red y de variables lo impide por diseño.
**Propuesta:** ejecutar las sesiones del agente (o al menos las pruebas) con red restringida a una lista de destinos y sin heredar las variables de producción. sandbox-runtime limita sistema de archivos y red de un proceso; container-use da a cada agente un contenedor y una rama propios.
**Por decidir:** cuál de los dos (o ninguno) y en qué máquinas; qué destinos se permiten; cómo se entregan credenciales de prueba. No se adopta sin probarlo en un proyecto real, porque restringir la red rompe herramientas que hoy descargan dependencias.

### C2. Regresión de skills y reglas (promptfoo)
**Problema:** no hay forma de saber si un cambio en una skill o regla empeora lo que el agente produce; hoy se revisa a ojo.
**Propuesta:** un conjunto pequeño de casos por skill crítica (entrada → aserciones verificables automáticamente: el código compila, la prueba existe, aparece `@PreAuthorize`, no aparece un secreto), ejecutado en CI con promptfoo contra el mismo modelo, comparando antes y después del cambio. Sin modelo juez para lo que se pueda verificar con código; publicar también los casos en que el cambio pierde.
**Por decidir:** qué modelo y presupuesto de llamadas por ejecución, qué skills primero, y si se ejecuta en cada MR o solo al cambiar `skills/` o `rules/`.

### C3. Leer por símbolo (Serena) y mapa con tree-sitter (repo-map de Aider)
**Problema:** el agente abre archivos completos para encontrar una función; `scripts/codebase-map.js` usa expresiones regulares y puede omitir símbolos.
**Propuesta:** documentar Serena (servidor MCP sobre LSP) como opción para proyectos grandes, y sustituir las expresiones regulares del mapa por tree-sitter cuando el mapa necesite ser exacto.
**Por decidir:** Serena añade un servidor de lenguaje por proyecto (memoria y arranque); evaluar en un repositorio Java grande antes de recomendarlo.

## Decisión del dueño (2026-11-14)
| Propuesta | Decisión | Alcance del piloto | Criterio para adoptarlo |
|---|---|---|---|
| C1 | Piloto con **sandbox-runtime** (no container-use) | Solo la ejecución de pruebas en este repositorio: red limitada a una lista de destinos y sin heredar variables de producción | Las pruebas pasan dentro del aislamiento y una prueba que intenta llegar a un destino no permitido falla; se documenta qué herramientas se rompen (descarga de dependencias) |
| C2 | Piloto **acotado** de promptfoo | 5 casos para cada una de 3 skills críticas (seguridad de backend, generador CRUD, autenticación OIDC del frontend); se ejecuta solo cuando cambian `skills/` o `rules/`, con un modelo gratuito | Las aserciones son verificables con código (sin modelo juez) y la ejecución cabe en el presupuesto de llamadas que se fije antes de empezar |
| C3 | **Evaluar Serena** en un repositorio Java grande; el mapa con expresiones regulares se queda | Medir memoria, tiempo de arranque y lecturas de archivos completos evitadas en tareas reales | Ahorro medido en lecturas frente a su costo de memoria y arranque; sin medición no se recomienda |

Ninguno de los tres se marca como adoptado hasta tener su evidencia.

## Resultado de los pilotos

### C1 — sandbox-runtime: ADOPTADO para la ejecución de pruebas (2026-11-14)
`scripts/sandboxed-tests.sh` corre la suite bajo `srt` (sandbox-runtime 0.0.81) con `templates/sandbox/srt-tests.json`: sin red salvo una lista
explícita (`ROS_SANDBOX_ALLOW`), entorno vacío salvo `PATH`, `HOME`, idioma, `TERM` y `ROS_TEST_*`, escritura solo en el repositorio y `/tmp`, sin
lectura de `~/.ssh`, `~/.aws`, `~/.config`, `~/.docker`, `~/.netrc`, `~/.pgpass`. `tests/test_sandbox_isolation.py` comprueba el aislamiento y
solo corre dentro de él.

| Criterio | Evidencia |
|---|---|
| Las pruebas pasan dentro del aislamiento | 127 pasan, 7 se saltan (las mismas de siempre más las de caché); hooks de Node 11 de 11 |
| Una prueba que intenta llegar a un destino no permitido falla | Dentro: conexión directa a una IP y a un dominio, proxy hacia un dominio fuera de la lista, variables de producción y escritura en `$HOME` quedan bloqueadas. Control: las mismas 5 comprobaciones sin aislamiento fallan las 5 |
| Qué se rompe | Ver límites |

**Límites medidos:**
- `srt` **hereda todo el entorno**; sin `env -i` una variable de producción (`VALKEY_HOST`) llega a la prueba. El script la vacía.
- Solo sale tráfico HTTP(S)/SOCKS por el proxy de `srt`: **Valkey y PostgreSQL (TCP directo) no son alcanzables aunque estén en la lista**. Las pruebas
  de la caché se saltan dentro y se corren fuera con sus propias salvaguardas (verificado con un Valkey desechable: 6 pasan fuera, se saltan dentro).
- La lista acepta dominios con punto o IP; un nombre sin punto (nombre de contenedor) se rechaza.
- `srt` fija `TMPDIR=/tmp/claude` sin crearlo (rompía `mkdtemp` de Node); el script lo crea.
- Descarga de dependencias: funciona solo hacia dominios de la lista (pip desde `pypi.org`/`files.pythonhosted.org` verificado; cualquier otro, 403).
- **Verificado en un contenedor desechable** (node:26-slim + bubblewrap + socat), que además exige `--security-opt seccomp=unconfined`,
  `apparmor=unconfined` y `systempaths=unconfined` para que bubblewrap cree sus espacios de nombres. No se probó directamente en la máquina de un
  desarrollador ni en macOS.

### C2 — promptfoo: ADOPTADO como comprobación de regresión de skills, con casos por endurecer (2026-11-15)
`scripts/eval-skills.js` corre 5 tareas por cada una de las 3 skills con la versión anterior y la actual de su contexto (skill + `rules/common/security.md`
+ reglas del lenguaje) y revisa el código generado con aserciones deterministas (`evals/skills/assertions.js`, sin modelo juez; 19 pruebas
unitarias las validan con código correcto e incorrecto). No hace nada si `skills/` y `rules/` no cambiaron; se niega a enviar llamadas por
encima del presupuesto (30); un caso sin medir nunca cuenta como «sin regresión» (salida 2). promptfoo 0.125.1, temperatura 0.

Primera ejecución real, contra el commit `4d81e8a` (las 3 skills no existían; solo reglas más cortas):

| Skill | Sin regresión | Ganó la versión actual | Sin medir |
|---|---|---|---|
| backend-seguridad (gemini-3.5-flash) | 5 de 5 pasan en ambas | — | — |
| backend-modulo-crud (gemini-3.5-flash) | 4 pasan en ambas | borrado lógico | — |
| frontend-auth-oidc (gemini-3.5-flash-lite) | 3 pasan en ambas | el login delega en el proveedor | 1 (Authorization Code con PKCE, versión actual: Gemini bloquea la respuesta con `RECITATION`) |

**Lo que dice el resultado:** 0 regresiones y 2 mejoras; pero 12 de 15 casos ya pasaban sin la skill: el modelo cumple estos básicos solo con
las reglas, así que estos casos casi no distinguen versiones. Hay que endurecerlos (requisitos que el modelo no cumple por su cuenta: permiso
exacto `MODULO_ACCION`, prueba de 403, `@SQLRestriction`, cierre de sesión con revocación). Una muestra por caso a temperatura 0.

**Límites medidos:**
- El plan gratuito de `gemini-3.5-flash` permite **20 peticiones al día**, menos que el presupuesto de 30; el valor por omisión pasó a
  `gemini-3.5-flash-lite` (su cupo diario no se agotó en el piloto, pero no se midió su límite). `gemini-2.5-flash` responde 404 a llaves nuevas.
- promptfoo reintenta un 429 con esperas de 60 s; con la cuota diaria agotada la ejecución se queda reintentando. Para cortar: `--only <skill>`
  al día siguiente (los resultados ya obtenidos salen de la caché sin gastar llamadas).
- Una aserción mía rechazó código correcto (login que delega en `AuthService.login()`); se corrigió y se añadió el caso a las pruebas. Una
  aserción sobre texto generado puede equivocarse: un fallo se lee antes de culpar a la skill.
- No está conectado a CI: este repositorio no tiene canalización; se corre a mano o desde la CI del proyecto que lo adopte.

### C3 — Serena en un repositorio Java grande: RECOMENDADO como opción, no por omisión (2026-11-15)
Medido con serena-agent 2.1.0 (Eclipse JDT LS) sobre un backend Spring Boot de 1 609 archivos Java (Gradle), en 10 tareas «encontrar la
definición de un método de servicio y todos sus llamadores» elegidas al azar con semilla fija. Comparación por tarea: (a) lo que hace hoy el
agente: `grep -w` y leer completos los archivos que aparecen; (b) Serena: `find_symbol` con cuerpo + `find_referencing_symbols`.

| Medida | Resultado |
|---|---|
| Texto que entra al contexto | grep + archivos completos: 3 760 339 bytes; Serena: 28 597 caracteres (≈131 veces menos). Un nombre común (`actualizar`) llevó a grep a 57 archivos (2.2 MB); Serena devolvió el único llamador real |
| Exactitud | Cada archivo que grep encontró y Serena no se revisó a mano: métodos homónimos de otras clases (repositorio, otro servicio) y una llamada dentro de un bloque comentado. Ningún llamador real omitido en las 10 tareas |
| Arranque | ~104 s hasta la primera respuesta (servidor de lenguaje + importación Gradle); después, 1–6 s por consulta |
| Memoria | Pico ≈3.6 GB por encima de la base (Python + JDT LS + daemon de Gradle) |

**Límites:** es una medida de lo que entraría al contexto, no una sesión real de agente (un agente puede leer por rangos). Serena 2.x usa por
omisión una interfaz REPL; para herramientas separadas hay que poner `agent_interface: tools`. El primer arranque descarga JDT LS y las
dependencias del proyecto (Maven Central); un proyecto con repositorio privado de dependencias no se probó.

**Recomendación:** opción para proyectos Java con cientos de archivos o más, en máquinas con ≥4 GB libres y sesiones largas (el arranque se
amortiza). No se vuelve parte de la instalación por omisión; `scripts/codebase-map.js` se queda.

## Lo que no se incorpora
- El proxy de Caveman (vería las llaves y todo el tráfico), su selector automático de modelo, su memoria y su nube.
- El estilo de respuesta «cavernícola»: ahorro marginal sobre «conciso» y choca con los entregables para doble audiencia.
- Instalar Chisle o Caveman tal cual (`npx`): código de terceros en cada llamada a herramienta.
