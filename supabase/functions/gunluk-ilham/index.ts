// ============================================================
// gunluk-ilham — "Günün İlham Cümlesi" + Nazik Geri Çağırma (NATIVE Expo Push)
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
//
// NAZİK GERİ ÇAĞIRMA (push_token.son_acilis'e göre, "pasif gün"):
//   0–6   → normal akış
//   7–29    → ek saatler durur; sabit ilham yalnız Pzt/Çar/Cmt
//   30–89   → sabit ilham haftada 1 (Çar)
//   90–179  → ilham yok; yalnız ayda en fazla bir Yeni Ay/Dolunay mesajı
//   180+    → hiçbir şey gönderilmez
//   Özel mesajlar (sabit slotta, o günün ilhamının YERİNE, her biri bir kez):
//   7. gün · 14. gün · 15–29 arası ilk Yeni Ay/Dolunay · 30. gün ·
//   30–179 ayda en fazla bir Yeni Ay/Dolunay. İki özel mesaj arası ≥ 4 gün.
//   Kişi uygulamayı açınca aşamalar sıfırlanır. Aynı mesaj tekrar gitmez.
//   hatirlatma=false → özel mesaj yok. son_ruh='dusuk' → yalnız yumuşak ton.
//   Tıklayınca data.yol="donus:<öne>:<aşama>" → Dönüş Eşiği ekranı.
// ÖNEMLİ: Fonksiyon "Verify JWT" KAPALI olmalı (cron auth başlığı göndermez).
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const HAVUZ_URL = "https://isiginibull.net/js/acilis-cumleler.js";
const EXPO_URL = "https://exp.host/--/api/v2/push/send";
const PENCERE_DK = 30;       // slot saatinden sonra bu kadar dakika içinde gönderilir
const MAKS_EK = 2;

// ---- Nazik geri çağırma mesajları (id → başlık, mesaj, dokununca öne çıkan seçenek) ----
type Msg = { baslik: string; mesaj: string; one: string };
const MESAJ: Record<number, Msg> = {
  1:  { baslik: "🌙 Acele yok", mesaj: "Ne zaman istersen, burada seni küçük bir sessizlik bekliyor.", one: "nefes" },
  2:  { baslik: "🍃 Yavaş günler de yolun parçası", mesaj: "Belki bugün birkaç dakikalık bir mola sana iyi gelir.", one: "nefes" },
  3:  { baslik: "☁️ Omuzlarını bir bırak", mesaj: "Şu an, tam olduğun yerde, bir nefeslik alan açabilirsin.", one: "nefes" },
  4:  { baslik: "🕯️ Kapı hep aralık", mesaj: "Hazır olduğunda, kaldığın yerden değil, olduğun yerden başlayabilirsin.", one: "yaz" },
  5:  { baslik: "🌒 Ay da içe çekilir, sonra dolar", mesaj: "Işık bazen dinlenir. Belki bugün onu yeniden fark etmek için küçük bir an vardır.", one: "kart" },
  6:  { baslik: "✨ Küçük bir niyet yeter", mesaj: "Tek bir niyet bütün bir güne usulca yön verebilir. Bugünkünü seçmek ister misin?", one: "takvim" },
  7:  { baslik: "🌱 Bazı tohumlar sessizce bekler", mesaj: "Ektiğin niyetler hâlâ orada. Belki bugün onlara biraz ışık tutarsın.", one: "yaz" },
  8:  { baslik: "🕊️ Sessizliğin de bir sesi var", mesaj: "Bugün kendine ne söylemek istersin? Tek bir cümle bile yeter.", one: "yaz" },
  9:  { baslik: "🔮 Bugünün kartı henüz açılmadı", mesaj: "Ne söyleyeceğini merak ediyorsan, tek dokunuş yeterli.", one: "kart" },
  10: { baslik: "🌕 Gökyüzünde bu hafta neler var?", mesaj: "Ay yeni bir evreye geçiyor. Takvimde sana küçük bir ritüel önerisi var.", one: "takvim" },
  11: { baslik: "❓ Tek bir soru", mesaj: "\"Bugün neye ihtiyacım var?\" Cevabını aramak için birkaç dakikan olabilir mi?", one: "soru" },
  13: { baslik: "☕ Bir çay demlenene kadar", mesaj: "O kadar sürecek küçük bir farkındalık molası hazır. Tam şimdilik mi?", one: "nefes" },
  15: { baslik: "🌬️ 3 dakika, sadece senin için", mesaj: "Günün hangi hızda akıyorsa aksın, kısa bir nefes molası seni bekliyor.", one: "nefes" },
  16: { baslik: "📖 Boş sayfalar sitem etmez", mesaj: "Defterin seni yargılamaz. Bugün tek satır yazsan yeter.", one: "yaz" },
  17: { baslik: "🌱 Yeniden başlamak bir beceridir", mesaj: "Her gün yeni bir ilk gün olabilir. Bugünkü küçük adımı sen seç.", one: "yaz" },
  18: { baslik: "💫 Kendine ayırdığın birkaç dakika", mesaj: "…kendine verdiğin küçük bir hediyedir. Bugün vermek ister misin?", one: "meditasyon" },
  19: { baslik: "🔥 Küçük adım, gerçek adım", mesaj: "Beş dakika az görünebilir, ama hiç yoktan fazlasıdır.", one: "meditasyon" },
  20: { baslik: "☀️ Mükemmel anı beklemek zorunda değilsin", mesaj: "Belki bu an da yeterince iyidir. Küçük bir adım yeter.", one: "nefes" },
};
const HAVUZ_ASAMA: Record<string, number[]> = {
  "7":  [4, 1, 3, 2],
  "14": [16, 17, 19, 20, 13, 15],
  "ay": [10, 6, 11, 9],
  "30": [5, 7, 8, 18],
};
const HAVUZ_YUMUSAK = [1, 2, 3, 4];     // son ruh hali düşükse (her aşamada)
const SEYREK_GUNLER = ["Mon", "Wed", "Sat"]; // 7–29 gün pasifken ilham günleri
const HAFTALIK_GUN = "Wed";                   // 30–89 gün pasifken tek ilham günü
const SESSIZ_GUN = 180;                       // bu kadar gün pasif → hiçbir şey gönderilmez

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

// Türkiye saatine göre gün ("YYYY-MM-DD"), dakika (0-1439), haftanın günü
function trZaman(now: Date) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", weekday: "short", hourCycle: "h23",
  }).formatToParts(now).map(x => [x.type, x.value]));
  return {
    gun: `${p.year}-${p.month}-${p.day}`,
    dk: Number(p.hour) * 60 + Number(p.minute),
    hg: String(p.weekday),
    haftaSonu: p.weekday === "Sat" || p.weekday === "Sun",
  };
}
// Gün indeksi (epoch günü) — o gün için sabit söz seçimi
function gunIndeksi(gun: string): number {
  return Math.floor(new Date(gun + "T00:00:00Z").getTime() / 86400000);
}
function gunFarki(a: string, b: string): number { return gunIndeksi(a) - gunIndeksi(b); }
function saatDk(s: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s);
  if (!m) return -1;
  const d = Number(m[1]) * 60 + Number(m[2]);
  return d >= 0 && d < 1440 ? d : -1;
}

// Bugün (TR günü) Yeni Ay ya da Dolunay anı var mı? (ortalama senodik ay; uygulamadaki ay.js ile aynı referans)
const SENODIK_MS = 29.53058867 * 86400000;
const REF_YENI_AY = Date.UTC(2000, 0, 6, 18, 14, 0);
function ayOlayi(gun: string): boolean {
  const bas = Date.parse(gun + "T00:00:00+03:00"), son = bas + 86400000;
  const k = Math.floor((bas - REF_YENI_AY) / SENODIK_MS);
  for (let i = k - 1; i <= k + 1; i++) {
    for (const t of [REF_YENI_AY + i * SENODIK_MS, REF_YENI_AY + (i + 0.5) * SENODIK_MS]) {
      if (t >= bas && t < son) return true;
    }
  }
  return false;
}

type Geri = { acilis?: string; asamalar?: string[]; son?: string; ay_son?: string; msgler?: number[] };

// Havuzdan bu kişiye daha önce gitmemiş (yoksa en eski gideni) mesajı seç
function mesajSec(havuz: number[], gecmis: number[]): number {
  const yeni = havuz.find(id => !gecmis.includes(id));
  if (yeni !== undefined) return yeni;
  return [...havuz].sort((a, b) => gecmis.lastIndexOf(a) - gecmis.lastIndexOf(b))[0];
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

  const { gun, dk, hg, haftaSonu } = trZaman(new Date());
  const sabit = haftaSonu ? "16:00" : "12:00";
  const vaktiGeldi = (s: string) => { const d = saatDk(s); return d >= 0 && dk >= d && dk < d + PENCERE_DK; };
  const bugunAyOlayi = ayOlayi(gun);

  const { data: tokenlar } = await sb.from("push_token")
    .select("token, ek_saatler, gon, son_acilis, guncelleme, hatirlatma, son_ruh, geri").eq("ilham", true);
  if (!tokenlar || !tokenlar.length) return new Response("token yok", { status: 200 });

  // Önce kimin neyi alacağını belirle (havuzu gereksiz yere çekmemek için)
  type Plan = { token: string; slotlar: { saat: string; sira: number }[]; gonderilen: string[]; ozel?: { id: number; asama: string }; geri?: Geri };
  const plan: Plan[] = [];
  for (const t of tokenlar as Array<Record<string, unknown>>) {
    const token = String(t.token || "");
    if (!/^ExponentPushToken\[/.test(token)) continue;
    const gon = (t.gon && typeof t.gon === "object" ? t.gon : {}) as { gun?: string; slots?: unknown };
    let gonderilen: string[] = [];
    if (gon.gun === gun) {
      // eski biçim {gun} → bugünün sabit bildirimi zaten gitmiş say
      gonderilen = Array.isArray(gon.slots) ? gon.slots.map(String) : [sabit];
    }

    // ---- pasif gün sayısı ----
    const acilisHam = String(t.son_acilis || t.guncelleme || "");
    const acilisT = Date.parse(acilisHam);
    const pasif = isNaN(acilisT) ? 0 : gunFarki(gun, trZaman(new Date(acilisT)).gun);
    if (pasif >= SESSIZ_GUN) continue;

    if (pasif < 7) {
      // ---- normal akış: sabit + ek saatler ----
      const ek = (Array.isArray(t.ek_saatler) ? t.ek_saatler : [])
        .map(String).filter(s => saatDk(s) >= 0 && s !== sabit).slice(0, MAKS_EK);
      const adaylar = [{ saat: sabit, sira: 0 }, ...ek.map((s, i) => ({ saat: s, sira: i + 1 }))];
      const slotlar = adaylar.filter(a => vaktiGeldi(a.saat) && !gonderilen.includes(a.saat));
      if (slotlar.length) plan.push({ token, slotlar, gonderilen });
      continue;
    }

    // ---- pasif (7–89 gün): yalnız sabit slotta, günde en fazla bir bildirim ----
    if (!vaktiGeldi(sabit) || gonderilen.includes(sabit)) continue;

    let geri = (t.geri && typeof t.geri === "object" ? t.geri : {}) as Geri;
    if (geri.acilis !== acilisHam) {
      // uygulama yeniden açılmış (ya da ilk kez) → aşamalar sıfırlanır, mesaj geçmişi korunur
      geri = { acilis: acilisHam, asamalar: [], ay_son: geri.ay_son, msgler: geri.msgler || [] };
    }
    const asamalar = geri.asamalar || [];
    const msgler = geri.msgler || [];

    let asama: string | null = null;
    const araYeter = !geri.son || gunFarki(gun, geri.son) >= 4;
    if (t.hatirlatma !== false && araYeter) {
      if (pasif >= 30 && pasif < 90 && !asamalar.includes("30")) asama = "30";
      else if (pasif >= 14 && pasif < 30 && !asamalar.includes("14")) asama = "14";
      else if (pasif < 14 && !asamalar.includes("7")) asama = "7";
      else if (bugunAyOlayi && (
        (pasif >= 15 && pasif < 30 && !asamalar.includes("ay")) ||
        (pasif >= 30 && (!geri.ay_son || gunFarki(gun, geri.ay_son) >= 25))
      )) asama = "ay";
    }

    if (asama) {
      const havuz = t.son_ruh === "dusuk" ? HAVUZ_YUMUSAK : HAVUZ_ASAMA[asama];
      const id = mesajSec(havuz, msgler);
      // Daha büyük bir aşama gönderildiyse küçükler de "geçildi" sayılır
      const yeniAsamalar = new Set(asamalar);
      yeniAsamalar.add(asama);
      if (asama === "30") { yeniAsamalar.add("14"); yeniAsamalar.add("7"); }
      if (asama === "14") yeniAsamalar.add("7");
      geri = {
        ...geri, asamalar: [...yeniAsamalar], son: gun,
        ay_son: asama === "ay" ? gun : geri.ay_son,
        msgler: [...msgler, id].slice(-30),
      };
      plan.push({ token, slotlar: [{ saat: sabit, sira: 0 }], gonderilen, ozel: { id, asama }, geri });
    } else if ((pasif < 30 && SEYREK_GUNLER.includes(hg)) || (pasif >= 30 && pasif < 90 && hg === HAFTALIK_GUN)) {
      // seyrekleşmiş ilham (7–29: haftada 3 · 30–89: haftada 1)
      plan.push({ token, slotlar: [{ saat: sabit, sira: 0 }], gonderilen, geri });
    } else if (geri !== t.geri) {
      // gönderim yok; yalnız sıfırlanan durumu kaydet
      plan.push({ token, slotlar: [], gonderilen, geri });
    }
  }
  if (!plan.length) return new Response(JSON.stringify({ gun, gonderilen: 0 }), { status: 200, headers: { "Content-Type": "application/json" } });

  // İlham cümlesi gereken biri varsa havuzu çek
  let soz = (_sira: number) => "";
  if (plan.some(p => p.slotlar.length && !p.ozel)) {
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
    soz = (sira: number) => havuz[(gi + sira * adim) % havuz.length];
  }

  const mesajlar: unknown[] = [];
  let ozelSayi = 0;
  for (const p of plan) {
    if (!p.slotlar.length) continue;
    if (p.ozel) {
      const m = MESAJ[p.ozel.id];
      mesajlar.push({ to: p.token, title: m.baslik, body: m.mesaj, sound: "default", channelId: "default", data: { yol: `donus:${m.one}:${p.ozel.asama}` } });
      ozelSayi++;
    } else {
      // Aynı anda birden çok slot vaktiyse (ör. ek saat = sabit+15dk) yalnızca biri gider
      const s = p.slotlar[0];
      mesajlar.push({ to: p.token, title: "✨ Günün ilham cümlesi", body: soz(s.sira), sound: "default", channelId: "default", data: { yol: "ilham" } });
    }
    p.gonderilen.push(...p.slotlar.map(x => x.saat));
  }

  await expoGonder(mesajlar);
  for (const p of plan) {
    const guncel: Record<string, unknown> = {};
    if (p.slotlar.length) guncel.gon = { gun, slots: p.gonderilen };
    if (p.geri) guncel.geri = p.geri;
    if (Object.keys(guncel).length) await sb.from("push_token").update(guncel).eq("token", p.token);
  }

  return new Response(JSON.stringify({ gun, gonderilen: mesajlar.length, ozel: ozelSayi }), { status: 200, headers: { "Content-Type": "application/json" } });
});
