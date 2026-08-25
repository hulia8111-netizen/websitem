-- ============================================================
-- magaza-urun-schema.sql — Self-servis fiziksel ürün kataloğu 🕯️
-- ------------------------------------------------------------
-- Işık Mumları (ve ileride diğer bölümler) için yönetici panelinden
-- ürün/foto/fiyat ekle-çıkar. "Sipariş Oluştur" → WhatsApp.
-- Katalog herkese açık; foto herkese açık (pazarlama). Yazma = moderatör.
-- Bu SQL'i Supabase → SQL Editor'de bir kez çalıştır.
-- ============================================================

create table if not exists public.magaza_urun (
  id         uuid primary key default gen_random_uuid(),
  bolum      text not null,             -- 'isik-mumlari' (ileride 'isik-kartlari' vb.)
  ad         text not null,
  aciklama   text,
  fiyat      text,                       -- opsiyonel (sonra eklenebilir)
  gorsel     text,                       -- public foto URL (opsiyonel)
  link       text,                       -- Işık Kartları için "Satın Al" linki (Shopier vb.)
  wa_no      text,                       -- sipariş WhatsApp numarası (Işık Mumları)
  sira       int  default 0,             -- büyük olan üstte
  aktif      boolean default true,
  olusturma  timestamptz default now()
);

alter table public.magaza_urun enable row level security;

drop policy if exists "magaza_urun_herkes_oku" on public.magaza_urun;
create policy "magaza_urun_herkes_oku" on public.magaza_urun
  for select using (aktif = true);

drop policy if exists "magaza_urun_mod_yaz" on public.magaza_urun;
create policy "magaza_urun_mod_yaz" on public.magaza_urun
  for all using (public.is_moderator()) with check (public.is_moderator());

create index if not exists magaza_urun_bolum_idx on public.magaza_urun(bolum);

-- Ürün fotoğrafları için herkese açık depo
insert into storage.buckets (id, name, public)
values ('urun-foto', 'urun-foto', true)
on conflict (id) do nothing;

-- Foto yükleme/silme yalnız moderatör (okuma herkese açık — bucket public)
drop policy if exists "urunfoto_mod_yaz" on storage.objects;
create policy "urunfoto_mod_yaz" on storage.objects
  for all
  using (bucket_id = 'urun-foto' and public.is_moderator())
  with check (bucket_id = 'urun-foto' and public.is_moderator());
