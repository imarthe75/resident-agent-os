#!/usr/bin/env python3
"""Deterministic SSOT synchronizer for multi-host AI agent directories.

Keeps generated host adapter directories (`.claude/agents`, `.claude/commands`,
`.claude/skills`) synchronized from canonical, provider-agnostic sources:

- `agents/*.md`               -> `.claude/agents/*.md` (injecting `model:` from `.agent/model-routing.json`)
- `commands/*.md`             -> `.claude/commands/*.md`
- `.agents/skills/<skill>/`   -> `.claude/skills/<skill>/` (or `--skills-source` / `skills/` fallback)

Non-destructive: never deletes unmanaged user files (such as `.claude/settings.local.json`)
unless explicitly requested, and works natively on Linux, macOS, and Windows (`--mode copy`).
"""

from __future__ import annotations

import argparse
import hashlib
import json
import logging
import os
import re
import shutil
import sys
from pathlib import Path
from typing import Any, Iterable, Optional

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from agent.model_routing import resolve_model  # noqa: E402

logger = logging.getLogger(__name__)

VALID_MODES = ("copy", "symlink")
VALID_SECTIONS = ("agents", "commands", "skills")
_FRONTMATTER_RE = re.compile(r"^---\r?\n(.*?)\r?\n---\r?\n?", re.DOTALL)
_IGNORED_NAMES = {"__pycache__", ".DS_Store", ".git"}


def _sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _parse_frontmatter(text: str) -> tuple[Optional[list[str]], str]:
    """Split markdown into (frontmatter_lines, body). Returns (None, text) if absent."""
    match = _FRONTMATTER_RE.match(text)
    if not match:
        return None, text
    fm_lines = match.group(1).splitlines()
    body = text[match.end():]
    return fm_lines, body


def _extract_fm_value(fm_lines: list[str], key: str) -> Optional[str]:
    prefix = f"{key}:"
    for line in fm_lines:
        stripped = line.strip()
        if stripped.startswith(prefix):
            val = stripped[len(prefix):].strip().strip('"').strip("'")
            return val or None
    return None


def render_claude_agent(raw_text: str, agent_stem: str, repo_root: Path) -> tuple[str, str]:
    """Project a canonical provider-neutral `agents/<name>.md` into Claude Code format.

    Injects/updates `model: <haiku|sonnet|opus>` from `.agent/model-routing.json` and strips
    the canonical-only `tier:` key so Claude Code frontmatter remains minimal and valid.
    Returns `(rendered_markdown, resolved_claude_model)`.
    """
    fm_lines, body = _parse_frontmatter(raw_text)
    agent_name = agent_stem
    explicit_tier: Optional[str] = None
    if fm_lines is not None:
        agent_name = _extract_fm_value(fm_lines, "name") or agent_stem
        explicit_tier = _extract_fm_value(fm_lines, "tier")

    # Prefer agent mapping from .agent/model-routing.json; only use frontmatter tier if agent is custom/unlisted
    try:
        routing = resolve_model(agent_name=agent_name, provider="claude", repo_root=repo_root)
        if routing["selection_source"] == "config_default" and explicit_tier:
            routing = resolve_model(agent_name=agent_name, tier=explicit_tier, provider="claude", repo_root=repo_root)
    except ValueError:
        routing = resolve_model(tier=explicit_tier or "balanced", provider="claude", repo_root=repo_root)

    claude_model = str(routing["model"])

    if fm_lines is None:
        rendered = f"---\nname: {agent_name}\nmodel: {claude_model}\n---\n\n{body}"
        return rendered, claude_model

    new_fm: list[str] = []
    model_written = False
    for line in fm_lines:
        stripped = line.strip()
        if stripped.startswith("tier:"):
            continue
        if stripped.startswith("model:"):
            new_fm.append(f"model: {claude_model}")
            model_written = True
        else:
            new_fm.append(line)
    if not model_written:
        new_fm.append(f"model: {claude_model}")

    rendered = "---\n" + "\n".join(new_fm) + "\n---\n" + body
    return rendered, claude_model


def _detect_skills_source(target: Path, explicit: Optional[Path] = None) -> Optional[Path]:
    if explicit is not None:
        p = explicit if explicit.is_absolute() else (target / explicit)
        return p.resolve() if p.is_dir() else None
    agents_skills = target / ".agents" / "skills"
    if agents_skills.is_dir():
        return agents_skills
    root_skills = target / "skills"
    if root_skills.is_dir():
        return root_skills
    return None


def _iter_skill_dirs(skills_src: Path) -> list[Path]:
    return sorted(
        d for d in skills_src.iterdir()
        if d.is_dir() and d.name not in _IGNORED_NAMES and (d / "SKILL.md").is_file()
    )


def _iter_files_under(directory: Path) -> list[Path]:
    files: list[Path] = []
    for root, dirs, filenames in os.walk(directory):
        dirs[:] = sorted(d for d in dirs if d not in _IGNORED_NAMES)
        for fn in sorted(filenames):
            if fn in _IGNORED_NAMES or fn.endswith(".pyc"):
                continue
            files.append(Path(root) / fn)
    return files


def _sync_text_file(dst: Path, expected_bytes: bytes, *, check: bool, rel_label: str, report: dict[str, Any]) -> None:
    if not dst.exists() and not dst.is_symlink():
        if check:
            report["missing"].append(rel_label)
            return
        dst.parent.mkdir(parents=True, exist_ok=True)
        dst.write_bytes(expected_bytes)
        report["created"].append(rel_label)
        return

    if dst.is_symlink():
        # Rendered agent files must be real files (not symlinks) because model: is injected
        if check:
            report["drifted"].append(rel_label)
            return
        dst.unlink()
        dst.write_bytes(expected_bytes)
        report["updated"].append(rel_label)
        return

    current_bytes = dst.read_bytes()
    if _sha256_bytes(current_bytes) == _sha256_bytes(expected_bytes):
        report["unchanged"].append(rel_label)
        return

    if check:
        report["drifted"].append(rel_label)
        return
    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_bytes(expected_bytes)
    report["updated"].append(rel_label)


def _sync_entry_copy_or_symlink(
    src: Path,
    dst: Path,
    *,
    mode: str,
    check: bool,
    rel_label: str,
    report: dict[str, Any],
) -> None:
    if mode == "symlink":
        desired_target = os.path.relpath(src, dst.parent)
        if dst.is_symlink():
            if os.readlink(dst) == desired_target:
                report["unchanged"].append(rel_label)
                return
            if check:
                report["drifted"].append(rel_label)
                return
            dst.unlink()
            os.symlink(desired_target, dst, target_is_directory=src.is_dir())
            report["updated"].append(rel_label)
            return

        if dst.exists():
            if check:
                report["drifted"].append(rel_label)
                return
            if dst.is_dir():
                shutil.rmtree(dst)
            else:
                dst.unlink()
            os.symlink(desired_target, dst, target_is_directory=src.is_dir())
            report["updated"].append(rel_label)
            return

        if check:
            report["missing"].append(rel_label)
            return
        dst.parent.mkdir(parents=True, exist_ok=True)
        try:
            os.symlink(desired_target, dst, target_is_directory=src.is_dir())
        except OSError as exc:
            logger.error("Symlink creation failed for %s -> %s: %s", dst, desired_target, exc, exc_info=True)
            raise RuntimeError(
                f"No se pudo crear el symlink {dst} -> {desired_target} ({exc}). "
                "En Windows sin privilegios de symlink usa `--mode copy` (valor por defecto)."
            ) from exc
        report["created"].append(rel_label)
        return

    # mode == "copy"
    if src.is_file():
        _sync_text_file(dst, src.read_bytes(), check=check, rel_label=rel_label, report=report)
        return

    # Directory copy (skill folder)
    if dst.is_symlink():
        if check:
            report["drifted"].append(rel_label)
            return
        dst.unlink()
    for src_file in _iter_files_under(src):
        rel = src_file.relative_to(src)
        file_dst = dst / rel
        file_label = f"{rel_label}/{rel.as_posix()}"
        _sync_text_file(file_dst, src_file.read_bytes(), check=check, rel_label=file_label, report=report)


def sync_hosts(
    target: Path,
    *,
    mode: str = "copy",
    only: Optional[Iterable[str]] = None,
    skills_source: Optional[Path] = None,
    check: bool = False,
) -> dict[str, Any]:
    """Synchronize canonical sources to `.claude/` host projections or verify drift (`check=True`)."""
    if mode not in VALID_MODES:
        raise ValueError(f"Unsupported mode '{mode}' (valid: {', '.join(VALID_MODES)})")

    sections = list(VALID_SECTIONS) if not only else [s.strip().lower() for s in only if s.strip()]
    invalid = [s for s in sections if s not in VALID_SECTIONS]
    if invalid:
        raise ValueError(f"Unsupported section(s): {', '.join(invalid)} (valid: {', '.join(VALID_SECTIONS)})")

    target = Path(target).resolve()
    report: dict[str, Any] = {
        "target": str(target),
        "mode": mode,
        "check": check,
        "sections": sections,
        "sources": {},
        "agent_models": {},
        "created": [],
        "updated": [],
        "unchanged": [],
        "missing": [],
        "drifted": [],
        "in_sync": True,
    }

    # 1. Canonical agents/*.md -> .claude/agents/*.md (always rendered with resolved model:)
    if "agents" in sections:
        agents_src = target / "agents"
        if agents_src.is_dir():
            md_files = sorted(f for f in agents_src.glob("*.md") if f.is_file())
            report["sources"]["agents"] = str(agents_src)
            for src_file in md_files:
                rendered, model = render_claude_agent(
                    src_file.read_text(encoding="utf-8"),
                    src_file.stem,
                    target,
                )
                report["agent_models"][src_file.stem] = model
                dst = target / ".claude" / "agents" / src_file.name
                _sync_text_file(
                    dst,
                    rendered.encode("utf-8"),
                    check=check,
                    rel_label=f".claude/agents/{src_file.name}",
                    report=report,
                )

    # 2. Canonical commands/*.md -> .claude/commands/*.md
    if "commands" in sections:
        cmds_src = target / "commands"
        if cmds_src.is_dir():
            cmd_files = sorted(f for f in cmds_src.glob("*.md") if f.is_file())
            report["sources"]["commands"] = str(cmds_src)
            for src_file in cmd_files:
                dst = target / ".claude" / "commands" / src_file.name
                _sync_entry_copy_or_symlink(
                    src_file,
                    dst,
                    mode=mode,
                    check=check,
                    rel_label=f".claude/commands/{src_file.name}",
                    report=report,
                )

    # 3. Canonical skills (.agents/skills/ or skills/) -> .claude/skills/
    if "skills" in sections:
        sk_src = _detect_skills_source(target, skills_source)
        if sk_src is not None:
            report["sources"]["skills"] = str(sk_src)
            for skill_dir in _iter_skill_dirs(sk_src):
                dst = target / ".claude" / "skills" / skill_dir.name
                _sync_entry_copy_or_symlink(
                    skill_dir,
                    dst,
                    mode=mode,
                    check=check,
                    rel_label=f".claude/skills/{skill_dir.name}",
                    report=report,
                )

    report["in_sync"] = not (report["missing"] or report["drifted"])
    return report


def main(argv: Optional[list[str]] = None) -> int:
    ap = argparse.ArgumentParser(
        description="Sincroniza las fuentes canónicas (agents/, commands/, .agents/skills/) hacia .claude/ inyectando modelos por proveedor."
    )
    ap.add_argument("--target", default=".", help="Directorio raíz del proyecto (por defecto: .)")
    ap.add_argument("--mode", choices=VALID_MODES, default="copy", help="Modo para commands y skills: copy (Windows/Docker) o symlink")
    ap.add_argument("--only", default=None, help="Subconjunto separado por comas: agents,commands,skills")
    ap.add_argument("--skills-source", default=None, help="Ruta explícita de skills fuente (por defecto .agents/skills o skills)")
    ap.add_argument("--check", action="store_true", help="Solo comprobar deriva sin escribir archivos (sale con 1 si hay desincronización)")
    ap.add_argument("--json", action="store_true", help="Emitir salida en JSON")
    args = ap.parse_args(argv)

    only = [x.strip() for x in args.only.split(",") if x.strip()] if args.only else None
    skills_src = Path(args.skills_source) if args.skills_source else None
    rep = sync_hosts(
        Path(args.target),
        mode=args.mode,
        only=only,
        skills_source=skills_src,
        check=args.check,
    )

    if args.json:
        print(json.dumps(rep, ensure_ascii=False, indent=2))
    else:
        verb = "check" if args.check else f"sync ({args.mode})"
        print(f"sync-hosts [{verb}] en {rep['target']}: in_sync={rep['in_sync']}")
        if rep["agent_models"]:
            pairs = ", ".join(f"{k}={v}" for k, v in sorted(rep["agent_models"].items()))
            print(f"  modelos .claude/agents: {pairs}")
        if args.check:
            print(f"  sin cambios: {len(rep['unchanged'])} | faltantes: {len(rep['missing'])} | con deriva: {len(rep['drifted'])}")
            for p in rep["missing"]:
                print(f"    [FALTA]  {p}")
            for p in rep["drifted"]:
                print(f"    [DERIVA] {p}")
        else:
            print(f"  creados: {len(rep['created'])} | actualizados: {len(rep['updated'])} | sin cambios: {len(rep['unchanged'])}")

    return 0 if rep["in_sync"] else 1


if __name__ == "__main__":
    sys.exit(main())
