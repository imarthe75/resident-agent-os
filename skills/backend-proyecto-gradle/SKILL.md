---
name: backend-proyecto-gradle
description: Configuración inicial y organización de un proyecto backend Java nuevo — Gradle, Spring Boot 4 / Java 21, dependencias base, estructura de paquetes, configuración por variables de entorno (12-factor), tareas asíncronas y barreras de calidad del build (pruebas, cobertura, análisis).
---

# Backend: proyecto Gradle (Spring Boot)

Un proyecto nuevo parte de la plantilla base de la organización si existe (y conserva su estructura); si no, de Spring Initializr con
las versiones vigentes (`commands/new-project.md`). Esta skill fija la configuración mínima que todo backend debe tener.

## 1. Build
- Gradle con wrapper versionado (`gradlew`). Spring Boot 4.0.x, `JavaLanguageVersion.of(21)`.
- Versiones: las vigentes al crear el proyecto (`scripts/latest_versions.py`), fijadas en el build. Antes de subir una versión mayor, revisar la sección «Spring Boot 4» de `java-springboot` y correr la suite completa.
- Dependencias base (nombres de Spring Boot 4): `spring-boot-starter-webmvc`, `spring-boot-starter-data-jpa`, `spring-boot-starter-security`,
  `spring-boot-starter-security-oauth2-resource-server`, `spring-boot-starter-validation`, `spring-boot-starter-liquibase`,
  `org.postgresql:postgresql`, `org.springdoc:springdoc-openapi-starter-webmvc-ui`, Lombok (`compileOnly` + `annotationProcessor`),
  MapStruct si se usan mappers generados.
- Pruebas: `spring-boot-starter-test` (o los `-test` por tecnología de Boot 4), `spring-security-test`, Testcontainers PostgreSQL.
- Calidad en el build: JaCoCo con umbral mínimo acordado sobre `services`, y que `./gradlew check` falle si las pruebas fallan.
- Sin dependencias `SNAPSHOT` ni rangos dinámicos (`+`, `latest.release`).

## 2. Estructura de paquetes
```
com.<organizacion>.<proyecto>
├── config/          seguridad (Resource Server, CORS), OpenAPI, async
├── controllers/     solo validación, autorización y ruteo
├── services/        reglas de negocio y transacciones
├── repositories/    Spring Data + specifications/
├── model/           entidades JPA
│   ├── dto/         Request/Response/Paginacion
│   └── enums/
├── exception/       GlobalExceptionHandler y excepciones propias
└── util/            Constant, Permisos
```

## 3. Prácticas REST
- `POST` con body para búsquedas y filtros (`/listar`), evitando datos sensibles en la URL; `GET /{id}`, `PUT /{id}`, `DELETE /{id}` para el recurso.
- Inyección por constructor (`@RequiredArgsConstructor`).

## 4. Configuración (12-factor)
- Todo lo que cambia por ambiente o es secreto va por variable de entorno, **sin valor por omisión para secretos**:
  ```properties
  spring.datasource.url=${DB_URL}
  spring.datasource.username=${DB_USER}
  spring.datasource.password=${DB_PASSWORD}
  spring.security.oauth2.resourceserver.jwt.issuer-uri=${OIDC_ISSUER_URI}
  spring.jpa.hibernate.ddl-auto=none
  spring.jpa.open-in-view=false
  ```
- Perfiles `local`, `qa`, `prod`; ninguno contiene secretos. Un archivo `application-local.properties` con secretos no se versiona.
- Producción: Actuator solo `health`, Swagger deshabilitado, DevTools ausente.

## 5. Tareas asíncronas
- Correo, auditoría de negocio y notificaciones fuera del hilo de la petición: `@EnableAsync` + `ThreadPoolTaskExecutor` propio
  (tamaño configurable por variable; base `availableProcessors()`), o hilos virtuales de Java 21 para I/O.
- Política de saturación explícita (`CallerRunsPolicy` si no se puede perder el trabajo) y registro de errores con traza en las tareas.
- Si el trabajo depende de que la transacción se confirme: `@TransactionalEventListener(phase = AFTER_COMMIT)`.

## 6. Contenedor
- Imagen base con versión fija (no `latest`), usuario no root (`USER`), sin `curl | sh`, `HEALTHCHECK` contra `/actuator/health`.

## Checklist
- [ ] Creado desde la plantilla base o Initializr con versiones vigentes; Gradle wrapper; Java 21; Boot 4.0.x.
- [ ] Sin secretos ni valores por omisión de secretos; `ddl-auto=none`; `open-in-view=false`.
- [ ] `./gradlew check` corre pruebas y cobertura; Testcontainers para integración.
- [ ] Dockerfile con versión fija y usuario no root.

Reglas del escáner relacionadas: `CONFIG-SECRET-LITERAL`, `SUPPLY-CHAIN-UNPINNED-DEPENDENCY`, `DOCKER-MISSING-NON-ROOT-USER`, `DOCKER-CURL-PIPE-SHELL`.

Corrección de cada regla y el resto del catálogo: skill `prevencion-hallazgos-seguridad-calidad`.
