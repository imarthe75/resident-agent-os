#!/usr/bin/env node
// render_docx.mjs — Convierte un entregable llenado (Markdown de plantillas/) en .docx con la identidad de references/marca.json.
//   node scripts/render_docx.mjs --doc <documento.md> --out <salida.docx> [--marca <marca.json>] [--borrador]
// Compuertas (las mismas que verificar_entregable.py): pendientes «…», secciones de IA sin «Revisó:», secretos.
// Sin --borrador, cualquier problema detiene la generación (código 2). Con --borrador genera y marca «BORRADOR» en cada página.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as D from 'docx';

const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType, AlignmentType, HeadingLevel,
  Header, Footer, PageNumber, ImageRun, BorderStyle } = D;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); if (i < 0) return d; const v = process.argv[i + 1]; return v && !v.startsWith('--') ? v : true; };
const docPath = arg('doc'), out = arg('out'), borrador = process.argv.includes('--borrador');
if (!docPath || docPath === true || !out || out === true) { console.error('Uso: render_docx.mjs --doc <documento.md> --out <salida.docx> [--borrador]'); process.exit(1); }

const marcaPath = (arg('marca') && arg('marca') !== true) ? path.resolve(arg('marca')) : path.join(ROOT, 'references', 'marca.json');
const marcaDir = path.dirname(marcaPath);
const marca = (() => { try { return JSON.parse(fs.readFileSync(marcaPath, 'utf8')); } catch { return {}; } })();
const ORG = (marca.organizacion || '').trim() || '«Organización»';
const PRIM = /^[0-9A-Fa-f]{6}$/.test(marca.color_primario || '') ? marca.color_primario : '1E5FA8';
const TXT = /^[0-9A-Fa-f]{6}$/.test(marca.color_texto || '') ? marca.color_texto : '222222';
const FUENTE = marca.fuente || 'Calibri';
const LOGO = (() => { if (!marca.logo) return null; try { return fs.readFileSync(path.join(marcaDir, marca.logo)); } catch { return null; } })();

const md = fs.readFileSync(docPath, 'utf8').replace(/\r\n/g, '\n');

// ---------- compuertas ----------
const sinCodigo = md.replace(/```[\s\S]*?```/g, '');
const problemas = [];
sinCodigo.split('\n').forEach((l, i) => {
  for (const m of l.matchAll(/«[^»]*»/g)) problemas.push(`línea ${i + 1}: pendiente sin llenar ${m[0]}`);
  if (/(-----BEGIN [A-Z ]*PRIVATE KEY-----|(password|passwd|contraseña|secret|token|api[_-]?key)\s*[:=]\s*\S{6,}|glpat-[\w-]{10,}|AKIA[0-9A-Z]{16})/i.test(l)) problemas.push(`línea ${i + 1}: parece un secreto`);
});
for (const s of md.split(/^(?=## )/m).slice(1)) {
  const t = s.split('\n')[0].replace(/^##\s+/, '');
  if (/^>\s*Llena:\s*IA/m.test(s) && !/Revisó:\s*\S+/.test(s)) problemas.push(`sección «${t}»: la redactó la IA y no tiene la línea Revisó:`);
}
if (!(marca.organizacion || '').trim()) problemas.push(`marca: falta «organizacion» en ${marcaPath}`);
if (problemas.length) {
  console.error(`${borrador ? '⚠' : '✖'} ${problemas.length} problema(s):\n  - ` + problemas.slice(0, 30).join('\n  - ') + (problemas.length > 30 ? `\n  - … y ${problemas.length - 30} más` : ''));
  if (!borrador) { console.error('No se genera el documento final. Corrige o usa --borrador.'); process.exit(2); }
}

// ---------- inline ----------
function runs(texto, base = {}) {
  const out = []; const re = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*)/g; let last = 0, m;
  while ((m = re.exec(texto))) {
    if (m.index > last) out.push(new TextRun({ text: texto.slice(last, m.index), font: FUENTE, color: TXT, ...base }));
    const t = m[0];
    if (t.startsWith('**')) out.push(new TextRun({ text: t.slice(2, -2), bold: true, font: FUENTE, color: TXT, ...base }));
    else if (t.startsWith('`')) out.push(new TextRun({ text: t.slice(1, -1), font: 'Consolas', color: TXT, ...base }));
    else out.push(new TextRun({ text: t.slice(1, -1), italics: true, font: FUENTE, color: TXT, ...base }));
    last = m.index + t.length;
  }
  if (last < texto.length) out.push(new TextRun({ text: texto.slice(last), font: FUENTE, color: TXT, ...base }));
  return out;
}
const celda = (texto, header) => new TableCell({
  children: [new Paragraph({ children: runs(texto.trim(), header ? { bold: true, color: 'FFFFFF' } : {}) })],
  shading: header ? { type: ShadingType.CLEAR, fill: PRIM, color: 'auto' } : undefined,
  margins: { top: 60, bottom: 60, left: 100, right: 100 },
});

// ---------- bloques ----------
const hijos = []; const L = md.split('\n'); let i = 0; let titulo = 'Documento';
const control = {};
while (i < L.length) {
  const l = L[i];
  if (/^```/.test(l)) {
    i++; while (i < L.length && !/^```/.test(L[i])) { hijos.push(new Paragraph({ children: [new TextRun({ text: L[i] || ' ', font: 'Consolas', size: 18 })], shading: { type: ShadingType.CLEAR, fill: 'F3F4F6', color: 'auto' } })); i++; }
    i++; continue;
  }
  let m;
  if ((m = l.match(/^(#{1,3})\s+(.*)$/))) {
    const lvl = m[1].length; if (lvl === 1) titulo = m[2];
    hijos.push(new Paragraph({ heading: [HeadingLevel.TITLE, HeadingLevel.HEADING_1, HeadingLevel.HEADING_2][lvl - 1],
      children: [new TextRun({ text: m[2], font: FUENTE, color: PRIM, bold: true, size: [36, 28, 24][lvl - 1] })], spacing: { before: 240, after: 120 } }));
    i++; continue;
  }
  if (/^\|/.test(l)) {
    const filas = []; while (i < L.length && /^\|/.test(L[i])) { filas.push(L[i]); i++; }
    const datos = filas.filter(f => !/^\|[-| :]+\|$/.test(f)).map(f => f.replace(/^\||\|$/g, '').split('|'));
    if (datos.length && datos[0][0].trim() === 'Control') for (const [k, v] of datos.slice(1)) control[k.trim()] = (v || '').trim();
    const ncol = Math.max(...datos.map(d => d.length));
    hijos.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE },
      rows: datos.map((d, r) => new TableRow({ tableHeader: r === 0, children: Array.from({ length: ncol }, (_, c) => celda(d[c] || '', r === 0)) })) }));
    hijos.push(new Paragraph({ children: [] }));
    continue;
  }
  if ((m = l.match(/^>\s*(.*)$/))) {
    if (/^Llena:/i.test(m[1])) { if (borrador) hijos.push(new Paragraph({ children: [new TextRun({ text: m[1], italics: true, size: 16, color: '808080', font: FUENTE })] })); }
    else hijos.push(new Paragraph({ children: runs(m[1], { italics: true }), indent: { left: 360 } }));
    i++; continue;
  }
  if ((m = l.match(/^(\s*)(- \[( |x)\]|-|\d+\.)\s+(.*)$/))) {
    const nivel = Math.min(Math.floor(m[1].length / 2), 3); const chk = m[3] !== undefined ? (m[3] === 'x' ? '☑ ' : '☐ ') : '';
    const vineta = /^\d+\./.test(m[2]) ? m[2] + ' ' : (chk ? '' : '• ');
    hijos.push(new Paragraph({ children: [new TextRun({ text: vineta + chk, font: FUENTE, color: TXT }), ...runs(m[4])], indent: { left: 360 + nivel * 360, hanging: 260 } }));
    i++; continue;
  }
  if (/^Revisó:/.test(l)) { hijos.push(new Paragraph({ children: [new TextRun({ text: l, italics: true, size: 18, color: '595959', font: FUENTE })], alignment: AlignmentType.RIGHT })); i++; continue; }
  if (l.trim() === '') { i++; continue; }
  // Párrafo: une las líneas seguidas hasta una línea vacía o el inicio de otro bloque (Markdown con saltos suaves).
  const partes = [l.trim()]; i++;
  while (i < L.length && L[i].trim() !== '' && !/^(#{1,3}\s|\||>|```|Revisó:|\s*(- |\d+\.\s))/.test(L[i])) { partes.push(L[i].trim()); i++; }
  hijos.push(new Paragraph({ children: runs(partes.join(' ')), spacing: { after: 120 } }));
}

// ---------- documento ----------
const pie = [control['Documento'] || titulo, control['Proyecto'], control['Versión'] ? 'v' + control['Versión'] : null].filter(Boolean).join(' · ');
const encabezado = [];
if (LOGO) encabezado.push(new ImageRun({ data: LOGO, transformation: { width: 50, height: 30 } }), new TextRun('   '));
encabezado.push(new TextRun({ text: ORG + ' — ' + (control['Documento'] || titulo), size: 18, color: '595959', font: FUENTE }));
if (borrador) encabezado.push(new TextRun({ text: '   ·   BORRADOR', bold: true, size: 18, color: 'C00000', font: FUENTE }));
const doc = new Document({
  creator: ORG, title: control['Documento'] || titulo,
  styles: { default: { document: { run: { font: FUENTE, size: 21, color: TXT } } } },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1296, bottom: 1296, left: 1440, right: 1440 } } },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: encabezado, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'B8C8DC', space: 4 } } })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
      new TextRun({ text: pie + ' — Página ', size: 16, color: '595959', font: FUENTE }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '595959', font: FUENTE }),
      new TextRun({ text: ' de ', size: 16, color: '595959', font: FUENTE }), new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: '595959', font: FUENTE })] })] }) },
    children: hijos,
  }],
});
fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
fs.writeFileSync(out, await Packer.toBuffer(doc));
console.log(`✓ ${out}${borrador ? ' (BORRADOR)' : ''}`);
