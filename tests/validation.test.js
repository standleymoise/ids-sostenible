import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalCdf, tCdf, pearson, corrP, spearmanCI, kendallTauB, permutationP, bootstrapCI, linCCC, blandAltman, toScale,
  closeness, errors, toClasses, weightedKappa, adjacentAgreement, mannWhitney, icc, itemAnalysis, splitHalf,
  corrLabel, alphaLabel, iccLabel, compareIndices,
} from '../js/validation.js';
import { spearman, cronbachAlpha } from '../js/stats.js';
import { mulberry32 } from '../js/sensitivity.js';

// Valores de referencia calculados con scipy 1.x (pearsonr, spearmanr, kendalltau, mannwhitneyu asintótico, t.cdf, norm.cdf).
const x = [12, 25, 31, 40, 44, 52, 58, 63, 71, 90, 33, 47];
const y = [15, 22, 38, 35, 50, 49, 61, 70, 66, 88, 30, 52];
const xt = [1, 2, 2, 3, 4, 4, 4, 5, 6, 7];
const yt = [2, 1, 3, 3, 5, 4, 6, 5, 7, 7];
const near = (a, b, tol = 1e-9, m = '') => assert.ok(Math.abs(a - b) <= tol, `${m} ${a} != ${b}`);
const rel = (a, b, tol = 1e-4) => assert.ok(Math.abs(a - b) <= tol * Math.abs(b), `${a} !≈ ${b}`);

test('funciones especiales: normal y t', () => {
  [[-2.5, 0.006209665325776132], [-1, 0.15865525393145707], [0, 0.5], [0.7, 0.758036347776927], [1.96, 0.9750021048517795]]
    .forEach(([z, v]) => near(normalCdf(z), v, 1e-10, `Φ(${z})`));
  near(tCdf(2.1, 10), 0.9689613778988907, 1e-9);
  near(tCdf(-1.3, 5), 0.12515031708533855, 1e-9);
  near(tCdf(0.4, 20), 0.6533017118790976, 1e-9);
});

test('Pearson y Spearman (con y sin empates) coinciden con scipy', () => {
  near(pearson(x, y), 0.9750766800997582, 1e-12);
  rel(corrP(pearson(x, y), 12), 7.263631555548374e-08, 1e-3);
  const rho = spearman(x, y);
  near(rho, 0.9510489510489512, 1e-12);
  rel(corrP(rho, 12), 2.0384246324655774e-06, 1e-3);
  const rt = spearman(xt, yt);
  near(rt, 0.9223780407186633, 1e-12);
  rel(corrP(rt, 10), 0.00014450339893291153, 1e-3);
});

test('τ-b de Kendall coincide con scipy (con y sin empates)', () => {
  near(kendallTauB(x, y).tau, 0.8484848484848484, 1e-12);
  near(kendallTauB(xt, yt).tau, 0.8193365776101957, 1e-12);
  assert.ok(kendallTauB(x, y).p < 1e-3);
  assert.equal(kendallTauB([1, 1, 1], [1, 2, 3]), null);
});

test('Mann–Whitney (asintótico, con empates) coincide con scipy', () => {
  const m = mannWhitney([3, 5, 7, 9, 11, 13, 15, 18], [10, 12, 14, 16, 17, 19, 20, 21, 23]);
  near(m.U, 11, 1e-12); near(m.p, 0.018397781423573914, 1e-9);
  const t = mannWhitney([1, 2, 2, 3, 3, 4], [3, 4, 4, 5, 5, 6, 6]);
  near(t.U, 3, 1e-12); near(t.p, 0.011128012415059963, 1e-9);
  assert.ok(m.rankBiserial < 0 && m.probSuperiority < 0.5);
});

test('CCC de Lin y Bland–Altman', () => {
  near(linCCC(x, y), 0.9742257742257743, 1e-12);
  const ba = blandAltman(x, y);
  near(ba.bias, -0.8333333333333334, 1e-12); near(ba.sd, 4.764133677487409, 1e-12);
  assert.ok(ba.lower < ba.bias && ba.bias < ba.upper);
});

test('κ ponderado coincide con el cálculo independiente en numpy', () => {
  const a = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 1, 2, 3, 4, 5, 3, 2, 4];
  const b = [1, 2, 2, 3, 3, 3, 4, 5, 5, 4, 2, 2, 3, 3, 5, 2, 2, 4];
  near(weightedKappa(a, b, 5, 'quadratic'), 0.8771929824561404, 1e-12);
  near(weightedKappa(a, b, 5, 'linear'), 0.7260869565217392, 1e-12);
  near(weightedKappa(a, a, 5, 'quadratic'), 1, 1e-12);
  const adj = adjacentAgreement(a, b);
  assert.ok(adj.withinOne >= adj.exact && adj.withinOne <= 1);
});

test('ICC: ejemplo de Shrout y Fleiss (1979), tabla 2', () => {
  const m = [[9, 2, 5, 8], [6, 1, 3, 2], [8, 4, 6, 8], [7, 1, 2, 6], [10, 5, 6, 9], [6, 2, 4, 7]];
  const r = icc(m);
  near(r.icc21, 0.29, 0.005); near(r.icc2k, 0.62, 0.005); near(r.icc31, 0.71, 0.005); near(r.icc3k, 0.91, 0.005);
  assert.equal(icc([[1, 2]]), null);
});

test('análisis de ítems: α coincide, ítem inconsistente baja el α y se detecta', () => {
  const rows = [];
  const rnd = mulberry32(5);
  for (let i = 0; i < 40; i++) { const t = rnd() * 10; rows.push([t + rnd(), t + rnd(), t + rnd(), t + rnd(), rnd() * 10]); }
  const r = itemAnalysis(rows);
  near(r.alpha, cronbachAlpha(rows), 1e-12);
  assert.ok(r.items[4].itemTotal < 0.4 && r.items[0].itemTotal > 0.8);
  assert.ok(r.items[4].alphaIfDeleted > r.alpha); // quitar el ítem ruidoso mejora α
  const sh = splitHalf(rows);
  assert.ok(sh.spearmanBrown > sh.r);
  assert.equal(itemAnalysis([[1, 2], [2, 3]]), null);
});

test('permutación y bootstrap: reproducibles y coherentes', () => {
  const p1 = permutationP(x, y, spearman, { runs: 2000, seed: 3 });
  const p2 = permutationP(x, y, spearman, { runs: 2000, seed: 3 });
  assert.equal(p1, p2);
  assert.ok(p1 < 0.01);
  const rnd = mulberry32(11); const a = Array.from({ length: 30 }, () => rnd()); const b = Array.from({ length: 30 }, () => rnd());
  assert.ok(permutationP(a, b, spearman, { runs: 2000, seed: 3 }) > 0.05);
  const ci = bootstrapCI(x, y, spearman, { runs: 1000, seed: 3 });
  assert.ok(ci[0] < spearman(x, y) + 1e-9 && ci[1] >= spearman(x, y) - 0.02 && ci[0] > 0.5);
  const ci2 = spearmanCI(spearman(x, y), 12);
  assert.ok(ci2[0] < 0.951 && ci2[1] > 0.951 && ci2[1] < 1);
  assert.equal(spearmanCI(1, 10), null);
});

test('escalas y clases', () => {
  assert.deepEqual(toScale([10, 20, 30], 'minmax'), [0, 50, 100]);
  assert.deepEqual(toScale([5, 1, 3], 'percentile'), [100, 0, 50]);
  assert.deepEqual(toClasses([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), [1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
  const c = closeness([10, 20, 30, 80], [12, 35, 31, 85], { tol: 10, threshold: 0.8 });
  assert.equal(c.share, 0.75); assert.equal(c.pass, false);
  const e = errors([0, 10], [10, 30]);
  near(e.mae, 15); near(e.rmse, Math.sqrt(250));
});

test('etiquetas de interpretación', () => {
  assert.deepEqual([0.05, 0.2, 0.4, 0.6, 0.8].map(corrLabel), ['negligible', 'weak', 'moderate', 'strong', 'verystrong']);
  assert.deepEqual([0.95, 0.85, 0.75, 0.65, 0.55, 0.3].map(alphaLabel), ['excellent', 'good', 'acceptable', 'questionable', 'poor', 'unacceptable']);
  assert.deepEqual([0.4, 0.6, 0.8, 0.95].map(iccLabel), ['poor', 'moderate', 'good', 'excellent']);
});

test('compareIndices: un índice relacionado valida y uno aleatorio no', () => {
  const rnd = mulberry32(21); const rows = [];
  for (let i = 0; i < 40; i++) {
    const base = rnd() * 100;
    rows.push({ name: `z${i}`, ids: base, dims: { environmental: base + rnd() * 10, social: base + rnd() * 30 },
      ext: { related: base * 0.8 + 10 + (rnd() - 0.5) * 20, random: rnd() * 100 } });
  }
  const r = compareIndices(rows, { runs: 1000, seed: 2 });
  const a = r.indices.related; const b = r.indices.random;
  assert.equal(a.n, 40);
  assert.ok(a.spearman.rho > 0.85 && a.spearman.p < 1e-6 && a.spearman.permutationP < 0.01);
  assert.ok(a.spearman.ci[0] > 0.7 && a.kendall.tau > 0.65 && a.quintiles.weightedKappa > 0.7);
  assert.ok(a.closeness.share > 0.6 && a.ccc > 0.8);
  assert.ok(a.knownGroups.p < 0.05 && a.knownGroups.probSuperiority > 0.9);
  assert.ok(a.dimensions.environmental.rho > a.dimensions.social.rho);
  assert.ok(Math.abs(b.spearman.rho) < 0.45 && b.spearman.permutationP > 0.01);
  // n pequeño → advertencias
  const small = compareIndices(rows.slice(0, 6), { runs: 200 });
  assert.ok(small.indices.related.warnings.includes('n<10'));
  assert.deepEqual(compareIndices(rows.slice(0, 2)).indices.related.warnings, ['n<3']);
});

test('compareIndices ignora filas con valores faltantes por índice', () => {
  const rows = [
    { name: 'a', ids: 1, ext: { k: 1 } }, { name: 'b', ids: 2, ext: { k: 2 } }, { name: 'c', ids: 3, ext: { k: 3 } },
    { name: 'd', ids: 4, ext: { k: NaN } }, { name: 'e', ids: 5, ext: {} }, { name: 'f', ids: 6, ext: { k: 6 } },
  ];
  assert.equal(compareIndices(rows, { runs: 100 }).indices.k.n, 4);
});
