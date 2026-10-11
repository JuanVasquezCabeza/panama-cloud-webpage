// Generates the blog in English (/en/blog/) and Spanish (/es/blog/): index, pillar page and six reason nodes.
// Structure and cross-links: content/blog/reasons.json. Bodies: content/blog/<lang>/<slug>.md.
// Every page must exist in both languages or the build fails. Independent of the CRM. Run via `node tools/build-all.mjs`.
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { root, esc, md, page, paths, otherLang, LANGS } from './lib.mjs';

const R = JSON.parse(readFileSync(join(root, 'content', 'blog', 'reasons.json'), 'utf8'));
const pillar = { n: 0, slug: R.pillar.slug, title: R.pillar.title, card: R.pillar.summary };
const nodes = R.reasons;
const byN = new Map([pillar, ...nodes].map((a) => [a.n, a]));

const STR = {
  en: {
    blog: 'Blog', guide: 'Guide', reasonOf: (n, t) => `Reason ${n} of ${t}`, reason: (n) => `Reason ${n}`,
    reasons: (t) => `The ${t} reasons`, relatedPillar: 'How they relate to each other',
    connects: 'How this connects with the other reasons', backToPillar: (t) => `← The ${t} reasons`,
    ctaH: 'Start with the audit',
    ctaP: 'We review how your admissions budget is split today and what data you have, and give you a recommendation and a plan to implement MMM.',
    ctaBtn: 'Learn about the budget and data audit',
    idxH: 'Measuring admissions better', idxP: 'Guides on Marketing Mix Modeling for schools, school groups and universities in Latin America.',
    idxTitle: 'Blog | Minos Solutions', idxDesc: 'Guides on Marketing Mix Modeling and admissions measurement for education institutions in Latin America.',
  },
  es: {
    blog: 'Blog', guide: 'Guía', reasonOf: (n, t) => `Razón ${n} de ${t}`, reason: (n) => `Razón ${n}`,
    reasons: (t) => `Las ${t} razones`, relatedPillar: 'Cómo se relacionan entre sí',
    connects: 'Cómo se conecta con las otras razones', backToPillar: (t) => `← Las ${t} razones`,
    ctaH: 'Empiece por la auditoría',
    ctaP: 'Revisamos cómo se reparte hoy su presupuesto de admisiones y qué datos tiene, y le entregamos una recomendación y un plan para implementar MMM.',
    ctaBtn: 'Conozca la auditoría de presupuesto y datos',
    idxH: 'Medir mejor las admisiones', idxP: 'Guías sobre Marketing Mix Modeling para colegios, grupos de colegios y universidades de América Latina.',
    idxTitle: 'Blog | Minos Solutions', idxDesc: 'Guías sobre Marketing Mix Modeling y medición de admisiones para instituciones educativas de América Latina.',
  },
};

const url = (a, lang) => `/${lang}/blog/${a.slug[lang]}/`;
const write = (path, html) => { mkdirSync(join(root, path.slice(1)), { recursive: true }); writeFileSync(join(root, path.slice(1), 'index.html'), html); };
const body = (a, lang) => {
  const f = join(root, 'content', 'blog', lang, `${a.slug[lang]}.md`);
  if (!existsSync(f)) throw new Error(`Missing article: ${f}`);
  return md(readFileSync(f, 'utf8'), { lang, widgetAttrs: (name) => (name === 'map' ? ` data-json='${mapJson(lang)}'` : '') });
};
const usesWidgets = (html) => html.includes('data-widget=');
// Data for the interactive "how the six reasons connect" map widget.
const mapJson = (lang) => JSON.stringify({
  reasons: nodes.map((n) => ({ n: n.n, title: n.title[lang], card: n.card[lang], url: `/${lang}/blog/${n.slug[lang]}/` })),
  links: R.links.map((l) => ({ from: l.from, to: l.to, text: l.text[lang] })),
}).replace(/'/g, '&#39;');

function connections(a, lang, s) {
  const rel = R.links.filter((l) => l.from === a.n || l.to === a.n)
    .map((l) => ({ other: byN.get(l.from === a.n ? l.to : l.from), text: l.text[lang] }));
  if (!rel.length) return '';
  return `
            <aside class="connect">
                <h2>${s.connects}</h2>
                <ul>${rel.map((r) => `<li><a href="${url(r.other, lang)}">${esc(r.other.title[lang])}</a><br>${esc(r.text)}</li>`).join('')}</ul>
            </aside>`;
}

const cta = (lang, s) => `
            <div class="cta-box">
                <h2>${s.ctaH}</h2>
                <p>${s.ctaP}</p>
                <a href="${paths.products(lang)}#mmm-audit" class="btn btn-primary">${s.ctaBtn}</a>
            </div>`;

for (const lang of LANGS) {
  const s = STR[lang];
  const alt = otherLang(lang);
  const total = nodes.length;
  const mk = (a, extra) => ({ lang, current: 'blog', path: url(a, lang), altPath: url(a, alt), title: `${a.title[lang]} | Minos Solutions`, description: a.card[lang], ...extra });

  // Pillar
  const cards = nodes.map((n) => `<a class="reason-card" href="${url(n, lang)}"><div class="pillar-num">${s.reason(n.n)}</div><h3>${esc(n.title[lang])}</h3><p>${esc(n.card[lang])}</p></a>`).join('\n                ');
  const map = R.links.map((l) => `<li><a href="${url(byN.get(l.from), lang)}">${esc(byN.get(l.from).title[lang])}</a> &rarr; <a href="${url(byN.get(l.to), lang)}">${esc(byN.get(l.to).title[lang])}</a><br>${esc(l.text[lang])}</li>`).join('');
  const pBody = body(pillar, lang);
  write(url(pillar, lang), page(mk(pillar, {
    scripts: usesWidgets(pBody) ? ['/assets/widgets.js'] : [],
    main: `
        <article class="post">
            <div class="crumbs"><a href="${paths.blog(lang)}">${s.blog}</a></div>
            <div class="badge">${s.guide}</div>
            <h1>${esc(pillar.title[lang])}</h1>
            <div class="post-body">${pBody}</div>
            <h2 style="font-size:1.6rem;font-weight:800;letter-spacing:-0.02em;margin:2.5rem 0 1.25rem;">${s.reasons(total)}</h2>
            <div class="grid-3" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1.25rem;">
                ${cards}
            </div>
            <aside class="connect">
                <h2>${s.relatedPillar}</h2>
                <ul>${map}</ul>
            </aside>${cta(lang, s)}
        </article>`,
  })));

  // Nodes
  for (const n of nodes) {
    const nBody = body(n, lang);
    write(url(n, lang), page(mk(n, {
      scripts: usesWidgets(nBody) ? ['/assets/widgets.js'] : [],
      main: `
        <article class="post">
            <div class="crumbs"><a href="${paths.blog(lang)}">${s.blog}</a> &rsaquo; <a href="${url(pillar, lang)}">${esc(pillar.title[lang])}</a></div>
            <div class="badge">${s.reasonOf(n.n, total)}</div>
            <h1>${esc(n.title[lang])}</h1>
            <div class="post-body">${nBody}</div>${connections(n, lang, s)}
            <p><a class="btn btn-secondary" href="${url(pillar, lang)}">${s.backToPillar(total)}</a></p>${cta(lang, s)}
        </article>`,
    })));
  }

  // Index
  write(paths.blog(lang), page({
    lang, current: 'blog', path: paths.blog(lang), altPath: paths.blog(alt), title: s.idxTitle, description: s.idxDesc,
    main: `
        <section class="page-hero">
            <div class="badge">${s.blog}</div>
            <h1>${s.idxH}</h1>
            <p>${s.idxP}</p>
        </section>
        <section style="padding-bottom:5rem;">
            <div class="grid-3" style="grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1.25rem;">${[pillar, ...nodes].map((a) => `
                <a class="reason-card" href="${url(a, lang)}"><div class="pillar-num">${a.n === 0 ? s.guide : s.reason(a.n)}</div><h3>${esc(a.title[lang])}</h3><p>${esc(a.card[lang])}</p></a>`).join('')}
            </div>
        </section>`,
  }));
}
console.log(`Blog built in ${LANGS.join(' + ')}: 1 pillar + ${nodes.length} nodes + index per language.`);
