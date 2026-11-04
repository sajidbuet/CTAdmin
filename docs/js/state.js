/* CTAdmin – shared helpers and persisted preferences (loaded first) */
const $id = id => document.getElementById(id);
const body = document.body;

/* One preferences object in localStorage. Timer run-state lives separately in 'ct_timerState'. */
const PREFS_KEY = 'ct_prefs';
const prefs = (() => { try { return JSON.parse(localStorage.getItem(PREFS_KEY)) || {}; } catch { return {}; } })();
const savePrefs = () => { try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch { /* storage blocked */ } };

/* migrate Phase 1 theme flag */
if (prefs.theme === undefined && prefs.dark !== undefined) { prefs.theme = prefs.dark ? 'dark' : 'light'; delete prefs.dark; savePrefs(); }
