import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { compute } from '../js/engine.js';
import { validate, buildIndex } from '../js/consistency.js';

const load = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const v10 = load('../data/indicators.json');
const v11 = load('../data/indicators-1.1.json');
const tx = { es: { ...load('../data/i18n.es.json'), ...load('../data/i18n-1.1.es.json') }, en: { ...load('../data/i18n.en.json'), ...load('../data/i18n-1.1.en.json') } };
const dim = (m, id) => m.dimensions.find((d) => d.id === id);
const items = (m) => m.dimensions.flatMap((d) => d.indicators.flatMap((i) => i.items));
const sum = (xs) => xs.reduce((a, b) => a + b, 0);

test('versiones: 1.0 = tesis (41/180) y 1.1 = política ampliada (46/203)', () => {
  assert.equal(v10.instrument, '1.0'); assert.equal(v11.instrument, '1.1');
  assert.equal(v10.dimensions.flatMap((d) => d.indicators).length, 41);
  assert.equal(items(v10).length, 180);
  assert.equal(v11.dimensions.flatMap((d) => d.indicators).length, 46);
  assert.equal(items(v11).length, 203);
});

test('la 1.1 solo cambia la dimensión política: las otras tres son idénticas a la 1.0', () => {
  for (const id of ['environmental', 'social', 'economic']) assert.deepEqual(dim(v11, id), dim(v10, id));
  assert.deepEqual(v11.dimensions.map((d) => [d.id, d.weight]), v10.dimensions.map((d) => [d.id, d.weight])); // el peso de la dimensión política no cambia (0,10)
});

test('política 1.1: conserva el indicador original con sus 7 afirmaciones y suma pesos 1', () => {
  const p10 = dim(v10, 'political'); const p11 = dim(v11, 'political');
  assert.equal(p11.indicators.length, 6);
  const orig = p11.indicators.find((i) => i.id === 'pol01');
  assert.deepEqual(orig.items, p10.indicators[0].items); // mismas afirmaciones y pesos internos
  assert.ok(Math.abs(sum(p11.indicators.map((i) => i.weight)) - 1) < 1e-9);
});

test('indicadores nuevos: pesos positivos suman 1, a lo sumo una afirmación negativa moderada', () => {
  for (const ind of dim(v11, 'political').indicators.filter((i) => i.id !== 'pol01')) {
    assert.ok(Math.abs(sum(ind.items.filter((i) => i.weight > 0).map((i) => i.weight)) - 1) < 1e-9, ind.id);
    const neg = ind.items.filter((i) => i.weight < 0);
    assert.ok(neg.length <= 1 && neg.every((n) => n.weight >= -0.3), ind.id);
    assert.ok(ind.items.length >= 4 && ind.items.length <= 6, ind.id);
  }
});

test('todos los textos de la 1.1 existen en español e inglés', () => {
  for (const lang of ['es', 'en']) {
    for (const d of v11.dimensions) for (const i of d.indicators) {
      assert.ok(tx[lang][`ind.${i.id}`], `${lang} ${i.id}`);
      for (const it of i.items) assert.ok(tx[lang][`item.${it.id}`], `${lang} ${it.id}`);
    }
  }
  const nuevos = items(v11).filter((it) => !it.id.startsWith('pol01'));
  assert.ok(nuevos.filter((it) => /^pol0[2-6]/.test(it.id)).every((it) => tx.en[`item.${it.id}`] !== tx.es[`item.${it.id}`]));
});

test('ids únicos y sin colisiones entre versiones con significado distinto', () => {
  const ids = items(v11).map((i) => i.id);
  assert.equal(new Set(ids).size, ids.length);
  const m10 = new Map(items(v10).map((i) => [i.id, i.weight]));
  for (const it of items(v11)) if (m10.has(it.id)) assert.equal(m10.get(it.id), it.weight, it.id);
});

test('el motor calcula la 1.1: extremos coherentes y política dentro de [0,1]', () => {
  const all = (v) => Object.fromEntries(items(v11).map((it) => [it.id, v]));
  const best = Object.fromEntries(items(v11).map((it) => [it.id, it.weight > 0 ? 1 : 0]));
  const worst = Object.fromEntries(items(v11).map((it) => [it.id, it.weight > 0 ? 0 : 1]));
  assert.equal(compute(v11, all(0)).global.raw, 0);
  const rb = compute(v11, best); const rw = compute(v11, worst);
  assert.ok(rb.dimensions.political.norm > 0.95 && rw.dimensions.political.norm < 0.05, `${rb.dimensions.political.norm} ${rw.dimensions.political.norm}`);
  assert.ok(rb.global.norm > rw.global.norm);
});

test('una evaluación 1.0 no está completa en la 1.1 (faltan las afirmaciones nuevas)', () => {
  const a = Object.fromEntries(items(v10).map((it) => [it.id, 1]));
  assert.equal(compute(v10, a).complete, true);
  assert.equal(compute(v11, a).complete, false);
  assert.equal(compute(v11, a).indicators.pol02.done, false);
});

test('regla de coherencia nueva: el seguimiento del plan exige que exista el plan', () => {
  const idx = buildIndex(load('../data/constraints.json'));
  assert.equal(validate(idx, { pol04_3: 1, pol04_1: 0 }).length, 1);
  assert.equal(validate(idx, { pol04_3: 1, pol04_1: 1 }).length, 0);
});
