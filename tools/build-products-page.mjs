// Generates products-and-solutions/index.html from the Minos CRM product catalog (Twenty, `product` object).
// Run locally, then commit the result:  node tools/build-products-page.mjs
// Auth: TWENTY_API_KEY env var, or ../minos-crm/.env. Read-only (GET only). The key never enters the page.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const CRM = process.env.TWENTY_URL || 'https://crm.minos.solutions';

function apiKey() {
  if (process.env.TWENTY_API_KEY) return process.env.TWENTY_API_KEY;
  const env = readFileSync(join(root, '..', 'minos-crm', '.env'), 'utf8');
  return env.match(/^TWENTY_API_KEY=(.*)$/m)[1].replace(/["\r\s]/g, '');
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
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

const res = await fetch(`${CRM}/rest/products?limit=60`, { headers: { Authorization: `Bearer ${apiKey()}` } });
if (!res.ok) throw new Error(`CRM ${res.status}: ${await res.text()}`);
const all = (await res.json()).data.products.filter((p) => !p.deletedAt && p.status !== 'RETIRED');

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

const src = readFileSync(join(root, 'index.html'), 'utf8');
const style = src.match(/<style>([\s\S]*?)<\/style>/)[1]; // reuse the site's design system as-is

const extraCss = `
        .header-nav { display: flex; gap: 1.5rem; align-items: center; }
        .header-nav a.nav-link { color: var(--text-secondary); text-decoration: none; font-weight: 600; font-size: 0.9rem; }
        .header-nav a.nav-link:hover, .header-nav a.nav-link[aria-current] { color: var(--accent-indigo); }
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
        @media (max-width: 640px) { .page-hero h1 { font-size: 2.25rem; } .header-nav .nav-link { display: none; } }
`;

const benefits = [
  ['Which channels bring students', 'The contribution and return of every channel to leads, applications and enrollments, including offline: TV, radio, outdoor, fairs and open days.'],
  ['Where more spend stops paying', 'Saturation curves per channel show where extra budget no longer buys extra enrollments.'],
  ['What to do with next year’s budget', 'Reallocation scenarios and an optimizer answer: if we move budget from X to Y, how many more students do we get?'],
  ['A forecast leadership can use', 'An enrollment forecast for a given budget ties marketing spend to the intake target.'],
  ['Privacy-safe by design', 'Works on aggregate data, with no user tracking, so cookie loss and platform-reported ROAS stop being a problem.'],
  ['Built around the admissions cycle', 'The model accounts for carry-over effects, seasonality and the timing of intakes, per campus or program.'],
];

const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Products & Solutions | Minos Solutions</title>
    <meta name="description" content="Marketing Mix Modeling for education institutions in Latin America: find out which channels bring students and how to allocate your admissions budget.">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    <!-- GENERATED by tools/build-products-page.mjs from the Minos CRM product catalog. Do not edit by hand. -->
    <style>${style}${extraCss}</style>
</head>
<body>
    <div class="glow-wrapper"><div class="ambient-glow"></div><div class="ambient-glow-2"></div></div>
    <div class="container">
        <header>
            <a href="/" class="logo"><span class="logo-mark"></span>minos.solutions</a>
            <div class="header-nav">
                <a href="/" class="nav-link">Home</a>
                <a href="/products-and-solutions/" class="nav-link" aria-current="page">Products &amp; Solutions</a>
                <a href="/#audit" class="btn btn-secondary" style="padding: 0.55rem 1.2rem; font-size: 0.85rem; border-radius: 8px; font-weight:700;">Request Audit</a>
            </div>
        </header>

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

        <footer>
            <div class="container">
                <div class="footer-grid">
                    <div style="text-align: left;">
                        <a href="/" class="logo"><span class="logo-mark"></span>minos.solutions</a>
                        <div class="footer-tagline">Marketing Mix Modeling for education institutions in Latin America.</div>
                    </div>
                    <div style="text-align: right; font-family: var(--font-mono); font-size: 0.8rem; color: var(--accent-indigo); font-weight:600;">minos.solutions</div>
                </div>
                <div>&copy; 2026 Minos Consulting. All rights reserved.</div>
            </div>
        </footer>
    </div>
</body>
</html>
`;

mkdirSync(join(root, 'products-and-solutions'), { recursive: true });
writeFileSync(join(root, 'products-and-solutions', 'index.html'), html);
console.log(`Wrote products-and-solutions/index.html from ${ordered.length} CRM products: ${ordered.map((p) => `${p.code}(${p.status})`).join(' -> ')}`);
