import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@/environments/environment';
import { ResponseDto } from '@/app/core/models/response-dto.model';

export interface CatalogoResponse {
    id: number;
    nombre: string;
    descripcion: string;
    activo: boolean;
    ref: string;
    rowVersion: number;
    fechaCreacion: string;
    fechaModificacion: string;
}

export interface CrearCatalogoRequest {
    nombre: string;
    descripcion?: string;
    ref?: string;
}

export interface ActualizarCatalogoRequest {
    nombre?: string;
    descripcion?: string;
    activo?: boolean;
    ref?: string;
}

export interface ItemCatalogoResponse {
    id: number;
    catalogoId: number;
    valor: string;
    activo: boolean;
    ref: string;
    rowVersion: number;
    fechaCreacion: string;
    fechaModificacion: string;
}

export interface CrearItemCatalogoRequest {
    valor: string;
    ref?: string;
}

export interface ActualizarItemCatalogoRequest {
    valor?: string;
    activo?: boolean;
    ref?: string;
}

const API_BASE = `${environment.apiBaseUrl}/catalogos`;

@Injectable({ providedIn: 'root' })
export class CatalogoService {
    private readonly http = inject(HttpClient);

    listar(incluirInactivos = false): Observable<CatalogoResponse[]> {
        return this.http.get<ResponseDto<CatalogoResponse[]>>(API_BASE, { params: { incluirInactivos } }).pipe(map((r) => r.data));
    }

    obtener(id: number): Observable<CatalogoResponse> {
        return this.http.get<ResponseDto<CatalogoResponse>>(`${API_BASE}/${id}`).pipe(map((r) => r.data));
    }

    crear(request: CrearCatalogoRequest): Observable<CatalogoResponse> {
        return this.http.post<ResponseDto<CatalogoResponse>>(API_BASE, request).pipe(map((r) => r.data));
    }

    actualizar(id: number, request: ActualizarCatalogoRequest): Observable<CatalogoResponse> {
        return this.http.put<ResponseDto<CatalogoResponse>>(`${API_BASE}/${id}`, request).pipe(map((r) => r.data));
    }

    eliminar(id: number): Observable<void> {
        return this.http.delete<void>(`${API_BASE}/${id}`);
    }

    listarItems(catalogoId: number, incluirInactivos = false): Observable<ItemCatalogoResponse[]> {
        return this.http.get<ResponseDto<ItemCatalogoResponse[]>>(`${API_BASE}/${catalogoId}/items`, { params: { incluirInactivos } }).pipe(map((r) => r.data));
    }

    crearItem(catalogoId: number, request: CrearItemCatalogoRequest): Observable<ItemCatalogoResponse> {
        return this.http.post<ResponseDto<ItemCatalogoResponse>>(`${API_BASE}/${catalogoId}/items`, request).pipe(map((r) => r.data));
    }

    actualizarItem(catalogoId: number, itemId: number, request: ActualizarItemCatalogoRequest): Observable<ItemCatalogoResponse> {
        return this.http.put<ResponseDto<ItemCatalogoResponse>>(`${API_BASE}/${catalogoId}/items/${itemId}`, request).pipe(map((r) => r.data));
    }

    eliminarItem(catalogoId: number, itemId: number): Observable<void> {
        return this.http.delete<void>(`${API_BASE}/${catalogoId}/items/${itemId}`);
    }
}
