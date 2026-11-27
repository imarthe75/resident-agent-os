import { spawnSync } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";

export interface TelemetryEvent {
  timestamp: string;
  service: string;
  source: string;
  level: string;
  session_id: string;
  correlation_id?: string;
  event: string;
  phase?: string | null;
  skill?: string | null;
  outcome?: string;
  duration_ms?: number | null;
  tokens_in?: number;
  tokens_out?: number;
  cost_usd?: number;
  retries?: number;
  chars_saved?: number;
  tokens_saved_est?: number;
  detail?: Record<string, unknown>;
}

export interface PhaseTraceItem {
  step: string;
  status: "pending" | "running" | "done" | "failed";
  duration_ms: number | null;
  outcome: string | null;
  timestamp?: string;
}

export interface SpecEntry {
  id: string;
  title: string;
  status: string;
}

export interface HeuristicRule {
  id: string;
  category: string;
  priority: number;
  action: string;
  description: string;
}

export interface ValkeyProbeResult {
  connected: boolean;
  host: string;
  port: number;
  latency_ms: number | null;
  dbsize: number | null;
  keys: Array<{ key: string; status: string }>;
  error: string | null;
}

export interface PostgresMemoryRow {
  id: string;
  project_id?: string;
  session_id: string;
  content: string;
  memory_type: string;
  importance_score: number;
  evidence_level: string;
  created_at: string;
}

export interface SessionSummaryRow {
  id: string;
  project_id?: string;
  session_id: string;
  summary: string;
  metrics: Record<string, unknown>;
  created_at: string;
}

export interface PostgresProbeResult {
  connected: boolean;
  host: string;
  port: number;
  database: string;
  latency_ms: number | null;
  projects: string[];
  memories: PostgresMemoryRow[];
  summaries: SessionSummaryRow[];
  error: string | null;
}

export interface HookSavingsRow {
  hook: string;
  events: number;
  chars_saved: number;
  tokens_saved_est: number;
  tokens_raw_est: number;
  tokens_filtered_est: number;
}

export interface SessionHistoryRow {
  session_id: string;
  started_at: string | null;
  ended_at: string | null;
  duration_ms: number;
  total_events: number;
  failed_phases: string[];
  retries: number;
  ecc_limit_breached: boolean;
  outcome: string;
  phase_trace: PhaseTraceItem[];
}

const LOOP_PHASES = [
  "boot",
  "load_context",
  "retrieve_memory",
  "ask_decisions",
  "apply_heuristics",
  "ensure_spec",
  "plan_tasks",
  "execute",
  "verify",
  "store_memory",
  "update_state",
] as const;

const SIGNAL_KEYS = [
  "latency_p95_ms",
  "error_rate",
  "cost_per_run_usd",
  "abstention_rate",
] as const;

export function getPaths() {
  const cwd = process.cwd();
  const repoCandidate = path.resolve(cwd, "..");
  const agentDir = process.env.AGENT_DIR
    ? path.resolve(process.env.AGENT_DIR)
    : fs.existsSync(path.join(cwd, ".agent"))
      ? path.join(cwd, ".agent")
      : path.join(repoCandidate, ".agent");
  const dataDir = process.env.DATA_DIR
    ? path.resolve(process.env.DATA_DIR)
    : fs.existsSync(path.join(cwd, "data"))
      ? path.join(cwd, "data")
      : path.join(repoCandidate, "data");
  const workspaceRoot = process.env.WORKSPACE_ROOT
    ? path.resolve(process.env.WORKSPACE_ROOT)
    : fs.existsSync(path.join(repoCandidate, "rules"))
      ? repoCandidate
      : cwd;
  const telemetryPath = process.env.ROS_TELEMETRY_PATH
    ? path.resolve(process.env.ROS_TELEMETRY_PATH)
    : path.join(agentDir, "telemetry", "events.jsonl");
  const fleetReportPath = process.env.FLEET_REPORT_PATH
    ? path.resolve(process.env.FLEET_REPORT_PATH)
    : path.join(dataDir, "fleet-status.json");

  return { agentDir, dataDir, workspaceRoot, telemetryPath, fleetReportPath };
}

export function readStateBlock(agentDir: string): {
  machineState: Record<string, unknown> | null;
  rawMarkdown: string;
  exists: boolean;
} {
  const statePath = path.join(agentDir, "STATE.md");
  if (!fs.existsSync(statePath)) {
    return { machineState: null, rawMarkdown: "", exists: false };
  }
  const rawMarkdown = fs.readFileSync(statePath, "utf-8");
  const match =
    rawMarkdown.match(/## 🤖 Estado de Máquina\s*```json\s*([\s\S]*?)\s*```/) ||
    rawMarkdown.match(/```json\s*([\s\S]*?)\s*```/);
  if (!match) {
    return { machineState: null, rawMarkdown, exists: true };
  }
  try {
    const parsed = JSON.parse(match[1].trim());
    return {
      machineState: parsed && typeof parsed === "object" ? parsed : null,
      rawMarkdown,
      exists: true,
    };
  } catch (err) {
    console.error(`[agentData] Invalid JSON block in ${statePath}:`, err);
    return { machineState: null, rawMarkdown, exists: true };
  }
}

export function parseSpecsMarkdown(markdown: string): SpecEntry[] {
  const specs: SpecEntry[] = [];
  const sections = markdown.split(/^###\s+/m).slice(1);
  for (const sec of sections) {
    const headerLine = sec.split("\n")[0] || "";
    const idMatch = headerLine.match(/^\[([^\]]+)\]\s*(.*)$/);
    if (!idMatch) continue;
    const statusMatch = sec.match(/-\s*\*\*Estado:\*\*\s*`?([^`\n]+)`?/i);
    specs.push({
      id: idMatch[1].trim(),
      title: idMatch[2].trim(),
      status: statusMatch ? statusMatch[1].trim() : "SIN_ESTADO",
    });
  }
  return specs;
}

export function readSpecs(agentDir: string): { markdown: string; specs: SpecEntry[]; exists: boolean } {
  const specsPath = path.join(agentDir, "SPECS.md");
  if (!fs.existsSync(specsPath)) {
    return { markdown: "", specs: [], exists: false };
  }
  const markdown = fs.readFileSync(specsPath, "utf-8");
  return { markdown, specs: parseSpecsMarkdown(markdown), exists: true };
}

export function saveSpecs(agentDir: string, markdown: string): { specs: SpecEntry[] } {
  fs.mkdirSync(agentDir, { recursive: true });
  const specsPath = path.join(agentDir, "SPECS.md");
  const tmpPath = path.join(agentDir, `.SPECS.${process.pid}.${Date.now()}.tmp`);
  fs.writeFileSync(tmpPath, markdown, "utf-8");
  fs.renameSync(tmpPath, specsPath);
  return { specs: parseSpecsMarkdown(markdown) };
}

export function readHeuristics(agentDir: string): HeuristicRule[] {
  const hPath = path.join(agentDir, "heuristics.json");
  if (!fs.existsSync(hPath)) return [];
  try {
    const data = JSON.parse(fs.readFileSync(hPath, "utf-8"));
    const rules = Array.isArray(data?.rules) ? data.rules : [];
    return rules
      .map((r: Record<string, unknown>) => ({
        id: String(r.id || ""),
        category: String(r.category || "general"),
        priority: Number(r.priority ?? 99),
        action: String(r.action || ""),
        description: String(r.description || ""),
      }))
      .sort((a: HeuristicRule, b: HeuristicRule) => a.priority - b.priority);
  } catch (err) {
    console.error(`[agentData] Failed to parse ${hPath}:`, err);
    return [];
  }
}

export function readProfile(agentDir: string): Record<string, unknown> {
  const pPath = path.join(agentDir, "PROFILE.json");
  if (!fs.existsSync(pPath)) return {};
  try {
    const parsed = JSON.parse(fs.readFileSync(pPath, "utf-8"));
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (err) {
    console.error(`[agentData] Failed to parse ${pPath}:`, err);
    return {};
  }
}

export function readThresholds(agentDir: string): Record<string, number> {
  const tPath = path.join(agentDir, "thresholds.json");
  if (!fs.existsSync(tPath)) return {};
  try {
    const raw = JSON.parse(fs.readFileSync(tPath, "utf-8"));
    const signals = raw && typeof raw === "object" && raw.signals ? raw.signals : raw;
    const out: Record<string, number> = {};
    if (signals && typeof signals === "object") {
      for (const [k, v] of Object.entries(signals)) {
        if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
      }
    }
    return out;
  } catch (err) {
    console.error(`[agentData] Failed to parse ${tPath}:`, err);
    return {};
  }
}

export function readTelemetryEvents(telemetryPath: string, limit = 200): TelemetryEvent[] {
  if (!fs.existsSync(telemetryPath)) return [];
  const rawLines = fs
    .readFileSync(telemetryPath, "utf-8")
    .split("\n")
    .filter((l) => l.trim().length > 0);
  const slice = limit > 0 ? rawLines.slice(-limit) : rawLines;
  const events: TelemetryEvent[] = [];
  for (const line of slice) {
    try {
      const obj = JSON.parse(line);
      if (obj && typeof obj === "object") events.push(obj as TelemetryEvent);
    } catch (err) {
      console.error("[agentData] Skipping malformed telemetry JSONL line:", err);
    }
  }
  return events;
}

function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.max(1, Math.ceil((p / 100) * sorted.length));
  return Number(sorted[Math.min(rank, sorted.length) - 1].toFixed(3));
}

export function summarizeTelemetry(events: TelemetryEvent[], thresholds: Record<string, number>) {
  const durations: number[] = [];
  let measuredRuns = 0;
  let errors = 0;
  let abstentions = 0;
  let tokensIn = 0;
  let tokensOut = 0;
  let costUsd = 0;
  let charsSaved = 0;
  let tokensSavedEst = 0;
  const sessions = new Set<string>();

  for (const ev of events) {
    if (ev.session_id) sessions.add(ev.session_id);
    tokensIn += Number(ev.tokens_in || 0);
    tokensOut += Number(ev.tokens_out || 0);
    costUsd += Number(ev.cost_usd || 0);
    charsSaved += Number(ev.chars_saved || 0);
    tokensSavedEst += Number(ev.tokens_saved_est || 0);
    if (ev.event === "health_check" || ev.event === "session_start" || ev.event === "session_end") {
      continue;
    }
    if (typeof ev.duration_ms === "number" && ev.duration_ms >= 0) {
      durations.push(ev.duration_ms);
    }
    if (ev.source === "loop" || ev.source === "hook") {
      measuredRuns++;
      const out = String(ev.outcome || "ok").toLowerCase();
      if (out === "error" || out === "failed" || out === "syntax_error") errors++;
      else if (out === "abstention" || out === "escalate_to_human" || out === "no_information") abstentions++;
    }
  }

  let latestLoopSession: string | null = null;
  for (let i = events.length - 1; i >= 0; i--) {
    if (events[i].source === "loop" && events[i].session_id) {
      latestLoopSession = events[i].session_id;
      break;
    }
  }
  const phaseMap = new Map<string, PhaseTraceItem>();
  for (const ev of events) {
    if (ev.source !== "loop") continue;
    if (latestLoopSession && ev.session_id !== latestLoopSession) continue;
    if (!ev.phase) continue;
    const out = String(ev.outcome || "ok");
    const status: PhaseTraceItem["status"] =
      out === "error" || out === "failed" ? "failed" : out === "running" ? "running" : "done";
    phaseMap.set(ev.phase, {
      step: ev.phase,
      status,
      duration_ms: typeof ev.duration_ms === "number" ? ev.duration_ms : null,
      outcome: out,
      timestamp: ev.timestamp,
    });
  }
  const phaseTrace: PhaseTraceItem[] = LOOP_PHASES.map(
    (ph) => phaseMap.get(ph) || { step: ph, status: "pending", duration_ms: null, outcome: null }
  );

  // Desglose real de ahorro por hooks (compress-output.js, run-filtered.js, codebase-map.js, etc.)
  const hookBuckets = new Map<string, HookSavingsRow>();
  let totalRawTokens = 0;
  let totalFilteredTokens = 0;
  let hookEventCount = 0;
  for (const ev of events) {
    if (ev.source !== "hook" && !ev.chars_saved && !ev.tokens_saved_est) continue;
    hookEventCount++;
    const hookName = String(ev.event || ev.phase || "hook");
    const detail = (ev.detail && typeof ev.detail === "object" ? ev.detail : {}) as Record<string, unknown>;
    const savedChars = Math.max(0, Number(ev.chars_saved || 0));
    const savedTok = Math.max(0, Number(ev.tokens_saved_est || Math.round(savedChars / 4)));
    const rawChars = Number(detail.chars_raw ?? detail.chars_before ?? detail.raw_chars ?? 0);
    const filteredChars = Number(detail.chars_after ?? detail.filtered_chars ?? 0);
    const rawTok =
      rawChars > 0
        ? Math.round(rawChars / 4)
        : filteredChars > 0
          ? Math.round((filteredChars + savedChars) / 4)
          : savedTok > 0
            ? savedTok
            : 0;
    const filtTok =
      filteredChars > 0 ? Math.round(filteredChars / 4) : Math.max(0, rawTok - savedTok);

    totalRawTokens += rawTok;
    totalFilteredTokens += filtTok;
    const prev = hookBuckets.get(hookName) || {
      hook: hookName,
      events: 0,
      chars_saved: 0,
      tokens_saved_est: 0,
      tokens_raw_est: 0,
      tokens_filtered_est: 0,
    };
    prev.events += 1;
    prev.chars_saved += savedChars;
    prev.tokens_saved_est += savedTok;
    prev.tokens_raw_est += rawTok;
    prev.tokens_filtered_est += filtTok;
    hookBuckets.set(hookName, prev);
  }

  // Historial por session_id desde events.jsonl
  const bySession = new Map<string, TelemetryEvent[]>();
  for (const ev of events) {
    const sid = ev.session_id || "sin-sesion";
    const arr = bySession.get(sid) || [];
    arr.push(ev);
    bySession.set(sid, arr);
  }
  const sessionsHistory: SessionHistoryRow[] = Array.from(bySession.entries())
    .map(([sid, sEvents]) => {
      const sPhaseMap = new Map<string, PhaseTraceItem>();
      const failedSet = new Set<string>();
      let dur = 0;
      let maxRetries = 0;
      let hasError = false;
      for (const ev of sEvents) {
        if (typeof ev.duration_ms === "number" && ev.duration_ms > 0) dur += ev.duration_ms;
        if (typeof ev.retries === "number" && ev.retries > maxRetries) maxRetries = ev.retries;
        const out = String(ev.outcome || "ok").toLowerCase();
        if (out === "error" || out === "failed" || out === "syntax_error") {
          hasError = true;
          if (ev.phase) failedSet.add(ev.phase);
        }
        if (ev.source === "loop" && ev.phase) {
          const st: PhaseTraceItem["status"] =
            out === "error" || out === "failed" ? "failed" : out === "running" ? "running" : "done";
          sPhaseMap.set(ev.phase, {
            step: ev.phase,
            status: st,
            duration_ms: typeof ev.duration_ms === "number" ? ev.duration_ms : null,
            outcome: out,
            timestamp: ev.timestamp,
          });
        }
      }
      return {
        session_id: sid,
        started_at: sEvents[0]?.timestamp || null,
        ended_at: sEvents[sEvents.length - 1]?.timestamp || null,
        duration_ms: Number(dur.toFixed(2)),
        total_events: sEvents.length,
        failed_phases: Array.from(failedSet),
        retries: maxRetries,
        ecc_limit_breached: maxRetries >= 3,
        outcome: hasError ? "con_errores" : "ok",
        phase_trace: LOOP_PHASES.map(
          (ph): PhaseTraceItem =>
            sPhaseMap.get(ph) || { step: ph, status: "pending", duration_ms: null, outcome: null }
        ),
      };
    })
    .reverse();

  const summary = {
    total_events: events.length,
    sessions: sessions.size,
    measured_runs: measuredRuns,
    errors,
    error_rate: measuredRuns ? Number((errors / measuredRuns).toFixed(4)) : null,
    abstentions,
    abstention_rate: measuredRuns ? Number((abstentions / measuredRuns).toFixed(4)) : null,
    latency_avg_ms: durations.length
      ? Number((durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(3))
      : null,
    latency_p95_ms: percentile(durations, 95),
    total_tokens_in: tokensIn,
    total_tokens_out: tokensOut,
    total_cost_usd: Number(costUsd.toFixed(6)),
    cost_per_run_usd: measuredRuns ? Number((costUsd / measuredRuns).toFixed(6)) : null,
    chars_saved_by_hooks: charsSaved,
    tokens_saved_by_hooks_est: tokensSavedEst,
    hook_savings: {
      available: hookEventCount > 0,
      total_events: hookEventCount,
      chars_saved: charsSaved,
      tokens_saved_est: tokensSavedEst,
      tokens_raw_est: totalRawTokens,
      tokens_filtered_est: totalFilteredTokens,
      by_hook: Array.from(hookBuckets.values()).sort((a, b) => b.tokens_saved_est - a.tokens_saved_est),
    },
    sessions_history: sessionsHistory,
    last_event_at: events.length ? events[events.length - 1].timestamp : null,
    phase_trace: phaseTrace,
  };

  const checks: Record<string, { status: string; measured: number | null; threshold: number | null }> = {};
  const breaches: string[] = [];
  for (const key of SIGNAL_KEYS) {
    const measured = summary[key];
    const limit = typeof thresholds[key] === "number" ? thresholds[key] : null;
    if (limit === null) {
      checks[key] = { status: "NO_MONITOREADA", measured, threshold: null };
    } else if (measured === null) {
      checks[key] = { status: "SIN_DATOS", measured: null, threshold: limit };
    } else if (measured > limit) {
      checks[key] = { status: "ALERTA", measured, threshold: limit };
      breaches.push(`${key}=${measured} supera umbral ${limit}`);
    } else {
      checks[key] = { status: "OK", measured, threshold: limit };
    }
  }

  return {
    summary,
    evaluation: {
      status: breaches.length > 0 ? "ALERTA" : measuredRuns === 0 ? "SIN_DATOS" : "OK",
      breaches,
      checks,
    },
  };
}

function sendRespCommands(host: string, port: number, commands: string[][], timeoutMs = 1500): Promise<string> {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port });
    let buffer = "";
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error(`timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    socket.on("connect", () => {
      const payload = commands
        .map((args) => `*${args.length}\r\n` + args.map((a) => `$${Buffer.byteLength(a)}\r\n${a}\r\n`).join(""))
        .join("");
      socket.write(payload);
    });
    socket.on("data", (chunk) => {
      buffer += chunk.toString("utf-8");
      if (buffer.includes("+OK\r\n") || buffer.includes("+PONG\r\n")) {
        if (commands.length === 1 || buffer.split("\r\n").length >= commands.length * 2) {
          clearTimeout(timer);
          socket.end();
          resolve(buffer);
        }
      }
    });
    socket.on("end", () => {
      clearTimeout(timer);
      resolve(buffer);
    });
    socket.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

export async function probeValkey(includeKeys = false): Promise<ValkeyProbeResult> {
  const host = process.env.VALKEY_HOST || "127.0.0.1";
  const port = parseInt(process.env.VALKEY_PORT || "6379", 10);
  const t0 = Date.now();
  try {
    const cmds = includeKeys ? [["PING"], ["DBSIZE"], ["SCAN", "0", "COUNT", "50"], ["QUIT"]] : [["PING"], ["QUIT"]];
    const raw = await sendRespCommands(host, port, cmds);
    if (!raw.includes("+PONG")) {
      return {
        connected: false,
        host,
        port,
        latency_ms: Date.now() - t0,
        dbsize: null,
        keys: [],
        error: "Unexpected response from Valkey",
      };
    }
    let dbsize: number | null = null;
    const keys: Array<{ key: string; status: string }> = [];
    if (includeKeys) {
      const dbMatch = raw.match(/:(\d+)\r\n/);
      if (dbMatch) dbsize = parseInt(dbMatch[1], 10);
      const scanIdx = raw.indexOf("*2\r\n");
      if (scanIdx !== -1) {
        const lines = raw.slice(scanIdx).split("\r\n");
        let inArray = false;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith("*") && i > 0) {
            inArray = true;
            continue;
          }
          if (inArray && lines[i].startsWith("$") && lines[i + 1] !== undefined) {
            const k = lines[i + 1];
            if (k && k !== "OK") keys.push({ key: k, status: "active" });
            i++;
          }
        }
      }
    }
    return {
      connected: true,
      host,
      port,
      latency_ms: Date.now() - t0,
      dbsize,
      keys,
      error: null,
    };
  } catch (err) {
    return {
      connected: false,
      host,
      port,
      latency_ms: Date.now() - t0,
      dbsize: null,
      keys: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function tcpProbe(host: string, port: number, timeoutMs = 1500): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port });
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error(`timeout after ${timeoutMs}ms`));
    }, timeoutMs);
    socket.on("connect", () => {
      clearTimeout(timer);
      socket.end();
      resolve();
    });
    socket.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

export async function probePostgres(includeRows = false, projectId?: string | null): Promise<PostgresProbeResult> {
  const host = process.env.POSTGRES_HOST || "127.0.0.1";
  const port = parseInt(process.env.POSTGRES_PORT || "5432", 10);
  const user = process.env.POSTGRES_USER || "admin";
  const database = process.env.POSTGRES_DB || "db_resident_knowledge";
  const password = process.env.POSTGRES_PASSWORD || "";
  const t0 = Date.now();

  try {
    await tcpProbe(host, port);
  } catch (err) {
    return {
      connected: false,
      host,
      port,
      database,
      latency_ms: Date.now() - t0,
      projects: [],
      memories: [],
      summaries: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }

  if (!includeRows) {
    return {
      connected: true,
      host,
      port,
      database,
      latency_ms: Date.now() - t0,
      projects: [],
      memories: [],
      summaries: [],
      error: password ? null : "TCP reachable (POSTGRES_PASSWORD not configured for SQL queries)",
    };
  }

  if (!password) {
    return {
      connected: true,
      host,
      port,
      database,
      latency_ms: Date.now() - t0,
      projects: [],
      memories: [],
      summaries: [],
      error: "POSTGRES_PASSWORD not configured in resident-ui environment",
    };
  }

  const cleanProject = projectId && /^[A-Za-z0-9._-]+$/.test(projectId) ? projectId : "";
  const sql = `
SELECT json_build_object(
  'projects', COALESCE((
    SELECT json_agg(project_id ORDER BY project_id) FROM (
      SELECT DISTINCT project_id FROM memory.agent_memory WHERE project_id IS NOT NULL AND project_id <> ''
      UNION
      SELECT DISTINCT project_id FROM memory.session_summaries WHERE project_id IS NOT NULL AND project_id <> ''
    ) p
  ), '[]'::json),
  'memories', COALESCE((
    SELECT json_agg(t) FROM (
      SELECT id::text, project_id, session_id::text, content, memory_type, importance_score, evidence_level, fccreacion::text AS created_at
      FROM memory.agent_memory
      WHERE (:'project_id' = '' OR project_id = :'project_id')
      ORDER BY fccreacion DESC
      LIMIT 30
    ) t
  ), '[]'::json),
  'summaries', COALESCE((
    SELECT json_agg(s) FROM (
      SELECT id::text, project_id, session_id::text, summary, metrics, created_at::text
      FROM memory.session_summaries
      WHERE (:'project_id' = '' OR project_id = :'project_id')
      ORDER BY created_at DESC
      LIMIT 20
    ) s
  ), '[]'::json)
)::text;
`.trim();

  const res = spawnSync(
    "psql",
    [
      "-t", "-A",
      "-v", "ON_ERROR_STOP=1",
      "-v", `project_id=${cleanProject}`,
      "-h", host, "-p", String(port), "-U", user, "-d", database,
    ],
    { input: sql + "\n", env: { ...process.env, PGPASSWORD: password }, encoding: "utf-8", timeout: 4000 }
  );

  if (res.error || res.status !== 0) {
    const errMsg = res.error ? res.error.message : (res.stderr || "").trim().slice(0, 240);
    return {
      connected: false,
      host,
      port,
      database,
      latency_ms: Date.now() - t0,
      projects: [],
      memories: [],
      summaries: [],
      error: errMsg || "psql query failed",
    };
  }

  try {
    const parsed = JSON.parse((res.stdout || "{}").trim());
    return {
      connected: true,
      host,
      port,
      database,
      latency_ms: Date.now() - t0,
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      memories: Array.isArray(parsed.memories) ? parsed.memories : [],
      summaries: Array.isArray(parsed.summaries) ? parsed.summaries : [],
      error: null,
    };
  } catch (err) {
    return {
      connected: false,
      host,
      port,
      database,
      latency_ms: Date.now() - t0,
      projects: [],
      memories: [],
      summaries: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

const ALLOWED_WORKSPACE_ROOTS = [".agent", "rules", "changes", "DECISIONS"];

export function listWorkspaceFiles(workspaceRoot: string, agentDir: string): string[] {
  const files: string[] = [];
  const walk = (base: string, prefix: string, depth: number) => {
    if (depth > 3 || !fs.existsSync(base)) return;
    for (const entry of fs.readdirSync(base, { withFileTypes: true })) {
      if (entry.name.startsWith(".") && entry.name !== ".agent") continue;
      if (entry.name === "telemetry" || entry.name === "node_modules") continue;
      const full = path.join(base, entry.name);
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(full, rel, depth + 1);
      else if (entry.isFile() && /\.(md|json|yml|yaml|txt)$/i.test(entry.name)) {
        files.push(rel);
      }
    }
  };

  walk(agentDir, ".agent", 0);
  for (const dir of ALLOWED_WORKSPACE_ROOTS.filter((d) => d !== ".agent")) {
    walk(path.join(workspaceRoot, dir), dir, 0);
  }
  return files.sort();
}

export function readWorkspaceFile(workspaceRoot: string, agentDir: string, relPath: string): { path: string; content: string } | null {
  const normalized = relPath.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!normalized || normalized.includes("..")) return null;
  const top = normalized.split("/")[0];
  if (!ALLOWED_WORKSPACE_ROOTS.includes(top)) return null;

  const baseDir = top === ".agent" ? agentDir : path.join(workspaceRoot, top);
  const subRel = normalized.slice(top.length + 1);
  const full = path.resolve(baseDir, subRel);
  const resolvedBase = path.resolve(baseDir);
  if (!full.startsWith(resolvedBase + path.sep) && full !== resolvedBase) return null;
  if (!fs.existsSync(full) || !fs.statSync(full).isFile()) return null;
  return { path: normalized, content: fs.readFileSync(full, "utf-8") };
}

export function readFleetReport(fleetReportPath: string) {
  if (!fs.existsSync(fleetReportPath)) {
    return {
      available: false,
      generated_at: null,
      source: null,
      totals: null,
      repos: [],
      message: `No existe ${fleetReportPath}. Genera el reporte con: python scripts/fleet_status.py --parent <dir> --out data/fleet-status.json`,
    };
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(fleetReportPath, "utf-8"));
    return { available: true, ...parsed };
  } catch (err) {
    console.error(`[agentData] Failed to parse fleet report ${fleetReportPath}:`, err);
    return {
      available: false,
      generated_at: null,
      source: null,
      totals: null,
      repos: [],
      message: `Reporte de flota ilegible en ${fleetReportPath}`,
    };
  }
}
