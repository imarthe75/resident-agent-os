#!/usr/bin/env node
// gen_schema.js — Genera el JSON Schema (2020-12) de una plantilla desde su manifiesto.
// Genera el esquema JSON a partir del manifiesto: una sola runtime y UTF-8 garantizado.
//   node scripts/tools/gen_schema.js <manifiesto.yaml> <salida.schema.json>
// Reglas: van en el payload las autorías ia, derivado y humano-declarado; humano/auto NO.
// Tipos: texto (default) · lista (strings, admite enum y cardinalidad) · objetos (arreglo de objetos con subcampos).
// opcional: true → no requerido. solo_si: {campo: [valores]} → if/then.
const fs = require('fs');
const yaml = require('js-yaml');

const [, , manPath, outPath] = process.argv;
if (!manPath || !outPath) { console.error('Uso: gen_schema.js <manifiesto.yaml> <salida.schema.json>'); process.exit(1); }
const man = yaml.load(fs.readFileSync(manPath, 'utf8'));
const cod = man.plantilla.codigo;
const stem = (id) => String(id).split('.').pop();
const PAY = ['ia', 'derivado', 'humano-declarado'];

const DEFS = {
  textoLimpio: {
    type: 'string', minLength: 1,
    not: { pattern: '\\[(Cierto|Probable|Suponiendo)\\]|como (IA|modelo|asistente)|«[^»]*»' }
  }
};

function card(s, f) {
  const c = f.cardinalidad;
  if (c) { if (c.min !== undefined) s.minItems = c.min; if (c.max !== undefined) s.maxItems = c.max; }
  return s;
}
function objeto(subcampos) {
  const props = {}, req = [];
  for (const s of subcampos || []) {
    if (s.autoria && !PAY.includes(s.autoria)) continue;
    props[stem(s.id)] = field(s);
    if (!s.opcional) req.push(stem(s.id));
  }
  return { props, req };
}
function field(f) {
  if (f.tipo === 'lista') {
    const s = { type: 'array', items: f.enum ? { type: 'string', enum: f.enum } : { $ref: '#/$defs/textoLimpio' } };
    if (f.enum) s.uniqueItems = true;
    return card(s, f);
  }
  if (f.tipo === 'objetos') {
    const { props, req } = objeto(f.subcampos);
    return card({ type: 'array', items: { type: 'object', additionalProperties: false, required: req, properties: props } }, f);
  }
  if (f.tipo === 'booleano') return { type: 'boolean' };
  if (f.enum) return { type: 'string', enum: f.enum };
  return { $ref: '#/$defs/textoLimpio' };
}

const props = { codigo: { const: cod } }, required = ['codigo'], conds = {};
for (const c of man.campos || []) {
  if (!PAY.includes(c.autoria)) continue;
  props[stem(c.id)] = field(c);
  if (c.solo_si) for (const [gov, vals] of Object.entries(c.solo_si)) (conds[gov] = conds[gov] || []).push([stem(c.id), vals, !!c.opcional]);
  else if (!c.opcional) required.push(stem(c.id));
}
for (const b of man.bloques_repetibles || []) {
  const { props: sp, req: sr } = objeto(b.subcampos);
  if (!Object.keys(sp).length) continue; // bloque bitácora: solo humano
  const c = b.cardinalidad || {};
  props[stem(b.id)] = {
    type: 'array', minItems: c.min !== undefined ? c.min : 1, maxItems: c.max !== undefined ? c.max : 99,
    items: { type: 'object', additionalProperties: false, required: sr, properties: sp }
  };
  if (!b.opcional) required.push(stem(b.id));
}
const allOf = [];
for (const [gov, lst] of Object.entries(conds)) {
  const vals = new Set(lst.flatMap(x => x[1]));
  for (const v of vals) {
    const then = { required: lst.filter(x => x[1].includes(v) && !x[2]).map(x => x[0]), properties: {} };
    for (const x of lst) if (!x[1].includes(v)) then.properties[x[0]] = false;
    allOf.push({ if: { properties: { [gov]: { const: v } }, required: [gov] }, then });
  }
}
const schema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: cod + '.schema.json',
  title: 'Payload ' + cod + ' — ' + man.plantilla.nombre,
  type: 'object', additionalProperties: false, required, $defs: DEFS, properties: props
};
if (allOf.length) schema.allOf = allOf;
fs.writeFileSync(outPath, JSON.stringify(schema, null, 2) + '\n', { encoding: 'utf8' });
console.log('✓ Esquema ' + cod + ' → ' + outPath + ' (' + required.length + ' requeridos, ' + Object.keys(props).length + ' propiedades)');
