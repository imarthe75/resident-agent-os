---
name: backend-soporte-api
description: Infraestructura transversal de API en Spring Boot — Constant, ResponseDto/ErrorDetailDto y GlobalExceptionHandler (@RestControllerAdvice) con mapeo correcto de códigos HTTP y sin fuga de información interna.
---

# Backend Soporte API

## Activar cuando
- se cree o amplíe `Constant`, `ResponseDto`/`ErrorDetailDto` o el `GlobalExceptionHandler`.

## No activar cuando
- el pedido sea un CRUD completo o un endpoint paginado (esas skills reutilizan lo de aquí).

## Salida
- `Constant.java` actualizado (sin duplicados, `MAYUSCULAS_CON_GUION_BAJO`).
- `ResponseDto<T>` (`responseCode`, `responseMessage`, `data`, `errorList`) y `ErrorDetailDto` (`campo`, `mensaje`).
- `GlobalExceptionHandler` con los handlers de la tabla.

## Mapeo de excepciones
| Excepción | HTTP | Mensaje al cliente |
|---|---|---|
| `GenericErrorException` | 400 (o el código que traiga: 404/409) | el de negocio |
| `MethodArgumentNotValidException`, `HandlerMethodValidationException` | 400 | un `ErrorDetailDto` por campo |
| `HttpMessageNotReadableException` / error de JSON | 400 | «Cuerpo de la petición inválido» (sin detalle del parser) |
| `AuthenticationException` | 401 | «No autenticado» |
| `AccessDeniedException` / `AuthorizationDeniedException` | 403 | «Sin permiso» |
| `ObjectOptimisticLockingFailureException` | 409 | «El registro fue modificado por otro usuario; recargue» |
| `DataIntegrityViolationException` | 409 | mensaje genérico de duplicado/relación (sin el texto de la base de datos) |
| `MaxUploadSizeExceededException` | 413 | «Archivo demasiado grande» |
| `Exception` | 500 | «Error interno» + id de correlación |

## Reglas críticas
- **Nunca** enviar al cliente `e.getMessage()`, la traza, nombres de clase, SQL ni el texto de la base de datos.
  Cada handler registra la excepción completa con `log.error("...", e)` (o `warn` para 4xx esperados) junto con el id de correlación.
- `server.error.include-stacktrace=never`, `server.error.include-message=never`, `server.error.include-exception=false`.
- No modificar endpoints ni rutas al implementar el manejo global.
- Reutilizar códigos y mensajes de `Constant`; no hardcodear mensajes en controllers ni servicios.

## Checklist
- [ ] Error de validación devuelve la estructura estándar con un detalle por campo.
- [ ] 401/403/409 mapeados (no caen en 500).
- [ ] Ninguna respuesta de error contiene traza, mensaje interno ni SQL; el log sí tiene la traza.
- [ ] Sin mensajes ni códigos repetidos como literales.

Identificadores de regla en escáneres que los detectan: `STACK-TRACE-EXPOSURE`, `SWALLOWED-ERROR`.

## Documentación obligatoria (en el mismo cambio)
- Cada controlador con `@Tag`; cada endpoint con `@Operation(summary, description)` y `@ApiResponses` que incluyan la respuesta 2xx y las de error que puede devolver (400, 401, 403, 404, 409) con ejemplo; `@Schema` en los DTO con descripción y ejemplo de cada campo.
- Javadoc en clases y métodos públicos de servicio: qué hace, reglas de negocio, parámetros, retorno y excepciones con su código HTTP.
- El contrato OpenAPI que genera springdoc se versiona junto al código y coincide con el endpoint real.
- Plantillas y ejemplos: skill `documentacion-codigo-y-api`.

## Reglas del escáner que esta skill evita
`STACK-TRACE-EXPOSURE`, `SWALLOWED-ERROR`.
Corrección de cada una y el resto del catálogo: skill `prevencion-hallazgos-seguridad-calidad`.
