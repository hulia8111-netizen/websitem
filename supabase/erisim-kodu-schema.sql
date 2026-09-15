-- ============================================================
-- erisim-kodu-schema.sql — Tek Kullanımlık Erişim Kodları 🔑
-- ------------------------------------------------------------
-- Shopier'den satın alan kişiye otomatik bir KOD verilir (stok kodu).
-- Kişi uygulamada kodu girer (ya da sihirli linke dokunur) → kod
-- doğrulanır + TÜKETİLİR + ürüne KALICI erişim hesabına tanımlanır.
-- Kod tek kullanımlık: kullanılınca ölür (çoğaltılamaz). Erişim ise
-- kalıcı → kişi ömür boyu, her cihazda dinler.
-- Supabase → SQL Editor'de bir kez çalıştır.
-- ============================================================

-- 1) KOD tablosu ---------------------------------------------
create table if not exists public.erisim_kodu (
  kod            text primary key,
  urun_kod       text not null,
  kullanildi     boolean not null default false,
  kullanan       uuid references auth.users(id) on delete set null,
  kullanan_email text,
  olusturma      timestamptz not null default now(),
  kullanim_at    timestamptz
);
alter table public.erisim_kodu enable row level security;
-- Bilerek HİÇBİR client politikası yok → kimse kodları okuyamaz/yazamaz.
-- Kodlar yalnız aşağıdaki güvenli fonksiyon (security definer) ile kullanılır.
create index if not exists erisim_kodu_urun_idx on public.erisim_kodu(urun_kod, kullanildi);

-- 2) KODU KULLAN fonksiyonu (atomik + güvenli) ---------------
create or replace function public.kod_kullan(p_kod text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_email text;
  v_row   public.erisim_kodu%rowtype;
begin
  if v_uid is null then
    return json_build_object('ok', false, 'mesaj', 'Önce giriş yapmalısın.');
  end if;

  p_kod := upper(regexp_replace(coalesce(p_kod, ''), '\s', '', 'g'));
  if p_kod = '' then
    return json_build_object('ok', false, 'mesaj', 'Kod boş görünüyor.');
  end if;

  -- kodu kilitleyerek al (aynı anda iki kişi kullanmasın)
  select * into v_row from public.erisim_kodu where upper(kod) = p_kod for update;
  if not found then
    return json_build_object('ok', false, 'mesaj', 'Kod bulunamadı. Kontrol edip tekrar dene.');
  end if;

  if v_row.kullanildi then
    if v_row.kullanan = v_uid then
      return json_build_object('ok', true, 'mesaj', 'Bu kod zaten sende tanımlı ✨', 'urun_kod', v_row.urun_kod);
    end if;
    return json_build_object('ok', false, 'mesaj', 'Bu kod daha önce kullanılmış.');
  end if;

  select email into v_email from auth.users where id = v_uid;

  update public.erisim_kodu
    set kullanildi = true, kullanan = v_uid, kullanan_email = v_email, kullanim_at = now()
    where kod = v_row.kod;

  insert into public.kullanici_kutuphane (user_id, urun_kod, baslik, kaynak)
    values (v_uid, v_row.urun_kod, v_row.urun_kod, 'shopier')
    on conflict (user_id, urun_kod) do nothing;

  return json_build_object('ok', true, 'mesaj', 'Erişimin açıldı 🎉', 'urun_kod', v_row.urun_kod);
end;
$$;

grant execute on function public.kod_kullan(text) to authenticated;

-- ============================================================
-- KOD EKLEME (örnek) — kodları buraya toplu yapıştıracaksın:
-- insert into public.erisim_kodu (kod, urun_kod) values
--   ('ISIK-XXXX-XXXX', 'ses-bana-ait-olan'),
--   ('ISIK-YYYY-YYYY', 'ses-bana-ait-olan');
-- ============================================================
