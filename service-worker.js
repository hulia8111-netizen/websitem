/* ============================================================
   service-worker.js — Uygulama kabuğunu cache'ler (offline + PWA).
   Sürüm değişince CACHE adını artır ki eski dosyalar temizlensin.
   ============================================================ */

const CACHE = "isigini-bul-v68";
const KABUK = [
  ".",
  "index.html",
  "css/style.css",
  "js/acilis-cumleler.js",
  "js/splash.js",
  "js/data.js",
  "js/farkindalik-sorulari.js",
  "js/mini-gorevler.js",
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
  "js/gunluk.js",
  "js/bildirim.js",
  "js/kartbildirim.js",
  "js/profil.js",
  "js/rituel.js",
  "js/test.js",
  "js/enerjitipi.js",
  "js/cakra.js",
  "js/gece.js",
  "js/sabah.js",
  "js/nefes.js",
  "js/vision.js",
  "js/ciftsaat.js",
  "js/takvim.js",
  "js/hafta.js",
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

/* Bildirime tıklayınca uygulamayı aç/odakla ve Günün Kartı ekranına git */
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "./?kart=1";
  e.waitUntil((async () => {
    const list = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of list) { if ("focus" in c) { await c.focus(); c.postMessage({ tip: "kart-goster" }); return; } }
    if (self.clients.openWindow) await self.clients.openWindow(url);
  })());
});

/* Web Push (ileride sunucudan gönderim için hazır) */
self.addEventListener("push", e => {
  let v = { title: "Günün Kartı 🔮", body: "Bugünün kartını çekmeyi unutma ✨", url: "./?kart=1" };
  try { if (e.data) v = Object.assign(v, e.data.json()); } catch (x) {}
  e.waitUntil(self.registration.showNotification(v.title, { body: v.body, icon: "icon.svg", badge: "icon.svg", tag: "gunun-karti", data: { url: v.url } }));
});
