# ✨ Işığını Bul · Spiritüel Wellness

Statik, sunucusuz bir spiritüel farkındalık & wellbeing panosu — **koyu premium**
tema (gece mavisi/mor zemin, altın & lila glow). Tüm veriler tarayıcıda
(`localStorage`) saklanır; giriş veya internet gerektirmez. **PWA**: telefonda
"ana ekrana ekle" ile tam ekran/offline çalışır.

## Gezinme (5 görünüm + bottom navigation)
Mobil uygulama mantığında alt navigasyon: **Ana Sayfa · Kartlar · Meditasyon ·
Günlük · Profil**.

- **Ana Sayfa**: Günün cümlesi (gün boyu sabit) · İçsel Rehber (AI) · Ruh hali
  (modern ikonlar) · Mini görev · Farkındalık sorusu.
- **Kartlar**: Günün kartı (glow + giriş animasyonu) · Kart geçmişi.
- **Meditasyon**: Kategorili meditasyon & Web Audio frekans tonları.
- **Günlük**: Günlük yazma · Şükran defteri · Manifest hedefleri.
- **Profil**: İsim/avatar · streak & kullanım sayaçları · başarımlar ·
  meditasyon geçmişi · önerilen ürünler · JSON yedek al/yükle.

## İçsel Rehber (yerel AI rehber)
Kullanıcı nasıl hissettiğini yazar; [js/rehber.js](js/rehber.js) içindeki kural
tabanlı motor metni anahtar kelimelerle eşler ve **uygun kart + meditasyon
kategorisi + olumlama + mini görev** önerir. Tamamen offline çalışır, harici AI
servisi gerektirmez. Kurallar `DATA.rehber` içinden düzenlenir.

## Profil & Streak
Yerel profil (isim/avatar) `localStorage`'ta saklanır. `streakBilgisi()`
([js/store.js](js/store.js)) `visit-*` anahtarlarından güncel/en uzun seri ve
toplam aktif günü hesaplar; günlük açılış sayacı da tutulur.

## Başarımlar
Kümülatif (lifetime) takip: **7 gün giriş**, **21 gün meditasyon**, **30 şükran
kaydı**, **10 görev tamamlama**. İlerleme `localStorage`'taki `visit-*`, `med-*`,
`gratitude`, `task-*` anahtarlarından hesaplanır.

## Meditasyon & Frekans
5 kategori: **Uyku · Frekans · Şifa · Odak · Rahatlama**. "Frekans" tonları
(396/432/528/639/741/852/174 Hz) tarayıcıda Web Audio API ile üretilir
([js/audio.js](js/audio.js)) — telif sorunu yoktur. Kendi mp3'lerini
`DATA.sesler` içine `kategori` alanıyla ekleyebilirsin.

## Çalıştırma
Sesler, görseller ve service worker'ın düzgün çalışması için yerel bir sunucuyla aç:

```bash
node .claude/server.js
# sonra tarayıcıda: http://localhost:5500
```

## Özelleştirme
İçerikler [js/data.js](js/data.js) içinde: motivasyon cümleleri, kart destesi,
görevler, sorular, ses/frekans listeleri, kategoriler, başarımlar ve ürün linkleri.

## Tasarım
Koyu premium tema; başlıklar **Playfair Display**, gövde **Inter** (Google Fonts).
Tutarlı spacing ölçeği (`--sp-*`), optimize blur, desktop hover yükselme + glow,
buton ışık animasyonu, görünüm geçiş animasyonları.

## Dosyalar
`index.html` · `css/style.css` (tema) · `js/data.js` (içerik + rehber/ürün verisi) ·
`js/store.js` (localStorage + tarih/streak yardımcıları) · `js/audio.js` (frekans
üretici) · `js/rehber.js` (İçsel Rehber) · `js/app.js` (gezinme + profil + mantık) ·
`manifest.webmanifest` + `service-worker.js` (PWA, network-first).
