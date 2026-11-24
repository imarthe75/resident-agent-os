---
name: backend-pruebas-unitarias
description: Estrategia y plantillas de pruebas para backend Spring Boot 4 / Java 21 — unitarias de servicio con JUnit 5 + Mockito, slices web con seguridad real (401/403 por rol), repositorios contra PostgreSQL real con Testcontainers, conflicto de versión, cobertura con JaCoCo y reglas de aislamiento de datos.
---

# Backend: pruebas unitarias y de integración

Complementa `test-driven-development` (ciclo rojo-verde) y `bdd-spec-driven-development` (reglas de negocio → escenarios Gherkin).

## 1. Qué se prueba y con qué
| Capa | Herramienta | Qué debe cubrir |
|---|---|---|
| Servicio (`services/`) | `@ExtendWith(MockitoExtension.class)`, sin contexto Spring | Reglas de negocio, unicidad (409), no existe (404), propiedad del recurso, integridad (dependientes activos), conflicto de versión, evento de auditoría |
| Controller | `@WebMvcTest` + `MockMvc` + seguridad real, servicio con `@MockitoBean` | Contrato `ResponseDto`, `@Valid` (400 con detalle por campo), **401 sin token, 403 por rol sin permiso, 200 con el permiso correcto** |
| Repositorio / consultas | `@DataJpaTest` + **Testcontainers PostgreSQL** (`@ServiceConnection`), migraciones Liquibase aplicadas | `@Query` nativas, Specifications, `@SQLRestriction`, índices únicos, `@Version` |
| Integración completa | `@SpringBootTest` + `@AutoConfigureMockMvc` + Testcontainers | Flujos críticos de punta a punta, triggers de auditoría (`postgres-audit`) |

- Spring Boot 4: `@MockitoBean`/`@MockitoSpyBean` (no `@MockBean`); `@SpringBootTest` no configura MockMvc: añadir `@AutoConfigureMockMvc`.
- No usar H2 para probar consultas: el dialecto difiere y oculta errores de PostgreSQL (`uuidv7()`, `jsonb`, triggers).

## 1b. Base y aislamiento (clase base y perfil de pruebas)
- **Clase base de los slices web** (`AbstractWebMvcSliceTest`): `@ActiveProfiles("test")` e `@Import` de la cadena de seguridad **real**
  (`SecurityConfig`, filtros, `AuthenticationEntryPoint`, `AccessDeniedHandler`, CORS) y del `GlobalExceptionHandler`; con `@MockitoBean`
  sustituye solo lo que toca BD o servicios externos (auditoría, JWT de terceros). Cada `<Controller>WebMvcTest` la extiende, declara
  `@WebMvcTest(MiController.class)` y un `@MockitoBean` por servicio del controller. Así se prueba el contrato HTTP sin base de datos.
- Si la aplicación tiene `@EnableCaching`, el slice lo hereda: aporta un `CacheManager` sin operación (`NoOpCacheManager`) en una
  `@TestConfiguration` para no depender de Redis.
- **Perfil `test` que falla cerrado** (`src/test/resources/application-test.properties`): datasource a un puerto local inexistente
  (`jdbc:postgresql://localhost:1/test-sin-bd`), `spring.liquibase.enabled=false`, `spring.cache.type=none`, issuer/JWKS a `localhost`.
  Si una prueba intenta levantar JPA por error, **falla** en vez de conectarse a la base de desarrollo. Los valores de ese archivo son
  ficticios, nunca credenciales reales.
- `@SpringBootTest` solo con Testcontainers (sección 1); nunca con un perfil que apunte a una base compartida.

## 2. Seguridad en pruebas
```java
mockMvc.perform(post("/recursos").with(jwt().authorities(new SimpleGrantedAuthority("RECURSO_CREAR")))
        .contentType(APPLICATION_JSON).content(json))
    .andExpect(status().isCreated());

mockMvc.perform(post("/recursos").with(jwt().authorities(new SimpleGrantedAuthority("RECURSO_LEER")))
        .contentType(APPLICATION_JSON).content(json))
    .andExpect(status().isForbidden());          // rol sin permiso

mockMvc.perform(post("/recursos").contentType(APPLICATION_JSON).content(json))
    .andExpect(status().isUnauthorized());       // sin token
```
- Cada endpoint nuevo lleva al menos la prueba de 403. Una prueba de autorización es la que evita que un `@PreAuthorize` desaparezca sin que nadie lo note.
- Prueba de propiedad: un usuario de otra unidad pide `GET /recursos/{id}` → 404.

## 2b. Clientes HTTP externos (`MockRestServiceServer`)
Para servicios que llaman a otro sistema con `RestClient` (proveedor de identidad, servicio de folios, correos): el servidor simulado se enlaza al
*builder* del cliente y **ninguna petición sale de la JVM**.
```java
RestClient.Builder builder = RestClient.builder().baseUrl("http://servicio-externo.test");
MockRestServiceServer servidor = MockRestServiceServer.bindTo(builder).build();
MiCliente cliente = new MiCliente(builder.build());

servidor.expect(requestTo("http://servicio-externo.test/api/folios/emitir"))
        .andExpect(method(HttpMethod.POST))
        .andRespond(withSuccess("{...}", MediaType.APPLICATION_JSON));
cliente.emitir(...);
servidor.verify();                      // falla si una llamada esperada no ocurrió
```
- Cubre 4xx, 5xx, respuesta incompleta y timeout (`withException(new SocketTimeoutException("Read timed out"))`); reintentos con
  `ExpectedCount.times(n)`.
- Verifica también el **efecto local de un fallo remoto**: que no se guardó nada (`verify(repo, never()).save(any())`).

## 3. Concurrencia
Con Testcontainers: leer el registro dos veces (dos `rowVersion` iguales), actualizar con el primero (200) y luego con el segundo → 409.

## 4. Estilo
- Arrange-Act-Assert; un comportamiento por prueba; `@DisplayName` en español con la regla que verifica.
- Cada validación o regla se prueba con **un caso que debe pasar y otro que debe fallar**.
- Datos con fábricas (`RecursoFixtures.valido()`), no con objetos repetidos en cada prueba.
- Sin `Thread.sleep`; para asincronía, Awaitility.
- Una prueba omitida (`@Disabled`) lleva el motivo y la referencia del ticket.

## 4b. Mockito estricto, determinismo y regresión
- `MockitoExtension` usa *strict stubs*: un `when(...)` sobrante hace fallar la prueba; si el código consulta el mismo método con
  argumentos distintos, define todos o Mockito lanza `PotentialStubbingProblem`.
- Afirma también lo que **no** debe pasar (`never()`, `verifyNoInteractions`).
- No afirmes como seguro algo probabilístico (p. ej. descifrar AES/CBC con otra clave casi siempre falla por *padding*, pero ~1 de cada
  256 veces devuelve basura): afirma lo garantizado.
- Archivos: `@TempDir`. Mismo comportamiento con varias entradas: `@ParameterizedTest` + `@CsvSource`/`@ValueSource`/`@NullAndEmptySource`.
- **Nombre del método**: el comportamiento en español, sin prefijo `test` (`crearRolResponde409CuandoElCodigoEstaDuplicado`), con el
  código HTTP cuando aplica. Javadoc de la clase (qué prueba, con qué técnica, por qué importa) y de cada prueba («Verifica que …»).
- **Cada bug corregido deja una prueba que lo reproduce**, marcada «Verifica (regresión) que …», y se registra en la guía de pruebas.
- No se prueban getters, DTOs ni entidades: se prueba comportamiento (resultado, error o efecto).

## 5. Aislamiento de datos
- Las pruebas nunca apuntan a una base compartida (dev/qa/prod). Testcontainers o base desechable; variables exclusivas de prueba.
- Sin credenciales reales en `src/test/resources`.

## 6. Cobertura y ejecución
- `./gradlew test jacocoTestReport`; umbral mínimo acordado sobre `services/` (sugerido ≥ 80 % de líneas en servicios nuevos).
- **Umbral que solo sube** (*ratchet*): `jacocoTestCoverageVerification` con el mínimo justo por debajo de la cobertura medida, evaluado
  por `./gradlew check`, que es lo que ejecuta el pipeline. Excluye `**/model/**`, `*Properties*` y la clase principal. Nunca se baja.
- La meta no es 100 %: se cubre primero lo que más duele si falla (seguridad, permisos, auditoría, clientes externos), luego datos y web.
  Opcionales que aportan: ArchUnit (p. ej. que ningún controller use un repository) y PIT (pruebas de mutación) sobre seguridad y permisos.
- Mantén en `docs/` un **plan de cobertura** (línea base medida, fases por riesgo, metas) y una **guía de pruebas** (cómo ejecutarlas,
  convenciones, registro de pruebas por área y bugs encontrados con su prueba de regresión).
- La cobertura no sustituye a las pruebas de 403/409: se revisan explícitamente en el PR.
- Reportar el resultado real de la ejecución (comando y salida). Si algo solo se probó con mocks, decirlo.

## Reportes del CI
Publica en el CI los reportes JUnit XML (Surefire/Gradle `build/test-results/**/TEST-*.xml`) y JaCoCo XML (`jacocoTestReport.xml`) como
artefactos: son la evidencia de verificación que leen las herramientas de calidad y los revisores. Las pruebas de autorización y
concurrencia llevan el código en el **nombre** (`crear_sinPermiso_responde403`, `actualizar_versionObsoleta_responde409`) para que se
puedan contar y rastrear sin abrir el código.

## Checklist
- [ ] Nombres de prueba con 401/403/409 y reportes JUnit/JaCoCo publicados por el CI.
- [ ] Servicio: feliz, 404, 409 (duplicado), propiedad, dependientes, versión.
- [ ] Controller: 400 por validación, 401, 403 por rol, 2xx con permiso.
- [ ] Consultas nativas y Specifications contra PostgreSQL real.
- [ ] Sin H2, sin `Thread.sleep`, sin datos ni credenciales compartidas.
- [ ] Perfil `test` que falla cerrado; clientes externos con `MockRestServiceServer`; umbral de cobertura que solo sube.
- [ ] Cada bug corregido con su prueba de regresión.

## Reglas del escáner que esta skill evita
`TEST-SKIPPED-WITHOUT-REASON`, `CICD-GATE-ALLOW-FAILURE`, `CICD-NO-PIPELINE`, `AUTHZ-NO-METHOD-AUTHZ`.
Corrección de cada una y el resto del catálogo: skill `prevencion-hallazgos-seguridad-calidad`.
