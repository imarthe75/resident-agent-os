#!/usr/bin/env node
// capturar.js — Toma las capturas del manual a partir de un guion (Fase 4). Reproducible: misma UI ⇒ mismas imágenes.
//
//   1) Sesión (una vez por ambiente; abre un navegador visible para que la persona inicie sesión):
//        node capturar.js --guion guion_capturas.json --login
//   2) Capturas:
//        node capturar.js --guion guion_capturas.json [--solo 03] [--visible]
//
// El guion (ver references/plantillas/guion_capturas.template.json) define base_url, viewport, archivo de sesión,
// carpeta de salida y una lista de escenas: ruta, acciones, elementos a resaltar, recorte y archivo.
// Rutas relativas del guion se resuelven contra la carpeta del guion.
const fs = require('fs');
const path = require('path');

const arg = (n, d) => { const i = process.argv.indexOf('--' + n); if (i < 0) return d; const v = process.argv[i + 1]; return v && !v.startsWith('--') ? v : true; };
const guionPath = arg('guion');
if (!guionPath || guionPath === true) { console.error('Uso: capturar.js --guion <guion.json> [--login] [--solo <id>] [--visible]'); process.exit(1); }
const G = JSON.parse(fs.readFileSync(guionPath, 'utf8'));
const BASE = path.dirname(path.resolve(guionPath));
const abs = (p) => path.resolve(BASE, p);
const sesionPath = abs(G.estado_sesion || 'sesion.local.json');
const salida = abs(G.salida || 'capturas');
const viewport = G.viewport || { width: 1366, height: 768 };
const color = (G.resaltado && G.resaltado.color) || '#E53935';
const grosor = (G.resaltado && G.resaltado.grosor) || 3;

function cargarPlaywright() {
  const candidatos = [arg('pw'), 'playwright-core', 'playwright', '@playwright/test'].filter(x => x && x !== true);
  for (const c of candidatos) { try { const m = require(c); if (m.chromium) return m; } catch (_) {} }
  console.error('✖ No encuentro Playwright. En la carpeta de la skill: npm install   (o --pw <ruta a node_modules/playwright-core>)');
  process.exit(1);
}
const { chromium } = cargarPlaywright();

async function lanzar(headless) {
  const canales = G.navegador ? [G.navegador] : ['chrome', 'msedge', undefined];
  let ultimo;
  for (const channel of canales) {
    try { return await chromium.launch({ headless, channel }); } catch (e) { ultimo = e; }
  }
  throw ultimo;
}

// ---------- Modo sesión ----------
async function login() {
  const browser = await lanzar(false);
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  await page.goto(G.base_url);
  const hasta = G.login_listo_si ? new RegExp(G.login_listo_si) : null;
  console.log('➜ Inicia sesión en la ventana abierta.' + (hasta ? ' Se guardará al llegar a una URL que cumpla /' + G.login_listo_si + '/.' : ' Cuando termines, CIERRA la pestaña para guardar la sesión.'));
  const limite = Date.now() + (G.login_timeout_s || 300) * 1000;
  const guardar = async () => {
    const storage = await ctx.storageState();
    const session = await page.evaluate(() => { const o = {}; for (let i = 0; i < sessionStorage.length; i++) { const k = sessionStorage.key(i); o[k] = sessionStorage.getItem(k); } return o; }).catch(() => ({}));
    fs.writeFileSync(sesionPath, JSON.stringify({ storageState: storage, sessionStorage: session, origen: new URL(page.url()).origin }, null, 2));
  };
  const aviso = () => console.log('✓ Sesión guardada en ' + sesionPath + ' (no la subas al repositorio: contiene tokens).');
  let guardada = false;
  while (Date.now() < limite) {
    if (hasta) {
      if (hasta.test(page.url()) && !/login|auth|flow/i.test(page.url())) { await page.waitForTimeout(1500); await guardar(); guardada = true; break; }
      await page.waitForTimeout(1000); continue;
    }
    // Sin patrón: se guarda cada segundo mientras la pestaña está abierta; al cerrarla queda la última foto.
    const cerrada = await page.waitForEvent('close', { timeout: 1000 }).then(() => true).catch(() => false);
    if (cerrada) break;
    try { await guardar(); guardada = true; } catch (_) {}
  }
  if (guardada) aviso(); else console.log('✖ No se guardó la sesión (tiempo agotado).');
  await browser.close().catch(() => {});
}

// ---------- Acciones ----------
const loc = (page, sel) => page.locator(sel).first();
async function accion(page, a) {
  const t = { timeout: a.timeout || G.timeout_ms || 10000 };
  if (a.clic) return loc(page, a.clic).click(t);
  if (a.doble_clic) return loc(page, a.doble_clic).dblclick(t);
  if (a.escribir) return loc(page, a.escribir[0]).fill(String(a.escribir[1]), t);
  if (a.seleccionar) { await loc(page, a.seleccionar[0]).click(t); return loc(page, a.seleccionar[1]).click(t); }
  if (a.tecla) return page.keyboard.press(a.tecla);
  if (a.pasar) return loc(page, a.pasar).hover(t);
  if (a.esperar) return page.waitForTimeout(+a.esperar);
  if (a.esperar_selector) return loc(page, a.esperar_selector).waitFor({ state: 'visible', timeout: a.timeout || 15000 });
  if (a.ir) return page.goto(new URL(a.ir, G.base_url).toString());
  if (a.desplazar) return loc(page, a.desplazar).scrollIntoViewIfNeeded(t);
  throw new Error('Acción desconocida: ' + JSON.stringify(a));
}
async function resaltar(page, sels) {
  const hs = [];
  for (const s of [].concat(sels || [])) {
    const h = await loc(page, s).elementHandle({ timeout: 5000 }).catch(() => null);
    if (!h) { console.log('   ⚠ No encontré para resaltar: ' + s); continue; }
    await h.evaluate((el, o) => { el.dataset._muOutline = el.style.outline; el.dataset._muOffset = el.style.outlineOffset; el.style.outline = o.g + 'px solid ' + o.c; el.style.outlineOffset = '2px'; }, { c: color, g: grosor });
    hs.push(h);
  }
  return async () => { for (const h of hs) await h.evaluate(el => { el.style.outline = el.dataset._muOutline || ''; el.style.outlineOffset = el.dataset._muOffset || ''; }).catch(() => {}); };
}

async function capturas() {
  if (!fs.existsSync(sesionPath) && !G.sin_sesion) { console.error('✖ No hay sesión (' + sesionPath + '). Ejecuta primero con --login, o pon "sin_sesion": true si usas mocks.'); process.exit(1); }
  const S = fs.existsSync(sesionPath) ? JSON.parse(fs.readFileSync(sesionPath, 'utf8')) : {};
  fs.mkdirSync(salida, { recursive: true });
  const browser = await lanzar(!arg('visible'));
  const ctx = await browser.newContext({ viewport, storageState: S.storageState, locale: 'es-MX', deviceScaleFactor: G.escala || 1 });
  if (S.sessionStorage && Object.keys(S.sessionStorage).length) {
    await ctx.addInitScript(({ data, origen }) => { if (location.origin === origen) for (const [k, v] of Object.entries(data)) sessionStorage.setItem(k, v); }, { data: S.sessionStorage, origen: S.origen });
  }
  if (G.mocks) { const m = require(abs(G.mocks)); await (m.default || m)(ctx); }  // datos ficticios con ctx.route(...)
  const page = await ctx.newPage();
  const solo = arg('solo');
  const ok = [], fallos = [];
  for (const e of G.escenas || []) {
    if (solo && solo !== true && String(e.id) !== String(solo)) continue;
    if (e.modo === 'extension' || (G.modo === 'extension' && e.modo !== 'auto')) { console.log('· ' + e.id + ' ' + e.archivo + ': modo extensión (usa scripts/tools/captura_ext.js)'); continue; }
    try {
      if (e.ruta && !e.continuar) { await page.goto(new URL(e.ruta, G.base_url).toString()); await page.waitForLoadState('networkidle').catch(() => {}); }
      for (const a of e.acciones || []) await accion(page, a);
      await page.waitForTimeout(e.pausa !== undefined ? e.pausa : (G.pausa || 400));
      const quitar = await resaltar(page, e.resaltar);
      const archivo = path.join(salida, e.archivo || (e.id + '.' + (G.formato || 'png')));
      const tipo = /\.jpe?g$/i.test(archivo) ? 'jpeg' : 'png';
      const r = e.recorte || 'pantalla';
      if (r.startsWith('selector:')) await loc(page, r.slice(9)).screenshot({ path: archivo, type: tipo });
      else await page.screenshot({ path: archivo, fullPage: r === 'pagina', type: tipo });
      await quitar();
      ok.push(e.id); console.log('✓ ' + e.id + ' → ' + path.relative(BASE, archivo));
    } catch (err) {
      fallos.push(e.id); console.log('✖ ' + e.id + ': ' + String(err.message).split('\n')[0]);
      try { await page.screenshot({ path: path.join(salida, '_fallo_' + e.id + '.png') }); } catch (_) {}
    }
  }
  await browser.close();
  console.log('Capturas: ' + ok.length + ' ok · ' + fallos.length + ' con error' + (fallos.length ? ' (' + fallos.join(', ') + '; ver _fallo_*.png)' : ''));
  process.exit(fallos.length ? 2 : 0);
}

(arg('login') ? login() : capturas()).catch(e => { console.error('✖ ' + e.message); process.exit(1); });
