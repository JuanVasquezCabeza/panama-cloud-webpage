// Renders every widget in both languages over many states and checks the output: node tools/test-widgets.mjs
// (no browser needed: render functions are pure). Catches NaN/undefined, unfilled {placeholders}, and checks key numbers.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { root } from './lib.mjs';

const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(readFileSync(join(root, 'assets', 'widgets.js'), 'utf8'), ctx);
const V = ctx.window.MinosViz;

const mapData = (lang) => ({
  reasons: [1, 2, 3, 4, 5, 6].map((n) => ({ n, title: `Reason ${n} ${lang}`, card: `Card ${n}`, url: `/${lang}/blog/x${n}/` })),
  links: [[1, 2], [2, 3], [3, 4], [5, 1], [6, 1], [6, 4]].map(([from, to]) => ({ from, to, text: `link ${from}-${to}` })),
});
let bad = 0, renders = 0;
const check = (label, html) => {
  renders++;
  if (/NaN|undefined|Infinity|null/.test(html.replace(/aria-label="[^"]*"/g, ''))) { bad++; console.log('PROBLEM bad value in', label, (html.match(/.{30}(NaN|undefined|Infinity|null).{30}/) || [''])[0]); }
  if (/\{\w+\}/.test(html)) { bad++; console.log('PROBLEM unfilled placeholder in', label, html.match(/\{\w+\}/)[0]); }
  if (!html.length && !label.endsWith('/controls')) { bad++; console.log('PROBLEM empty render', label); }
};
const variants = {
  readiness: [{ a: ['y', 'y', 'y', 'y', 'y'] }, { a: ['n', 'n', 'n', 'n', 'n'] }, { a: ['y', 'n', 'y', null, 'y'] }, { a: ['y', 'y', 'n', 'n', 'n'] }],
  value: [{ budget: 50, cpe: 5000, gain: 1, tuition: 1000, years: 1 }, { budget: 2000, cpe: 300, gain: 25, tuition: 15000, years: 12 }],
  attribution: ['last', 'first', 'linear', 'model'].map((rule) => ({ rule })),
  halo: [0, 50, 100].map((cut) => ({ cut })),
  saturation: ['social', 'search', 'radio', 'events'].flatMap((ch) => [0, 2, 30, 100].map((spend) => ({ ch, spend }))),
  extra_budget: [5, 20, 50].map((extra) => ({ extra })),
  sandbox: [{ w: [65, 20, 10, 5], floor: false, best: false }, { w: [0, 0, 0, 0], floor: false, best: false }, { w: [100, 0, 0, 0], floor: true, best: false }, { w: [10, 10, 10, 70], floor: false, best: true }],
  cut: [0, 5, 20, 40].map((cut) => ({ cut })),
  forecast: [{ target: 400, bud: 70 }, { target: 600, bud: 100 }, { target: 800, bud: 150 }, { target: 700, bud: 130 }],
  warning: [0, 3, 6, 9].map((month) => ({ month })),
  visibility: [{ off: 0, lim: 0, cons: 100 }, { off: 80, lim: 90, cons: 10 }, { off: 35, lim: 40, cons: 60 }],
  needs: [{ m: 'click' }, { m: 'mmm' }],
  carryover: ['radio', 'billboard', 'event', 'social'].flatMap((ch) => [1, 4, 10].map((len) => ({ ch, len }))),
  season: [0, 15, 40].flatMap((dig) => ['rep', 'mod'].map((view) => ({ dig, view }))),
};
for (const lang of ['en', 'es']) {
  for (const name of V.names) {
    const base = V.defaults(name);
    if (name === 'map') base.data = mapData(lang);
    const list = name === 'map' ? [1, 2, 3, 4, 5, 6].map((sel) => ({ sel, data: mapData(lang) })) : (variants[name] || []).map((v) => ({ ...base, ...v }));
    for (const st of [base, ...list]) check(`${name}/${lang}`, V.preview(name, lang, st));
    const w = V.W[name]; const t = V.T[lang][name];
    check(`${name}/${lang}/controls`, w.controls(base, t, lang).map((c) => JSON.stringify(c, (k, v) => (typeof v === 'function' ? v(...(c.k ? [base[c.k], base] : [])) : v))).join(''));
  }
}
// Interaction smoke test with a tiny fake DOM: mount each widget, click every button, move every slider.
function fakeEl(name, lang) {
  const handlers = {}, nodes = { ".viz-ctrls": { innerHTML: "", querySelectorAll: () => [] }, ".viz-out": { innerHTML: "" } };
  const el = {
    getAttribute: (k) => ({ "data-widget": name, "data-lang": lang, "data-json": name === "map" ? JSON.stringify(mapData(lang)) : null })[k],
    set innerHTML(v) { this._h = v; }, get innerHTML() { return this._h; },
    querySelector: (sel) => nodes[sel], contains: () => true,
    addEventListener: (t, fn) => { handlers[t] = fn; },
  };
  return { el, nodes, handlers };
}
for (const lang of ["en", "es"]) {
  for (const name of V.names) {
    const { el, nodes, handlers } = fakeEl(name, lang);
    try {
      V.mount(el);
      const ctrls = () => nodes[".viz-ctrls"].innerHTML + nodes[".viz-out"].innerHTML;
      const seen = new Set();
      for (let round = 0; round < 3; round++) {
        const html = ctrls();
        for (const m of html.matchAll(/<(?:button|g)[^>]*data-act="(\w+)"[^>]*>/g)) {
          const attr = (k) => (m[0].match(new RegExp(k + "=\"([^\"]*)\"")) || [])[1];
          const key = m[0]; if (seen.has(key)) continue; seen.add(key);
          handlers.click({ target: { closest: () => ({ getAttribute: (k) => attr("data-" + k.replace("data-", "")) }) } });
          check(name + "/" + lang + "/after click", ctrls());
        }
        for (const m of html.matchAll(/<input type="range" data-k="(\w+)" min="([\d.]+)" max="([\d.]+)" step="([\d.]+)"/g)) {
          for (const v of [m[2], m[3], (+m[2] + +m[3]) / 2]) {
            handlers.input({ target: { getAttribute: () => m[1], type: "range", value: String(v), parentNode: { querySelector: () => ({ textContent: "" }) } } });
            check(name + "/" + lang + "/after slider " + m[1] + "=" + v, ctrls());
          }
        }
        for (const m of html.matchAll(/<input type="checkbox" data-k="(\w+)"/g)) {
          handlers.input({ target: { getAttribute: () => m[1], type: "checkbox", checked: true } });
          check(name + "/" + lang + "/after checkbox", ctrls());
        }
      }
    } catch (e) { bad++; console.log("PROBLEM runtime error in", name, lang, e.message); }
  }
}
console.log("interaction smoke test done");

// Key numbers
const num = (html, re) => Number(html.match(re)[1].replace(/,/g, ''));
const sat = V.preview('saturation', 'en', { ch: 'social', spend: 40 });
console.log('social @40k:', sat.match(/Enrollments<\/span><b>(\d+)/)[1], 'enrollments (expected ~160)');
const best = V.optimize(100, 0).map((x) => Math.round(x)), cur = V.total([65, 20, 10, 5]), opt = V.total(V.optimize(100, 0));
console.log('optimal split $k', best.join('/'), `total ${opt.toFixed(1)} vs current ${cur.toFixed(1)}`);
if (!(opt > cur)) { bad++; console.log('PROBLEM optimizer is not better than the current split'); }
if (Math.abs(V.optimize(100, 10).reduce((a, b) => a + b, 0) - 100) > 0.01) { bad++; console.log('PROBLEM optimizer budget not conserved'); }
console.log(`${renders} renders checked, ${bad} problems`);
process.exit(bad ? 1 : 0);
