#!/usr/bin/env node
// evidencia.js — Extrae del código la EVIDENCIA de reglas de un módulo (Fase 2, insumo del contraste).
// Determinista: no interpreta, solo localiza y cita archivo:línea. La IA contrasta después.
//
//   node evidencia.js --repo <raíz del sistema> --front <carpeta del feature> --back <Palabra1,Palabra2> --out evidencia.md
//     --repo   raíz con back/ y front/ (p. ej. la raíz del clon del sistema)
//     --front  carpeta del feature relativa a --repo (p. ej. front/src/app/features/variables-sistema); admite varias separadas por coma
//     --back   prefijos de clase Java del módulo (p. ej. VariableSistema): toma Controller, Service, DTO, entidades y repositorios cuyo nombre empiece así
//     --back-root (opcional) raíz Java, por defecto back/src/main/java
//     --back-ext (opcional) java (defecto) | py | ts : lenguaje del back. Para py/ts el prefijo se compara con el nombre del archivo (sin distinguir mayúsculas)
//     --const  (opcional) carpeta de constantes del front para resolver ETIQUETAS_*.CLAVE, por defecto front/src/app/core/constants
const fs = require('fs');
const path = require('path');
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : d; };
const repo = arg('repo'), frontArg = arg('front'), backArg = arg('back'), out = arg('out', 'evidencia.md');
if (!repo || (!frontArg && !backArg)) { console.error('Uso: evidencia.js --repo <raíz> --front <carpeta> --back <Prefijo[,Prefijo]> [--out evidencia.md]'); process.exit(1); }
const backExt = arg('back-ext', 'java');
if (!['java', 'py', 'ts'].includes(backExt)) { console.error('--back-ext debe ser java, py o ts'); process.exit(1); }
const backRoot = path.resolve(repo, arg('back-root', 'back/src/main/java'));
const constDir = path.resolve(repo, arg('const', 'front/src/app/core/constants'));
const rel = (abs) => path.relative(repo, abs).split(path.sep).join('/');

function walk(dir, filtro, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', 'dist', 'build', '.angular'].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, filtro, acc); else if (filtro(p)) acc.push(p);
  }
  return acc;
}
const limpia = (s) => s.trim().replace(/\s+/g, ' ').replace(/\|/g, '\\|').slice(0, 220);

// ---------- Constantes del front (ETIQUETAS_SISTEMA.CLAVE → texto) ----------
const CONST = {};
for (const f of walk(constDir, p => p.endsWith('.ts'))) {
  const t = fs.readFileSync(f, 'utf8');
  const re = /([A-Z][A-Z0-9_]+)\s*:\s*['"`]([^'"`]+)['"`]/g; let m;
  while ((m = re.exec(t))) CONST[m[1]] = m[2];
}
const resuelve = (s) => s.replace(/\{\{\s*[A-Z_]+\.([A-Z0-9_]+)\s*\}\}/g, (x, k) => CONST[k] ? '«' + CONST[k] + '»' : x)
  .replace(/\b[A-Z_]{4,}\.([A-Z0-9_]+)\b/g, (x, k) => CONST[k] ? x + ' = «' + CONST[k] + '»' : x);

// ---------- Patrones ----------
const P_TS = [
  ['Validaciones de formulario', /Validators\.\w+|setValidators|addValidators|noSoloEspacios|\bvalidator\b/],
  ['Mensajes al usuario (toast · confirmación)', /\b(summary|detail|message|header)\s*:/],
  ['Controles deshabilitados / estado', /\.(disable|enable)\(\)|\breadonly\b/],
  ['Transformaciones de datos', /\.(toUpperCase|toLowerCase|trim)\(\)/],
  ['Rutas', /\bpath\s*:\s*['"]/],
  ['Permisos / acciones restringidas', /accionRestringida|hasPermission|hasRole|privilegio|canActivate/i],
];
const P_HTML = [
  ['Títulos de pantalla', /<h[1-3][^>]*>[^<]{2,}/],
  ['Etiquetas de campo', /<label[^>]*>[^<]{2,}/],
  ['Botones y acciones', /\blabel\s*=\s*"[^"]+"|\[label\]/],
  ['Tooltips', /pTooltip\s*=|\[pTooltip\]/],
  ['Encabezados de diálogo / columnas', /\bheader\s*=\s*"|<th[^>]*>[^<]{2,}/],
  ['Mensajes de validación visibles', /<small[^>]*>[^<]{2,}|p-message|invalid/],
  ['Placeholders', /placeholder\s*=/],
  ['Restricciones de captura', /maxlength|minlength|\[max\]|\[min\]|maxFractionDigits|rowsPerPageOptions|\[required\]|\brequired\b/i],
  ['Habilitación condicionada', /\[disabled\]\s*=/],
];
const P_JAVA = [
  ['Endpoints', /@(Get|Post|Put|Delete|Patch|Request)Mapping\b/],
  ['Permisos', /@PreAuthorize|@Secured|@RolesAllowed|hasAuthority|hasRole/],
  ['Validaciones de entrada (DTO)', /@(NotBlank|NotNull|NotEmpty|Size|Pattern|Email|Min|Max|DecimalMin|DecimalMax|Positive|PositiveOrZero|Past|Future|Digits|Valid)\b/],
  ['Excepciones / mensajes de error', /throw new \w+|orElseThrow|IllegalArgumentException/],
  ['Validaciones de negocio', /\bvalidar\w*\(|\bisBorrado\(\)|existsBy\w+|findBy\w+\(/],
  ['Transformaciones', /\.(toUpperCase|toLowerCase|trim)\(/],
  ['Auditoría / eventos', /registrarEvento|auditoria|Auditoria|AUDIT/],
];
const P_TSX = P_TS.concat([
  ['Etiquetas, botones y textos (JSX)', /<(label|button|h[1-3]|option|legend)[^>]*>[^<{]{2,}|(aria-label|title|placeholder)\s*=\s*["'{]/],
  ['Habilitación condicionada (JSX)', /disabled\s*=\s*[{"]/],
  ['Restricciones de captura (JSX)', /(maxLength|minLength|required|accept|min|max)\s*=\s*[{"]/],
]);
const P_PY = [
  ['Endpoints', /@\w+\.(get|post|put|delete|patch|api_route)\(|APIRouter\(/],
  ['Permisos / dependencias', /Depends\(|require_\w+|HTTPBearer|api_key|ADMIN_API_KEY/i],
  ['Validaciones de entrada (modelos)', /Field\(|@(field_)?validator|@model_validator|constr\(|conint\(|Pattern|re\.(compile|match|fullmatch)\(/],
  ['Excepciones / mensajes de error', /raise \w+|HTTPException\(/],
  ['Saneamiento y valores por defecto', /\.(strip|lower|upper)\(\)|html\.escape|re\.sub\(|DEFAULT_\w+|\.get\([^)]*,\s*[^)]+\)/],
  ['Publicación / efectos externos', /requests\.(post|put|patch|get)|httpx\.|\.patch\(|\.commit\(\)/],
];
// Para excepciones: junta los literales de las 4 líneas siguientes (el mensaje suele ir abajo).
function contexto(lineas, i, n) { return lineas.slice(i, i + n).join(' '); }

function escanear(archivo, patrones, extra) {
  const lineas = fs.readFileSync(archivo, 'utf8').split(/\r?\n/);
  const grupos = {};
  lineas.forEach((l, i) => {
    for (const [g, re] of patrones) {
      if (!re.test(l)) continue;
      let txt = l;
      if (extra && extra(g, l)) txt = contexto(lineas, i, 4);
      (grupos[g] = grupos[g] || []).push('- `' + rel(archivo) + ':' + (i + 1) + '` — ' + limpia(resuelve(txt)));
      break;
    }
  });
  return grupos;
}

const P_BACK = { java: P_JAVA, py: P_PY, ts: P_TS };
const secciones = [];
function volcar(titulo, grupos) {
  const ks = Object.keys(grupos); if (!ks.length) return;
  secciones.push('\n## ' + titulo + '\n');
  for (const k of ks) secciones.push('### ' + k + '\n' + grupos[k].join('\n') + '\n');
}

// ---------- Front ----------
for (const fr of (frontArg || '').split(',').map(s => s.trim()).filter(Boolean)) {
  const dir = path.resolve(repo, fr);
  if (!fs.existsSync(dir)) { console.error('⚠ No existe la carpeta de front ' + fr); continue; }
  for (const f of walk(dir, p => /\.(tsx?|jsx?|html)$/.test(p) && !/\.(spec|test)\.[tj]sx?$/.test(p))) {
    volcar('Front · ' + rel(f), escanear(f, f.endsWith('.html') ? P_HTML : /\.[tj]sx$/.test(f) ? P_TSX : P_TS));
  }
}
// ---------- Back ----------
const prefijos = (backArg || '').split(',').map(s => s.trim()).filter(Boolean);
if (prefijos.length) {
  const javas = backExt === 'java'
    ? walk(backRoot, p => p.endsWith('.java') && prefijos.some(px => path.basename(p).startsWith(px) ||
        path.basename(p).startsWith('Crear' + px) || path.basename(p).startsWith('Actualizar' + px)))
    : walk(backRoot, p => p.endsWith('.' + backExt) && !/(^test_|_test\.|\.test\.|\.spec\.)/.test(path.basename(p)) &&
        prefijos.some(px => path.basename(p).toLowerCase().startsWith(px.toLowerCase())));
  const usaConst = new Set();
  for (const f of javas) {
    const t = fs.readFileSync(f, 'utf8');
    for (const m of t.matchAll(/ErrorConstants\.([A-Z_]+)/g)) usaConst.add(m[1]);
    volcar('Back · ' + rel(f), escanear(f, P_BACK[backExt], (g) => g === 'Excepciones / mensajes de error'));
  }
  // Constantes de error usadas por el módulo, resueltas a su texto
  const ec = walk(backRoot, p => path.basename(p) === 'ErrorConstants.java')[0];
  if (backExt === 'java' && ec && usaConst.size) {
    const lineas = fs.readFileSync(ec, 'utf8').split(/\r?\n/), items = [];
    lineas.forEach((l, i) => { const m = l.match(/static final String ([A-Z_]+)\s*=\s*(".*");/); if (m && usaConst.has(m[1])) items.push('- `' + rel(ec) + ':' + (i + 1) + '` — ' + m[1] + ' = ' + limpia(m[2])); });
    if (items.length) secciones.push('\n## Back · Constantes de error usadas por el módulo\n' + items.join('\n') + '\n');
  }
  if (!javas.length) console.error('⚠ Ningún .' + backExt + ' empieza con ' + prefijos.join(', ') + ' bajo ' + rel(backRoot));
}

const cab = [
  '# Evidencia de código — ' + [frontArg, backArg].filter(Boolean).join(' · '),
  '',
  'Generado por `evidencia.js` el ' + new Date().toISOString().slice(0, 10) + '. Raíz: `' + repo + '`.',
  'Es un **índice de dónde mirar**, no una lista de reglas: cada renglón es un candidato. Abre el archivo en esa línea antes de citarlo en `reglas_contrastadas.md`.',
];
fs.writeFileSync(out, cab.concat(secciones).join('\n') + '\n', 'utf8');
const n = secciones.join('\n').split('\n').filter(l => l.startsWith('- `')).length;
console.log('✓ Evidencia: ' + n + ' renglones → ' + out);
