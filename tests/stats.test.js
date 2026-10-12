import test from 'node:test';
import assert from 'node:assert/strict';
import { agreement, consensus, cronbachAlpha, spearman, kappaLabel } from '../js/stats.js';

const near = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) < tol, `${a} != ${b}`);

test('Fleiss κ: ejemplo calculado a mano (2 evaluadores, 4 ítems) = 0,4667', () => {
  const a = { i1: 1, i2: 1, i3: 0, i4: 0 };
  const b = { i1: 1, i2: 0, i3: 0, i4: 0 };
  const r = agreement([a, b], ['i1', 'i2', 'i3', 'i4']);
  near(r.kappa, 0.4666666667, 1e-9);
  near(r.meanAgreement, 0.875);
  assert.equal(r.perItem.i2.agreement, 0.5);
});

test('κ = 1 con acuerdo perfecto y null si todos responden igual en todo', () => {
  const x = { a: 1, b: 0, c: 1 };
  near(agreement([x, { ...x }, { ...x }], ['a', 'b', 'c']).kappa, 1);
  assert.equal(agreement([{ a: 1, b: 1 }, { a: 1, b: 1 }], ['a', 'b']).kappa, null);
});

test('agreement ignora ítems sin respuesta de todos y exige ≥ 2 evaluadores', () => {
  assert.equal(agreement([{ a: 1 }], ['a']).kappa, null);
  const r = agreement([{ a: 1, b: 1 }, { a: 1 }], ['a', 'b']);
  assert.equal(r.items, 1);
});

test('consenso por mayoría; los empates quedan sin resolver', () => {
  const c = consensus([{ a: 1, b: 0, c: 1 }, { a: 1, b: 0, c: 0 }, { a: 0, b: 0, c: 1 }, { a: 1, b: 1, c: 0 }]);
  assert.deepEqual(c, { a: 1, b: 0 }); // c: 2 vs 2 → empate
});

test('α de Cronbach', () => {
  near(cronbachAlpha([[1, 2, 3], [2, 3, 4], [3, 4, 5]]), 1);
  const a = cronbachAlpha([[1, 5, 3], [2, 1, 4], [3, 4, 1], [4, 2, 5]]);
  assert.ok(a < 0.5);
  assert.equal(cronbachAlpha([[1, 2]]), null);
});

test('Spearman: monótona = 1, inversa = −1, con empates', () => {
  near(spearman([1, 2, 3, 4], [10, 20, 30, 400]), 1);
  near(spearman([1, 2, 3, 4], [4, 3, 2, 1]), -1);
  const r = spearman([1, 2, 2, 4], [1, 3, 3, 9]);
  near(r, 1);
  assert.equal(spearman([1, 1, 1], [1, 2, 3]), null);
});

test('etiquetas de κ', () => {
  assert.deepEqual([-0.1, 0.1, 0.3, 0.5, 0.7, 0.9].map(kappaLabel), ['poor', 'slight', 'fair', 'moderate', 'substantial', 'almost']);
});
