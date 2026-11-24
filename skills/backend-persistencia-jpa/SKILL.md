---
name: backend-persistencia-jpa
description: Modelado de entidades y acceso a datos con Spring Data JPA / Hibernate 7 alineado al estándar de base de datos del proyecto — entidad base de auditoría, UUID, borrado lógico, @Version sobre row_version, relaciones LAZY por id, proyecciones, JSONB y fronteras transaccionales.
---

# Backend Persistencia JPA

La base de datos manda: tablas, columnas y triggers siguen `database-liquibase-postgresql` y `postgres-audit`. Esta skill dice cómo se
mapean en Java.

## 1. Entidad base de auditoría
Toda entidad del dominio extiende una `@MappedSuperclass` con las columnas canónicas del estándar:

```java
@MappedSuperclass
@Getter @Setter
public abstract class EntidadBase {
    @Id
    @GeneratedValue
    @UuidGenerator(style = UuidGenerator.Style.VERSION_7)   // Hibernate 7 (Spring Boot 4): UUIDv7 ordenado por tiempo
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;                        // concurrencia optimista

    @Column(name = "activo", nullable = false)  private boolean activo = true;
    @Column(name = "borrado", nullable = false) private boolean borrado = false;

    @Column(name = "fecha_creacion", insertable = false, updatable = false)     private OffsetDateTime fechaCreacion;
    @Column(name = "fecha_modificacion", insertable = false, updatable = false) private OffsetDateTime fechaModificacion;
    @Column(name = "usuario_creacion", updatable = false) private String usuarioCreacion;
    @Column(name = "usuario_modificacion")                private String usuarioModificacion;
}
```

- **El `id` lo asigna Java antes de persistir**: Hibernate exige el id al insertar una entidad con `@Id` sin generador. Usa
  `@UuidGenerator(style = VERSION_7)` o, si la versión de Hibernate del proyecto no lo ofrece, un `@PrePersist` en la entidad base que
  asigne un UUIDv7 (el patrón que ya usa la plantilla base). El `DEFAULT uuidv7()` de la tabla solo cubre inserciones hechas por SQL.
- Fechas `OffsetDateTime` ↔ `TIMESTAMPTZ`. Nunca `LocalDateTime` para eventos auditables.
- Si la tabla es legada (`fccreacion`, `dsusuariocreacion`…), se mapean esos nombres; no se mezclan estilos en una tabla.
- Las fechas de auditoría las pone el trigger `audit_biu`; Java no las escribe (`insertable/updatable = false`).
- **Usuario de auditoría:** en cada transacción de escritura, antes del primer `INSERT/UPDATE/DELETE`, fijar el usuario autenticado del proveedor OIDC con alcance de transacción: `SELECT set_config('app.current_user', :usuario, true)` (un `TransactionSynchronization` o
  aspecto sobre `@Transactional`). Sin esto el trigger registra al usuario técnico de la conexión en DELETE y en ediciones repetidas del
  mismo usuario. Nunca `SET` sin `LOCAL` (con PgBouncer el valor pasa a otro cliente). Detalle en `postgres-audit` §5.

## 2. Concurrencia optimista (`@Version`)
- Toda entidad editable usa `@Version` sobre `row_version`. Hibernate envía `row_version = anterior + 1` y el trigger `audit_biu` lo acepta;
  si otra transacción ya lo cambió, el `UPDATE` no afecta filas y Hibernate lanza `ObjectOptimisticLockingFailureException` → 409.
- El DTO de actualización trae el `rowVersion` que vio el usuario y el servicio lo compara antes de guardar (evita «última escritura gana»
  entre dos pestañas).
- En el alta el trigger fija `row_version = 1`. Si la misma instancia se vuelve a modificar dentro de la misma transacción, hacer
  `entityManager.refresh(entidad)` antes. Cubrirlo con una prueba de integración contra PostgreSQL real (Testcontainers).
- Si la tabla tiene además `auditoria.bloqueo_optimista` activo, un `row_version` desfasado llega como SQLSTATE `40001`: mapearlo también a 409.
- `@Lock(PESSIMISTIC_WRITE)` solo para apartar recursos limitados (cupos, folios) y sobre una consulta con índice; no sustituye a `@Version`.

## 3. Borrado lógico
- Nunca se borra físicamente un registro de negocio. `borrado = true` (y `activo = false`).
- **No** ocultar los borrados con `@SQLRestriction`/`@Where`: el borrado tiene que poder encontrarse para detectar un duplicado borrado y para
  restablecerlo; con la restricción solo queda el SQL nativo `SELECT *` (regla `JPA-SQLRESTRICTION-SOFT-DELETE`).
- `borrado = false` se filtra en la `Specification` (`borradoEqual(false)`) de toda búsqueda y listado.
- `obtener(id)` (usado por consultar, editar y cambiar estatus) responde 404 si el registro está borrado; solo `eliminar` y `restablecer`
  consultan por id incluyendo borrados (eliminar uno ya borrado → 409; restablecer uno no borrado → 400).
- La base impide el estado imposible con `chk_activo_borrado` (`database-liquibase-postgresql`); restablecer deja `borrado = false` y `activo = true`.
- Antes de borrar, validar dependientes activos (`backend-integridad-negocio`).

## 4. Relaciones (entidades planas)
```java
@Column(name = "entidad_padre_id", nullable = false)
private UUID entidadPadreId;                                   // se usa para escribir

@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "entidad_padre_id", insertable = false, updatable = false)
private EntidadPadre entidadPadre;                             // solo lectura
```
- Siempre `FetchType.LAZY` (`@ManyToOne` y `@OneToOne` son EAGER por omisión: declararlo explícito).
- Para mostrar datos relacionados en listados: `@EntityGraph` o proyección; nunca consultas dentro de un ciclo (N+1).
- Sin `CascadeType.ALL`/`orphanRemoval` hacia entidades que tienen vida propia.

## 5. Consultas
- Agregaciones con interfaces o `record` de proyección; nunca `Object[]`/`List<Object[]>`.
- `@Query` siempre con parámetros enlazados (`:param`); nunca concatenación de texto ni `Sort` armado con texto del cliente.
- Consultas nativas: probarlas contra PostgreSQL real (no H2).

## 6. JSONB
```java
@JdbcTypeCode(SqlTypes.JSON)
@Column(name = "informacion_adicional", columnDefinition = "jsonb")
private ContenedorDto informacionAdicional;
```

## 7. Transacciones
- `@Transactional` solo en servicios; `readOnly = true` en lecturas.
- Un método que escribe en varios repositorios = una transacción.
- Nada de llamadas HTTP, correo o archivos dentro de una transacción larga: publicar un evento y procesarlo después del commit
  (`@TransactionalEventListener(phase = AFTER_COMMIT)`).

## Checklist
- [ ] Entidad extiende la base; `@Version` en `row_version`; filtro `borrado = false` en la `Specification` (sin `@SQLRestriction`).
- [ ] Columnas y tipos coinciden con la migración (`OffsetDateTime`/`timestamptz`, `UUID`/`uuid`, `jsonb`).
- [ ] Relaciones LAZY explícitas; sin N+1 en listados; sin `Object[]`.
- [ ] Prueba de integración de conflicto de versión (dos actualizaciones con el mismo `rowVersion` → la segunda da 409).

Identificadores de regla en escáneres que los detectan: `JPA-ENTITY-MISSING-VERSION`, `JPA-EAGER-FETCH`, `JPA-QUERY-IN-LOOP`, `JPA-MULTI-WRITE-NO-TRANSACTIONAL`.

## Documentación obligatoria (en el mismo cambio)
- `COMMENT ON TABLE` y `COMMENT ON COLUMN` para cada objeto nuevo o modificado, en la misma migración; Javadoc en la entidad que lo mapea.
- Plantillas y ejemplos: skill `documentacion-codigo-y-api`.

## Reglas del escáner que esta skill evita
`JPA-ENTITY-MISSING-VERSION`, `JPA-EAGER-FETCH`, `JPA-QUERY-IN-LOOP`, `JPA-MULTI-WRITE-NO-TRANSACTIONAL`, `JPA-SQLRESTRICTION-SOFT-DELETE`.
Corrección de cada una y el resto del catálogo: skill `prevencion-hallazgos-seguridad-calidad`.
