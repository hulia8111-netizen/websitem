-- ============================================================
-- 👑 Haftanın Işıkları vitrini — tebrik tepkileri + Pazartesi bildirimi
-- Supabase SQL Editor'da BİR KEZ çalıştır (idempotent).
-- ============================================================

-- Vitrin kartına bırakılan "✨ Tebrikler" (kişi başı hafta başı bir tane)
create table if not exists public.topluluk_vitrin_tepki (
  hafta      text not null,                                   -- kutlanan haftanın Pazartesi'si "YYYY-MM-DD"
  user_id    uuid not null references auth.users(id) on delete cascade,
  olusturma  timestamptz not null default now(),
  primary key (hafta, user_id)
);
alter table public.topluluk_vitrin_tepki enable row level security;

drop policy if exists "vitrin_tepki_oku" on public.topluluk_vitrin_tepki;
create policy "vitrin_tepki_oku" on public.topluluk_vitrin_tepki for select using (true);
drop policy if exists "vitrin_tepki_ekle" on public.topluluk_vitrin_tepki;
create policy "vitrin_tepki_ekle" on public.topluluk_vitrin_tepki for insert with check (auth.uid() = user_id);
drop policy if exists "vitrin_tepki_sil" on public.topluluk_vitrin_tepki;
create policy "vitrin_tepki_sil" on public.topluluk_vitrin_tepki for delete using (auth.uid() = user_id);

-- Pazartesi 10:00 (TR) = 07:00 UTC → biten haftanın vitrin bildirimi
select cron.unschedule('vitrin-bildirim-pzt') where exists (select 1 from cron.job where jobname = 'vitrin-bildirim-pzt');
select cron.schedule(
  'vitrin-bildirim-pzt',
  '0 7 * * 1',
  $$
  select net.http_post(
    url := 'https://liotmhoyoduwidojwrkd.functions.supabase.co/haftalik-kazanan?mod=bildir',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
