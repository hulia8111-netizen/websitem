// ============================================================
// gunluk-ilham — "Günün İlham Cümlesi" (NATIVE Expo Push)
// ------------------------------------------------------------
// Cron ile 15 dakikada bir çalışır (Türkiye saati esas alınır):
//   • SABİT (zorunlu) saat: hafta içi 12:00, hafta sonu 16:00
//   • EK saatler: kullanıcının ayarlardan seçtiği en fazla 2 saat
//     (push_token.ek_saatler, ör. ["08:00","21:30"])
// Bir saat geldiğinde (saat ≤ şimdi < saat+30dk) o slota ait cümle
// gönderilir. Her slot günde bir kez gider (gon = {gun, slots:[...]}).
// Sabit slotta herkes günün aynı cümlesini alır; ek slotlar farklı
// cümleler taşır. Tıklayınca data.yol="ilham" → Günün İlhamı ekranı.
// Söz havuzu canlı siteden + ilham_cumle tablosundan gelir.
// ÖNEMLİ: Fonksiyon "Verify JWT" KAPALI olmalı (cron auth başlığı göndermez).
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const HAVUZ_URL = "https://isiginibull.net/js/acilis-cumleler.js";
const EXPO_URL = "https://exp.host/--/api/v2/push/send";
const PENCERE_DK = 30;       // slot saatinden sonra bu kadar dakika içinde gönderilir
const MAKS_EK = 2;

async function havuzGetir(): Promise<string[]> {
  try {
    const r = await fetch(HAVUZ_URL + "?cb=" + Date.now(), { headers: { "cache-control": "no-cache" } });
    const txt = await r.text();
    const bas = txt.indexOf("[", txt.indexOf("ACILIS_CUMLELERI"));
    const son = txt.indexOf("]", bas);
    if (bas < 0 || son < 0) return [];
    const out: string[] = [];
    const re = /"((?:\.|[^"\])*)"/g;
    let m: RegExpExecArray | null;
    const dizi = txt.slice(bas + 1, son);
    while ((m = re.exec(dizi)) !== null) {
      const s = m[1].replace(/\\"/g, '"').replace(/\\/g, "\\").trim();
      if (s) out.push(s);
    }
    return out;
  } catch (_e) { return []; }
}

// Türkiye saatine göre gün ("YYYY-MM-DD"), dakika (0-1439), hafta sonu mu
function trZaman(now: Date) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", weekday: "short", hourCycle: "h23",
  }).formatToParts(now).map(x => [x.type, x.value]));
  return {
    gun: `${p.year}-${p.month}-${p.day}`,
    dk: Number(p.hour) * 60 + Number(p.minute),
    haftaSonu: p.weekday === "Sat" || p.weekday === "Sun",
  };
}
// Gün indeksi (epoch günü) — o gün için sabit söz seçimi
function gunIndeksi(gun: string): number {
  return Math.floor(new Date(gun + "T00:00:00Z").getTime() / 86400000);
}
function saatDk(s: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s);
  if (!m) return -1;
  const d = Number(m[1]) * 60 + Number(m[2]);
  return d >= 0 && d < 1440 ? d : -1;
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

  const { gun, dk, haftaSonu } = trZaman(new Date());
  const sabit = haftaSonu ? "16:00" : "12:00";
  const vaktiGeldi = (s: string) => { const d = saatDk(s); return d >= 0 && dk >= d && dk < d + PENCERE_DK; };

  const { data: tokenlar } = await sb.from("push_token").select("token, ek_saatler, gon").eq("ilham", true);
  if (!tokenlar || !tokenlar.length) return new Response("token yok", { status: 200 });

  // Önce kimin neyi alacağını belirle (havuzu gereksiz yere çekmemek için)
  const plan: { token: string; slotlar: { saat: string; sira: number }[]; gonderilen: string[] }[] = [];
  for (const t of tokenlar as Array<Record<string, unknown>>) {
    const token = String(t.token || "");
    if (!/^ExponentPushToken\[/.test(token)) continue;
    const gon = (t.gon && typeof t.gon === "object" ? t.gon : {}) as { gun?: string; slots?: unknown };
    let gonderilen: string[] = [];
    if (gon.gun === gun) {
      // eski biçim {gun} → bugünün sabit bildirimi zaten gitmiş say
      gonderilen = Array.isArray(gon.slots) ? gon.slots.map(String) : [sabit];
    }
    const ek = (Array.isArray(t.ek_saatler) ? t.ek_saatler : [])
      .map(String).filter(s => saatDk(s) >= 0 && s !== sabit).slice(0, MAKS_EK);
    const adaylar = [{ saat: sabit, sira: 0 }, ...ek.map((s, i) => ({ saat: s, sira: i + 1 }))];
    const slotlar = adaylar.filter(a => vaktiGeldi(a.saat) && !gonderilen.includes(a.saat));
    if (slotlar.length) plan.push({ token, slotlar, gonderilen });
  }
  if (!plan.length) return new Response(JSON.stringify({ gun, gonderilen: 0 }), { status: 200, headers: { "Content-Type": "application/json" } });

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

  // sira 0 = günün cümlesi (herkese aynı); 1-2 = ek saat cümleleri (farklı)
  const gi = gunIndeksi(gun);
  const adim = Math.max(1, Math.floor(havuz.length / 3));
  const soz = (sira: number) => havuz[(gi + sira * adim) % havuz.length];

  const mesajlar: unknown[] = [];
  for (const p of plan) {
    // Aynı anda birden çok slot vaktiyse (ör. ek saat = sabit+15dk) yalnızca biri gider
    const s = p.slotlar[0];
    mesajlar.push({ to: p.token, title: "✨ Günün ilham cümlesi", body: soz(s.sira), sound: "default", channelId: "default", data: { yol: "ilham" } });
    p.gonderilen.push(...p.slotlar.map(x => x.saat));
  }

  await expoGonder(mesajlar);
  for (const p of plan) await sb.from("push_token").update({ gon: { gun, slots: p.gonderilen } }).eq("token", p.token);

  return new Response(JSON.stringify({ gun, gonderilen: mesajlar.length }), { status: 200, headers: { "Content-Type": "application/json" } });
});
