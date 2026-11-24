# Fase 2 — Contraste de reglas de negocio contra back y front

**Por qué existe.** Los manuales vigentes describen lo que dice el requerimiento, no lo que hace el sistema. En Variables del sistema, la especificación dice «prohibido borrar», pero el sistema tiene Eliminar y Restablecer, y el manual vigente documenta Eliminar sin advertir la contradicción. Un manual tiene que describir el **comportamiento real**, y las diferencias tienen que llegar a quien decide.

## Entradas

1. **`reglas_negocio.md`**: lo entrega el usuario o el analista. Se toma de la especificación, los requerimientos, las minutas o la especificación de campos (ART-F2-08). Plantilla: `references/plantillas/reglas_negocio.template.md`. **Si no existe, se pide; no se inventa.** Si el usuario solo tiene una especificación (como `front/.agents/specs/<módulo>/*.md`), la IA puede convertirla a la tabla, citando la sección de origen, y el usuario la confirma antes de seguir.
2. **`evidencia.md`**: se genera, nunca se escribe a mano.
   ```bash
   node scripts/evidencia.js --repo <raíz del sistema> --front front/src/app/features/<feature> --back <PrefijoJava> --out <trabajo>/evidencia.md
   ```
   Es un índice de **dónde mirar**: validaciones de formulario, mensajes, botones, tooltips, controles deshabilitados, endpoints, anotaciones de DTO, excepciones con su mensaje y constantes de error resueltas a texto.

## Procedimiento (la IA)

Para **cada** regla de `reglas_negocio.md`:

1. Busca en `evidencia.md` los renglones relacionados y **abre el archivo en esa línea** para confirmar (el índice puede engañar: un `Validators.required` puede estar en un filtro y no en el formulario).
2. Decide el estado:

| Estado | Cuándo | Citable |
|---|---|:-:|
| `confirmada` | El front **y** el back la aplican como dice la regla | sí |
| `solo_front` | Solo la interfaz la aplica (paginación, máscaras, longitud, confirmación visual) | sí |
| `solo_back` | Solo el back la aplica; el usuario la ve como mensaje al guardar | sí |
| `discrepancia` | El código hace **otra cosa** que la regla (o la hace distinta) | **no** |
| `no_implementada` | No hay rastro en el código | **no** |
| `solo_vista_previa` | El control cambia solo la vista previa; el sistema real no lo aplica. Se documenta como limitación («solo cambia la vista previa») | sí |
| `sin_efecto` | El control existe pero no cambia nada, ni en el sistema ni en la vista previa. Va a Hallazgos | **no** |
| `decidida` | Era discrepancia y **un humano** escribió qué se documenta | sí |

3. Después recorre la evidencia en sentido inverso: todo comportamiento visible para el usuario que no esté en `reglas_negocio.md` (restricciones, duplicados, restablecer, confirmaciones) se agrega como **`no_documentada`**, que es citable porque el sistema lo hace. La hoja de validación avisa al analista para que lo agregue a su fuente.
4. Escribe `reglas_contrastadas.md` con la plantilla `references/plantillas/reglas_contrastadas.template.md`. La evidencia va como ``ruta:línea`` o ``ruta:inicio-fin``, relativa a la raíz del sistema, separada por `;`.
5. Valida (compuerta):
   ```bash
   node scripts/validar_reglas.js --reglas <trabajo>/reglas_contrastadas.md --repo <raíz del sistema>
   ```
   Verifica estados, que la evidencia sea coherente con el estado y que cada archivo y línea exista.

### Evidencia dinámica (`prueba:`)

Cuando la regla es «este campo llega al resultado» y leer el código no basta, se comprueba cambiando **un campo a la vez** y midiendo el resultado (modelo: `verificar_campos.py` del Login Manager, solo lectura). Se cita como `prueba:<script>@AAAA-MM-DD` en la columna Front o Back según lo que mida. Reglas: la fecha es obligatoria; la prueba **no** puede escribir en el sistema; si cambia el código medido, se repite. Es evidencia complementaria: lo que el usuario ve en pantalla se sigue confirmando en la Fase 3.

## Lo que la IA NUNCA hace

- **No resuelve discrepancias.** `decidida` solo se usa si el usuario escribió la decisión en la conversación o en el archivo. Se cita como «Decisión: <quién>, <qué se documenta>».
- **No cita evidencia sin abrir el archivo.**
- **No convierte una discrepancia en `solo_front` o `solo_back`** para poder documentarla.
- **No documenta lo no citable.** El manual describe los pasos con lo que se ve en pantalla, pero no presenta esa conducta como regla ni la explica. Ejemplo: en Variables, los filtros se describen con los campos visibles, pero RN-01 no se cita.

## Cómo se usa en el manual

- Toda viñeta de `tarea.reglas` (que se imprime como «Importante:») lleva el prefijo `[RN-xx]`. **Sin prefijo, `render.js` rechaza el payload.**
- `paso.nota` y `consideraciones` pueden llevar `[RN-xx]`; `mensaje.regla` y `pregunta.regla` llevan el id sin corchetes.
- El prefijo no se imprime: es trazabilidad.
- `render.js --reglas` rechaza la cita a un id inexistente o no citable. La hoja de validación muestra la cobertura: las reglas citables que no se citaron y las discrepancias pendientes de decisión.

## Hallazgos

Al final de `reglas_contrastadas.md`, en la sección «Hallazgos para el equipo», van las discrepancias y las validaciones que solo existen en el front (riesgo de que entren datos inválidos por la API). **No van al manual**; se le reportan al usuario al terminar.
