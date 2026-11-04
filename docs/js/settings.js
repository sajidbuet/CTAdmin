/* CTAdmin – settings drawer: Display, Sound, Seat plan (+ custom layout, applied in Phase 3), shortcuts */
const drawer = $id('settingsDrawer');
let drawerOpener = null;

function openSettings(sectionId) {
  drawerOpener = document.activeElement;
  if (!drawer.open) drawer.showModal();
  if (sectionId) $id(sectionId).scrollIntoView({ block: 'start' });
}
const closeSettings = () => drawer.close();
drawer.addEventListener('close', () => { if (drawerOpener && drawerOpener.focus) drawerOpener.focus(); });
drawer.addEventListener('click', e => { if (e.target === drawer) closeSettings(); });   // backdrop click
$id('settingsGear').addEventListener('click', () => openSettings());
$id('planOptsBtn').addEventListener('click', () => openSettings('setPlan'));
$id('settingsClose').addEventListener('click', closeSettings);

/* ---- Display: theme ---- */
const mqDark = matchMedia('(prefers-color-scheme: dark)');
function applyTheme() {
  const t = prefs.theme || 'system';
  const dark = t === 'dark' || (t === 'system' && mqDark.matches);
  body.classList.toggle('dark-theme', dark);
  document.querySelector('meta[name=theme-color]').content = dark ? '#141011' : '#AC1F24';
  $id('themeSelect').value = t;
}
$id('themeSelect').addEventListener('change', e => { prefs.theme = e.target.value; savePrefs(); applyTheme(); });
mqDark.addEventListener('change', applyTheme);

/* ---- Display: interface size ---- */
function applyScale(v) {
  const s = ['0.9', '1', '1.15', '1.3'].includes(String(v)) ? String(v) : '1';
  document.documentElement.style.setProperty('--scale', s);
  $id('uiScale').value = s;
  prefs.scale = s; savePrefs();
}
$id('uiScale').addEventListener('change', e => applyScale(e.target.value));

/* ---- Display: projection layout ---- */
function setProjLayout(v) { body.dataset.proj = v; $id('projLayout').value = v; prefs.proj = v; savePrefs(); }
$id('projLayout').addEventListener('change', e => setProjLayout(e.target.value));

/* ---- Sound: cue toggles (volume, mute and pre-count are wired in audio.js / timer.js) ---- */
document.querySelectorAll('[data-cue]').forEach(cb => {
  cb.checked = prefs.cues[cb.dataset.cue] !== false;
  cb.addEventListener('change', () => { prefs.cues[cb.dataset.cue] = cb.checked; savePrefs(); });
});
$id('testSound').addEventListener('click', () => Snd.test());

/* ---- Seat plan: custom layout (stored only; the plan uses it from Phase 3) ---- */
const useCustom     = $id('useCustomSettings');
const customSection = $id('customSettings');
const inpStart = $id('customStartRoll'), inpCount = $id('customStudentCount'), inpLabel = $id('customSectionLabel'),
      inpRows  = $id('customSeatRows'),  inpCols  = $id('customSeatCols');
const fileLoadInput = $id('loadSettings');
const LS_KEY = 'ctadmin_customSettings';

const getSettingsObject = () => ({
  useCustom: useCustom.checked, startRoll: +inpStart.value, studentCount: +inpCount.value,
  sectionLabel: inpLabel.value, seatRows: +inpRows.value, seatCols: +inpCols.value,
});
function applySettingsObject(d) {
  useCustom.checked = !!d.useCustom;
  inpStart.value = d.startRoll    || inpStart.value;
  inpCount.value = d.studentCount || inpCount.value;
  inpLabel.value = d.sectionLabel || inpLabel.value;
  inpRows.value  = d.seatRows     || inpRows.value;
  inpCols.value  = d.seatCols     || inpCols.value;
  customSection.hidden = !useCustom.checked;
}
const saveSettingsToStorage = () => { try { localStorage.setItem(LS_KEY, JSON.stringify(getSettingsObject())); } catch { /* blocked */ } };
function loadSettingsFromStorage() {
  try { const raw = localStorage.getItem(LS_KEY); if (raw) applySettingsObject(JSON.parse(raw)); }
  catch { console.warn('Failed to read saved custom settings'); }
}
useCustom.addEventListener('change', () => { customSection.hidden = !useCustom.checked; saveSettingsToStorage(); });
[inpStart, inpCount, inpLabel, inpRows, inpCols].forEach(el => el.addEventListener('input', saveSettingsToStorage));

$id('saveSettings').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([JSON.stringify(getSettingsObject(), null, 2)], { type: 'application/json' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: 'ctadmin-settings.json' });
  a.click();
  URL.revokeObjectURL(url);
});
$id('loadSettingsBtn').addEventListener('click', () => fileLoadInput.click());
fileLoadInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try { applySettingsObject(JSON.parse(reader.result)); saveSettingsToStorage(); }
    catch { alert('Invalid settings file'); }
  };
  reader.readAsText(file);
  fileLoadInput.value = '';
});

/* ---- restore ---- */
applyTheme();
applyScale(prefs.scale || '1');
setProjLayout(prefs.proj || 'auto');
loadSettingsFromStorage();
