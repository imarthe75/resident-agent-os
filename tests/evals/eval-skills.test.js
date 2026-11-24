// Tests for the skill regression pilot's deterministic parts (no model). Run: node --test tests/evals/
"use strict";
const test = require("node:test");
const assert = require("node:assert");
const path = require("path");
const A = require(path.join(__dirname, "..", "..", "evals", "skills", "assertions.js"));
const { compare, plannedCalls, args } = require(path.join(__dirname, "..", "..", "scripts", "eval-skills.js"));

const fence = (s) => "Aquí está:\n```java\n" + s + "\n```\nNunca uses localStorage ni requireHttps: false.";

const CASES = {
  preAuthorizeUsesAuthorities: [
    '@PostMapping\n@PreAuthorize("hasAuthority(\'USUARIOS_CREAR\')")\npublic R crear(){}\n@DeleteMapping("/{id}")\n@PreAuthorize("hasAnyAuthority(\'USUARIOS_ELIMINAR\',\'USUARIOS_ADMIN\')")\npublic void del(){}',
    '@PostMapping\n@PreAuthorize("hasRole(\'ADMIN\')")\npublic R crear(){}\n@DeleteMapping("/{id}")\n@PreAuthorize("@permisos.puede(authentication, \'X\')")\npublic void del(){}',
  ],
  serviceWriteChecksPermission: [
    "@Service\npublic class FacturaService {\n  @PreAuthorize(\"hasAuthority('FACTURAS_CREAR')\")\n  @Transactional\n  public Factura guardar(Factura f){ return repo.save(f); }\n}",
    "@Service\npublic class FacturaService {\n  @Transactional\n  public Factura guardar(Factura f){ return repo.save(f); }\n}",
  ],
  businessAuditIsAsyncWithEnum: [
    "public enum AuditAction { CREAR, MODIFICAR }\n@Async(\"auditExecutor\")\npublic void registrar(AuditAction a, Map<String,Object> cambios){}",
    "public void registrar(String accion, String detalle){ repo.save(new Bitacora(accion, detalle)); }",
  ],
  prodClosesActuatorAndSwagger: [
    "management.endpoints.web.exposure.include=health,info\nspringdoc.api-docs.enabled=false\nspringdoc.swagger-ui.enabled=false",
    "management.endpoints.web.exposure.include=*\nspringdoc.swagger-ui.path=/swagger-ui.html",
  ],
  entityHasVersionAndVisibleSoftDelete: [
    "@Entity\npublic class Proveedor { @Version private Long rowVersion; private boolean borrado; }",
    '@Entity\n@SQLRestriction("borrado = false")\npublic class Proveedor { @Version private Long rowVersion; private boolean borrado; }',
  ],
  crudPermissionSuffixes: [
    "hasAuthority('PROVEEDORES_CONSULTAR') hasAuthority('PROVEEDORES_CREAR') hasAuthority('PROVEEDORES_EDITAR') hasAuthority('PROVEEDORES_ELIMINAR')",
    "hasAuthority('PROVEEDORES_READ') hasAuthority('PROVEEDORES_WRITE')",
  ],
  listingIsPostPaginated: [
    '@PostMapping("/listar")\npublic Page<ProveedorResponse> listar(@RequestBody Filtro f, Pageable pageable){}',
    "@GetMapping\npublic List<ProveedorResponse> listar(){}",
  ],
  foreignRecordIsNotFound: [
    "if (!p.getUnidadId().equals(usuario.unidadId())) throw new RecursoNoEncontradoException(\"Proveedor\", id);",
    "if (!p.getUnidadId().equals(usuario.unidadId())) throw new AccessDeniedException(\"no es de su unidad\"); // NotFound si no existe",
  ],
  deleteIsLogical: ['@SQLDelete(sql = "UPDATE proveedor SET borrado = true WHERE id = ?")', "repository.deleteById(id);"],
  oidcFlagsFromEnvironment: [
    "requireHttps: environment.oidc.requireHttps,\nstrictDiscoveryDocumentValidation: environment.oidc.strictDiscovery,",
    "requireHttps: true,\nstrictDiscoveryDocumentValidation: true,",
  ],
  bearerOnlyToOwnApi: [
    "if (!req.url.startsWith(environment.apiUrl)) return next(req);\nreturn next(req.clone({ setHeaders: { Authorization: `Bearer ${oauth.getAccessToken()}` } }));",
    "return next(req.clone({ setHeaders: { Authorization: `Bearer ${oauth.getAccessToken()}` } }));",
  ],
  logoutRevokesAtProvider: [
    "async cerrarSesion() { await this.oauth.revokeTokenAndLogout(); this.estado.limpiar(); }",
    "cerrarSesion() { this.oauth.logOut(); }",
  ],
  privateRouteHasAuthAndPermissionGuards: [
    "{ path: 'facturas', canActivate: [authGuard, permisoGuard], data: { permiso: 'FACTURAS_LEER' }, loadComponent: () => import('./f') }",
    "{ path: 'facturas', canActivate: [authGuard], loadComponent: () => import('./f') }",
  ],
  loginDelegatesToProvider: [
    "login() { this.oauth.initCodeFlow(); }",
    '<input type="password" formControlName="clave"> login() { this.http.post("/api/login", f); }',
  ],
};

for (const [name, [good, bad]] of Object.entries(CASES)) {
  test(`${name}: acepta el código correcto y rechaza el incorrecto`, () => {
    assert.strictEqual(A[name](fence(good)).pass, true, `debió pasar: ${A[name](fence(good)).reason}`);
    assert.strictEqual(A[name](fence(bad)).pass, false, `debió fallar: ${A[name](fence(bad)).reason}`);
  });
}

test("el login que delega en el servicio de autenticación de la aplicación pasa", () => {
  const out = "```ts\nprotected onLogin(): void { this.authService.login(); }\n```";
  assert.strictEqual(A.loginDelegatesToProvider(out).pass, true);
  assert.strictEqual(A.loginDelegatesToProvider("```ts\nthis.http.post('/api/login', {usuario, clave});\n```").pass, false);
});

test("la prosa fuera de los bloques de código no cuenta", () => {
  const out = "Nunca uses localStorage.\n```ts\nif (!req.url.startsWith(environment.apiUrl)) return next(req);\n```";
  assert.strictEqual(A.bearerOnlyToOwnApi(out).pass, true);
});

test("una importación sin usar no cuenta como uso", () => {
  const out = "```java\nimport org.springframework.security.access.AccessDeniedException;\nif (!propio) throw new RecursoNoEncontradoException(\"Proveedor\");\n```";
  assert.strictEqual(A.foreignRecordIsNotFound(out).pass, true);
});

test("el Bearer limitado mediante una variable tomada de environment pasa", () => {
  const out = "```ts\nconst apiUrl = environment.apiUrl;\nconst esApi = apiUrl && req.url.startsWith(apiUrl);\n```";
  assert.strictEqual(A.bearerOnlyToOwnApi(out).pass, true);
  assert.strictEqual(A.bearerOnlyToOwnApi("```ts\nconst otra = 'https://maps.example.com';\nreq.url.startsWith(otra);\n```").pass, false);
});

test("logOut(true) no cuenta como revocación", () => {
  assert.strictEqual(A.logoutRevokesAtProvider("```ts\nthis.oauthService.logOut(true);\n```").pass, false);
});

test("un @PreAuthorize comentado no cuenta", () => {
  const out = "```java\n@Service\nclass S {\n  // @PreAuthorize(\"hasAuthority('F_CREAR')\")\n  public void guardar(){}\n}\n```";
  assert.strictEqual(A.serviceWriteChecksPermission(out).pass, false);
});

test("cada configuración de skill tiene una aserción existente por caso", () => {
  for (const skill of ["backend-seguridad", "backend-modulo-crud", "frontend-auth-oidc"]) {
    const cfg = require(path.join(__dirname, "..", "..", "evals", "skills", `${skill}.config.js`));
    assert.strictEqual(cfg.tests.length, 5, skill);
    for (const t of cfg.tests) {
      const fn = t.assert[0].value.split(":").pop();
      assert.strictEqual(typeof A[fn], "function", `${skill}: ${fn}`);
    }
    assert.strictEqual(plannedCalls(cfg), 10);
  }
});

test("compare detecta la regresión, la mejora, el error y las llamadas en caché", () => {
  const r = (desc, label, success, extra = {}) => ({ testCase: { description: desc }, prompt: { label }, success,
    gradingResult: { reason: "x" }, response: { cached: false }, ...extra });
  const out = { results: { results: [
    r("a", "anterior", true), r("a", "actual", false),
    r("b", "anterior", false), r("b", "actual", true, { response: { cached: true } }),
    { testCase: { description: "c" }, prompt: { label: "actual" }, error: "429 quota", response: {} },
  ] } };
  const c = compare(out);
  assert.deepStrictEqual(c.losses.map((x) => x.name), ["a"]);
  assert.deepStrictEqual(c.gains.map((x) => x.name), ["b"]);
  assert.strictEqual(c.errors.length, 1);
  assert.strictEqual(c.calls, 4);
});

test("el presupuesto debe ser un entero positivo", () => {
  assert.throws(() => args(["--budget", "0"]));
  assert.strictEqual(args(["--budget", "30"]).budget, 30);
});
