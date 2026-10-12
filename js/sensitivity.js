// Análisis de incertidumbre y sensibilidad respecto de los pesos (Monte Carlo).
// Recomendado por la guía OECD/JRC para índices compuestos: los pesos de la Escala de Standley
// fueron asignados por la autora, así que se mide cuánto cambia el IDS si los pesos varían.

import { compute, rating } from './engine.js';

/** Generador pseudoaleatorio reproducible (mulberry32). */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const quantile = (sorted, q) => {
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
};

/** Copia del modelo con cada peso multiplicado por (1 + u·delta), u ~ U(−1, 1). El signo se conserva. */
function perturb(model, delta, rnd) {
  const f = () => 1 + (rnd() * 2 - 1) * delta;
  const dims = model.dimensions.map((d) => ({
    ...d,
    weight: d.weight * f(),
    indicators: d.indicators.map((i) => ({
      ...i,
      weight: i.weight * f(),
      items: i.items.map((it) => ({ ...it, weight: it.weight * f() })),
    })),
  }));
  // los pesos de las dimensiones se renormalizan para seguir sumando lo mismo que el original
  const orig = model.dimensions.reduce((s, d) => s + d.weight, 0);
  const now = dims.reduce((s, d) => s + d.weight, 0);
  for (const d of dims) d.weight = (d.weight / now) * orig;
  return { ...model, dimensions: dims };
}

/**
 * @param model   modelo (data/indicators.json)
 * @param answers respuestas completas
 * @param opts    runs (2000), delta (0,2 = ±20 % en cada peso), seed (42)
 * @returns estadísticos del IDS normalizado bajo pesos perturbados, o null si faltan respuestas
 */
export function monteCarlo(model, answers, { runs = 2000, delta = 0.2, seed = 42 } = {}) {
  const base = compute(model, answers);
  if (!base.complete) return null;
  const rnd = mulberry32(seed);
  const g = [];
  const dimRuns = Object.fromEntries(model.dimensions.map((d) => [d.id, []]));
  let sameClass = 0;
  const baseClass = rating(base.global.norm);
  for (let r = 0; r < runs; r++) {
    const res = compute(perturb(model, delta, rnd), answers);
    g.push(res.global.norm);
    if (rating(res.global.norm) === baseClass) sameClass += 1;
    for (const d of model.dimensions) dimRuns[d.id].push(res.dimensions[d.id].norm);
  }
  const sorted = [...g].sort((a, b) => a - b);
  const mean = g.reduce((a, b) => a + b, 0) / runs;
  const sd = Math.sqrt(g.reduce((s, x) => s + (x - mean) ** 2, 0) / (runs - 1));
  const dimStats = {};
  for (const [id, v] of Object.entries(dimRuns)) {
    const s = [...v].sort((a, b) => a - b);
    dimStats[id] = { p05: quantile(s, 0.05), p95: quantile(s, 0.95) };
  }
  return {
    runs,
    delta,
    seed,
    base: base.global.norm,
    mean,
    sd,
    p05: quantile(sorted, 0.05),
    p50: quantile(sorted, 0.5),
    p95: quantile(sorted, 0.95),
    categoryStability: sameClass / runs, // proporción de simulaciones que mantienen la categoría cualitativa
    dimensions: dimStats,
  };
}
