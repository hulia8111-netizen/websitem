-- ============================================================
-- Işığını Bul · Web Push abonelik tablosu (gerçek bildirim)
-- Supabase paneli → SQL Editor → (ÇEVİRİ KAPALI) → yapıştır → Run
-- ============================================================

create table if not exists public.push_abone (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  abone        jsonb not null,        -- tarayıcı push aboneliği (endpoint + keys)
  son_gonderim date,                  -- aynı gün ikinci kez göndermeyi önler
  guncelleme   timestamptz default now()
);

alter table public.push_abone enable row level security;

drop policy if exists "push okur"     on public.push_abone;
drop policy if exists "push ekler"     on public.push_abone;
drop policy if exists "push gunceller" on public.push_abone;
drop policy if exists "push siler"     on public.push_abone;

create policy "push okur"     on public.push_abone for select using (auth.uid() = user_id);
create policy "push ekler"     on public.push_abone for insert with check (auth.uid() = user_id);
create policy "push gunceller" on public.push_abone for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "push siler"     on public.push_abone for delete using (auth.uid() = user_id);
