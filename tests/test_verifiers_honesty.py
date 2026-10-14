import unittest

from verifiers import checks as c
from tests.test_verifiers import tree


def run(fn, files, test):
    t, root = tree(files)
    test.addCleanup(t.cleanup)
    return fn(root)


class TestNoStubs(unittest.TestCase):
    def test_stub_functions_and_todo_fail(self):
        r = run(c.no_stubs, {"app/a.py": "def f():\n    pass\n\ndef g():\n    raise NotImplementedError\n\ndef h():\n    # TODO: later\n    return 1\n"}, self)
        self.assertEqual(r.status, c.NO_CUMPLE)
        self.assertEqual(len(r.detail), 3)

    def test_real_logic_abstract_methods_and_tests_pass(self):
        r = run(c.no_stubs, {"app/a.py": "from abc import abstractmethod\n\ndef add(a, b):\n    return a + b\n\nclass B:\n    @abstractmethod\n    def m(self):\n        pass\n",
                             "tests/test_a.py": "def test_x():\n    pass  # TODO\n"}, self)
        self.assertEqual(r.status, c.CUMPLE)

    def test_empty_project_is_not_evaluated(self):
        self.assertEqual(run(c.no_stubs, {"README.md": "x"}, self).status, c.NO_EVALUADO)


class TestTestsIsolated(unittest.TestCase):
    def test_flushdb_without_guard_fails(self):
        r = run(c.tests_isolated, {"tests/test_cache.py": "import redis\ndef test_x():\n    redis.Redis().flushdb()\n"}, self)
        self.assertEqual(r.status, c.NO_CUMPLE)

    def test_destructive_with_test_only_variable_passes(self):
        r = run(c.tests_isolated, {"tests/test_cache.py": "import os\nHOST = os.environ['APP_TEST_DB_HOST']\ndef test_x(r):\n    r.flushdb()\n"}, self)
        self.assertEqual(r.status, c.CUMPLE)

    def test_no_tests_is_not_evaluated(self):
        self.assertEqual(run(c.tests_isolated, {"app/a.py": "x = 1"}, self).status, c.NO_EVALUADO)


class TestNoSilentExcept(unittest.TestCase):
    def test_swallowed_exception_fails(self):
        r = run(c.no_silent_except, {"a.py": "def f():\n    try:\n        x()\n    except Exception:\n        return True\n"}, self)
        self.assertEqual(r.status, c.NO_CUMPLE)

    def test_logged_reraised_and_narrow_pass(self):
        src = ("import logging\nlogger = logging.getLogger(__name__)\n"
               "def a():\n    try:\n        x()\n    except Exception:\n        logger.error('boom', exc_info=True)\n"
               "def b():\n    try:\n        x()\n    except Exception:\n        raise\n"
               "def c():\n    try:\n        x()\n    except KeyError:\n        pass\n")
        r = run(c.no_silent_except, {"a.py": src}, self)
        self.assertEqual((r.status, r.checked), (c.CUMPLE, 2))


class TestWebhooksFailClosed(unittest.TestCase):
    OK = ("from fastapi import FastAPI, HTTPException\nimport hmac, os\napp = FastAPI()\n\n@app.post('/api/x/webhook')\ndef h(token: str = ''):\n"
          "    secret = os.getenv('S')\n    if not secret:\n        raise HTTPException(status_code=503)\n    if not hmac.compare_digest(token, secret):\n        raise HTTPException(status_code=401)\n")
    BAD = "from fastapi import FastAPI\napp = FastAPI()\n\n@app.post('/api/x/webhook')\ndef h(payload: dict):\n    return {'status': 'ignored'}\n"

    def test_open_webhook_fails(self):
        self.assertEqual(run(c.webhooks_fail_closed, {"a.py": self.BAD}, self).status, c.NO_CUMPLE)

    def test_authenticated_fail_closed_webhook_passes(self):
        self.assertEqual(run(c.webhooks_fail_closed, {"a.py": self.OK}, self).status, c.CUMPLE)

    def test_no_webhooks_is_not_evaluated(self):
        self.assertEqual(run(c.webhooks_fail_closed, {"a.py": "x = 1"}, self).status, c.NO_EVALUADO)


if __name__ == "__main__":
    unittest.main()
