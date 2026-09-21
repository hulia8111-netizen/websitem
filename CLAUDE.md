# Işığını Bul — Workspace

Tek geliştirici (Hülya) tarafından yürütülen spiritüel wellness ürünü. Bu repo 3 ilişkili proje
barındırır. **Bu dosya sadece YÖNELIM altitüdündedir** — değişken/proje-özel detay buraya değil,
ilgili projenin kendi `CLAUDE.md`'sine yazılır (o dosya çakışmada kazanır).

## Projeler

| Proje | Klasör | Stack | Not |
|---|---|---|---|
| Web (PWA) | `/` (kök) | Vanilla JS, `localStorage`, statik, bağımlılıksız | Ana ürün. Canlı: https://isiginibull.net |
| Mobil | `mobil/` | Expo (React Native, SDK 54) — siteyi WebView'de saran uygulama | Play Store'da **yayında** (`net.isiginibull.app`) |
| Backend | `supabase/` | Postgres (elle çalıştırılan SQL şemaları) + Edge Functions (Deno) | Topluluk, push, dijital ürün erişimi |

Mobil, web'in ayrı bir kod tabanı DEĞİL — WebView sarmalayıcısı. Web'e yapılan değişiklik
`git push` ile hem PWA'ya hem native app'e yansır; mobil kendi kodu (App.js) sadece native
köprüleri sağlar (push, reklam, review, geri tuşu).

Detay: [README.md](README.md) (web mimarisi), her projenin kendi `CLAUDE.md` + `docs/SPEC.md`
+ `docs/WORKLOG.md`.

## Working model / operasyon kuralları

1. **Kaynak doğruluk repodur** (kod, git geçmişi). CLAUDE.md/SPEC/memory bunun yerine geçmez,
   üstüne bağlam ekler — repoyla çelişen bir not bulunursa repo kazanır, not düzeltilir.
2. **Her çalışma oturumu** ilgili projenin `docs/WORKLOG.md`'sine bir blok ekler (tarihli
   başlık, madde madde — nesir yok). Format kök seviyede tek tip: WHAT / FILES / DECISIONS /
   DEPLOYMENT STEPS / VERIFY / NEXT.
3. **SPEC.md sadece kalıcı gerçekleri tutar** (iş kuralları, veri modeli, mimari kararlar, test
   senaryoları). Durum/faz/versiyon bilgisi SPEC'e sızmaz — WORKLOG'da veya bu dosyanın
   "Güncel durum" bölümünde kalır.
4. **Yıkıcı veya dışa-dönük aksiyonlar her zaman önce söylenir ve onay beklenir**: `git push`
   (canlıya çıkar — GitHub Pages), Supabase SQL/Edge Function deploy, Play Console'da sürüm
   yükleme/yayınlama, veri silme. Bu proje canlı kullanıcıları etkiliyor.
5. **Secret'lar asla .md/.json/.js dosyalarına yazılmaz** (API anahtarları, service account,
   şifreler, IBAN gibi kişisel finansal bilgi). Sadece kullanıcı tarafında (Supabase/Expo/Play
   Console/Firebase credential store) tutulur; buradan sadece İSİMLE referans verilir.
6. **Skill'ler** (Faz 5'te kurulacak) bir şey beklenmedik şekilde kırıldığında O OTURUMDA
   güncellenir — "sonra yazarım" yok.
7. **Altitude disiplini**: kök dosyaya değişken/proje-özel detay yazılmaz; proje dosyasına
   workspace-geneli kural yazılmaz. Şüphede kalırsan: "6 ay sonra hâlâ doğru mu?" — hayırsa
   SPEC'te değil WORKLOG'da ya da "Güncel durum"da kalmalı.

## Paylaşılan altyapı (isimle referans — değerler kullanıcı tarafında/ilgili konsolda)

- **Domain:** isiginibull.net (Namecheap → GitHub Pages A-record)
- **GitHub Pages:** repo `hulia8111-netizen/websitem`, `main` branch, `CNAME` dosyası kökte
- **Supabase projesi:** topluluk verisi + dijital ürün kütüphanesi + push_token (proje ref
  Supabase konsolunda; buraya yazılmaz)
- **Firebase / FCM:** proje "Isigini Bul" (proje no 260887005609) — mobil push için,
  bkz. [mobil/CLAUDE.md](mobil/CLAUDE.md)
- **AdMob:** publisher `pub-6623600258686617` (app id / reklam birimleri mobil/CLAUDE.md'de)
- **Play Console:** paket `net.isiginibull.app`, geliştirici hesabı Hülya
- **Shopier:** arkadaşının mağazası — fiziksel ürün (taş/mum) satışı için dış link, komisyon modeli

## Memory & skill

- Kalıcı memory: `C:\Users\TEMP.LAPTOP-6HRTRVJV.000\.claude\projects\C--claude-websitem\memory\`
  (`MEMORY.md` = index). Yeni gözlemler önce `memory/_inbox/`'a taslak düşer, kullanıcı
  onaylayınca canonical dosyaya işlenir — bkz. `memory/_inbox/PROTOCOL.md`.
- Skill tree: henüz yok — Faz 5'te önerilecek, onaylanınca buraya tablo eklenecek.

## Güncel durum (kısa özet — detay ilgili `docs/WORKLOG.md`'de, tarih: 2026-09-21)

- **Web:** v243, canlı (isiginibull.net)
- **Mobil:** versionCode 8 (FCM push desteği eklendi) Google incelemesinde/yayın aşamasında —
  bkz. [mobil/CLAUDE.md](mobil/CLAUDE.md)
- **Backend:** topluluk + dijital ürün + bildirim şemaları kurulu; sunucudan toplu push henüz
  test edilmedi (`push_token` tablosu boş — v8 onaylanıp kullanıcılar güncelleyince dolacak)
