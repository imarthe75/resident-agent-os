---
name: generacion-pruebas-servicios
description: Guía canónica para generar pruebas unitarias completas para servicios Angular, usando HttpClientTestingModule, HttpTestingController y mocks de ManejoErroresService.
---

# Spec: Generación de Pruebas Unitarias de Servicios Angular

## Propósito

Este documento define el estándar de pruebas unitarias para los servicios Angular. Las pruebas generadas deben verificar el comportamiento real de cada método HTTP: éxito, errores esperados y construcción correcta de la request.

> **Contexto del proyecto:** Los archivos `.service.spec.ts` existentes son scaffolds vacíos generados por Angular CLI. Esta skill establece el estándar para escribir pruebas reales.

---

> **Ejecutor de pruebas:** la plantilla base usa hoy Karma + Jasmine (`ng test`). Las plantillas de esta skill aplican a ese ejecutor. Si el proyecto
> migra al ejecutor que proponga la versión vigente de Angular CLI (p. ej. Vitest), la estructura (`TestBed`, `HttpTestingController`,
> un caso feliz y uno de error por método) se conserva; solo cambian las utilidades de aserción y espías.
> Estas pruebas aíslan el servicio con `HttpTestingController`: demuestran el contrato HTTP del cliente, no que el backend funcione.


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

> **Nota:** Los feature services inyectan `ApiService`, no `HttpClient`. Por eso se mockea `ApiService` con `jasmine.createSpyObj`. No se usan `HttpClientTestingModule` ni `HttpTestingController`. Se verifica que el método correcto de `ApiService` fue llamado con el endpoint y parámetros adecuados.

---

## 3. Plantillas de prueba por verbo HTTP

**Antes de generar, lee [`references/plantillas-por-verbo.md`](references/plantillas-por-verbo.md)** (plantillas completas). Las reglas de esta skill siguen aplicando.

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

**Antes de generar, lee [`references/archivo-spec-completo.md`](references/archivo-spec-completo.md)** (plantillas completas). Las reglas de esta skill siguen aplicando.

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

## Reglas del escáner que esta skill evita
`TEST-SKIPPED-WITHOUT-REASON`, `FRONTEND-TOKEN-IN-URL`, `FRONTEND-HARDCODED-API-URL`.
Corrección de cada una y el resto del catálogo: skill `prevencion-hallazgos-seguridad-calidad`.
