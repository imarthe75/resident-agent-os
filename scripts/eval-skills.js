#!/usr/bin/env node
/**
 * Skill regression pilot (ADR-0004, C2): runs the same tasks with the previous and the current version of three critical skills and
 * checks the generated code with deterministic assertions (evals/skills/assertions.js; no judge model).
 *
 *   node scripts/eval-skills.js [--base <git ref>] [--budget 30] [--only <skill>] [--dry-run] [--force]
 *
 *  --base    version to compare against (default HEAD: the last commit vs the working tree; in a merge request, origin/main).
 *  --budget  maximum model calls per run (default 30, decided by the owner). Planned calls above it => refuse, nothing is sent.
 *  --only    evaluate a single skill (e.g. to finish a run cut short by a provider quota).
 *  --force   run even if nothing under skills/ or rules/ changed (by default such a run is skipped: it costs calls and proves nothing).
 *
 * Needs Node, git and a Gemini key in ROS_EVAL_GOOGLE_API_KEY (or GEMINI_API_KEY/GOOGLE_API_KEY). Model: ROS_EVAL_MODEL
 * (default gemini-3.5-flash-lite: on the free tier gemini-3.5-flash allows only 20 requests/day, below the 30-call budget, and
 * gemini-2.5-flash answers 404 to new keys). promptfoo is pinned and fetched with npx; its result cache means a repeated identical call costs nothing.
 * Exit codes: 0 every case measured and no regression, 1 a case the previous version passed fails now, 2 refused or not fully
 * measured (budget, missing key, promptfoo or provider error): an unmeasured case never counts as "no regression".
 *
 * Limits: one sample per case and version at temperature 0; a single changed case may be chance, so read it before concluding.
 */
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync, spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const EVAL_DIR = path.join(ROOT, "evals", "skills");
const PROMPTFOO = "promptfoo@0.125.1";
// skill -> files that form its context (the skill itself plus the rules an agent loads with it).
const SKILLS = {
  "backend-seguridad": ["skills/backend-seguridad/SKILL.md", "rules/common/security.md", "rules/java/rules.md"],
  "backend-modulo-crud": ["skills/backend-modulo-crud/SKILL.md", "rules/common/security.md", "rules/java/rules.md"],
  "frontend-auth-oidc": ["skills/frontend-auth-oidc/SKILL.md", "rules/common/security.md", "rules/angular/rules.md"],
};

function args(argv) {
  const a = { base: "HEAD", budget: 30, dryRun: false, force: false, only: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--base") a.base = argv[++i];
    else if (argv[i] === "--budget") a.budget = parseInt(argv[++i], 10);
    else if (argv[i] === "--dry-run") a.dryRun = true;
    else if (argv[i] === "--force") a.force = true;
    else if (argv[i] === "--only") a.only = argv[++i];
    else throw new Error(`argumento desconocido: ${argv[i]}`);
  }
  if (!Number.isInteger(a.budget) || a.budget < 1) throw new Error("--budget debe ser un entero positivo");
  if (a.only && !SKILLS[a.only]) throw new Error(`--only: skill desconocida ${a.only}`);
  return a;
}

function git(...cmd) {
  return execFileSync("git", ["-C", ROOT, ...cmd], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

/** Paths under skills/ or rules/ that differ between base and the working tree (committed or not, plus untracked). */
function changedPaths(base) {
  const diff = git("diff", "--name-only", base, "--", "skills", "rules").split("\n");
  const untracked = git("ls-files", "--others", "--exclude-standard", "--", "skills", "rules").split("\n");
  return [...new Set([...diff, ...untracked].filter(Boolean))];
}

function contextAt(files, base) {
  return files
    .map((f) => {
      let text = "";
      try {
        text = base === null ? fs.readFileSync(path.join(ROOT, f), "utf8") : git("show", `${base}:${f}`);
      } catch (e) {
        text = ""; // the file does not exist in that version (a new skill): its context is empty
      }
      return text ? `<!-- ${f} -->\n${text}` : "";
    })
    .filter(Boolean)
    .join("\n\n");
}

/** Calls a configuration will make: tests x prompts x providers. */
function plannedCalls(cfg) {
  return cfg.tests.length * cfg.prompts.length * cfg.providers.length;
}

/** {cases, losses, gains, errors, calls} from promptfoo's JSON output. */
function compare(outJson) {
  const rows = (outJson.results && outJson.results.results) || [];
  const byCase = new Map();
  let calls = 0;
  const errors = [];
  for (const r of rows) {
    const name = (r.testCase && r.testCase.description) || `caso ${r.testIdx}`;
    const label = (r.prompt && r.prompt.label) || String(r.promptIdx);
    if (!(r.response && r.response.cached)) calls++;
    if (r.error && !r.gradingResult) {
      errors.push(`${name} [${label}]: ${String(r.error).split("\n")[0].slice(0, 160)}`);
      continue;
    }
    const entry = byCase.get(name) || {};
    entry[label] = { pass: Boolean(r.success), reason: r.gradingResult && r.gradingResult.reason };
    byCase.set(name, entry);
  }
  const cases = [...byCase.entries()].map(([name, v]) => ({ name, previous: v.anterior, current: v.actual }));
  const losses = cases.filter((c) => c.previous && c.current && c.previous.pass && !c.current.pass);
  const gains = cases.filter((c) => c.previous && c.current && !c.previous.pass && c.current.pass);
  return { cases, losses, gains, errors, calls };
}

function mark(v) {
  return v ? (v.pass ? "pasa" : "falla") : "sin dato";
}

function main() {
  const a = args(process.argv.slice(2));
  const changed = changedPaths(a.base);
  if (!changed.length && !a.force) {
    console.log(`eval-skills: nada cambió en skills/ ni rules/ respecto a ${a.base}; no se ejecuta (0 llamadas).`);
    return 0;
  }
  const configs = Object.keys(SKILLS).filter((k) => !a.only || k === a.only).map((skill) => ({ skill, file: path.join(EVAL_DIR, `${skill}.config.js`) }));
  const planned = configs.reduce((n, c) => n + plannedCalls(require(c.file)), 0);
  console.log(`eval-skills: cambios en ${changed.length} archivos de skills/ o rules/; llamadas previstas ${planned} (presupuesto ${a.budget}).`);
  if (planned > a.budget) {
    console.error(`eval-skills: ${planned} llamadas superan el presupuesto de ${a.budget}; no se envía nada.`);
    return 2;
  }
  const key = process.env.ROS_EVAL_GOOGLE_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key && !a.dryRun) {
    console.error("eval-skills: falta ROS_EVAL_GOOGLE_API_KEY (o GEMINI_API_KEY/GOOGLE_API_KEY); no se ejecutó nada.");
    return 2;
  }

  const work = fs.mkdtempSync(path.join(os.tmpdir(), "ros-eval-"));
  for (const [skill, files] of Object.entries(SKILLS)) {
    fs.writeFileSync(path.join(work, `${skill}.previous.md`), contextAt(files, a.base));
    fs.writeFileSync(path.join(work, `${skill}.current.md`), contextAt(files, null));
  }
  if (a.dryRun) {
    console.log(`eval-skills: --dry-run, contextos escritos en ${work}; no se llamó al modelo.`);
    return 0;
  }

  let regression = false;
  let unmeasured = 0;
  let used = 0;
  for (const { skill, file } of configs) {
    const out = path.join(work, `${skill}.result.json`);
    const run = spawnSync("npx", ["-y", PROMPTFOO, "eval", "-c", file, "-o", out, "--max-concurrency", "1", "--no-progress-bar", "--no-table"], {
      cwd: EVAL_DIR,
      encoding: "utf8",
      env: { ...process.env, GEMINI_API_KEY: key, EVAL_WORKDIR: work, EVAL_SKILL: skill,
             PROMPTFOO_DISABLE_TELEMETRY: "1", PROMPTFOO_DISABLE_UPDATE: "1", PROMPTFOO_DISABLE_SHARING: "1" },
    });
    if (!fs.existsSync(out)) {
      console.error(`eval-skills: promptfoo no produjo resultado para ${skill} (salida ${run.status}): ${(run.stderr || "").trim().split("\n").slice(-3).join(" | ")}`);
      return 2;
    }
    const r = compare(JSON.parse(fs.readFileSync(out, "utf8")));
    used += r.calls;
    console.log(`\n${skill}  (llamadas reales: ${r.calls})`);
    for (const c of r.cases) console.log(`  ${mark(c.previous).padEnd(8)} → ${mark(c.current).padEnd(8)} ${c.name}${c.current && !c.current.pass ? `  [${c.current.reason}]` : ""}`);
    for (const e of r.errors) console.log(`  NO MEDIDO ${e}`);
    if (r.losses.length) regression = true;
    unmeasured += r.errors.length;
  }
  console.log(`\neval-skills: ${used} llamadas reales de ${planned} previstas; resultados en ${work}.`);
  if (regression) console.log("eval-skills: hay casos que la versión anterior pasaba y la actual no (regresión); revísalos antes de publicar.");
  if (regression) return 1;
  if (unmeasured) {
    console.log(`eval-skills: ${unmeasured} respuestas no se pudieron medir; el resultado NO demuestra ausencia de regresión.`);
    return 2;
  }
  return 0;
}

if (require.main === module) {
  try {
    process.exitCode = main();
  } catch (e) {
    console.error(`eval-skills: ${e.message}`);
    process.exitCode = 2;
  }
}

module.exports = { args, compare, plannedCalls, SKILLS };
