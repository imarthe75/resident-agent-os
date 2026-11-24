// Code-checked assertions for the skill regression pilot (ADR-0004, C2). No judge model: each one is a deterministic check on the
// code the model wrote. Explanatory prose is ignored when the answer has fenced code blocks, so "never use localStorage" in the
// explanation does not count as using it.
"use strict";

function code(output) {
  const text = typeof output === "string" ? output : JSON.stringify(output ?? "");
  const blocks = [...text.matchAll(/```[^\n]*\n([\s\S]*?)```/g)].map((m) => m[1]);
  const body = blocks.length ? blocks.join("\n") : text;
  // Drop line and block comments so a commented-out annotation does not count.
  return body.replace(/^\s*import\s[^\n]*$/gm, "").replace(/(^|[^"'])\/\*[\s\S]*?\*\//g, "$1").replace(/(^|[^:"'])\/\/.*$/gm, "$1").replace(/^\s*#.*$/gm, "");
}

function result(pass, reason) {
  return { pass, score: pass ? 1 : 0, reason };
}

function count(re, s) {
  return (s.match(re) || []).length;
}

const MAPPING = /@(Get|Post|Put|Delete|Patch)Mapping\b/g;

const checks = {
  // backend-seguridad
  preAuthorizeUsesAuthorities(output) {
    const c = code(output);
    const guards = c.match(/@PreAuthorize\s*\(\s*"[^"]*"\s*\)/g) || [];
    const byAuthority = guards.filter((g) => /has(Any)?Authority\(\s*'[A-Z0-9]+_[A-Z0-9_]+'/.test(g) && !/hasRole|hasAnyRole|@\w+\./.test(g));
    const endpoints = count(MAPPING, c);
    return result(endpoints > 0 && byAuthority.length >= endpoints && byAuthority.length === guards.length,
      `${endpoints} endpoints, ${guards.length} @PreAuthorize, ${byAuthority.length} por authority MODULO_ACCION`);
  },
  serviceWriteChecksPermission(output) {
    const c = code(output);
    const service = /@Service\b/.test(c);
    const guarded = /@PreAuthorize\s*\(/.test(c.slice(c.search(/@Service\b/)));
    return result(service && guarded, `servicio=${service} permisoEnElServicio=${guarded}`);
  },
  businessAuditIsAsyncWithEnum(output) {
    const c = code(output);
    const enumAction = /\benum\s+\w*(Audit|Auditoria|Accion)\w*/i.test(c);
    const async = /@Async\b|TransactionPhase\.AFTER_COMMIT|@TransactionalEventListener/.test(c);
    return result(enumAction && async, `enum=${enumAction} asíncrona=${async}`);
  },
  prodClosesActuatorAndSwagger(output) {
    const c = code(output);
    const exposure = (c.match(/management\.endpoints\.web\.exposure\.include\s*[=:]\s*([^\n]+)/) || [])[1] || "";
    const onlyHealth = exposure !== "" && exposure.split(",").map((x) => x.trim()).every((x) => x === "health" || x === "info");
    const swaggerOff = /springdoc\.api-docs\.enabled\s*[=:]\s*false/.test(c);
    return result(onlyHealth && swaggerOff, `actuator=[${exposure.trim()}] swaggerApagado=${swaggerOff}`);
  },
  // backend-modulo-crud
  entityHasVersionAndVisibleSoftDelete(output) {
    const c = code(output);
    const version = /@Version\b/.test(c);
    const borrado = /\bborrado\b/.test(c);
    const hidden = /@(SQLRestriction|Where)\s*\([^)]*borrado/.test(c);
    return result(version && borrado && !hidden, `@Version=${version} borrado=${borrado} ocultoConRestriccion=${hidden}`);
  },
  crudPermissionSuffixes(output) {
    const c = code(output);
    const missing = ["_CONSULTAR", "_CREAR", "_EDITAR", "_ELIMINAR"].filter((s) => !new RegExp(`'[A-Z0-9_]+${s}'`).test(c));
    return result(missing.length === 0, missing.length ? `faltan ${missing.join(", ")}` : "los cuatro permisos");
  },
  listingIsPostPaginated(output) {
    const c = code(output);
    const post = /@PostMapping\(\s*(value\s*=\s*|path\s*=\s*)?"\/?(listar|buscar|search)/i.test(c);
    const paged = /\bPage</.test(c) && /\bPageable\b|PageRequest\.of/.test(c);
    return result(post && paged, `POST listar=${post} paginado=${paged}`);
  },
  foreignRecordIsNotFound(output) {
    const c = code(output);
    const notFound = /NotFound|NoEncontrad|HttpStatus\.NOT_FOUND|EntityNotFoundException/.test(c);
    const forbidden = /AccessDeniedException|HttpStatus\.FORBIDDEN|Forbidden\w*Exception|\b403\b/.test(c);
    return result(notFound && !forbidden, `404=${notFound} 403=${forbidden}`);
  },
  deleteIsLogical(output) {
    const c = code(output);
    const logical = /@SQLDelete|set(Borrado|Deleted|Eliminado)\(\s*true\s*\)|\b(borrado|deleted|eliminado)\s*=\s*true/i.test(c);
    return result(logical, `borradoLógico=${logical}`);
  },
  // frontend-auth-oidc
  oidcFlagsFromEnvironment(output) {
    const c = code(output);
    const https = /requireHttps\s*:\s*environment\.\w+/.test(c);
    const strict = /strictDiscoveryDocumentValidation\s*:\s*environment\.\w+/.test(c);
    return result(https && strict, `requireHttps=${https} strictDiscovery=${strict}`);
  },
  bearerOnlyToOwnApi(output) {
    const c = code(output);
    // startsWith(environment.apiUrl) directly, or through a variable assigned from environment.<...api...>
    const apiVars = [...c.matchAll(/(?:const|let|readonly|private)\s+(?:readonly\s+)?(\w+)\s*(?::\s*\w+)?\s*=\s*environment\.\w*[aA]pi\w*/g)].map((m) => m[1]);
    const target = ["environment\\.\\w*[aA]pi\\w*", ...apiVars.map((v) => `(this\\.)?${v}\\b`)].join("|");
    const scoped = new RegExp(`\\.url\\s*\\.\\s*startsWith\\(\\s*(${target})`).test(c) ||
      /sendAccessToken\s*:\s*true/.test(c) && /allowedUrls\s*:\s*\[\s*environment\.\w*[aA]pi\w*/.test(c);
    const storage = /\b(localStorage|sessionStorage)\b/.test(c);
    return result(scoped && !storage, `soloApiPropia=${scoped} webStorage=${storage}`);
  },
  logoutRevokesAtProvider(output) {
    const c = code(output);
    const revokes = /revokeTokenAndLogout\s*\(/.test(c);
    return result(revokes, `revoca=${revokes}`);
  },
  privateRouteHasAuthAndPermissionGuards(output) {
    const c = code(output);
    const guards = /canActivate\s*:\s*\[[^\]]*authGuard[^\]]*permisoGuard|canActivate\s*:\s*\[[^\]]*permisoGuard[^\]]*authGuard/.test(c);
    const data = /data\s*:\s*\{\s*permiso\s*:\s*['"]FACTURAS_LEER['"]/.test(c);
    return result(guards && data, `authGuard+permisoGuard=${guards} data.permiso=${data}`);
  },
  loginDelegatesToProvider(output) {
    const c = code(output);
    const passwordField = /type\s*=\s*["']password["']/.test(c);
    // Direct call to the OIDC library, or to the app's auth service that wraps it (the skill's own AuthService.login()).
    const redirect = /initCodeFlow|initLoginFlow|\b\w*[aA]uth\w*\.login\(\s*\)/.test(c);
    return result(redirect && !passwordField, `redirige=${redirect} campoContraseña=${passwordField}`);
  },
};

// promptfoo calls file://assertions.js:<name> with (output, context).
module.exports = { code, checks, ...checks };
