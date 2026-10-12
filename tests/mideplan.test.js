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
