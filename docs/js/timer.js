/* CTAdmin – countdown timer, clock, pre-count, persistence */
let duration = 1200, initialDuration = 1200, remain = 1200, endTime = null, running = false;

const precountToggle = document.getElementById('precountToggle');
const dateLbl = document.getElementById('dateTime'), endLbl = document.getElementById('endTime');
const durInput = document.getElementById('durationInput');
const durInc = document.getElementById('durInc'), durDec = document.getElementById('durDec');
const quickBtns = document.querySelectorAll('button.quick');
const startBtn = document.getElementById('startBtn'), pauseBtn = document.getElementById('pauseBtn'),
      resetBtn = document.getElementById('resetBtn');
const playBtn = document.getElementById('playBtn'), pauseBtn2 = document.getElementById('pauseBtn2'),
      stopBtn = document.getElementById('stopBtn');

const fmt = t => `${pad((t / 60) | 0)}:${pad(t % 60)}`;

function drawPie() {
  fill.style.strokeDashoffset = (FULL_LEN * (1 - remain / initialDuration)).toFixed(1);
  timeLabel_text.textContent = fmt(remain);
}
const updateEndLabel = () => {
  endLbl.textContent = endTime ? `Ends at ${endTime.toLocaleTimeString()}` : '_';
};

/* ---------- persistence ---------- */
const TIMER_KEY = 'ct_timerState';
const saveTimerState  = obj => localStorage.setItem(TIMER_KEY, JSON.stringify(obj));
const clearTimerState = () => localStorage.removeItem(TIMER_KEY);
function loadTimerState() { try { return JSON.parse(localStorage.getItem(TIMER_KEY)); } catch { return null; } }

function restoreTimer() {
  const st = loadTimerState();
  if (!st) return;
  if (st.status === 'running') {
    const rem = Math.max(0, Math.ceil((st.end - Date.now()) / 1000));
    if (rem > 0) {
      duration = initialDuration = st.initial || rem;
      remain = rem;
      endTime = new Date(Date.now() + rem * 1000);
      running = true;
      lockDurationControls(true);
      startBtn.disabled = true; pauseBtn.disabled = false; resetBtn.disabled = false;
    } else clearTimerState();
  } else if (st.status === 'paused') {
    duration = initialDuration = st.initial || st.remaining;
    remain = st.remaining;
    running = false;
    pauseBtn.textContent = 'Resume';
    resetBtn.disabled = false;
  }
  updateEndLabel(); drawPie(); updateQuickControls();
}

/* ---------- controls ---------- */
async function startWithPrecount() {
  if (running) return;
  if (precountToggle.checked) {
    timeLabel_text.style.visibility = 'hidden';
    await runPrecount();
    timeLabel_text.style.visibility = '';
  }
  startTimer();
}

function startTimer() {
  if (running) return;
  duration = (+durInput.value || 10) * 60;
  initialDuration = remain = duration;
  endTime = new Date(Date.now() + remain * 1000);
  updateEndLabel();
  saveTimerState({ status: 'running', end: endTime.getTime(), initial: initialDuration });
  running = true;
  startBtn.disabled = true; pauseBtn.disabled = false; resetBtn.disabled = false;
  pie.classList.remove('shake');
  drawPie();
  Snd.start();
  lockDurationControls(true);
  updateQuickControls();
}

function pauseTimer() {
  if (!running) {                       // resume
    if (remain <= 0) return;
    endTime = new Date(Date.now() + remain * 1000);
    running = true; pauseBtn.textContent = 'Pause';
    saveTimerState({ status: 'running', end: endTime.getTime(), initial: initialDuration });
  } else {                              // pause
    running = false; pauseBtn.textContent = 'Resume';
    saveTimerState({ status: 'paused', remaining: remain, initial: initialDuration });
  }
  updateQuickControls();
}

function resetTimer() {
  running = false;
  clearTimerState();
  duration = (+durInput.value || 10) * 60;
  initialDuration = remain = duration;
  endTime = null; drawPie(); updateEndLabel();
  pie.classList.remove('shake');
  startBtn.disabled = false; pauseBtn.disabled = true; resetBtn.disabled = true;
  pauseBtn.textContent = 'Pause';
  lockDurationControls(false);
  updateQuickControls();
}

function adjust(sec) {
  if (running) {
    remain = Math.max(0, remain + sec);
    endTime = new Date(Date.now() + remain * 1000);
    saveTimerState({ status: 'running', end: endTime.getTime(), initial: initialDuration });
  } else {
    duration = Math.max(0, duration + sec);
    initialDuration = remain = duration;
    durInput.value = Math.ceil(duration / 60);
  }
  updateEndLabel(); drawPie();
}

function finish() {
  running = false; remain = 0; drawPie(); updateEndLabel();
  clearTimerState();
  pie.classList.add('shake');
  startBtn.disabled = false; pauseBtn.disabled = true; resetBtn.disabled = false;
  pauseBtn.textContent = 'Pause';
  Snd.end();
  lockDurationControls(false);
  updateQuickControls();
}

function playWarningSounds() {
  if (remain === 300) Snd.fiveMin();
  if (remain === 60)  Snd.lastMinute();
}

/* ---------- 3-2-1 pre-count ---------- */
async function runPrecount() {
  const offsetLen = 3 * fill.getTotalLength();
  const styleTag = document.createElement('style');
  styleTag.textContent = `@keyframes fastFill { from { stroke-dashoffset: 0; } to { stroke-dashoffset: ${offsetLen}; } }`;
  document.head.appendChild(styleTag);
  fill.style.animation = 'fastFill 2.9s linear';
  timeLabel_text.setAttribute('display', 'none');
  precount_text.setAttribute('display', 'block');
  for (const n of [3, 2, 1]) {
    precount_text.textContent = n;
    Snd.tick();
    await new Promise(r => setTimeout(r, 1000));
  }
  fill.style.animation = '';
  precount_text.setAttribute('display', 'none');
  timeLabel_text.setAttribute('display', 'block');
  styleTag.remove();
}

/* ---------- master second tick (aligned to the real second) ---------- */
function tick() {
  const now = new Date();
  dateLbl.textContent = `${now.toLocaleDateString(undefined, { day: '2-digit', month: 'long', year: 'numeric' })} ${now.toLocaleTimeString()}`;
  if (running) {
    remain = Math.max(0, Math.ceil((endTime.getTime() - now.getTime()) / 1000));
    updateEndLabel(); drawPie();
    if (remain === 3 && precountToggle.checked) runPrecount();
    if (remain === 0) finish();
    playWarningSounds();
  }
  setTimeout(tick, 1000 - now.getMilliseconds());
}

/* ---------- duration inputs & quick controls ---------- */
function lockDurationControls(lock = true) {
  durInput.disabled = durInc.disabled = durDec.disabled = lock;
  quickBtns.forEach(b => b.disabled = lock);
}

function updateQuickControls() {
  playBtn.disabled = running;
  pauseBtn2.disabled = !running && remain === initialDuration;
  stopBtn.disabled = remain === initialDuration && !running;
  pauseBtn2.textContent = running ? '⏸︎' : '▶︎';
}

quickBtns.forEach(b => b.onclick = () => {
  durInput.value = b.dataset.min;
  timeLabel_text.textContent = fmt(b.dataset.min * 60);
  updateEndLabel();
});
document.querySelectorAll('button.adj').forEach(b => b.onclick = () => adjust(parseInt(b.dataset.sec, 10)));
durInc.addEventListener('click', () => { durInput.value = Math.max(1, parseInt(durInput.value, 10) + 1); resetTimer(); });
durDec.addEventListener('click', () => { durInput.value = Math.max(1, parseInt(durInput.value, 10) - 1); resetTimer(); });
durInput.addEventListener('change', () => { durInput.value = Math.max(1, parseInt(durInput.value, 10) || 1); resetTimer(); });

startBtn.onclick = playBtn.onclick = startWithPrecount;
pauseBtn.onclick = pauseBtn2.onclick = pauseTimer;
resetBtn.onclick = stopBtn.onclick = resetTimer;
