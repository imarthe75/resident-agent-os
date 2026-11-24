"""endpoints_auth, webhooks_fail_closed y no_silent_except en Spring (Java y Kotlin), NestJS, Express, Angular y React."""
import unittest

from verifiers import checks as c
from verifiers import stacks
from tests.test_verifiers import tree


def run(fn, files, test):
    t, root = tree(files)
    test.addCleanup(t.cleanup)
    return fn(root)


SPRING = '''package x;
@RestController
@RequestMapping("/api/clientes")
public class ClienteController {
    // @PreAuthorize("hasAuthority('X')")   <- comentado: no cuenta
    @PostMapping
    public ResponseEntity<Void> crear(@Valid @RequestBody ClienteRequest r) { return ok(); }

    @PreAuthorize("hasAuthority(T(com.ejemplo.Permisos).CLIENTE_BORRAR)")
    @DeleteMapping("/{id}")
    public void borrar(@PathVariable UUID id) { service.borrar(id); }

    @GetMapping("/{id}")
    public ClienteResponse ver(@PathVariable UUID id) { return service.ver(id); }

    @RequestMapping(value = "/importar", method = RequestMethod.PUT)
    public void importar() { String s = "}"; }
}
'''


class TestEndpointsAuthStacks(unittest.TestCase):
    def test_spring_method_without_authorization_fails(self):
        r = run(c.endpoints_auth, {"src/main/java/x/ClienteController.java": SPRING}, self)
        self.assertEqual((r.status, r.checked), (c.NO_CUMPLE, 3))
        text = "\n".join(r.detail)
        self.assertIn("POST /api/clientes", text)
        self.assertIn("PUT /api/clientes/importar", text)
        self.assertNotIn("DELETE", text)

    def test_spring_class_level_authorization_covers_methods(self):
        src = SPRING.replace("@RestController\n", "@RestController\n@PreAuthorize(\"isAuthenticated()\")\n")
        self.assertEqual(run(c.endpoints_auth, {"C.java": src}, self).status, c.CUMPLE)

    def test_kotlin_controller(self):
        src = ('@RestController\nclass A {\n  @PostMapping("/a")\n  fun a(): String { return "x" }\n'
               '  @Secured("ROLE_X")\n  @PutMapping("/b")\n  fun b() { }\n}\n')
        r = run(c.endpoints_auth, {"A.kt": src}, self)
        self.assertEqual((r.status, r.checked), (c.NO_CUMPLE, 2))
        self.assertIn("POST /a", r.detail[0])

    def test_spring_tests_are_skipped(self):
        r = run(c.endpoints_auth, {"src/test/java/x/ClienteControllerTest.java": SPRING}, self)
        self.assertEqual(r.status, c.NO_EVALUADO)

    def test_nest_guards(self):
        src = ("@Controller('pedidos')\nexport class PedidosController {\n  @Post()\n  crear(@Body() b: Dto) { return this.s.crear(b); }\n"
               "  @UseGuards(JwtAuthGuard)\n  @Delete(':id')\n  borrar(@Param('id') id: string) { return this.s.borrar(id); }\n}\n")
        r = run(c.endpoints_auth, {"src/pedidos.controller.ts": src}, self)
        self.assertEqual((r.status, r.checked), (c.NO_CUMPLE, 2))
        self.assertIn("POST /pedidos", r.detail[0])
        ok = run(c.endpoints_auth, {"src/pedidos.controller.ts": src,
                                     "src/app.module.ts": "providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }]"}, self)
        self.assertEqual(ok.status, c.CUMPLE)

    def test_express_middleware(self):
        src = ("const router = express.Router();\nrouter.post('/a', requireAuth, (req, res) => res.sendStatus(201));\n"
               "router.delete('/b', async (req, res) => { res.sendStatus(204); });\n")
        r = run(c.endpoints_auth, {"routes.js": src}, self)
        self.assertEqual((r.status, r.checked), (c.NO_CUMPLE, 2))
        self.assertIn("DELETE /b", r.detail[0])
        ok = run(c.endpoints_auth, {"routes.js": "router.use(authenticateJwt);\n" + src}, self)
        self.assertEqual(ok.status, c.CUMPLE)

    def test_spring_url_rules_first_match_wins(self):
        ctrl = ('@RestController\n@RequestMapping("/api")\npublic class C {\n  @PostMapping("/emails/send") public void a() {}\n'
                '  @PostMapping("/admin/x") public void b() {}\n  @DeleteMapping("/otros/{id}") public void c() {}\n}\n')
        conf = ('@Configuration\npublic class Sec {\n  @Bean SecurityFilterChain f(HttpSecurity http) throws Exception {\n'
                '    http.authorizeHttpRequests(a -> a\n      // .requestMatchers("/api/otros/**").permitAll()\n'
                '      .requestMatchers("/api/emails/**").permitAll()\n      .requestMatchers(HttpMethod.POST, "/api/admin/**").hasRole("ADMIN")\n'
                '      .anyRequest().authenticated());\n    return http.build();\n  }\n}\n')
        r = run(c.endpoints_auth, {"C.java": ctrl, "Sec.java": conf}, self)
        self.assertEqual((r.status, r.checked), (c.NO_CUMPLE, 3))
        self.assertEqual(len(r.detail), 1)
        self.assertIn("POST /api/emails/send (spring) es pública", r.detail[0])
        listed = run(c.endpoints_auth, {"C.java": ctrl, "Sec.java": conf,
                                         ".agent/public-routes.txt": "POST /api/emails/send  # relay interno detrás del gateway, ADR-0007\n"}, self)
        self.assertEqual(listed.status, c.CUMPLE)

    def test_public_list_needs_a_reason(self):
        src = '@app.post("/login")\ndef login(form: dict):\n    pass\n'
        self.assertEqual(run(c.endpoints_auth, {"a.py": src, ".agent/public-routes.txt": "POST /login\n"}, self).status, c.NO_CUMPLE)
        self.assertEqual(run(c.endpoints_auth, {"a.py": src, ".agent/public-routes.txt": "POST /login  # inicio de sesión\n"}, self).status, c.CUMPLE)

    def test_kotlin_dsl_rules(self):
        ctrl = '@RestController\nclass C {\n  @PostMapping("/api/x")\n  fun x() { }\n}\n'
        conf = 'http {\n  authorizeHttpRequests {\n    authorize("/api/**", hasAuthority("X"))\n    authorize(anyRequest, authenticated)\n  }\n}\nval s: HttpSecurity? = null\n'
        self.assertEqual(run(c.endpoints_auth, {"C.kt": ctrl, "Sec.kt": conf}, self).status, c.CUMPLE)

    def test_frontend_only_is_not_evaluated(self):
        files = {"src/app/a.component.ts": "export class A { guardar() { this.http.post('/api/x', {}).subscribe(); } }",
                 "src/App.tsx": "export default function App() { return <button onClick={() => fetch('/api/x', {method: 'POST'})}/>; }"}
        self.assertEqual(run(c.endpoints_auth, files, self).status, c.NO_EVALUADO)


class TestWebhooksStacks(unittest.TestCase):
    SPRING_OK = ('@RestController\npublic class W {\n  @PostMapping("/api/gitlab/webhook")\n'
                 '  public ResponseEntity<Void> h(@RequestHeader("X-Token") String t) {\n'
                 '    if (secret == null || secret.isBlank()) return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();\n'
                 '    if (!MessageDigest.isEqual(t.getBytes(), secret.getBytes())) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();\n'
                 '    return ResponseEntity.ok().build();\n  }\n}\n')
    SPRING_BAD = ('@RestController\npublic class W {\n  @PostMapping("/api/gitlab/webhook")\n'
                  '  public String h(@RequestBody String p) { if (!token.equals(secret)) return "ignored"; return "ok"; }\n}\n')

    def test_spring(self):
        self.assertEqual(run(c.webhooks_fail_closed, {"W.java": self.SPRING_OK}, self).status, c.CUMPLE)
        r = run(c.webhooks_fail_closed, {"W.java": self.SPRING_BAD}, self)
        self.assertEqual(r.status, c.NO_CUMPLE)
        self.assertEqual(len(r.detail), 2)

    def test_express(self):
        ok = ("app.post('/hooks/webhook', (req, res) => {\n  const s = process.env.HOOK_SECRET;\n  if (!s) return res.sendStatus(503);\n"
              "  if (!crypto.timingSafeEqual(Buffer.from(req.get('x-token') || ''), Buffer.from(s))) return res.sendStatus(401);\n"
              "  res.sendStatus(204);\n});\n")
        bad = "app.post('/hooks/webhook', (req, res) => { if (req.get('x-token') !== process.env.S) return res.json({status: 'ignored'}); });\n"
        self.assertEqual(run(c.webhooks_fail_closed, {"a.js": ok}, self).status, c.CUMPLE)
        self.assertEqual(run(c.webhooks_fail_closed, {"a.js": bad}, self).status, c.NO_CUMPLE)

    def test_nest(self):
        src = ("@Controller('hooks')\nexport class H {\n  @Post('webhook')\n  recibir(@Headers('x-token') t: string) {\n"
               "    if (!timingSafeEqual(Buffer.from(t), Buffer.from(this.secret))) throw new UnauthorizedException();\n  }\n}\n")
        self.assertEqual(run(c.webhooks_fail_closed, {"h.controller.ts": src}, self).status, c.CUMPLE)


class TestNoSilentExceptStacks(unittest.TestCase):
    def test_java_broad_catch(self):
        src = ("class A {\n  void a() { try { x(); } catch (Exception e) { } }\n"
               "  void b() { try { x(); } catch (Exception e) { log.error(\"fallo\", e); } }\n"
               "  void c() { try { x(); } catch (IOException | RuntimeException e) { throw new IllegalStateException(e); } }\n"
               "  void d() { try { x(); } catch (NumberFormatException e) { return; } }\n}\n")
        r = run(c.no_silent_except, {"src/main/java/A.java": src}, self)
        self.assertEqual((r.status, r.checked), (c.NO_CUMPLE, 3))
        self.assertEqual(len(r.detail), 1)
        self.assertIn("A.java:2", r.detail[0])

    def test_kotlin_catch(self):
        r = run(c.no_silent_except, {"A.kt": "fun a() { try { x() } catch (e: Exception) { } }\n"}, self)
        self.assertEqual(r.status, c.NO_CUMPLE)

    def test_angular_and_react(self):
        angular = ("export class A {\n  cargar() {\n    this.s.listar().subscribe({ next: d => this.d = d, error: () => {} });\n"
                   "    this.s.otro().subscribe({ error: (e) => this.messageService.add({severity: 'error', detail: e.message}) });\n  }\n}\n")
        react = ("export function useDatos() {\n  useEffect(() => { fetch('/api').then(r => r.json()).catch(() => {}); }, []);\n"
                 "  async function guardar() { try { await api.post(); } catch (e) { setError(e.message); } }\n"
                 "  async function borrar() { try { await api.del(); } catch { return false; } }\n}\n")
        r = run(c.no_silent_except, {"src/app/a.component.ts": angular, "src/hooks/useDatos.tsx": react}, self)
        self.assertEqual(r.status, c.NO_CUMPLE)
        kinds = "\n".join(r.detail)
        self.assertIn("a.component.ts:3: error: () => {} vacío", kinds)
        self.assertIn("useDatos.tsx:2: .catch", kinds)
        self.assertIn("useDatos.tsx:4: catch", kinds)
        self.assertEqual(len(r.detail), 3)

    def test_defaults_alternate_paths_and_stated_intent_are_decisions(self):
        src = ("try { this.p = JSON.parse(x); } catch { this.p = false; }\n"
               "try { a(); } catch (ignored) { }\n"
               "try { git(); } catch (e) { return walk(dir); }\n"
               "try { s.limpiar(); } catch {\n  // no-op si el servicio ya fue destruido\n}\n"
               "await page.waitForLoadState('networkidle').catch(() => {});  // espera opcional\n")
        java = "class A { void a() { try { x(); } catch (Exception ignored) { } try { y(); } catch (Exception e) { valor = 0; } } }"
        r = run(c.no_silent_except, {"a.ts": src, "A.java": java}, self)
        self.assertEqual(r.status, c.CUMPLE)

    def test_strings_and_comments_do_not_confuse_the_parser(self):
        src = 'const url = "http://x/catch {"; // catch (e) {}\ntry { a(); } catch (e) { console.error("falló", e); }\n'
        r = run(c.no_silent_except, {"a.ts": src}, self)
        self.assertEqual((r.status, r.checked), (c.CUMPLE, 1))

    def test_test_files_declarations_and_vendored_code_are_skipped(self):
        r = run(c.no_silent_except, {"a.spec.ts": "try { a(); } catch (e) { }", "types.d.ts": "declare const x: any;",
                                     "web/js/jquery/plugins/date.js": "try { a(); } catch (e) { }", "lib.min.js": "try{a()}catch(e){}"}, self)
        self.assertEqual(r.status, c.NO_EVALUADO)


class TestCleaner(unittest.TestCase):
    def test_positions_are_kept(self):
        text = 'a = "}{"; /* } */ b // }\n'
        code, masked = stacks.clean(text)
        self.assertEqual((len(code), len(masked)), (len(text), len(text)))
        self.assertNotIn("}", masked)
        self.assertIn('"}{"', code)


if __name__ == "__main__":
    unittest.main()
