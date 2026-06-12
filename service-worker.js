/* ============================================================
   service-worker.js â€” Uygulama kabuÄŸunu cache'ler (offline + PWA).
   SÃ¼rÃ¼m deÄŸiÅŸince CACHE adÄ±nÄ± artÄ±r ki eski dosyalar temizlensin.
   ============================================================ */

const CACHE = "isigini-bul-v98";
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
  "js/rehbermed.js",
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
      // Yeni sÃ¼rÃ¼m devreye girince aÃ§Ä±k ekranlarÄ± otomatik tazele (eski sÃ¼rÃ¼m takÄ±lmasÄ±n)
      .then(() => self.clients.matchAll({ type: "window" }))
      .then(clients => clients.forEach(c => { try { c.navigate(c.url); } catch (e) {} }))
  );
});

self.addEventListener("fetch", e => {
  const istek = e.request;
  if (istek.method !== "GET") return;
  const ayniKaynak = istek.url.startsWith(self.location.origin);

  // Network-first + tarayÄ±cÄ± Ã¶nbelleÄŸini ATLA (no-store): aynÄ± kaynaktaki
  // dosyalar her zaman GitHub'dan taze gelir â†’ kod deÄŸiÅŸiklikleri anÄ±nda gÃ¶rÃ¼nÃ¼r,
  // eski sÃ¼rÃ¼m Ã¶nbellekte takÄ±lÄ± kalmaz. Offline'da SW cache'ten sunulur.
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

/* Bildirime tÄ±klayÄ±nca uygulamayÄ± aÃ§/odakla ve GÃ¼nÃ¼n KartÄ± ekranÄ±na git */
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "./?kart=1";
  e.waitUntil((async () => {
    const list = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of list) { if ("focus" in c) { await c.focus(); c.postMessage({ tip: "kart-goster" }); return; } }
    if (self.clients.openWindow) await self.clients.openWindow(url);
  })());
});

/* Web Push (ileride sunucudan gÃ¶nderim iÃ§in hazÄ±r) */
self.addEventListener("push", e => {
  let v = { title: "GÃ¼nÃ¼n KartÄ± ğŸ”®", body: "BugÃ¼nÃ¼n kartÄ±nÄ± Ã§ekmeyi unutma âœ¨", url: "./?kart=1" };
  try { if (e.data) v = Object.assign(v, e.data.json()); } catch (x) {}
  e.waitUntil(self.registration.showNotification(v.title, { body: v.body, icon: "icon.svg", badge: "icon.svg", tag: "gunun-karti", data: { url: v.url } }));
});
