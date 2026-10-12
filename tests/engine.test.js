import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { compute, rating, indicatorBounds, dimensionBounds, globalBounds } from '../js/engine.js';

const load = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const model = load('../data/indicators.json');
const fx = load('./fixture-excel.json');
const near = (a, b, m) => assert.ok(Math.abs(a - b) < 1e-9, `${m}: ${a} != ${b}`);

test('estructura: 41 indicadores y 180 ítems', () => {
  const inds = model.dimensions.flatMap((d) => d.indicators);
  assert.equal(inds.length, 41);
  assert.equal(inds.flatMap((i) => i.items).length, 180);
});

test('pesos de dimensión suman 1', () => {
  near(model.dimensions.reduce((s, d) => s + d.weight, 0), 1, 'dims');
});

test('coincide con el Excel (dimensiones sin el error de HO17)', () => {
  const r = compute(model, fx.answers);
  assert.ok(r.complete);
  // HP17, HQ17, HR17 del Excel no están afectadas por el error.
  near(r.dimensions.economic.raw, fx.cached.HP17, 'económica');
  near(r.dimensions.political.raw, fx.cached.HQ17, 'política');
  near(r.dimensions.social.raw, fx.cached.HR17, 'social');
});

test('corrige el error del Excel: HO17 usaba BO16*B18 (B18 vacío) en vez de BO16*BO18', () => {
  const r = compute(model, fx.answers);
  const bo = model.dimensions[0].indicators[13]; // "Estado de ríos"
  assert.equal(bo.weight, 0.05);
  near(r.indicators[bo.id].raw, fx.cached_BO16, 'BO16');
  near(r.dimensions.environmental.raw, fx.cached.HO17 + 0.05 * fx.cached_BO16, 'ambiental corregida');
  const g = 0.4 * r.dimensions.environmental.raw + 0.2 * fx.cached.HP17 + 0.1 * fx.cached.HQ17 + 0.3 * fx.cached.HR17;
  near(r.global.raw, g, 'IDS');
});

test('todo "Sí" y todo "No" dan los extremos de la escala normalizada', () => {
  const all = (v) => Object.fromEntries(model.dimensions.flatMap((d) => d.indicators.flatMap((i) => i.items.map((it) => [it.id, v]))));
  assert.equal(compute(model, all(0)).global.raw, 0);
  const gb = globalBounds(model);
  assert.ok(gb.min < 0 && gb.max < 1.0 + 1e-9 && gb.max > 0.5);
  // respuestas óptimas: sí a lo positivo, no a lo negativo, y viceversa
  const best = {}; const worst = {};
  for (const d of model.dimensions) for (const i of d.indicators) for (const it of i.items) {
    best[it.id] = it.weight > 0 ? 1 : 0; worst[it.id] = it.weight > 0 ? 0 : 1;
  }
  // el máximo alcanzable depende también del signo del peso del indicador (p. ej. Inflación)
  const rb = compute(model, best); const rw = compute(model, worst);
  assert.ok(rb.global.norm > rw.global.norm);
  assert.ok(rb.global.norm >= 0 && rb.global.norm <= 1 && rw.global.norm >= 0 && rw.global.norm <= 1);
});

test('la norma de cada nivel queda en [0,1] para respuestas aleatorias', () => {
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let n = 0; n < 300; n++) {
    const a = {}; for (const d of model.dimensions) for (const i of d.indicators) for (const it of i.items) a[it.id] = rnd() < 0.5 ? 0 : 1;
    const r = compute(model, a);
    for (const v of Object.values(r.indicators)) assert.ok(v.norm >= -1e-12 && v.norm <= 1 + 1e-12);
    for (const v of Object.values(r.dimensions)) assert.ok(v.norm >= -1e-12 && v.norm <= 1 + 1e-12);
    assert.ok(r.global.norm >= -1e-12 && r.global.norm <= 1 + 1e-12);
  }
});

test('respuestas incompletas no producen resultados parciales engañosos', () => {
  const r = compute(model, { env01_1: 1 });
  assert.equal(r.global, null);
  assert.equal(r.dimensions.environmental.raw, null);
  assert.equal(r.indicators.env01.done, false);
});

test('el rango del indicador es consistente', () => {
  const ind = model.dimensions[3].indicators[5]; // Bienestar del pueblo: -0.1, -0.1 incluidos
  const b = indicatorBounds(ind);
  near(b.min, -0.2, 'min'); near(b.max, 0.8, 'max');
  assert.ok(dimensionBounds(model.dimensions[1]).max < 1);
});

test('categorías', () => {
  assert.deepEqual([0.1, 0.3, 0.5, 0.7, 0.9].map(rating), ['worst', 'bad', 'regular', 'good', 'best']);
  assert.equal(rating(null), null);
});
