export const environment = {
  production: true,
  buildEnversion: 'prod',
  apiBaseUrl: 'http://localhost:8080/api',
  oidc: {
    issuer: 'http://localhost:9000/application/o/starter/',
    clientId: 'okxBESPqhfPxviNn4azq5gzsTgLzexfeebWFUrbI',
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
    requireHttps: false,
    strictDiscoveryDocumentValidation: false,
  },
};

