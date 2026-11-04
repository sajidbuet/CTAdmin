/* CTAdmin – settings drawer: open/close, Display and Sound (seat plan fields: seatplan.js, layouts.js) */
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

/* ---- restore ---- */
applyTheme();
applyScale(prefs.scale || '1');
setProjLayout(prefs.proj || 'auto');
