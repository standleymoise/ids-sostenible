import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadMideplan, parseCsv, buildRows } from '../js/validation-io.js';
import { compareIndices, dimensionMatrix, pearson } from '../js/validation.js';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const geo = JSON.parse(read('../data/cr-distritos.json'));
const dist = loadMideplan(read('../data/external/mideplan-ids-2023-distritos.csv'));
const cant = loadMideplan(read('../data/external/mideplan-ids-2023-cantones.csv'));
const W = { economico: 0.281, participacion: 0.159, salud: 0.255, educacion: 0.24, seguridad: 0.065 }; // MIDEPLAN, Tabla 1

test('MIDEPLAN 2023: 490 distritos y 84 cantones, todos con código oficial y valores en 0–100', () => {
  assert.equal(dist.size, 490);
  assert.equal(cant.size, 84);
  const dcodes = new Set(geo.provinces.flatMap((p) => p.cantons.flatMap((c) => c.districts.map((d) => String(d.code)))));
  const ccodes = new Set(geo.provinces.flatMap((p) => p.cantons.map((c) => String(c.code))));
  assert.deepEqual([...dist.keys()].sort(), [...dcodes].sort());
  assert.deepEqual([...cant.keys()].sort(), [...ccodes].sort());
  for (const m of [...dist.values(), ...cant.values()]) {
    assert.ok(m.ids >= 0 && m.ids <= 100, m.name);
    for (const v of Object.values(m.dims)) assert.ok(v >= 0 && v <= 100, `${m.name}`);
  }
});

test('integridad: recalculando el IDS con los pesos de MIDEPLAN se reproduce el publicado (r > 0,9999)', () => {
  for (const map of [dist, cant]) {
    const ms = [...map.values()];
    const raw = ms.map((m) => Object.entries(W).reduce((s, [k, w]) => s + w * m.dims[k], 0));
    assert.ok(pearson(raw, ms.map((m) => m.ids)) > 0.9999);
  }
});

test('casos conocidos: La Asunción (40703) es el distrito 1 y Escazú (102) el cantón 1', () => {
  assert.equal(dist.get('40703').ids, 100);
  assert.equal(dist.get('40703').name, 'La Asunción');
  assert.equal(cant.get('102').ids, 100);
});

test('buildRows cruza por código aunque el nombre se repita o difiera', () => {
  const parsed = parseCsv('codigo;distrito;idhc\n10101;Carmen;0,7\n10102;Merced;0,6\n10103;Hospital;0,5\n');
  const own = [{ name: 'otro nombre', code: 10101, ids: 70 }, { name: 'Merced', code: 10102, ids: 60 }];
  const r = buildRows(parsed, own);
  assert.equal(r.rows[0].ids, 70); // por código, no por nombre
  assert.equal(r.rows[1].ids, 60);
  assert.deepEqual(r.unmatched, ['Hospital']);
  assert.deepEqual(r.indices, ['idhc']);
});

test('dimensionMatrix: detecta correlación convergente y discriminante', () => {
  const rows = [];
  let s = 17; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 60; i++) {
    const a = rnd() * 100;
    rows.push({ name: `z${i}`, ids: a, dims: { social: a + rnd() * 15, environmental: rnd() * 100 }, ext: { k: a }, extDims: { salud: a + rnd() * 15, economico: rnd() * 100 } });
  }
  const m = dimensionMatrix(rows, ['salud', 'economico']);
  assert.ok(m.social.salud.rho > 0.9 && m.social.salud.p < 1e-6);
  assert.ok(Math.abs(m.environmental.salud.rho) < 0.4);
  assert.equal(m.social.salud.n, 60);
  assert.ok(compareIndices(rows, { runs: 200 }).indices.k.spearman.rho > 0.95);
});

// ---------- edición 2017 (la que usó la tesis) ----------
const dist17 = loadMideplan(read('../data/external/mideplan-ids-2017-distritos.csv'));
const cant17 = loadMideplan(read('../data/external/mideplan-ids-2017-cantones.csv'));

test('MIDEPLAN 2017: 482 distritos y 82 cantones; casi todos siguen existiendo en la división actual', () => {
  assert.equal(dist17.size, 482);
  assert.equal(cant17.size, 82);
  const d23 = new Set(geo.provinces.flatMap((p) => p.cantons.flatMap((c) => c.districts.map((d) => String(d.code)))));
  const c23 = new Set(geo.provinces.flatMap((p) => p.cantons.map((c) => String(c.code))));
  assert.ok([...dist17.keys()].filter((c) => d23.has(c)).length >= 478); // 480 en la última comprobación
  assert.ok([...cant17.keys()].every((c) => c23.has(c)));
  for (const m of [...dist17.values(), ...cant17.values()]) assert.ok(m.ids >= 0 && m.ids <= 100, m.name);
  const sinDims = [...dist17.entries()].filter(([, m]) => Object.values(m.dims).some(Number.isNaN)).map(([c]) => c);
  assert.deepEqual(sinDims.sort(), ['11912', '20214', '51105']); // distritos nuevos: el libro 2017 trae su IDS pero no sus dimensiones
  for (const m of dist17.values()) for (const v of Object.values(m.dims)) assert.ok(Number.isNaN(v) || (v >= 0 && v <= 100));
});

test('2017: el cantonal no trae dimensiones (NaN) y el distrital sí', () => {
  assert.ok(Object.values(cant17.get('102').dims).every(Number.isNaN));
  assert.ok(Object.values(dist17.get('10101').dims).every(Number.isFinite));
  assert.equal(cant17.get('102').ids, 100);
});

test('2017: el IDS se reproduce desde sus 5 dimensiones con pesos ajustados (R² > 0,999)', () => {
  // Los pesos 2017 no vienen en el libro; se estiman por mínimos cuadrados y deben ser positivos y plausibles.
  const ms = [...dist17.values()].filter((m) => Object.values(m.dims).every(Number.isFinite));
  assert.equal(ms.length, 479);
  const keys = ['economico', 'participacion', 'salud', 'educacion', 'seguridad'];
  const X = ms.map((m) => [...keys.map((k) => m.dims[k]), 1]); const y = ms.map((m) => m.ids);
  const p = keys.length + 1;
  const XtX = Array.from({ length: p }, (_, i) => Array.from({ length: p }, (_, j) => X.reduce((s, r) => s + r[i] * r[j], 0)));
  const Xty = Array.from({ length: p }, (_, i) => X.reduce((s, r, k) => s + r[i] * y[k], 0));
  // eliminación gaussiana
  const A = XtX.map((r, i) => [...r, Xty[i]]);
  for (let i = 0; i < p; i++) {
    let m = i; for (let r = i + 1; r < p; r++) if (Math.abs(A[r][i]) > Math.abs(A[m][i])) m = r;
    [A[i], A[m]] = [A[m], A[i]];
    for (let r = 0; r < p; r++) if (r !== i) { const f = A[r][i] / A[i][i]; for (let c = i; c <= p; c++) A[r][c] -= f * A[i][c]; }
  }
  const beta = A.map((r, i) => r[p] / r[i]);
  const pred = X.map((r) => r.reduce((s, v, i) => s + v * beta[i], 0));
  const my = y.reduce((a, b) => a + b, 0) / y.length;
  const r2 = 1 - y.reduce((s, v, i) => s + (v - pred[i]) ** 2, 0) / y.reduce((s, v) => s + (v - my) ** 2, 0);
  assert.ok(r2 > 0.999, `R2=${r2}`);
  assert.ok(beta.slice(0, 5).every((b) => b > 0));
});

test('2017 y 2023 no son idénticos: los rankings difieren (las ediciones no son comparables)', () => {
  const common = [...dist17.keys()].filter((c) => dist.has(c));
  const a = common.map((c) => dist17.get(c).ids); const b = common.map((c) => dist.get(c).ids);
  assert.ok(pearson(a, b) > 0.8 && pearson(a, b) < 0.999);
});
