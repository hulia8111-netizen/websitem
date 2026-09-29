-- ============================================================
-- Nazik Geri Çağırma — push_token ek sütunları
-- Supabase SQL Editor'da BİR KEZ çalıştır (idempotent).
-- ÖNEMLİ: Site güncellemesinden (v250) ÖNCE çalıştırılmalı; yoksa
-- uygulama yeni sütunları yazamaz ve jeton kaydı başarısız olur.
-- ============================================================
alter table public.push_token add column if not exists son_acilis timestamptz;   -- son uygulama kullanımı
alter table public.push_token add column if not exists hatirlatma boolean not null default true; -- "Nazik hatırlatmalar" anahtarı
alter table public.push_token add column if not exists son_ruh text;             -- 'dusuk' → yalnız en yumuşak ton
alter table public.push_token add column if not exists geri jsonb not null default '{}'::jsonb;
  -- geri = {acilis, asamalar:["7","14","ay","30"], son:"YYYY-MM-DD", ay_son:"YYYY-MM-DD", msgler:[id...]}

-- Mevcut satırlar: son kullanım bilinmiyor → son güncelleme zamanı kabul edilir
update public.push_token set son_acilis = guncelleme where son_acilis is null;
alter table public.push_token alter column son_acilis set default now();
