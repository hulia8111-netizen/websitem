# SPEC — Mobil (Expo)

Kalıcı gerçekler ve kararlar. Durum/faz bilgisi burada YOK — bkz. [WORKLOG.md](WORKLOG.md) ve
[../CLAUDE.md](../CLAUDE.md) "Sürüm durumu".

## İş kuralları

- Mobil app = web sitesinin WebView sarmalayıcısı; kendi başına ayrı bir ürün/akış DEĞİLDİR.
  Yeni bir web özelliği native tarafta kod değişikliği GEREKTİRMEZ (otomatik WebView güncellemesi).
- Native koda dokunmayı gerektiren tek durumlar: cihaz API'leri (push, reklam, in-app review,
  fiziksel geri tuşu).
- `versionCode` her Play yüklemesinde elle artırılır (`appVersionSource: "local"` olduğu için
  EAS otomatik artırmaz) — aksi halde "sürüm kodu zaten kullanıldı" hatası alınır.
- Dijital ürün satışı native'de GÖSTERİLMEZ (Play Billing zorunluluğu — bkz. [../docs/SPEC.md](../docs/SPEC.md)).

## Kararlar

- `react-native-google-mobile-ads` sürümü **16.0.0'a sabitlendi** (`--save-exact`, `^` ile
  DEĞİL) — 16.5.0 Kotlin 2.3.0 metadata gerektiriyor, Expo SDK 54 projesi Kotlin 2.1.20 ile
  geliyor, uyumsuzluk build'i patlatıyordu. EAS `^` ile otomatik 16.5'e dönmemeli.
- `eas-cli` GLOBAL kurulu kullanılıyor — `npx eas-cli@latest` bu makinede picomatch modül
  hatasıyla bozuluyor.

## Test senaryoları

- Native app'te dijital ürün "Satın Al" değil "Web'den Edin" göstermeli (`nativeMi()` kontrolü).
- Push izni verilince token `push_token` tablosuna yazılmalı (FCM kurulumu tamamsa).
- Android fiziksel geri tuşu, açık bir WebView sayfasında ileri değil geri gitmeli.
