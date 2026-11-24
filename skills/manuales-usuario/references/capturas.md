# Fases 3 y 4 — Exploración y capturas

Las capturas son el 60–70 % del esfuerzo de un manual (en promedio 45 imágenes). Aquí se separan dos trabajos:

| | Exploración (Fase 3) | Capturas (Fase 4) |
|---|---|---|
| Objetivo | Confirmar que cada paso existe y funciona; obtener etiquetas exactas y selectores | Producir las imágenes del documento |
| Herramienta | Extensión **Claude in Chrome** (`mcp__claude-in-chrome__*`), con la sesión real del usuario | **`capturar.js`** (Playwright con el Chrome o Edge instalado) |
| Resultado | `guion_capturas.json` validado | `capturas/*.png` con resaltado, mismas cada vez |

## Fase 3 · Exploración con la extensión

Si la sesión tiene las herramientas `mcp__claude-in-chrome__*`: carga el skill `chrome-browser` antes del primer uso y luego:

1. Pide al usuario que abra el sistema y que ya haya iniciado sesión (**nunca** captures ni pidas credenciales).
2. Trabaja en una pestaña nueva. Navega al módulo **como lo haría el usuario** (menú hamburguesa, opción), no por URL, y anota la ruta real.
3. Por cada tarea del borrador: ejecuta los pasos que **no modifican datos** (abrir, filtrar, abrir diálogos y cancelar). Lee del DOM las etiquetas exactas de botones, campos, encabezados y mensajes. Cada texto que el manual cite entre comillas debe coincidir carácter por carácter.
4. Para cada pantalla que lleva captura, obtén un selector estable, en este orden de preferencia: `#id` → `text=Etiqueta` → `p-button:has-text('X') button` → `[ptooltip='X']` → posición (`tr:first-child button >> nth=1`, último recurso).
5. **No ejecutes acciones destructivas** (guardar, eliminar, cambiar estatus) sin permiso explícito del usuario en ese momento y en un ambiente de pruebas. El guion las captura **hasta el diálogo de confirmación** y cancela.
6. Las capturas de pantalla de la extensión sirven para que verifiques **en la conversación**; no son los archivos del manual.

Sin la extensión: se explora leyendo el HTML del feature (los selectores están en `evidencia.md`: ids, `label`, `pTooltip`) y se le pide al usuario que corra el guion en modo visible (`--visible`) para confirmarlo.

## Fase 4 · `guion_capturas.json` → `capturar.js`

Plantilla: `references/plantillas/guion_capturas.template.json`. Ejemplo real: `examples/variables-sistema/guion_capturas.json`.

```bash
# Una vez por ambiente: abre un navegador visible; la persona inicia sesión y la sesión se guarda
# (incluye sessionStorage, donde muchas aplicaciones guardan el token). El archivo de sesión NO se versiona.
node scripts/capturar.js --guion <trabajo>/guion_capturas.json --login

# Capturas (sin ventana). --solo <id> repite una escena; --visible para ver lo que hace.
node scripts/capturar.js --guion <trabajo>/guion_capturas.json
```

**Escena:** `id`, `archivo` (debe ser **el mismo** nombre que `paso.captura` del payload), `ruta` (o `continuar: true` para seguir en la pantalla de la escena anterior), `acciones`, `resaltar` (selector o lista), `recorte` (`pantalla` · `pagina` · `selector:<css>`).

**Acciones:** `clic` · `doble_clic` · `escribir: [selector, texto]` · `seleccionar: [abrir, opción]` · `tecla` · `pasar` · `esperar: ms` · `esperar_selector` · `ir` · `desplazar`. Cada una acepta `timeout` (por defecto `timeout_ms` del guion, o 10 s).

**Datos ficticios (recomendado).** `"mocks": "mocks.js"` exporta `async (ctx) => { await ctx.route('**/api/variables**', r => r.fulfill({...})) }`, con el mismo patrón que `front/e2e/specs/*.spec.ts`. Con mocks y `"sin_sesion": true` no hacen falta ni ambiente ni login, y **ninguna captura expone datos reales**.

Si una escena falla, `capturar.js` continúa con las demás, guarda `_fallo_<id>.png` con lo que veía y termina con código 2. Corrige el selector y repite con `--solo <id>`.

## Fase 4 alternativa · Capturas con la extensión (`captura_ext.js`)

Cuando el sistema no se deja automatizar con Playwright (sin sesión reutilizable, autenticación por clave, ambiente interno) o la persona ya trabajó bien con la extensión, las imágenes del manual se pueden tomar con `mcp__claude-in-chrome__computer` (`screenshot` + `save_to_disk: true`). El guion **sigue siendo la fuente**: mismas escenas, mismos `archivo`; se marca `"modo": "extension"` en el guion o en la escena. `capturar.js` las salta y avisa.

```bash
node scripts/tools/captura_ext.js estado --guion <trabajo>/guion_capturas.json          # qué falta y cómo capturarlo
node scripts/tools/captura_ext.js registrar --guion <…> --id 03 --origen <ruta que devolvió save_to_disk> --revisado [--nota "tenant USANATEST"]
```

Procedimiento de la IA, por escena:

1. En una **pestaña propia**, deja el navegador a 1366×768 y en modo escritorio; que no haya paneles de depuración ni otras pestañas en la captura. «Tal cual el navegador» = pantalla completa, sin recorte.
2. Recorre la escena como el usuario (ruta y acciones del guion). **Espera a que terminen los cargadores** («Generando vista previa…», spinners): verifica con una captura previa o con `find`/`get_page_text` antes de la definitiva.
3. Toma la captura con `save_to_disk: true` y mírala: sin credenciales, sin datos reales (prefiere el tenant o los registros de prueba), con el elemento del paso a la vista.
4. `registrar … --revisado`. El script valida formato y proporción, copia al nombre del guion y deja `capturas/_registro.json` (fecha, tamaño, origen, nota).
5. El resaltado (recuadro rojo) **no** lo dibuja la extensión. Si el paso lo necesita, usa un recorte que lo deje evidente o pasa esa escena a modo automático.

Reglas propias de este modo:

- **La extensión entrega JPEG:** pon `archivo` con `.jpg` en el guion y el mismo nombre en `paso.captura`. `registrar` rechaza un PNG disfrazado o un `.png` que en realidad es JPEG.
- **No es reproducible por sí sola:** el `_registro.json` y las acciones del guion son lo que permite repetirla. Si la pantalla cambia, se re-captura con `registrar` (sobrescribe).
- **Acciones que modifican datos** (guardar, aplicar, enviar, crear) **no se ejecutan** para obtener la captura sin permiso explícito; se captura hasta antes del clic.
- **Una captura se puede reutilizar en varias tareas** solo si es la misma pantalla; pero el prefijo numérico debe seguir el orden del manual, así que prefiere una escena por paso.

## Reglas de las capturas

- **Sin datos personales reales** (nombres, CURP, correos, teléfonos): usa un ambiente de pruebas o mocks. Si una captura los muestra, se descarta.
- **Sin credenciales** en pantalla, ni siquiera ocultas con asteriscos en un campo de inicio de sesión.
- **Un elemento resaltado por captura** cuando el paso trata de un botón o campo. El resto, sin resaltar.
- Resolución 1366×768 (la «recomendada» del manual). En diálogos se recorta al diálogo.
- El nombre del archivo lleva un prefijo numérico de dos dígitos y una descripción (`05-filtros.png`), así el orden de la carpeta sigue al manual.
