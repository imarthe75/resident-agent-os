export const environment = {
  production: false,
  buildEnversion: 'dev',
  apiBaseUrl: 'http://localhost:8080/api',
  oidc: {
    issuer: 'https://auth.casmart.internal/application/o/starter/',
    clientId: 'cI0GuHhtPMBPUnE4z1WBo4rxgXMtHoq6RMOnIwej',
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
    requireHttps: false,
    strictDiscoveryDocumentValidation: false,
  },
};
