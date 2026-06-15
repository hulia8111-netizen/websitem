/* ============================================================
   ciftsaat.js — Çift (Ayna) Saat Anlamları ⏰✨
   Uygulama içinde okunan bir bilgi alanı: tüm çift saatlerin anlam
   kütüphanesi + favoriler + son görülenler. Saat eşitleştiğinde
   (11:11, 22:22…) yalnızca sessizce "Son Görülenler"e eklenir —
   BİLDİRİM veya otomatik popup YOKTUR. Anlamları kullanıcı, karttaki
   saatlere tıklayarak dilediği an okur.
   Widget altyapısı için window.CiftSaat API'si sunar.
   Global: window.CiftSaat
   ============================================================ */

const CiftSaat = window.CiftSaat = (() => {
  const $ = sel => document.querySelector(sel);
  const FAV = "ciftsaat-fav";
  const GECMIS = "ciftsaat-gecmis";
  let sonDakika = null;

  function ikiHane(n) { return String(n).padStart(2, "0"); }
  function suanHHMM(d = new Date()) { return ikiHane(d.getHours()) + ":" + ikiHane(d.getMinutes()); }
  function aynaMi(d = new Date()) { return d.getHours() === d.getMinutes(); }

  /* ---------- veri / API ---------- */
  function anlam(saat) {
    return (DATA.ciftSaatler || []).find(x => x.saat === saat)
      || Object.assign({ saat }, DATA.ciftSaatGenel);
  }
  function suankiAnlam() { return aynaMi() ? anlam(suanHHMM()) : null; }
  function sonGorulen() { const g = gecmisAl(); return g.length ? g[0] : null; }

  function favAl() { return Store.get(FAV, []); }
  function favYaz(l) { Store.set(FAV, l); }
  function favMi(saat) { return favAl().includes(saat); }
  function favToggle(saat) {
    const l = favAl(); const i = l.indexOf(saat);
    if (i >= 0) l.splice(i, 1); else l.push(saat);
    favYaz(l); return favMi(saat);
  }
  function gecmisAl() { return Store.get(GECMIS, []); }
  function gecmisEkle(saat) {
    const g = gecmisAl();
    g.unshift({ saat, ts: Date.now() });
    while (g.length > 50) g.pop();
    Store.set(GECMIS, g);
  }

  /* ---------- popup ---------- */
  function popupAc(saat, gecmiseEkle) {
    const a = anlam(saat);
    $("#cs-saat").textContent = saat;
    $("#cs-mesaj").textContent = a.mesaj;
    $("#cs-yorum").textContent = a.yorum;
    $("#cs-olumlama").textContent = "“" + a.olumlama + "”";
    const pop = $("#cs-popup");
    pop.hidden = false;
    pop.classList.remove("gor"); void pop.offsetWidth; pop.classList.add("gor");
    if (gecmiseEkle) { gecmisEkle(saat); cizFavGecmis(); }
  }
  function popupKapat() { const p = $("#cs-popup"); p.classList.remove("gor"); setTimeout(() => { p.hidden = true; }, 350); }

  /* ---------- algılama ---------- */
  function kontrol() {
    const now = new Date();
    const t = suanHHMM(now);
    const canli = $("#cs-canli");
    if (canli) canli.textContent = t;

    if (aynaMi(now)) {
      if (sonDakika !== t) {
        sonDakika = t;
        // Bildirim ve otomatik popup KALDIRILDI: çift saatler yalnızca
        // uygulama içinde okunan bir bilgi alanıdır. Yakalanan saat sessizce
        // "Son Görülenler"e eklenir; kullanıcı dilediğinde tıklayıp okur.
        gecmisEkle(t);
        cizFavGecmis();
      }
    } else if (now.getMinutes() !== Number(sonDakika && sonDakika.slice(3))) {
      sonDakika = null; // farklı dakikaya geçince sıfırla
    }
  }

  /* ---------- kart UI ---------- */
  function cizGrid() {
    const grid = $("#cs-grid");
    if (!grid) return;
    grid.innerHTML = "";
    (DATA.ciftSaatler || []).forEach(x => {
      const b = document.createElement("button");
      b.className = "cs-cip";
      b.textContent = x.saat;
      b.addEventListener("click", () => popupAc(x.saat, false));
      grid.appendChild(b);
    });
  }
  function cizFavGecmis() {
    const gecEl = $("#cs-gecmis-liste");
    if (gecEl) {
      const g = gecmisAl().slice(0, 12);
      gecEl.innerHTML = `<p class="cs-alt-baslik">Son Görülenler</p>` + (g.length
        ? `<div class="cs-mini-grid">${g.map(x => `<button class="cs-cip" data-s="${x.saat}">${x.saat}</button>`).join("")}</div>`
        : `<p class="muted small">Henüz çift saat yakalamadın.</p>`);
      gecEl.querySelectorAll("[data-s]").forEach(b => b.addEventListener("click", () => popupAc(b.dataset.s, false)));
    }
  }

  function baglan() {
    if (!$("#cs-grid")) return;
    const popKapatBtn = $("#cs-kapat");
    if (popKapatBtn) popKapatBtn.addEventListener("click", popupKapat);
    const pop = $("#cs-popup");
    if (pop) pop.addEventListener("click", e => { if (e.target === pop) popupKapat(); });
    // Ritüeller & Araçlar kutucuğundan overlay aç/kapat
    const acBtn = $("#ciftsaat-ac");
    if (acBtn) acBtn.addEventListener("click", ac);
    const ovKapat = $("#ciftsaat-kapat");
    if (ovKapat) ovKapat.addEventListener("click", kapat);
    const ov = $("#ciftsaat-overlay");
    if (ov) ov.addEventListener("click", e => { if (e.target === ov) kapat(); });
    cizGrid();
    cizFavGecmis();
    kontrol();
    setInterval(kontrol, 1000);
  }

  /* ---------- overlay aç/kapat ---------- */
  function ac() {
    const ov = $("#ciftsaat-overlay"); if (!ov) return;
    document.body.classList.add("cs-aktif");
    ov.hidden = false; ov.classList.remove("gor"); void ov.offsetWidth; ov.classList.add("gor");
  }
  function kapat() {
    const ov = $("#ciftsaat-overlay"); if (!ov) return;
    ov.classList.remove("gor");
    setTimeout(() => { ov.hidden = true; document.body.classList.remove("cs-aktif"); }, 350);
  }

  document.addEventListener("DOMContentLoaded", baglan);

  /* Widget altyapısı: dış kullanım için API */
  return { anlam, suankiAnlam, sonGorulen, suanHHMM, aynaMi, favAl, gecmisAl, ac, kapat };
})();
