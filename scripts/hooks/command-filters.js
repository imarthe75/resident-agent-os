#!/usr/bin/env node
/**
 * Command-aware output filters for `compress-output.js` (inspired by Chisle v3.13 / RTK shapes; own implementation).
 *
 * Compacts noisy stdout from well-known dev commands (git, pytest, jest/vitest, node --test, mvn/gradle,
 * npm/pip/uv/docker, grep/rg) while preserving 100% of errors, failures, stack traces, and summaries.
 * Commands piped into external filters (e.g. `| cat`) are left untouched. Disable with `ROS_COMPRESS_FILTERS=0`.
 */

"use strict";

const KEEP_ERROR = /(error|fail|failed|exception|traceback|assert|fatal|panic|warning|warn|caused by|^\s+at\s|^\s*file "|summary|passed|skipped|exit code|build failure|build success)/i;

function isPipedRaw(cmd) {
  if (typeof cmd !== "string") return false;
  return /\|\s*(cat|tee|jq|awk|sed|cut|sort|uniq|wc)\b/.test(cmd);
}

function classifyCommand(cmd) {
  if (typeof cmd !== "string" || !cmd.trim() || isPipedRaw(cmd)) return null;
  const s = cmd.trim();
  if (/\bgit\s+status\b/.test(s) && !/--porcelain|-s\b|--short\b/.test(s)) return "git_status";
  if (/\bgit\s+log\b/.test(s) && !/--oneline|--format|--pretty/.test(s)) return "git_log";
  if (/\bgit\s+(push|pull|fetch|clone)\b/.test(s)) return "git_transfer";
  if (/\b(pytest|py\.test)\b/.test(s)) return "pytest";
  if (/\bnode\s+--test\b/.test(s)) return "node_test";
  if (/\b(jest|vitest|npm\s+test|pnpm\s+test|yarn\s+test)\b/.test(s)) return "js_test";
  if (/\b(mvn|mvnw|gradle|gradlew)\b.*\b(test|check|build)\b/.test(s)) return "jvm_test";
  if (/\b(npm|pnpm|yarn)\s+(install|ci|add|update)\b|\b(pip|pip3|uv\s+pip)\s+install\b|\bdocker\s+(pull|build)\b/.test(s)) {
    return "install_noise";
  }
  if (/\b(grep\s+-[a-zA-Z]*r|rg\b)/.test(s)) return "grep_group";
  return null;
}

function filterGitStatus(lines) {
  return lines.filter((l) => !/^\s*\(use "git /.test(l) && !/^\s*Changes (not staged|to be committed)/.test(l) && !/^\s*Untracked files:/.test(l));
}

function filterGitLog(lines) {
  const out = [];
  let inBody = 0;
  for (const l of lines) {
    if (l.startsWith("commit ")) {
      inBody = 0;
      out.push(`commit ${l.slice(7, 17)}`);
    } else if (l.startsWith("Author:")) {
      out.push(l.replace(/\s*<[^>]+>/, ""));
    } else if (l.startsWith("Date:")) {
      const m = l.match(/\w+\s+\w+\s+\d+/);
      out.push(m ? `Date: ${m[0]}` : l);
    } else if (l.trim() === "") {
      continue;
    } else {
      inBody++;
      if (inBody <= 3 || KEEP_ERROR.test(l)) out.push(l);
    }
  }
  return out;
}

function filterGitTransfer(lines) {
  return lines.filter((l) => !/^(Counting|Compressing|Writing|Receiving|Resolving|Enumerating|remote:\s*(Counting|Compressing|Enumerating))/.test(l.trim()));
}

function filterPytest(lines) {
  const out = [];
  let hidden = 0;
  for (const l of lines) {
    if (/PASSED\s*(\[\s*\d+%\])?\s*$/.test(l) && !KEEP_ERROR.test(l.replace(/PASSED/i, ""))) {
      hidden++;
      continue;
    }
    out.push(l);
  }
  if (hidden > 0) out.unshift(`[pytest: ${hidden} pruebas PASSED omitidas]`);
  return out;
}

function filterNodeTest(lines) {
  const out = [];
  let hidden = 0;
  let skippingYaml = false;
  for (const l of lines) {
    if (/^(ok\s+\d+|✔|✓)\s/.test(l.trim())) {
      hidden++;
      skippingYaml = false;
      continue;
    }
    if (skippingYaml) {
      if (l.trim() === "...") skippingYaml = false;
      continue;
    }
    if (hidden > 0 && l.trim() === "---") {
      skippingYaml = true;
      continue;
    }
    out.push(l);
  }
  if (hidden > 0) out.unshift(`[node-test: ${hidden} pruebas OK omitidas]`);
  return out;
}

function filterJsTest(lines) {
  const out = [];
  let hidden = 0;
  for (const l of lines) {
    if (/^\s*(PASS|✓|✔)\s/.test(l) && !/(FAIL|ERROR|Tests?:|Test Suites?:)/i.test(l)) {
      hidden++;
      continue;
    }
    out.push(l);
  }
  if (hidden > 0) out.unshift(`[test: ${hidden} líneas PASS omitidas]`);
  return out;
}

function filterJvmTest(lines) {
  return lines.filter((l) => {
    const t = l.trim();
    if (/^\[INFO\]\s*(Downloading|Downloaded|Progress\s*\()/.test(t)) return false;
    if (/^>\s*Task\s+:.*\s+UP-TO-DATE$/.test(t)) return false;
    return true;
  });
}

function filterInstallNoise(lines) {
  const out = [];
  let hidden = 0;
  for (const l of lines) {
    const t = l.trim();
    if (
      !KEEP_ERROR.test(t) &&
      (/^(Downloading|Collecting|Using cached|Requirement already satisfied|Get:|Hit:|Ign:|added \d+ packages|\s*[a-f0-9]{12}:\s*(Pulling|Waiting|Downloading|Extracting|Verifying|Pull complete))/.test(t) ||
        /^\s*npm\s+http\b/.test(t))
    ) {
      hidden++;
      continue;
    }
    out.push(l);
  }
  if (hidden > 0) out.unshift(`[install: ${hidden} líneas de descarga/progreso omitidas]`);
  return out;
}

function filterGrepGroup(lines) {
  const grouped = new Map();
  const rest = [];
  for (const l of lines) {
    const m = l.match(/^([^:\s][^:]*):(\d+):(.*)$/);
    if (m) {
      const list = grouped.get(m[1]) || [];
      list.push(`  ${m[2]}:${m[3]}`);
      grouped.set(m[1], list);
    } else {
      rest.push(l);
    }
  }
  if (grouped.size === 0) return lines;
  const out = [];
  for (const [file, hits] of grouped.entries()) {
    out.push(file, ...hits);
  }
  return [...out, ...rest];
}

function filterCommandOutput(command, text) {
  if (process.env.ROS_COMPRESS_FILTERS === "0") return text;
  if (typeof text !== "string" || !text) return text;
  const kind = classifyCommand(command);
  if (!kind) return text;

  const lines = text.replace(/\r\n/g, "\n").split("\n");
  let next;
  switch (kind) {
    case "git_status":
      next = filterGitStatus(lines);
      break;
    case "git_log":
      next = filterGitLog(lines);
      break;
    case "git_transfer":
      next = filterGitTransfer(lines);
      break;
    case "pytest":
      next = filterPytest(lines);
      break;
    case "node_test":
      next = filterNodeTest(lines);
      break;
    case "js_test":
      next = filterJsTest(lines);
      break;
    case "jvm_test":
      next = filterJvmTest(lines);
      break;
    case "install_noise":
      next = filterInstallNoise(lines);
      break;
    case "grep_group":
      next = filterGrepGroup(lines);
      break;
    default:
      return text;
  }
  const joined = next.join("\n");
  return joined.length < text.length ? joined : text;
}

module.exports = { classifyCommand, filterCommandOutput };
