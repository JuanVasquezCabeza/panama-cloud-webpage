// Generates products-and-solutions/index.html from the Minos CRM product catalog (Twenty, `product` object).
// Run locally, then commit the result:  node tools/build-products-page.mjs
// Auth and layout live in tools/lib.mjs. Read-only (GET only). The key never enters the page.
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { root, esc, crmList, page } from './lib.mjs';

// Internal placeholders and empty fields in the CRM are never published.
const pub = (s) => (s && !/^\s*TO DEFINE/i.test(s) ? s.trim() : '');
const bullets = (s) => pub(s).split(/;\s*/).map((x) => x.trim().replace(/\.$/, '')).filter(Boolean);

const SEGMENTS = {
  K12_GROUP: 'K-12 school groups', UNIVERSITY: 'Private universities', VOCATIONAL: 'Vocational & technical institutes',
  LANGUAGE: 'Language schools', EDTECH: 'Online & edtech',
};
const TYPES = {
  AUDIT: 'Audit', MMM_IMPLEMENTATION: 'Implementation', MMM_REFRESH: 'Ongoing', ADDON: 'Add-on',
  TRAINING: 'Training', PARTNER_PROGRAM: 'Partner program',
};

const all = (await crmList('products')).filter((p) => p.status !== 'RETIRED');

// Order by the upsell path (nextProductId), starting from products nobody points to; leftovers at the end.
const byId = new Map(all.map((p) => [p.id, p]));
const pointedTo = new Set(all.map((p) => p.nextProductId).filter(Boolean));
const ordered = [];
for (const start of all.filter((p) => !pointedTo.has(p.id))) {
  for (let p = start; p && !ordered.includes(p); p = byId.get(p.nextProductId)) ordered.push(p);
}
for (const p of all) if (!ordered.includes(p)) ordered.push(p);

const card = (p, i) => {
  const live = p.status === 'ACTIVE';
  const dl = bullets(p.deliverables);
  const data = pub(p.dataRequirements);
  const weeks = p.durationWeeks ? `<span class="tech-badge">${esc(p.durationWeeks)} weeks</span>` : '';
  return `
                <article class="pillar-card product-card${live ? '' : ' is-next'}" id="${esc((p.code || p.name).toLowerCase())}">
                    <div>
                        <div class="pillar-num">Step ${i + 1} · ${esc(TYPES[p.productType] || 'Service')} · ${live ? 'Available now' : 'After the audit'}</div>
                        <h3 class="pillar-title">${esc(p.name)}</h3>
                        ${pub(p.summary) ? `<p class="pillar-desc">${esc(pub(p.summary))}</p>` : ''}
                        ${pub(p.valueProposition) ? `<p class="pillar-desc"><strong>Why it matters.</strong> ${esc(pub(p.valueProposition))}</p>` : ''}
                        ${dl.length ? `<div class="mini-title">What you get</div><ul class="bullet-list">${dl.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
                        ${data ? `<div class="mini-title">What we need from you</div><p class="pillar-desc">${esc(data)}</p>` : ''}
                    </div>
                    <div class="badge-list" style="margin-top:0;">${weeks}</div>
                    ${live ? `<a href="/#audit" class="btn btn-primary" style="margin-top:1.5rem;">Request this audit</a>` : ''}
                </article>`;
};

const segs = [...new Set(ordered.flatMap((p) => p.targetSegments || []))].filter((s) => SEGMENTS[s]);

const css = `
        .page-hero { padding: 3rem 0 2rem; max-width: 820px; }
        .page-hero h1 { font-size: 3.1rem; font-weight: 800; line-height: 1.15; letter-spacing: -0.03em; margin-bottom: 1.25rem; }
        .page-hero p { color: var(--text-secondary); font-size: 1.15rem; margin-bottom: 2rem; }
        .mini-title { font-family: var(--font-mono); font-size: 0.75rem; text-transform: uppercase; color: var(--text-secondary); margin: 1.25rem 0 0.6rem; font-weight: 600; }
        .product-card.is-next { background: #fbfcfe; border-style: dashed; }
        .benefit { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 1.75rem; box-shadow: var(--shadow-sm); }
        .benefit h3 { font-size: 1.05rem; margin-bottom: 0.5rem; }
        .benefit p { color: var(--text-secondary); font-size: 0.92rem; }
        .cta-band { text-align: center; }
        .cta-band .btn-group { justify-content: center; }
        @media (max-width: 640px) { .page-hero h1 { font-size: 2.25rem; } }
`;

// "Why you need this": one card per reason. The blog pillar and nodes (tools/build-blog.mjs) go deeper on each.
const benefits = [
  ['Which channels bring students', 'The contribution and return of every channel to leads, applications and enrollments, including offline: TV, radio, outdoor, fairs and open days.'],
  ['Where more spend stops paying', 'Saturation curves per channel show where extra budget no longer buys extra enrollments.'],
  ['What to do with next year’s budget', 'Reallocation scenarios and an optimizer answer: if we move budget from X to Y, how many more students do we get?'],
  ['A forecast leadership can use', 'An enrollment forecast for a given budget ties marketing spend to the intake target.'],
  ['Privacy-safe by design', 'Works on aggregate data, with no user tracking, so cookie loss and platform-reported ROAS stop being a problem.'],
  ['Built around the admissions cycle', 'The model accounts for carry-over effects, seasonality and the timing of intakes, per campus or program.'],
];

const main = `
        <section class="page-hero">
            <div class="badge">Marketing Mix Modeling for education</div>
            <h1>Know which marketing channels actually bring you students.</h1>
            <p>We help schools, school groups and universities in Latin America measure what each admissions channel contributes to enrollment, and decide where the next peso of budget should go.</p>
            <div class="btn-group">
                <a href="/#audit" class="btn btn-primary">Request the Marketing Data Audit</a>
                <a href="#journey" class="btn btn-secondary">See how we work</a>
            </div>
        </section>

        <section class="section-padding" id="outcomes">
            <div class="section-header">
                <h2>What changes when you measure it</h2>
                <p>You spend across many channels and can’t tell which ones bring students. A marketing mix model answers that with your own data.</p>
            </div>
            <div class="grid-3">${benefits.map(([t, d]) => `
                <div class="benefit"><h3>${esc(t)}</h3><p>${esc(d)}</p></div>`).join('')}
            </div>
        </section>

        <section class="section-padding" id="journey">
            <div class="section-header">
                <h2>From first audit to a living model</h2>
                <p>Start with a short audit of your budget and data. It ends with a clear recommendation and an implementation plan, so you decide on the full model with evidence.</p>
            </div>
            <div class="grid-3">${ordered.map(card).join('\n')}
            </div>
        </section>
${segs.length ? `
        <section class="section-padding" id="who" style="padding-top:0;">
            <div class="section-header">
                <h2>Built for institutions that compete for enrollment</h2>
                <p>If tuition funds your institution and you pay for admissions marketing, this applies to you. No minimum data maturity: assessing it is part of the audit.</p>
            </div>
            <div class="badge-list" style="justify-content:center;">${segs.map((s) => `<span class="tech-badge" style="font-size:0.9rem;padding:0.5rem 1rem;">${esc(SEGMENTS[s])}</span>`).join('')}</div>
        </section>
` : ''}
        <section class="section-padding cta-band" id="start" style="border-top:1px solid var(--border-color);">
            <div class="section-header">
                <h2>Start with the audit</h2>
                <p>Tell us about your institution and how you invest in admissions. We’ll come back to you within one business day.</p>
            </div>
            <div class="btn-group"><a href="/#audit" class="btn btn-primary">Request the Marketing Data Audit</a></div>
        </section>
`;

mkdirSync(join(root, 'products-and-solutions'), { recursive: true });
writeFileSync(join(root, 'products-and-solutions', 'index.html'), page({
  lang: 'en', current: 'products', title: 'Products & Solutions | Minos Solutions',
  description: 'Marketing Mix Modeling for education institutions in Latin America: find out which channels bring students and how to allocate your admissions budget.',
  css, main,
}));
console.log(`Wrote products-and-solutions/index.html from ${ordered.length} CRM products: ${ordered.map((p) => `${p.code}(${p.status})`).join(' -> ')}`);
