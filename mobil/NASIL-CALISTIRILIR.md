# Işığını Bul — Mobil Uygulama (Expo) 📱

Bu klasör, **isiginibull.net** sitesini bir mobil uygulama olarak çalıştıran
React Native (Expo SDK **54**) projesidir. Uygulama, siteyi tam ekran bir
WebView içinde açar — yani tüm özellikler (giriş, senkron, günlük, kartlar…)
aynen çalışır.

## Telefonda çalıştırma (Expo Go) — en hızlı yol

1. Telefonuna **Expo Go** uygulamasını kur (SDK 54 sürümü — sende var).
2. Bilgisayarında bu klasörde bir terminal aç ve şunu yaz:
   ```
   npx expo start
   ```
3. Ekranda bir **QR kod** çıkar.
   - **Android:** Expo Go'yu aç → "Scan QR code" → QR'ı okut.
   - **iPhone:** Telefonun **Kamera** uygulamasıyla QR'ı okut → çıkan bağlantıya dokun.
4. Uygulama Expo Go içinde açılır. 🎉

> Bilgisayar ve telefon **aynı Wi-Fi** ağında olmalı.
> Bağlanamazsa terminalde `npx expo start --tunnel` dene (internet üzerinden bağlanır).

## Notlar
- İlk açılışta site yüklenirken altın renkli bir yükleniyor animasyonu görünür.
- Giriş yaptıktan sonra oturumun cihazda kalıcı tutulur (tekrar giriş istemez).
- Android'de telefonun **geri** tuşu, sitede geri gitmeyi sağlar.

## Gerçek uygulama (Play Store / App Store) için
Expo Go test içindir. Mağazaya yüklenebilir gerçek bir paket (APK/AAB/IPA)
oluşturmak için ileride **EAS Build** kullanılır:
```
npm install -g eas-cli
eas build -p android   # veya -p ios
```
(Bu adımda yardım istersen söyle.)

## Bilinen sınır
- WebView içinde **web push bildirimleri** (özellikle iOS'ta) çalışmayabilir.
  Bildirimler şimdilik web (PWA) tarafında çalışır. İstenirse ileride
  Expo'nun yerel bildirim sistemi (expo-notifications) eklenebilir.
