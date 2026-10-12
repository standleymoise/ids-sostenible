// Entrada y salida del kit de validación: lector de CSV, cruce de zonas por nombre e informe en Markdown.

/** Quita tildes, mayúsculas y espacios sobrantes para cruzar nombres de zonas («San José» = «san jose»). */
export const normalizeName = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** Convierte «1.234,5», «1,5», «50%» o «50» a número; vacío o inválido → NaN. */
export function toNumber(v, decimalComma) {
  let s = String(v ?? '').trim().replace('%', '');
  if (!s) return NaN;
  if (decimalComma) s = s.replace(/\./g, '').replace(',', '.');
  else s = s.replace(/,/g, '');
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

/**
 * Lee un CSV (delimitador , ; o tabulación, con comillas). Si el delimitador no es la coma
 * (formato de Excel en español) se interpreta la coma como separador decimal.
 * @returns {{header: string[], rows: string[][], delimiter: string, decimalComma: boolean}}
 */
export function parseCsv(text) {
  const clean = String(text).replace(/^﻿/, '');
  const firstLine = clean.split(/\r?\n/).find((l) => l.trim()) || '';
  const count = (c) => (firstLine.match(new RegExp(`\\${c}`, 'g')) || []).length;
  const delimiter = count(';') > count(',') && count(';') >= count('\t') ? ';' : count('\t') > count(',') ? '\t' : ',';
  const rows = [];
  let row = []; let cell = ''; let q = false;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (q) {
      if (ch === '"') { if (clean[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === delimiter) { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && clean[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some((c) => c.trim() !== '')) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim() !== '')) rows.push(row);
  const header = (rows.shift() || []).map((h) => h.trim());
  return { header, rows, delimiter, decimalComma: delimiter !== ',' };
}

const ZONE_KEYS = ['zona', 'zone', 'canton', 'cantón', 'distrito', 'district', 'nombre', 'name'];
const CODE_KEYS = ['codigo', 'código', 'pcd', 'cod', 'code'];
const IDS_KEYS = ['ids', 'ids_standley', 'ids_norm'];

/**
 * Convierte un CSV de índices externos en filas para `compareIndices`.
 * Primera columna reconocible = zona; columna `ids` (opcional) = IDS de la escala; las demás son índices externos.
 * Si no hay columna `ids`, se cruza por nombre con `own` ([{name, ids, dims}]) — las evaluaciones propias.
 */
export function buildRows(parsed, own = []) {
  const { header, rows, decimalComma } = parsed;
  const low = header.map((h) => h.toLowerCase());
  const zi = low.findIndex((h) => ZONE_KEYS.includes(h)) >= 0 ? low.findIndex((h) => ZONE_KEYS.includes(h)) : 0;
  const ii = low.findIndex((h) => IDS_KEYS.includes(h));
  const codeIdx = low.findIndex((h) => CODE_KEYS.includes(h));
  const extCols = header.map((h, i) => i).filter((i) => i !== zi && i !== ii && i !== codeIdx && header[i]);
  const byName = new Map(own.map((o) => [normalizeName(o.name), o]));
  const byCode = new Map(own.filter((o) => o.code).map((o) => [String(o.code), o]));
  const out = []; const unmatched = []; const seen = new Set();
  for (const r of rows) {
    const name = (r[zi] || '').trim();
    if (!name) continue;
    const key = codeIdx >= 0 && String(r[codeIdx]).trim() ? `#${String(r[codeIdx]).trim()}` : normalizeName(name);
    if (seen.has(key)) continue; // zona repetida: se conserva la primera
    seen.add(key);
    const ext = {};
    for (const i of extCols) ext[header[i]] = toNumber(r[i], decimalComma);
    let ids = ii >= 0 ? toNumber(r[ii], decimalComma) : NaN;
    let dims;
    if (ii < 0) {
      const o = (codeIdx >= 0 && byCode.get(String(r[codeIdx]).trim())) || byName.get(normalizeName(name));
      if (o) { ids = o.ids; dims = o.dims; } else unmatched.push(name);
    }
    out.push({ name, ids, dims, ext });
  }
  return { rows: out, unmatched, indices: extCols.map((i) => header[i]), hadIds: ii >= 0 };
}

const f = (v, d = 2) => (v === null || v === undefined || Number.isNaN(v) ? '–' : v.toFixed(d));
const pv = (p) => (p === null || p === undefined ? 'p –' : p < 0.001 ? 'p < 0.001' : `p = ${p.toFixed(3)}`);
const ci = (c) => (c ? `[${f(c[0])}; ${f(c[1])}]` : '–');
const pc = (x) => (x === null || x === undefined ? '–' : `${(x * 100).toFixed(0)} %`);

/** Informe en Markdown (español) reproducible, con supuestos y advertencias. */
export function toMarkdown(result, { date = new Date().toISOString().slice(0, 10), scale = 'percentile', tol = 10, threshold = 0.8, version = '' } = {}) {
  const L = [];
  L.push('# Validación de la Escala de Standley contra otros índices', '');
  L.push(`Fecha: ${date}${version ? ` · versión ${version}` : ''} · zonas: ${result.n} · escala común para CCC/Bland–Altman/cercanía: ${scale === 'percentile' ? 'percentil (0–100)' : 'min–máx (0–100)'} · rango de cercanía: |diferencia| < ${tol} puntos en ≥ ${(threshold * 100).toFixed(0)} % de las zonas.`, '');
  for (const [key, r] of Object.entries(result.indices)) {
    L.push(`## ${key}  (n = ${r.n})`, '');
    if (!r.spearman) { L.push('_No hay suficientes zonas con ambos valores (mínimo 3)._', ''); continue; }
    if (r.warnings.length) L.push(`> ⚠ Muestra pequeña (${r.warnings.join(', ')}): los intervalos son amplios; se recomiendan ≥ 30 zonas.`, '');
    L.push('| Medida | Valor |', '|---|---|');
    L.push(`| Spearman ρ | ${f(r.spearman.rho)} (IC 95 % ${ci(r.spearman.ci)}; bootstrap ${ci(r.spearman.bootstrapCI)}) · ${pv(r.spearman.p)} · permutación ${pv(r.spearman.permutationP)} |`);
    L.push(`| Kendall τ-b | ${f(r.kendall?.tau)} · ${pv(r.kendall?.p)} |`);
    L.push(`| Pearson r | ${f(r.pearson.r)} · ${pv(r.pearson.p)} |`);
    L.push(`| CCC de Lin (acuerdo en valor) | ${f(r.ccc)} |`);
    L.push(`| Bland–Altman (diferencia IDS − índice) | sesgo ${f(r.blandAltman.bias, 1)}; límites ${f(r.blandAltman.lower, 1)} a ${f(r.blandAltman.upper, 1)} |`);
    L.push(`| Rango de cercanía | ${pc(r.closeness.share)} de las zonas dentro de ±${tol} → ${r.closeness.pass ? 'cumple' : 'no cumple'} el criterio de ${(threshold * 100).toFixed(0)} % |`);
    L.push(`| Error medio / RMSE (0–100) | ${f(r.errors.mae, 1)} / ${f(r.errors.rmse, 1)} |`);
    L.push(`| Quintiles: κ ponderado (cuadr. / lineal) | ${f(r.quintiles.weightedKappa)} / ${f(r.quintiles.linearKappa)} |`);
    L.push(`| Quintiles: mismo quintil / ±1 quintil | ${pc(r.quintiles.exact)} / ${pc(r.quintiles.withinOne)} |`);
    if (r.knownGroups) L.push(`| Grupos conocidos (quintil externo 5 vs 1) | n = ${r.knownGroups.nTop} vs ${r.knownGroups.nBottom}; Mann–Whitney ${pv(r.knownGroups.p)}; P(IDS mayor en el grupo alto) = ${pc(r.knownGroups.probSuperiority)} |`);
    L.push('');
    if (r.dimensions) {
      L.push('Validez convergente por dimensión (Spearman con el índice externo):', '');
      L.push('| Dimensión | ρ | p |', '|---|---|---|');
      for (const [d, v] of Object.entries(r.dimensions)) L.push(`| ${d} | ${f(v.rho)} | ${pv(v.p)} |`);
      L.push('');
    }
  }
  L.push('---', '', 'Notas: correlaciones de rango (Spearman, Kendall) miden si las zonas se ordenan de forma parecida y no dependen de la escala; CCC, Bland–Altman, cercanía y error sí dependen de la escala común elegida. Una correlación alta no demuestra por sí sola que el IDS mida «desarrollo sostenible»: los índices de contraste miden constructos cercanos pero distintos (desarrollo humano, progreso social, desarrollo social).');
  return L.join('\n');
}

/**
 * Lee un CSV de MIDEPLAN (data/external/mideplan-ids-2023-*.csv) y devuelve Map(código → {name, ids, dims}).
 * `imputed` marca distritos cuyo IDS MIDEPLAN imputó en lugar de medir (se excluyen de la validación). `dims` son las 5 dimensiones del IDS de MIDEPLAN: salud, participacion, seguridad, educacion, economico.
 */
export function loadMideplan(text) {
  const p = parseCsv(text);
  const col = (n) => p.header.indexOf(n);
  const dimKeys = ['salud', 'participacion', 'seguridad', 'educacion', 'economico'];
  const map = new Map();
  for (const r of p.rows) {
    const code = String(r[col('codigo')]).trim();
    const nm = (r[col('distrito')] ?? r[col('canton')] ?? '').trim();
    map.set(code, {
      name: nm,
      imputed: col('imputado') >= 0 && String(r[col('imputado')]).trim() === '1',
      ids: toNumber(r[col('ids')], false),
      dims: Object.fromEntries(dimKeys.map((k) => [k, toNumber(r[col(k)], false)])),
    });
  }
  return map;
}
