-- ============================================================
-- Topluluk Bildirimleri — meta tablo + tetikleyiciler
-- Yeni içerik gelince moderatöre, içerik onaylanınca yazara Web Push.
-- pg_net ile topluluk-bildirim Edge Function'ı çağrılır (fire-and-forget).
-- ============================================================

-- Throttle/durum için küçük meta tablo (yalnız service-role erişir)
create table if not exists public.topluluk_meta (
  anahtar text primary key,
  deger jsonb,
  guncelleme timestamptz not null default now()
);
alter table public.topluluk_meta enable row level security;  -- politika yok → istemci erişemez

-- Yeni içerik (beklemede) → moderatöre bildirim tetikle
create or replace function public.tb_yeni_icerik()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if NEW.durum = 'beklemede' then
    perform net.http_post(
      url := 'https://liotmhoyoduwidojwrkd.functions.supabase.co/topluluk-bildirim',
      headers := '{"Content-Type":"application/json"}'::jsonb,
      body := '{"tip":"yeni_icerik"}'::jsonb
    );
  end if;
  return NEW;
end; $$;

drop trigger if exists trg_tb_gonderi on public.topluluk_gonderi;
create trigger trg_tb_gonderi after insert on public.topluluk_gonderi
  for each row execute function public.tb_yeni_icerik();

drop trigger if exists trg_tb_yorum on public.topluluk_yorum;
create trigger trg_tb_yorum after insert on public.topluluk_yorum
  for each row execute function public.tb_yeni_icerik();

-- İçerik onaylandı → yazara bildirim tetikle
create or replace function public.tb_onaylandi()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if NEW.durum = 'onayli' and OLD.durum is distinct from 'onayli' then
    perform net.http_post(
      url := 'https://liotmhoyoduwidojwrkd.functions.supabase.co/topluluk-bildirim',
      headers := '{"Content-Type":"application/json"}'::jsonb,
      body := jsonb_build_object('tip','onaylandi','user_id', NEW.user_id::text)
    );
  end if;
  return NEW;
end; $$;

drop trigger if exists trg_tb_onay on public.topluluk_gonderi;
create trigger trg_tb_onay after update on public.topluluk_gonderi
  for each row execute function public.tb_onaylandi();
