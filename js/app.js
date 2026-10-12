import { compute, rating } from './engine.js';
import { monteCarlo } from './sensitivity.js';
import { buildIndex, conflictsIf, sameAs, blocked, validate } from './consistency.js';
import { compareIndices, dimensionMatrix, icc, itemAnalysis, splitHalf, corrLabel, alphaLabel, iccLabel } from './validation.js';
import { parseCsv, buildRows, toMarkdown, normalizeName, loadMideplan } from './validation-io.js';
import { mulberry32 } from './sensitivity.js';
import { agreement, consensus, kappaLabel } from './stats.js';
import { UI, DIM_ORDER, DIM_ADVICE, SDG_NAMES } from './i18n.js';

const STORE = 'ids.v1';
const $app = document.getElementById('app');
let model, geo, sdgMap, cIndex, texts = {}, state = { lang: 'es', evals: [] }, deferredInstall = null, cmpSel = new Set(), valState = { source: 'mideplan', text: '', scale: 'percentile', tol: 10, result: null, info: null, demo: false, sections: null };

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
      h('a', { href: '#/validate' }, t('validate')),
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
  const opt = (v, l) => h('option', { value: v }, l);
  const provSel = h('select', { name: 'province' }, opt('', t('otherZone')), geo.provinces.map((p) => opt(p.code, p.name)));
  const cantSel = h('select', { name: 'canton', disabled: true }, opt('', '—'));
  const distSel = h('select', { name: 'district', disabled: true }, opt('', '—'));
  provSel.addEventListener('change', () => {
    const p = geo.provinces.find((x) => String(x.code) === provSel.value);
    cantSel.replaceChildren(opt('', '—'), ...(p ? p.cantons.map((c) => opt(c.code, c.name)) : []));
    cantSel.disabled = !p;
    distSel.replaceChildren(opt('', '—'));
    distSel.disabled = true;
  });
  cantSel.addEventListener('change', () => {
    const c = geo.provinces.flatMap((p) => p.cantons).find((x) => String(x.code) === cantSel.value);
    distSel.replaceChildren(opt('', '—'), ...(c ? c.districts.map((d) => opt(d.code, d.name)) : []));
    distSel.disabled = !c;
  });
  const form = h('form', { class: 'card', onsubmit: (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const get = (k, n = 120) => String(f.get(k) || '').trim().slice(0, n);
    const prov = geo.provinces.find((x) => String(x.code) === get('province'));
    const cant = prov?.cantons.find((x) => String(x.code) === get('canton'));
    const dist = cant?.districts.find((x) => String(x.code) === get('district'));
    const name = get('name') || dist?.name || cant?.name;
    if (!name) return;
    const role = get('role', 20);
    const ev = {
      id: uid(), name, evaluator: get('evaluator'), province: prov?.name || '', canton: cant?.name || '', cantonCode: cant?.code || '',
      district: dist?.name || '', pcd: dist?.code || '',
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
    h('label', {}, t('district'), distSel),
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
  const meta = [ev.district || null, ev.canton && ev.province ? `${ev.canton}, ${ev.province}` : null, ev.role ? UI[state.lang].roles[ev.role] : null, ev.date].filter(Boolean).join(' · ');
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

const itemIndicatorId = (itemId) => itemId.split('_')[0];
const ruleReason = (r) => r.reason[state.lang] || r.reason.es;

function viewIndicator(ev, indId) {
  const dim = model.dimensions.find((d) => d.indicators.some((i) => i.id === indId));
  const ind = dim.indicators.find((i) => i.id === indId);
  const idx = dim.indicators.indexOf(ind);
  const counter = h('small', {});
  const rows = new Map();
  const link = (id) => h('a', { href: `#/e/${ev.id}/i/${itemIndicatorId(id)}` }, `«${tx(`item.${id}`)}»`);
  const links = (ids) => ids.flatMap((id, k) => (k ? [', ', link(id)] : [link(id)]));

  const refresh = () => {
    const n = ind.items.filter((it) => ev.answers[it.id] === 0 || ev.answers[it.id] === 1).length;
    counter.textContent = `${n}/${ind.items.length} ${t('answered')}`;
    const open = validate(cIndex, ev.answers);
    for (const it of ind.items) {
      const { yes, no } = blocked(cIndex, ev.answers, it.id);
      const r = rows.get(it.id);
      r.yes.setAttribute('aria-pressed', ev.answers[it.id] === 1);
      r.no.setAttribute('aria-pressed', ev.answers[it.id] === 0);
      r.yes.disabled = yes.length > 0;
      r.no.disabled = no.length > 0;
      const notes = [];
      for (const c of yes) notes.push(h('p', { class: 'lock' }, `🔒 ${t('lockedYes')} ${ruleReason(c.rule)} `, t('see'), ' ', links(c.blockers)));
      for (const c of no) notes.push(h('p', { class: 'lock' }, `🔒 ${t('lockedNo')} `, links(c.blockers)));
      for (const o of open.filter((v) => v.rule.level === 'soft' && v.items.includes(it.id))) {
        notes.push(h('p', { class: 'neg' }, `⚠ ${ruleReason(o.rule)} `, links(o.items.filter((x) => x !== it.id))));
      }
      for (const o of open.filter((v) => v.rule.level === 'hard' && v.items.includes(it.id))) {
        notes.push(h('p', { class: 'neg' }, `⚠ ${t('inconsistent')} ${ruleReason(o.rule)} `, links(o.items.filter((x) => x !== it.id))));
      }
      for (const other of sameAs(cIndex, it.id)) notes.push(h('p', { class: 'muted small' }, `↔ ${t('sameNote')} `, link(other)));
      r.note.replaceChildren(...notes);
    }
  };

  const answer = (it, val) => {
    const conf = conflictsIf(cIndex, ev.answers, it.id, val);
    if (conf.some((c) => c.rule.level === 'hard')) return; // el botón ya está bloqueado; defensa adicional
    const soft = conf.filter((c) => c.rule.level === 'soft');
    if (soft.length) {
      const msg = soft.map((c) => `${ruleReason(c.rule)}\n${c.blockers.map((b) => `• ${tx(`item.${b}`)}`).join('\n')}`).join('\n\n');
      if (!confirm(`${t('softConfirm')}\n\n${msg}`)) return;
    }
    ev.answers[it.id] = val;
    for (const other of sameAs(cIndex, it.id)) ev.answers[other] = val;
    persist();
    refresh();
  };

  const items = ind.items.map((it) => {
    const yes = h('button', { type: 'button', class: 'btn choice', onclick: () => answer(it, 1) }, t('yes'));
    const no = h('button', { type: 'button', class: 'btn choice', onclick: () => answer(it, 0) }, t('no'));
    const note = h('div', { class: 'notes' });
    rows.set(it.id, { yes, no, note });
    return h('div', { class: 'item' },
      h('p', {}, tx(`item.${it.id}`), it.weight < 0 ? h('small', { class: 'neg', title: t('lowers') }, ` ⚠ ${t('lowers')}`) : null),
      h('div', { class: 'row' }, yes, no), note);
  });
  refresh();
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
    consistencyCard(ev), balanceCard(r), robustCard(ev), sdgCard(r),
    h('h2', {}, t('indicator')), detail,
    advice.some(Boolean) ? h('h2', {}, t('advice')) : null, advice,
    h('p', { class: 'muted' }, t('disclaimer')),
    h('div', { class: 'row no-print' },
      h('button', { class: 'btn primary', onclick: () => window.print() }, t('print')),
      h('button', { class: 'btn', onclick: () => download(`ids-${slug(ev.name)}.json`, JSON.stringify(exportObj(ev), null, 1), 'application/json') }, t('exportJson')),
      h('button', { class: 'btn', onclick: () => download(`ids-${slug(ev.name)}.csv`, toCsv(ev, r), 'text/csv') }, t('exportCsv'))),
  ], { back: `#/e/${ev.id}` });
}

function consistencyCard(ev) {
  const v = validate(cIndex, ev.answers);
  if (!v.length) return h('div', { class: 'card' }, h('h3', {}, t('consistencyTitle')), h('p', {}, `✓ ${t('consistencyOk')}`));
  return h('div', { class: 'card' }, h('h3', {}, t('consistencyTitle')), h('p', { class: 'neg' }, `⚠ ${t('consistencyBad')} (${v.length})`),
    h('ul', {}, v.map((o) => h('li', {}, ruleReason(o.rule), ' — ', o.items.map((id) => tx(`item.${id}`)).join('; ')))),
    h('small', { class: 'muted' }, t('consistencyNote')));
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

// ---------- validación ----------
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const f2 = (v, d = 2) => (v === null || v === undefined || Number.isNaN(v) ? '–' : v.toFixed(d));
const pText = (p) => (p === null || p === undefined ? '–' : p < 0.001 ? '< 0.001' : p.toFixed(3));
const pEq = (p) => (p === null || p === undefined ? 'p –' : p < 0.001 ? 'p < 0.001' : `p = ${p.toFixed(3)}`);
const ciText = (c) => (c ? `[${f2(c[0])}; ${f2(c[1])}]` : '–');
const pc0 = (x) => (x === null || x === undefined ? '–' : `${(x * 100).toFixed(0)} %`);

/** Zonas con evaluaciones completas; si hay varias del mismo distrito/cantón/nombre se promedia el IDS. */
function ownZones() {
  const zones = new Map();
  for (const e of state.evals) {
    const r = compute(model, e.answers);
    if (!r.complete) continue;
    const name = e.district || e.canton || e.name;
    const code = e.pcd || e.cantonCode || '';
    const key = code ? `#${code}` : normalizeName(name);
    if (!zones.has(key)) zones.set(key, { name, code, level: e.pcd ? 'district' : e.cantonCode ? 'canton' : 'other', list: [] });
    zones.get(key).list.push({ ev: e, r });
  }
  return [...zones.values()].map((z) => ({
    name: z.name, code: z.code, level: z.level,
    ids: mean(z.list.map((x) => x.r.global.norm * 100)),
    dims: Object.fromEntries(model.dimensions.map((d) => [d.id, mean(z.list.map((x) => x.r.dimensions[d.id].norm * 100))])),
    list: z.list.sort((a, b) => String(a.ev.date).localeCompare(String(b.ev.date))),
  }));
}

function demoCsv() {
  const rnd = mulberry32(2026);
  const lines = ['zona;ids;idhc;ips;ids_mideplan'];
  const n = (x) => x.toFixed(2).replace('.', ',');
  for (let i = 1; i <= 36; i++) {
    const base = 30 + rnd() * 60;
    lines.push(`Zona simulada ${i};${n(base)};${n(0.45 + (base / 100) * 0.4 + (rnd() - 0.5) * 0.12)};${n(50 + (base / 100) * 35 + (rnd() - 0.5) * 14)};${n(20 + base * 0.7 + (rnd() - 0.5) * 30)}`);
  }
  return lines.join('\n');
}

async function runValidation() {
  const opts = { scale: valState.scale, tol: valState.tol, threshold: 0.8, runs: 5000, seed: 1 };
  if (valState.source === 'mideplan') {
    const zones = ownZones();
    const text = (u) => fetch(u).then((r) => r.text());
    const [d, c] = await Promise.all([text('data/external/mideplan-ids-2023-distritos.csv'), text('data/external/mideplan-ids-2023-cantones.csv')]);
    const build = (level, map) => zones.filter((z) => z.level === level && map.has(String(z.code))).map((z) => {
      const m = map.get(String(z.code));
      return { name: z.name, ids: z.ids, dims: z.dims, ext: { ids_mideplan: m.ids }, extDims: m.dims };
    });
    const sections = [['levelDistrict', build('district', loadMideplan(d))], ['levelCanton', build('canton', loadMideplan(c))]]
      .filter(([, rows]) => rows.length)
      .map(([title, rows]) => ({ title, n: rows.length, result: rows.length >= 3 ? compareIndices(rows, opts) : null,
        matrix: rows.length >= 3 ? dimensionMatrix(rows, ['salud', 'participacion', 'seguridad', 'educacion', 'economico']) : null }));
    valState.sections = sections;
    valState.info = { n: sections.reduce((a, s) => a + s.n, 0), unmatched: [], indices: ['ids_mideplan'] };
    valState.result = null;
  } else {
    const parsed = parseCsv(valState.text);
    const built = buildRows(parsed, ownZones());
    const rows = built.rows.filter((r) => Number.isFinite(r.ids));
    valState.info = { unmatched: built.unmatched, n: rows.length, indices: built.indices };
    valState.result = rows.length >= 3 && built.indices.length ? compareIndices(rows, opts) : null;
    valState.sections = null;
  }
  viewValidate();
}

function metricRow(label, value) { return h('tr', {}, h('td', {}, label), h('td', {}, value)); }

function indexCard(key, r) {
  const L = UI[state.lang];
  if (!r.spearman) return h('div', { class: 'card' }, h('h3', {}, key), h('p', { class: 'muted' }, L.noZones));
  const lab = corrLabel(r.spearman.rho);
  const rows = [
    metricRow(t('mSpearman'), `${f2(r.spearman.rho)} (${L.corrLabels[lab]}) · IC 95 % ${ciText(r.spearman.ci)} · bootstrap ${ciText(r.spearman.bootstrapCI)} · ${pEq(r.spearman.p)} · ${t('mPerm')} ${pEq(r.spearman.permutationP).replace(/^p /, '')}`),
    metricRow(t('mKendall'), `${f2(r.kendall?.tau)} · ${pEq(r.kendall?.p)}`),
    metricRow(t('mPearson'), `${f2(r.pearson.r)} · ${pEq(r.pearson.p)}`),
    metricRow(t('mCcc'), f2(r.ccc)),
    metricRow(t('mBA'), `${f2(r.blandAltman.bias, 1)} [${f2(r.blandAltman.lower, 1)}; ${f2(r.blandAltman.upper, 1)}]`),
    metricRow(t('mClose'), `${pc0(r.closeness.share)} ${t('withinTol')} (±${r.closeness.tol}) → ${r.closeness.pass ? t('passes') : t('fails')} (${(r.closeness.threshold * 100).toFixed(0)} %)`),
    metricRow(t('mError'), `${f2(r.errors.mae, 1)} / ${f2(r.errors.rmse, 1)}`),
    metricRow(t('mKappaQ'), `${f2(r.quintiles.weightedKappa)} (${t('mSame')}: ${pc0(r.quintiles.exact)} / ${pc0(r.quintiles.withinOne)})`),
    r.knownGroups ? metricRow(t('mKnown'), `n = ${r.knownGroups.nTop} vs ${r.knownGroups.nBottom} · ${pEq(r.knownGroups.p)} · P = ${pc0(r.knownGroups.probSuperiority)}`) : null,
  ];
  if (r.dimensions) for (const [d, v] of Object.entries(r.dimensions)) rows.push(metricRow(`${t('mDims')}: ${tx(`dim.${d}`)}`, `${f2(v.rho)} · ${pEq(v.p)}`));
  return h('div', { class: 'card' }, h('h3', {}, `${key} · n = ${r.n} ${t('zonesUsed')}`),
    r.warnings.length ? h('p', { class: 'neg' }, `⚠ ${t('smallN')}`) : null, h('table', {}, h('tbody', {}, rows)));
}

function reliabilityBlock() {
  const L = UI[state.lang];
  const zones = ownZones().filter((z) => z.list.length >= 2);
  if (zones.length < 3) return h('p', { class: 'muted' }, t('reliabilityHint'));
  const k = Math.min(...zones.map((z) => z.list.length));
  const matrix = zones.map((z) => z.list.slice(0, k).map((x) => x.r.global.norm * 100));
  const a = icc(matrix); const al = k >= 3 ? itemAnalysis(matrix) : null;
  const rows = [
    metricRow('ICC(2,1)', `${f2(a.icc21)} (${L.iccLabels[iccLabel(a.icc21)]})`),
    metricRow(`ICC(2,${k})`, `${f2(a.icc2k)} (${L.iccLabels[iccLabel(a.icc2k)]})`),
    metricRow('ICC(3,1)', f2(a.icc31)),
    k >= 3 && al && al.alpha !== null ? metricRow(t('cronbach'), `${f2(al.alpha)} (${L.alphaLabels[alphaLabel(al.alpha)]})`) : null,
  ];
  return h('div', {}, h('p', { class: 'muted' }, `${zones.length} ${t('zonesUsed')} × ${k}`), h('table', {}, h('tbody', {}, rows)));
}

function internalBlock() {
  const L = UI[state.lang];
  const evs = state.evals.map((e) => compute(model, e.answers)).filter((r) => r.complete);
  if (evs.length < 3) return h('p', { class: 'muted' }, t('internalHint'));
  const inds = allIndicators();
  const matrix = evs.map((r) => inds.map((i) => r.indicators[i.id].norm));
  const ia = itemAnalysis(matrix);
  if (!ia || ia.alpha === null) return h('p', { class: 'muted' }, t('internalHint'));
  const sh = splitHalf(matrix);
  const weak = ia.items.filter((x) => x.itemTotal !== null).sort((a, b) => a.itemTotal - b.itemTotal).slice(0, 5);
  return h('div', {}, evs.length < 30 ? h('p', { class: 'neg' }, `⚠ ${t('internalHint')}`) : null,
    h('table', {}, h('tbody', {},
      metricRow(`${t('cronbach')} (${evs.length} ${t('evaluationsUsed')})`, `${f2(ia.alpha)} (${L.alphaLabels[alphaLabel(ia.alpha)]})`),
      sh ? metricRow(t('splitHalf'), f2(sh.spearmanBrown)) : null)),
    h('h3', {}, t('weakItems')),
    h('ul', {}, weak.map((x) => h('li', {}, `${tx(`ind.${inds[x.index].id}`)} — r = ${f2(x.itemTotal)} · ${t('cronbach')} −ítem: ${f2(x.alphaIfDeleted)}`))));
}

function matrixTable(matrix) {
  const keys = ['salud', 'participacion', 'seguridad', 'educacion', 'economico'];
  const label = { salud: 'dSalud', participacion: 'dParticipacion', seguridad: 'dSeguridad', educacion: 'dEducacion', economico: 'dEconomico' };
  const head = h('tr', {}, h('th', {}, ''), keys.map((k) => h('th', {}, t(label[k]))));
  const rows = Object.entries(matrix).map(([d, v]) => h('tr', {}, h('td', {}, tx(`dim.${d}`)),
    keys.map((k) => h('td', { class: v[k].rho !== null && Math.abs(v[k].rho) >= 0.5 ? 'hit' : '' }, v[k].rho === null ? '–' : f2(v[k].rho)))));
  return h('div', {}, h('h3', {}, t('matrixTitle')), h('table', {}, h('thead', {}, head), h('tbody', {}, rows)), h('small', { class: 'muted' }, t('matrixNote')));
}

function viewValidate() {
  const textarea = h('textarea', { rows: 8, placeholder: UI[state.lang].csvPlaceholder.replace(/\\n/g, '\n'), oninput: (e) => { valState.text = e.target.value; valState.demo = false; } });
  textarea.value = valState.text;
  const scaleSel = h('select', { onchange: (e) => { valState.scale = e.target.value; } },
    h('option', { value: 'percentile', selected: valState.scale === 'percentile' }, t('scalePercentile')),
    h('option', { value: 'minmax', selected: valState.scale === 'minmax' }, t('scaleMinmax')));
  const info = valState.info;
  const result = valState.result;
  const content = [
    h('p', { class: 'lead' }, t('validateIntro')),
    h('label', {}, t('sourceLabel'), h('select', { onchange: (e) => { valState.source = e.target.value; valState.result = null; valState.sections = null; valState.info = null; viewValidate(); } },
      h('option', { value: 'mideplan', selected: valState.source === 'mideplan' }, t('sourceMideplan')),
      h('option', { value: 'csv', selected: valState.source === 'csv' }, t('sourceCsv')))),
    valState.source === 'mideplan' ? h('p', { class: 'muted' }, t('mideplanHint')) : h('p', { class: 'muted' }, t('validateHow')),
    h('div', { class: 'card' },
      valState.source === 'csv' ? h('div', { class: 'row' },
        h('label', { class: 'btn' }, t('loadCsv'), h('input', { type: 'file', accept: '.csv,text/csv,text/plain', hidden: true, onchange: async (e) => {
          const file = e.target.files[0];
          if (file && file.size < 2e6) { valState.text = await file.text(); valState.demo = false; viewValidate(); }
        } })),
        h('button', { class: 'btn', type: 'button', onclick: () => { valState.text = demoCsv(); valState.demo = true; viewValidate(); } }, t('loadDemo')),
        h('button', { class: 'btn', type: 'button', onclick: () => {
          const zs = ownZones();
          download('plantilla-validacion.csv', ['zona;ids;indice_externo_1;indice_externo_2', ...zs.map((z) => `${z.name};${z.ids.toFixed(2).replace('.', ',')};;`)].join('\n'), 'text/csv');
        } }, t('downloadTemplate'))) : null,
      valState.demo ? h('p', { class: 'neg' }, `⚠ ${t('demoWarn')}`) : null,
      valState.source === 'csv' ? textarea : null,
      h('div', { class: 'two' },
        h('label', {}, t('scaleLabel'), scaleSel),
        h('label', {}, t('tolLabel'), h('input', { type: 'number', min: 1, max: 50, value: valState.tol, oninput: (e) => { valState.tol = Math.max(1, Math.min(50, Number(e.target.value) || 10)); } }))),
      h('div', { class: 'row' }, h('button', { class: 'btn primary', type: 'button', onclick: runValidation }, t('runValidate')))),
  ];
  if (valState.sections) {
    if (!valState.sections.length) content.push(h('p', { class: 'neg' }, t('noMideplan')));
    for (const sec of valState.sections) {
      content.push(h('h2', {}, `${t(sec.title)} · ${sec.n} ${t('zonesUsed')}`));
      if (!sec.result) { content.push(h('p', { class: 'muted' }, t('noZones'))); continue; }
      for (const [key, r] of Object.entries(sec.result.indices)) content.push(indexCard(key, r));
      if (sec.matrix) content.push(h('div', { class: 'card' }, matrixTable(sec.matrix)));
      content.push(h('div', { class: 'row' }, h('button', { class: 'btn', type: 'button', onclick: () => download(`validacion-mideplan-${sec.title}.md`, toMarkdown(sec.result, { scale: valState.scale, tol: valState.tol, threshold: 0.8, version: '1.4.0' }), 'text/markdown') }, t('downloadReport'))));
    }
    content.push(h('p', { class: 'muted' }, t('validateNote')));
  }
  if (info && !valState.sections) {
    content.push(h('p', { class: 'muted' }, `${info.n} ${t('zonesUsed')}${info.unmatched.length ? ` · ${t('unmatched')}: ${info.unmatched.slice(0, 8).join(', ')}${info.unmatched.length > 8 ? '…' : ''}` : ''}`));
    if (!result) content.push(h('p', { class: 'neg' }, t('noZones')));
  }
  if (result) {
    for (const [key, r] of Object.entries(result.indices)) content.push(indexCard(key, r));
    content.push(h('div', { class: 'row' }, h('button', { class: 'btn', type: 'button', onclick: () => download('validacion-ids.md', toMarkdown(result, { scale: valState.scale, tol: valState.tol, threshold: 0.8, version: '1.4.0' }), 'text/markdown') }, t('downloadReport'))));
    content.push(h('p', { class: 'muted' }, t('validateNote')));
  }
  content.push(h('h2', {}, t('reliabilityTitle')), reliabilityBlock(), h('h2', {}, t('internalTitle')), internalBlock());
  shell(t('validateTitle'), content, { back: '#/' });
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
const exportObj = (ev) => ({ format: 'ids-evaluation', version: 1, instrument: ev.instrument || '1.0', name: ev.name, evaluator: ev.evaluator, province: ev.province, canton: ev.canton, cantonCode: ev.cantonCode, district: ev.district, pcd: ev.pcd, role: ev.role, date: ev.date, created: ev.created, answers: ev.answers });
function toCsv(ev, r) {
  const q = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [['dimension', 'indicator_id', 'indicator', 'item_id', 'item', 'item_weight', 'answer'].join(',')];
  for (const d of model.dimensions) for (const i of d.indicators) for (const it of i.items) {
    lines.push([q(tx(`dim.${d.id}`)), i.id, q(tx(`ind.${i.id}`)), it.id, q(tx(`item.${it.id}`)), it.weight, ev.answers[it.id] ?? ''].join(','));
  }
  lines.push('', `zone,${q(ev.name)}`, `province,${q(ev.province || '')}`, `canton,${q(ev.canton || '')}`, `district,${q(ev.district || '')}`, `district_code,${ev.pcd || ''}`, `canton_code,${ev.cantonCode || ''}`, `date,${ev.date || ''}`, `role,${ev.role || ''}`, `instrument,${ev.instrument || '1.0'}`,
    `global_normalized,${r.global.norm}`, `global_original,${r.global.raw}`, `balanced_ids,${r.balance.balanced}`, `weakest_dimension,${r.balance.weakest}`, `consistency_violations,${validate(cIndex, ev.answers).length}`);
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
    const ev = { id: uid(), name: o.name.slice(0, 120), evaluator: s(o.evaluator), province: s(o.province), canton: s(o.canton), cantonCode: /^\d{3}$/.test(String(o.cantonCode)) ? Number(o.cantonCode) : '', district: s(o.district), pcd: /^\d{5}$/.test(String(o.pcd)) ? Number(o.pcd) : '',
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
  if (p[0] === 'validate') return viewValidate();
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
  let constraints;
  [model, texts.es, texts.en, geo, sdgMap, constraints] = await Promise.all([j('data/indicators.json'), j('data/i18n.es.json'), j('data/i18n.en.json'),
    j('data/cr-distritos.json'), j('data/sdg-map.json'), j('data/constraints.json')]);
  cIndex = buildIndex(constraints);
  window.addEventListener('hashchange', route);
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredInstall = e; route(); });
  route();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
}
boot().catch((e) => { $app.textContent = `Error: ${e.message}`; });
