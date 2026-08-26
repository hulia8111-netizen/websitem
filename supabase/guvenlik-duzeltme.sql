-- ============================================================
-- guvenlik-duzeltme.sql — RLS sızıntı kapatma 🔐
-- ------------------------------------------------------------
-- Bulgu: duyuru_katilim ve duyuru_okundu tablolarındaki SELECT
-- politikaları misafirin (anon) TÜM satırları (user_id + durum)
-- okumasına izin veriyordu. Aşağıdaki politikalar bunu kapatır:
--   • Yönetici (moderatör) → hepsini görür (sayımlar için)
--   • Girişli kullanıcı → yalnız KENDİ kaydını görür
--   • Misafir → yalnız kimlik içermeyen misafir cihaz kayıtlarını
-- Bu SQL'i Supabase → SQL Editor'de bir kez çalıştır.
-- ============================================================

-- 1) duyuru_katilim: yalnız kendi + moderatör
drop policy if exists "katilim_select" on public.duyuru_katilim;
create policy "katilim_select" on public.duyuru_katilim
  for select using (public.is_moderator() or auth.uid() = user_id);

-- 2) duyuru_okundu: girişli kendi + moderatör + (kimlik içermeyen) misafir kayıtları
drop policy if exists "duyuru_okundu_select" on public.duyuru_okundu;
create policy "duyuru_okundu_select" on public.duyuru_okundu
  for select using (
    public.is_moderator()
    or (auth.uid() is not null and kim = auth.uid()::text)
    or kim like 'c:%'
  );
