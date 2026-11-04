/* CTAdmin – exam-room safeguards: keep the screen awake during a test; warn when the browser blocks sound */
const TEST_ACTIVE = ['starting', 'running', 'paused'];
const testActive = () => TEST_ACTIVE.includes(timerStatus());

/* ---- Screen Wake Lock: no screen saver / display sleep while a test is in progress ---- */
let wakeLock = null, wakeBusy = false;
async function syncWakeLock() {
  if (!('wakeLock' in navigator) || wakeBusy) return;
  wakeBusy = true;
  try {
    if (testActive() && document.visibilityState === 'visible') {
      if (!wakeLock || wakeLock.released) wakeLock = await navigator.wakeLock.request('screen');
    } else if (!testActive() && wakeLock) {
      const w = wakeLock; wakeLock = null; await w.release();
    }
  } catch { wakeLock = null; }          // refused (battery saver, policy): nothing else to do
  wakeBusy = false;
}
document.addEventListener('timerstate', syncWakeLock);
document.addEventListener('visibilitychange', syncWakeLock);   // the browser drops the lock when the tab is hidden

/* ---- Blocked sound: browsers refuse audio until the page has been clicked. After a reload in the middle
   of a test nobody has clicked yet, so ask up front instead of silently missing the next cue. ---- */
const soundBanner = $id('soundBanner');
const neverClicked = () => navigator.userActivation && !navigator.userActivation.hasBeenActive;
const setSoundBanner = on => { soundBanner.hidden = !on; };
document.addEventListener('soundblocked', () => setSoundBanner(true));
document.addEventListener('timerstate', e => { if (TEST_ACTIVE.includes(e.detail) && neverClicked()) setSoundBanner(true); });
/* any click or key press (except Esc, which browsers don't count) unlocks audio */
document.addEventListener('pointerdown', () => setSoundBanner(false), true);
document.addEventListener('keydown', e => { if (e.key !== 'Escape') setSoundBanner(false); }, true);
$id('soundBannerBtn').addEventListener('click', () => setSoundBanner(false));
