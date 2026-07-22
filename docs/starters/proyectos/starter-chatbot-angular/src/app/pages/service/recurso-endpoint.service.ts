import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@/environments/environment';
import { PrivilegioResponse } from './privilegio.service';

export interface RecursoEndpointResponse {
    id: number;
    antPattern: string;
    metodoHttp: string;
    descripcion: string;
    activo: boolean;
    ref: string;
    rowVersion: number;
    fechaCreacion: string;
    fechaModificacion: string;
}

export interface CrearRecursoEndpointRequest {
    antPattern: string;
    metodoHttp: string;
    descripcion?: string;
    ref?: string;
}

export interface ActualizarRecursoEndpointRequest {
    antPattern?: string;
    metodoHttp?: string;
    descripcion?: string;
    activo?: boolean;
    ref?: string;
}

export interface RecursoPrivilegioResponse {
    id: number;
    recursoId: number;
    privilegioId: number;
    ref: string;
    rowVersion: number;
    fechaCreacion: string;
    fechaModificacion: string;
}

const API_BASE = `${environment.apiBaseUrl}/recursos-endpoints`;

@Injectable({ providedIn: 'root' })
export class RecursoEndpointService {
    private readonly http = inject(HttpClient);

    listar(): Observable<RecursoEndpointResponse[]> {
        return this.http.get<RecursoEndpointResponse[]>(API_BASE);
    }

    obtener(id: number): Observable<RecursoEndpointResponse> {
        return this.http.get<RecursoEndpointResponse>(`${API_BASE}/${id}`);
    }

    crear(request: CrearRecursoEndpointRequest): Observable<RecursoEndpointResponse> {
        return this.http.post<RecursoEndpointResponse>(API_BASE, request);
    }

    actualizar(id: number, request: ActualizarRecursoEndpointRequest): Observable<RecursoEndpointResponse> {
        return this.http.put<RecursoEndpointResponse>(`${API_BASE}/${id}`, request);
    }

    eliminar(id: number): Observable<void> {
        return this.http.delete<void>(`${API_BASE}/${id}`);
    }

    listarPrivilegiosPorRecurso(recursoId: number): Observable<PrivilegioResponse[]> {
        return this.http.get<PrivilegioResponse[]>(`${API_BASE}/${recursoId}/privilegios`);
    }

    asignarPrivilegio(recursoId: number, privilegioId: number): Observable<RecursoPrivilegioResponse> {
        return this.http.post<RecursoPrivilegioResponse>(`${API_BASE}/${recursoId}/privilegios/${privilegioId}`, {});
    }

    desasignarPrivilegio(recursoId: number, privilegioId: number): Observable<void> {
        return this.http.delete<void>(`${API_BASE}/${recursoId}/privilegios/${privilegioId}`);
    }
}
