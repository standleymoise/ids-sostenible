import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { compute, balance } from '../js/engine.js';
import { monteCarlo, mulberry32 } from '../js/sensitivity.js';

const load = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const model = load('../data/indicators.json');
const { answers } = load('./fixture-excel.json');

test('mulberry32 es reproducible', () => {
  const a = mulberry32(1); const b = mulberry32(1);
  assert.deepEqual([a(), a(), a()], [b(), b(), b()]);
});

test('Monte Carlo: reproducible, intervalo contiene el valor base y es estrecho con δ pequeño', () => {
  const r1 = monteCarlo(model, answers, { runs: 300, delta: 0.2, seed: 7 });
  const r2 = monteCarlo(model, answers, { runs: 300, delta: 0.2, seed: 7 });
  assert.deepEqual(r1, r2);
  assert.ok(r1.p05 <= r1.base && r1.base <= r1.p95, `${r1.p05} ${r1.base} ${r1.p95}`);
  assert.ok(r1.p95 - r1.p05 < 0.2);
  const tiny = monteCarlo(model, answers, { runs: 100, delta: 0.001, seed: 7 });
  assert.ok(tiny.p95 - tiny.p05 < 0.01);
  assert.ok(r1.categoryStability > 0 && r1.categoryStability <= 1);
});

test('Monte Carlo: más variación de pesos → intervalo más ancho', () => {
  const lo = monteCarlo(model, answers, { runs: 300, delta: 0.1, seed: 3 });
  const hi = monteCarlo(model, answers, { runs: 300, delta: 0.5, seed: 3 });
  assert.ok(hi.sd > lo.sd);
});

test('Monte Carlo devuelve null con respuestas incompletas', () => {
  assert.equal(monteCarlo(model, { env01_1: 1 }), null);
});

test('equilibrio: dimensión más débil y co-limitación', () => {
  const r = compute(model, answers);
  const b = r.balance;
  assert.equal(b.weakest, 'political'); // 0,70 es la dimensión más baja del ejemplo del Excel
  assert.ok(Math.abs(b.balanced - (b.weakestNorm + r.global.norm) / 2) < 1e-9);
  assert.ok(b.balanced <= r.global.norm + 1e-12);
  assert.deepEqual(b.low, []);
  const weak = balance(model, { global: { norm: 0.6 }, dimensions: { environmental: { norm: 0.9 }, social: { norm: 0.2 }, economic: { norm: 0.7 }, political: { norm: 0.3 } } });
  assert.deepEqual(weak.low, ['political', 'social']); // orden del modelo
  assert.equal(weak.weakest, 'social');
});
