-- ============================================================
-- ilham-cumle-schema.sql — Self-servis İlham Cümleleri ✨
-- ------------------------------------------------------------
-- Yönetici panelinden eklenen ilham cümleleri. Uygulamadaki 542
-- temel cümlenin ÜSTÜNE biner (splash + Günün İlhamı + bildirimler
-- hepsi bu genişletilmiş havuzu kullanır). Herkes okur, moderatör yazar.
-- Bu SQL'i Supabase → SQL Editor'de bir kez çalıştır.
-- ============================================================

create table if not exists public.ilham_cumle (
  id         uuid primary key default gen_random_uuid(),
  metin      text not null,
  sira       bigint default 0,          -- sıralama (eklenme sırası)
  aktif      boolean default true,
  olusturma  timestamptz default now()
);

alter table public.ilham_cumle enable row level security;

drop policy if exists "ilham_cumle_herkes_oku" on public.ilham_cumle;
create policy "ilham_cumle_herkes_oku" on public.ilham_cumle
  for select using (aktif = true);

drop policy if exists "ilham_cumle_mod_yaz" on public.ilham_cumle;
create policy "ilham_cumle_mod_yaz" on public.ilham_cumle
  for all using (public.is_moderator()) with check (public.is_moderator());

create index if not exists ilham_cumle_sira_idx on public.ilham_cumle(sira);
