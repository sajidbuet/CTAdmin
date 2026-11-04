/* CTAdmin – layout editor (Settings → Seat plan): presets, fields, validation, import/export */
const LF = {
  name: $id('layoutName'), label: $id('layoutLabel'), startRoll: $id('layoutStart'), count: $id('layoutCount'),
  rows: $id('layoutRows'), cols: $id('layoutCols'), walkways: $id('layoutWalkways'),
  skipAlternate: $id('layoutSkip'), podium: $id('layoutPodium'),
};
const layoutForm = $id('layoutForm'), layoutStatus = $id('layoutStatus');

function readForm() {
  const v = {};
  for (const [k, el] of Object.entries(LF)) v[k] = el.type === 'checkbox' ? el.checked : el.value;
  v.blocked = currentLayout().blocked;
  return v;
}
function writeForm(L) {
  for (const [k, el] of Object.entries(LF)) {
    if (el.type === 'checkbox') el.checked = L[k];
    else el.value = k === 'walkways' ? L.walkways.join(', ') : L[k];
  }
}
function refreshEditor() {
  const L = currentLayout(), builtin = isBuiltin(prefs.layoutId);
  writeForm(L);
  layoutForm.disabled = builtin;
  $id('layoutNote').hidden = !builtin;
  $id('deleteLayoutBtn').disabled = builtin;
  showStatus(L);
}
function showStatus(L) {
  const cap = capacity(L), short = L.count - cap;
  layoutStatus.className = 'layout-status ' + (short > 0 ? 'err' : 'ok');
  layoutStatus.textContent = short > 0
    ? `${cap} seats for ${L.count} students: ${short} short. Add rows, seats per row, or unblock seats.`
    : `${cap} seats for ${L.count} students (${cap - L.count} spare)${L.blocked.length ? `, ${L.blocked.length} blocked` : ''}.`;
}

/* typing updates the plan live; leaving a field writes back the cleaned-up value */
layoutForm.addEventListener('input', () => {
  if (isBuiltin(prefs.layoutId)) return;
  saveLayout(prefs.layoutId, readForm());
  showStatus(currentLayout());
});
layoutForm.addEventListener('change', refreshEditor);

/* ---- preset actions ---- */
function addLayout(L, select = true) {
  const id = newLayoutId();
  prefs.layouts[id] = normalizeLayout(L); savePrefs();
  fillLayoutSelect();
  if (select) selectLayout(id);
  return id;
}
$id('newLayoutBtn').addEventListener('click', () => {
  addLayout({ name: 'New layout', label: 'Custom', startRoll: 1, count: 60, rows: 6, cols: 10, walkways: [5], podium: 'top' });
  LF.name.focus(); LF.name.select();
});
$id('dupLayoutBtn').addEventListener('click', () => {
  const L = currentLayout();
  addLayout({ ...L, name: `${L.name} (copy)` });
  LF.name.focus(); LF.name.select();
});
$id('deleteLayoutBtn').addEventListener('click', () => {
  const id = prefs.layoutId;
  if (isBuiltin(id) || !confirm(`Delete layout “${currentLayout().name}”?`)) return;
  delete prefs.layouts[id]; savePrefs();
  fillLayoutSelect();
  selectLayout('A');
});
$id('fitRowsBtn').addEventListener('click', () => {
  if (isBuiltin(prefs.layoutId)) return;
  const L = currentLayout();
  saveLayout(prefs.layoutId, { ...L, rows: rowsNeeded(L) });
  refreshEditor();
});
$id('editSeatsBtn').addEventListener('click', () => {
  if (isBuiltin(prefs.layoutId)) return;
  closeSettings();
  if (typeof setTab === 'function') setTab('plan');
  setSeatEdit(true);
  $id('planHolder').querySelector('[data-rc]')?.focus();
});
$id('clearBlockedBtn').addEventListener('click', () => {
  if (isBuiltin(prefs.layoutId)) return;
  saveLayout(prefs.layoutId, { ...currentLayout(), blocked: [] });
  refreshEditor();
});
document.addEventListener('layoutchange', refreshEditor);

/* ---- import / export (JSON) ---- */
$id('exportLayoutBtn').addEventListener('click', () => {
  const L = currentLayout();
  const data = { app: 'CTAdmin', version: 1, layout: L, fill: currentFill() };
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const fname = 'ctadmin-layout-' + (L.name.replace(/[^\w-]+/g, '_').replace(/^_+|_+$/g, '') || 'layout') + '.json';
  Object.assign(document.createElement('a'), { href: url, download: fname }).click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

/* accepts this app's export, a bare layout, an array / {layouts:[…]}, or the pre-Phase-3 custom-settings file */
function layoutsFromJSON(d) {
  const fromLegacy = o => ({
    name: o.sectionLabel ? `${o.sectionLabel} (imported)` : 'Imported layout', label: o.sectionLabel || '',
    startRoll: o.startRoll, count: o.studentCount, rows: o.seatRows, cols: o.seatCols,
  });
  const one = o => (o && typeof o === 'object' ? ('studentCount' in o || 'seatRows' in o ? fromLegacy(o) : o) : null);
  const list = Array.isArray(d) ? d : Array.isArray(d?.layouts) ? d.layouts : d?.layout ? [d.layout] : [d];
  return list.map(one).filter(Boolean);
}
const fileIn = $id('importLayoutFile');
$id('importLayoutBtn').addEventListener('click', () => fileIn.click());
fileIn.addEventListener('change', () => {
  const file = fileIn.files[0];
  fileIn.value = '';
  if (!file) return;
  file.text().then(txt => {
    const d = JSON.parse(txt), found = layoutsFromJSON(d);
    if (!found.length) throw new Error('no layouts');
    let lastId;
    found.forEach(L => { lastId = addLayout(L, false); });
    if (d?.fill) Object.entries({ startSide: d.fill.side, startRow: d.fill.start, pattern: d.fill.pattern }).forEach(([id, v]) => {
      const el = $id(id);
      if ([...el.options].some(o => o.value === v)) { el.value = v; prefs.plan[id] = v; }
    });
    savePrefs();
    selectLayout(lastId);
  }).catch(() => alert('This file is not a CTAdmin layout.'));
});

/* ---- one-time migration of the pre-Phase-3 "custom settings" ---- */
(() => {
  if (prefs.migratedCustom) return;
  prefs.migratedCustom = true; savePrefs();
  let old;
  try { old = JSON.parse(localStorage.getItem('ctadmin_customSettings')); } catch { return; }
  if (!old || !(old.studentCount && old.seatRows && old.seatCols)) return;
  const id = addLayout({ ...fromLegacyShape(old), name: 'Custom (from old settings)' }, false);
  if (old.useCustom) selectLayout(id);
  function fromLegacyShape(o) { return layoutsFromJSON(o)[0]; }
})();

refreshEditor();
