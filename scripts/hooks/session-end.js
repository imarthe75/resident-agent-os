#!/usr/bin/env node

/**
 * Session-end hook: persist session summary to STATE.md and PostgreSQL.
 * Always exits 0 (graceful degradation if services unavailable).
 */

const fs = require("fs");
const path = require("path");
const { execFileSync, spawnSync } = require("child_process");

const AGENT_DIR = process.env.AGENT_DIR || ".agent";
const STATE_PATH = path.join(AGENT_DIR, "STATE.md");

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
    console.warn(`[session-end] Failed to read STATE.md: ${e.message}`);
  }
  return null;
}

function generateSummary(state) {
  if (!state) {
    return null;
  }

  const now = new Date().toISOString();
  return `
### Session Summary — ${now}
- **Session ID:** ${state.session_id}
- **Completed Skills:** ${state.completed_skills.join(", ") || "none"}
- **Errors Recorded:** ${state.errors.length}
- **Retry Counts:** ${JSON.stringify(state.retry_counts)}
- **Final Phase:** ${state.current_phase}
`.trim();
}

function appendSummaryToState(summary) {
  if (!summary) {
    return;
  }

  try {
    let content = fs.existsSync(STATE_PATH)
      ? fs.readFileSync(STATE_PATH, "utf-8")
      : "";

    content = content + "\n\n" + summary;
    fs.writeFileSync(STATE_PATH, content, "utf-8");
    console.log("[session-end] ✅ Summary appended to STATE.md");
  } catch (e) {
    console.warn(`[session-end] ⚠️  Failed to append summary: ${e.message}`);
  }
}

function persistToPostgres(state, summary) {
  if (!state || !summary) {
    return;
  }

  const host = process.env.POSTGRES_HOST || "localhost";
  const port = process.env.POSTGRES_PORT || "5432";
  const user = process.env.POSTGRES_USER || "admin";
  const db = process.env.POSTGRES_DB || "db_resident_knowledge";
  const password = process.env.POSTGRES_PASSWORD || "";

  const escapedContent = summary.replace(/'/g, "''");
  const sql = `
INSERT INTO memory.lessons (content)
VALUES ('${escapedContent}')
ON CONFLICT DO NOTHING;
  `.trim();

  try {
    const result = spawnSync("psql", [
      "-h", host,
      "-p", port,
      "-U", user,
      "-d", db,
      "-c", sql,
    ], {
      env: { ...process.env, PGPASSWORD: password },
      stdio: "pipe",
      timeout: 5000,
    });

    if (result.error) {
      console.warn(`[session-end] ⚠️  psql not found or failed: ${result.error.message}`);
    } else if (result.status !== 0) {
      console.warn(`[session-end] ⚠️  psql exited with code ${result.status}`);
    } else {
      console.log("[session-end] ✅ Session summary persisted to PostgreSQL");
    }
  } catch (e) {
    console.warn(`[session-end] ⚠️  Failed to persist to PostgreSQL: ${e.message}`);
  }
}

function main() {
  console.log("[session-end] 🔌 Running session-end ritual");

  const state = readState();
  const summary = generateSummary(state);

  appendSummaryToState(summary);
  persistToPostgres(state, summary);

  console.log("[session-end] ✅ Session-end ritual complete");
  process.exit(0);
}

main();
