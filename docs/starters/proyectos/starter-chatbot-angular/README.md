# CA-Smarts Frontend Starter

Plantilla base para aplicaciones frontend empresariales de CA-Smarts, construida con **Angular 21**, **PrimeNG 21** y **TailwindCSS 4**. Incluye layout completo, sistema de temas, autenticación con mock interceptor y estructura lista para integrarse con backends Java Spring Boot y proveedores de identidad como **Authentik**.

---

## Stack tecnológico

| Tecnología | Versión | Propósito |
|---|---|---|
| Angular | 21 | Framework principal |
| PrimeNG | 21 | Biblioteca de componentes UI |
| TailwindCSS | 4 | Utilidades de estilos |
| Chart.js | 4.4 | Gráficas y visualización de datos |
| RxJS | 7.8 | Programación reactiva |
| TypeScript | 5.9 | Tipado estático |

---

## Requisitos previos

- Node.js 20 o superior
- npm 10 o superior
- Angular CLI 21

```bash
npm install -g @angular/cli@21
```

---

## Instalación

```bash
git clone <url-del-repositorio>
cd starter-frontend
npm install
```

---

## Desarrollo local

```bash
npm start
```

La aplicación quedará disponible en `http://localhost:4200`. El servidor recarga automáticamente al detectar cambios en el código fuente.

### Configuraciones por ambiente

| Script | Comando | Ambiente |
|---|---|---|
| `npm start` | `ng serve` | Local (mock activado) |
| `npm run watch` | `ng build --watch --configuration local` | Local con watch |
| `npm run build` | `ng build` | Producción |
| `npm run buildqa` | `ng build --configuration qa` | QA |
| `npm test` | `ng test` | Pruebas unitarias |

Los archivos de ambiente se encuentran en `src/environments/`.

---

## Estructura del proyecto

```
src/
├── app/
│   ├── components/          # Componentes de layout (topbar, sidebar, menú, footer)
│   ├── components-publics/  # Componentes públicos sin autenticación (login, etc.)
│   ├── core/
│   │   ├── guards/          # authGuard, noAuthGuard
│   │   ├── interceptors/    # tokenInterceptor, mockInterceptor
│   │   └── services/        # AuthService y servicios compartidos
│   ├── layout/              # Layout principal y sistema de temas
│   └── pages/               # Páginas: dashboard, crud, uikit, landing, etc.
├── assets/
│   ├── styles.scss          # Estilos globales
│   ├── tailwind.css         # Configuración de Tailwind
│   └── layout/              # Variables SCSS y estilos de layout
└── environments/            # Configuración por ambiente
```

---

## Autenticación actual (Mock)

La plantilla incluye un flujo de autenticación funcional con un interceptor de simulación que permite desarrollar sin depender de un backend real.

### Flujo de autenticación

```
[Login Form] → POST /api/auth/login
                     ↓
              [mockInterceptor]  ← activo en desarrollo local
                     ↓
              JWT ficticio + datos de usuario
                     ↓
              [AuthService] → localStorage
                     ↓
              [authGuard] → rutas protegidas
```

### Archivos clave

| Archivo | Descripción |
|---|---|
| `src/app/core/services/auth.service.ts` | Manejo de sesión, token y estado reactivo del usuario |
| `src/app/core/interceptors/token.interceptor.ts` | Agrega el header `Authorization: Bearer <token>` a todas las peticiones |
| `src/app/core/interceptors/mock.interceptor.ts` | Simula respuesta del backend de autenticación en desarrollo |
| `src/app/core/guards/auth.guard.ts` | Protege rutas que requieren sesión activa |
| `src/app/core/guards/no-auth.guard.ts` | Redirige al dashboard si ya hay sesión activa |

---

## Integración con Authentik

> **Pendiente de implementar**

[Authentik](https://goauthentik.io/) es el proveedor de identidad (IdP) centralizado para CA-Smarts. La integración debe reemplazar el `mockInterceptor` por un flujo OAuth 2.0 / OIDC real.

### Pasos de integración previstos

1. **Configurar proveedor OAuth en Authentik**
   - Crear una aplicación de tipo *OAuth2/OpenID Connect*
   - Definir el `redirect_uri` apuntando al frontend: `http://<dominio>/auth/callback`
   - Obtener `client_id` y `client_secret`

2. **Instalar librería OIDC en Angular**
   ```bash
   npm install angular-oauth2-oidc
   ```

3. **Configurar `OAuthModule` en `app.config.ts`**
   ```typescript
   // Ejemplo de configuración pendiente
   authConfig: AuthConfig = {
     issuer: 'https://auth.ca-smarts.com/application/o/<slug>/',
     redirectUri: window.location.origin + '/auth/callback',
     clientId: '<client_id>',
     responseType: 'code',
     scope: 'openid profile email',
     showDebugInformation: false,
   };
   ```

4. **Reemplazar `mockInterceptor`** con un interceptor que valide el token OIDC y lo adjunte a las peticiones al backend.

5. **Agregar variables de ambiente**
   ```typescript
   // environment.dev.ts
   export const environment = {
     production: false,
     buildEnversion: 'dev',
     authentikIssuer: 'https://auth.ca-smarts.com/application/o/<slug>/',
     authentikClientId: '<client_id>',
   };
   ```

---

## Integración con Backend Java Spring Boot

> **Pendiente de implementar**

El backend expone una API REST protegida con JWT. El frontend ya cuenta con el `tokenInterceptor` que agrega el header de autorización en cada petición.

### Contrato esperado del backend

#### Endpoint de autenticación (si no se usa Authentik directo)

```
POST /api/auth/login
Content-Type: application/json

{
  "correo": "usuario@ca-smarts.com",
  "contrasenia": "••••••••"
}
```

**Respuesta esperada:**

```json
{
  "token": "<JWT>",
  "usuario": {
    "nombre": "Nombre Apellido",
    "correo": "usuario@ca-smarts.com"
  }
}
```

#### Encabezado de autorización (enviado automáticamente)

```
Authorization: Bearer <JWT>
```

### Pasos de integración con Spring Boot

1. **Apuntar la URL base del backend** en los environments:
   ```typescript
   // environment.dev.ts
   export const environment = {
     production: false,
     buildEnversion: 'dev',
     apiUrl: 'http://localhost:8080',
   };
   ```

2. **Configurar el `HttpClient`** para usar la URL base (mediante un interceptor de URL o `APP_BASE_HREF`).

3. **Configurar CORS en Spring Boot** para aceptar peticiones desde el origen del frontend:
   ```java
   @CrossOrigin(origins = "http://localhost:4200")
   // o bien, configuración global en SecurityConfig
   ```

4. **Validación de JWT en Spring Security**: el backend debe validar el token emitido por Authentik (o el propio backend) en cada petición protegida.

5. **Deshabilitar el `mockInterceptor`** en los environments que apunten al backend real.

---

## Sistema de temas

La aplicación soporta múltiples temas configurables en `src/app/layout/service/`:

| Archivo | Tema |
|---|---|
| `ca-smart.theme.ts` | Tema corporativo CA-Smarts |
| `compramex.theme.ts` | Tema Compramex |
| `greyscale.theme.ts` | Escala de grises |
| `rainbow.theme.ts` | Rainbow |

El tema activo se gestiona a través de `layout.service.ts` y `app.configurator.ts`.

---

## Linting y formato

```bash
# Verificar linting
npx eslint .

# Formatear código
npm run format
```

---

## Construcción para producción

```bash
npm run build
```

Los artefactos se generan en `dist/`. La configuración de Vercel (`vercel.json`) está incluida para despliegue en esa plataforma.

---

## Licencia

Consulta el archivo [LICENSE.md](./LICENSE.md) para los términos de uso.
