// ============================================================
// duyuru-bildirim — Yönetici duyurusu yayınlanınca tüm abonelere Web Push
// topluluk_duyuru tablosuna "bildir=true" ile satır eklenince DB trigger
// (duyuru_bildir_tetikle) bu fonksiyonu çağırır ve tüm push_abone'lere
// duyuruyu bildirim olarak gönderir.
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const SB_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC");
    const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE");
    if (!SB_URL || !SERVICE_ROLE) return j({ ok: false, hata: "Supabase env eksik" }, 500);
    if (!VAPID_PUBLIC || !VAPID_PRIVATE) return j({ ok: false, hata: "VAPID secrets eksik" }, 500);

    const body = await req.json().catch(() => ({}));
    const baslik = String(body.baslik || "Yeni Duyuru").slice(0, 90);
    const metin = String(body.metin || "").slice(0, 160);

    const webpush = (await import("npm:web-push@3.6.7")).default;
    webpush.setVapidDetails("mailto:hulia8111@gmail.com", VAPID_PUBLIC, VAPID_PRIVATE);

    const sb = createClient(SB_URL, SERVICE_ROLE);
    const { data: aboneler, error } = await sb.from("push_abone").select("user_id, abone");
    if (error) return j({ ok: false, hata: error.message }, 500);

    let gonderilen = 0;
    for (const r of aboneler ?? []) {
      try {
        await webpush.sendNotification(r.abone, JSON.stringify({ title: "📢 " + baslik, body: metin, url: "./", tip: "duyuru" }));
        gonderilen++;
      } catch (e) {
        const kod = (e as { statusCode?: number })?.statusCode;
        if (kod === 404 || kod === 410) await sb.from("push_abone").delete().eq("user_id", r.user_id);
      }
    }
    return j({ ok: true, abone: (aboneler ?? []).length, gonderilen });
  } catch (e) {
    return j({ ok: false, hata: String((e as Error)?.message ?? e) }, 500);
  }
});

function j(o: unknown, status = 200) {
  return new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json" } });
}
