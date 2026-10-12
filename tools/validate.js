// Validación por línea de comandos (reproducible, mismos cálculos que la pantalla «Validación»).
//
//   node tools/validate.js datos.csv [--scale=percentile|minmax] [--tol=10] [--runs=5000] [--out=informe.md]
//
// El CSV necesita una columna de zona, una columna «ids» y una columna por cada índice externo.
// Acepta coma, punto y coma o tabulación (con coma decimal si no es coma el delimitador).
import { readFileSync, writeFileSync } from 'node:fs';
import { parseCsv, buildRows, toMarkdown } from '../js/validation-io.js';
import { compareIndices } from '../js/validation.js';

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
const opt = (name, def) => (args.find((a) => a.startsWith(`--${name}=`)) || '').split('=')[1] ?? def;

if (!file) {
  console.error('Uso: node tools/validate.js datos.csv [--scale=percentile|minmax] [--tol=10] [--runs=5000] [--out=informe.md]');
  process.exit(1);
}

const scale = opt('scale', 'percentile');
const tol = Number(opt('tol', 10));
const runs = Number(opt('runs', 5000));
if (!['percentile', 'minmax'].includes(scale) || !(tol > 0) || !(runs >= 100)) {
  console.error('Opciones inválidas: --scale=percentile|minmax, --tol>0, --runs>=100');
  process.exit(1);
}

const built = buildRows(parseCsv(readFileSync(file, 'utf8')));
if (!built.hadIds) {
  console.error('El CSV necesita una columna «ids» con el IDS de cada zona.');
  process.exit(1);
}
const rows = built.rows.filter((r) => Number.isFinite(r.ids));
const result = compareIndices(rows, { scale, tol, threshold: 0.8, runs, seed: 1 });
const md = toMarkdown(result, { scale, tol, threshold: 0.8, version: '1.3.0' });
const out = opt('out', '');
if (out) { writeFileSync(out, md, 'utf8'); console.log(`Informe escrito en ${out}`); } else console.log(md);
