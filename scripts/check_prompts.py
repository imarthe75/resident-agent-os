#!/usr/bin/env python3
"""Validates the headers of prompts/*.md.   python scripts/check_prompts.py [--root .]   Exit 1 if any prompt is malformed."""
import argparse
import re
import sys
from pathlib import Path

REQUIRED = ("id", "version", "owner", "derived_from", "eval_set", "last_reviewed")
SEMVER = re.compile(r"^\d+\.\d+\.\d+$")
DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def parse_header(text: str) -> dict:
    m = re.match(r"\A---\s*\n(.*?)\n---\s*\n", text, re.DOTALL)
    if not m:
        return {}
    out = {}
    for line in m.group(1).splitlines():
        if ":" in line:
            k, v = line.split(":", 1)
            out[k.strip()] = v.strip()
    return out


def check(root: Path) -> list:
    problems, seen = [], {}
    for f in sorted((root / "prompts").glob("*.md")):
        if f.name.lower() == "readme.md":
            continue
        h = parse_header(f.read_text(encoding="utf-8"))
        if not h:
            problems.append(f"{f.name}: falta la cabecera ---")
            continue
        for k in REQUIRED:
            if not h.get(k):
                problems.append(f"{f.name}: falta '{k}'")
        if h.get("version") and not SEMVER.match(h["version"]):
            problems.append(f"{f.name}: version '{h['version']}' no es semver")
        if h.get("last_reviewed") and not DATE.match(h["last_reviewed"]):
            problems.append(f"{f.name}: last_reviewed '{h['last_reviewed']}' no es AAAA-MM-DD")
        if h.get("derived_from") and not (root / h["derived_from"]).exists():
            problems.append(f"{f.name}: derived_from '{h['derived_from']}' no existe")
        ev = h.get("eval_set")
        if ev and ev != "none" and not (root / ev).exists():
            problems.append(f"{f.name}: eval_set '{ev}' no existe (usa 'none' si de verdad no hay)")
        if h.get("id") in seen:
            problems.append(f"{f.name}: id '{h['id']}' repetido en {seen[h['id']]}")
        seen[h.get("id")] = f.name
    return problems


def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default=".")
    a = ap.parse_args(argv)
    problems = check(Path(a.root).resolve())
    for p in problems:
        print("✗", p)
    print("prompts OK" if not problems else f"{len(problems)} problema(s)")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
