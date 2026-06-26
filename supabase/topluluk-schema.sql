-- ============================================================
-- Topluluk · Haftanın Işığı — veritabanı şeması (Faz 1)
-- Supabase SQL Editor'da bir kez çalıştır. Tekrar çalıştırmak güvenli (idempotent).
-- ============================================================

-- 1) topluluk_skor: her kullanıcının o haftaki canlı puanı
--    Public OKUMA (liderlik tablosu herkese görünür), yalnız sahibi YAZAR.
create table if not exists public.topluluk_skor (
  user_id    uuid not null references auth.users(id) on delete cascade,
  hafta      text not null,                       -- haftanın Pazartesi tarihi "YYYY-MM-DD"
  ad         text,                                -- görünen ad (profil ismi)
  puan       int  not null default 0,
  kirilim    jsonb,                               -- puan kırılımı (kart/meditasyon/...)
  guncelleme timestamptz not null default now(),
  primary key (user_id, hafta)
);
alter table public.topluluk_skor enable row level security;

drop policy if exists "skor_select_public" on public.topluluk_skor;
create policy "skor_select_public" on public.topluluk_skor
  for select using (true);

drop policy if exists "skor_insert_own" on public.topluluk_skor;
create policy "skor_insert_own" on public.topluluk_skor
  for insert with check (auth.uid() = user_id);

drop policy if exists "skor_update_own" on public.topluluk_skor;
create policy "skor_update_own" on public.topluluk_skor
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists topluluk_skor_hafta_puan
  on public.topluluk_skor (hafta, puan desc);


-- 2) topluluk_kazananlar: haftalık kazananlar arşivi
--    Public OKUMA; yazma YOK → yalnız Edge Function (service_role, RLS'i bypass eder) yazar.
create table if not exists public.topluluk_kazananlar (
  id           bigint generated always as identity primary key,
  hafta        text not null,                     -- Pazartesi tarihi "YYYY-MM-DD"
  sira         int  not null,                     -- 1..10
  user_id      uuid,
  ad           text,
  puan         int,
  unvan        text,                              -- yaln. 1. sıra: "Haftanın Işık Saçan Ruhu"
  rozet        text,                              -- 'altin' (1.) | 'hafta' (2..10)
  kart_no      int,                               -- 1.: Word kart no (1..98) · 2..10: deste indeksi (0..46)
  kart_baslik  text,                              -- 1.: Word kart başlığı (2..10 boş; istemci desteden çözer)
  kart_aciklama text,                             -- 1.: Word kart uzun mesajı
  olusturma    timestamptz not null default now(),
  unique (hafta, sira)
);
alter table public.topluluk_kazananlar enable row level security;

drop policy if exists "kazanan_select_public" on public.topluluk_kazananlar;
create policy "kazanan_select_public" on public.topluluk_kazananlar
  for select using (true);
-- INSERT/UPDATE/DELETE politikası YOK → anon/auth yazamaz (service_role bypass eder).
