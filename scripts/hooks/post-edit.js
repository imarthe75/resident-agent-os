#!/usr/bin/env node

/**
 * Post-edit hook: validate syntax of edited Python/JavaScript files and emit structured telemetry.
 * Exits 0 on success and 2 on a syntax error: Claude Code treats exit code 2 from a PostToolUse hook as a blocking error and feeds stderr
 * back to the model.
 */

const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const telemetry = require("./telemetry-lib");

function getFilePath() {
  if (process.env.CLAUDE_TOOL_FILE) {
    return process.env.CLAUDE_TOOL_FILE;
  }

  try {
    if (!process.stdin.isTTY) {
      const stdinData = fs.readFileSync(0, "utf-8");
      const json = JSON.parse(stdinData);
      if (json.tool_input && json.tool_input.path) {
        return json.tool_input.path;
      }
      if (json.tool_input && json.tool_input.file_path) {
        return json.tool_input.file_path;
      }
    }
  } catch (e) {
    // Explicit fallback: non-JSON or empty stdin falls through to CLI argv.
    if (process.env.ROS_HOOK_DEBUG === "1") {
      process.stderr.write(`[post-edit] stdin parse skipped: ${e.message}\n`);
    }
  }

  if (process.argv[2]) {
    return process.argv[2];
  }

  return null;
}

// compile() only parses: `python -m py_compile` would also write a __pycache__/*.pyc next to the edited file.
const PY_CHECK = "import sys; compile(open(sys.argv[1], encoding='utf-8').read(), sys.argv[1], 'exec')";

/** Runs the first Python interpreter found; returns false when there is none (ENOENT), so a missing tool never blocks an edit. */
function runPython(args) {
  for (const bin of ["python3", "python"]) {
    try {
      execFileSync(bin, args, { stdio: "pipe" });
      return true;
    } catch (e) {
      if (e.code === "ENOENT") continue;
      throw e;
    }
  }
  return false;
}

function checkSyntax(filePath) {
  const ext = path.extname(filePath);

  try {
    if (ext === ".py") {
      if (!runPython(["-c", PY_CHECK, filePath])) {
        console.warn(`[post-edit] ⚠️  ${filePath} — no Python interpreter found, syntax not checked`);
        return { ok: true, checked: false, error: null };
      }
      console.log(`[post-edit] ✅ ${filePath} — syntax OK`);
      return { ok: true, checked: true, error: null };
    } else if ([".js", ".mjs", ".cjs"].includes(ext)) {
      execFileSync(process.execPath, ["--check", filePath], { stdio: "pipe" });
      console.log(`[post-edit] ✅ ${filePath} — syntax OK`);
      return { ok: true, checked: true, error: null };
    } else {
      console.log(`[post-edit] ℹ️  ${filePath} — no syntax check for this extension`);
      return { ok: true, checked: false, error: null };
    }
  } catch (e) {
    const errText = e.stderr ? e.stderr.toString() : e.message;
    console.error(`[post-edit] ❌ SYNTAX ERROR in ${filePath}:`);
    console.error(errText);
    return { ok: false, checked: true, error: errText.slice(0, 500) };
  }
}

function recordEditOutcome(filePath, result, durationMs) {
  const agentDir = telemetry.resolveAgentDir();
  if (!fs.existsSync(agentDir) && !process.env.ROS_TELEMETRY_PATH) {
    return;
  }
  const explicitTarget = Boolean(process.env.AGENT_DIR || process.env.ROS_TELEMETRY_PATH);
  const projectRoot = path.dirname(agentDir);
  const resolvedFile = path.resolve(filePath);
  if (!explicitTarget && !resolvedFile.startsWith(projectRoot + path.sep)) {
    return;
  }
  let retries = 0;
  if (!result.ok && fs.existsSync(agentDir)) {
    const state = telemetry.ensureSessionState(agentDir);
    const key = path.basename(filePath);
    state.retry_counts = state.retry_counts || {};
    state.retry_counts[key] = (state.retry_counts[key] || 0) + 1;
    retries = state.retry_counts[key];
    state.current_skill = key;
    state.errors = Array.isArray(state.errors) ? state.errors : [];
    state.errors.push({
      skill: key,
      error: result.error || "syntax error",
      phase: "post_edit",
      timestamp: new Date().toISOString(),
    });
    state.updated_at = new Date().toISOString();
    telemetry.writeStateAtomic(agentDir, state);
  }
  telemetry.appendEvent(agentDir, {
    event: "post_edit",
    phase: "post_edit",
    skill: path.basename(filePath),
    outcome: result.ok ? "ok" : "syntax_error",
    level: result.ok ? "INFO" : "ERROR",
    duration_ms: durationMs,
    retries,
    detail: { file: filePath, checked: result.checked, error: result.error || undefined },
  });
}

function main() {
  const t0 = Date.now();
  const filePath = getFilePath();

  if (!filePath) {
    console.log("[post-edit] ℹ️  No file path detected, skipping syntax check");
    process.exit(0);
  }

  if (!fs.existsSync(filePath)) {
    console.warn(`[post-edit] ⚠️  File not found: ${filePath}`);
    process.exit(0);
  }

  const result = checkSyntax(filePath);
  recordEditOutcome(filePath, result, Date.now() - t0);
  process.exit(result.ok ? 0 : 2);
}

main();
