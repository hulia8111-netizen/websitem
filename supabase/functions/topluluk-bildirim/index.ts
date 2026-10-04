// ============================================================
// topluluk-bildirim — Topluluk bildirimleri (Edge Function)
// DB tetikleyicilerinden pg_net ile çağrılır.
//   { tip: "yeni_icerik" }            → moderatörlere "onay bekliyor" (45 dk throttle)
//   { tip: "onaylandi", user_id }     → yazara "paylaşımın onaylandı"
// Gönderim: 1) NATIVE Expo Push (mobil uygulama, push_token) — asıl kanal
//           2) Web Push (tarayıcı, push_abone) — yedek; VAPID yoksa atlanır
// "onaylandi" yalnız push_token.topluluk=true olanlara gider (kullanıcı tercihi);
// moderatör uyarısı tercihten bağımsız gider.
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function j(o: unknown, s = 200) { return new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json" } }); }
const THROTTLE_MS = 45 * 60 * 1000;
const EXPO_URL = "https://exp.host/--/api/v2/push/send";

Deno.serve(async (req) => {
  try {
    const SB_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC");
    const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE");
    if (!SB_URL || !SERVICE_ROLE) return j({ ok: false, hata: "Supabase env eksik" }, 500);

    const sb = createClient(SB_URL, SERVICE_ROLE);
    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const tip = String(body.tip || "");

    let hedefler: string[] = [];
    let baslik = "", govde = "";
    const url = "./?topluluk=1";

    if (tip === "yeni_icerik") {
      // 45 dk throttle (moderatör spam'i olmasın)
      const { data: meta } = await sb.from("topluluk_meta").select("deger").eq("anahtar", "son_mod_bildirim").maybeSingle();
      const son = meta?.deger && (meta.deger as { zaman?: string }).zaman ? new Date((meta.deger as { zaman: string }).zaman).getTime() : 0;
      if (Date.now() - son < THROTTLE_MS) return j({ ok: true, atlandi: "throttle" });
      const { data: mods } = await sb.from("topluluk_moderator").select("user_id");
      hedefler = (mods || []).map((m: { user_id: string }) => m.user_id);
      baslik = "🛡️ Topluluk — onay bekliyor";
      govde = "Yeni içerik onayını bekliyor. Topluluk → Moderasyon.";
      await sb.from("topluluk_meta").upsert({ anahtar: "son_mod_bildirim", deger: { zaman: new Date().toISOString() }, guncelleme: new Date().toISOString() });
    } else if (tip === "onaylandi") {
      if (!body.user_id) return j({ ok: false, hata: "user_id yok" });
      hedefler = [String(body.user_id)];
      baslik = "✨ Paylaşımın onaylandı";
      govde = "Paylaşımın artık toplulukta görünüyor. Işığın yayılıyor! 🌿";
    } else {
      return j({ ok: false, hata: "bilinmeyen tip" });
    }
    if (!hedefler.length) return j({ ok: true, gonderilen: 0, mesaj: "hedef yok" });

    // 1) NATIVE Expo Push (mobil uygulama)
    let native = 0;
    const { data: tokenlar } = await sb.from("push_token").select("token, topluluk").in("user_id", hedefler);
    const mesajlar = (tokenlar || [])
      .filter((t: { token?: string; topluluk?: boolean }) => /^ExponentPushToken\[/.test(String(t.token || "")) && (tip === "yeni_icerik" || t.topluluk !== false))
      .map((t: { token: string }) => ({ to: t.token, title: baslik, body: govde, sound: "default", channelId: "default", data: { yol: "topluluk" } }));
    for (let i = 0; i < mesajlar.length; i += 100) {
      try {
        await fetch(EXPO_URL, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(mesajlar.slice(i, i + 100)) });
        native += Math.min(100, mesajlar.length - i);
      } catch (_e) { /* sessiz */ }
    }

    // 2) Web Push (tarayıcı) — yedek
    let web = 0;
    if (VAPID_PUBLIC && VAPID_PRIVATE) {
      const webpush = (await import("npm:web-push@3.6.7")).default;
      webpush.setVapidDetails("mailto:hulia8111@gmail.com", VAPID_PUBLIC, VAPID_PRIVATE);
      for (const uid of hedefler) {
        const { data: ab } = await sb.from("push_abone").select("abone").eq("user_id", uid).maybeSingle();
        if (!ab?.abone) continue;
        try { await webpush.sendNotification(ab.abone, JSON.stringify({ title: baslik, body: govde, url, tip: "ana-sayfa" })); web++; }
        catch (e) { const kod = (e as { statusCode?: number })?.statusCode; if (kod === 404 || kod === 410) await sb.from("push_abone").delete().eq("user_id", uid); }
      }
    }
    return j({ ok: true, tip, hedef: hedefler.length, native, web });
  } catch (e) {
    return j({ ok: false, hata: String((e as Error)?.message ?? e) }, 500);
  }
});
