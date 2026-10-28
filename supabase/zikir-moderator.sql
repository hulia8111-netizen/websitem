-- ============================================================
-- 📿 Toplu Zikir — moderatör (yalnız sen) uygulamadan zikir ekleyip
-- kaldırabilsin. toplu_zikir.sql'e DOKUNMAZ; onun üstüne izin ekler.
-- Normal kullanıcılar yine yalnız okuyabilir; sayı yalnız add_zikir ile artar.
-- Supabase SQL Editor'da BİR KEZ çalıştır (idempotent).
-- ============================================================
drop policy if exists "Moderator zikir ekler" on public.group_zikirs;
create policy "Moderator zikir ekler" on public.group_zikirs
  for insert with check (public.is_moderator());

drop policy if exists "Moderator zikir gunceller" on public.group_zikirs;
create policy "Moderator zikir gunceller" on public.group_zikirs
  for update using (public.is_moderator()) with check (public.is_moderator());
