# WORKLOG — Web (Işığını Bul PWA)

Her çalışma oturumu sonunda yeni bir tarihli blok eklenir (format: kök [CLAUDE.md](../CLAUDE.md)
"Working model" #2). Bu dosya **2026-09-21**'de başlatıldı; ONDAN ÖNCEKİ tüm geçmiş (Temmuz–Eylül
2026: Play Store yayın süreci, mağaza/dijital ürün/bildirim sistemleri, ASO, reklam entegrasyonu,
"oynak ekran" bug'ı vb.) memory dosyası `isigini-bul-project.md`'de kronolojik olarak duruyor —
referans için oraya bakılabilir, geriye dönük buraya taşınmadı (kapsam dışı).

## 2026-09-21 — Context/memory sistemi kuruldu

- **WHAT:** Workspace için CLAUDE.md hiyerarşisi (kök + `mobil/` + `supabase/`) ve her proje
  için `docs/SPEC.md` + `docs/WORKLOG.md` oluşturuldu. Amaç: ileriki oturumlarda durum/karar
  takibinin tek bir devasa memory dosyasına değil, ilgili projenin WORKLOG'una düşmesi.
- **FILES:** `CLAUDE.md`, `mobil/CLAUDE.md`, `supabase/CLAUDE.md`, `docs/SPEC.md`,
  `docs/WORKLOG.md`, `mobil/docs/SPEC.md`, `mobil/docs/WORKLOG.md`, `supabase/docs/SPEC.md`,
  `supabase/docs/WORKLOG.md`, `memory/_inbox/PROTOCOL.md`
- **DECISIONS:** Repoya kod/config değişikliği yapılmadı (kullanıcı isteği) — sadece yeni `.md`
  dosyaları eklendi. Eski memory dosyası (`isigini-bul-project.md`) olduğu gibi bırakıldı,
  geriye dönük migrate edilmedi; bundan sonraki gözlemler WORKLOG'a yazılacak.
- **DEPLOYMENT STEPS:** Yok (yalnız dokümantasyon, deploy gerektirmiyor).
- **VERIFY:** Dosyalar oluşturuldu; `git status` ile diff gözden geçirilebilir.
- **NEXT:** Faz 5 — skill önerileri kullanıcıya sunulacak (onay bekleniyor).
