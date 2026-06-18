/* ============================================================
   magaza.js — "Mağazam ✨" (sade ilk sürüm) 🛍️
   ------------------------------------------------------------
   İlk sürümde mağaza SADE: tam 3 ürün kartı gösterilir
     1) 🃏 Işık Kartları   2) 🕯️ Işık Mumları   3) ✨ Ritüel Araçları
   Her kartta: görsel · ad · kısa açıklama · "Satın Al" butonu.
   "Satın Al" → "Çok Yakında" mesajı (ürün linki henüz yok).

   GELECEK HAZIRLIĞI (altyapı hazır):
   - Bir ürüne `link` eklenince "Satın Al" o güvenli dış sayfaya gider.
   - Ürün detay metinleri (_hakkinda) kodda saklı; ileride detay
     sayfası açmak istenirse hazır.
   Kategori / alt sayfa / ürün listesi YOK (bilinçli sadelik).
   Global: window.Magaza
   ============================================================ */

const Magaza = window.Magaza = (() => {
  const $ = sel => document.querySelector(sel);

  // İlk sürüm ürünleri (tam 3 kart). link boş → "Satın Al" Çok Yakında gösterir.
  const URUNLER = [
    { ad: "Işık Kartları",  ikon: "🃏", aciklama: "Sezgi, farkındalık ve dönüşüm için ilham ve bilinç kartları.", gorsel: "/kart.jpg",   link: "" },
    { ad: "Işık Mumları",   ikon: "🕯️", aciklama: "Niyetle hazırlanmış, yaşam alanına huzur katan özel mum koleksiyonu.", gorsel: "/mumlar.jpg", link: "" },
    { ad: "Ritüel Araçları", ikon: "✨", aciklama: "Ritüellerine eşlik eden özenle seçilmiş araçlar ve setler.", gorsel: "", link: "" }
  ];

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function gecerliLink(l) { return typeof l === "string" && /^https?:\/\//i.test(String(l).trim()); }

  function gorselHTML(u) {
    if (gecerliLink(u.gorsel) || (u.gorsel && /^\//.test(u.gorsel))) {
      return `<div class="mg-kart-gorsel"><img src="${esc(u.gorsel)}" alt="${esc(u.ad)}" loading="lazy" /></div>`;
    }
    return `<div class="mg-kart-gorsel bos"><span>${esc(u.ikon || "✨")}</span></div>`;
  }

  function cizGrid() {
    const grid = $("#mg-grid"); if (!grid) return;
    const chips = $("#mg-kat-chips"); if (chips) chips.innerHTML = "";   // kategori yok
    const durum = $("#mg-durum"); if (durum) durum.textContent = "";
    grid.innerHTML = "";
    URUNLER.forEach(u => {
      const kart = document.createElement("div");
      kart.className = "mg-kart sade";
      kart.innerHTML = `
        ${gorselHTML(u)}
        <div class="mg-kart-ad">${esc(u.ikon)} ${esc(u.ad)}</div>
        <div class="mg-kart-aciklama">${esc(u.aciklama)}</div>
        <button class="mg-satinal" type="button">Satın Al ✦</button>`;
      kart.querySelector(".mg-satinal").addEventListener("click", () => satinAl(u));
      grid.appendChild(kart);
    });
  }

  // "Satın Al": link varsa güvenli dış sayfa, yoksa "Çok Yakında" mesajı
  function satinAl(u) {
    if (gecerliLink(u.link)) { window.open(u.link, "_blank", "noopener,noreferrer"); return; }
    yakindaGoster();
  }

  /* ---------- "Çok Yakında" mesaj kutusu ---------- */
  function yakindaGoster() {
    let p = $("#mg-yakinda");
    if (!p) {
      p = document.createElement("div");
      p.id = "mg-yakinda"; p.className = "mg-yakinda"; p.hidden = true;
      p.innerHTML = `
        <div class="mg-yakinda-ic">
          <div class="mg-yakinda-amblem">✨</div>
          <div class="mg-yakinda-baslik">Çok Yakında</div>
          <p class="mg-yakinda-metin">Bu ürün yakında satışa açılacaktır.<br>Satış bağlantıları ve duyurular için uygulamayı takip etmeyi unutmayın.</p>
          <button class="mg-yakinda-kapat" type="button">Tamam</button>
        </div>`;
      (document.querySelector(".mg-ic") || document.body).appendChild(p);
      p.addEventListener("click", e => { if (e.target === p || e.target.classList.contains("mg-yakinda-kapat")) yakindaKapat(); });
    }
    p.hidden = false; requestAnimationFrame(() => p.classList.add("gor"));
  }
  function yakindaKapat() { const p = $("#mg-yakinda"); if (p) { p.classList.remove("gor"); setTimeout(() => { p.hidden = true; }, 250); } }

  /* ---------- overlay aç/kapat ---------- */
  function ac() {
    const ov = $("#magaza-overlay"); if (!ov) return;
    const detay = $("#mg-detay"); if (detay) detay.hidden = true;     // detay kullanılmıyor
    const liste = $("#mg-liste"); if (liste) liste.hidden = false;
    cizGrid();
    document.body.classList.add("mg-aktif");
    ov.hidden = false; ov.classList.remove("gor"); void ov.offsetWidth; ov.classList.add("gor");
  }
  function kapat() {
    const ov = $("#magaza-overlay"); if (!ov) return;
    yakindaKapat();
    ov.classList.remove("gor");
    setTimeout(() => { ov.hidden = true; document.body.classList.remove("mg-aktif"); }, 350);
  }

  function baglan() {
    const acBtn = $("#magaza-ac"); if (acBtn) acBtn.addEventListener("click", ac);
    const kapatBtn = $("#magaza-kapat"); if (kapatBtn) kapatBtn.addEventListener("click", kapat);
    const ov = $("#magaza-overlay"); if (ov) ov.addEventListener("click", e => { if (e.target === ov) kapat(); });
  }
  document.addEventListener("DOMContentLoaded", baglan);

  return { ac, kapat, urunler: () => URUNLER };
})();
