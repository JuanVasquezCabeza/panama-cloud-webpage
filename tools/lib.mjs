// Shared helpers for the generators in tools/: CRM access (read-only), HTML escaping, a tiny Markdown
// converter and the common page layout (header, footer, design system reused from index.html).
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const CRM = process.env.TWENTY_URL || 'https://crm.minos.solutions';

export const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function apiKey() {
  if (process.env.TWENTY_API_KEY) return process.env.TWENTY_API_KEY;
  const env = readFileSync(join(root, '..', 'minos-crm', '.env'), 'utf8');
  return env.match(/^TWENTY_API_KEY=(.*)$/m)[1].replace(/["\r\s]/g, '');
}

// GET /rest/<object>?limit=... and return the record array. The key never enters generated pages.
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

const LABELS = {
  en: { home: 'Home', products: 'Products & Solutions', blog: 'Blog', audit: 'Request Audit', rights: 'All rights reserved.',
    tagline: 'Marketing Mix Modeling for education institutions in Latin America.' },
  es: { home: 'Inicio', products: 'Productos y soluciones', blog: 'Blog', audit: 'Solicitar auditoría', rights: 'Todos los derechos reservados.',
    tagline: 'Marketing Mix Modeling para instituciones educativas de América Latina.' },
};

const extraCss = `
        .header-nav { display: flex; gap: 1.5rem; align-items: center; }
        .header-nav a.nav-link { color: var(--text-secondary); text-decoration: none; font-weight: 600; font-size: 0.9rem; }
        .header-nav a.nav-link:hover, .header-nav a.nav-link[aria-current] { color: var(--accent-indigo); }
        @media (max-width: 640px) { .header-nav .nav-link { display: none; } }
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
        .draft-banner { background: #fef3c7; border: 1px solid #fde68a; color: #92400e; padding: 0.6rem 1rem; border-radius: 10px; font-size: 0.85rem; font-weight: 600; margin-bottom: 1.5rem; }
        .connect { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 1.75rem; margin: 3rem 0 1.5rem; box-shadow: var(--shadow-sm); }
        .connect h2 { font-size: 1.15rem; margin-bottom: 1rem; }
        .connect ul { list-style: none; display: flex; flex-direction: column; gap: 0.9rem; }
        .connect li { font-size: 0.95rem; color: #334155; line-height: 1.6; }
        .soon { color: var(--text-secondary); font-size: 0.8rem; font-family: var(--font-mono); }
        .reason-card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 1.5rem; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 0.5rem; text-decoration: none; color: inherit; }
        a.reason-card:hover { border-color: #cbd5e1; transform: translateY(-3px); box-shadow: var(--shadow-md); transition: var(--transition-smooth); }
        .reason-card h3 { font-size: 1.05rem; color: var(--text-primary); }
        .reason-card p { color: var(--text-secondary); font-size: 0.9rem; }
        .cta-box { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 20px; padding: 2.25rem; text-align: center; box-shadow: var(--shadow-sm); margin-top: 2rem; }
        .cta-box h2 { font-size: 1.4rem; margin-bottom: 0.5rem; }
        .cta-box p { color: var(--text-secondary); margin-bottom: 1.25rem; }
`;

// Full HTML document. `main` goes inside .container between header and footer.
export function page({ lang = 'en', title, description, noindex = false, current = '', css = '', main }) {
  const L = LABELS[lang];
  const style = readFileSync(join(root, 'index.html'), 'utf8').match(/<style>([\s\S]*?)<\/style>/)[1];
  const nav = (href, label, key) => `<a href="${href}" class="nav-link"${current === key ? ' aria-current="page"' : ''}>${label}</a>`;
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}">${noindex ? '\n    <meta name="robots" content="noindex">' : ''}
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    <!-- GENERATED by tools/ from the Minos CRM. Do not edit by hand. -->
    <style>${style}${extraCss}${css}</style>
</head>
<body>
    <div class="glow-wrapper"><div class="ambient-glow"></div><div class="ambient-glow-2"></div></div>
    <div class="container">
        <header>
            <a href="/" class="logo"><span class="logo-mark"></span>minos.solutions</a>
            <div class="header-nav">
                ${nav('/', L.home, 'home')}
                ${nav('/products-and-solutions/', L.products, 'products')}
                ${nav('/blog/', L.blog, 'blog')}
                <a href="/#audit" class="btn btn-secondary" style="padding: 0.55rem 1.2rem; font-size: 0.85rem; border-radius: 8px; font-weight:700;">${L.audit}</a>
            </div>
        </header>
${main}
        <footer>
            <div class="container">
                <div class="footer-grid">
                    <div style="text-align: left;">
                        <a href="/" class="logo"><span class="logo-mark"></span>minos.solutions</a>
                        <div class="footer-tagline">${L.tagline}</div>
                    </div>
                    <div style="text-align: right; font-family: var(--font-mono); font-size: 0.8rem; color: var(--accent-indigo); font-weight:600;">minos.solutions</div>
                </div>
                <div>&copy; 2026 Minos Consulting. ${L.rights}</div>
            </div>
        </footer>
    </div>
</body>
</html>
`;
}
