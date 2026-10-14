#!/usr/bin/env node

/**
 * Post-edit hook: validate syntax of edited Python/JavaScript files.
 * Exits 0 on success and 2 on a syntax error: Claude Code treats exit code 2 from a PostToolUse hook as a blocking error and feeds stderr
 * back to the model (exit 1 is only a non-blocking warning, so the old exit 1 never stopped anything).
 */

const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function getFilePath() {
  // Priority 1: Claude Code environment variable
  if (process.env.CLAUDE_TOOL_FILE) {
    return process.env.CLAUDE_TOOL_FILE;
  }

  // Priority 2: stdin JSON
  try {
    let stdinData = "";
    if (!process.stdin.isTTY) {
      stdinData = fs.readFileSync(0, "utf-8");
      const json = JSON.parse(stdinData);
      if (json.tool_input && json.tool_input.path) {
        return json.tool_input.path;
      }
      if (json.tool_input && json.tool_input.file_path) {
        return json.tool_input.file_path;
      }
    }
  } catch (e) {
    // Ignore JSON parse errors, fall through to argv
  }

  // Priority 3: command-line argument
  if (process.argv[2]) {
    return process.argv[2];
  }

  return null;
}

function checkSyntax(filePath) {
  const ext = path.extname(filePath);

  try {
    if (ext === ".py") {
      execFileSync("python3", ["-m", "py_compile", filePath], {
        stdio: "pipe",
      });
      console.log(`[post-edit] ✅ ${filePath} — syntax OK`);
      return true;
    } else if ([".js", ".mjs", ".cjs"].includes(ext)) {
      execFileSync("node", ["--check", filePath], { stdio: "pipe" });
      console.log(`[post-edit] ✅ ${filePath} — syntax OK`);
      return true;
    } else {
      console.log(`[post-edit] ℹ️  ${filePath} — no syntax check for this extension`);
      return true;
    }
  } catch (e) {
    console.error(`[post-edit] ❌ SYNTAX ERROR in ${filePath}:`);
    console.error(e.stderr ? e.stderr.toString() : e.message);
    return false;
  }
}

function main() {
  const filePath = getFilePath();

  if (!filePath) {
    console.log("[post-edit] ℹ️  No file path detected, skipping syntax check");
    process.exit(0);
  }

  if (!fs.existsSync(filePath)) {
    console.warn(`[post-edit] ⚠️  File not found: ${filePath}`);
    process.exit(0);
  }

  const success = checkSyntax(filePath);
  process.exit(success ? 0 : 2);
}

main();
