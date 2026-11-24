---
name: backend-base-spring
description: Reglas base obligatorias para cualquier cambio de backend Spring Boot (plantilla base, Spring Boot 4 / Java 21) — capas Controller→Service→Repository, autorización por método, DTOs validados, ResponseDto, concurrencia optimista, manejo de errores sin fuga de información y logging seguro. Úsala al generar o revisar controller, service, repository, dto o configuración.
---

# Backend Base Spring

Reglas que aplican a todo cambio de backend. Las skills `backend-modulo-crud`, `backend-endpoint-paginado`, `backend-soporte-api`,
`backend-persistencia-jpa` y `backend-seguridad` las dan por hechas.

## Activar cuando
- se genere o modifique un controller, service, repository, DTO, entidad o configuración Spring;
- se pida estandarizar un módulo existente.

## No activar cuando
- el pedido sea un CRUD completo (`backend-modulo-crud`), un listado paginado (`backend-endpoint-paginado`) o solo la infraestructura de
  respuestas y errores (`backend-soporte-api`). Esas skills ya incluyen estas reglas.

## Stack de referencia (ejemplo; en un proyecto nuevo las versiones se resuelven con `scripts/latest_versions.py`)
Spring Boot 4.0.x, Java 21, Gradle, Spring Security como OAuth2 Resource Server contra el proveedor OIDC (p. ej. Authentik, Keycloak), Liquibase (`ddl-auto=none`),
springdoc-openapi 3, Lombok. Cambios de Spring Boot 4 en `java-springboot`.

## Reglas críticas

### Capas
- Controller -> Service -> Repository. El controller no tiene lógica de negocio ni inyecta repositorios.
- Inyección por constructor con campos `final` (`@RequiredArgsConstructor`). Nunca `@Autowired` sobre campos.
- `@Transactional` solo en servicios: `readOnly = true` en lecturas, normal en escrituras. Nunca en controllers.
- Un método que escribe en dos o más repositorios va dentro de una sola transacción.

### Autorización (obligatoria en cada endpoint)
- `@EnableMethodSecurity` activo y **todo** método público de controller lleva `@PreAuthorize` con un permiso o rol explícito:
  `@PreAuthorize("hasAuthority(T(com.ejemplo.app.util.Permisos).CATALOGO_CONSULTAR)")`.
- Los nombres de permiso salen de una clase de constantes, no de literales repetidos.
- Un endpoint público por diseño se declara así (`permitAll` en la `SecurityFilterChain` + comentario con el motivo). Nunca se deja
  sin anotación «porque ya está autenticado».
- Nunca comentar un `@PreAuthorize` para probar; si estorba en desarrollo se usa un perfil con usuario de prueba.
- **Propiedad del recurso:** cuando el id viene del cliente (`@PathVariable`/body), el servicio comprueba que el usuario autenticado
  puede ver o tocar *ese* registro (dueño, unidad administrativa, rol). Tener el permiso del módulo no basta.

### Entrada
- Los endpoints reciben y devuelven DTOs; nunca entidades JPA.
- `@Valid` en todo `@RequestBody` y en parámetros compuestos. DTOs con anotaciones Jakarta restrictivas (`@NotBlank`, `@Size`,
  `@Pattern`, `@Min/@Max`).
- El DTO de entrada no trae `id`, campos de auditoría (`usuario_creacion`, fechas) ni `rowVersion` salvo que el caso lo exija
  (asignación masiva). El servicio los asigna.
- Fechas como `OffsetDateTime` (`LocalDate` si es solo fecha), nunca `String` libre. Las columnas son `TIMESTAMPTZ`.
- Estados, tipos y canales son `enum`; nunca se comparan literales de texto (`"ACTIVO".equals(...)`).
- Carga de archivos: validar tamaño, extensión **y** tipo real (firma del contenido), nombre saneado, guardar fuera del webroot.

### Respuesta
- Todo controller retorna `ResponseEntity<ResponseDto<T>>`; códigos y mensajes desde `Constant`.
- Creación: `HttpStatus.CREATED` + `Constant.CODE_RESPONSE_CREATED`.
- Listados con volumen: siempre paginados (`backend-endpoint-paginado`). Nunca `findAll()` sin `Pageable` hacia el cliente.
- OpenAPI: `@Operation` + `@ApiResponses` con ejemplo realista (detalle en `java-springboot`).

### Concurrencia
- Toda entidad editable tiene `@Version` mapeado a la columna `row_version` (estándar de base de datos `database-liquibase-postgresql`).
- `ObjectOptimisticLockingFailureException` se responde 409 desde el `GlobalExceptionHandler`.
- Bloqueo pesimista (`@Lock(PESSIMISTIC_WRITE)`) solo para «apartar» recursos limitados; no sustituye a `@Version`.

### Errores
- Errores de negocio: `throw new GenericErrorException(mensaje, Constant.CODE_RESPONSE_ARGUMENT_NOT_VALID)`.
- Nunca lanzar `RuntimeException`/`IllegalArgumentException` genéricas ni `try/catch` genérico en controllers.
- El handler de `Exception` responde 500 con un mensaje genérico y un id de correlación; **nunca** el mensaje de la excepción ni
  la traza. La traza completa va al log (`log.error("...", e)`).
- No tragar excepciones: un `catch` registra con traza y relanza, o maneja un caso concreto.

### Configuración y logging
- Secretos solo por variable de entorno o gestor de secretos, sin valor por omisión: `${DB_PASSWORD}`. Nunca en
  `application*.properties`, código, pruebas ni ejemplos (ver `reglas-globales`).
- `ddl-auto=none` (o `validate`). El esquema lo maneja Liquibase.
- SLF4J con mensajes parametrizados. Nunca registrar contraseñas, tokens, CURP/RFC completos ni cuerpos de petición con datos personales.
- Sin `Thread.sleep()` en código de petición; usar reintentos con backoff o tareas asíncronas.

## Estructura de paquetes (plantilla base)
`controllers/`, `services/`, `repositories/` (+ `specifications/`), `model/` (entidades), `model/dto/`, `model/enums/`, `config/`,
`exception/`, `util/` (constantes). Si el proyecto ya usa otra convención, se respeta la del proyecto.

## Plantilla de Controller

```java
@RestController
@RequestMapping("/recursos")
@RequiredArgsConstructor
@Tag(name = "Recursos", description = "Administración de recursos")
public class RecursoController {

    private final RecursoService recursoService;

    @Operation(summary = "Crear recurso")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Creado"),
        @ApiResponse(responseCode = "400", description = "Solicitud inválida"),
        @ApiResponse(responseCode = "403", description = "Sin permiso"),
        @ApiResponse(responseCode = "409", description = "Conflicto (duplicado o versión desactualizada)")
    })
    @PreAuthorize("hasAuthority(T(com.ejemplo.app.util.Permisos).RECURSO_CREAR)")
    @PostMapping
    public ResponseEntity<ResponseDto<RecursoResponse>> crear(@Valid @RequestBody RecursoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(new ResponseDto<>(
            Constant.CODE_RESPONSE_CREATED, Constant.MESSAGE_REGISTRO_CREADO, recursoService.crear(request)));
    }
}
```

## Plantilla de Service

```java
@Service
@RequiredArgsConstructor
public class RecursoService {

    private final RecursoRepository repository;
    private final UsuarioContexto usuario;   // usuario autenticado (proveedor OIDC)

    @Transactional
    public RecursoResponse actualizar(UUID id, RecursoUpdateRequest request) {
        Recurso recurso = repository.findById(id)
            .filter(r -> !r.isBorrado())                             // un borrado no se edita: 404
            .orElseThrow(() -> new GenericErrorException(ErrorConstants.NO_ENCONTRADO, Constant.CODE_RESPONSE_NOT_FOUND));
        if (!usuario.puedeEditar(recurso.getUnidadId())) {          // propiedad del recurso
            throw new AccessDeniedException(Constant.MESSAGE_SIN_PERMISO);
        }
        recurso.setNombre(request.nombre().trim());                  // solo campos editables; nunca id, auditoría ni borrado
        return RecursoResponse.fromRecurso(repository.save(recurso)); // record con método estático de conversión
    }
}
```

## Checklist
- [ ] Cada endpoint tiene `@PreAuthorize` (o `permitAll` declarado con motivo) y el servicio valida propiedad cuando el id viene del cliente.
- [ ] `@Valid` en cada `@RequestBody`; el DTO de entrada no permite asignar `id`/auditoría/versión.
- [ ] Entidades editables con `@Version` (`row_version`); 409 en conflicto.
- [ ] Sin entidades en la API, sin `findAll()` sin paginar, sin `@Autowired` en campos, sin `@Transactional` en controllers.
- [ ] 500 sin mensaje interno ni traza hacia el cliente; trazas en el log.
- [ ] Sin secretos ni valores por omisión de secretos en propiedades; `ddl-auto=none`.
- [ ] Pruebas del servicio y de autorización por rol (`backend-pruebas-unitarias`).

Estas reglas corresponden a detectores de escáner (`AUTHZ-NO-METHOD-AUTHZ`, `AUTHZ-PREAUTHORIZE-COMMENTED-OUT`,
`POTENTIAL-IDOR-NO-OWNERSHIP-CHECK`, `REQUESTBODY-WITHOUT-VALID`, `MASS-ASSIGNMENT-ENTITY-BINDING`, `ENTITY-RETURNED-FROM-CONTROLLER`,
`CONTROLLER-INJECTS-REPOSITORY`, `REPOSITORY-FINDALL-UNPAGINATED`, `JPA-ENTITY-MISSING-VERSION`, `JPA-MULTI-WRITE-NO-TRANSACTIONAL`,
`STACK-TRACE-EXPOSURE`, `CONFIG-SECRET-LITERAL`, `BLOCKING-THREAD-SLEEP`, `FILE-UPLOAD-NO-VALIDATION`). Si el proyecto usa un escáner, su guía de corrección detalla cada regla.

## Documentación obligatoria (en el mismo cambio)
- Cada controlador con `@Tag`; cada endpoint con `@Operation(summary, description)` y `@ApiResponses` que incluyan la respuesta 2xx y las de error que puede devolver (400, 401, 403, 404, 409) con ejemplo; `@Schema` en los DTO con descripción y ejemplo de cada campo.
- Javadoc en clases y métodos públicos de servicio: qué hace, reglas de negocio, parámetros, retorno y excepciones con su código HTTP.
- El contrato OpenAPI que genera springdoc se versiona junto al código y coincide con el endpoint real.
- Plantillas y ejemplos: skill `documentacion-codigo-y-api`.
