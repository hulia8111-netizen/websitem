-- ============================================================
-- Topluluk Fotoğraf — gönderi foto sütunu + depolama kovası + güvenlik
-- ============================================================

-- Gönderilere isteğe bağlı fotoğraf URL'si
alter table public.topluluk_gonderi add column if not exists foto_url text;

-- Depolama kovası (public okuma; 5MB; yalnız resim)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('topluluk-foto', 'topluluk-foto', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Herkes okuyabilir (onaylı paylaşımların fotoğrafı feed'de görünür)
drop policy if exists "tfoto_read" on storage.objects;
create policy "tfoto_read" on storage.objects for select using (bucket_id = 'topluluk-foto');

-- Yalnız giriş yapan kullanıcı, KENDİ klasörüne yükler (yol: <user_id>/<dosya>)
drop policy if exists "tfoto_insert" on storage.objects;
create policy "tfoto_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'topluluk-foto' and (storage.foldername(name))[1] = auth.uid()::text);

-- Kullanıcı kendi fotoğrafını, moderatör herhangi birini silebilir
drop policy if exists "tfoto_delete" on storage.objects;
create policy "tfoto_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'topluluk-foto' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_moderator()));
