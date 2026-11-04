/* CTAdmin – countdown timer, clock, pre-count, persistence
   States: idle → (starting: pre-count) → running ⇄ paused → done.  `duration` is the configured length;
   `initialDuration` is the full length of the current run (grows if time is added). */
const MIN_DUR = 30, MAX_DUR = 180 * 60;
const clampDur = s => Math.min(MAX_DUR, Math.max(MIN_DUR, Math.round(s)));

let duration = clampDur(prefs.duration || 1200), initialDuration = duration, remain = duration,
    endTime = null, running = false, paused = false, starting = false, resetArmed = null;

const precountToggle = $id('precountToggle');
const dateLbl = $id('dateTime'), endLbl = $id('endTime');
const durInput = $id('durationInput'), durInc = $id('durInc'), durDec = $id('durDec');
const quickBtns = document.querySelectorAll('button.quick');
const playBtns  = document.querySelectorAll('[data-action="play"]');
const resetBtns = document.querySelectorAll('[data-action="reset"]');
const srStatus  = $id('srStatus');

const fmt = sec => num(`${pad((sec / 60) | 0)}:${pad(sec % 60)}`);
const timerStatus = () => running ? 'running' : paused ? 'paused' : starting ? 'starting' : remain === 0 ? 'done' : 'idle';

function drawPie() {
  fill.style.strokeDashoffset = (FULL_LEN * (1 - remain / initialDuration)).toFixed(1);
  timeLabel_text.textContent = fmt(remain);
  pie.setAttribute('aria-label', t('Time remaining {time}', { time: fmt(remain) }));
}
function updateEndLabel() {
  const st = timerStatus(), at = () => endTime.toLocaleTimeString(userLocale());
  endLbl.textContent =
    st === 'paused'  ? t('Paused') :
    st === 'done'    ? t('Ended at {time}', { time: endTime ? at() : '' }) :
    endTime          ? t('Ends at {time}', { time: at() }) : ' ';
}

/* ---------- persistence ---------- */
const TIMER_KEY = 'ct_timerState';
const saveTimerState  = obj => { try { localStorage.setItem(TIMER_KEY, JSON.stringify(obj)); } catch { /* blocked */ } };
const clearTimerState = () => { try { localStorage.removeItem(TIMER_KEY); } catch { /* blocked */ } };
function loadTimerState() { try { return JSON.parse(localStorage.getItem(TIMER_KEY)); } catch { return null; } }
const saveRunning = () => saveTimerState({ status: 'running', end: endTime.getTime(), initial: initialDuration });
const savePaused  = () => saveTimerState({ status: 'paused', remaining: remain, initial: initialDuration });

function restoreTimer() {
  const st = loadTimerState();
  if (st && st.status === 'running') {
    const rem = Math.max(0, Math.ceil((st.end - Date.now()) / 1000));
    if (rem > 0) {
      initialDuration = Math.max(st.initial || rem, rem);
      remain = rem;
      endTime = new Date(Date.now() + rem * 1000);
      running = true;
    } else clearTimerState();
  } else if (st && st.status === 'paused' && st.remaining > 0) {
    initialDuration = Math.max(st.initial || st.remaining, st.remaining);
    remain = st.remaining;
    paused = true;
  }
  durInput.value = +(duration / 60).toFixed(2);
  updateEndLabel(); drawPie(); syncButtons();
}

/* ---------- duration (only while idle / done) ---------- */
function setDuration(sec) {
  if (running || paused || starting) return;
  duration = initialDuration = remain = clampDur(sec);
  durInput.value = +(duration / 60).toFixed(2);
  prefs.duration = duration; savePrefs();
  endTime = null;
  pie.classList.remove('shake');
  updateEndLabel(); drawPie(); syncButtons();
}

/* +/- time: changes the running/paused countdown, or the configured duration when idle */
function adjust(sec) {
  if (running) {
    remain = Math.min(MAX_DUR, Math.max(1, remain + sec));
    initialDuration = Math.max(initialDuration, remain);
    endTime = new Date(Date.now() + remain * 1000);
    saveRunning();
  } else if (paused) {
    remain = Math.min(MAX_DUR, Math.max(1, remain + sec));
    initialDuration = Math.max(initialDuration, remain);
    savePaused();
  } else if (!starting) {
    return setDuration(duration + sec);
  }
  updateEndLabel(); drawPie();
}

/* ---------- run controls ---------- */
async function startTimer() {
  if (running || paused || starting) return;
  starting = true; syncButtons();
  if (precountToggle.checked) await runPrecount();
  starting = false;
  initialDuration = remain = duration;
  endTime = new Date(Date.now() + remain * 1000);
  running = true;
  saveRunning();
  pie.classList.remove('shake');
  updateEndLabel(); drawPie(); syncButtons();
  Snd.start();
}

function togglePause() {
  if (running) {
    running = false; paused = true;
    savePaused();
  } else if (paused) {
    endTime = new Date(Date.now() + remain * 1000);
    running = true; paused = false;
    saveRunning();
  }
  updateEndLabel(); syncButtons();
}

const playPause = () => (running || paused ? togglePause() : startTimer());

/* Reset while a test is in progress needs a second press within 3 s. */
function requestReset() {
  if (starting) return;
  if ((!running && !paused) || resetArmed) return resetTimer();
  resetArmed = setTimeout(() => { resetArmed = null; syncButtons(); }, 3000);
  syncButtons();
}

function resetTimer() {
  clearTimeout(resetArmed); resetArmed = null;
  running = paused = false;
  clearTimerState();
  initialDuration = remain = duration;
  endTime = null;
  pie.classList.remove('shake');
  drawPie(); updateEndLabel(); syncButtons();
}

function finish() {
  running = paused = false; remain = 0;
  clearTimeout(resetArmed); resetArmed = null;
  clearTimerState();
  drawPie(); updateEndLabel();
  pie.classList.add('shake');
  syncButtons();
  Snd.end();
}

/* Cues fire when a tick crosses the mark, not only when it lands on it: a late tick (busy or background
   tab) can jump from 5:01 to 4:59. `crossed(s)` is true when the previous tick was above s and this one is at/below. */
function playWarningSounds(crossed) {
  if (crossed(300)) Snd.fiveMin();
  if (crossed(60))  Snd.lastMinute();
}

/* ---------- button state (main card + projection bar) ---------- */
const PLAY_UI = {
  idle:     ['▶', 'Start',  'go'],
  starting: ['▶', 'Starting…', 'go'],
  running:  ['⏸', 'Pause',  'warn'],
  paused:   ['▶', 'Resume', 'go'],
  done:     ['▶', 'Restart', 'go'],
};
const STATUS_TEXT = { idle: 'Timer ready', starting: 'Starting', running: 'Timer running', paused: 'Timer paused', done: 'Time is up' };  // translated when shown
let lastStatus = null;

function syncButtons() {
  const st = timerStatus();
  body.dataset.timer = st;
  const [ico, key, cls] = PLAY_UI[st], lbl = t(key);
  playBtns.forEach(b => {
    b.querySelector('.ico').textContent = ico;
    b.querySelector('.lbl').textContent = lbl;
    b.classList.remove('go', 'warn'); b.classList.add(cls);
    b.disabled = st === 'starting';
    b.setAttribute('aria-label', t('{action} timer', { action: lbl }));
  });
  resetBtns.forEach(b => {
    b.disabled = st === 'idle' || st === 'starting';
    b.classList.toggle('armed', !!resetArmed);
    b.querySelector('.lbl').textContent = t(resetArmed ? 'Confirm?' : 'Reset');
    b.setAttribute('aria-label', t(resetArmed ? 'Press again to confirm reset' : 'Reset timer'));
  });
  const lock = st === 'running' || st === 'paused' || st === 'starting';
  durInput.disabled = durInc.disabled = durDec.disabled = lock;
  quickBtns.forEach(b => b.disabled = lock);
  if (st !== lastStatus) { srStatus.textContent = t(STATUS_TEXT[st]); lastStatus = st; }
}

/* ---------- 3-2-1 pre-count ---------- */
async function runPrecount(from = 3) {             // counts from..1 (shorter if the end count started late)
  const offsetLen = from * fill.getTotalLength();
  const styleTag = document.createElement('style');
  styleTag.textContent = `@keyframes fastFill { from { stroke-dashoffset: 0; } to { stroke-dashoffset: ${offsetLen}; } }`;
  document.head.appendChild(styleTag);
  fill.style.animation = `fastFill ${from - 0.1}s linear`;
  timeLabel_text.setAttribute('display', 'none');
  precount_text.setAttribute('display', 'block');
  for (let n = from; n >= 1; n--) {
    precount_text.textContent = num(n);
    Snd.tick();
    await new Promise(r => setTimeout(r, 1000));
  }
  fill.style.animation = '';
  precount_text.setAttribute('display', 'none');
  timeLabel_text.setAttribute('display', 'block');
  styleTag.remove();
}

/* ---------- master second tick (aligned to the real second) ---------- */
function showClock(now = new Date()) {
  const loc = userLocale();
  dateLbl.textContent = `${now.toLocaleDateString(loc, { day: '2-digit', month: 'long', year: 'numeric' })} ${now.toLocaleTimeString(loc)}`;
}
let prevRemain = null;                               // remaining seconds at the previous running tick
function tick() {
  const now = new Date();
  showClock(now);
  if (running) {
    const prev = prevRemain ?? remain;
    remain = Math.max(0, Math.ceil((endTime.getTime() - now.getTime()) / 1000));
    const crossed = s => prev > s && remain <= s;
    updateEndLabel(); drawPie();
    if (crossed(3) && remain > 0 && precountToggle.checked) runPrecount(remain);
    if (remain === 0) finish();
    playWarningSounds(crossed);
    prevRemain = running ? remain : null;
  } else prevRemain = null;
  setTimeout(tick, 1000 - now.getMilliseconds());
}

/* ---------- language: chip labels, and re-render everything above that shows text ---------- */
function labelChips() {
  quickBtns.forEach(b => { b.textContent = num(b.dataset.min); b.setAttribute('aria-label', t('Set {n} minutes', { n: +b.dataset.min })); });
  document.querySelectorAll('button.adj').forEach(b => {
    const sec = parseInt(b.dataset.sec, 10), sign = sec < 0 ? '−' : '+', a = Math.abs(sec);
    b.textContent = a % 60 ? t('{sign}{n} s', { sign, n: a }) : t('{sign}{n} min', { sign, n: a / 60 });
  });
}
labelChips();
document.addEventListener('langchange', () => {
  labelChips(); showClock(); drawPie(); updateEndLabel();
  lastStatus = null; syncButtons();
});

/* ---------- wiring ---------- */
quickBtns.forEach(b => b.addEventListener('click', () => setDuration(b.dataset.min * 60)));
document.querySelectorAll('button.adj').forEach(b => b.addEventListener('click', () => adjust(parseInt(b.dataset.sec, 10))));
durInc.addEventListener('click', () => setDuration(duration + 60));
durDec.addEventListener('click', () => setDuration(duration - 60));
durInput.addEventListener('change', () => setDuration((parseFloat(durInput.value) || duration / 60) * 60));
playBtns.forEach(b => b.addEventListener('click', playPause));
resetBtns.forEach(b => b.addEventListener('click', requestReset));

prefs.precount = prefs.precount ?? true;
precountToggle.checked = prefs.precount;
precountToggle.addEventListener('change', () => { prefs.precount = precountToggle.checked; savePrefs(); });
