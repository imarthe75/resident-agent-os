#!/usr/bin/env node
// regresion.js — Genera cada ejemplo de examples/<módulo>/ (payload.json + reglas_contrastadas.md) y reporta N/N.
// Además prueba que las compuertas RECHAZAN lo que deben (cita a regla en discrepancia, clave ajena).
//   node scripts/tools/regresion.js [carpeta_salida]
const fs = require('fs'), path = require('path'), cp = require('child_process'), os = require('os');
const ROOT = path.resolve(__dirname, '..', '..');
const EX = path.join(ROOT, 'examples');
const out = process.argv[2] || fs.mkdtempSync(path.join(os.tmpdir(), 'mu-reg-'));
fs.mkdirSync(out, { recursive: true });
const render = (args) => cp.spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'render.js'), ...args], { encoding: 'utf8' });
let ok = 0, total = 0; const bad = [];

for (const d of fs.readdirSync(EX, { withFileTypes: true }).filter(x => x.isDirectory())) {
  const dir = path.join(EX, d.name), pl = path.join(dir, 'payload.json'), rg = path.join(dir, 'reglas_contrastadas.md');
  if (!fs.existsSync(pl)) continue;
  total++;
  const r = render(['--data', pl, '--reglas', rg, '--out', path.join(out, d.name + '.docx')]);
  if (r.status === 0 && fs.existsSync(path.join(out, d.name + '.docx'))) ok++;
  else bad.push(d.name + ': ' + (r.stderr || r.stdout).split('\n').filter(Boolean).slice(0, 4).join(' | '));

  // Negativas: deben fallar con código 2
  const base = JSON.parse(fs.readFileSync(pl, 'utf8'));
  const negativas = {
    'clave ajena': Object.assign({}, base, { modul: 'x' }),
    'regla sin prefijo': Object.assign({}, base, { tarea: base.tarea.map((t, i) => i ? t : Object.assign({}, t, { reglas: ['Regla sin contrastar'] })) }),
    'meta-token': Object.assign({}, base, { objetivo: '[Probable] Permitir algo' }),
  };
  const disc = fs.readFileSync(rg, 'utf8').match(/\|\s*(RN-\d+)\s*\|[^\n]*\|\s*discrepancia\s*\|/);
  if (disc) negativas['cita a discrepancia'] = Object.assign({}, base, { tarea: base.tarea.map((t, i) => i ? t : Object.assign({}, t, { reglas: ['[' + disc[1] + '] texto'] })) });
  for (const [nombre, p] of Object.entries(negativas)) {
    total++;
    const tmp = path.join(dir, '.neg.' + process.pid + '.json');
    fs.writeFileSync(tmp, JSON.stringify(p));
    const r2 = render(['--data', tmp, '--reglas', rg, '--out', path.join(out, 'neg.docx')]);
    fs.unlinkSync(tmp);
    if (r2.status === 2) ok++; else bad.push(d.name + ' / negativa «' + nombre + '»: se esperaba rechazo (2) y salió ' + r2.status);
  }
}
// Unitarias de reglas: estados nuevos y evidencia dinámica
{
  const R = require(path.join(ROOT, 'scripts', 'lib', 'reglas.js'));
  const mk = (estado, front, back) => { const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'mu-r-')), 'r.md');
    fs.writeFileSync(f, ['| ID | Regla | Fuente | Front | Back | Estado | Decisión |', '|---|---|---|---|---|---|---|', '| RN-01 | x | s | ' + front + ' | ' + back + ' | ' + estado + ' | |'].join('\n')); return R.leer(f); };
  const casos = [
    ['solo_vista_previa es citable', () => R.citables(mk('solo_vista_previa', '`a.ts:1`', '—')).has('RN-01')],
    ['sin_efecto no es citable', () => !R.citables(mk('sin_efecto', '`a.ts:1`', '—')).has('RN-01')],
    ['sin_efecto sin evidencia se rechaza', () => R.verificar(mk('sin_efecto', '—', '—')).errores.length > 0],
    ['prueba con fecha se acepta', () => R.verificar(mk('confirmada', '`a.ts:1`', '`prueba:v.py@2026-11-05`')).errores.length === 0],
    ['prueba sin fecha se rechaza', () => R.verificar(mk('confirmada', '`a.ts:1`', '`prueba:v.py`')).errores.length > 0],
    ['prueba vieja avisa', () => R.verificar(mk('confirmada', '`a.ts:1`', '`prueba:v.py@2020-01-01`')).avisos.length > 0],
  ];
  for (const [n, fn] of casos) { total++; let r = false; try { r = fn(); } catch (e) {} if (r) ok++; else bad.push('reglas / ' + n); }
}
// captura_ext.js: registra solo con --revisado, valida el formato contra el guion
{
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'mu-ce-'));
  const png = Buffer.alloc(33); Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]).copy(png); png.writeUInt32BE(1366, 16); png.writeUInt32BE(768, 20);
  fs.writeFileSync(path.join(d, 'img.png'), png);
  fs.writeFileSync(path.join(d, 'g.json'), JSON.stringify({ escenas: [{ id: '01', archivo: '01-a.png' }, { id: '02', archivo: '02-b.jpg' }] }));
  const ce = (a) => cp.spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'tools', 'captura_ext.js'), ...a, '--guion', path.join(d, 'g.json')], { encoding: 'utf8' }).status;
  const casos = [
    ['sin --revisado se rechaza', ce(['registrar', '--id', '01', '--origen', path.join(d, 'img.png')]) === 2],
    ['PNG para escena .png se acepta', ce(['registrar', '--id', '01', '--origen', path.join(d, 'img.png'), '--revisado']) === 0 && fs.existsSync(path.join(d, 'capturas', '01-a.png'))],
    ['PNG para escena .jpg se rechaza', ce(['registrar', '--id', '02', '--origen', path.join(d, 'img.png'), '--revisado']) === 2],
    ['estado avisa lo que falta', ce(['estado']) === 3],
  ];
  for (const [n, r] of casos) { total++; if (r) ok++; else bad.push('captura_ext / ' + n); }
}
console.log('Regresión: ' + ok + '/' + total + ' · salida en ' + out);
bad.forEach(b => console.log('  ✖ ' + b));
process.exit(bad.length ? 1 : 0);
