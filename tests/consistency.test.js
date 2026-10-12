import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildIndex, conflictsIf, sameAs, blocked, validate } from '../js/consistency.js';

const load = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const model = load('../data/indicators.json');
const cons = load('../data/constraints.json');
const index = buildIndex(cons);
const ids = new Set(model.dimensions.flatMap((d) => d.indicators.flatMap((i) => i.items.map((it) => it.id))));

test('las reglas apuntan a afirmaciones que existen y tienen texto en es/en', () => {
  for (const r of cons.rules) {
    for (const id of r.type === 'implies' ? [r.if, r.then] : r.items) assert.ok(ids.has(id), `${r.id}: ${id}`);
    assert.ok(r.reason.es && r.reason.en, r.id);
    assert.ok(['hard', 'soft'].includes(r.level), r.id);
  }
  assert.equal(new Set(cons.rules.map((r) => r.id)).size, cons.rules.length);
});

test('contradicción dura: clima — con «Tropical húmedo» = Sí se bloquea «Tropical seco» = Sí', () => {
  const a = { env13_1: 1 };
  const c = conflictsIf(index, a, 'env13_2', 1);
  assert.equal(c.length, 1);
  assert.deepEqual(c[0].blockers, ['env13_1']);
  assert.equal(blocked(index, a, 'env13_2').yes.length, 1);
  assert.equal(blocked(index, a, 'env13_2').no.length, 0); // «No» siempre posible
  assert.equal(conflictsIf(index, a, 'env13_2', 0).length, 0);
});

test('con «No» a «húmedo» sí se puede elegir «seco»', () => {
  assert.equal(conflictsIf(index, { env13_1: 0 }, 'env13_2', 1).length, 0);
});

test('dependencia: «mantenimiento constante» exige que existan espacios verdes', () => {
  assert.equal(conflictsIf(index, { env15_1: 0 }, 'env15_3', 1).length, 1); // sin espacios verdes
  assert.equal(conflictsIf(index, {}, 'env15_3', 1).length, 0); // aún sin responder: se permite
  assert.equal(conflictsIf(index, { env15_1: 1 }, 'env15_3', 1).length, 0);
  // y al revés: no se puede decir «No hay espacios verdes» si ya hay mantenimiento
  assert.equal(conflictsIf(index, { env15_3: 1 }, 'env15_1', 0).length, 1);
  assert.deepEqual(conflictsIf(index, { env15_3: 1 }, 'env15_1', 0)[0].blockers, ['env15_3']);
});

test('reglas suaves no bloquean (level soft) pero se detectan', () => {
  const a = { soc06_3: 1 };
  const c = conflictsIf(index, a, 'soc09_3', 1);
  assert.equal(c.length, 1);
  assert.equal(c[0].rule.level, 'soft');
  assert.equal(blocked(index, a, 'soc09_3').yes.length, 0);
});

test('duplicado «Homicidios frecuentes»: misma respuesta en ambos indicadores', () => {
  assert.deepEqual(sameAs(index, 'soc06_5'), ['soc09_5']);
  assert.deepEqual(sameAs(index, 'soc09_5'), ['soc06_5']);
  assert.deepEqual(sameAs(index, 'env01_1'), []);
  assert.equal(validate(index, { soc06_5: 1, soc09_5: 0 }).length, 1);
});

test('validate: detecta conflictos y que el clima no tenga ninguna opción', () => {
  assert.equal(validate(index, {}).length, 0);
  const v = validate(index, { env13_1: 1, env13_2: 1, env13_3: 0 });
  assert.equal(v.length, 1);
  assert.deepEqual(v[0].items, ['env13_1', 'env13_2']);
  const none = validate(index, { env13_1: 0, env13_2: 0, env13_3: 0 });
  assert.equal(none[0].kind, 'none');
  assert.equal(validate(index, { env13_1: 0, env13_2: 1, env13_3: 0 }).length, 0);
});

test('un conjunto de respuestas óptimo y coherente no tiene violaciones', () => {
  const a = {};
  for (const id of ids) a[id] = 0;
  a.env13_1 = 1; a.env15_1 = 1; a.env15_3 = 1;
  assert.deepEqual(validate(index, a), []);
});
