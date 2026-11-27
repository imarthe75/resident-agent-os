"use strict";

const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const { decideRewrite } = require("../../scripts/hooks/run-filtered");

const HOOK = path.resolve(__dirname, "../../scripts/hooks/run-filtered.js");
const project = fs.mkdtempSync(path.join(os.tmpdir(), "ros-rf-"));
const env = { CLAUDE_PROJECT_DIR: project, CLAUDE_CONFIG_DIR: project };
const bash = (command, extra = {}) => ({ tool_name: "Bash", tool_input: { command }, cwd: project, ...extra });

test("only rewrites when opted in or in bypassPermissions", () => {
  assert.equal(decideRewrite(bash("npm test"), env, "linux").rewrite, null);
  assert.match(decideRewrite(bash("npm test", { permission_mode: "bypassPermissions" }), env, "linux").rewrite, /run-filtered\.js' -- bash -c 'npm test'/);
  assert.ok(decideRewrite(bash("pytest -q"), { ...env, ROS_FILTER_FAILED: "1" }, "linux").rewrite);
  assert.equal(decideRewrite(bash("pytest -q", { permission_mode: "bypassPermissions" }), { ...env, ROS_FILTER_FAILED: "0" }, "linux").rewrite, null);
  assert.equal(decideRewrite(bash("pytest -q"), { ...env, ROS_FILTER_FAILED: "1" }, "win32").rewrite, null);
});

test("leaves complex commands, other programs and permission-ruled programs alone", () => {
  const on = { ...env, ROS_FILTER_FAILED: "1" };
  for (const c of ["pytest | grep FAIL", "npm test > out.txt", "npm test; rm -rf x", "pytest $(cat args)", "ls -la", "git status"]) {
    assert.equal(decideRewrite(bash(c), on, "linux").rewrite, null, c);
  }
  fs.mkdirSync(path.join(project, ".claude"), { recursive: true });
  fs.writeFileSync(path.join(project, ".claude", "settings.json"), JSON.stringify({ permissions: { ask: ["Bash(mvn deploy:*)"] } }));
  const r = decideRewrite(bash("mvn test"), on, "linux");
  assert.equal(r.rewrite, null);
  assert.match(r.reason, /permission_rule/);
  fs.rmSync(path.join(project, ".claude"), { recursive: true });
});

test("runner keeps the exit code and the failure while dropping passing noise", () => {
  const script = [
    "for i in $(seq 1 40); do echo \"tests/test_m.py::test_ok_$i PASSED\"; done",
    "echo 'tests/test_m.py::test_bad FAILED'", "echo 'AssertionError: 1 != 2'", "echo '1 failed, 40 passed in 0.1s'", "exit 3",
  ].join("; ");
  const r = spawnSync("node", [HOOK, "--", "bash", "-c", `pytest -v >/dev/null 2>&1 || true; ${script}`], { encoding: "utf8" });
  assert.equal(r.status, 3);
  assert.match(r.stdout, /test_bad FAILED/);
  assert.match(r.stdout, /AssertionError/);
  assert.match(r.stdout, /1 failed, 40 passed/);
  assert.doesNotMatch(r.stdout, /test_ok_20 PASSED/);
});
