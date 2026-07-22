# Skill: Auth Architecture

## Estado actual
La autenticación usa un **Mock Interceptor** con JWT ficticio. El sistema está diseñado para reemplazarlo por **Authentik (OIDC)** sin refactorizar la capa de guards ni el `AuthService`.

---

## Archivos clave

| Archivo | Responsabilidad |
|---|---|
| `src/app/core/services/auth.service.ts` | Estado reactivo de sesión, lectura/escritura de token en `localStorage` |
| `src/app/core/interceptors/mock.interceptor.ts` | Simula respuesta del backend en desarrollo (deshabilitar en producción) |
| `src/app/core/interceptors/token.interceptor.ts` | Agrega `Authorization: Bearer <token>` a todas las peticiones salientes |
| `src/app/core/guards/auth.guard.ts` | Protege rutas privadas: redirige a `/auth/login` si no hay token válido |
| `src/app/core/guards/no-auth.guard.ts` | Protege rutas públicas: redirige a `/` si ya hay sesión activa |
| `src/app.config.ts` | Registra los interceptors en el orden correcto: `[mockInterceptor, tokenInterceptor]` |

---

## Flujo actual (Mock)

```
[Login Form]
    ↓  POST /api/auth/login  { correo, contrasenia }
[mockInterceptor]  ←  intercepta y devuelve JWT ficticio + usuario
    ↓
[AuthService.login()]
    ↓  guarda token en localStorage, emite currentUser$ (BehaviorSubject)
[authGuard]  ←  verifica AuthService.validToken() en cada navegación a ruta protegida
    ↓
[tokenInterceptor]  ←  inyecta  Authorization: Bearer <token>  en cada petición HTTP
```

### Reglas del flujo mock
- El `mockInterceptor` **solo debe estar activo en ambientes de desarrollo local**.
- En QA y Producción debe eliminarse del array de `withInterceptors()` en `app.config.ts`.
- El `tokenInterceptor` se mantiene en todos los ambientes.

---

## Interfaces del AuthService

```typescript
export interface LoginRequest {
    correo: string;
    contrasenia: string;
}

export interface AuthResponse {
    token: string;
    usuario: {
        nombre: string;
        correo: string;
    };
}
```

### Métodos públicos del AuthService

| Método | Uso |
|---|---|
| `login(credentials)` | Realiza el POST y guarda el token. Retorna `Observable<AuthResponse>` |
| `logout()` | Limpia `localStorage` y emite `null` en `currentUser$` |
| `validToken()` | Verifica si existe un token (usado por `authGuard`) |
| `validarYActualizarToken()` | Alias de validToken (usado por `noAuthGuard`) |
| `obtenerToken()` | Retorna el token crudo (usado por `tokenInterceptor`) |
| `currentUser$` | Observable del usuario en sesión |

---

## Migración a Authentik (OIDC)

### Qué cambia
| Capa | Acción |
|---|---|
| `mockInterceptor` | **Eliminar**. Ya no es necesario. |
| `AuthService` | Reemplazar `login()` con redirect OAuth. Mantener `currentUser$`, `logout()` y `obtenerToken()` con la misma firma. |
| `tokenInterceptor` | **Sin cambios**. Seguirá leyendo el token vía `obtenerToken()`. |
| `authGuard` / `noAuthGuard` | **Sin cambios**. Seguirán usando `validToken()`. |
| `app.config.ts` | Registrar `OAuthModule` y eliminar `mockInterceptor`. |

### Pasos de integración

1. **Instalar la librería OIDC**
   ```bash
   npm install angular-oauth2-oidc
   ```

2. **Configurar `AuthConfig`** (en `environment.*.ts`)
   ```typescript
   export const environment = {
     authentikIssuer: 'https://auth.ca-smarts.com/application/o/<slug>/',
     authentikClientId: '<client_id>',
   };
   ```

3. **Actualizar `AuthService.login()`** para iniciar el flujo PKCE:
   ```typescript
   login() {
     this.oauthService.initCodeFlow(); // redirige a Authentik
   }
   ```

4. **Manejar el callback** en `/auth/callback` y extraer el token del `OAuthService`.

5. **Actualizar `obtenerToken()`** para leer del `OAuthService` en lugar de `localStorage` directo:
   ```typescript
   obtenerToken(): string | null {
     return this.oauthService.getAccessToken();
   }
   ```

6. **Configurar CORS en Spring Boot** para aceptar el origen del frontend y validar el JWT emitido por Authentik.

### Endpoint de validación (Spring Boot)
El backend debe configurar Spring Security para validar el JWT de Authentik:
```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://auth.ca-smarts.com/application/o/<slug>/
```

---

## Reglas generales

- No almacenes información sensible del usuario en `localStorage` más allá del token.
- Toda manipulación de `localStorage` debe centralizarse en `TokenStorageService` (`core/services/token-storage.service.ts`). Ningún componente o servicio de negocio debe leer/escribir `localStorage` directamente.
- No expongas el `client_secret` en el frontend; usa el flujo **Authorization Code + PKCE**.
- Al implementar Authentik, deshabilita el `mockInterceptor` en **todos** los ambientes no locales.
- El `AuthService` debe usar `ApiService` (inyectado vía `inject()`) en lugar de `HttpClient` directo.
- Las rutas de navegación deben usar las constantes `APP_ROUTES` desde `core/constants/app-routes.ts`, no strings literales.
- El `errorInterceptor` global (en `core/interceptors/error.interceptor.ts`) captura errores 401/403 y delega el refresh de token automáticamente.
