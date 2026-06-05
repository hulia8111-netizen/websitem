-- ============================================================
-- Işığını Bul · Bulut senkron tablosu + güvenlik (RLS)
-- Supabase paneli → SQL Editor → bu dosyanın tamamını yapıştır → "Run"
-- ============================================================

-- Kullanıcıya özel anahtar-değer tablosu
create table if not exists public.kullanici_veri (
  user_id    uuid not null references auth.users(id) on delete cascade,
  anahtar    text not null,
  deger      jsonb,
  guncelleme timestamptz default now(),
  primary key (user_id, anahtar)
);

-- Satır Düzeyi Güvenlik: herkes yalnızca KENDİ verisine erişir
alter table public.kullanici_veri enable row level security;

drop policy if exists "kendi verisini okur"     on public.kullanici_veri;
drop policy if exists "kendi verisini ekler"     on public.kullanici_veri;
drop policy if exists "kendi verisini gunceller" on public.kullanici_veri;
drop policy if exists "kendi verisini siler"     on public.kullanici_veri;

create policy "kendi verisini okur"     on public.kullanici_veri for select using (auth.uid() = user_id);
create policy "kendi verisini ekler"     on public.kullanici_veri for insert with check (auth.uid() = user_id);
create policy "kendi verisini gunceller" on public.kullanici_veri for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "kendi verisini siler"     on public.kullanici_veri for delete using (auth.uid() = user_id);
