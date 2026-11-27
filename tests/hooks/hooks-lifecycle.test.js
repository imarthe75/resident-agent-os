"use strict";

const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { test } = require("node:test");

const ROOT = path.resolve(__dirname, "..", "..");

function runHook(relScript, { env = {}, stdin = "", args = [], cwd = ROOT } = {}) {
  return spawnSync(process.execPath, [path.join(ROOT, relScript), ...args], {
    cwd,
    input: stdin,
    encoding: "utf-8",
    env: { ...process.env, ...env },
  });
}

test(".claude/settings.json and hooks/hooks.json reference existing scripts", () => {
  for (const rel of [".claude/settings.json", "hooks/hooks.json"]) {
    const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf-8"));
    assert.ok(cfg.hooks && typeof cfg.hooks === "object", `${rel} missing hooks object`);
    const commands = [];
    for (const entries of Object.values(cfg.hooks)) {
      for (const entry of entries) {
        for (const h of entry.hooks || []) {
          assert.equal(h.type, "command");
          commands.push(h.command);
        }
      }
    }
    assert.ok(commands.length >= 5, `${rel} expected >= 5 hook commands`);
    for (const cmd of commands) {
      const m = cmd.match(/(scripts\/[^\s"']+)/);
      assert.ok(m, `could not extract script path from ${cmd}`);
      assert.ok(fs.existsSync(path.join(ROOT, m[1])), `${rel} references missing script ${m[1]}`);
    }
  }
});

test("full Claude Code hook lifecycle updates STATE.md and writes unified JSONL telemetry", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ros-hooks-life-"));
  try {
    const agentDir = path.join(dir, ".agent");
    fs.mkdirSync(agentDir, { recursive: true });
    fs.writeFileSync(path.join(agentDir, "STATE.md"), "# STATE\n", "utf-8");

    const env = {
      CLAUDE_PROJECT_DIR: dir,
      AGENT_DIR: agentDir,
      ROS_SKIP_POSTGRES: "1",
    };

    // 1. post-edit with broken JS -> exits 2, records syntax_error + retry_counts in STATE.md
    const badJs = path.join(dir, "broken.js");
    fs.writeFileSync(badJs, "function broken( { return 1;\n", "utf-8");
    const rBad = runHook("scripts/hooks/post-edit.js", {
      env,
      stdin: JSON.stringify({ tool_input: { file_path: badJs } }),
    });
    assert.equal(rBad.status, 2);

    // 2. post-edit with valid JS -> exits 0
    const okJs = path.join(dir, "ok.js");
    fs.writeFileSync(okJs, "function ok() { return 1; }\n", "utf-8");
    const rOk = runHook("scripts/hooks/post-edit.js", {
      env,
      stdin: JSON.stringify({ tool_input: { file_path: okJs } }),
    });
    assert.equal(rOk.status, 0);

    // 3. compress-output with large repetitive stdout -> records chars_saved in telemetry
    const bigStdout = Array.from({ length: 400 }, (_, i) => `line ${i} building artifact`).join("\n");
    const rCmp = runHook("scripts/hooks/compress-output.js", {
      env,
      stdin: JSON.stringify({
        tool_name: "Bash",
        tool_response: { stdout: bigStdout, stderr: "", interrupted: false, isImage: false },
      }),
    });
    assert.equal(rCmp.status, 0);
    const cmpOut = JSON.parse(rCmp.stdout);
    assert.ok(cmpOut.hookSpecificOutput.updatedToolOutput.stdout.length < bigStdout.length);

    // 4. pre-compact warns about syntax errors & reports hook savings
    const rPre = runHook("scripts/hooks/pre-compact.js", { env });
    assert.equal(rPre.status, 0);
    assert.match(rPre.stderr, /retry|error/i);
    assert.match(rPre.stdout, /saved/i);

    // 5. session-end appends summary to STATE.md and writes session_end event
    const rEnd = runHook("scripts/hooks/session-end.js", { env });
    assert.equal(rEnd.status, 0);

    const stateText = fs.readFileSync(path.join(agentDir, "STATE.md"), "utf-8");
    assert.match(stateText, /## 🤖 Estado de Máquina/);
    assert.match(stateText, /Session Summary/);
    assert.match(stateText, /Hook Savings:/);

    const eventsFile = path.join(agentDir, "telemetry", "events.jsonl");
    assert.ok(fs.existsSync(eventsFile));
    const events = fs
      .readFileSync(eventsFile, "utf-8")
      .trim()
      .split("\n")
      .map((l) => JSON.parse(l));
    const names = events.map((e) => e.event);
    assert.ok(names.includes("post_edit"));
    assert.ok(names.includes("compress_output"));
    assert.ok(names.includes("pre_compact"));
    assert.ok(names.includes("session_end"));
    assert.ok(events.some((e) => e.chars_saved > 0 && e.tokens_saved_est > 0));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
