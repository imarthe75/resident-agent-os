#!/usr/bin/env node
/**
 * Sincroniza `node_modules/monaco-editor/min/vs` hacia `public/vs` para servir
 * Monaco Editor 100% desde `'self'` sin depender de CDNs externos.
 * Compatible con Linux, macOS, Windows nativo (usa junction) y Docker.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "node_modules", "monaco-editor", "min", "vs");
const dst = path.join(root, "public", "vs");

if (!fs.existsSync(src)) {
  console.warn("[sync-monaco] monaco-editor/min/vs aún no existe; omitiendo hasta npm install.");
  process.exit(0);
}

fs.mkdirSync(path.dirname(dst), { recursive: true });

try {
  const stat = fs.lstatSync(dst);
  if (stat.isSymbolicLink()) {
    const resolved = path.resolve(path.dirname(dst), fs.readlinkSync(dst));
    if (resolved === src && fs.existsSync(path.join(dst, "loader.js"))) {
      process.exit(0);
    }
    fs.unlinkSync(dst);
  } else if (fs.existsSync(path.join(dst, "loader.js"))) {
    process.exit(0);
  } else {
    fs.rmSync(dst, { recursive: true, force: true });
  }
} catch (err) {
  if (err && err.code !== "ENOENT") {
    console.error("[sync-monaco] error inspeccionando public/vs:", err);
    process.exit(1);
  }
}

try {
  const linkType = process.platform === "win32" ? "junction" : "dir";
  fs.symlinkSync(src, dst, linkType);
} catch (symlinkErr) {
  console.warn("[sync-monaco] symlink no disponible, copiando archivos locales:", symlinkErr.message);
  fs.cpSync(src, dst, { recursive: true, force: true });
}
