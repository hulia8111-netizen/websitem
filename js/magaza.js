/* ============================================================
   magaza.js — "Mağazam ✨" (dış mağaza vitrini) 🛍️
   ------------------------------------------------------------
   Spiritüel yolculuğa eşlik eden FİZİKSEL ürünlerin vitrini.
   Satın alma uygulama İÇİNDE yapılmaz; her ürün, güvenli DIŞ
   mağazada (kendi shop / iyzico / Shopier vb.) açılır → Google
   Play politikalarına tam uyumlu (fiziksel ürün, dış ödeme).
   Ürün linkleri boşsa kart "Yakında ✨" görünür (kırık link olmaz).
   "Ritüeller & Araçlar"daki kutucuktan overlay olarak açılır.
   Global: window.Magaza
   ============================================================ */

const Magaza = window.Magaza = (() => {
  const $ = sel => document.querySelector(sel);

  // ÜRÜNLER — gerçek satış linklerini buraya ekle (link: "https://...").
  // link boş kaldığı sürece kart "Yakında ✨" olarak görünür.
  const URUNLER = [
    { ikon: "💎", ad: "Doğal Kristal Seti", aciklama: "Niyet ve denge için özenle seçilmiş şifa taşları.", link: "" },
    { ikon: "🕯️", ad: "Şifa Mumu", aciklama: "Meditasyon ve ritüellerine eşlik eden doğal soya mumu.", link: "" },
    { ikon: "🃏", ad: "Melek & Tarot Kartı Destesi", aciklama: "Günün rehberliği için ilham veren kart destesi.", link: "" },
    { ikon: "📓", ad: "Niyet & Şükran Defteri", aciklama: "Yolculuğunu yazıya dökmen için özel tasarım defter.", link: "" },
    { ikon: "🌿", ad: "Tütsü & Adaçayı Seti", aciklama: "Alanını arındırmak için doğal tütsü ve adaçayı.", link: "" },
    { ikon: "📿", ad: "Niyet Bilekliği", aciklama: "Taşıdığın niyeti hatırlatan el yapımı doğal taş bileklik.", link: "" }
  ];

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function gecerliLink(l) { return typeof l === "string" && /^https?:\/\//i.test(l.trim()); }

  function cizGrid() {
    const grid = $("#mg-grid");
    if (!grid) return;
    grid.innerHTML = "";
    URUNLER.forEach(u => {
      const kart = document.createElement("div");
      kart.className = "mg-urun";
      const aksiyon = gecerliLink(u.link)
        ? `<a class="mg-btn" href="${esc(u.link)}" target="_blank" rel="noopener noreferrer">Satın Al ✦</a>`
        : `<span class="mg-btn yakinda" aria-disabled="true">Yakında ✨</span>`;
      kart.innerHTML = `
        <div class="mg-ikon">${esc(u.ikon)}</div>
        <div class="mg-bilgi">
          <div class="mg-ad">${esc(u.ad)}</div>
          <div class="mg-aciklama">${esc(u.aciklama)}</div>
        </div>
        ${aksiyon}`;
      grid.appendChild(kart);
    });
  }

  /* ---------- overlay aç/kapat (ciftsaat deseni) ---------- */
  function ac() {
    const ov = $("#magaza-overlay"); if (!ov) return;
    cizGrid();
    document.body.classList.add("mg-aktif");
    ov.hidden = false; ov.classList.remove("gor"); void ov.offsetWidth; ov.classList.add("gor");
  }
  function kapat() {
    const ov = $("#magaza-overlay"); if (!ov) return;
    ov.classList.remove("gor");
    setTimeout(() => { ov.hidden = true; document.body.classList.remove("mg-aktif"); }, 350);
  }

  function baglan() {
    const acBtn = $("#magaza-ac");
    if (acBtn) acBtn.addEventListener("click", ac);
    const kapatBtn = $("#magaza-kapat");
    if (kapatBtn) kapatBtn.addEventListener("click", kapat);
    const ov = $("#magaza-overlay");
    if (ov) ov.addEventListener("click", e => { if (e.target === ov) kapat(); });
  }
  document.addEventListener("DOMContentLoaded", baglan);

  return { ac, kapat, urunler: () => URUNLER };
})();
