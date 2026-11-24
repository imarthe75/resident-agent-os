"""Lectura estructural de Java/Kotlin y TypeScript/JavaScript para los verificadores de `checks.py`.

No es un parser completo: quita comentarios, enmascara el contenido de las cadenas (para que una llave o un `//` dentro de un texto no
cambie la estructura) y empareja llaves y paréntesis. Con eso alcanza para ubicar anotaciones de métodos, cuerpos de `catch` y argumentos de
una ruta. Lo que no reconoce no lo adivina: el verificador lo reporta como no evaluado.
"""
import re
from dataclasses import dataclass
from typing import Iterator, List, Tuple

JAVA_SUFFIXES = (".java", ".kt")
JS_SUFFIXES = (".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs")


# Código de terceros copiado al repositorio: no es del proyecto y no se le pide nada.
_VENDORED = re.compile(r"(^|/)(vendor|vendors|third[_-]party|bower_components|jquery|plugins|assets|static/lib|public/lib|wwwroot/lib)/", re.IGNORECASE)


def is_source(name: str, suffixes, rel: str = "") -> bool:
    return name.endswith(suffixes) and not name.endswith((".d.ts", ".min.js", ".bundle.js")) and not _VENDORED.search(rel.replace("\\", "/"))


def clean(text: str) -> Tuple[str, str]:
    """(code, masked). `code`: el texto sin comentarios (mismas posiciones, comentarios en espacios). `masked`: además, el interior de cada
    cadena en espacios. Las dos tienen la longitud del original, así que un índice sirve en ambas."""
    code, masked = list(text), list(text)
    i, n = 0, len(text)
    while i < n:
        ch = text[i]
        if ch == "/" and i + 1 < n and text[i + 1] in "/*":
            end = text.find("\n", i) if text[i + 1] == "/" else text.find("*/", i + 2)
            end = n if end == -1 else (end if text[i + 1] == "/" else end + 2)
            for j in range(i, end):
                if text[j] != "\n":
                    code[j] = masked[j] = " "
            i = end
        elif ch in "\"'`":
            j = i + 1
            while j < n and text[j] != ch and not (ch != "`" and text[j] == "\n"):
                j += 2 if text[j] == "\\" else 1
            for k in range(i + 1, min(j, n)):
                if text[k] != "\n":
                    masked[k] = " "
            i = j + 1
        else:
            i += 1
    return "".join(code), "".join(masked)


def match_close(masked: str, start: int, open_ch: str = "{", close_ch: str = "}") -> int:
    """Índice del cierre que corresponde a la apertura en `start` (o len - 1 si el archivo está incompleto)."""
    depth = 0
    for i in range(start, len(masked)):
        if masked[i] == open_ch:
            depth += 1
        elif masked[i] == close_ch:
            depth -= 1
            if depth == 0:
                return i
    return len(masked) - 1


def member_span(masked: str, pos: int) -> Tuple[int, int]:
    """Desde el fin del miembro anterior hasta la llave (o `;`) que abre el cuerpo del miembro que contiene `pos`: sus anotaciones y firma."""
    start = max(masked.rfind(c, 0, pos) for c in "};{") + 1
    m = re.compile(r"[{;]").search(masked, pos)
    return start, (m.start() if m else len(masked))


def first_string(code: str) -> str:
    m = re.search(r"([\"'`])((?:(?!\1).)*)\1", code)
    return m.group(2) if m else ""


# ---------------------------------------------------------------- rutas
@dataclass
class Route:
    framework: str
    method: str
    path: str
    line: int
    authorized: bool
    body: str          # código (sin comentarios) del manejador, para revisar comparaciones y respuestas
    public: bool = False   # declarada pública en el propio código (@PermitAll, @Public()): necesita estar en la lista de rutas públicas


_AUTH_JAVA = re.compile(r"@(PreAuthorize|PostAuthorize|Secured|RolesAllowed|DenyAll)\b")
_PUBLIC_JAVA = re.compile(r"@PermitAll\b|@PreAuthorize\s*\(\s*[\"']permitAll\(\)[\"']")
_SPRING_MAP = re.compile(r"@(Post|Put|Patch|Delete|Get)Mapping\b|@RequestMapping\b")
_AUTH_JS_NAME = re.compile(r"auth|jwt|token|passport|guard|protect|requir|verif|ensure|session|permiso|permission", re.IGNORECASE)


def _line(text: str, pos: int) -> int:
    return text.count("\n", 0, pos) + 1


def _class_annotations(code: str, masked: str) -> List[Tuple[int, int, str]]:
    """(inicio, fin, anotaciones) de cada clase: el texto entre el miembro anterior y la palabra `class`."""
    out = []
    for m in re.finditer(r"\bclass\s+\w+", masked):
        start = max(masked.rfind(c, 0, m.start()) for c in "};") + 1
        brace = masked.find("{", m.end())
        out.append((start, match_close(masked, brace) if brace != -1 else len(masked), code[start:m.start()]))
    return out


def spring_routes(text: str) -> Iterator[Route]:
    """Métodos de controladores Spring (Java o Kotlin). `authorized` = @PreAuthorize/@Secured/@RolesAllowed/@DenyAll en el método o en la
    clase; `public` = @PermitAll o @PreAuthorize("permitAll()"). Las reglas por URL de la configuración de seguridad se aplican aparte
    (`spring_security_rules`)."""
    if not re.search(r"@(Rest)?Controller\b", text):
        return
    code, masked = clean(text)
    classes = _class_annotations(code, masked)
    for m in _SPRING_MAP.finditer(masked):
        start, end = member_span(masked, m.start())
        member = code[start:end]
        if re.search(r"\bclass\s+\w+", masked[m.start():end]):
            continue                                      # anotación de la clase (ruta base), no de un método
        args = code[m.end(): match_close(masked, m.end()) + 1] if masked[m.end():m.end() + 1] == "(" else ""
        if m.group(1):
            verb = m.group(1).upper()
        else:
            rm = re.search(r"RequestMethod\.(\w+)", args)
            verb = rm.group(1) if rm else "ANY"
        cls = next(((s, e, a) for s, e, a in classes if s <= m.start() <= e), (0, len(text), ""))
        base = ""
        cm = re.search(r"@RequestMapping\s*\(", cls[2])
        if cm:
            base = first_string(cls[2][cm.end():])
        body_start = masked.find("{", end) if masked[end:end + 1] == "{" else -1
        body = code[body_start: match_close(masked, body_start) + 1] if body_start != -1 else ""
        public = bool(_PUBLIC_JAVA.search(member) or (_PUBLIC_JAVA.search(cls[2]) and not _AUTH_JAVA.search(member)))
        yield Route("spring", verb, (base.rstrip("/") + "/" + first_string(args).lstrip("/")).rstrip("/") or "/", _line(text, m.start()),
                    bool(_AUTH_JAVA.search(member) or _AUTH_JAVA.search(cls[2])) and not public, body, public)


def nest_routes(text: str, global_guard: bool) -> Iterator[Route]:
    """Métodos de controladores NestJS. Autorizado = @UseGuards en el método o en la clase, o un guard global (APP_GUARD /
    useGlobalGuards en el proyecto); @Public() la declara pública."""
    if "@Controller(" not in text:
        return
    code, masked = clean(text)
    classes = _class_annotations(code, masked)
    for m in re.finditer(r"@(Post|Put|Patch|Delete|Get|All)\s*\(", masked):
        start, end = member_span(masked, m.start())
        member = code[start:end]
        if re.search(r"\bclass\s+\w+", masked[m.start():end]):
            continue
        close = match_close(masked, m.end() - 1, "(", ")")
        cls = next(((s, e, a) for s, e, a in classes if s <= m.start() <= e), (0, len(text), ""))
        cm = re.search(r"@Controller\s*\(", cls[2])
        base = first_string(cls[2][cm.end():]) if cm else ""
        body_start = masked.find("{", end) if masked[end:end + 1] == "{" else -1
        body = code[body_start: match_close(masked, body_start) + 1] if body_start != -1 else ""
        public = bool(re.search(r"@Public\s*\(", member + cls[2]))
        authorized = not public and (global_guard or bool(re.search(r"@UseGuards\s*\(", member + cls[2])))
        path = ("/" + base.strip("/") + "/" + first_string(code[m.end():close]).strip("/")).replace("//", "/").rstrip("/") or "/"
        yield Route("nestjs", m.group(1).upper(), path, _line(text, m.start()), authorized, body, public)


def express_routes(text: str) -> Iterator[Route]:
    """Rutas Express (`app.post('/x', ...)`, `router.delete(...)`). Autorizado = un middleware con nombre de autenticación entre la ruta y
    el manejador, o un `app.use(<auth>)`/`router.use(<auth>)` anterior en el mismo archivo."""
    code, masked = clean(text)
    uses = [(u.start(), code[u.end(): match_close(masked, u.end() - 1, "(", ")")])
            for u in re.finditer(r"\b\w*(?:app|router|Router|api)\.use\s*\(", masked)]
    for m in re.finditer(r"\b(\w*(?:app|router|Router|api))\.(get|post|put|patch|delete)\s*\(", masked):
        close = match_close(masked, m.end() - 1, "(", ")")
        args = code[m.end():close]
        path = first_string(args)
        if not path.startswith("/"):
            continue
        handler_at = re.search(r"\b(async\s+)?function\b|=>", args)
        middleware = args[: handler_at.start()] if handler_at else args
        middleware = middleware.split(",", 1)[1] if "," in middleware else ""
        before = any(pos < m.start() and _AUTH_JS_NAME.search(arg) for pos, arg in uses)
        yield Route("express", m.group(2).upper(), path, _line(text, m.start()), bool(_AUTH_JS_NAME.search(middleware)) or before, args)


@dataclass
class UrlRule:
    regexes: List["re.Pattern"]
    methods: List[str]       # vacío = cualquier método
    action: str              # "authorized" | "public"


_AUTHZ_ACTIONS = re.compile(r"^(authenticated|fullyAuthenticated|hasRole|hasAnyRole|hasAuthority|hasAnyAuthority|access|denyAll|hasIpAddress|rememberMe)$")


def ant_to_regex(pattern: str) -> "re.Pattern":
    out, i = "", 0
    while i < len(pattern):
        if pattern.startswith("**", i):
            out, i = out + ".*", i + 2
        elif pattern[i] == "*":
            out, i = out + "[^/]*", i + 1
        elif pattern[i] == "{":
            j = pattern.find("}", i)
            out, i = out + "[^/]+", (j + 1 if j != -1 else len(pattern))
        else:
            out, i = out + re.escape(pattern[i]), i + 1
    return re.compile("^" + out.rstrip("/") + "/?$" if not out.endswith(".*") else "^" + out + "$")


def spring_security_rules(texts: List[str]) -> Tuple[List[UrlRule], str]:
    """Reglas por URL de la configuración de Spring Security (Java y DSL de Kotlin), en orden: [(patrones, métodos, acción)] y la acción de
    `anyRequest()`/`anyExchange()` ("authorized", "public" o "" si no hay). `web.ignoring()` cuenta como pública."""
    rules, fallback = [], ""
    for text in texts:
        if not re.search(r"HttpSecurity|ServerHttpSecurity|WebSecurityCustomizer|authorizeHttpRequests|authorizeRequests|authorizeExchange", text):
            continue
        code, masked = clean(text)
        for m in re.finditer(r"\b(requestMatchers|antMatchers|mvcMatchers|regexMatchers|pathMatchers)\s*\(", masked):
            close = match_close(masked, m.end() - 1, "(", ")")
            args = code[m.end():close]
            nxt = re.match(r"\s*\.\s*(\w+)", code[close + 1:])
            if not nxt:
                continue
            action = "public" if nxt.group(1) == "permitAll" else ("authorized" if _AUTHZ_ACTIONS.match(nxt.group(1)) else "")
            ignoring = "ignoring()" in code[max(0, m.start() - 40):m.start()]
            if ignoring:
                action = "public"
            if not action:
                continue
            pats = re.findall(r"[\"']([^\"']+)[\"']", args)
            methods = re.findall(r"HttpMethod\.(\w+)", args)
            rules.append(UrlRule([ant_to_regex(p) for p in pats if p.startswith("/")], methods, action))
        for m in re.finditer(r"\bauthorize\s*\(\s*(?:HttpMethod\.(\w+)\s*,\s*)?(?:[\"']([^\"']+)[\"']|anyRequest|anyExchange)\s*,\s*(\w+)", code):
            action = "public" if m.group(3) == "permitAll" else ("authorized" if _AUTHZ_ACTIONS.match(m.group(3)) else "")
            if action and m.group(2):
                rules.append(UrlRule([ant_to_regex(m.group(2))], [m.group(1)] if m.group(1) else [], action))
            elif action and not fallback:
                fallback = action
        m = re.search(r"\b(anyRequest|anyExchange)\s*\(\s*\)\s*\.\s*(\w+)", code)
        if m and not fallback:
            fallback = "public" if m.group(2) == "permitAll" else ("authorized" if _AUTHZ_ACTIONS.match(m.group(2)) else "")
    return rules, fallback


def url_decision(rules: List[UrlRule], fallback: str, method: str, path: str) -> str:
    """Primera regla que cubre la ruta (así las evalúa Spring); si ninguna, la de anyRequest()."""
    for r in rules:
        if (not r.methods or method in r.methods) and any(rx.match(path) for rx in r.regexes):
            return r.action
    return fallback


def public_routes(text: str) -> List[Tuple[str, "re.Pattern"]]:
    """`.agent/public-routes.txt`: una ruta pública a propósito por línea, `[MÉTODO] /patrón  # motivo` (el motivo es obligatorio)."""
    out = []
    for raw in text.splitlines():
        line, _, reason = raw.partition("#")
        parts = line.split()
        if not parts or not reason.strip():
            continue
        method = parts[0].upper() if len(parts) > 1 else ""
        out.append((method, ant_to_regex(parts[-1])))
    return out


# ---------------------------------------------------------------- errores silenciados
# Silencioso = el bloque no hace nada con el error: vacío, o solo `return` con un literal, `continue` o `break` (misma definición que la regla
# SWALLOWED-ERROR de un escáner, medida en código real). Un catch que asigna un valor por omisión o toma otro camino es una decisión visible.
_SILENT_BODY = re.compile(r"\s*(?:(?:return(?:\s+(?:null|nil|false|true|undefined|void\s+0|\[\s*\]|\{\s*\}|\"\"|''|0|-1|Optional\.empty\(\)"
                          r"|Collections\.empty\w*\(\)|List\.of\(\)|emptyList\(\)|of\(\s*(?:\[\s*\]|null)?\s*\)|EMPTY))?|continue|break)\s*;?\s*)?")
_INTENT = re.compile(r"^(ignored?|_+|expected|unused)$", re.IGNORECASE)
_BROAD_JAVA = {"Exception", "Throwable", "RuntimeException", "Error"}


@dataclass
class Catch:
    line: int
    kind: str
    handled: bool


def _silent(text: str, code: str, masked: str, brace: int) -> bool:
    """Silencioso y sin explicación: un comentario dentro del bloque («no-op si el servicio ya se destruyó») declara la intención."""
    end = match_close(masked, brace)
    return bool(_SILENT_BODY.fullmatch(code[brace + 1:end])) and not re.search(r"//|/\*", text[brace + 1:end])


def java_catches(text: str) -> Iterator[Catch]:
    """`catch` amplio (Exception, Throwable, RuntimeException, Error) en Java o Kotlin. Los de un tipo concreto, los de
    InterruptedException y los que nombran la variable `ignored`/`expected` se consideran decididos."""
    code, masked = clean(text)
    for m in re.finditer(r"\bcatch\s*\(\s*(?:final\s+)?(?:([\w.|\s]+?)\s+(\w+)|(\w+)\s*:\s*([\w.]+))\s*\)\s*\{", masked):
        types = {t.strip().split(".")[-1] for t in (m.group(1) or m.group(4) or "").split("|")}
        var = m.group(2) or m.group(3) or ""
        if not types & _BROAD_JAVA or _INTENT.match(var):
            continue
        yield Catch(_line(text, m.start()), "catch (" + "|".join(sorted(types)) + ")", not _silent(text, code, masked, m.end() - 1))


_EMPTY_PROMISE_CATCH = re.compile(r"\.catch\s*\(\s*(?:\(\s*\w*\s*\)|\w+)\s*=>\s*(?:\{\s*\}|null|undefined|void\s+0|false|true|\[\s*\]|of\(\s*(?:\[\s*\]|null)?\s*\)|EMPTY)\s*\)")
_EMPTY_RX_ERROR = re.compile(r"\berror\s*:\s*(?:\(\s*\w*\s*\)|\w+)\s*=>\s*\{\s*\}")


def js_catches(text: str) -> Iterator[Catch]:
    """TypeScript/JavaScript (Angular, React, Node): `catch` silencioso, `.catch(() => {})`/`[]`/`null` y `error: () => {}` de una
    suscripción. Un `catch (ignored)` declara la intención y no cuenta."""
    code, masked = clean(text)
    for m in re.finditer(r"\bcatch\s*(?:\(\s*(\w*)[^)]*\))?\s*\{", masked):
        if _INTENT.match(m.group(1) or "x"):
            continue
        yield Catch(_line(text, m.start()), "catch", not _silent(text, code, masked, m.end() - 1))
    for rx, kind in ((_EMPTY_PROMISE_CATCH, ".catch(() => …) vacío"), (_EMPTY_RX_ERROR, "error: () => {} vacío")):
        for m in rx.finditer(code):
            line_end = text.find("\n", m.end())
            commented = "//" in text[m.end(): line_end if line_end != -1 else len(text)]
            if not commented:                     # un comentario en la misma línea declara la intención
                yield Catch(_line(text, m.start()), kind, False)


def find_global_nest_guard(texts: List[str]) -> bool:
    return any(re.search(r"\bAPP_GUARD\b|useGlobalGuards\s*\(", t) for t in texts)

