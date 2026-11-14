// Tests for scripts/codebase-map.js. Run: node --test tests/hooks/
"use strict";
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const MAP = path.join(__dirname, "..", "..", "scripts", "codebase-map.js");
const { render } = require(MAP);

function repo(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ros-map-"));
  for (const [rel, body] of Object.entries(files)) {
    fs.mkdirSync(path.join(root, path.dirname(rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), body);
  }
  return root;
}

test("lists top-level symbols per folder; skips tests, private names and vendored code", () => {
  const root = repo({
    "app/utils/dates.py": "def parse_date(s):\n    pass\ndef _private():\n    pass\nclass Clock:\n    def tick(self): pass\n",
    "web/src/app/rfc.service.ts": "export class RfcService {}\nexport const RFC_RE = /x/;\nconst hidden = 1;\n",
    "api/src/main/java/x/UserService.java": "package x;\npublic class UserService {}\n",
    "tests/test_dates.py": "def test_parse(): pass\n",
    "node_modules/lib/index.js": "export function vendored() {}\n",
  });
  const map = render(root, 2500);
  assert.match(map, /app\/utils: parse_date, Clock/);
  assert.match(map, /RfcService, RFC_RE/);
  assert.match(map, /UserService/);
  for (const absent of ["_private", "tick", "hidden", "test_parse", "vendored"]) assert.ok(!map.includes(absent), absent);
});

test("respects the character budget and says how much was left out", () => {
  const files = {};
  for (let i = 0; i < 60; i++) files[`pkg${i}/m.py`] = `def function_number_${i}():\n    pass\n`;
  const map = render(repo(files), 400);
  assert.ok(map.length < 520);
  assert.match(map, /carpetas no listadas/);
});

test("SessionStart hook returns additionalContext; disabled with ROS_CODEBASE_MAP=0", () => {
  const root = repo({ "lib/a.py": "def reusable():\n    pass\n" });
  const env = { ...process.env, CLAUDE_PROJECT_DIR: root };
  const out = JSON.parse(execFileSync("node", [MAP], { input: '{"hook_event_name":"SessionStart"}', env }).toString());
  assert.strictEqual(out.hookSpecificOutput.hookEventName, "SessionStart");
  assert.match(out.hookSpecificOutput.additionalContext, /reusable/);
  const off = execFileSync("node", [MAP], { input: "{}", env: { ...env, ROS_CODEBASE_MAP: "0" } }).toString();
  assert.strictEqual(off, "");
});
