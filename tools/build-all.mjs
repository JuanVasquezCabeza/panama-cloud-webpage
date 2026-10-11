// Rebuilds the whole site: node tools/build-all.mjs
//   /en/ and /es/  home, products, blog, partners, privacy (generators below)  +  / language entry page  +  sitemap.xml  +  robots.txt
// Reads the CRM (products only, read-only). Commit the generated files and push to deploy.
import { rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { root, SITE, registry, esc } from './lib.mjs';

for (const d of ['en', 'es', 'blog', 'products-and-solutions']) rmSync(join(root, d), { recursive: true, force: true });

await import('./build-home.mjs');
await import('./build-products-page.mjs');
await import('./build-blog.mjs');
await import('./build-partners-page.mjs');
await import('./build-privacy-page.mjs');

// Root "/" is normally redirected by nginx (cookie, then Accept-Language). This static page is the fallback.
writeFileSync(join(root, 'index.html'), `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Minos Solutions | Marketing Mix Modeling for Education</title>
    <meta name="description" content="Marketing Mix Modeling for education institutions in Latin America. / Marketing Mix Modeling para instituciones educativas de América Latina.">
    <link rel="canonical" href="${SITE}/">
    <link rel="alternate" hreflang="en" href="${SITE}/en/">
    <link rel="alternate" hreflang="es" href="${SITE}/es/">
    <link rel="alternate" hreflang="x-default" href="${SITE}/">
    <script>
        (function () {
            var m = document.cookie.match(/(?:^|; )lang=(en|es)/);
            var l = m ? m[1] : ((navigator.language || 'en').slice(0, 2) === 'es' ? 'es' : 'en');
            location.replace('/' + l + '/');
        })();
    </script>
    <noscript><meta http-equiv="refresh" content="0; url=/en/"></noscript>
</head>
<body style="font-family: system-ui, sans-serif; text-align: center; padding: 4rem 1rem;">
    <p><a href="/en/">English</a> &middot; <a href="/es/">Español</a></p>
</body>
</html>
`);

const seen = new Set();
const urls = registry.filter((r) => !r.noindex && !seen.has(r.path) && seen.add(r.path)).map((r) => `  <url>
    <loc>${SITE}${r.path}</loc>
    <xhtml:link rel="alternate" hreflang="en" href="${SITE}${r.enPath}"/>
    <xhtml:link rel="alternate" hreflang="es" href="${SITE}${r.esPath}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}/"/>
  </url>`);
writeFileSync(join(root, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`);
writeFileSync(join(root, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
console.log(`Site built: ${urls.length} pages in sitemap.xml`);
