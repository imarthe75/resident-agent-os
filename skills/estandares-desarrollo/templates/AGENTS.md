# Instrucciones para agentes de IA

## Proyecto
- **Qué es:** _(llenar)_
- **Stack:** _(lenguajes, frameworks y versiones fijadas en los manifiestos)_
- **Cómo se levanta y se prueba:** _(comandos)_
- **Servicios externos:** _(base de datos, proveedor de identidad, colas; sin credenciales)_

## Reglas obligatorias
1. **Código real desde el primer commit.** Sin datos simulados, respuestas fijas, maquetas, `TODO`, funciones vacías ni código comentado en
   el código de la aplicación. Los mocks solo viven en pruebas o en un simulador exclusivo de ambiente local. Si falta una dependencia, se
   programa contra su contrato real y la tarea queda PARCIAL.
2. **Credenciales nunca en el repositorio** (código, configuración, SQL, pruebas, documentación, commits). Variables de entorno o gestor de
   secretos, sin valores por omisión.
3. **Documentación en el mismo cambio:** Javadoc/TSDoc/docstrings en la API pública; contrato OpenAPI/Swagger completo en cada endpoint
   (resumen, parámetros, respuestas 2xx y de error con ejemplos); `COMMENT ON` en cada objeto de base de datos; README por módulo; ADR por
   decisión técnica.
4. **Seguridad:** autenticación delegada al proveedor OIDC; autorización en cada endpoint y validación de propiedad del recurso; validación
   de toda entrada; errores sin trazas ni mensajes internos; cero hallazgos nuevos del escáner de seguridad por Merge Request.
5. **Base de datos:** solo migraciones versionadas e idempotentes; PK `uuid DEFAULT uuidv7()`; `timestamptz`, `jsonb`, `numeric` para montos;
   columnas canónicas y triggers de auditoría.
6. **Estándares por lenguaje:** Java/Spring Boot, Angular/TypeScript, Python y SQL según `rules/` y las skills del stack.
7. **Pruebas:** cada regla con un caso que pasa y otro que falla; pruebas de 401/403/409 en la API; contra bases desechables, nunca contra un
   ambiente compartido.
8. **Proceso (evidencia CMMI V3.0 / ISO 27001):** cada cambio nace de un requisito trazable, entra por Merge Request revisado por otra
   persona, con CI en verde; las entregas se etiquetan.
9. **Entrega honesta:** antes de decir «listo», ejecutar pruebas y escáner y mostrar la salida real; lo no verificado se declara como tal.
   Estado: COMPLETADO / PARCIAL (con % real) / FALLIDO.

## Skills
Carga `reglas-globales` y `estandares-desarrollo` al empezar, y `prevencion-hallazgos-seguridad-calidad` antes de escribir o revisar código
(cada regla del escáner con su corrección y la lista de chequeo de entrega); el resto según la tarea (ver la tabla de `estandares-desarrollo`).
