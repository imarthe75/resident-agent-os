import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@/environments/environment';
import { ResponseDto } from '@/app/core/models/response-dto.model';

export interface PrivilegioResponse {
    id: number;
    nombre: string;
    descripcion: string;
    activo: boolean;
    ref: string;
    rowVersion: number;
    fechaCreacion: string;
    fechaModificacion: string;
}

export interface CrearPrivilegioRequest {
    nombre: string;
    descripcion?: string;
    ref?: string;
}

export interface ActualizarPrivilegioRequest {
    nombre?: string;
    descripcion?: string;
    activo?: boolean;
    ref?: string;
}

export interface RolPrivilegioResponse {
    id: number;
    rolId: number;
    privilegioId: number;
    ref: string;
    rowVersion: number;
    fechaCreacion: string;
    fechaModificacion: string;
}

const API_BASE = `${environment.apiBaseUrl}/privilegios`;

@Injectable({ providedIn: 'root' })
export class PrivilegioService {
    private readonly http = inject(HttpClient);

    listar(): Observable<PrivilegioResponse[]> {
        return this.http.get<ResponseDto<PrivilegioResponse[]>>(API_BASE).pipe(map((r) => r.data));
    }

    obtener(id: number): Observable<PrivilegioResponse> {
        return this.http.get<ResponseDto<PrivilegioResponse>>(`${API_BASE}/${id}`).pipe(map((r) => r.data));
    }

    crear(request: CrearPrivilegioRequest): Observable<PrivilegioResponse> {
        return this.http.post<ResponseDto<PrivilegioResponse>>(API_BASE, request).pipe(map((r) => r.data));
    }

    actualizar(id: number, request: ActualizarPrivilegioRequest): Observable<PrivilegioResponse> {
        return this.http.put<ResponseDto<PrivilegioResponse>>(`${API_BASE}/${id}`, request).pipe(map((r) => r.data));
    }

    eliminar(id: number): Observable<void> {
        return this.http.delete<void>(`${API_BASE}/${id}`);
    }
}
