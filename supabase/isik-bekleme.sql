-- ============================================================
-- Işık Kartları bekleme listesi — "Destem Gelince Haber Ver"
-- (js/isikfisilti.js). Supabase SQL Editor'de bir kez çalıştır.
-- ============================================================

create table if not exists public.isik_bekleme (
  cihaz_id   text primary key,
  user_id    uuid references auth.users(id) on delete set null,
  koleksiyon int default 0,                 -- katıldığında kaç kart numarası toplamıştı
  created_at timestamptz default now()
);

alter table public.isik_bekleme enable row level security;

-- Herkes (misafir dahil) kendini ekleyebilir/güncelleyebilir; okuma yalnızca panelden (service role).
drop policy if exists "isik_bekleme_insert" on public.isik_bekleme;
create policy "isik_bekleme_insert" on public.isik_bekleme for insert with check (true);
drop policy if exists "isik_bekleme_update" on public.isik_bekleme;
create policy "isik_bekleme_update" on public.isik_bekleme for update using (true) with check (true);

-- Kaç kişi bekliyor?
--   select count(*) from public.isik_bekleme;
--
-- LANSMAN GÜNÜ — bekleme listesindeki cihazların push jetonları:
--   select distinct p.token
--   from public.isik_bekleme b
--   join public.push_token p on p.cihaz_id = b.cihaz_id
--                            or (b.user_id is not null and p.user_id = b.user_id);
-- Bu jetonlara mevcut net.http_post toplu push akışıyla gönder:
--   Başlık: "Işık Kartları açıldı 🌙"
--   Metin:  "Seni seçen kartların hepsi artık elinde olabilir. İlk haber sana ✦"
