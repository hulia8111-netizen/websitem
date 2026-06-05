/* ============================================================
   service-worker.js — Uygulama kabuğunu cache'ler (offline + PWA).
   Sürüm değişince CACHE adını artır ki eski dosyalar temizlensin.
   ============================================================ */

const CACHE = "isigini-bul-v46";
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
  const ayniKaynak = istek.url.startsWith(self.location.origin);

  // Network-first + tarayıcı önbelleğini ATLA (no-store): aynı kaynaktaki
  // dosyalar her zaman GitHub'dan taze gelir → kod değişiklikleri anında görünür,
  // eski sürüm önbellekte takılı kalmaz. Offline'da SW cache'ten sunulur.
  const ag = ayniKaynak ? fetch(istek.url, { cache: "no-store" }) : fetch(istek);
  e.respondWith(
    ag.then(yanit => {
      if (yanit.ok && ayniKaynak) {
        const kopya = yanit.clone();
        caches.open(CACHE).then(c => c.put(istek, kopya));
      }
      return yanit;
    }).catch(() => caches.match(istek))
  );
});
