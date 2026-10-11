// Generates the partner program page in English (/en/partners/) and Spanish (/es/aliados/). Copy for both
// languages lives in STR below; the partner form markup is tools/forms.mjs and its submit logic assets/forms.js.
// Source of truth for the program: minos-crm/docs/agents/partners.md §1-3. Internal scoring, tiers, example
// company names and commission terms are NOT published here. Run via `node tools/build-all.mjs`.
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { root, esc, page, paths, otherLang, LANGS } from './lib.mjs';
import { requestForm } from './forms.mjs';

const STR = {
  en: {
    title: 'Partner with Minos | Minos Solutions',
    desc: 'Partner with Minos to bring Marketing Mix Modeling to the schools and universities you already serve in Latin America: referral, reseller, technology integration or co-marketing.',
    badge: 'Partner program',
    h1: 'Bring Marketing Mix Modeling to the schools you already serve',
    lead: 'Schools, school groups and universities in Latin America already trust you. Partner with Minos to help them answer a question they can rarely answer today: which marketing channels actually bring students, and where the next peso of admissions budget should go.',
    ctaForm: 'Become a partner', ctaModels: 'Ways to work together',
    whyH: 'Why partner with Minos',
    whyP: 'Admissions budgets are under pressure and institutions want evidence. Together we can give it to them.',
    why: [
      { t: 'For your clients', li: [
        'A clear, data-backed view of which channels bring enrollments, online and offline',
        'Budget scenarios and an enrollment forecast to plan the next admissions cycle',
        'Measurement with aggregate data only, without tracking families',
        'A low-risk start: a short audit before any larger commitment',
      ] },
      { t: 'For you', li: [
        'A new, high-value service for your customers without building it yourself',
        'A closer relationship with your customers’ marketing, admissions and leadership teams',
        'Additional revenue from referrals or resale, on terms we agree together',
        'Expert content and speakers for your events, webinars and channels',
      ] },
    ],
    modelsH: 'Four ways to work together',
    modelsP: 'Pick one or combine several. We shape the partnership around how you already work with institutions.',
    models: [
      { tag: '01', t: 'Referral', p: 'Introduce institutions that want to know which channels bring students. We take it from there, keep you informed and recognize every successful introduction.' },
      { tag: '02', t: 'Reseller / white-label', p: 'Offer the Marketing Data Audit or the full model to your customers, under your brand or bundled with your service. We provide training, sales material and delivery.' },
      { tag: '03', t: 'Technology integration', p: 'Admissions, enrollment and lead data from your platform can feed the model directly. Projects get faster and simpler for the institution, and your product becomes more valuable.' },
      { tag: '04', t: 'Co-marketing', p: 'Joint webinars, articles, workshops and event sessions on admissions marketing and measurement, built for your audience of school and university leaders.' },
    ],
    whoH: 'Who it’s for',
    whoP: 'Companies that already work closely with private schools, school groups and universities in Latin America.',
    who: [
      { t: 'School management systems', p: 'SIS, MIS and ERP platforms used by schools and universities.' },
      { t: 'Admissions CRMs and implementers', p: 'Platforms and consultants that run the lead-to-enrollment funnel.' },
      { t: 'Education marketing agencies', p: 'Agencies that plan and buy media for institutions.' },
      { t: 'Training & events for school leaders', p: 'Leadership programs, congresses, fairs and summits.' },
      { t: 'Associations and networks', p: 'School and university associations, networks and accreditation groups.' },
      { t: 'School directories and marketplaces', p: 'Portals where families search, compare and review schools.' },
    ],
    howH: 'How it works',
    howP: 'A simple path from first conversation to the first institutions.',
    how: [
      { t: 'Intro call', p: 'A short conversation about your company, your customers and what you would like to achieve.' },
      { t: 'Fit and model', p: 'We look at where our offer fits your customers and choose the model, or combination, that suits you.' },
      { t: 'Agreement', p: 'We put roles, responsibilities and terms in writing, so both sides know what to expect.' },
      { t: 'Launch', p: 'We prepare materials, brief your team and start with the first institutions together.' },
    ],
    step: 'Step',
    formH: 'Tell us about your company',
    formP: 'Share a few details and we’ll reply within one business day to set up an intro call.',
  },
  es: {
    title: 'Sea aliado de Minos | Minos Solutions',
    desc: 'Alíese con Minos para llevar el Marketing Mix Modeling a los colegios y universidades que usted ya atiende en América Latina: referidos, reventa, integración tecnológica o co-marketing.',
    badge: 'Programa de aliados',
    h1: 'Lleve el Marketing Mix Modeling a los colegios que usted ya atiende',
    lead: 'Colegios, grupos de colegios y universidades de América Latina ya confían en usted. Alíese con Minos para ayudarles a responder una pregunta que hoy casi nunca pueden contestar: qué canales de marketing realmente traen estudiantes y a dónde debe ir el próximo peso del presupuesto de admisiones.',
    ctaForm: 'Quiero ser aliado', ctaModels: 'Formas de trabajar juntos',
    whyH: 'Por qué aliarse con Minos',
    whyP: 'Los presupuestos de admisiones están bajo presión y las instituciones quieren evidencia. Juntos podemos dársela.',
    why: [
      { t: 'Para sus clientes', li: [
        'Una visión clara y basada en datos de qué canales traen matrículas, digitales y tradicionales',
        'Escenarios de presupuesto y un pronóstico de matrículas para planear el próximo ciclo de admisiones',
        'Medición solo con datos agregados, sin rastrear a las familias',
        'Un inicio de bajo riesgo: una auditoría corta antes de cualquier compromiso mayor',
      ] },
      { t: 'Para usted', li: [
        'Un servicio nuevo y de alto valor para sus clientes, sin tener que desarrollarlo',
        'Una relación más cercana con los equipos de mercadeo, admisiones y dirección de sus clientes',
        'Ingresos adicionales por referidos o reventa, en condiciones que acordamos juntos',
        'Contenido y conferencistas expertos para sus eventos, webinars y canales',
      ] },
    ],
    modelsH: 'Cuatro formas de trabajar juntos',
    modelsP: 'Elija una o combine varias. Damos forma a la alianza según cómo usted ya trabaja con las instituciones.',
    models: [
      { tag: '01', t: 'Referidos', p: 'Presente instituciones que quieren saber qué canales les traen estudiantes. Nosotros nos encargamos, lo mantenemos informado y reconocemos cada presentación exitosa.' },
      { tag: '02', t: 'Reventa / marca blanca', p: 'Ofrezca la Auditoría de Datos de Marketing o el modelo completo a sus clientes, con su marca o integrado a su servicio. Nosotros aportamos capacitación, material comercial y la entrega.' },
      { tag: '03', t: 'Integración tecnológica', p: 'Los datos de admisiones, matrículas y leads de su plataforma pueden alimentar el modelo directamente. Los proyectos son más rápidos y simples para la institución, y su producto gana valor.' },
      { tag: '04', t: 'Co-marketing', p: 'Webinars, artículos, talleres y sesiones en eventos sobre mercadeo de admisiones y medición, pensados para su audiencia de directivos de colegios y universidades.' },
    ],
    whoH: 'Para quién es',
    whoP: 'Empresas que ya trabajan de cerca con colegios privados, grupos de colegios y universidades de América Latina.',
    who: [
      { t: 'Plataformas de gestión escolar', p: 'Sistemas SIS, MIS y ERP que usan colegios y universidades.' },
      { t: 'CRM de admisiones e implementadores', p: 'Plataformas y consultores que gestionan el embudo de lead a matrícula.' },
      { t: 'Agencias de mercadeo educativo', p: 'Agencias que planean y compran medios para instituciones.' },
      { t: 'Formación y eventos para directivos', p: 'Programas de liderazgo, congresos, ferias y cumbres.' },
      { t: 'Asociaciones y redes', p: 'Asociaciones, redes y grupos de acreditación de colegios y universidades.' },
      { t: 'Directorios y portales de colegios', p: 'Portales donde las familias buscan, comparan y califican colegios.' },
    ],
    howH: 'Cómo funciona',
    howP: 'Un camino sencillo desde la primera conversación hasta las primeras instituciones.',
    how: [
      { t: 'Llamada inicial', p: 'Una conversación corta sobre su empresa, sus clientes y lo que le gustaría lograr.' },
      { t: 'Encaje y modelo', p: 'Revisamos dónde encaja nuestra oferta con sus clientes y elegimos el modelo, o la combinación, que más le conviene.' },
      { t: 'Acuerdo', p: 'Ponemos por escrito roles, responsabilidades y condiciones, para que ambas partes sepan qué esperar.' },
      { t: 'Lanzamiento', p: 'Preparamos materiales, informamos a su equipo y empezamos juntos con las primeras instituciones.' },
    ],
    step: 'Paso',
    formH: 'Cuéntenos sobre su empresa',
    formP: 'Compártanos algunos datos y le responderemos en un día hábil para agendar una llamada inicial.',
  },
};

const css = `
        .partners-hero { text-align: left; }
        .why-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; max-width: 1000px; margin: 0 auto; }
        .why-grid .pillar-card { padding: 2.25rem 2rem; }
        .who-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.25rem; }
        .who-grid .reason-card h3 { font-size: 1rem; }
        .steps { list-style: none; display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; counter-reset: step; }
        .steps li { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 1.5rem; box-shadow: var(--shadow-sm); }
        .steps h3 { font-size: 1.05rem; margin: 0.25rem 0 0.5rem; }
        .steps p { color: var(--text-secondary); font-size: 0.92rem; }
        @media (max-width: 400px) { .grid-3 { grid-template-columns: 1fr; } .why-grid { grid-template-columns: 1fr; } }
`;

for (const lang of LANGS) {
  const s = STR[lang];
  const main = `
        <section class="page-hero partners-hero">
            <div class="badge">${esc(s.badge)}</div>
            <h1>${esc(s.h1)}</h1>
            <p>${esc(s.lead)}</p>
            <div class="btn-group">
                <a href="#partner-form" class="btn btn-primary">${esc(s.ctaForm)}</a>
                <a href="#models" class="btn btn-secondary">${esc(s.ctaModels)}</a>
            </div>
        </section>

        <section class="section-padding" id="why" style="padding-top:2rem;">
            <div class="section-header"><h2>${esc(s.whyH)}</h2><p>${esc(s.whyP)}</p></div>
            <div class="why-grid">${s.why.map((w) => `
                <div class="pillar-card"><div><h3 class="pillar-title">${esc(w.t)}</h3><ul class="bullet-list">${w.li.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div></div>`).join('')}
            </div>
        </section>

        <section class="section-padding" id="models">
            <div class="section-header"><h2>${esc(s.modelsH)}</h2><p>${esc(s.modelsP)}</p></div>
            <div class="grid-3" style="grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));">${s.models.map((m) => `
                <div class="pillar-card"><div><div class="pillar-num">${m.tag}</div><h3 class="pillar-title">${esc(m.t)}</h3><p class="pillar-desc">${esc(m.p)}</p></div></div>`).join('')}
            </div>
        </section>

        <section class="section-padding" id="who">
            <div class="section-header"><h2>${esc(s.whoH)}</h2><p>${esc(s.whoP)}</p></div>
            <div class="who-grid">${s.who.map((w) => `
                <div class="reason-card"><h3>${esc(w.t)}</h3><p>${esc(w.p)}</p></div>`).join('')}
            </div>
        </section>

        <section class="section-padding" id="how">
            <div class="section-header"><h2>${esc(s.howH)}</h2><p>${esc(s.howP)}</p></div>
            <ol class="steps">${s.how.map((h, i) => `
                <li><div class="pillar-num">${esc(s.step)} 0${i + 1}</div><h3>${esc(h.t)}</h3><p>${esc(h.p)}</p></li>`).join('')}
            </ol>
        </section>

        <section class="section-padding" id="partner-form">
            <div class="section-header"><h2>${esc(s.formH)}</h2><p>${esc(s.formP)}</p></div>
            <div class="contact-card">
                ${requestForm(lang, 'partner')}
            </div>
        </section>
`;
  const path = paths.partners(lang);
  mkdirSync(join(root, path.slice(1)), { recursive: true });
  writeFileSync(join(root, path.slice(1), 'index.html'), page({
    lang, path, altPath: paths.partners(otherLang(lang)), current: 'partners', title: s.title, description: s.desc, css, main, scripts: ['/assets/forms.js'],
  }));
}
console.log('Partners page built in en + es.');
