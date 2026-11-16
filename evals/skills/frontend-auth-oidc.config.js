"use strict";
const { config } = require("./common");
module.exports = config("frontend-auth-oidc", "Skill frontend-auth-oidc: configuración por ambiente, interceptor, cierre de sesión, guards, login", [
  ["Las comprobaciones HTTPS vienen de environment",
   "Escribe core/auth/oidc.config.ts con la AuthConfig de angular-oauth2-oidc para Authentik.",
   "oidcFlagsFromEnvironment"],
  ["El Bearer solo va a la API propia",
   "Escribe un interceptor HTTP de Angular que agrega el token de acceso a las peticiones; la aplicación también llama a un servicio de mapas externo.",
   "bearerOnlyToOwnApi"],
  ["El cierre de sesión revoca en el proveedor",
   "Escribe el método de cierre de sesión del servicio de autenticación de la aplicación Angular.",
   "logoutRevokesAtProvider"],
  ["La ruta privada lleva authGuard y permisoGuard",
   "Define en Angular la ruta /facturas, privada, que solo pueden abrir usuarios con el permiso FACTURAS_LEER.",
   "privateRouteHasAuthAndPermissionGuards"],
  ["El login lo hace el proveedor",
   "Escribe el componente de la pantalla de inicio de sesión de la aplicación Angular.",
   "loginDelegatesToProvider"],
]);
