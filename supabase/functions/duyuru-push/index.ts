// ============================================================
// duyuru-push — Yönetici duyurusu → NATIVE Expo Push
// ------------------------------------------------------------
// Supabase Database Webhook (topluluk_duyuru INSERT) ile tetiklenir:
//   body: { type:"INSERT", record: { id, baslik, metin, aktif } }
// Ya da manuel çağrı: { duyuru_id } / { baslik, metin }.
// duyuru=true olan tüm push_token'lara Expo Push gönderir.
// Bildirime tıklayınca data.yol="duyuru" → Duyurularım ekranı açılır.
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EXPO_URL = "https://exp.host/--/api/v2/push/send";

// Uygulama/tarayıcıdan (WebView dahil) c.functions.invoke ile çağrılabilsin diye CORS.
// (Webhook sunucu-sunucu çalışır; ama manuel çağrı tarayıcı bağlamından gelir.)
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function expoGonder(mesajlar: unknown[]) {
  for (let i = 0; i < mesajlar.length; i += 100) {
    const grup = mesajlar.slice(i, i + 100);
    try {
      await fetch(EXPO_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(grup),
      });
    } catch (_e) { /* sessiz */ }
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(url, key);

  let baslik = "📣 Yeni duyuru";
  let metin = "";
  try {
    const body = await req.json();
    const rec = body?.record || body || {};
    if (rec.aktif === false) return new Response("pasif duyuru", { status: 200, headers: CORS });
    if (rec.duyuru_id && !rec.metin) {
      const { data } = await sb.from("topluluk_duyuru").select("baslik, metin").eq("id", rec.duyuru_id).single();
      if (data) { baslik = data.baslik || baslik; metin = data.metin || ""; }
    } else {
      baslik = rec.baslik || baslik;
      metin = rec.metin || "";
    }
  } catch (_e) { /* boş gövde → yine de son duyuruyu gönderelim */ }

  if (!metin) {
    const { data } = await sb.from("topluluk_duyuru").select("baslik, metin").eq("aktif", true).order("olusturma", { ascending: false }).limit(1).single();
    if (data) { baslik = data.baslik || baslik; metin = data.metin || ""; }
  }
  if (!metin) return new Response("metin yok", { status: 200, headers: CORS });

  const { data: tokenlar } = await sb.from("push_token").select("token").eq("duyuru", true);
  if (!tokenlar || !tokenlar.length) return new Response("token yok", { status: 200, headers: CORS });

  const mesajlar = (tokenlar as Array<{ token: string }>)
    .filter((t) => /^ExponentPushToken\[/.test(String(t.token || "")))
    .map((t) => ({
      to: t.token,
      title: baslik,
      body: metin.length > 178 ? metin.slice(0, 175) + "…" : metin,
      sound: "default",
      channelId: "default",
      data: { yol: "duyuru" },
    }));

  await expoGonder(mesajlar);
  return new Response(JSON.stringify({ gonderilen: mesajlar.length }), {
    status: 200, headers: { ...CORS, "Content-Type": "application/json" },
  });
});
