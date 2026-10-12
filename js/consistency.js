// Coherencia entre afirmaciones: contradicciones, dependencias y duplicados.
// Reglas en data/constraints.json. Tipos:
//   exclusive  — como máximo una afirmación del grupo puede ser «Sí».
//   exactlyOne — exactamente una (p. ej. el clima: húmedo, seco u otro).
//   implies    — if=Sí exige then=Sí (p. ej. «mantenimiento» exige que existan espacios verdes).
//   same       — la misma afirmación repetida en dos indicadores: misma respuesta.
// level: "hard" bloquea la respuesta; "soft" avisa y pide confirmación.

const isAns = (v) => v === 0 || v === 1;

export function buildIndex(constraints) {
  const rules = constraints.rules;
  const byItem = new Map();
  const add = (id, r) => { if (!byItem.has(id)) byItem.set(id, []); byItem.get(id).push(r); };
  for (const r of rules) {
    for (const id of r.type === 'implies' ? [r.if, r.then] : r.items) add(id, r);
  }
  return { rules, byItem };
}

/**
 * Conflictos que causaría fijar `answers[itemId] = value`.
 * @returns {{rule, blockers: string[]}[]} (vacío = sin conflicto)
 */
export function conflictsIf(index, answers, itemId, value) {
  const out = [];
  for (const r of index.byItem.get(itemId) || []) {
    let blockers = [];
    if (r.type === 'exclusive' || r.type === 'exactlyOne') {
      if (value === 1) blockers = r.items.filter((i) => i !== itemId && answers[i] === 1);
    } else if (r.type === 'implies') {
      if (itemId === r.if && value === 1 && answers[r.then] === 0) blockers = [r.then];
      if (itemId === r.then && value === 0 && answers[r.if] === 1) blockers = [r.if];
    }
    if (blockers.length) out.push({ rule: r, blockers });
  }
  return out;
}

/** Otras afirmaciones que deben copiar la respuesta (reglas `same`). */
export function sameAs(index, itemId) {
  return (index.byItem.get(itemId) || []).filter((r) => r.type === 'same').flatMap((r) => r.items.filter((i) => i !== itemId));
}

/**
 * ¿Está bloqueado «Sí» o «No» para esta afirmación? Solo cuenta lo `hard`.
 * @returns {{yes: object[], no: object[]}} conflictos duros que bloquean cada opción
 */
export function blocked(index, answers, itemId) {
  const hard = (v) => conflictsIf(index, answers, itemId, v).filter((c) => c.rule.level === 'hard');
  return { yes: hard(1), no: hard(0) };
}

/** Todas las violaciones del conjunto de respuestas (p. ej. tras importar un archivo). */
export function validate(index, answers) {
  const out = [];
  for (const r of index.rules) {
    if (r.type === 'exclusive' || r.type === 'exactlyOne') {
      const yes = r.items.filter((i) => answers[i] === 1);
      if (yes.length > 1) out.push({ rule: r, kind: 'conflict', items: yes });
      else if (r.type === 'exactlyOne' && yes.length === 0 && r.items.every((i) => isAns(answers[i]))) out.push({ rule: r, kind: 'none', items: r.items });
    } else if (r.type === 'implies') {
      if (answers[r.if] === 1 && answers[r.then] === 0) out.push({ rule: r, kind: 'conflict', items: [r.if, r.then] });
    } else if (r.type === 'same') {
      const v = r.items.map((i) => answers[i]);
      if (v.every(isAns) && new Set(v).size > 1) out.push({ rule: r, kind: 'conflict', items: r.items });
    }
  }
  return out;
}
