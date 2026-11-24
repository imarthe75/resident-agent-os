---
name: backend-endpoint-paginado
description: Crea o ajusta un endpoint de listado paginado en Spring Boot con filtros dinámicos (Specification + Pageable), tamaño de página acotado, ordenamiento por lista blanca, autorización y filtrado por alcance del usuario.
---

# Backend Endpoint Paginado

Aplica las reglas de `backend-base-spring`.

## Activar cuando
- se pida un listado paginado, filtros dinámicos o uso de Specification con Pageable.

## No activar cuando
- la consulta devuelve un solo registro o un catálogo pequeño y acotado por diseño (p. ej. < 50 valores fijos).

## Datos mínimos
- entidad, DTO de filtros, DTO de respuesta, campos filtrables, campos ordenables, permiso de lectura.

## Salida
- `POST /api/<recurso>/search` en el controller, con `@PreAuthorize(..._CONSULTAR)` y `@Valid @RequestBody Filtrar<Entidad>Request`
  (filtros opcionales + `textoLibre` + `@NotNull @Valid PaginadoRequestDTO paginado`; p. ej. `page`, `rows`, `sortBy`, `sortDir`).
- `listarPaginado(filtro)` en el servicio.
- `EntidadSpecifications.filterBy(filtro, alcanceUsuario)`.
- Repository con `JpaSpecificationExecutor`.
- Respuesta `ResponseDto<PaginacionDto<EntidadResponse>>` (lista + `totalElements`, `totalPages`, `currentPage`, `size`).

## Reglas críticas
- **Tamaño acotado:** `@Min(1) @Max(100)` en `rows`/`size`; el servicio vuelve a acotar al máximo aunque el DTO cambie.
- **Orden por lista blanca:** `sortBy` se valida contra un `enum` o `Set` de campos permitidos; nunca se pasa texto del cliente a
  `Sort.by(...)` ni a una consulta.
- **Alcance:** la Specification siempre agrega el filtro de lo que el usuario puede ver (unidad, dueño) y `borrado = false`.
- Filtros null-safe (`cb.conjunction()` cuando no hay valor); texto normalizado (trim, vacío→null) y búsqueda parcial con
  `lower(...) like lower(:valor)` parametrizado, **escapando `%` y `_`** del texto del usuario (una utilidad única de escape).
- El servicio construye `Pageable` y `Specification`; el repository usa `findAll(spec, pageable)`.
- Nunca devolver `Page<Entity>`: mapear a DTO en servicio/mapper.
- Relaciones que se muestran en la tabla: `@EntityGraph` o proyección, para no caer en N+1.
- Errores por `ControllerAdvice` (sin try/catch genérico).

## Checklist
- [ ] `@PreAuthorize` + `@Valid`; tamaño máximo aplicado; `sortBy` fuera de la lista blanca → 400.
- [ ] Filtro de alcance del usuario presente en la Specification.
- [ ] Totales correctos; mapeo a DTO; sin N+1 (revisar el SQL generado en la prueba).

## Documentación obligatoria (en el mismo cambio)
- Cada controlador con `@Tag`; cada endpoint con `@Operation(summary, description)` y `@ApiResponses` que incluyan la respuesta 2xx y las de error que puede devolver (400, 401, 403, 404, 409) con ejemplo; `@Schema` en los DTO con descripción y ejemplo de cada campo.
- Javadoc en clases y métodos públicos de servicio: qué hace, reglas de negocio, parámetros, retorno y excepciones con su código HTTP.
- El contrato OpenAPI que genera springdoc se versiona junto al código y coincide con el endpoint real.
- Plantillas y ejemplos: skill `documentacion-codigo-y-api`.

## Reglas del escáner que esta skill evita
`REPOSITORY-FINDALL-UNPAGINATED`, `JPA-QUERY-IN-LOOP`, `SQL-INJECTION-CONCAT`, `SPRINGBOOT-NATIVE-QUERY-RISK`, `AUTHZ-NO-METHOD-AUTHZ`, `API-ENDPOINT-UNDOCUMENTED`.
Corrección de cada una y el resto del catálogo: skill `prevencion-hallazgos-seguridad-calidad`.
