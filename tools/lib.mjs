// Shared helpers for the generators in tools/: read-only CRM access (products), HTML escaping, a tiny Markdown
// converter with front matter, and the common bilingual page layout (header with language switcher, footer,
// hreflang/canonical tags). The design system is tools/site.css.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const SITE = 'https://minos.solutions';
const CRM = process.env.TWENTY_URL || 'https://crm.minos.solutions';

export const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function apiKey() {
  if (process.env.TWENTY_API_KEY) return process.env.TWENTY_API_KEY;
  const env = readFileSync(join(root, '..', 'minos-crm', '.env'), 'utf8');
  return env.match(/^TWENTY_API_KEY=(.*)$/m)[1].replace(/["\r\s]/g, '');
}

// GET only. The CRM is never written to by the website tooling; the key never enters generated pages.
export async function crmList(object, key = object) {
  const res = await fetch(`${CRM}/rest/${object}?limit=200`, { headers: { Authorization: `Bearer ${apiKey()}` } });
  if (!res.ok) throw new Error(`CRM ${object} ${res.status}: ${await res.text()}`);
  return (await res.json()).data[key].filter((r) => !r.deletedAt);
}

// Minimal Markdown: ##/### headings, paragraphs, - and 1. lists, > quotes, **bold**, *italic*, [text](url).
export function md(src) {
  const inline = (s) => esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*(?!\s)(.+?)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
  return src.replace(/\r\n/g, '\n').trim().split(/\n{2,}/).map((b) => {
    const lines = b.split('\n');
    if (/^### /.test(b)) return `<h3>${inline(b.slice(4))}</h3>`;
    if (/^## /.test(b)) return `<h2>${inline(b.slice(3))}</h2>`;
    if (lines.every((l) => /^- /.test(l))) return `<ul>${lines.map((l) => `<li>${inline(l.slice(2))}</li>`).join('')}</ul>`;
    if (lines.every((l) => /^\d+\. /.test(l))) return `<ol>${lines.map((l) => `<li>${inline(l.replace(/^\d+\. /, ''))}</li>`).join('')}</ol>`;
    if (lines.every((l) => /^> ?/.test(l))) return `<blockquote>${lines.map((l) => inline(l.replace(/^> ?/, ''))).join(' ')}</blockquote>`;
    return `<p>${lines.map(inline).join(' ')}</p>`;
  }).join('\n');
}

// "---\nkey: value\n---\nbody" -> { meta, body }
export function frontMatter(text) {
  const m = text.replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error('missing front matter');
  const meta = {};
  for (const line of m[1].split('\n')) { const i = line.indexOf(':'); if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim(); }
  return { meta, body: m[2] };
}

export const LANGS = ['en', 'es'];
export const paths = {
  home: (l) => `/${l}/`,
  products: (l) => (l === 'en' ? '/en/products-and-solutions/' : '/es/productos-y-soluciones/'),
  blog: (l) => `/${l}/blog/`,
};
export const otherLang = (l) => (l === 'en' ? 'es' : 'en');

const LABELS = {
  en: { home: 'Home', products: 'Products & Solutions', blog: 'Blog', audit: 'Request Audit', rights: 'All rights reserved.',
    tagline: 'Marketing Mix Modeling for education institutions in Latin America.', switchTo: 'Switch to English', langName: 'English' },
  es: { home: 'Inicio', products: 'Productos y soluciones', blog: 'Blog', audit: 'Solicitar auditoría', rights: 'Todos los derechos reservados.',
    tagline: 'Marketing Mix Modeling para instituciones educativas de América Latina.', switchTo: 'Cambiar a español', langName: 'Español' },
};

const siteCss = readFileSync(join(root, 'tools', 'site.css'), 'utf8');

// Every generated page registers itself so build-all can write sitemap.xml with hreflang alternates.
export const registry = [];

// Full HTML document. `path` is this page's URL, `altPath` the equivalent page in the other language.
export function page({ lang, path, altPath, title, description, noindex = false, current = '', css = '', main, script = '' }) {
  const L = LABELS[lang];
  const alt = otherLang(lang);
  const enPath = lang === 'en' ? path : altPath;
  const esPath = lang === 'es' ? path : altPath;
  registry.push({ path, enPath, esPath, noindex });
  const nav = (href, label, key) => `<a href="${href}" class="nav-link"${current === key ? ' aria-current="page"' : ''}>${label}</a>`;
  const globe = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';
  const switcher = `<div class="lang-switch" role="group" aria-label="Language / Idioma">${globe}
                    ${[['en', '/en'], ['es', '/es']].map(([code]) => (code === lang
    ? `<span class="lang-current" lang="${code}" aria-current="true" title="${LABELS[code].langName}">${code.toUpperCase()}</span>`
    : `<a href="${altPath}" lang="${code}" hreflang="${code}" data-lang="${code}" title="${LABELS[code].langName}" aria-label="${LABELS[code].switchTo}">${code.toUpperCase()}</a>`)).join('<span class="lang-sep" aria-hidden="true">/</span>')}
                </div>`;
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}">${noindex ? '\n    <meta name="robots" content="noindex">' : ''}
    <link rel="canonical" href="${SITE}${path}">
    <link rel="alternate" hreflang="en" href="${SITE}${enPath}">
    <link rel="alternate" hreflang="es" href="${SITE}${esPath}">
    <link rel="alternate" hreflang="x-default" href="${SITE}/">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    <!-- GENERATED by tools/. Do not edit by hand. -->
    <style>${siteCss}${baseCss}${css}</style>
</head>
<body>
    <div class="glow-wrapper"><div class="ambient-glow"></div><div class="ambient-glow-2"></div></div>
    <div class="container">
        <header>
            <a href="${paths.home(lang)}" class="logo"><span class="logo-mark"></span>minos.solutions</a>
            <div class="header-nav">
                ${nav(paths.home(lang), L.home, 'home')}
                ${nav(paths.products(lang), L.products, 'products')}
                ${nav(paths.blog(lang), L.blog, 'blog')}
                ${switcher}
                <a href="${paths.home(lang)}#audit" class="btn btn-secondary" style="padding: 0.55rem 1.2rem; font-size: 0.85rem; border-radius: 8px; font-weight:700;">${L.audit}</a>
            </div>
        </header>
${main}
        <footer>
            <div class="container">
                <div class="footer-grid">
                    <div style="text-align: left;">
                        <a href="${paths.home(lang)}" class="logo"><span class="logo-mark"></span>minos.solutions</a>
                        <div class="footer-tagline">${L.tagline}</div>
                    </div>
                    <div style="text-align: right; font-family: var(--font-mono); font-size: 0.8rem; color: var(--accent-indigo); font-weight:600;">minos.solutions</div>
                </div>
                <div>&copy; 2026 Minos Consulting. ${L.rights}</div>
            </div>
        </footer>
    </div>
    <script>
        // Remember the visitor's explicit language choice (used by nginx for the root "/" redirect).
        document.querySelectorAll('[data-lang]').forEach(function (a) {
            a.addEventListener('click', function () { document.cookie = 'lang=' + a.dataset.lang + ';path=/;max-age=31536000;SameSite=Lax'; });
        });
    </script>${script ? `\n    <script>\n${script}\n    </script>` : ''}
</body>
</html>
`;
}

// Header/body CSS used by all generated pages, appended after site.css.
export const baseCss = `
        .header-nav { display: flex; gap: 1.5rem; align-items: center; }
        .header-nav a.nav-link { color: var(--text-secondary); text-decoration: none; font-weight: 600; font-size: 0.9rem; }
        .header-nav a.nav-link:hover, .header-nav a.nav-link[aria-current] { color: var(--accent-indigo); }
        .lang-switch { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; font-weight: 700; font-family: var(--font-mono); color: var(--text-secondary); border: 1px solid var(--border-color); border-radius: 999px; padding: 0.3rem 0.7rem; background: #fff; }
        .lang-switch a { color: var(--text-secondary); text-decoration: none; }
        .lang-switch a:hover, .lang-switch a:focus-visible { color: var(--accent-indigo); }
        .lang-switch .lang-current { color: var(--text-primary); }
        .lang-sep { opacity: 0.4; }
        @media (max-width: 760px) { .header-nav .nav-link { display: none; } .header-nav { gap: 0.75rem; } }
        .post { max-width: 760px; margin: 0 auto; padding: 1rem 0 4rem; }
        .post h1 { font-size: 2.6rem; font-weight: 800; line-height: 1.2; letter-spacing: -0.03em; margin: 0.5rem 0 1.5rem; }
        .post-body h2 { font-size: 1.6rem; font-weight: 800; letter-spacing: -0.02em; margin: 2.5rem 0 0.75rem; }
        .post-body h3 { font-size: 1.15rem; font-weight: 700; margin: 1.75rem 0 0.5rem; }
        .post-body p, .post-body li { color: #334155; font-size: 1.05rem; line-height: 1.75; }
        .post-body p { margin-bottom: 1.1rem; }
        .post-body ul, .post-body ol { margin: 0 0 1.25rem 1.4rem; }
        .post-body li { margin-bottom: 0.4rem; }
        .post-body a, .connect a, .crumbs a { color: var(--accent-indigo); font-weight: 600; text-decoration: none; }
        .post-body a:hover, .connect a:hover, .crumbs a:hover { text-decoration: underline; }
        .post-body blockquote { border-left: 3px solid var(--accent-indigo); background: #f1f5f9; padding: 1rem 1.25rem; border-radius: 0 12px 12px 0; margin: 1.5rem 0; color: #334155; font-size: 0.98rem; line-height: 1.7; }
        .crumbs { font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.5rem; }
        .connect { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 1.75rem; margin: 3rem 0 1.5rem; box-shadow: var(--shadow-sm); }
        .connect h2 { font-size: 1.15rem; margin-bottom: 1rem; }
        .connect ul { list-style: none; display: flex; flex-direction: column; gap: 0.9rem; }
        .connect li { font-size: 0.95rem; color: #334155; line-height: 1.6; }
        .reason-card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 1.5rem; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 0.5rem; text-decoration: none; color: inherit; }
        a.reason-card:hover { border-color: #cbd5e1; transform: translateY(-3px); box-shadow: var(--shadow-md); transition: var(--transition-smooth); }
        .reason-card h3 { font-size: 1.05rem; color: var(--text-primary); }
        .reason-card p { color: var(--text-secondary); font-size: 0.9rem; }
        .cta-box { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 20px; padding: 2.25rem; text-align: center; box-shadow: var(--shadow-sm); margin-top: 2rem; }
        .cta-box h2 { font-size: 1.4rem; margin-bottom: 0.5rem; }
        .cta-box p { color: var(--text-secondary); margin-bottom: 1.25rem; }
        .page-hero { padding: 3rem 0 2rem; max-width: 820px; }
        .page-hero h1 { font-size: 3.1rem; font-weight: 800; line-height: 1.15; letter-spacing: -0.03em; margin-bottom: 1.25rem; }
        .page-hero p { color: var(--text-secondary); font-size: 1.15rem; margin-bottom: 2rem; }
        @media (max-width: 640px) { .page-hero h1 { font-size: 2.25rem; } .post h1 { font-size: 2rem; } }
`;
