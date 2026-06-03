/* ============================================================
   birlik.js — Birlik Enerjisi / Topluluk Enerji Haritası 🌍✨
   Tüm kullanıcıların (örnek) aktivitesi + senin gerçek katkın ortak bir
   "Birlik Enerjisi" oluşturur. Ana ekranda canlı gösterge; haritada şehir
   bazlı glow enerji noktaları, haftalık ortak hedef barları, şehir rozetleri
   ve eşik başarı animasyonları. Statik uygulama: diğer şehirler örnek değer,
   senin şehrine kendi aktiviten katkı verir.
   Global: window.Birlik
   ============================================================ */

const Birlik = window.Birlik = (() => {
  const $ = id => document.getElementById(id);
  function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
  function profil() { return Store.get("profil", {}) || {}; }
  function sehrim() { return profil().sehir || "İstanbul"; }

  /* ---------- senin haftalık katkın ---------- */
  function katki() {
    const gs = lastNDays(7);
    const med = gs.filter(g => Store.get("med-" + g)).length;
    const gorev = gs.reduce((t, g) => t + Object.values(Store.get("gorevler-" + g, {}) || {}).filter(Boolean).length, 0);
    const akis = gs.reduce((t, g) => t + Object.values((Store.get("akis-gorev", {}) || {})[g] || {}).filter(Boolean).length, 0);
    const mood = gs.filter(g => Store.get("mood-" + g)).length;
    const grat = (Store.get("gratitude", []) || []);
    const sukran = gs.filter(g => grat.some(n => n.tarih === g)).length;
    const katil = Object.values(Store.get("akis-katildim", {}) || {}).filter(Boolean).length + Object.values(Store.get("premium-katildim", {}) || {}).filter(Boolean).length;
    return { med, gorev, akis, mood, sukran, katil, toplam: med * 2 + gorev + akis + mood + sukran + katil * 2 };
  }

  /* ---------- şehir enerjisi (canlı) ---------- */
  function canliFaktor() { const h = new Date().getHours(); return Math.round(Math.sin((h - 6) / 24 * Math.PI * 2) * 6); }
  function sehirEnerji(ad) {
    const baz = 52 + (hash(ad + weekId()) % 38);            // 52-89 (haftalık)
    let e = baz + canliFaktor();
    if (ad === sehrim()) e += Math.min(15, katki().toplam);  // senin katkın
    return Math.max(20, Math.min(100, e));
  }
  function sehirler() {
    return DATA.birlikSehirKonum.map(s => ({ ad: s.ad, x: s.x, y: s.y, e: sehirEnerji(s.ad) })).sort((a, b) => b.e - a.e);
  }
  function genelEnerji() { const l = sehirler(); return Math.round(l.reduce((t, s) => t + s.e, 0) / l.length); }
  function trend() {
    const f = canliFaktor();
    return f > 1 ? "yükseliyor ✨" : f < -1 ? "sakinleşiyor 🌙" : "dengeleniyor 🌿";
  }

  /* ---------- haftalık ortak hedefler ---------- */
  function hedefYuzde(id) {
    const baz = 45 + (hash(id + weekId()) % 35); // 45-79
    const k = katki();
    const benim = { med: k.med * 4, yuruyus: (k.gorev + k.akis) * 3, mood: k.mood * 4, sukran: k.sukran * 5 }[id] || 0;
    return Math.min(100, baz + benim);
  }

  /* ---------- render: ana ekran mini gösterge ---------- */
  function cizMini() {
    const el = $("birlik-mini-ic"); if (!el) return;
    const g = genelEnerji();
    el.innerHTML = `<div class="bm-sol"><div class="bm-yuzde">%${g}</div><div class="bm-bar"><span style="width:${g}%"></span></div></div>
      <div class="bm-sag"><div class="bm-baslik">Birlik Enerjisi</div><div class="bm-trend">Bugün topluluğun enerjisi ${trend()}</div></div>`;
  }

  /* ---------- render: harita overlay ---------- */
  function cizHarita() {
    const sl = sehirler();
    const en = sl[0];
    // dünya + glow noktalar
    const harita = $("birlik-harita"); if (harita) harita.innerHTML = sl.map(s => {
      const enAktif = s.ad === en.ad;
      return `<span class="bh-nokta${enAktif ? " en-aktif" : ""}" style="left:${s.x}%;top:${s.y}%;--e:${s.e}" title="${s.ad} · %${s.e}"><span class="bh-glow"></span><span class="bh-etiket">${s.ad} %${s.e}</span></span>`;
    }).join("");
    // liste
    const liste = $("birlik-sehir-liste"); if (liste) liste.innerHTML = sl.map((s, i) =>
      `<div class="bsl-sat${s.ad === sehrim() ? " benim" : ""}${i === 0 ? " lider" : ""}"><span class="bsl-ad">📍 ${s.ad}${s.ad === sehrim() ? " (sen)" : ""}${i === 0 ? " · en aktif 🔥" : ""}</span><div class="bsl-yuva"><span style="width:${s.e}%"></span></div><span class="bsl-yuzde">%${s.e}</span></div>`).join("");
  }
  function cizGosterge() {
    const el = $("birlik-gosterge"); if (!el) return;
    const g = genelEnerji();
    const seviye = g >= 85 ? "huzur" : g >= 65 ? "uyum" : "dengeleniyor";
    el.innerHTML = `<div class="bg-yuzde">%${g}</div><div class="bg-trend">Bugün topluluğun enerjisi ${trend()}</div>
      <div class="bg-yuva"><span style="width:${g}%"></span></div>
      <div class="bg-mesaj">${g >= 85 ? `🌙 Bu hafta topluluk olarak %${g} huzur enerjisine ulaştınız.` : `Birlikte hareket ettikçe enerji yükseliyor ✨`}</div>`;
    el.classList.toggle("zirve", g >= 85);
  }
  function cizHedefler() {
    const el = $("birlik-hedefler"); if (!el) return;
    el.innerHTML = DATA.birlikHedefleri.map(h => {
      const y = hedefYuzde(h.id);
      return `<div class="bh-hedef${y >= 100 ? " tamam" : ""}"><div class="bhh-bas"><span>${h.ikon} ${h.ad}</span><b>%${y}</b></div><div class="bhh-yuva"><span style="width:${y}%"></span></div>${y >= 100 ? `<span class="bhh-rozet">Hedefe ulaşıldı ✨</span>` : ""}</div>`;
    }).join("");
  }
  function cizBasari() {
    const el = $("birlik-basari"); if (!el) return;
    const g = genelEnerji();
    const benimSehir = sehirler().find(s => s.ad === sehrim());
    let h = "";
    if (benimSehir && benimSehir.e >= 80) h += `<span class="birlik-rozet kazanildi">🌟 ${sehrim()} Işık Şehri</span>`;
    else h += `<span class="birlik-rozet" title="Şehrinin enerjisi %80 olunca açılır">🔒 ${sehrim()} Işık Şehri</span>`;
    if (g >= 85) h += `<span class="birlik-rozet kazanildi">💫 Birlik Zirvesi</span>`;
    else h += `<span class="birlik-rozet" title="Topluluk enerjisi %85 olunca açılır">🔒 Birlik Zirvesi</span>`;
    el.innerHTML = h;
    if (g >= 85 && !el.dataset.kutlandi) { el.dataset.kutlandi = "1"; basariShine(); }
  }
  function basariShine() {
    const f = document.createElement("div"); f.className = "birlik-shine"; f.innerHTML = `<div class="bs-ic">🌍✨<span>Birlik Enerjisi Zirvede!</span></div>`;
    document.body.appendChild(f); setTimeout(() => f.classList.add("gor"), 10);
    setTimeout(() => { f.classList.remove("gor"); setTimeout(() => f.remove(), 500); }, 1900);
  }

  function ciz() { cizGosterge(); cizHarita(); cizHedefler(); cizBasari(); }

  function ac() {
    if (!$("birlik-overlay")) return;
    const el = $("birlik-basari"); if (el) delete el.dataset.kutlandi;
    ciz();
    const ov = $("birlik-overlay"); document.body.classList.add("birlik-mod");
    ov.hidden = false; ov.classList.remove("gor"); void ov.offsetWidth; ov.classList.add("gor");
  }
  function kapat() { const ov = $("birlik-overlay"); if (!ov) return; ov.classList.remove("gor"); setTimeout(() => { ov.hidden = true; document.body.classList.remove("birlik-mod"); }, 450); }

  function baglan() {
    cizMini();
    const mini = $("birlik-mini"); if (mini) mini.addEventListener("click", ac);
    const a = $("birlik-ac"); if (a) a.addEventListener("click", ac);
    if (!$("birlik-overlay")) return;
    $("birlik-kapat").addEventListener("click", kapat);
    $("birlik-overlay").addEventListener("click", e => { if (e.target === $("birlik-overlay")) kapat(); });
  }
  document.addEventListener("DOMContentLoaded", baglan);
  return { ac, kapat, cizMini };
})();
