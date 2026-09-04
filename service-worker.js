/* ============================================================
   service-worker.js â€” Uygulama kabuÄŸunu cache'ler (offline + PWA).
   SÃ¼rÃ¼m deÄŸiÅŸince CACHE adÄ±nÄ± artÄ±r ki eski dosyalar temizlensin.
   ============================================================ */

const CACHE = "isigini-bul-v208";
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
  "js/kartpaylas.js",
  "js/haftalik-hedefler.js",
  "js/haftalikhedef.js",
  "js/streak.js",
  "js/gorevler.js",
  "js/energy.js",
  "js/gunluk.js",
  "js/overlay-geri.js",
  "js/dokunmaipucu.js",
  "js/pushtoken.js",
  "js/gunlukilham.js",
  "js/rapor.js",
  "js/bildirim.js",
  "js/kartbildirim.js",
  "js/evrenmesaji.js",
  "js/magaza.js",
  "js/topluluk.js",
  "js/topluluk-sosyal.js",
  "js/topluluk-duyuru.js",
  "js/profil.js",
  "js/rituel.js",
  "js/test.js",
  "js/enerjitipi.js",
  "js/cakra.js",
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
      // NOT: aÃ§Ä±k pencereleri zorla yeniden yÃ¼klemeyiz (splash 2. kez oynamasÄ±n);
      // network-first fetch sayesinde iÃ§erik bir sonraki aÃ§Ä±lÄ±ÅŸta zaten taze gelir.
  );
});

self.addEventListener("fetch", e => {
  const istek = e.request;
  if (istek.method !== "GET") return;
  const ayniKaynak = istek.url.startsWith(self.location.origin);

  // Farkli kaynak (Supabase vb.) -> dogrudan ag, hata olursa (varsa) onbellek.
  if (!ayniKaynak) {
    e.respondWith(fetch(istek).catch(() => caches.match(istek)));
    return;
  }

  // Ayni kaynak (uygulama kabugu): NETWORK-FIRST + zaman asimi.
  // Online'da her zaman taze gelir (kod degisiklikleri aninda gorunur).
  // Ag yoksa VEYA 4 sn'de yanit vermezse -> onbellekten sun (OFFLINE calisir,
  // yavas agda takilmaz). Navigasyon (sayfa) istegi offline'da index.html'e duser.
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const yanit = await Promise.race([
        fetch(istek.url, { cache: "no-store" }),
        new Promise((_, red) => setTimeout(() => red(new Error("timeout")), 4000))
      ]);
      if (yanit && yanit.ok) cache.put(istek, yanit.clone());
      return yanit;
    } catch (_e) {
      const onbellek = await cache.match(istek) || await caches.match(istek);
      if (onbellek) return onbellek;
      if (istek.mode === "navigate") {
        const kabuk = await cache.match("index.html") || await cache.match("./") || await cache.match(".");
        if (kabuk) return kabuk;
      }
      throw _e;
    }
  })());
});

/* Bildirime tÄ±klayÄ±nca uygulamayÄ± aÃ§/odakla ve GÃ¼nÃ¼n KartÄ± ekranÄ±na git */
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const data = e.notification.data || {};
  const url = data.url || "./?kart=1";
  const tip = data.tip || "kart-goster";  // "ana-sayfa" → ana sayfa, "kart-goster" → Kartlar
  e.waitUntil((async () => {
    const list = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of list) { if ("focus" in c) { await c.focus(); c.postMessage({ tip }); return; } }
    if (self.clients.openWindow) await self.clients.openWindow(url);
  })());
});

/* Web Push (ileride sunucudan gÃ¶nderim iÃ§in hazÄ±r) */
self.addEventListener("push", e => {
  let v = { title: "GÃ¼nÃ¼n KartÄ± ğŸ”®", body: "BugÃ¼nÃ¼n kartÄ±nÄ± Ã§ekmeyi unutma âœ¨", url: "./?kart=1" };
  try { if (e.data) v = Object.assign(v, e.data.json()); } catch (x) {}
  e.waitUntil(self.registration.showNotification(v.title, { body: v.body, icon: "icon.svg", badge: "icon.svg", tag: "gunun-karti", data: { url: v.url } }));
});
