#!/usr/bin/env node

/**
 * Session-end hook: persist session summary to STATE.md, structured telemetry JSONL, and (when PostgreSQL is available)
 * the dedicated non-vector `memory.session_summaries` table via parameterized psql variables.
 * Never inserts embedding-less rows into `memory.lessons` or `memory.agent_memory`.
 * Always exits 0 (graceful degradation if services unavailable).
 */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const telemetry = require("./telemetry-lib");

function generateSummary(state, metrics) {
  const now = new Date().toISOString();
  const completed = state && Array.isArray(state.completed_skills) && state.completed_skills.length > 0
    ? state.completed_skills.join(", ")
    : "none";
  const retries = state && state.retry_counts ? JSON.stringify(state.retry_counts) : "{}";
  const usage = state && state.usage_totals
    ? `${state.usage_totals.calls} calls, ${state.usage_totals.tokens_in} in / ${state.usage_totals.tokens_out} out tokens, ${state.usage_totals.usd} USD`
    : (metrics.cost_usd > 0 || metrics.tokens_in > 0
        ? `${metrics.tokens_in} in / ${metrics.tokens_out} out tokens, ${metrics.cost_usd} USD (telemetry)`
        : "not recorded");

  return `
### Session Summary — ${now}
- **Session ID:** ${state.session_id}
- **Completed Skills:** ${completed}
- **Errors Recorded:** ${Math.max(state.errors ? state.errors.length : 0, metrics.errors)} (${metrics.syntax_errors} syntax)
- **Retry Counts:** ${retries}
- **Model usage:** ${usage}
- **Hook Savings:** ${metrics.chars_saved} chars (~${metrics.tokens_saved_est} tokens)
- **Telemetry Events:** ${metrics.total_events} (${metrics.loop_events} loop, ${metrics.hook_events} hook)
- **Final Phase:** ${state.current_phase || "closure"}
`.trim();
}

function appendSummaryToState(agentDir, summary) {
  const statePath = path.join(agentDir, "STATE.md");
  try {
    const content = fs.existsSync(statePath) ? fs.readFileSync(statePath, "utf-8") : "";
    const tmpPath = path.join(agentDir, `.STATE.summary.${process.pid}.${Date.now()}.tmp`);
    fs.writeFileSync(tmpPath, `${content.trimEnd()}\n\n${summary}\n`, "utf-8");
    fs.renameSync(tmpPath, statePath);
    console.log("[session-end] ✅ Summary appended to STATE.md");
    return true;
  } catch (e) {
    console.warn(`[session-end] ⚠️  Failed to append summary: ${e.message}`);
    return false;
  }
}

function persistToPostgres(state, summary, metrics) {
  if (process.env.ROS_SKIP_POSTGRES === "1") {
    return { persisted: false, reason: "skipped_by_env" };
  }
  const password = process.env.POSTGRES_PASSWORD || "";
  if (!password) {
    console.log("[session-end] ℹ️  POSTGRES_PASSWORD not set; skipping PostgreSQL session summary persistence");
    return { persisted: false, reason: "no_password" };
  }

  const host = process.env.POSTGRES_HOST || "localhost";
  const port = process.env.POSTGRES_PORT || "5432";
  const user = process.env.POSTGRES_USER || "admin";
  const db = process.env.POSTGRES_DB || "db_resident_knowledge";

  const projectId = telemetry.resolveProjectId(telemetry.resolveAgentDir());
  // Parameterized psql variables (:'var') prevent SQL injection and target memory.session_summaries (non-vector).
  const sql =
    "INSERT INTO memory.session_summaries (project_id, session_id, summary, metrics) " +
    "VALUES (:'project_id', :'session_id'::uuid, :'summary', :'metrics'::jsonb);";

  try {
    const result = spawnSync(
      "psql",
      [
        "-v", "ON_ERROR_STOP=1",
        "-v", `project_id=${projectId}`,
        "-v", `session_id=${state.session_id}`,
        "-v", `summary=${summary}`,
        "-v", `metrics=${JSON.stringify(metrics)}`,
        "-h", host,
        "-p", port,
        "-U", user,
        "-d", db,
      ],
      {
        input: sql + "\n",
        env: { ...process.env, PGPASSWORD: password },
        stdio: ["pipe", "pipe", "pipe"],
        timeout: 5000,
      }
    );

    if (result.error) {
      console.warn(`[session-end] ⚠️  psql not found or failed: ${result.error.message}`);
      return { persisted: false, reason: result.error.message };
    }
    if (result.status !== 0) {
      const errMsg = (result.stderr || "").toString().trim().slice(0, 200);
      console.warn(`[session-end] ⚠️  psql exited ${result.status}: ${errMsg}`);
      return { persisted: false, reason: errMsg || `exit_${result.status}` };
    }
    console.log("[session-end] ✅ Session summary persisted to memory.session_summaries");
    return { persisted: true, reason: "ok" };
  } catch (e) {
    console.warn(`[session-end] ⚠️  Failed to persist to PostgreSQL: ${e.message}`);
    return { persisted: false, reason: e.message };
  }
}

function main() {
  const t0 = Date.now();
  console.log("[session-end] 🔌 Running session-end ritual");

  const agentDir = telemetry.resolveAgentDir();
  if (!fs.existsSync(agentDir)) {
    console.log("[session-end] ℹ️  No .agent directory found; nothing to persist");
    process.exit(0);
  }

  const events = telemetry.readEvents(agentDir, 500);
  const metrics = telemetry.summarizeEvents(events);
  const existingState = telemetry.readState(agentDir);
  if (!existingState && events.length === 0) {
    console.log("[session-end] ℹ️  No state block or telemetry events recorded; skipping summary");
    process.exit(0);
  }

  const state = telemetry.ensureSessionState(agentDir);
  state.current_phase = "closure";
  state.updated_at = new Date().toISOString();
  telemetry.writeStateAtomic(agentDir, state);

  const summary = generateSummary(state, metrics);
  appendSummaryToState(agentDir, summary);
  const pg = persistToPostgres(state, summary, metrics);

  telemetry.appendEvent(agentDir, {
    event: "session_end",
    phase: "closure",
    session_id: state.session_id,
    outcome: pg.persisted ? "ok" : "degraded",
    duration_ms: Date.now() - t0,
    detail: { postgres_persisted: pg.persisted, postgres_reason: pg.reason, metrics },
  });

  console.log("[session-end] ✅ Session-end ritual complete");
  process.exit(0);
}

main();
