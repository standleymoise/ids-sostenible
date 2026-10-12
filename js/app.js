import { compute, rating } from './engine.js';
import { UI, DIM_ORDER, DIM_ADVICE } from './i18n.js';

const STORE = 'ids.v1';
const $app = document.getElementById('app');
let model, texts = {}, state = { lang: 'es', evals: [] }, deferredInstall = null;

// ---------- utilidades ----------
const h = (tag, attrs = {}, ...kids) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === false || v === null || v === undefined) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'style') el.style.cssText = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat(Infinity)) {
    if (kid === null || kid === undefined || kid === false) continue;
    el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return el;
};
const t = (k) => UI[state.lang][k] ?? UI.es[k] ?? k;
const tx = (k) => texts[state.lang]?.[k] ?? texts.es?.[k] ?? k;
const pct = (x) => (x === null || x === undefined ? '–' : `${(x * 100).toFixed(1)} %`);
const num = (x) => (x === null || x === undefined ? '–' : x.toFixed(3));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const dimOf = (id) => model.dimensions.find((d) => d.id === id);
const allIndicators = () => model.dimensions.flatMap((d) => d.indicators);

function persist() {
  try { localStorage.setItem(STORE, JSON.stringify(state)); } catch { /* modo privado: se sigue sin guardar */ }
}
function restore() {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(STORE) || 'null'); } catch { /* sin almacenamiento o datos corruptos */ }
  if (saved && Array.isArray(saved.evals)) state = { lang: saved.lang === 'en' ? 'en' : 'es', evals: saved.evals };
  else if (navigator.language?.startsWith('en')) state.lang = 'en';
}
const getEval = (id) => state.evals.find((e) => e.id === id);

// ---------- layout ----------
function shell(title, content, { back } = {}) {
  document.documentElement.lang = state.lang;
  document.title = `${title} · ${t('title')}`;
  const bar = h('header', { class: 'bar' },
    back ? h('a', { class: 'btn ghost', href: back, 'aria-label': t('back') }, '←') : h('a', { class: 'brand', href: '#/' }, h('img', { src: 'icons/icon-192.png', alt: '', width: 28, height: 28 }), t('title')),
    h('nav', {},
      h('a', { href: '#/guide' }, t('guide')),
      h('a', { href: '#/about' }, t('about')),
      h('button', { class: 'btn ghost', onclick: () => { state.lang = state.lang === 'es' ? 'en' : 'es'; persist(); route(); } }, t('language')),
    ));
  $app.replaceChildren(bar, h('main', {}, h('h1', {}, title), content),
    h('footer', {}, t('privacy'), ' ', t('source'),
      deferredInstall ? h('button', { class: 'btn small', onclick: installApp }, t('install')) : null));
  window.scrollTo(0, 0);
}

async function installApp() {
  if (!deferredInstall) return;
  deferredInstall.prompt();
  await deferredInstall.userChoice;
  deferredInstall = null;
  route();
}

function progressBar(done, total) {
  return h('div', { class: 'progress', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': total, 'aria-valuenow': done },
    h('span', { style: `width:${total ? (done / total) * 100 : 0}%` }));
}

function evalStats(ev) {
  const r = compute(model, ev.answers);
  const inds = Object.values(r.indicators);
  return { r, doneInd: inds.filter((i) => i.done).length, totalInd: inds.length };
}

// ---------- vistas ----------
function viewHome() {
  const form = h('form', { class: 'card', onsubmit: (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const name = String(f.get('name') || '').trim().slice(0, 120);
    if (!name) return;
    const ev = { id: uid(), name, evaluator: String(f.get('evaluator') || '').trim().slice(0, 120), created: new Date().toISOString(), answers: {} };
    state.evals.unshift(ev);
    persist();
    location.hash = `#/e/${ev.id}`;
  } },
    h('h2', {}, t('newEval')),
    h('label', {}, t('zoneName'), h('input', { name: 'name', required: true, maxlength: 120, autocomplete: 'off' })),
    h('label', {}, t('evaluator'), h('input', { name: 'evaluator', maxlength: 120, autocomplete: 'off' })),
    h('div', { class: 'row' },
      h('button', { class: 'btn primary', type: 'submit' }, t('create')),
      h('label', { class: 'btn' }, t('importJson'), h('input', { type: 'file', accept: 'application/json,.json', hidden: true, onchange: importFile }))));

  const list = state.evals.length
    ? state.evals.map((ev) => {
      const { r, doneInd, totalInd } = evalStats(ev);
      return h('div', { class: 'card eval' },
        h('div', {}, h('h3', {}, ev.name), h('small', {}, `${t('created')}: ${new Date(ev.created).toLocaleDateString(state.lang)}`),
          progressBar(doneInd, totalInd), h('small', {}, `${doneInd}/${totalInd} · IDS: ${r.global ? pct(r.global.norm) : '–'}`)),
        h('div', { class: 'row' },
          h('a', { class: 'btn primary', href: `#/e/${ev.id}` }, t('open')),
          h('button', { class: 'btn danger', onclick: () => { if (confirm(t('confirmDelete'))) { state.evals = state.evals.filter((x) => x.id !== ev.id); persist(); route(); } } }, t('del'))));
    })
    : h('p', { class: 'muted' }, t('noEvals'));

  shell(t('subtitle'), [h('p', { class: 'lead' }, t('tagline')), form, h('h2', {}, t('myEvals')), list, h('p', { class: 'muted' }, t('saved'), ' ', t('disclaimer'))]);
}

function viewEval(ev) {
  const { r, doneInd, totalInd } = evalStats(ev);
  const cards = DIM_ORDER.map((id) => {
    const dim = dimOf(id);
    const done = dim.indicators.filter((i) => r.indicators[i.id].done).length;
    return h('a', { class: `card dim d-${id}`, href: `#/e/${ev.id}/d/${id}` },
      h('h3', {}, tx(`dim.${id}`)), h('small', {}, `${t('weight')}: ${dim.weight * 100} %`),
      progressBar(done, dim.indicators.length), h('small', {}, `${done}/${dim.indicators.length}`),
      r.dimensions[id].done ? h('strong', {}, pct(r.dimensions[id].norm)) : null);
  });
  shell(ev.name, [
    h('p', { class: 'muted' }, `${t('progress')}: ${doneInd}/${totalInd}`), progressBar(doneInd, totalInd),
    h('div', { class: 'grid' }, cards),
    h('div', { class: 'row' },
      r.complete ? h('a', { class: 'btn primary', href: `#/e/${ev.id}/r` }, t('results')) : h('p', { class: 'muted' }, t('needAll'))),
  ], { back: '#/' });
}

function viewDimension(ev, dimId) {
  const dim = dimOf(dimId);
  const { r } = evalStats(ev);
  const rows = dim.indicators.map((ind) => {
    const s = r.indicators[ind.id];
    return h('a', { class: `card ind ${s.done ? 'is-done' : ''}`, href: `#/e/${ev.id}/i/${ind.id}` },
      h('span', {}, s.done ? '✓ ' : '', tx(`ind.${ind.id}`)), h('small', {}, `${s.answered}/${s.total}`));
  });
  shell(tx(`dim.${dimId}`), h('div', { class: `list d-${dimId}` }, rows), { back: `#/e/${ev.id}` });
}

function viewIndicator(ev, indId) {
  const dim = model.dimensions.find((d) => d.indicators.some((i) => i.id === indId));
  const ind = dim.indicators.find((i) => i.id === indId);
  const idx = dim.indicators.indexOf(ind);
  const counter = h('small', {});
  const update = () => {
    const n = ind.items.filter((it) => ev.answers[it.id] === 0 || ev.answers[it.id] === 1).length;
    counter.textContent = `${n}/${ind.items.length} ${t('answered')}`;
    return n;
  };
  const items = ind.items.map((it) => {
    const mk = (val, label) => {
      const b = h('button', { type: 'button', class: 'btn choice', 'aria-pressed': ev.answers[it.id] === val, onclick: () => {
        ev.answers[it.id] = val; persist();
        row.querySelectorAll('.choice').forEach((x, k) => x.setAttribute('aria-pressed', k === (val === 1 ? 0 : 1)));
        update();
      } }, label);
      return b;
    };
    const row = h('div', { class: 'item' },
      h('p', {}, tx(`item.${it.id}`), it.weight < 0 ? h('small', { class: 'neg', title: t('lowers') }, ` ⚠ ${t('lowers')}`) : null),
      h('div', { class: 'row' }, mk(1, t('yes')), mk(0, t('no'))));
    return row;
  });
  update();
  const next = dim.indicators[idx + 1];
  shell(tx(`ind.${ind.id}`), [
    h('p', { class: 'muted' }, tx(`dim.${dim.id}`), ' · ', counter), h('div', { class: `list d-${dim.id}` }, items),
    h('div', { class: 'row' },
      h('button', { class: 'btn', onclick: () => { if (confirm(t('confirmReset'))) { ind.items.forEach((it) => delete ev.answers[it.id]); persist(); route(); } } }, t('reset')),
      h('a', { class: 'btn primary', href: next ? `#/e/${ev.id}/i/${next.id}` : `#/e/${ev.id}/d/${dim.id}` }, next ? '→' : t('done'))),
  ], { back: `#/e/${ev.id}/d/${dim.id}` });
}

function viewResults(ev) {
  const r = compute(model, ev.answers);
  if (!r.complete) { location.hash = `#/e/${ev.id}`; return; }
  const gR = rating(r.global.norm);
  const dimRows = DIM_ORDER.map((id) => {
    const d = r.dimensions[id];
    return h('div', { class: `bar-row d-${id}` },
      h('span', {}, tx(`dim.${id}`)), h('div', { class: 'meter' }, h('i', { style: `width:${Math.max(0, d.norm) * 100}%` })),
      h('b', {}, pct(d.norm)), h('small', {}, `(${num(d.raw)})`));
  });
  const detail = DIM_ORDER.map((id) => h('details', {},
    h('summary', {}, tx(`dim.${id}`)),
    h('table', {}, h('thead', {}, h('tr', {}, h('th', {}, t('indicator')), h('th', {}, t('weight')), h('th', {}, t('normalized')), h('th', {}, t('original')))),
      h('tbody', {}, dimOf(id).indicators.map((ind) => {
        const s = r.indicators[ind.id];
        return h('tr', {}, h('td', {}, tx(`ind.${ind.id}`)), h('td', {}, `${(ind.weight * 100).toFixed(0)} %`), h('td', {}, pct(s.norm)), h('td', {}, num(s.raw)));
      })))));
  const advice = DIM_ORDER.map((id) => {
    const n = r.dimensions[id].norm;
    const bucket = n < 0.2 ? 'worst' : n < 0.4 ? 'bad' : n < 0.6 ? 'mid' : null;
    const [pre, title] = DIM_ADVICE[id];
    const body = bucket ? texts[state.lang][`app.${pre}_${bucket}`] || texts.es[`app.${pre}_${bucket}`] : null;
    return body ? h('div', { class: 'card' }, h('h3', {}, tx(`app.${title}`)), h('p', { class: 'pre' }, body)) : null;
  });

  shell(`${t('results')} · ${ev.name}`, [
    h('p', { class: 'muted print-only' }, `${t('zone')}: ${ev.name}${ev.evaluator ? ` · ${ev.evaluator}` : ''} · ${t('date')}: ${new Date().toLocaleDateString(state.lang)}`),
    h('div', { class: `card hero r-${gR}` },
      h('small', {}, t('global')), h('div', { class: 'big' }, pct(r.global.norm)), h('strong', {}, tx(`app.res_${gR}`)),
      h('small', {}, `${t('original')}: ${num(r.global.raw)}`)),
    h('div', { class: 'card' }, dimRows, h('small', { class: 'muted' }, t('scaleNote'))),
    h('h2', {}, t('indicator')), detail,
    advice.some(Boolean) ? h('h2', {}, t('advice')) : null, advice,
    h('p', { class: 'muted' }, t('disclaimer')),
    h('div', { class: 'row no-print' },
      h('button', { class: 'btn primary', onclick: () => window.print() }, t('print')),
      h('button', { class: 'btn', onclick: () => download(`ids-${slug(ev.name)}.json`, JSON.stringify(exportObj(ev), null, 1), 'application/json') }, t('exportJson')),
      h('button', { class: 'btn', onclick: () => download(`ids-${slug(ev.name)}.csv`, toCsv(ev, r), 'text/csv') }, t('exportCsv'))),
  ], { back: `#/e/${ev.id}` });
}

function viewAbout() {
  shell(tx('app.about_title'), [h('h2', {}, tx('app.about_subtitle')), h('p', { class: 'pre' }, tx('app.about_body')),
    h('h2', {}, tx('app.about_subtitle2')), h('p', { class: 'pre' }, tx('app.about_body2'))], { back: '#/' });
}
function viewGuide() {
  shell(t('guide'), h('ol', { class: 'guide' }, UI[state.lang].guideItems.map((g) => h('li', {}, g))), { back: '#/' });
}

// ---------- exportar / importar ----------
const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'evaluacion';
function download(name, content, type) {
  const a = h('a', { href: URL.createObjectURL(new Blob([type === 'text/csv' ? '﻿' + content : content], { type: `${type};charset=utf-8` })), download: name });
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
const exportObj = (ev) => ({ format: 'ids-evaluation', version: 1, name: ev.name, evaluator: ev.evaluator, created: ev.created, answers: ev.answers });
function toCsv(ev, r) {
  const q = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [['dimension', 'indicator_id', 'indicator', 'item_id', 'item', 'item_weight', 'answer'].join(',')];
  for (const d of model.dimensions) for (const i of d.indicators) for (const it of i.items) {
    lines.push([q(tx(`dim.${d.id}`)), i.id, q(tx(`ind.${i.id}`)), it.id, q(tx(`item.${it.id}`)), it.weight, ev.answers[it.id] ?? ''].join(','));
  }
  lines.push('', `global_normalized,${r.global.norm}`, `global_original,${r.global.raw}`);
  for (const d of model.dimensions) lines.push(`${d.id}_normalized,${r.dimensions[d.id].norm}`, `${d.id}_original,${r.dimensions[d.id].raw}`);
  return lines.join('\n');
}
async function importFile(e) {
  const file = e.target.files[0];
  if (!file || file.size > 1e6) return;
  try {
    const o = JSON.parse(await file.text());
    if (o.format !== 'ids-evaluation' || typeof o.name !== 'string' || typeof o.answers !== 'object') throw new Error();
    const valid = new Set(allIndicators().flatMap((i) => i.items.map((it) => it.id)));
    const answers = {};
    for (const [k, v] of Object.entries(o.answers)) if (valid.has(k) && (v === 0 || v === 1)) answers[k] = v;
    const ev = { id: uid(), name: o.name.slice(0, 120), evaluator: String(o.evaluator || '').slice(0, 120), created: new Date().toISOString(), answers };
    state.evals.unshift(ev); persist(); location.hash = `#/e/${ev.id}`;
  } catch { alert(t('importError')); }
}

// ---------- router ----------
function route() {
  if (!model) return;
  const p = location.hash.replace(/^#\/?/, '').split('/');
  const ev = p[0] === 'e' ? getEval(p[1]) : null;
  if (p[0] === 'about') return viewAbout();
  if (p[0] === 'guide') return viewGuide();
  if (p[0] === 'e' && !ev) { location.hash = '#/'; return; }
  if (ev && p[2] === 'd' && dimOf(p[3])) return viewDimension(ev, p[3]);
  if (ev && p[2] === 'i' && allIndicators().some((i) => i.id === p[3])) return viewIndicator(ev, p[3]);
  if (ev && p[2] === 'r') return viewResults(ev);
  if (ev) return viewEval(ev);
  return viewHome();
}

async function boot() {
  restore();
  const j = (u) => fetch(u).then((r) => r.json());
  [model, texts.es, texts.en] = await Promise.all([j('data/indicators.json'), j('data/i18n.es.json'), j('data/i18n.en.json')]);
  window.addEventListener('hashchange', route);
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredInstall = e; route(); });
  route();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
}
boot().catch((e) => { $app.textContent = `Error: ${e.message}`; });
