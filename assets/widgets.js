/* Minos interactive explainers. One file, 15 small widgets, English + Spanish.
 * A widget is declared in the page as <div class="viz" data-widget="name" data-lang="en|es">.
 * All numbers are ILLUSTRATIVE (stylised response curves), never client data.
 * Rendering functions are pure (state -> HTML string), so they can be tested without a browser (tools/test-widgets.mjs). */
(function (root) {
  'use strict';

  var COL = { ink: '#0f172a', mute: '#64748b', line: '#cbd5e1', soft: '#f1f5f9', ind: '#4f46e5', cyan: '#0284c7', green: '#10b981', amber: '#d97706', red: '#ef4444' };
  var LOC = { en: 'en-US', es: 'es-CO' };

  // ---------- helpers ----------
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function num(n, lang, d) { return Number(n).toLocaleString(LOC[lang], { maximumFractionDigits: d || 0, minimumFractionDigits: 0 }); }
  function usd(n, lang) { return '$' + num(n, lang, 0); }
  function usdk(n, lang) { return '$' + num(n, lang, 0) + 'k'; }
  function fill(s, o) { return String(s).replace(/\{(\w+)\}/g, function (_, k) { return o[k] !== undefined ? o[k] : ''; }); }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function sum(a) { return a.reduce(function (x, y) { return x + y; }, 0); }
  function erf(x) { var s = x < 0 ? -1 : 1; x = Math.abs(x); var t = 1 / (1 + 0.3275911 * x); var y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return s * y; }
  function cdf(z) { return 0.5 * (1 + erf(z / Math.SQRT2)); }

  // Stylised channel response curves: enrollments = M * (1 - exp(-a * spend in $k)).
  var CH = { social: { M: 250, a: 0.0255 }, search: { M: 150, a: 0.05 }, radio: { M: 320, a: 0.011 }, events: { M: 110, a: 0.03 } };
  var CHK = ['social', 'search', 'radio', 'events'];
  function resp(k, s) { return CH[k].M * (1 - Math.exp(-CH[k].a * s)); }
  function marg(k, s) { return CH[k].M * CH[k].a * Math.exp(-CH[k].a * s); } // enrollments per extra $1k
  function total(spend) { return sum(CHK.map(function (k, i) { return resp(k, spend[i]); })); }
  // Best split of budget B (in $k): equalise marginal returns, with an optional minimum per channel.
  function optimize(B, floor) {
    var f = Math.min(floor || 0, B / CHK.length);
    function alloc(l) { return CHK.map(function (k) { return Math.max(f, Math.log(CH[k].M * CH[k].a / l) / CH[k].a); }); }
    var lo = 1e-6, hi = 1000, i;
    for (i = 0; i < 80; i++) { var mid = (lo + hi) / 2; if (sum(alloc(mid)) > B) lo = mid; else hi = mid; }
    var res = alloc((lo + hi) / 2), s = sum(res);
    return res.map(function (v) { return v * B / s; });
  }

  // ---------- html building blocks ----------
  function frame(o) {
    var w = o.w || 340, h = o.h || 180, L = o.l || 40, R = o.r || 12, T = o.t || 12, B = o.b || 30;
    var iw = w - L - R, ih = h - T - B;
    function sx(v) { return L + (v - (o.xmin || 0)) / (o.xmax - (o.xmin || 0)) * iw; }
    function sy(v) { return T + ih - (v - (o.ymin || 0)) / (o.ymax - (o.ymin || 0)) * ih; }
    var g = '', i, v, yt = o.yticks || 4, xt = o.xticks || 4;
    for (i = 0; i <= yt; i++) {
      v = (o.ymin || 0) + (o.ymax - (o.ymin || 0)) * i / yt;
      g += '<line x1="' + L + '" x2="' + (w - R) + '" y1="' + sy(v).toFixed(1) + '" y2="' + sy(v).toFixed(1) + '" stroke="#e2e8f0"/><text x="' + (L - 5) + '" y="' + (sy(v) + 3).toFixed(1) + '" text-anchor="end" class="vt">' + esc(o.yfmt ? o.yfmt(v) : num(v, o.lang)) + '</text>';
    }
    for (i = 0; i <= xt; i++) {
      v = (o.xmin || 0) + (o.xmax - (o.xmin || 0)) * i / xt;
      g += '<text x="' + sx(v).toFixed(1) + '" y="' + (h - B + 13) + '" text-anchor="middle" class="vt">' + esc(o.xfmt ? o.xfmt(v) : num(v, o.lang)) + '</text>';
    }
    g += '<line x1="' + L + '" x2="' + L + '" y1="' + T + '" y2="' + (T + ih) + '" stroke="#94a3b8"/><line x1="' + L + '" x2="' + (w - R) + '" y1="' + (T + ih) + '" y2="' + (T + ih) + '" stroke="#94a3b8"/>';
    if (o.xlabel) g += '<text x="' + (L + iw / 2) + '" y="' + (h - 3) + '" text-anchor="middle" class="vl">' + esc(o.xlabel) + '</text>';
    return { g: g, sx: sx, sy: sy, w: w, h: h, L: L, T: T, iw: iw, ih: ih, bottom: T + ih };
  }
  function pathOf(pts, f, color, wid, dash) {
    var d = '', i;
    for (i = 0; i < pts.length; i++) d += (i ? 'L' : 'M') + f.sx(pts[i][0]).toFixed(1) + ' ' + f.sy(pts[i][1]).toFixed(1) + ' ';
    return '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="' + (wid || 2.5) + '"' + (dash ? ' stroke-dasharray="' + dash + '"' : '') + ' stroke-linecap="round" stroke-linejoin="round"/>';
  }
  function svg(f, inner, label) { return '<svg class="viz-svg" viewBox="0 0 ' + f.w + ' ' + f.h + '" role="img" aria-label="' + esc(label) + '">' + f.g + inner + '</svg>'; }
  function tiles(list) {
    return '<div class="vtiles">' + list.map(function (x) { return '<div class="vtile"><span>' + esc(x.l) + '</span><b' + (x.c ? ' style="color:' + x.c + '"' : '') + '>' + esc(x.v) + '</b></div>'; }).join('') + '</div>';
  }
  function hbars(rows, max, fmtv) {
    return '<div class="vbars">' + rows.map(function (r) {
      var w = max > 0 ? clamp(r.v / max * 100, 0, 100) : 0;
      return '<div class="vbar"><span class="vbar-l">' + esc(r.label) + '</span><span class="vbar-t"><i style="width:' + w.toFixed(1) + '%;background:' + (r.color || COL.ind) + '"></i></span><span class="vbar-v">' + esc(fmtv(r.v)) + '</span></div>';
    }).join('') + '</div>';
  }
  function take(txt) { return '<p class="viz-take">' + txt + '</p>'; }

  // ---------- controls (declarative) ----------
  function ctl(c, s) {
    var i;
    if (c.type === 'range') return '<label class="vc"><span class="vc-h"><span>' + esc(c.label) + '</span><output>' + esc(c.show(s[c.k], s)) + '</output></span><input type="range" data-k="' + c.k + '" min="' + c.min + '" max="' + c.max + '" step="' + c.step + '" value="' + (c.get ? c.get(s) : s[c.k]) + '"></label>';
    if (c.type === 'seg') return '<div class="vc"><span class="vc-h"><span>' + esc(c.label) + '</span></span><div class="seg" role="group" aria-label="' + esc(c.label) + '">' + c.opts.map(function (o) { return '<button type="button" data-act="set" data-k="' + c.k + '" data-v="' + o.v + '" aria-pressed="' + (String(s[c.k]) === String(o.v)) + '">' + esc(o.l) + '</button>'; }).join('') + '</div></div>';
    if (c.type === 'check') return '<label class="vc vc-check"><input type="checkbox" data-k="' + c.k + '"' + (s[c.k] ? ' checked' : '') + '><span>' + esc(c.label) + '</span></label>';
    if (c.type === 'button') return '<button type="button" class="btn btn-secondary vbtn" data-act="' + c.act + '">' + esc(c.label) + '</button>';
    if (c.type === 'yesno') {
      var h = '';
      for (i = 0; i < c.qs.length; i++) h += '<div class="vq"><span>' + esc(c.qs[i]) + '</span><div class="seg" role="group">' + [['y', c.yes], ['n', c.no]].map(function (p) { return '<button type="button" data-act="ans" data-i="' + i + '" data-v="' + p[0] + '" aria-pressed="' + (s.a[i] === p[0]) + '">' + esc(p[1]) + '</button>'; }).join('') + '</div></div>';
      return h;
    }
    return '';
  }

  // ---------- texts (EN / ES) ----------
  var T = { en: {}, es: {} };
  T.en._ch = { social: 'Paid social', search: 'Search ads', radio: 'Radio', events: 'Open days & fairs' };
  T.es._ch = { social: 'Redes pagas', search: 'Búsqueda paga', radio: 'Radio', events: 'Jornadas y ferias' };
  T.en._ui = { tag: 'Interactive', illus: 'Illustrative numbers, not client data.' };
  T.es._ui = { tag: 'Interactivo', illus: 'Cifras ilustrativas, no son datos de clientes.' };

  var W = {};

  // ===== 1. readiness (pillar) =====
  T.en.readiness = { _title: 'How ready is your data?', _intro: 'Answer five questions. There is no minimum to start: this only shows what the audit would look at first.', yes: 'Yes', no: 'No',
    qs: ['We know our spend by channel, by month or week, for 2+ years', 'We record leads, applications and enrollments by month', 'We invest in 3 or more channels, including offline', 'Our spend changes over time (not the same every month)', 'We can split results by campus or program'],
    fix: ['Start collecting spend by channel and period; even invoices work.', 'Agree one place where leads, applications and enrollments are counted each month.', 'With fewer channels the model still works, but with less to compare.', 'If spend never changes, the model cannot learn; a planned variation helps.', 'Without this we model the institution as a whole, which is still useful.'],
    score: 'Score', tiers: ['Starting point: the audit would map what exists and what to collect.', 'Partly ready: a few gaps to close, and the audit would prioritise them.', 'Strong start: you may be able to go straight to a model.'], gaps: 'What to work on', answered: 'Answer all five to see your result.', ok: 'Nothing pending here.' };
  T.es.readiness = { _title: '¿Qué tan listos están sus datos?', _intro: 'Responda cinco preguntas. No hay un mínimo para empezar: esto solo muestra qué miraría primero la auditoría.', yes: 'Sí', no: 'No',
    qs: ['Conocemos nuestra inversión por canal, por mes o semana, de 2 o más años', 'Registramos leads, solicitudes y matrículas por mes', 'Invertimos en 3 o más canales, incluidos los tradicionales', 'Nuestra inversión cambia en el tiempo (no es igual cada mes)', 'Podemos separar resultados por sede o programa'],
    fix: ['Empiece a registrar la inversión por canal y periodo; incluso las facturas sirven.', 'Acuerde un solo lugar donde se cuenten los leads, solicitudes y matrículas cada mes.', 'Con menos canales el modelo igual funciona, pero hay menos que comparar.', 'Si la inversión nunca cambia, el modelo no puede aprender; una variación planeada ayuda.', 'Sin esto se modela la institución completa, lo cual sigue siendo útil.'],
    score: 'Puntaje', tiers: ['Punto de partida: la auditoría mapearía qué existe y qué hay que recolectar.', 'Parcialmente listos: hay algunas brechas, y la auditoría las priorizaría.', 'Buen comienzo: quizá puedan pasar directo a un modelo.'], gaps: 'En qué trabajar', answered: 'Responda las cinco para ver su resultado.', ok: 'Nada pendiente aquí.' };
  W.readiness = {
    defaults: { a: [null, null, null, null, null] },
    controls: function (s, t) { return [{ type: 'yesno', qs: t.qs, yes: t.yes, no: t.no }]; },
    actions: { ans: function (s, d) { s.a[+d.i] = d.v; } },
    render: function (s, t, lang) {
      var done = s.a.every(function (x) { return x !== null; }), n = s.a.filter(function (x) { return x === 'y'; }).length;
      if (!done) return '<p class="viz-take">' + esc(t.answered) + '</p>';
      var tier = n <= 1 ? 0 : n <= 3 ? 1 : 2, col = [COL.amber, COL.cyan, COL.green][tier];
      var gaps = s.a.map(function (x, i) { return x === 'n' ? '<li>' + esc(t.fix[i]) + '</li>' : ''; }).join('');
      return tiles([{ l: t.score, v: n + ' / 5', c: col }]) + '<div class="vprog"><i style="width:' + (n * 20) + '%;background:' + col + '"></i></div>' + take(esc(t.tiers[tier])) + '<div class="vlist"><b>' + esc(t.gaps) + '</b>' + (gaps ? '<ul>' + gaps + '</ul>' : '<p>' + esc(t.ok) + '</p>') + '</div>';
    }
  };

  // ===== 2. value (pillar) =====
  T.en.value = { _title: 'What is a small efficiency gain worth?', _intro: 'An enrollment is worth years of tuition. Move the sliders to see what a modest improvement in cost per enrollment means.', budget: 'Annual admissions budget', cpe: 'Cost per enrollment today', gain: 'Efficiency gain from a better mix', tuition: 'Tuition per student per year', years: 'Years a student stays',
    now: 'Enrollments today', extra: 'Extra enrollments, same budget', worth: 'Tuition over their time', yr: 'yr', bnow: 'Today', bgain: 'With the gain', take: 'A {gain}% gain on a {budget} budget means about {extra} more students, worth roughly {worth} in tuition over their time with you.' };
  T.es.value = { _title: '¿Cuánto vale una pequeña mejora de eficiencia?', _intro: 'Una matrícula vale años de pensión. Mueva los controles para ver qué significa una mejora modesta en el costo por matrícula.', budget: 'Presupuesto anual de admisiones', cpe: 'Costo por matrícula hoy', gain: 'Mejora de eficiencia con una mejor mezcla', tuition: 'Pensión por estudiante al año', years: 'Años que permanece un estudiante',
    now: 'Matrículas hoy', extra: 'Matrículas adicionales, mismo presupuesto', worth: 'Pensiones durante su permanencia', yr: 'años', bnow: 'Hoy', bgain: 'Con la mejora', take: 'Una mejora de {gain}% sobre un presupuesto de {budget} significa unos {extra} estudiantes más, que valen alrededor de {worth} en pensiones durante su permanencia.' };
  W.value = {
    defaults: { budget: 300, cpe: 1500, gain: 8, tuition: 4000, years: 6 },
    controls: function (s, t, lang) {
      return [
        { type: 'range', k: 'budget', label: t.budget, min: 50, max: 2000, step: 50, show: function (v) { return usdk(v, lang); } },
        { type: 'range', k: 'cpe', label: t.cpe, min: 300, max: 5000, step: 100, show: function (v) { return usd(v, lang); } },
        { type: 'range', k: 'gain', label: t.gain, min: 1, max: 25, step: 1, show: function (v) { return v + '%'; } },
        { type: 'range', k: 'tuition', label: t.tuition, min: 1000, max: 15000, step: 500, show: function (v) { return usd(v, lang); } },
        { type: 'range', k: 'years', label: t.years, min: 1, max: 12, step: 1, show: function (v) { return v + ' ' + t.yr; } }];
    },
    render: function (s, t, lang) {
      var enr = s.budget * 1000 / s.cpe, extra = enr * (1 / (1 - s.gain / 100) - 1), val = extra * s.tuition * s.years;
      return tiles([{ l: t.now, v: num(enr, lang) }, { l: t.extra, v: '+' + num(extra, lang, 1), c: COL.green }, { l: t.worth, v: usd(val, lang), c: COL.ind }]) +
        hbars([{ label: t.bnow, v: enr, color: COL.line }, { label: t.bgain, v: enr + extra, color: COL.ind }], enr + extra, function (v) { return num(v, lang); }) +
        take(fill(t.take, { gain: s.gain, budget: usdk(s.budget, lang), extra: num(extra, lang), worth: usd(val, lang) }));
    }
  };

  // ===== 3. map (pillar): how the six reasons connect =====
  T.en.map = { _title: 'How the six reasons connect', _intro: 'Tap a reason to see what it leads to and what it builds on.', read: 'Read this guide', conn: 'Connected to', none: 'Select a reason.' };
  T.es.map = { _title: 'Cómo se conectan las seis razones', _intro: 'Toque una razón para ver a qué lleva y en qué se apoya.', read: 'Leer esta guía', conn: 'Conectada con', none: 'Seleccione una razón.' };
  var MAPXY = { 1: [70, 55], 2: [210, 55], 3: [350, 55], 4: [490, 55], 5: [70, 150], 6: [280, 150] };
  W.map = {
    defaults: { sel: 1, data: null },
    setup: function (s, el, lang) { try { s.data = JSON.parse(el.getAttribute('data-json') || 'null'); } catch (e) { s.data = null; } },
    actions: { sel: function (s, d) { s.sel = +d.v; } },
    controls: function () { return []; },
    render: function (s, t, lang) {
      var d = s.data; if (!d) return '';
      var edges = d.links.map(function (l) {
        var a = MAPXY[l.from], b = MAPXY[l.to], on = (l.from === s.sel || l.to === s.sel);
        var dx = b[0] - a[0], dy = b[1] - a[1], len = Math.sqrt(dx * dx + dy * dy), ux = dx / len, uy = dy / len;
        return '<line x1="' + (a[0] + ux * 22).toFixed(1) + '" y1="' + (a[1] + uy * 22).toFixed(1) + '" x2="' + (b[0] - ux * 26).toFixed(1) + '" y2="' + (b[1] - uy * 26).toFixed(1) + '" stroke="' + (on ? COL.ind : COL.line) + '" stroke-width="' + (on ? 3 : 1.5) + '" marker-end="url(#arr' + (on ? 'On' : 'Off') + ')"/>';
      }).join('');
      var nodes = d.reasons.map(function (r) {
        var p = MAPXY[r.n], on = r.n === s.sel;
        return '<g class="vnode" tabindex="0" role="button" data-act="sel" data-v="' + r.n + '" aria-label="' + esc(r.title) + '" aria-pressed="' + on + '"><circle cx="' + p[0] + '" cy="' + p[1] + '" r="20" fill="' + (on ? COL.ind : '#fff') + '" stroke="' + COL.ind + '" stroke-width="2"/><text x="' + p[0] + '" y="' + (p[1] + 5) + '" text-anchor="middle" font-size="14" font-weight="700" fill="' + (on ? '#fff' : COL.ind) + '">' + r.n + '</text></g>';
      }).join('');
      var cur = d.reasons.filter(function (r) { return r.n === s.sel; })[0];
      var rel = d.links.filter(function (l) { return l.from === s.sel || l.to === s.sel; }).map(function (l) {
        var o = d.reasons.filter(function (r) { return r.n === (l.from === s.sel ? l.to : l.from); })[0];
        return '<li><b>' + o.n + '. ' + esc(o.title) + '</b><br>' + esc(l.text) + '</li>';
      }).join('');
      var defs = '<defs><marker id="arrOn" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="' + COL.ind + '"/></marker><marker id="arrOff" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="' + COL.line + '"/></marker></defs>';
      return '<svg class="viz-svg" viewBox="0 0 560 190" role="group" aria-label="' + esc(t._title) + '">' + defs + edges + nodes + '</svg>' +
        '<div class="vlist"><b>' + cur.n + '. ' + esc(cur.title) + '</b><p>' + esc(cur.card) + '</p>' + (rel ? '<span class="vsub">' + esc(t.conn) + '</span><ul>' + rel + '</ul>' : '') + '<a class="btn btn-secondary vbtn" href="' + esc(cur.url) + '">' + esc(t.read) + ' &rarr;</a></div>';
    }
  };

  // ===== 4. attribution (node 1) =====
  T.en.attribution = { _title: 'Same family, different winner', _intro: 'One family’s path to applying, five touches. Change the rule used to give credit and watch who wins.', rule: 'Credit rule', last: 'Last click', first: 'First click', linear: 'Equal split', model: 'Modeled', tp: ['Radio spot (Sep)', 'Billboard (Oct)', 'Open day (Nov)', 'Social ad (Dec)', 'Brand search (Jan)'],
    tl: 'Credit', tkLast: 'Last click gives 100% to brand search, even though four of five touches happened earlier.', tkFirst: 'First click flips the winner to radio and ignores everything that kept the family engaged.', tkLinear: 'An equal split is fairer to the journey but treats a billboard and the open day as the same.', tkModel: 'A model weighs each touch by how much it moved the decision across many families (illustrative weights).' };
  T.es.attribution = { _title: 'Misma familia, otro ganador', _intro: 'El camino de una familia hasta solicitar, en cinco contactos. Cambie la regla con que se da el crédito y vea quién gana.', rule: 'Regla de crédito', last: 'Último clic', first: 'Primer clic', linear: 'Reparto igual', model: 'Modelado', tp: ['Cuña de radio (sep)', 'Valla (oct)', 'Jornada de puertas abiertas (nov)', 'Anuncio en redes (dic)', 'Búsqueda de la marca (ene)'],
    tl: 'Crédito', tkLast: 'El último clic le da 100 % a la búsqueda de la marca, aunque cuatro de los cinco contactos ocurrieron antes.', tkFirst: 'El primer clic cambia al ganador a la radio e ignora todo lo que mantuvo interesada a la familia.', tkLinear: 'Un reparto igual es más justo con el recorrido, pero trata igual a una valla y a la jornada de puertas abiertas.', tkModel: 'Un modelo pondera cada contacto según cuánto movió la decisión en muchas familias (pesos ilustrativos).' };
  var ATTR = { last: [0, 0, 0, 0, 100], first: [100, 0, 0, 0, 0], linear: [20, 20, 20, 20, 20], model: [30, 15, 25, 10, 20] };
  W.attribution = {
    defaults: { rule: 'last' },
    controls: function (s, t) { return [{ type: 'seg', k: 'rule', label: t.rule, opts: [{ v: 'last', l: t.last }, { v: 'first', l: t.first }, { v: 'linear', l: t.linear }, { v: 'model', l: t.model }] }]; },
    render: function (s, t, lang) {
      var w = ATTR[s.rule], rows = t.tp.map(function (n, i) { return { label: n, v: w[i], color: w[i] === Math.max.apply(null, w) ? COL.ind : COL.cyan }; });
      return hbars(rows, 100, function (v) { return v + '%'; }) + take(esc(t[{ last: 'tkLast', first: 'tkFirst', linear: 'tkLinear', model: 'tkModel' }[s.rule]]));
    }
  };

  // ===== 5. halo (node 1): cut radio, watch brand search =====
  T.en.halo = { _title: 'Cut radio, watch brand search', _intro: 'A last-click report shows radio bringing zero applications. See what happens to brand searches when you cut it at week 6.', cut: 'Radio spend after week 6 (% of normal)', wk: 'Week', ys: 'Weekly brand searches', keep: 'Radio kept', cutl: 'Radio cut',
    rep: 'Last-click report: radio applications', lost: 'Applications lost by week 24', fall: 'Brand searches by week 24', saved: 'Radio spend saved', take0: 'The report says radio did nothing, so cutting it looks free. In the model, brand searches fall {fall}% by week 24 and about {lost} applications disappear, for {saved} saved.', takeSame: 'Radio is unchanged, so nothing changes. Slide the spend down.' };
  T.es.halo = { _title: 'Recorte la radio y vea la búsqueda de marca', _intro: 'Un reporte de último clic muestra que la radio trae cero solicitudes. Vea qué pasa con las búsquedas de la marca si la recorta en la semana 6.', cut: 'Inversión en radio después de la semana 6 (% de lo normal)', wk: 'Semana', ys: 'Búsquedas semanales de la marca', keep: 'Radio sin cambios', cutl: 'Radio recortada',
    rep: 'Reporte de último clic: solicitudes de radio', lost: 'Solicitudes perdidas a la semana 24', fall: 'Búsquedas de marca a la semana 24', saved: 'Inversión en radio ahorrada', take0: 'El reporte dice que la radio no hizo nada, así que recortarla parece gratis. En el modelo, las búsquedas de marca caen {fall} % a la semana 24 y desaparecen unas {lost} solicitudes, por {saved} ahorrados.', takeSame: 'La radio no cambia, así que nada cambia. Baje la inversión.' };
  function haloSeries(cutPct) {
    var r = 0.8, base = 80, k = 20, conv = 0.05, keep = [], cut = [], a1 = 0, a2 = 0, w;
    for (w = 0; w <= 24; w++) {
      var s2 = w < 6 ? 1 : cutPct / 100;
      a1 = a1 * r + 1; a2 = a2 * r + s2;
      keep.push(base + k * a1); cut.push(base + k * a2);
    }
    var lost = sum(keep.map(function (v, i) { return (v - cut[i]) * conv; }));
    return { keep: keep, cut: cut, lost: lost, fall: (1 - cut[24] / keep[24]) * 100, saved: 8 * 19 * (1 - cutPct / 100) };
  }
  W.halo = {
    defaults: { cut: 0 },
    controls: function (s, t) { return [{ type: 'range', k: 'cut', label: t.cut, min: 0, max: 100, step: 10, show: function (v) { return v + '%'; } }]; },
    render: function (s, t, lang) {
      var d = haloSeries(s.cut), f = frame({ lang: lang, xmax: 24, ymin: 60, ymax: 200, xticks: 4, yticks: 4, xlabel: t.wk, xfmt: function (v) { return Math.round(v); } });
      var ptsK = d.keep.map(function (v, i) { return [i, v]; }), ptsC = d.cut.map(function (v, i) { return [i, v]; });
      var inner = '<line x1="' + f.sx(6).toFixed(1) + '" x2="' + f.sx(6).toFixed(1) + '" y1="' + f.T + '" y2="' + f.bottom + '" stroke="' + COL.amber + '" stroke-dasharray="3 3"/>' + pathOf(ptsK, f, COL.line, 2.5, '5 4') + pathOf(ptsC, f, COL.ind, 3);
      var legend = '<div class="vleg"><span><i style="background:' + COL.line + '"></i>' + esc(t.keep) + '</span><span><i style="background:' + COL.ind + '"></i>' + esc(t.cutl) + '</span></div>';
      var same = s.cut >= 100;
      return svg(f, inner, t._title) + legend + tiles([{ l: t.rep, v: '0' }, { l: t.fall, v: '-' + num(d.fall, lang, 0) + '%', c: COL.red }, { l: t.lost, v: num(d.lost, lang), c: COL.red }, { l: t.saved, v: usdk(d.saved, lang), c: COL.green }]) +
        take(same ? esc(t.takeSame) : fill(t.take0, { fall: num(d.fall, lang), lost: num(d.lost, lang), saved: usdk(d.saved, lang) }));
    }
  };

  // ===== 6. saturation (node 2) =====
  T.en.saturation = { _title: 'Find the point where the next dollar stops paying', _intro: 'Pick a channel and move its monthly spend. Watch average cost stay calm while the marginal cost climbs.', ch: 'Channel', spend: 'Monthly spend', enr: 'Enrollments', avg: 'Average cost per enrollment', mc: 'Next $10k brings', mcc: 'Cost of the next enrollment', st: ['Still climbing', 'Bending', 'Saturated'], x: 'Monthly spend ($k)',
    tkOk: 'Average cost is {avg}, and the next enrollment costs about {mc}. The channel is still efficient.', tkBad: 'Average cost looks fine at {avg}, but the next enrollment costs {mc}. That is {ratio}x the average: the report hides the saturation.', unit: 'enroll.' };
  T.es.saturation = { _title: 'Encuentre el punto donde el siguiente peso deja de rendir', _intro: 'Elija un canal y mueva su inversión mensual. Vea cómo el costo promedio se mantiene tranquilo mientras el costo marginal sube.', ch: 'Canal', spend: 'Inversión mensual', enr: 'Matrículas', avg: 'Costo promedio por matrícula', mc: 'Los próximos $10k traen', mcc: 'Costo de la siguiente matrícula', st: ['Todavía subiendo', 'Doblándose', 'Saturado'], x: 'Inversión mensual ($k)',
    tkOk: 'El costo promedio es {avg} y la siguiente matrícula cuesta cerca de {mc}. El canal sigue siendo eficiente.', tkBad: 'El costo promedio se ve bien en {avg}, pero la siguiente matrícula cuesta {mc}. Es {ratio} veces el promedio: el reporte esconde la saturación.', unit: 'matr.' };
  W.saturation = {
    defaults: { ch: 'social', spend: 30 },
    controls: function (s, t, lang) {
      return [{ type: 'seg', k: 'ch', label: t.ch, opts: CHK.map(function (k) { return { v: k, l: T[lang]._ch[k] }; }) },
        { type: 'range', k: 'spend', label: t.spend, min: 0, max: 100, step: 2, show: function (v) { return usdk(v, lang); } }];
    },
    render: function (s, t, lang) {
      var k = s.ch, c = CH[k], e = resp(k, s.spend), m = marg(k, s.spend), ratio = Math.exp(-c.a * s.spend);
      var avg = s.spend > 0 ? s.spend * 1000 / e : 0, mc = m > 0 ? 1000 / m : 0, st = ratio > 0.6 ? 0 : ratio > 0.25 ? 1 : 2;
      var f = frame({ lang: lang, xmax: 100, ymax: Math.ceil(c.M / 50) * 50, xticks: 5, yticks: 4, xlabel: t.x }), pts = [], i;
      for (i = 0; i <= 50; i++) pts.push([i * 2, resp(k, i * 2)]);
      var x0 = Math.max(0, s.spend - 12), x1 = Math.min(100, s.spend + 12);
      var inner = pathOf(pts, f, COL.ind, 3) + '<line x1="' + f.sx(x0).toFixed(1) + '" y1="' + f.sy(e - m * (s.spend - x0)).toFixed(1) + '" x2="' + f.sx(x1).toFixed(1) + '" y2="' + f.sy(e + m * (x1 - s.spend)).toFixed(1) + '" stroke="' + COL.amber + '" stroke-width="2.5"/><circle cx="' + f.sx(s.spend).toFixed(1) + '" cy="' + f.sy(e).toFixed(1) + '" r="5.5" fill="' + COL.ind + '"/>';
      var bad = s.spend > 0 && mc > avg * 1.5;
      return svg(f, inner, t._title) + tiles([{ l: t.enr, v: num(e, lang) }, { l: t.avg, v: s.spend > 0 ? usd(avg, lang) : '-' }, { l: t.mcc, v: usd(mc, lang), c: bad ? COL.red : COL.green }, { l: t.mc, v: '+' + num(m * 10, lang, 1) + ' ' + t.unit }]) +
        '<div class="vpill vpill' + st + '">' + esc(t.st[st]) + '</div>' +
        take(s.spend > 0 ? (bad ? fill(t.tkBad, { avg: usd(avg, lang), mc: usd(mc, lang), ratio: num(mc / avg, lang, 1) }) : fill(t.tkOk, { avg: usd(avg, lang), mc: usd(mc, lang) })) : '');
    }
  };

  // ===== 7. extra_budget (node 2) =====
  T.en.extra_budget = { _title: 'Where should the next dollars go?', _intro: 'Each channel is already funded at a different level. Add extra budget and see where it buys the most enrollments.', extra: 'Extra monthly budget', now: 'now at', best: 'Best use', gain: 'extra enrollments', tk: 'The best use of the extra {extra} is {best}: about {g} more enrollments. The same money in {worst} would bring {w}. The biggest channel is not the best place to add.' };
  T.es.extra_budget = { _title: '¿A dónde deben ir los próximos pesos?', _intro: 'Cada canal ya tiene un nivel de inversión distinto. Sume presupuesto y vea dónde compra más matrículas.', extra: 'Presupuesto mensual adicional', now: 'hoy en', best: 'Mejor uso', gain: 'matrículas adicionales', tk: 'El mejor uso de los {extra} adicionales es {best}: unas {g} matrículas más. El mismo dinero en {worst} traería {w}. El canal más grande no es el mejor lugar para sumar.' };
  var BASE = { social: 60, search: 25, radio: 15, events: 10 };
  W.extra_budget = {
    defaults: { extra: 20 },
    controls: function (s, t, lang) { return [{ type: 'range', k: 'extra', label: t.extra, min: 5, max: 50, step: 5, show: function (v) { return usdk(v, lang); } }]; },
    render: function (s, t, lang) {
      var g = CHK.map(function (k) { return { k: k, g: resp(k, BASE[k] + s.extra) - resp(k, BASE[k]) }; }), best = g.slice().sort(function (a, b) { return b.g - a.g; })[0], worst = g.slice().sort(function (a, b) { return a.g - b.g; })[0];
      var rows = g.map(function (x) { return { label: T[lang]._ch[x.k] + ' (' + t.now + ' ' + usdk(BASE[x.k], lang) + ')', v: x.g, color: x.k === best.k ? COL.green : COL.cyan }; });
      return hbars(rows, best.g, function (v) { return '+' + num(v, lang, 1); }) + take(fill(t.tk, { extra: usdk(s.extra, lang), best: T[lang]._ch[best.k], g: num(best.g, lang), worst: T[lang]._ch[worst.k], w: num(worst.g, lang) }));
    }
  };

  // ===== 8. sandbox (node 3) =====
  T.en.sandbox = { _title: 'Budget sandbox: move money, see enrollments', _intro: 'A fixed $100k monthly budget across four channels. Drag the mix, or ask for the best split.', best: 'Suggest the best split', reset: 'Back to the current split', floor: 'Keep at least 10% in every channel', share: 'share', spend: 'spend', enr: 'enrollments', cur: 'Current split', scen: 'Your scenario', range: 'Likely range', d: 'vs. current', tk: 'Your scenario brings about {s} enrollments ({d} vs. current), likely between {lo} and {hi}. Treat the range as seriously as the number.', tkBest: 'The suggested split brings about {s} enrollments ({d} vs. current): it equalises the return of the last dollar in every channel.' };
  T.es.sandbox = { _title: 'Laboratorio de presupuesto: mueva dinero y vea matrículas', _intro: 'Un presupuesto mensual fijo de $100k entre cuatro canales. Arrastre la mezcla, o pida el mejor reparto.', best: 'Sugerir el mejor reparto', reset: 'Volver al reparto actual', floor: 'Mantener al menos 10 % en cada canal', share: 'participación', spend: 'inversión', enr: 'matrículas', cur: 'Reparto actual', scen: 'Su escenario', range: 'Rango probable', d: 'frente al actual', tk: 'Su escenario trae unas {s} matrículas ({d} frente al actual), probablemente entre {lo} y {hi}. Tome el rango tan en serio como el número.', tkBest: 'El reparto sugerido trae unas {s} matrículas ({d} frente al actual): iguala el retorno del último dólar en todos los canales.' };
  var CURMIX = [65, 20, 10, 5];
  W.sandbox = {
    defaults: { w: CURMIX.slice(), floor: false, best: false },
    controls: function (s, t, lang) {
      var tot = sum(s.w) || 1;
      var c = CHK.map(function (k, i) { return { type: 'range', k: 'w' + i, get: function () { return s.w[i]; }, label: T[lang]._ch[k], min: 0, max: 100, step: 5, show: function () { return Math.round(100 * s.w[i] / tot) + '% · ' + usdk(100 * s.w[i] / tot, lang); } }; });
      c.push({ type: 'check', k: 'floor', label: t.floor }, { type: 'button', act: 'best', label: t.best }, { type: 'button', act: 'reset', label: t.reset });
      return c;
    },
    actions: {
      best: function (s) { s.w = optimize(100, s.floor ? 10 : 0).map(function (v) { return Math.round(v); }); s.best = true; },
      reset: function (s) { s.w = CURMIX.slice(); s.best = false; }
    },
    setRange: function (s, k, v) { var i = +k.slice(1); s.w[i] = v; s.best = false; },
    render: function (s, t, lang) {
      var tot = sum(s.w) || 1, spend = s.w.map(function (x) { return 100 * x / tot; });
      var e = total(spend), base = total(CURMIX), lo = e * 0.85, hi = e * 1.15, dlt = e - base;
      var rows = CHK.map(function (k, i) { return { label: T[lang]._ch[k], v: spend[i], color: COL.ind }; });
      var ds = (dlt >= 0 ? '+' : '') + num(dlt, lang, 1);
      return hbars(rows, 100, function (v) { return usdk(v, lang); }) + tiles([{ l: t.cur, v: num(base, lang) }, { l: t.scen, v: num(e, lang), c: dlt > 0.5 ? COL.green : dlt < -0.5 ? COL.red : COL.ink }, { l: t.range, v: num(lo, lang) + ' – ' + num(hi, lang) }]) +
        take(fill(s.best ? t.tkBest : t.tk, { s: num(e, lang), d: ds, lo: num(lo, lang), hi: num(hi, lang) }));
    }
  };

  // ===== 9. cut (node 3) =====
  T.en.cut = { _title: 'If the budget is cut, where does it hurt least?', _intro: 'Cut the same $100k budget. Compare cutting everything evenly with cutting where the last dollar returns least.', cut: 'Budget cut', base: 'Current budget', even: 'Even cut', smart: 'Cut by marginal return', lost: 'enrollments lost', tk: 'An even cut loses about {a} enrollments; cutting where the last dollar returns least loses {b}. That is {p}% less damage for the same savings.', none: 'No cut, no loss. Slide the budget cut up.' };
  T.es.cut = { _title: 'Si se recorta el presupuesto, ¿dónde duele menos?', _intro: 'Recorte el mismo presupuesto de $100k. Compare recortar todo por igual con recortar donde el último dólar rinde menos.', cut: 'Recorte del presupuesto', base: 'Presupuesto actual', even: 'Recorte parejo', smart: 'Recorte según retorno marginal', lost: 'matrículas perdidas', tk: 'Un recorte parejo pierde unas {a} matrículas; recortar donde el último dólar rinde menos pierde {b}. Es {p} % menos daño por el mismo ahorro.', none: 'Sin recorte no hay pérdida. Suba el recorte del presupuesto.' };
  W.cut = {
    defaults: { cut: 20 },
    controls: function (s, t) { return [{ type: 'range', k: 'cut', label: t.cut, min: 0, max: 40, step: 5, show: function (v) { return '-' + v + '%'; } }]; },
    render: function (s, t, lang) {
      var base = total(CURMIX), B = 100 * (1 - s.cut / 100);
      var even = total(CURMIX.map(function (x) { return x * (1 - s.cut / 100); })), smart = total(optimize(B, 0));
      var la = base - even, lb = base - smart;
      var rows = [{ label: t.even, v: la, color: COL.red }, { label: t.smart, v: lb, color: COL.green }];
      if (s.cut === 0) return take(esc(t.none));
      return hbars(rows, Math.max(la, lb, 1), function (v) { return '-' + num(v, lang, 1) + ' ' + t.lost; }) +
        take(fill(t.tk, { a: num(la, lang, 1), b: num(lb, lang, 1), p: num(la > 0 ? (la - lb) / la * 100 : 0, lang) }));
    }
  };

  // ===== 10. forecast (node 4) =====
  T.en.forecast = { _title: 'Will we reach the intake target?', _intro: 'Set the target and the budget (as a share of the plan). The forecast is a range, and the chance of hitting the target is the honest answer.', target: 'Intake target', bud: 'Budget vs. plan', exp: 'Expected enrollments', rng: '80% range', pr: 'Chance of reaching the target', x: 'Enrollments',
    tkRisk: 'With this budget the chance of reaching {target} is {p}%. About {need} of budget vs. plan gives an 80% chance.', tkOk: 'With this budget the chance of reaching {target} is {p}%: comfortable, with a range of {lo} to {hi}.', tkFar: 'Even at the top of the budget range the chance stays below 80%: the mix needs rethinking, not just more money.' };
  T.es.forecast = { _title: '¿Llegaremos a la meta de ingreso?', _intro: 'Defina la meta y el presupuesto (como proporción del plan). El pronóstico es un rango, y la probabilidad de llegar a la meta es la respuesta honesta.', target: 'Meta de ingreso', bud: 'Presupuesto frente al plan', exp: 'Matrículas esperadas', rng: 'Rango del 80 %', pr: 'Probabilidad de llegar a la meta', x: 'Matrículas',
    tkRisk: 'Con este presupuesto la probabilidad de llegar a {target} es {p} %. Con cerca de {need} del plan, la probabilidad sube a 80 %.', tkOk: 'Con este presupuesto la probabilidad de llegar a {target} es {p} %: cómoda, con un rango de {lo} a {hi}.', tkFar: 'Incluso en lo más alto del rango de presupuesto la probabilidad sigue por debajo de 80 %: hay que repensar la mezcla, no solo poner más dinero.' };
  function fcMean(b) { return 575 * (1 - Math.exp(-1.2 * b)) / (1 - Math.exp(-1.2)); }
  function fcSd(m) { return 0.07 * m; }
  W.forecast = {
    defaults: { target: 600, bud: 100 },
    controls: function (s, t, lang) {
      return [{ type: 'range', k: 'target', label: t.target, min: 400, max: 800, step: 10, show: function (v) { return num(v, lang); } },
        { type: 'range', k: 'bud', label: t.bud, min: 70, max: 150, step: 5, show: function (v) { return v + '%'; } }];
    },
    render: function (s, t, lang) {
      var m = fcMean(s.bud / 100), sd = fcSd(m), lo = m - 1.2816 * sd, hi = m + 1.2816 * sd, p = 1 - cdf((s.target - m) / sd);
      var need = null, b;
      for (b = s.bud; b <= 150; b += 1) { var mm = fcMean(b / 100); if (1 - cdf((s.target - mm) / fcSd(mm)) >= 0.8) { need = b; break; } }
      var f = frame({ lang: lang, xmin: 400, xmax: 800, ymin: 0, ymax: 1, xticks: 4, yticks: 1, xlabel: t.x, h: 120, yfmt: function () { return ''; } }), pts = [], x;
      for (x = 400; x <= 800; x += 8) pts.push([x, Math.exp(-0.5 * Math.pow((x - m) / sd, 2)) * 0.9]);
      var bandL = f.sx(Math.max(400, lo)).toFixed(1), bandW = (f.sx(Math.min(800, hi)) - f.sx(Math.max(400, lo))).toFixed(1);
      var inner = '<rect x="' + bandL + '" y="' + f.T + '" width="' + bandW + '" height="' + f.ih + '" fill="' + COL.ind + '" opacity="0.12"/>' + pathOf(pts, f, COL.ind, 2.5) +
        '<line x1="' + f.sx(s.target).toFixed(1) + '" x2="' + f.sx(s.target).toFixed(1) + '" y1="' + f.T + '" y2="' + f.bottom + '" stroke="' + COL.amber + '" stroke-width="2.5" stroke-dasharray="4 3"/>';
      var col = p >= 0.8 ? COL.green : p >= 0.5 ? COL.amber : COL.red, txt;
      if (p >= 0.8) txt = fill(t.tkOk, { target: num(s.target, lang), p: num(p * 100, lang), lo: num(lo, lang), hi: num(hi, lang) });
      else if (need === null) txt = t.tkFar;
      else txt = fill(t.tkRisk, { target: num(s.target, lang), p: num(p * 100, lang), need: need + '%' });
      return svg(f, inner, t._title) + tiles([{ l: t.exp, v: num(m, lang) }, { l: t.rng, v: num(lo, lang) + ' – ' + num(hi, lang) }, { l: t.pr, v: num(p * 100, lang) + '%', c: col }]) + take(txt);
    }
  };

  // ===== 11. warning (node 4) =====
  T.en.warning = { _title: 'Months of warning', _intro: 'As each month of results arrives, the forecast updates and its range narrows. Move through the cycle.', month: 'Month of the cycle', exp: 'Forecast', pr: 'Chance of the 600 target', left: 'Months left to adjust the mix', closed: 'window closed', x: 'Month', tk0: 'At month {m} the forecast already points to {f} and the chance of the target is {p}%. There are still {left} months to change the mix.', tk1: 'At month {m} the chance of the target is {p}%, but the window to adjust the mix has closed: the intake is mostly decided.', win: 'Mix can still change' };
  T.es.warning = { _title: 'Meses de anticipación', _intro: 'A medida que llega cada mes de resultados, el pronóstico se actualiza y su rango se estrecha. Avance por el ciclo.', month: 'Mes del ciclo', exp: 'Pronóstico', pr: 'Probabilidad de la meta de 600', left: 'Meses restantes para ajustar la mezcla', closed: 'ventana cerrada', x: 'Mes', tk0: 'En el mes {m} el pronóstico ya apunta a {f} y la probabilidad de la meta es {p} %. Aún quedan {left} meses para cambiar la mezcla.', tk1: 'En el mes {m} la probabilidad de la meta es {p} %, pero la ventana para ajustar la mezcla ya se cerró: el ingreso está casi decidido.', win: 'Aún se puede cambiar la mezcla' };
  function wState(m) { var mean = 575 + (548 - 575) * (m / 9), sd = 42 * (1 - m / 9) + 5; return { mean: mean, sd: sd, p: 1 - cdf((600 - mean) / sd) }; }
  W.warning = {
    defaults: { month: 3 },
    controls: function (s, t) { return [{ type: 'range', k: 'month', label: t.month, min: 0, max: 9, step: 1, show: function (v) { return String(v); } }]; },
    render: function (s, t, lang) {
      var f = frame({ lang: lang, xmax: 9, ymin: 450, ymax: 700, xticks: 9, yticks: 5, xlabel: t.x }), up = [], dn = [], mid = [], m;
      for (m = 0; m <= 9; m++) { var st = wState(m); up.push([m, st.mean + 1.2816 * st.sd]); dn.push([m, st.mean - 1.2816 * st.sd]); mid.push([m, st.mean]); }
      var poly = up.concat(dn.slice().reverse()).map(function (p) { return f.sx(p[0]).toFixed(1) + ',' + f.sy(p[1]).toFixed(1); }).join(' ');
      var cur = wState(s.month), left = Math.max(0, 6 - s.month);
      var inner = '<rect x="' + f.sx(0).toFixed(1) + '" y="' + f.T + '" width="' + (f.sx(6) - f.sx(0)).toFixed(1) + '" height="' + f.ih + '" fill="' + COL.green + '" opacity="0.07"/><text x="' + (f.sx(3)).toFixed(1) + '" y="' + (f.T + 11) + '" text-anchor="middle" class="vl">' + esc(t.win) + '</text>' +
        '<polygon points="' + poly + '" fill="' + COL.ind + '" opacity="0.14"/>' + pathOf(mid, f, COL.ind, 2.5) +
        '<line x1="' + f.L + '" x2="' + (f.L + f.iw) + '" y1="' + f.sy(600).toFixed(1) + '" y2="' + f.sy(600).toFixed(1) + '" stroke="' + COL.amber + '" stroke-width="2" stroke-dasharray="4 3"/>' +
        '<line x1="' + f.sx(s.month).toFixed(1) + '" x2="' + f.sx(s.month).toFixed(1) + '" y1="' + f.T + '" y2="' + f.bottom + '" stroke="' + COL.ink + '" stroke-width="1.5"/><circle cx="' + f.sx(s.month).toFixed(1) + '" cy="' + f.sy(cur.mean).toFixed(1) + '" r="5" fill="' + COL.ind + '"/>';
      var col = cur.p >= 0.5 ? COL.green : cur.p >= 0.2 ? COL.amber : COL.red;
      return svg(f, inner, t._title) + tiles([{ l: t.exp, v: num(cur.mean, lang) }, { l: t.pr, v: num(cur.p * 100, lang) + '%', c: col }, { l: t.left, v: left > 0 ? String(left) : t.closed }]) +
        take(left > 0 ? fill(t.tk0, { m: s.month, f: num(cur.mean, lang), p: num(cur.p * 100, lang), left: left }) : fill(t.tk1, { m: s.month, p: num(cur.p * 100, lang) }));
    }
  };

  // ===== 12. visibility (node 5) =====
  T.en.visibility = { _title: 'How much can click tracking see?', _intro: 'Of every 100 applications, how many can click-based tracking connect to a channel? A marketing mix model uses weekly totals, so it counts all 100.', off: 'Applications influenced by offline media', lim: 'Online visitors with tracking limited (browser / phone)', cons: 'Of the rest, share who consent', vis: 'Visible to click tracking', mmm: 'Counted by a mix model', seen: 'visible', hidden: 'not visible', tk: 'Click tracking sees about {v} of every 100 applications. The other {h} still happened and still had a cause. A mix model works on weekly totals, so none of them disappear.' };
  T.es.visibility = { _title: '¿Cuánto puede ver el rastreo por clics?', _intro: 'De cada 100 solicitudes, ¿cuántas puede conectar a un canal el rastreo por clics? Un modelo de mezcla usa totales semanales, así que cuenta las 100.', off: 'Solicitudes influidas por medios tradicionales', lim: 'Visitantes en línea con rastreo limitado (navegador / teléfono)', cons: 'Del resto, quienes dan su consentimiento', vis: 'Visibles para el rastreo por clics', mmm: 'Contadas por un modelo de mezcla', seen: 'visibles', hidden: 'no visibles', tk: 'El rastreo por clics ve unas {v} de cada 100 solicitudes. Las otras {h} también ocurrieron y también tuvieron una causa. Un modelo de mezcla trabaja con totales semanales, así que ninguna desaparece.' };
  W.visibility = {
    defaults: { off: 35, lim: 40, cons: 60 },
    controls: function (s, t) {
      return [{ type: 'range', k: 'off', label: t.off, min: 0, max: 80, step: 5, show: function (v) { return v + '%'; } },
        { type: 'range', k: 'lim', label: t.lim, min: 0, max: 90, step: 5, show: function (v) { return v + '%'; } },
        { type: 'range', k: 'cons', label: t.cons, min: 10, max: 100, step: 5, show: function (v) { return v + '%'; } }];
    },
    render: function (s, t, lang) {
      var v = 100 * (1 - s.off / 100) * (1 - s.lim / 100) * (s.cons / 100), n = Math.round(v), dots = '', i;
      for (i = 0; i < 100; i++) dots += '<i class="vdot' + (i < n ? ' on' : '') + '"></i>';
      return '<div class="vdots" role="img" aria-label="' + n + ' / 100">' + dots + '</div><div class="vleg"><span><i style="background:' + COL.ind + '"></i>' + esc(t.seen) + '</span><span><i style="background:#e2e8f0"></i>' + esc(t.hidden) + '</span></div>' +
        tiles([{ l: t.vis, v: n + ' / 100', c: COL.ind }, { l: t.mmm, v: '100 / 100', c: COL.green }]) + take(fill(t.tk, { v: n, h: 100 - n }));
    }
  };

  // ===== 13. needs (node 5) =====
  T.en.needs = { _title: 'What data does each method need?', _intro: 'Compare what each approach must collect to answer “which channels bring students?”.', m: 'Method', click: 'Click tracking', mmm: 'Marketing mix model', req: 'Required', opt: 'Optional', no: 'Not needed', personal: 'Personal-data types required',
    rows: ['Cookies or device IDs', 'Personal identifiers (email, phone)', 'A user-level trail of visits', 'Spend per channel, per week', 'Leads, applications and enrollments, per week', 'Calendar: intakes, holidays, events'], tkC: 'Click tracking needs {n} types of personal data to work, and still cannot see offline channels.', tkM: 'A marketing mix model needs {n} types of personal data. It works from weekly totals and the calendar.' };
  T.es.needs = { _title: '¿Qué datos necesita cada método?', _intro: 'Compare lo que debe recolectar cada enfoque para responder «¿qué canales traen estudiantes?».', m: 'Método', click: 'Rastreo por clics', mmm: 'Modelo de mezcla de marketing', req: 'Requerido', opt: 'Opcional', no: 'No se necesita', personal: 'Tipos de datos personales requeridos',
    rows: ['Cookies o identificadores de dispositivo', 'Identificadores personales (correo, teléfono)', 'Un rastro de visitas por usuario', 'Inversión por canal, por semana', 'Leads, solicitudes y matrículas, por semana', 'Calendario: ingresos, festivos, eventos'], tkC: 'El rastreo por clics necesita {n} tipos de datos personales para funcionar, y aun así no ve los canales tradicionales.', tkM: 'Un modelo de mezcla de marketing necesita {n} tipos de datos personales. Trabaja con totales semanales y el calendario.' };
  var NEEDS = { click: ['req', 'req', 'req', 'opt', 'req', 'no'], mmm: ['no', 'no', 'no', 'req', 'req', 'req'] };
  W.needs = {
    defaults: { m: 'click' },
    controls: function (s, t) { return [{ type: 'seg', k: 'm', label: t.m, opts: [{ v: 'click', l: t.click }, { v: 'mmm', l: t.mmm }] }]; },
    render: function (s, t, lang) {
      var st = NEEDS[s.m], sym = { req: '●', opt: '◐', no: '○' }, lab = { req: t.req, opt: t.opt, no: t.no }, n = st.slice(0, 3).filter(function (x) { return x === 'req'; }).length;
      var rows = t.rows.map(function (r, i) { return '<div class="vneed vneed-' + st[i] + '"><span class="vsym" aria-hidden="true">' + sym[st[i]] + '</span><span>' + esc(r) + '</span><em>' + esc(lab[st[i]]) + '</em></div>'; }).join('');
      return '<div class="vneeds">' + rows + '</div>' + tiles([{ l: t.personal, v: n + ' / 3', c: n ? COL.red : COL.green }]) + take(fill(s.m === 'click' ? t.tkC : t.tkM, { n: n }));
    }
  };

  // ===== 14. carryover (node 6) =====
  T.en.carryover = { _title: 'An ad runs in September. When does it enroll students?', _intro: 'Choose a channel and how long the campaign runs. The bars show how much of its effect is still working each week.', ch: 'Channel', len: 'Campaign length (weeks)', chs: { radio: 'Radio', billboard: 'Billboard', event: 'Open day', social: 'Social ad' }, x: 'Week from campaign start', after: 'Effect that arrives after the campaign ends', win: 'Effect still working when applications open', half: 'Weeks until the effect halves', winl: 'Applications open', tk: '{after}% of the effect arrives after the campaign has ended, and {win}% of the peak is still working when applications open at week 16. A report that compares each month’s spend to that month’s results misses it.', unit: 'wk' };
  T.es.carryover = { _title: 'Un anuncio sale en septiembre. ¿Cuándo matricula estudiantes?', _intro: 'Elija un canal y cuánto dura la campaña. Las barras muestran cuánto de su efecto sigue actuando cada semana.', ch: 'Canal', len: 'Duración de la campaña (semanas)', chs: { radio: 'Radio', billboard: 'Valla', event: 'Jornada de puertas abiertas', social: 'Anuncio en redes' }, x: 'Semana desde el inicio de la campaña', after: 'Efecto que llega después de terminar la campaña', win: 'Efecto que sigue activo cuando abren las solicitudes', half: 'Semanas hasta que el efecto se reduce a la mitad', winl: 'Abren solicitudes', tk: '{after} % del efecto llega después de terminada la campaña, y {win} % del máximo sigue actuando cuando abren las solicitudes en la semana 16. Un reporte que compara la inversión de cada mes con los resultados de ese mes no lo ve.', unit: 'sem' };
  var RET = { radio: 0.9, billboard: 0.93, event: 0.8, social: 0.75 };
  W.carryover = {
    defaults: { ch: 'radio', len: 4 },
    controls: function (s, t) { return [{ type: 'seg', k: 'ch', label: t.ch, opts: ['radio', 'billboard', 'event', 'social'].map(function (k) { return { v: k, l: t.chs[k] }; }) }, { type: 'range', k: 'len', label: t.len, min: 1, max: 10, step: 1, show: function (v) { return String(v); } }]; },
    render: function (s, t, lang) {
      var r = RET[s.ch], E = [], a = 0, w, peak = 0;
      for (w = 0; w < 40; w++) { a = a * r + (w < s.len ? 1 : 0); E.push(a); if (a > peak) peak = a; }
      var during = sum(E.slice(0, s.len)), tot = sum(E), after = (1 - during / tot) * 100, win = E[16] / peak * 100, half = Math.round(Math.log(0.5) / Math.log(r));
      var f = frame({ lang: lang, xmax: 40, ymin: 0, ymax: Math.ceil(peak), xticks: 4, yticks: 4, xlabel: t.x }), bars = '', bw = f.iw / 40 - 1;
      for (w = 0; w < 40; w++) bars += '<rect x="' + (f.sx(w) + 0.5).toFixed(1) + '" y="' + f.sy(E[w]).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + Math.max(0, f.bottom - f.sy(E[w])).toFixed(1) + '" fill="' + (w < s.len ? COL.ind : COL.cyan) + '" opacity="' + (w < s.len ? 1 : 0.7) + '"/>';
      var inner = bars + '<line x1="' + f.sx(16).toFixed(1) + '" x2="' + f.sx(16).toFixed(1) + '" y1="' + f.T + '" y2="' + f.bottom + '" stroke="' + COL.amber + '" stroke-width="2" stroke-dasharray="4 3"/><text x="' + (f.sx(16) + 4).toFixed(1) + '" y="' + (f.T + 10) + '" class="vl">' + esc(t.winl) + '</text>';
      return svg(f, inner, t._title) + tiles([{ l: t.after, v: num(after, lang) + '%', c: COL.cyan }, { l: t.win, v: num(win, lang) + '%', c: COL.amber }, { l: t.half, v: half + ' ' + t.unit }]) + take(fill(t.tk, { after: num(after, lang), win: num(win, lang) }));
    }
  };

  // ===== 15. season (node 6) =====
  T.en.season = { _title: 'Peak or channel effect?', _intro: 'Applications peak when the enrollment window opens, whatever you do. Add a digital push before it and compare how a simple report and a model give credit.', dig: 'Extra digital spend in the 6 weeks before', view: 'View', rep: 'Simple report', mod: 'Model', credit: 'Credit to digital', base: 'Normal level', seas: 'Seasonal peak', carry: 'Earlier awareness (radio)', digl: 'Digital push', wk: 'Week', tk: 'A simple report credits the digital push with {r} applications, everything above the normal level while it ran. The model credits it with {m}: most of the rise would have come anyway with the season and the earlier awareness.' };
  T.es.season = { _title: '¿Pico estacional o efecto del canal?', _intro: 'Las solicitudes alcanzan su pico cuando abre la matrícula, hagas lo que hagas. Sume un impulso digital antes y compare cómo reparten el crédito un reporte simple y un modelo.', dig: 'Inversión digital adicional en las 6 semanas previas', view: 'Vista', rep: 'Reporte simple', mod: 'Modelo', credit: 'Crédito a lo digital', base: 'Nivel normal', seas: 'Pico estacional', carry: 'Reconocimiento previo (radio)', digl: 'Impulso digital', wk: 'Semana', tk: 'Un reporte simple le atribuye al impulso digital {r} solicitudes, todo lo que supera el nivel normal mientras duró. El modelo le atribuye {m}: la mayor parte del aumento habría llegado igual con la temporada y el reconocimiento previo.' };
  function seasonData(dig) {
    var rows = [], w, D = 90 * (1 - Math.exp(-0.05 * dig)) / 6;
    for (w = 1; w <= 12; w++) rows.push({ w: w, S: 40 + 160 * Math.exp(-Math.pow(w - 9, 2) / (2 * 1.8 * 1.8)), R: 18, D: (w >= 4 && w <= 9) ? D : 0 });
    var off = (rows[0].S + rows[0].R + rows[1].S + rows[1].R + rows[2].S + rows[2].R) / 3;
    var win = rows.filter(function (r) { return r.w >= 4 && r.w <= 10; });
    return { rows: rows, off: off, report: sum(win.map(function (r) { return r.S + r.R + r.D - off; })), model: sum(win.map(function (r) { return r.D; })) };
  }
  W.season = {
    defaults: { dig: 15, view: 'rep' },
    controls: function (s, t, lang) { return [{ type: 'range', k: 'dig', label: t.dig, min: 0, max: 40, step: 5, show: function (v) { return usdk(v, lang); } }, { type: 'seg', k: 'view', label: t.view, opts: [{ v: 'rep', l: t.rep }, { v: 'mod', l: t.mod }] }]; },
    render: function (s, t, lang) {
      var d = seasonData(s.dig), f = frame({ lang: lang, xmin: 0.5, xmax: 12.5, ymin: 0, ymax: 300, xticks: 6, yticks: 3, xlabel: t.wk, xfmt: function (v) { return Math.round(v); } }), bars = '', bw = f.iw / 12 - 4;
      d.rows.forEach(function (r) {
        var x = f.sx(r.w) - bw / 2, y = f.bottom, parts = s.view === 'rep'
          ? [{ v: Math.min(d.off, r.S + r.R + r.D), c: '#cbd5e1' }, { v: Math.max(0, r.S + r.R + r.D - d.off), c: COL.ind }]
          : [{ v: r.S, c: '#cbd5e1' }, { v: r.R, c: COL.cyan }, { v: r.D, c: COL.ind }];
        parts.forEach(function (p) { var h = p.v / 300 * f.ih; y -= h; bars += '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + h.toFixed(1) + '" fill="' + p.c + '"/>'; });
      });
      var leg = s.view === 'rep' ? [[t.base, '#cbd5e1'], [t.credit, COL.ind]] : [[t.seas, '#cbd5e1'], [t.carry, COL.cyan], [t.digl, COL.ind]];
      return svg(f, bars, t._title) + '<div class="vleg">' + leg.map(function (l) { return '<span><i style="background:' + l[1] + '"></i>' + esc(l[0]) + '</span>'; }).join('') + '</div>' +
        tiles([{ l: t.rep + ': ' + t.credit, v: num(d.report, lang), c: COL.red }, { l: t.mod + ': ' + t.credit, v: num(d.model, lang), c: COL.green }]) + take(fill(t.tk, { r: num(d.report, lang), m: num(d.model, lang) }));
    }
  };

  // ---------- runtime ----------
  function stateOf(name) { return JSON.parse(JSON.stringify(W[name].defaults)); }
  function viewHtml(name, lang, s) { var w = W[name], t = T[lang][name]; return w.render(s, t, lang); }
  function mount(el) {
    var name = el.getAttribute('data-widget'), lang = el.getAttribute('data-lang') || 'en', w = W[name];
    if (!w || !T[lang] || !T[lang][name]) return;
    var t = T[lang][name], ui = T[lang]._ui, s = stateOf(name);
    if (w.setup) w.setup(s, el, lang);
    el.innerHTML = '<div class="viz-card"><div class="viz-head"><span class="viz-tag">' + esc(ui.tag) + '</span><h3>' + esc(t._title) + '</h3><p>' + esc(t._intro) + '</p></div><div class="viz-ctrls"></div><div class="viz-out" aria-live="polite"></div><p class="viz-note">' + esc(ui.illus) + '</p></div>';
    var ctrls = el.querySelector('.viz-ctrls'), out = el.querySelector('.viz-out');
    function drawCtrls() { ctrls.innerHTML = w.controls(s, t, lang).map(function (c) { return ctl(c, s); }).join(''); }
    function drawOut() { out.innerHTML = w.render(s, t, lang); }
    function drawAll() { drawCtrls(); drawOut(); }
    function act(target) {
      var a = target.getAttribute('data-act'), d = { k: target.getAttribute('data-k'), v: target.getAttribute('data-v'), i: target.getAttribute('data-i') };
      if (a === 'set') { var cur = w.defaults[d.k]; s[d.k] = typeof cur === 'number' ? +d.v : d.v; }
      else if (w.actions && w.actions[a]) w.actions[a](s, d);
      drawAll();
    }
    el.addEventListener('click', function (e) { var n = e.target.closest ? e.target.closest('[data-act]') : null; if (n && el.contains(n)) act(n); });
    el.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.getAttribute && e.target.getAttribute('data-act') && e.target.tagName !== 'BUTTON') { e.preventDefault(); act(e.target); } });
    el.addEventListener('input', function (e) {
      var k = e.target.getAttribute && e.target.getAttribute('data-k'); if (!k) return;
      if (e.target.type === 'checkbox') { s[k] = e.target.checked; if (name === 'sandbox') s.best = false; drawAll(); return; }
      var v = parseFloat(e.target.value);
      if (w.setRange) w.setRange(s, k, v); else s[k] = v;
      var spec = w.controls(s, t, lang).filter(function (c) { return c.k === k; })[0], o = e.target.parentNode.querySelector('output');
      if (spec && o) o.textContent = spec.show(v, s);
      if (name === 'sandbox') { var outs = ctrls.querySelectorAll('output'), specs = w.controls(s, t, lang).filter(function (c) { return c.type === 'range'; }); for (var i = 0; i < outs.length; i++) outs[i].textContent = specs[i].show(); }
      drawOut();
    });
    drawAll();
  }
  function mountAll() { var els = document.querySelectorAll('[data-widget]'), i; for (i = 0; i < els.length; i++) mount(els[i]); }

  var api = { W: W, T: T, CH: CH, optimize: optimize, total: total, preview: viewHtml, defaults: stateOf, mount: mount, mountAll: mountAll, names: Object.keys(W) };
  if (root) root.MinosViz = api;
  if (typeof document !== 'undefined' && document.addEventListener) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountAll); else mountAll();
  }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
