// ============================================================
// kart-hatirlatma — Günün Kartı push hatırlatması (Supabase Edge Function)
// Saatte bir çalışır (cron). Türkiye saatine göre, ayarındaki saat şu anki saat
// olan ve o gün kartını ÇEKMEMİŞ aktif kullanıcılara Web Push gönderir.
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MESAJLAR = [
  "✨ Bugünün mesajı seni bekliyor. Kartını çekmek ister misin?",
  "🌙 Belki de bugün ihtiyacın olan cevap kartında saklıdır.",
  "💫 Günün enerjisini keşfetmek için kartını çek.",
  "🔮 Evren sana küçük bir mesaj bırakmış olabilir.",
  "🌿 Kendine bir dakika ayır ve bugünün kartını keşfet.",
  "🤍 İç sesini dinlemek için güzel bir zaman. Kartın seni bekliyor.",
];

Deno.serve(async () => {
  try {
    const SB_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC");
    const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE");
    if (!SB_URL || !SERVICE_ROLE) return j({ ok: false, hata: "Supabase env eksik" }, 500);
    if (!VAPID_PUBLIC || !VAPID_PRIVATE) return j({ ok: false, hata: "VAPID secrets eksik" }, 500);

    const webpush = (await import("npm:web-push@3.6.7")).default;
    webpush.setVapidDetails("mailto:hulia8111@gmail.com", VAPID_PUBLIC, VAPID_PRIVATE);

    const sb = createClient(SB_URL, SERVICE_ROLE);
    const tr = new Date(Date.now() + 3 * 3600 * 1000);
    const today = tr.toISOString().slice(0, 10);
    const turkeyHour = tr.getUTCHours();

    const { data: aboneler, error } = await sb.from("push_abone").select("user_id, abone, son_gonderim");
    if (error) return j({ ok: false, hata: error.message }, 500);

    let gonderilen = 0;
    for (const r of aboneler ?? []) {
      if (r.son_gonderim === today) continue;
      const { data: ayarRow } = await sb.from("kullanici_veri").select("deger")
        .eq("user_id", r.user_id).eq("anahtar", "kartbildirim-ayar").maybeSingle();
      const ayar = ayarRow?.deger;
      if (!ayar?.aktif) continue;
      const saatH = parseInt(String(ayar.saat ?? "15:00").split(":")[0]);
      if (saatH !== turkeyHour) continue;
      const { data: cardRow } = await sb.from("kullanici_veri").select("anahtar")
        .eq("user_id", r.user_id).eq("anahtar", "card-" + today).maybeSingle();
      if (cardRow) continue;
      const mesaj = MESAJLAR[Math.floor(Math.random() * MESAJLAR.length)];
      try {
        await webpush.sendNotification(r.abone, JSON.stringify({ title: "Günün Kartı 🔮", body: mesaj, url: "./?kart=1" }));
        await sb.from("push_abone").update({ son_gonderim: today }).eq("user_id", r.user_id);
        gonderilen++;
      } catch (e) {
        const kod = (e as { statusCode?: number })?.statusCode;
        if (kod === 404 || kod === 410) await sb.from("push_abone").delete().eq("user_id", r.user_id);
      }
    }
    return j({ ok: true, today, turkeyHour, abone: (aboneler ?? []).length, gonderilen });
  } catch (e) {
    return j({ ok: false, hata: String((e as Error)?.message ?? e) }, 500);
  }
});

function j(o: unknown, status = 200) {
  return new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json" } });
}
