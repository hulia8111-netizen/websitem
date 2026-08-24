-- ============================================================
-- kutuphane-schema.sql — Dijital Ürün Kütüphanesi 📚
-- ------------------------------------------------------------
-- Kullanıcı bir dijital ürünü (aylık spiritüel ritüel PDF'i) satın
-- alınca hesabına KALICI erişim tanınır. İçerik özel (private) depoda
-- durur; yalnız yetkili kullanıcı görüntüler + indirir.
--
-- Ürün kodu örn: "ritueller-2026-08"
-- Depo yolu     : ritueller/<urun_kod>/<dosya>  (örn ritueller/ritueller-2026-08/rehber.pdf)
-- Bu SQL'i Supabase → SQL Editor'de bir kez çalıştır.
-- ============================================================

-- 1) KÜTÜPHANE (yetki) tablosu -------------------------------
create table if not exists public.kullanici_kutuphane (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  urun_kod   text not null,
  baslik     text,
  fiyat      text,
  kaynak     text default 'manuel',        -- manuel | shopier | iyzico | hediye
  tarih      timestamptz not null default now(),
  unique (user_id, urun_kod)               -- aynı ürün iki kez düşmesin
);

alter table public.kullanici_kutuphane enable row level security;

-- Kullanıcı YALNIZ kendi satın aldıklarını görebilir.
drop policy if exists "kutuphane_kendi_oku" on public.kullanici_kutuphane;
create policy "kutuphane_kendi_oku" on public.kullanici_kutuphane
  for select using (auth.uid() = user_id);

-- Insert/update/delete için client politikası YOK → kimse kendine
-- ürün ekleyemez. Erişim yalnız 'eris-ver' Edge Function (service_role)
-- üzerinden verilir (RLS'i baypas eder).

create index if not exists kutuphane_user_idx on public.kullanici_kutuphane(user_id);


-- 2) ÖZEL DEPO (private bucket) ------------------------------
insert into storage.buckets (id, name, public)
values ('ritueller', 'ritueller', false)
on conflict (id) do nothing;

-- Yetkili kullanıcı, sahip olduğu ürünün klasöründeki dosyaları okur.
-- Yol deseni: <urun_kod>/<dosya>  → ilk klasör adı = urun_kod
drop policy if exists "ritueller_yetkili_oku" on storage.objects;
create policy "ritueller_yetkili_oku" on storage.objects
  for select using (
    bucket_id = 'ritueller'
    and exists (
      select 1 from public.kullanici_kutuphane k
      where k.user_id = auth.uid()
        and k.urun_kod = split_part(name, '/', 1)
    )
  );

-- (Yükleme/silme yalnız Supabase panelinden yapılacak; client yazma
--  politikası tanımlanmadı → kullanıcılar depoya yazamaz.)
