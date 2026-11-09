# Skill 4: Seguridad, Navegación y Rutas

Este Skill establece las directivas obligatorias para gestionar el acceso a vistas del sistema, la protección de rutas mediante Guards funcionales y la centralización segura del almacenamiento de sesiones.

---

## 🎯 Objetivo General
Limpiar la navegación caótica mediante el uso de constantes globales de rutas, asegurar que ningún componente manipule de forma directa `localStorage` o cookies para leer/escribir credenciales, e implementar un flujo de control de acceso robusto a nivel de enrutador y de interfaz (DOM).

---

## 1. Enrutamiento Estructurado y Lazy Loading
* **Navegación Sin Magic Strings**:
  Todas las rutas accesibles del frontend deben declararse en un único archivo de constantes inmutable `core/constants/app-routes.ts` (`as const`).
* **Enrutador Raíz (`app.routes.ts`)**:
  El archivo principal de rutas del sistema debe limitarse a cargar el layout base y declarar las rutas de primer nivel mediante **Lazy Loading**:
  ```typescript
  export const appRoutes: Routes = [
      {
          path: '',
          component: AppLayout,
          canActivate: [authGuard],
          children: [
              { 
                path: APP_ROUTES.CLIENTS, 
                loadChildren: () => import('./features/clients/clients.routes').then(m => m.CLIENT_ROUTES) 
              }
          ]
      },
      { path: APP_ROUTES.AUTH.LOGIN, component: LoginComponent, canActivate: [publicGuard] }
  ];
  ```

---

## 2. Aislamiento del Almacenamiento de Sesión (`TokenStorageService`)
Los componentes y servicios de negocio tienen **prohibido leer o escribir en `localStorage` o `sessionStorage`** directamente.

* **La Clase Autorizada**: Toda manipulación de persistencia local de tokens, perfiles o configuraciones del usuario debe estar centralizada en `core/services/token-storage.service.ts`.
* **Decodificación de JWT**: Si se requiere extraer información cifrada del token de acceso (como el ID del usuario, su correo o su rol), el procesamiento se debe realizar dentro del core mediante una utilidad (ej. `core/utils/jwt-decoder.ts`). Los componentes deben consumir esta información masticada a través de métodos limpios de `TokenStorageService` o `AuthService`.
* **Limpieza de Sesión Agresiva**: El servicio de storage debe exponer un método centralizado `clearSession()` para limpiar por completo cualquier llave persistida ante eventos de cierre de sesión, errores 401/403 no recuperables o expiración física del token.

---

## 3. Protección de Vistas mediante Guards Funcionales
Debes implementar o migrar la protección de rutas utilizando los **Guards funcionales** modernos de Angular (evitando el uso de clases heredadas que implementen `CanActivate` obsoletas):

* **`authGuard`**: Valida si el usuario está autenticado y posee un token de acceso vigente en `TokenStorageService`. Si no lo está, redirige al flujo de login.
* **`publicGuard`**: Impide que usuarios con una sesión activa ingresen a páginas de autenticación como `/auth/login` o `/auth/register`, redireccionándolos automáticamente al Dashboard.
* **`permissionGuard(string)`**: Recibe el nombre de un permiso o rol específico y comprueba de forma reactiva si las credenciales decodificadas del usuario activo le otorgan autorización para ingresar a la vista. En caso negativo, redirige a una pantalla de acceso denegado.

---

## 4. Control de Renderizado Dinámico en Interfaz (DOM)
Para ocultar botones, menús u opciones a usuarios sin privilegios, se prohíbe el uso de condicionales visuales genéricos como `*ngIf="user.role === 'ADMIN'"` dispersos en las plantillas:

* **Directiva Estructural de Permisos**: Debes implementar una directiva personalizada (ej. `*appHasPermission="'PERMISSION_NAME'"`) alojada en `shared/directives/has-permission.directive.ts`.
* **Funcionamiento Seguro**: La directiva inyecta reactivamente el `AuthService` para verificar la existencia del permiso y manipula el árbol del DOM mediante `ViewContainerRef`:
  * Si el usuario posee el permiso, renderiza el elemento.
  * Si el usuario no lo posee, limpia físicamente el fragmento del DOM, impidiendo que el botón o el enlace existan en la estructura HTML final de la vista.
