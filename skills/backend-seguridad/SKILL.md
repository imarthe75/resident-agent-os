---
name: backend-seguridad
description: Seguridad del backend Spring Boot con un proveedor OIDC (Authentik, Keycloak…) como OAuth2 Resource Server — validación de JWT, autorización por método y por propiedad del recurso, M2M, CORS, cabeceras, auditoría de negocio asíncrona y manejo de secretos.
---

# Backend Seguridad

## 1. Autenticación: Resource Server contra el proveedor OIDC
- El backend **no emite ni firma tokens**. Valida los JWT del proveedor OIDC como OAuth2 Resource Server:
  ```properties
  spring.security.oauth2.resourceserver.jwt.issuer-uri=${OIDC_ISSUER_URI}
  spring.security.oauth2.resourceserver.jwt.jwk-set-uri=${OIDC_JWKS_URI}
  ```
- Sin filtros JWT propios ni secretos de firma en la aplicación. Sesión `STATELESS`; CSRF deshabilitado solo porque la API no usa cookies de sesión.
- Validar `iss`, `exp` y `aud` (audience = el client id de la aplicación) con un `OAuth2TokenValidator`.
- Los roles/permisos salen de los claims (grupos o roles del proveedor) con un `JwtAuthenticationConverter`; no de un parámetro del cliente.

## 2. Autorización
- `@EnableMethodSecurity` y `@PreAuthorize` en **cada** endpoint (detalle en `backend-base-spring`). La `SecurityFilterChain` termina en
  `anyRequest().authenticated()`, pero eso solo es la red de seguridad: no sustituye la anotación por método.
- Rutas públicas explícitas y mínimas (`/actuator/health`, documentación solo en perfiles no productivos).
- Propiedad del recurso en el servicio cuando el id viene del cliente.
- Los endpoints de administración de usuarios y roles exigen el permiso más alto y quedan auditados.
- **Autorizar solo con las authorities del token** (`hasAuthority('MODULO_ACCION')`). Prohibido `@PreAuthorize("@bean.metodo(...)")` y
  cualquier verificador que consulte la base en cada petición (usuarios, roles, privilegios): es un chequeo con estado sobre un token sin
  estado. Consecuencia aceptada: una revocación tarda hasta que vence el token; acordar su vida máxima.
- Permisos como constantes (`Permisos<Modulo>`) y una prueba que falle si las constantes, el catálogo de privilegios y la matriz por rol no
  coinciden. No conceder por nombre de rol ni por analogía.
- **Escrituras internas:** cada método de servicio que persiste exige el permiso en su primera línea, para cubrir llamadas desde otros servicios.
- **Consumidores cruzados:** antes de proteger la lectura de un catálogo, busca qué otros módulos la consumen (selectores, formularios) y decide:
  dar `<MODULO>_CONSULTAR` a esos roles, dejar un endpoint mínimo de opciones solo autenticado, o `hasAnyAuthority(...)`. Registra la decisión.


## 3. Comunicación entre servicios (M2M)
- `client_credentials` con un cliente propio por servicio y scopes mínimos (`qr:preparar`, …).
- `client-id`/`client-secret` solo por variable de entorno o Vault: `${OIDC_M2M_CLIENT_SECRET}`. Nunca en `application.properties`.

## 4. CORS, cabeceras y exposición
- CORS con orígenes explícitos por ambiente (`${CORS_ALLOWED_ORIGINS}`), métodos explícitos; nunca `*` con credenciales.
- Actuator: exponer solo `health` (e `info` si no revela versiones). Nunca `env`, `heapdump`, `configprops`, `beans`, `shutdown`.
- Swagger UI y `/v3/api-docs` deshabilitados en producción (`springdoc.api-docs.enabled=false`).
- DevTools y consola H2 fuera de producción.
- Si hay `server.servlet.context-path`, los `requestMatchers` lo consideran.

## 5. Auditoría de negocio (quién, qué, cuándo)
- Complementa a la auditoría de base de datos (`postgres-audit`): registra la intención de negocio (módulo, acción, usuario del proveedor OIDC,
  ids afectados, resultado).
- `AuditModule` y `AuditAction` como `enum`; metadatos en `jsonb`.
- Asíncrona y fuera de la transacción de negocio (`@Async` con `ThreadPoolTaskExecutor` propio o evento `AFTER_COMMIT`); nunca bloquea la respuesta.
- No guardar contraseñas, tokens ni documentos completos en la bitácora.
- Bitácora con integridad verificable (hash encadenado o firma) cuando el proyecto lo exige por regulación.
- **Qué guarda cada traza:** la acción como miembro de un `enum` (nunca una cadena suelta); la tabla y la llave primaria real de la fila
  escrita (nula si no se escribió ninguna, nunca la de otra tabla). Evidencia según la acción: en una modificación, solo los campos que
  cambiaron con su valor anterior y nuevo, comparando el DTO de respuesta con una instantánea tomada **antes** de escribir; en un alta, los
  valores iniciales; en una baja, los eliminados. Se serializa a JSON, nunca con `toString()`.
- Solo se audita lo que modifica y persiste; un método que también se llama en cascada desde otro servicio no audita la cascada (la traza va
  en el punto de entrada). El registro no lanza excepciones ni se envuelve en `try/catch`.


## 6. Secretos y datos sensibles
- Ver `reglas-globales`. Comparación de secretos/tokens con `MessageDigest.isEqual` (tiempo constante).
- Cifrado: AES-GCM con IV aleatorio; nunca AES/ECB, DES, RC4. Hash de contraseñas: BCrypt/Argon2 (si el sistema las guarda; con un proveedor OIDC normalmente no).
- Aleatorios para tokens/códigos: `SecureRandom`, nunca `Random`/`Math.random`.

## Checklist
- [ ] Resource Server con `issuer-uri`/`jwk-set-uri` por variable; audience validada.
- [ ] `@PreAuthorize` en cada endpoint; públicos declarados con motivo.
- [ ] Sin secretos ni `client-secret` en propiedades; CORS sin `*`; Actuator/Swagger cerrados en producción.
- [ ] Auditoría de negocio asíncrona y sin datos sensibles.
- [ ] Pruebas de 401 (sin token), 403 (rol sin permiso) y 404 (recurso de otro dueño).
- [ ] 403 sin escritura parcial, también al invocar una operación interna sin el permiso; consumidores cruzados decididos.

Identificadores de regla en escáneres que los detectan: `AUTHZ-NO-METHOD-AUTHZ`, `CONFIG-SECRET-LITERAL`, `CONFIG-JWT-SECRET-LITERAL`, `CORS-WILDCARD-ORIGIN`,
`SPRING-ACTUATOR-SENSITIVE-EXPOSED`, `SPRING-DEVTOOLS-REMOTE-ENABLED`, `SPRING-H2-CONSOLE-ENABLED`, `TIMING-UNSAFE-SECRET-COMPARISON`,
`WEAK-CRYPTOGRAPHY`, `CRYPTO-CBC-NO-AUTHENTICATION`, `INSECURE-RANDOM-FOR-SECRET`, `STD-STRIDE-MISSING-AUDIT-LOG`.

## Documentación obligatoria (en el mismo cambio)
- Cada controlador con `@Tag`; cada endpoint con `@Operation(summary, description)` y `@ApiResponses` que incluyan la respuesta 2xx y las de error que puede devolver (400, 401, 403, 404, 409) con ejemplo; `@Schema` en los DTO con descripción y ejemplo de cada campo.
- Javadoc en clases y métodos públicos de servicio: qué hace, reglas de negocio, parámetros, retorno y excepciones con su código HTTP.
- El contrato OpenAPI que genera springdoc se versiona junto al código y coincide con el endpoint real.
- Plantillas y ejemplos: skill `documentacion-codigo-y-api`.

## Reglas del escáner que esta skill evita
`AUTHZ-NO-METHOD-AUTHZ`, `CONFIG-SECRET-LITERAL`, `CONFIG-JWT-SECRET-LITERAL`, `CORS-WILDCARD-ORIGIN`.
Corrección de cada una y el resto del catálogo: skill `prevencion-hallazgos-seguridad-calidad`.
