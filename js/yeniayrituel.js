/* ============================================================
   yeniayrituel.js — Ücretsiz Yeni Ay Ritüeli 🌑🎁
   ------------------------------------------------------------
   Mağaza → Ritüel & Araçlar → Spiritüel Ritüeller bölümünde
   TEK kart: "Yeni Ay Işık Kapısı Ritüeli". Kartta "📥 Ücretsiz
   İndir" butonu; tıklayınca premium PDF iner. Butonun hemen
   altında ritüelin KISA amacı yazar. Detaylı anlatım PDF'te.
   Global: window.YeniAyRituel
   ============================================================ */

const YeniAyRituel = window.YeniAyRituel = (() => {
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

  const RITUEL = {
    baslik: "Yeni Ay Işık Kapısı Ritüeli",
    kisaAmac: "Yeni ay enerjisiyle niyetini tohumla, taze bir başlangıca kapı aç. 🌙",
    meta: "Kolay malzeme · ~10 dk · adım adım PDF",
    pdf: "/ritueller/yeni-ay-isik-kapisi-rituel.pdf",
    pdfAd: "Yeni-Ay-Isik-Kapisi-Rituel.pdf"
  };

  /* ---------- MAĞAZA KARTI ---------- */
  function kart(grid) {
    if (!grid) return;
    const k = document.createElement("div");
    k.className = "mg-kart yar-kart";
    k.innerHTML = `
      <div class="yar-kapak">
        <span class="yar-kapak-ay">🌑</span>
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

  return { kart, indir };
})();
