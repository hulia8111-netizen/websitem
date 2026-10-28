-- =====================================================================
-- TOPLU ZİKİR (Zikirmatik) - Supabase kurulumu
-- Supabase Dashboard > SQL Editor'e yapıştırıp bir kez çalıştır.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- 1) Zikirler (sadece sen eklersin, kullanıcılar sadece okur)
create table if not exists public.group_zikirs (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,                 -- Örn: "Salavat-ı Şerife"
  zikir_text        text,                          -- Okunuşu / Arapçası
  description       text,                          -- Kısa açıklama / niyet
  target_count      integer not null check (target_count > 0),  -- Örn: 50000
  current_count     integer not null default 0,
  participant_count integer not null default 0,
  is_active         boolean not null default true,
  completed_at      timestamptz,
  created_at        timestamptz not null default now()
);

-- 2) Katılımcılar: SADECE anonim hash tutulur (isim, e-posta, kişi başı adet YOK).
--    Zikir tamamlanınca bu kayıtlar otomatik silinir.
create table if not exists public.group_zikir_participants (
  zikir_id         uuid not null references public.group_zikirs(id) on delete cascade,
  participant_hash text not null,
  last_sync_at     timestamptz not null default now(),
  primary key (zikir_id, participant_hash)
);

-- 3) Güvenlik (RLS)
alter table public.group_zikirs enable row level security;
alter table public.group_zikir_participants enable row level security;

drop policy if exists "Zikirleri herkes okuyabilir" on public.group_zikirs;
create policy "Zikirleri herkes okuyabilir"
  on public.group_zikirs for select
  using (true);
-- Not: insert/update/delete politikası YOK -> uygulamadan kimse sayıyı
-- doğrudan değiştiremez, sadece aşağıdaki fonksiyon üzerinden artar.
-- Katılımcı tablosuna hiçbir politika yok -> dışarıdan tamamen kapalı.

-- 4) Canlı sayaç için Realtime
alter publication supabase_realtime add table public.group_zikirs;

-- 5) Zikir ekleme fonksiyonu
--    - Kişi başı TOPLAM sınır yok.
--    - Sadece bot koruması: saniyede en fazla ~15 basış kabul edilir
--      (insan bundan hızlı basamaz, fark etmez).
create or replace function public.add_zikir(
  p_zikir_id  uuid,
  p_client_id text,
  p_amount    integer
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_hash     text;
  v_target   integer;
  v_current  integer;
  v_last     timestamptz;
  v_allowed  integer;
  v_amount   integer;
  v_new      integer;
  v_is_new   boolean := false;
  v_pc       integer;
  v_done     boolean;
  c_per_sec  constant integer := 15;   -- saniyede izin verilen basış
  c_max      constant integer := 900;  -- tek seferde en fazla (~1 dk birikme)
begin
  if p_amount is null or p_amount <= 0
     or p_client_id is null or length(p_client_id) < 8 then
    raise exception 'Gecersiz istek';
  end if;

  -- Kimlik zikir id'si ile birlikte hash'lenir: aynı kişi farklı
  -- zikirlerde bile birbirine bağlanamaz.
  v_hash := encode(digest(p_client_id || ':' || p_zikir_id::text, 'sha256'), 'hex');

  -- Zikri kilitle (aynı anda gelen istekler sayıyı kaybetmesin)
  select target_count, current_count
    into v_target, v_current
    from group_zikirs
   where id = p_zikir_id and is_active and completed_at is null
   for update;

  if not found then
    raise exception 'Zikir aktif degil veya tamamlandi';
  end if;

  select last_sync_at into v_last
    from group_zikir_participants
   where zikir_id = p_zikir_id and participant_hash = v_hash
   for update;

  if not found then
    v_is_new  := true;
    v_allowed := c_per_sec * 3;
    insert into group_zikir_participants (zikir_id, participant_hash, last_sync_at)
    values (p_zikir_id, v_hash, now());
  else
    v_allowed := least(
      c_max,
      greatest(c_per_sec, ceil(extract(epoch from (now() - v_last)) * c_per_sec)::integer)
    );
    update group_zikir_participants
       set last_sync_at = now()
     where zikir_id = p_zikir_id and participant_hash = v_hash;
  end if;

  v_amount := least(p_amount, v_allowed);
  v_new    := least(v_current + v_amount, v_target);
  v_done   := v_new >= v_target;

  update group_zikirs
     set current_count     = v_new,
         participant_count = participant_count + case when v_is_new then 1 else 0 end,
         completed_at      = case when v_done then now() else null end
   where id = p_zikir_id
  returning participant_count into v_pc;

  -- Tamamlandıysa anonim katılımcı kayıtlarını da sil
  if v_done then
    delete from group_zikir_participants where zikir_id = p_zikir_id;
  end if;

  return jsonb_build_object(
    'current_count',     v_new,
    'participant_count', v_pc,
    'completed',         v_done,
    'accepted',          v_amount
  );
end;
$$;

grant execute on function public.add_zikir(uuid, text, integer) to anon, authenticated;

-- =====================================================================
-- YENİ ZİKİR EKLEMEK İÇİN (örnek):
--
-- insert into public.group_zikirs (title, zikir_text, description, target_count)
-- values ('Salavat-ı Şerife',
--         'Allâhümme salli alâ seyyidinâ Muhammed',
--         'Hep birlikte 50.000 salavat',
--         50000);
--
-- Bir zikri listeden kaldırmak için:
-- update public.group_zikirs set is_active = false where id = '...';
-- =====================================================================
