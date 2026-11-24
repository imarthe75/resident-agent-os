// render_docx.mjs: se prueba solo si la dependencia docx está instalada (npm ci en la skill); si no, se omite y lo dice.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SKILL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../skills/metodologia-entrega');
const tieneDocx = fs.existsSync(path.join(SKILL, 'node_modules', 'docx'));
const render = (args) => spawnSync(process.execPath, ['--no-warnings', path.join(SKILL, 'scripts/render_docx.mjs'), ...args], { encoding: 'utf8' });

test('render_docx: final del ejemplo, rechazo de plantilla vacía y borrador', { skip: tieneDocx ? false : 'docx no instalado (npm ci en la skill)' }, () => {
  const o = fs.mkdtempSync(path.join(os.tmpdir(), 'ent-'));
  const ej = path.join(SKILL, 'examples/adr-0001-motor-de-colas.md'), marca = path.join(SKILL, 'examples/marca.ejemplo.json');
  assert.equal(render(['--doc', ej, '--marca', marca, '--out', path.join(o, 'a.docx')]).status, 0);
  assert.equal(render(['--doc', ej, '--out', path.join(o, 'b.docx')]).status, 2);           // marca sin organización
  const p = path.join(SKILL, 'plantillas/10-requerimientos.md');
  assert.equal(render(['--doc', p, '--marca', marca, '--out', path.join(o, 'c.docx')]).status, 2);
  assert.equal(render(['--doc', p, '--marca', marca, '--out', path.join(o, 'd.docx'), '--borrador']).status, 0);
});
