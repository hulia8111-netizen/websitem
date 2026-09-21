# WORKLOG — Mobil (Expo)

**2026-09-21**'den itibaren başlıyor. Öncesi (versionCode 1→8 geçmişi: ikon düzeltme, reklam
entegrasyonu, FCM kurulumu, Play red/onay döngüleri) memory `isigini-bul-project.md` ve
`push-bildirim-fcm.md` içinde duruyor.

## 2026-09-21 — Context/memory sistemi kuruldu

- **WHAT:** CLAUDE.md + docs/SPEC.md + docs/WORKLOG.md oluşturuldu (bkz. kök
  [../docs/WORKLOG.md](../docs/WORKLOG.md) aynı blok, tüm workspace tek seferde kuruldu).
- **FILES:** `mobil/CLAUDE.md`, `mobil/docs/SPEC.md`, `mobil/docs/WORKLOG.md`
- **DECISIONS:** —
- **DEPLOYMENT STEPS:** Yok.
- **VERIFY:** —
- **NEXT:** v8 (FCM) Google onay/yayın durumunu takip et — bkz. memory `push-bildirim-fcm`.
  Onaylanınca: kullanıcı telefonunu güncelleyip jeton oluşunca test duyuru push'u gönderilecek.
