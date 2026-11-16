---
name: frontend-auth-oidc
description: Autenticación y autorización del frontend Angular de la plantilla base con un proveedor OIDC como Authentik o Keycloak (Authorization Code + PKCE, angular-oauth2-oidc) — configuración por ambiente, guards (auth, menú, permiso, rol), directiva *appIfPermiso, interceptores, manejo del token y cierre de sesión.
---

# Frontend: autenticación OIDC

## Arquitectura (plantilla base)
| Archivo | Responsabilidad |
|---|---|
| `core/auth/oidc.config.ts` | `AuthConfig`: `responseType: 'code'` (PKCE), scopes, `requireHttps` y validación estricta del discovery **desde `environment`** |
| `core/auth/oidc.initializer.ts` | Configura `OAuthService`, carga el discovery solo si hay retorno de login o credenciales, refresco antes de expirar |
| `core/auth/usuario-contexto.initializer.ts` + `services/usuario-contexto.service.ts` | Carga `/api/usuarios/me` (rol activo, menús, permisos) |
| `core/guards/auth.guard.ts`, `menu.guard.ts`, `permiso.guard.ts`, `role.guard.ts` | Protección de rutas |
| `core/directives/if-permiso.directive.ts` | `*appIfPermiso="'USUARIOS_WRITE'"` oculta acciones sin permiso |
| `core/interceptors/auth.interceptor.ts` | Agrega `Authorization: Bearer` solo hacia la API propia; 401 → login |
| `core/services/auth.service.ts`, `sesion-termination.service.ts` | Inicio y cierre de sesión |

## Reglas
1. **Flujo:** Authorization Code + PKCE. Nunca implicit flow, nunca formulario propio de usuario/contraseña contra la API, nunca `client_secret` en el frontend.
2. **Configuración por ambiente:** `issuer`, `clientId`, `redirectUri`, `requireHttps` y `strictDiscoveryDocumentValidation` salen de
   `environment.*.ts`. `requireHttps` y `strictDiscoveryDocumentValidation` son `true` en QA y producción; solo el ambiente local puede
   desactivarlos. Nunca `requireHttps: false` escrito directo en el código.
3. **Token:** lo administra `OAuthService` (por omisión `sessionStorage`). Ningún componente ni servicio de negocio lee o escribe el token
   ni `localStorage`/`sessionStorage` directamente; si hace falta almacenamiento propio, va en un solo servicio (`TokenStorageService`).
   Nunca guardar datos personales en el storage ni poner el token en la URL o en logs.
4. **Interceptor:** el `Bearer` solo se agrega a URLs de `environment.apiUrl`; nunca a terceros (CDN, mapas, el proveedor de identidad).
5. **Guards y permisos:** cada ruta privada lleva `authGuard` y, si el módulo tiene permiso, `permisoGuard` con `data: { permiso }`.
   Los botones de acciones sensibles usan `*appIfPermiso`. **Ocultar en la interfaz no es seguridad:** el backend valida el mismo permiso
   con `@PreAuthorize` (`backend-seguridad`); la interfaz solo evita mostrar lo que el servidor va a rechazar.
6. **Interceptor simulado (`mock.interceptor.ts`):** solo con `environment.useLocalMockAuth = true` en local. Nunca registrado en QA/producción;
   el build de producción no debe incluirlo.
7. **Cierre de sesión:** `revokeTokenAndLogout()` revoca los tokens en el proveedor de identidad y cierra allí la sesión; luego se limpia el estado. `logOut()` solo cierra la sesión sin revocar, y `logOut(true)` ni siquiera pasa por el proveedor: no se usan para cerrar sesión; tras un 401 irrecuperable se limpia la sesión y se redirige al login.
8. **Rutas:** constantes `APP_ROUTES`; nada de strings literales repetidos.

## Checklist
- [ ] `requireHttps`/`strictDiscoveryDocumentValidation` vienen de `environment` y son `true` fuera de local.
- [ ] Sin lecturas/escrituras directas de storage fuera del servicio de autenticación.
- [ ] Rutas privadas con `authGuard` (+ `permisoGuard`); acciones con `*appIfPermiso`; el backend valida el mismo permiso.
- [ ] Cierre de sesión con `revokeTokenAndLogout()` (no `logOut()`).
- [ ] Interceptor simulado fuera del build de producción.
- [ ] Pruebas Playwright de un perfil sin permiso (`bdd-frontend-playwright`).

Identificadores de regla en escáneres que los detectan: `FRONTEND-JWT-LOCALSTORAGE`, `FRONTEND-SENSITIVE-STORAGE`, `FRONTEND-TOKEN-IN-URL`, `AUTHZ-CLIENT-SIDE-*`.

## Reglas del escáner que esta skill evita
`FRONTEND-JWT-LOCALSTORAGE`, `FRONTEND-SENSITIVE-STORAGE`, `FRONTEND-TOKEN-IN-URL`.
Corrección de cada una y el resto del catálogo: skill `prevencion-hallazgos-seguridad-calidad`.
