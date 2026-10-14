import os
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable, Dict, List

CUMPLE, NO_CUMPLE, NO_EVALUADO = "CUMPLE", "NO_CUMPLE", "NO_EVALUADO"
SKIP_DIRS = {".git", "node_modules", "target", "build", "dist", "__pycache__", ".venv", "venv", "data"}


@dataclass
class Result:
    verifier: str
    status: str
    method: str                      # "static" (decided from the text) or "heuristic" (a pattern that can miss cases)
    detail: List[str] = field(default_factory=list)
    checked: int = 0                 # how many items were actually examined (0 + CUMPLE would be a lie, so it is NO_EVALUADO)


def _files(root: Path, suffixes) -> List[Path]:
    out = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        out += [Path(dirpath) / f for f in filenames if f.endswith(tuple(suffixes))]
    return sorted(out)


def _strip_sql_comments(sql: str) -> str:
    sql = re.sub(r"/\*.*?\*/", " ", sql, flags=re.DOTALL)
    return re.sub(r"--[^\n]*", " ", sql)


_CREATE_TABLE = re.compile(r'CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?P<name>(?:"?[\w]+"?\.)?"?[\w]+"?)\s*\((?P<body>.*?)\)\s*(?:;|PARTITION|INHERITS|WITH|TABLESPACE|$)',
                           re.IGNORECASE | re.DOTALL)


def _split_columns(body: str) -> List[str]:
    parts, depth, cur = [], 0, []
    for ch in body:
        depth += (ch == "(") - (ch == ")")
        if ch == "," and depth == 0:
            parts.append("".join(cur).strip())
            cur = []
        else:
            cur.append(ch)
    parts.append("".join(cur).strip())
    return [p for p in parts if p]


def pk_uuid(root: Path) -> Result:
    """Every table created in a .sql file has a primary key of type uuid (no integer/bigint/serial/identity)."""
    bad, checked = [], 0
    for f in _files(root, (".sql",)):
        sql = _strip_sql_comments(f.read_text(encoding="utf-8", errors="replace"))
        for m in _CREATE_TABLE.finditer(sql):
            name, cols = m.group("name").replace('"', ""), _split_columns(m.group("body"))
            pk_cols = []
            for c in cols:
                mt = re.match(r'^PRIMARY\s+KEY\s*\(([^)]*)\)', c, re.IGNORECASE)
                if mt:
                    pk_cols += [x.strip().strip('"') for x in mt.group(1).split(",")]
            for c in cols:
                cm = re.match(r'^"?(\w+)"?\s+([\w\[\]\(\), ]+?)(?:\s|$)(.*)$', c, re.DOTALL)
                if not cm or cm.group(1).upper() in ("CONSTRAINT", "PRIMARY", "FOREIGN", "UNIQUE", "CHECK", "EXCLUDE", "LIKE"):
                    continue
                col, typ, rest = cm.group(1), cm.group(2).strip().lower(), cm.group(3)
                is_pk = bool(re.search(r"PRIMARY\s+KEY", rest, re.IGNORECASE)) or col in pk_cols
                if not is_pk:
                    continue
                checked += 1
                if not typ.startswith("uuid") or re.search(r"GENERATED\s+(ALWAYS|BY\s+DEFAULT)\s+AS\s+IDENTITY", rest, re.IGNORECASE):
                    bad.append(f"{f.relative_to(root)}: {name}.{col} es {typ or '?'} (se esperaba uuid)")
    if checked == 0:
        return Result("pk_uuid", NO_EVALUADO, "static", ["no se encontró ninguna llave primaria en archivos .sql"], 0)
    return Result("pk_uuid", NO_CUMPLE if bad else CUMPLE, "static", bad, checked)


_STATEFUL = re.compile(r"(postgres|pgvector|mysql|mariadb|mongo|valkey|redis|seaweed|minio|elasticsearch|opensearch|rabbitmq|kafka|redpanda|clickhouse)", re.IGNORECASE)


def compose_volumes(root: Path, data_root: str = None) -> Result:
    """Stateful services (databases, caches, object stores) persist to a host folder under ./data, not to a named volume or elsewhere."""
    import yaml
    data_root = (data_root or os.getenv("DATA_ROOT", "./data")).rstrip("/")
    bad, checked = [], 0
    for f in [p for p in _files(root, (".yml", ".yaml")) if "compose" in p.name.lower()]:
        try:
            doc = yaml.safe_load(f.read_text(encoding="utf-8")) or {}
        except yaml.YAMLError as e:
            return Result("compose_volumes", NO_EVALUADO, "static", [f"{f.relative_to(root)}: YAML inválido ({e})"], 0)
        for name, svc in (doc.get("services") or {}).items():
            if not isinstance(svc, dict) or not _STATEFUL.search(str(svc.get("image", ""))):
                continue
            checked += 1
            vols = [v for v in (svc.get("volumes") or [])]
            ok = False
            for v in vols:
                src = (v.get("source") if isinstance(v, dict) else str(v).split(":")[0]) or ""
                if src.startswith(data_root + "/") or src == data_root:
                    ok = True
            if not ok:
                bad.append(f"{f.relative_to(root)}: el servicio con estado '{name}' ({svc.get('image')}) no persiste en {data_root}/…")
    if checked == 0:
        return Result("compose_volumes", NO_EVALUADO, "static", ["ningún servicio con estado en archivos compose"], 0)
    return Result("compose_volumes", NO_CUMPLE if bad else CUMPLE, "static", bad, checked)


def audit_triggers(root: Path) -> Result:
    """HEURISTIC: every table created in .sql files has some trigger whose name mentions 'audit'/'auditoria' on it. It does not prove the
    trigger function logs the right thing; it proves a trigger was declared."""
    tables, trig = {}, set()
    for f in _files(root, (".sql",)):
        sql = _strip_sql_comments(f.read_text(encoding="utf-8", errors="replace"))
        for m in _CREATE_TABLE.finditer(sql):
            tables[m.group("name").replace('"', "").split(".")[-1].lower()] = f"{f.relative_to(root)}"
        for m in re.finditer(r'CREATE\s+(?:OR\s+REPLACE\s+)?TRIGGER\s+"?(\w+)"?.*?\bON\s+(?:"?\w+"?\.)?"?(\w+)"?', sql, re.IGNORECASE | re.DOTALL):
            if re.search(r"audit", m.group(1), re.IGNORECASE):
                trig.add(m.group(2).lower())
    own = {t: f for t, f in tables.items() if t not in ("log_auditoria",)}
    if not own:
        return Result("audit_triggers", NO_EVALUADO, "heuristic", ["no hay tablas en archivos .sql"], 0)
    missing = [f"{f}: la tabla '{t}' no tiene trigger de auditoría declarado" for t, f in sorted(own.items()) if t not in trig]
    return Result("audit_triggers", NO_CUMPLE if missing else CUMPLE, "heuristic", missing, len(own))


_ROUTE_PY = re.compile(r"^@(?:\w+)\.(get|post|put|patch|delete)\(\s*[\"']([^\"']+)", re.MULTILINE)


def endpoints_auth(root: Path, auth_regex: str = None) -> Result:
    """HEURISTIC, FastAPI only: every mutating route (post/put/patch/delete) declares an authentication dependency matching AUTH_REGEX
    (default: Depends(<name containing auth|user|token|oidc|principal|require>)). Other frameworks are NOT evaluated (not guessed)."""
    rx = re.compile(auth_regex or os.getenv("AUTH_REGEX", r"Depends\(\s*\w*(auth|user|token|oidc|principal|require|verify)\w*"), re.IGNORECASE)
    bad, checked = [], 0
    for f in _files(root, (".py",)):
        text = f.read_text(encoding="utf-8", errors="replace")
        for m in _ROUTE_PY.finditer(text):
            if m.group(1) == "get":
                continue
            checked += 1
            end = text.find("\n@", m.end())
            block = text[m.start(): end if end != -1 else len(text)]
            sig_end = block.find("):")
            signature = block[: sig_end if sig_end != -1 else min(len(block), 600)]
            if not rx.search(m.group(0) + signature):
                bad.append(f"{f.relative_to(root)}: {m.group(1).upper()} {m.group(2)} sin dependencia de autenticación reconocible")
    if checked == 0:
        return Result("endpoints_auth", NO_EVALUADO, "heuristic", ["no se encontraron rutas mutantes de FastAPI (otros frameworks no se evalúan)"], 0)
    return Result("endpoints_auth", NO_CUMPLE if bad else CUMPLE, "heuristic", bad, checked)


REGISTRY: Dict[str, Callable[..., Result]] = {"pk_uuid": pk_uuid, "compose_volumes": compose_volumes, "audit_triggers": audit_triggers,
                                              "endpoints_auth": endpoints_auth}
