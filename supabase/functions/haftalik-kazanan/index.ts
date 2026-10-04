// ============================================================
// haftalik-kazanan — "Haftanın Işığı" haftalık kazanan seçimi (Edge Function)
// Her Pazar 23:59 (Türkiye saati) çalışır (cron). Biten haftanın (Pzt→Pzr)
// topluluk_skor sıralamasını alır, ilk 10'u belirler ve ödülleri atayıp
// topluluk_kazananlar arşivine yazar. İdempotent: aynı hafta iki kez yazılmaz.
//
// ÖDÜLLER:
//  🥇 1. sıra → "Haftanın Işık Saçan Ruhu" unvanı + Altın Işık Rozeti +
//     SIRALI (her hafta bir sonraki) Word ışık kartı + uzun mesajı.
//     Kart havuzu canlı siteden çekilir: js/haftalik-kartlar.js (yeniden dağıtım gerekmez).
//  🏅 2..10 → "Haftanın Işık Rozeti" + benzersiz rastgele Işık Kartı (deste indeksi;
//     başlık/mesajı istemci DATA.kartlar'dan çözer). Aynı hafta tekrar deste kartı yok.
//  🌱 sira 0 → "Yükselen Işık": ilk 3 dışında, puanını geçen haftaya göre en çok
//     artıran kişi (en az YUKSELEN_MIN artış). Yeni katılanlara da şans.
//
// VİTRİN BİLDİRİMİ (?mod=bildir — Pazartesi 10:00 cron): biten haftanın ilk 3'üne +
// Yükselen Işık'a kişisel tebrik, topluluk tercihi açık diğer herkese "Haftanın
// Işıkları belli oldu". İdempotent (topluluk_meta.son_vitrin_bildirim).
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const KART_URL = "https://isiginibull.net/js/haftalik-kartlar.js";
const DESTE_BOYU = 47;            // DATA.kartlar uzunluğu (normal Işık Kartı destesi)
const UNVAN = "Haftanın Işık Saçan Ruhu";
const YUKSELEN_UNVAN = "Yükselen Işık";
const YUKSELEN_MIN = 10;          // Yükselen Işık için en az puan artışı
const EXPO_URL = "https://exp.host/--/api/v2/push/send";
// Bir haftanın Pazartesi anahtarından önceki haftanınkini üret
function oncekiHafta(h: string): string {
  const d = new Date(h + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() - 7);
  return d.toISOString().slice(0, 10);
}
async function expoGonder(mesajlar: unknown[]) {
  for (let i = 0; i < mesajlar.length; i += 100) {
    try {
      await fetch(EXPO_URL, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(mesajlar.slice(i, i + 100)) });
    } catch (_e) { /* sessiz */ }
  }
}

/* Pazartesi vitrin bildirimi: biten haftanın kazananlarına tebrik, diğerlerine duyuru */
async function vitrinBildir(sb: ReturnType<typeof createClient>, hafta: string) {
  const { data: meta } = await sb.from("topluluk_meta").select("deger").eq("anahtar", "son_vitrin_bildirim").maybeSingle();
  if ((meta?.deger as { hafta?: string } | null)?.hafta === hafta) return { atlandi: "zaten gonderildi", hafta };
  const { data: kaz } = await sb.from("topluluk_kazananlar").select("sira,user_id").eq("hafta", hafta).lte("sira", 3);
  if (!kaz || !kaz.length) return { atlandi: "kazanan yok", hafta };
  const kisisel: Record<number, { title: string; body: string }> = {
    1: { title: "👑 Tebrikler, Haftanın Işık Saçan Ruhu sensin!", body: "Bu hafta topluluğu en çok sen aydınlattın. Ödül kartın Rozetler'de seni bekliyor ✨" },
    2: { title: "🥈 Tebrikler, bu haftanın Işık Saçanlarındansın!", body: "Işığın topluluk vitrininde parlıyor ✨" },
    3: { title: "🥉 Tebrikler, bu haftanın Işık Saçanlarındansın!", body: "Işığın topluluk vitrininde parlıyor ✨" },
    0: { title: "🌱 Tebrikler, bu haftanın Yükselen Işığı sensin!", body: "Geçen haftaya göre en çok parlayan sen oldun ✨" },
  };
  const kazananId = new Map<string, number>();
  for (const k of kaz as Array<{ sira: number; user_id: string }>) if (k.user_id && !kazananId.has(k.user_id)) kazananId.set(k.user_id, k.sira);
  const { data: tokenlar } = await sb.from("push_token").select("token,user_id,topluluk");
  const mesajlar: unknown[] = [];
  for (const t of (tokenlar || []) as Array<{ token: string; user_id: string | null; topluluk: boolean }>) {
    if (!/^ExponentPushToken\[/.test(String(t.token || ""))) continue;
    const sira = t.user_id ? kazananId.get(t.user_id) : undefined;
    if (sira !== undefined) {
      const m = kisisel[sira]; mesajlar.push({ to: t.token, title: m.title, body: m.body, sound: "default", channelId: "default", data: { yol: "topluluk" } });
    } else if (t.topluluk !== false) {
      mesajlar.push({ to: t.token, title: "✨ Haftanın Işıkları belli oldu", body: "Bu haftanın Işık Saçanlarını topluluk vitrininde gör, bir tebrik bırak 🌟", sound: "default", channelId: "default", data: { yol: "topluluk" } });
    }
  }
  await expoGonder(mesajlar);
  await sb.from("topluluk_meta").upsert({ anahtar: "son_vitrin_bildirim", deger: { hafta, zaman: new Date().toISOString() }, guncelleme: new Date().toISOString() });
  return { hafta, gonderilen: mesajlar.length };
}

function j(v: unknown, s = 200) { return new Response(JSON.stringify(v), { status: s, headers: { "content-type": "application/json" } }); }

// Türkiye (UTC+3, DST yok) için haftanın Pazartesi anahtarı "YYYY-MM-DD"
function haftaIdTR(d = new Date()): string {
  const ist = new Date(d.getTime() + 3 * 3600 * 1000);
  const dow = (ist.getUTCDay() + 6) % 7;  // Pzt=0
  const mon = new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate() - dow));
  const mm = String(mon.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(mon.getUTCDate()).padStart(2, "0");
  return `${mon.getUTCFullYear()}-${mm}-${dd}`;
}

// Canlı js/haftalik-kartlar.js'ten [{no,baslik,aciklama}] dizisini çek
async function wordKartlariGetir(): Promise<Array<{ no: number; baslik: string; aciklama: string }>> {
  try {
    const r = await fetch(KART_URL + "?cb=" + Date.now(), { headers: { "cache-control": "no-cache" } });
    const txt = await r.text();
    // "HAFTALIK_KARTLAR =" atamasından başla (yorum satırındaki "HAFTALIK_KARTLAR:" tuzağını atla)
    const anchor = txt.indexOf("HAFTALIK_KARTLAR =");
    const bas = txt.indexOf("[", anchor >= 0 ? anchor : txt.indexOf("HAFTALIK_KARTLAR"));
    const son = txt.lastIndexOf("]");
    if (bas < 0 || son < 0) return [];
    return JSON.parse(txt.slice(bas, son + 1));
  } catch (_e) { return []; }
}

Deno.serve(async (req) => {
  try {
    const SB_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SB_URL || !SERVICE_ROLE) return j({ ok: false, hata: "Supabase env eksik" }, 500);
    const sb = createClient(SB_URL, SERVICE_ROLE);

    // İsteğe bağlı ?hafta=YYYY-MM-DD ile manuel hafta finalize edilebilir
    const url = new URL(req.url);

    // Pazartesi vitrin bildirimi: biten (bir önceki) haftayı duyur
    if (url.searchParams.get("mod") === "bildir") {
      const h = url.searchParams.get("hafta") || oncekiHafta(haftaIdTR());
      return j({ ok: true, ...(await vitrinBildir(sb, h)) });
    }

    const hafta = url.searchParams.get("hafta") || haftaIdTR();

    // İdempotans: bu hafta zaten arşivlendiyse çık
    const { data: mevcut } = await sb.from("topluluk_kazananlar").select("id").eq("hafta", hafta).limit(1);
    if (mevcut && mevcut.length) return j({ ok: true, atlandi: true, hafta, mesaj: "zaten arşivlenmiş" });

    // Bu haftanın ilk 10'u
    const { data: skor, error: sErr } = await sb
      .from("topluluk_skor").select("user_id,ad,puan")
      .eq("hafta", hafta).order("puan", { ascending: false }).limit(10);
    if (sErr) return j({ ok: false, hata: sErr.message }, 500);
    if (!skor || !skor.length) return j({ ok: true, hafta, kazanan: 0, mesaj: "puan yok" });

    // 1. sıra için sıralı Word kartı: şimdiye dek finalize edilmiş benzersiz hafta sayısı
    const { data: gecmisHaftalar } = await sb.from("topluluk_kazananlar").select("hafta");
    const sira1Sayac = new Set((gecmisHaftalar || []).map((r: { hafta: string }) => r.hafta)).size;

    const wordKartlar = await wordKartlariGetir();
    const wIdx = wordKartlar.length ? (sira1Sayac % wordKartlar.length) : -1;
    const wKart = wIdx >= 0 ? wordKartlar[wIdx] : null;

    // 2..10 için benzersiz rastgele deste indeksleri
    const havuz = Array.from({ length: DESTE_BOYU }, (_v, i) => i);
    for (let i = havuz.length - 1; i > 0; i--) { const k = Math.floor(Math.random() * (i + 1)); [havuz[i], havuz[k]] = [havuz[k], havuz[i]]; }

    const satirlar: Record<string, unknown>[] = skor.map((s: { user_id: string; ad: string; puan: number }, i: number) => {
      const sira = i + 1;
      if (sira === 1) {
        return {
          hafta, sira, user_id: s.user_id, ad: s.ad, puan: s.puan,
          unvan: UNVAN, rozet: "altin",
          kart_no: wKart ? wKart.no : null,
          kart_baslik: wKart ? wKart.baslik : null,
          kart_aciklama: wKart ? wKart.aciklama : null,
        };
      }
      return {
        hafta, sira, user_id: s.user_id, ad: s.ad, puan: s.puan,
        unvan: null, rozet: "hafta",
        kart_no: havuz[(i - 1) % havuz.length],   // deste indeksi (istemci başlığı çözer)
        kart_baslik: null, kart_aciklama: null,
      };
    });

    // 🌱 Yükselen Işık: ilk 3 dışında, geçen haftaya göre puanını en çok artıran
    let yukselen: { user_id: string; ad: string; puan: number; artis: number } | null = null;
    try {
      const ilk3 = new Set(skor.slice(0, 3).map((s: { user_id: string }) => s.user_id));
      const { data: buHafta } = await sb.from("topluluk_skor").select("user_id,ad,puan").eq("hafta", hafta);
      const { data: gecen } = await sb.from("topluluk_skor").select("user_id,puan").eq("hafta", oncekiHafta(hafta));
      const onceki = new Map((gecen || []).map((g: { user_id: string; puan: number }) => [g.user_id, g.puan || 0]));
      for (const s of (buHafta || []) as Array<{ user_id: string; ad: string; puan: number }>) {
        if (ilk3.has(s.user_id)) continue;
        const artis = (s.puan || 0) - (onceki.get(s.user_id) || 0);
        if (artis >= YUKSELEN_MIN && (!yukselen || artis > yukselen.artis)) yukselen = { ...s, artis };
      }
    } catch (_e) { /* sessiz */ }
    if (yukselen) {
      satirlar.push({
        hafta, sira: 0, user_id: yukselen.user_id, ad: yukselen.ad, puan: yukselen.puan,
        unvan: YUKSELEN_UNVAN, rozet: "yukselen", kart_no: null, kart_baslik: null, kart_aciklama: null,
      });
    }

    const { error: iErr } = await sb.from("topluluk_kazananlar").insert(satirlar);
    if (iErr) return j({ ok: false, hata: iErr.message }, 500);

    return j({ ok: true, hafta, kazanan: satirlar.length, sira1Kart: wKart ? wKart.baslik : null, yukselen: yukselen ? yukselen.ad : null });
  } catch (e) {
    return j({ ok: false, hata: String(e) }, 500);
  }
});
