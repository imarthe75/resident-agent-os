"""La versión es la misma en VERSION, pyproject.toml y agent.version (servidor MCP y telemetría la leen de ahí)."""
import re
from pathlib import Path

from agent.version import __version__

ROOT = Path(__file__).resolve().parents[1]


def test_version_is_consistent():
    assert (ROOT / "VERSION").read_text(encoding="utf-8").strip() == __version__
    m = re.search(r'^version\s*=\s*"([^"]+)"', (ROOT / "pyproject.toml").read_text(encoding="utf-8"), re.M)
    assert m and m.group(1) == __version__
    changelog = (ROOT / "CHANGELOG.md").read_text(encoding="utf-8")
    assert f"## {__version__}" in changelog, "CHANGELOG sin entrada para la versión vigente"
