#!/usr/bin/env node
/**
 * render.js — Despachador de manuales de usuario. NO dibuja: valida, aplica compuertas y delega en el builder.
 *
 *   node render.js --list
 *   node render.js --data payload.json --reglas reglas_contrastadas.md --out Manual.docx [--repo <raíz sistema>] [--estricto]
 *   node render.js --data payload.json --borrador --out Manual_BORRADOR.docx      (sin reglas: marca BORRADOR en el encabezado)
 *
 * Compuertas (si una falla, NO hay documento; sale con código 2):
 *   1. Contrato   — claves normalizadas a stem y payload válido contra schemas/<código>.schema.json
 *   2. Reglas     — reglas_contrastadas.md coherente; toda cita [RN-xx] existe y es CITABLE
 *   3. Capturas   — las imágenes referidas existen (aviso; error con --estricto)
 * Salidas: el .docx y <out>_validacion.md (hoja PQA para la revisión humana).
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');
const yaml = require('js-yaml');
const Ajv2020 = require('ajv/dist/2020');
const R = require('./lib/reglas');

const ROOT = path.resolve(__dirname, '..');
const MAP = JSON.parse(fs.readFileSync(path.join(ROOT, 'references', 'builders_map.json'), 'utf8'));
const argv = (n, d) => { const i = process.argv.indexOf('--' + n); if (i < 0) return d; const v = process.argv[i + 1]; return v && !v.startsWith('--') ? v : true; };
const has = (n) => process.argv.includes('--' + n);
const fail = (m, c) => { console.error('✖ ' + m); process.exit(c || 2); };

if (has('list')) {
  console.log('Plantillas generables:');
  for (const [c, d] of Object.entries(MAP)) console.log('  ' + c.padEnd(16) + ' builder=' + d.builder.padEnd(18) + ' manifiesto=' + d.manifiesto + (d.nota ? '  · ' + d.nota : ''));
  process.exit(0);
}

const MARCA = (() => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'references', 'marca.json'), 'utf8')); } catch (_) { return {}; } })();
const code = argv('code', MARCA.plantilla || Object.keys(MAP)[0]);
if (!MAP[code]) fail('No hay plantilla ' + code + '. Usa --list.', 1);
const { builder, manifiesto } = MAP[code];
const dataArg = argv('data');
if (!dataArg || dataArg === true) fail('Falta --data <payload.json>.', 1);
const out = argv('out', 'Manual.docx') === true ? 'Manual.docx' : argv('out', 'Manual.docx');
const borrador = has('borrador'), estricto = has('estricto');
const reglasArg = argv('reglas'), repo = argv('repo');
const payloadDir = path.dirname(path.resolve(dataArg));

const man = yaml.load(fs.readFileSync(path.join(ROOT, 'references', 'manifiestos', manifiesto + '.manifest.yaml'), 'utf8'));
const SCHEMA = JSON.parse(fs.readFileSync(path.join(ROOT, 'schemas', manifiesto + '.schema.json'), 'utf8'));
let payload = JSON.parse(fs.readFileSync(dataArg, 'utf8'));
const stem = (id) => String(id).split('.').pop();

// Claves reservadas fuera del contrato: _control (versión, fecha, autor, aprobador, historial).
const _control = payload._control; delete payload._control;

// ---------- Compuerta 1: contrato ----------
function lev(a, b) { const d = Array.from({ length: a.length + 1 }, (_, i) => [i]); for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i-1][j] + 1, d[i][j-1] + 1, d[i-1][j-1] + (a[i-1] === b[j-1] ? 0 : 1)); return d[a.length][b.length]; }
const normErr = [];
function normalize(obj, node, where) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj) || !node || !node.properties) return obj;
  const exp = Object.keys(node.properties), o = {};
  for (const k of Object.keys(obj)) {
    let key = k;
    if (!exp.includes(k)) {
      const s = k.split('.').pop().trim();
      if (exp.includes(s)) key = s;
      else { const near = exp.map(e => [e, lev(s.toLowerCase(), e.toLowerCase())]).sort((x, y) => x[1] - y[1]);
        normErr.push(where + '"' + k + '" no es clave del contrato. ' + (near[0] && near[0][1] <= 3 ? '¿Quisiste decir "' + near[0][0] + '"? ' : '') + 'Esperadas: ' + exp.join(', ')); continue; }
    }
    let v = obj[k]; const sub = node.properties[key];
    if (Array.isArray(v) && sub && sub.items && sub.items.properties) v = v.map((it, i) => normalize(it, sub.items, where + key + '[' + i + '].'));
    o[key] = v;
  }
  return o;
}
payload = normalize(payload, SCHEMA, '');
if (normErr.length) { console.error('✖ Claves fuera de contrato. No se genera documento:'); normErr.forEach(e => console.error('   · ' + e)); process.exit(2); }
const validate = new Ajv2020({ allErrors: true, strict: false }).compile(SCHEMA);
if (!validate(payload)) {
  console.error('✖ El payload NO cumple ' + manifiesto + '.schema.json. No se genera documento:');
  for (const e of validate.errors) {
    if (e.keyword === 'if') continue;
    let m = e.message;
    if (e.keyword === 'required') m = 'falta "' + e.params.missingProperty + '"';
    else if (e.keyword === 'not') m = 'contiene meta-tokens ([Cierto], «...», «como IA»): quítalos';
    else if (e.keyword === 'enum') m = 'debe ser uno de: ' + e.params.allowedValues.join(', ');
    console.error('   · ' + (e.instancePath || '(raíz)') + ' ' + m);
  }
  process.exit(2);
}
console.log('✓ Contrato validado (' + manifiesto + ').');

// ---------- Compuerta 2: reglas contrastadas ----------
const citas = [];   // { id|null, donde, texto }
const arr = (v) => Array.isArray(v) ? v : [];
arr(payload.tarea).forEach((t, i) => {
  arr(t.reglas).forEach((r, k) => citas.push({ id: R.idDe(r), donde: 'tarea[' + i + '] «' + t.titulo + '» reglas[' + k + ']', texto: r, obligatoria: true }));
  arr(t.pasos).forEach((s, k) => { if (s.nota && R.idDe(s.nota)) citas.push({ id: R.idDe(s.nota), donde: 'tarea[' + i + '].pasos[' + k + '].nota', texto: s.nota }); });
});
arr(payload.consideraciones).forEach((c, k) => { if (R.idDe(c)) citas.push({ id: R.idDe(c), donde: 'consideraciones[' + k + ']', texto: c }); });
arr(payload.mensaje).forEach((m, k) => { if (m.regla) citas.push({ id: m.regla, donde: 'mensaje[' + k + ']', texto: m.texto }); });
arr(payload.pregunta).forEach((q, k) => { if (q.regla) citas.push({ id: q.regla, donde: 'pregunta[' + k + ']', texto: q.pregunta }); });

let reglas = [], citables = new Map();
if (borrador) {
  console.log('⚠ Modo BORRADOR: sin compuerta de reglas. El encabezado del documento lo dirá en cada página.');
} else {
  if (!reglasArg || reglasArg === true) fail('Falta --reglas <reglas_contrastadas.md>. La Fase 2 (contraste de reglas contra back y front) es obligatoria; usa --borrador solo para revisiones internas.');
  reglas = R.leer(reglasArg);
  if (!reglas.length) fail('reglas_contrastadas.md no tiene ninguna fila RN-xx.');
  const { errores, avisos } = R.verificar(reglas, repo && repo !== true ? repo : null);
  avisos.forEach(a => console.log('⚠ ' + a));
  if (errores.length) { console.error('✖ reglas_contrastadas.md tiene errores. No se genera documento:'); errores.forEach(e => console.error('   · ' + e)); process.exit(2); }
  citables = R.citables(reglas);
  const malas = [];
  for (const c of citas) {
    if (!c.id) { if (c.obligatoria) malas.push(c.donde + ': falta el prefijo [RN-xx] (toda regla impresa debe estar contrastada)'); continue; }
    const r = reglas.find(x => x.id === c.id);
    if (!r) malas.push(c.donde + ': ' + c.id + ' no existe en ' + path.basename(reglasArg));
    else if (!citables.has(c.id)) malas.push(c.donde + ': ' + c.id + ' está «' + r.estado + '» → no se puede documentar (' + R.ESTADOS[r.estado].desc + ')');
  }
  if (malas.length) { console.error('✖ Citas de reglas inválidas. No se genera documento:'); malas.forEach(e => console.error('   · ' + e)); process.exit(2); }
  console.log('✓ Reglas: ' + citas.filter(c => c.id).length + ' cita(s) a ' + new Set(citas.map(c => c.id).filter(Boolean)).size + ' regla(s) citables.');
}

// ---------- Compuerta 3: capturas ----------
const capFalt = [];
arr(payload.tarea).forEach(t => arr(t.pasos).forEach(s => { if (s.captura && !fs.existsSync(path.resolve(payloadDir, s.captura))) capFalt.push(s.captura); }));
if (capFalt.length) {
  const m = capFalt.length + ' captura(s) no existen (se imprimirá «captura pendiente»): ' + capFalt.slice(0, 5).join(', ') + (capFalt.length > 5 ? ' …' : '');
  if (estricto) fail(m + '. Ejecuta capturar.js o quita --estricto.');
  console.log('⚠ ' + m);
}

// ---------- Valores → builder ----------
const values = Object.assign({}, payload);
for (const c of man.campos || []) if (c.autoria === 'auto' && c.valor !== undefined) values[stem(c.id)] = c.valor;
values._control = _control || {};
values._codigo = (argv('codigo-doc') && argv('codigo-doc') !== true) ? argv('codigo-doc') : (MARCA.codigo_documento || code);
const tmp = path.join(os.tmpdir(), 'mu-values-' + process.pid + '.json');
fs.writeFileSync(tmp, JSON.stringify(values));
let info = {};
try {
  const so = cp.execFileSync(process.execPath, [path.join(__dirname, builder)], {
    env: Object.assign({}, process.env, { CA_VALUES: tmp, CA_OUT: path.resolve(out), CA_PAYLOAD_DIR: payloadDir, CA_BORRADOR: borrador ? '1' : '0' }),
    stdio: ['ignore', 'pipe', 'pipe'],
  }).toString();
  try { info = JSON.parse(so.trim().split('\n').pop()); } catch (_) {}
} catch (e) { fs.unlinkSync(tmp); fail('El builder falló: ' + String(e.stderr || e.message).split('\n').slice(0, 6).join(' | '), 1); }
fs.unlinkSync(tmp);
console.log('✓ Documento generado: ' + out + '  (' + (info.pasos || 0) + ' pasos · ' + (info.figuras || 0) + ' figuras)');

// ---------- Hoja de validación (PQA) ----------
const trunc = (s, n = 90) => { if (s === undefined || s === null) return '—'; s = Array.isArray(s) ? s.join(' · ') : String(s); s = s.replace(/\|/g, '\\|').replace(/\n/g, ' '); return s.length <= n ? s : s.slice(0, n - 1) + '…'; };
const L = [];
L.push('# Hoja de validación — ' + code + ' · Manual de usuario · ' + (payload.modulo || '—'), '');
L.push('Sistema: **' + (payload.sistema || '—') + '** · Documento: `' + path.basename(out) + '`' + (borrador ? ' · **BORRADOR (reglas sin contrastar)**' : ''), '');
L.push('Palomea cada renglón tras comprobarlo **contra el sistema** (no contra el payload). Quien firma las Aprobaciones declara que esta hoja se revisó.', '');
L.push('## Resumen', '', '| Concepto | Valor |', '|---|---|',
  '| Tareas · pasos · figuras | ' + arr(payload.tarea).length + ' · ' + (info.pasos || 0) + ' · ' + (info.figuras || 0) + ' |',
  '| Capturas pendientes | ' + (capFalt.length ? capFalt.length + ': ' + trunc(capFalt, 140) : '0') + ' |',
  '| Marcadores «____» que quedan | ' + (['url_acceso', 'clave_proyecto'].filter(k => !payload[k]).concat(_control && _control.fecha ? [] : ['fecha (_control)'], _control && _control.aprobador ? [] : ['aprobador (_control)']).join(', ') || 'ninguno') + ' |', '');

if (!borrador) {
  const citadas = new Map(); citas.forEach(c => { if (c.id) citadas.set(c.id, (citadas.get(c.id) || []).concat(c.donde)); });
  L.push('## Reglas de negocio (fuente: `' + path.basename(reglasArg) + '`)', '', '| ✓ | ID | Estado | Regla | Citada en |', '|:-:|---|---|---|---|');
  for (const r of reglas) L.push('| ☐ | ' + r.id + ' | `' + r.estado + '` | ' + trunc(r.regla, 80) + ' | ' + (citadas.has(r.id) ? trunc(citadas.get(r.id).join('; '), 70) : (citables.has(r.id) ? '**sin citar** — ¿falta en el manual?' : 'no citable')) + ' |');
  const pend = reglas.filter(r => !citables.has(r.id));
  if (pend.length) { L.push('', '### Decisiones pendientes (no aparecen en el manual)', ''); pend.forEach(r => L.push('- **' + r.id + '** `' + r.estado + '` — ' + r.regla + (r.decision ? ' · ' + r.decision : '') + ' → Decide el líder de proyecto o el analista y cambia el estado a `decidida` para poder documentarla.')); }
  const nd = reglas.filter(r => r.estado === 'no_documentada');
  if (nd.length) { L.push('', '### Reglas que el sistema aplica y la fuente no menciona', ''); nd.forEach(r => L.push('- **' + r.id + '** — ' + r.regla + ' → el analista debe agregarla a `reglas_negocio.md`.')); }
  L.push('');
}

// Pendientes de verificar en ambiente de pruebas: lo declarado en _control.pendientes_verificar [{accion, dato, tarea?}]
// más cualquier texto del payload que diga «por confirmar» (acciones que no se ejecutaron por ser destructivas).
const pendV = arr(_control && _control.pendientes_verificar).map(p => typeof p === 'string' ? { accion: p } : p);
(function scan(v, donde) {
  if (typeof v === 'string') { if (/por confirmar/i.test(v) && !pendV.some(p => p.donde === donde)) pendV.push({ accion: 'Texto marcado «por confirmar»', dato: v, donde }); }
  else if (Array.isArray(v)) v.forEach((x, i) => scan(x, donde + '[' + i + ']'));
  else if (v && typeof v === 'object') for (const k of Object.keys(v)) scan(v[k], donde ? donde + '.' + k : k);
})(payload, '');
if (pendV.length) {
  L.push('## Pendiente de verificar en ambiente de pruebas', '', 'Acciones que **no se ejecutaron** (guardan, envían o publican) y por eso el manual no afirma su resultado. Ejecútalas en un ambiente de pruebas y completa el texto.', '',
    '| ✓ | Acción | Dato que falta / texto actual | Dónde |', '|:-:|---|---|---|');
  pendV.forEach(p => L.push('| ☐ | ' + trunc(p.accion, 80) + ' | ' + trunc(p.dato, 110) + ' | ' + trunc(p.donde || p.tarea, 50) + ' |'));
  L.push('');
}
L.push('## Campos', '', '| ✓ | Campo | Valor | Autoría | Fuente |', '|:-:|---|---|:-:|---|');
for (const c of man.campos || []) if (['ia', 'derivado'].includes(c.autoria) && payload[stem(c.id)] !== undefined) L.push('| ☐ | ' + c.etiqueta + ' | ' + trunc(payload[stem(c.id)]) + ' | `' + c.autoria + '` | ' + (c.fuente || '—') + ' |');
L.push('', '## Procedimiento — verificar cada paso ejecutándolo en el sistema', '');
let n = 0, f = 0;
arr(payload.tarea).forEach((t, i) => {
  L.push('### ' + (i + 1) + '. ' + t.titulo, '', '| ✓ | Paso | Texto | Captura |', '|:-:|--:|---|---|');
  arr(t.pasos).forEach(s => { n++; const cap = s.captura ? ('Fig. ' + (++f) + ' `' + s.captura + '`' + (capFalt.includes(s.captura) ? ' **FALTA**' : '')) : '—'; L.push('| ☐ | ' + n + ' | ' + trunc(s.texto, 100) + (s.nota ? ' · Nota: ' + trunc(s.nota, 60) : '') + ' | ' + cap + ' |'); });
  if (arr(t.reglas).length) L.push('| ☐ | — | Importante: ' + trunc(t.reglas, 140) + ' | — |');
  L.push('');
});
for (const b of ['funcionalidad', 'mensaje', 'pregunta', 'termino']) {
  const items = arr(payload[b]); if (!items.length) continue;
  const bm = (man.bloques_repetibles || []).find(x => stem(x.id) === b);
  L.push('## ' + (bm ? bm.etiqueta : b) + ' (' + items.length + ')', '', '| ✓ | Contenido |', '|:-:|---|');
  items.forEach(it => L.push('| ☐ | ' + trunc(Object.values(it).join(' — '), 160) + ' |'));
  L.push('');
}
const sheet = out.replace(/\.docx$/i, '') + '_validacion.md';
fs.writeFileSync(sheet, L.join('\n'), 'utf8');
console.log('✓ Hoja de validación: ' + sheet);
