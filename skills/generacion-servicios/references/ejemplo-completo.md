# 9. Ejemplo completo generado

> Detalle de la skill `generacion-servicios` (se lee al generar; las reglas están en su SKILL.md).

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
