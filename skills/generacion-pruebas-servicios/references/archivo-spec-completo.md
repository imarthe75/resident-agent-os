# 6. Estructura completa de un archivo `.service.spec.ts`

> Detalle de la skill `generacion-pruebas-servicios` (se lee al generar; las reglas están en su SKILL.md).

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
