/* CTAdmin service worker – lets the site work offline and be installed.
   Pages, scripts and styles: network first (so updates arrive), cached copy when offline or slow.
   Audio, fonts, images: cache first (large, rarely change).
   When you add a file the app needs offline, add it to PRECACHE. When you replace an audio/font/image
   file under the same name, bump VERSION so clients fetch the new copy. */
const VERSION = 'ctadmin-v1';
const PRECACHE = [
  './', 'index.html', 'style.css', 'manifest.webmanifest',
  'js/state.js', 'i18n/bn.js', 'js/i18n.js', 'js/audio.js', 'js/seatplan.js', 'js/dial.js', 'js/timer.js',
  'js/layouts.js', 'js/settings.js', 'js/presets.js', 'js/ui.js', 'js/guard.js', 'js/main.js',
  'favicon.png', 'icons/icon-192.png', 'icons/icon-512.png',
  'fonts/noto-sans-bengali-bengali-wght-normal.woff2',
  'audio/gong-start.mp3', 'audio/end-bell.mp3', 'audio/please-stop-writing.mp3', 'audio/5min-bell.mp3',
  'audio/last-five-minutes.mp3', 'audio/lastminute.mp3', 'audio/tick.mp3',
  'audio/bn/please-stop-writing.mp3', 'audio/bn/last-five-minutes.mp3', 'audio/bn/lastminute.mp3',
];
const NETWORK_TIMEOUT = 3000;   // ms before a slow network falls back to the cached copy

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('ctadmin-') && k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

const cacheFirst = async req => {
  const hit = await caches.match(req, { ignoreSearch: true });
  if (hit) return hit;
  const res = await fetch(req);
  if (res.status === 200) (await caches.open(VERSION)).put(req, res.clone());
  return res;
};
const networkFirst = async req => {
  const cached = () => caches.match(req, { ignoreSearch: true })
    .then(hit => hit || (req.mode === 'navigate' ? caches.match('index.html') : undefined));
  try {
    const res = await Promise.race([fetch(req), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), NETWORK_TIMEOUT))]);
    if (res.status === 200) (await caches.open(VERSION)).put(req, res.clone());
    return res;
  } catch (err) {
    const hit = await cached();
    if (hit) return hit;
    throw err;
  }
};

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  const media = ['audio', 'video', 'font', 'image'].includes(req.destination) || /\.(mp3|woff2|png|svg)$/i.test(new URL(req.url).pathname);
  e.respondWith(media ? cacheFirst(req) : networkFirst(req));
});
