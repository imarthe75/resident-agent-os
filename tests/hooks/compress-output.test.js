// Tests for scripts/hooks/compress-output.js. Run: node --test tests/hooks/
"use strict";
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const HOOK = path.join(__dirname, "..", "..", "scripts", "hooks", "compress-output.js");
const spillDir = fs.mkdtempSync(path.join(os.tmpdir(), "ros-spill-test-"));
process.env.ROS_COMPRESS_SPILL_DIR = spillDir;
const hook = require(HOOK);

const bash = (stdout, stderr = "") => ({
  tool_name: "Bash",
  tool_input: { command: "x" },
  tool_response: { stdout, stderr, interrupted: false, isImage: false },
});
const longLog = (n, fn) => Array.from({ length: n }, (_, i) => fn(i)).join("\n");

test("short output is left alone", () => {
  assert.strictEqual(hook.processPayload(bash("ok\n3 passed")), null);
});

test("only Bash is touched; Read/Edit/Grep/MCP never", () => {
  const big = longLog(3000, (i) => `line ${i}`);
  for (const tool_name of ["Read", "Edit", "Write", "Grep", "mcp__x__y"]) {
    assert.strictEqual(hook.processPayload({ tool_name, tool_response: { stdout: big } }), null, tool_name);
  }
});

test("kill switch", () => {
  process.env.ROS_COMPRESS_OUTPUT = "0";
  try { assert.strictEqual(hook.processPayload(bash(longLog(3000, (i) => `line ${i}`))), null); }
  finally { delete process.env.ROS_COMPRESS_OUTPUT; }
});

test("long output keeps head, tail, errors and test summary; original is recoverable", () => {
  const log = longLog(3000, (i) => (i === 1500 ? "FAILED tests/test_a.py::test_x - AssertionError: 1 != 2"
    : i === 2999 ? "===== 1 failed, 812 passed in 9.1s =====" : `collecting module_${i} ... ok`));
  const out = hook.processPayload(bash(log));
  assert.ok(out, "expected a replacement");
  assert.deepStrictEqual(Object.keys(out).sort(), ["interrupted", "isImage", "stderr", "stdout"]);
  assert.ok(out.stdout.length < log.length / 5);
  assert.ok(out.stdout.startsWith("collecting module_0 ... ok"));
  assert.ok(out.stdout.includes("AssertionError: 1 != 2"));
  assert.ok(out.stdout.includes("1 failed, 812 passed"));
  const m = out.stdout.match(/salida completa en (\S+)\]/);
  assert.ok(m, "gap marker names the original");
  assert.strictEqual(fs.readFileSync(m[1], "utf8"), log);
  assert.strictEqual(fs.statSync(m[1]).mode & 0o777, 0o600);
});

test("stderr is shrunk separately and never merged into stdout", () => {
  const err = longLog(2000, (i) => `  at com.app.Service.method(Service.java:${i})`);
  const out = hook.processPayload(bash("done", err));
  assert.strictEqual(out.stdout, "done");
  assert.ok(out.stderr.length < err.length);
});

test("if the original cannot be saved, nothing is cut", () => {
  const blocker = path.join(spillDir, "not-a-dir");
  fs.writeFileSync(blocker, "x");
  process.env.ROS_COMPRESS_SPILL_DIR = blocker;
  try {
    const log = longLog(3000, (i) => `distinct line ${i}`);
    assert.strictEqual(hook.shrink(log), log);
  } finally { process.env.ROS_COMPRESS_SPILL_DIR = spillDir; }
});

test("lossless cleanup: ANSI codes and repeated lines", () => {
  const t = hook.clean("\x1b[31mred\x1b[0m\nsame\nsame\nsame\nsame\nsame\nend");
  assert.strictEqual(t, "red\nsame\n[línea anterior repetida 4 veces más]\nend");
});

test("end to end through stdin/stdout, with the documented output shape", () => {
  const payload = bash(longLog(3000, (i) => `Downloading artifact ${i}`));
  const raw = execFileSync("node", [HOOK], { input: JSON.stringify(payload), env: { ...process.env } }).toString();
  const res = JSON.parse(raw);
  assert.strictEqual(res.hookSpecificOutput.hookEventName, "PostToolUse");
  assert.strictEqual(typeof res.hookSpecificOutput.updatedToolOutput.stdout, "string");
  assert.strictEqual(execFileSync("node", [HOOK], { input: "not json" }).toString(), "");
});
