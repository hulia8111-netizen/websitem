-- ============================================================
-- Topluluk — Yönetici Duyuruları 📢
-- Sadece moderatör yazar/günceller/siler; herkes aktif duyuruları görür.
-- is_moderator() fonksiyonu topluluk-sosyal-schema.sql'de tanımlı
-- (önce onu çalıştırmış olmalısın). Supabase SQL Editor'da bir kez çalıştır (idempotent).
-- ============================================================

create table if not exists public.topluluk_duyuru (
  id bigint generated always as identity primary key,
  baslik text not null,
  metin text not null,
  aktif boolean not null default true,
  bildir boolean not null default false,   -- yayınlanırken bildirim istendi mi
  olusturma timestamptz not null default now()
);
alter table public.topluluk_duyuru enable row level security;

-- Aktif duyuruları herkes görür; moderatör pasif olanları da görür
drop policy if exists "duyuru_select" on public.topluluk_duyuru;
create policy "duyuru_select" on public.topluluk_duyuru for select
  using (aktif = true or public.is_moderator());

-- Yalnız moderatör ekler / günceller / siler
drop policy if exists "duyuru_insert" on public.topluluk_duyuru;
create policy "duyuru_insert" on public.topluluk_duyuru for insert
  with check (public.is_moderator());
drop policy if exists "duyuru_update" on public.topluluk_duyuru;
create policy "duyuru_update" on public.topluluk_duyuru for update
  using (public.is_moderator()) with check (public.is_moderator());
drop policy if exists "duyuru_delete" on public.topluluk_duyuru;
create policy "duyuru_delete" on public.topluluk_duyuru for delete
  using (public.is_moderator());

create index if not exists topluluk_duyuru_zaman on public.topluluk_duyuru (aktif, olusturma desc);

-- ============================================================
-- İSTEĞE BAĞLI: yeni duyuru "bildir=true" ile yayınlanınca tüm abonelere
-- Web Push gönder. Çalışması için 'duyuru-bildirim' Edge Function'ı deploy
-- edilmeli (supabase/functions/duyuru-bildirim). pg_net eklentisi kart/evren
-- bildirimleri için zaten aktif.
-- ============================================================
create or replace function public.duyuru_bildir_tetikle()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.bildir then
    perform net.http_post(
      url := 'https://liotmhoyoduwidojwrkd.functions.supabase.co/duyuru-bildirim',
      headers := '{"Content-Type":"application/json"}'::jsonb,
      body := json_build_object('baslik', new.baslik, 'metin', new.metin)::jsonb
    );
  end if;
  return new;
end; $$;
drop trigger if exists trg_duyuru_bildir on public.topluluk_duyuru;
create trigger trg_duyuru_bildir after insert on public.topluluk_duyuru
  for each row execute function public.duyuru_bildir_tetikle();
