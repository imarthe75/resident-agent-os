# Catálogo de escenarios de prueba (antes de escribir una sola prueba)

Un catálogo exhaustivo primero y la prioridad después: priorizar no es quitar casos. Se arma desde el requerimiento **y** desde el código
(validadores, restricciones de la base, reglas de negocio implementadas), porque lo que el código valida es comprobable aunque el
criterio de aceptación no lo mencione.

## 1. Matriz de restricciones
Una fila por campo o acción; cada fila produce al menos un escenario.

| Restricción | Origen (archivo o criterio) | Dónde se valida (pantalla, servidor o ambos) | Valores límite | Señal de error |
|---|---|---|---|---|

Los límites se prueban **por debajo, en y por encima** (o inválido, exacto y válido). Lo que depende de «hoy» (edades, vigencias) se
prueba con el reloj fijado, para que el resultado no cambie según el día.

## 2. Categorías que siempre se cubren
Saltar una exige escribir por qué (por ejemplo, «no aplica: pantalla de solo consulta»).

| Clave | Categoría | Qué incluye |
|---|---|---|
| CF | Camino feliz | Éxito principal y su resultado observable (navegación, mensaje, estado en pantalla) |
| VAC | Obligatorios y vacíos | Vacío; solo espacios en textos |
| FMT | Formato y tipo | Tipo equivocado, patrón inválido, caracteres no permitidos |
| LIM | Límites | Mínimos y máximos de longitud, tamaño, cantidad y fechas |
| RN | Reglas de negocio | Las del requerimiento y las que aplica el código |
| SRV | Errores del servidor | 4xx de negocio, 5xx, petición cancelada; uno por señal distinta |
| AUT | Autorización | Sin sesión, rol equivocado, datos de otro usuario o de otra unidad |
| EST | Estado | Corregir tras un error, reenviar, regresar, doble envío |
| REG | Regresión | Lo que el requerimiento dice que no debe romperse |
| ACC | Accesibilidad básica | Nombre accesible del control principal; envío del formulario con teclado |

Un comportamiento observable es **un** escenario: si un caso es a la vez VAC y RN, se deja uno y se anotan ambas claves.

## 3. Capa de prueba y política de dobles
| Capa | Cuándo | Dónde corre |
|---|---|---|
| E2E (navegador) | Flujos críticos de varios pasos, autorización, estado entre pantallas, lo que solo un navegador demuestra | Suite de Playwright |
| API | Códigos de estado, forma del error, permisos de un endpoint | Pruebas de API |
| Unitaria | Permutaciones de validación, reglas del modelo, lógica de servicio | Suite unitaria del proyecto |

| Política | Cuándo |
|---|---|
| Sin dobles | Todo lo de **esta** aplicación en el camino feliz: no se simula el propio backend |
| Doble de terceros | Servicios externos (IA, pagos, correo): siempre simulados o detenidos en el ambiente de pruebas |
| Error simulado en la pantalla | Solo para probar cómo la pantalla maneja un 4xx/5xx; se acompaña de un caso en el servidor |
| Reloj fijado | Casos que dependen de la fecha |

## 4. Cada escenario lleva
- Id estable (`E2E-LIM-03`) que coincide con el título de la prueba, prioridad P0/P1/P2, capa y política de dobles.
- Precondiciones, pasos y resultado esperado.
- Trazabilidad: el requisito (`@RF-01`) o la restricción que cubre; el verificador `spec_traceability` busca ese id en las pruebas.

## Excusas frecuentes
| Excusa | Realidad |
|---|---|
| «El camino feliz basta para la primera versión» | El catálogo es completo; la prioridad decide el orden, no qué existe |
| «El criterio no menciona la longitud máxima» | El validador del código la define: se prueba |
| «Los límites los agrego al escribir las pruebas» | Van en el catálogo ahora; después se olvidan |
| «Un solo caso de "falla la carga" cubre todo» | Una señal por caso (tipo, tamaño, 401, 5xx): son aserciones distintas |
| «Me falta una regla: la supongo» | Se anota como pregunta abierta; nunca se inventa una regla de negocio |
