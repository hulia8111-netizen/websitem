/* ============================================================
   dolunayrituel.js — Ücretsiz Dolunay Ritüeli 🌕🎁
   ------------------------------------------------------------
   Ücretsiz "Dolunay Bırakma Ritüeli" PDF'i. ÜÇ yerden erişilir:
     1) Mağaza → Ritüel & Araçlar → Ritüeller  (kart + "İndir")
     2) Meditasyonlar sayfası  (üstteki CTA kartı → indir)
     3) Spiritüel Takvim → dolunay günü  (CTA → ac() → mağaza ritüel)
   Yeni Ay ritüeliyle aynı düzen/CSS (yar-*).
   Global: window.DolunayRituel
   ============================================================ */

const DolunayRituel = window.DolunayRituel = (() => {
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

  const RITUEL = {
    baslik: "Dolunay Bırakma Ritüeli",
    kisaAmac: "Dolunayın dolup taşan ışığında seni yoranı bırak, dönüşüme kapı aç. 🌕",
    meta: "Kolay malzeme · ~10-15 dk · adım adım PDF",
    pdf: "/ritueller/dolunay-birakma-rituel.pdf",
    pdfAd: "Dolunay-Birakma-Rituel.pdf"
  };

  /* ---------- MAĞAZA KARTI ---------- */
  function kart(grid) {
    if (!grid) return;
    const k = document.createElement("div");
    k.className = "mg-kart yar-kart";
    k.innerHTML = `
      <div class="yar-kapak">
        <span class="yar-kapak-ay">🌕</span>
        <span class="yar-rozet">🎁 Ücretsiz</span>
      </div>
      <div class="yar-kart-govde">
        <div class="mg-kart-ad">${esc(RITUEL.baslik)}</div>
        <button class="yar-indir-btn" type="button">📥 Ücretsiz İndir</button>
        <p class="yar-kisa-amac">${esc(RITUEL.kisaAmac)}</p>
        <div class="yar-meta">${esc(RITUEL.meta)}</div>
      </div>`;
    k.querySelector(".yar-indir-btn").addEventListener("click", indir);
    grid.appendChild(k);
  }

  /* ---------- PDF indir (web: kaydet · uygulama/mobil: yeni sekmede aç) ---------- */
  function indir() {
    const url = RITUEL.pdf;
    const abs = location.origin + url;
    const native = window.__ISIGINI_NATIVE === true || /\bwv\b/i.test(navigator.userAgent || "");
    try {
      if (native) { window.open(abs, "_blank", "noopener,noreferrer"); return; }
      const a = document.createElement("a");
      a.href = url; a.download = RITUEL.pdfAd; a.rel = "noopener";
      document.body.appendChild(a); a.click(); a.remove();
    } catch (e) {
      try { window.open(abs, "_blank", "noopener,noreferrer"); } catch (_e) {}
    }
  }

  /* ---------- Yönlendirme: mağaza ritüel grubunu aç ---------- */
  function ac() {
    try {
      if (window.Magaza && Magaza.ac) Magaza.ac("rituel-araclar", "ritueller");
    } catch (e) {}
  }

  /* ---------- Meditasyon sayfasındaki CTA'yı bağla + görünür yap ---------- */
  function baglanMeditasyon() {
    const sec = document.getElementById("dolunay-med-cta");
    if (sec) sec.hidden = false;
    const btn = document.getElementById("dolunay-med-btn");
    if (btn && !btn.__dolBagli) { btn.__dolBagli = true; btn.addEventListener("click", indir); }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", baglanMeditasyon);
  else baglanMeditasyon();

  return { kart, indir, ac };
})();
