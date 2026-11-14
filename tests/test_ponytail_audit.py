"""scripts/ponytail_audit.py: measured audit. Parsers are checked against output captured from real runs (vulture 2.16,
deptry 0.25.1, knip 6.45.1, jscpd 5.4.3 on 2026-11-13); the end-to-end test runs the real tools when they are installed."""
import importlib.util
import json
import os
import shutil
import stat
import subprocess
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("ponytail_audit", ROOT / "scripts" / "ponytail_audit.py")
pa = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pa)

KNIP6 = {"issues": [
    {"file": "src/orphan.js", "files": [{"name": "src/orphan.js"}], "dependencies": [], "exports": []},
    {"file": "package.json", "files": [], "dependencies": [{"name": "left-pad"}], "exports": []},
    {"file": "src/util.js", "files": [], "dependencies": [], "exports": [{"name": "unusedExport", "line": 2, "col": 17}]},
]}


def fake_tool(tmp_path, name, script):
    exe = tmp_path / "bin" / name
    exe.parent.mkdir(exist_ok=True)
    exe.write_text("#!/bin/sh\n" + script)
    exe.chmod(exe.stat().st_mode | stat.S_IEXEC)
    return str(exe)


def test_vulture_line_format():
    m = pa.VULTURE_LINE.match("./app/main.py:8: unused function 'never_called_helper' (60% confidence)")
    assert m["file"] == "./app/main.py" and m["line"] == "8" and m["conf"] == "60"


def test_knip6_json_is_parsed(tmp_path):
    exe = fake_tool(tmp_path, "knip", f"cat <<'J'\n{json.dumps(KNIP6)}\nJ\nexit 1\n")
    msgs = {(f["file"], f["message"]) for f in pa.audit_knip(str(tmp_path), exe, 30)}
    assert ("src/orphan.js", "archivo sin usar: src/orphan.js") in msgs
    assert ("package.json", "dependencia sin usar: left-pad") in msgs
    assert ("src/util.js", "exportación sin usar: unusedExport") in msgs


def test_a_crashed_tool_is_never_reported_as_clean(tmp_path):
    """Seen live: knip 5 crashes on Node 26 with empty stdout; it must appear as 'falló', not as 0 findings."""
    (tmp_path / "package.json").write_text("{}")
    fake_tool(tmp_path, "knip", "echo 'TypeError: boom' >&2\nexit 2\n")
    os.makedirs(tmp_path / "node_modules" / ".bin")
    shutil.copy(tmp_path / "bin" / "knip", tmp_path / "node_modules" / ".bin" / "knip")
    r = pa.audit(str(tmp_path), 30)
    assert "knip" not in r["measured"] and r["not_measured"]["knip"].startswith("falló")


def test_missing_tools_are_reported_not_downloaded(tmp_path, monkeypatch):
    (tmp_path / "a.py").write_text("x = 1\n")
    monkeypatch.setenv("PATH", str(tmp_path / "empty"))
    r = pa.audit(str(tmp_path), 30)
    assert r["measured"] == [] and r["not_measured"]["vulture"] == "no instalado"
    assert "No medido" in pa.render(r)


@pytest.mark.skipif(not (shutil.which("vulture") and shutil.which("deptry")), reason="vulture/deptry not installed here")
def test_real_python_tools(tmp_path):
    (tmp_path / "pyproject.toml").write_text('[project]\nname="fx"\nversion="0.1.0"\ndependencies=["numpy"]\n')
    (tmp_path / "app.py").write_text("def never_called():\n    return 1\n")
    r = pa.audit(str(tmp_path), 120)
    text = pa.render(r)
    assert "never_called" in text and "numpy" in text
