"use strict";
const { config } = require("./common");
module.exports = config("backend-seguridad", "Skill backend-seguridad: authorities, permiso en el servicio, auditoría, exposición", [
  ["Autoriza por authority MODULO_ACCION, no por rol",
   "Escribe el controlador REST de Spring Boot UsuarioController con alta, consulta y baja de usuarios.",
   "preAuthorizeUsesAuthorities"],
  ["La escritura en el servicio exige permiso",
   "Escribe FacturaService con el método que guarda una factura; lo llaman el controlador y también otros servicios del sistema.",
   "serviceWriteChecksPermission"],
  ["La bitácora de negocio es asíncrona y usa enum",
   "Implementa en Spring Boot la bitácora de negocio que registra quién modificó un proveedor y qué campos cambió.",
   "businessAuditIsAsyncWithEnum"],
  ["Producción cierra Actuator y Swagger",
   "Escribe application-prod.properties de una API Spring Boot que usa Actuator y springdoc-openapi.",
   "prodClosesActuatorAndSwagger"],
  ["Autoriza por authority también en la consulta",
   "Escribe el controlador REST de Spring Boot ReporteController con un GET que descarga el reporte mensual de ventas.",
   "preAuthorizeUsesAuthorities"],
]);
