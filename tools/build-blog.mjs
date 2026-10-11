// Generates /blog/ (index, pillar page and reason nodes) from the Minos CRM `contentAsset` + `contentLink`
// records plus the article bodies in content/blog/<slug>.md.   Run: node tools/build-blog.mjs
//
// CRM = structure (title, summary, type, order, status, product, pillar, links between nodes).
// Markdown = the body text. A page is built when its .md exists and status is PUBLISHED or DRAFT.
//   PUBLISHED -> indexed, linked from other pages.   DRAFT -> built with noindex + banner, not linked ("Próximamente").
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { root, esc, crmList, md, page } from './lib.mjs';

const [assets, links, products] = await Promise.all([
  crmList('contentAssets'), crmList('contentLinks'), crmList('products'),
]);

const bodyFile = (a) => join(root, 'content', 'blog', `${a.slug}.md`);
const built = (a) => ['PUBLISHED', 'DRAFT'].includes(a.status) && existsSync(bodyFile(a));
const live = (a) => a.status === 'PUBLISHED' && existsSync(bodyFile(a));
const url = (a) => `/blog/${a.slug}/`;
const byId = new Map(assets.map((a) => [a.id, a]));
const pillar = assets.find((a) => a.contentType === 'PILLAR');
const nodes = assets.filter((a) => a.contentType === 'NODE').sort((a, b) => a.reasonOrder - b.reasonOrder);
const productOf = (a) => products.find((p) => p.id === a.productId);

const ref = (a) => (live(a) ? `<a href="${url(a)}">${esc(a.name)}</a>` : `${esc(a.name)} <span class="soon">próximamente</span>`);

function connections(a) {
  const rel = links.filter((l) => l.fromAssetId === a.id || l.toAssetId === a.id)
    .map((l) => ({ other: byId.get(l.fromAssetId === a.id ? l.toAssetId : l.fromAssetId), text: l.relationship }))
    .filter((r) => r.other);
  if (!rel.length) return '';
  return `
            <aside class="connect">
                <h2>Cómo se conecta con las otras razones</h2>
                <ul>${rel.map((r) => `<li>${ref(r.other)}<br>${esc(r.text)}</li>`).join('')}</ul>
            </aside>`;
}

function cta(a) {
  const p = productOf(a);
  const href = p ? `/products-and-solutions/#${esc((p.code || '').toLowerCase())}` : '/products-and-solutions/';
  return `
            <div class="cta-box">
                <h2>Empiece por la auditoría</h2>
                <p>Revisamos cómo se reparte hoy su presupuesto de admisiones y qué datos tiene, y le entregamos una recomendación y un plan para implementar MMM.</p>
                <a href="${href}" class="btn btn-primary">Conozca la auditoría de presupuesto y datos</a>
            </div>`;
}

const draftBanner = (a) => (a.status === 'DRAFT' ? '<div class="draft-banner">Borrador: esta página aún no está publicada ni enlazada desde el blog.</div>' : '');
const meta = (a) => ({ lang: 'es', current: 'blog', noindex: a.status === 'DRAFT', title: `${a.name} | Minos Solutions`, description: a.summary || '' });
const write = (rel, html) => { mkdirSync(join(root, rel), { recursive: true }); writeFileSync(join(root, rel, 'index.html'), html); };

// Start clean so retired/renamed pages do not linger.
rmSync(join(root, 'blog'), { recursive: true, force: true });
const out = [];

// ---- Pillar
if (pillar && built(pillar)) {
  const body = md(readFileSync(bodyFile(pillar), 'utf8'));
  const cards = nodes.map((n) => {
    const inner = `<div class="pillar-num">Razón ${n.reasonOrder}</div><h3>${esc(n.name)}</h3><p>${esc(n.summary)}</p>${live(n) ? '' : '<span class="soon">próximamente</span>'}`;
    return live(n) ? `<a class="reason-card" href="${url(n)}">${inner}</a>` : `<div class="reason-card">${inner}</div>`;
  }).join('\n                ');
  const map = links.map((l) => [byId.get(l.fromAssetId), byId.get(l.toAssetId), l.relationship]).filter(([f, t]) => f && t)
    .map(([f, t, text]) => `<li>${ref(f)} &rarr; ${ref(t)}<br>${esc(text)}</li>`).join('');
  write(`blog/${pillar.slug}`, page({
    ...meta(pillar),
    main: `
        <article class="post">
            <div class="crumbs"><a href="/blog/">Blog</a></div>
            ${draftBanner(pillar)}
            <div class="badge">Guía</div>
            <h1>${esc(pillar.name)}</h1>
            <div class="post-body">${body}</div>
            <h2 style="font-size:1.6rem;font-weight:800;letter-spacing:-0.02em;margin:2.5rem 0 1.25rem;">Las ${nodes.length} razones</h2>
            <div class="grid-3" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1.25rem;">
                ${cards}
            </div>
            <aside class="connect">
                <h2>Cómo se relacionan entre sí</h2>
                <ul>${map}</ul>
            </aside>${cta(pillar)}
        </article>`,
  }));
  out.push(url(pillar));
}

// ---- Nodes
for (const n of nodes.filter(built)) {
  const body = md(readFileSync(bodyFile(n), 'utf8'));
  const crumbs = `<a href="/blog/">Blog</a>${pillar && live(pillar) ? ` &rsaquo; <a href="${url(pillar)}">${esc(pillar.name)}</a>` : ''}`;
  write(`blog/${n.slug}`, page({
    ...meta(n),
    main: `
        <article class="post">
            <div class="crumbs">${crumbs}</div>
            ${draftBanner(n)}
            <div class="badge">Razón ${n.reasonOrder} de ${nodes.length}</div>
            <h1>${esc(n.name)}</h1>
            <div class="post-body">${body}</div>${connections(n)}
            ${pillar && live(pillar) ? `<p><a class="btn btn-secondary" href="${url(pillar)}">&larr; Las ${nodes.length} razones</a></p>` : ''}${cta(n)}
        </article>`,
  }));
  out.push(url(n));
}

// ---- Index (published pages only)
const published = [pillar, ...nodes].filter((a) => a && live(a));
write('blog', page({
  lang: 'es', current: 'blog', title: 'Blog | Minos Solutions',
  description: 'Guías sobre Marketing Mix Modeling y medición de admisiones para instituciones educativas de América Latina.',
  main: `
        <section class="page-hero" style="padding:3rem 0 2rem;max-width:820px;">
            <div class="badge">Blog</div>
            <h1 style="font-size:3rem;font-weight:800;line-height:1.15;letter-spacing:-0.03em;margin-bottom:1rem;">Medir mejor las admisiones</h1>
            <p style="color:var(--text-secondary);font-size:1.15rem;">Guías sobre Marketing Mix Modeling para colegios, grupos de colegios y universidades de América Latina.</p>
        </section>
        <section style="padding-bottom:5rem;">
            ${published.length ? `<div class="grid-3" style="grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1.25rem;">${published.map((a) => `
                <a class="reason-card" href="${url(a)}"><div class="pillar-num">${a.contentType === 'PILLAR' ? 'Guía' : `Razón ${a.reasonOrder}`}</div><h3>${esc(a.name)}</h3><p>${esc(a.summary)}</p></a>`).join('')}
            </div>` : '<p style="color:var(--text-secondary);">Muy pronto publicaremos las primeras guías.</p>'}
        </section>`,
}));

console.log(`Built ${out.length} article pages: ${out.join(', ') || '(none)'}; index lists ${published.length} published.`);
