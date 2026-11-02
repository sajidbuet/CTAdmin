/* CTAdmin – audio cues & volume (c) Dr. Sajid Muhaimin Choudhury, MIT License */
const Snd = (() => {
  const $ = id => document.getElementById(id);
  const gong = $('gongStart'), endBell = $('endBell'), pleaseStop = $('pleaseStop'),
        fiveMinBell = $('fiveMinBell'), lastFive = $('lastFive'),
        lastMinute = $('lastminute'), tick = $('ticksound');
  const all = [gong, endBell, fiveMinBell, lastFive, lastMinute, pleaseStop, tick];
  const volIcon = $('volumeIcon'), volSlider = $('volumeSlider');
  let lastVolume = parseFloat(volSlider.value);

  const play = (a, then) => {
    a.currentTime = 0;
    a.play().catch(e => console.warn('Audio blocked:', e));
    if (then) a.addEventListener('ended', () => play(then), { once: true });
  };
  function refreshIcon() {
    const muted = parseFloat(volSlider.value) === 0;
    volIcon.classList.toggle('muted', muted);
    volIcon.textContent = muted ? '🔇' : '🔉';
  }
  function setVolume(v) {
    all.forEach(a => a.volume = v);
    if (v > 0) lastVolume = v;
    refreshIcon();
  }
  volSlider.addEventListener('input', e => setVolume(parseFloat(e.target.value)));
  volIcon.addEventListener('click', () => {
    volSlider.value = parseFloat(volSlider.value) > 0 ? 0 : lastVolume;
    volSlider.dispatchEvent(new Event('input'));
  });
  setVolume(lastVolume);

  return {
    start:      () => play(gong),
    fiveMin:    () => play(fiveMinBell, lastFive),
    lastMinute: () => play(lastMinute),
    end:        () => play(endBell, pleaseStop),
    tick:       () => play(tick),
  };
})();
