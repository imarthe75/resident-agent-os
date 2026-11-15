// Tests for the skill regression pilot's deterministic parts (no model). Run: node --test tests/evals/
"use strict";
const test = require("node:test");
const assert = require("node:assert");
const path = require("path");
const A = require(path.join(__dirname, "..", "..", "evals", "skills", "assertions.js"));
const { compare, plannedCalls, args } = require(path.join(__dirname, "..", "..", "scripts", "eval-skills.js"));

const fence = (s) => "Aquí está:\n```java\n" + s + "\n```\nNunca uses localStorage ni requireHttps: false.";

const CASES = {
  everyEndpointHasPreAuthorize: [
    '@GetMapping("/{id}")\n@PreAuthorize("hasAuthority(\'F_LEER\')")\npublic X get(){}\n@DeleteMapping("/{id}")\n@PreAuthorize("hasAuthority(\'F_ELIMINAR\')")\npublic void del(){}',
    '@GetMapping("/{id}")\n@PreAuthorize("hasAuthority(\'F_LEER\')")\npublic X get(){}\n@DeleteMapping("/{id}")\n// @PreAuthorize("hasAuthority(\'F_ELIMINAR\')")\npublic void del(){}',
  ],
  resourceServerDeniesByDefault: [
    'http.authorizeHttpRequests(a -> a.requestMatchers("/actuator/health").permitAll().anyRequest().authenticated()).oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()));',
    'http.authorizeHttpRequests(a -> a.requestMatchers("/**").permitAll()).oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()));',
  ],
  corsWithoutWildcard: [
    'config.setAllowedOrigins(List.of("https://app.ejemplo.mx"));',
    'registry.addMapping("/**").allowedOrigins("*"); // https://app.ejemplo.mx',
  ],
  noLiteralSecretsInConfig: [
    "spring.datasource.password=${DB_PASSWORD}\nspring.security.oauth2.client.registration.x.client-secret=${OIDC_CLIENT_SECRET}",
    "spring.datasource.password=${DB_PASSWORD:admin123}\nclient-secret=${OIDC_CLIENT_SECRET}",
  ],
  constantTimeComparison: [
    "if (!MessageDigest.isEqual(given.getBytes(UTF_8), expected.getBytes(UTF_8))) { res.sendError(401); }",
    "if (!given.equals(expected)) { res.sendError(401); }",
  ],
  entityHasVersion: ["@Version\nprivate Long rowVersion;", "private Long rowVersion;"],
  everyBodyIsValidated: [
    "public R crear(@Valid @RequestBody CrearDto d){}\npublic R editar(@PathVariable UUID id, @RequestBody @Valid EditarDto d){}",
    "public R crear(@Valid @RequestBody CrearDto d){}\npublic R editar(@PathVariable UUID id, @RequestBody EditarDto d){}",
  ],
  listingIsPaginated: ["public Page<ProveedorDto> listar(Pageable pageable){}", "public List<ProveedorDto> listar(){}"],
  deleteIsLogical: ['@SQLDelete(sql = "UPDATE proveedor SET borrado = true WHERE id = ?")', "repository.deleteById(id);"],
  codeFlowWithPkce: ["responseType: 'code',\nscope: 'openid profile'", "responseType: 'id_token token',\noidc: true"],
  productionKeepsHttpsChecks: [
    "requireHttps: environment.requireHttps,\nstrictDiscoveryDocumentValidation: true",
    "requireHttps: false,\nstrictDiscoveryDocumentValidation: true",
  ],
  interceptorWithoutWebStorage: [
    "export const authInterceptor: HttpInterceptorFn = (req, next) => { const t = oauth.getAccessToken(); return next(req); };",
    "export const authInterceptor: HttpInterceptorFn = (req, next) => { const t = localStorage.getItem('token'); return next(req); };",
  ],
  loginDelegatesToProvider: [
    "login() { this.oauth.initCodeFlow(); }",
    '<input type="password" formControlName="clave"> login() { this.http.post("/api/login", f); }',
  ],
  guardChecksPermissionWithoutWebStorage: [
    "export const permisoGuard: CanActivateFn = () => inject(PermisoService).tiene('FACTURAS_LEER');",
    "export const permisoGuard: CanActivateFn = () => JSON.parse(sessionStorage.getItem('permisos')).includes('FACTURAS_LEER');",
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
  const out = "Nunca uses localStorage.\n```ts\nexport const i: HttpInterceptorFn = (r, n) => n(r);\n```";
  assert.strictEqual(A.interceptorWithoutWebStorage(out).pass, true);
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
