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
      id: "rituel-araclar", ad: "Ritüel & Araçlar", ikon: "✨", gorsel: "/urunler/rituel-araclar-kapak.png",
      aciklama: "Doğal taşlar ve ritüellerine eşlik edecek özel parçalar.",
      urunler: [
        {
          id: "tas-delphinula-ametist", ad: "Delphinula Ametist Kolye", ikon: "🐚",
          aciklama: "Eşsiz Delphinula (Angaria Delphinus) deniz kabuğu ucu, doğal Ametist taş kırıklarıyla buluştu. Ametist; stresi yatıştırır, sezgiyi ve ruhsal dengeyi güçlendirir; sedefli kabuk ise denizin dinginliğini taşır. Her biri doğal taş olduğundan kendine özgüdür — el yapımı, sevgiyle hazırlandı. 🐚",
          gorsel: "/urunler/delphinula-ametist-kolye.jpg",
          gorseller: ["/urunler/delphinula-ametist-kolye.jpg", "/urunler/delphinula-ametist-boyunda.jpg"],
          fiyat: "904,99 TL",
          link: "https://www.shopier.com/dreamyhandmade/50249821"
        },
        {
          id: "tas-dendritli-opal", ad: "Dendiritli Opal", ikon: "🌿",
          aciklama: "Nadir ve değerli Dendiritli Opal — beyaz opal zemin üzerinde ağaç dallarını andıran doğal desenler; her biri tek. Büyüme, bereket ve doğayla bağ taşı olarak bilinir; sabrı, kök salmayı ve içsel dinginliği destekler. Doğanın el yazısını avucunda taşı. 🌿",
          gorsel: "/urunler/dendritli-opal.jpg", fiyat: "304,99 TL",
          link: "https://www.shopier.com/dreamyhandmade/50076805"
        },
        {
          id: "tas-aventurin", ad: "Aventurin Kalp Kolye", ikon: "💚",
          aciklama: "Kalp formunda, doğal yeşil Aventurin taşından kolye. Aventurin; şans, bolluk ve neşe taşı olarak bilinir — kalbi korur, stresi azaltır, yeni fırsatlara açar. Şansını kalbinde taşı. Çelik zincirli. 💚",
          gorsel: "/urunler/aventurin-kalp-kolye.jpg", fiyat: "304,99 TL",
          link: "https://www.shopier.com/dreamyhandmade/50075720"
        },
        {
          id: "tas-akik-yaprak", ad: "Yaprak Form Akik Kolye", ikon: "🍃",
          aciklama: "Yaprak formunda, doğal Akik taşından zarif kolye. Akik; ruhsal ve bedensel dengeyi destekleyen, stresi azaltan, özgüveni artıran ve negatif enerjiden koruyan bir taş olarak bilinir. Doğallığı boynunda taşı. Çelik zincirli. 🍃",
          gorsel: "/urunler/akik-yaprak-kolye.jpg", fiyat: "304,99 TL",
          link: "https://www.shopier.com/dreamyhandmade/50075441"
        },
        {
          id: "tas-ametist", ad: "Ametist Tel Sarım Kolye", ikon: "💜",
          aciklama: "El işçiliğiyle tel sarım yapılmış, gümüş kaplama doğal Ametist kolye. Stresi yatıştırır, zihni sakinleştirir; ruhsal dengeyi ve sezgiyi güçlendirir. Doğanın enerjisini yanında taşı. Çelik zincirli. 💜",
          gorsel: "/urunler/ametist-kolye.jpg", fiyat: "304,99 TL",
          link: "https://www.shopier.com/dreamyhandmade/50073853"
        },
        {
          id: "tas-sodalit", ad: "Kalp Form Sodalit Kolye", ikon: "💙",
          aciklama: "Kalp formunda, doğal Sodalit taşından el yapımı kolye. Zihinsel netlik ve sakinlik taşı; mantıklı düşünmeyi ve odaklanmayı destekler, iletişimi güçlendirir, kaygıyı hafifletir. Kalbinin üzerinde huzur. Çelik zincirli. 💙",
          gorsel: "/urunler/sodalit-kalp-kolye.jpg", fiyat: "304,99 TL",
          link: "https://www.shopier.com/dreamyhandmade/50075370"
        },
        {
          id: "tas-akik", ad: "Akik (Agat) Taşı", ikon: "💎",
          aciklama: "Her biri benzersiz, doğal ağaç-kesiti dokulu akik taşı. Topraklar, dengeler; iç huzuru ve güven duygusunu güçlendirir, yaşam alanına sakin bir enerji katar. 🌿",
          gorsel: "/urunler/akik-tasi.jpg", fiyat: "304,99 TL",
          link: "https://www.shopier.com/dreamyhandmade/50076643?utm_id=97757_v0_s00_e0_tv0"
        }
      ]
    }
  ];

  let aktifKat = null;   // null → bölümler görünür; kategori → içerik görünür
  let altKat = null;     // Ritüel & Araçlar içinde: null → gruplar, "ritueller"|"taslar" → ürünler

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function gecerliLink(l) { return typeof l === "string" && /^https?:\/\//i.test(String(l).trim()); }
  function gorselli(g) { return gecerliLink(g) || (g && /^\//.test(g)); }

  function gorselHTML(u, klas) {
    const liste = Array.isArray(u.gorseller) ? u.gorseller.filter(gorselli) : (gorselli(u.gorsel) ? [u.gorsel] : []);
    if (liste.length) {
      const cok = liste.length > 1 ? " coklu" : "";
      const imgs = liste.map(g => `<img src="${esc(g)}" alt="${esc(u.ad)}" loading="lazy" />`).join("");
      return `<div class="${klas}${cok}">${imgs}</div>`;
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
      const liste = $("#mg-liste"); const grid = $("#mg-grid");
      if (liste && grid) liste.insertBefore(g, grid);
    }
    return g;
  }
  function geriGizle() { const g = geriButon(); g.style.display = "none"; }
  function geriAyar(metin, fn) { const g = geriButon(); g.textContent = metin; g.onclick = fn; g.style.display = "block"; }

  /* ---------- 1. KATMAN: 3 bölüm ---------- */
  function cizKategoriler() {
    const grid = $("#mg-grid"); if (!grid) return;
    aktifKat = null; altKat = null;
    geriGizle();
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

  /* ---------- 2. KATMAN: bir bölüm ---------- */
  function cizUrunler(k) {
    // Ritüel & Araçlar → önce iki grup (Ritüeller / Taşlar); diğerleri → düz ürünler
    if (k.id === "rituel-araclar") { altKat = null; cizAltGruplar(k); return; }
    cizUrunlerDuz(k);
  }

  /* ---------- 2b. KATMAN: Ritüel & Araçlar iki grubu ---------- */
  function cizAltGruplar(k) {
    const grid = $("#mg-grid"); if (!grid) return;
    geriAyar("← Bölümlere Dön", () => { aktifKat = null; altKat = null; cizKategoriler(); });
    ustNot(k.ikon + " " + k.ad);
    grid.className = "mg-grid mg-grid-kat";
    grid.innerHTML = "";
    const gruplar = [
      { id: "ritueller", ad: "Spiritüel Ritüeller", ikon: "🌙", aciklama: "Aylık dolunay ve yeni ay ritüel rehberleri — dijital, kalıcı erişim." },
      { id: "taslar", ad: "Doğal Taşlar", ikon: "💎", aciklama: "El yapımı doğal taş kolyeler ve özel parçalar." }
    ];
    gruplar.forEach(gr => {
      const kart = document.createElement("button");
      kart.type = "button"; kart.className = "mg-kat-kart mg-alt-kart";
      kart.innerHTML = `
        <div class="mg-kat-gorsel bos"><span>${gr.ikon}</span></div>
        <div class="mg-kat-ic">
          <div class="mg-kat-ad">${esc(gr.ad)}</div>
          <div class="mg-kat-aciklama">${esc(gr.aciklama)}</div>
          <span class="mg-kat-ziyaret">Görüntüle →</span>
        </div>`;
      kart.addEventListener("click", () => { altKat = gr.id; gr.id === "ritueller" ? cizRituelUrunler(k) : cizTasUrunler(k); });
      grid.appendChild(kart);
    });
  }

  /* ---------- 3. KATMAN: Spiritüel Ritüeller (dijital) ---------- */
  function cizRituelUrunler(k) {
    const grid = $("#mg-grid"); if (!grid) return;
    geriAyar("← Ritüel & Araçlar", () => { altKat = null; cizAltGruplar(k); });
    ustNot("🌙 Spiritüel Ritüeller");
    grid.className = "mg-grid";
    grid.innerHTML = "";
    if (window.Kutuphane && Kutuphane.magazaKartlari) Kutuphane.magazaKartlari(grid);
    if (!grid.children.length) {
      grid.className = "mg-grid mg-grid-bos";
      grid.innerHTML = `<div class="mg-bos-durum"><div class="mg-bos-amblem">🌙</div><p>Ritüel rehberleri çok yakında ✨</p></div>`;
    }
  }

  /* ---------- 3. KATMAN: Doğal Taşlar ---------- */
  function cizTasUrunler(k) {
    const grid = $("#mg-grid"); if (!grid) return;
    geriAyar("← Ritüel & Araçlar", () => { altKat = null; cizAltGruplar(k); });
    ustNot("💎 Doğal Taşlar");
    grid.innerHTML = "";
    if (!k.urunler.length) {
      grid.className = "mg-grid mg-grid-bos";
      grid.innerHTML = `<div class="mg-bos-durum"><div class="mg-bos-amblem">💎</div><p>Taşlar çok yakında ✨</p></div>`;
      return;
    }
    grid.className = "mg-grid";
    k.urunler.forEach(u => tasKartCiz(grid, u));
  }

  /* ---------- düz ürün listesi (Işık Kartları/Mumları) ---------- */
  function cizUrunlerDuz(k) {
    const grid = $("#mg-grid"); if (!grid) return;
    geriAyar("← Bölümlere Dön", () => { aktifKat = null; altKat = null; cizKategoriler(); });
    ustNot(k.ikon + " " + k.ad);
    grid.className = "mg-grid";
    grid.innerHTML = "";
    // Işık Mumları / Işık Kartları → self-servis DB ürünleri (boşsa sipariş kartı)
    if ((k.id === "isik-mumlari" || k.id === "isik-kartlari") && window.MagazaUrun && MagazaUrun.magazaKartlari) {
      MagazaUrun.magazaKartlari(grid, k.id);
      return;
    }
    // Koddaki sabit ürünler (varsa)
    if (k.urunler.length) { k.urunler.forEach(u => tasKartCiz(grid, u)); return; }
    // Boş bölüm
    grid.className = "mg-grid mg-grid-bos";
    grid.innerHTML = `<div class="mg-bos-durum"><div class="mg-bos-amblem">${esc(k.ikon)}</div><p>Bu bölüm çok yakında ürünlerle dolacak ✨</p></div>`;
  }

  /* ---------- tek ürün (taş/genel) kartı ---------- */
  function tasKartCiz(grid, u0) {
    // Taş linki yöneticinin ayarladığı değerle (varsa) değiştirilir
    const efektifLink = (u0.id && window.SiteAyar && SiteAyar.get) ? SiteAyar.get("tas_link_" + u0.id, u0.link) : u0.link;
    const u = Object.assign({}, u0, { link: efektifLink });
    const kart = document.createElement("div");
    kart.className = "mg-kart sade";
    const satista = gecerliLink(u.link);
    const tukendi = u.stok === false;              // stok bitti → sipariş üzerine (WhatsApp)
    const adBasi = gorselli(u.gorsel) ? "" : esc(u.ikon) + " ";
    const fiyatHTML = u.fiyat ? `<div class="mg-kart-fiyat">${esc(u.fiyat)}</div>` : "";
    let btnCls = "mg-satinal", btnTxt = "Satın Al ✦";
    if (tukendi) { btnCls += " siparis"; btnTxt = "Sipariş Oluştur ✦"; }   // her zaman sipariş verilebilir
    else if (!satista) { btnCls += " yakinda"; btnTxt = "Çok Yakında"; }
    const siparisNot = tukendi ? `<div class="mg-siparis-not">🕊️ El yapımı · senin için özel hazırlanır</div>` : "";
    kart.innerHTML = `
      ${gorselHTML(u, "mg-kart-gorsel")}
      <div class="mg-kart-ad">${adBasi}${esc(u.ad)}</div>
      <div class="mg-kart-aciklama">${esc(u.aciklama)}</div>
      ${fiyatHTML}
      ${siparisNot}
      <button class="${btnCls}" type="button">${btnTxt}</button>`;
    kart.querySelector(".mg-satinal").addEventListener("click", () => satinAl(u));
    grid.appendChild(kart);
  }

  // "Satın Al": link varsa güvenli dış sayfa (Shopier), yoksa "Çok Yakında"
  // Stok bitince "Sipariş Oluştur" → WhatsApp'ta ürün adı yazılı özel sipariş mesajı
  const WA_SIPARIS = "905345276192";
  function siparisWA(u) {
    const mesaj = `Merhaba, "${u.ad}" için özel sipariş vermek istiyorum ✨`;
    return `https://wa.me/${WA_SIPARIS}?text=${encodeURIComponent(mesaj)}`;
  }
  function satinAl(u) {
    if (u.stok === false) { window.open(siparisWA(u), "_blank", "noopener,noreferrer"); return; }
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
  function ac(katId, altKatId) {
    const ov = $("#magaza-overlay"); if (!ov) return;
    const detay = $("#mg-detay"); if (detay) detay.hidden = true;
    const liste = $("#mg-liste"); if (liste) liste.hidden = false;
    if (window.Kutuphane && Kutuphane.yenile) Kutuphane.yenile();   // dijital ürün yetkilerini tazele
    cizKategoriler();                        // her açılışta bölümlerden başla
    // İstenirse doğrudan bir bölüme/gruba in (ör. takvimden "rituel-araclar","ritueller")
    const hedef = typeof katId === "string" ? KATEGORILER.find(k => k.id === katId) : null;
    if (hedef) {
      aktifKat = hedef;
      if (hedef.id === "rituel-araclar" && (altKatId === "ritueller" || altKatId === "taslar")) {
        altKat = altKatId;
        altKatId === "ritueller" ? cizRituelUrunler(hedef) : cizTasUrunler(hedef);
      } else {
        cizUrunler(hedef);
      }
    }
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
    const acBtn = $("#magaza-ac"); if (acBtn) acBtn.addEventListener("click", () => ac());
    const ikBtn = $("#ik-tanitim-ac"); if (ikBtn) ikBtn.addEventListener("click", () => ac("isik-kartlari"));
    const kapatBtn = $("#magaza-kapat"); if (kapatBtn) kapatBtn.addEventListener("click", kapat);
    const ov = $("#magaza-overlay"); if (ov) ov.addEventListener("click", e => { if (e.target === ov) kapat(); });
  }
  document.addEventListener("DOMContentLoaded", baglan);

  return { ac, kapat, kategoriler: () => KATEGORILER };
})();
