/* ============================================================
   hafta.js — Haftalık Kendini Değerlendirme 📊✨
   Son 7 günün verisini (ruh hali, görevler, meditasyon, streak, enerji,
   günlük, nefes) Fiziksel / Ruhsal / Zihinsel denge olarak puanlar.
   Her kategoriye yüzde + yorum + gelişim önerisi; en güçlü ve en ihmal
   edilen alan; haftalık enerji grafiği ve mini başarı rozeti.
   Hafta sonu otomatik açılır; araç kutusundan her an açılabilir.
   Global: window.Hafta
   ============================================================ */

const Hafta = window.Hafta = (() => {
  const $ = id => document.getElementById(id);

  /* ---------- veri toplama ---------- */
  function gunler() { return lastNDays(7); }
  function sayGun(pred) { return gunler().filter(pred).length; }

  function gorevTop(katId) {
    return gunler().reduce((t, g) => t + ((Store.get("gorevler-" + g, {}) || {})[katId] ? 1 : 0), 0);
  }
  function metrikler() {
    const gs = gunler();
    const grat = Store.get("gratitude", []) || [];
    const nefes = Store.get("nefes-seanslar", []) || [];
    const gunlukK = Store.get("gunluk-kayitlar", []) || [];
    const enerjiler = gs.map(g => Store.get("enerji-" + g, 0) || 0);
    return {
      moodGun: sayGun(g => Store.get("mood-" + g)),
      medGun: sayGun(g => Store.get("med-" + g)),
      gunlukGun: gs.filter(g => gunlukK.some(e => e.tarih === g)).length,
      sukranGun: gs.filter(g => grat.some(n => n.tarih === g)).length,
      nefesSayi: nefes.filter(s => gs.includes(s.tarih)).length,
      gorevF: gorevTop("fiziksel"), gorevR: gorevTop("ruhsal"), gorevZ: gorevTop("zihinsel"),
      streak: Math.min(typeof mevcutSeri === "function" ? mevcutSeri("visit-") : 0, 7),
      enerjiOrt: Math.round(enerjiler.reduce((a, b) => a + b, 0) / 7),
      enerjiler
    };
  }

  /* ---------- kategori puanları (0-100) ---------- */
  function puanlar(m) {
    const k = (x, n) => Math.min(x, n) / n;
    return {
      fiziksel: Math.round(k(m.gorevF, 7) * 45 + k(m.nefesSayi, 7) * 35 + k(m.streak, 7) * 20),
      ruhsal:   Math.round(k(m.medGun, 7) * 40 + k(m.gorevR, 7) * 25 + k(m.sukranGun, 7) * 20 + k(m.moodGun, 7) * 15),
      zihinsel: Math.round(k(m.gunlukGun, 7) * 40 + k(m.gorevZ, 7) * 30 + (m.enerjiOrt / 100) * 20 + k(m.moodGun, 7) * 10)
    };
  }
  function tier(katId, p) {
    const t = DATA.haftalikDenge[katId].tiers;
    return t.find(x => p >= x.min) || t[t.length - 1];
  }

  /* ---------- başarı rozeti ---------- */
  function rozet(p) {
    if (p.fiziksel >= 70 && p.ruhsal >= 70 && p.zihinsel >= 70) return "Dengeni korumaya başlıyorsun 🌙";
    if (p.ruhsal >= 80) return "Ruhsal rutinlerinde istikrarlısın ✨";
    if (p.fiziksel >= 70) return "Bu hafta kendine zaman ayırdın 🌿";
    if (p.zihinsel >= 70) return "Zihnini güzel besledin 🧠";
    if (Math.max(p.fiziksel, p.ruhsal, p.zihinsel) >= 50) return "Güzel bir denge kurmaya başladın 💫";
    return "Küçük adımlar büyük fark yaratır ✨";
  }

  /* ---------- render ---------- */
  const ADLAR = { fiziksel: "fiziksel", ruhsal: "ruhsal", zihinsel: "zihinsel" };
  function haftaAralik() {
    const gs = gunler();
    const f = new Date(gs[0]), s = new Date(gs[gs.length - 1]);
    const o = { day: "numeric", month: "long" };
    return `${f.toLocaleDateString("tr-TR", o)} – ${s.toLocaleDateString("tr-TR", o)}`;
  }
  function cizKategoriler(p) {
    const wrap = $("hafta-kategoriler"); if (!wrap) return;
    wrap.innerHTML = "";
    ["fiziksel", "ruhsal", "zihinsel"].forEach((id, i) => {
      const cfg = DATA.haftalikDenge[id];
      const deg = p[id];
      const t = tier(id, deg);
      const kart = document.createElement("div");
      kart.className = "hk-kart h-" + id;
      kart.innerHTML = `
        <div class="hk-bas"><span class="hk-ikon">${cfg.ikon}</span><span class="hk-ad">${cfg.ad}</span><span class="hk-yuzde">%<b>0</b></span></div>
        <div class="hk-yuva"><span class="hk-bar"></span></div>
        <p class="hk-yorum">${t.yorum}</p>
        <div class="hk-oneri"><span class="hk-et">Öneri</span>${t.oneri}</div>`;
      wrap.appendChild(kart);
      // dolum animasyonu (kademeli)
      const bar = kart.querySelector(".hk-bar");
      const yz = kart.querySelector(".hk-yuzde b");
      setTimeout(() => {
        bar.style.width = deg + "%";
        let cur = 0; const adim = Math.max(1, Math.round(deg / 28));
        const t2 = setInterval(() => { cur = Math.min(deg, cur + adim); yz.textContent = cur; if (cur >= deg) clearInterval(t2); }, 22);
      }, 250 + i * 180);
    });
  }
  function cizOzet(p) {
    const el = $("hafta-ozet"); if (!el) return;
    const sirali = Object.keys(p).sort((a, b) => p[b] - p[a]);
    const guclu = DATA.haftalikDenge[sirali[0]], zayif = DATA.haftalikDenge[sirali[sirali.length - 1]];
    el.innerHTML = `
      <div class="ho-sat ho-guclu"><span class="ho-et">En güçlü alanın</span><span>${guclu.ikon} ${guclu.ad} · %${p[sirali[0]]}</span></div>
      <div class="ho-sat ho-zayif"><span class="ho-et">En çok ihmal edilen</span><span>${zayif.ikon} ${zayif.ad} · %${p[sirali[sirali.length - 1]]}</span></div>`;
  }
  function cizGrafik(m) {
    const el = $("hafta-grafik"); if (!el) return;
    const gs = gunler(), today = todayKey();
    el.innerHTML = gs.map((g, i) => {
      const v = m.enerjiler[i];
      const ad = new Date(g).toLocaleDateString("tr-TR", { weekday: "short" });
      return `<div class="hg-bar${g === today ? " bugun" : ""}"><span class="hg-deg">${v}</span><div class="hg-yuva"><div class="hg-dolu" style="--h:${Math.max(3, v)}%"></div></div><span class="hg-ad">${ad}</span></div>`;
    }).join("");
  }
  function cizRozet(p) {
    const el = $("hafta-rozet"); if (!el) return;
    el.innerHTML = `<span class="hr-ikon">🏅</span><span class="hr-metin">${rozet(p)}</span>`;
    const wid = weekId();
    Store.set("haftalik-rozet-" + wid, rozet(p));
  }

  function ciz() {
    const m = metrikler(), p = puanlar(m);
    const ta = $("hafta-tarih"); if (ta) ta.textContent = haftaAralik();
    cizRozet(p); cizKategoriler(p); cizOzet(p); cizGrafik(m);
  }

  /* ---------- aç / kapat ---------- */
  function ac() {
    if (!$("hafta-overlay")) return;
    ciz();
    const ov = $("hafta-overlay");
    document.body.classList.add("hafta-mod");
    ov.hidden = false; ov.classList.remove("gor"); void ov.offsetWidth; ov.classList.add("gor");
  }
  function kapat() {
    const ov = $("hafta-overlay"); if (!ov) return;
    ov.classList.remove("gor");
    setTimeout(() => { ov.hidden = true; document.body.classList.remove("hafta-mod"); }, 500);
  }

  /* ---------- hafta sonu otomatik ---------- */
  function baskaOverlayAcik() {
    return ["#onboarding", "#test-overlay", "#sabah-overlay", "#kapi-overlay", ".vision-overlay", ".takvim-overlay", ".ayna-overlay", ".nefes-overlay", ".gece-overlay"]
      .some(sel => { const e = document.querySelector(sel); return e && !e.hidden && getComputedStyle(e).display !== "none"; });
  }
  function maybeAutoShow() {
    const isim = ((Store.get("profil", {}) || {}).isim || "").trim();
    if (!isim) return;
    const g = new Date().getDay();           // 0 = Pazar, 6 = Cumartesi
    if (g !== 0 && g !== 6) return;           // sadece hafta sonu
    if (Store.get("hafta-gosterildi") === weekId()) return;
    if (baskaOverlayAcik()) { setTimeout(maybeAutoShow, 5000); return; }
    Store.set("hafta-gosterildi", weekId());
    ac();
  }

  function baglan() {
    const acBtn = $("hafta-ac");
    if (acBtn) acBtn.addEventListener("click", ac);
    if (!$("hafta-overlay")) return;
    $("hafta-kapat").addEventListener("click", kapat);
    $("hafta-overlay").addEventListener("click", e => { if (e.target === $("hafta-overlay")) kapat(); });
    setTimeout(maybeAutoShow, 2600);
  }
  document.addEventListener("DOMContentLoaded", baglan);
  return { ac, kapat, ciz };
})();
