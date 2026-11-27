"""Deterministic code-review preparation, smart file bundling, path-rule matching, and line relocation.

Inspired by Alibaba Open Code Review's deterministic-engineering × agent hybrid architecture (written from scratch):
- Selects exact reviewable files from workspace changes, branch ranges (`--from`/`--to`), or commits (`--commit`),
  always reporting excluded files with their explicit reason (binary, lockfile, generated, secret-like path).
- Groups related files into coherent review bundles (directory/module + paired tests) so large MRs never lose coverage.
- Matches `.agent/path-rules.json` (glob patterns -> surgical rules) and `rules/<lang>/rules.md` grouped without repetition.
- Relocates/verifies finding line numbers against real file contents to eliminate LLM position drift.
Works identically with any AI host (Claude Code, Gemini CLI, Antigravity, Codex, Cursor, Windsurf, Copilot, OpenCode).
"""

from __future__ import annotations

import fnmatch
import json
import logging
import os
import re
import subprocess
from pathlib import Path
from typing import Any, Optional

logger = logging.getLogger(__name__)

SECRET_PATH_PATTERNS = (
    ".env",
    ".env.*",
    "*.pem",
    "*.key",
    "*.p12",
    "*.pfx",
    "*.jks",
    "id_rsa*",
    "id_ed25519*",
    "*credentials*.json",
    "*secrets*.json",
    "*secret*.yaml",
    "*secret*.yml",
)

EXCLUDED_PATH_PATTERNS = (
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    "poetry.lock",
    "Cargo.lock",
    "go.sum",
    "*.min.js",
    "*.min.css",
    "*.map",
    "*.png",
    "*.jpg",
    "*.jpeg",
    "*.gif",
    "*.ico",
    "*.svg",
    "*.webp",
    "*.pdf",
    "*.zip",
    "*.tar",
    "*.gz",
    "*.woff",
    "*.woff2",
    "*.ttf",
    "*.pyc",
    "*.class",
    "*.jar",
)

EXCLUDED_DIRS = {"node_modules", ".git", "dist", "build", ".next", "__pycache__", ".venv", "venv", "target", "vendor"}

EXT_TO_LANG = {
    ".py": "python",
    ".java": "java",
    ".kt": "java",
    ".ts": "typescript",
    ".tsx": "typescript",
    ".js": "typescript",
    ".jsx": "typescript",
    ".mjs": "typescript",
    ".cjs": "typescript",
    ".html": "angular",
    ".scss": "angular",
    ".sql": "postgres",
}


def _git(repo: Path, args: list[str]) -> str:
    cp = subprocess.run(
        ["git", "--no-pager", "-C", str(repo), *args],
        capture_output=True,
        text=True,
        check=False,
    )
    if cp.returncode != 0:
        raise RuntimeError(f"git {' '.join(args)} failed ({cp.returncode}): {cp.stderr.strip()[:300]}")
    return cp.stdout


def _match_glob(rel_path: str, pattern: str) -> bool:
    norm = rel_path.replace("\\", "/").lstrip("./")
    pat = pattern.replace("\\", "/").lstrip("./")
    if fnmatch.fnmatch(norm, pat):
        return True
    if "/" not in pat and fnmatch.fnmatch(Path(norm).name, pat):
        return True
    if pat.startswith("**/") and fnmatch.fnmatch(norm, pat[3:]):
        return True
    return False


def classify_exclusion(rel_path: str) -> Optional[str]:
    """Return an explicit exclusion reason if `rel_path` must not enter an AI review, else None."""
    parts = set(Path(rel_path).parts)
    if parts & EXCLUDED_DIRS:
        return "excluded_directory"
    for pat in SECRET_PATH_PATTERNS:
        if _match_glob(rel_path, pat):
            return "secret_or_credential_path"
    for pat in EXCLUDED_PATH_PATTERNS:
        if _match_glob(rel_path, pat):
            return "lockfile_binary_or_generated"
    return None


def load_path_rules(repo: Path) -> list[dict[str, Any]]:
    """Load `.agent/path-rules.json` surgical rules (list of {id, path/paths, rule, severity?})."""
    p = repo / ".agent" / "path-rules.json"
    if not p.is_file():
        return []
    try:
        raw = json.loads(p.read_text(encoding="utf-8"))
        rules = raw.get("rules", []) if isinstance(raw, dict) else []
        out = []
        for idx, r in enumerate(rules, start=1):
            if not isinstance(r, dict) or not r.get("rule"):
                continue
            pats = r.get("paths") if isinstance(r.get("paths"), list) else ([r["path"]] if r.get("path") else [])
            if not pats:
                continue
            out.append({
                "id": str(r.get("id") or f"PATH-{idx:02d}"),
                "paths": [str(x) for x in pats],
                "rule": str(r["rule"]),
                "severity": str(r.get("severity") or "P2"),
            })
        return out
    except (OSError, json.JSONDecodeError) as e:
        logger.error("Failed to parse %s: %s", p, e, exc_info=True)
        return []


def collect_changed_files(
    repo: Path,
    *,
    from_ref: Optional[str] = None,
    to_ref: Optional[str] = None,
    commit: Optional[str] = None,
) -> dict[str, Any]:
    """Collect changed files deterministically via git (workspace, branch range, or single commit)."""
    repo = Path(repo).resolve()
    if commit and from_ref:
        raise ValueError("--commit and --from are mutually exclusive")

    entries: list[dict[str, Any]] = []
    meta: dict[str, Any] = {"mode": "workspace", "from": from_ref, "to": to_ref, "commit": commit, "merge_base": None}

    if commit:
        meta["mode"] = "commit"
        out = _git(repo, ["show", "--numstat", "--format=", "--no-ext-diff", "--no-textconv", commit])
        for line in out.splitlines():
            parts = line.split("\t")
            if len(parts) >= 3:
                entries.append({"path": parts[2], "status": "M", "added": parts[0], "deleted": parts[1]})
    elif from_ref:
        meta["mode"] = "range"
        target = to_ref or "HEAD"
        meta["to"] = target
        mb = _git(repo, ["merge-base", from_ref, target]).strip()
        meta["merge_base"] = mb
        out = _git(repo, ["diff", "--numstat", "--no-ext-diff", "--no-textconv", f"{mb}..{target}"])
        for line in out.splitlines():
            parts = line.split("\t")
            if len(parts) >= 3:
                entries.append({"path": parts[2], "status": "M", "added": parts[0], "deleted": parts[1]})
    else:
        status_out = _git(repo, ["status", "--porcelain=v1", "-uall"])
        numstat_map: dict[str, tuple[str, str]] = {}
        try:
            ns = _git(repo, ["diff", "--numstat", "--no-ext-diff", "--no-textconv", "HEAD"])
            for line in ns.splitlines():
                parts = line.split("\t")
                if len(parts) >= 3:
                    numstat_map[parts[2]] = (parts[0], parts[1])
        except RuntimeError as e:
            logger.debug("git diff HEAD unavailable (likely unborn branch): %s", e)
        for line in status_out.splitlines():
            if len(line) < 4:
                continue
            code = line[:2].strip() or "M"
            fpath = line[3:].strip()
            if " -> " in fpath:
                fpath = fpath.split(" -> ", 1)[1].strip()
            added, deleted = numstat_map.get(fpath, ("?", "?"))
            entries.append({"path": fpath, "status": code, "added": added, "deleted": deleted})

    reviewable: list[dict[str, Any]] = []
    excluded: list[dict[str, str]] = []
    seen: set[str] = set()
    for item in entries:
        p = item["path"].strip().strip('"')
        if not p or p in seen:
            continue
        seen.add(p)
        reason = classify_exclusion(p)
        if reason:
            excluded.append({"path": p, "reason": reason})
            continue
        full = repo / p
        if full.is_symlink():
            excluded.append({"path": p, "reason": "symlink"})
            continue
        if item["added"] == "-" and item["deleted"] == "-":
            excluded.append({"path": p, "reason": "binary_file"})
            continue
        reviewable.append({
            "path": p,
            "status": item["status"],
            "added": int(item["added"]) if str(item["added"]).isdigit() else None,
            "deleted": int(item["deleted"]) if str(item["deleted"]).isdigit() else None,
            "language": EXT_TO_LANG.get(Path(p).suffix.lower(), "other"),
        })

    return {"meta": meta, "reviewable": reviewable, "excluded": excluded}


def bundle_files(reviewable: list[dict[str, Any]], max_bundle_size: int = 8) -> list[dict[str, Any]]:
    """Group related files into coherent review bundles (module/directory + paired tests) capped at `max_bundle_size`."""
    groups: dict[str, list[dict[str, Any]]] = {}
    for f in reviewable:
        p = Path(f["path"])
        parts = p.parts
        # Strip leading test/src folders to pair tests with the same module stem when possible.
        if len(parts) >= 2 and parts[0] in ("tests", "test", "src", "app"):
            key = "/".join(parts[:2])
        elif len(parts) >= 2:
            key = parts[0]
        else:
            key = "root"
        groups.setdefault(key, []).append(f)

    bundles: list[dict[str, Any]] = []
    idx = 1
    for key in sorted(groups):
        items = sorted(groups[key], key=lambda x: x["path"])
        for offset in range(0, len(items), max(1, max_bundle_size)):
            chunk = items[offset : offset + max(1, max_bundle_size)]
            bundles.append({
                "bundle_id": f"B{idx:02d}",
                "scope": key,
                "files": [c["path"] for c in chunk],
                "languages": sorted({c["language"] for c in chunk if c["language"] != "other"}),
            })
            idx += 1
    return bundles


def match_rules(repo: Path, reviewable: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Group matching `.agent/path-rules.json` and `rules/<lang>/rules.md` by rule without repeating text."""
    grouped: list[dict[str, Any]] = []
    path_rules = load_path_rules(repo)
    paths = [f["path"] for f in reviewable]

    for pr in path_rules:
        matched = [p for p in paths if any(_match_glob(p, pat) for pat in pr["paths"])]
        if matched:
            grouped.append({
                "id": pr["id"],
                "source": ".agent/path-rules.json",
                "severity": pr["severity"],
                "files": matched,
                "rule": pr["rule"],
            })

    lang_files: dict[str, list[str]] = {}
    for f in reviewable:
        lang = f["language"]
        if lang != "other":
            lang_files.setdefault(lang, []).append(f["path"])

    for lang, files in sorted(lang_files.items()):
        rule_doc = repo / "rules" / lang / "rules.md"
        if rule_doc.is_file():
            grouped.append({
                "id": f"STACK-{lang.upper()}",
                "source": f"rules/{lang}/rules.md",
                "severity": "P2",
                "files": sorted(files),
                "rule": f"Aplicar reglas del stack en rules/{lang}/rules.md",
            })

    return grouped


def prepare_review(
    repo: Path,
    *,
    from_ref: Optional[str] = None,
    to_ref: Optional[str] = None,
    commit: Optional[str] = None,
    max_bundle_size: int = 8,
) -> dict[str, Any]:
    """Full deterministic review preparation payload (delegation mode for any AI host)."""
    repo = Path(repo).resolve()
    collected = collect_changed_files(repo, from_ref=from_ref, to_ref=to_ref, commit=commit)
    bundles = bundle_files(collected["reviewable"], max_bundle_size=max_bundle_size)
    rule_groups = match_rules(repo, collected["reviewable"])
    return {
        "repo": str(repo),
        "meta": collected["meta"],
        "counts": {
            "reviewable": len(collected["reviewable"]),
            "excluded": len(collected["excluded"]),
            "bundles": len(bundles),
            "rule_groups": len(rule_groups),
        },
        "bundles": bundles,
        "reviewable": collected["reviewable"],
        "excluded": collected["excluded"],
        "rule_groups": rule_groups,
    }


def relocate_finding(
    file_path: Path | str,
    reported_line: int,
    snippet: str,
    window: int = 40,
) -> dict[str, Any]:
    """Deterministically verify and relocate a finding's line number against the real file.

    Eliminates LLM position drift:
    - Exact match at `reported_line`: status="exact"
    - Found near `reported_line` (within ±window) or elsewhere in file: status="relocated" with exact line number
    - Not found in file: status="not_found" (caller should drop or flag as unverified)
    """
    p = Path(file_path)
    if not p.is_file():
        return {"status": "file_missing", "reported_line": reported_line, "verified_line": None, "path": str(p)}

    target = snippet.strip()
    if not target:
        return {"status": "invalid_snippet", "reported_line": reported_line, "verified_line": None, "path": str(p)}

    lines = p.read_text(encoding="utf-8", errors="replace").splitlines()
    first_line = target.splitlines()[0].strip()

    if 1 <= reported_line <= len(lines) and first_line in lines[reported_line - 1]:
        return {"status": "exact", "reported_line": reported_line, "verified_line": reported_line, "path": str(p)}

    # Search nearest match within ±window first, then whole file.
    candidates = [idx + 1 for idx, ln in enumerate(lines) if first_line in ln]
    if not candidates:
        norm_first = re.sub(r"\s+", " ", first_line)
        candidates = [idx + 1 for idx, ln in enumerate(lines) if norm_first in re.sub(r"\s+", " ", ln)]
    if not candidates:
        return {"status": "not_found", "reported_line": reported_line, "verified_line": None, "path": str(p)}

    nearest = min(candidates, key=lambda ln: abs(ln - reported_line))
    return {
        "status": "relocated",
        "reported_line": reported_line,
        "verified_line": nearest,
        "drift": nearest - reported_line,
        "within_window": abs(nearest - reported_line) <= window,
        "path": str(p),
    }
