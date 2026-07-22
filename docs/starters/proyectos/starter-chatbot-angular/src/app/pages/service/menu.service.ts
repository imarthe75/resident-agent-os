import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@/environments/environment';
import { ResponseDto } from '@/app/core/models/response-dto.model';

export interface MenuResponse {
    id: number;
    label: string;
    route?: string | null;
    icon?: string | null;
    parentId?: number | null;
    peso?: number | null;
    activo?: boolean;
    ref: string;
    rowVersion: number;
    fechaCreacion: string;
    fechaModificacion: string;
}

export interface CrearMenuRequest {
    label: string;
    route?: string | null;
    icon?: string | null;
    parentId?: number | null;
    peso?: number | null;
    ref?: string;
}

export interface ActualizarMenuRequest {
    label?: string;
    route?: string | null;
    icon?: string | null;
    parentId?: number | null;
    peso?: number | null;
    activo?: boolean;
    ref?: string;
}

export interface MenuRolResponse {
    id: number;
    rolId: number;
    menuId: number;
    ref: string;
    rowVersion: number;
    fechaCreacion: string;
    fechaModificacion: string;
}

const API_BASE = `${environment.apiBaseUrl}/menus`;

@Injectable({ providedIn: 'root' })
export class MenuService {
    private readonly http = inject(HttpClient);

    listar(): Observable<MenuResponse[]> {
        return this.http.get<ResponseDto<MenuResponse[]>>(API_BASE).pipe(map((r) => r.data));
    }

    obtener(id: number): Observable<MenuResponse> {
        return this.http.get<ResponseDto<MenuResponse>>(`${API_BASE}/${id}`).pipe(map((r) => r.data));
    }

    crear(request: CrearMenuRequest): Observable<MenuResponse> {
        return this.http.post<ResponseDto<MenuResponse>>(API_BASE, request).pipe(map((r) => r.data));
    }

    actualizar(id: number, request: ActualizarMenuRequest): Observable<MenuResponse> {
        return this.http.put<ResponseDto<MenuResponse>>(`${API_BASE}/${id}`, request).pipe(map((r) => r.data));
    }

    eliminar(id: number): Observable<void> {
        return this.http.delete<void>(`${API_BASE}/${id}`);
    }

    listarMenusPorRol(rolId: number): Observable<MenuResponse[]> {
        return this.http.get<ResponseDto<MenuResponse[]>>(`${API_BASE}/roles/${rolId}`).pipe(map((r) => r.data));
    }

    asignarMenu(rolId: number, menuId: number): Observable<MenuRolResponse> {
        return this.http.post<ResponseDto<MenuRolResponse>>(`${API_BASE}/${menuId}/roles/${rolId}`, {}).pipe(map((r) => r.data));
    }

    desasignarMenu(rolId: number, menuId: number): Observable<void> {
        return this.http.delete<void>(`${API_BASE}/${menuId}/roles/${rolId}`);
    }
}
