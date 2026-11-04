/* CTAdmin – audio cues & volume (c) Dr. Sajid Muhaimin Choudhury, MIT License */
const Snd = (() => {
  const $ = id => document.getElementById(id);
  const gong = $('gongStart'), endBell = $('endBell'), pleaseStop = $('pleaseStop'),
        fiveMinBell = $('fiveMinBell'), lastFive = $('lastFive'),
        lastMinute = $('lastminute'), tick = $('ticksound');
  const all = [gong, endBell, fiveMinBell, lastFive, lastMinute, pleaseStop, tick];
  const volSlider = $('volumeSlider');
  const muteBtns = document.querySelectorAll('[data-mute]');

  prefs.cues = Object.assign({ start: true, five: true, one: true, end: true }, prefs.cues);
  let volume = Number.isFinite(prefs.volume) ? prefs.volume : 1;
  let lastVolume = volume > 0 ? volume : 1;

  const play = (a, then) => {
    a.currentTime = 0;
    a.play().catch(e => {
      if (e.name === 'NotAllowedError') document.dispatchEvent(new Event('soundblocked'));   // guard.js shows a banner
      else console.warn('Audio failed:', e);
    });
    if (then) a.addEventListener('ended', () => play(then), { once: true });
  };
  const cue = (name, a, then) => { if (prefs.cues[name]) play(a, then); };

  function setVolume(v) {
    volume = Math.min(1, Math.max(0, v));
    all.forEach(a => a.volume = volume);
    if (volume > 0) lastVolume = volume;
    prefs.volume = volume; savePrefs();
    const muted = volume === 0;
    volSlider.value = volume;
    muteBtns.forEach(b => {
      b.textContent = muted ? '🔇' : '🔉';
      b.setAttribute('aria-pressed', String(muted));
      b.classList.toggle('muted', muted);
    });
  }
  const toggleMute = () => setVolume(volume > 0 ? 0 : lastVolume);

  /* Spoken cues follow the interface language: audio/bn/<name>.mp3, falling back to English if missing. */
  function setVoiceLang() {
    document.querySelectorAll('audio[data-voice]').forEach(a => {
      const en = `audio/${a.dataset.voice}.mp3`, want = prefs.lang === 'bn' ? `audio/bn/${a.dataset.voice}.mp3` : en;
      if (a.getAttribute('src') === want) return;
      a.onerror = want === en ? null : () => { a.onerror = null; a.src = en; };
      a.src = want;
    });
  }
  document.addEventListener('langchange', setVoiceLang);
  setVoiceLang();

  volSlider.addEventListener('input', e => setVolume(parseFloat(e.target.value)));
  muteBtns.forEach(b => b.addEventListener('click', toggleMute));
  setVolume(volume);

  return {
    start:      () => cue('start', gong),
    fiveMin:    () => cue('five', fiveMinBell, lastFive),
    lastMinute: () => cue('one', lastMinute),
    end:        () => cue('end', endBell, pleaseStop),
    tick:       () => play(tick),
    test:       () => play(gong),
    toggleMute,
  };
})();
