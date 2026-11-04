/* CTAdmin – startup (loaded last) */
renderPlan();
updateEndLabel();
drawPie();
startTicking();
restoreTimer();

/* offline use and "install app" (Phase 7) – only over http(s); opened from file:// it works as before */
if (/^https?:$/.test(location.protocol)) {
  document.head.append(Object.assign(document.createElement('link'), { rel: 'manifest', href: 'manifest.webmanifest' }));
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(e => console.warn('Offline support unavailable:', e));
}
