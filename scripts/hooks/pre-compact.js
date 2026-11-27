#!/usr/bin/env node

/**
 * Pre-compact hook: advisory warnings about context state and hook/loop telemetry.
 * Always exits 0 (never blocks the harness).
 */

const telemetry = require("./telemetry-lib");

const TOKEN_WARN_THRESHOLD = parseInt(process.env.TOKEN_WARN_THRESHOLD || "40000", 10);

function main() {
  const agentDir = telemetry.resolveAgentDir();
  const state = telemetry.readState(agentDir);
  const events = telemetry.readEvents(agentDir, 200);
  const summary = telemetry.summarizeEvents(events);

  if (state) {
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
  }

  if (summary.syntax_errors > 0 || summary.errors > 0) {
    console.warn(
      `[pre-compact] ⚠️  Recent telemetry shows ${summary.errors} error(s) (${summary.syntax_errors} syntax) across ${summary.total_events} event(s).`
    );
  }

  if (summary.chars_saved > 0) {
    console.log(
      `[pre-compact] ℹ️  Output compression saved ${summary.chars_saved} chars (~${summary.tokens_saved_est} tokens) in recent session telemetry.`
    );
  }

  telemetry.appendEvent(agentDir, {
    event: "pre_compact",
    phase: "pre_compact",
    outcome: summary.errors > 0 ? "degraded" : "ok",
    detail: {
      recent_events: summary.total_events,
      recent_errors: summary.errors,
      tokens_saved_est: summary.tokens_saved_est,
    },
  });

  process.exit(0);
}

main();
