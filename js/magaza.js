/* ============================================================
   magaza.js — "Mağazam ✨" 🛍️ (2 katmanlı: 3 bölüm → ürünler)
   ------------------------------------------------------------
   1. KATMAN (Mağazam açılışı): tam 3 BÖLÜM kartı gösterilir
       1) 🃏 Işık Kartları   2) 🕯️ Işık Mumları   3) ✨ Ritüel & Araçlar
     Her bölüm kartında "Ziyaret Et →" yazar. Dışarıdan ürünler görünmez.
   2. KATMAN (bir bölüme tıklayınca): o bölümün ürünleri kart kart gösterilir
     — foto + ad + spiritüel açıklama + fiyat + "Satın Al ✦".
     "Satın Al" → o ürüne ait Shopier linkine gider. Üstte "← Geri" ile
     bölümlere dönülür. Ürünü olmayan bölüm "çok yakında" durumu gösterir.
   Global: window.Magaza
   ============================================================ */

const Magaza = window.Magaza = (() => {
  const $ = sel => document.querySelector(sel);

  // 3 bölüm (kategori). Her bölümün kendi ürün listesi. Ritüel & Araçlar
  // içinde doğal taşlar; diğer ikisi şimdilik boş ("çok yakında").
  const KATEGORILER = [
    {
      id: "isik-kartlari", ad: "Işık Kartları", ikon: "🃏", gorsel: "/kart.jpg",
      aciklama: "Sezgi, farkındalık ve dönüşüm için ilham ve bilinç kartları.",
      urunler: []
    },
    {
      id: "isik-mumlari", ad: "Işık Mumları", ikon: "🕯️", gorsel: "/mumlar.jpg",
      aciklama: "Niyetle hazırlanmış, yaşam alanına huzur katan özel mum koleksiyonu.",
      urunler: []
    },
    {
      id: "rituel-araclar", ad: "Ritüel & Araçlar", ikon: "✨", gorsel: "",
      aciklama: "Doğal taşlar ve ritüellerine eşlik edecek özel parçalar.",
      urunler: [
        {
          ad: "Ametist Tel Sarım Kolye", ikon: "💜",
          aciklama: "El işçiliğiyle tel sarım yapılmış, gümüş kaplama doğal Ametist kolye. Stresi yatıştırır, zihni sakinleştirir; ruhsal dengeyi ve sezgiyi güçlendirir. Doğanın enerjisini yanında taşı. 💜",
          gorsel: "/urunler/ametist-kolye.jpg", fiyat: "304,99 TL",
          link: "https://www.shopier.com/dreamyhandmade/50073853"
        },
        {
          ad: "Kalp Form Sodalit Kolye", ikon: "💙",
          aciklama: "Kalp formunda, doğal Sodalit taşından el yapımı kolye. Zihinsel netlik ve sakinlik taşı; mantıklı düşünmeyi ve odaklanmayı destekler, iletişimi güçlendirir, kaygıyı hafifletir. Kalbinin üzerinde huzur. 💙",
          gorsel: "/urunler/sodalit-kalp-kolye.jpg", fiyat: "304,99 TL",
          link: "https://www.shopier.com/dreamyhandmade/50075370"
        },
        {
          ad: "Akik (Agat) Taşı", ikon: "💎",
          aciklama: "Her biri benzersiz, doğal ağaç-kesiti dokulu akik taşı. Topraklar, dengeler; iç huzuru ve güven duygusunu güçlendirir, yaşam alanına sakin bir enerji katar. 🌿",
          gorsel: "/urunler/akik-tasi.jpg", fiyat: "304,99 TL",
          link: "https://www.shopier.com/dreamyhandmade/50076643?utm_id=97757_v0_s00_e0_tv0"
        }
      ]
    }
  ];

  let aktifKat = null;   // null → bölümler görünür; kategori → ürünleri görünür

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function gecerliLink(l) { return typeof l === "string" && /^https?:\/\//i.test(String(l).trim()); }
  function gorselli(g) { return gecerliLink(g) || (g && /^\//.test(g)); }

  function gorselHTML(u, klas) {
    if (gorselli(u.gorsel)) {
      return `<div class="${klas}"><img src="${esc(u.gorsel)}" alt="${esc(u.ad)}" loading="lazy" /></div>`;
    }
    return `<div class="${klas} bos"><span>${esc(u.ikon || "✨")}</span></div>`;
  }

  /* ---------- üst not + geri butonu ---------- */
  function ustNot(metin) { const n = $(".mg-ust-not"); if (n) n.textContent = metin; }
  function geriButon() {
    let g = $("#mg-geri");
    if (!g) {
      g = document.createElement("button");
      g.id = "mg-geri"; g.type = "button"; g.className = "mg-geri";
      g.textContent = "← Bölümlere Dön";
      g.addEventListener("click", () => { aktifKat = null; cizKategoriler(); });
      const liste = $("#mg-liste"); const grid = $("#mg-grid");
      if (liste && grid) liste.insertBefore(g, grid);
    }
    return g;
  }
  function geriGoster(goster) { const g = geriButon(); g.style.display = goster ? "block" : "none"; }

  /* ---------- 1. KATMAN: 3 bölüm ---------- */
  function cizKategoriler() {
    const grid = $("#mg-grid"); if (!grid) return;
    aktifKat = null;
    geriGoster(false);
    ustNot("Spiritüel yolculuğuna eşlik edecek 3 özel bölüm. 🛍️");
    grid.className = "mg-grid mg-grid-kat";
    grid.innerHTML = "";
    KATEGORILER.forEach(k => {
      const kart = document.createElement("button");
      kart.type = "button";
      kart.className = "mg-kat-kart";
      const adet = k.urunler.length;
      kart.innerHTML = `
        ${gorselHTML(k, "mg-kat-gorsel")}
        <div class="mg-kat-ic">
          <div class="mg-kat-ad">${esc(k.ikon)} ${esc(k.ad)}</div>
          <div class="mg-kat-aciklama">${esc(k.aciklama)}</div>
          <span class="mg-kat-ziyaret">Ziyaret Et →</span>
        </div>`;
      kart.addEventListener("click", () => { aktifKat = k; cizUrunler(k); });
      grid.appendChild(kart);
    });
  }

  /* ---------- 2. KATMAN: bir bölümün ürünleri ---------- */
  function cizUrunler(k) {
    const grid = $("#mg-grid"); if (!grid) return;
    geriGoster(true);
    ustNot(k.ikon + " " + k.ad);
    grid.innerHTML = "";
    if (!k.urunler.length) {
      grid.className = "mg-grid mg-grid-bos";
      grid.innerHTML = `<div class="mg-bos-durum"><div class="mg-bos-amblem">${esc(k.ikon)}</div><p>Bu bölüm çok yakında ürünlerle dolacak ✨</p></div>`;
      return;
    }
    grid.className = "mg-grid";
    k.urunler.forEach(u => {
      const kart = document.createElement("div");
      kart.className = "mg-kart sade";
      const satista = gecerliLink(u.link);
      const adBasi = gorselli(u.gorsel) ? "" : esc(u.ikon) + " ";
      const fiyatHTML = u.fiyat ? `<div class="mg-kart-fiyat">${esc(u.fiyat)}</div>` : "";
      kart.innerHTML = `
        ${gorselHTML(u, "mg-kart-gorsel")}
        <div class="mg-kart-ad">${adBasi}${esc(u.ad)}</div>
        <div class="mg-kart-aciklama">${esc(u.aciklama)}</div>
        ${fiyatHTML}
        <button class="mg-satinal${satista ? "" : " yakinda"}" type="button">${satista ? "Satın Al ✦" : "Çok Yakında"}</button>`;
      kart.querySelector(".mg-satinal").addEventListener("click", () => satinAl(u));
      grid.appendChild(kart);
    });
  }

  // "Satın Al": link varsa güvenli dış sayfa (Shopier), yoksa "Çok Yakında"
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
    const detay = $("#mg-detay"); if (detay) detay.hidden = true;
    const liste = $("#mg-liste"); if (liste) liste.hidden = false;
    cizKategoriler();                        // her açılışta bölümlerden başla
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

  return { ac, kapat, kategoriler: () => KATEGORILER };
})();
