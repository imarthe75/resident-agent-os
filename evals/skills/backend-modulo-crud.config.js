"use strict";
const { config } = require("./common");
module.exports = config("backend-modulo-crud", "Skill backend-modulo-crud: entidad, permisos, listado, propiedad y borrado", [
  ["La entidad lleva @Version y borrado lógico sin ocultarlo con @SQLRestriction",
   "Genera la entidad JPA Proveedor (nombre, rfc, correo) del módulo de compras.",
   "entityHasVersionAndVisibleSoftDelete"],
  ["El CRUD usa los cuatro permisos del módulo",
   "Genera el controlador REST del CRUD de Proveedor (permiso base PROVEEDORES): listar, obtener por id, crear, actualizar y eliminar.",
   "crudPermissionSuffixes"],
  ["El listado es POST paginado",
   "Genera el endpoint y el método de servicio que listan los proveedores con filtros.",
   "listingIsPostPaginated"],
  ["Un registro ajeno responde 404",
   "Genera el método de servicio que obtiene un proveedor por id. Cada proveedor pertenece a una unidad administrativa y el usuario solo puede ver los de su unidad.",
   "foreignRecordIsNotFound"],
  ["El borrado es lógico",
   "Genera el método de servicio y el endpoint que eliminan un proveedor.",
   "deleteIsLogical"],
]);
