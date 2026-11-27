"""Proxy MCP para servidores de terceros, revisión de archivos completos y sesiones de revisión reanudables."""
import json
import os
import subprocess
import sys
import textwrap
from pathlib import Path

import pytest

from agent import mcp_proxy, review_session
from agent.review_prepare import prepare_review

ROOT = Path(__file__).resolve().parents[1]


def test_exact_tools_are_never_bounded():
    for name in ("read_file", "read_text_file", "get_file_contents", "edit_file", "write_file", "str_replace_based_edit_tool"):
        assert mcp_proxy.is_exact_tool(name), name
    for name in ("search_issues", "list_pipelines", "query_logs"):
        assert not mcp_proxy.is_exact_tool(name), name


def test_proxy_bounds_only_tool_results(tmp_path, monkeypatch):
    monkeypatch.setenv("ROS_MCP_SPILL_DIR", str(tmp_path / "spill"))
    monkeypatch.setenv("ROS_MCP_MAX_CHARS", "2000")
    server = tmp_path / "server.py"
    server.write_text(textwrap.dedent('''
        import json, sys
        for line in sys.stdin:
            m = json.loads(line)
            if m.get("method") == "tools/call":
                name = m["params"]["name"]
                body = "x" * 10000 if name != "boom" else "y" * 10000
                res = {"content": [{"type": "text", "text": body}], "isError": name == "boom"}
                print(json.dumps({"jsonrpc": "2.0", "id": m["id"], "result": res}), flush=True)
            elif "id" in m:
                print(json.dumps({"jsonrpc": "2.0", "id": m["id"], "result": {"big": "z" * 10000}}), flush=True)
    '''))
    msgs = [{"jsonrpc": "2.0", "id": 1, "method": "tools/list"},
            {"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "search_logs"}},
            {"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"name": "read_file"}},
            {"jsonrpc": "2.0", "id": 4, "method": "tools/call", "params": {"name": "boom"}}]
    env = {**os.environ, "PYTHONPATH": str(ROOT)}
    out = subprocess.run([sys.executable, "-m", "agent", "mcp-proxy", "--", sys.executable, str(server)],
                         input="".join(json.dumps(m) + "\n" for m in msgs), capture_output=True, text=True, env=env, timeout=60)
    resp = {r["id"]: r for r in map(json.loads, out.stdout.splitlines())}
    assert len(resp[1]["result"]["big"]) == 10000                            # not a tools/call: byte-identical
    bounded = resp[2]["result"]["content"][0]["text"]
    assert len(bounded) < 3000 and "salida completa en" in bounded           # third-party tool output bounded
    spilled = next((tmp_path / "spill").iterdir())
    assert oct(spilled.stat().st_mode)[-3:] == "600" and len(spilled.read_text()) == 10000
    assert len(resp[3]["result"]["content"][0]["text"]) == 10000             # read_file untouched
    assert len(resp[4]["result"]["content"][0]["text"]) == 10000             # isError untouched


def test_proxy_forwards_malformed_lines():
    assert mcp_proxy.transform_response(b"no es json\n", mcp_proxy._Pending()) == b"no es json\n"


def _repo(tmp_path):
    subprocess.run(["git", "init", "-q", str(tmp_path)], check=True)
    (tmp_path / "src").mkdir()
    (tmp_path / "src" / "a.py").write_text("def a():\n    return 1\n")
    (tmp_path / "src" / "b.py").write_text("def b():\n    return 2\n")
    (tmp_path / "tests").mkdir()
    (tmp_path / "tests" / "test_a.py").write_text("def test_a():\n    assert True\n")
    (tmp_path / ".env").write_text("SECRET=1\n")
    (tmp_path / "logo.bin").write_bytes(b"\x00\x01\x02")
    (tmp_path / "big.txt").write_text("x" * (600 * 1024))
    return tmp_path


def test_full_file_scan_without_history(tmp_path):
    repo = _repo(tmp_path)                                                    # nothing committed: a diff review would see nothing useful
    rep = prepare_review(repo, scan=True)
    paths = {f["path"] for f in rep["reviewable"]}
    assert {"src/a.py", "src/b.py", "tests/test_a.py"} <= paths
    reasons = {e["path"]: e["reason"] for e in rep["excluded"]}
    assert reasons[".env"] == "secret_or_credential_path" and reasons["logo.bin"] == "binary_file"
    assert reasons["big.txt"] == "too_large_for_review"
    assert rep["meta"]["mode"] == "scan"
    only_src = prepare_review(repo, scan=True, scan_paths=["src"])
    assert {f["path"] for f in only_src["reviewable"]} == {"src/a.py", "src/b.py"}
    with pytest.raises(ValueError):
        prepare_review(repo, scan=True, scan_paths=["../fuera"])
    with pytest.raises(ValueError):
        prepare_review(repo, scan=True, from_ref="main")


def test_review_session_resumes_and_reopens_changed_bundles(tmp_path):
    repo = _repo(tmp_path)
    rep = prepare_review(repo, scan=True, scan_paths=["src", "tests"], max_bundle_size=1)
    s = review_session.create(repo, rep, "rev-1")
    ids = [b["bundle_id"] for b in s["bundles"]]
    assert len(ids) == 3
    review_session.mark(repo, "rev-1", ids[0], "done", findings=2)
    review_session.mark(repo, "rev-1", ids[1], "failed", note="cuota agotada")
    r = review_session.resume(repo, "rev-1")
    assert r["done"] == 1 and [b["bundle_id"] for b in r["pending"]] == ids[1:] and r["reopened"] == []
    done_file = s["bundles"][0]["files"][0]
    (repo / done_file).write_text("def a():\n    return 99\n")                # the reviewed code changed afterwards
    r = review_session.resume(repo, "rev-1")
    assert r["reopened"] == [ids[0]] and r["done"] == 0
    with pytest.raises(ValueError):
        review_session.create(repo, rep, "rev-1")
    with pytest.raises(ValueError):
        review_session.mark(repo, "rev-1", ids[0], "aprobado")
    with pytest.raises(ValueError):
        review_session.load(repo, "../x")
    assert review_session.list_sessions(repo)[0]["session_id"] == "rev-1"
