#!/usr/bin/env node
// generar_tema.mjs — De un tema.json a: escalas de color, variables CSS (claro/oscuro), bloque @theme de Tailwind 4,
// preset de PrimeNG (@primeuix/themes) y reporte de contraste WCAG. Sin dependencias.
//   node scripts/generar_tema.mjs --tema tema.json --out <carpeta> [--permitir-contraste]
// Sale con código 1 si el JSON es inválido y con 2 si algún par de contraste obligatorio no cumple WCAG AA (salvo --permitir-contraste).
import fs from 'node:fs';
import path from 'node:path';

const arg = (n, d) => { const i = process.argv.indexOf('--' + n); if (i < 0) return d; const v = process.argv[i + 1]; return v && !v.startsWith('--') ? v : true; };
const temaPath = arg('tema'); const out = arg('out', 'tema-generado');
if (!temaPath || temaPath === true) { console.error('Uso: generar_tema.mjs --tema tema.json --out <carpeta> [--permitir-contraste]'); process.exit(1); }

// ---------- color ----------
const HEX = /^#([0-9a-f]{6})$/i;
const rgb = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const hex = (c) => '#' + c.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('').toUpperCase();
const mezcla = (a, b, t) => hex(rgb(a).map((v, i) => v + (rgb(b)[i] - v) * t));
const PASOS = { 50: ['#FFFFFF', 0.95], 100: ['#FFFFFF', 0.88], 200: ['#FFFFFF', 0.74], 300: ['#FFFFFF', 0.56], 400: ['#FFFFFF', 0.3], 500: [null, 0],
  600: ['#000000', 0.14], 700: ['#000000', 0.3], 800: ['#000000', 0.46], 900: ['#000000', 0.6], 950: ['#000000', 0.74] };
const escala = (base) => Object.fromEntries(Object.entries(PASOS).map(([k, [m, t]]) => [k, m ? mezcla(base, m, t) : base.toUpperCase()]));
const lum = (h) => { const [r, g, b] = rgb(h).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contraste = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

// ---------- validación ----------
let T;
try { T = JSON.parse(fs.readFileSync(temaPath, 'utf8')); } catch (e) { console.error('✖ tema.json no se pudo leer: ' + e.message); process.exit(1); }
const errores = [];
if (!/^[a-z][a-z0-9-]*$/.test(T.nombre || '')) errores.push('nombre: requerido, en kebab-case (p. ej. "mi-marca")');
const C = T.colores || {};
const REQ = ['primario', 'superficie']; const OPC = ['secundario', 'exito', 'advertencia', 'error', 'info'];
for (const k of REQ) if (!HEX.test(C[k] || '')) errores.push(`colores.${k}: requerido, hex de 6 dígitos (#RRGGBB)`);
for (const k of OPC) if (C[k] !== undefined && !HEX.test(C[k])) errores.push(`colores.${k}: hex de 6 dígitos (#RRGGBB)`);
for (const k of Object.keys(C)) if (![...REQ, ...OPC].includes(k)) errores.push(`colores.${k}: clave no reconocida (usa ${[...REQ, ...OPC].join(', ')})`);
if (errores.length) { console.error('✖ tema.json inválido:\n  - ' + errores.join('\n  - ')); process.exit(1); }
const SEM = { exito: '#15803D', advertencia: '#B45309', error: '#B91C1C', info: '#1D4ED8', ...Object.fromEntries(OPC.filter(k => C[k]).map(k => [k, C[k]])) };
const tipo = { familia: 'system-ui, sans-serif', tamano_base: '14px', ...(T.tipografia || {}) };
const radio = T.radio || '6px';
const oscuro = { habilitado: true, selector: '.app-dark', ...(T.modo_oscuro || {}) };

// ---------- escalas y semántica ----------
const paletas = { primario: escala(C.primario), superficie: escala(C.superficie) };
if (C.secundario) paletas.secundario = escala(C.secundario);
for (const k of Object.keys(SEM)) paletas[k] = escala(SEM[k]);
const P = paletas;
// Tono del botón: el paso de la escala más cercano a 500 que da ≥4.5:1 con blanco (para que el texto del botón cumpla AA).
const pasoBoton = (p) => ['500', '600', '700', '800'].find(s => contraste(p[s], '#FFFFFF') >= 4.5) || '900';
const claro = { fondo: '#FFFFFF', texto: P.superficie['900'], textoTenue: P.superficie['600'], borde: P.superficie['200'],
  primario: P.primario[pasoBoton(P.primario)], textoSobrePrimario: '#FFFFFF' };
const oscuroSem = { fondo: P.superficie['950'], texto: P.superficie['50'], textoTenue: P.superficie['300'], borde: P.superficie['700'],
  primario: P.primario['300'], textoSobrePrimario: P.superficie['950'] };

// ---------- contraste ----------
const pares = [
  ['Texto sobre fondo (claro)', claro.texto, claro.fondo, 4.5], ['Texto tenue sobre fondo (claro)', claro.textoTenue, claro.fondo, 4.5],
  ['Texto sobre botón primario (claro)', claro.textoSobrePrimario, claro.primario, 4.5], ['Borde de control (claro)', claro.borde, claro.fondo, 1.0],
];
if (oscuro.habilitado) pares.push(['Texto sobre fondo (oscuro)', oscuroSem.texto, oscuroSem.fondo, 4.5], ['Texto tenue sobre fondo (oscuro)', oscuroSem.textoTenue, oscuroSem.fondo, 4.5],
  ['Texto sobre botón primario (oscuro)', oscuroSem.textoSobrePrimario, oscuroSem.primario, 4.5]);
for (const k of Object.keys(SEM)) pares.push([`Texto blanco sobre ${k}`, '#FFFFFF', P[k][pasoBoton(P[k])], 4.5]);
const filas = pares.map(([n, a, b, min]) => ({ n, a, b, r: contraste(a, b), min, ok: contraste(a, b) >= min }));
const fallas = filas.filter(f => !f.ok);

// ---------- salidas ----------
fs.mkdirSync(out, { recursive: true });
const vars = (obj, pref) => Object.entries(obj).map(([k, v]) => `  --${pref}${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}: ${v};`).join('\n');
const escalasCss = Object.entries(P).map(([n, e]) => Object.entries(e).map(([s, v]) => `  --color-${n}-${s}: ${v};`).join('\n')).join('\n');
const css = `/* Generado por generar_tema.mjs desde ${path.basename(temaPath)} — no editar a mano: cambia el JSON y vuelve a generar. */
:root {
${escalasCss}
${vars(claro, 'tema-')}
  --tema-fuente: ${tipo.familia};
  --tema-tamano-base: ${tipo.tamano_base};
  --tema-radio: ${radio};
}
${oscuro.habilitado ? `${oscuro.selector} {\n${vars(oscuroSem, 'tema-')}\n}\n` : ''}`;
fs.writeFileSync(path.join(out, 'tema.css'), css);

const twNames = { primario: 'primary', secundario: 'secondary', superficie: 'surface', exito: 'success', advertencia: 'warning', error: 'danger', info: 'info' };
const tw = `/* Tailwind 4: @import "tailwindcss"; y después este archivo. Generado; no editar a mano. */
@theme {
${Object.entries(P).map(([n, e]) => Object.entries(e).map(([s, v]) => `  --color-${twNames[n]}-${s}: ${v};`).join('\n')).join('\n')}
  --font-sans: ${tipo.familia};
  --radius-tema: ${radio};
}
`;
fs.writeFileSync(path.join(out, 'tailwind-theme.css'), tw);

const id = T.nombre.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase()) + 'Preset';
const obj = (e) => '{ ' + Object.entries(e).map(([s, v]) => `${s}: '${v}'`).join(', ') + ' }';
const preset = `// Generado por generar_tema.mjs desde ${path.basename(temaPath)} — no editar a mano.
// Uso (Angular): providePrimeNG({ theme: { preset: ${id}, options: { darkModeSelector: '${oscuro.habilitado ? oscuro.selector : 'none'}' } } })
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

export const ${id} = definePreset(Aura, {
  semantic: {
    primary: ${obj(P.primario)},
    colorScheme: {
      light: {
        surface: { 0: '#FFFFFF', ...${obj(P.superficie)} },
        primary: { color: '${claro.primario}', contrastColor: '${claro.textoSobrePrimario}', hoverColor: '${P.primario['700']}', activeColor: '${P.primario['800']}' },
      },
      dark: {
        surface: { 0: '#FFFFFF', ...${obj(P.superficie)} },
        primary: { color: '${oscuroSem.primario}', contrastColor: '${oscuroSem.textoSobrePrimario}', hoverColor: '${P.primario['200']}', activeColor: '${P.primario['100']}' },
      },
    },
  },
});
`;
fs.writeFileSync(path.join(out, `${T.nombre}.preset.ts`), preset);

const rep = [`# Contraste del tema «${T.nombre}»`, '', 'Mínimo WCAG 2.1 AA: 4.5:1 para texto normal. El borde solo se lista (no es texto).', '',
  '| Par | Primer plano | Fondo | Razón | Mínimo | Resultado |', '|---|---|---|---|---|---|',
  ...filas.map(f => `| ${f.n} | \`${f.a}\` | \`${f.b}\` | ${f.r.toFixed(2)}:1 | ${f.min}:1 | ${f.ok ? 'cumple' : '**NO CUMPLE**'} |`), ''];
fs.writeFileSync(path.join(out, 'contraste.md'), rep.join('\n'));

console.log(`✓ ${out}/tema.css · tailwind-theme.css · ${T.nombre}.preset.ts · contraste.md`);
if (fallas.length) {
  console.error(`✖ ${fallas.length} par(es) no cumplen WCAG AA:\n  - ` + fallas.map(f => `${f.n}: ${f.r.toFixed(2)}:1`).join('\n  - '));
  if (!process.argv.includes('--permitir-contraste')) process.exit(2);
}
