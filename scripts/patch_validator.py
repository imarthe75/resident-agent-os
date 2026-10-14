#!/usr/bin/env python3
"""
A patch exists only if it applies to the REAL code. `validate_patch()` runs `git apply --check` against a repository; a diff whose context was
invented (made-up variable names, template hunks) fails here and must be reported as "requires manual remediation", never delivered.

  python3 scripts/patch_validator.py --repo /path/to/repo fix.patch      # exit 0 = applies, 1 = does not apply
"""
import argparse
import subprocess
import sys
from typing import Tuple


def validate_patch(repo_dir: str, patch_text: str) -> Tuple[bool, str]:
    if not patch_text or not patch_text.strip():
        return False, "empty patch"
    if "@@" not in patch_text or "--- " not in patch_text or "+++ " not in patch_text:
        return False, "not a unified diff"
    if not patch_text.endswith("\n"):
        patch_text += "\n"
    r = subprocess.run(["git", "-c", "safe.directory=*", "-C", repo_dir, "apply", "--check", "-"], input=patch_text, capture_output=True, text=True)
    if r.returncode == 0:
        return True, "applies cleanly"
    return False, (r.stderr or r.stdout).strip()[:500] or "git apply --check failed"


def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", default=".")
    ap.add_argument("patch", help="patch file ('-' for stdin)")
    a = ap.parse_args(argv)
    text = sys.stdin.read() if a.patch == "-" else open(a.patch, encoding="utf-8").read()
    ok, why = validate_patch(a.repo, text)
    print(("OK   " if ok else "FAIL ") + why)
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
