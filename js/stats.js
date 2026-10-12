// Estadísticas de confiabilidad y validación, sin dependencias.
// Pensadas para: acuerdo entre evaluadores (Fleiss κ), consistencia interna (α de Cronbach)
// y validez externa contra otros índices (correlación de Spearman).

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const variance = (xs) => {
  const m = mean(xs);
  return xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1);
};

/**
 * Consenso por mayoría. `lists`: arreglo de objetos {itemId: 0|1}.
 * Los empates quedan sin resolver (se omiten del resultado).
 */
export function consensus(lists) {
  const ids = new Set(lists.flatMap((a) => Object.keys(a)));
  const out = {};
  for (const id of ids) {
    const v = lists.map((a) => a[id]).filter((x) => x === 0 || x === 1);
    const ones = v.filter((x) => x === 1).length;
    if (ones * 2 > v.length) out[id] = 1;
    else if (ones * 2 < v.length) out[id] = 0;
  }
  return out;
}

/**
 * Acuerdo entre n evaluadores sobre los mismos ítems (respuestas binarias).
 * Devuelve el % de acuerdo por ítem, el acuerdo medio y el κ de Fleiss
 * (null si no es calculable, p. ej. todos responden lo mismo en todo).
 */
export function agreement(lists, itemIds) {
  const n = lists.length;
  if (n < 2) return { n, perItem: {}, meanAgreement: null, kappa: null, items: 0 };
  const perItem = {};
  let sumP = 0;
  let ones = 0;
  let items = 0;
  for (const id of itemIds) {
    const v = lists.map((a) => a[id]);
    if (!v.every((x) => x === 0 || x === 1)) continue; // solo ítems respondidos por todos
    const n1 = v.reduce((s, x) => s + x, 0);
    const n0 = n - n1;
    const p = (n0 * n0 + n1 * n1 - n) / (n * (n - 1));
    perItem[id] = { agreement: Math.max(n0, n1) / n, yes: n1 };
    sumP += p;
    ones += n1;
    items += 1;
  }
  if (!items) return { n, perItem, meanAgreement: null, kappa: null, items };
  const pBar = sumP / items;
  const p1 = ones / (items * n);
  const pe = p1 * p1 + (1 - p1) * (1 - p1);
  return {
    n,
    perItem,
    items,
    meanAgreement: mean(Object.values(perItem).map((x) => x.agreement)),
    kappa: pe === 1 ? null : (pBar - pe) / (1 - pe),
  };
}

/** Interpretación cualitativa de κ (Landis y Koch, 1977). */
export function kappaLabel(k) {
  if (k === null || k === undefined) return null;
  if (k < 0) return 'poor';
  if (k <= 0.2) return 'slight';
  if (k <= 0.4) return 'fair';
  if (k <= 0.6) return 'moderate';
  if (k <= 0.8) return 'substantial';
  return 'almost';
}

/**
 * α de Cronbach. `matrix`: filas = observaciones (p. ej. ciudades),
 * columnas = ítems o evaluadores. Requiere ≥ 2 columnas y ≥ 2 filas.
 */
export function cronbachAlpha(matrix) {
  const k = matrix[0]?.length;
  if (!k || k < 2 || matrix.length < 2) return null;
  const cols = Array.from({ length: k }, (_, j) => matrix.map((r) => r[j]));
  const total = variance(matrix.map((r) => r.reduce((a, b) => a + b, 0)));
  if (total === 0) return null;
  return (k / (k - 1)) * (1 - cols.reduce((s, c) => s + variance(c), 0) / total);
}

export const ranks = (xs) => {
  const idx = xs.map((x, i) => [x, i]).sort((a, b) => a[0] - b[0]);
  const r = new Array(xs.length);
  for (let i = 0; i < idx.length;) {
    let j = i;
    while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++;
    for (let k = i; k <= j; k++) r[idx[k][1]] = (i + j) / 2 + 1;
    i = j + 1;
  }
  return r;
};

/** Correlación de Spearman (con empates). null si no es calculable. */
export function spearman(x, y) {
  if (x.length !== y.length || x.length < 3) return null;
  const a = ranks(x);
  const b = ranks(y);
  const ma = mean(a);
  const mb = mean(b);
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < a.length; i++) {
    num += (a[i] - ma) * (b[i] - mb);
    da += (a[i] - ma) ** 2;
    db += (b[i] - mb) ** 2;
  }
  return da === 0 || db === 0 ? null : num / Math.sqrt(da * db);
}
