// Motor de cálculo del Índice de Desarrollo Sostenible (IDS) — Escala de Standley.
// Sin dependencias ni DOM: funciona igual en el navegador y en Node.
//
// Modelo (tesis, Fase II):
//   indicador  = Σ peso_ítem · respuesta        (SUMAPRODUCTO, respuesta ∈ {0,1})
//   dimensión  = Σ peso_indicador · indicador
//   IDS        = Σ peso_dimensión · dimensión   (ambiental .4, social .3, económica .2, política .1)
//
// Como hay pesos negativos, la escala original no va de 0 a 1. Además de la
// escala original ("raw") se devuelve la escala normalizada ("norm"): un
// reescalado lineal min-max al rango realmente alcanzable en cada nivel.

const round = (x, d = 10) => Math.round(x * 10 ** d) / 10 ** d;

/** Cota inferior/superior de una suma Σ w·x con x ∈ [lo, hi] (aritmética de intervalos). */
function bounds(terms) {
  let min = 0;
  let max = 0;
  for (const [w, lo, hi] of terms) {
    const a = w * lo;
    const b = w * hi;
    min += Math.min(a, b);
    max += Math.max(a, b);
  }
  return { min, max };
}

const scale = (raw, { min, max }) => (max === min ? 0 : (raw - min) / (max - min));

/** Rango de un indicador (respuestas 0/1). */
export function indicatorBounds(ind) {
  return bounds(ind.items.map((it) => [it.weight, 0, 1]));
}

/** Rango de una dimensión. */
export function dimensionBounds(dim) {
  return bounds(dim.indicators.map((ind) => {
    const b = indicatorBounds(ind);
    return [ind.weight, b.min, b.max];
  }));
}

/** Rango del IDS global. */
export function globalBounds(model) {
  return bounds(model.dimensions.map((d) => {
    const b = dimensionBounds(d);
    return [d.weight, b.min, b.max];
  }));
}

/**
 * Calcula todos los niveles.
 * @param model   contenido de data/indicators.json
 * @param answers { [itemId]: 0 | 1 }  (los ítems sin responder son undefined/null)
 * @returns objeto con indicadores, dimensiones y global; cada valor es null
 *          mientras falten respuestas del nivel correspondiente.
 */
export function compute(model, answers) {
  const result = { indicators: {}, dimensions: {}, global: null, complete: false };
  let globalRaw = 0;
  let allDims = true;

  for (const dim of model.dimensions) {
    let dimRaw = 0;
    let dimDone = true;

    for (const ind of dim.indicators) {
      const given = ind.items.map((it) => answers[it.id]);
      const answered = given.filter((a) => a === 0 || a === 1).length;
      const done = answered === ind.items.length;
      const b = indicatorBounds(ind);
      let raw = null;
      let norm = null;
      if (done) {
        raw = ind.items.reduce((s, it, k) => s + it.weight * given[k], 0);
        norm = scale(raw, b);
        dimRaw += ind.weight * raw;
      } else {
        dimDone = false;
      }
      result.indicators[ind.id] = {
        raw: raw === null ? null : round(raw),
        norm: norm === null ? null : round(norm),
        answered,
        total: ind.items.length,
        done,
      };
    }

    const db = dimensionBounds(dim);
    result.dimensions[dim.id] = {
      raw: dimDone ? round(dimRaw) : null,
      norm: dimDone ? round(scale(dimRaw, db)) : null,
      done: dimDone,
    };
    if (dimDone) globalRaw += dim.weight * dimRaw;
    else allDims = false;
  }

  if (allDims) {
    const gb = globalBounds(model);
    result.global = { raw: round(globalRaw), norm: round(scale(globalRaw, gb)) };
    result.complete = true;
    result.balance = balance(model, result);
  }
  return result;
}

/**
 * Equilibrio entre dimensiones. El promedio ponderado es totalmente compensatorio (una
 * dimensión muy buena tapa una muy mala). Como contrapeso se informa:
 *  - weakest: la dimensión con menor índice normalizado,
 *  - balanced: promedio entre el IDS normalizado y la dimensión más débil
 *    («co-limitación»: (mín + media) / 2; ver docs/INVESTIGACION-INDICES.md),
 *  - low: dimensiones por debajo de `threshold` (0,4 = «deficiente» o peor).
 */
export function balance(model, result, threshold = 0.4) {
  const norms = model.dimensions.map((d) => [d.id, result.dimensions[d.id].norm]);
  const [weakest, min] = norms.reduce((a, b) => (b[1] < a[1] ? b : a));
  return {
    weakest,
    weakestNorm: min,
    balanced: round((min + result.global.norm) / 2),
    low: norms.filter(([, n]) => n < threshold).map(([id]) => id),
  };
}

/** Categoría cualitativa según el índice normalizado (rangos 0–0,2 … 0,8–1 de la app original). */
export function rating(norm) {
  if (norm === null || norm === undefined) return null;
  if (norm < 0.2) return 'worst';
  if (norm < 0.4) return 'bad';
  if (norm < 0.6) return 'regular';
  if (norm < 0.8) return 'good';
  return 'best';
}
