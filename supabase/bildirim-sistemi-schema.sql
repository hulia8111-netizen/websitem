-- ============================================================
-- Bildirim Sistemi 2.0 — Native Push (Expo/FCM) + Duyuru okundu/RSVP
-- Supabase SQL Editor'da BİR KEZ çalıştır (idempotent).
-- Mevcut push_abone (Web Push) ile ÇAKIŞMAZ; bu ayrı tablolar ekler.
-- ============================================================

-- ---- 1) Expo push token'ları (misafir + girişli kullanıcı) ----
-- Her cihazın bir Expo push token'ı olur. Misafirde user_id boş, cihaz_id dolu.
create table if not exists public.push_token (
  token text primary key,                       -- Expo push token (ExponentPushToken[...])
  user_id uuid references auth.users(id) on delete set null,
  cihaz_id text,                                -- misafir eşleşmesi için (localStorage)
  platform text not null default 'android',
  -- Tercihler (kullanıcı ayarlardan değiştirir)
  duyuru boolean not null default true,         -- Yönetici duyuruları (temel; kapatılabilir)
  topluluk boolean not null default true,       -- Topluluk duyuru/etkinlik bildirimleri
  ilham boolean not null default true,          -- Günlük 1 İlham Cümlesi (temel; kapatılabilir)
  ilham_saat text not null default '12:00',     -- zorunlu tek ilham bildirimi saati
  ek_saatler jsonb not null default '[]'::jsonb,-- kullanıcının eklediği ekstra saatler ["08:00","20:00"]
  tz text not null default 'Europe/Istanbul',
  gon jsonb not null default '{}'::jsonb,       -- ilham gönderim durumu: {gun, slots:[dk], gecmis:[söz idx]} (tekrarı önler)
  guncelleme timestamptz not null default now()
);
create index if not exists push_token_user on public.push_token (user_id);
create index if not exists push_token_cihaz on public.push_token (cihaz_id);

alter table public.push_token enable row level security;
-- Token sahibi (herkes, misafir dahil) kendi satırını yazabilir/güncelleyebilir.
-- Token tahmin edilemez olduğundan upsert'e izin veriyoruz; okuma yalnız service role (Edge Function).
drop policy if exists "push_token_insert" on public.push_token;
create policy "push_token_insert" on public.push_token for insert with check (true);
drop policy if exists "push_token_update" on public.push_token;
create policy "push_token_update" on public.push_token for update using (true) with check (true);
drop policy if exists "push_token_select_self" on public.push_token;
create policy "push_token_select_self" on public.push_token for select
  using (auth.uid() is not null and auth.uid() = user_id);

-- ---- 2) Duyuru okundu takibi (okundu + tekrar göndermeme) ----
-- kim = girişli ise user_id (uuid metin), misafir ise cihaz_id.
create table if not exists public.duyuru_okundu (
  duyuru_id bigint not null references public.topluluk_duyuru(id) on delete cascade,
  kim text not null,
  okundu_at timestamptz not null default now(),
  primary key (duyuru_id, kim)
);
alter table public.duyuru_okundu enable row level security;
-- Herkes kendi "okundu" kaydını ekleyebilir (misafir dahil). Okuma: kendi + moderatör.
drop policy if exists "duyuru_okundu_insert" on public.duyuru_okundu;
create policy "duyuru_okundu_insert" on public.duyuru_okundu for insert with check (true);
drop policy if exists "duyuru_okundu_select" on public.duyuru_okundu;
create policy "duyuru_okundu_select" on public.duyuru_okundu for select
  using (public.is_moderator() or kim = coalesce(auth.uid()::text, kim));

-- ---- 3) Topluluk duyurusu → ETKİNLİK + RSVP (katılım) ----
alter table public.topluluk_duyuru add column if not exists etkinlik boolean not null default false;

create table if not exists public.duyuru_katilim (
  duyuru_id bigint not null references public.topluluk_duyuru(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  ad text,
  durum text not null check (durum in ('katiliyorum','katilamiyorum','sonra')),
  guncelleme timestamptz not null default now(),
  primary key (duyuru_id, user_id)
);
alter table public.duyuru_katilim enable row level security;
-- GÜVENLİK: kullanıcı yalnızca KENDİ katılım durumunu ekler/değiştirir.
drop policy if exists "katilim_insert_self" on public.duyuru_katilim;
create policy "katilim_insert_self" on public.duyuru_katilim for insert with check (auth.uid() = user_id);
drop policy if exists "katilim_update_self" on public.duyuru_katilim;
create policy "katilim_update_self" on public.duyuru_katilim for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Okuma: herkes (sayımlar için) — kişi bazında değil toplu kullanılır; moderatör kırılımı görür.
drop policy if exists "katilim_select" on public.duyuru_katilim;
create policy "katilim_select" on public.duyuru_katilim for select using (true);

-- Yöneticiye kırılım: her duyuru için durum sayıları
create or replace view public.duyuru_katilim_ozet as
  select duyuru_id,
         count(*) filter (where durum = 'katiliyorum')  as katiliyorum,
         count(*) filter (where durum = 'katilamiyorum') as katilamiyorum,
         count(*) filter (where durum = 'sonra')         as sonra
  from public.duyuru_katilim
  group by duyuru_id;
