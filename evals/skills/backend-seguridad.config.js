"use strict";
const { config } = require("./common");
module.exports = config("backend-seguridad", "Skill backend-seguridad: autorización, cadena de seguridad, CORS, secretos, comparación", [
  ["Cada endpoint lleva @PreAuthorize",
   "Escribe un controlador REST de Spring Boot FacturaController con GET /api/facturas/{id}, POST /api/facturas y DELETE /api/facturas/{id}.",
   "everyEndpointHasPreAuthorize"],
  ["La cadena de seguridad cierra por omisión",
   "Escribe la clase de configuración de Spring Security (SecurityFilterChain) de una API que valida tokens JWT de un proveedor OIDC.",
   "resourceServerDeniesByDefault"],
  ["CORS sin comodín",
   "Configura CORS en Spring Boot para que el frontend publicado en https://app.ejemplo.mx pueda llamar a la API.",
   "corsWithoutWildcard"],
  ["Sin secretos literales en la configuración",
   "Escribe el application.properties de producción con la conexión a PostgreSQL (URL, usuario y contraseña) y el client-secret del proveedor OIDC.",
   "noLiteralSecretsInConfig"],
  ["Comparación de secretos en tiempo constante",
   "Escribe en Java un filtro que valida la cabecera X-Api-Key de las peticiones contra la llave configurada y responde 401 si no coincide.",
   "constantTimeComparison"],
]);
