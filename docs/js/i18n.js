/* CTAdmin – languages and numerals (loaded right after state.js and the i18n/*.js dictionaries)

   Dictionaries are keyed by the English text, so English needs no file: I18N.bn['Start'] = 'শুরু'.
   t(key, vars)  translate + fill {placeholders}; numbers in vars get the chosen numerals.
   num(v)        digits → Bengali digits when Bengali numerals are in use.
   userLocale()  locale for dates/times (language + numbering system).
   Static HTML is translated by matching text nodes and title / aria-label / placeholder attributes
   against the dictionary; anything JS writes is translated by JS (re-run on the 'langchange' event).
   Plain JS files (not JSON) so index.html still works from file://. */
window.I18N = window.I18N || {};
const LANGS = ['en', 'bn'];
prefs.lang = LANGS.includes(prefs.lang) ? prefs.lang : 'en';
prefs.numerals = ['auto', 'latn', 'beng'].includes(prefs.numerals) ? prefs.numerals : 'auto';

const bengDigits = () => prefs.numerals === 'beng' || (prefs.numerals === 'auto' && prefs.lang === 'bn');
const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
const num = v => (bengDigits() ? String(v).replace(/[0-9]/g, d => BN_DIGITS[d]) : String(v));

function userLocale() {
  const base = prefs.lang === 'bn' ? 'bn-BD' : (navigator.language || 'en-GB');
  try { return new Intl.Locale(base, { numberingSystem: bengDigits() ? 'beng' : 'latn' }).toString(); }
  catch { return base; }
}

const norm = s => s.replace(/\s+/g, ' ').trim();
function t(key, vars) {
  const dict = I18N[prefs.lang];
  let s = (dict && dict[key]) ?? key;
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? (typeof vars[k] === 'number' ? num(vars[k]) : String(vars[k])) : m));
  return s;
}

/* ---- static DOM ---- */
const I18N_ATTRS = ['title', 'aria-label', 'placeholder'];
const I18N_SKIP = 'script, style, kbd, #planHolder, #layoutSelect, #mitText, #pie, .brand svg, #langBtn';
let i18nEntries = null;   // [{ src: dictionary key, orig: original English, get, set, last: value we wrote }]

function collectI18n() {
  const known = I18N.bn || {};
  const out = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
    acceptNode: n => (n.nodeType === 1 && n.matches(I18N_SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  for (let n = walker.currentNode; n; n = walker.nextNode()) {
    if (n.nodeType === 3) {
      if (!(norm(n.nodeValue) in known)) continue;
      const [, lead, core, trail] = /^(\s*)([\s\S]*?)(\s*)$/.exec(n.nodeValue);
      out.push({ src: norm(core), orig: core, get: () => n.nodeValue, set: v => { n.nodeValue = lead + v + trail; return n.nodeValue; } });
    } else {
      for (const a of I18N_ATTRS) {
        const v = n.getAttribute(a);
        if (v && norm(v) in known) out.push({ src: norm(v), orig: v, get: () => n.getAttribute(a), set: v2 => { n.setAttribute(a, v2); return v2; } });
      }
    }
  }
  return out;
}

function applyStaticI18n() {
  i18nEntries = i18nEntries || collectI18n();
  for (const e of i18nEntries) {
    if (e.last !== undefined && e.get() !== e.last) continue;   // changed by JS since; its owner re-renders it
    e.last = e.set(prefs.lang === 'en' ? e.orig : t(e.src));
  }
  document.documentElement.lang = prefs.lang;
}

function setLang(l) {
  if (!LANGS.includes(l)) return;
  prefs.lang = l; savePrefs();
  applyStaticI18n();
  document.dispatchEvent(new Event('langchange'));
}
function setNumerals(v) {
  prefs.numerals = ['auto', 'latn', 'beng'].includes(v) ? v : 'auto'; savePrefs();
  document.dispatchEvent(new Event('langchange'));
}

applyStaticI18n();
