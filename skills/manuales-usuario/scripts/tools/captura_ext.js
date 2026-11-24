#!/usr/bin/env node
// captura_ext.js — Capturas con la extensión Claude in Chrome (alternativa a capturar.js).
// El guion sigue siendo la única fuente: cada escena tiene id, archivo, ruta/acciones/resaltar. La IA recorre la escena en el
// navegador con la extensión, toma la captura con save_to_disk y la REGISTRA aquí; el script valida y la coloca con el nombre del guion.
//
//   node captura_ext.js estado   --guion <guion.json>
//   node captura_ext.js registrar --guion <guion.json> --id <id> --origen <imagen> --revisado [--nota "texto"]
//
//   estado     lista cada escena: archivo, modo (ext/auto), si ya existe y qué hacer (ruta, acciones, resaltar).
//   registrar  copia <origen> a <salida>/<archivo>. Valida que sea imagen del tamaño esperado y que la extensión del
//              archivo coincida con el formato real (la extensión entrega JPEG: usa «.jpg» en el guion). --revisado atestigua
//              que se miró la imagen y NO muestra credenciales ni datos personales reales; sin él se rechaza.
//   Deja el rastro en <salida>/_registro.json (id, archivo, fecha, píxeles, origen, nota, modo "extension").
const fs = require('fs');
const path = require('path');

const cmd = process.argv[2];
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); if (i < 0) return d; const v = process.argv[i + 1]; return v && !v.startsWith('--') ? v : true; };
const has = (n) => process.argv.includes('--' + n);
const guionPath = arg('guion');
const fail = (m) => { console.error('✖ ' + m); process.exit(2); };
if (!['estado', 'registrar'].includes(cmd) || !guionPath || guionPath === true) {
  console.error('Uso: captura_ext.js estado|registrar --guion <guion.json> [--id <id> --origen <imagen> --revisado [--nota <texto>]]'); process.exit(1);
}
const G = JSON.parse(fs.readFileSync(guionPath, 'utf8'));
const BASE = path.dirname(path.resolve(guionPath));
const salida = path.resolve(BASE, G.salida || 'capturas');
const vp = G.viewport || { width: 1366, height: 768 };
const regPath = path.join(salida, '_registro.json');
const leerReg = () => { try { return JSON.parse(fs.readFileSync(regPath, 'utf8')); } catch (_) { return {}; } };

function formato(buf) {
  if (buf.length > 8 && buf[0] === 0x89 && buf.slice(1, 4).toString() === 'PNG') return { fmt: 'png', w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  if (buf.length > 4 && buf[0] === 0xFF && buf[1] === 0xD8) {
    let o = 2;
    while (o < buf.length) {
      if (buf[o] !== 0xFF) { o++; continue; }
      const mk = buf[o + 1];
      if (mk >= 0xC0 && mk <= 0xCF && ![0xC4, 0xC8, 0xCC].includes(mk)) return { fmt: 'jpg', h: buf.readUInt16BE(o + 5), w: buf.readUInt16BE(o + 7) };
      o += 2 + buf.readUInt16BE(o + 2);
    }
  }
  return null;
}

if (cmd === 'estado') {
  const reg = leerReg();
  let falta = 0;
  for (const e of G.escenas || []) {
    const ok = fs.existsSync(path.join(salida, e.archivo));
    if (!ok) falta++;
    const modo = e.modo === 'extension' ? 'ext' : (G.modo === 'extension' ? 'ext' : 'auto');
    console.log((ok ? '✓' : '·') + ' ' + String(e.id).padEnd(4) + e.archivo.padEnd(34) + modo.padEnd(5) + (ok ? (reg[e.id] ? 'registrada ' + reg[e.id].fecha : 'existe') : 'FALTA'));
    if (!ok) console.log('      ' + [e.ruta ? 'ruta ' + e.ruta : (e.continuar ? 'continúa de la escena anterior' : ''),
      e.acciones ? 'acciones: ' + JSON.stringify(e.acciones) : '', e.resaltar ? 'resaltar: ' + JSON.stringify(e.resaltar) : '', e.recorte ? 'recorte: ' + e.recorte : ''].filter(Boolean).join(' · '));
  }
  console.log(falta ? '\n' + falta + ' escena(s) por capturar.' : '\n✓ Todas las escenas tienen archivo.');
  process.exit(falta ? 3 : 0);
}

// registrar
const id = arg('id'), origen = arg('origen');
if (!id || id === true || !origen || origen === true) fail('Faltan --id y --origen.');
const esc = (G.escenas || []).find(e => String(e.id) === String(id));
if (!esc) fail('La escena «' + id + '» no existe en el guion.');
if (!has('revisado')) fail('Falta --revisado: confirma que miraste la imagen y no muestra credenciales ni datos personales reales.');
if (!fs.existsSync(origen)) fail('No existe ' + origen);
const buf = fs.readFileSync(origen), f = formato(buf);
if (!f) fail(origen + ' no es PNG ni JPEG.');
const extArchivo = path.extname(esc.archivo).slice(1).toLowerCase().replace('jpeg', 'jpg');
if (extArchivo !== f.fmt) fail('La imagen es ' + f.fmt.toUpperCase() + ' pero el guion espera «' + esc.archivo + '». Cambia el archivo de la escena y el paso.captura del payload a .' + f.fmt + '.');
const avisos = [];
if (f.w < 800) avisos.push('ancho ' + f.w + ' px (<800): ¿la ventana estaba pequeña?');
const esperado = vp.width / vp.height;
if (!esc.recorte || esc.recorte === 'pantalla') { if (Math.abs(f.w / f.h - esperado) > 0.15) avisos.push('proporción ' + (f.w / f.h).toFixed(2) + ' distinta de la del guion (' + esperado.toFixed(2) + ')'); }
fs.mkdirSync(salida, { recursive: true });
fs.copyFileSync(origen, path.join(salida, esc.archivo));
const reg = leerReg();
reg[esc.id] = { archivo: esc.archivo, fecha: new Date().toISOString().slice(0, 10), px: f.w + 'x' + f.h, origen: path.basename(origen), nota: arg('nota', '') === true ? '' : arg('nota', ''), modo: 'extension' };
fs.writeFileSync(regPath, JSON.stringify(reg, null, 2), 'utf8');
console.log('✓ ' + esc.archivo + ' (' + f.w + '×' + f.h + ') registrada.');
avisos.forEach(a => console.log('⚠ ' + a));
