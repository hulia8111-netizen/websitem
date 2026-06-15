// ============================================================
// evren-mesaji — "Evrenden Mesajını Al" push gönderimi (Supabase Edge Function)
// Her 5 dakikada bir çalışır (cron). Türkiye saatine göre, kullanıcının
// "evren-ayar" içindeki saatlerinden biri şu anki 5 dk penceresine düşen ve
// o slotu bugün henüz almamış aktif aboneye, ortak söz havuzundan rastgele bir
// ilham cümlesi Web Push olarak gönderir.
//
// SÖZ HAVUZU: canlı siteden (js/acilis-cumleler.js) çekilir → açılış ekranıyla
// AYNI havuz. Word dosyasına yeni söz eklenip site güncellendiğinde bildirimler
// de otomatik algılar; bu fonksiyonu yeniden dağıtmaya gerek YOKTUR.
//
// DAĞITIM: aynı gün aynı söz tekrar gönderilmez; tüm havuz dönmeden hiçbir söz
// yeniden seçilmez (push_abone.evren_gon.gecmis) → 21 gün+ aralık.
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const HAVUZ_URL = "https://isiginibull.net/js/acilis-cumleler.js";
const PENCERE_DK = 5;

type Gon = { gun: string; slots: number[]; sozler: number[]; gecmis: number[] };

// Canlı acilis-cumleler.js'ten söz dizisini çek + ayrıştır (yalnızca dizi içi)
async function havuzGetir(): Promise<string[]> {
  const r = await fetch(HAVUZ_URL + "?cb=" + Date.now(), { headers: { "cache-control": "no-cache" } });
  const txt = await r.text();
  const bas = txt.indexOf("[", txt.indexOf("ACILIS_CUMLELERI"));
  const son = txt.indexOf("]", bas);
  if (bas < 0 || son < 0) return [];
  const dizi = txt.slice(bas + 1, son);
  const out: string[] = [];
  const re = /"((?:\\.|[^"\\])*)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(dizi)) !== null) {
    const s = m[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\").trim();
    if (s) out.push(s);
  }
  return out;
}

function sozSec(g: Gon, n: number): number {
  const maxG = n - 1;   // tüm havuz dönmeden tekrar yok
  let aday: number[] = [];
  for (let i = 0; i < n; i++) if (g.sozler.indexOf(i) === -1 && g.gecmis.indexOf(i) === -1) aday.push(i);
  if (!aday.length) for (let i = 0; i < n; i++) if (g.sozler.indexOf(i) === -1) aday.push(i);
  if (!aday.length) for (let i = 0; i < n; i++) aday.push(i);
  const idx = aday[Math.floor(Math.random() * aday.length)];
  g.sozler.push(idx);
  g.gecmis.push(idx);
  while (g.gecmis.length > maxG) g.gecmis.shift();
  return idx;
}

Deno.serve(async () => {
  try {
    const SB_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC");
    const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE");
    if (!SB_URL || !SERVICE_ROLE) return j({ ok: false, hata: "Supabase env eksik" }, 500);
    if (!VAPID_PUBLIC || !VAPID_PRIVATE) return j({ ok: false, hata: "VAPID secrets eksik" }, 500);

    const SOZLER = await havuzGetir();
    if (!SOZLER.length) return j({ ok: false, hata: "Söz havuzu çekilemedi" }, 500);

    const webpush = (await import("npm:web-push@3.6.7")).default;
    webpush.setVapidDetails("mailto:hulia8111@gmail.com", VAPID_PUBLIC, VAPID_PRIVATE);

    const sb = createClient(SB_URL, SERVICE_ROLE);
    const tr = new Date(Date.now() + 3 * 3600 * 1000);   // Türkiye saati (UTC+3)
    const today = tr.toISOString().slice(0, 10);
    const nowMin = tr.getUTCHours() * 60 + tr.getUTCMinutes();

    const { data: aboneler, error } = await sb.from("push_abone").select("user_id, abone, evren_gon");
    if (error) return j({ ok: false, hata: error.message }, 500);

    let gonderilen = 0, bakilan = 0;
    for (const r of aboneler ?? []) {
      const { data: ayarRow } = await sb.from("kullanici_veri").select("deger")
        .eq("user_id", r.user_id).eq("anahtar", "evren-ayar").maybeSingle();
      const ayar = ayarRow?.deger as { aktif?: boolean; sayi?: number; saatler?: string[] } | undefined;
      if (!ayar?.aktif) continue;
      bakilan++;
      const sayi = Math.min(3, Math.max(1, Number(ayar.sayi) || 1));
      const saatler = Array.isArray(ayar.saatler) ? ayar.saatler : ["10:00", "15:00", "20:00"];

      let g: Gon = (r.evren_gon as Gon) ?? { gun: today, slots: [], sozler: [], gecmis: [] };
      if (g.gun !== today) { g = { gun: today, slots: [], sozler: [], gecmis: g.gecmis ?? [] }; }
      if (!Array.isArray(g.slots)) g.slots = [];
      if (!Array.isArray(g.sozler)) g.sozler = [];
      if (!Array.isArray(g.gecmis)) g.gecmis = [];

      let slot = -1;
      for (let s = 0; s < sayi; s++) {
        if (g.slots.indexOf(s) !== -1) continue;
        const parts = String(saatler[s] ?? "").split(":");
        const sm = (parseInt(parts[0]) || 0) * 60 + (parseInt(parts[1]) || 0);
        const fark = nowMin - sm;
        if (fark >= 0 && fark < PENCERE_DK) { slot = s; break; }
      }
      if (slot === -1) continue;

      const soz = SOZLER[sozSec(g, SOZLER.length)];
      try {
        await webpush.sendNotification(r.abone, JSON.stringify({ title: "✨ Evrenden mesajın var", body: soz, url: "./", tip: "ana-sayfa" }));
        g.slots.push(slot);
        await sb.from("push_abone").update({ evren_gon: g }).eq("user_id", r.user_id);
        gonderilen++;
      } catch (e) {
        const kod = (e as { statusCode?: number })?.statusCode;
        if (kod === 404 || kod === 410) await sb.from("push_abone").delete().eq("user_id", r.user_id);
      }
    }
    return j({ ok: true, today, nowMin, havuz: SOZLER.length, abone: (aboneler ?? []).length, aktif: bakilan, gonderilen });
  } catch (e) {
    return j({ ok: false, hata: String((e as Error)?.message ?? e) }, 500);
  }
});

function j(o: unknown, status = 200) {
  return new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json" } });
}
