import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { UsuarioContextoService } from '../services/usuario-contexto.service';

/**
 * Guard de rutas basado en permisos.
 * Aplica en rutas que requieren un privilegio específico del rol activo.
 *
 * Uso en app.routes.ts:
 *   {
 *     path: 'usuarios',
 *     canActivate: [authGuard, permisoGuard],
 *     data: { permiso: 'USUARIOS_READ' },
 *     ...
 *   }
 */
export const permisoGuard: CanActivateFn = (_route: ActivatedRouteSnapshot) => {
    const usuarioContexto = inject(UsuarioContextoService);
    const router = inject(Router);

    const permiso = _route.data['permiso'] as string | undefined;

    if (!permiso) {
        return true;
    }

    if (usuarioContexto.tienePermiso(permiso)) {
        return true;
    }

    return router.createUrlTree(['/auth/access']);
};
