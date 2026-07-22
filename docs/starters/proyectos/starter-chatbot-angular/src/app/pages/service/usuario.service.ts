import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@/environments/environment';
import { ResponseDto } from '@/app/core/models/response-dto.model';

export interface UsuarioResponse {
    id: string;
    username: string;
    primerApellido: string;
    segundoApellido: string;
    nombres: string;
    correo: string;
    urlFotoPerfil: string;
    activo: boolean;
    ref: string;
    rowVersion: number;
    fechaCreacion: string;
    fechaModificacion: string;
}

export interface CrearUsuarioRequest {
    username: string;
    primerApellido?: string;
    segundoApellido?: string;
    nombres?: string;
    correo?: string;
    urlFotoPerfil?: string;
    ref?: string;
}

export interface ActualizarUsuarioRequest {
    primerApellido?: string;
    segundoApellido?: string;
    nombres?: string;
    correo?: string;
    urlFotoPerfil?: string;
    activo?: boolean;
    ref?: string;
}

const API_BASE = `${environment.apiBaseUrl}/usuarios`;

@Injectable({ providedIn: 'root' })
export class UsuarioService {
    private readonly http = inject(HttpClient);

    listar(): Observable<UsuarioResponse[]> {
        return this.http.get<ResponseDto<UsuarioResponse[]>>(API_BASE).pipe(map((r) => r.data));
    }

    obtener(id: string): Observable<UsuarioResponse> {
        return this.http.get<ResponseDto<UsuarioResponse>>(`${API_BASE}/${id}`).pipe(map((r) => r.data));
    }

    crear(request: CrearUsuarioRequest): Observable<UsuarioResponse> {
        return this.http.post<ResponseDto<UsuarioResponse>>(API_BASE, request).pipe(map((r) => r.data));
    }

    actualizar(id: string, request: ActualizarUsuarioRequest): Observable<UsuarioResponse> {
        return this.http.put<ResponseDto<UsuarioResponse>>(`${API_BASE}/${id}`, request).pipe(map((r) => r.data));
    }

    eliminar(id: string): Observable<void> {
        return this.http.delete<void>(`${API_BASE}/${id}`);
    }
}
