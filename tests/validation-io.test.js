import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeName, toNumber, parseCsv, buildRows, toMarkdown } from '../js/validation-io.js';
import { compareIndices } from '../js/validation.js';
import { mulberry32 } from '../js/sensitivity.js';

test('normalizeName ignora tildes, mayúsculas y puntuación', () => {
  assert.equal(normalizeName('  San José '), 'san jose');
  assert.equal(normalizeName('Guácimo'), normalizeName('guacimo'));
  assert.equal(normalizeName(null), '');
});

test('toNumber: punto o coma decimal, miles y porcentaje', () => {
  assert.equal(toNumber('1.234,5', true), 1234.5);
  assert.equal(toNumber('0,87', true), 0.87);
  assert.equal(toNumber('1,234.5', false), 1234.5);
  assert.equal(toNumber('50 %', false), 50);
  assert.ok(Number.isNaN(toNumber('', false)));
  assert.ok(Number.isNaN(toNumber('n/d', false)));
});

test('parseCsv: coma, punto y coma con coma decimal (Excel en español), comillas y BOM', () => {
  const a = parseCsv('﻿zona,ids,idhc\nGuácimo,0.62,0.71\n"Pérez, Zeledón",0.5,0.6\n');
  assert.equal(a.delimiter, ','); assert.equal(a.decimalComma, false);
  assert.deepEqual(a.header, ['zona', 'ids', 'idhc']);
  assert.equal(a.rows[1][0], 'Pérez, Zeledón');
  const b = parseCsv('zona;idhc;ips\r\nGuácimo;0,71;65,2\r\nPococí;0,60;58,9\r\n');
  assert.equal(b.delimiter, ';'); assert.equal(b.decimalComma, true);
  assert.equal(b.rows.length, 2);
});

test('buildRows: cruza por nombre con las evaluaciones propias y avisa de lo que no coincide', () => {
  const parsed = parseCsv('zona;idhc;ips\nGuácimo;0,71;65,2\nPococí;0,6;58,9\nAtlántida;0,5;40\n');
  const own = [{ name: 'guacimo', ids: 62, dims: { environmental: 70 } }, { name: 'POCOCI', ids: 55 }];
  const r = buildRows(parsed, own);
  assert.equal(r.hadIds, false);
  assert.deepEqual(r.indices, ['idhc', 'ips']);
  assert.equal(r.rows[0].ids, 62); assert.equal(r.rows[0].ext.idhc, 0.71);
  assert.deepEqual(r.unmatched, ['Atlántida']);
  assert.ok(Number.isNaN(r.rows[2].ids));
});

test('buildRows con columna ids propia y zonas repetidas', () => {
  const r = buildRows(parseCsv('zona,ids,idhc\na,1,1\nb,2,2\na,9,9\n'));
  assert.equal(r.hadIds, true);
  assert.equal(r.rows.length, 2);
  assert.equal(r.rows[0].ids, 1);
});

test('toMarkdown produce un informe con las medidas y las advertencias', () => {
  const rnd = mulberry32(3); const rows = [];
  for (let i = 0; i < 25; i++) { const b = rnd() * 100; rows.push({ name: `z${i}`, ids: b, dims: { environmental: b }, ext: { IDHc: b + rnd() * 20 } }); }
  const md = toMarkdown(compareIndices(rows, { runs: 300 }), { date: '2026-10-12', version: '1.2.0' });
  for (const s of ['## IDHc', 'Spearman ρ', 'Kendall', 'CCC de Lin', 'Bland–Altman', 'Rango de cercanía', 'κ ponderado', 'Grupos conocidos', 'Validez convergente', '≥ 30 zonas']) {
    assert.ok(md.includes(s), s);
  }
});
