# 🛡️ Security Best Practices & Audit Guidelines

Normas estrictas para la prevención de vulnerabilidades y la gestión segura de secretos en el ecosistema.

*Nota de Atribución: Estas directivas de seguridad se basan en el marco de AgentShield e integran principios del proyecto de código abierto **affaan-m/ECC** (Licencia MIT).*

## 📌 Gestión de Secretos y API Keys

1. **Cero Tolerancia a Secretos Hardcodeados:**
   - Queda estrictamente prohibido commitear contraseñas, tokens de API, claves secretas o certificados SSL en el repositorio de Git.
   - Utiliza variables de entorno cargadas desde archivos `.env` (los cuales deben estar siempre en el archivo `.gitignore` del proyecto).
2. **Auditoría de Inyecciones de Código:**
   - No ejecutes comandos del sistema usando entradas de usuario de forma directa sin antes sanear y validar adecuadamente los argumentos.
3. **Control de Acceso (Principio de Mínimo Privilegio):**
   - Asegura que los scripts de bases de datos, APIs y herramientas utilicen credenciales con los mínimos permisos de lectura/escritura requeridos para operar.
4. **Validación en Tiempos de Ejecución:**
   - Utiliza validadores estáticos de seguridad (SAST) y análisis de dependencias antes de integrar nuevas librerías al ecosistema.

## 📌 Fail-closed en webhooks y APIs públicas

1. **Si falta el secreto, se rechaza.** Un endpoint que recibe webhooks exige un token configurado en el entorno; sin token configurado responde 503 y con token incorrecto 401/403. Nunca devuelve «ignorado» ni procesa la petición sin autenticar.
2. **Comparación en tiempo constante** (`hmac.compare_digest`).
3. **El payload no decide a quién llamas.** No clones ni descargues una URL tomada del cuerpo de la petición: valida el host contra el servidor autorizado **antes** de adjuntar credenciales (previene SSRF y fuga de tokens).
4. **Peticiones sin token en rutas públicas** no deben alcanzar lógica de negocio ni escribir en la base.
El verificador `webhooks_fail_closed` revisa las rutas `webhook` de FastAPI.

## 📌 Reglas por capa (OWASP Top 10 / API Top 10 / ASVS 4.0)

## Por capa · 1. Autenticación y sesión
1. Autenticación delegada a el proveedor de identidad (OIDC): Authorization Code + PKCE en el frontend, Resource Server en el backend. Nada de formularios
   propios de usuario/contraseña contra la API ni implicit flow (skills `frontend-auth-oidc`, `backend-seguridad`).
2. `requireHttps` y validación estricta del discovery en `true` fuera de local.
3. Tokens solo en `Authorization: Bearer`; nunca en la URL, en logs ni en `localStorage` sin
   justificación.
4. Cookies `Secure` + `HttpOnly` + `SameSite`; fijación de sesión activa.
5. Endpoints de login con límite de intentos; política de contraseñas validada en el servidor
  ; secretos y firmas comparados en tiempo constante.

## Por capa · 2. Autorización
1. **Cada método de controlador** lleva su permiso (`@PreAuthorize("hasAuthority('…')")` o a nivel de clase); un permiso comentado es un
   endpoint abierto. Un `permitAll` sobre escrituras es un hallazgo.
2. **Propiedad del recurso** (IDOR/BOLA): un id recibido del cliente se verifica contra el usuario o la unidad que lo pide
  . La lectura también se autoriza por rol, no solo la escritura.
3. Sin controladores de prueba, demo o «sandbox» en `src/main` ni rutas de prueba en el router de producción
  .
4. Guards y `*appIfPermiso` del frontend solo ocultan; el backend valida el mismo permiso.
5. Sin asignación masiva: los DTOs de entrada no son entidades y no traen `id`, rol, dueño ni estado.

## Por capa · 3. Entrada y salida
1. Todo DTO de entrada con `@Valid` y restricciones; lista blanca de valores en `ORDER BY` y filtros.
2. Consultas parametrizadas siempre: nada concatenado en SQL, JPQL, LDAP, XPath, plantillas ni comandos del sistema.
3. Sin XSS: nada de `bypassSecurityTrust*`/`[innerHTML]` con datos externos sin `DOMPurify`;
   redirecciones solo a destinos de una lista blanca; `postMessage` con origen verificado.
4. Sin SSRF: el destino de una petición saliente nunca sale de la entrada del usuario sin validar contra una lista blanca.
5. Subida de archivos: tamaño máximo, lista blanca de extensiones, tipo real del contenido, nombre generado por el servidor, fuera de la
   ruta pública; lectura en streaming, no en `byte[]`.
6. Respuestas de la API: DTO de salida, nunca la entidad; sin datos personales de más.

## Por capa · 4. Errores, registro y bitácora
1. Errores al cliente sin trazas, SQL ni mensajes internos; un `GlobalExceptionHandler` traduce.
2. Ningún error silenciado.
3. Las operaciones que modifican datos dejan rastro (usuario, acción, recurso, fecha) sin contraseñas, tokens ni datos personales en el
   log. La auditoría de base de datos sigue `rules/postgres/rules.md`.

## Por capa · 5. Criptografía y transporte
1. Sin algoritmos débiles (MD5, SHA-1 para firma, DES, RC4, AES sin modo, ECB) ni CBC sin autenticación; usar AES-GCM y bibliotecas estándar. Aleatorio criptográfico para tokens.
2. TLS 1.2+ en todo servicio expuesto, certificado válido, sin desactivar la verificación de certificados;
   WebSocket con `wss://`.
3. CORS sin `*` cuando hay credenciales; cabeceras de seguridad (HSTS, CSP, `X-Content-Type-Options`,
   `frame-ancestors`) en el proxy.

## Por capa · 6. Configuración del framework
- `spring.jpa.hibernate.ddl-auto=none`; sin DevTools remoto ni actuator/Swagger UI abiertos sin
  autenticación en producción; GraphQL sin introspección en producción.

## Por capa · 7. Dependencias y cadena de suministro
1. Sin dependencias con CVE conocido sin plan (SCA); lockfile versionado y versiones fijadas; versiones vigentes al crear el proyecto (`rules/common/versions.md`).
2. Nada de `curl | sh` en Dockerfile ni CI; imágenes con etiqueta fija, no `:latest`.
3. Licencias compatibles con el proyecto (auditor de licencias).
4. Un paquete malicioso conocido se **retira** (no basta subir de versión) y se rotan las credenciales de los equipos y runners donde se
   instaló. Sin descargas ni `eval`/`| sh` en scripts `preinstall`/`postinstall`.
5. Dependencias desde el registro por `https://`, nunca desde una URL con credenciales; de git, solo a un commit completo. El nombre del
   paquete se copia de su página oficial (typosquatting).
6. CI: instalación congelada (`npm ci`, `--frozen-lockfile`); `include:` de otros proyectos con `ref:` fijo; rama, título de MR o mensaje
   de commit solo como `"$VARIABLE"` entre comillas, nunca dentro de `eval`/`sh -c`.
7. Nada de binarios (`.jar`, `.exe`, llaves) ni salida de compilación en git.

## Por capa · 8. Contenedores, infraestructura y servidores
1. Dockerfile con `USER` no root; sin `privileged`, `hostPath` ni `0.0.0.0/0` de entrada; puertos de
   servicios internos ligados a `127.0.0.1` detrás del proxy.
2. Servidores con el endurecimiento CIS básico: sin login de root por SSH, sin autenticación por contraseña, firewall y `auditd`
   activos, parches de seguridad al día.
3. Ramas por defecto protegidas, sin force-push, variables de CI enmascaradas (configuración del servidor de git).
4. Reportes, `.docx`, `.pdf` y `.zip` nunca en carpetas públicas del frontend.

## 📌 Escaneo en cada cambio
Si el proyecto tiene un escáner de seguridad, cada Merge Request se escanea y no introduce hallazgos nuevos; lo que no se pudo escanear se
declara «no verificado por escáner». Las reglas de corrección por lenguaje están en `rules/java`, `rules/angular`, `rules/typescript`.
