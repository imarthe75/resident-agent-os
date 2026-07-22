# Skill 3: Centralización de Llamadas HTTP y RxJS

Este Skill detalla las reglas de diseño para la capa de servicios e integración con APIs del backend, orientadas a erradicar la duplicación de código y garantizar consistencia en la comunicación remota.

---

## 🎯 Objetivo General
Garantizar que ninguna parte de la aplicación (componentes o servicios de características) importe o consuma `HttpClient` de Angular de manera directa, centralizando la ejecución física en un servicio único `ApiService` e implementando flujos de datos asíncronos limpios basados en mejores prácticas de RxJS.

---

## 1. El Patrón del Wrapper Centralizado (`ApiService`)
Debes implementar o migrar todas las peticiones HTTP del sistema a través de un único servicio de infraestructura llamado `ApiService` localizado en `core/services/api.service.ts`:

* **Aislamiento de HttpClient**: `ApiService` es la única clase autorizada en toda la aplicación para importar `@angular/common/http` (`HttpClient`).
* **Responsabilidad de ApiService**:
  * Autocompletar los endpoints concatenando la URL base del entorno (`environment.apiBaseUrl`).
  * Ejecutar los verbos HTTP principales (`get`, `post`, `put`, `patch`, `delete`) de forma genérica y tipada.
  * Serializar y formatear automáticamente los parámetros de consulta (*Query Params*) complejos.

### Firma Sugerida para el Servicio Centralizado:
```typescript
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  get<T>(path: string, params: any = {}): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${path}`, { params: this.convertParams(params) });
  }

  post<T>(path: string, body: any = {}): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${path}`, body);
  }

  // ... (put, patch, delete implementados de forma similar)
}
```

---

## 2. Erradicación de Magic Strings (Constantes de Endpoints)
Queda prohibido escribir cadenas de texto literales (URLs hardcodeadas) en los servicios de negocio:

* **Centralización de Endpoints**: Todos los caminos de la API deben registrarse en `core/constants/api-endpoints.ts` utilizando objetos inmutables (`as const`).
* **Estructura Recomendada**:
  ```typescript
  export const API_ENDPOINTS = {
    AUTH: {
      LOGIN: '/auth/login',
      REFRESH_TOKEN: '/auth/refresh-token'
    },
    CLIENTS: {
      BASE: '/clients',
      DETAILS: (id: string) => `/clients/${id}`
    }
  } as const;
  ```

---

## 3. Estructura Estándar de Respuestas del Backend
Toda petición enviada al servidor debe retornar un formato homogéneo de respuesta. Esto permite al `ErrorHandlerService` y a los interceptores globales procesar la información de manera automatizada.

Debes obligar al agente de IA a modelar y tipar las siguientes interfaces en `core/models/`:

### A. Envoltura de Respuesta Genérica (`ResponseDto<T>`)
Todos los endpoints del backend (existan o no errores) responden con la estructura `ResponseDto<T>`:

```typescript
export interface ResponseDto<T> {
  responseCode: string;            // Código interno del resultado de la operación (ej. '200', '400', '500')
  responseMessage: string;         // Mensaje descriptivo del resultado de la operación
  data: T;                         // Carga útil o dato de respuesta de la operación (será null en caso de error)
  errorList: ErrorDetailDto[];     // Lista de errores de detalle, usada principalmente en errores de validación
}
```

### B. Detalles de Error Estandarizados (`ErrorDetailDto`)
Si una transacción falla o existen errores de validación de campos, la lista `errorList` contendrá instancias de:

```typescript
export interface ErrorDetailDto {
  errorCode: string;               // Código interno que identifica el tipo de error (ej. 'FIELD_REQUIRED', 'EMAIL_DUPLICATED')
  errorMessage: string;            // Descripción legible del error ocurrido para mostrar al usuario
}
```

### C. Envoltura de Listas Paginares de Spring Data (`PagedResponse<T>`)
Para cualquier endpoint que retorne colecciones de datos paginadas, el parámetro genérico `T` de `ResponseDto<T>` debe envolver una estructura `PagedResponse<T>` que sea el espejo exacto de la clase `org.springframework.data.domain.Page` de Spring Data devuelta por el backend:

```typescript
export interface PagedResponse<T> {
  content: T[];                    // Colección de elementos correspondientes a la página actual
  totalElements: number;           // Cantidad total de registros existentes en la base de datos
  totalPages: number;              // Cantidad total de páginas disponibles
  size: number;                    // Cantidad de registros por página (tamaño de la página solicitado)
  number: number;                  // Número de página actual solicitado (0-indexed)
  numberOfElements: number;        // Cantidad de elementos contenidos en la página actual
  first: boolean;                  // Indica si es la primera página
  last: boolean;                   // Indica si es la última página
  empty: boolean;                  // Indica si la página actual está vacía
}
```

---

## 4. Servicios de Características como Fachadas (FeatureServices)
Los servicios de cada módulo en `features/[module-name]/services/` actúan como fachadas exclusivas de intercambio de datos:

* **Inyección de ApiService**: Inyectan el `ApiService` transversal y devuelven observables tipados utilizando las estructuras globales de respuesta.
* **Prohibición de Side Effects**: Un servicio de feature no debe interactuar directamente con elementos de UI (no debe mostrar Toasts, no debe abrir diálogos, no debe manipular elementos del DOM). Su única responsabilidad es procesar peticiones y retornar datos.

### Ejemplo Correcto de FeatureService:
```typescript
@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private readonly apiService = inject(ApiService);

  getClients(search: ClientSearchRequest): Observable<ResponseDto<PagedResponse<ClientResponse>>> {
    return this.apiService.get<ResponseDto<PagedResponse<ClientResponse>>>(
      API_ENDPOINTS.CLIENTS.BASE, 
      search
    );
  }
}
```


---

## 5. RxJS: Buenas Prácticas y Manejo de Suscripciones
Para evitar fugas de memoria (*memory leaks*) y flujos complejos difíciles de depurar, aplica las siguientes reglas de RxJS:

* **Prohibición de Suscripciones Anidadas**:
  Nunca llames a `.subscribe()` dentro del bloque de éxito de otra suscripción. Utiliza operadores de aplanamiento de mayor orden de RxJS:
  * **`switchMap`**: Para búsquedas, filtros o navegación (cancela peticiones anteriores si se emite un nuevo valor).
  * **`mergeMap` / `flatMap`**: Para ejecuciones independientes en paralelo.
  * **`concatMap`**: Para transacciones secuenciales que deben mantener un orden estricto.
* **Gestión de Ciclo de Vida de Suscripciones**:
  En componentes que se suscriban físicamente a Observables, debes asegurar la desuscripción automática al destruir el componente para evitar fugas de memoria:
  * Utiliza la API funcional **`takeUntilDestroyed()`** de Angular (inyectando `DestroyRef`).
  * O bien, delega la suscripción directamente a la plantilla HTML utilizando el pipe **`async`** de Angular, el cual gestiona la desuscripción de forma automática.

---

## 6. Manejo Estandarizado de Errores e Interceptor HTTP
Para garantizar resiliencia en la capa de datos, se debe separar la lógica visual de los componentes de la lógica de análisis del error.

Debes ordenar al agente de IA implementar un flujo de manejo de errores reactivo y centralizado basado en tres piezas:

### A. Servicio Analizador de Errores (`ErrorHandlerService`)
Debe crearse en `core/services/error-handler.service.ts`. Su responsabilidad es analizar un `HttpErrorResponse` y traducirlo a una lista homogénea de `ErrorDetailDto[]` mapeando los códigos de estado HTTP estándar:

* **Fallo de Conexión (Status 0)**: Retorna un error con código `'CONNECTION_ERROR'` e indicando `"Fallo de conexión con el servidor"`.
* **No Autorizado (Status 401)**: Retorna un error con código `'UNAUTHORIZED'` e indicando `"Su sesión ha expirado o no está autenticado"`.
* **Prohibido (Status 403)**: Retorna un error con código `'FORBIDDEN'` e indicando `"No tiene permisos para realizar esta acción"`.
* **Recurso Inexistente (Status 404)**: Retorna un error con código `'NOT_FOUND'` e indicando `"Lo sentimos, el recurso solicitado no existe"`.
* **Recurso Expirado (Status 410)**: Retorna un error con código `'GONE'` e indicando `"Lo sentimos, el recurso solicitado ha expirado"`.
* **Errores de Validaciones y Negocio (400, 409, 500)**: Extrae el arreglo `errorList` de la respuesta del backend (`ResponseDto.errorList`). Si la lista está vacía, construye un `ErrorDetailDto` genérico con el código de error devuelto por la API o un genérico de servidor.

### B. Interceptor de Errores (`errorInterceptor`)
Debe crearse en `core/interceptors/error.interceptor.ts`. Se suscribe al ciclo de vida de la petición HTTP y captura cualquier error mediante el operador `catchError` de RxJS:

1. **Intento de Refresco de Token**: Si el error es `401` o `403` en peticiones protegidas (y no en llamadas de login/refresh), delega el flujo a `AuthService.handleRefreshToken(...)` para intentar renovar la sesión en segundo plano.
2. **Normalización del Error**: Pasa el error físico al `ErrorHandlerService.handle(error)` para recuperar la lista de objetos `ErrorDetailDto[]`.
3. **Notificación Toast Automatizada**: Itera sobre la lista `ErrorDetailDto[]` y dispara una notificación visual de tipo Toast para cada error encontrado llamando al servicio visual transversal (`MessageAppService` o `MessageService` de PrimeNG).
4. **Redirección de Seguridad**: Si el error es de autenticación irrecuperable, limpia las cookies o localStorage (`TokenStorageService.clearSession()`) y redirige forzosamente al usuario a `/auth/login`.

```typescript
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const errorHandler = inject(ErrorHandlerService);
  const authService = inject(AuthService);
  const messageService = inject(MessageAppService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // 1. Manejo de renovación automática de tokens si expira el accessToken
      if ((error.status === 401 || error.status === 403) && !req.url.includes('/auth')) {
        return authService.handleRefreshToken(req, next);
      }
      
      // 2. Procesar el error con el Handler para obtener los ErrorDetailDto[]
      return errorHandler.handle(error).pipe(
        catchError((errors: ErrorDetailDto[]) => {
          // 3. Mostrar notificaciones Toast de forma transparente al usuario
          if (errors && errors.length > 0) {
            errors.forEach((err) => messageService.error(err.errorMessage));
          }

          // 4. Redirigir si la sesión es irrecuperable
          if (error.status === 401) {
            authService.clearSession();
            router.navigate(['/auth/login']);
          }

          return throwError(() => errors);
        })
      );
    })
  );
};
```


