// generar_tema.mjs de la skill theming-tokens: salidas, contraste y validación del JSON.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SKILL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../skills/theming-tokens');
const run = (tema, out, extra = []) => spawnSync(process.execPath, [path.join(SKILL, 'scripts/generar_tema.mjs'), '--tema', tema, '--out', out, ...extra], { encoding: 'utf8' });
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'tema-'));

test('el ejemplo genera los cuatro archivos y cumple AA', () => {
  const o = tmp(); const r = run(path.join(SKILL, 'examples/tema.ejemplo.json'), o);
  assert.equal(r.status, 0, r.stderr);
  for (const f of ['tema.css', 'tailwind-theme.css', 'mi-marca.preset.ts', 'contraste.md']) assert.ok(fs.existsSync(path.join(o, f)), f);
  assert.match(fs.readFileSync(path.join(o, 'mi-marca.preset.ts'), 'utf8'), /export const MiMarcaPreset = definePreset\(Aura/);
  assert.match(fs.readFileSync(path.join(o, 'tema.css'), 'utf8'), /\.app-dark \{/);
  assert.doesNotMatch(fs.readFileSync(path.join(o, 'contraste.md'), 'utf8'), /NO CUMPLE/);
});

test('contraste insuficiente sale con 2', () => {
  assert.equal(run(path.join(SKILL, 'examples/tema.contraste-bajo.json'), tmp()).status, 2);
  assert.equal(run(path.join(SKILL, 'examples/tema.contraste-bajo.json'), tmp(), ['--permitir-contraste']).status, 0);
});

test('JSON inválido sale con 1 y dice la clave', () => {
  const o = tmp(); const p = path.join(o, 't.json');
  fs.writeFileSync(p, JSON.stringify({ nombre: 'X', colores: { primario: 'azul', fucsia: '#FF00FF' } }));
  const r = run(p, path.join(o, 'out'));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /colores\.primario/); assert.match(r.stderr, /colores\.fucsia: clave no reconocida/);
});
