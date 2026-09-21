# SPEC — Supabase

Kalıcı gerçekler ve kararlar. Durum/faz bilgisi burada YOK — bkz. [WORKLOG.md](WORKLOG.md).

## Kurallar

- Yeni tablo eklerken RLS varsayılan AÇIK ve `auth.uid() = user_id` deseni kullanılır;
  client'tan yazma (insert/update) genelde KAPALI, yazma Edge Function üzerinden (service role)
  yapılır.
- Migration aracı YOK — şema dosyaları (`*.sql`) SQL editöründen elle çalıştırılır. Bir dosya
  çalıştırıldıktan sonra tarih + dosya adı WORKLOG'a not düşülür (dosyalar idempotent
  olmayabilir — tekrar çalıştırmadan önce WORKLOG'a bak).
- Secret'lar (service role key, FCM service account) hiçbir zaman repoya commit edilmez.

## Veri modeli

Bkz. [../docs/SPEC.md](../docs/SPEC.md) "Veri modeli" — tablolar orada listeleniyor; web ile
supabase arasında net proje sınırı olmadığı için altitude gereği tek yerde tutuluyor, burada
tekrar edilmiyor.

## Test senaryoları

- Yeni bir Edge Function deploy edildikten sonra CORS header'ları kontrol edilir (`duyuru-push`'ta
  CORS eksikliği geçmişte sessiz başarısızlığa yol açmıştı, bkz. memory `push-bildirim-fcm`).
- RLS'i olmayan/yanlış olan bir tablo, anon key ile başka kullanıcının satırını okuyabiliyor mu
  diye test edilmeli (yeni tablo eklendiğinde).
