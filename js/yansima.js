/* ============================================================
   yansima.js — "Sana Dair" 🪞 kişisel yansımalar
   ------------------------------------------------------------
   Kullanıcının kendi verisinden (ruh hali, şükran, günlük, seri, toplam
   gün) nazik, kişisel içgörüler üretir ve Profil'de gösterir → uygulama
   "seni tanıyor" hissi verir. Veri yoksa ilgili satır atlanır; hiç yoksa
   bölüm gizli kalır. Global: window.Yansima
   ============================================================ */
window.Yansima = (() => {
  const $ = id => document.getElementById(id);
  const MOODAD = { great: "mutlu", good: "huzurlu", ok: "durgun", low: "üzgün", down: "hüzünlü" };
  const AYAD = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

  function anahtarlar(pre) {
    try {
      return Store.allKeys()
        .filter(k => k.startsWith(Store.PREFIX + pre))
        .map(k => k.replace(Store.PREFIX + pre, ""));
    } catch (e) { return []; }
  }
  function normMood(v) { try { return (window.moodKeyNormalize ? moodKeyNormalize(v) : v) || v; } catch (e) { return v; } }

  function buAyOneki() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; }

  function icgoruler() {
    const out = [];
    // 1) Toplam yolculuk günü
    let toplam = 0; try { toplam = streakBilgisi().toplam || 0; } catch (e) {}
    if (toplam >= 1) out.push({ ikon: "🌙", metin: `<b>${toplam}</b> gündür bu yolculuktasın.` });

    // 2) Güncel seri
    let seri = 0; try { seri = window.Seri ? Seri.guncelSeri() : (streakBilgisi().guncel || 0); } catch (e) {}
    if (seri >= 2) out.push({ ikon: "🔥", metin: `Şu an <b>${seri}</b> günlük serindesin — böyle devam.` });

    // 3) Bu ay en çok hissettiğin duygu
    const oncek = buAyOneki();
    const moodlar = anahtarlar("mood-").filter(d => d.startsWith(oncek)).map(d => normMood(Store.get("mood-" + d))).filter(Boolean);
    if (moodlar.length >= 3) {
      const say = {}; moodlar.forEach(m => say[m] = (say[m] || 0) + 1);
      const encok = Object.keys(say).sort((a, b) => say[b] - say[a])[0];
      const ad = MOODAD[encok] || encok;
      out.push({ ikon: "💙", metin: `${AYAD[new Date().getMonth()]} ayında en çok <b>${ad}</b> hissettin.` });
    }

    // 4) Şükran sayısı
    let sukran = 0; try { sukran = (Store.get("gratitude", []) || []).length; } catch (e) {}
    if (sukran >= 1) out.push({ ikon: "🙏", metin: `Bugüne dek <b>${sukran}</b> şey için şükrettin.` });

    // 5) Bu hafta içine yazma (farkındalık cevapları)
    const buHafta = [];
    for (let i = 0; i < 7; i++) { const d = new Date(); d.setDate(d.getDate() - i); buHafta.push(todayKey(d)); }
    const yazi = anahtarlar("awa-").filter(d => buHafta.indexOf(d) !== -1 && (Store.get("awa-" + d) || "").trim());
    if (yazi.length >= 1) out.push({ ikon: "📖", metin: `Bu hafta <b>${yazi.length}</b> kez içine yazdın.` });

    return out;
  }

  function ciz() {
    const bolum = $("yansima"), ic = $("yansima-ic");
    if (!bolum || !ic) return;
    const hepsi = icgoruler();
    if (!hepsi.length) { bolum.hidden = true; return; }

    // Güne göre döndür: en fazla 3 içgörü, her gün farklı sıra
    let di = 0; try { di = (typeof dayIndex === "function") ? dayIndex() : 0; } catch (e) {}
    const sirali = hepsi.slice();
    // toplam gün her zaman ilk sırada dursun; kalanları döndür
    const ilk = sirali.shift();
    for (let k = 0; k < (di % (sirali.length || 1)); k++) sirali.push(sirali.shift());
    const secili = [ilk].concat(sirali).slice(0, 3);

    ic.innerHTML = secili.map(s => `<div class="ya-satir"><span class="ya-ikon">${s.ikon}</span><span class="ya-metin">${s.metin}</span></div>`).join("");
    bolum.hidden = false;
  }

  function baglan() { ciz(); setTimeout(ciz, 600); }
  document.addEventListener("DOMContentLoaded", baglan);
  return { ciz };
})();
