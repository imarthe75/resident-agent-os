"""Parse and persist machine-readable state JSON blocks in STATE.md."""

import fcntl
import json
import logging
import os
import re
import tempfile
from pathlib import Path
from typing import Any

from agent.exceptions import StateParseError

logger = logging.getLogger(__name__)


def read_state(path: Path | str) -> dict[str, Any]:
    """
    Extract the ```json block from the "## 🤖 Estado de Máquina" section in STATE.md.
    Returns {} if no block is found (not an error — file may not be initialized yet).
    """
    path = Path(path)
    if not path.exists():
        logger.warning(f"STATE.md not found at {path}, returning empty state")
        return {}

    try:
        content = path.read_text(encoding="utf-8")
    except OSError as e:
        logger.error(f"Failed to read STATE.md: {e}")
        raise StateParseError(f"Cannot read {path}: {e}") from e

    pattern = r"## 🤖 Estado de Máquina\s*```json\s*(.*?)\s*```"
    match = re.search(pattern, content, re.DOTALL)

    if match:
        try:
            return json.loads(match.group(1).strip())
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in STATE.md: {e}")
            raise StateParseError(f"Malformed JSON in STATE.md: {e}") from e

    pattern_any = r"```json\s*(.*?)\s*```"
    match = re.search(pattern_any, content, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in STATE.md: {e}")
            raise StateParseError(f"Malformed JSON in STATE.md: {e}") from e

    logger.debug("No JSON block found in STATE.md, returning empty state")
    return {}


def write_state(path: Path | str, data: dict[str, Any]) -> None:
    """
    Write state dict as ```json block inside STATE.md.
    Uses atomic file operations (tempfile + os.replace) and fcntl.flock.
    """
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)

    serialized = json.dumps(data, indent=2, ensure_ascii=False)
    new_block = f"```json\n{serialized}\n```"

    fd = None
    tmp_path = None
    try:
        fd, tmp_path = tempfile.mkstemp(dir=path.parent, suffix=".tmp", text=True)

        if path.exists():
            try:
                with open(path, "r", encoding="utf-8") as src:
                    fcntl.flock(src.fileno(), fcntl.LOCK_SH)
                    content = src.read()
                    fcntl.flock(src.fileno(), fcntl.LOCK_UN)
            except OSError as e:
                logger.warning(f"Failed to lock STATE.md for reading: {e}")
                content = ""
        else:
            content = ""

        pattern = r"(## 🤖 Estado de Máquina\s*)```json\s*.*?\s*```"
        replacement = rf"\1{new_block}"
        new_content = re.sub(pattern, replacement, content, count=1, flags=re.DOTALL)

        if new_content == content and content:
            section_header = "## 🤖 Estado de Máquina\n"
            new_content = content + "\n" + section_header + new_block
        elif new_content == content and not content:
            section_header = "## 🤖 Estado de Máquina\n"
            new_content = section_header + new_block

        os.write(fd, new_content.encode("utf-8"))
        os.close(fd)
        fd = None

        os.replace(tmp_path, path)
        logger.debug(f"State written atomically to {path}")

    except Exception as e:
        if fd is not None:
            try:
                os.close(fd)
            except OSError:
                pass
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except OSError:
                pass
        logger.error(f"Failed to write STATE.md: {e}")
        raise StateParseError(f"Cannot write state to {path}: {e}") from e
