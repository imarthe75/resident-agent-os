---
skill: generacion-servicios
description: Guía canónica para generar, extender o modificar servicios Angular (microservicios HTTP) en el proyecto, siguiendo las convenciones, patrones y buenas prácticas del equipo.
---

# Spec: Generación de Servicios Angular

## Propósito

Este documento define las reglas, convenciones y plantillas que se **deben seguir estrictamente** al generar un nuevo servicio Angular. Cualquier servicio generado que no cumpla con estas reglas se considera inválido.

---

## 1. Modo de operación

Lo primero que se debe determinar es **qué tipo de acción se requiere**. Preguntar si no queda claro en el contexto:

| Modo | Cuándo usarlo | Acción de la IA |
|---|---|---|
| **A — Crear servicio nuevo** | No existe carpeta ni archivo para este servicio | Crear carpeta `kebab-case` + archivo `.service.ts` completo |
| **B — Agregar método a servicio existente** | El archivo `.service.ts` ya existe y se quiere añadir un endpoint nuevo | Localizar el archivo existente y añadir el método respetando el estilo actual |
| **C — Modificar método existente** | El endpoint ya existe pero su firma, tipado, verbo HTTP o lógica debe cambiar | Localizar el método exacto, mostrar el antes/después y aplicar el cambio |

### Modo A — Crear servicio nuevo

Preguntas obligatorias:

| # | Pregunta | Uso |
|---|---|---|
| A1 | ¿Cuál es el nombre del servicio? (se convierte a `kebab-case`) | Carpeta y nombre de archivo |
| A2 | ¿Cuál es la base del controlador en el backend? (ej.: `usuarioSOS`, `tramites`) | Construir `BASE_URL` |
| A3 | ¿Qué endpoints/métodos necesita? (nombre, verbo HTTP, endpoint relativo, params) | Generar los métodos |
| A4 | ¿Qué DTO se usa como respuesta `ResponseGeneric<T>`? ¿Ya existe o se crea? | Tipado de retorno |
| A5 | ¿Algún método lleva body (POST/PUT/PATCH)? ¿Qué DTO es el payload? ¿Ya existe o se crea? | Tipado del body |

Resultado esperado:
```text
src/app/features/nombre-modulo/
└── services/
    └── nombre-servicio.service.ts   ← archivo nuevo completo
```

---

### Modo B — Agregar método a servicio existente

Preguntas obligatorias:

| # | Pregunta | Uso |
|---|---|---|
| B1 | ¿Cuál es el nombre del servicio existente (o ruta del archivo)? | Localizar el archivo |
| B2 | ¿Qué endpoint nuevo se agrega? (nombre del método, verbo HTTP, endpoint relativo, params) | Generar solo el método |
| B3 | ¿Qué DTO retorna el nuevo método? ¿Ya existe o se crea? | Tipado de retorno |
| B4 | ¿El nuevo método lleva body? ¿Qué DTO? ¿Ya existe o se crea? | Tipado del body |

Reglas adicionales:
- **No modificar** ningún método existente del archivo.
- **No alterar** el `BASE_URL`, el constructor ni los imports que ya existen (solo agregar los nuevos necesarios).
- Insertar el método nuevo al final de la clase, antes del cierre `}`.
- Si el import del DTO nuevo ya existe en el archivo, no duplicarlo.

Resultado esperado: el archivo existente con el nuevo método agregado al final.

---

### Modo C — Modificar método existente

Preguntas obligatorias:

| # | Pregunta | Uso |
|---|---|---|
| C1 | ¿Cuál es el nombre del servicio/archivo a modificar? | Localizar el archivo |
| C2 | ¿Cuál es el nombre exacto del método a modificar? | Localizar el método |
| C3 | ¿Qué cambia? (firma, verbo HTTP, endpoint, parámetros, tipado, lógica) | Aplicar cambio preciso |
| C4 | ¿El cambio afecta el tipo de retorno o el DTO? Si el DTO cambia, ¿ya existe el nuevo? | Actualizar tipado |

Reglas adicionales:
- Mostrar siempre el **antes** y el **después** del método antes de aplicar el cambio.
- **No tocar** ningún otro método del archivo.
- Si el cambio implica un nuevo import, agregarlo al bloque de imports sin eliminar los existentes.
- Documentar en el JSDoc del método qué cambió y por qué (si el contexto lo permite).

Resultado esperado: solo el método modificado dentro del archivo existente.

---

> Si la respuesta a A4, A5, B3, B4 o C4 es **"crear nuevo DTO"**, consulta la spec de DTOs en [Generacion DTO's](../generacion-dtos/SKILL.md) antes de continuar.

---

## 2. Preguntas de contexto general

Estas preguntas aplican a **todos los modos** si la información no fue proporcionada:

| # | Pregunta | Uso |
|---|---|---|
| G1 | ¿El DTO de respuesta ya existe en `src/app/core/models/`? | Definir import o crear DTO |
| G2 | ¿Los parámetros son opcionales o siempre presentes? | Decidir query string manual vs `HttpParams` |

---

## 3. Estructura de carpetas y nomenclatura

### 3.1 Ubicación base

Los nuevos servicios de un módulo se ubican en la carpeta `services/` (plural) dentro de su respectivo módulo feature:

```text
src/app/features/nombre-modulo/services/
```

### 3.2 Regla de archivo directo

Cada servicio se crea **directamente** como un archivo `.service.ts` dentro de la carpeta `services/` del módulo, sin subcarpetas adicionales.

**Ejemplos correctos:**
```text
src/app/features/usuarios/services/usuarios.service.ts      ✅
src/app/features/tramites/services/tipo-documento.service.ts  ✅
src/app/features/tramites/services/bandeja-inscripcion.service.ts ✅
```

**Ejemplos incorrectos:**
```text
src/app/features/tramites/services/UsuariosSos.service.ts   ❌  (PascalCase)
src/app/features/tramites/services/usuariosos.service.ts    ❌  (sin separación kebab-case)
src/app/features/tramites/services/tipo-documento/tipo-documento.service.ts ❌ (subcarpeta innecesaria)
```

### 3.3 Nombre de la clase

La clase sigue `PascalCase` con sufijo `Service`:

```
nombre-del-servicio  →  NombreDelServicioService
usuarios-sos         →  UsuariosSosService
tipo-documento       →  TipoDocumentoService
```

---

## 4. Imports obligatorios

Todo servicio generado **debe** incluir exactamente estos imports (agregar más si el servicio los requiere):

```typescript
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '@/app/core/services/api.service';
import { API_ENDPOINTS } from '@/app/core/constants/api-endpoints';
import { ResponseDto } from '@/app/core/models/response-dto.model';

// Importar el/los DTO(s) específicos del servicio (nunca usar `any`)
import { MiEntidadModel } from '../models/mi-entidad.model';
```

> **Nota:** No se usa `HttpClient` directamente. El `ApiService` del core es la única clase autorizada para importar `HttpClient`. Tampoco se usa `catchError` ni un servicio intermediario de errores — el `errorInterceptor` global los captura automáticamente.

---

## 5. Estructura base del servicio (template)

```typescript
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '@/app/core/services/api.service';
import { API_ENDPOINTS } from '@/app/core/constants/api-endpoints';
import { ResponseDto } from '@/app/core/models/response-dto.model';
import { MiEntidadModel } from '../models/mi-entidad.model';

/**
 * Servicio para [descripción breve de qué gestiona este servicio].
 * Consume el controlador: [BASE del controlador en el backend]
 */
@Injectable({
  providedIn: 'root',
})
export class NombreDelServicioService {

  private readonly apiService = inject(ApiService);

  // Métodos del servicio aquí...

}
```

### Reglas del template base

- Usar `inject(ApiService)` en lugar del constructor o de `HttpClient` directo.
- No se usa `HttpClient`, `HttpParams`, ni `environment.URL_API_*` directamente.
- Todos los endpoints se referencian desde `API_ENDPOINTS` (constantes globales en `core/constants/api-endpoints.ts`).
- Los métodos retornan `Observable<ResponseDto<T>>` **sin unwrappear** (el componente recibe el `ResponseDto` completo).
- La clase lleva un JSDoc breve con la descripción general y el nombre del controlador backend.

---

## 5. Plantillas por verbo HTTP

Todos los métodos retornan `Observable<ResponseDto<T>>` **sin unwrappear** (el `ResponseDto` completo viaja al componente).

### 5.1 GET — Sin parámetros

```typescript
/**
 * Obtiene [descripción de lo que retorna].
 * @returns Lista/objeto de [NombreDTO]
 */
getAll(): Observable<ResponseDto<MiEntidadModel[]>> {
  return this.apiService.get<ResponseDto<MiEntidadModel[]>>(
    API_ENDPOINTS.MI_MODULO.BASE
  );
}
```

---

### 5.2 GET — Con parámetros en query string

Los parámetros se pasan como objeto; el `ApiService` se encarga de serializarlos:

```typescript
/**
 * Obtiene [descripción] filtrando por los parámetros indicados.
 * @param params - Objeto con los parámetros de filtro
 */
getByParams(params: {
  idParam1: string;
  idParam2: string;
}): Observable<ResponseDto<MiEntidadModel[]>> {
  return this.apiService.get<ResponseDto<MiEntidadModel[]>>(
    API_ENDPOINTS.MI_MODULO.BASE,
    params
  );
}
```

---

### 5.3 GET — Con parámetros opcionales

```typescript
/**
 * Obtiene [descripción] con parámetros opcionales/dinámicos.
 * @param filtros - Objeto con los filtros opcionales a aplicar
 */
getByFiltros(filtros: {
  idParam1?: string;
  idParam2?: string;
  idParam3?: string;
}): Observable<ResponseDto<MiEntidadModel[]>> {
  return this.apiService.get<ResponseDto<MiEntidadModel[]>>(
    API_ENDPOINTS.MI_MODULO.BASE,
    filtros
  );
}
```

> **Nota:** El `ApiService` maneja internamente `HttpParams` y la serialización de parámetros opcionales. No es necesario usar `HttpParams` manualmente en los feature services.

---

### 5.4 GET — Con parámetro en path (path variable)

Usar funciones flecha en `API_ENDPOINTS` para rutas dinámicas:

```typescript
/**
 * Obtiene [descripción] por su identificador.
 * @param id - Identificador único del recurso
 */
getById(id: string): Observable<ResponseDto<MiEntidadModel>> {
  return this.apiService.get<ResponseDto<MiEntidadModel>>(
    API_ENDPOINTS.MI_MODULO.DETAILS(id)
  );
}
```

---

### 5.5 POST

```typescript
/**
 * Crea un nuevo [nombre del recurso].
 * @param payload - Datos del [nombre del recurso] a crear
 */
crear(payload: MiEntidadModel): Observable<ResponseDto<MiEntidadModel>> {
  return this.apiService.post<ResponseDto<MiEntidadModel>>(
    API_ENDPOINTS.MI_MODULO.BASE,
    payload
  );
}
```

---

### 5.6 PUT

```typescript
/**
 * Actualiza [nombre del recurso] de forma completa.
 * @param payload - Objeto completo del [nombre del recurso] con los valores actualizados
 */
actualizar(payload: MiEntidadModel): Observable<ResponseDto<MiEntidadModel>> {
  return this.apiService.put<ResponseDto<MiEntidadModel>>(
    API_ENDPOINTS.MI_MODULO.BASE,
    payload
  );
}
```

---

### 5.7 PATCH

**Cuándo usarlo:** Cuando solo se actualiza **una parte** del recurso (ej.: cambiar estatus, modificar un campo puntual).

```typescript
/**
 * Actualiza parcialmente [nombre del recurso].
 * @param id - Identificador del recurso a modificar
 * @param cambios - Objeto parcial con los campos a actualizar
 */
actualizarParcial(id: string, cambios: Partial<MiEntidadModel>): Observable<ResponseDto<MiEntidadModel>> {
  return this.apiService.patch<ResponseDto<MiEntidadModel>>(
    API_ENDPOINTS.MI_MODULO.DETAILS(id),
    cambios
  );
}
```

> **PUT vs PATCH:**
> - **PUT**: Reemplaza el recurso completo. El body debe incluir todos los campos.
> - **PATCH**: Modifica campos específicos. El body solo incluye los campos que cambian.

---

### 5.8 DELETE

```typescript
/**
 * Elimina [nombre del recurso] por su identificador.
 * @param id - Identificador del recurso a eliminar
 */
eliminar(id: string): Observable<ResponseDto<void>> {
  return this.apiService.delete<ResponseDto<void>>(
    API_ENDPOINTS.MI_MODULO.DETAILS(id)
  );
}
```

---

## 6. Reglas de tipado — Nunca usar `any`

| ❌ Incorrecto | ✅ Correcto |
|---|---|
| `Observable<any>` | `Observable<ResponseDto<MiEntidadModel[]>>` |
| `apiService.get<any>(...)` | `apiService.get<ResponseDto<MiEntidadModel[]>>(...)` |
| `(err: any)` | Dejar que Angular propague el `HttpErrorResponse` al suscriptor |
| `data: any` en interfaces | Definir el tipo concreto en el DTO (`.model.ts`) |

> **Única excepción tolerable:** Métodos en migración activa donde el backend aún no tiene un contrato definido. En ese caso, usar `unknown` en lugar de `any` y añadir un comentario `// TODO: tipar con DTO definitivo`.

---

## 7. Manejo de errores — Regla obligatoria

Los servicios **no** manejan errores internamente. Los errores HTTP se propagan directamente al `Observable` que consume el componente. El `errorInterceptor` global captura todos los errores automáticamente y muestra toasts de notificación.

```typescript
// En el componente — NO en el servicio. No se usa MessageService.
this.miServicio.getAll().subscribe({
  next: (response: ResponseDto<MiEntidadModel[]>) => {
    this.lista.set(response.data);
  },
  error: () => {
    // El errorInterceptor ya mostró el toast. Solo actualizar estado local.
  }
});
```

Nunca usar `try/catch` ni `catchError` dentro del servicio.

---

## 8. DTOs y modelos

### 8.1 Si el DTO **ya existe**

Importarlo desde su ruta (sufijo `.model.ts`):

```typescript
import { MiEntidadModel } from '../models/mi-entidad.model';
```

### 8.2 Si el DTO **no existe**

Preguntar al usuario:
1. ¿Se debe crear un DTO nuevo, o se reutiliza alguno existente?
2. Si se crea, ¿cuáles son los campos (nombre, tipo)?

El nuevo DTO se ubicará en la carpeta de modelos del módulo:
```text
src/app/features/nombre-modulo/models/mi-entidad.model.ts
```

> La convención de nomenclatura y estructura interna del DTO se define en [Generacion DTO's](../generacion-dtos/SKILL.md).

---

## 9b. Pruebas unitarias del servicio

La generación de pruebas (`.service.spec.ts`) **se define en una spec separada**: [`../generacion-pruebas-servicios/SKILL.md`](../generacion-pruebas-servicios/SKILL.md).

**Motivo:** Los archivos de testing tienen su propio conjunto de convenciones (mock de `ApiService`, uso de `HttpClientTestingModule`) que justifican un documento independiente.

**Lo que sí aplica a esta spec:** Al finalizar la generación de un servicio en **Modo A**, la IA debe preguntar:

> ¿Deseas generar también el archivo de pruebas `nombre-servicio.service.spec.ts`? (requiere la spec de pruebas)

---

## 9. Ejemplo completo generado

A continuación, un ejemplo completo de cómo debe verse un servicio generado correctamente:

```
Servicio: tramites
Controlador backend: tramites
Métodos: listar todos, buscar por folio y estatus (opcionales), crear, actualizar, cambiar estatus
```

**Archivo:** `src/app/features/tramites/services/tramite.service.ts`

```typescript
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '@/app/core/services/api.service';
import { API_ENDPOINTS } from '@/app/core/constants/api-endpoints';
import { ResponseDto } from '@/app/core/models/response-dto.model';
import { TramiteModel } from '../models/tramite.model';

/**
 * Servicio para la gestión de trámites registrales.
 * Consume el controlador: /tramites
 */
@Injectable({
  providedIn: 'root',
})
export class TramiteService {

  private readonly apiService = inject(ApiService);

  /**
   * Obtiene la lista completa de trámites.
   */
  getAll(): Observable<ResponseDto<TramiteModel[]>> {
    return this.apiService.get<ResponseDto<TramiteModel[]>>(
      API_ENDPOINTS.TRAMITES.BASE
    );
  }

  /**
   * Busca trámites por folio y/o estatus (parámetros opcionales).
   * @param filtros - Objeto con filtros opcionales
   * @param filtros.folio - Número de folio del trámite (opcional)
   * @param filtros.idEstatus - Identificador del estatus (opcional)
   */
  getByFiltros(filtros: {
    folio?: string;
    idEstatus?: string;
  }): Observable<ResponseDto<TramiteModel[]>> {
    return this.apiService.get<ResponseDto<TramiteModel[]>>(
      API_ENDPOINTS.TRAMITES.BUSCAR,
      filtros
    );
  }

  /**
   * Registra un nuevo trámite.
   * @param tramite - Datos del trámite a crear
   */
  crear(tramite: TramiteModel): Observable<ResponseDto<TramiteModel>> {
    return this.apiService.post<ResponseDto<TramiteModel>>(
      API_ENDPOINTS.TRAMITES.BASE,
      tramite
    );
  }

  /**
   * Actualiza los datos de un trámite existente.
   * @param tramite - Objeto completo del trámite con los valores actualizados
   */
  actualizar(tramite: TramiteModel): Observable<ResponseDto<TramiteModel>> {
    return this.apiService.put<ResponseDto<TramiteModel>>(
      API_ENDPOINTS.TRAMITES.BASE,
      tramite
    );
  }

  /**
   * Activa o desactiva el estatus de un trámite.
   * @param idTramite - Identificador único del trámite
   */
  cambiarEstatus(idTramite: string): Observable<ResponseDto<void>> {
    return this.apiService.patch<ResponseDto<void>>(
      API_ENDPOINTS.TRAMITES.ESTATUS(idTramite),
      {}
    );
  }

}
```

---

## 10. Checklist de validación antes de entregar

### Modo A — Servicio nuevo
- [ ] El archivo tiene el sufijo `.service.ts` y está en `src/app/features/[modulo]/services/` (plural)
- [ ] La clase tiene `@Injectable({ providedIn: 'root' })`
- [ ] Usa `inject(ApiService)` — **no** `HttpClient`, no `BASE_URL`
- [ ] Los endpoints usan `API_ENDPOINTS.MI_MODULO.*` — **no** strings hardcodeados
- [ ] Todos los métodos retornan `Observable<ResponseDto<T>>` completo (sin unwrap con `.pipe(map(...))`)
- [ ] No se usa `any` en ningún tipo de retorno ni parámetro
- [ ] Todos los métodos tienen JSDoc con descripción y `@param` cuando aplica
- [ ] Los DTOs importados existen en `models/` con sufijo `.model.ts`
- [ ] El servicio no maneja errores ni muestra toasts (lo hace el `errorInterceptor` global)
- [ ] Se ofreció generar el archivo de pruebas `.service.spec.ts`

### Modo B — Método agregado
- [ ] El método nuevo sigue el mismo estilo que los métodos ya existentes en el archivo (ApiService + API_ENDPOINTS)
- [ ] No se modificó ningún método, import ni propiedad preexistente (salvo agregar imports necesarios)
- [ ] El método nuevo está al final de la clase, antes del cierre `}`
- [ ] No hay imports duplicados
- [ ] El método nuevo tiene JSDoc
- [ ] El DTO del método nuevo existe en `models/`

### Modo C — Método modificado
- [ ] Se mostró el **antes** y **después** del método antes de aplicar
- [ ] Solo se modificó el método indicado, nada más
- [ ] Si cambió el DTO, el nuevo import fue agregado sin eliminar los existentes
- [ ] El JSDoc fue actualizado para reflejar el cambio
