// Generates the Products & Solutions page in English (/en/products-and-solutions/) and Spanish
// (/es/productos-y-soluciones/). Products come from the Minos CRM (English, read-only); the Spanish copy for
// each product code lives in content/products.es.json. Run via `node tools/build-all.mjs`.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { root, esc, crmList, page, paths, otherLang, LANGS } from './lib.mjs';

// Internal placeholders and empty fields in the CRM are never published.
const pub = (s) => (s && !/^\s*TO DEFINE/i.test(s) ? s.trim() : '');
const bullets = (s) => pub(s).split(/;\s*/).map((x) => x.trim().replace(/\.$/, '')).filter(Boolean);

const es = JSON.parse(readFileSync(join(root, 'content', 'products.es.json'), 'utf8'));

const SEGMENTS = {
  en: { K12_GROUP: 'K-12 school groups', UNIVERSITY: 'Private universities', VOCATIONAL: 'Vocational & technical institutes', LANGUAGE: 'Language schools', EDTECH: 'Online & edtech' },
  es: { K12_GROUP: 'Grupos de colegios K-12', UNIVERSITY: 'Universidades privadas', VOCATIONAL: 'Institutos técnicos y vocacionales', LANGUAGE: 'Escuelas de idiomas', EDTECH: 'Educación en línea y edtech' },
};
const TYPES = {
  en: { AUDIT: 'Audit', MMM_IMPLEMENTATION: 'Implementation', MMM_REFRESH: 'Ongoing', ADDON: 'Add-on', TRAINING: 'Training', PARTNER_PROGRAM: 'Partner program' },
  es: { AUDIT: 'Auditoría', MMM_IMPLEMENTATION: 'Implementación', MMM_REFRESH: 'Continuo', ADDON: 'Complemento', TRAINING: 'Capacitación', PARTNER_PROGRAM: 'Programa de aliados' },
};

const STR = {
  en: {
    badge: 'Marketing Mix Modeling for education',
    h1: 'Know which marketing channels actually bring you students.',
    lead: 'We help schools, school groups and universities in Latin America measure what each admissions channel contributes to enrollment, and decide where the next peso of budget should go.',
    ctaAudit: 'Request the Marketing Data Audit', ctaHow: 'See how we work',
    whyH: 'Why you need this',
    whyP: 'You spend across many channels and can’t tell which ones bring students. A marketing mix model answers that with your own data. Each reason has its own guide.',
    whyAll: 'Read the full guide', read: 'Read the guide',
    journeyH: 'From first audit to a living model',
    journeyP: 'Start with a short audit of your budget and data. It ends with a clear recommendation and an implementation plan, so you decide on the full model with evidence.',
    step: 'Step', now: 'Available now', next: 'After the audit', why: 'Why it matters.', get: 'What you get', need: 'What we need from you', weeks: 'weeks', reqThis: 'Request this audit',
    whoH: 'Built for institutions that compete for enrollment',
    whoP: 'If tuition funds your institution and you pay for admissions marketing, this applies to you. No minimum data maturity: assessing it is part of the audit.',
    startH: 'Start with the audit', startP: 'Tell us about your institution and how you invest in admissions. We’ll come back to you within one business day.',
    title: 'Products & Solutions | Minos Solutions',
    desc: 'Marketing Mix Modeling for education institutions in Latin America: find out which channels bring students and how to allocate your admissions budget.',
  },
  es: {
    badge: 'Marketing Mix Modeling para educación',
    h1: 'Sepa qué canales de marketing realmente le traen estudiantes.',
    lead: 'Ayudamos a colegios, grupos de colegios y universidades de América Latina a medir qué aporta cada canal de admisiones a la matrícula, y a decidir a dónde debe ir el próximo peso del presupuesto.',
    ctaAudit: 'Solicitar la Auditoría de Datos de Marketing', ctaHow: 'Vea cómo trabajamos',
    whyH: 'Por qué lo necesita',
    whyP: 'Usted invierte en muchos canales y no puede saber cuáles le traen estudiantes. Un modelo de mezcla de marketing lo responde con sus propios datos. Cada razón tiene su propia guía.',
    whyAll: 'Lea la guía completa', read: 'Leer la guía',
    journeyH: 'De la primera auditoría a un modelo vivo',
    journeyP: 'Empiece con una auditoría corta de su presupuesto y sus datos. Termina con una recomendación clara y un plan de implementación, para que decida sobre el modelo completo con evidencia.',
    step: 'Paso', now: 'Disponible ahora', next: 'Después de la auditoría', why: 'Por qué importa.', get: 'Qué recibe', need: 'Qué necesitamos de usted', weeks: 'semanas', reqThis: 'Solicitar esta auditoría',
    whoH: 'Para instituciones que compiten por matrículas',
    whoP: 'Si las pensiones financian a su institución y usted invierte en mercadeo de admisiones, esto aplica para usted. No se exige un nivel mínimo de datos: evaluarlo es parte de la auditoría.',
    startH: 'Empiece por la auditoría', startP: 'Cuéntenos sobre su institución y cómo invierte en admisiones. Le respondemos en un día hábil.',
    title: 'Productos y soluciones | Minos Solutions',
    desc: 'Marketing Mix Modeling para instituciones educativas de América Latina: descubra qué canales traen estudiantes y cómo asignar su presupuesto de admisiones.',
  },
};

// "Why you need this": the six reasons, each linking to its blog node (see content/blog/<lang>/).
const REASONS = JSON.parse(readFileSync(join(root, 'content', 'blog', 'reasons.json'), 'utf8'));

const all = (await crmList('products')).filter((p) => p.status !== 'RETIRED');
const byId = new Map(all.map((p) => [p.id, p]));
const pointedTo = new Set(all.map((p) => p.nextProductId).filter(Boolean));
const ordered = [];
for (const start of all.filter((p) => !pointedTo.has(p.id))) {
  for (let p = start; p && !ordered.includes(p); p = byId.get(p.nextProductId)) ordered.push(p);
}
for (const p of all) if (!ordered.includes(p)) ordered.push(p);

// Localised view of a product. Spanish must exist for every published product, or the build fails.
function view(p, lang) {
  if (lang === 'en') return { name: p.name, summary: pub(p.summary), value: pub(p.valueProposition), deliverables: p.deliverables, data: pub(p.dataRequirements) };
  const t = es[p.code];
  if (!t) throw new Error(`No Spanish copy for product ${p.code} in content/products.es.json`);
  return { name: t.name, summary: t.summary, value: t.valueProposition, deliverables: t.deliverables, data: t.dataRequirements };
}

const css = `
        .mini-title { font-family: var(--font-mono); font-size: 0.75rem; text-transform: uppercase; color: var(--text-secondary); margin: 1.25rem 0 0.6rem; font-weight: 600; }
        .product-card.is-next { background: #fbfcfe; border-style: dashed; }
        .cta-band { text-align: center; }
        .cta-band .btn-group { justify-content: center; }
`;

for (const lang of LANGS) {
  const s = STR[lang];
  const card = (p, i) => {
    const v = view(p, lang);
    const live = p.status === 'ACTIVE';
    const dl = bullets(v.deliverables);
    const weeks = p.durationWeeks ? `<span class="tech-badge">${esc(p.durationWeeks)} ${s.weeks}</span>` : '';
    return `
                <article class="pillar-card product-card${live ? '' : ' is-next'}" id="${esc((p.code || p.name).toLowerCase())}">
                    <div>
                        <div class="pillar-num">${s.step} ${i + 1} · ${esc(TYPES[lang][p.productType] || '')} · ${live ? s.now : s.next}</div>
                        <h3 class="pillar-title">${esc(v.name)}</h3>
                        ${v.summary ? `<p class="pillar-desc">${esc(v.summary)}</p>` : ''}
                        ${v.value ? `<p class="pillar-desc"><strong>${s.why}</strong> ${esc(v.value)}</p>` : ''}
                        ${dl.length ? `<div class="mini-title">${s.get}</div><ul class="bullet-list">${dl.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
                        ${v.data ? `<div class="mini-title">${s.need}</div><p class="pillar-desc">${esc(v.data)}</p>` : ''}
                    </div>
                    <div class="badge-list" style="margin-top:0;">${weeks}</div>
                    ${live ? `<a href="${paths.home(lang)}#audit" class="btn btn-primary" style="margin-top:1.5rem;">${s.reqThis}</a>` : ''}
                </article>`;
  };
  const segs = [...new Set(ordered.flatMap((p) => p.targetSegments || []))].filter((k) => SEGMENTS[lang][k]);
  const pillarUrl = `/${lang}/blog/${REASONS.pillar.slug[lang]}/`;
  const main = `
        <section class="page-hero">
            <div class="badge">${s.badge}</div>
            <h1>${s.h1}</h1>
            <p>${s.lead}</p>
            <div class="btn-group">
                <a href="${paths.home(lang)}#audit" class="btn btn-primary">${s.ctaAudit}</a>
                <a href="#journey" class="btn btn-secondary">${s.ctaHow}</a>
            </div>
        </section>

        <section class="section-padding" id="outcomes">
            <div class="section-header">
                <h2>${s.whyH}</h2>
                <p>${s.whyP}</p>
            </div>
            <div class="grid-3">${REASONS.reasons.map((r) => `
                <a class="reason-card" href="/${lang}/blog/${r.slug[lang]}/"><div class="pillar-num">${r.n}</div><h3>${esc(r.title[lang])}</h3><p>${esc(r.card[lang])}</p><span style="color:var(--accent-indigo);font-weight:600;font-size:0.85rem;">${s.read} &rarr;</span></a>`).join('')}
            </div>
            <div style="text-align:center;margin-top:2rem;"><a href="${pillarUrl}" class="btn btn-secondary">${s.whyAll}</a></div>
        </section>

        <section class="section-padding" id="journey">
            <div class="section-header">
                <h2>${s.journeyH}</h2>
                <p>${s.journeyP}</p>
            </div>
            <div class="grid-3">${ordered.map(card).join('\n')}
            </div>
        </section>
${segs.length ? `
        <section class="section-padding" id="who" style="padding-top:0;">
            <div class="section-header">
                <h2>${s.whoH}</h2>
                <p>${s.whoP}</p>
            </div>
            <div class="badge-list" style="justify-content:center;">${segs.map((k) => `<span class="tech-badge" style="font-size:0.9rem;padding:0.5rem 1rem;">${esc(SEGMENTS[lang][k])}</span>`).join('')}</div>
        </section>
` : ''}
        <section class="section-padding cta-band" id="start" style="border-top:1px solid var(--border-color);">
            <div class="section-header">
                <h2>${s.startH}</h2>
                <p>${s.startP}</p>
            </div>
            <div class="btn-group"><a href="${paths.home(lang)}#audit" class="btn btn-primary">${s.ctaAudit}</a></div>
        </section>
`;
  const path = paths.products(lang);
  mkdirSync(join(root, path.slice(1)), { recursive: true });
  writeFileSync(join(root, path.slice(1), 'index.html'), page({
    lang, path, altPath: paths.products(otherLang(lang)), current: 'products', title: s.title, description: s.desc, css, main,
  }));
}
console.log(`Products page (en + es) from ${ordered.length} CRM products: ${ordered.map((p) => `${p.code}(${p.status})`).join(' -> ')}`);
