// ============================================================
// gunluk-ilham — "Günlük 1 İlham Cümlesi" (NATIVE Expo Push)
// ------------------------------------------------------------
// Cron: her 5 dakikada bir çalışır. Türkiye saatine göre, push_token
// içindeki ilham_saat (varsayılan 12:00 — zorunlu tek bildirim) ve
// kullanıcının eklediği ek_saatler şu anki 5 dk penceresine düşen,
// o slotu bugün henüz almamış, ilham=true token'lara ACILIS_CUMLELERI
// havuzundan bir ilham cümlesi Expo Push ile gönderir.
//
// - Aynı gün aynı slot tekrar gönderilmez (gon.slots).
// - Tüm havuz dönmeden aynı söz tekrar seçilmez (gon.gecmis).
// - Bildirime tıklayınca data.yol="ilham" → uygulama İlham ekranına gider.
// - Söz havuzu canlı siteden çekilir (açılış ekranıyla aynı havuz).
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const HAVUZ_URL = "https://isiginibull.net/js/acilis-cumleler.js";
const EXPO_URL = "https://exp.host/--/api/v2/push/send";
const PENCERE_DK = 5;

async function havuzGetir(): Promise<string[]> {
  try {
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
  } catch (_e) { return []; }
}

// Türkiye saatine göre gün ("YYYY-MM-DD") + dakika (0-1439)
function trParcala(now: Date) {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul", hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  });
  const p: Record<string, string> = {};
  f.formatToParts(now).forEach((x) => { p[x.type] = x.value; });
  return { gun: `${p.year}-${p.month}-${p.day}`, dk: parseInt(p.hour) * 60 + parseInt(p.minute) };
}
function saatDk(s: string): number { const [h, m] = String(s).split(":").map(Number); return (h || 0) * 60 + (m || 0); }

// Havuzdan tekrar etmeyen söz seç
function sozSec(havuz: string[], gecmis: number[]): { idx: number; soz: string } {
  let kalan = havuz.map((_, i) => i).filter((i) => !gecmis.includes(i));
  if (!kalan.length) { gecmis.length = 0; kalan = havuz.map((_, i) => i); }
  const idx = kalan[Math.floor(Math.random() * kalan.length)];
  return { idx, soz: havuz[idx] };
}

async function expoGonder(mesajlar: unknown[]) {
  // Expo 100'lük gruplar halinde ister
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

Deno.serve(async () => {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(url, key);

  const havuz = await havuzGetir();
  if (!havuz.length) return new Response("havuz bos", { status: 200 });

  const now = new Date();
  const { gun, dk } = trParcala(now);

  const { data: tokenlar, error } = await sb
    .from("push_token")
    .select("token, ilham, ilham_saat, ek_saatler, gon")
    .eq("ilham", true);
  if (error || !tokenlar) return new Response("token yok", { status: 200 });

  const mesajlar: unknown[] = [];
  const yazilacaklar: { token: string; gon: unknown }[] = [];

  for (const t of tokenlar as Array<Record<string, unknown>>) {
    const token = String(t.token || "");
    if (!/^ExponentPushToken\[/.test(token)) continue; // yalnızca geçerli Expo token

    const saatler: string[] = [String(t.ilham_saat || "12:00"), ...((Array.isArray(t.ek_saatler) ? t.ek_saatler : []) as string[])];
    // bu 5 dk penceresine düşen bir slot var mı?
    const slot = saatler
      .map((s) => saatDk(s))
      .find((sd) => dk >= sd && dk < sd + PENCERE_DK);
    if (slot === undefined) continue;

    const gon = (t.gon && typeof t.gon === "object" ? t.gon : {}) as { gun?: string; slots?: number[]; gecmis?: number[] };
    if (gon.gun !== gun) { gon.gun = gun; gon.slots = []; }
    gon.slots = gon.slots || [];
    gon.gecmis = gon.gecmis || [];
    if (gon.slots.includes(slot)) continue; // bu slotu bugün almış

    const { idx, soz } = sozSec(havuz, gon.gecmis);
    gon.slots.push(slot);
    gon.gecmis.push(idx);
    if (gon.gecmis.length > Math.max(1, havuz.length - 3)) gon.gecmis = gon.gecmis.slice(-Math.max(1, havuz.length - 3));

    mesajlar.push({
      to: token,
      title: "✨ Günün ilham cümlesi",
      body: soz,
      sound: "default",
      channelId: "default",
      data: { yol: "ilham" },
    });
    yazilacaklar.push({ token, gon });
  }

  if (mesajlar.length) {
    await expoGonder(mesajlar);
    for (const y of yazilacaklar) {
      await sb.from("push_token").update({ gon: y.gon }).eq("token", y.token);
    }
  }

  return new Response(JSON.stringify({ gonderilen: mesajlar.length }), {
    status: 200, headers: { "Content-Type": "application/json" },
  });
});
