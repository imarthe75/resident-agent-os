#!/usr/bin/env node

/**
 * Pre-compact hook: advisory warnings about context state.
 * Always exits 0 (never blocks the harness).
 */

const fs = require("fs");
const path = require("path");

const AGENT_DIR = process.env.AGENT_DIR || ".agent";
const STATE_PATH = path.join(AGENT_DIR, "STATE.md");
const TOKEN_WARN_THRESHOLD = parseInt(process.env.TOKEN_WARN_THRESHOLD || "40000");

function readState() {
  if (!fs.existsSync(STATE_PATH)) {
    return null;
  }

  try {
    const content = fs.readFileSync(STATE_PATH, "utf-8");
    const match = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (match) {
      return JSON.parse(match[1]);
    }
  } catch (e) {
    console.warn(`[pre-compact] Failed to read STATE.md: ${e.message}`);
  }
  return null;
}

function main() {
  const state = readState();
  if (!state) {
    process.exit(0);
  }

  const currentSkill = state.current_skill;
  if (currentSkill && state.retry_counts && state.retry_counts[currentSkill] > 0) {
    console.warn(
      `[pre-compact] ⚠️  Skill '${currentSkill}' has ${state.retry_counts[currentSkill]} retry(ies).`
    );
  }

  if (state.context_token_estimate >= TOKEN_WARN_THRESHOLD) {
    console.warn(
      `[pre-compact] ⚠️  Context token estimate (${state.context_token_estimate}) is high.`
    );
  }

  process.exit(0);
}

main();
