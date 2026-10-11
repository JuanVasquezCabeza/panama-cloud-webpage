// Sanity checks for the generated site: node tools/check-site.mjs
// Every internal link resolves, the language switcher is reciprocal and points to the other language,
// English pages contain no Spanish copy, and the home script parses.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { root } from './lib.mjs';

const pages = [];
const walk = (d) => { for (const e of readdirSync(join(root, d), { withFileTypes: true })) {
  const p = `${d}/${e.name}`;
  if (e.isDirectory()) walk(p); else if (e.name === 'index.html') pages.push(p);
} };
walk('en'); walk('es');

let problems = 0, links = 0;
const bad = (msg) => { problems++; console.log('PROBLEM', msg); };
for (const f of pages) {
  const html = readFileSync(join(root, f), 'utf8');
  const lang = html.match(/<html lang="(\w+)"/)[1];
  for (const m of html.matchAll(/href="(\/[^"#]*)(#[^"]*)?"/g)) {
    links++;
    const t = m[1];
    if (t === '/') continue;
    if (!existsSync(join(root, t.endsWith('/') ? `${t}index.html` : t))) bad(`${f}: broken link ${t}`);
  }
  const sw = html.match(/<a href="([^"]+)" lang="(en|es)" hreflang/);
  if (!sw) { bad(`${f}: no language switcher`); continue; }
  if (sw[2] === lang) bad(`${f}: switcher points to the same language`);
  const target = join(root, sw[1], 'index.html');
  if (!existsSync(target)) { bad(`${f}: switcher target missing ${sw[1]}`); continue; }
  const self = `/${f.replace('index.html', '')}`;
  if (!readFileSync(target, 'utf8').includes(`<a href="${self}" lang=`)) bad(`${f}: switcher not reciprocal (${sw[1]})`);
  const visible = html.replace(/<style>[\s\S]*?<\/style>/g, '').replace(/<script>[\s\S]*?<\/script>/g, '').replace(/<[^>]*>/g, ' ');
  if (lang === 'en' && /[¿¡ñáéíóú]/.test(visible.replace(/Múnera/g, ''))) bad(`${f}: Spanish characters in an English page`);
  if (lang === 'es' && /\b(Request|Learn about|Read the guide)\b/.test(visible)) bad(`${f}: English UI text in a Spanish page`);
  if (html.includes("data-widget=") && !html.includes("/assets/widgets.js")) bad(`${f}: uses widgets but does not load /assets/widgets.js`);
  for (const s of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) { try { new Function(s[1]); } catch (e) { bad(`${f}: script error ${e.message}`); } }
}
console.log(`${pages.length} pages, ${links} internal links, ${problems} problems`);
process.exit(problems ? 1 : 0);
