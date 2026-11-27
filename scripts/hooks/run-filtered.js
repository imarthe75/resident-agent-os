#!/usr/bin/env node
/**
 * Filtra también la salida de los comandos que FALLAN.
 *
 * `compress-output.js` corre en PostToolUse, y Claude Code entrega un comando fallido (exit ≠ 0) a PostToolUseFailure, que no
 * puede reescribir la salida: justo la salida de un `pytest` o un `mvn test` rojo, que suele ser la más larga, llegaba sin filtrar.
 * Este archivo cierra ese hueco en dos modos:
 *
 *   PreToolUse (sin argumentos, payload por stdin): si el comando es de pruebas, compilación o instalación, lo reescribe para que corra
 *     a través de este mismo archivo:   npm test   →   node .../run-filtered.js -- bash -c 'npm test'
 *   Runner (`-- comando args...`): corre el comando, filtra stdout y stderr igual que el hook PostToolUse (errores, fallos, trazas y
 *     resúmenes nunca se quitan; el original completo queda en un archivo privado) y sale con el MISMO código que el comando.
 *
 * Reescribir el comando cambia lo que Claude Code compara contra las reglas de permisos (una reescritura podría esquivar una regla
 * `deny` o saltarse una pregunta). Por eso solo actúa:
 *   - con `ROS_FILTER_FAILED=1` (opt-in) o en modo `bypassPermissions` (donde no hay preguntas que esquivar); `ROS_FILTER_FAILED=0` lo apaga;
 *   - si ninguna regla `deny` o `ask` de los settings del proyecto o del usuario nombra al programa;
 *   - en comandos simples: sin tuberías, redirecciones, `;`, `&`, sustituciones de comando ni here-docs (la forma del comando la eligió
 *     el agente y se respeta);
 *   - en Linux/macOS envuelve con `-- bash -c '...'`; en Windows (`win32`) codifica el comando en Base64 (`--b64 <b64>`) para evitar
 *     choques de comillas entre PowerShell, cmd.exe y Git Bash, y lo ejecuta con `spawnSync(cmd, { shell: true })`.
 * Si no puede decidir, deja el comando como está. Idea tomada de Chisle (MIT); el código es propio.
 */

"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const { classifyCommand, filterCommandOutput } = require("./command-filters");
const { shrink } = require("./compress-output");

const WRAPPABLE = new Set(["pytest", "node_test", "js_test", "jvm_test", "install_noise"]);
const UNSAFE = /[|<>;&`]|\$\(|<<|\n/;

function shellQuote(s) {
  return `'${String(s).replace(/'/g, `'\\''`)}'`;
}

function programOf(cmd) {
  const tokens = cmd.trim().split(/\s+/).filter((t) => !/^[A-Za-z_][A-Za-z0-9_]*=/.test(t));
  return tokens.length ? path.basename(tokens[0]) : "";
}

function permissionRules(projectDir) {
  const files = [
    path.join(projectDir, ".claude", "settings.json"),
    path.join(projectDir, ".claude", "settings.local.json"),
    path.join(process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), ".claude"), "settings.json"),
  ];
  const rules = [];
  for (const f of files) {
    try {
      const perms = JSON.parse(fs.readFileSync(f, "utf8")).permissions || {};
      rules.push(...(perms.deny || []), ...(perms.ask || []));
    } catch (e) {
      if (e.code !== "ENOENT") process.stderr.write(`[run-filtered] no se pudo leer ${f}: ${e.message}\n`);
    }
  }
  return rules.map(String);
}

/** Devuelve el comando reescrito, o null si se deja como está (y por qué, para las pruebas). */
function decideRewrite(payload, env = process.env, platform = process.platform) {
  if (!payload || payload.tool_name !== "Bash") return { rewrite: null, reason: "no_bash" };
  const cmd = payload.tool_input && typeof payload.tool_input.command === "string" ? payload.tool_input.command : "";
  if (!cmd.trim()) return { rewrite: null, reason: "empty" };
  if (env.ROS_FILTER_FAILED === "0") return { rewrite: null, reason: "disabled" };
  if (env.ROS_FILTER_FAILED !== "1" && payload.permission_mode !== "bypassPermissions") return { rewrite: null, reason: "not_opted_in" };
  if (cmd.includes("run-filtered.js")) return { rewrite: null, reason: "already_wrapped" };
  if (UNSAFE.test(cmd)) return { rewrite: null, reason: "complex_command" };
  const kind = classifyCommand(cmd);
  if (!WRAPPABLE.has(kind)) return { rewrite: null, reason: "not_test_build_install" };
  const prog = programOf(cmd);
  const projectDir = env.CLAUDE_PROJECT_DIR || payload.cwd || process.cwd();
  const named = permissionRules(projectDir).find((r) => r.startsWith("Bash(") && new RegExp(`\\b${prog.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(r));
  if (named) return { rewrite: null, reason: `permission_rule:${named}` };
  if (platform === "win32") {
    const scriptPosix = __filename.replace(/\\/g, "/");
    const b64 = Buffer.from(cmd, "utf8").toString("base64");
    return { rewrite: `node "${scriptPosix}" --b64 ${b64}`, reason: kind };
  }
  return { rewrite: `node ${shellQuote(__filename)} -- bash -c ${shellQuote(cmd)}`, reason: kind };
}

function runFiltered(argv) {
  const isShellC = (argv[0] === "bash" || argv[0] === "sh") && argv[1] === "-c";
  const command = isShellC ? argv[2] : argv.join(" ");
  let res = spawnSync(argv[0], argv.slice(1), { encoding: "utf8", maxBuffer: 256 * 1024 * 1024, env: process.env });
  if (res.error && res.error.code === "ENOENT" && argv[0] === "bash") {
    res = spawnSync("sh", argv.slice(1), { encoding: "utf8", maxBuffer: 256 * 1024 * 1024, env: process.env });
  }
  if (res.error) {
    process.stderr.write(`[run-filtered] no se pudo ejecutar: ${res.error.message}\n`);
    return 127;
  }
  const out = res.stdout || "";
  const err = res.stderr || "";
  process.stdout.write(shrink(filterCommandOutput(command, out)));
  process.stderr.write(shrink(err));
  return res.status === null ? 1 : res.status;
}

function runFilteredB64(b64) {
  let command = "";
  try {
    command = Buffer.from(String(b64 || ""), "base64").toString("utf8");
  } catch (e) {
    process.stderr.write(`[run-filtered] comando base64 inválido: ${e.message}\n`);
    return 2;
  }
  if (!command.trim()) {
    process.stderr.write("[run-filtered] comando base64 vacío\n");
    return 2;
  }
  const res = spawnSync(command, { shell: true, encoding: "utf8", maxBuffer: 256 * 1024 * 1024, env: process.env });
  if (res.error) {
    process.stderr.write(`[run-filtered] no se pudo ejecutar: ${res.error.message}\n`);
    return 127;
  }
  const out = res.stdout || "";
  const err = res.stderr || "";
  process.stdout.write(shrink(filterCommandOutput(command, out)));
  process.stderr.write(shrink(err));
  return res.status === null ? 1 : res.status;
}

function main() {
  const b64Idx = process.argv.indexOf("--b64");
  if (b64Idx !== -1 && process.argv[b64Idx + 1]) {
    process.exit(runFilteredB64(process.argv[b64Idx + 1]));
  }
  const sep = process.argv.indexOf("--");
  if (sep !== -1) {
    process.exit(runFiltered(process.argv.slice(sep + 1)));
  }
  let input = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (c) => (input += c));
  process.stdin.on("end", () => {
    try {
      const payload = JSON.parse(input);
      const { rewrite } = decideRewrite(payload);
      if (rewrite) {
        process.stdout.write(JSON.stringify({
          hookSpecificOutput: { hookEventName: "PreToolUse", updatedInput: { ...payload.tool_input, command: rewrite } },
        }));
      }
    } catch (e) {
      process.stderr.write(`[run-filtered] payload inválido, el comando queda como está: ${e.message}\n`);
    }
    process.exit(0);
  });
}

if (require.main === module) main();

module.exports = { decideRewrite, runFiltered, runFilteredB64, programOf };
