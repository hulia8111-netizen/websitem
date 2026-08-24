// ============================================================
// eris-ver — Yönetici, bir kullanıcıya dijital ürün erişimi tanır 📚
// ------------------------------------------------------------
// Çağrı (yalnız moderatör hesabı, tarayıcıdan Bulut oturumuyla):
//   POST { email, urun_kod, baslik?, fiyat?, kaynak? }
// Adımlar:
//   1) Çağıranın JWT'si doğrulanır → user_id
//   2) topluluk_moderator tablosunda mı? değilse 403
//   3) Hedef e-posta → auth kullanıcısı bulunur
//   4) kullanici_kutuphane'e (varsa atla) erişim yazılır
// service_role kullanır → RLS baypas. CORS açık (app'ten çağrılır).
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const url = Deno.env.get("SUPABASE_URL")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const sb = createClient(url, service);

  // 1) Çağıranı doğrula
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return json({ ok: false, mesaj: "Oturum gerekli" }, 401);

  const uclient = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: udata, error: uerr } = await uclient.auth.getUser();
  const caller = udata?.user;
  if (uerr || !caller) return json({ ok: false, mesaj: "Geçersiz oturum" }, 401);

  // 2) Moderatör mü?
  const { data: mod } = await sb.from("topluluk_moderator").select("user_id").eq("user_id", caller.id).maybeSingle();
  if (!mod) return json({ ok: false, mesaj: "Bu işlem için yetkin yok" }, 403);

  // 3) Gövde
  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch (_e) { /* boş */ }
  const email = String(body.email || "").trim().toLowerCase();
  const urun_kod = String(body.urun_kod || "").trim();
  const baslik = body.baslik ? String(body.baslik) : null;
  const fiyat = body.fiyat ? String(body.fiyat) : null;
  const kaynak = body.kaynak ? String(body.kaynak) : "manuel";
  if (!email || !urun_kod) return json({ ok: false, mesaj: "email ve urun_kod gerekli" }, 400);

  // 4) Hedef kullanıcıyı e-postadan bul (auth.admin ile sayfalı arama)
  let hedef: { id: string; email?: string } | null = null;
  for (let sayfa = 1; sayfa <= 20 && !hedef; sayfa++) {
    const { data, error } = await sb.auth.admin.listUsers({ page: sayfa, perPage: 200 });
    if (error) break;
    const bulunan = (data?.users || []).find((u) => (u.email || "").toLowerCase() === email);
    if (bulunan) hedef = { id: bulunan.id, email: bulunan.email || "" };
    if (!data?.users || data.users.length < 200) break; // son sayfa
  }
  if (!hedef) return json({ ok: false, mesaj: "Bu e-postayla kayıtlı kullanıcı yok. Kullanıcı önce uygulamada üye olmalı." }, 404);

  // 5) Erişimi yaz (varsa atla)
  const { error: ierr } = await sb.from("kullanici_kutuphane").upsert(
    { user_id: hedef.id, urun_kod, baslik, fiyat, kaynak },
    { onConflict: "user_id,urun_kod", ignoreDuplicates: true },
  );
  if (ierr) return json({ ok: false, mesaj: "Yazılamadı: " + ierr.message }, 500);

  return json({ ok: true, mesaj: `Erişim verildi: ${email} → ${urun_kod}` });
});
