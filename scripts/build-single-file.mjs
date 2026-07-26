/**
 * Assemble the single-file build into one self-contained HTML document.
 *
 * Reads the `dist-single` output, inlines the CSS and JS, and rewrites every
 * font reference as a base64 data URI so the document makes no network requests
 * at all. Emits body content only — no <html>/<head>/<body> wrapper — so it can
 * be dropped into a host that supplies its own document skeleton.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { readdir } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIST = path.join(ROOT, 'dist-single');
const OUT = process.argv[2] ?? path.join(ROOT, 'dist-single', 'aldeafit.html');

const files = await readdir(DIST);
const cssName = files.find((f) => f.endsWith('.css'));
const jsName = files.find((f) => f.endsWith('.js'));

if (!cssName || !jsName) {
  throw new Error(`Expected a .css and a .js in ${DIST}, found: ${files.join(', ')}`);
}

let css = await readFile(path.join(DIST, cssName), 'utf8');
const js = await readFile(path.join(DIST, jsName), 'utf8');

// Inline every font the stylesheet references.
const fontRefs = [...css.matchAll(/url\(["']?([^"')]+\.woff2)["']?\)/g)];
let inlined = 0;

for (const [match, href] of fontRefs) {
  const file = path.join(ROOT, 'public', 'fonts', path.basename(href));
  const data = await readFile(file);
  css = css.replace(match, `url("data:font/woff2;base64,${data.toString('base64')}")`);
  inlined += 1;
}

const html = `<title>AldeaFit — Calculadora 1RM, discos y progreso</title>
<meta name="description" content="Calculadora de fuerza offline: 1RM por consenso de 7 fórmulas, carga de discos en la barra, calentamiento y progreso. Sin cuentas y sin rastreo." />
<style>
${css}
</style>
<div id="root"></div>
<script>
${js}
</script>
`;

await mkdir(path.dirname(OUT), { recursive: true });
await writeFile(OUT, html, 'utf8');

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
console.log(`Inlined ${inlined} font files`);
console.log(`CSS ${kb(css.length)} · JS ${kb(js.length)} · total ${kb(html.length)}`);
console.log(`Wrote ${OUT}`);
