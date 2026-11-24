#!/usr/bin/env node
// validar_reglas.js — Compuerta de la Fase 2: verifica reglas_contrastadas.md antes de redactar el manual.
//   node validar_reglas.js --reglas <reglas_contrastadas.md> [--repo <raíz del sistema>]
// --repo: comprueba que cada evidencia ruta:línea exista (rutas relativas a esa raíz).
// Sale con 2 si hay errores. Los avisos no bloquean.
const R = require('./lib/reglas');
const arg = (n) => { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : undefined; };
const md = arg('reglas'), repo = arg('repo');
if (!md) { console.error('Uso: validar_reglas.js --reglas <archivo.md> [--repo <raíz>]'); process.exit(1); }

const reglas = R.leer(md);
if (!reglas.length) { console.error('✖ No se encontró ninguna regla RN-xx en una tabla con columnas ID … Estado.'); process.exit(2); }
const { errores, avisos } = R.verificar(reglas, repo);

const cuenta = {};
for (const r of reglas) cuenta[r.estado] = (cuenta[r.estado] || 0) + 1;
console.log('Reglas: ' + reglas.length + ' · ' + Object.entries(cuenta).map(([k, v]) => k + '=' + v).join(' · '));
const cit = R.citables(reglas);
console.log('Citables en el manual: ' + cit.size + ' (' + [...cit.keys()].join(', ') + ')');
const bloq = reglas.filter(r => !cit.has(r.id));
if (bloq.length) console.log('No citables (requieren decisión humana o no existen en el sistema): ' + bloq.map(r => r.id + '[' + r.estado + ']').join(', '));
for (const a of avisos) console.log('⚠ ' + a);
if (errores.length) { console.error('✖ ' + errores.length + ' error(es):'); for (const e of errores) console.error('   · ' + e); process.exit(2); }
console.log('✓ reglas_contrastadas.md es coherente' + (repo ? ' y su evidencia existe en ' + repo : ' (evidencia no verificada: usa --repo)') + '.');
