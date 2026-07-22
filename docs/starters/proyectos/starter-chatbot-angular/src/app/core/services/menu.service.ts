import { Injectable, inject } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Observable } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { UsuarioContextoService } from './usuario-contexto.service';

@Injectable({ providedIn: 'root' })
export class MenuService {
    private readonly usuarioContextoService = inject(UsuarioContextoService);
    private readonly menuItems$ = toObservable(this.usuarioContextoService.menuItems);

    obtenerMenuPorUsuario(): Observable<MenuItem[]> {
        return this.menuItems$;
    }
}