import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UsuarioContextoService } from '../services/usuario-contexto.service';

/**
 * Guarda para rutas PROTEGIDAS.
 * Intenta refrescar el access token silenciosamente antes de redirigir a Authentik.
 */
export const authGuard: CanActivateFn = async (_route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const usuarioContextoService = inject(UsuarioContextoService);

    if (authService.validToken()) {
        await usuarioContextoService.asegurarContextoCargado(true);
        if (usuarioContextoService.usuarioNoSincronizado()) {
            return router.createUrlTree(['/notfound']);
        }
        return true;
    }

    // Intentar refrescar con el refresh_token sin redirect visible
    if (authService.tieneRefreshToken) {
        try {
            await authService.refrescarToken();
            await usuarioContextoService.asegurarContextoCargado(true);
            if (usuarioContextoService.usuarioNoSincronizado()) {
                return router.createUrlTree(['/notfound']);
            }
            return true;
        } catch {
            // Refresh token expirado o inválido → sesión perdida
        }
    }

    // Sin token válido ni forma de refrescarlo: limpiar sesión y redirigir
    // al login local (no a Authentik directamente) para que el usuario vea
    // la pantalla de inicio de sesión de la aplicación.
    authService.limpiarSesion();
    return router.createUrlTree(['/auth/login'], {
        queryParams: { returnUrl: state.url },
    });
};
