// build_manual.js — Manual de usuario de módulo (builder determinista; lo invoca render.js).
//   CA_VALUES=valores.json CA_OUT=salida.docx [CA_PAYLOAD_DIR=carpeta] [CA_BORRADOR=1] node build_manual.js
// Los valores llegan por STEM (sistema, modulo, tarea…) + _control + _codigo. Ausente ⇒ marcador «____».
// Numeración de secciones, pasos y figuras: SIEMPRE calculada aquí (análisis 03, D3).
const fs = require('fs');
const path = require('path');
const M = require('./manual_mold');
const { ph, run, p, h1, h2, h3, vineta, tabla, ficha, recuadro, figura } = M;
const R = require('./lib/reglas');

const V = JSON.parse(fs.readFileSync(process.env.CA_VALUES, 'utf8'));
const OUT = process.env.CA_OUT;
const BASE = process.env.CA_PAYLOAD_DIR || process.cwd();
const BORRADOR = process.env.CA_BORRADOR === '1';
const lista = (v) => Array.isArray(v) ? v.filter(x => x !== undefined && x !== null && String(x).trim() !== '') : [];
const sinRN = (s) => R.quitarPrefijo(s);
const ctl = V._control || {};
const codigo = V._codigo || M.MARCA.codigo_documento || M.MARCA.plantilla || 'MANUAL-USUARIO';
const fecha = ph(ctl.fecha);

const hijos = [];
const faltantes = [];
let nPaso = 0, nFig = 0, nH1 = 0;
const H1 = (t) => { nH1++; hijos.push(h1(nH1 + '. ' + t)); };

// ---- Portada e índice ----
hijos.push(...M.portada({ modulo: ph(V.modulo), sistema: ph(V.sistema), cliente: ph(V.cliente), fecha }));
hijos.push(...M.indice());

// ---- 1. Información general ----
H1('Información general');
hijos.push(ficha([
  ['Nombre del sistema', ph(V.sistema)], ['Cliente / Titular', ph(V.cliente)], ['Clave de proyecto', ph(V.clave_proyecto)],
  ['Módulo documentado', ph(V.modulo)], ['Código del documento', codigo], ['Versión', ph(ctl.version, '1.0')],
  ['Fecha de emisión', fecha], ['Elaborado por', ph(ctl.autor, M.ORG)],
]));

// ---- 2. Introducción ----
H1('Introducción');
for (const t of lista(V.descripcion)) hijos.push(p(t));
hijos.push(h2('Objetivo'), p(ph(V.objetivo)));
hijos.push(h2('Público / rol usuario'), p(ph(V.publico)));
hijos.push(h2('¿Para qué sirve?'));
for (const t of lista(V.para_que_sirve)) hijos.push(vineta(t));
for (const c of lista(V.concepto)) {
  hijos.push(h2(ph(c.titulo)));
  for (const t of lista(c.parrafos)) hijos.push(p(t));
  for (const t of lista(c.vinetas)) hijos.push(vineta(t));
}

// ---- 3. Acceso al sistema ----
H1('Acceso al sistema');
hijos.push(p('Para ingresar al módulo ' + ph(V.modulo) + ', el usuario debe contar con credenciales válidas y cumplir con los siguientes requisitos:'));
const acceso = [['URL de acceso', ph(V.url_acceso)], ['Navegadores compatibles', ph(V.navegadores)], ['Resolución recomendada', ph(V.resolucion)]];
if (V.conexion) acceso.push(['Conexión', V.conexion]);
acceso.push(['Perfil requerido', ph(V.perfil_requerido)], ['Credenciales', 'Usuario y contraseña asignados por el administrador del sistema']);
hijos.push(ficha(acceso));

// ---- 4. Módulos del sistema ----
H1('Módulos del sistema');
const sec4 = nH1;
hijos.push(h2(ph(V.modulo)));
if (V.ubicacion_menu) hijos.push(p([run('Ubicación en el menú: ', { bold: true }), run(V.ubicacion_menu)]));
hijos.push(h3('Tabla de funcionalidades'));
hijos.push(tabla([35, 65], ['Funcionalidad', 'Descripción'], lista(V.funcionalidad).map(f => [ph(f.nombre), ph(f.descripcion)])));
hijos.push(h3('Procedimiento'));

lista(V.tarea).forEach((t, i) => {
  hijos.push(h3(sec4 + '.' + (i + 1) + ' ' + ph(t.titulo)));
  if (t.intro) hijos.push(p(t.intro));
  for (const paso of lista(t.pasos)) {
    nPaso++;
    hijos.push(p([run(nPaso + '. ', { bold: true, color: M.C.primario }), run(ph(paso.texto))], { indent: { left: 360, hanging: 360 }, keepNext: !!paso.captura }));
    if (paso.nota) hijos.push(recuadro('Nota importante:', [sinRN(paso.nota)]));
    if (paso.captura) {
      nFig++;
      const f = figura(path.resolve(BASE, paso.captura), nFig, paso.pie || paso.texto);
      if (!f.ok) faltantes.push(paso.captura);
      hijos.push(...f.nodos);
    }
  }
  const reglas = lista(t.reglas).map(sinRN);
  if (reglas.length) hijos.push(recuadro('Importante:', reglas));
});

const mensajes = lista(V.mensaje);
if (mensajes.length) {
  hijos.push(h2('Mensajes del sistema'));
  hijos.push(p('Mensajes que el sistema puede mostrar en este módulo, cuándo aparecen y qué hacer.'));
  hijos.push(tabla([38, 30, 32], ['Mensaje en pantalla', 'Cuándo aparece', 'Qué hacer'], mensajes.map(m => [ph(m.texto), ph(m.cuando), ph(m.que_hacer)])));
}

// ---- Consideraciones (opcional) ----
const cons = lista(V.consideraciones).map(sinRN);
if (cons.length) { H1('Consideraciones'); for (const t of cons) hijos.push(vineta(t)); }

// ---- Preguntas frecuentes ----
H1('Preguntas frecuentes');
for (const q of lista(V.pregunta)) {
  hijos.push(p([run(ph(q.pregunta), { bold: true, color: M.C.secundario })], { keepNext: true, spacing: { before: 160, after: 60 } }));
  hijos.push(p(ph(q.respuesta)));
}

// ---- Glosario ----
H1('Glosario de términos');
hijos.push(tabla([30, 70], ['Término', 'Definición'], lista(V.termino).map(g => [ph(g.termino), ph(g.definicion)])));

// ---- Aprobaciones (firma SIEMPRE en blanco) ----
H1('Aprobaciones');
const ap = ctl.aprobador || {};
hijos.push(tabla([35, 35, 30], ['Nombre', 'Rol', 'Firma / Fecha'], [[ph(ap.nombre), ph(ap.rol, 'PM / Líder de Proyecto'), '']]));

// ---- Control de versiones ----
H1('Control de versiones');
const hist = lista(ctl.historial).length ? lista(ctl.historial)
  : [{ version: ctl.version, fecha: ctl.fecha, autor: ctl.autor, descripcion: ctl.descripcion_cambio }];
hijos.push(tabla([12, 18, 25, 45], ['Versión', 'Fecha', 'Autor', 'Descripción del cambio'],
  hist.map(h => [ph(h.version, '1.0'), ph(h.fecha), ph(h.autor), ph(h.descripcion, 'Elaboración inicial del manual de usuario del módulo ' + ph(V.modulo) + '.')])));

// ---- Escribir ----
const pieTexto = codigo + ' · ' + ph(V.sistema) + ' · ' + ph(V.modulo);
M.guardar(M.documento({ hijos, pieTexto, borrador: BORRADOR }), OUT)
  .then(() => { process.stdout.write(JSON.stringify({ pasos: nPaso, figuras: nFig, capturas_faltantes: faltantes }) + '\n'); })
  .catch(e => { console.error(e.stack || e.message); process.exit(1); });
