# Mobil (Expo) — proje detayı

Kök workspace yönelimi: [../CLAUDE.md](../CLAUDE.md). Bu dosya SADECE bu projenin değişken
detayını tutar; çakışmada bu dosya kazanır.

## Ne

Expo (SDK 54) React Native uygulaması; isiginibull.net sitesini tam ekran WebView içinde açar.
Native tarafta eklenen köprüler: `expo-notifications` (FCM push), `react-native-google-mobile-ads`
(ödüllü + geçiş reklamı), `expo-store-review` (in-app puanlama), geri tuşu → WebView geri gitme.

## Kimlikler

- Paket: `net.isiginibull.app` (Android). iOS henüz yayınlanmadı.
- Expo owner: `hulia.turgut`, EAS project id: `acbf06e4-8da6-40c8-88e7-ef8136491fd0`
- AdMob App ID: `ca-app-pub-6623600258686617~8674579785`
- Firebase projesi: "Isigini Bul" (no 260887005609). `google-services.json` repoda mevcut —
  commit etmeden önce her zaman içeriğinin gerçekten secret olmadığını (sadece app config)
  doğrula, service account anahtarını ASLA buraya koyma.

## Sürüm durumu (değişken — burada sadece ŞU AN, geçmiş için WORKLOG)

- `app.json` versionCode: **8**
- v8 amacı: FCM push desteği (google-services.json + service account Expo credentials'a
  yüklendi) — Google incelemesinde/yayın aşamasında (bkz. kök CLAUDE.md "Güncel durum")
- Bilinen sınır: WebView içinde web push özellikle iOS'ta çalışmayabilir; native push (Android)
  v8 ile geliyor

## Build / deploy

```
cd mobil
npx expo start              # Expo Go ile hızlı test
eas build -p android        # AAB üretimi — GLOBAL eas-cli kullan (npx eas-cli@latest picomatch
                             # hatasıyla bozuluyor bu makinede)
```

`versionCode` HER Play yüklemesinde elle artırılmalı (`eas.json`: `appVersionSource: "local"`
olduğu için EAS otomatik artırmaz) — aksi halde "sürüm kodu zaten kullanıldı" hatası çıkar.
Play Console'a yükleme ve incelemeye gönderme her zaman kullanıcı onayıyla yapılır.

## Detay

- [NASIL-CALISTIRILIR.md](NASIL-CALISTIRILIR.md) — Expo Go ile çalıştırma adımları
- Push/FCM kurulum geçmişi: memory `push-bildirim-fcm` + [docs/WORKLOG.md](docs/WORKLOG.md)
- İş kuralları ve build kararları: [docs/SPEC.md](docs/SPEC.md)
