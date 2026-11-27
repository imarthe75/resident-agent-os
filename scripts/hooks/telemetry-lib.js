#!/usr/bin/env node
/**
 * Shared telemetry and STATE.md helper for Claude Code / Gemini CLI hooks.
 *
 * Writes the exact same JSONL schema as `agent/telemetry.py` into `.agent/telemetry/events.jsonl`
 * and updates the machine-state block in `.agent/STATE.md` atomically so hook-driven sessions
 * have real observability even when the Python `ResidentAgentLoop` is not invoked.
 */

"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const SERVICE_NAME = "resident-agent-os";

function resolveAgentDir() {
  if (process.env.AGENT_DIR) return path.resolve(process.env.AGENT_DIR);
  const projectRoot = process.env.ROS_PROJECT_DIR || process.env.CLAUDE_PROJECT_DIR || process.env.GEMINI_PROJECT_DIR;
  if (projectRoot) return path.join(path.resolve(projectRoot), ".agent");
  return path.resolve(".agent");
}

function resolveProjectId(agentDir) {
  if (process.env.ROS_PROJECT_ID) return process.env.ROS_PROJECT_ID;
  const parent = path.basename(path.dirname(path.resolve(agentDir)));
  return parent || "default";
}

function detectAgentHost() {
  if (process.env.ROS_AGENT_HOST) return process.env.ROS_AGENT_HOST;
  if (process.env.CLAUDE_PROJECT_DIR || process.env.CLAUDE_PLUGIN_ROOT) return "claude";
  if (process.env.GEMINI_PROJECT_DIR) return "gemini";
  return "generic";
}

function resolveTelemetryPath(agentDir) {
  if (process.env.ROS_TELEMETRY_PATH) return path.resolve(process.env.ROS_TELEMETRY_PATH);
  return path.join(agentDir, "telemetry", "events.jsonl");
}

function readState(agentDir) {
  const statePath = path.join(agentDir, "STATE.md");
  if (!fs.existsSync(statePath)) return null;
  try {
    const content = fs.readFileSync(statePath, "utf-8");
    const match =
      content.match(/## 🤖 Estado de Máquina\s*```json\s*([\s\S]*?)\s*```/) ||
      content.match(/```json\s*([\s\S]*?)\s*```/);
    if (!match) return null;
    const parsed = JSON.parse(match[1].trim());
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (e) {
    process.stderr.write(`[telemetry-lib] Failed to parse ${statePath}: ${e.message}\n`);
    return null;
  }
}

function ensureSessionState(agentDir) {
  const existing = readState(agentDir);
  if (existing && existing.session_id) return existing;
  const now = new Date().toISOString();
  return {
    session_id: process.env.ROS_SESSION_ID || crypto.randomUUID(),
    current_phase: "execution",
    current_skill: null,
    retry_counts: {},
    errors: [],
    completed_skills: [],
    context_token_estimate: 0,
    usage: {},
    usage_totals: { calls: 0, tokens_in: 0, tokens_out: 0, usd: 0.0 },
    started_at: now,
    updated_at: now,
  };
}

function writeStateAtomic(agentDir, stateObj) {
  if (!fs.existsSync(agentDir)) return false;
  const statePath = path.join(agentDir, "STATE.md");
  const serialized = JSON.stringify(stateObj, null, 2);
  const newBlock = "```json\n" + serialized + "\n```";
  const tmpPath = path.join(agentDir, `.STATE.${process.pid}.${Date.now()}.tmp`);
  try {
    const content = fs.existsSync(statePath) ? fs.readFileSync(statePath, "utf-8") : "";
    const pattern = /(## 🤖 Estado de Máquina\s*)```json\s*[\s\S]*?\s*```/;
    let nextContent;
    if (pattern.test(content)) {
      nextContent = content.replace(pattern, `$1${newBlock}`);
    } else if (content.length > 0) {
      nextContent = `${content.trimEnd()}\n\n## 🤖 Estado de Máquina\n${newBlock}\n`;
    } else {
      nextContent = `## 🤖 Estado de Máquina\n${newBlock}\n`;
    }
    fs.writeFileSync(tmpPath, nextContent, "utf-8");
    fs.renameSync(tmpPath, statePath);
    return true;
  } catch (e) {
    process.stderr.write(`[telemetry-lib] Failed to write ${statePath}: ${e.message}\n`);
    if (fs.existsSync(tmpPath)) {
      try {
        fs.unlinkSync(tmpPath);
      } catch (unlinkErr) {
        process.stderr.write(`[telemetry-lib] Failed to remove temp file ${tmpPath}: ${unlinkErr.message}\n`);
      }
    }
    return false;
  }
}

function appendEvent(agentDir, fields) {
  if (process.env.ROS_TELEMETRY_DISABLED === "1") return null;
  const explicitPath = Boolean(process.env.ROS_TELEMETRY_PATH);
  if (!explicitPath && !fs.existsSync(agentDir)) return null;
  const repoAgentDir = path.resolve(__dirname, "..", "..", ".agent");
  const inNodeTest = Boolean(process.env.NODE_TEST_CONTEXT || process.argv.includes("--test"));
  if (inNodeTest && !explicitPath && path.resolve(agentDir) === repoAgentDir) return null;

  const state = readState(agentDir);
  const sessionId = fields.session_id || (state && state.session_id) || process.env.ROS_SESSION_ID || crypto.randomUUID();
  const correlationId = fields.correlation_id || process.env.X_REQUEST_ID || sessionId;
  const record = {
    timestamp: new Date().toISOString(),
    service: SERVICE_NAME,
    project_id: fields.project_id || resolveProjectId(agentDir),
    agent_host: fields.agent_host || detectAgentHost(),
    source: "hook",
    level: (fields.level || "INFO").toUpperCase(),
    session_id: sessionId,
    correlation_id: correlationId,
    event: fields.event || "hook_event",
    phase: fields.phase || "hook",
    skill: fields.skill || null,
    outcome: fields.outcome || "ok",
    duration_ms: typeof fields.duration_ms === "number" ? Number(fields.duration_ms.toFixed(3)) : null,
    tokens_in: Number(fields.tokens_in || 0),
    tokens_out: Number(fields.tokens_out || 0),
    cost_usd: Number(fields.cost_usd || 0),
    retries: Number(fields.retries || 0),
    chars_saved: Number(fields.chars_saved || 0),
    tokens_saved_est: Number(fields.tokens_saved_est || 0),
  };
  if (fields.detail && typeof fields.detail === "object") {
    record.detail = fields.detail;
  }

  const target = resolveTelemetryPath(agentDir);
  try {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.appendFileSync(target, JSON.stringify(record) + "\n", "utf-8");
    return record;
  } catch (e) {
    process.stderr.write(`[telemetry-lib] Failed to append event to ${target}: ${e.message}\n`);
    return null;
  }
}

function readEvents(agentDir, limit = 500) {
  const target = resolveTelemetryPath(agentDir);
  if (!fs.existsSync(target)) return [];
  try {
    const raw = fs.readFileSync(target, "utf-8").split("\n").filter((l) => l.trim().length > 0);
    const slice = limit > 0 ? raw.slice(-limit) : raw;
    const out = [];
    for (const line of slice) {
      try {
        const obj = JSON.parse(line);
        if (obj && typeof obj === "object") out.push(obj);
      } catch (parseErr) {
        process.stderr.write(`[telemetry-lib] Skipping malformed JSONL line: ${parseErr.message}\n`);
      }
    }
    return out;
  } catch (e) {
    process.stderr.write(`[telemetry-lib] Failed to read ${target}: ${e.message}\n`);
    return [];
  }
}

function summarizeEvents(events) {
  let charsSaved = 0;
  let tokensSavedEst = 0;
  let errors = 0;
  let syntaxErrors = 0;
  let hookEvents = 0;
  let loopEvents = 0;
  let tokensIn = 0;
  let tokensOut = 0;
  let costUsd = 0;
  for (const ev of events) {
    charsSaved += Number(ev.chars_saved || 0);
    tokensSavedEst += Number(ev.tokens_saved_est || 0);
    tokensIn += Number(ev.tokens_in || 0);
    tokensOut += Number(ev.tokens_out || 0);
    costUsd += Number(ev.cost_usd || 0);
    if (ev.source === "hook") hookEvents++;
    if (ev.source === "loop") loopEvents++;
    const outcome = String(ev.outcome || "").toLowerCase();
    if (outcome === "syntax_error") {
      syntaxErrors++;
      errors++;
    } else if (outcome === "error" || outcome === "failed") {
      errors++;
    }
  }
  return {
    total_events: events.length,
    hook_events: hookEvents,
    loop_events: loopEvents,
    errors,
    syntax_errors: syntaxErrors,
    chars_saved: charsSaved,
    tokens_saved_est: tokensSavedEst,
    tokens_in: tokensIn,
    tokens_out: tokensOut,
    cost_usd: Number(costUsd.toFixed(6)),
  };
}

module.exports = {
  resolveAgentDir,
  resolveProjectId,
  detectAgentHost,
  resolveTelemetryPath,
  readState,
  ensureSessionState,
  writeStateAtomic,
  appendEvent,
  readEvents,
  summarizeEvents,
};
