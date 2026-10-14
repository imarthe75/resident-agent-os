#!/usr/bin/env python3
"""Resolve the CURRENT versions of the tools a new project will use (ADR-0003 D9). Nothing is remembered or assumed: every version comes from an
official public source at the moment you run this, or is reported as unresolved. A version typed from memory (by a person or a model) is how new
projects start out of date.

    python scripts/latest_versions.py                      print a table
    python scripts/latest_versions.py --write versions.lock.json     also save the lock the new project must use
    python scripts/latest_versions.py --check versions.lock.json     compare an existing lock with today (exit 1 if something moved on)
    python scripts/latest_versions.py --tools angular,java --json

Policy (which tools, which source, which channel) is .agent/versions-policy.json. Exit codes: 0 all resolved, 1 something unresolved/outdated.
A failed lookup yields version=null with the error; there is NO fallback to a built-in version.
"""
import argparse
import json
import re
import sys
import urllib.error
import urllib.request
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Callable, Dict, Optional

POLICY_DEFAULT = Path(__file__).resolve().parent.parent / ".agent" / "versions-policy.json"
TIMEOUT = 20


class ResolveError(Exception):
    pass


def http_json(url: str, timeout: int = TIMEOUT, accept: str = "application/json"):
    req = urllib.request.Request(url, headers={"User-Agent": "resident-agent-os-latest-versions/1", "Accept": accept})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, ValueError) as e:
        raise ResolveError(f"{url}: {type(e).__name__}: {e}") from e


def _major(v: str) -> Optional[int]:
    digits = ""
    for ch in str(v):
        if ch.isdigit():
            digits += ch
        else:
            break
    return int(digits) if digits else None


# ----------------------------------------------------------------------------- source parsers (pure: take the decoded JSON)
def parse_npm(doc: dict) -> str:
    v = doc.get("version")
    if not v or any(t in v for t in ("-rc", "-beta", "-alpha", "-next")):
        raise ResolveError(f"npm 'latest' is not a stable version: {v!r}")
    return v


def parse_endoflife(cycles: list, channel: str, today: Optional[date] = None) -> str:
    """cycles are newest first. 'latest' -> the newest cycle that is not end-of-life; 'lts' -> the newest cycle that is LTS *today*."""
    today = today or date.today()
    if not isinstance(cycles, list) or not cycles:
        raise ResolveError("empty or malformed endoflife.date answer")

    def alive(c):
        eol = c.get("eol")
        return eol is False or eol is None or (isinstance(eol, str) and eol >= today.isoformat())

    def is_lts(c):
        l = c.get("lts")
        if l is True:
            return True
        return isinstance(l, str) and l <= today.isoformat()

    pool = [c for c in cycles if alive(c)]
    if channel == "lts":
        pool = [c for c in pool if is_lts(c)]
    elif channel != "latest":
        raise ResolveError(f"unknown channel {channel!r}")
    if not pool:
        raise ResolveError(f"no supported cycle on channel {channel!r}")
    v = pool[0].get("latest")
    if not v:
        raise ResolveError("selected cycle has no 'latest'")
    return str(v)


def parse_adoptium(doc: dict, channel: str) -> str:
    key = "most_recent_lts" if channel == "lts" else "most_recent_feature_release"
    v = doc.get(key)
    if not isinstance(v, int):
        raise ResolveError(f"Adoptium answer has no integer {key!r}")
    return str(v)


_VER = re.compile(r"^v?(\d+)(?:\.(\d+))?(?:\.(\d+))?")
_COMP = re.compile(r"^(>=|<=|>|<|=)?\s*(\d[\w.\-]*)$")


def _vt(v: str):
    m = _VER.match(str(v).strip())
    return (int(m.group(1)), int(m.group(2) or 0), int(m.group(3) or 0)) if m else None


def satisfies(version: str, rng: str) -> bool:
    """Small npm-range check: comparator sets joined by `||`, comparators separated by spaces (>=a <b). Syntax it does not understand (^, ~, x-ranges)
    raises ResolveError instead of being guessed. Pre-release versions never satisfy."""
    if "-" in str(version):
        return False
    v = _vt(version)
    if v is None:
        raise ResolveError(f"unreadable version {version!r}")
    for alt in str(rng).split("||"):
        ok = True
        for comp in alt.split():
            m = _COMP.match(comp)
            if not m:
                raise ResolveError(f"unsupported range syntax {comp!r} in {rng!r}")
            op, t = (m.group(1) or "="), _vt(m.group(2))
            ok = ok and {">=": v >= t, "<=": v <= t, ">": v > t, "<": v < t, "=": v == t}[op]
        if ok:
            return True
    return False


def parse_npm_compatible(versions: dict, peer_range: str, latest: str) -> tuple:
    """Highest stable published version inside `peer_range`. Returns (version, extra): extra says why the overall latest is not the pick."""
    cands = [v for v in versions if satisfies(v, peer_range)]
    if not cands:
        raise ResolveError(f"no published version satisfies {peer_range!r}")
    best = max(cands, key=_vt)
    extra = {"latest_published": latest, "peer_range": peer_range}
    if latest and _vt(latest) and _vt(latest) > _vt(best):
        extra["note"] = (f"{latest} es la última publicada pero no se usa: la herramienta de la que depende el stack solo admite {peer_range}. "
                         f"Se usa {best}; cambia automáticamente cuando esa herramienta amplíe su soporte.")
    return best, extra


def _alive(cycle: dict, today: date) -> bool:
    eol = cycle.get("eol")
    return eol is False or eol is None or (isinstance(eol, str) and eol >= today.isoformat())


def parse_java_compatible(spring_cycles: list, temurin_cycles: list, adoptium: dict, today: Optional[date] = None) -> tuple:
    """Newest Java that FUNCTIONS with the newest supported Spring Boot line: not past its own end of life, and not above the highest Java that
    Spring Boot declares (`supportedJavaVersions`, e.g. "17 - 26"). Returns (major, extra) where extra explains why a newer GA Java is not chosen.
    A Java release can be final (GA) and still be the wrong answer for a Spring project: that is exactly the case this exists for."""
    import re as _re
    today = today or date.today()
    sb = next((c for c in spring_cycles if isinstance(c, dict) and _alive(c, today)), None)
    if not sb or not sb.get("supportedJavaVersions"):
        raise ResolveError("no supported Spring Boot line with supportedJavaVersions")
    nums = [int(n) for n in _re.findall(r"\d+", str(sb["supportedJavaVersions"]))]
    if not nums:
        raise ResolveError(f"cannot read supportedJavaVersions {sb['supportedJavaVersions']!r}")
    ceiling = max(nums)
    usable = [c for c in temurin_cycles if isinstance(c, dict) and str(c.get("cycle", "")).isdigit() and int(c["cycle"]) <= ceiling and _alive(c, today)]
    if not usable:
        raise ResolveError("no non-EOL Temurin release at or below the Spring Boot ceiling")
    chosen = max(int(c["cycle"]) for c in usable)
    latest_ga = adoptium.get("most_recent_feature_release") if isinstance(adoptium, dict) else None
    extra = {"spring_boot_line": sb.get("cycle"), "spring_boot_java_ceiling": ceiling, "latest_ga_java": latest_ga}
    if isinstance(latest_ga, int) and latest_ga > chosen:
        why = []
        if latest_ga > ceiling:
            why.append(f"Spring Boot {sb.get('cycle')} declara soporte solo hasta Java {ceiling}")
        for c in temurin_cycles:
            if isinstance(c, dict) and str(c.get("cycle")) == str(latest_ga) and not _alive(c, today):
                why.append(f"Java {latest_ga} ya salió de soporte")
        extra["note"] = f"Java {latest_ga} es versión final pero no se usa: " + "; ".join(why or [f"Java {chosen} es la última que el ecosistema soporta hoy"]) + \
                        f". Se usa Java {chosen}; el cambio es automático cuando Spring Boot declare soporte."
    return str(chosen), extra


# ----------------------------------------------------------------------------- resolution
def resolve_tool(name: str, spec: dict, fetch: Callable = http_json, today: Optional[date] = None) -> dict:
    src, channel = spec.get("source"), spec.get("channel", "latest")
    try:
        if src == "npm" and channel == "compatible":
            host, pkg = spec.get("with"), spec["package"]
            if not host:
                raise ResolveError("channel 'compatible' needs a \"with\" npm package whose peer range limits this one")
            url = f"https://registry.npmjs.org/{pkg}"
            peer = (fetch(f"https://registry.npmjs.org/{host}/latest").get("peerDependencies") or {}).get(pkg)
            if not peer:
                raise ResolveError(f"{host} declares no peer range for {pkg}")
            doc = fetch(url, accept="application/vnd.npm.install-v1+json") if fetch is http_json else fetch(url)
            latest = (doc.get("dist-tags") or {}).get("latest")
            version, extra = parse_npm_compatible(doc.get("versions") or {}, peer, latest)
            return {"version": version, "major": _major(version), "channel": channel, "source": src, "source_url": url, "limited_by": host, **extra}
        elif src == "npm":
            url = f"https://registry.npmjs.org/{spec['package']}/latest"
            version = parse_npm(fetch(url))
        elif src == "endoflife":
            url = f"https://endoflife.date/api/{spec['product']}.json"
            version = parse_endoflife(fetch(url), channel, today)
        elif src == "adoptium" and channel == "compatible":
            url = "https://api.adoptium.net/v3/info/available_releases"
            adoptium = fetch(url)
            if spec.get("with") != "spring-boot":
                raise ResolveError("channel 'compatible' needs \"with\": \"spring-boot\"")
            version, extra = parse_java_compatible(fetch("https://endoflife.date/api/spring-boot.json"),
                                                   fetch("https://endoflife.date/api/eclipse-temurin.json"), adoptium, today)
            return {"version": version, "major": _major(version), "channel": channel, "source": src, "source_url": url, **extra}
        elif src == "adoptium":
            url = "https://api.adoptium.net/v3/info/available_releases"
            version = parse_adoptium(fetch(url), channel)
        else:
            raise ResolveError(f"unknown source {src!r}")
    except (ResolveError, KeyError) as e:
        return {"version": None, "major": None, "channel": channel, "source": src, "error": str(e)}
    return {"version": version, "major": _major(version), "channel": channel, "source": src, "source_url": url}


def resolve_all(policy: dict, only=None, fetch: Callable = http_json, today: Optional[date] = None) -> Dict[str, dict]:
    tools = policy.get("tools", {})
    names = only or list(tools)
    unknown = [n for n in names if n not in tools]
    if unknown:
        raise SystemExit(f"herramienta no definida en la política: {', '.join(unknown)} (definidas: {', '.join(tools)})")
    return {n: resolve_tool(n, tools[n], fetch, today) for n in names}


def compare_lock(lock: dict, now: Dict[str, dict]) -> list:
    """Differences between a saved lock and a fresh resolution: [(tool, locked, current, kind)] with kind major|minor|unresolved."""
    out = []
    for tool, cur in now.items():
        old = (lock.get("tools") or {}).get(tool, {}).get("version")
        if cur["version"] is None:
            out.append((tool, old, None, "unresolved"))
        elif old is None:
            out.append((tool, None, cur["version"], "new"))
        elif old != cur["version"]:
            kind = "major" if _major(old) != _major(cur["version"]) else "minor"
            out.append((tool, old, cur["version"], kind))
    return out


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--policy", default=str(POLICY_DEFAULT))
    ap.add_argument("--tools")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--write", metavar="FILE")
    ap.add_argument("--check", metavar="LOCKFILE")
    a = ap.parse_args(argv)

    policy = json.loads(Path(a.policy).read_text(encoding="utf-8"))
    res = resolve_all(policy, a.tools.split(",") if a.tools else None)
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    lock = {"resolved_at": now, "policy": str(Path(a.policy).name), "tools": res}

    if a.check:
        old = json.loads(Path(a.check).read_text(encoding="utf-8"))
        diffs = compare_lock(old, res)
        if a.json:
            print(json.dumps([dict(zip(("tool", "locked", "current", "kind"), d)) for d in diffs], indent=2))
        else:
            print(f"Lock del {old.get('resolved_at')} frente a hoy ({now}):")
            for tool, o, c, kind in diffs:
                print(f"  {tool}: {o} -> {c}  [{kind}]")
            if not diffs:
                print("  sin cambios")
        return 1 if diffs else 0

    if a.json:
        print(json.dumps(lock, indent=2, ensure_ascii=False))
    else:
        print(f"{'herramienta':<14}{'versión':<14}{'canal':<11}fuente")
        for t, r in res.items():
            print(f"{t:<14}{(r['version'] or 'NO RESUELTA'):<14}{r['channel']:<11}{r['source']}" + (f"   ({r['error'][:90]})" if r.get("error") else ""))
            if r.get("note"):
                print(f"{'':<14}↳ {r['note']}")
    if a.write:
        Path(a.write).write_text(json.dumps(lock, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"\nLock guardado en {a.write}: el proyecto nuevo debe usar EXACTAMENTE estas versiones.", file=sys.stderr)
    return 0 if all(r["version"] for r in res.values()) else 1


if __name__ == "__main__":
    sys.exit(main())
