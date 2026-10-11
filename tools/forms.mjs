// Shared markup for the website request forms (home audit form = interest "client", partners page = interest
// "partner"). Labels are localized; option VALUES are the API values the CRM workflow expects and are never
// translated. Submission logic (JSON POST to /api/website-request, mailto fallback) is assets/forms.js.
// Payload contract: GEMINI.md section 9 and minos-crm/docs/website-form.md.
import { esc, paths } from './lib.mjs';

// [API value (English name, always sent), Spanish label]
const COUNTRIES = [
  ['Argentina', 'Argentina'], ['Bolivia', 'Bolivia'], ['Brazil', 'Brasil'], ['Chile', 'Chile'], ['Colombia', 'Colombia'],
  ['Costa Rica', 'Costa Rica'], ['Dominican Republic', 'República Dominicana'], ['Ecuador', 'Ecuador'], ['El Salvador', 'El Salvador'],
  ['Guatemala', 'Guatemala'], ['Honduras', 'Honduras'], ['Mexico', 'México'], ['Nicaragua', 'Nicaragua'], ['Panama', 'Panamá'],
  ['Paraguay', 'Paraguay'], ['Peru', 'Perú'], ['Uruguay', 'Uruguay'], ['Venezuela', 'Venezuela'], ['United States', 'Estados Unidos'],
  ['Spain', 'España'], ['Other', 'Otro'],
];

export const FORM_STR = {
  en: {
    choose: 'Select…', required: 'Required fields are marked with *',
    name: 'Your name', namePh: 'Full name', email: 'Work email', emailPh: 'name@institution.edu', jobTitle: 'Job title', jobTitlePh: 'e.g. Marketing Director',
    website: 'Website', websitePh: 'e.g. institution.edu', country: 'Country', city: 'City', phone: 'Phone / WhatsApp', phonePh: 'Include the country code',
    consentPre: 'I agree to Minos processing my data to answer this request, as described in the ', consentLink: 'Privacy Notice', consentPost: '.',
    hp: 'Leave this field empty',
    client: {
      organization: 'Institution or group', organizationPh: 'School, group or university',
      institutionType: 'Institution type', institutionTypes: [['K12_SCHOOL', 'K-12 school'], ['K12_GROUP', 'K-12 school group'], ['UNIVERSITY', 'Private university'], ['VOCATIONAL', 'Vocational / language institute'], ['ONLINE_EDTECH', 'Online / edtech'], ['OTHER', 'Other']],
      area: 'Your area', areas: [['MARKETING', 'Marketing'], ['ADMISSIONS', 'Admissions'], ['EXECUTIVE', 'Leadership / management'], ['DATA_BI', 'Data / BI'], ['OTHER', 'Other']],
      studentRange: 'Approximate students', studentRanges: [['UNDER_1000', 'Under 1,000'], ['FROM_1000_TO_3000', '1,000 - 3,000'], ['FROM_3000_TO_10000', '3,000 - 10,000'], ['OVER_10000', 'Over 10,000']],
      campusCount: 'Number of campuses', campusCountPh: 'e.g. 3',
      channels: 'Where do you invest in admissions marketing?', channelOpts: [['SEARCH', 'Google / search ads'], ['SOCIAL', 'Meta / TikTok / social ads'], ['DISPLAY_VIDEO', 'Display / YouTube'], ['RADIO_TV', 'Radio / TV'], ['OUTDOOR', 'Billboards / outdoor'], ['EVENTS', 'Fairs / open days / events'], ['OTHER', 'Other']],
      message: 'How can we help?', messagePh: 'e.g. We want to know which channels bring enrollments and where to cut or add budget.',
      send: 'Let’s talk', subject: 'Let’s talk — website',
    },
    partner: {
      organization: 'Company', organizationPh: 'Your company',
      companyType: 'Type of company', companyTypes: [['SIS_VENDOR', 'School / university management system (SIS, MIS, ERP)'], ['ADMISSIONS_CRM', 'Admissions CRM or implementer'], ['MARKETING_AGENCY', 'Education marketing / media agency'], ['TRAINING_EVENTS', 'Training & events for school leaders'], ['ASSOCIATION', 'Association or network of institutions'], ['SCHOOL_MARKETPLACE', 'School directory / marketplace'], ['OTHER', 'Other']],
      collaboration: 'How would you like to work together?', collaborationOpts: [['REFERRAL', 'Referral'], ['RESELLER', 'Reseller / white-label'], ['INTEGRATION', 'Technology integration'], ['CO_MARKETING', 'Co-marketing']],
      institutionsServed: 'Approx. number of schools / universities you serve', institutionsServedPh: 'e.g. 150',
      countriesServed: 'Countries where you serve them', countriesServedPh: 'e.g. Colombia, Mexico, Chile',
      message: 'Tell us about your company and your customers', messagePh: 'What you offer, who your customers are, and what you have in mind.',
      send: 'Send partner request', subject: 'Partner request',
    },
  },
  es: {
    choose: 'Seleccione…', required: 'Los campos obligatorios están marcados con *',
    name: 'Su nombre', namePh: 'Nombre completo', email: 'Correo de trabajo', emailPh: 'nombre@institucion.edu', jobTitle: 'Cargo', jobTitlePh: 'p. ej. Director(a) de Mercadeo',
    website: 'Sitio web', websitePh: 'p. ej. institucion.edu', country: 'País', city: 'Ciudad', phone: 'Teléfono / WhatsApp', phonePh: 'Incluya el indicativo del país',
    consentPre: 'Acepto que Minos trate mis datos para responder a esta solicitud, según el ', consentLink: 'Aviso de Privacidad', consentPost: '.',
    hp: 'Deje este campo vacío',
    client: {
      organization: 'Institución o grupo', organizationPh: 'Colegio, grupo o universidad',
      institutionType: 'Tipo de institución', institutionTypes: [['K12_SCHOOL', 'Colegio'], ['K12_GROUP', 'Grupo de colegios'], ['UNIVERSITY', 'Universidad privada'], ['VOCATIONAL', 'Instituto técnico / de idiomas'], ['ONLINE_EDTECH', 'Educación en línea / edtech'], ['OTHER', 'Otro']],
      area: 'Su área', areas: [['MARKETING', 'Mercadeo'], ['ADMISSIONS', 'Admisiones'], ['EXECUTIVE', 'Dirección / gerencia'], ['DATA_BI', 'Datos / BI'], ['OTHER', 'Otra']],
      studentRange: 'Número aproximado de estudiantes', studentRanges: [['UNDER_1000', 'Menos de 1.000'], ['FROM_1000_TO_3000', '1.000 - 3.000'], ['FROM_3000_TO_10000', '3.000 - 10.000'], ['OVER_10000', 'Más de 10.000']],
      campusCount: 'Número de sedes', campusCountPh: 'p. ej. 3',
      channels: '¿En qué canales invierte para admisiones?', channelOpts: [['SEARCH', 'Google / anuncios de búsqueda'], ['SOCIAL', 'Meta / TikTok / redes sociales'], ['DISPLAY_VIDEO', 'Display / YouTube'], ['RADIO_TV', 'Radio / TV'], ['OUTDOOR', 'Vallas / publicidad exterior'], ['EVENTS', 'Ferias / puertas abiertas / eventos'], ['OTHER', 'Otro']],
      message: '¿Cómo podemos ayudarle?', messagePh: 'p. ej. Queremos saber qué canales traen matrículas y dónde recortar o sumar presupuesto.',
      send: 'Hablemos', subject: 'Hablemos — sitio web',
    },
    partner: {
      organization: 'Empresa', organizationPh: 'Su empresa',
      companyType: 'Tipo de empresa', companyTypes: [['SIS_VENDOR', 'Plataforma de gestión escolar o universitaria (SIS, MIS, ERP)'], ['ADMISSIONS_CRM', 'CRM de admisiones o implementador'], ['MARKETING_AGENCY', 'Agencia de mercadeo / medios para educación'], ['TRAINING_EVENTS', 'Formación y eventos para directivos'], ['ASSOCIATION', 'Asociación o red de instituciones'], ['SCHOOL_MARKETPLACE', 'Directorio / portal de colegios'], ['OTHER', 'Otro']],
      collaboration: '¿Cómo le gustaría trabajar con nosotros?', collaborationOpts: [['REFERRAL', 'Referidos'], ['RESELLER', 'Reventa / marca blanca'], ['INTEGRATION', 'Integración tecnológica'], ['CO_MARKETING', 'Co-marketing']],
      institutionsServed: 'Número aprox. de colegios / universidades que atiende', institutionsServedPh: 'p. ej. 150',
      countriesServed: 'Países donde los atiende', countriesServedPh: 'p. ej. Colombia, México, Chile',
      message: 'Cuéntenos sobre su empresa y sus clientes', messagePh: 'Qué ofrece, quiénes son sus clientes y qué tiene en mente.',
      send: 'Enviar solicitud de alianza', subject: 'Solicitud de alianza',
    },
  },
};

const star = (req) => (req ? ' <span class="req" aria-hidden="true">*</span>' : '');

function input(id, name, label, { type = 'text', req = false, ph = '', ac = '', full = false, extra = '' } = {}) {
  return `<div class="form-group${full ? ' full-width' : ''}"><label for="${id}">${esc(label)}${star(req)}</label><input type="${type}" id="${id}" name="${name}"${req ? ' required' : ''}${ph ? ` placeholder="${esc(ph)}"` : ''}${ac ? ` autocomplete="${ac}"` : ''} ${extra}></div>`;
}

function select(id, name, label, opts, { req = false, selected = '', choose = '' } = {}) {
  const first = req && !selected ? `<option value="" disabled selected>${esc(choose)}</option>` : '';
  return `<div class="form-group"><label for="${id}">${esc(label)}${star(req)}</label><select id="${id}" name="${name}"${req ? ' required' : ''}>${first}${opts.map(([v, l]) => `<option value="${esc(v)}"${v === selected ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select></div>`;
}

function checks(id, name, legend, opts) {
  return `<fieldset class="form-group full-width check-group"><legend>${esc(legend)}</legend><div class="check-grid">${opts.map(([v, l], i) => `<label class="check-item" for="${id}-${i}"><input type="checkbox" id="${id}-${i}" name="${name}" value="${esc(v)}"><span>${esc(l)}</span></label>`).join('')}</div></fieldset>`;
}

function textarea(id, name, label, ph) {
  return `<div class="form-group full-width"><label for="${id}">${esc(label)}</label><textarea id="${id}" name="${name}" rows="4" maxlength="3000" placeholder="${esc(ph)}"></textarea></div>`;
}

// interest: 'client' | 'partner'. Returns the full <form> markup.
export function requestForm(lang, interest) {
  const F = FORM_STR[lang];
  const S = F[interest];
  const p = interest === 'client' ? 'cf' : 'pf';
  const country = select(`${p}-country`, 'country', F.country, COUNTRIES.map(([v, es]) => [v, lang === 'es' ? es : v]), { req: true, choose: F.choose });
  const common = {
    name: input(`${p}-name`, 'name', F.name, { req: true, ph: F.namePh, ac: 'name', extra: 'maxlength="120"' }),
    email: input(`${p}-email`, 'email', F.email, { type: 'email', req: true, ph: F.emailPh, ac: 'email', extra: 'maxlength="160"' }),
    jobTitle: input(`${p}-jobTitle`, 'jobTitle', F.jobTitle, { req: true, ph: F.jobTitlePh, ac: 'organization-title', extra: 'maxlength="120"' }),
    organization: input(`${p}-organization`, 'organization', S.organization, { req: true, ph: S.organizationPh, ac: 'organization', extra: 'maxlength="160"' }),
    website: input(`${p}-website`, 'website', F.website, { ph: F.websitePh, ac: 'url', extra: 'inputmode="url" maxlength="200"' }),
    country,
    city: input(`${p}-city`, 'city', F.city, { ac: 'address-level2', extra: 'maxlength="120"' }),
    phone: input(`${p}-phone`, 'phone', F.phone, { type: 'tel', ph: F.phonePh, ac: 'tel', extra: 'maxlength="40"' }),
    message: textarea(`${p}-message`, 'message', S.message, S.messagePh),
  };
  const specific = interest === 'client' ? [
    common.name, common.email, common.jobTitle, common.organization,
    select(`${p}-institutionType`, 'institutionType', S.institutionType, S.institutionTypes, { req: true, choose: F.choose }),
    select(`${p}-area`, 'area', S.area, S.areas, { req: true, choose: F.choose }),
    common.website, common.country, common.city, common.phone,
    select(`${p}-studentRange`, 'studentRange', S.studentRange, S.studentRanges, { selected: 'FROM_1000_TO_3000' }),
    input(`${p}-campusCount`, 'campusCount', S.campusCount, { type: 'number', ph: S.campusCountPh, extra: 'min="1" max="1000" step="1" inputmode="numeric"' }),
    checks(`${p}-channels`, 'channels', S.channels, S.channelOpts),
    common.message,
  ] : [
    common.name, common.email, common.jobTitle, common.organization,
    select(`${p}-companyType`, 'companyType', S.companyType, S.companyTypes, { req: true, choose: F.choose }),
    common.website, common.country, common.city, common.phone,
    input(`${p}-institutionsServed`, 'institutionsServed', S.institutionsServed, { ph: S.institutionsServedPh, extra: 'maxlength="60"' }),
    input(`${p}-countriesServed`, 'countriesServed', S.countriesServed, { ph: S.countriesServedPh, extra: 'maxlength="200"' }),
    checks(`${p}-collaboration`, 'collaboration', S.collaboration, S.collaborationOpts),
    common.message,
  ];
  return `<form class="request-form" id="${interest === 'client' ? 'audit-form' : 'partner-request'}" action="#" data-lang="${lang}" data-subject="${esc(S.subject)}">
                    <input type="hidden" name="interest" value="${interest}">
                    <div class="hp-field" aria-hidden="true"><label for="${p}-hp">${esc(F.hp)}</label><input type="text" id="${p}-hp" name="company_url" tabindex="-1" autocomplete="off"></div>
                    <div class="form-grid">
                        ${specific.join('\n                        ')}
                        <div class="form-group full-width consent"><label class="check-item" for="${p}-consent"><input type="checkbox" id="${p}-consent" name="consent" required><span class="consent-text">${esc(F.consentPre)}<a href="${paths.privacy(lang)}" target="_blank" rel="noopener">${esc(F.consentLink)}</a>${esc(F.consentPost)}</span>${star(true)}</label></div>
                        <p class="form-note full-width">${esc(F.required)}</p>
                        <div class="form-group full-width"><button type="submit" class="btn btn-primary" style="width: 100%;">${esc(S.send)}</button></div>
                        <div class="form-status full-width" role="alert" aria-live="assertive" hidden></div>
                    </div>
                </form>`;
}
