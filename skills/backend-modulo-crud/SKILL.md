---
name: backend-modulo-crud
description: Genera un módulo CRUD completo en Spring Boot (controller, service, repository, specifications, DTOs, entidad y migración) con autorización por endpoint, validación, borrado lógico recuperable, cambio de estatus, búsqueda paginada y pruebas. Úsala cuando se pida un módulo nuevo con altas, bajas, cambios y consultas de una entidad.
---

# Backend Módulo CRUD

Aplica todas las reglas de `backend-base-spring`. Esta skill fija qué piezas se generan y qué no puede faltar en cada una.

## Activar cuando
- se pida un CRUD completo de una entidad o un módulo nuevo con altas, bajas, cambios y consulta.

## No activar cuando
- el pedido sea una sola capa o solo una búsqueda paginada (`backend-endpoint-paginado`).

## Datos mínimos que se piden antes de generar
- nombre de la entidad, recurso (`/api/<recurso-plural>`), tabla y prefijo de permisos (p. ej. `SEDE`);
- campos, tipos, obligatorios, únicos, inmutables al editar y si van en mayúsculas;
- relaciones (siempre por id + relación LAZY de solo lectura, ver `backend-persistencia-jpa`);
- quién puede ver/editar cada registro (regla de propiedad: dueño, unidad administrativa, rol);
- si hay registros protegidos del sistema que no se editan, eliminan ni cambian de estatus.

La receta completa de punta a punta (base de datos, backend, frontend, pruebas y prompt para IA) está en la skill `modulo-crud-estandar`.

## Salida
| Pieza | Debe incluir |
|---|---|
| `<Entidad>Controller` | Un `@PreAuthorize` por endpoint (tabla de abajo); `@Valid` en cada body; `ResponseEntity<ResponseDto<T>>`; OpenAPI con 400/401/403/404/409; sin `try/catch` |
| `<Entidad>Service` | Transacciones lectura/escritura; el generador de UUIDv7 del proyecto para `id` y `ref`; normalización (trim, vacío→null, mayúsculas en códigos); unicidad en crear **y** actualizar; comprobación de propiedad; evento de auditoría |
| `<Entidad>Repository` + `<Entidad>Specifications` | `JpaRepository<Entidad, UUID>` + `JpaSpecificationExecutor`; filtros null-safe, `LIKE` escapado y `borradoEqual(false)` siempre; `@EntityGraph` en relaciones que se muestran |
| `Crear<Entidad>Request` / `Actualizar<Entidad>Request` / `Filtrar<Entidad>Request` | Solo campos editables (sin `id`, auditoría ni `activo`/`borrado`); Jakarta Validation; el filtro compone `PaginadoRequestDTO` |
| `<Entidad>Response` | `record` con método estático `from<Entidad>(...)` (o el mapeador que ya use el proyecto; no mezclar dos); sin datos internos ni de otras unidades; con id **y** nombre de cada relación |
| Envolventes OpenAPI | `<Entidad>ResponseEnvelopeDoc`, `<Entidad>ListResponseEnvelopeDoc`, `ErrorResponseEnvelopeDoc` con ejemplos |
| Entidad | Extiende la entidad base de auditoría; sin `@SQLRestriction`; concurrencia según `backend-persistencia-jpa` §2 |
| Migración Liquibase | Según `database-liquibase-postgresql`: UUIDv7, `ref`, `activo`/`borrado` con `chk_activo_borrado`, único parcial, auditoría, `COMMENT ON`, triggers, alta idempotente de los seis privilegios y del menú |
| Pruebas | Servicio (feliz, duplicado activo, duplicado borrado, no existe, eliminar ya borrado, restablecer no borrado) y controlador (403 sin permiso por endpoint) — `backend-pruebas-unitarias` |

## Endpoints
| Operación | Método y ruta | Respuesta | Permiso |
|---|---|---|---|
| Crear | `POST /api/<recurso>` | 201; 409 duplicado | `<MODULO>_CREAR` |
| Buscar paginado | `POST /api/<recurso>/search` (`backend-endpoint-paginado`) | 200 `PaginacionDTO` | `<MODULO>_CONSULTAR` |
| Consultar | `GET /api/<recurso>/{id}` | 200; 404 si no existe, está borrado o es de otra unidad | `<MODULO>_CONSULTAR` |
| Actualizar | `PUT /api/<recurso>/{id}` | 200; 404; 409 duplicado o conflicto de versión | `<MODULO>_EDITAR` |
| Cambiar estatus | `PATCH /api/<recurso>/{id}/activo` | 200 (invierte `activo`, no toca `borrado`) | `<MODULO>_ACTIVAR` |
| Eliminar | `DELETE /api/<recurso>/{id}` | 200 (`activo = false`, `borrado = true`); 409 si ya estaba borrado o tiene dependientes | `<MODULO>_ELIMINAR` |
| Restablecer | `POST /api/<recurso>/{id}/reestablecer` | 200 (`borrado = false`, `activo = true`); 400 si no estaba borrado | `<MODULO>_REESTABLECER` |

- No existe «GET de todos» sin paginar, salvo un catálogo pequeño que la pantalla necesita completo (y entonces con permiso y límite).
- Cambiar estatus nunca se hace con un `PUT` del registro completo.
- Un registro de otra unidad o dueño responde 404 (no 403) para no confirmar que existe.

## Duplicados y borrado recuperable
- Duplicado activo → 409 (`ErrorConstants.DUPLICADO_ACTIVO`).
- Duplicado borrado lógicamente → 409 con el id del borrado en `data` (`RegistroBorradoLogicoException`), para que el frontend ofrezca
  restablecerlo **si el usuario tiene `<MODULO>_REESTABLECER`**. Solo se devuelve el id, nunca el registro.
- `obtener(id)` excluye borrados (404); solo eliminar y restablecer consultan incluyéndolos.
- Mensajes desde `ErrorConstants`, nunca texto escrito en el servicio.

## Reglas críticas
- Nada de `try/catch` genérico en el controller; los errores van al `GlobalExceptionHandler` (`backend-soporte-api`). Sin `RuntimeException`
  ni `IllegalArgumentException` directas desde negocio.
- Auditoría de negocio con acciones granulares (`_CREADO`, `_MODIFICADO`, `_ACTIVADO`, `_INACTIVADO`, `_ELIMINADO`, `_REESTABLECIDO`) y llaves
  de `AuditConstants`. Si un fallo de auditoría no debe deshacer la operación, el `catch` que la envuelve **registra el error con su traza**
  (`log.error(..., e)`); un `catch` vacío es `SWALLOWED-ERROR` y una auditoría perdida sin rastro.
- Registros protegidos del sistema: el servicio rechaza editar, eliminar o cambiar su estatus con 403 y expone un endpoint de restricciones
  que el frontend consulta para deshabilitar esas acciones.
- No duplicar clases existentes; reutilizar `Constant`, `ErrorConstants`, `ResponseDto`, `PaginadoRequestDTO`/`PaginacionDTO` y la entidad base.
- No copiar patrones de módulos viejos del proyecto (lista en `modulo-crud-estandar`).

## Checklist
- [ ] Compila y las pruebas pasan.
- [ ] Cada endpoint con `@PreAuthorize`; existe prueba de 403 para un rol sin permiso.
- [ ] `@Valid` en cada body; DTOs sin campos de asignación masiva.
- [ ] Concurrencia según `backend-persistencia-jpa` §2; borrado lógico recuperable (409 con id, restablecer); búsqueda paginada.
- [ ] Seis privilegios (`_CREAR`, `_CONSULTAR`, `_EDITAR`, `_ELIMINAR`, `_ACTIVAR`, `_REESTABLECER`) dados de alta en la migración.
- [ ] Contrato OpenAPI alineado con el endpoint real.
- [ ] Sin acceso directo Controller → Repository.

## Documentación obligatoria (en el mismo cambio)
- Cada controlador con `@Tag`; cada endpoint con `@Operation(summary, description)` y `@ApiResponses` que incluyan la respuesta 2xx y las de error que puede devolver (400, 401, 403, 404, 409) con ejemplo; `@Schema` en los DTO con descripción y ejemplo de cada campo.
- Javadoc en clases y métodos públicos de servicio: qué hace, reglas de negocio, parámetros, retorno y excepciones con su código HTTP.
- El contrato OpenAPI que genera springdoc se versiona junto al código y coincide con el endpoint real.
- Plantillas y ejemplos: skill `documentacion-codigo-y-api`.

## Reglas del escáner que esta skill evita
`AUTHZ-NO-METHOD-AUTHZ`, `REQUESTBODY-WITHOUT-VALID`, `MASS-ASSIGNMENT-ENTITY-BINDING`, `ENTITY-RETURNED-FROM-CONTROLLER`, `CONTROLLER-INJECTS-REPOSITORY`, `JPA-ENTITY-MISSING-VERSION`, `REPOSITORY-FINDALL-UNPAGINATED`, `API-ENDPOINT-UNDOCUMENTED`, `SQL-PK-NOT-UUID`, `SQL-TABLE-WITHOUT-AUDIT-COLUMNS`, `SQL-SOFT-DELETE-NO-CHECK`, `JPA-SQLRESTRICTION-SOFT-DELETE`, `SWALLOWED-ERROR`.
Corrección de cada una y el resto del catálogo: skill `prevencion-hallazgos-seguridad-calidad`.
