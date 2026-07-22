import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@/environments/environment';
import { ResponseDto } from '@/app/core/models/response-dto.model';
import { PrivilegioResponse, RolPrivilegioResponse } from './privilegio.service';

export interface RolResponse {
    id: number;
    codigo: string;
    nombre: string;
    descripcion: string;
    activo: boolean;
    ref: string;
    rowVersion: number;
    fechaCreacion: string;
    fechaModificacion: string;
}

export interface CrearRolRequest {
    codigo: string;
    nombre: string;
    descripcion?: string;
    ref?: string;
}

export interface ActualizarRolRequest {
    codigo?: string;
    nombre?: string;
    descripcion?: string;
    activo?: boolean;
    ref?: string;
}

export interface UsuarioRolResponse {
    id: number;
    usuarioId: string;
    rolId: number;
    ref: string;
    rowVersion: number;
    fechaCreacion: string;
    fechaModificacion: string;
}

const API_BASE = `${environment.apiBaseUrl}/roles`;

@Injectable({ providedIn: 'root' })
export class RolService {
    private readonly http = inject(HttpClient);

    listar(): Observable<RolResponse[]> {
        return this.http.get<ResponseDto<RolResponse[]>>(API_BASE).pipe(map((r) => r.data));
    }

    obtener(id: number): Observable<RolResponse> {
        return this.http.get<ResponseDto<RolResponse>>(`${API_BASE}/${id}`).pipe(map((r) => r.data));
    }

    crear(request: CrearRolRequest): Observable<RolResponse> {
        return this.http.post<ResponseDto<RolResponse>>(API_BASE, request).pipe(map((r) => r.data));
    }

    actualizar(id: number, request: ActualizarRolRequest): Observable<RolResponse> {
        return this.http.put<ResponseDto<RolResponse>>(`${API_BASE}/${id}`, request).pipe(map((r) => r.data));
    }

    eliminar(id: number): Observable<void> {
        return this.http.delete<void>(`${API_BASE}/${id}`);
    }

    listarUsuariosPorRol(rolId: number): Observable<UsuarioRolResponse[]> {
        return this.http.get<ResponseDto<UsuarioRolResponse[]>>(`${API_BASE}/${rolId}/usuarios`).pipe(map((r) => r.data));
    }

    asignarUsuario(rolId: number, usuarioId: string): Observable<UsuarioRolResponse> {
        return this.http.post<ResponseDto<UsuarioRolResponse>>(`${API_BASE}/${rolId}/usuarios/${usuarioId}`, {}).pipe(map((r) => r.data));
    }

    desasignarUsuario(rolId: number, usuarioId: string): Observable<void> {
        return this.http.delete<void>(`${API_BASE}/${rolId}/usuarios/${usuarioId}`);
    }

    listarPrivilegiosPorRol(rolId: number): Observable<PrivilegioResponse[]> {
        return this.http.get<ResponseDto<PrivilegioResponse[]>>(`${API_BASE}/${rolId}/privilegios`).pipe(map((r) => r.data));
    }

    asignarPrivilegio(rolId: number, privilegioId: number): Observable<RolPrivilegioResponse> {
        return this.http.post<ResponseDto<RolPrivilegioResponse>>(`${API_BASE}/${rolId}/privilegios/${privilegioId}`, {}).pipe(map((r) => r.data));
    }

    desasignarPrivilegio(rolId: number, privilegioId: number): Observable<void> {
        return this.http.delete<void>(`${API_BASE}/${rolId}/privilegios/${privilegioId}`);
    }
}
