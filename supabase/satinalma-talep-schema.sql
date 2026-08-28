-- ============================================================
-- satinalma-talep-schema.sql — Satın Alma Talepleri 🛒
-- ------------------------------------------------------------
-- Kullanıcı dijital ürün için "ödedim / bilgi gönder" dediğinde
-- buraya bir TALEP satırı düşer (uygulama e-postası otomatik yazılır).
-- Yönetici panelden görür, havaleyi gördüyse TEK TIKLA erişim verir
-- (e-posta yazmadan). Amaç: satışları takip etmek + hızlı onay.
-- Supabase → SQL Editor'de bir kez çalıştır.
-- ============================================================

create table if not exists public.satinalma_talep (
  id          bigint generated always as identity primary key,
  user_id     uuid references auth.users(id) on delete set null,
  email       text,                              -- uygulama e-postası (otomatik)
  urun_kod    text not null,
  urun_baslik text,
  fiyat       text,
  kaynak      text default 'web',                -- web | native | manuel
  durum       text not null default 'talep',     -- talep | tamam | iptal
  not         text,                              -- yönetici notu (isteğe bağlı)
  created_at  timestamptz not null default now(),
  onay_at     timestamptz
);

create index if not exists satinalma_talep_durum on public.satinalma_talep (durum, created_at desc);
create index if not exists satinalma_talep_user  on public.satinalma_talep (user_id);

alter table public.satinalma_talep enable row level security;

-- Girişli kullanıcı YALNIZ kendi adına talep ekleyebilir
drop policy if exists "talep_insert" on public.satinalma_talep;
create policy "talep_insert" on public.satinalma_talep
  for insert with check (auth.uid() = user_id);

-- Talepleri yalnız yönetici görür (satış gizliliği)
drop policy if exists "talep_select" on public.satinalma_talep;
create policy "talep_select" on public.satinalma_talep
  for select using (public.is_moderator());

-- Durumu (onay/iptal) yalnız yönetici günceller
drop policy if exists "talep_update" on public.satinalma_talep;
create policy "talep_update" on public.satinalma_talep
  for update using (public.is_moderator()) with check (public.is_moderator());

-- Yalnız yönetici silebilir (isteğe bağlı temizlik)
drop policy if exists "talep_delete" on public.satinalma_talep;
create policy "talep_delete" on public.satinalma_talep
  for delete using (public.is_moderator());
