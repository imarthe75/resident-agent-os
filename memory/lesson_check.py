"""Check a recalled lesson against the CURRENT project before acting on it.

A lesson that says "the bug is in `core/retry.py`, function `plan_tasks`" was true when written. Files get renamed and functions deleted; acting
on a stale lesson is how an agent "fixes" code that no longer exists. dangling_references() extracts what the lesson names in backticks and
reports which of those no longer exist in the project, so the caller can drop or flag the lesson instead of trusting it.
Limits: only backticked tokens are checked; an identifier counts as present if the word appears in any text file (not a symbol-table lookup).
"""
import os
import re
from pathlib import Path
from typing import List

_TICKS = re.compile(r"`([^`\n]{2,120})`")
_PATH = re.compile(r"^[\w.\-/]+\.[A-Za-z0-9]{1,6}$")
_IDENT = re.compile(r"^[A-Za-z_][\w]*(?:\(\))?$")
SKIP = {".git", "node_modules", "__pycache__", "target", "dist", "build", ".venv", "venv", "data"}
MAX_FILE = 1_500_000


def references(text: str) -> dict:
    paths, idents = [], []
    for tok in _TICKS.findall(text or ""):
        tok = tok.strip().split(":")[0].strip() if _PATH.match(tok.strip().split(":")[0].strip()) else tok.strip()
        if _PATH.match(tok) and "/" in tok or (_PATH.match(tok) and tok.count(".") >= 1 and not tok.endswith("()")):
            paths.append(tok)
        elif _IDENT.match(tok) and len(tok.rstrip("()")) >= 4:
            idents.append(tok.rstrip("()"))
    return {"paths": sorted(set(paths)), "identifiers": sorted(set(idents))}


def dangling_references(text: str, project_root: Path | str) -> List[str]:
    root = Path(project_root)
    refs = references(text)
    missing = [f"archivo: {p}" for p in refs["paths"] if not (root / p).exists()]
    pending = set(refs["identifiers"])
    if pending:
        for dirpath, dirnames, filenames in os.walk(root):
            dirnames[:] = [d for d in dirnames if d not in SKIP]
            for fn in filenames:
                fp = Path(dirpath) / fn
                try:
                    if fp.stat().st_size > MAX_FILE:
                        continue
                    content = fp.read_text(encoding="utf-8", errors="ignore")
                except OSError:
                    continue
                pending = {i for i in pending if not re.search(r"\b" + re.escape(i) + r"\b", content)}
                if not pending:
                    break
            if not pending:
                break
    return missing + [f"identificador: {i}" for i in sorted(pending)]
