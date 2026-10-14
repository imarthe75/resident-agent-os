import subprocess
import tempfile
import unittest
from pathlib import Path

from scripts.patch_validator import validate_patch


def repo_with(text):
    d = tempfile.mkdtemp()
    subprocess.run(["git", "-C", d, "init", "-q"], check=True)
    Path(d, "a.py").write_text(text, encoding="utf-8")
    subprocess.run(["git", "-C", d, "add", "."], check=True)
    return d


GOOD = "--- a/a.py\n+++ b/a.py\n@@ -1,2 +1,2 @@\n x = 1\n-y = eval(z)\n+y = int(z)\n"
INVENTED = "--- a/a.py\n+++ b/a.py\n@@ -1,2 +1,2 @@\n Nombre_Usuario = \"admin\"\n-password123_secret = 1\n+password = os.environ['P']\n"


class TestPatchValidator(unittest.TestCase):
    def test_real_patch_applies(self):
        ok, _ = validate_patch(repo_with("x = 1\ny = eval(z)\n"), GOOD)
        self.assertTrue(ok)

    def test_patch_with_invented_context_is_rejected(self):
        ok, why = validate_patch(repo_with("x = 1\ny = eval(z)\n"), INVENTED)
        self.assertFalse(ok)
        self.assertTrue(why)

    def test_empty_and_non_diff_are_rejected(self):
        d = repo_with("x = 1\n")
        self.assertFalse(validate_patch(d, "")[0])
        self.assertFalse(validate_patch(d, "just text")[0])


if __name__ == "__main__":
    unittest.main()
