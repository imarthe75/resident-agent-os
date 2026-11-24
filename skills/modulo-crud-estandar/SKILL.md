---
name: modulo-crud-estandar
description: Receta de punta a punta para crear un módulo CRUD estándar sobre la plantilla base del proyecto (catálogo o entidad con alta, búsqueda paginada, consulta, edición, cambio de estatus, borrado lógico recuperable, auditoría y permisos) en base de datos, backend Spring Boot y frontend Angular/PrimeNG. Úsala cuando se pida un módulo nuevo completo o solo una de sus capas siguiendo el estándar de la plantilla, o para escribir el prompt que se le da a una herramienta de IA para generarlo.
---

# Módulo CRUD estándar

Orquesta las skills de cada capa; no repite su detalle. Aplica `reglas-globales` y `prevencion-hallazgos-seguridad-calidad`.

## Activar cuando
- se pida un módulo nuevo (catálogo o entidad de negocio) completo o por capa sobre la plantilla base;
- se pida el prompt para que una herramienta de IA genere un módulo.

## No activar cuando
- el cambio es una sola pieza dentro de un módulo existente (usa la skill de esa capa).

## 1. Antes de escribir código
Pide o toma del documento de análisis y diseño (si no está, pregunta; no inventes):
- nombre del módulo, recurso (`/api/<recurso-plural>`), ruta del frontend, tabla (`public.<tabla>` o `public.ct_<tabla>` si es catálogo);
- prefijo de permisos (`<MODULO>`) y alcance (completo, solo backend + BD, solo frontend);
- campos: tipo, longitud, obligatorio, único, inmutable al editar, mayúsculas/minúsculas;
- relaciones y de dónde salen sus opciones (lista corta o búsqueda en servidor);
- columnas de la tabla, filtros avanzados y acciones;
- quién puede ver/editar cada registro (propiedad) y si hay registros protegidos del sistema;
- reglas de negocio propias (solo las explícitas y aprobadas son requisito).

Con dudas críticas, pregunta primero; si todo está claro, presenta un plan breve con los archivos a crear y procede.

## 2. Base de datos — `database-liquibase-postgresql`, `postgres-audit`
1. Script idempotente `YYYYMMDD_NNNN_<descripcion>.sql` registrado en `db.changelog-master.yaml`, con encabezado y los 7 bloques
   (tabla y columnas, PK, FK + índice por FK, `COMMENT ON`, semilla con `ON CONFLICT`, triggers, notas de cierre).
2. Columnas canónicas: `id uuid DEFAULT uuidv7()`, `ref`, `activo`, `borrado`, `row_version`, `fecha_*`, `usuario_*`;
   `chk_activo_borrado`; único de negocio **parcial** (`WHERE activo = true AND borrado = false`).
3. Triggers `audit_biu` (activo) y `audit_aiud` (creado y deshabilitado).
4. Alta idempotente de los seis privilegios (`_CREAR`, `_CONSULTAR`, `_EDITAR`, `_ELIMINAR`, `_ACTIVAR`, `_REESTABLECER`) y del menú.

## 3. Backend — `backend-modulo-crud`, `backend-endpoint-paginado`, `backend-persistencia-jpa`
- Piezas, mapa de endpoints, duplicados y borrado recuperable: `backend-modulo-crud`.
- Búsqueda `POST /search` con `PaginadoRequestDTO` + `textoLibre`: `backend-endpoint-paginado`.
- Sin `@SQLRestriction`; `borrado = false` en la `Specification`.
- Concurrencia (`backend-persistencia-jpa` §2): entidad de negocio que editan varias personas → base versionada con `@Version`,
  `rowVersion` en `Actualizar<Entidad>Request` y en la respuesta, 409 al haber conflicto; catálogo → última escritura aceptada y documentada.
- Javadoc y OpenAPI completos (`documentacion-codigo-y-api`); pruebas de servicio y controlador (`backend-pruebas-unitarias`).
- Validación durante el trabajo: `./gradlew test --tests "*<Entidad>*"`. Antes de declarar terminado, la suite completa o el pipeline de CI
  en verde (`verification-before-completion`); una prueba puntual en verde no basta.

## 4. Frontend — `generacion-dtos`, `generacion-servicios`, `generacion-componentes-ts`, `generacion-componentes-html`, `generacion-estilos`
1. Registrar endpoints en `API_ENDPOINTS` (`BASE`, `DETALLE(id)`, `SEARCH`, `CAMBIAR_ESTADO(id)`, `REESTABLECER(id)`), la ruta lazy en
   el archivo de rutas raíz con los guards de autenticación y de menú, y la ficha informativa del módulo si la plantilla la tiene.
2. Estructura `src/app/features/<modulo>/`: `pages/` (Smart), `components/<modulo>-form/` (Dumb), `services/` (+ `.service.spec.ts`),
   `models/<modulo>.model.ts`, `<modulo>.routes.ts`, `README.md`.
3. Servicio con `ApiService` y `.pipe(map((r) => r.data))`: `obtener`, `crear`, `actualizar`, `eliminar`, `cambiarEstado`, `reestablecer`,
   `search`. Sin `HttpClient`, URLs escritas ni toasts en el servicio.
4. Pantalla: encabezado con la ficha informativa del módulo, filtros colapsables, `<p-table [lazy]="true">` (sin segunda carga en `ngOnInit`), acciones
   por fila con `*appIfPermiso`, diálogo de crear/editar/consultar, 409 de registro borrado → ofrecer restablecer si hay permiso.
5. Validar con `npm run build` (configuración de producción) y el spec del servicio; E2E con `bdd-frontend-playwright` cuando aplique.
6. Autenticación: `frontend-auth-oidc` (nunca login simulado ni token en `localStorage`).

## 5. Patrones de módulos viejos que no se copian
| Tema | Estándar vigente | Patrón viejo a evitar |
|---|---|---|
| Búsqueda | `POST /search` paginado en servidor + `<p-table [lazy]>` | `/search` sin paginación y filtrado en el cliente |
| Cambio de estatus | `PATCH /{id}/activo` con `@PreAuthorize(..._ACTIVAR)` | `PATCH` sin permiso, o `PUT` del registro completo |
| Identificadores y borrado | UUIDv7 generado por el proyecto, `chk_activo_borrado`, `borradoEqual(false)` | `@UuidGenerator` (v4), sin restricción, `@SQLRestriction` + `SELECT *` nativo |
| Duplicados | Activo y borrado recuperable en crear **y** actualizar, mensajes de `ErrorConstants` | Solo en crear, mensajes escritos a mano |
| Auditoría | Seis acciones granulares; sin emojis en logs | Tres acciones; emojis en logs |
| Servicio frontend | `API_ENDPOINTS` con `CAMBIAR_ESTADO`/`REESTABLECER` + `.service.spec.ts` | URL concatenada a mano, sin spec |
| UI | Smart/Dumb, sin `CommonModule`, `*appIfPermiso`, errores por el interceptor | Componente único, `CommonModule`, sin permisos, toasts de error a mano |
| Concurrencia | Base versionada con `@Version` en entidades de negocio; catálogos con «última escritura gana» documentado | Versión en la respuesta «para concurrencia» que nunca se compara |
| Pruebas backend | UUID, `@MockitoBean`, `jwt()` con authorities, todo el CRUD | `Long id`, sin authorities, solo `POST` |

## 6. Prompt para herramientas de IA
Las dos plantillas (con documento de análisis y diseño, o con requisitos dados por el desarrollador) están en
[`references/prompts.md`](references/prompts.md).

## Checklist
- [ ] Migración idempotente con `chk_activo_borrado`, único parcial, triggers, privilegios y menú.
- [ ] Siete endpoints con su permiso; 404 para borrados y registros de otra unidad; 409 recuperable con id; restablecer.
- [ ] `@Version` en entidades de negocio editadas por varias personas (prueba de 409); catálogos sin él solo con la decisión documentada.
- [ ] Sin `@SQLRestriction`; búsqueda paginada con `LIKE` escapado; auditoría que nunca se pierde en silencio.
- [ ] Frontend registrado (`API_ENDPOINTS`, ruta con guards, ficha del módulo); tabla lazy con una sola carga; acciones con `*appIfPermiso`.
- [ ] Javadoc, OpenAPI, `COMMENT ON` y README del módulo en el mismo cambio.
- [ ] Pruebas del módulo en verde y suite completa o CI en verde antes de declarar terminado.

## Documentación obligatoria (en el mismo cambio)
- `COMMENT ON` de tabla, columnas y restricciones en la migración.
- Javadoc en clases y métodos públicos; `@Tag`, `@Operation` y `@ApiResponses` con ejemplos en cada endpoint (`documentacion-codigo-y-api`).
- `README.md` del feature con propósito, dependencias y bitácora de cambios estructurales.

## Reglas del escáner que esta skill evita
`AUTHZ-NO-METHOD-AUTHZ`, `REQUESTBODY-WITHOUT-VALID`, `MASS-ASSIGNMENT-ENTITY-BINDING`, `ENTITY-RETURNED-FROM-CONTROLLER`, `CONTROLLER-INJECTS-REPOSITORY`, `REPOSITORY-FINDALL-UNPAGINATED`, `API-ENDPOINT-UNDOCUMENTED`, `SQL-PK-NOT-UUID`, `SQL-TABLE-WITHOUT-AUDIT-COLUMNS`, `SQL-SOFT-DELETE-NO-CHECK`, `JPA-SQLRESTRICTION-SOFT-DELETE`, `SWALLOWED-ERROR`, `ANGULAR-LAZYLOAD-PLUS-INIT-LOAD`, `ANGULAR-SUBSCRIBE-NO-CLEANUP`, `FRONTEND-HARDCODED-API-URL`, `DESTRUCTIVE-ACTION-NO-CONFIRM`.
Corrección de cada una y el resto del catálogo: skill `prevencion-hallazgos-seguridad-calidad`.
