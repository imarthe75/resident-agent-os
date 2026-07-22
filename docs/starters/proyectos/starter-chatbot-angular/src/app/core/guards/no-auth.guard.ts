import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guarda para rutas PÚBLICAS (Ej: Login).
 * Si hay un token válido, redirige al Dashboard (/) para que un usuario logueado no vea el login.
 */
export const noAuthGuard: CanActivateFn = () => {
    const isValid = inject(AuthService).validarYActualizarToken();
    if (isValid) {
        return inject(Router).createUrlTree(['/dashboard']);
    }

    return true;
};
