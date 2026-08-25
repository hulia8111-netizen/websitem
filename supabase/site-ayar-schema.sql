-- ============================================================
-- site-ayar-schema.sql — Ödeme & iletişim ayarları (self-servis) 💳
-- ------------------------------------------------------------
-- IBAN, hesap adı ve WhatsApp numaraları panelden değiştirilebilsin.
-- anahtar/deger tablosu. Herkes okur (satın alma penceresi için),
-- yalnız yönetici yazar.
-- ============================================================

create table if not exists public.site_ayar (
  anahtar     text primary key,
  deger       text,
  guncelleme  timestamptz default now()
);

alter table public.site_ayar enable row level security;

drop policy if exists "site_ayar_herkes_oku" on public.site_ayar;
create policy "site_ayar_herkes_oku" on public.site_ayar for select using (true);

drop policy if exists "site_ayar_mod_yaz" on public.site_ayar;
create policy "site_ayar_mod_yaz" on public.site_ayar
  for all using (public.is_moderator()) with check (public.is_moderator());

-- Başlangıç değerleri (mevcut hardcoded değerler)
insert into public.site_ayar (anahtar, deger) values
  ('iban',        'TR77 0015 7000 0000 0203 2018 98'),
  ('iban_ad',     'Hülya Işıkoğlu'),
  ('wa_dijital',  '905345276192'),
  ('wa_mum',      '905300421259')
on conflict (anahtar) do nothing;
