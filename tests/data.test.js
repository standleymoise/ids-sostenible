import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const load = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const model = load('../data/indicators.json');
const langs = { es: load('../data/i18n.es.json'), en: load('../data/i18n.en.json') };
const sum = (xs) => xs.reduce((a, b) => a + b, 0);

test('todo indicador, ítem y dimensión tiene texto en español e inglés', () => {
  for (const [lang, tx] of Object.entries(langs)) {
    for (const d of model.dimensions) {
      assert.ok(tx[`dim.${d.id}`], `${lang} dim.${d.id}`);
      for (const i of d.indicators) {
        assert.ok(tx[`ind.${i.id}`], `${lang} ind.${i.id}`);
        for (const it of i.items) assert.ok(tx[`item.${it.id}`], `${lang} item.${it.id}`);
      }
    }
  }
});

test('los textos en inglés son traducciones (no copias del español) para los indicadores', () => {
  const same = model.dimensions.flatMap((d) => d.indicators).filter((i) => langs.es[`ind.${i.id}`] === langs.en[`ind.${i.id}`]);
  // algunos nombres coinciden en ambos idiomas (p. ej. "Compostaje"/"Composting" no, "Regular" sí); toleramos pocos
  assert.ok(same.length <= 3, `demasiados nombres sin traducir: ${same.map((i) => i.id)}`);
});

test('el modelo incluye los textos de la guía, acerca de y consejos', () => {
  for (const tx of Object.values(langs)) {
    for (const k of ['app.about_body', 'app.res_worst', 'app.res_environment_worst', 'app.res_social_mid', 'app.res_economic_bad', 'app.res_politic_worst']) {
      assert.ok(tx[k] && tx[k].length > 3, k);
    }
  }
});

test('pesos de ítems: las dimensiones ambiental y social suman 1; el caso económico queda documentado', () => {
  const dimW = (id) => sum(model.dimensions.find((d) => d.id === id).indicators.map((i) => i.weight));
  assert.ok(Math.abs(dimW('environmental') - 1) < 1e-9);
  assert.ok(Math.abs(dimW('social') - 1) < 1e-9);
  assert.ok(Math.abs(dimW('political') - 1) < 1e-9);
  // La dimensión económica suma 0,90 porque «Inflación» pesa −0,05 en la tesis.
  // Con +0,05 sumaría exactamente 1,00 (posible error de signo; ver docs/CORRECCIONES.md).
  assert.ok(Math.abs(dimW('economic') - 0.9) < 1e-9);
});

test('los ids son únicos', () => {
  const ids = model.dimensions.flatMap((d) => d.indicators.flatMap((i) => [i.id, ...i.items.map((it) => it.id)]));
  assert.equal(new Set(ids).size, ids.length);
});
