/* CTAdmin – UI toggles: timer/plan visibility, fullscreen, theme, condense, maximize, license modal */
const $id = id => document.getElementById(id);
const planHolder = $id('planHolder');
const tog = $id('toggleTimerBtn');

/* ---- timer / plan visibility ---- */
tog.onclick = () => {
  const hide = timerBox.style.display !== 'none';
  timerBox.style.display = hide ? 'none' : 'block';
  tog.textContent = hide ? 'Show Timer' : 'Hide Timer';
};
$id('closeTimerBtn').onclick = () => { timerBox.style.display = 'none'; tog.textContent = 'Show Timer'; };

const togglePlanBtn = $id('togglePlanBtn');
let planVisible = true;
togglePlanBtn.addEventListener('click', () => {
  planVisible = !planVisible;
  planHolder.style.display = planVisible ? 'block' : 'none';
  togglePlanBtn.textContent = planVisible ? 'Hide Plan' : 'Show Plan';
});

/* ---- fullscreen ---- */
const fsBtn = $id('fsToggle');
const isFS = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
const enterFS = () => {
  const el = document.documentElement;
  return (el.requestFullscreen || el.webkitRequestFullscreen || (() => {})).call(el);
};
const exitFS = () => (document.exitFullscreen || document.webkitExitFullscreen || (() => {})).call(document);
function syncFsButton() {
  fsBtn.classList.toggle('fullscreen', isFS());
  fsBtn.textContent = isFS() ? '🗗 Exit Fullscreen' : '⛶ Fullscreen';
}
fsBtn.addEventListener('click', () => { isFS() ? exitFS() : enterFS(); });
['fullscreenchange', 'webkitfullscreenchange'].forEach(e => document.addEventListener(e, syncFsButton));

/* ---- theme ---- */
const themeBtn = $id('themeToggle');
themeBtn.addEventListener('click', () => {
  const dark = document.body.classList.toggle('dark-theme');
  themeBtn.textContent = dark ? '☀️ Light Mode' : '🌙 Dark Mode';
  themeBtn.classList.toggle('dark', dark);
});

/* ---- condensed UI (persisted) ---- */
const condenseBtn = $id('condenseBtn');
function setCondensed(on) {
  document.body.classList.toggle('condensed-ui', on);
  condenseBtn.textContent = on ? '🔍 Expand' : '🎛 Condense';
}
condenseBtn.addEventListener('click', () => {
  const on = !document.body.classList.contains('condensed-ui');
  setCondensed(on);
  localStorage.setItem('condensed', on);
});
setCondensed(localStorage.getItem('condensed') === 'true');

/* ---- maximize / restore timer ---- */
const maxBtn = $id('maxTimerBtn');
let prev = {};
maxBtn.addEventListener('click', async () => {
  if (!maxBtn.classList.contains('restoring')) {
    prev = {
      seatVisible: planHolder.style.display !== 'none',
      condensed: document.body.classList.contains('condensed-ui'),
      scale: scaleFactor, sizeKey: currentSize, isFS: isFS(),
    };
    planHolder.style.display = 'none';
    document.body.classList.add('condensed-ui');
    scaleFactor = 1.6;
    recomputeLarge();
    applyDialSize('large');
    if (!prev.isFS) await enterFS();
    maxBtn.textContent = '🗗';
    maxBtn.classList.add('restoring');
    timerBox.style.boxShadow = 'none';
  } else {
    planHolder.style.display = prev.seatVisible ? 'block' : 'none';
    document.body.classList.toggle('condensed-ui', prev.condensed);
    scaleFactor = prev.scale;
    recomputeLarge();
    applyDialSize(prev.sizeKey);
    if (!prev.isFS && isFS()) await exitFS();
    maxBtn.textContent = '⛶';
    maxBtn.classList.remove('restoring');
    timerBox.style.boxShadow = '';
  }
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
