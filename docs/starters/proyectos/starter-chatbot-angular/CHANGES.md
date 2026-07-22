# Registro de Cambios — starter-frontend

## [2026-05-05] Corrección de entorno — dependencias y Node.js

### Problemas resueltos
- **`@angular/cdk` faltante** — PrimeNG 21 lo requiere como peer dependency para picklist, listbox y orderlist. Se instaló con `npm install @angular/cdk --legacy-peer-deps`.
- **CLI global desactualizado** — El `ng` global instalado en NVM es v20, incompatible con Angular 21. Se debe usar siempre el `ng` local del proyecto (`./node_modules/.bin/ng`), que `npm start` invoca automáticamente.
- **Node.js v18 activo por defecto** — Angular 21 requiere Node v20.19+ o v22.12+. El sistema tiene v22.22.2 disponible pero no era la versión activa.

### Archivos nuevos
| Archivo | Descripción |
|---|---|
| `.nvmrc` | Fija Node 22 para este proyecto. Ejecutar `nvm use` activa la versión correcta automáticamente. |

### Comando de arranque correcto
```bash
source ~/.nvm/nvm.sh && nvm use 22 && npm start
# o si nvm ya está en el PATH:
nvm use && npm start
```

## [2026-05-05] Autenticación OIDC con Authentik

### Dependencia agregada
- `angular-oauth2-oidc` — cliente OIDC/OAuth2 para Angular

### Archivos nuevos
| Archivo | Descripción |
|---|---|
| `src/app/core/auth/oidc.config.ts` | Configuración OIDC: issuer, client_id, redirectUri, scopes |
| `src/app/core/auth/oidc.initializer.ts` | `APP_INITIALIZER` que carga el discovery document y procesa el callback de Authentik |

### Archivos modificados
| Archivo | Cambio |
|---|---|
| `src/app.config.ts` | Agrega `OAuthModule.forRoot()` con `allowedUrls: ['http://localhost:8080/api']` para inyección automática de Bearer. Elimina interceptores mock/token manuales. |
| `src/app/core/services/auth.service.ts` | Reescrito sobre `OAuthService`. Expone `iniciarLogin()`, `logout()`, `validToken()`, `obtenerToken()`, `nombreUsuario`. |
| `src/app/core/guards/auth.guard.ts` | Si no hay token válido, llama `iniciarLogin(state.url)` para redirigir a Authentik conservando la URL de destino. |
| `src/app/components-publics/auth/login/login.component.ts` | Simplificado a un botón "Iniciar sesión con Authentik" que dispara el Code Flow. |
| `src/app/components/base-sistema/system-topbar.component.ts` | Logout usa `OAuthService.logOut()` (cierra sesión en Authentik). Muestra nombre del usuario autenticado. |

### Configuración OIDC
```
issuer:       http://localhost:9000/application/o/starter/
client_id:    okxBESPqhfPxviNn4azq5gzsTgLzexfeebWFUrbI
redirectUri:  http://localhost:4200
scopes:       openid profile email offline_access
grant type:   Authorization Code + PKCE (S256)
```

---

## [2026-05-04] CRUD de Usuarios

### Archivos nuevos
| Archivo | Descripción |
|---|---|
| `src/app/pages/service/usuario.service.ts` | Servicio con los 5 endpoints del backend: `listar`, `obtener`, `crear`, `actualizar`, `eliminar` |
| `src/app/pages/usuarios/usuarios.ts` | Componente standalone: tabla paginada, búsqueda global, diálogo crear/editar, confirmación de eliminación |

### Archivos modificados
| Archivo | Cambio |
|---|---|
| `src/app/pages/pages.routes.ts` | Agrega ruta `/pages/usuarios` |
| `src/app.routes.ts` | Agrega ruta `/usuarios` bajo `TemplateBaseComponent`, protegida con `authGuard` |
| `src/app/layout/component/app.menu.ts` | Agrega ítem "Usuarios" en sección Pages del menú de ejemplos |
| `src/app/components/base-sistema/system-menu.component.ts` | Menú lateral del sistema ya incluía ítem "Usuarios" → `/usuarios` |

### API Backend consumida (`http://localhost:8080`)
| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/usuarios` | Listar usuarios activos |
| `GET` | `/api/usuarios/{id}` | Obtener usuario por UUID |
| `POST` | `/api/usuarios` | Crear usuario (requiere `username`) |
| `PUT` | `/api/usuarios/{id}` | Actualizar datos complementarios |
| `DELETE` | `/api/usuarios/{id}` | Eliminar de Authentik y BD local |
