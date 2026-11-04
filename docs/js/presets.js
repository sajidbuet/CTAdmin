/* CTAdmin – timer presets: the quick buttons under the duration (Settings → Timer presets)
   preset = { min: minutes, label: short text or '' (shows the minutes), layout: layout id or '' (keep current) } */
const MAX_PRESETS = 6, DEFAULT_PRESETS = [10, 15, 20].map(min => ({ min, label: '', layout: '' }));
const cleanPreset = p => ({
  min: Math.min(MAX_DUR / 60, Math.max(MIN_DUR / 60, Math.round((Number(p?.min) || 10) * 2) / 2)),   // half-minute steps
  label: String(p?.label ?? '').trim().slice(0, 12),
  layout: typeof p?.layout === 'string' ? p.layout : '',
});
prefs.presets = Array.isArray(prefs.presets) ? prefs.presets.slice(0, MAX_PRESETS).map(cleanPreset) : DEFAULT_PRESETS.map(cleanPreset);
const layoutExists = id => !!id && (isBuiltin(id) || !!prefs.layouts[id]);
const layoutName = id => (isBuiltin(id) ? BUILTIN[id] : prefs.layouts[id])?.name ?? '';

/* ---- chips under the duration ---- */
const presetChips = $id('presetChips');
function renderPresetChips() {
  presetChips.innerHTML = prefs.presets.map((p, i) => {
    const sw = layoutExists(p.layout);
    const aria = (p.label ? t('{label}: set {n} minutes', { label: p.label, n: p.min }) : t('Set {n} minutes', { n: p.min })) +
                 (sw ? ' ' + t('and switch to layout {name}', { name: layoutName(p.layout) }) : '');
    return `<button type="button" class="btn chip" data-i="${i}" aria-label="${esc(aria)}" title="${esc(aria)}">${esc(p.label || num(p.min))}${sw ? ' 🪑' : ''}</button>`;
  }).join('');
  syncButtons();                 // disables them while a test is in progress
}
presetChips.addEventListener('click', e => {
  const b = e.target.closest('button[data-i]'), p = b && prefs.presets[+b.dataset.i];
  if (!p || b.disabled) return;
  setDuration(p.min * 60);
  if (layoutExists(p.layout) && p.layout !== prefs.layoutId) selectLayout(p.layout);
});

/* ---- editor ---- */
const presetList = $id('presetList');
function layoutOptions(sel) {
  const opt = (id, L) => `<option value="${esc(id)}"${id === sel ? ' selected' : ''}>${esc(L.name)}</option>`;
  return `<option value="" aria-label="${esc(t('Keep current layout'))}">—</option>` +
    Object.entries(BUILTIN).map(([id, L]) => opt(id, L)).join('') +
    Object.entries(prefs.layouts).sort((a, b) => a[1].name.localeCompare(b[1].name)).map(([id, L]) => opt(id, L)).join('');
}
function renderPresetEditor() {
  presetList.innerHTML = (prefs.presets.length ? `<div class="preset-row preset-head" aria-hidden="true">
      <span>${esc(t('Button label'))}</span><span>${esc(t('Minutes'))}</span><span>${esc(t('Switch layout'))}</span><span></span></div>` : '') +
    prefs.presets.map((p, i) => {
    const name = t('Preset {i}', { i: i + 1 });
    return `<div class="preset-row" role="group" aria-label="${esc(name)}" data-i="${i}">
      <input type="text" data-k="label" maxlength="12" value="${esc(p.label)}" placeholder="${esc(num(p.min))}" aria-label="${esc(name + ' – ' + t('Button label'))}">
      <input type="number" data-k="min" min="0.5" max="180" step="0.5" inputmode="decimal" value="${p.min}" aria-label="${esc(name + ' – ' + t('Minutes'))}">
      <select data-k="layout" aria-label="${esc(name + ' – ' + t('Switch layout'))}" title="${esc(t('Keep current layout'))}">${layoutOptions(layoutExists(p.layout) ? p.layout : '')}</select>
      <button type="button" class="btn tool icon" data-del aria-label="${esc(name + ' – ' + t('Delete preset'))}" title="${esc(t('Delete preset'))}">🗑</button>
    </div>`;
  }).join('');
  const full = prefs.presets.length >= MAX_PRESETS;
  $id('addPresetBtn').disabled = full;
  $id('addPresetBtn').title = full ? t('Up to {n} presets.', { n: MAX_PRESETS }) : '';
}
/* typing updates the chips live; leaving a field writes back the cleaned-up value */
presetList.addEventListener('input', e => {
  const row = e.target.closest('[data-i]'), k = e.target.dataset.k;
  if (!row || !k) return;
  if (k === 'min' && !(Number(e.target.value) > 0)) return;     // half-typed number
  const i = +row.dataset.i;
  prefs.presets[i] = cleanPreset({ ...prefs.presets[i], [k]: e.target.value });
  savePrefs(); renderPresetChips();
});
presetList.addEventListener('change', e => {
  const row = e.target.closest('[data-i]'), k = e.target.dataset.k;
  if (row && k && k !== 'layout') e.target.value = prefs.presets[+row.dataset.i][k];
  if (row && k === 'min') row.querySelector('[data-k=label]').placeholder = num(prefs.presets[+row.dataset.i].min);
});
presetList.addEventListener('click', e => {
  const del = e.target.closest('[data-del]');
  if (!del) return;
  prefs.presets.splice(+del.closest('[data-i]').dataset.i, 1);
  savePrefs(); renderAllPresets();
  (presetList.querySelector('[data-del]') || $id('addPresetBtn')).focus();
});
$id('addPresetBtn').addEventListener('click', () => {
  if (prefs.presets.length >= MAX_PRESETS) return;
  prefs.presets.push(cleanPreset({ min: duration / 60 }));      // starts from the current duration
  savePrefs(); renderAllPresets();
  presetList.querySelector('.preset-row:last-child input')?.focus();
});
$id('resetPresetsBtn').addEventListener('click', () => {
  prefs.presets = DEFAULT_PRESETS.map(cleanPreset);
  savePrefs(); renderAllPresets();
});

function renderAllPresets() { renderPresetChips(); renderPresetEditor(); }
/* layout names change with the language and when layouts are added, renamed or deleted */
['langchange', 'layoutchange'].forEach(ev => document.addEventListener(ev, renderAllPresets));
renderAllPresets();
savePrefs();
