/* CTAdmin – view modes (setup / compact / projection), theme, fullscreen, shortcuts, modals */
const $id = id => document.getElementById(id);
const body = document.body;

/* ---- persisted preferences ---- */
const PREFS_KEY = 'ct_prefs';
const prefs = (() => { try { return JSON.parse(localStorage.getItem(PREFS_KEY)) || {}; } catch { return {}; } })();
const savePrefs = () => { try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch { /* storage blocked */ } };

/* ---- panel visibility (setup mode) ---- */
function setPanel(which, visible) {          // which: 'timer' | 'plan'
  body.classList.toggle('hide-' + which, !visible);
  $id(which === 'timer' ? 'toggleTimerBtn' : 'togglePlanBtn').setAttribute('aria-pressed', String(visible));
  prefs['hide_' + which] = !visible; savePrefs();
}
$id('toggleTimerBtn').onclick = () => setPanel('timer', body.classList.contains('hide-timer'));
$id('togglePlanBtn').onclick  = () => setPanel('plan',  body.classList.contains('hide-plan'));

/* ---- phone tabs ---- */
function setTab(t) {
  body.dataset.tab = t;
  $id('tabTimer').classList.toggle('active', t === 'timer');
  $id('tabPlan').classList.toggle('active', t === 'plan');
  prefs.tab = t; savePrefs();
}
$id('tabTimer').onclick = () => setTab('timer');
$id('tabPlan').onclick  = () => setTab('plan');

/* ---- theme ---- */
function setTheme(dark) {
  body.classList.toggle('dark-theme', dark);
  $id('themeToggle').querySelector('.ico').textContent = dark ? '☀️' : '🌙';
  document.querySelector('meta[name=theme-color]').content = dark ? '#141011' : '#AC1F24';
  prefs.dark = dark; savePrefs();
}
$id('themeToggle').onclick = () => setTheme(!body.classList.contains('dark-theme'));

/* ---- fullscreen ---- */
const isFS = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
const enterFS = () => {
  const el = document.documentElement, f = el.requestFullscreen || el.webkitRequestFullscreen;
  return f ? Promise.resolve(f.call(el)).catch(() => {}) : Promise.resolve();
};
const exitFS = () => {
  const f = document.exitFullscreen || document.webkitExitFullscreen;
  return f ? Promise.resolve(f.call(document)).catch(() => {}) : Promise.resolve();
};
const toggleFS = () => (isFS() ? exitFS() : enterFS());
$id('fsToggle').onclick = toggleFS;

/* ---- projection mode ---- */
let projectionOwnsFS = false, idleTimer = null;
const inProjection = () => body.classList.contains('mode-projection');

function wake() {
  body.classList.remove('idle');
  clearTimeout(idleTimer);
  if (inProjection()) idleTimer = setTimeout(() => body.classList.add('idle'), 3000);
}
['pointermove', 'pointerdown', 'keydown', 'touchstart'].forEach(ev =>
  document.addEventListener(ev, wake, { passive: true }));

async function enterProjection() {
  body.classList.add('mode-projection');
  if (!isFS()) { await enterFS(); projectionOwnsFS = isFS(); }
  wake();
}
async function exitProjection() {
  body.classList.remove('mode-projection', 'idle');
  clearTimeout(idleTimer);
  if (projectionOwnsFS && isFS()) await exitFS();
  projectionOwnsFS = false;
}
$id('projBtn').onclick = enterProjection;
$id('projExit').onclick = exitProjection;
['fullscreenchange', 'webkitfullscreenchange'].forEach(ev => document.addEventListener(ev, () => {
  const fs = isFS();
  $id('fsToggle').querySelector('.ico').textContent = fs ? '🗗' : '⛶';
  if (!fs && inProjection() && projectionOwnsFS) exitProjection();   // Esc left fullscreen
}));

/* projection layout choice (Settings) */
function setProjLayout(v) { body.dataset.proj = v; $id('projLayout').value = v; prefs.proj = v; savePrefs(); }
$id('projLayout').onchange = e => setProjLayout(e.target.value);

/* projection controls mirror timer state */
function playPressed() {
  if (running || (remain > 0 && remain < initialDuration)) pauseTimer();   // pause / resume
  else startWithPrecount();
}
$id('projPlay').onclick = playPressed;
$id('projReset').onclick = resetTimer;
$id('projMute').onclick = () => $id('volumeIcon').click();
$id('volumeSlider').addEventListener('input', () => { $id('projMute').textContent = $id('volumeIcon').textContent; });
document.addEventListener('timerstate', () => {
  $id('projPlay').textContent = running ? '⏸' : '▶';
  $id('projReset').disabled = !running && remain === initialDuration;
});

/* ---- keyboard shortcuts ---- */
document.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey || e.target.matches('input, select, textarea')) return;
  const k = e.key.toLowerCase();
  if (k === 'p') (inProjection() ? exitProjection : enterProjection)();
  else if (k === 'f') toggleFS();
  else if (k === 'escape' && inProjection()) exitProjection();
  else if (e.code === 'Space' && inProjection()) { e.preventDefault(); playPressed(); }
});

/* ---- MIT license modal ---- */
const MIT_TEXT = `MIT License

Copyright (c) ${new Date().getFullYear()} Dr. Sajid Muhaimin Choudhury

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
`;
const mitModal = $id('mitModal');
$id('mitLicenseLink').addEventListener('click', () => {
  $id('mitText').textContent = MIT_TEXT;
  mitModal.style.display = 'flex';
});
$id('mitCloseBtn').addEventListener('click', () => mitModal.style.display = 'none');
mitModal.addEventListener('click', e => { if (e.target === mitModal) mitModal.style.display = 'none'; });

/* ---- restore saved view ---- */
setTheme(prefs.dark ?? matchMedia('(prefers-color-scheme: dark)').matches);
setPanel('timer', !prefs.hide_timer);
setPanel('plan', !prefs.hide_plan);
setTab(prefs.tab === 'plan' ? 'plan' : 'timer');
setProjLayout(prefs.proj || 'auto');

/* deep link: index.html#project opens straight into projection (no fullscreen without a click) */
if (location.hash === '#project') { body.classList.add('mode-projection'); wake(); }
