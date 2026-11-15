"use strict";
const { config } = require("./common");
module.exports = config("backend-modulo-crud", "Skill backend-modulo-crud: entidad, controlador y servicio", [
  ["La entidad lleva @Version",
   "Genera la entidad JPA Proveedor (nombre, rfc, correo) del módulo de compras.",
   "entityHasVersion"],
  ["Cada endpoint del CRUD lleva @PreAuthorize",
   "Genera el controlador REST del CRUD de Proveedor: listar, obtener por id, crear, actualizar y eliminar.",
   "everyEndpointHasPreAuthorize"],
  ["Cada cuerpo de petición se valida",
   "Genera los endpoints de crear y actualizar Proveedor del controlador, con sus DTOs de entrada.",
   "everyBodyIsValidated"],
  ["El listado es paginado",
   "Genera el endpoint y el método de servicio que listan los proveedores.",
   "listingIsPaginated"],
  ["El borrado es lógico",
   "Genera el método de servicio y el endpoint que eliminan un proveedor.",
   "deleteIsLogical"],
]);
