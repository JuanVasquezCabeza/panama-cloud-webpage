// Generates the home page in English (/en/) and Spanish (/es/). Copy for both languages lives in STR below;
// the audit form markup is tools/forms.mjs and its submit logic assets/forms.js. Run via `node tools/build-all.mjs`.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { root, page, paths, otherLang, LANGS } from './lib.mjs';
import { requestForm } from './forms.mjs';

const REASONS = JSON.parse(readFileSync(join(root, 'content', 'blog', 'reasons.json'), 'utf8'));

const STR = {
  en: {
    title: 'Minos Solutions | Marketing Mix Modeling for Education',
    desc: 'Marketing Mix Modeling for schools, school groups and universities in Latin America: know which channels bring students and where to put your admissions budget.',
    badge: 'Marketing Mix Modeling for education',
    h1: 'Know which marketing channels actually bring you students',
    lead: 'We help schools, school groups and universities in Latin America measure what each admissions channel contributes to enrollment, and decide where the next peso of budget should go.',
    ctaAudit: 'Request the Marketing Data Audit', ctaProducts: 'Products & Solutions',
    qTitle: 'The question we answer',
    q: '“If we move budget from channel X to channel Y, how many more students do we enroll?”',
    qList: ['Return of every channel, online and offline', 'Where extra spend stops paying', 'Budget scenarios and an enrollment forecast', 'Aggregate data only, no user tracking'],
    whyH: 'Why you need this', whyP: 'Six reasons to measure your admissions marketing, each with its own guide. Start with the overview or jump to the one that matches your question.',
    whyAll: 'Read the overview', read: 'Read the guide',
    offerH: 'From first audit to a living model', offerP: 'Start small, with evidence. Each step stands on its own and leads to the next.',
    steps: [
      { tag: 'Step 01 · Available now', t: 'Marketing Budget Allocation & Data Audit', p: 'We review how your admissions budget is split today and what marketing and enrollment data you have, then recommend what to do next.', li: ['Budget allocation review by channel', 'Data inventory and assessment', 'Recommendation and MMM implementation plan'] },
      { tag: 'Step 02 · After the audit', t: 'MMM Implementation', p: 'A model of how each channel drives leads, applications and enrollments, per campus or program, with carry-over, saturation and seasonality.', li: ['Channel contribution and ROI', 'Budget reallocation scenarios', 'Enrollment forecast for a given budget'] },
      { tag: 'Step 03 · After the audit', t: 'MMM Refresh & Scenario Planning', p: 'Keeps the model current each admissions cycle and re-plans the budget as results come in.', li: [] },
    ],
    seeAll: 'See all details',
    probH: 'Why admissions budgets are hard to defend',
    probP: [
      '<strong>Most educational institutions cannot say which part of their admissions budget brings students, and that is a measurement problem, not a marketing problem.</strong> The line “half the money I spend on advertising is wasted, but I don’t know which half” has been pinned on John Wanamaker for a century, although <a href="https://quoteinvestigator.com/2022/04/11/advertising/">Quote Investigator could not confirm he said it</a>. <a href="https://secure.businesswire.com/news/home/20250512782208/en/Gartner-2025-CMO-Spend-Survey-Reveals-Marketing-Budgets-Have-Flatlined-at-7.7-of-Overall-Company-Revenue">Gartner’s 2025 CMO survey</a> found marketing budgets flat at 7.7% of company revenue, with 59% of CMOs saying theirs was too small to execute their strategy. In <a href="https://newamerica.org/documents/9177/RNL_2022_CostRecruiting_Report.pdf">RNL’s 2022 report</a>, the median cost to recruit one undergraduate at US private four-year institutions rose from $2,114 to $2,795 in two years. When each enrollment costs more and budgets do not grow, knowing which channel works stops being optional.',
      '<strong>Marketing Mix Modeling answers it with data you already have, without following a single family.</strong> It relates weekly spend in each channel to leads, applications and enrollments, accounting for seasonality, delayed effects and saturation. Google’s open-source <a href="https://developers.google.com/meridian">Meridian</a> is built for “privacy-durable, advanced measurement”, and Meta’s <a href="https://github.com/facebookexperimental/Robyn">Robyn</a> presents modern MMM as “a privacy-safe solution”. <a href="https://www.kellogg.northwestern.edu/academics-research/research/detail/2019/a-comparison-of-approaches-to-advertising-measurement-evidence-from/">Gordon and colleagues</a> found across 15 Facebook experiments that observational methods often failed to reproduce randomized results, which is why the audit also looks at where small experiments can check the model.',
    ],
    widgetsH: 'See it for yourself', widgetsP: 'Two short interactive explainers. The numbers are illustrative, not client data.',
    teamH: 'Our Leadership Team', teamP: 'Commercial and technical leadership behind Minos’ marketing measurement work in Latin America.',
    ulises: { role: 'Chief Technology Officer & Head of AI/Cloud Engineering', bio: 'Veteran tech leader specializing in secure, high-throughput data and cloud platforms, and in putting machine learning into production, the engineering foundation behind our models.', skills: 'Technical Expertise', badges: ['AWS', 'GCP', 'Terraform', 'Docker / K8s', 'Machine Learning', 'Distributed DBs'] },
    diego: { role: 'Sales Director', bio: 'Leads Minos’ client relationships and commercial strategy, helping institutions scope the right starting point for measuring and improving their admissions marketing.', skills: 'Commercial Expertise', badges: ['Client Partnerships', 'Commercial Strategy', 'Solution Scoping', 'Education Market'] },
    formH: 'Request the Marketing Data Audit', formP: 'Tell us about your institution and how you invest in admissions. We’ll come back to you within one business day.',
    partnerQ: 'Do you work with schools?', partnerCta: 'Partner with us',
  },
  es: {
    title: 'Minos Solutions | Marketing Mix Modeling para Educación',
    desc: 'Marketing Mix Modeling para colegios, grupos de colegios y universidades de América Latina: sepa qué canales traen estudiantes y dónde poner su presupuesto de admisiones.',
    badge: 'Marketing Mix Modeling para educación',
    h1: 'Sepa qué canales de marketing realmente le traen estudiantes',
    lead: 'Ayudamos a colegios, grupos de colegios y universidades de América Latina a medir qué aporta cada canal de admisiones a la matrícula, y a decidir a dónde debe ir el próximo peso del presupuesto.',
    ctaAudit: 'Solicitar la Auditoría de Datos de Marketing', ctaProducts: 'Productos y soluciones',
    qTitle: 'La pregunta que respondemos',
    q: '«Si movemos presupuesto del canal X al canal Y, ¿cuántos estudiantes más matriculamos?»',
    qList: ['Retorno de cada canal, digital y tradicional', 'Dónde el gasto adicional deja de rendir', 'Escenarios de presupuesto y pronóstico de matrículas', 'Solo datos agregados, sin rastreo de usuarios'],
    whyH: 'Por qué lo necesita', whyP: 'Seis razones para medir su mercadeo de admisiones, cada una con su propia guía. Empiece por la visión general o vaya a la que responda su pregunta.',
    whyAll: 'Leer la visión general', read: 'Leer la guía',
    offerH: 'De la primera auditoría a un modelo vivo', offerP: 'Empiece con poco y con evidencia. Cada paso funciona por sí solo y lleva al siguiente.',
    steps: [
      { tag: 'Paso 01 · Disponible ahora', t: 'Auditoría de Presupuesto y Datos de Marketing', p: 'Revisamos cómo se reparte hoy su presupuesto de admisiones y qué datos de marketing y matrículas tiene, y recomendamos qué hacer después.', li: ['Revisión de la asignación del presupuesto por canal', 'Inventario y evaluación de datos', 'Recomendación y plan de implementación del MMM'] },
      { tag: 'Paso 02 · Después de la auditoría', t: 'Implementación de MMM', p: 'Un modelo de cómo cada canal genera leads, solicitudes y matrículas, por sede o programa, con efectos rezagados, saturación y estacionalidad.', li: ['Aporte y retorno de cada canal', 'Escenarios de reasignación del presupuesto', 'Pronóstico de matrículas para un presupuesto dado'] },
      { tag: 'Paso 03 · Después de la auditoría', t: 'Actualización de MMM y Planeación de Escenarios', p: 'Mantiene el modelo vigente en cada ciclo de admisiones y replantea el presupuesto a medida que llegan resultados.', li: [] },
    ],
    seeAll: 'Ver todos los detalles',
    probH: 'Por qué es difícil defender un presupuesto de admisiones',
    probP: [
      '<strong>La mayoría de las instituciones educativas no puede decir qué parte de su presupuesto de admisiones trae estudiantes, y eso es un problema de medición, no de mercadeo.</strong> La frase «la mitad del dinero que gasto en publicidad se desperdicia, pero no sé cuál mitad» se le atribuye desde hace un siglo a John Wanamaker, aunque <a href="https://quoteinvestigator.com/2022/04/11/advertising/">Quote Investigator no pudo confirmar que la haya dicho</a>. La <a href="https://secure.businesswire.com/news/home/20250512782208/en/Gartner-2025-CMO-Spend-Survey-Reveals-Marketing-Budgets-Have-Flatlined-at-7.7-of-Overall-Company-Revenue">encuesta CMO de Gartner de 2025</a> encontró presupuestos de marketing estancados en 7,7 % de los ingresos, y 59 % de los CMO dijo que el suyo era demasiado pequeño para ejecutar su estrategia. En el <a href="https://newamerica.org/documents/9177/RNL_2022_CostRecruiting_Report.pdf">informe de RNL de 2022</a>, el costo mediano de reclutar a un estudiante de pregrado en instituciones privadas de cuatro años de EE. UU. pasó de USD 2.114 a USD 2.795 en dos años. Cuando cada matrícula cuesta más y los presupuestos no crecen, saber qué canal funciona deja de ser opcional.',
      '<strong>El Marketing Mix Modeling lo responde con datos que usted ya tiene, sin seguir a ninguna familia.</strong> Relaciona la inversión semanal de cada canal con los leads, solicitudes y matrículas, teniendo en cuenta la estacionalidad, los efectos rezagados y la saturación. <a href="https://developers.google.com/meridian">Meridian</a>, la herramienta de código abierto de Google, fue creada para una medición avanzada y «privacy-durable», y <a href="https://github.com/facebookexperimental/Robyn">Robyn</a>, de Meta, presenta el MMM moderno como «una solución respetuosa de la privacidad». <a href="https://www.kellogg.northwestern.edu/academics-research/research/detail/2019/a-comparison-of-approaches-to-advertising-measurement-evidence-from/">Gordon y colegas</a> encontraron, en 15 experimentos de Facebook, que los métodos observacionales con frecuencia no reproducían los resultados aleatorizados, por eso la auditoría también busca dónde pequeños experimentos pueden verificar el modelo.',
    ],
    widgetsH: 'Compruébelo usted mismo', widgetsP: 'Dos explicaciones interactivas cortas. Las cifras son ilustrativas, no son datos de clientes.',
    teamH: 'Nuestro equipo directivo', teamP: 'El liderazgo comercial y técnico detrás del trabajo de medición de marketing de Minos en América Latina.',
    ulises: { role: 'Director de Tecnología (CTO) y Líder de Ingeniería de IA y Nube', bio: 'Líder tecnológico con trayectoria en plataformas de datos y nube seguras y de alto rendimiento, y en llevar el aprendizaje automático a producción: la base de ingeniería detrás de nuestros modelos.', skills: 'Experiencia técnica', badges: ['AWS', 'GCP', 'Terraform', 'Docker / K8s', 'Machine Learning', 'Bases de datos distribuidas'] },
    diego: { role: 'Director Comercial', bio: 'Lidera las relaciones con clientes y la estrategia comercial de Minos, y ayuda a las instituciones a definir el punto de partida adecuado para medir y mejorar su mercadeo de admisiones.', skills: 'Experiencia comercial', badges: ['Alianzas con clientes', 'Estrategia comercial', 'Definición de alcance', 'Mercado educativo'] },
    formH: 'Solicite la Auditoría de Datos de Marketing', formP: 'Cuéntenos sobre su institución y cómo invierte en admisiones. Le respondemos en un día hábil.',
    partnerQ: '¿Trabaja con colegios o universidades?', partnerCta: 'Sea nuestro aliado',
  },
};

// Small secondary link to the partners page under the audit form; deliberately quieter than the audit CTA.
const PARTNER_BAND_CSS = `
        .partner-band { text-align: center; padding: 1.25rem 1rem 3rem; color: var(--text-secondary); font-size: 0.95rem; }
        .partner-band a { color: var(--accent-indigo); font-weight: 600; text-decoration: none; white-space: nowrap; }
        .partner-band a:hover { text-decoration: underline; }
`;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const profile = (initials, name, p, s) => `
                <div class="profile-card">
                    <div class="profile-header">
                        <div class="profile-title"><h3>${name}</h3><div class="profile-role">${esc(p.role)}</div></div>
                        <div class="profile-avatar-placeholder">${initials}</div>
                    </div>
                    <p class="profile-bio">${esc(p.bio)}</p>
                    <div class="skill-section">
                        <div class="skill-title">${esc(p.skills)}</div>
                        <div class="badge-list">${p.badges.map((b) => `<span class="tech-badge">${esc(b)}</span>`).join('')}</div>
                    </div>
                </div>`;

for (const lang of LANGS) {
  const s = STR[lang];
  const main = `
        <section class="hero">
            <div>
                <div class="badge">
                    <span style="display:inline-block; width:8px; height:8px; background-color:var(--accent-green); border-radius:50%;"></span>
                    ${s.badge}
                </div>
                <h1>${s.h1}</h1>
                <p>${s.lead}</p>
                <div class="btn-group">
                    <a href="#audit" class="btn btn-primary">${s.ctaAudit}</a>
                    <a href="${paths.products(lang)}" class="btn btn-secondary">${s.ctaProducts}</a>
                </div>
            </div>
            <div class="widget-card" style="padding: 2.25rem 2rem;">
                <div class="widget-title" style="margin-bottom: 1.25rem;"><span>${s.qTitle}</span></div>
                <div style="background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem;">
                    <div style="font-size: 1.15rem; font-weight: 700; color: var(--accent-indigo); letter-spacing: -0.02em; line-height: 1.4;">${s.q}</div>
                </div>
                <ul class="bullet-list" style="margin-bottom:0;">${s.qList.map((x) => `<li>${x}</li>`).join('')}</ul>
            </div>
        </section>

        <section class="section-padding" id="problem">
            <div class="section-header"><h2>${s.probH}</h2></div>
            <div class="post-body" style="max-width:760px;margin:0 auto;">${s.probP.map((p) => `<p>${p}</p>`).join('')}</div>
        </section>

        <section class="section-padding" id="why">
            <div class="section-header"><h2>${s.whyH}</h2><p>${s.whyP}</p></div>
            <div class="grid-3">${REASONS.reasons.map((r) => `
                <a class="reason-card" href="/${lang}/blog/${r.slug[lang]}/"><div class="pillar-num">${r.n}</div><h3>${esc(r.title[lang])}</h3><p>${esc(r.card[lang])}</p><span style="color:var(--accent-indigo);font-weight:600;font-size:0.85rem;">${s.read} &rarr;</span></a>`).join('')}
            </div>
            <div style="text-align:center; margin-top:2.5rem;"><a href="/${lang}/blog/${REASONS.pillar.slug[lang]}/" class="btn btn-secondary">${s.whyAll}</a></div>
        </section>

        <section class="section-padding" id="offer">
            <div class="section-header"><h2>${s.offerH}</h2><p>${s.offerP}</p></div>
            <div class="grid-3">${s.steps.map((st) => `
                <div class="pillar-card">
                    <div>
                        <div class="pillar-num">${st.tag}</div>
                        <h3 class="pillar-title">${st.t}</h3>
                        <p class="pillar-desc">${st.p}</p>${st.li.length ? `
                        <ul class="bullet-list">${st.li.map((x) => `<li>${x}</li>`).join('')}</ul>` : ''}
                    </div>
                </div>`).join('')}
            </div>
            <div style="text-align:center; margin-top:2.5rem;"><a href="${paths.products(lang)}" class="btn btn-secondary">${s.seeAll}</a></div>
        </section>

        <section class="section-padding" id="labs" style="border-bottom: 1px solid var(--border-color);">
            <div class="section-header"><h2>${s.widgetsH}</h2><p>${s.widgetsP}</p></div>
            <div style="max-width:800px;margin:0 auto;">
                <div class="viz" data-widget="saturation" data-lang="${lang}"></div>
                <div class="viz" data-widget="readiness" data-lang="${lang}"></div>
            </div>
        </section>

        <section class="section-padding leadership-section" id="team">
            <div class="section-header"><h2>${s.teamH}</h2><p>${s.teamP}</p></div>
            <div class="founders-grid">${profile('UM', 'Ulises Múnera', s.ulises)}${profile('DP', 'Diego Mauricio Puerto Rojas', s.diego)}
            </div>
        </section>

        <section class="section-padding" id="audit">
            <div class="section-header"><h2>${s.formH}</h2><p>${s.formP}</p></div>
            <div class="contact-card">
                ${requestForm(lang, 'client')}
            </div>
        </section>

        <aside class="partner-band" aria-label="${s.partnerQ}">
            <span>${s.partnerQ}</span> <a href="${paths.partners(lang)}">${s.partnerCta} &rarr;</a>
        </aside>
`;
  const path = paths.home(lang);
  mkdirSync(join(root, path.slice(1)), { recursive: true });
  writeFileSync(join(root, path.slice(1), 'index.html'), page({
    lang, path, altPath: paths.home(otherLang(lang)), current: 'home', title: s.title, description: s.desc, main, css: PARTNER_BAND_CSS, scripts: ['/assets/widgets.js', '/assets/forms.js'],
  }));
}
console.log('Home built in en + es.');
