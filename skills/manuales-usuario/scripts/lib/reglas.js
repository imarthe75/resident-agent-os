// reglas.js — lectura y verificación de reglas_contrastadas.md (compartido por validar_reglas.js y render.js).
// Formato: una tabla Markdown con encabezado  | ID | Regla | Fuente | Front | Back | Estado | Decisión / nota |
// Evidencia: referencias `ruta:línea` o `ruta:inicio-fin` separadas por «;» o <br>; «—» o vacío = sin evidencia.
// Evidencia dinámica: `prueba:<ruta del script>@AAAA-MM-DD [nota]` (resultado de una prueba que cambió un campo a la vez, p. ej.
// docs/validacion/verificar_campos.py). La fecha es obligatoria: la prueba caduca si cambia el código que mide.
const fs = require('fs');
const path = require('path');

const ESTADOS = {
  confirmada:     { citable: true,  front: true,  back: true,  desc: 'Front y back implementan la regla tal como está documentada' },
  solo_front:     { citable: true,  front: true,  back: false, desc: 'Regla de interfaz (paginación, máscaras, botones deshabilitados); el back no la aplica' },
  solo_back:      { citable: true,  front: false, back: true,  desc: 'La aplica el back; el usuario la ve como mensaje tras guardar' },
  no_documentada: { citable: true,  front: null,  back: null,  desc: 'Está en el código pero no en reglas_negocio.md: el sistema lo hace; el analista debe agregarla a la fuente' },
  solo_vista_previa:{ citable: true, front: true, back: false, desc: 'El control cambia solo la vista previa del panel; el sistema real no lo aplica. Se documenta como limitación' },
  decidida:       { citable: true,  front: null,  back: null,  desc: 'Era discrepancia; un humano decidió qué se documenta (columna Decisión obligatoria)' },
  discrepancia:   { citable: false, front: null,  back: null,  desc: 'El .md dice una cosa y el código otra; NO se documenta hasta que un humano decida' },
  sin_efecto:     { citable: false, front: null,  back: null,  desc: 'El control existe pero no cambia nada (ni resultado real ni vista previa); NO se documenta como regla: va a Hallazgos' },
  no_implementada:{ citable: false, front: false, back: false, desc: 'Está en el .md pero no en el código; NO se documenta' },
};
const RN = /^RN-\d{2,3}$/;
const vacio = (s) => !s || /^(—|-|–|n\/a|na|ninguna?)$/i.test(s.trim());

function celdas(linea) {
  return linea.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
}
function refs(celda) {
  if (vacio(celda)) return [];
  return celda.split(/;|<br\s*\/?>/i).map(s => s.replace(/`/g, '').trim()).filter(Boolean).map(s => {
    const p = s.match(/^prueba:\s*(\S+?)(?:@(\S+))?(?:\s.*)?$/i);
    if (p) return { ref: s, tipo: 'prueba', archivo: p[1], fecha: p[2] || null };
    const m = s.match(/^(.+?):(\d+)(?:-(\d+))?(?:\s.*)?$/);
    return m ? { ref: s, archivo: m[1].trim(), desde: +m[2], hasta: m[3] ? +m[3] : +m[2] } : { ref: s, archivo: null };
  });
}

function leer(mdPath) {
  const txt = fs.readFileSync(mdPath, 'utf8');
  const lineas = txt.split(/\r?\n/);
  let cols = null; const reglas = [];
  for (const l of lineas) {
    if (!l.trim().startsWith('|')) continue;
    const c = celdas(l);
    const low = c.map(x => x.toLowerCase());
    if (low.includes('id') && low.some(x => x.startsWith('estado'))) {
      cols = {
        id: low.indexOf('id'), regla: low.findIndex(x => x.startsWith('regla')), fuente: low.findIndex(x => x.startsWith('fuente')),
        front: low.findIndex(x => x.startsWith('front')), back: low.findIndex(x => x.startsWith('back')),
        estado: low.findIndex(x => x.startsWith('estado')), decision: low.findIndex(x => x.startsWith('decisi')),
      };
      continue;
    }
    if (!cols || /^:?-{3,}/.test(c[0])) continue;
    const id = (c[cols.id] || '').replace(/[`*]/g, '').trim();
    if (!RN.test(id)) continue;
    reglas.push({
      id, regla: c[cols.regla] || '', fuente: cols.fuente >= 0 ? c[cols.fuente] || '' : '',
      front: refs(c[cols.front] || ''), back: refs(c[cols.back] || ''),
      estado: (c[cols.estado] || '').replace(/[`*]/g, '').trim().toLowerCase(),
      decision: cols.decision >= 0 ? (c[cols.decision] || '') : '',
    });
  }
  return reglas;
}

// Verifica coherencia. repo (opcional): raíz contra la que se resuelven las rutas de evidencia.
function verificar(reglas, repo) {
  const errores = [], avisos = [], vistos = new Set();
  const cacheLineas = {};
  const nLineas = (abs) => (cacheLineas[abs] = cacheLineas[abs] || fs.readFileSync(abs, 'utf8').split(/\r?\n/).length);
  for (const r of reglas) {
    if (vistos.has(r.id)) errores.push(r.id + ': ID duplicado'); vistos.add(r.id);
    const e = ESTADOS[r.estado];
    if (!e) { errores.push(r.id + ': estado «' + r.estado + '» inválido. Válidos: ' + Object.keys(ESTADOS).join(', ')); continue; }
    if (!r.regla || vacio(r.regla)) errores.push(r.id + ': falta el texto de la regla');
    if (e.front === true && !r.front.length) errores.push(r.id + ' (' + r.estado + '): falta evidencia de front');
    if (e.back === true && !r.back.length) errores.push(r.id + ' (' + r.estado + '): falta evidencia de back');
    if (e.front === false && r.front.length && r.estado !== 'no_implementada') avisos.push(r.id + ' (' + r.estado + '): tiene evidencia de front; ¿debería ser «confirmada»?');
    if (e.back === false && r.back.length && r.estado !== 'no_implementada') avisos.push(r.id + ' (' + r.estado + '): tiene evidencia de back; ¿debería ser «confirmada»?');
    if (r.estado === 'no_implementada' && (r.front.length || r.back.length)) errores.push(r.id + ': «no_implementada» no puede tener evidencia');
    if (['discrepancia', 'no_documentada', 'sin_efecto'].includes(r.estado) && !r.front.length && !r.back.length) errores.push(r.id + ' (' + r.estado + '): requiere al menos una evidencia de código');
    if (r.estado === 'decidida' && vacio(r.decision)) errores.push(r.id + ': «decidida» exige la decisión escrita (quién y qué se documenta)');
    if (r.estado === 'discrepancia' && /^\s*decidi[óo]\b|^\s*decisi[óo]n\s*:/i.test(r.decision)) avisos.push(r.id + ': la nota registra una decisión; si ya se resolvió, cambia el estado a «decidida»');
    for (const ref of [...r.front, ...r.back]) {
      if (ref.tipo === 'prueba') {
        const t = ref.fecha && /^\d{4}-\d{2}-\d{2}$/.test(ref.fecha) ? Date.parse(ref.fecha) : NaN;
        if (isNaN(t)) { errores.push(r.id + ': evidencia «' + ref.ref + '» exige fecha: prueba:<script>@AAAA-MM-DD'); continue; }
        const dias = (Date.now() - t) / 864e5;
        if (dias < -1) avisos.push(r.id + ': la fecha de la prueba (' + ref.fecha + ') es futura');
        else if (dias > 180) avisos.push(r.id + ': la prueba ' + ref.archivo + ' tiene ' + Math.round(dias) + ' días; repítela si el código cambió');
        if (repo && !fs.existsSync(path.resolve(repo, ref.archivo))) avisos.push(r.id + ': el script de prueba ' + ref.archivo + ' no está bajo --repo; no se pudo comprobar que exista');
        continue;
      }
      if (!ref.archivo) { errores.push(r.id + ': evidencia «' + ref.ref + '» sin formato ruta:línea'); continue; }
      if (!repo) continue;
      const abs = path.resolve(repo, ref.archivo);
      if (!fs.existsSync(abs)) { errores.push(r.id + ': no existe ' + ref.archivo + ' (relativo a ' + repo + ')'); continue; }
      const n = nLineas(abs);
      if (ref.hasta > n) errores.push(r.id + ': ' + ref.ref + ' fuera de rango (' + ref.archivo + ' tiene ' + n + ' líneas)');
    }
  }
  return { errores, avisos };
}

const citables = (reglas) => new Map(reglas.filter(r => ESTADOS[r.estado] && ESTADOS[r.estado].citable).map(r => [r.id, r]));
const PREF = /^\s*\[(RN-\d{2,3})\]\s*/;
const quitarPrefijo = (s) => String(s).replace(PREF, '');
const idDe = (s) => { const m = String(s).match(PREF); return m ? m[1] : null; };

module.exports = { ESTADOS, leer, verificar, citables, quitarPrefijo, idDe, PREF };
