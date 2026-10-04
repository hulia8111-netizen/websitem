-- ============================================================
-- push_token_kaydet — telefon bildirim jetonunu güvenle kaydet/güncelle
-- Supabase SQL Editor'da BİR KEZ çalıştır (idempotent).
--
-- Sorun: Doğrudan upsert'te RLS, mevcut satır BAŞKA hesaba aitse
-- (aynı telefonda hesap değiştirme / misafirken kayıt) güncellemeyi
-- engelliyordu → jeton eski hesapta kalıyor, son_acilis güncellenmiyordu.
-- Çözüm: SECURITY DEFINER fonksiyon. Hesabı istemciden ALMAZ,
-- auth.uid() ile kendisi belirler; yalnız jetonun kendi satırını yazar.
-- ============================================================
create or replace function public.push_token_kaydet(p jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  tk text := p->>'token';
begin
  if tk is null or tk not like 'ExponentPushToken[%' then
    raise exception 'gecersiz token';
  end if;
  insert into public.push_token as t
    (token, user_id, cihaz_id, platform, duyuru, topluluk, ilham, ilham_saat,
     ek_saatler, tz, hatirlatma, son_ruh, guncelleme, son_acilis)
  values
    (tk, auth.uid(), p->>'cihaz_id', coalesce(p->>'platform', 'android'),
     coalesce((p->>'duyuru')::boolean, true), coalesce((p->>'topluluk')::boolean, true),
     coalesce((p->>'ilham')::boolean, true), coalesce(p->>'ilham_saat', '12:00'),
     coalesce(p->'ek_saatler', '[]'::jsonb), coalesce(p->>'tz', 'Europe/Istanbul'),
     coalesce((p->>'hatirlatma')::boolean, true), p->>'son_ruh', now(), now())
  on conflict (token) do update set
    user_id    = coalesce(auth.uid(), t.user_id),
    cihaz_id   = excluded.cihaz_id,
    platform   = excluded.platform,
    duyuru     = excluded.duyuru,
    topluluk   = excluded.topluluk,
    ilham      = excluded.ilham,
    ilham_saat = excluded.ilham_saat,
    ek_saatler = excluded.ek_saatler,
    tz         = excluded.tz,
    hatirlatma = excluded.hatirlatma,
    son_ruh    = excluded.son_ruh,
    guncelleme = now(),
    son_acilis = now();
end;
$$;

revoke all on function public.push_token_kaydet(jsonb) from public;
grant execute on function public.push_token_kaydet(jsonb) to anon, authenticated;
