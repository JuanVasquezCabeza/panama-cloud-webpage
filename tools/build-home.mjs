// Generates the home page in English (/en/) and Spanish (/es/). Copy for both languages lives in STR below;
// the interactive demo markup/logic is tools/home-demo.html + tools/home-demo.js. Run via `node tools/build-all.mjs`.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { root, page, paths, otherLang, LANGS } from './lib.mjs';

const demoHtml = readFileSync(join(root, 'tools', 'home-demo.html'), 'utf8');
const demoJs = readFileSync(join(root, 'tools', 'home-demo.js'), 'utf8');
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
    demoH: 'See diminishing returns in action', demoP: 'The core idea behind a marketing mix model, in one interactive chart.',
    demo: { demo_tag: 'Interactive demo', demo_title: 'Why more spend stops bringing more students',
      demo_desc: 'Illustrative numbers, not client data. Pick a channel and move the budget: every channel saturates, and the model finds the point where the next peso is no longer worth it.',
      ch_social: 'Paid Social', ch_search: 'Search Ads', ch_tv: 'TV &amp; Radio', lbl_spend: 'Monthly Ad Spend', lbl_rev: 'Incremental tuition revenue',
      lbl_mroi: 'Marginal ROI (Next $1)', axis_x: 'Monthly Channel Ad Spend', axis_y: 'Tuition revenue' },
    teamH: 'Our Leadership Team', teamP: 'Commercial and technical leadership behind Minos’ marketing measurement work in Latin America.',
    ulises: { role: 'Chief Technology Officer & Head of AI/Cloud Engineering', bio: 'Veteran tech leader specializing in secure, high-throughput data and cloud platforms, and in putting machine learning into production, the engineering foundation behind our models.', skills: 'Technical Expertise', badges: ['AWS', 'GCP', 'Terraform', 'Docker / K8s', 'Machine Learning', 'Distributed DBs'] },
    diego: { role: 'Sales Director', bio: 'Leads Minos’ client relationships and commercial strategy, helping institutions scope the right starting point for measuring and improving their admissions marketing.', skills: 'Commercial Expertise', badges: ['Client Partnerships', 'Commercial Strategy', 'Solution Scoping', 'Education Market'] },
    formH: 'Request the Marketing Data Audit', formP: 'Tell us about your institution and how you invest in admissions. We’ll come back to you within one business day.',
    f: { name: 'Your Name', namePh: 'Full name', email: 'Work Email', emailPh: 'name@institution.edu', inst: 'Institution or Group', instPh: 'School, group or university', type: 'Institution Type',
      types: ['K-12 school group', 'Private university', 'Vocational / technical institute', 'Language school', 'Online / edtech', 'Other'], students: 'Approximate Students',
      sizes: ['Under 1,000', '1,000 - 3,000', '3,000 - 10,000', '10,000+'], countries: 'Countries / Campuses', countriesPh: 'e.g. Colombia, 3 campuses',
      details: 'Which channels do you invest in, and what would you like to learn?', detailsPh: 'e.g. Meta and Google ads, radio, billboards, open days. We want to know where to cut or add budget.', send: 'Send Audit Request',
      subject: 'Marketing Data Audit request', mName: 'Name', mEmail: 'Email', mInst: 'Institution', mType: 'Type', mStudents: 'Students', mCountries: 'Countries / campuses' },
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
    demoH: 'Vea los rendimientos decrecientes en acción', demoP: 'La idea central de un modelo de mezcla de marketing, en un gráfico interactivo.',
    demo: { demo_tag: 'Demo interactiva', demo_title: 'Por qué más inversión deja de traer más estudiantes',
      demo_desc: 'Cifras ilustrativas, no son datos de clientes. Elija un canal y mueva el presupuesto: todos los canales se saturan, y el modelo encuentra el punto donde el siguiente peso ya no vale la pena.',
      ch_social: 'Redes pagas', ch_search: 'Búsqueda paga', ch_tv: 'TV y radio', lbl_spend: 'Inversión mensual', lbl_rev: 'Ingreso incremental por pensiones',
      lbl_mroi: 'ROI marginal (próximo $1)', axis_x: 'Inversión mensual en el canal', axis_y: 'Ingreso por pensiones' },
    teamH: 'Nuestro equipo directivo', teamP: 'El liderazgo comercial y técnico detrás del trabajo de medición de marketing de Minos en América Latina.',
    ulises: { role: 'Director de Tecnología (CTO) y Líder de Ingeniería de IA y Nube', bio: 'Líder tecnológico con trayectoria en plataformas de datos y nube seguras y de alto rendimiento, y en llevar el aprendizaje automático a producción: la base de ingeniería detrás de nuestros modelos.', skills: 'Experiencia técnica', badges: ['AWS', 'GCP', 'Terraform', 'Docker / K8s', 'Machine Learning', 'Bases de datos distribuidas'] },
    diego: { role: 'Director Comercial', bio: 'Lidera las relaciones con clientes y la estrategia comercial de Minos, y ayuda a las instituciones a definir el punto de partida adecuado para medir y mejorar su mercadeo de admisiones.', skills: 'Experiencia comercial', badges: ['Alianzas con clientes', 'Estrategia comercial', 'Definición de alcance', 'Mercado educativo'] },
    formH: 'Solicite la Auditoría de Datos de Marketing', formP: 'Cuéntenos sobre su institución y cómo invierte en admisiones. Le respondemos en un día hábil.',
    f: { name: 'Su nombre', namePh: 'Nombre completo', email: 'Correo de trabajo', emailPh: 'nombre@institucion.edu', inst: 'Institución o grupo', instPh: 'Colegio, grupo o universidad', type: 'Tipo de institución',
      types: ['Grupo de colegios K-12', 'Universidad privada', 'Instituto técnico / vocacional', 'Escuela de idiomas', 'Educación en línea / edtech', 'Otro'], students: 'Número aproximado de estudiantes',
      sizes: ['Menos de 1.000', '1.000 - 3.000', '3.000 - 10.000', 'Más de 10.000'], countries: 'Países / sedes', countriesPh: 'p. ej. Colombia, 3 sedes',
      details: '¿En qué canales invierte y qué le gustaría saber?', detailsPh: 'p. ej. Meta y Google, radio, vallas, jornadas de puertas abiertas. Queremos saber dónde recortar o sumar presupuesto.', send: 'Enviar solicitud de auditoría',
      subject: 'Solicitud de Auditoría de Datos de Marketing', mName: 'Nombre', mEmail: 'Correo', mInst: 'Institución', mType: 'Tipo', mStudents: 'Estudiantes', mCountries: 'Países / sedes' },
  },
};

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
  const f = s.f;
  const demo = demoHtml.replace(/\{\{(\w+)\}\}/g, (_, k) => { if (!(k in s.demo)) throw new Error('demo key ' + k); return s.demo[k]; });
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
            <div class="container">
                <div class="section-header"><h2>${s.demoH}</h2><p>${s.demoP}</p></div>
                <div class="labs-panel-container" style="max-width: 800px; margin: 0 auto;">
                    ${demo.trim()}
                </div>
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
                <form id="audit-form" action="#">
                    <div class="form-grid">
                        <div class="form-group"><label for="name">${f.name}</label><input type="text" id="name" required placeholder="${esc(f.namePh)}"></div>
                        <div class="form-group"><label for="email">${f.email}</label><input type="email" id="email" required placeholder="${esc(f.emailPh)}"></div>
                        <div class="form-group"><label for="company">${f.inst}</label><input type="text" id="company" required placeholder="${esc(f.instPh)}"></div>
                        <div class="form-group"><label for="itype">${f.type}</label><select id="itype">${f.types.map((x) => `<option>${esc(x)}</option>`).join('')}</select></div>
                        <div class="form-group"><label for="students">${f.students}</label><select id="students">${f.sizes.map((x, i) => `<option${i === 1 ? ' selected' : ''}>${esc(x)}</option>`).join('')}</select></div>
                        <div class="form-group"><label for="countries">${f.countries}</label><input type="text" id="countries" placeholder="${esc(f.countriesPh)}"></div>
                        <div class="form-group full-width"><label for="details">${f.details}</label><textarea id="details" rows="4" placeholder="${esc(f.detailsPh)}"></textarea></div>
                        <div class="form-group full-width" style="margin-top: 1rem;"><button type="submit" class="btn btn-primary" style="width: 100%;">${f.send}</button></div>
                    </div>
                </form>
            </div>
        </section>
`;
  // Audit request: opens the visitor's email client with the answers filled in (nothing is stored by the site).
  const script = `${demoJs}
        spendInput.addEventListener('input', calculateMMM);
        window.addEventListener('DOMContentLoaded', function () { selectChannel('social'); });
        document.getElementById('audit-form').addEventListener('submit', function (e) {
            e.preventDefault();
            var v = function (id) { return document.getElementById(id).value.trim(); };
            var body = [${JSON.stringify(f.mName)} + ': ' + v('name'), ${JSON.stringify(f.mEmail)} + ': ' + v('email'), ${JSON.stringify(f.mInst)} + ': ' + v('company'),
                ${JSON.stringify(f.mType)} + ': ' + v('itype'), ${JSON.stringify(f.mStudents)} + ': ' + v('students'), ${JSON.stringify(f.mCountries)} + ': ' + v('countries'), '', v('details')].join('\\n');
            window.location.href = 'mailto:info@minos.solutions?subject=' + encodeURIComponent(${JSON.stringify(f.subject)} + ' - ' + v('company')) + '&body=' + encodeURIComponent(body);
        });`;
  const path = paths.home(lang);
  mkdirSync(join(root, path.slice(1)), { recursive: true });
  writeFileSync(join(root, path.slice(1), 'index.html'), page({
    lang, path, altPath: paths.home(otherLang(lang)), current: 'home', title: s.title, description: s.desc, main, script,
  }));
}
console.log('Home built in en + es.');
