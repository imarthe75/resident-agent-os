#!/usr/bin/env node
/**
 * PostToolUse hook: shrink very long Bash output before it enters the model's context.
 *
 * Everything that enters the context is billed again on every later turn, so a 40k-character build log costs far more than
 * the tokens of the answer that follows it. This hook replaces the Bash output the model sees with a shorter version and keeps
 * the complete original in a file whose path is written into the shortened output.
 *
 * Guarantees (each one has a test in tests/hooks/compress-output.test.js):
 *  - Only the Bash tool. Claude Code accepts a replacement only in the tool's own output shape and documents that shape for
 *    Bash (stdout, stderr, interrupted, isImage); for other tools a wrong shape would be ignored, so they are not touched.
 *    Read/Edit/Write are never touched: their exact text feeds later edits.
 *  - Nothing is lost: when the middle of an output is cut, the full original is first written to a private file (0600 in a
 *    0700 directory). If that write fails, only the lossless cleanup runs and nothing is cut.
 *  - Errors and test results survive: lines that look like errors, failures, warnings, stack frames or test/build summaries are
 *    kept from the cut middle (up to a cap), and the first and last lines are always kept.
 *  - Short outputs pass through untouched; a replacement is emitted only when it saves a meaningful amount.
 *  - Never breaks the tool pipeline: any internal error means "no replacement".
 *
 * Environment:
 *   ROS_COMPRESS_OUTPUT=0          disable entirely
 *   ROS_COMPRESS_MAX_CHARS=8000    a stream at or under this size is never cut (lossless cleanup still applies)
 *   ROS_COMPRESS_HEAD_LINES=60     lines kept from the start of a cut stream
 *   ROS_COMPRESS_TAIL_LINES=40     lines kept from the end of a cut stream
 *   ROS_COMPRESS_KEEP_LINES=80     cap on salvaged important lines from the cut middle
 *   ROS_COMPRESS_SPILL_DIR=<dir>   where originals are kept (default: <os tmpdir>/ros-tool-output-<uid>); the newest 40 stay
 *
 * The original may contain whatever the command printed, secrets included: it stays on this machine with owner-only
 * permissions, exactly like the terminal scrollback it replaces.
 *
 * Ideas from the Chisle project (JayPokale, MIT). The implementation is our own.
 */

"use strict";

const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");

const ANSI = /\x1b\[[0-9;?]*[ -/]*[@-~]|\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)/g;
const IMPORTANT = new RegExp(
  [
    "error", "fail", "exception", "traceback", "panic", "fatal", "denied", "refused", "warn", "assert",
    "cannot", "can't", "not found", "no such", "timed? ?out", "segmentation", "killed", "abort",
    "^\\s+at\\s", "^\\s*file \"", "^\\s*caused by",
    "\\b\\d+\\s+(passed|failed|errors?|skipped|tests?)\\b", "tests? run:", "build (success|failure)",
    "^=+ .* =+$", "^-+ .* -+$", "exit (code|status)",
  ].join("|"),
  "i"
);
const KEEP_FILES = 40;
const MIN_SAVING = 200;

function envInt(name, fallback) {
  const v = parseInt(process.env[name] || "", 10);
  return Number.isFinite(v) && v >= 0 ? v : fallback;
}

function limits() {
  return {
    maxChars: envInt("ROS_COMPRESS_MAX_CHARS", 8000),
    head: envInt("ROS_COMPRESS_HEAD_LINES", 60),
    tail: envInt("ROS_COMPRESS_TAIL_LINES", 40),
    keep: envInt("ROS_COMPRESS_KEEP_LINES", 80),
  };
}

/** Lossless cleanup: drop terminal color codes, squeeze blank-line runs, fold runs of identical lines into one plus a count. */
function clean(text) {
  const lines = text.replace(ANSI, "").replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let i = 0;
  while (i < lines.length) {
    let j = i + 1;
    while (j < lines.length && lines[j] === lines[i]) j++;
    const run = j - i;
    if (lines[i].trim() === "") out.push("");
    else if (run >= 4) out.push(lines[i], `[línea anterior repetida ${run - 1} veces más]`);
    else for (let k = i; k < j; k++) out.push(lines[k]);
    i = j;
  }
  return out.join("\n");
}

/** Keep head, tail and the important lines of the middle; mark every gap with its size and where the original is. */
function cut(text, lim, spillPath) {
  const lines = text.split("\n");
  if (text.length <= lim.maxChars || lines.length <= lim.head + lim.tail + 1) return text;
  const middle = lines.slice(lim.head, lines.length - lim.tail);
  const kept = [];
  let gap = 0;
  let salvaged = 0;
  const flush = () => {
    if (gap) kept.push(`[… ${gap} líneas omitidas; salida completa en ${spillPath}]`);
    gap = 0;
  };
  for (const line of middle) {
    if (salvaged < lim.keep && IMPORTANT.test(line)) {
      flush();
      kept.push(line);
      salvaged++;
    } else gap++;
  }
  flush();
  return [...lines.slice(0, lim.head), ...kept, ...lines.slice(lines.length - lim.tail)].join("\n");
}

function spillDir() {
  const uid = typeof process.getuid === "function" ? process.getuid() : "user";
  return process.env.ROS_COMPRESS_SPILL_DIR || path.join(os.tmpdir(), `ros-tool-output-${uid}`);
}

/** Write the full original privately; return its path, or null if it could not be written (then nothing may be cut). */
function spill(original) {
  try {
    const dir = spillDir();
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    const st = fs.lstatSync(dir);
    if (!st.isDirectory() || st.isSymbolicLink()) return null;
    if (typeof process.getuid === "function" && st.uid !== process.getuid()) return null;
    fs.chmodSync(dir, 0o700);
    const name = `${Date.now()}-${crypto.createHash("sha256").update(original).digest("hex").slice(0, 12)}.txt`;
    const file = path.join(dir, name);
    fs.writeFileSync(file, original, { mode: 0o600, flag: "wx" });
    const old = fs.readdirSync(dir).filter((f) => f.endsWith(".txt")).sort();
    for (const f of old.slice(0, Math.max(0, old.length - KEEP_FILES))) fs.rmSync(path.join(dir, f), { force: true });
    return file;
  } catch (e) {
    return null;
  }
}

/** Shrink one stream (stdout or stderr). Returns the text the model should see. */
function shrink(text, lim = limits()) {
  if (typeof text !== "string" || text === "") return text;
  const tidy = clean(text);
  if (tidy.length <= lim.maxChars) return tidy;
  const spillPath = spill(text);
  return spillPath ? cut(tidy, lim, spillPath) : tidy;
}

/** Hook payload → replacement output object, or null to leave the original alone. */
function processPayload(payload) {
  if (process.env.ROS_COMPRESS_OUTPUT === "0") return null;
  if (!payload || payload.tool_name !== "Bash") return null;
  const resp = payload.tool_response;
  if (!resp || typeof resp !== "object" || Array.isArray(resp) || resp.isImage) return null;
  if (typeof resp.stdout !== "string" && typeof resp.stderr !== "string") return null;
  const updated = { ...resp };
  let saved = 0;
  for (const key of ["stdout", "stderr"]) {
    if (typeof resp[key] !== "string") continue;
    updated[key] = shrink(resp[key]);
    saved += resp[key].length - updated[key].length;
  }
  return saved >= MIN_SAVING ? updated : null;
}

function main() {
  let input = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (c) => (input += c));
  process.stdin.on("end", () => {
    try {
      const updated = processPayload(JSON.parse(input));
      if (updated) {
        process.stdout.write(
          JSON.stringify({ hookSpecificOutput: { hookEventName: "PostToolUse", updatedToolOutput: updated } })
        );
      }
    } catch (e) {
      // No replacement: the original output reaches the model unchanged.
    }
    process.exit(0);
  });
}

if (require.main === module) main();

module.exports = { clean, cut, shrink, spill, processPayload, IMPORTANT };
