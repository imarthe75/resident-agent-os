---
skill: generacion-pruebas-servicios
description: Guía canónica para generar pruebas unitarias completas para servicios Angular, usando HttpClientTestingModule, HttpTestingController y mocks de ManejoErroresService.
---

# Spec: Generación de Pruebas Unitarias de Servicios Angular

## Propósito

Este documento define el estándar de pruebas unitarias para los servicios Angular. Las pruebas generadas deben verificar el comportamiento real de cada método HTTP: éxito, errores esperados y construcción correcta de la request.

> **Contexto del proyecto:** Los archivos `.service.spec.ts` existentes son scaffolds vacíos generados por Angular CLI. Esta spec establece el estándar a seguir para escribir pruebas reales a partir de ahora.

---

## 1. Principios de testing aplicados

| Principio | Descripción |
|---|---|
| **Unitario** | Cada prueba evalúa un solo método en aislamiento, sin llamadas HTTP reales |
| **Determinista** | Las pruebas siempre producen el mismo resultado independientemente del entorno |
| **AAA** | Cada prueba sigue el patrón **Arrange → Act → Assert** |
| **FIRST** | Fast, Independent, Repeatable, Self-validating, Timely |
| **Happy path + Error path** | Todo método tiene al menos una prueba de éxito y una de error |

---

## 2. Configuración del módulo de pruebas

### 2.1 Imports obligatorios

```typescript
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { NombreServicioService } from './nombre-servicio.service';
import { ApiService } from '@/app/core/services/api.service';
import { API_ENDPOINTS } from '@/app/core/constants/api-endpoints';
import { ResponseDto } from '@/app/core/models/response-dto.model';

// DTO(s) del servicio
import { MiEntidadModel } from '../models/mi-entidad.model';
```

### 2.2 Setup del `TestBed`

```typescript
describe('NombreServicioService', () => {
  let service: NombreServicioService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'patch', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        NombreServicioService,
        { provide: ApiService, useValue: spy },
      ],
    });

    service = TestBed.inject(NombreServicioService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });
```

> **Nota:** Los feature services inyectan `ApiService`, no `HttpClient`. Por eso se mockea `ApiService` con `jasmine.createSpyObj`. Ya no se usa `HttpClientTestingModule` ni `HttpTestingController`. Se verifica que el método correcto de `ApiService` fue llamado con el endpoint y parámetros adecuados.

---

## 3. Plantillas de prueba por verbo HTTP

### 3.1 GET — Sin parámetros (happy path + error)

```typescript
describe('getAll', () => {
  const mockResponse: ResponseDto<MiEntidadModel[]> = {
    responseCode: '200',
    responseMessage: 'OK',
    data: [
      { id: 1, nombre: 'Item 1', activo: true },
      { id: 2, nombre: 'Item 2', activo: false },
    ],
    errorList: [],
  };

  it('debería retornar el ResponseDto completo (happy path)', (done) => {
    // Arrange
    apiServiceSpy.get.and.returnValue(of(mockResponse));

    // Act
    service.getAll().subscribe({
      next: (response) => {
        // Assert: recibe ResponseDto<T> completo, no datos unwrappeado
        expect(response.data.length).toBe(2);
        expect(response.responseCode).toBe('200');
        expect(response.data[0].nombre).toBe('Item 1');
        done();
      },
      error: () => fail('No se esperaba un error'),
    });

    // Assert: verificar endpoint y que se llamó a ApiService.get
    expect(apiServiceSpy.get).toHaveBeenCalledWith(API_ENDPOINTS.MI_MODULO.BASE);
  });

  it('debería propagar el error cuando ApiService falla (error path)', (done) => {
    // Arrange
    apiServiceSpy.get.and.returnValue(throwError(() => new Error('Error de conexión')));

    // Act
    service.getAll().subscribe({
      next: () => fail('Se esperaba un error'),
      error: (err) => {
        expect(err).toBeDefined();
        done();
      },
    });
  });
});
```

---

### 3.2 GET — Con parámetros en query string

```typescript
describe('getByParams', () => {
  const mockResponse: ResponseDto<MiEntidadModel[]> = {
    responseCode: '200', responseMessage: 'OK',
    data: [{ id: 1, nombre: 'Test', activo: true }],
    errorList: [],
  };

  it('debería pasar los parámetros a ApiService.get', (done) => {
    // Arrange
    const params = { idParam1: 'ABC', idParam2: 'OFC01' };
    apiServiceSpy.get.and.returnValue(of(mockResponse));

    // Act
    service.getByParams(params).subscribe({
      next: (response) => {
        expect(response.data.length).toBe(1);
        done();
      },
      error: () => fail('No se esperaba un error'),
    });

    // Assert: los parámetros se delegan a ApiService
    expect(apiServiceSpy.get).toHaveBeenCalledWith(
      API_ENDPOINTS.MI_MODULO.BASE,
      params
    );
  });
});
```

---

### 3.3 GET — Con parámetros opcionales

```typescript
describe('getByFiltros', () => {
  const mockResponse: ResponseDto<MiEntidadModel[]> = {
    responseCode: '200', responseMessage: 'OK',
    data: [], errorList: [],
  };

  it('debería pasar solo los filtros proporcionados', (done) => {
    // Arrange: solo se pasa idEstatus
    const filtros = { idEstatus: 'ACTIVO' };
    apiServiceSpy.get.and.returnValue(of(mockResponse));

    // Act
    service.getByFiltros(filtros).subscribe({
      next: () => done(),
      error: () => fail('No se esperaba un error'),
    });

    // Assert: ApiService recibe el objeto de filtros completo
    expect(apiServiceSpy.get).toHaveBeenCalledWith(
      API_ENDPOINTS.MI_MODULO.BASE,
      filtros
    );
  });
});
```

---

### 3.4 POST

```typescript
describe('crear', () => {
  const payload: MiEntidadModel = { id: 0, nombre: 'Nuevo item', activo: true };
  const mockResponse: ResponseDto<MiEntidadModel> = {
    responseCode: '201', responseMessage: 'Creado',
    data: { id: 99, nombre: 'Nuevo item', activo: true },
    errorList: [],
  };

  it('debería llamar a ApiService.post con el payload y endpoint correctos', (done) => {
    // Arrange
    apiServiceSpy.post.and.returnValue(of(mockResponse));

    // Act
    service.crear(payload).subscribe({
      next: (response) => {
        expect(response.data.id).toBe(99);
        done();
      },
      error: () => fail('No se esperaba un error'),
    });

    // Assert
    expect(apiServiceSpy.post).toHaveBeenCalledWith(
      API_ENDPOINTS.MI_MODULO.BASE,
      payload
    );
  });

  it('debería propagar el error en caso de fallo', (done) => {
    // Arrange
    const errorResponse = { status: 400, message: 'Bad Request' };
    apiServiceSpy.post.and.returnValue(throwError(() => errorResponse));

    // Act
    service.crear(payload).subscribe({
      next: () => fail('Se esperaba un error'),
      error: (err) => {
        expect(err.status).toBe(400);
        done();
      },
    });
  });
});
```

---

### 3.5 PUT

```typescript
describe('actualizar', () => {
  const payload: MiEntidadModel = { id: 5, nombre: 'Item actualizado', activo: false };
  const mockResponse: ResponseDto<MiEntidadModel> = {
    responseCode: '200', responseMessage: 'OK',
    data: payload, errorList: [],
  };

  it('debería enviar PUT con el payload al endpoint correcto', (done) => {
    apiServiceSpy.put.and.returnValue(of(mockResponse));

    service.actualizar(payload).subscribe({
      next: (response) => {
        expect(response.data).toEqual(payload);
        done();
      },
      error: () => fail('No se esperaba un error'),
    });

    expect(apiServiceSpy.put).toHaveBeenCalledWith(
      API_ENDPOINTS.MI_MODULO.BASE,
      payload
    );
  });
});
```

---

### 3.6 PATCH

```typescript
describe('actualizarParcial', () => {
  const id = '42';
  const cambios: Partial<MiEntidadModel> = { activo: false };
  const mockResponse: ResponseDto<MiEntidadModel> = {
    responseCode: '200', responseMessage: 'OK',
    data: { id: 42, nombre: 'Item', activo: false },
    errorList: [],
  };

  it('debería llamar a ApiService.patch con los cambios parciales', (done) => {
    apiServiceSpy.patch.and.returnValue(of(mockResponse));

    service.actualizarParcial(id, cambios).subscribe({
      next: (response) => {
        expect(response.data.activo).toBeFalse();
        done();
      },
      error: () => fail('No se esperaba un error'),
    });

    expect(apiServiceSpy.patch).toHaveBeenCalledWith(
      API_ENDPOINTS.MI_MODULO.DETAILS(id),
      cambios
    );
  });
});
```

---

### 3.7 DELETE

```typescript
describe('eliminar', () => {
  const id = '10';
  const mockResponse: ResponseDto<boolean> = {
    responseCode: '200', responseMessage: 'Eliminado',
    data: true, errorList: [],
  };

  it('debería llamar a ApiService.delete con el endpoint correcto', (done) => {
    apiServiceSpy.delete.and.returnValue(of(mockResponse));

    service.eliminar(id).subscribe({
      next: (response) => {
        expect(response.data).toBeTrue();
        done();
      },
      error: () => fail('No se esperaba un error'),
    });

    expect(apiServiceSpy.delete).toHaveBeenCalledWith(
      API_ENDPOINTS.MI_MODULO.DETAILS(id)
    );
  });
});
```

---

## 4. Pruebas de errores — Casos estándar

La IA debe generar pruebas para los errores que pueda lanzar el backend. Al menos cubrir:

| Código HTTP | Escenario | Prueba recomendada |
|---|---|---|
| `400` | Bad Request (validación backend) | `apiServiceSpy.get.and.returnValue(throwError(() => ({ status: 400 })))` |
| `401` | Unauthorized | `apiServiceSpy.get.and.returnValue(throwError(() => ({ status: 401 })))` |
| `403` | Forbidden (sin permisos) | `apiServiceSpy.get.and.returnValue(throwError(() => ({ status: 403 })))` |
| `404` | Not Found | `apiServiceSpy.get.and.returnValue(throwError(() => ({ status: 404 })))` |
| `500` | Internal Server Error | `apiServiceSpy.get.and.returnValue(throwError(() => ({ status: 500 })))` |

> **Regla:** No hace falta probar todos los códigos en cada método. **Siempre** incluir al menos un error path por método.

---

## 5. Mocks de datos — Helpers de prueba

### 5.1 Mock factory (factory function)

Crear funciones helper para generar mocks reutilizables dentro del mismo archivo `.spec.ts`:

```typescript
// Al inicio del describe, antes de los beforeEach:
function mockMiDto(overrides: Partial<MiDtoInterface> = {}): MiDtoInterface {
  return {
    id: 1,
    nombre: 'Mock Item',
    activo: true,
    ...overrides,
  };
}

function mockResponseGeneric<T>(data: T): ResponseGeneric<T> {
  return {
    responseCode: '200',
    responseMessage: 'OK',
    data,
    errorList: [],
  };
}
```

**Uso:**
```typescript
const payload = mockMiDto({ nombre: 'Personalizado', activo: false });
const response = mockResponseGeneric([mockMiDto(), mockMiDto({ id: 2 })]);
```

---

## 6. Estructura completa de un archivo `.service.spec.ts`

```typescript
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { NombreServicioService } from './nombre-servicio.service';
import { ApiService } from '@/app/core/services/api.service';
import { API_ENDPOINTS } from '@/app/core/constants/api-endpoints';
import { ResponseDto } from '@/app/core/models/response-dto.model';
import { MiEntidadModel } from '../models/mi-entidad.model';

// ─── Helpers ───────────────────────────────────────────────────────────────
function mockEntidad(overrides: Partial<MiEntidadModel> = {}): MiEntidadModel {
  return { id: 1, nombre: 'Mock', activo: true, ...overrides };
}

function mockResponse<T>(data: T): ResponseDto<T> {
  return { responseCode: '200', responseMessage: 'OK', data, errorList: [] };
}

// ─── Suite principal ────────────────────────────────────────────────────────
describe('NombreServicioService', () => {
  let service: NombreServicioService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'patch', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        NombreServicioService,
        { provide: ApiService, useValue: spy },
      ],
    });

    service = TestBed.inject(NombreServicioService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  // ── Prueba de instanciación ────────────────────────────────────────────────
  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ── getAll ─────────────────────────────────────────────────────────────────
  describe('getAll', () => {
    it('debería retornar el ResponseDto en el happy path', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockResponse([mockEntidad({ id: 1 }), mockEntidad({ id: 2 })])));

      service.getAll().subscribe({
        next: (res) => { expect(res.data.length).toBe(2); done(); },
        error: () => fail('No se esperaba error'),
      });

      expect(apiServiceSpy.get).toHaveBeenCalledWith(API_ENDPOINTS.MI_MODULO.BASE);
    });

    it('debería propagar el error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => ({ status: 500 })));

      service.getAll().subscribe({
        next: () => fail('Se esperaba error'),
        error: (err) => { expect(err.status).toBe(500); done(); },
      });
    });
  });

  // ── crear ──────────────────────────────────────────────────────────────────
  describe('crear', () => {
    it('debería llamar a ApiService.post con el payload correcto', (done) => {
      const payload = mockEntidad({ id: 0 });
      apiServiceSpy.post.and.returnValue(of(mockResponse(mockEntidad({ id: 99 }))));

      service.crear(payload).subscribe({
        next: (res) => { expect(res.data.id).toBe(99); done(); },
        error: () => fail('No se esperaba error'),
      });

      expect(apiServiceSpy.post).toHaveBeenCalledWith(API_ENDPOINTS.MI_MODULO.BASE, payload);
    });
  });

}); // fin describe
```

---

## 7. Naming convention para `describe` e `it`

| Elemento | Convención | Ejemplo |
|---|---|---|
| `describe` principal | Nombre de la clase del servicio | `describe('UsuariosSosService', ...)` |
| `describe` por método | Nombre del método | `describe('getUsuariosByParams', ...)` |
| `it` happy path | `'debería [comportamiento esperado]'` | `'debería retornar la lista de usuarios'` |
| `it` error path | `'debería delegar el error [código] al ManejoErroresService'` | `'debería delegar el error 400 al ManejoErroresService'` |
| `it` validación de request | `'debería construir la URL/body/método correctamente'` | `'debería incluir todos los parámetros en la URL'` |

---

## 8. Reglas obligatorias

1. **`done()` callback** — Obligatorio en pruebas con Observables para evitar falsos positivos (prueba que pasa sin ejecutar el `subscribe`).
2. **`fail(...)`** — Usar en el bloque contrario al esperado (`error` en happy path, `next` en error path).
3. **Un `it` por comportamiento** — No combinar el happy path y el error path en una sola prueba.
4. **No `setTimeout` ni `fakeAsync`** — Para servicios que usan `ApiService` mockeado, no se necesita.
5. **Verificar el método de `ApiService`** en cada prueba (`expect(apiServiceSpy.get).toHaveBeenCalledWith(...)`).
6. **Verificar el uso de `API_ENDPOINTS`** — todas las llamadas deben usar constantes, no strings literales.

---

## 9. Ubicación y nombre del archivo

El archivo de pruebas se ubica **en la misma carpeta** que el servicio (dentro de `services/`):

```text
src/app/features/nombre-modulo/services/
├── nombre-servicio.service.ts
└── nombre-servicio.service.spec.ts   ← mismo kebab-case, sufijo .spec.ts
```

---

## 10. Checklist de validación antes de entregar

- [ ] El archivo está en `src/app/features/[modulo]/services/` con sufijo `.service.spec.ts`
- [ ] `ApiService` se mockea con `jasmine.createSpyObj` — no se usa `HttpClientTestingModule`
- [ ] Cada método del servicio tiene al menos una prueba happy path y una error path
- [ ] Todas las pruebas async usan el callback `done()`
- [ ] Los bloques contrarios usan `fail(...)`
- [ ] Se verifica el método de `ApiService` y el endpoint de `API_ENDPOINTS` usado
- [ ] Se usan factory functions (`mockEntidad`, `mockResponse`) para evitar repetición
- [ ] Los nombres de `it` están en español y siguen la convención `'debería...'`

---

## 11. Referencias cruzadas

| Spec relacionada | Cuándo consultarla |
|---|---|
| `../generacion-servicios/SKILL.md` | Para entender la estructura del servicio a probar |
| `../generacion-dtos/SKILL.md` | Para crear los mocks con el tipado correcto del DTO |
