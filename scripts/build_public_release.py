#!/usr/bin/env python3
"""
Build a SANITIZED copy of a repository for publishing (new single-commit history). Never touches the working tree or any remote.

  python3 scripts/build_public_release.py --repo . --out /tmp/public --forbid "AcmeCorp,Jane Doe" --exclude CLAUDE.md data

1. `git archive` of --ref into a temp dir.  2. Removes --exclude paths and always-private files (.env, keys, *.pem).
3. Remaps private IPv4 addresses to RFC 5737 documentation ranges.
4. GATES (any failure aborts, nothing is produced): no private IP left, no private-key block, none of the --forbid names (case-insensitive;
   also read from the FORBIDDEN_NAMES environment variable or --forbid-file, one per line), and trufflehog (if installed) finds nothing verified.
5. Creates a fresh repo with ONE commit at --out. Pushing is a separate, explicit human step.
"""
import argparse
import ipaddress
import os
import re
import shutil
import subprocess
import sys
import tempfile

ALWAYS_EXCLUDE = [r".*\.(pem|key|ppk|p12|pfx)$", r".*(^|/)\.env(\..*)?$(?<!\.env\.example)", r".*(^|/)id_(rsa|ed25519)(\.pub)?$"]
TEXT_EXT = {".py", ".md", ".yml", ".yaml", ".json", ".js", ".jsx", ".ts", ".tsx", ".html", ".css", ".sh", ".ini", ".txt", ".toml", ".cfg", ".conf", ".sql", ".java", ".xml", ".example", ""}
_IP = re.compile(r"(?<![\d.])(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(?![\d.])")
_KEY = re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----\s*(?:\\n|\n)?\s*[A-Za-z0-9+/=]{40,}")


def _doc_ips():
    for net in ("192.0.2.0/24", "198.51.100.0/24", "203.0.113.0/24"):
        yield from (str(h) for h in ipaddress.ip_network(net).hosts())


def forbidden_names(cli, path=None):
    names = [n.strip() for n in (cli or "").split(",") if n.strip()]
    names += [n.strip() for n in os.getenv("FORBIDDEN_NAMES", "").split(",") if n.strip()]
    if path:
        names += [l.strip() for l in open(path, encoding="utf-8") if l.strip() and not l.startswith("#")]
    return sorted(set(names), key=str.lower)


def _text_files(tree):
    for root, _, files in os.walk(tree):
        for n in files:
            p = os.path.join(root, n)
            if os.path.splitext(n)[1].lower() in TEXT_EXT and "package-lock.json" not in n:
                yield p


def sanitize(tree, exclude):
    for root, dirs, files in os.walk(tree, topdown=True):
        rel_root = os.path.relpath(root, tree)
        for name in list(dirs) + list(files):
            rel = os.path.normpath(os.path.join(rel_root, name))
            if any(rel == e or rel.startswith(e.rstrip("/") + os.sep) for e in exclude) or any(re.match(g, rel.replace(os.sep, "/")) for g in ALWAYS_EXCLUDE):
                p = os.path.join(root, name)
                shutil.rmtree(p) if os.path.isdir(p) else os.remove(p)
                if name in dirs:
                    dirs.remove(name)
    ips, contents = {}, {}
    for p in _text_files(tree):
        try:
            contents[p] = open(p, encoding="utf-8").read()
        except UnicodeDecodeError:
            continue
    pool = _doc_ips()
    for txt in contents.values():
        for ip in _IP.findall(txt):
            if ip not in ips:
                ips[ip] = next(pool)
    for p, txt in contents.items():
        new = _IP.sub(lambda m: ips[m.group(1)], txt)
        if new != txt:
            open(p, "w", encoding="utf-8").write(new)
    return len(ips)


def gates(tree, names):
    problems = []
    for p in _text_files(tree):
        try:
            txt = open(p, encoding="utf-8").read()
        except (UnicodeDecodeError, OSError):
            continue
        rel = os.path.relpath(p, tree)
        if _IP.search(txt):
            problems.append(f"private IP left in {rel}")
        if _KEY.search(txt):
            problems.append(f"private key block in {rel}")
        for n in names:
            if re.search(re.escape(n), txt, re.IGNORECASE):
                problems.append(f"forbidden name '{n}' left in {rel}")
    if shutil.which("trufflehog"):
        r = subprocess.run(["trufflehog", "filesystem", tree, "--only-verified", "--no-update", "--json"], capture_output=True, text=True)
        if r.stdout.strip():
            problems.append("trufflehog found verified secrets")
    return problems


def build(repo, ref, out, exclude, names):
    tmp = tempfile.mkdtemp(prefix="public-release-")
    tree = os.path.join(tmp, "tree")
    os.makedirs(tree)
    archive = subprocess.run(["git", "-c", "safe.directory=*", "-C", repo, "archive", ref], capture_output=True, check=True).stdout
    subprocess.run(["tar", "-x", "-C", tree], input=archive, check=True)
    remapped = sanitize(tree, exclude)
    problems = gates(tree, names)
    if problems:
        print("GATES FAILED -- nothing published:")
        for p in problems[:50]:
            print("  -", p)
        shutil.rmtree(tmp, ignore_errors=True)
        return 1
    if os.path.exists(out):
        shutil.rmtree(out)
    shutil.copytree(tree, out)
    for cmd in (["init", "-q"], ["add", "-A"]):
        subprocess.run(["git", "-C", out, *cmd], check=True)
    subprocess.run(["git", "-C", out, "-c", "user.name=release", "-c", "user.email=release@example.invalid", "commit", "-q", "-m", "Public release (sanitized snapshot)"], check=True)
    shutil.rmtree(tmp, ignore_errors=True)
    print(f"private IPs remapped: {remapped}; gates passed; public repo ready at {out} (1 commit). NOT pushed.")
    return 0


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--repo", default=".")
    ap.add_argument("--ref", default="HEAD")
    ap.add_argument("--out", required=True)
    ap.add_argument("--exclude", nargs="*", default=[])
    ap.add_argument("--forbid", default="")
    ap.add_argument("--forbid-file")
    a = ap.parse_args(argv)
    return build(os.path.abspath(a.repo), a.ref, os.path.abspath(a.out), a.exclude, forbidden_names(a.forbid, a.forbid_file))


if __name__ == "__main__":
    sys.exit(main())
