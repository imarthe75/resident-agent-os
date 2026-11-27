import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export interface VerifierItem {
  verifier: string;
  status: "CUMPLE" | "NO_CUMPLE" | "NO_EVALUADO" | string;
  method: string;
  detail: string[];
  checked: number;
}

export interface PublicRouteEntry {
  raw: string;
  method: string;
  route: string;
  reason: string;
}

export interface GateFileEntry {
  name: string;
  content: string;
}

const OFFLINE_VERIFIERS = [
  "pk_uuid",
  "compose_volumes",
  "audit_triggers",
  "endpoints_auth",
  "no_stubs",
  "tests_isolated",
  "no_silent_except",
  "webhooks_fail_closed",
  "spec_traceability",
  "observability_min",
  "observability_production",
];

function readJsonSafe<T>(filePath: string): { ok: true; data: T } | { ok: false; error: string } {
  if (!fs.existsSync(filePath)) return { ok: false, error: "Archivo no encontrado" };
  try {
    return { ok: true, data: JSON.parse(fs.readFileSync(filePath, "utf-8")) as T };
  } catch (err) {
    console.error(`[workspaceInspector] Invalid JSON in ${filePath}:`, err);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export function parseFrontmatter(markdown: string): { meta: Record<string, string>; body: string } {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { meta: {}, body: markdown };
  const meta: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const idx = line.indexOf(":");
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    if (key) meta[key] = val;
  }
  return { meta, body: match[2] };
}

export function readPublicRoutes(agentDir: string): { exists: boolean; path: string; entries: PublicRouteEntry[] } {
  const filePath = path.join(agentDir, "public-routes.txt");
  if (!fs.existsSync(filePath)) {
    return { exists: false, path: filePath, entries: [] };
  }
  const entries: PublicRouteEntry[] = [];
  for (const line of fs.readFileSync(filePath, "utf-8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [routePart, ...reasonParts] = trimmed.split("#");
    const tokens = routePart.trim().split(/\s+/);
    const method = tokens.length >= 2 ? tokens[0].toUpperCase() : "ANY";
    const route = tokens.length >= 2 ? tokens.slice(1).join(" ") : tokens[0] || "";
    entries.push({
      raw: trimmed,
      method,
      route,
      reason: reasonParts.join("#").trim() || "Sin motivo anotado",
    });
  }
  return { exists: true, path: filePath, entries };
}

export function readStageGates(agentDir: string): GateFileEntry[] {
  const gatesDir = path.join(agentDir, "gates");
  if (!fs.existsSync(gatesDir)) return [];
  const out: GateFileEntry[] = [];
  for (const entry of fs.readdirSync(gatesDir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isFile() || !/\.(yml|yaml)$/i.test(entry.name)) continue;
    try {
      out.push({
        name: entry.name,
        content: fs.readFileSync(path.join(gatesDir, entry.name), "utf-8"),
      });
    } catch (err) {
      console.error(`[workspaceInspector] Failed reading gate ${entry.name}:`, err);
    }
  }
  return out;
}

function summarizeVerifiers(results: VerifierItem[]) {
  return {
    total: results.length,
    cumple: results.filter((r) => r.status === "CUMPLE").length,
    no_cumple: results.filter((r) => r.status === "NO_CUMPLE").length,
    no_evaluado: results.filter((r) => r.status === "NO_EVALUADO").length,
  };
}

const lastVerifiersRunCache = new Map<
  string,
  { generated_at: string; with_network: boolean; results: VerifierItem[] }
>();

export function readVerifiersReport(workspaceRoot: string, agentDir: string, dataDir: string) {
  const reportPath = path.join(dataDir, "verifiers-report.json");
  const publicRoutes = readPublicRoutes(agentDir);
  const gates = readStageGates(agentDir);
  const runnerExists = fs.existsSync(path.join(workspaceRoot, "verifiers", "run.py"));

  const parsed = readJsonSafe<{ generated_at?: string; with_network?: boolean; results?: VerifierItem[] }>(reportPath);
  if (!parsed.ok) {
    const cached = lastVerifiersRunCache.get(path.resolve(dataDir));
    if (cached) {
      return {
        available: true,
        runner_available: runnerExists,
        generated_at: cached.generated_at,
        with_network: cached.with_network,
        counts: summarizeVerifiers(cached.results),
        results: cached.results,
        public_routes: publicRoutes,
        gates,
        command: "python3 verifiers/run.py --path . --json > data/verifiers-report.json",
      };
    }
    return {
      available: false,
      runner_available: runnerExists,
      generated_at: null,
      with_network: false,
      counts: { total: 0, cumple: 0, no_cumple: 0, no_evaluado: 0 },
      results: [] as VerifierItem[],
      public_routes: publicRoutes,
      gates,
      command: "python3 verifiers/run.py --path . --json > data/verifiers-report.json",
    };
  }

  const results = Array.isArray(parsed.data.results) ? parsed.data.results : [];
  return {
    available: true,
    runner_available: runnerExists,
    generated_at: parsed.data.generated_at || fs.statSync(reportPath).mtime.toISOString(),
    with_network: Boolean(parsed.data.with_network),
    counts: summarizeVerifiers(results),
    results,
    public_routes: publicRoutes,
    gates,
    command: "python3 verifiers/run.py --path . --json > data/verifiers-report.json",
  };
}

export function runVerifiersNow(
  workspaceRoot: string,
  agentDir: string,
  dataDir: string,
  withNetwork = false
) {
  const scriptPath = path.join(workspaceRoot, "verifiers", "run.py");
  if (!fs.existsSync(scriptPath)) {
    return {
      ok: false,
      error: `No se encontró verifiers/run.py en ${workspaceRoot}`,
      report: readVerifiersReport(workspaceRoot, agentDir, dataDir),
    };
  }

  const args = [scriptPath, "--path", workspaceRoot, "--json"];
  if (!withNetwork) {
    args.push("--only", OFFLINE_VERIFIERS.join(","));
  }

  const res = spawnSync("python3", args, {
    encoding: "utf-8",
    timeout: withNetwork ? 45000 : 25000,
    env: { ...process.env, PYTHONPATH: workspaceRoot },
  });

  if (res.error) {
    console.error("[workspaceInspector] Failed running verifiers/run.py:", res.error);
    return {
      ok: false,
      error: `No se pudo ejecutar python3 verifiers/run.py: ${res.error.message}`,
      report: readVerifiersReport(workspaceRoot, agentDir, dataDir),
    };
  }

  const stdout = (res.stdout || "").trim();
  let results: VerifierItem[] = [];
  try {
    const parsed = JSON.parse(stdout);
    results = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.results) ? parsed.results : [];
  } catch (err) {
    console.error("[workspaceInspector] Invalid JSON from verifiers/run.py:", err, res.stderr);
    return {
      ok: false,
      error: `Salida inválida de verifiers/run.py: ${(res.stderr || stdout).slice(0, 240)}`,
      report: readVerifiersReport(workspaceRoot, agentDir, dataDir),
    };
  }

  const generatedAt = new Date().toISOString();
  const payload = { generated_at: generatedAt, with_network: withNetwork, results };
  lastVerifiersRunCache.set(path.resolve(dataDir), payload);
  try {
    fs.mkdirSync(dataDir, { recursive: true });
    const reportPath = path.join(dataDir, "verifiers-report.json");
    const tmpPath = path.join(dataDir, `.verifiers.${process.pid}.${Date.now()}.tmp`);
    fs.writeFileSync(tmpPath, JSON.stringify(payload, null, 2) + "\n", "utf-8");
    fs.renameSync(tmpPath, reportPath);
  } catch (err) {
    console.error("[workspaceInspector] Could not persist data/verifiers-report.json:", err);
  }

  return {
    ok: true,
    error: null,
    report: {
      available: true,
      runner_available: true,
      generated_at: generatedAt,
      with_network: withNetwork,
      counts: summarizeVerifiers(results),
      results,
      public_routes: readPublicRoutes(agentDir),
      gates: readStageGates(agentDir),
      command: "python3 verifiers/run.py --path . --json > data/verifiers-report.json",
    },
  };
}

function checkRuntimeVersion(bin: string, args = ["--version"]): { available: boolean; version: string | null } {
  const res = spawnSync(bin, args, { encoding: "utf-8", timeout: 2500 });
  if (res.error || res.status !== 0) return { available: false, version: null };
  const line = `${res.stdout || ""}\n${res.stderr || ""}`.trim().split(/\r?\n/)[0] || "";
  return { available: true, version: line.slice(0, 80) || "disponible" };
}

export function inspectDoctor(workspaceRoot: string, agentDir: string) {
  const runtimes = {
    python: checkRuntimeVersion("python3"),
    node: checkRuntimeVersion("node"),
    git: checkRuntimeVersion("git"),
    psql: checkRuntimeVersion("psql"),
  };

  const detected_hosts = {
    claude:
      fs.existsSync(path.join(workspaceRoot, ".claude", "settings.json")) ||
      fs.existsSync(path.join(workspaceRoot, "CLAUDE.md")),
    gemini:
      fs.existsSync(path.join(workspaceRoot, ".gemini", "settings.json")) ||
      fs.existsSync(path.join(workspaceRoot, ".agents", "skills")),
    antigravity:
      fs.existsSync(path.join(workspaceRoot, ".agents", "skills")) ||
      fs.existsSync(path.join(workspaceRoot, "AGENTS.md")),
    codex: fs.existsSync(path.join(workspaceRoot, "AGENTS.md")),
    cursor: fs.existsSync(path.join(workspaceRoot, ".cursor", "rules")),
    copilot: fs.existsSync(path.join(workspaceRoot, ".github", "copilot-instructions.md")),
    opencode:
      fs.existsSync(path.join(workspaceRoot, ".opencode")) ||
      fs.existsSync(path.join(workspaceRoot, "AGENTS.md")),
    mcp: fs.existsSync(path.join(workspaceRoot, ".mcp.json")),
  };

  // Hooks configurados en .claude/settings.json
  const settingsPath = path.join(workspaceRoot, ".claude", "settings.json");
  const hooksList: Array<{ event: string; matcher: string; command: string }> = [];
  let statusLine: string | null = null;
  const settingsParsed = readJsonSafe<Record<string, unknown>>(settingsPath);
  if (settingsParsed.ok) {
    const rawHooks = settingsParsed.data.hooks;
    if (rawHooks && typeof rawHooks === "object") {
      for (const [event, entries] of Object.entries(rawHooks as Record<string, unknown>)) {
        if (!Array.isArray(entries)) continue;
        for (const item of entries) {
          if (!item || typeof item !== "object") continue;
          const rec = item as Record<string, unknown>;
          const matcher = typeof rec.matcher === "string" ? rec.matcher : "*";
          const innerHooks = Array.isArray(rec.hooks) ? rec.hooks : [];
          for (const h of innerHooks) {
            if (h && typeof h === "object" && typeof (h as Record<string, unknown>).command === "string") {
              hooksList.push({ event, matcher, command: String((h as Record<string, unknown>).command) });
            }
          }
        }
      }
    }
    const sl = settingsParsed.data.statusLine as Record<string, unknown> | undefined;
    if (sl && typeof sl.command === "string") statusLine = sl.command;
  }

  // Estado de sincronización SSOT .agents/ -> .claude/
  let host_sync: {
    checked: boolean;
    in_sync: boolean;
    missing: string[];
    drifted: string[];
    reason?: string;
  } = { checked: false, in_sync: true, missing: [], drifted: [] };

  const hasClaudeDirs = ["agents", "commands", "skills"].some((s) =>
    fs.existsSync(path.join(workspaceRoot, ".claude", s))
  );
  const syncScript = path.join(workspaceRoot, "scripts", "sync_agent_dirs.py");
  if (hasClaudeDirs && fs.existsSync(syncScript) && runtimes.python.available) {
    const activeSections = ["agents", "commands", "skills"].filter((s) =>
      fs.existsSync(path.join(workspaceRoot, ".claude", s))
    );
    const res = spawnSync(
      "python3",
      [syncScript, "--target", workspaceRoot, "--only", activeSections.join(","), "--check", "--json"],
      { encoding: "utf-8", timeout: 10000, env: { ...process.env, PYTHONPATH: workspaceRoot } }
    );
    if (!res.error && res.stdout) {
      try {
        const parsed = JSON.parse(res.stdout);
        host_sync = {
          checked: true,
          in_sync: Boolean(parsed.in_sync),
          missing: Array.isArray(parsed.missing) ? parsed.missing : [],
          drifted: Array.isArray(parsed.drifted) ? parsed.drifted : [],
        };
      } catch (err) {
        console.error("[workspaceInspector] Failed parsing sync_agent_dirs output:", err);
        host_sync = {
          checked: false,
          in_sync: true,
          missing: [],
          drifted: [],
          reason: "No se pudo interpretar la salida de sync_agent_dirs.py",
        };
      }
    }
  } else if (!hasClaudeDirs) {
    host_sync.reason = "No hay proyecciones en .claude/{agents,commands,skills} en este espacio";
  }

  const agent_files = {
    agent_dir: fs.existsSync(agentDir),
    state_md: fs.existsSync(path.join(agentDir, "STATE.md")),
    specs_md: fs.existsSync(path.join(agentDir, "SPECS.md")),
    heuristics_json: fs.existsSync(path.join(agentDir, "heuristics.json")),
    thresholds_json: fs.existsSync(path.join(agentDir, "thresholds.json")),
    path_rules_json: fs.existsSync(path.join(agentDir, "path-rules.json")),
    model_routing_json: fs.existsSync(path.join(agentDir, "model-routing.json")),
  };

  return {
    workspace_root: workspaceRoot,
    agent_dir: agentDir,
    runtimes,
    detected_hosts,
    host_sync,
    hooks: hooksList,
    status_line: statusLine,
    agent_files,
  };
}

export function readModelRouting(workspaceRoot: string, agentDir: string) {
  const routingPath = fs.existsSync(path.join(agentDir, "model-routing.json"))
    ? path.join(agentDir, "model-routing.json")
    : path.join(workspaceRoot, ".agent", "model-routing.json");

  const parsed = readJsonSafe<{
    default_tier?: string;
    tiers?: Record<string, { description?: string; providers?: Record<string, string> }>;
    agents?: Record<string, { tier?: string; escalate_to?: string; reason?: string }>;
    tasks?: Record<string, string>;
  }>(routingPath);

  if (!parsed.ok) {
    return {
      available: false,
      path: routingPath,
      error: parsed.error,
      default_tier: "balanced",
      tiers: {},
      agents: [],
      tasks: {},
    };
  }

  const cfg = parsed.data;
  const tiers = cfg.tiers || {};
  const agentsCfg = cfg.agents || {};
  const defaultTier = cfg.default_tier || "balanced";

  // Leer subagentes canónicos de agents/*.md
  const agentsDir = path.join(workspaceRoot, "agents");
  const diskAgents = new Map<string, { file: string; description: string; tools: string; tier?: string }>();
  if (fs.existsSync(agentsDir)) {
    for (const entry of fs.readdirSync(agentsDir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
      const raw = fs.readFileSync(path.join(agentsDir, entry.name), "utf-8");
      const { meta } = parseFrontmatter(raw);
      const name = meta.name || entry.name.replace(/\.md$/, "");
      diskAgents.set(name, {
        file: `agents/${entry.name}`,
        description: meta.description || "",
        tools: meta.tools || "",
        tier: meta.tier,
      });
    }
  }

  const allNames = Array.from(new Set([...Object.keys(agentsCfg), ...diskAgents.keys()])).sort();
  const agents = allNames.map((name) => {
    const conf = agentsCfg[name] || {};
    const disk = diskAgents.get(name);
    const tier = conf.tier || disk?.tier || defaultTier;
    const providers = tiers[tier]?.providers || {};
    return {
      name,
      file: disk?.file || null,
      description: disk?.description || "",
      tools: disk?.tools || "",
      tier,
      escalate_to: conf.escalate_to || null,
      reason: conf.reason || "",
      providers,
    };
  });

  return {
    available: true,
    path: routingPath,
    error: null,
    default_tier: defaultTier,
    tiers,
    agents,
    tasks: cfg.tasks || {},
  };
}

export function readCapabilities(workspaceRoot: string, agentDir: string) {
  // 1. Skills (.agents/skills primero; si no existe, skills/ en raíz)
  const agentsSkillsDir = path.join(workspaceRoot, ".agents", "skills");
  const rootSkillsDir = path.join(workspaceRoot, "skills");
  const skillsSourceDir = fs.existsSync(agentsSkillsDir)
    ? agentsSkillsDir
    : fs.existsSync(rootSkillsDir)
      ? rootSkillsDir
      : null;

  const skills: Array<{ name: string; description: string; path: string }> = [];
  if (skillsSourceDir) {
    for (const entry of fs.readdirSync(skillsSourceDir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (!entry.isDirectory()) continue;
      const skillFile = path.join(skillsSourceDir, entry.name, "SKILL.md");
      if (!fs.existsSync(skillFile)) continue;
      try {
        const raw = fs.readFileSync(skillFile, "utf-8");
        const { meta, body } = parseFrontmatter(raw);
        const fallbackSummary =
          body
            .split(/\r?\n/)
            .map((l) => l.trim())
            .find((l) => l && !l.startsWith("#")) || "";
        skills.push({
          name: meta.name || entry.name,
          description: meta.description || fallbackSummary,
          path: path.relative(workspaceRoot, skillFile).replace(/\\/g, "/"),
        });
      } catch (err) {
        console.error(`[workspaceInspector] Failed reading skill ${skillFile}:`, err);
      }
    }
  }

  // 2. Comandos slash (commands/*.md)
  const commandsDir = path.join(workspaceRoot, "commands");
  const commands: Array<{ command: string; title: string; summary: string; path: string }> = [];
  if (fs.existsSync(commandsDir)) {
    for (const entry of fs.readdirSync(commandsDir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
      const full = path.join(commandsDir, entry.name);
      try {
        const raw = fs.readFileSync(full, "utf-8");
        const { meta, body } = parseFrontmatter(raw);
        const lines = body.split(/\r?\n/).map((l) => l.trim());
        const heading = lines.find((l) => l.startsWith("#"))?.replace(/^#+\s*/, "") || entry.name.replace(/\.md$/, "");
        const summary =
          meta.description ||
          lines.find((l) => l && !l.startsWith("#") && !l.startsWith("```") && !l.startsWith("---")) ||
          "";
        commands.push({
          command: `/${entry.name.replace(/\.md$/, "")}`,
          title: heading,
          summary,
          path: `commands/${entry.name}`,
        });
      } catch (err) {
        console.error(`[workspaceInspector] Failed reading command ${full}:`, err);
      }
    }
  }

  // 3. Reglas por ruta (.agent/path-rules.json)
  const pathRulesFile = path.join(agentDir, "path-rules.json");
  const pathRulesParsed = readJsonSafe<{ rules?: Array<Record<string, unknown>> } | Array<Record<string, unknown>>>(pathRulesFile);
  const path_rules: Array<{ id: string; severity: string; globs: string[]; instructions: string }> = [];
  if (pathRulesParsed.ok) {
    const rawList = Array.isArray(pathRulesParsed.data)
      ? pathRulesParsed.data
      : Array.isArray(pathRulesParsed.data?.rules)
        ? pathRulesParsed.data.rules
        : [];
    for (const item of rawList) {
      if (!item || typeof item !== "object") continue;
      const globs = Array.isArray(item.globs)
        ? item.globs.map(String)
        : Array.isArray(item.paths)
          ? item.paths.map(String)
          : typeof item.glob === "string"
            ? [item.glob]
            : [];
      const instructions =
        typeof item.instructions === "string"
          ? item.instructions
          : typeof item.rule === "string"
            ? item.rule
            : typeof item.description === "string"
              ? item.description
              : Array.isArray(item.checks)
                ? item.checks.map(String).join(" · ")
                : "";
      path_rules.push({
        id: String(item.id || item.name || "regla"),
        severity: String(item.severity || "MEDIUM").toUpperCase(),
        globs,
        instructions,
      });
    }
  }

  return {
    skills_source: skillsSourceDir ? path.relative(workspaceRoot, skillsSourceDir).replace(/\\/g, "/") : null,
    counts: {
      skills: skills.length,
      commands: commands.length,
      path_rules: path_rules.length,
    },
    skills,
    commands,
    path_rules,
  };
}

export function readDependenciesHealth(agentDir: string, dataDir: string) {
  const policyPath = path.join(agentDir, "versions-policy.json");
  const policyParsed = readJsonSafe<{ tools?: Record<string, Record<string, string>> }>(policyPath);
  const policy_tools = policyParsed.ok && policyParsed.data.tools
    ? Object.entries(policyParsed.data.tools).map(([name, info]) => ({
        name,
        source: info.source || "",
        package: info.package || info.product || name,
        channel: info.channel || "latest",
        with: info.with || null,
      }))
    : [];

  const reportPath = path.join(dataDir, "outdated-dependencies.json");
  const reportParsed = readJsonSafe<{
    summary?: string;
    exit?: number;
    dependencies?: Array<{
      ecosystem: string;
      file: string;
      name: string;
      current: string | null;
      latest: string | null;
      target: string | null;
      lag: string | null;
      unresolved: string | null;
      note: string;
      deprecated: boolean;
    }>;
  }>(reportPath);

  const command = "python3 scripts/outdated_dependencies.py --path . --json > data/outdated-dependencies.json";

  if (!reportParsed.ok) {
    return {
      report_available: false,
      generated_at: null,
      summary: null,
      counts: { total: 0, obsoletas: 0, mayor: 0, menor: 0, parche: 0, sin_resolver: 0, al_dia: 0 },
      dependencies: [],
      policy_tools,
      command,
    };
  }

  const deps = Array.isArray(reportParsed.data.dependencies) ? reportParsed.data.dependencies : [];
  const counts = {
    total: deps.length,
    obsoletas: deps.filter((d) => d.deprecated).length,
    mayor: deps.filter((d) => !d.deprecated && d.lag === "major").length,
    menor: deps.filter((d) => !d.deprecated && d.lag === "minor").length,
    parche: deps.filter((d) => !d.deprecated && d.lag === "patch").length,
    sin_resolver: deps.filter((d) => Boolean(d.unresolved)).length,
    al_dia: deps.filter((d) => !d.deprecated && !d.unresolved && !d.lag).length,
  };

  return {
    report_available: true,
    generated_at: fs.statSync(reportPath).mtime.toISOString(),
    summary: reportParsed.data.summary || null,
    counts,
    dependencies: deps,
    policy_tools,
    command,
  };
}

export function readDecisionsAndTraceability(workspaceRoot: string, agentDir: string) {
  // 1. .agent/decisions.json
  const decisionsPath = path.join(agentDir, "decisions.json");
  const decisionsParsed = readJsonSafe<{
    thresholds?: Record<string, number>;
    questions?: Record<string, { type?: string; instructions?: string; criteria?: Record<string, string> }>;
  }>(decisionsPath);

  const decision_policy = decisionsParsed.ok
    ? {
        available: true,
        thresholds: decisionsParsed.data.thresholds || {},
        questions: Object.entries(decisionsParsed.data.questions || {}).map(([id, q]) => ({
          id,
          type: q.type || "choice",
          instructions: q.instructions || "",
          criteria: q.criteria || {},
        })),
      }
    : { available: false, thresholds: {}, questions: [] };

  // 2. ADRs en DECISIONS/ o documentacion/adr/
  const adrDirs = [
    { rel: "DECISIONS", full: path.join(workspaceRoot, "DECISIONS") },
    { rel: "documentacion/adr", full: path.join(workspaceRoot, "documentacion", "adr") },
  ];
  const adrs: Array<{ id: string; title: string; status: string; path: string; excerpt: string; content: string }> = [];
  for (const dir of adrDirs) {
    if (!fs.existsSync(/*turbopackIgnore: true*/ dir.full)) continue;
    for (const entry of fs
      .readdirSync(/*turbopackIgnore: true*/ dir.full, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name))) {
      if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
      const full = path.join(dir.full, entry.name);
      try {
        const content = fs.readFileSync(full, "utf-8");
        const lines = content.split(/\r?\n/);
        const title =
          lines.find((l) => l.trim().startsWith("#"))?.replace(/^#+\s*/, "").trim() ||
          entry.name.replace(/\.md$/, "");
        const statusMatch = content.match(/(?:estado|status)\s*[:*]+\s*`?([^`\n*]+)`?/i);
        const excerpt =
          lines
            .map((l) => l.trim())
            .find((l) => l && !l.startsWith("#") && !l.startsWith("-") && !l.startsWith("|")) || "";
        adrs.push({
          id: entry.name.replace(/\.md$/, ""),
          title,
          status: statusMatch ? statusMatch[1].trim() : "REGISTRADO",
          path: `${dir.rel}/${entry.name}`,
          excerpt: excerpt.slice(0, 220),
          content,
        });
      } catch (err) {
        console.error(`[workspaceInspector] Failed reading ADR ${full}:`, err);
      }
    }
  }

  // 3. Requisitos en docs/specs/*/spec.md (además de .agent/SPECS.md)
  const docSpecsDir = path.join(workspaceRoot, "docs", "specs");
  const doc_specs: Array<{ slug: string; title: string; status: string; path: string; requirements: string[] }> = [];
  if (fs.existsSync(docSpecsDir)) {
    for (const entry of fs.readdirSync(docSpecsDir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (!entry.isDirectory()) continue;
      const specFile = path.join(docSpecsDir, entry.name, "spec.md");
      if (!fs.existsSync(specFile)) continue;
      try {
        const content = fs.readFileSync(specFile, "utf-8");
        const title =
          content
            .split(/\r?\n/)
            .find((l) => l.trim().startsWith("#"))
            ?.replace(/^#+\s*/, "")
            .trim() || entry.name;
        const statusMatch = content.match(/(?:estado|status)\s*[:*]+\s*`?([^`\n*]+)`?/i);
        const reqs = Array.from(new Set(content.match(/\b(?:RF|RNF|CU|SPEC)-[A-Za-z0-9_-]+\b/g) || []));
        doc_specs.push({
          slug: entry.name,
          title,
          status: statusMatch ? statusMatch[1].trim() : "PENDIENTE",
          path: `docs/specs/${entry.name}/spec.md`,
          requirements: reqs,
        });
      } catch (err) {
        console.error(`[workspaceInspector] Failed reading spec ${specFile}:`, err);
      }
    }
  }

  return {
    decision_policy,
    adrs,
    doc_specs,
  };
}
