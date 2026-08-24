-- ============================================================
-- dijital-urun-schema.sql — Dijital ürün KATALOĞU (self-servis) 📦
-- ------------------------------------------------------------
-- Ürünler artık koddan değil bu tablodan okunur. Yönetici (moderatör)
-- uygulamadaki "Yeni Ürün Ekle" panelinden ekler → mağazada anında çıkar.
-- Katalog herkese açıktır (pazarlama listesi); İÇERİK yine özel depoda
-- ve erişim yine kullanici_kutuphane ile korunur.
-- Bu SQL'i Supabase → SQL Editor'de bir kez çalıştır.
-- ============================================================

create table if not exists public.dijital_urun (
  kod        text primary key,          -- ör: ritueller-2026-09 (= depo klasör adı)
  baslik     text not null,             -- ör: Eylül 2026 · Spiritüel Ritüeller
  ozet       text,                      -- ör: Yeniay Manifest Ritüeli · 21 Eylül
  aciklama   text,
  icerik     text[],                    -- madde listesi (her biri bir satır)
  fiyat      text,                      -- ör: 88 TL
  tarih      text,                      -- ör: 2026-09
  dosya_ad   text default 'rehber.pdf', -- depoda klasör içindeki dosya adı
  sira       int  default 0,            -- büyük olan üstte
  aktif      boolean default true,
  olusturma  timestamptz default now()
);

alter table public.dijital_urun enable row level security;

-- Herkes aktif ürünleri görebilir (katalog = herkese açık pazarlama)
drop policy if exists "urun_herkes_oku" on public.dijital_urun;
create policy "urun_herkes_oku" on public.dijital_urun
  for select using (aktif = true);

-- Yalnız moderatör ekler / günceller / siler
drop policy if exists "urun_mod_yaz" on public.dijital_urun;
create policy "urun_mod_yaz" on public.dijital_urun
  for all using (public.is_moderator()) with check (public.is_moderator());

-- Mevcut Ağustos ürününü kataloğa taşı
insert into public.dijital_urun (kod, baslik, ozet, aciklama, icerik, fiyat, tarih, sira)
values (
  'ritueller-2026-08',
  'Ağustos 2026 · Spiritüel Ritüeller',
  'Dolunay Bırakma Ritüeli · 28 Ağustos',
  'Bu ayın teması: Bırakma · Arınma · Yeni alana yer açma. Dolunay bırakma ritüeli, ritüel sonrası farkındalık soruları ve yazdırılabilir “Ayın Niyeti” kartı — hepsi kalıcı olarak senin.',
  array['Aylık Spiritüel Ritüeller PDF’si','PDF’ye kalıcı erişim','İstediğin zaman tekrar aç & indir'],
  '88 TL',
  '2026-08',
  100
)
on conflict (kod) do nothing;
