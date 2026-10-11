// Checks the blog writing format: node tools/check-content.mjs
//  - every body paragraph opens with a bold statement (**...**) followed by 3-5 supporting sentences
//  - every article has 2-3 interactive widgets, and EN/ES use the same widgets in the same order
//  - cited links (https) are consistent between EN and ES versions of the same article
//  - every widget used exists in assets/widgets.js
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { root } from './lib.mjs';

const R = JSON.parse(readFileSync(join(root, 'content', 'blog', 'reasons.json'), 'utf8'));
const ctx = { window: {} }; vm.createContext(ctx);
vm.runInContext(readFileSync(join(root, 'assets', 'widgets.js'), 'utf8'), ctx);
const known = new Set(ctx.window.MinosViz.names);

const items = [{ n: 0, slug: R.pillar.slug }, ...R.reasons];
let problems = 0;
const bad = (m) => { problems++; console.log('PROBLEM', m); };
const sentences = (s) => s.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\b(EE\. UU\.|vs\.|e\.g\.|p\. ej\.|U\.S\.)/g, (m) => m.replace(/\./g, '')).split(/(?<=[.?!»”])\s+(?=[A-ZÁÉÍÓÚÑ¿¡“«$])/).filter((x) => x.trim());

for (const it of items) {
  const per = {};
  for (const lang of ['en', 'es']) {
    const f = join(root, 'content', 'blog', lang, `${it.slug[lang]}.md`);
    if (!existsSync(f)) { bad(`missing ${f}`); continue; }
    const paras = readFileSync(f, 'utf8').replace(/\r\n/g, '\n').trim().split(/\n{2,}/);
    const widgets = [], links = new Set();
    for (const p of paras) {
      for (const m of p.matchAll(/\]\((https?:[^)\s]+)\)/g)) links.add(m[1]);
      const w = p.match(/^\{\{widget:(\w+)\}\}$/);
      if (w) { widgets.push(w[1]); if (!known.has(w[1])) bad(`${it.slug[lang]}: unknown widget ${w[1]}`); continue; }
      if (/^#{2,3} /.test(p) || /^> /.test(p)) continue;
      if (!/^\*\*[^*]+\*\*/.test(p)) { bad(`${lang}/${it.slug[lang]}: paragraph does not open with a bold statement: "${p.slice(0, 50)}..."`); continue; }
      const rest = p.replace(/^\*\*[^*]+\*\*\s*/, '');
      const n = sentences(rest).length;
      if (n < 3 || n > 6) bad(`${lang}/${it.slug[lang]}: ${n} supporting sentences (want 3-5) in "${p.slice(0, 50)}..."`);
    }
    if (widgets.length < 2 || widgets.length > 3) bad(`${lang}/${it.slug[lang]}: ${widgets.length} widgets (want 2-3)`);
    per[lang] = { widgets, links };
  }
  if (per.en && per.es) {
    if (per.en.widgets.join() !== per.es.widgets.join()) bad(`${it.slug.en}: widgets differ between EN and ES`);
    const onlyEn = [...per.en.links].filter((l) => !per.es.links.has(l)), onlyEs = [...per.es.links].filter((l) => !per.en.links.has(l));
    if (onlyEn.length || onlyEs.length) bad(`${it.slug.en}: cited links differ between languages: ${[...onlyEn, ...onlyEs].join(' ')}`);
  }
}
console.log(`${items.length * 2} articles checked, ${problems} problems`);
process.exit(problems ? 1 : 0);
