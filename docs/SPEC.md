# SPEC — Web (Işığını Bul PWA)

Kalıcı gerçekler ve kararlar. Durum/faz bilgisi burada YOK — bkz. [WORKLOG.md](WORKLOG.md) ve
[../CLAUDE.md](../CLAUDE.md) "Güncel durum".

## İş kuralları

- Tüm kullanıcı verisi varsayılan olarak sadece tarayıcıda (`localStorage`) tutulur; sunucuya
  gönderilmez. Bulut senkron/topluluk özellikleri opsiyonel giriş gerektirir (Supabase auth).
- Bildirimler iki türdür: **yerel** (cihazda zamanlanmış, FCM gerektirmez — örn. günün kartı
  hatırlatması) ve **sunucudan push** (duyurular — FCM + `push_token` kaydı şart). Bu iki tür
  karıştırılmamalı; biri çalışıyor diye diğerinin çalıştığı varsayılmamalı.
- Dijital ürünler (PDF ritüel rehberleri) Google Play Billing zorunluluğu yüzünden native app
  içinde SATILAMAZ — satış yalnız web'de (IBAN havale), native app sadece "erişimi aç/indir".
- Fiziksel ürünler (taşlar, mumlar) dış link (Shopier / WhatsApp sipariş) ile hem web hem
  native'de satılabilir — Play Billing kısıtlaması fiziksel mal için geçerli değil.
- Gece/sessiz saatlerde (DND) hiçbir bildirim gösterilmez — merkezi kural `rahatsizEtmeAktif()`
  (`bildirim.js`) tüm bildirim kaynaklarınca (yerel + sunucu tarafı Edge Function) uyulmalı.
- Sürüm bump kuralı: `index.html`'deki `?v=NNN` ile `service-worker.js`'teki `CACHE` adı
  BİRLİKTE artırılır — aksi halde service worker eski dosyaları cache'te tutmaya devam eder.
- Yönetici tespiti e-posta bazlı: `hulia8111@gmail.com` sabit yönetici sayılır (ek olarak
  `topluluk_moderator` tablosunda da kayıtlıdır). Yönetici panelleri yalnız giriş yapılmışken görünür.

## Veri modeli (Supabase — bu proje ile supabase/ arasında tek yerde tutuluyor)

- `push_token` — cihaz/kullanıcı başına Expo push token + tercihler (duyuru/topluluk/ilham toggle)
- `kullanici_kutuphane` — `user_id` + `urun_kod`, dijital ürüne kalıcı erişim. RLS: kullanıcı
  sadece kendi satırını okur; client'tan insert KAPALI, sadece Edge Function `eris-ver` yazar.
- `dijital_urun` / `magaza_urun` — self-servis ürün katalogları (yönetici panelinden CRUD)
- `site_ayar` — anahtar/değer (IBAN, WhatsApp numaraları) — hardcode yerine buradan okunur
- `topluluk_moderator` — e-posta bazlı yönetici kontrolüne ek kayıt

## Mimari kararlar

- Vanilla JS, framework yok, bağımlılıksız — her özellik `js/` altında kendi IIFE modülü
  (`window.X = (()=>{...})()`), `DOMContentLoaded`'da kendini bağlar (bkz. [../README.md](../README.md)).
- Tüm statik içerik `js/data.js` (`DATA.*`) içinde tek yerden yönetilir.
- Mobil, web'i saran bir WebView'dir — iki ayrı kod tabanı DEĞİL. Web'e yapılan değişiklik
  `git push` ile hem PWA'ya hem native app'e (WebView otomatik günceller) yansır; mobilin kendi
  kodu (`App.js`) sadece native köprüleri (push/reklam/review/geri tuşu) sağlar.

## Test senaryoları (manuel — otomatik test yok)

- Yatay taşma yok: 375px genişlikte hiçbir view sayfayı sağa-sola kaydırtmamalı. Grid item'lara
  `min-width:0` verilmeden bir alt-eleman (ör. uzun yatay şerit) grid sütununu şişirebilir —
  kök neden geçmişte tam bu yüzden oluşmuştu (bkz. WORKLOG geçmişi, memory `isigini-bul-project` v149).
- Bildirim DND: gece saatlerinde hiçbir kategoriden bildirim/toast çıkmamalı.
- Dijital ürün: native app'te "Satın Al" GÖRÜNMEMELİ (yalnız "Web'den Edin" / "Kütüphanemde Aç") —
  `nativeMi()` kontrolü (`window.__ISIGINI_NATIVE` veya UA'da "wv").
