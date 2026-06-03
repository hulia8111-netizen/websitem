# ✨ Işığını Bul · Spiritüel Wellness

Statik, sunucusuz bir **spiritüel wellbeing** uygulaması — koyu premium tema
(gece mavisi/mor zemin, altın & lila glow). Tüm veriler tarayıcıda
(`localStorage`) saklanır; giriş ya da internet gerektirmez (Google Fonts hariç).
**PWA**: telefonda "ana ekrana ekle" ile tam ekran/offline çalışır.

**Canlı:** https://hulia8111-netizen.github.io/websitem/

---

## Genel bakış

7 sekmeli alt navigasyon: **Ana Sayfa · Bahçe · Kartlar · Meditasyon · Günlük ·
Mağaza · Profil**. İlk açılışta isim onboarding'i + kısa **Spiritüel Başlangıç
Testi**; sabah saatlerinde otomatik **Sabah Ritüeli** karşılaması.

Uygulama ruh hali + test sonucu + enerji seviyesine göre **kişiselleşir**
(günlük rehber, müzik önerisi, enerji tipi, çakra dengesi vb. hepsi uyum sağlar).

---

## Modüller

### Ana Sayfa
- **Streak widget** — ateş/glow, seviye sistemi (`js/streak.js`)
- **Günün Enerji Seviyesi** — dairesel gösterge + 7 günlük grafik (`js/energy.js`)
- **Günlük Spiritüel Rehber (Kader)** — flip oracle kartı, kişiselleşen tema (`js/kader.js`)
- **Günün Cümlesi** · **Sesli Olumlama** (TTS, kategoriler, favoriler `js/olumlama.js`)
- **Ay Evresi** — gerçek zamanlı astronomik hesap (`js/ay.js`)
- **Çift Saat Anlamları** — ayna saat algılama + kozmik popup (`js/ciftsaat.js`)
- **İçsel Rehber / AI Ruh Rehberi** — sohbet arayüzü (`js/rehber.js`)
- **Ruh Hali** — modern ikonlar, haftalık analiz, rozetler
- **Günün Ritüeli** — tarot kartı, XP, zorluk, rozetler (`js/rituel.js`)
- **Ritüeller & Araçlar** ızgarası → tam ekran overlay'ler:
  - ☀️ **Sabah Ritüeli** (`js/sabah.js`) · 🌙 **Gece Rutini** (`js/gece.js`)
  - 🌬️ **Nefes & Sakinleşme** (`js/nefes.js`) · 🪞 **Ayna Modu** (`js/ayna.js`)
  - 🌟 **Hayal Panosu / Vision Board** (`js/vision.js`)

### Diğer sekmeler
- **Bahçe** — Ruh Bahçesi: aktivitelerle büyüyen 6 seviyeli SVG bahçe + günlük ritüel + rozetler (`js/bahce.js`)
- **Kartlar** — Günün kartı (glow + giriş animasyonu) + kart geçmişi
- **Meditasyon** — **Spiritüel Müzik & Frekans Alanı**: premium çalar, 7 kategori, 15 parça (Web Audio ile sentezlenen tonlar/yağmur/orman/Tibet çanı/lo-fi pad), favori + öneri + otomatik geçiş (`js/muzik.js`, `js/audio.js`)
- **Günlük** — Spiritüel günlük (mood bağlantılı, arama, favori, AI analiz `js/gunluk.js`) + Şükran defteri + Manifest hedefleri
- **Mağaza** — Spiritüel butik: kategoriler, filtre, favori, ürün detay popup, dış bağlantı (`js/magaza.js`)
- **Profil** — Kişisel Spiritüel Profil (`js/profil.js`): ruhsal seviye + foto + istatistikler + 30 günlük grafik · **Aura & Çakra Dengesi** (`js/cakra.js`) · **Enerji Tipi** (`js/enerjitipi.js`) · Başarımlar · Meditasyon geçmişi · **Bildirimler** (`js/bildirim.js`) · **Atmosfer / Gece Kozmik Modu** (`js/kozmik.js`) · Yedekleme

### Sistem
- **İçsel Rehber motoru** (`js/rehber.js`) — yerel kural-tabanlı, harici AI gerektirmez
- **Bildirimler** (`js/bildirim.js`) — günlük saat, kategoriler, sessiz/gece DND, akıllı tetikleyiciler, in-app toast
- **Spiritüel Başlangıç Testi** (`js/test.js`) · **Onboarding & karşılama** (`js/app.js`)
- **Performans** (`js/perf.js`) — görünmeyen/arka plan animasyonları otomatik duraklatır

---

## Mimari

- **Vanilla JS, bağımlılıksız, modüler.** Her özellik kendi dosyasında bir IIFE
  (`window.X = (() => {...})()`) ve `DOMContentLoaded`'da kendini bağlar.
- **Veri katmanı:** [js/store.js](js/store.js) — `Store` (localStorage + JSON),
  tarih/streak yardımcıları (`todayKey`, `pickByDate`, `mevcutSeri`, `streakBilgisi`,
  `aktifGunSayisi` …).
- **Tüm içerik** [js/data.js](js/data.js) içinde (`DATA.*`): cümleler, kartlar,
  frekanslar, kategoriler, ritüeller, çakralar, enerji tipleri, ürünler, test,
  rehber kuralları vb. — tek yerden düzenlenir.
- **Ses motoru** [js/audio.js](js/audio.js) — `SesMotoru`: Web Audio ile ton/gürültü/çan/pad sentezi (telifsiz, offline).
- **PWA:** `manifest.webmanifest` + `service-worker.js` (network-first; her sürümde `CACHE` adı artar).

## Çalıştırma

```bash
node .claude/server.js
# tarayıcıda: http://localhost:5500
```

## Tasarım

Koyu premium tema; başlıklar **Playfair Display**, gövde **Inter** (Google Fonts).
Tutarlı spacing ölçeği (`--sp-*`), glow/pulse animasyonları, cam efekti kartlar,
hover yükselme. Tüm animasyonlar `prefers-reduced-motion` ile kapanır.

## Veri & gizlilik

Tüm kişisel veriler yalnızca kullanıcının tarayıcısında (`localStorage`) kalır;
hiçbir sunucuya gönderilmez. **Profil → Yedekleme**'den JSON dışa/içe aktarılabilir.
