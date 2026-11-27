#!/usr/bin/env python3
"""Compare EVERY direct dependency of a project with the newest stable release published today, so a project starts (and stays) on current
packages. `latest_versions.py` resolves the platforms (Angular, Java, Spring Boot, Node...); this script covers the rest of the manifests.

    python scripts/outdated_dependencies.py --path <proyecto>            table; exit 1 if something is a MAJOR or MINOR behind
    python scripts/outdated_dependencies.py --path <proyecto> --strict   exit 1 on any lag, patch included (use it when creating a project)
    python scripts/outdated_dependencies.py --path <proyecto> --json     machine-readable report

Read: package.json (dependencies, devDependencies, optionalDependencies), pom.xml (parent, dependencies, plugins; ${properties} resolved),
build.gradle(.kts) ("group:artifact:version" coordinates and `id ... version` plugins), gradle/libs.versions.toml, the Gradle wrapper,
requirements*.txt and pyproject.toml. Sources: registry.npmjs.org, Maven Central, the Gradle plugin portal, services.gradle.org and PyPI.

npm: the target is the newest stable version whose peer dependencies are satisfied by the targets of the other packages in the same
package.json, and that the other packages' peer ranges accept (e.g. the newest TypeScript the Angular compiler supports). For Maven,
Gradle and Python there is no machine-readable compatibility data: the target is the newest stable release and the build and tests decide
(a version that breaks them becomes a written exception in the spec, rules/common/versions.md).

A dependency that cannot be resolved (offline, private registry, local path) is reported as unresolved, never assumed current.
Exit codes: 0 up to date, 1 behind, 2 nothing could be checked (no manifests, or every lookup failed).
"""
import argparse
import json
import logging
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Callable, Dict, List, Optional, Tuple

try:
    import tomllib
except ImportError:  # Python < 3.11
    tomllib = None

TIMEOUT = 20
SKIP_DIRS = {"node_modules", ".git", "dist", "build", "target", "out", ".gradle", ".venv", "venv", "vendor", "__pycache__", ".angular", "coverage"}
UNSTABLE = re.compile(r"(?i)(?:^|[.\-_+])(?:alpha|beta|rc|cr|m\d+|milestone|snapshot|preview|ea|dev|next|canary|nightly|incubating|b\d+|a\d+)"
                      r"|\d(?:a|b|rc|dev)\d*$")


# ----------------------------------------------------------------------------- versions
def vkey(v: str) -> Tuple[int, ...]:
    """Numeric prefix of a version ('7.1.0.Final' -> (7,1,0); 'v1.2' -> (1,2)). Qualifiers are ignored: callers only compare stable ones."""
    m = re.match(r"^v?(\d+(?:\.\d+)*)", str(v).strip())
    return tuple(int(x) for x in m.group(1).split(".")) if m else ()


def stable(v: str) -> bool:
    return bool(vkey(v)) and not UNSTABLE.search(str(v))


def lag(current: str, target: str) -> Optional[str]:
    """'major' | 'minor' | 'patch' | None (current is not behind target)."""
    c, t = list(vkey(current)), list(vkey(target))
    if not c or not t:
        return None
    n = max(len(c), len(t), 3)
    c += [0] * (n - len(c))
    t += [0] * (n - len(t))
    if tuple(c) >= tuple(t):
        return None
    if c[0] < t[0]:
        return "major"
    if c[1] < t[1]:
        return "minor"
    return "patch"


# ----------------------------------------------------------------------------- npm semver ranges (subset sufficient for peerDependencies)
def _sv(v: str) -> Tuple[int, int, int]:
    k = list(vkey(v)) + [0, 0, 0]
    return k[0], k[1], k[2]


def _partial(s: str):
    """'1.2' -> ([1,2], 2 parts); 'x'/'*' parts stop the parse."""
    parts = []
    for p in s.lstrip("v=").split("."):
        if p in ("x", "X", "*", ""):
            break
        m = re.match(r"^(\d+)", p)
        if not m:
            break
        parts.append(int(m.group(1)))
        if m.group(1) != p:
            break
    return parts


def _bounds(op: str, s: str):
    """Comparator -> list of (op, (maj,min,pat)) primitive bounds."""
    p = _partial(s)
    full = tuple(p + [0] * (3 - len(p)))[:3]
    if not p:
        return []  # '*' : anything
    if op == "^":
        if p[0] > 0 or len(p) == 1:
            hi = (p[0] + 1, 0, 0)
        elif len(p) == 2 or p[1] > 0:
            hi = (0, p[1] + 1, 0)
        else:
            hi = (0, 0, p[2] + 1)
        return [(">=", full), ("<", hi)]
    if op == "~":
        hi = (p[0] + 1, 0, 0) if len(p) == 1 else (p[0], p[1] + 1, 0)
        return [(">=", full), ("<", hi)]
    if op in ("", "="):
        if len(p) == 3:
            return [("=", full)]
        hi = (p[0] + 1, 0, 0) if len(p) == 1 else (p[0], p[1] + 1, 0)
        return [(">=", full), ("<", hi)]
    if op == "<=" and len(p) < 3:
        hi = (p[0] + 1, 0, 0) if len(p) == 1 else (p[0], p[1] + 1, 0)
        return [("<", hi)]
    if op == ">" and len(p) < 3:
        lo = (p[0] + 1, 0, 0) if len(p) == 1 else (p[0], p[1] + 1, 0)
        return [(">=", lo)]
    return [(op, full)]


def satisfies(version: str, rng: str) -> bool:
    """npm range semantics for stable versions: ||, spaces, hyphen ranges, ^ ~ >= <= > < =, x-ranges. Unknown syntax -> True (not a veto)."""
    v = _sv(version)
    rng = (rng or "*").strip()
    if rng.startswith(("workspace:", "npm:", "file:", "link:", "git", "http")):
        return True
    for alt in rng.split("||"):
        alt = alt.strip()
        m = re.match(r"^(\S+)\s+-\s+(\S+)$", alt)
        if m:
            lo = _partial(m.group(1))
            bounds = [(">=", tuple(lo + [0] * (3 - len(lo)))[:3])] + _bounds("<=", m.group(2))
        else:
            bounds = []
            for tok in re.findall(r"(\^|~|>=|<=|>|<|=)?\s*(v?[\dxX*][\w.*\-+]*|\*)", alt):
                bounds += _bounds(tok[0] or "", tok[1])
        ok = True
        for op, b in bounds:
            if not {"<": v < b, "<=": v <= b, ">": v > b, ">=": v >= b, "=": v == b}[op]:
                ok = False
                break
        if ok:
            return True
    return False


def min_version(spec: str) -> Optional[str]:
    """Lowest version a dependency spec allows ('^1.2.3' -> '1.2.3', '>=2' -> '2'); None for tags, paths and URLs."""
    s = str(spec).strip()
    if not s or s.startswith(("workspace:", "file:", "link:", "git", "http", "npm:", "github:")) or s in ("*", "latest", "next"):
        return None
    m = re.search(r"\d+(?:\.\d+){0,3}(?:[.\-][\w.]+)?", s)
    return m.group(0) if m else None


# ----------------------------------------------------------------------------- registries
class Lookup:
    """Network access, cached per run. `fetch` is injectable so the logic can be tested without the network."""

    def __init__(self, fetch: Optional[Callable[[str, str], str]] = None):
        self._fetch = fetch or self._http
        self._cache: Dict[str, object] = {}

    @staticmethod
    def _http(url: str, accept: str) -> str:
        req = urllib.request.Request(url, headers={"User-Agent": "resident-agent-os-outdated/1", "Accept": accept})
        with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
            return r.read().decode("utf-8")

    def get(self, url: str, accept: str = "application/json"):
        if url not in self._cache:
            try:
                self._cache[url] = ("ok", self._fetch(url, accept))
            except urllib.error.HTTPError as e:
                self._cache[url] = ("err", f"HTTP {e.code}")
            except Exception as e:  # network, timeout, decoding: reported per dependency, never swallowed
                logging.getLogger(__name__).warning("Lookup %s failed: %s", url, e, exc_info=True)
                self._cache[url] = ("err", f"{type(e).__name__}: {e}")
        return self._cache[url]

    def npm(self, name: str):
        st, body = self.get("https://registry.npmjs.org/" + urllib.parse.quote(name, safe="@"), "application/vnd.npm.install-v1+json")
        if st != "ok":
            return None, body
        doc = json.loads(body)
        all_versions = doc.get("versions") or {}
        vers = {v: (meta.get("peerDependencies") or {}, meta.get("peerDependenciesMeta") or {})
                for v, meta in all_versions.items() if stable(v) and not meta.get("deprecated")}
        deprecated = {v: str(meta["deprecated"])[:160] for v, meta in all_versions.items() if meta.get("deprecated")}
        return {"latest": (doc.get("dist-tags") or {}).get("latest"), "versions": vers, "deprecated": deprecated}, None

    def _metadata(self, url: str):
        st, body = self.get(url, "application/xml")
        if st != "ok":
            return None, body
        try:
            root = ET.fromstring(body)
        except ET.ParseError as e:
            return None, f"metadata inválida: {e}"
        vers = [v.text.strip() for v in root.iter("version") if v.text and stable(v.text.strip())]
        if not vers:
            return None, "sin versiones estables publicadas"
        return max(vers, key=vkey), None

    def maven(self, group: str, artifact: str):
        return self._metadata(f"https://repo1.maven.org/maven2/{group.replace('.', '/')}/{artifact}/maven-metadata.xml")

    def gradle_plugin(self, plugin_id: str):
        return self._metadata(f"https://plugins.gradle.org/m2/{plugin_id.replace('.', '/')}/{plugin_id}.gradle.plugin/maven-metadata.xml")

    def gradle(self):
        st, body = self.get("https://services.gradle.org/versions/current")
        return (json.loads(body).get("version"), None) if st == "ok" else (None, body)

    def pypi(self, name: str):
        st, body = self.get(f"https://pypi.org/pypi/{urllib.parse.quote(name)}/json")
        if st != "ok":
            return None, body
        doc = json.loads(body)
        vers = [v for v, files in (doc.get("releases") or {}).items() if stable(v) and files and not all(f.get("yanked") for f in files)]
        return (max(vers, key=vkey) if vers else doc.get("info", {}).get("version")), None


# ----------------------------------------------------------------------------- manifests
def _files(root: Path, names) -> List[Path]:
    out = []
    for p in root.rglob("*"):
        if p.is_file() and (p.name in names or any(p.name.startswith(n.rstrip("*")) for n in names if n.endswith("*"))) \
                and not (set(p.relative_to(root).parts[:-1]) & SKIP_DIRS):
            out.append(p)
    return sorted(out)


def npm_deps(f: Path):
    data = json.loads(f.read_text(encoding="utf-8"))
    for section in ("dependencies", "devDependencies", "optionalDependencies"):
        for name, spec in (data.get(section) or {}).items():
            yield name, str(spec)


def _pom_props(root, ns):
    props = {}
    for el in root.findall(f"{ns}properties/*"):
        props[el.tag.replace(ns, "")] = (el.text or "").strip()
    for tag in ("version",):
        el = root.find(f"{ns}{tag}")
        if el is not None and el.text:
            props["project.version"] = el.text.strip()
    return props


def maven_deps(f: Path):
    root = ET.fromstring(f.read_text(encoding="utf-8", errors="replace"))
    ns = root.tag[: root.tag.index("}") + 1] if root.tag.startswith("{") else ""
    props = _pom_props(root, ns)

    def val(el, tag):
        x = el.find(f"{ns}{tag}")
        t = (x.text or "").strip() if x is not None else ""
        return re.sub(r"\$\{([^}]+)\}", lambda m: props.get(m.group(1), m.group(0)), t)

    parent = root.find(f"{ns}parent")
    if parent is not None:
        yield val(parent, "groupId"), val(parent, "artifactId"), val(parent, "version"), "parent"
    for xpath, kind in ((".//{ns}dependencies/{ns}dependency", "dependency"), (".//{ns}plugins/{ns}plugin", "plugin")):
        for d in root.findall(xpath.format(ns=ns)):
            g = val(d, "groupId") or ("org.apache.maven.plugins" if kind == "plugin" else "")
            a, v = val(d, "artifactId"), val(d, "version")
            if g and a and v and "${" not in v:
                yield g, a, v, kind


_GRADLE_COORD = re.compile(r"""['"]([\w.\-]+):([\w.\-]+):(\d[\w.\-+]*)['"]""")
_GRADLE_PLUGIN = re.compile(r"""id\s*\(?\s*['"]([\w.\-]+)['"]\s*\)?\s*version\s*\(?\s*['"](\d[\w.\-+]*)['"]""")


def gradle_deps(f: Path):
    text = f.read_text(encoding="utf-8", errors="replace")
    text = re.sub(r"//[^\n]*|/\*.*?\*/", "", text, flags=re.DOTALL)
    for g, a, v in _GRADLE_COORD.findall(text):
        yield "maven", f"{g}:{a}", v
    for pid, v in _GRADLE_PLUGIN.findall(text):
        yield "gradle-plugin", pid, v


def catalog_deps(f: Path):
    if tomllib is None:
        return
    data = tomllib.loads(f.read_text(encoding="utf-8"))
    versions = data.get("versions") or {}

    def ver(entry):
        v = entry.get("version")
        if isinstance(v, dict):
            v = versions.get(v.get("ref")) if v.get("ref") else v.get("strictly") or v.get("require")
        elif v is None and entry.get("version.ref"):
            v = versions.get(entry["version.ref"])
        return v if isinstance(v, str) else None

    for entry in (data.get("libraries") or {}).values():
        if isinstance(entry, str):
            parts = entry.split(":")
            if len(parts) == 3:
                yield "maven", f"{parts[0]}:{parts[1]}", parts[2]
            continue
        module = entry.get("module") or (f"{entry.get('group')}:{entry.get('name')}" if entry.get("group") else None)
        v = ver(entry)
        if module and v:
            yield "maven", module, v
    for entry in (data.get("plugins") or {}).values():
        if isinstance(entry, str) and ":" in entry:
            pid, v = entry.split(":", 1)
            yield "gradle-plugin", pid, v
        elif isinstance(entry, dict) and entry.get("id") and ver(entry):
            yield "gradle-plugin", entry["id"], ver(entry)


_PEP508 = re.compile(r"^\s*([A-Za-z0-9][A-Za-z0-9._\-]*)(?:\[[^\]]*\])?\s*(?:===|==|>=|~=)\s*([\w.\-+]+)")


def python_deps(f: Path):
    if f.suffix == ".toml":
        if tomllib is None:
            return
        data = tomllib.loads(f.read_text(encoding="utf-8"))
        specs = list((data.get("project") or {}).get("dependencies") or [])
        for group in ((data.get("project") or {}).get("optional-dependencies") or {}).values():
            specs += list(group)
        poetry = ((data.get("tool") or {}).get("poetry") or {}).get("dependencies") or {}
        specs += [f"{k}=={min_version(v) or ''}" for k, v in poetry.items() if k != "python" and isinstance(v, str) and min_version(v)]
    else:
        specs = [ln.split("#")[0] for ln in f.read_text(encoding="utf-8", errors="replace").splitlines()]
    for s in specs:
        m = _PEP508.match(s)
        if m:
            yield m.group(1), m.group(2)


def wrapper_version(f: Path) -> Optional[str]:
    m = re.search(r"gradle-(\d[\w.\-]*?)-(?:bin|all)\.zip", f.read_text(encoding="utf-8", errors="replace"))
    return m.group(1) if m else None


# ----------------------------------------------------------------------------- analysis
def _load_policy_npm_constraints(root: Path) -> List[Tuple[str, str]]:
    """Read `(package, partner)` pairs declared as `channel: compatible` in `.agent/versions-policy.json`."""
    candidates = [root / ".agent" / "versions-policy.json", Path(__file__).resolve().parents[1] / ".agent" / "versions-policy.json"]
    for cfg in candidates:
        if not cfg.is_file():
            continue
        try:
            doc = json.loads(cfg.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            logging.getLogger(__name__).warning("Failed reading %s: %s", cfg, exc, exc_info=True)
            continue
        pairs: List[Tuple[str, str]] = []
        for entry in (doc.get("tools") or {}).values():
            if isinstance(entry, dict) and entry.get("source") == "npm" and entry.get("channel") == "compatible":
                pkg, partner = entry.get("package"), entry.get("with")
                if isinstance(pkg, str) and isinstance(partner, str):
                    pairs.append((pkg, partner))
        return pairs
    return []


def _lockfile_has_package(pkg_json: Path, pkg_name: str) -> bool:
    """Return True if a sibling `package-lock.json` contains `pkg_name` (including as a transitive dependency)."""
    lock = pkg_json.with_name("package-lock.json")
    if not lock.is_file():
        return False
    try:
        doc = json.loads(lock.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        logging.getLogger(__name__).warning("Failed reading %s: %s", lock, exc, exc_info=True)
        return False
    packages = doc.get("packages") or {}
    if isinstance(packages, dict):
        suffix = f"node_modules/{pkg_name}"
        for key in packages:
            if key == suffix or key.endswith("/" + suffix):
                return True
    deps = doc.get("dependencies") or {}
    return isinstance(deps, dict) and pkg_name in deps


def _blockers(
    n: str,
    v: str,
    target: Dict[str, str],
    deps: Dict[str, str],
    info: Dict[str, dict],
    extra_constraints: Optional[Dict[str, List[Tuple[str, str, str]]]] = None,
) -> List[str]:
    """Why version v of n is not compatible: its own peers, other packages' peer ranges, and transitive policy constraints."""
    out = []
    peers, meta = info[n]["versions"].get(v, ({}, {}))
    for q, r in peers.items():
        if q in target and target[q] and not (meta.get(q) or {}).get("optional") and not satisfies(target[q], r):
            out.append(f"pide {q} {r} (se propone {target[q]})")
    for o in deps:
        if o != n and info.get(o) and target.get(o):
            r = info[o]["versions"].get(target[o], ({}, {}))[0].get(n)
            if r and not satisfies(v, r):
                out.append(f"{o} {target[o]} acepta {n} {r}")
    for partner, pv, r in (extra_constraints or {}).get(n, ()):
        if not satisfies(v, r):
            out.append(f"{partner} {pv} (transitiva) acepta {n} {r}")
    return out


ANCHORS = re.compile(r"^(@angular/|@angular-devkit/|@nestjs/|react$|react-dom$|next$|vue$|@vue/|svelte$|@sveltejs/kit$)")


def _compatible(
    n: str,
    v: str,
    fixed: Dict[str, str],
    info: Dict[str, dict],
    extra_constraints: Optional[Dict[str, List[Tuple[str, str, str]]]] = None,
) -> bool:
    peers, meta = info[n]["versions"][v]
    for q, r in peers.items():
        if q in fixed and not (meta.get(q) or {}).get("optional") and not satisfies(fixed[q], r):
            return False
    for o, ov in fixed.items():
        if o != n and info.get(o) and ov in info[o]["versions"]:
            r = info[o]["versions"][ov][0].get(n)
            if r and not (info[o]["versions"][ov][1].get(n) or {}).get("optional") and not satisfies(v, r):
                return False
    for _partner, _pv, r in (extra_constraints or {}).get(n, ()):
        if not satisfies(v, r):
            return False
    return True


def _newest(
    n: str,
    floor: Optional[str],
    fixed: Dict[str, str],
    info: Dict[str, dict],
    extra_constraints: Optional[Dict[str, List[Tuple[str, str, str]]]] = None,
) -> Optional[str]:
    for v in sorted(info[n]["versions"], key=vkey, reverse=True):
        if floor and vkey(v) < vkey(floor):
            return None
        if _compatible(n, v, fixed, info, extra_constraints):
            return v
    return None


def _npm_targets(
    deps: Dict[str, str],
    info: Dict[str, dict],
    extra_constraints: Optional[Dict[str, List[Tuple[str, str, str]]]] = None,
) -> Dict[str, Tuple[Optional[str], str]]:
    """Newest stable versions that install together. Platforms (Angular, React, NestJS, Vue...) are fixed first at their newest release, then
    the packages others declare as a peer, then the rest, each at the newest version compatible with what is already fixed. When a package has
    no compatible version, it keeps its current one and whatever blocks it steps back, so the proposal never breaks the peer ranges."""
    current = {n: min_version(s) for n, s in deps.items()}
    known = [n for n in deps if info.get(n) and info[n]["versions"] and current.get(n)]
    dependents = {n: sum(1 for o in known if o != n and any(n in info[o]["versions"][v][0] for v in info[o]["versions"])) for n in known}
    order = sorted(known, key=lambda n: (not ANCHORS.match(n), -dependents[n], n))
    fixed: Dict[str, str] = {}
    notes: Dict[str, str] = {}
    for n in order:
        v = _newest(n, current[n], fixed, info, extra_constraints)
        if v is None:
            fixed[n] = current[n]
            blockers = [b for b in list(fixed) if b != n and current[n] in info[n]["versions"]
                        and not _compatible(n, current[n], {b: fixed[b]}, info)]
            for b in blockers:
                rest = {k: x for k, x in fixed.items() if k != b}
                fixed[b] = _newest(b, current[b], rest, info, extra_constraints) or current[b]
                notes[b] = f"se limita a {fixed[b]} porque {n} no tiene una versión compatible con una más nueva"
        else:
            fixed[n] = v
    for _ in range(6):  # raise anything the step-backs made room for
        moved = False
        for n in order:
            v = _newest(n, current[n], {k: x for k, x in fixed.items() if k != n}, info, extra_constraints)
            if v and vkey(v) > vkey(fixed[n]):
                fixed[n], moved = v, True
        if not moved:
            break
    out = {}
    for n in deps:
        if n not in fixed:
            out[n] = (current.get(n), "")
            continue
        latest = info[n]["latest"]
        note = notes.get(n, "")
        if latest and latest in info[n]["versions"] and vkey(fixed[n]) < vkey(latest):
            why = "; ".join(_blockers(n, latest, fixed, deps, info, extra_constraints)) or "incompatible con las demás dependencias"
            note = (note + "; " if note else "") + f"la última ({latest}) no es compatible: {why}"
        dep_note = info[n].get("deprecated", {}).get(current[n])
        if dep_note:
            note = (note + "; " if note else "") + f"la versión instalada está marcada como obsoleta en npm: «{dep_note}»"
        out[n] = (fixed[n], note)
    return out


def analyze(root: Path, lookup: Optional[Lookup] = None, workers: int = 8) -> List[dict]:
    lookup = lookup or Lookup()
    rows: List[dict] = []
    policy_npm_pairs = _load_policy_npm_constraints(root)

    def row(eco, f, name, current, latest, target, note="", error=None, deprecated=False):
        rows.append(dict(ecosystem=eco, file=str(f.relative_to(root)), name=name, current=current, latest=latest, target=target,
                         lag=(lag(current, target) if current and target else None), unresolved=error, note=note, deprecated=deprecated))

    with ThreadPoolExecutor(max_workers=workers) as pool:
        for f in _files(root, ("package.json",)):
            try:
                deps = dict(npm_deps(f))
            except (json.JSONDecodeError, OSError) as e:
                row("npm", f, "(manifiesto)", None, None, None, error=f"no se pudo leer: {e}")
                continue
            deps = {n: s for n, s in deps.items() if min_version(s)}
            res = dict(zip(deps, pool.map(lookup.npm, deps)))
            info = {n: r[0] for n, r in res.items() if r[0]}
            extra_constraints: Dict[str, List[Tuple[str, str, str]]] = {}
            for pkg, partner in policy_npm_pairs:
                if pkg in deps and partner not in deps and _lockfile_has_package(f, partner):
                    pinfo, _ = lookup.npm(partner)
                    if pinfo and pinfo["versions"]:
                        pv = pinfo["latest"] if pinfo.get("latest") in pinfo["versions"] else max(pinfo["versions"], key=vkey)
                        peers, meta = pinfo["versions"].get(pv, ({}, {}))
                        rng = peers.get(pkg)
                        if rng and not (meta.get(pkg) or {}).get("optional"):
                            extra_constraints.setdefault(pkg, []).append((partner, pv, rng))
            targets = _npm_targets(deps, info, extra_constraints)
            for n, spec in deps.items():
                if not info.get(n):
                    row("npm", f, n, min_version(spec), None, None, error=res[n][1])
                else:
                    row("npm", f, n, min_version(spec), info[n]["latest"], targets[n][0], targets[n][1],
                        deprecated=bool(info[n].get("deprecated", {}).get(min_version(spec))))

        maven_jobs = []
        for f in _files(root, ("pom.xml",)):
            try:
                for g, a, v, kind in maven_deps(f):
                    maven_jobs.append(("maven", f, f"{g}:{a}", v))
            except ET.ParseError as e:
                row("maven", f, "(manifiesto)", None, None, None, error=f"pom.xml inválido: {e}")
        for f in _files(root, ("build.gradle", "build.gradle.kts")):
            for eco, name, v in gradle_deps(f):
                maven_jobs.append((eco, f, name, v))
        for f in _files(root, ("libs.versions.toml",)):
            for eco, name, v in catalog_deps(f):
                maven_jobs.append((eco, f, name, v))

        def resolve(job):
            eco, _, name, _ = job
            return lookup.gradle_plugin(name) if eco == "gradle-plugin" else lookup.maven(*name.split(":", 1))

        for job, (latest, err) in zip(maven_jobs, pool.map(resolve, maven_jobs)):
            eco, f, name, v = job
            row(eco, f, name, v, latest, latest, error=None if latest else
                f"{err} (no está en {'el portal de plugins de Gradle' if eco == 'gradle-plugin' else 'Maven Central'}; ¿repositorio privado?)")

        for f in _files(root, ("gradle-wrapper.properties",)):
            v = wrapper_version(f)
            if v:
                latest, err = lookup.gradle()
                row("gradle-wrapper", f, "gradle", v, latest, latest, error=err)

        py_jobs = [(f, n, v) for f in _files(root, ("requirements*", "pyproject.toml")) if f.suffix in (".txt", ".in", ".toml")
                   for n, v in python_deps(f)]
        for (f, n, v), (latest, err) in zip(py_jobs, pool.map(lambda j: lookup.pypi(j[1]), py_jobs)):
            row("pypi", f, n, v, latest, latest, error=err)
    return rows


def summarize(rows: List[dict], strict: bool) -> Tuple[int, str]:
    behind = [r for r in rows if r.get("deprecated") or (r["lag"] and (strict or r["lag"] in ("major", "minor")))]
    resolved = [r for r in rows if not r["unresolved"]]
    if not rows or not resolved:
        return 2, "No se pudo verificar ninguna dependencia" + ("" if rows else " (no se encontraron manifiestos)")
    msg = f"{len(rows)} dependencias directas; {len(rows) - len(resolved)} sin resolver; {len(behind)} atrasadas" + \
          (" (cualquier atraso cuenta: --strict)" if strict else " (versión mayor o menor, u obsoleta)")
    return (1 if behind else 0), msg


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--path", default=".")
    ap.add_argument("--strict", action="store_true", help="cualquier atraso (incluido de parche) hace fallar")
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args(argv)
    root = Path(a.path).resolve()
    rows = analyze(root)
    code, msg = summarize(rows, a.strict)
    if a.json:
        print(json.dumps({"summary": msg, "exit": code, "dependencies": rows}, ensure_ascii=False, indent=1))
        return code
    print("  xx obsoleta en el registro · !! versión mayor · !  versión menor · .  parche · ?  sin resolver")
    order = {"major": 0, "minor": 1, "patch": 2, None: 3}
    for r in sorted(rows, key=lambda r: (r["unresolved"] is not None, not r["deprecated"], order[r["lag"]], r["file"], r["name"])):
        if r["unresolved"]:
            print(f"  ?  {r['file']:40} {r['name']:45} {r['current'] or '-':>12}  NO RESUELTA: {r['unresolved']}")
        elif r["lag"] or r["note"] or r["deprecated"]:
            mark = "xx" if r["deprecated"] else {"major": "!!", "minor": "! ", "patch": ". "}.get(r["lag"], "  ")
            extra = f"  (última {r['latest']})" if r["latest"] and r["latest"] != r["target"] else ""
            print(f"  {mark} {r['file']:40} {r['name']:45} {r['current']:>12} -> {r['target']}{extra}"
                  + (f"  {r['note']}" if r["note"] else ""))
    print(msg)
    return code


if __name__ == "__main__":
    sys.exit(main())
