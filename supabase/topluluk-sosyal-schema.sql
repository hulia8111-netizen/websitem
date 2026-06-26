-- ============================================================
-- Topluluk Faz 2 — Sosyal + Moderasyon (pre-moderation)
-- Paylaşımlar / Yorumlar / Tepkiler / Takip / Engelleme / Rapor.
-- KURAL: paylaşım ve yorumlar moderatör ONAYLAMADAN kimseye görünmez.
-- Supabase SQL Editor'da bir kez çalıştır (idempotent).
-- ============================================================

-- ---- Moderatör allowlist + yardımcı fonksiyon ----
create table if not exists public.topluluk_moderator (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.topluluk_moderator enable row level security;
drop policy if exists "mod_self_select" on public.topluluk_moderator;
create policy "mod_self_select" on public.topluluk_moderator for select using (auth.uid() = user_id);

create or replace function public.is_moderator()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.topluluk_moderator m where m.user_id = auth.uid());
$$;

-- ---- Gönderiler (paylaşımlar) ----
create table if not exists public.topluluk_gonderi (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  ad text,
  tip text not null default 'paylasim',     -- 'paylasim' | 'sukran' | 'basari'
  metin text not null,
  durum text not null default 'beklemede',  -- 'beklemede' | 'onayli' | 'red'
  rapor_sayisi int not null default 0,
  olusturma timestamptz not null default now()
);
alter table public.topluluk_gonderi enable row level security;
-- Onaylı herkese; kendi gönderini her durumda; moderatör hepsini görür
drop policy if exists "gonderi_select" on public.topluluk_gonderi;
create policy "gonderi_select" on public.topluluk_gonderi for select
  using (durum = 'onayli' or auth.uid() = user_id or public.is_moderator());
-- Yalnız kendi adına ve 'beklemede' eklenebilir (kendini onaylayamaz)
drop policy if exists "gonderi_insert" on public.topluluk_gonderi;
create policy "gonderi_insert" on public.topluluk_gonderi for insert
  with check (auth.uid() = user_id and durum = 'beklemede');
-- Durum değişimini yalnız moderatör yapar
drop policy if exists "gonderi_update_mod" on public.topluluk_gonderi;
create policy "gonderi_update_mod" on public.topluluk_gonderi for update
  using (public.is_moderator()) with check (public.is_moderator());
-- Yazar kendi gönderisini, moderatör herhangi birini silebilir
drop policy if exists "gonderi_delete" on public.topluluk_gonderi;
create policy "gonderi_delete" on public.topluluk_gonderi for delete
  using (auth.uid() = user_id or public.is_moderator());
create index if not exists topluluk_gonderi_durum_zaman on public.topluluk_gonderi (durum, olusturma desc);

-- ---- Yorumlar (pre-moderation aynı kural) ----
create table if not exists public.topluluk_yorum (
  id bigint generated always as identity primary key,
  gonderi_id bigint not null references public.topluluk_gonderi(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  ad text,
  metin text not null,
  durum text not null default 'beklemede',
  rapor_sayisi int not null default 0,
  olusturma timestamptz not null default now()
);
alter table public.topluluk_yorum enable row level security;
drop policy if exists "yorum_select" on public.topluluk_yorum;
create policy "yorum_select" on public.topluluk_yorum for select
  using (durum = 'onayli' or auth.uid() = user_id or public.is_moderator());
drop policy if exists "yorum_insert" on public.topluluk_yorum;
create policy "yorum_insert" on public.topluluk_yorum for insert
  with check (auth.uid() = user_id and durum = 'beklemede');
drop policy if exists "yorum_update_mod" on public.topluluk_yorum;
create policy "yorum_update_mod" on public.topluluk_yorum for update
  using (public.is_moderator()) with check (public.is_moderator());
drop policy if exists "yorum_delete" on public.topluluk_yorum;
create policy "yorum_delete" on public.topluluk_yorum for delete
  using (auth.uid() = user_id or public.is_moderator());
create index if not exists topluluk_yorum_gonderi on public.topluluk_yorum (gonderi_id, durum, olusturma);

-- ---- Tepkiler (preset; onay gerektirmez) ----
create table if not exists public.topluluk_tepki (
  gonderi_id bigint not null references public.topluluk_gonderi(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  tip text not null,                          -- 'tebrikler' | 'ilham' | 'yaninda'
  olusturma timestamptz not null default now(),
  primary key (gonderi_id, user_id)
);
alter table public.topluluk_tepki enable row level security;
drop policy if exists "tepki_select" on public.topluluk_tepki;
create policy "tepki_select" on public.topluluk_tepki for select using (true);
drop policy if exists "tepki_ins" on public.topluluk_tepki;
create policy "tepki_ins" on public.topluluk_tepki for insert with check (auth.uid() = user_id);
drop policy if exists "tepki_upd" on public.topluluk_tepki;
create policy "tepki_upd" on public.topluluk_tepki for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "tepki_del" on public.topluluk_tepki;
create policy "tepki_del" on public.topluluk_tepki for delete using (auth.uid() = user_id);

-- ---- Takip ----
create table if not exists public.topluluk_takip (
  user_id uuid not null references auth.users(id) on delete cascade,          -- takip eden
  takip_edilen_id uuid not null references auth.users(id) on delete cascade,  -- takip edilen
  olusturma timestamptz not null default now(),
  primary key (user_id, takip_edilen_id)
);
alter table public.topluluk_takip enable row level security;
drop policy if exists "takip_select" on public.topluluk_takip;
create policy "takip_select" on public.topluluk_takip for select using (true);
drop policy if exists "takip_ins" on public.topluluk_takip;
create policy "takip_ins" on public.topluluk_takip for insert with check (auth.uid() = user_id and user_id <> takip_edilen_id);
drop policy if exists "takip_del" on public.topluluk_takip;
create policy "takip_del" on public.topluluk_takip for delete using (auth.uid() = user_id);

-- ---- Engelleme (kullanıcı kendi engel listesini yönetir; içerik istemcide filtrelenir) ----
create table if not exists public.topluluk_engel (
  user_id uuid not null references auth.users(id) on delete cascade,
  engellenen_id uuid not null references auth.users(id) on delete cascade,
  olusturma timestamptz not null default now(),
  primary key (user_id, engellenen_id)
);
alter table public.topluluk_engel enable row level security;
drop policy if exists "engel_all" on public.topluluk_engel;
create policy "engel_all" on public.topluluk_engel for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---- Raporlar (zorunlu — Play UGC politikası) ----
create table if not exists public.topluluk_rapor (
  id bigint generated always as identity primary key,
  hedef_tip text not null,        -- 'gonderi' | 'yorum'
  hedef_id bigint not null,
  user_id uuid not null references auth.users(id) on delete cascade,  -- raporlayan
  sebep text,
  olusturma timestamptz not null default now(),
  unique (hedef_tip, hedef_id, user_id)
);
alter table public.topluluk_rapor enable row level security;
drop policy if exists "rapor_insert" on public.topluluk_rapor;
create policy "rapor_insert" on public.topluluk_rapor for insert with check (auth.uid() = user_id);
drop policy if exists "rapor_select" on public.topluluk_rapor;
create policy "rapor_select" on public.topluluk_rapor for select using (public.is_moderator() or auth.uid() = user_id);

-- Rapor gelince hedefin rapor_sayisi'nı artır (moderatöre sinyal)
create or replace function public.rapor_say_arttir()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.hedef_tip = 'gonderi' then
    update public.topluluk_gonderi set rapor_sayisi = rapor_sayisi + 1 where id = new.hedef_id;
  elsif new.hedef_tip = 'yorum' then
    update public.topluluk_yorum set rapor_sayisi = rapor_sayisi + 1 where id = new.hedef_id;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_rapor_say on public.topluluk_rapor;
create trigger trg_rapor_say after insert on public.topluluk_rapor
  for each row execute function public.rapor_say_arttir();
