// Generates the privacy notice in English (/en/privacy/) and Spanish (/es/privacidad/). It covers the website
// request forms (assets/forms.js -> /api/website-request -> Minos CRM). DRAFT: pending Juan's review before it is
// treated as final. Run via `node tools/build-all.mjs`.
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { root, esc, md, page, paths, otherLang, LANGS } from './lib.mjs';

const UPDATED = { en: 'Last updated: 11 October 2026', es: 'Última actualización: 11 de octubre de 2026' };

const STR = {
  en: {
    title: 'Privacy Notice | Minos Solutions',
    desc: 'How Minos handles the personal data you send through the forms on minos.solutions, and how to exercise your rights.',
    h1: 'Privacy Notice',
    body: `This notice explains how Minos Consulting ("Minos", "we") handles the personal data you send us through the forms on minos.solutions, and how you can exercise your rights.

## Who is responsible

Minos Consulting, operating the website minos.solutions, is responsible for your data. For any question or request about your data, write to [info@minos.solutions](mailto:info@minos.solutions).

## What data we collect

When you send the Marketing Data Audit request or the partner form, we collect what you enter:

- Your name, work email, job title, organization, website, country, city and phone or WhatsApp number
- The other answers in the form, for example institution type, size, marketing channels or how you would like to work with us
- Your message, if you write one

We also record, with your request: the page and language of the form, the campaign tags (utm parameters) of the link that brought you to the site, if any, and your consent with the exact text you accepted.

## Why we use it

We use your data only to answer your request and to follow up with you about the Minos services related to it. We do not sell your data and we do not share it with third parties for their own marketing.

## Legal basis

We process your data on the basis of your consent, which you give with the checkbox in the form. You can withdraw it at any time by writing to [info@minos.solutions](mailto:info@minos.solutions). Withdrawing consent does not affect what was done before.

## Where it is stored

Your request is stored in Minos's customer relationship management system (CRM), which we host ourselves on servers in the European Union (Hetzner, Germany). Only the Minos team has access to it. The website is delivered through Cloudflare's network, and its pages load fonts from Google Fonts.

## How long we keep it

We keep your data until our relationship ends or until you ask us to delete it, whichever comes first.

## Your rights

You can ask to access, update or correct your data, to delete it, and to withdraw your consent, by writing to [info@minos.solutions](mailto:info@minos.solutions). We will answer within the time required by the applicable law. These rights are recognized, among others, by Colombia's Law 1581 of 2012 on personal data protection (Habeas Data), Brazil's General Data Protection Law (LGPD, Law 13,709/2018) and similar laws in other Latin American countries. You can also file a complaint with the data protection authority of your country.

## Cookies

The forms do not set any cookies and the site uses no analytics or advertising cookies. The site sets a single cookie, lang, only when you use the language switcher, to remember your language. Campaign tags are kept in your browser's session storage for the current visit only, so they can be sent with your request.

## Changes to this notice

We may update this notice. The date at the top shows the latest version.`,
  },
  es: {
    title: 'Aviso de Privacidad | Minos Solutions',
    desc: 'Cómo trata Minos los datos personales que usted envía por los formularios de minos.solutions y cómo ejercer sus derechos.',
    h1: 'Aviso de Privacidad',
    body: `Este aviso explica cómo Minos Consulting («Minos», «nosotros») trata los datos personales que usted nos envía por los formularios de minos.solutions, y cómo puede ejercer sus derechos.

## Responsable

Minos Consulting, que opera el sitio web minos.solutions, es responsable de sus datos. Para cualquier pregunta o solicitud sobre sus datos, escriba a [info@minos.solutions](mailto:info@minos.solutions).

## Qué datos recogemos

Cuando usted envía la solicitud de Auditoría de Datos de Marketing o el formulario de aliados, recogemos lo que usted escribe:

- Su nombre, correo de trabajo, cargo, organización, sitio web, país, ciudad y teléfono o WhatsApp
- Las demás respuestas del formulario, por ejemplo tipo de institución, tamaño, canales de marketing o cómo le gustaría trabajar con nosotros
- Su mensaje, si escribe uno

Además registramos, junto con su solicitud: la página y el idioma del formulario, las etiquetas de campaña (parámetros utm) del enlace por el que llegó al sitio, si las hay, y su consentimiento con el texto exacto que aceptó.

## Para qué los usamos

Usamos sus datos solo para responder a su solicitud y para hacerle seguimiento sobre los servicios de Minos relacionados con ella. No vendemos sus datos ni los compartimos con terceros para su propio mercadeo.

## Base legal

Tratamos sus datos con base en su consentimiento, que usted otorga con la casilla del formulario. Puede retirarlo en cualquier momento escribiendo a [info@minos.solutions](mailto:info@minos.solutions). Retirar el consentimiento no afecta lo realizado antes.

## Dónde se almacenan

Su solicitud se guarda en el sistema de gestión de clientes (CRM) de Minos, que alojamos nosotros mismos en servidores de la Unión Europea (Hetzner, Alemania). Solo el equipo de Minos tiene acceso. El sitio web se entrega a través de la red de Cloudflare y sus páginas cargan tipografías de Google Fonts.

## Cuánto tiempo los conservamos

Conservamos sus datos hasta que termine nuestra relación o hasta que usted nos pida eliminarlos, lo que ocurra primero.

## Sus derechos

Usted puede pedir acceder a sus datos, actualizarlos o rectificarlos, suprimirlos y revocar su consentimiento, escribiendo a [info@minos.solutions](mailto:info@minos.solutions). Le responderemos dentro de los plazos que establezca la ley aplicable. Estos derechos están reconocidos, entre otras, por la Ley 1581 de 2012 de Colombia (Habeas Data), la Ley General de Protección de Datos de Brasil (LGPD, Ley 13.709/2018) y leyes similares de otros países de América Latina. También puede presentar una queja ante la autoridad de protección de datos de su país.

## Cookies

Los formularios no instalan cookies y el sitio no usa cookies de analítica ni de publicidad. El sitio instala una sola cookie, lang, solo cuando usted usa el selector de idioma, para recordar su idioma. Las etiquetas de campaña se guardan en el almacenamiento de sesión de su navegador solo durante la visita actual, para poder enviarlas con su solicitud.

## Cambios a este aviso

Podemos actualizar este aviso. La fecha al inicio indica la versión más reciente.`,
  },
};

const css = `
        .privacy-updated { font-size: 0.85rem; color: var(--text-secondary); font-family: var(--font-mono); margin-bottom: 2rem; }
`;

for (const lang of LANGS) {
  const s = STR[lang];
  const main = `
        <!-- DRAFT: privacy notice pending Juan's review (content in tools/build-privacy-page.mjs). -->
        <article class="post">
            <h1>${esc(s.h1)}</h1>
            <p class="privacy-updated">${esc(UPDATED[lang])}</p>
            <div class="post-body">
${md(s.body)}
            </div>
        </article>
`;
  const path = paths.privacy(lang);
  mkdirSync(join(root, path.slice(1)), { recursive: true });
  writeFileSync(join(root, path.slice(1), 'index.html'), page({
    lang, path, altPath: paths.privacy(otherLang(lang)), current: 'privacy', title: s.title, description: s.desc, css, main,
  }));
}
console.log('Privacy notice built in en + es.');
