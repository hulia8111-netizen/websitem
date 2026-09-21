# Supabase — proje detayı

Kök workspace yönelimi: [../CLAUDE.md](../CLAUDE.md). Bu dosya SADECE bu projenin değişken
detayını tutar; çakışmada bu dosya kazanır.

## Ne

Backend: Postgres şemaları (bu klasördeki `*.sql` dosyaları — migration aracı YOK, elle Supabase
SQL editöründen çalıştırılıyor) + Edge Functions (Deno, `functions/`).

## Şema dosyaları (elle çalıştırılır)

- `topluluk-schema.sql`, `topluluk-sosyal-schema.sql`, `topluluk-foto-schema.sql`,
  `topluluk-duyuru-schema.sql`, `topluluk-bildirim-schema.sql` — topluluk özellikleri
- `bildirim-sistemi-schema.sql` — `push_token` + `duyuru_okundu` + `duyuru_katilim` (native push altyapısı)
- `kutuphane-schema.sql` — dijital ürün kütüphanesi (`kullanici_kutuphane` + `ritueller` private bucket)
- `dijital-urun-schema.sql`, `magaza-urun-schema.sql`, `satinalma-talep-schema.sql`,
  `erisim-kodu-schema.sql` — mağaza/satış akışı
- `ilham-cumle-schema.sql`, `site-ayar-schema.sql`, `guvenlik-duzeltme.sql`, `evren-kurulum.sql`,
  `magaza-kurulum.sql` — diğer

Hangi dosyanın ne zaman çalıştırıldığı `docs/WORKLOG.md`'de tutulur (SQL dosyalarının kendisi
idempotent olmayabilir — tekrar çalıştırmadan önce WORKLOG'a bak).

## Edge Functions (`functions/`)

`duyuru-bildirim` · `duyuru-push` · `eris-ver` · `evren-mesaji` · `gunluk-ilham` ·
`haftalik-kazanan` · `kart-hatirlatma` · `satis-bildir` · `topluluk-bildirim`

Deploy elle yapılıyor (Supabase CLI); bu makinede CLI bazen login değil — bkz. memory
`push-bildirim-fcm`.

## Bilinen tuzaklar

- SQL editöründe **Ctrl+Enter tetiklemiyor** — Run butonuna tıklamak gerekiyor.
- Yeni Edge Function deploy sonrası CORS kontrol edilmeli (`duyuru-push`'ta CORS eksikliği
  sessiz başarısızlığa yol açmıştı, koda eklendi ama her deploy sonrası doğrulanmalı).

## Detay

Tam kurulum geçmişi: memory `isigini-bul-project` + `push-bildirim-fcm`, ve bu projenin
[docs/WORKLOG.md](docs/WORKLOG.md). İş kuralları/veri modeli: [docs/SPEC.md](docs/SPEC.md).
