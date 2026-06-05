/* ============================================================
   service-worker.js — Uygulama kabuğunu cache'ler (offline + PWA).
   Sürüm değişince CACHE adını artır ki eski dosyalar temizlensin.
   ============================================================ */

const CACHE = "isigini-bul-v38";
const KABUK = [
  ".",
  "index.html",
  "css/style.css",
  "js/data.js",
  "js/store.js",
  "js/perf.js",
  "js/audio.js",
  "js/muzik.js",
  "js/rehber.js",
  "js/ay.js",
  "js/app.js",
  "js/streak.js",
  "js/gorevler.js",
  "js/energy.js",
  "js/olumlama.js",
  "js/gunluk.js",
  "js/bildirim.js",
  "js/profil.js",
  "js/rituel.js",
  "js/test.js",
  "js/kader.js",
  "js/enerjitipi.js",
  "js/cakra.js",
  "js/gece.js",
  "js/sabah.js",
  "js/nefes.js",
  "js/ayna.js",
  "js/vision.js",
  "js/ciftsaat.js",
  "js/takvim.js",
  "js/hafta.js",
  "js/kapi.js",
  "js/kozmik.js",
  "js/supabase-config.js",
  "js/bulut.js",
  "manifest.webmanifest",
  "icon.svg"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(KABUK))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(adlar => Promise.all(adlar.filter(a => a !== CACHE).map(a => caches.delete(a))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const istek = e.request;
  if (istek.method !== "GET") return;

  // Network-first: online'ken her zaman en güncel sürüm gelir (kod değişiklikleri
  // anında görünür), cache arka planda tazelenir. Offline'da cache'ten sunulur.
  e.respondWith(
    fetch(istek).then(yanit => {
      if (yanit.ok && istek.url.startsWith(self.location.origin)) {
        const kopya = yanit.clone();
        caches.open(CACHE).then(c => c.put(istek, kopya));
      }
      return yanit;
    }).catch(() => caches.match(istek))
  );
});
