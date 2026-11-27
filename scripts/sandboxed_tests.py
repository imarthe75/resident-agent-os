#!/usr/bin/env python3
"""Cross-platform isolated test runner (Windows, macOS, Linux) using Docker `--network none --read-only`.

Provides the same core isolation guarantees as `scripts/sandboxed-tests.sh` (`srt` + `bwrap` on Linux)
on **Windows native (Docker Desktop)**, macOS, and Linux without requiring Linux kernel namespaces
directly on the host:
  - `--network none`: zero outbound/inbound network access (cannot touch production DB/Valkey/APIs).
  - `--read-only` rootfs + `:ro` repository mount + ephemeral `/tmp`: cannot corrupt host files or
    read `~/.ssh`, `~/.aws`, or host `.env` outside the workspace.
  - Clean environment: never inherits host secrets; forwards ONLY `ROS_TEST_*` variables explicitly.
  - Fail-closed: if `docker` is missing or unavailable, exits with code 2 (never runs unsandboxed).

Usage:
  python3 scripts/sandboxed_tests.py [--image python:3.12-slim] [--node-image node:26-alpine] [--dry-run] [-- <pytest args>]
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Dict, List, Mapping, Optional

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_PY_IMAGE = os.getenv("ROS_SANDBOX_IMAGE", "python:3.12-slim")
DEFAULT_NODE_IMAGE = os.getenv("ROS_SANDBOX_NODE_IMAGE", "")


def build_docker_cmd(
    *,
    repo_root: Path,
    image: str,
    inner_cmd: List[str],
    env: Optional[Mapping[str, str]] = None,
    docker_bin: str = "docker",
) -> List[str]:
    """Construct a fail-closed `docker run` command with zero network, read-only fs, and scrubbed env."""
    source_env = dict(os.environ if env is None else env)
    mount_src = str(repo_root.resolve())
    cmd: List[str] = [
        docker_bin,
        "run",
        "--rm",
        "--network",
        "none",
        "--read-only",
        "--tmpfs",
        "/tmp:rw,exec,size=256m",
        "-v",
        f"{mount_src}:/work:ro",
        "-w",
        "/work",
        "-e",
        "PYTHONPATH=/work",
        "-e",
        "ROS_SANDBOXED=1",
        "-e",
        "ROS_SANDBOX_BACKEND=docker",
        "-e",
        "PYTHONDONTWRITEBYTECODE=1",
        "-e",
        "TMPDIR=/tmp",
    ]
    for key in sorted(source_env):
        if key.startswith("ROS_TEST_"):
            cmd += ["-e", f"{key}={source_env[key]}"]
    cmd.append(image)
    cmd.extend(inner_cmd)
    return cmd


def run_sandboxed(
    *,
    repo_root: Path = ROOT,
    py_image: str = DEFAULT_PY_IMAGE,
    node_image: str = DEFAULT_NODE_IMAGE,
    pytest_args: Optional[List[str]] = None,
    dry_run: bool = False,
    docker_bin: Optional[str] = None,
    env: Optional[Mapping[str, str]] = None,
) -> int:
    resolved_docker = docker_bin if docker_bin is not None else shutil.which("docker")
    if not resolved_docker:
        print(
            "sandboxed_tests: 'docker' no encontrado en PATH; las pruebas NO se ejecutaron aisladas.",
            file=sys.stderr,
        )
        return 2

    py_inner = ["python3", "-m", "pytest", "-q", "-p", "no:cacheprovider", "tests"] + list(pytest_args or [])
    py_cmd = build_docker_cmd(
        repo_root=repo_root,
        image=py_image,
        inner_cmd=py_inner,
        env=env,
        docker_bin=resolved_docker,
    )

    commands: Dict[str, List[str]] = {"pytest": py_cmd}
    if node_image:
        node_inner = ["node", "--test", "tests/hooks/", "tests/evals/"]
        commands["node"] = build_docker_cmd(
            repo_root=repo_root,
            image=node_image,
            inner_cmd=node_inner,
            env=env,
            docker_bin=resolved_docker,
        )

    if dry_run:
        print(json.dumps(commands, indent=2))
        return 0

    for label, cmd in commands.items():
        print(f"[sandboxed_tests] running {label} inside --network none --read-only container...")
        proc = subprocess.run(cmd)
        if proc.returncode != 0:
            return proc.returncode
    return 0


def main(argv: Optional[List[str]] = None) -> int:
    ap = argparse.ArgumentParser(description="Run Resident Agent OS tests in a cross-platform Docker sandbox.")
    ap.add_argument("--path", default=str(ROOT), help="Repository path to mount read-only.")
    ap.add_argument("--image", default=DEFAULT_PY_IMAGE, help="Python test Docker image.")
    ap.add_argument("--node-image", default=DEFAULT_NODE_IMAGE, help="Optional Node.js Docker image for hook/eval tests.")
    ap.add_argument("--dry-run", action="store_true", help="Print docker commands as JSON without executing.")
    ap.add_argument("pytest_args", nargs="*", help="Extra pytest arguments (pass after --).")
    args = ap.parse_args(argv)
    return run_sandboxed(
        repo_root=Path(args.path),
        py_image=args.image,
        node_image=args.node_image,
        pytest_args=args.pytest_args,
        dry_run=args.dry_run,
    )


if __name__ == "__main__":
    sys.exit(main())
