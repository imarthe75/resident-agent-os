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


def http_json(url: str, timeout: int = TIMEOUT):
    req = urllib.request.Request(url, headers={"User-Agent": "resident-agent-os-latest-versions/1", "Accept": "application/json"})
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


# ----------------------------------------------------------------------------- resolution
def resolve_tool(name: str, spec: dict, fetch: Callable = http_json, today: Optional[date] = None) -> dict:
    src, channel = spec.get("source"), spec.get("channel", "latest")
    try:
        if src == "npm":
            url = f"https://registry.npmjs.org/{spec['package']}/latest"
            version = parse_npm(fetch(url))
        elif src == "endoflife":
            url = f"https://endoflife.date/api/{spec['product']}.json"
            version = parse_endoflife(fetch(url), channel, today)
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
        print(f"{'herramienta':<14}{'versión':<14}{'canal':<8}fuente")
        for t, r in res.items():
            print(f"{t:<14}{(r['version'] or 'NO RESUELTA'):<14}{r['channel']:<8}{r['source']}" + (f"   ({r['error'][:90]})" if r.get("error") else ""))
    if a.write:
        Path(a.write).write_text(json.dumps(lock, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"\nLock guardado en {a.write}: el proyecto nuevo debe usar EXACTAMENTE estas versiones.", file=sys.stderr)
    return 0 if all(r["version"] for r in res.values()) else 1


if __name__ == "__main__":
    sys.exit(main())
