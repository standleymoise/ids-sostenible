// Validación estadística de la Escala de Standley contra otros índices (IDHc, IPS cantonal,
// IDS distrital de MIDEPLAN…) y análisis de fiabilidad. Sin dependencias; verificado contra scipy
// en tests/validation.test.js.
//
// Idea: si el IDS mide algo parecido a lo que miden esos índices, debería ordenar las zonas de forma
// parecida (correlación de rangos), clasificarlas en quintiles parecidos y no diferir mucho en valor.

import { mulberry32 } from './sensitivity.js';
import { ranks, spearman, cronbachAlpha } from './stats.js';

// ---------- funciones especiales ----------
function lgamma(x) {
  const g = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
    12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x);
  x -= 1;
  let a = g[0];
  const t = x + 7.5;
  for (let i = 1; i < 9; i++) a += g[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

function gammaP(a, x) { // gamma incompleta regularizada P(a, x)
  if (x <= 0) return 0;
  if (x < a + 1) {
    let sum = 1 / a; let term = sum;
    for (let n = 1; n < 500; n++) { term *= x / (a + n); sum += term; if (Math.abs(term) < Math.abs(sum) * 1e-15) break; }
    return sum * Math.exp(-x + a * Math.log(x) - lgamma(a));
  }
  let b = x + 1 - a; let c = 1e300; let d = 1 / b; let h = d;
  for (let i = 1; i < 500; i++) {
    const an = -i * (i - a); b += 2;
    d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300;
    c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300;
    d = 1 / d; const del = d * c; h *= del;
    if (Math.abs(del - 1) < 1e-15) break;
  }
  return 1 - Math.exp(-x + a * Math.log(x) - lgamma(a)) * h;
}

export function normalCdf(z) {
  const p = 0.5 * gammaP(0.5, (z * z) / 2);
  return z >= 0 ? 0.5 + p : 0.5 - p;
}

function betaInc(a, b, x) { // beta incompleta regularizada I_x(a, b)
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const lb = lgamma(a + b) - lgamma(a) - lgamma(b);
  const front = Math.exp(lb + a * Math.log(x) + b * Math.log(1 - x));
  const cf = (aa, bb, xx) => {
    let c = 1; let d = 1 - ((aa + bb) * xx) / (aa + 1);
    if (Math.abs(d) < 1e-300) d = 1e-300;
    d = 1 / d; let h = d;
    for (let m = 1; m < 500; m++) {
      const m2 = 2 * m;
      let an = (m * (bb - m) * xx) / ((aa + m2 - 1) * (aa + m2));
      d = 1 + an * d; if (Math.abs(d) < 1e-300) d = 1e-300;
      c = 1 + an / c; if (Math.abs(c) < 1e-300) c = 1e-300;
      d = 1 / d; h *= d * c;
      an = (-(aa + m) * (aa + bb + m) * xx) / ((aa + m2) * (aa + m2 + 1));
      d = 1 + an * d; if (Math.abs(d) < 1e-300) d = 1e-300;
      c = 1 + an / c; if (Math.abs(c) < 1e-300) c = 1e-300;
      d = 1 / d; const del = d * c; h *= del;
      if (Math.abs(del - 1) < 1e-15) break;
    }
    return h;
  };
  return x < (a + 1) / (a + b + 2) ? (front * cf(a, b, x)) / a : 1 - (front * cf(b, a, 1 - x)) / b;
}

export function tCdf(t, df) {
  const x = df / (df + t * t);
  const p = 0.5 * betaInc(df / 2, 0.5, x);
  return t > 0 ? 1 - p : p;
}

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const sd = (xs) => { const m = mean(xs); return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1)); };

// ---------- correlaciones ----------
export function pearson(x, y) {
  const n = x.length;
  if (n < 3) return null;
  const mx = mean(x); const my = mean(y);
  let sxy = 0; let sxx = 0; let syy = 0;
  for (let i = 0; i < n; i++) { sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) ** 2; syy += (y[i] - my) ** 2; }
  return sxx === 0 || syy === 0 ? null : sxy / Math.sqrt(sxx * syy);
}

/** p bilateral de una correlación (Pearson o Spearman) por la prueba t con n − 2 g. l. */
export function corrP(r, n) {
  if (r === null || n < 3) return null;
  if (Math.abs(r) >= 1) return 0;
  const t = r * Math.sqrt((n - 2) / (1 - r * r));
  return 2 * (1 - tCdf(Math.abs(t), n - 2));
}

/** Intervalo de confianza de Spearman (Fisher con el error de Bonett y Wright, 2000). */
export function spearmanCI(rho, n, level = 0.95) {
  if (rho === null || n < 4 || Math.abs(rho) >= 1) return null;
  const z = Math.atanh(rho);
  const se = Math.sqrt((1 + (rho * rho) / 2) / (n - 3));
  const q = quantileNormal(1 - (1 - level) / 2);
  return [Math.tanh(z - q * se), Math.tanh(z + q * se)];
}

function quantileNormal(p) { // bisección sobre normalCdf (suficiente y robusta)
  let lo = -10; let hi = 10;
  for (let i = 0; i < 80; i++) { const mid = (lo + hi) / 2; if (normalCdf(mid) < p) lo = mid; else hi = mid; }
  return (lo + hi) / 2;
}

/** τ-b de Kendall con p bilateral (aprox. normal con corrección de empates). */
export function kendallTauB(x, y) {
  const n = x.length;
  if (n < 3) return null;
  let s = 0; let tx = 0; let ty = 0; let both = 0;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dx = Math.sign(x[i] - x[j]); const dy = Math.sign(y[i] - y[j]);
      if (dx === 0 && dy === 0) both++;
      else if (dx === 0) tx++;
      else if (dy === 0) ty++;
      else s += dx * dy;
    }
  }
  const n0 = (n * (n - 1)) / 2;
  const n1 = tx + both; const n2 = ty + both;
  const denom = Math.sqrt((n0 - n1) * (n0 - n2));
  if (denom === 0) return null;
  const groups = (v) => { const m = new Map(); v.forEach((e) => m.set(e, (m.get(e) || 0) + 1)); return [...m.values()]; };
  const gx = groups(x); const gy = groups(y);
  const sum = (g, f) => g.reduce((a, t) => a + f(t), 0);
  const v0 = n * (n - 1) * (2 * n + 5);
  const vt = sum(gx, (t) => t * (t - 1) * (2 * t + 5)); const vu = sum(gy, (t) => t * (t - 1) * (2 * t + 5));
  const v1 = sum(gx, (t) => t * (t - 1)) * sum(gy, (t) => t * (t - 1));
  const v2 = sum(gx, (t) => t * (t - 1) * (t - 2)) * sum(gy, (t) => t * (t - 1) * (t - 2));
  const varS = (v0 - vt - vu) / 18 + v1 / (2 * n * (n - 1)) + (n > 2 ? v2 / (9 * n * (n - 1) * (n - 2)) : 0);
  const z = varS > 0 ? s / Math.sqrt(varS) : 0;
  return { tau: s / denom, p: 2 * (1 - normalCdf(Math.abs(z))) };
}

/** Prueba de permutación bilateral para un estadístico de asociación (por defecto Spearman). */
export function permutationP(x, y, stat = spearman, { runs = 5000, seed = 1 } = {}) {
  const obs = stat(x, y);
  if (obs === null) return null;
  const rnd = mulberry32(seed);
  const yy = [...y];
  let hits = 0;
  for (let r = 0; r < runs; r++) {
    for (let i = yy.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [yy[i], yy[j]] = [yy[j], yy[i]]; }
    const v = stat(x, yy);
    if (v !== null && Math.abs(v) >= Math.abs(obs) - 1e-12) hits++;
  }
  return (hits + 1) / (runs + 1);
}

/** IC bootstrap percentil (remuestreo de pares). */
export function bootstrapCI(x, y, stat = spearman, { runs = 2000, seed = 1, level = 0.95 } = {}) {
  const rnd = mulberry32(seed);
  const n = x.length; const vals = [];
  for (let r = 0; r < runs; r++) {
    const bx = []; const by = [];
    for (let i = 0; i < n; i++) { const k = Math.floor(rnd() * n); bx.push(x[k]); by.push(y[k]); }
    const v = stat(bx, by);
    if (v !== null) vals.push(v);
  }
  if (vals.length < runs / 2) return null;
  vals.sort((a, b) => a - b);
  const q = (p) => vals[Math.min(vals.length - 1, Math.max(0, Math.floor(p * vals.length)))];
  return [q((1 - level) / 2), q(1 - (1 - level) / 2)];
}

// ---------- concordancia en valor ----------
/** Coeficiente de concordancia de Lin (mide acuerdo en valor, no solo en orden; requiere la misma escala). */
export function linCCC(x, y) {
  const n = x.length;
  if (n < 3) return null;
  const mx = mean(x); const my = mean(y);
  const vx = x.reduce((s, v) => s + (v - mx) ** 2, 0) / n;
  const vy = y.reduce((s, v) => s + (v - my) ** 2, 0) / n;
  const cov = x.reduce((s, v, i) => s + (v - mx) * (y[i] - my), 0) / n;
  const d = vx + vy + (mx - my) ** 2;
  return d === 0 ? null : (2 * cov) / d;
}

/** Bland–Altman: sesgo, desviación y límites de acuerdo del 95 %. */
export function blandAltman(x, y) {
  const d = x.map((v, i) => v - y[i]);
  const bias = mean(d); const s = sd(d);
  const lo = bias - 1.96 * s; const hi = bias + 1.96 * s;
  return { bias, sd: s, lower: lo, upper: hi, within: d.filter((v) => v >= lo && v <= hi).length / d.length };
}

/** Pone un índice en escala 0–100 para poder compararlo con otro: minmax o percentil (por rangos). */
export function toScale(values, method = 'percentile') {
  if (method === 'none') return [...values];
  if (method === 'minmax') {
    const lo = Math.min(...values); const hi = Math.max(...values);
    return values.map((v) => (hi === lo ? 50 : ((v - lo) / (hi - lo)) * 100));
  }
  const r = ranks(values);
  return r.map((v) => ((v - 1) / (values.length - 1)) * 100);
}

/** «Rango de cercanía» de la tesis: proporción de zonas cuya diferencia en escala 0–100 es menor que `tol`. */
export function closeness(a, b, { tol = 10, threshold = 0.8 } = {}) {
  const share = a.filter((v, i) => Math.abs(v - b[i]) < tol).length / a.length;
  return { share, tol, threshold, pass: share >= threshold };
}

export const errors = (a, b) => ({
  mae: mean(a.map((v, i) => Math.abs(v - b[i]))),
  rmse: Math.sqrt(mean(a.map((v, i) => (v - b[i]) ** 2))),
});

// ---------- clasificación (quintiles) ----------
/** Asigna clases 1..k por rango (quintiles por defecto). */
export function toClasses(values, k = 5) {
  const r = ranks(values);
  return r.map((v) => Math.min(k, Math.floor(((v - 1) / values.length) * k) + 1));
}

/** κ ponderado de Cohen para clases ordinales 1..k (lineal, cuadrático o sin ponderar). */
export function weightedKappa(a, b, k = 5, kind = 'quadratic') {
  const n = a.length;
  const O = Array.from({ length: k }, () => new Array(k).fill(0));
  for (let i = 0; i < n; i++) O[a[i] - 1][b[i] - 1] += 1;
  const rows = O.map((r) => r.reduce((x, y) => x + y, 0));
  const cols = Array.from({ length: k }, (_, j) => O.reduce((s, r) => s + r[j], 0));
  let num = 0; let den = 0;
  for (let i = 0; i < k; i++) {
    for (let j = 0; j < k; j++) {
      const w = kind === 'none' ? (i === j ? 0 : 1) : kind === 'linear' ? Math.abs(i - j) : (i - j) ** 2;
      num += w * O[i][j]; den += (w * rows[i] * cols[j]) / n;
    }
  }
  return den === 0 ? null : 1 - num / den;
}

export function adjacentAgreement(a, b) {
  const n = a.length;
  return { exact: a.filter((v, i) => v === b[i]).length / n, withinOne: a.filter((v, i) => Math.abs(v - b[i]) <= 1).length / n };
}

// ---------- diferencias entre grupos ----------
/** Mann–Whitney U (aprox. normal con corrección de empates y de continuidad, como scipy 'asymptotic'). */
export function mannWhitney(x, y) {
  const n1 = x.length; const n2 = y.length;
  if (n1 < 2 || n2 < 2) return null;
  const r = ranks([...x, ...y]);
  const r1 = r.slice(0, n1).reduce((a, b) => a + b, 0);
  const u1 = r1 - (n1 * (n1 + 1)) / 2;
  const n = n1 + n2;
  const counts = new Map(); r.forEach((v) => counts.set(v, (counts.get(v) || 0) + 1));
  const tie = [...counts.values()].reduce((s, t) => s + (t ** 3 - t), 0);
  const varU = ((n1 * n2) / 12) * (n + 1 - tie / (n * (n - 1)));
  const mu = (n1 * n2) / 2;
  const z = varU > 0 ? (Math.abs(u1 - mu) - 0.5) / Math.sqrt(varU) : 0;
  return { U: u1, p: Math.min(1, 2 * (1 - normalCdf(Math.max(0, z)))), rankBiserial: (2 * u1) / (n1 * n2) - 1, probSuperiority: u1 / (n1 * n2) };
}

// ---------- fiabilidad ----------
/**
 * ICC de Shrout y Fleiss (1979) para `matrix` (filas = zonas, columnas = evaluadores):
 * ICC(2,1) y ICC(2,k) (evaluadores aleatorios), ICC(3,1) y ICC(3,k) (evaluadores fijos).
 */
export function icc(matrix) {
  const n = matrix.length; const k = matrix[0]?.length;
  if (!k || k < 2 || n < 2) return null;
  const grand = mean(matrix.flat());
  const rowM = matrix.map(mean);
  const colM = Array.from({ length: k }, (_, j) => mean(matrix.map((r) => r[j])));
  const ssr = k * rowM.reduce((s, m) => s + (m - grand) ** 2, 0);
  const ssc = n * colM.reduce((s, m) => s + (m - grand) ** 2, 0);
  const sst = matrix.flat().reduce((s, v) => s + (v - grand) ** 2, 0);
  const sse = sst - ssr - ssc;
  const msr = ssr / (n - 1); const msc = ssc / (k - 1); const mse = sse / ((n - 1) * (k - 1));
  return {
    icc21: (msr - mse) / (msr + (k - 1) * mse + (k * (msc - mse)) / n),
    icc2k: (msr - mse) / (msr + (msc - mse) / n),
    icc31: (msr - mse) / (msr + (k - 1) * mse),
    icc3k: (msr - mse) / msr,
    n, k,
  };
}

/** Análisis de ítems: α, correlación ítem-total corregida y α si se elimina el ítem. */
export function itemAnalysis(matrix) {
  const k = matrix[0]?.length;
  if (!k || k < 3 || matrix.length < 3) return null;
  const alpha = cronbachAlpha(matrix);
  const items = Array.from({ length: k }, (_, j) => {
    const col = matrix.map((r) => r[j]);
    const rest = matrix.map((r) => r.reduce((s, v, i) => (i === j ? s : s + v), 0));
    const without = matrix.map((r) => r.filter((_, i) => i !== j));
    return { index: j, itemTotal: pearson(col, rest), alphaIfDeleted: cronbachAlpha(without) };
  });
  return { alpha, items };
}

/** Fiabilidad por mitades (pares/impares) con corrección de Spearman–Brown. */
export function splitHalf(matrix) {
  const odd = matrix.map((r) => r.filter((_, i) => i % 2 === 0).reduce((a, b) => a + b, 0));
  const even = matrix.map((r) => r.filter((_, i) => i % 2 === 1).reduce((a, b) => a + b, 0));
  const r = pearson(odd, even);
  return r === null ? null : { r, spearmanBrown: (2 * r) / (1 + r) };
}

// ---------- etiquetas de interpretación ----------
export const corrLabel = (r) => { const a = Math.abs(r); return a < 0.1 ? 'negligible' : a < 0.3 ? 'weak' : a < 0.5 ? 'moderate' : a < 0.7 ? 'strong' : 'verystrong'; };
export const alphaLabel = (a) => (a >= 0.9 ? 'excellent' : a >= 0.8 ? 'good' : a >= 0.7 ? 'acceptable' : a >= 0.6 ? 'questionable' : a >= 0.5 ? 'poor' : 'unacceptable');
export const iccLabel = (v) => (v < 0.5 ? 'poor' : v < 0.75 ? 'moderate' : v < 0.9 ? 'good' : 'excellent');

// ---------- orquestador ----------
/**
 * Compara el IDS con uno o más índices externos.
 * @param rows  [{ name, ids, dims?: {environmental,...}, ext: { indice: valor } }] — `ids` en cualquier escala monótona
 * @param opts  scale ('percentile' | 'minmax'), tol (10), threshold (0,8), runs, seed
 */
export function compareIndices(rows, { scale = 'percentile', tol = 10, threshold = 0.8, runs = 5000, seed = 1 } = {}) {
  const keys = [...new Set(rows.flatMap((r) => Object.keys(r.ext || {})))];
  const out = {};
  for (const key of keys) {
    const pairs = rows.filter((r) => Number.isFinite(r.ids) && Number.isFinite(r.ext?.[key]));
    const n = pairs.length;
    const x = pairs.map((r) => r.ids); const y = pairs.map((r) => r.ext[key]);
    const res = { n, warnings: [] };
    if (n < 3) { res.warnings.push('n<3'); out[key] = res; continue; }
    if (n < 10) res.warnings.push('n<10');
    else if (n < 30) res.warnings.push('n<30');
    const rho = spearman(x, y);
    res.spearman = { rho, p: corrP(rho, n), ci: spearmanCI(rho, n), bootstrapCI: bootstrapCI(x, y, spearman, { runs: Math.min(runs, 2000), seed }), permutationP: permutationP(x, y, spearman, { runs, seed }) };
    res.pearson = (() => { const r = pearson(x, y); return { r, p: corrP(r, n) }; })();
    res.kendall = kendallTauB(x, y);
    const a = toScale(x, scale); const b = toScale(y, scale);
    res.scale = scale;
    res.ccc = linCCC(a, b);
    res.blandAltman = blandAltman(a, b);
    res.closeness = closeness(a, b, { tol, threshold });
    res.errors = errors(a, b);
    const ca = toClasses(x); const cb = toClasses(y);
    res.quintiles = { weightedKappa: weightedKappa(ca, cb, 5, 'quadratic'), linearKappa: weightedKappa(ca, cb, 5, 'linear'), ...adjacentAgreement(ca, cb) };
    // validez de grupos conocidos: IDS de las zonas del quintil externo más alto frente al más bajo
    const top = pairs.filter((_, i) => cb[i] === 5).map((r) => r.ids); const bottom = pairs.filter((_, i) => cb[i] === 1).map((r) => r.ids);
    res.knownGroups = top.length >= 2 && bottom.length >= 2 ? { nTop: top.length, nBottom: bottom.length, ...mannWhitney(top, bottom) } : null;
    // validez convergente por dimensión
    if (pairs.every((r) => r.dims)) {
      res.dimensions = {};
      for (const d of Object.keys(pairs[0].dims)) {
        const v = pairs.map((r) => r.dims[d]);
        const rr = spearman(v, y);
        res.dimensions[d] = { rho: rr, p: corrP(rr, n) };
      }
    }
    out[key] = res;
  }
  return { n: rows.length, indices: out };
}

/**
 * Matriz de correlaciones de Spearman entre las dimensiones de la escala (rows[].dims) y las del índice externo
 * (rows[].extDims). Sirve para validez convergente (lo que debería correlacionar) y discriminante (lo que no).
 */
export function dimensionMatrix(rows, extKeys) {
  const ours = Object.keys(rows.find((r) => r.dims)?.dims || {});
  const out = {};
  for (const d of ours) {
    out[d] = {};
    for (const k of extKeys) {
      const pairs = rows.filter((r) => Number.isFinite(r.dims?.[d]) && Number.isFinite(r.extDims?.[k]));
      const rho = pairs.length >= 3 ? spearman(pairs.map((r) => r.dims[d]), pairs.map((r) => r.extDims[k])) : null;
      out[d][k] = { rho, p: rho === null ? null : corrP(rho, pairs.length), n: pairs.length };
    }
  }
  return out;
}
