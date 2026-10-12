import { compute, rating } from './engine.js';
import { monteCarlo } from './sensitivity.js';
import { agreement, consensus, kappaLabel } from './stats.js';
import { UI, DIM_ORDER, DIM_ADVICE, SDG_NAMES } from './i18n.js';

const STORE = 'ids.v1';
const $app = document.getElementById('app');
let model, cantones, sdgMap, texts = {}, state = { lang: 'es', evals: [] }, deferredInstall = null, cmpSel = new Set();

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
  const today = new Date().toISOString().slice(0, 10);
  const provSel = h('select', { name: 'province' }, h('option', { value: '' }, t('otherZone')), cantones.provinces.map((p) => h('option', { value: p.name }, p.name)));
  const cantSel = h('select', { name: 'canton', disabled: true }, h('option', { value: '' }, '—'));
  provSel.addEventListener('change', () => {
    const p = cantones.provinces.find((x) => x.name === provSel.value);
    cantSel.replaceChildren(h('option', { value: '' }, '—'), ...(p ? p.cantons.map((c) => h('option', { value: c }, c)) : []));
    cantSel.disabled = !p;
  });
  const form = h('form', { class: 'card', onsubmit: (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const get = (k, n = 120) => String(f.get(k) || '').trim().slice(0, n);
    const canton = get('canton');
    const name = get('name') || canton;
    if (!name) return;
    const role = get('role', 20);
    const ev = {
      id: uid(), name, evaluator: get('evaluator'), province: get('province'), canton,
      role: Object.keys(UI.es.roles).includes(role) ? role : 'other',
      date: /^\d{4}-\d{2}-\d{2}$/.test(get('date', 10)) ? get('date', 10) : today,
      instrument: '1.0', created: new Date().toISOString(), answers: {},
    };
    state.evals.unshift(ev);
    persist();
    location.hash = `#/e/${ev.id}`;
  } },
    h('h2', {}, t('newEval')),
    h('div', { class: 'two' },
      h('label', {}, t('province'), provSel), h('label', {}, t('canton'), cantSel)),
    h('label', {}, t('zoneName'), h('input', { name: 'name', maxlength: 120, autocomplete: 'off' })),
    h('label', {}, t('evaluator'), h('input', { name: 'evaluator', maxlength: 120, autocomplete: 'off' })),
    h('div', { class: 'two' },
      h('label', {}, t('role'), h('select', { name: 'role' }, Object.entries(UI[state.lang].roles).map(([k, v]) => h('option', { value: k }, v)))),
      h('label', {}, t('evalDate'), h('input', { name: 'date', type: 'date', value: today, max: today }))),
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

  shell(t('subtitle'), [h('p', { class: 'lead' }, t('tagline')), form, h('h2', {}, t('myEvals')), list,
    state.evals.filter((e) => evalStats(e).r.complete).length >= 2 ? h('a', { class: 'btn', href: '#/compare' }, t('compare')) : null, h('p', { class: 'muted' }, t('saved'), ' ', t('disclaimer'))]);
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
  const meta = [ev.canton && ev.province ? `${ev.canton}, ${ev.province}` : null, ev.role ? UI[state.lang].roles[ev.role] : null, ev.date].filter(Boolean).join(' · ');
  shell(ev.name, [
    meta ? h('p', { class: 'muted' }, meta) : null,
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
    balanceCard(r), robustCard(ev), sdgCard(r),
    h('h2', {}, t('indicator')), detail,
    advice.some(Boolean) ? h('h2', {}, t('advice')) : null, advice,
    h('p', { class: 'muted' }, t('disclaimer')),
    h('div', { class: 'row no-print' },
      h('button', { class: 'btn primary', onclick: () => window.print() }, t('print')),
      h('button', { class: 'btn', onclick: () => download(`ids-${slug(ev.name)}.json`, JSON.stringify(exportObj(ev), null, 1), 'application/json') }, t('exportJson')),
      h('button', { class: 'btn', onclick: () => download(`ids-${slug(ev.name)}.csv`, toCsv(ev, r), 'text/csv') }, t('exportCsv'))),
  ], { back: `#/e/${ev.id}` });
}

function balanceCard(r) {
  const b = r.balance;
  return h('div', { class: 'card' }, h('h3', {}, t('balanceTitle')), h('p', { class: 'muted' }, t('balanceText')),
    h('p', {}, `${t('weakest')}: `, h('strong', {}, `${tx(`dim.${b.weakest}`)} (${pct(b.weakestNorm)})`)),
    h('p', {}, `${t('balanced')}: `, h('strong', {}, pct(b.balanced))),
    b.low.length ? h('p', { class: 'neg' }, `⚠ ${t('lowWarning')}: ${b.low.map((id) => tx(`dim.${id}`)).join(', ')}`) : null);
}

function robustCard(ev) {
  const mc = monteCarlo(model, ev.answers, { runs: 1000, delta: 0.2, seed: 2026 });
  if (!mc) return null;
  return h('div', { class: 'card' }, h('h3', {}, t('robustTitle')), h('p', { class: 'muted' }, t('robustText')),
    h('p', {}, `${t('robustRange')}: `, h('strong', {}, `${pct(mc.p05)} – ${pct(mc.p95)}`)),
    h('p', {}, `${t('robustCategory')} («${tx(`app.res_${rating(mc.base)}`)}»): `, h('strong', {}, pct(mc.categoryStability))));
}

function sdgCard(r) {
  const by = {};
  for (const [id, goals] of Object.entries(sdgMap.map)) {
    if (sdgMap.context_only.includes(id)) continue;
    for (const g of goals) (by[g] ||= []).push(r.indicators[id].norm);
  }
  const rows = Object.keys(by).map(Number).sort((a, b) => a - b).map((g) => {
    const v = by[g];
    const avg = v.reduce((a, b) => a + b, 0) / v.length;
    return h('tr', {}, h('td', {}, `${g}. ${SDG_NAMES[state.lang][g - 1]}`), h('td', {}, `${v.length} ${t('sdgIndicators')}`), h('td', {}, pct(avg)));
  });
  const missing = SDG_NAMES[state.lang].map((n, k) => [k + 1, n]).filter(([g]) => !by[g]);
  return h('div', { class: 'card' }, h('h3', {}, t('sdgTitle')), h('p', { class: 'muted' }, t('sdgText')),
    h('table', {}, h('tbody', {}, rows)),
    missing.length ? h('small', { class: 'muted' }, `${t('sdgUncovered')}: ${missing.map(([g, n]) => `${g}. ${n}`).join('; ')}`) : null);
}

function viewCompare() {
  const complete = state.evals.filter((e) => evalStats(e).r.complete);
  const chosen = complete.filter((e) => cmpSel.has(e.id));
  const boxes = complete.map((e) => h('label', { class: 'check' },
    h('input', { type: 'checkbox', checked: cmpSel.has(e.id), onchange: (ev) => { ev.target.checked ? cmpSel.add(e.id) : cmpSel.delete(e.id); viewCompare(); } }),
    ` ${e.name} · ${e.date || new Date(e.created).toLocaleDateString(state.lang)}${e.role ? ` · ${UI[state.lang].roles[e.role]}` : ''}`));
  const out = [h('p', { class: 'muted' }, t('compareHint')), complete.length >= 2 ? h('div', { class: 'card' }, boxes) : h('p', { class: 'muted' }, t('compareNeed'))];

  if (chosen.length >= 2) {
    const results = chosen.map((e) => compute(model, e.answers));
    const head = h('tr', {}, h('th', {}, ''), chosen.map((e) => h('th', {}, e.name)));
    const line = (label, f) => h('tr', {}, h('td', {}, label), results.map((r) => h('td', {}, f(r))));
    out.push(h('div', { class: 'card' }, h('table', {}, h('thead', {}, head), h('tbody', {},
      line(t('global'), (r) => pct(r.global.norm)),
      model.dimensions.map((d) => line(tx(`dim.${d.id}`), (r) => pct(r.dimensions[d.id].norm)))))));

    const itemIds = allIndicators().flatMap((i) => i.items.map((it) => it.id));
    const ag = agreement(chosen.map((e) => e.answers), itemIds);
    const full = Object.values(ag.perItem).filter((x) => x.agreement === 1).length;
    const kl = kappaLabel(ag.kappa);
    const worst = Object.entries(ag.perItem).filter(([, x]) => x.agreement < 1).sort((a, b) => a[1].agreement - b[1].agreement).slice(0, 10);
    const cons = consensus(chosen.map((e) => e.answers));
    const cr = compute(model, cons);
    out.push(h('div', { class: 'card' }, h('h3', {}, t('agreementTitle')),
      h('p', {}, `${t('kappa')}: `, h('strong', {}, ag.kappa === null ? t('kappaNA') : `${ag.kappa.toFixed(2)} (${UI[state.lang].kappaLevels[kl]})`)),
      h('p', {}, `${t('meanAgreement')}: `, h('strong', {}, pct(ag.meanAgreement))),
      h('p', {}, `${t('fullAgree')}: `, h('strong', {}, `${full}/${ag.items}`)),
      chosen.length >= 3 ? h('p', {}, `${t('consensusIds')}: `, h('strong', {}, cr.complete ? pct(cr.global.norm) : t('consensusTies'))) : null,
      worst.length ? [h('h3', {}, t('disputed')), h('ul', {}, worst.map(([id, x]) => h('li', {}, `${tx(`item.${id}`)} — ${pct(x.agreement)}`)))] : null,
      h('small', { class: 'muted' }, t('metaNote'))));
  }
  shell(t('compare'), out, { back: '#/' });
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
const exportObj = (ev) => ({ format: 'ids-evaluation', version: 1, instrument: ev.instrument || '1.0', name: ev.name, evaluator: ev.evaluator, province: ev.province, canton: ev.canton, role: ev.role, date: ev.date, created: ev.created, answers: ev.answers });
function toCsv(ev, r) {
  const q = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [['dimension', 'indicator_id', 'indicator', 'item_id', 'item', 'item_weight', 'answer'].join(',')];
  for (const d of model.dimensions) for (const i of d.indicators) for (const it of i.items) {
    lines.push([q(tx(`dim.${d.id}`)), i.id, q(tx(`ind.${i.id}`)), it.id, q(tx(`item.${it.id}`)), it.weight, ev.answers[it.id] ?? ''].join(','));
  }
  lines.push('', `zone,${q(ev.name)}`, `province,${q(ev.province || '')}`, `canton,${q(ev.canton || '')}`, `date,${ev.date || ''}`, `role,${ev.role || ''}`, `instrument,${ev.instrument || '1.0'}`,
    `global_normalized,${r.global.norm}`, `global_original,${r.global.raw}`, `balanced_ids,${r.balance.balanced}`, `weakest_dimension,${r.balance.weakest}`);
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
    const s = (v, n = 120) => String(v || '').slice(0, n);
    const ev = { id: uid(), name: o.name.slice(0, 120), evaluator: s(o.evaluator), province: s(o.province), canton: s(o.canton),
      role: Object.keys(UI.es.roles).includes(o.role) ? o.role : 'other', date: /^\d{4}-\d{2}-\d{2}$/.test(o.date) ? o.date : '',
      instrument: '1.0', created: new Date().toISOString(), answers };
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
  if (p[0] === 'compare') return viewCompare();
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
  [model, texts.es, texts.en, cantones, sdgMap] = await Promise.all([j('data/indicators.json'), j('data/i18n.es.json'), j('data/i18n.en.json'),
    j('data/cr-cantones.json'), j('data/sdg-map.json')]);
  window.addEventListener('hashchange', route);
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredInstall = e; route(); });
  route();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
}
boot().catch((e) => { $app.textContent = `Error: ${e.message}`; });
