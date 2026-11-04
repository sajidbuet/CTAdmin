/* CTAdmin – view modes (setup / compact / projection), fullscreen, keyboard shortcuts, license dialog */

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

/* ---- keyboard shortcuts ---- */
function onShortcut(e) {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (document.querySelector('dialog[open]')) return;                 // dialogs handle their own keys (Esc closes)
  const t = e.target;
  if (t.matches('input, select, textarea, [contenteditable]')) return;
  const k = e.key;
  /* a keyboard user activating a focused control keeps the native Space/Enter behaviour */
  if ((k === ' ' || k === 'Enter') && t.matches('button, summary, a') && t.matches(':focus-visible')) return;
  if (k === 'Enter') return;
  const once = fn => { if (!e.repeat) fn(); };
  switch (k.length === 1 ? k.toLowerCase() : k) {
    case ' ':          once(playPause); if (t.matches('button')) t.blur(); break;
    case 'r':          once(requestReset); break;
    case 'm':          once(Snd.toggleMute); break;
    case 'f':          once(toggleFS); break;
    case 'p':          once(inProjection() ? exitProjection : enterProjection); break;
    case 'Escape':
      if (body.classList.contains('edit-seats')) setSeatEdit(false);
      else if (inProjection()) exitProjection();
      else return;
      break;
    case 'ArrowUp':    adjust(60);  break;
    case 'ArrowDown':  adjust(-60); break;
    case 'ArrowRight': adjust(30);  break;
    case 'ArrowLeft':  adjust(-30); break;
    default: return;
  }
  e.preventDefault();
}
document.addEventListener('keydown', onShortcut);

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
$id('mitLicenseLink').addEventListener('click', e => {
  e.preventDefault();
  $id('mitText').textContent = MIT_TEXT;
  mitModal.showModal();
});
$id('mitCloseBtn').addEventListener('click', () => mitModal.close());
mitModal.addEventListener('click', e => { if (e.target === mitModal) mitModal.close(); });

/* ---- restore saved view ---- */
setPanel('timer', !prefs.hide_timer);
setPanel('plan', !prefs.hide_plan);
setTab(prefs.tab === 'plan' ? 'plan' : 'timer');

/* deep link: index.html#project opens straight into projection (no fullscreen without a click) */
if (location.hash === '#project') { body.classList.add('mode-projection'); wake(); }
