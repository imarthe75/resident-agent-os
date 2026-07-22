import { AuthConfig } from 'angular-oauth2-oidc';
import { environment } from '../../../environments/environment';

export const oidcConfig: AuthConfig = {
    issuer: environment.oidc.issuer,
    redirectUri: environment.oidc.redirectUri,
    postLogoutRedirectUri: environment.oidc.postLogoutRedirectUri,
    clientId: environment.oidc.clientId,
    responseType: 'code',
    scope: 'openid profile email offline_access',
    requireHttps: environment.oidc.requireHttps,
    showDebugInformation: false,
    sessionChecksEnabled: false,
    clearHashAfterLogin: true,
    strictDiscoveryDocumentValidation: environment.oidc.strictDiscoveryDocumentValidation,
    // Refrescar el access token cuando quede 25% de su vida útil
    timeoutFactor: 0.75,
    useSilentRefresh: false,
};
