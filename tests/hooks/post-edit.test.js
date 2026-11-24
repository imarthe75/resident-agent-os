// The syntax hook blocks (exit 2) only on a real syntax error: a missing interpreter or a valid file never blocks an edit.
const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const HOOK = path.join(__dirname, "..", "..", "scripts", "hooks", "post-edit.js");

function run(file, env = process.env) {
  return spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ tool_input: { file_path: file } }), env, encoding: "utf-8" });
}

function tmpFile(name, content) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "post-edit-"));
  const f = path.join(dir, name);
  fs.writeFileSync(f, content);
  return f;
}

const hasPython = ["python3", "python"].some((b) => spawnSync(b, ["--version"]).status === 0);

test("a JavaScript syntax error blocks the edit", () => {
  assert.strictEqual(run(tmpFile("bad.js", "function f( {")).status, 2);
});

test("valid JavaScript passes", () => {
  assert.strictEqual(run(tmpFile("ok.js", "const a = 1;\n")).status, 0);
});

test("without a Python interpreter a .py file is not blocked", () => {
  const r = run(tmpFile("ok.py", "def f(:\n"), { ...process.env, PATH: "/nonexistent" });
  assert.strictEqual(r.status, 0);
  assert.match(r.stderr, /no Python interpreter/);
});

test("a Python syntax error blocks and a valid file passes without writing bytecode", { skip: !hasPython && "no Python here" }, () => {
  assert.strictEqual(run(tmpFile("bad.py", "def f(:\n")).status, 2);
  const ok = tmpFile("ok.py", "def f():\n    return 1\n");
  assert.strictEqual(run(ok).status, 0);
  assert.ok(!fs.existsSync(path.join(path.dirname(ok), "__pycache__")));
});
