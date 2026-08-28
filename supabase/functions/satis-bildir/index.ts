// ============================================================
// satis-bildir — Yeni satın alma talebi → yöneticiye NATIVE push 🛒
// ------------------------------------------------------------
// Kullanıcı dijital ürün için "ödedim" dediğinde uygulama bunu çağırır:
//   POST { email, urun_baslik, fiyat }
// Yönetici (hulia8111@gmail.com) hesabına bağlı TÜM push_token'lara
// Expo Push ile "Yeni satın alma talebi" bildirimi gönderir.
// Bildirime tıklayınca data.yol="talepler" → uygulama açılır.
// service_role kullanır. Yalnız yöneticiye gönderir (spam riski yok).
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EXPO_URL = "https://exp.host/--/api/v2/push/send";
const ADMIN_EMAIL = "hulia8111@gmail.com";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

async function expoGonder(mesajlar: unknown[]) {
  for (let i = 0; i < mesajlar.length; i += 100) {
    try {
      await fetch(EXPO_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(mesajlar.slice(i, i + 100)),
      });
    } catch (_e) { /* sessiz */ }
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(url, key);

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch (_e) { /* boş */ }
  const email = String(body.email || "").trim();
  const baslik = String(body.urun_baslik || "dijital ürün").trim();
  const fiyat = String(body.fiyat || "").trim();

  // Yöneticinin auth id'sini e-postadan bul (sayfalı)
  let adminId: string | null = null;
  for (let sayfa = 1; sayfa <= 20 && !adminId; sayfa++) {
    const { data, error } = await sb.auth.admin.listUsers({ page: sayfa, perPage: 200 });
    if (error) break;
    const bulunan = (data?.users || []).find((u) => (u.email || "").toLowerCase() === ADMIN_EMAIL);
    if (bulunan) adminId = bulunan.id;
    if (!data?.users || data.users.length < 200) break;
  }
  if (!adminId) return json({ ok: false, mesaj: "admin bulunamadı" }, 200);

  const { data: tokenlar } = await sb.from("push_token").select("token").eq("user_id", adminId);
  if (!tokenlar || !tokenlar.length) return json({ ok: true, gonderilen: 0, mesaj: "admin token yok" });

  const govde = `${email || "bir kullanıcı"} · ${baslik}${fiyat ? " (" + fiyat + ")" : ""}`;
  const mesajlar = (tokenlar as Array<{ token: string }>)
    .filter((t) => /^ExponentPushToken\[/.test(String(t.token || "")))
    .map((t) => ({
      to: t.token,
      title: "🛒 Yeni satın alma talebi",
      body: govde,
      sound: "default",
      channelId: "default",
      data: { yol: "talepler" },
    }));

  await expoGonder(mesajlar);
  return json({ ok: true, gonderilen: mesajlar.length });
});
