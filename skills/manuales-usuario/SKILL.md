---
name: manuales-usuario
description: "Genera manuales de usuario de un módulo con imagen homogénea garantizada. La IA no escribe el .docx: primero pide las reglas de negocio en .md y las contrasta contra el código real (back y front) con evidencia archivo:línea; después toma las capturas con un guion reproducible (Playwright) y produce un payload.json que render.js valida y convierte en .docx más una hoja de validación. Úsala cuando se pida crear, regenerar, actualizar o revisar un manual de usuario, guía de uso o documentación para el usuario final de un módulo, o cuando se quiera saber si un manual dice lo que el sistema hace de verdad."
---

# Manuales de usuario de módulo · v1.0

El manual describe **lo que el sistema hace de verdad**, no lo que decía el requerimiento. Por eso el flujo tiene una compuerta de reglas: nada se presenta al usuario como regla si no está contrastado contra el back y el front.

La IA produce **datos** (`reglas_contrastadas.md`, `guion_capturas.json`, `payload.json`). Los scripts deterministas producen **artefactos** (`evidencia.md`, `capturas/`, el `.docx` y la hoja de validación).

> **Ejecución:** todos los comandos `node` corren en contenedor y no se instala nada en el equipo: `references/ejecucion-en-docker.md`. Con la regla `rules/common/privacidad-y-herramientas.md` no se usa la extensión de navegador ni servicios en la web; las capturas salen de `capturar.js` con datos ficticios.

## Regla dura

- **El `.docx` solo lo produce `scripts/render.js`.** Nunca lo fabriques a mano ni con otra librería, y nunca edites el builder para generar.
- **Sin `--reglas`, no hay manual oficial.** `--borrador` existe para revisiones internas y marca «BORRADOR: reglas sin contrastar» en cada página.
- **No inventes pasos, pantallas, botones, mensajes ni reglas.** Si no están en la evidencia o en la exploración, no se escriben.
- **No resuelvas discrepancias.** Quien decide es el líder de proyecto o el analista; la IA solo las expone.
- **Nunca ejecutes acciones destructivas en el sistema** (guardar, eliminar, cambiar estatus) sin permiso explícito, y nunca pidas ni captures credenciales ni datos personales reales.
- **Si no puedes ejecutar `node`,** entrega los archivos de datos y **declara** que el `.docx` no se generó. Fallar visible es mejor que entregar una imagen falsa.

## Preparación (una vez)

Dependencias fijadas en `package-lock.json` (docx, ajv, js-yaml, playwright-core). Instalación con `npm ci` dentro de un contenedor:
`references/ejecucion-en-docker.md`.

Carpeta de trabajo por manual (sugerida): `<repo-del-sistema>/documentacion/Manuales/trabajo/<modulo>/`, con `reglas_negocio.md`, `evidencia.md`, `reglas_contrastadas.md`, `guion_capturas.json`, `capturas/` y `payload.json`. **No versiones `sesion*.json`.**

## Flujo (en orden; cada fase cierra con su compuerta)

### Fase 0 · Identificar el módulo
Resuelve el módulo con `references/catalogo.md`: carpeta de front, prefijo Java y manual vigente. Lee **solo** `references/manifiestos/MANUAL-USUARIO.manifest.yaml` y `references/estructura_manual.md`. No abras los builders.

### Fase 1 · Pedir las reglas de negocio en .md (obligatoria)
Pide al usuario **`reglas_negocio.md`**, las reglas reales del módulo según su fuente (especificación, documento de requerimientos, minutas). Plantilla: `references/plantillas/reglas_negocio.template.md`.
- Si no las tiene, pero existe una especificación en el repo (p. ej. `front/.agents/specs/<módulo>/*.md`, `e2e/features/<módulo>/*.feature`), conviértela a la tabla citando la sección de origen y **pide que la confirme** antes de seguir.
- Si no hay nada, pídelas y **detente** (o genera `--borrador` si el usuario lo pide expresamente).

### Fase 2 · Contrastar contra back y front (compuerta 1)
Procedimiento completo en `references/contraste_reglas.md`.
```bash
node scripts/evidencia.js --repo <raíz sistema> --front front/src/app/features/<feature> --back <Prefijo> --out <trabajo>/evidencia.md
# La IA abre cada evidencia en su línea y escribe <trabajo>/reglas_contrastadas.md (plantilla en references/plantillas/)
node scripts/validar_reglas.js --reglas <trabajo>/reglas_contrastadas.md --repo <raíz sistema>
```
Estados nuevos: `solo_vista_previa` (citable, limitación) y `sin_efecto` (no citable). Evidencia dinámica: `prueba:<script>@AAAA-MM-DD`. Back Python: `--back-ext py`; front React: `.tsx` se indexa solo.
Muestra al usuario **un resumen**: cuántas reglas son citables, las **discrepancias** (con lo que hace el código) y las `no_documentada`. Pide decisión **una sola vez, en lote**, solo para las discrepancias que afecten tareas del manual. Lo que no se decida queda fuera del manual y se lista en la hoja.

### Fase 3 · Explorar el sistema
Ver `references/capturas.md`. Con la extensión Claude in Chrome (herramientas `mcp__claude-in-chrome__*`; carga antes el skill `chrome-browser`): recorre el módulo como usuario, confirma cada paso, copia las etiquetas exactas y anota los selectores. Sin la extensión: usa los ids y las etiquetas de `evidencia.md` y pide una corrida `--visible`. Resultado: el borrador de tareas y `guion_capturas.json`.

### Fase 4 · Capturas (compuerta 2)
```bash
node scripts/capturar.js --guion <trabajo>/guion_capturas.json --login   # una vez por ambiente; la persona inicia sesión
node scripts/capturar.js --guion <trabajo>/guion_capturas.json           # genera capturas/; --solo <id> para repetir una escena
```
**Con la extensión Claude in Chrome** (ambientes sin sesión automatizable, o si es lo que ya funciona): `"modo": "extension"` en el guion y `scripts/tools/captura_ext.js estado|registrar` (ver `references/capturas.md`). Mismo guion, mismos nombres; las imágenes son JPEG y sin resaltado.
Si una escena falla, corrige su selector (mira `_fallo_<id>.png`) y repite con `--solo`. Prefiere `mocks` con datos ficticios.

### Fase 5 · Payload
Escribe `<trabajo>/payload.json` con las claves stem del manifiesto. Redacción: `references/estructura_manual.md`. Ejemplo completo: `examples/variables-sistema/payload.json`.
- Toda viñeta de `tarea.reglas` lleva `[RN-xx]` y una regla **citable**.
- `paso.captura` = `archivo` de su escena del guion.
- No numeres pasos ni figuras. Sin meta-tokens.
- Datos de control **fuera del contrato**, en `_control: { version, fecha, autor, descripcion_cambio, aprobador: { nombre, rol }, historial? }`. Los dicta el usuario. Lo que no dé queda como `«____»`. La firma siempre va en blanco.

### Fase 6 · Generar (compuerta 3)
```bash
node scripts/render.js --data <trabajo>/payload.json --reglas <trabajo>/reglas_contrastadas.md --repo <raíz sistema> --out <salida>/Manual_de_usuario_<Modulo>.docx [--estricto]
```
`render.js` valida el contrato, las citas de reglas y las capturas (`--estricto` convierte las capturas faltantes en error). Genera el `.docx` y `<salida>_validacion.md`.

### Fase 7 · Entregar
Entrega el `.docx` y la hoja de validación. Reporta en 5 líneas o menos: tareas, pasos y figuras; capturas pendientes; reglas sin citar; **discrepancias pendientes de decisión**; hallazgos para el equipo (validaciones que solo están en el front). La hoja lista además «Pendiente de verificar en ambiente de pruebas» (acciones no ejecutadas; se declaran en `_control.pendientes_verificar: [{accion, dato}]` o con el texto «por confirmar»).
**No** conviertas a PDF ni lo abras para «verificar», salvo que te lo pidan.

## Protocolo de interacción
1. **Deriva primero:** carpetas, prefijos, etiquetas y mensajes salen del código, no se preguntan.
2. **Pregunta una vez, en lote:** las reglas (Fase 1), las decisiones sobre discrepancias (Fase 2) y los datos de `_control`.
3. **No te bloquees por faltantes:** URL, fecha o aprobador quedan como `«____»` y la hoja los lista.
4. **Una confirmación** antes de generar: muestra el plan (tareas, número de capturas, reglas citadas, qué queda fuera).

## Autoría
`ia` (redacta con juicio) · `derivado` (extrae de la fuente; nunca inventa) · `humano` (firmas, fechas, decisiones: nunca la IA) · `auto` (lo pone el sistema). Las **reglas** tienen su propio control: el estado en `reglas_contrastadas.md`.

## Archivos
- `scripts/render.js`: despachador con 3 compuertas, más la hoja de validación. `--list`.
- `scripts/build_manual.js` + `scripts/manual_mold.js`: el builder y el molde. **Única fuente del formato.** No se editan para generar.
- `scripts/evidencia.js`: índice de evidencia del código (front Angular y back Spring).
- `scripts/validar_reglas.js` + `scripts/lib/reglas.js`: compuerta de reglas.
- `scripts/capturar.js`: capturas con Playwright a partir del guion (`--login`, `--solo`, `--visible`).
- `scripts/tools/captura_ext.js`: registra y valida las capturas tomadas con la extensión (`estado`, `registrar --revisado`).
- `scripts/tools/gen_schema.js`: manifiesto → esquema (`npm run schema`). `scripts/tools/regresion.js`: ejemplos más casos negativos (`npm run regresion`).
- `references/`: el manifiesto, `catalogo.md`, `estructura_manual.md`, `contraste_reglas.md`, `capturas.md`, `plantillas/`, `builders_map.json` y `logo_ca.png`.
- `examples/variables-sistema/`: caso real completo, con 2 discrepancias detectadas (RN-01 filtros y RN-10 «prohibido borrar» contra Eliminar y Restablecer en el código).

## Otros manuales y documentos (no son esta skill)
| Documento | Cómo se produce |
|---|---|
| Documentación técnica de entrega y runbook de despliegue | El generador de entregables del proyecto, si existe; si no, documentos versionados en `docs/` |
| Documentación del código y del API (OpenAPI, Javadoc/TSDoc, `COMMENT ON`, README de módulo) | `documentacion-codigo-y-api` y `generacion-documentacion` |
| Manual de usuario de un módulo | Esta skill |

Los tres comparten reglas: describen el sistema real (nada inventado), se redactan como versión original (`reglas-globales`:
la versión inicial es 1.0 y el control de versiones solo se llena cuando hay una versión posterior real) y pasan la prueba de lectura de
`documentacion-codigo-y-api` §4 antes de entregarse.

## Cambiar el formato
La identidad (organización, logo, código de plantilla y código del documento) vive en `references/marca.json`; cambiarla no
toca el código. El formato vive solo en `manual_mold.js` (paleta, márgenes, estilos) y `build_manual.js` (orden de las secciones). Si cambias el contrato, edita el manifiesto, corre `npm run schema` y luego `npm run regresion`, que debe dar N/N.
