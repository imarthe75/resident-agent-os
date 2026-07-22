import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { OAuthService } from 'angular-oauth2-oidc';
import { oidcConfig } from './oidc.config';

export function initOidc() {
    const oauthService = inject(OAuthService);
    const router = inject(Router);

    return async () => {
        oauthService.configure(oidcConfig);
        await oauthService.loadDiscoveryDocumentAndTryLogin().catch(() => {
            // Authentik no disponible: la app carga sin sesión
        });

        // Refresco automático antes de que expire el access token
        oauthService.setupAutomaticSilentRefresh();

        // Si el usuario fue redirigido desde una URL protegida, restaurarla
        const targetUrl = resolveReturnUrl(oauthService.state);
        if (targetUrl) {
            void router.navigateByUrl(targetUrl);
        }
    };
}

function resolveReturnUrl(state?: string): string | null {
    if (!state) {
        return null;
    }

    const decodedState = safeDecodeURIComponent(state);
    let internalUrl = decodedState;

    if (!decodedState.startsWith('/')) {
        try {
            const url = new URL(decodedState, window.location.origin);
            if (url.origin !== window.location.origin) {
                return '/dashboard';
            }
            internalUrl = `${url.pathname}${url.search}${url.hash}`;
        } catch {
            return '/dashboard';
        }
    }

    if (!internalUrl.startsWith('/') || internalUrl === '/notfound' || internalUrl.startsWith('/auth')) {
        return '/dashboard';
    }

    return internalUrl;
}

function safeDecodeURIComponent(value: string): string {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}
