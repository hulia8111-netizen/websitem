-- ============================================================
-- "Mağazam" — Supabase ürün tablosu kurulumu
-- Supabase Dashboard > SQL Editor'de bir kez çalıştır (ya da
-- Management API ile uygulanır). Panelden ürün ekle/düzenle →
-- uygulama güncellemesi GEREKMEZ, anında görünür.
-- ============================================================

create table if not exists public.magaza_urunler (
  id bigint generated always as identity primary key,
  kategori   text not null,           -- isik-kartlari | mumlar | sesli-icerik | etkinlik
  ad         text not null,
  aciklama   text,
  gorsel     text,                     -- görsel URL (boşsa kategori ikonu gösterilir)
  fiyat      text,                     -- "₺250" gibi (opsiyonel)
  link       text,                     -- dış satış sayfası (Shopier/iyzico/site); boşsa "Yakında"
  tip        text default 'link',      -- gelecek: 'link' | 'iap' (uygulama-içi satın alma)
  sira       int default 0,            -- sıralama (küçük önce)
  aktif      boolean default true,     -- false ise mağazada görünmez
  created_at timestamptz default now()
);

-- Herkese açık OKUMA (yalnızca aktif ürünler). Yazma yok → yönetim panelden.
alter table public.magaza_urunler enable row level security;
drop policy if exists "magaza herkese acik okuma" on public.magaza_urunler;
create policy "magaza herkese acik okuma"
  on public.magaza_urunler for select
  using (aktif = true);

grant select on public.magaza_urunler to anon, authenticated;

-- Örnek ürünler (panelden değiştirebilir/silebilirsin)
insert into public.magaza_urunler (kategori, ad, aciklama, sira) values
  ('isik-kartlari', 'Melek & Tarot Kartı Destesi', 'Günün rehberliği için ilham veren kart destesi.', 1),
  ('isik-kartlari', 'Işık Mesajı Kartları', 'Her çekilişte içsel bir mesaj sunan özel kartlar.', 2),
  ('mumlar', 'Şifa Mumu', 'Meditasyon ve ritüellerine eşlik eden doğal soya mumu.', 1),
  ('mumlar', 'Tütsü & Adaçayı Seti', 'Alanını arındırmak için doğal tütsü ve adaçayı.', 2),
  ('mumlar', 'Doğal Kristal Seti', 'Niyet ve denge için özenle seçilmiş şifa taşları.', 3),
  ('sesli-icerik', 'Rehberli Meditasyon Seti', 'Derin gevşeme için sesli meditasyon koleksiyonu.', 1),
  ('sesli-icerik', 'Uyku Hikâyeleri', 'Huzurlu bir uykuya geçiş için sesli anlatılar.', 2),
  ('etkinlik', 'Online Farkındalık Atölyesi', 'Canlı katılımlı farkındalık ve nefes atölyesi.', 1),
  ('etkinlik', 'Birebir Koçluk Seansı', 'Kişiye özel spiritüel rehberlik görüşmesi.', 2);
