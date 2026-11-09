---
name: java-springboot
description: Buenas prácticas generales de Spring Boot y referencia de cambios de Spring Boot 4.0 (módulos, Jackson 3, pruebas, propiedades renombradas) para el plantilla base Java (Boot 4.0.x, Java 21). Úsala al configurar dependencias, migrar de Boot 3 o documentar con OpenAPI.
---

# Spring Boot Best Practices

> Las reglas obligatorias de la plantilla base (autorización por método, DTOs, `@Version`, errores, secretos) están en `backend-base-spring` y
> `backend-seguridad`; si algo de aquí difiere, mandan esas skills.

## Project Setup & Structure

- **Build Tool:** Use Maven (`pom.xml`) or Gradle (`build.gradle`) for dependency management.
- **Starters:** Use Spring Boot starters (e.g., `spring-boot-starter-web`, `spring-boot-starter-data-jpa`) to simplify dependency management.
- **Package Structure:** Follow the project's existing convention. The  plantilla base organizes by layer (`controllers`, `services`, `repositories`, `model`), see `backend-proyecto-gradle`.

## Dependency Injection & Components

- **Constructor Injection:** Always use constructor-based injection for required dependencies. This makes components easier to test and dependencies explicit.
- **Immutability:** Declare dependency fields as `private final`.
- **Component Stereotypes:** Use `@Component`, `@Service`, `@Repository`, and `@Controller`/`@RestController` annotations appropriately to define beans.

## Configuration

- **Externalized Configuration:** Use `application.yml` (or `application.properties`) for configuration. YAML is often preferred for its readability and hierarchical structure.
- **Type-Safe Properties:** Use `@ConfigurationProperties` to bind configuration to strongly-typed Java objects.
- **Profiles:** Use Spring Profiles (`application-dev.yml`, `application-prod.yml`) to manage environment-specific configurations.
- **Secrets Management:** Never hardcode secrets, and never give a secret a default value (`${DB_PASSWORD}` not `${DB_PASSWORD:admin}`). Use environment variables or HashiCorp Vault (`reglas-globales`).

## Web Layer (Controllers)

- **RESTful APIs:** Design clear and consistent RESTful endpoints.
- **DTOs (Data Transfer Objects):** Use DTOs to expose and consume data in the API layer. Do not expose JPA entities directly to the client.
- **Validation:** Use Java Bean Validation (JSR 380) with annotations (`@Valid`, `@NotNull`, `@Size`) on DTOs to validate request payloads.
- **Error Handling:** Implement a global exception handler using `@ControllerAdvice` and `@ExceptionHandler` to provide consistent error responses.
- **Swagger/OpenAPI for Response Envelopes:**
For APIs that return a standard envelope (for example `ResponseDto<T>`), do not document only the generic envelope type.
Document each endpoint response with a concrete OpenAPI schema that shows the inner `data` type (for example `UsuarioResponseEnvelopeDoc`, `RolListResponseEnvelopeDoc`).
For error responses (`4xx`, `5xx`), use a dedicated error envelope schema that explicitly documents `data = null` and `errorList` with `ErrorDetailDto`.
This ensures frontend teams can see the real payload structure for both success and failure scenarios directly in Swagger UI.
- **Swagger/OpenAPI Examples (Required):**
Use this checklist for each documented `@ApiResponse`:
1. Include at least one `@ExampleObject` with a realistic payload.
2. For `2xx`, show full envelope structure (`responseCode`, `responseMessage`, `data`, `errorList`).
3. For `4xx`/`5xx`, show `data = null` and `errorList` with at least one `ErrorDetailDto` sample.
4. Use internal numeric response codes as strings (for example `"200"`, `"201"`, `"400"`, `"401"`, `"404"`, `"409"`, `"500"`).

## Service Layer

- **Business Logic:** Encapsulate all business logic within `@Service` classes.
- **Statelessness:** Services should be stateless.
- **Transaction Management:** Use `@Transactional` on service methods to manage database transactions declaratively. Prefer method-level annotation; use class-level annotation only when all public methods share the same transaction boundary.

## Data Layer (Repositories)

- **Spring Data JPA:** Use Spring Data JPA repositories by extending `JpaRepository` or `CrudRepository` for standard database operations.
- **Custom Queries:** For complex queries, use `@Query` or the JPA Criteria API.
- **Projections:** Use DTO projections to fetch only the necessary data from the database.

## Logging

- **SLF4J:** Use the SLF4J API for logging.
- **Logger Declaration:** `@Slf4j` (Lombok) or `private static final Logger log = LoggerFactory.getLogger(MyClass.class);`. Never log secrets, tokens or personal data.
- **Parameterized Logging:** Use parameterized messages (`logger.info("Processing user {}...", userId);`) instead of string concatenation to improve performance.

## Testing

- **Unit Tests:** Write unit tests for services and components using JUnit 5 and a mocking framework like Mockito.
- **Integration Tests:** Use `@SpringBootTest` for integration tests that load the Spring application context.
- **Test Slices:** Use test slice annotations like `@WebMvcTest` (for controllers) or `@DataJpaTest` (for repositories) to test specific parts of the application in isolation.
- **Testcontainers:** Consider using Testcontainers for reliable integration tests with real databases, message brokers, etc.

## Security

- **Spring Security:** OAuth2 Resource Server against the OIDC provider; `@EnableMethodSecurity` and `@PreAuthorize` on every endpoint (`backend-seguridad`).
- **Password Encoding:** Always encode passwords using a strong hashing algorithm like BCrypt.
- **Input Sanitization:** Prevent SQL injection by using Spring Data JPA or parameterized queries. Prevent Cross-Site Scripting (XSS) by properly encoding output.

---

## Spring Boot 4.0.x — Breaking Changes & New Features

This section documents the breaking changes and new features introduced in Spring Boot 4.0 that must always be taken into account when developing or migrating applications.

### System Requirements

- **Java 17 or later is required.** Using the latest LTS release (Java 21) is recommended.
- **Kotlin 2.2+** when using Kotlin.
- **GraalVM 25+** for native images.
- **Jakarta EE 11** and **Servlet 6.1** baseline. Undertow was removed for incompatibility with Servlet 6.1.
- Requires **Spring Framework 7.x**.

### New Modular Design (Breaking Change)

Spring Boot 4.0 ships smaller, focused modules. This directly affects project dependencies:

- `spring-boot-starter-web` is **deprecated**. Use `spring-boot-starter-webmvc` instead.
- `spring-boot-starter-oauth2-*` starters were renamed to `spring-boot-starter-security-oauth2-*`.
- Flyway and Liquibase now each require their own starter: `spring-boot-starter-flyway` and `spring-boot-starter-liquibase`.
- For gradual migration, use `spring-boot-starter-classic` (deprecated, transition only).
- Every technology now has a test companion starter: `spring-boot-starter-<technology>-test`.
- `spring-boot-starter-test` no longer needs to be declared explicitly when technology test starters are used.

### Removed Features

| Feature                           | Reason / Alternative                                              |
|-----------------------------------|-------------------------------------------------------------------|
| Undertow support                  | Incompatible with Servlet 6.1. Use Tomcat or Jetty.              |
| Pulsar Reactive                   | Removed from Spring Pulsar. Use imperative support.               |
| Uber Jar embedded launch scripts  | Use `java -jar` directly or the Gradle Application Plugin.        |
| Spring Session Hazelcast (auto)   | Now managed by the Hazelcast team.                                |
| Spring Session MongoDB (auto)     | Now managed by the MongoDB team.                                  |
| Spock integration                 | Spock does not yet support Groovy 5.                              |
| Classic Uber Jar loader           | Remove any `CLASSIC` loader configuration from the build file.    |

### Jackson 3 (Breaking Change)

Spring Boot 4.0 uses **Jackson 3** as its preferred JSON library:

- Maven group ID changed from `com.fasterxml.jackson` to `tools.jackson` (except `jackson-annotations`).
- `@JsonComponent` renamed to `@JacksonComponent`.
- `@JsonMixin` renamed to `@JacksonMixin`.
- `Jackson2ObjectMapperBuilderCustomizer` renamed to `JsonMapperBuilderCustomizer`.
- Properties `spring.jackson.read.*` and `spring.jackson.write.*` moved to `spring.jackson.json.read.*` and `spring.jackson.json.write.*`.
- Jackson 3 auto-detects and registers all modules on the classpath. Disable with `spring.jackson.find-and-add-modules=false`.
- For temporary compatibility, use the deprecated `spring-boot-jackson2` module with properties under `spring.jackson2`.

### Testing (Breaking Changes)

| Spring Boot 3.x                              | Spring Boot 4.0                                                         |
|----------------------------------------------|-------------------------------------------------------------------------|
| `@MockBean` / `@SpyBean`                     | `@MockitoBean` / `@MockitoSpyBean` (Spring Framework annotations)       |
| `@SpringBootTest` provides MockMVC           | Add `@AutoConfigureMockMvc` explicitly                                  |
| `@SpringBootTest` provides `TestRestTemplate`| Add `@AutoConfigureTestRestTemplate`                                    |
| `MockitoTestExecutionListener`               | Use Mockito's `MockitoExtension` directly                               |
| `@AutoConfigureMockMvc(webClientEnabled=…)`  | `@AutoConfigureMockMvc(htmlUnit = @HtmlUnit(webClient = false))`        |

- `RestTestClient` is introduced as a modern replacement for `TestRestTemplate`. Configure with `@AutoConfigureRestTestClient`.
- `TestRestTemplate` package changed to `org.springframework.boot.resttestclient.TestRestTemplate`.

### Core Changes

- **JSpecify nullability annotations** were added to Spring Boot. This may cause compilation failures when using a null checker or Kotlin.
- `BootstrapRegistry` moved to `org.springframework.boot.bootstrap`.
- `EnvironmentPostProcessor` moved from `org.springframework.boot.env` to `org.springframework.boot`.
- **DevTools Live Reload is disabled by default.** Enable with `spring.devtools.livereload.enabled=true`.

### Web Layer Changes

- `HttpMessageConverters` is **deprecated**. Use `ClientHttpMessageConvertersCustomizer` and `ServerHttpMessageConvertersCustomizer` to customize converters.
- **Liveness and readiness probes are enabled by default.** Disable with `management.endpoint.health.probes.enabled=false`.
- Spring Session Redis properties renamed: `spring.session.redis.*` → `spring.session.data.redis.*`.
- `server.forward-headers-strategy` no longer has effect in WAR deployments. Declare the `ForwardedHeaderFilter` bean manually.

### Data Layer Changes

- **Hibernate**: `hibernate-jpamodelgen` replaced by `hibernate-processor`.
- Property `spring.dao.exceptiontranslation.enabled` renamed to `spring.persistence.exceptiontranslation.enabled`.
- `@EntityScan` moved to `org.springframework.boot.persistence.autoconfigure.EntityScan`.
- **Elasticsearch**: low-level `RestClient` auto-configuration replaced by `Rest5Client`. Replace `RestClientBuilderCustomizer` with `Rest5ClientBuilderCustomizer`.
- **MongoDB**: several `spring.data.mongodb.*` properties that do not require Spring Data moved to `spring.mongodb.*` (host, port, uri, database, password, etc.).
- **Spring Batch**: now operates in-memory by default. To persist metadata in a database, use `spring-boot-starter-batch-jdbc`.
- **Spring Retry** dependency management removed. Use Spring Framework Retry or declare an explicit version.
- **Spring Authorization Server** is now part of Spring Security. Override the version using `spring-security.version` instead of `spring-authorization-server.version`.

### New Features

- **API Versioning**: native support via `spring.mvc.apiversion.*` (MVC) and `spring.webflux.apiversion.*` (WebFlux).
- **HTTP Service Clients**: auto-configuration for interfaces annotated with `@HttpExchange`.
- **OpenTelemetry starter**: `spring-boot-starter-opentelemetry` to export metrics and traces over OTLP.
- **RestTestClient**: modern test client backed by MockMvc or a running server.
- **Gradle 9 support** (Gradle 8.14+ also supported).
- Multiple `TaskDecorator` beans are supported and composed automatically via `CompositeTaskDecorator`.

### Key Dependency Versions in Spring Boot 4.0

| Dependency         | Version |
|--------------------|---------|
| Spring Framework   | 7.0     |
| Spring Security    | 7.0     |
| Spring Data        | 2025.1  |
| Hibernate ORM      | 7.1     |
| Jackson            | 3.0     |
| Tomcat             | 11.0    |
| Liquibase          | 5.0     |
| Testcontainers     | 2.0     |
| Mockito            | 5.20    |
| Kotlin             | 2.2     |

### Properties Migration Tool

When migrating from Spring Boot 3.x, add this dependency temporarily to detect renamed or removed properties:

```groovy
runtimeOnly("org.springframework.boot:spring-boot-properties-migrator")
```

Remove it once the migration is complete.

## Documentación obligatoria (en el mismo cambio)
- Cada controlador con `@Tag`; cada endpoint con `@Operation(summary, description)` y `@ApiResponses` que incluyan la respuesta 2xx y las de error que puede devolver (400, 401, 403, 404, 409) con ejemplo; `@Schema` en los DTO con descripción y ejemplo de cada campo.
- Javadoc en clases y métodos públicos de servicio: qué hace, reglas de negocio, parámetros, retorno y excepciones con su código HTTP.
- El contrato OpenAPI que genera springdoc se versiona junto al código y coincide con el endpoint real.
- Plantillas y ejemplos: skill `documentacion-codigo-y-api`.

## Reglas del escáner que esta skill evita
`SPRING-ACTUATOR-SENSITIVE-EXPOSED`, `SPRING-DEVTOOLS-REMOTE-ENABLED`, `SPRING-H2-CONSOLE-ENABLED`, `SPRING-JPA-DDL-AUTO-SCHEMA-CHANGE`, `FIELD-INJECTION-AUTOWIRED`, `TRANSACTIONAL-ON-CONTROLLER`, `STACK-TRACE-EXPOSURE`.
Corrección de cada una y el resto del catálogo: skill `prevencion-hallazgos-seguridad-calidad`.
