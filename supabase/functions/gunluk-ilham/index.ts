// ============================================================
// gunluk-ilham — "Günlük 1 İlham Cümlesi" (NATIVE Expo Push)
// ------------------------------------------------------------
// Günde BİR kez (12:00 TR) cron ile çalışır. O günün ilham cümlesini
// (tarihe göre sabit — herkes aynı cümleyi görür) ilham=true olan tüm
// push_token'lara Expo Push ile gönderir. Aynı gün tekrar çalışsa bile
// çift göndermez (gon.gun kontrolü). Bildirime tıklayınca data.yol="ilham"
// → uygulama Günün İlhamı ekranına gider. Söz havuzu canlı siteden çekilir.
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const HAVUZ_URL = "https://isiginibull.net/js/acilis-cumleler.js";
const EXPO_URL = "https://exp.host/--/api/v2/push/send";

async function havuzGetir(): Promise<string[]> {
  try {
    const r = await fetch(HAVUZ_URL + "?cb=" + Date.now(), { headers: { "cache-control": "no-cache" } });
    const txt = await r.text();
    const bas = txt.indexOf("[", txt.indexOf("ACILIS_CUMLELERI"));
    const son = txt.indexOf("]", bas);
    if (bas < 0 || son < 0) return [];
    const out: string[] = [];
    const re = /"((?:\\.|[^"\\])*)"/g;
    let m: RegExpExecArray | null;
    const dizi = txt.slice(bas + 1, son);
    while ((m = re.exec(dizi)) !== null) {
      const s = m[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\").trim();
      if (s) out.push(s);
    }
    return out;
  } catch (_e) { return []; }
}

// Türkiye saatine göre "YYYY-MM-DD" gün
function trGun(now: Date): string {
  const f = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" });
  return f.format(now); // en-CA → 2026-08-24
}
// Gün indeksi (epoch günü) — o gün için sabit söz seçimi
function gunIndeksi(gun: string): number {
  return Math.floor(new Date(gun + "T00:00:00Z").getTime() / 86400000);
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

Deno.serve(async () => {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(url, key);

  const havuz = await havuzGetir();
  if (!havuz.length) return new Response("havuz bos", { status: 200 });

  // Yöneticinin panelden eklediği cümleleri havuza kat (uygulamayla birebir aynı sıra)
  try {
    const { data: db } = await sb.from("ilham_cumle").select("metin, sira").eq("aktif", true).order("sira", { ascending: true });
    const set = new Set(havuz);
    for (const r of (db || []) as Array<{ metin?: unknown }>) {
      const m = String(r.metin || "").trim();
      if (m && !set.has(m)) { havuz.push(m); set.add(m); }
    }
  } catch (_e) { /* sessiz → yalnız temel havuz */ }

  const gun = trGun(new Date());
  const soz = havuz[gunIndeksi(gun) % havuz.length];

  const { data: tokenlar } = await sb.from("push_token").select("token, gon").eq("ilham", true);
  if (!tokenlar) return new Response("token yok", { status: 200 });

  const mesajlar: unknown[] = [];
  const yaz: { token: string }[] = [];
  for (const t of tokenlar as Array<Record<string, unknown>>) {
    const token = String(t.token || "");
    if (!/^ExponentPushToken\[/.test(token)) continue;
    const gon = (t.gon && typeof t.gon === "object" ? t.gon : {}) as { gun?: string };
    if (gon.gun === gun) continue; // bugün zaten aldı
    mesajlar.push({ to: token, title: "✨ Günün ilham cümlesi", body: soz, sound: "default", channelId: "default", data: { yol: "ilham" } });
    yaz.push({ token });
  }

  if (mesajlar.length) {
    await expoGonder(mesajlar);
    for (const y of yaz) await sb.from("push_token").update({ gon: { gun } }).eq("token", y.token);
  }
  return new Response(JSON.stringify({ gun, gonderilen: mesajlar.length }), { status: 200, headers: { "Content-Type": "application/json" } });
});
