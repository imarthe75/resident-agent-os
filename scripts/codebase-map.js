#!/usr/bin/env node
/**
 * Codebase map: a short list of what already exists in the project (top-level classes, functions and exports per folder),
 * so the "already exists → reuse" rung of rules/common/efficiency.md does not need a search before every change.
 *
 * Use:
 *   node scripts/codebase-map.js [root] [--budget 2500]   print the map
 *   As a SessionStart hook it reads the hook JSON on stdin and returns the map as additionalContext.
 *
 * Deliberate limits (say them, do not hide them):
 *  - Regular expressions per language, not a parser: nested, generated or dynamically defined symbols are missed. A symbol
 *    absent from the map may still exist; grep before writing a "new" helper. A tree-sitter index is the upgrade path.
 *  - Tests, vendored, generated and build folders are skipped. Shared folders (utils, lib, services, components, core...)
 *    are listed first because that is where reusable code lives; when the character budget runs out the rest is counted, not
 *    listed.
 *
 * Environment: ROS_CODEBASE_MAP=0 disables the hook; ROS_CODEBASE_MAP_CHARS sets the budget (default 2500, ~600 tokens).
 *
 * Idea from the Ponytail project (DietrichGebert, MIT). The implementation is our own.
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const SOURCE = /\.(py|js|jsx|mjs|cjs|ts|tsx|java|kt|go|rs|cs|php|rb|sql)$/;
const SKIP_DIR =
  /(^|\/)(node_modules|\.git|dist|build|out|target|vendor|venv|\.venv|__pycache__|coverage|\.next|\.angular|generated|migrations?|db\/changelog|tests?|__tests__|spec|e2e|fixtures|assets)(\/|$)/i;
const SKIP_FILE = /(^|\/)(test_[^/]*|[^/]*(_test|\.test|\.spec|Test|Tests|IT|\.min|\.d|\.gen|\.generated)\.[a-z]+)$/;
const SHARED = /(util|helper|lib|common|shared|service|component|core|model|schema|api|domain|repositor)/i;
const MAX_FILES = 5000;
const MAX_FILE_BYTES = 400_000;

const PATTERNS = {
  py: [/^(?:async\s+)?def\s+([A-Za-z]\w*)/gm, /^class\s+([A-Za-z]\w*)/gm],
  js: [
    /^export\s+(?:default\s+)?(?:abstract\s+)?(?:async\s+)?(?:function\*?|class|const|let|interface|type|enum)\s+([A-Za-z_$][\w$]*)/gm,
  ],
  jvm: [/^(?:public\s+|protected\s+)?(?:abstract\s+|final\s+|sealed\s+)*(?:class|interface|enum|record|object)\s+([A-Z]\w*)/gm],
  go: [/^func\s+(?:\([^)]*\)\s*)?([A-Z]\w*)/gm, /^type\s+([A-Z]\w*)/gm],
  rs: [/^pub\s+(?:async\s+)?(?:fn|struct|enum|trait|type)\s+(\w+)/gm],
  cs: [/^\s*public\s+(?:static\s+|sealed\s+|abstract\s+|partial\s+)*(?:class|interface|record|enum)\s+(\w+)/gm],
  php: [/^(?:final\s+|abstract\s+)?class\s+(\w+)/gm, /^function\s+(\w+)/gm],
  rb: [/^(?:class|module)\s+([A-Z][\w:]*)/gm, /^def\s+(\w+)/gm],
  sql: [/^\s*create\s+(?:or\s+replace\s+)?(?:function|procedure|view|table)\s+(?:if\s+not\s+exists\s+)?([\w.]+)/gim],
};
const LANG = { py: "py", js: "js", jsx: "js", mjs: "js", cjs: "js", ts: "js", tsx: "js", java: "jvm", kt: "jvm",
  go: "go", rs: "rs", cs: "cs", php: "php", rb: "rb", sql: "sql" };

function listFiles(root) {
  try {
    const out = execFileSync("git", ["-C", root, "ls-files", "--cached", "--others", "--exclude-standard"], {
      maxBuffer: 64 * 1024 * 1024,
      stdio: ["ignore", "pipe", "ignore"],
    });
    return out.toString().split("\n").filter(Boolean);
  } catch (e) {
    const files = [];
    const walk = (dir) => {
      if (files.length >= MAX_FILES) return;
      let entries = [];
      try { entries = fs.readdirSync(path.join(root, dir), { withFileTypes: true }); } catch (err) { return; }
      for (const e2 of entries) {
        const rel = dir ? `${dir}/${e2.name}` : e2.name;
        if (e2.isDirectory() && !e2.isSymbolicLink()) { if (!SKIP_DIR.test(rel)) walk(rel); }
        else if (e2.isFile()) files.push(rel);
      }
    };
    walk("");
    return files;
  }
}

function symbolsOf(root, rel) {
  const lang = LANG[path.extname(rel).slice(1)];
  if (!lang) return [];
  let text;
  try {
    const full = path.join(root, rel);
    if (fs.statSync(full).size > MAX_FILE_BYTES) return [];
    text = fs.readFileSync(full, "utf8");
  } catch (e) {
    return [];
  }
  const names = new Set();
  for (const re of PATTERNS[lang]) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text))) if (!m[1].startsWith("_")) names.add(m[1]);
  }
  return [...names];
}

/** Map of folder → { files, symbols }, shared folders first, then by symbol count. */
function collect(root) {
  const files = listFiles(root)
    .filter((f) => SOURCE.test(f) && !SKIP_DIR.test(path.dirname(f) + "/") && !SKIP_FILE.test(f))
    .slice(0, MAX_FILES);
  const byDir = new Map();
  for (const rel of files) {
    const syms = symbolsOf(root, rel);
    if (!syms.length) continue;
    const dir = path.dirname(rel);
    const entry = byDir.get(dir) || { files: 0, symbols: [] };
    entry.files++;
    entry.symbols.push(...syms);
    byDir.set(dir, entry);
  }
  return [...byDir.entries()].sort(
    (a, b) => Number(SHARED.test(b[0])) - Number(SHARED.test(a[0])) || b[1].symbols.length - a[1].symbols.length ||
      a[0].localeCompare(b[0])
  );
}

function render(root, budget) {
  const dirs = collect(root);
  if (!dirs.length) return "";
  const header = "Mapa del código (lo que ya existe; reutilizar antes de escribir; puede faltar algo: confirmar con grep):";
  const lines = [header];
  let used = header.length;
  let omitted = 0;
  for (const [dir, { symbols }] of dirs) {
    const unique = [...new Set(symbols)];
    const line = `${dir}: ${unique.join(", ")}`;
    const fitted = line.length > 400 ? `${line.slice(0, 397)}...` : line;
    if (used + fitted.length + 1 > budget) { omitted++; continue; }
    lines.push(fitted);
    used += fitted.length + 1;
  }
  if (omitted) lines.push(`[+${omitted} carpetas no listadas por el límite de ${budget} caracteres; usar grep]`);
  return lines.join("\n");
}

function budgetFromArgs(argv) {
  const i = argv.indexOf("--budget");
  const v = parseInt(i >= 0 ? argv[i + 1] : process.env.ROS_CODEBASE_MAP_CHARS || "", 10);
  return Number.isFinite(v) && v > 200 ? v : 2500;
}

function main() {
  const argv = process.argv.slice(2);
  if (process.stdin.isTTY || argv.length) {
    const root = argv.find((a, i) => !a.startsWith("--") && argv[i - 1] !== "--budget") || process.cwd();
    process.stdout.write(render(root, budgetFromArgs(argv)) + "\n");
    return;
  }
  let input = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (c) => (input += c));
  process.stdin.on("end", () => {
    try {
      if (process.env.ROS_CODEBASE_MAP === "0") return;
      const payload = JSON.parse(input || "{}");
      const root = process.env.CLAUDE_PROJECT_DIR || payload.cwd || process.cwd();
      const map = render(root, budgetFromArgs([]));
      if (map) {
        process.stdout.write(
          JSON.stringify({ hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: map } })
        );
      }
    } catch (e) {
      // No map: the session starts normally.
    }
  });
}

if (require.main === module) main();

module.exports = { collect, render, symbolsOf };
