import { inject } from '@angular/core';
import { AuthService } from '@/app/core/services/auth.service';
import { UsuarioContextoService } from '@/app/core/services/usuario-contexto.service';

export function initUsuarioContexto() {
    const authService = inject(AuthService);
    const usuarioContextoService = inject(UsuarioContextoService);

    return async () => {
        await usuarioContextoService.cargarContextoInicial(authService.validToken());
    };
}
