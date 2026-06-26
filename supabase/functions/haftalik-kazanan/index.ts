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
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const KART_URL = "https://isiginibull.net/js/haftalik-kartlar.js";
const DESTE_BOYU = 47;            // DATA.kartlar uzunluğu (normal Işık Kartı destesi)
const UNVAN = "Haftanın Işık Saçan Ruhu";

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

    const satirlar = skor.map((s: { user_id: string; ad: string; puan: number }, i: number) => {
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

    const { error: iErr } = await sb.from("topluluk_kazananlar").insert(satirlar);
    if (iErr) return j({ ok: false, hata: iErr.message }, 500);

    return j({ ok: true, hafta, kazanan: satirlar.length, sira1Kart: wKart ? wKart.baslik : null });
  } catch (e) {
    return j({ ok: false, hata: String(e) }, 500);
  }
});
