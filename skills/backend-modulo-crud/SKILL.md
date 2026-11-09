---
name: backend-modulo-crud
description: Genera un módulo CRUD completo en Spring Boot (controller, service, repository, DTOs, mapper, entidad y migración) con autorización por endpoint, validación, concurrencia optimista, borrado lógico, listado paginado y pruebas. Úsala cuando se pida un módulo nuevo con altas, bajas, cambios y consultas de una entidad.
---

# Backend Módulo CRUD

Aplica todas las reglas de `backend-base-spring`. Esta skill fija qué piezas se generan y qué no puede faltar en cada una.

## Activar cuando
- se pida un CRUD completo de una entidad o un módulo nuevo con altas, bajas, cambios y consulta.

## No activar cuando
- el pedido sea una sola capa o solo una búsqueda paginada (`backend-endpoint-paginado`).

## Datos mínimos que se piden antes de generar
- nombre de la entidad, endpoint base y permiso base (p. ej. `CATALOGO_SEDES`);
- campos, tipos, obligatorios, únicos e inmutables;
- relaciones (siempre por id + relación LAZY de solo lectura, ver `backend-persistencia-jpa`);
- quién puede ver/editar cada registro (regla de propiedad: dueño, unidad administrativa, rol).

## Salida
| Pieza | Debe incluir |
|---|---|
| `EntidadController` | Un `@PreAuthorize` por endpoint (`_LEER`, `_CREAR`, `_EDITAR`, `_ELIMINAR`); `@Valid` en cada body; `ResponseEntity<ResponseDto<T>>`; OpenAPI con 400/403/404/409 |
| `EntidadService` | Transacciones lectura/escritura; validación de unicidad (409) e integridad (`backend-integridad-negocio`); comprobación de propiedad cuando el id viene del cliente; evento de auditoría de negocio |
| `EntidadRepository` | `JpaRepository<Entidad, UUID>` + `JpaSpecificationExecutor` |
| `EntidadCreateRequest` / `EntidadUpdateRequest` | Solo campos editables por el usuario (sin `id`, auditoría ni flags de borrado); Jakarta Validation; `rowVersion` solo en el de actualización |
| `EntidadResponse` | Campos visibles (sin datos internos ni de otras unidades) + `rowVersion` |
| `EntidadMapper` | MapStruct; el mapeo de actualización ignora `id`, auditoría y `borrado` |
| Entidad | Extiende la entidad base de auditoría; `@Version` en `rowVersion`; `@SQLRestriction("borrado = false")` |
| Migración Liquibase | Según `database-liquibase-postgresql` (UUID `uuidv7()`, `activo`/`borrado`, `row_version`, triggers de auditoría, índices de FK) |
| Pruebas | Servicio (caso feliz, duplicado, no existe, conflicto de versión) y autorización por rol (403 sin permiso) — `backend-pruebas-unitarias` |

## Endpoints
| Operación | Método y ruta | Permiso |
|---|---|---|
| Crear | `POST /entidades` → 201 | `_CREAR` |
| Actualizar | `PUT /entidades/{id}` (body con `rowVersion`) → 200 / 409 | `_EDITAR` |
| Consultar | `GET /entidades/{id}` → 200 / 404 | `_LEER` |
| Listar | `POST /entidades/listar` paginado (`backend-endpoint-paginado`) | `_LEER` |
| Eliminar | `DELETE /entidades/{id}` → borrado lógico (`borrado = true`) | `_ELIMINAR` |

- No existe «GET de todos» sin paginar.
- Eliminar nunca borra físicamente; valida antes que no haya dependientes activos.
- Un registro de otra unidad o dueño responde 404 (no 403) para no confirmar que existe.

## Reglas críticas
- Nada de `try/catch` genérico en el controller; los errores van al `GlobalExceptionHandler` (`backend-soporte-api`).
- No duplicar clases existentes; reutilizar `Constant`, `ResponseDto`, mapper base y entidad base.
- Las cadenas de texto se normalizan (trim, vacío→null) en el servicio antes de validar unicidad.

## Checklist
- [ ] Compila y las pruebas pasan.
- [ ] Cada endpoint con `@PreAuthorize`; existe prueba de 403 para un rol sin permiso.
- [ ] `@Valid` en cada body; DTOs sin campos de asignación masiva.
- [ ] `@Version` + 409; borrado lógico; listado paginado.
- [ ] Contrato OpenAPI alineado con el endpoint real.
- [ ] Sin acceso directo Controller → Repository.

## Documentación obligatoria (en el mismo cambio)
- Cada controlador con `@Tag`; cada endpoint con `@Operation(summary, description)` y `@ApiResponses` que incluyan la respuesta 2xx y las de error que puede devolver (400, 401, 403, 404, 409) con ejemplo; `@Schema` en los DTO con descripción y ejemplo de cada campo.
- Javadoc en clases y métodos públicos de servicio: qué hace, reglas de negocio, parámetros, retorno y excepciones con su código HTTP.
- El contrato OpenAPI que genera springdoc se versiona junto al código y coincide con el endpoint real.
- Plantillas y ejemplos: skill `documentacion-codigo-y-api`.

## Reglas del escáner que esta skill evita
`AUTHZ-NO-METHOD-AUTHZ`, `REQUESTBODY-WITHOUT-VALID`, `MASS-ASSIGNMENT-ENTITY-BINDING`, `ENTITY-RETURNED-FROM-CONTROLLER`, `CONTROLLER-INJECTS-REPOSITORY`, `JPA-ENTITY-MISSING-VERSION`, `REPOSITORY-FINDALL-UNPAGINATED`, `API-ENDPOINT-UNDOCUMENTED`, `SQL-PK-NOT-UUID`, `SQL-TABLE-WITHOUT-AUDIT-COLUMNS`.
Corrección de cada una y el resto del catálogo: skill `prevencion-hallazgos-seguridad-calidad`.
