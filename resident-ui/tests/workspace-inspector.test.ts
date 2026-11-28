import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { summarizeTelemetry } from "../src/lib/agentData.ts";
import {
  inspectDoctor,
  parseFrontmatter,
  readCapabilities,
  readDecisionsAndTraceability,
  readDependenciesHealth,
  readMicroAuditReport,
  readModelRouting,
  readVerifiersReport,
  runVerifiersNow,
} from "../src/lib/workspaceInspector.ts";

function makeTempWorkspace() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ros-ui-test-"));
  const agentDir = path.join(root, ".agent");
  const dataDir = path.join(root, "data");
  fs.mkdirSync(agentDir, { recursive: true });
  fs.mkdirSync(dataDir, { recursive: true });
  return { root, agentDir, dataDir, cleanup: () => fs.rmSync(root, { recursive: true, force: true }) };
}

test("verifiers: empty/missing report and populated report + public-routes + gates", () => {
  const ws = makeTempWorkspace();
  try {
    // Empty / error case
    const empty = readVerifiersReport(ws.root, ws.agentDir, ws.dataDir);
    assert.equal(empty.available, false);
    assert.equal(empty.runner_available, false);
    assert.equal(empty.counts.total, 0);
    const failedRun = runVerifiersNow(ws.root, ws.agentDir, ws.dataDir, false);
    assert.equal(failedRun.ok, false);
    assert.match(failedRun.error || "", /verifiers\/run\.py/);

    // Success case
    fs.writeFileSync(
      path.join(ws.dataDir, "verifiers-report.json"),
      JSON.stringify({
        generated_at: "2026-11-27T12:00:00Z",
        with_network: false,
        results: [
          { verifier: "no_stubs", status: "CUMPLE", method: "heuristic", detail: [], checked: 5 },
          { verifier: "pk_uuid", status: "NO_CUMPLE", method: "static", detail: ["a.sql:1 serial"], checked: 1 },
          { verifier: "endpoints_auth", status: "NO_EVALUADO", method: "heuristic", detail: ["ninguna ruta"], checked: 0 },
        ],
      })
    );
    fs.writeFileSync(path.join(ws.agentDir, "public-routes.txt"), "# comentario\nGET /health  # sonda publica\n");
    fs.mkdirSync(path.join(ws.agentDir, "gates"), { recursive: true });
    fs.writeFileSync(path.join(ws.agentDir, "gates", "etapa-1.yml"), "gate: etapa-1\nrequired: true\n");

    const ok = readVerifiersReport(ws.root, ws.agentDir, ws.dataDir);
    assert.equal(ok.available, true);
    assert.equal(ok.counts.cumple, 1);
    assert.equal(ok.counts.no_cumple, 1);
    assert.equal(ok.counts.no_evaluado, 1);
    assert.equal(ok.public_routes.entries.length, 1);
    assert.equal(ok.public_routes.entries[0].method, "GET");
    assert.equal(ok.public_routes.entries[0].route, "/health");
    assert.equal(ok.gates.length, 1);
  } finally {
    ws.cleanup();
  }
});

test("doctor & routing: missing config vs populated hosts, hooks, and agents", () => {
  const ws = makeTempWorkspace();
  try {
    // Missing routing config case
    const missingRouting = readModelRouting(ws.root, ws.agentDir);
    assert.equal(missingRouting.available, false);

    // Populated doctor + routing case
    fs.writeFileSync(path.join(ws.root, "AGENTS.md"), "# Reglas\n");
    fs.writeFileSync(path.join(ws.root, ".mcp.json"), "{}\n");
    fs.mkdirSync(path.join(ws.root, ".claude"), { recursive: true });
    fs.writeFileSync(
      path.join(ws.root, ".claude", "settings.json"),
      JSON.stringify({
        hooks: {
          PostToolUse: [{ matcher: "Edit", hooks: [{ type: "command", command: "node scripts/hooks/post-edit.js" }] }],
        },
        statusLine: { type: "command", command: "bash scripts/hooks/statusline.sh" },
      })
    );
    const doc = inspectDoctor(ws.root, ws.agentDir);
    assert.equal(doc.detected_hosts.claude, true);
    assert.equal(doc.detected_hosts.mcp, true);
    assert.equal(doc.detected_hosts.codex, true);
    assert.equal(doc.hooks.length, 1);
    assert.equal(doc.status_line, "bash scripts/hooks/statusline.sh");

    fs.writeFileSync(
      path.join(ws.agentDir, "model-routing.json"),
      JSON.stringify({
        default_tier: "balanced",
        tiers: {
          fast: { providers: { claude: "haiku", antigravity: "flash" } },
          balanced: { providers: { claude: "sonnet", antigravity: "inherit" } },
        },
        agents: {
          "general-purpose": { tier: "fast", escalate_to: "balanced", reason: "búsqueda económica" },
        },
      })
    );
    fs.mkdirSync(path.join(ws.root, "agents"), { recursive: true });
    fs.writeFileSync(
      path.join(ws.root, "agents", "general-purpose.md"),
      "---\nname: general-purpose\ndescription: Agente rápido\ntier: fast\n---\n\n# Body\n"
    );
    const routing = readModelRouting(ws.root, ws.agentDir);
    assert.equal(routing.available, true);
    assert.equal(routing.agents.length, 1);
    assert.equal(routing.agents[0].providers.claude, "haiku");
    assert.equal(routing.agents[0].escalate_to, "balanced");
  } finally {
    ws.cleanup();
  }
});

test("capabilities: empty workspace vs skills, commands, and path-rules", () => {
  const ws = makeTempWorkspace();
  try {
    const empty = readCapabilities(ws.root, ws.agentDir);
    assert.equal(empty.counts.skills, 0);
    assert.equal(empty.counts.commands, 0);
    assert.equal(empty.counts.path_rules, 0);

    fs.mkdirSync(path.join(ws.root, ".agents", "skills", "demo-skill"), { recursive: true });
    fs.writeFileSync(
      path.join(ws.root, ".agents", "skills", "demo-skill", "SKILL.md"),
      "---\nname: demo-skill\ndescription: Skill de prueba\n---\n# Demo\n"
    );
    fs.mkdirSync(path.join(ws.root, "commands"), { recursive: true });
    fs.writeFileSync(path.join(ws.root, "commands", "review.md"), "# Revisión\nRevisa el diff actual.\n");
    fs.writeFileSync(
      path.join(ws.agentDir, "path-rules.json"),
      JSON.stringify({ rules: [{ id: "SQL-1", severity: "HIGH", globs: ["**/*.sql"], instructions: "Usa uuidv7" }] })
    );

    const ok = readCapabilities(ws.root, ws.agentDir);
    assert.equal(ok.counts.skills, 1);
    assert.equal(ok.skills[0].name, "demo-skill");
    assert.equal(ok.counts.commands, 1);
    assert.equal(ok.commands[0].command, "/review");
    assert.equal(ok.counts.path_rules, 1);
    assert.equal(ok.path_rules[0].id, "SQL-1");
  } finally {
    ws.cleanup();
  }
});

test("dependencies & decisions: empty/invalid cases vs real reports and ADRs", () => {
  const ws = makeTempWorkspace();
  try {
    const noDeps = readDependenciesHealth(ws.agentDir, ws.dataDir);
    assert.equal(noDeps.report_available, false);
    assert.equal(noDeps.counts.total, 0);

    fs.writeFileSync(
      path.join(ws.agentDir, "versions-policy.json"),
      JSON.stringify({ tools: { postgresql: { source: "endoflife", product: "postgresql", channel: "latest" } } })
    );
    fs.writeFileSync(
      path.join(ws.dataDir, "outdated-dependencies.json"),
      JSON.stringify({
        summary: "3 dependencias",
        exit: 1,
        dependencies: [
          { ecosystem: "npm", file: "package.json", name: "a", current: "1.0.0", latest: "2.0.0", target: "2.0.0", lag: "major", unresolved: null, note: "", deprecated: false },
          { ecosystem: "npm", file: "package.json", name: "b", current: "1.0.0", latest: "1.0.0", target: "1.0.0", lag: null, unresolved: null, note: "", deprecated: true },
          { ecosystem: "npm", file: "package.json", name: "c", current: "1.0.0", latest: "1.0.1", target: "1.0.1", lag: "patch", unresolved: null, note: "", deprecated: false },
        ],
      })
    );
    const depsOk = readDependenciesHealth(ws.agentDir, ws.dataDir);
    assert.equal(depsOk.report_available, true);
    assert.equal(depsOk.policy_tools.length, 1);
    assert.equal(depsOk.counts.mayor, 1);
    assert.equal(depsOk.counts.obsoletas, 1);
    assert.equal(depsOk.counts.parche, 1);

    // Decisions empty vs populated
    const noDec = readDecisionsAndTraceability(ws.root, ws.agentDir);
    assert.equal(noDec.decision_policy.available, false);
    assert.equal(noDec.adrs.length, 0);

    fs.writeFileSync(
      path.join(ws.agentDir, "decisions.json"),
      JSON.stringify({ thresholds: { apply: 0.7 }, questions: { q1: { type: "choice", instructions: "Complejidad" } } })
    );
    fs.mkdirSync(path.join(ws.root, "DECISIONS"), { recursive: true });
    fs.writeFileSync(path.join(ws.root, "DECISIONS", "0001-test.md"), "# ADR 0001: Arquitectura\nEstado: APROBADO\nResumen técnico.\n");
    fs.mkdirSync(path.join(ws.root, "docs", "specs", "auth"), { recursive: true });
    fs.writeFileSync(path.join(ws.root, "docs", "specs", "auth", "spec.md"), "# Auth\nEstado: APROBADO\nCubre RF-01 y RF-02.\n");

    const decOk = readDecisionsAndTraceability(ws.root, ws.agentDir);
    assert.equal(decOk.decision_policy.available, true);
    assert.equal(decOk.adrs.length, 1);
    assert.equal(decOk.doc_specs.length, 1);
    assert.deepEqual(decOk.doc_specs[0].requirements, ["RF-01", "RF-02"]);
  } finally {
    ws.cleanup();
  }
});

test("summarizeTelemetry computes real hook savings and per-session history with ECC limit", () => {
  const empty = summarizeTelemetry([], {});
  assert.equal(empty.summary.hook_savings.available, false);
  assert.equal(empty.summary.sessions_history.length, 0);

  const { summary } = summarizeTelemetry(
    [
      {
        timestamp: "2026-11-27T10:00:00Z",
        service: "ros",
        source: "hook",
        level: "INFO",
        session_id: "sess-1",
        event: "compress-output.js",
        phase: "post_tool_use",
        outcome: "ok",
        chars_saved: 800,
        tokens_saved_est: 200,
        detail: { chars_raw: 1200, chars_after: 400 },
      },
      {
        timestamp: "2026-11-27T10:01:00Z",
        service: "ros",
        source: "loop",
        level: "ERROR",
        session_id: "sess-1",
        event: "phase_execute",
        phase: "execute",
        outcome: "error",
        duration_ms: 450,
        retries: 3,
      },
    ],
    { error_rate: 0.1 }
  );

  assert.equal(summary.hook_savings.available, true);
  assert.equal(summary.hook_savings.tokens_raw_est, 300);
  assert.equal(summary.hook_savings.tokens_filtered_est, 100);
  assert.equal(summary.hook_savings.tokens_saved_est, 200);
  assert.equal(summary.sessions_history.length, 1);
  assert.equal(summary.sessions_history[0].ecc_limit_breached, true);
  assert.deepEqual(summary.sessions_history[0].failed_phases, ["execute"]);
  assert.equal(parseFrontmatter("---\nname: demo\n---\nbody").meta.name, "demo");
});

test("micro-audit: missing report vs populated report with docs and casmarts profile", () => {
  const ws = makeTempWorkspace();
  try {
    const empty = readMicroAuditReport(ws.root, ws.dataDir);
    assert.equal(empty.available, false);
    assert.equal(empty.findings.length, 0);

    fs.writeFileSync(
      path.join(ws.dataDir, "micro-audit-report.json"),
      JSON.stringify({
        generated_at: "2026-11-27T22:00:00Z",
        repo: ws.root,
        scanned_files: 12,
        with_network: false,
        with_tools: false,
        summary: {
          total_findings: 1,
          by_severity: { CRITICA: 0, ALTA: 1, MEDIA: 0, BAJA: 0 },
          by_pillar: { seguridad: 1, desarrollo: 0, accesibilidad: 0, documentacion: 0, casmarts: 0, cmmi: 0, iso27001: 0, dependencias: 0 },
          modules_affected: 1,
          controls_cumple: 4,
          controls_no_cumple: 1,
          controls_no_evaluado: 2,
          baseline_compared: false,
          new_findings: 0,
          persisted_findings: 0,
          resolved_since_previous: 0,
        },
        modules: [{ module: "backend", total: 1, critica: 0, alta: 1, media: 0, baja: 0, pillars: ["seguridad"] }],
        standards_matrix: [{ framework: "CMMI v3.0", control_id: "VER", name: "Pruebas", status: "CUMPLE", evidence: "OK" }],
        documentation_audit: { total_documents: 2, broken_links: 0, draft_markers: 0, checks: [], documents: [] },
        casmarts_profile: { detected: true, profile: "Kit CASMARTS activo", markers: ["rules/centinela/rules.md"] },
        findings: [
          {
            id: "SEC-CMD-INJECTION:backend/a.py:3",
            rule: "SEC-CMD-INJECTION",
            pillar: "seguridad",
            standard: "OWASP A03",
            severity: "ALTA",
            module: "backend",
            file: "backend/a.py",
            line: 3,
            snippet: "os.system(cmd)",
            title: "Shell exec",
            remediation: "Usa subprocess con lista.",
            fix_prompt: "Corrige backend/a.py:3",
            source: "micro-sast",
            diff_status: "SIN_BASE",
          },
        ],
        external_tools: [],
        imported_sources: [],
        preflight: { configured: false, available: false, findings: [], reason: "no config" },
        scope_notice: "Local",
      })
    );

    const loaded = readMicroAuditReport(ws.root, ws.dataDir);
    assert.equal(loaded.available, true);
    assert.equal(loaded.findings.length, 1);
    assert.equal(loaded.casmarts_profile?.detected, true);
    assert.equal(loaded.documentation_audit?.total_documents, 2);
  } finally {
    ws.cleanup();
  }
});
