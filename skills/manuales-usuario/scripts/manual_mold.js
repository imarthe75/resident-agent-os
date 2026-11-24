// manual_mold.js — Molde de imagen de los manuales de usuario (activo versionado, ÚNICA fuente del formato; la identidad está en references/marca.json).
// Normaliza lo que hoy varía entre manuales (análisis 03, D1–D5): Carta, márgenes, paleta, tipografía,
// estilos de título (para el índice), tablas, pasos y figuras con numeración continua.
const fs = require('fs');
const path = require('path');
const D = require('docx');
const {
  Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType, AlignmentType,
  VerticalAlign, HeadingLevel, ImageRun, PageBreak, TableLayoutType, Header, Footer, PageNumber, TableOfContents,
} = D;

// ---- Paleta y medidas (de los manuales más recientes: Usuarios, Login Manager) ----
const C = { primario: '1E5FA8', secundario: '14406F', texto: '222222', tenue: '595959', borde: 'B8C8DC', zebra: 'F5F8FC', nota: 'FBF4E6', notaBorde: 'E0B84C', blanco: 'FFFFFF' };
const PAGE = { width: 12240, height: 15840, margin: { top: 1296, bottom: 1296, left: 1440, right: 1440, header: 720, footer: 720 } };
const ANCHO = PAGE.width - PAGE.margin.left - PAGE.margin.right; // 9360 twips
const FUENTE = 'Calibri';
const IMG_MAX_W = 600, IMG_MAX_H = 430; // px

// Identidad (organización, logo, códigos): references/marca.json. Sin logo, el documento sale sin imagen.
const MARCA = (() => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'references', 'marca.json'), 'utf8')); } catch (_) { return {}; } })();
const ORG = (MARCA.organizacion || '').trim() || '«Organización»';
const LOGO = (() => { if (!MARCA.logo) return null; try { return fs.readFileSync(path.join(__dirname, '..', 'references', MARCA.logo)); } catch (_) { return null; } })();
const PH = '«____»';
const ph = (v, d) => (v !== undefined && v !== null && String(v).trim() !== '') ? String(v) : (d === undefined ? PH : d);

const estilos = {
  default: { document: { run: { font: FUENTE, size: 22, color: C.texto }, paragraph: { spacing: { after: 120, line: 276 } } } },
  paragraphStyles: [
    { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FUENTE, size: 32, bold: true, color: C.primario }, paragraph: { spacing: { before: 360, after: 160 }, keepNext: true, outlineLevel: 0 } },
    { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FUENTE, size: 26, bold: true, color: C.secundario }, paragraph: { spacing: { before: 280, after: 120 }, keepNext: true, outlineLevel: 1 } },
    { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FUENTE, size: 24, bold: true, color: C.secundario }, paragraph: { spacing: { before: 220, after: 100 }, keepNext: true, outlineLevel: 2 } },
    { id: 'Caption', name: 'Caption', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FUENTE, size: 18, italics: true, color: C.tenue }, paragraph: { alignment: AlignmentType.CENTER, spacing: { before: 60, after: 200 } } },
  ],
};

// ---- Texto ----
const run = (text, o = {}) => new TextRun({ text, font: FUENTE, ...o });
const p = (text, o = {}) => new Paragraph({ children: Array.isArray(text) ? text : [run(text, o.run)], spacing: o.spacing, alignment: o.alignment, indent: o.indent, keepNext: o.keepNext });
const h1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [run(t)] });
const h2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [run(t)] });
const h3 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [run(t)] });
const vineta = (t, nivel = 0) => new Paragraph({ bullet: { level: nivel }, children: [run(t)], spacing: { after: 60 } });
const salto = () => new Paragraph({ children: [new PageBreak()] });

// ---- Tablas ----
const B = { style: BorderStyle.SINGLE, size: 4, color: C.borde };
const BORDES = { top: B, bottom: B, left: B, right: B, insideHorizontal: B, insideVertical: B };
function celda(texto, w, o = {}) {
  return new TableCell({
    width: { size: w, type: WidthType.DXA }, verticalAlign: o.va || VerticalAlign.CENTER,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    shading: o.fill ? { type: ShadingType.CLEAR, color: 'auto', fill: o.fill } : undefined,
    children: (Array.isArray(texto) ? texto : [texto]).map(t => new Paragraph({ children: [run(String(t), { bold: !!o.bold, color: o.color, size: o.size || 20 })] })),
  });
}
function tabla(cols, encabezado, filas) {
  const total = cols.reduce((a, b) => a + b, 0), w = cols.map(c => Math.round(c * ANCHO / total));
  const rows = [];
  if (encabezado) rows.push(new TableRow({ tableHeader: true, children: encabezado.map((t, i) => celda(t, w[i], { bold: true, fill: C.primario, color: C.blanco })) }));
  filas.forEach((f, k) => rows.push(new TableRow({ children: f.map((t, i) => celda(t, w[i], { fill: k % 2 ? C.zebra : undefined })) })));
  return new Table({ width: { size: ANCHO, type: WidthType.DXA }, columnWidths: w, layout: TableLayoutType.FIXED, borders: BORDES, rows });
}
// Tabla etiqueta | valor (Información general, Acceso al sistema)
function ficha(pares) {
  const w = [Math.round(ANCHO * 0.34), ANCHO - Math.round(ANCHO * 0.34)];
  return new Table({
    width: { size: ANCHO, type: WidthType.DXA }, columnWidths: w, layout: TableLayoutType.FIXED, borders: BORDES,
    rows: pares.map(([k, v]) => new TableRow({ children: [celda(k, w[0], { bold: true, fill: 'EAF1F8', color: C.secundario }), celda(v, w[1])] })),
  });
}
// Recuadro «Nota importante» / «Importante»
function recuadro(titulo, lineas) {
  const hijos = [new Paragraph({ children: [run(titulo, { bold: true, color: '6B5416' })] })]
    .concat(lineas.map(l => new Paragraph({ bullet: lineas.length > 1 ? { level: 0 } : undefined, children: [run(l, { size: 20 })] })));
  const NB = { style: BorderStyle.SINGLE, size: 4, color: C.notaBorde };
  return new Table({
    width: { size: ANCHO, type: WidthType.DXA }, columnWidths: [ANCHO], layout: TableLayoutType.FIXED,
    borders: { top: NB, bottom: NB, left: { style: BorderStyle.SINGLE, size: 24, color: C.notaBorde }, right: NB, insideHorizontal: NB, insideVertical: NB },
    rows: [new TableRow({ children: [new TableCell({ width: { size: ANCHO, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 160, right: 120 }, shading: { type: ShadingType.CLEAR, color: 'auto', fill: C.nota }, children: hijos })] })],
  });
}

// ---- Imágenes ----
function dims(buf) {
  if (buf[0] === 0x89 && buf[1] === 0x50) return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  if (buf[0] === 0xFF && buf[1] === 0xD8) {
    let o = 2;
    while (o < buf.length) {
      if (buf[o] !== 0xFF) { o++; continue; }
      const mk = buf[o + 1];
      if (mk >= 0xC0 && mk <= 0xCF && ![0xC4, 0xC8, 0xCC].includes(mk)) return { h: buf.readUInt16BE(o + 5), w: buf.readUInt16BE(o + 7) };
      o += 2 + buf.readUInt16BE(o + 2);
    }
  }
  return null;
}
// Devuelve [párrafo imagen, párrafo pie] o un marcador visible si el archivo no existe.
function figura(archivoAbs, n, pie) {
  let buf = null; try { buf = fs.readFileSync(archivoAbs); } catch (_) {}
  const d = buf && dims(buf);
  const leyenda = new Paragraph({ style: 'Caption', children: [run('Figura ' + n + ': ' + ph(pie, ''))] });
  if (!d) return { ok: false, nodos: [p([run('«captura pendiente: ' + path.basename(archivoAbs) + '»', { italics: true, color: 'C00000' })], { alignment: AlignmentType.CENTER }), leyenda] };
  let w = Math.min(IMG_MAX_W, d.w), h = Math.round(w * d.h / d.w);
  if (h > IMG_MAX_H) { h = IMG_MAX_H; w = Math.round(h * d.w / d.h); }
  return { ok: true, nodos: [new Paragraph({ alignment: AlignmentType.CENTER, keepNext: true, spacing: { before: 80 }, children: [new ImageRun({ data: buf, transformation: { width: w, height: h } })] }), leyenda] };
}

// ---- Encabezado, pie, portada, índice ----
function encabezado(borrador) {
  const hijos = [];
  if (LOGO) hijos.push(new ImageRun({ data: LOGO, transformation: { width: 50, height: 30 } }), run('   '));
  hijos.push(run(ORG + ' — Manual de Usuario', { size: 18, color: C.tenue }));
  if (borrador) hijos.push(run('   ·   BORRADOR: reglas sin contrastar', { size: 18, bold: true, color: 'C00000' }));
  return new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.borde, space: 4 } }, children: hijos })] });
}
function pie(texto) {
  return new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
    run(texto + ' — Página ', { size: 16, color: C.tenue }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: C.tenue, font: FUENTE }),
    run(' de ', { size: 16, color: C.tenue }), new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: C.tenue, font: FUENTE }),
  ] })] });
}
function portada({ modulo, sistema, cliente, fecha }) {
  const n = [new Paragraph({ spacing: { before: 1800 }, children: [] })];
  if (LOGO) n.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ data: LOGO, transformation: { width: 160, height: 96 } })] }));
  n.push(
    p([run(ORG.toUpperCase(), { size: 36, bold: true, color: C.secundario })], { alignment: AlignmentType.CENTER, spacing: { before: 300 } }),
    p([run('MANUAL DE USUARIO', { size: 48, bold: true, color: C.primario })], { alignment: AlignmentType.CENTER, spacing: { before: 200 } }),
    p([run('Módulo: ' + modulo, { size: 30, color: C.secundario })], { alignment: AlignmentType.CENTER, spacing: { before: 120, after: 900 } }),
    ficha([['Sistema', sistema], ['Cliente', cliente], ['Fecha', fecha]]),
    salto(),
  );
  return n;
}
function indice() {
  return [
    new Paragraph({ children: [run('Índice de contenido', { size: 32, bold: true, color: C.primario })], spacing: { after: 200 } }),
    new TableOfContents('Índice de contenido', { hyperlink: true, headingStyleRange: '1-3' }),
    p([run('Si el índice aparece vacío, en Word: clic derecho sobre él → «Actualizar campo» (o Ctrl+A y F9).', { size: 16, italics: true, color: C.tenue })]),
    salto(),
  ];
}

function documento({ hijos, pieTexto, borrador }) {
  return new D.Document({
    creator: ORG, title: 'Manual de usuario', features: { updateFields: true }, styles: estilos,
    sections: [{
      properties: { titlePage: true, page: { size: { width: PAGE.width, height: PAGE.height }, margin: PAGE.margin } },
      headers: { first: new Header({ children: [] }), default: encabezado(borrador) },
      footers: { first: new Footer({ children: [] }), default: pie(pieTexto) },
      children: hijos,
    }],
  });
}
const guardar = async (doc, out) => { fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true }); fs.writeFileSync(out, await D.Packer.toBuffer(doc)); };

module.exports = { MARCA, ORG, C, ANCHO, PH, ph, run, p, h1, h2, h3, vineta, salto, tabla, ficha, recuadro, figura, portada, indice, documento, guardar };
