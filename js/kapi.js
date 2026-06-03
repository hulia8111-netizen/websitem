/* ============================================================
   kapi.js — Günün Kapısı 🚪✨
   Uygulama açıldığında beliren sinematik spiritüel portal.
   Kapı açılınca günün mesajı + enerji kartı + mini rehber + olumlama
   ortaya çıkar. Tasarım her gün değişir, renk ay evresine göre belirlenir,
   kullanıcı kapı geçmişini görebilir. Günde bir kez otomatik açılır;
   araç kutusundan tekrar açılabilir.
   Global: window.Kapi
   ============================================================ */

const Kapi = window.Kapi = (() => {
  const $ = id => document.getElementById(id);
  const GUN = "kapi-";          // kapi-<gün> => o gün açıldı işareti
  const GECMIS = "kapi-gecmis";
  const SEMBOLLER = ["🌙", "✦", "☾", "✶"];

  /* Ay evresine göre 8 renk paleti (yeni ay → mor, dolunay → altın, vb.) */
  const PALET = [
    { a: "#7c5cbf", b: "#241247", glow: "#b38cff" }, // yeni ay
    { a: "#6f7adf", b: "#1d2350", glow: "#8b9cff" }, // hilal
    { a: "#5aa9ff", b: "#152a52", glow: "#7ad0ff" }, // ilk dördün
    { a: "#7fd6c0", b: "#163a3a", glow: "#6fe0d0" }, // şişkin
    { a: "#e9c46a", b: "#3a2c12", glow: "#f3d98c" }, // dolunay
    { a: "#e9a06a", b: "#3a1f12", glow: "#ffce9c" }, // solan şişkin
    { a: "#d98cff", b: "#2e1247", glow: "#e0a0ff" }, // son dördün
    { a: "#ff7a9c", b: "#3a1226", glow: "#ff9cb5" }  // balzamik
  ];

  function evreIdx() {
    if (typeof AyEvresi === "undefined" || !AyEvresi.fraz) return 0;
    return AyEvresi.evreIndex(AyEvresi.fraz()) % PALET.length;
  }
  function palet() { return PALET[evreIdx()]; }
  function tasarimNo() { return (typeof dayIndex === "function" ? dayIndex() : 0) % SEMBOLLER.length; }
  function enerjiSeviye(p) { return p >= 86 ? "Yüksek Frekans 🌟" : p >= 61 ? "Güçlü Enerji ✨" : p >= 31 ? "Dengeleniyor 🌿" : "Dinlenme Zamanı 🌙"; }

  /* Bugünün içeriği (gün boyu sabit) */
  function bugun() {
    const p = (window.Enerji && Enerji.hesapla) ? Enerji.hesapla() : 0;
    const olumPool = (DATA.olumlamalar && DATA.olumlamalar.length) ? DATA.olumlamalar : DATA.kapiMesajlari;
    return {
      mesaj: pickByDate(DATA.kapiMesajlari),
      rehber: pickByDate(DATA.kapiRehber),
      olumlama: pickByDate(olumPool),
      enerjiP: p,
      enerjiSeviye: enerjiSeviye(p)
    };
  }

  function acildiBugun() { return !!Store.get(GUN + todayKey()); }

  /* ---------- tema + parçacıklar ---------- */
  function temaUygula() {
    const ov = $("kapi-overlay"); if (!ov) return;
    const pal = palet();
    ov.style.setProperty("--kapi-1", pal.a);
    ov.style.setProperty("--kapi-2", pal.b);
    ov.style.setProperty("--kapi-glow", pal.glow);
    const portal = $("kapi-portal"); if (portal) portal.dataset.tasarim = tasarimNo();
    const sym = $("kapi-sembol"); if (sym) sym.textContent = SEMBOLLER[tasarimNo()];
  }
  function parcacikYap() {
    const el = $("kapi-parcaciklar"); if (!el || el.childElementCount) return;
    el.innerHTML = Array.from({ length: 28 }, () => "<span></span>").join("");
    [...el.children].forEach(s => {
      s.style.left = (Math.random() * 100).toFixed(1) + "%";
      s.style.top = (Math.random() * 100).toFixed(1) + "%";
      s.style.setProperty("--gec", (5 + Math.random() * 7).toFixed(2) + "s");
      s.style.animationDelay = (Math.random() * 6).toFixed(2) + "s";
      s.style.opacity = (0.3 + Math.random() * 0.6).toFixed(2);
      const sc = (0.5 + Math.random() * 1.4).toFixed(2);
      s.style.width = s.style.height = (sc * 3).toFixed(1) + "px";
    });
  }

  /* ---------- içerik ---------- */
  function cizGecmis() {
    const el = $("kapi-gecmis-liste"); if (!el) return;
    const g = Store.get(GECMIS, []) || [];
    el.innerHTML = g.length
      ? g.slice(0, 14).map(x => `<div class="kg-sat"><span class="kg-tarih">${new Date(x.tarih).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}</span><span class="kg-mesaj">${x.mesaj}</span></div>`).join("")
      : `<p class="muted small">Henüz kayıt yok.</p>`;
  }
  function reveal() {
    const ic = $("kapi-icerik"); if (!ic) return;
    const b = bugun();
    ic.innerHTML = `
      <p class="ki-mesaj">“${b.mesaj}”</p>
      <div class="ki-enerji"><span class="ki-en-yuzde">%${b.enerjiP}</span><span class="ki-en-ad">${b.enerjiSeviye}</span></div>
      <div class="ki-sat"><span class="ki-et">Mini Rehber</span><p>${b.rehber}</p></div>
      <div class="ki-olumlama">“${b.olumlama}”</div>
      <button class="btn kapi-gir" id="kapi-gir">İçeri Gir 🤍</button>
      <details class="gecmis kapi-gecmis-det"><summary>Kapı Geçmişim</summary><div id="kapi-gecmis-liste"></div></details>`;
    ic.hidden = false; ic.classList.remove("gor"); void ic.offsetWidth; ic.classList.add("gor");
    const gir = $("kapi-gir"); if (gir) gir.addEventListener("click", kapat);
    $("kapi-kapat").hidden = false;
    cizGecmis();
    if (!acildiBugun()) {
      Store.set(GUN + todayKey(), true);
      const g = Store.get(GECMIS, []) || [];
      g.unshift({ tarih: todayKey(), mesaj: b.mesaj });
      while (g.length > 60) g.pop();
      Store.set(GECMIS, g);
    }
  }

  /* ---------- kapı açılma sinematiği ---------- */
  function kapiyiAc() {
    const portal = $("kapi-portal"), kapali = $("kapi-kapali");
    if (!portal) return;
    portal.classList.add("aciliyor");
    kapali.classList.add("aciliyor");
    setTimeout(() => { kapali.hidden = true; reveal(); }, 1500);
  }

  /* ---------- aç / kapat ---------- */
  function ac() {
    if (!$("kapi-overlay")) return;
    temaUygula(); parcacikYap();
    const portal = $("kapi-portal"), kapali = $("kapi-kapali"), ic = $("kapi-icerik");
    portal.classList.remove("aciliyor"); kapali.classList.remove("aciliyor");
    ic.hidden = true; ic.classList.remove("gor");
    $("kapi-kapat").hidden = true;
    kapali.hidden = false;
    const ov = $("kapi-overlay");
    document.body.classList.add("kapi-mod");
    ov.hidden = false; ov.classList.remove("gor"); void ov.offsetWidth; ov.classList.add("gor");
  }
  function kapat() {
    const ov = $("kapi-overlay"); if (!ov) return;
    ov.classList.remove("gor");
    setTimeout(() => { ov.hidden = true; document.body.classList.remove("kapi-mod"); }, 600);
  }

  /* ---------- otomatik açılış (çakışmaları gözeterek) ---------- */
  function baskaOverlayAcik() {
    return ["#onboarding", "#test-overlay", "#sabah-overlay", ".vision-overlay", ".takvim-overlay", ".ayna-overlay", ".nefes-overlay", ".gece-overlay"]
      .some(sel => { const e = document.querySelector(sel); return e && !e.hidden && getComputedStyle(e).display !== "none"; });
  }
  function maybeAutoShow() {
    const isim = ((Store.get("profil", {}) || {}).isim || "").trim();
    if (!isim) return;            // önce isim onboarding'i
    if (acildiBugun()) return;    // bugün zaten açıldı
    if (baskaOverlayAcik()) { setTimeout(maybeAutoShow, 4000); return; } // çakışma → sonra dene
    ac();
  }

  function baglan() {
    const acBtn = $("kapi-ac");
    if (acBtn) acBtn.addEventListener("click", () => ac());
    if (!$("kapi-overlay")) return;
    $("kapi-ac-btn").addEventListener("click", kapiyiAc);
    $("kapi-kapat").addEventListener("click", kapat);
    $("kapi-overlay").addEventListener("click", e => { if (e.target === $("kapi-overlay") && !$("kapi-kapat").hidden) kapat(); });
    setTimeout(maybeAutoShow, 1600); // sabah/test/onboarding'e öncelik
  }
  document.addEventListener("DOMContentLoaded", baglan);
  return { ac, kapat, bugun };
})();
