-- ============================================================
-- Duyurulara bağlantı butonu (başlık + adres) — BİR KEZ çalıştır (idempotent)
-- ============================================================
alter table public.topluluk_duyuru add column if not exists baglanti_baslik text;
alter table public.topluluk_duyuru add column if not exists baglanti_url text;
