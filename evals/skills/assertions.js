// Code-checked assertions for the skill regression pilot (ADR-0004, C2). No judge model: each one is a deterministic check on the
// code the model wrote. Explanatory prose is ignored when the answer has fenced code blocks, so "never use localStorage" in the
// explanation does not count as using it.
"use strict";

function code(output) {
  const text = typeof output === "string" ? output : JSON.stringify(output ?? "");
  const blocks = [...text.matchAll(/```[^\n]*\n([\s\S]*?)```/g)].map((m) => m[1]);
  const body = blocks.length ? blocks.join("\n") : text;
  // Drop line and block comments so a commented-out annotation does not count.
  return body.replace(/(^|[^"'])\/\*[\s\S]*?\*\//g, "$1").replace(/(^|[^:"'])\/\/.*$/gm, "$1").replace(/^\s*#.*$/gm, "");
}

function result(pass, reason) {
  return { pass, score: pass ? 1 : 0, reason };
}

function count(re, s) {
  return (s.match(re) || []).length;
}

const MAPPING = /@(Get|Post|Put|Delete|Patch)Mapping\b/g;

const checks = {
  everyEndpointHasPreAuthorize(output) {
    const c = code(output);
    const endpoints = count(MAPPING, c);
    const guards = count(/@PreAuthorize\s*\(/g, c);
    return result(endpoints > 0 && guards >= endpoints, `${endpoints} endpoints, ${guards} @PreAuthorize`);
  },
  resourceServerDeniesByDefault(output) {
    const c = code(output);
    const rs = /oauth2ResourceServer/.test(c);
    const closed = /anyRequest\(\)\s*\.\s*(authenticated|denyAll)\(\)/.test(c);
    const openAll = /requestMatchers\(\s*"\/\*\*"\s*\)\s*\.\s*permitAll|anyRequest\(\)\s*\.\s*permitAll/.test(c);
    return result(rs && closed && !openAll, `resourceServer=${rs} cierraElResto=${closed} abreTodo=${openAll}`);
  },
  corsWithoutWildcard(output) {
    const c = code(output);
    const wildcard = /(allowedOrigins?|addAllowedOrigin|allowedOriginPatterns|addAllowedOriginPattern)\(\s*(List\.of\()?\s*"\*"/.test(c);
    const origin = c.includes("https://app.ejemplo.mx");
    return result(!wildcard && origin, `comodín=${wildcard} origenExplícito=${origin}`);
  },
  noLiteralSecretsInConfig(output) {
    const c = code(output);
    const lines = c.split("\n").filter((l) => /^\s*[\w.\-]*(password|secret|clave|contrase)[\w.\-]*\s*[=:]\s*\S/i.test(l));
    const bad = lines.filter((l) => {
      const value = l.split(/[=:]/).slice(1).join(":").trim();
      if (/^\$\{[^}:]+\}$/.test(value)) return false; // ${VAR}: comes from the environment
      return true; // a literal, or ${VAR:default} with a default value
    });
    return result(lines.length > 0 && bad.length === 0, bad.length ? `literal: ${bad[0].trim().slice(0, 60)}` : `${lines.length} claves por variable`);
  },
  constantTimeComparison(output) {
    const c = code(output);
    const safe = /MessageDigest\.isEqual\s*\(/.test(c);
    return result(safe, safe ? "MessageDigest.isEqual" : "sin comparación en tiempo constante");
  },
  entityHasVersion(output) {
    return result(/@Version\b/.test(code(output)), "@Version");
  },
  everyBodyIsValidated(output) {
    const c = code(output);
    const bodies = count(/@RequestBody\b/g, c);
    const valid = count(/@Valid(ated)?\s+(final\s+)?@RequestBody\b|@RequestBody\s+@Valid(ated)?\b/g, c);
    return result(bodies > 0 && valid >= bodies, `${bodies} @RequestBody, ${valid} validados`);
  },
  listingIsPaginated(output) {
    const c = code(output);
    const paged = /\bPageable\b/.test(c) && /\bPage</.test(c);
    return result(paged, `paginado=${paged}`);
  },
  deleteIsLogical(output) {
    const c = code(output);
    const logical = /@SQLDelete|set(Borrado|Deleted|Eliminado)\(\s*true\s*\)|\b(borrado|deleted|eliminado)\s*=\s*true/i.test(c);
    return result(logical, `borradoLógico=${logical}`);
  },
  codeFlowWithPkce(output) {
    const c = code(output);
    const codeFlow = /responseType\s*:\s*['"]code['"]/.test(c);
    const implicit = /oidc\s*:\s*false|responseType\s*:\s*['"](token|id_token)/.test(c);
    return result(codeFlow && !implicit, `code=${codeFlow} implícito=${implicit}`);
  },
  productionKeepsHttpsChecks(output) {
    const c = code(output);
    const off = /requireHttps\s*:\s*false|strictDiscoveryDocumentValidation\s*:\s*false/.test(c);
    const on = /requireHttps\s*:\s*(true|environment\.)/.test(c);
    return result(!off && on, `desactivado=${off} activo=${on}`);
  },
  interceptorWithoutWebStorage(output) {
    const c = code(output);
    const storage = /\b(localStorage|sessionStorage)\b/.test(c);
    const interceptor = /HttpInterceptor(Fn)?\b/.test(c);
    return result(interceptor && !storage, `interceptor=${interceptor} webStorage=${storage}`);
  },
  loginDelegatesToProvider(output) {
    const c = code(output);
    const passwordField = /type\s*=\s*["']password["']/.test(c);
    // Direct call to the OIDC library, or to the app's auth service that wraps it (the skill's own AuthService.login()).
    const redirect = /initCodeFlow|initLoginFlow|\b\w*[aA]uth\w*\.login\(\s*\)/.test(c);
    return result(redirect && !passwordField, `redirige=${redirect} campoContraseña=${passwordField}`);
  },
  guardChecksPermissionWithoutWebStorage(output) {
    const c = code(output);
    const guard = /CanActivate(Fn)?\b/.test(c);
    const storage = /\b(localStorage|sessionStorage)\b/.test(c);
    return result(guard && !storage, `guard=${guard} webStorage=${storage}`);
  },
};

// promptfoo calls file://assertions.js:<name> with (output, context).
module.exports = { code, checks, ...checks };
