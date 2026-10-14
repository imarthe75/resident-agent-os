#!/usr/bin/env python3
"""Distributes the framework to other repositories and reports DRIFT.

    python scripts/distribute_framework.py --parent /path/to/repos              copy to every git repo found directly under --parent
    python scripts/distribute_framework.py --target /repo/a --target /repo/b    copy to specific repos
    python scripts/distribute_framework.py --parent /path/to/repos --check      change nothing; list which repos drifted from this framework
    ... --dry-run                                                               show what would be copied

Every distributed repo gets `.framework-manifest.json` (framework version + sha256 of each generic file). `--check` compares the repo's REAL files
with this source (not just the manifest), so a hand-edited rule file is reported as `modified`, and a file the framework gained since the last
distribution as `missing`. Project-specific files (CONTEXT/MAP/STATE/SPECS/PROFILE) are copied once and never overwritten or compared.
Exit code of --check: 0 = no drift, 1 = drift found (usable in CI).
"""
import argparse
import hashlib
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

SOURCE_DEFAULT = Path(__file__).resolve().parent.parent
ITEMS = [".agent", "agents", "rules", "skills", "contexts", "hooks", "verifiers", "prompts", "docs/HEURISTICAS_MASTER_GUIDE.md",
         "docs/resident_agent_genesis.md", "sql/auditoria.sql", "VERSION"]
PROJECT_SPECIFIC = {".agent/CONTEXT.md", ".agent/MAP.md", ".agent/STATE.md", ".agent/SPECS.md", ".agent/PROFILE.json"}
SKIP_DIRS = {"__pycache__", ".git", "node_modules"}
MANIFEST = ".framework-manifest.json"
EXCLUDED_REPO_NAMES = {".git", ".vscode", ".claude", "data", "node_modules"}


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def generic_files(source: Path) -> dict:
    """{relative posix path: sha256} of every distributable, non-project-specific file in the source."""
    out = {}
    for item in ITEMS:
        p = source / item
        if p.is_file():
            files = [p]
        elif p.is_dir():
            files = [f for f in p.rglob("*") if f.is_file() and not (set(f.relative_to(source).parts) & SKIP_DIRS)]
        else:
            continue
        for f in files:
            rel = f.relative_to(source).as_posix()
            if rel not in PROJECT_SPECIFIC:
                out[rel] = sha(f)
    return out


def check_target(source: Path, target: Path, src_files: dict = None) -> dict:
    """Compares the target's real files with the source. Returns {"missing": [...], "modified": [...], "version": (target, source)}."""
    src_files = src_files if src_files is not None else generic_files(source)
    missing, modified = [], []
    for rel, h in src_files.items():
        t = target / rel
        if not t.is_file():
            missing.append(rel)
        elif sha(t) != h:
            modified.append(rel)
    tv = None
    mf = target / MANIFEST
    if mf.is_file():
        try:
            tv = json.loads(mf.read_text(encoding="utf-8")).get("framework_version")
        except (json.JSONDecodeError, OSError):
            tv = "manifiesto ilegible"
    sv = (source / "VERSION").read_text(encoding="utf-8").strip() if (source / "VERSION").is_file() else None
    return {"missing": sorted(missing), "modified": sorted(modified), "version": (tv, sv),
            "drift": bool(missing or modified or tv != sv)}


def distribute_to(source: Path, target: Path, src_files: dict = None, dry_run: bool = False, git_add: bool = True) -> dict:
    src_files = src_files if src_files is not None else generic_files(source)
    copied, kept = [], []
    for rel in src_files:
        dst = target / rel
        if not dry_run:
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source / rel, dst)
        copied.append(rel)
    for rel in sorted(PROJECT_SPECIFIC):                 # copied only when the project has none yet
        s, d = source / rel, target / rel
        if s.is_file():
            if d.exists():
                kept.append(rel)
            elif not dry_run:
                d.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(s, d)
                copied.append(rel)
            else:
                copied.append(rel)
    if not dry_run:
        version = (source / "VERSION").read_text(encoding="utf-8").strip() if (source / "VERSION").is_file() else None
        (target / MANIFEST).write_text(json.dumps({"framework_version": version, "files": src_files}, indent=2, sort_keys=True), encoding="utf-8")
        if git_add and (target / ".git").exists():
            r = subprocess.run(["git", "add", "."], cwd=target, capture_output=True, text=True)
            if r.returncode != 0:
                print(f"   ❌ git add falló en {target}: {r.stderr.strip()[:200]}", file=sys.stderr)
    return {"copied": len(copied), "kept_project_files": kept}


def find_targets(parent: Path, source: Path) -> list:
    out = []
    for d in sorted(parent.iterdir()):
        if d.is_dir() and (d / ".git").exists() and d.name not in EXCLUDED_REPO_NAMES and d.resolve() != source.resolve():
            out.append(d)
    return out


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--source", default=os.getenv("FRAMEWORK_SOURCE", str(SOURCE_DEFAULT)))
    ap.add_argument("--parent", default=os.getenv("FRAMEWORK_TARGET_PARENT"))
    ap.add_argument("--target", action="append", default=[])
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--no-git-add", action="store_true")
    a = ap.parse_args(argv)

    source = Path(a.source).resolve()
    targets = [Path(t).resolve() for t in a.target]
    if a.parent:
        targets += find_targets(Path(a.parent).resolve(), source)
    if not targets:
        print("Nada que hacer: indica --parent o --target (o FRAMEWORK_TARGET_PARENT).", file=sys.stderr)
        return 2
    src_files = generic_files(source)
    drift_found = False
    for t in targets:
        if a.check:
            r = check_target(source, t, src_files)
            drift_found |= r["drift"]
            state = "al día" if not r["drift"] else f"DESVIADO (versión {r['version'][0]} vs {r['version'][1]}; faltan {len(r['missing'])}, modificados {len(r['modified'])})"
            print(f"{t.name}: {state}")
            for rel in r["modified"][:10]:
                print(f"    modificado: {rel}")
            for rel in r["missing"][:10]:
                print(f"    falta:      {rel}")
        else:
            r = distribute_to(source, t, src_files, dry_run=a.dry_run, git_add=not a.no_git_add)
            print(f"{t.name}: {'(simulación) ' if a.dry_run else ''}{r['copied']} archivos; proyecto conservado: {', '.join(r['kept_project_files']) or '-'}")
    return 1 if (a.check and drift_found) else 0


if __name__ == "__main__":
    sys.exit(main())
