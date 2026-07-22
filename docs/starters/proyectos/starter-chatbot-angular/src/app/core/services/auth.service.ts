import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { OAuthService } from 'angular-oauth2-oidc';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly oauthService = inject(OAuthService);
    private readonly router = inject(Router);

    iniciarLogin(targetUrl?: string) {
        this.oauthService.initCodeFlow(targetUrl);
    }

    logout() {
        const idToken = this.oauthService.getIdToken();
        const endSessionEndpoint = this.oauthService.issuer
            ? `${this.oauthService.issuer.replace(/\/$/, '')}/end-session/`
            : null;

        // Limpiar sesión local (tokens, storage) sin esperar redirección de Authentik
        this.oauthService.logOut(true);

        if (endSessionEndpoint && idToken) {
            // Redirigir al end_session de Authentik con post_logout_redirect_uri para volver al login
            const params = new URLSearchParams({
                id_token_hint: idToken,
                post_logout_redirect_uri: window.location.origin + '/auth/login'
            });
            window.location.href = `${endSessionEndpoint}?${params.toString()}`;
        } else {
            // Sin sesión activa (error de auth, token expirado): ir directo al login local
            void this.router.navigate(['/auth/login']);
        }
    }

    /**
     * Limpia el estado local de la sesión (tokens en localStorage/sessionStorage)
     * sin redirigir a Authentik y sin llamadas HTTP.
     * Usado cuando la sesión expiró y no hay forma de refrescarla.
     */
    limpiarSesion() {
        // logOut(true) = noRedirectToLogout: solo limpia localStorage, sin POST a /revoke/
        this.oauthService.logOut(true);
    }

    validToken(): boolean {
        return this.oauthService.hasValidAccessToken();
    }

    validarYActualizarToken(): boolean {
        return this.oauthService.hasValidAccessToken();
    }

    obtenerToken(): string | null {
        return this.oauthService.getAccessToken() ?? null;
    }

    get tieneRefreshToken(): boolean {
        return !!this.oauthService.getRefreshToken();
    }

    async refrescarToken(): Promise<void> {
        await this.oauthService.refreshToken();
    }

    get claims(): Record<string, unknown> {
        return (this.oauthService.getIdentityClaims() as Record<string, unknown>) ?? {};
    }

    get nombreUsuario(): string {
        const c = this.claims;
        return (c['name'] as string) ?? (c['preferred_username'] as string) ?? '';
    }
}
