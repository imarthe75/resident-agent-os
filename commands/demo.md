---
description: Muestra una funcionalidad funcionando contra los criterios de aceptación de su especificación (no un resumen)
---

Demuestra en ejecución: $ARGUMENTS (requisito, especificación, endpoint o pantalla). Si no se indica, el cambio en curso.

1. Lee la especificación y lista los escenarios a mostrar a partir de sus criterios de aceptación (camino principal, un alterno y un
   rechazo por regla o permiso como mínimo).
2. Levanta lo necesario en local o en un ambiente desechable, nunca contra producción ni con datos reales.
3. Por cada escenario: ejecútalo (navegador para pantallas, `curl` para API), muestra el resultado y compáralo con lo que dice el
   criterio. Usa el usuario del actor de cada caso, no un administrador.
4. Deshaz lo que hayas creado.
5. Cierra con una tabla: escenario, criterio, resultado observado, coincide (sí/no).

Un análisis o un resumen no es una demostración. Si algo impide ejecutar, di exactamente qué falta para continuar.
