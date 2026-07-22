import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { UsuarioContextoService } from '../services/usuario-contexto.service';

/**
 * Guarda que verifica que la ruta solicitada esté entre los menús asignados al rol activo.
 * Debe usarse después de authGuard para garantizar que el contexto ya esté cargado.
 *
 * Uso:
 *   canActivate: [authGuard, menuGuard]
 */
export const menuGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
    const usuarioContexto = inject(UsuarioContextoService);
    const router = inject(Router);

    const segmentos = route.pathFromRoot
        .flatMap((r) => r.url)
        .map((s) => s.path)
        .filter(Boolean);

    const rutaSolicitada = '/' + segmentos.join('/');

    if (usuarioContexto.tieneAccesoRuta(rutaSolicitada)) {
        return true;
    }

    return router.createUrlTree(['/auth/access']);
};
