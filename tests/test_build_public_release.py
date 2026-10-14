import os
import subprocess
import tempfile
import unittest

from scripts import build_public_release as b


def repo(files):
    d = tempfile.mkdtemp()
    subprocess.run(["git", "-C", d, "init", "-q"], check=True)
    for n, t in files.items():
        os.makedirs(os.path.dirname(os.path.join(d, n)) or d, exist_ok=True)
        open(os.path.join(d, n), "w", encoding="utf-8").write(t)
    subprocess.run(["git", "-C", d, "add", "."], check=True)
    subprocess.run(["git", "-C", d, "-c", "user.name=t", "-c", "user.email=t@e.invalid", "commit", "-q", "-m", "x"], check=True)
    return d


class TestBuildPublicRelease(unittest.TestCase):
    def out(self):
        return os.path.join(tempfile.mkdtemp(), "pub")

    def test_clean_repo_is_published_with_private_ips_remapped(self):
        d, o = repo({"a.py": 'HOST = "10.1.2.3"\n', "README.md": "hello\n"}), self.out()
        self.assertEqual(b.main(["--repo", d, "--out", o]), 0)
        self.assertNotIn("10.1.2.3", open(os.path.join(o, "a.py")).read())

    def test_forbidden_name_blocks_the_release(self):
        d, o = repo({"README.md": "Built for AcmeCorp\n"}), self.out()
        self.assertEqual(b.main(["--repo", d, "--out", o, "--forbid", "acmecorp"]), 1)
        self.assertFalse(os.path.exists(o))

    def test_excluded_path_and_env_files_are_removed(self):
        d, o = repo({"keep.md": "ok\n", "notes/private.md": "x\n", ".env": "TOKEN=abc\n"}), self.out()
        self.assertEqual(b.main(["--repo", d, "--out", o, "--exclude", "notes"]), 0)
        self.assertFalse(os.path.exists(os.path.join(o, "notes")))
        self.assertFalse(os.path.exists(os.path.join(o, ".env")))
        self.assertTrue(os.path.exists(os.path.join(o, "keep.md")))

    def test_private_key_block_blocks_the_release(self):
        key = "-----BEGIN RSA PRIVATE KEY-----\n" + "A" * 60 + "\n-----END RSA PRIVATE KEY-----\n"
        d, o = repo({"k.txt": key}), self.out()
        self.assertEqual(b.main(["--repo", d, "--out", o]), 1)


if __name__ == "__main__":
    unittest.main()
