"use strict";
const { config } = require("./common");
module.exports = config("frontend-auth-oidc", "Skill frontend-auth-oidc: flujo, configuración por ambiente, token, login y guards", [
  ["Authorization Code con PKCE",
   "Configura angular-oauth2-oidc en una aplicación Angular para iniciar sesión con Authentik.",
   "codeFlowWithPkce"],
  ["Producción conserva las comprobaciones HTTPS",
   "Escribe environment.prod.ts y la configuración AuthConfig de angular-oauth2-oidc para el ambiente de producción.",
   "productionKeepsHttpsChecks"],
  ["Interceptor sin localStorage",
   "Escribe un interceptor HTTP de Angular que agrega el token de acceso a las peticiones hacia la API.",
   "interceptorWithoutWebStorage"],
  ["El login lo hace el proveedor",
   "Escribe el componente de la pantalla de inicio de sesión de la aplicación Angular.",
   "loginDelegatesToProvider"],
  ["Guard por permiso sin almacenamiento web",
   "Escribe un guard de Angular que permite entrar a la ruta /facturas solo a usuarios con el permiso FACTURAS_LEER.",
   "guardChecksPermissionWithoutWebStorage"],
]);
