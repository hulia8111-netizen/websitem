-- ============================================================
-- "Evrenden Mesajını Al" — sunucu push kurulumu
-- Supabase Dashboard > SQL Editor'de bir kez çalıştır.
-- (pg_cron ve pg_net eklentileri zaten kart hatırlatması için aktif.)
-- ============================================================

-- 1) Slot başına günlük gönderim/tekrar takibi için kolon
alter table public.push_abone add column if not exists evren_gon jsonb;

-- 2) Her 5 dakikada bir evren-mesaji fonksiyonunu tetikle
--    (fonksiyon --no-verify-jwt ile dağıtıldığı için auth başlığı gerekmez)
select cron.schedule(
  'evren-mesaji-5dk',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://liotmhoyoduwidojwrkd.functions.supabase.co/evren-mesaji',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- Kontrol: kurulu cron işleri
-- select jobid, schedule, jobname from cron.job order by jobid;
-- Kaldırmak için: select cron.unschedule('evren-mesaji-5dk');
