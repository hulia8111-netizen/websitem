/* ============================================================
   magaza.js — "Mağazam ✨" (Supabase yönetimli dış mağaza) 🛍️
   ------------------------------------------------------------
   • Ürünler Supabase'deki "magaza_urunler" tablosundan çekilir
     (anon key ile herkese açık okuma). Panelden ürün eklenince
     UYGULAMA GÜNCELLEMESİ GEREKMEZ — anında görünür.
   • Kategoriler: Işık Kartları / Mumlar & Ritüel / Sesli İçerikler /
     Etkinlikler & Eğitimler.
   • Kart → detay sayfası (büyük görsel, açıklama, fiyat) → "Satın Al"
     güvenli DIŞ mağazada açılır (Shopier/iyzico/site). Play uyumlu.
   • Hız: önce localStorage önbelleğinden anında çizer, arka planda
     Supabase'den tazeler. Supabase boş/erişilemezse yerel örneklerle
     çalışır (asla boş ekran olmaz).
   • Gelecek hazırlığı: ürünün "tip" alanı ileride "link" yerine
     uygulama-içi satın almaya ("iap") geçişe izin verecek şekilde okunur.
   Global: window.Magaza
   ============================================================ */

const Magaza = window.Magaza = (() => {
  const $ = sel => document.querySelector(sel);
  const CACHE = "magaza-urunler-cache";

  const KATEGORILER = [
    { id: "isik-kartlari", ikon: "🃏", ad: "Işık Kartları" },
    { id: "mumlar",        ikon: "🕯️", ad: "Mumlar & Ritüel" },
    { id: "sesli-icerik",  ikon: "🎧", ad: "Sesli İçerikler" },
    { id: "etkinlik",      ikon: "🎓", ad: "Etkinlik & Eğitim" }
  ];

  // Supabase boş/erişilemezse gösterilecek yerel örnekler (panelden gerçeklerini ekleyince devre dışı kalır)
  const VARSAYILAN = [
    { kategori: "isik-kartlari", ad: "Melek & Tarot Kartı Destesi", aciklama: "Günün rehberliği için ilham veren kart destesi.", gorsel: "", fiyat: "", link: "" },
    { kategori: "isik-kartlari", ad: "Işık Mesajı Kartları", aciklama: "Her çekilişte içsel bir mesaj sunan özel kartlar.", gorsel: "", fiyat: "", link: "" },
    { kategori: "mumlar", ad: "Şifa Mumu", aciklama: "Meditasyon ve ritüellerine eşlik eden doğal soya mumu.", gorsel: "", fiyat: "", link: "" },
    { kategori: "mumlar", ad: "Tütsü & Adaçayı Seti", aciklama: "Alanını arındırmak için doğal tütsü ve adaçayı.", gorsel: "", fiyat: "", link: "" },
    { kategori: "mumlar", ad: "Doğal Kristal Seti", aciklama: "Niyet ve denge için özenle seçilmiş şifa taşları.", gorsel: "", fiyat: "", link: "" },
    { kategori: "sesli-icerik", ad: "Rehberli Meditasyon Seti", aciklama: "Derin gevşeme için sesli meditasyon koleksiyonu.", gorsel: "", fiyat: "", link: "" },
    { kategori: "sesli-icerik", ad: "Uyku Hikâyeleri", aciklama: "Huzurlu bir uykuya geçiş için sesli anlatılar.", gorsel: "", fiyat: "", link: "" },
    { kategori: "etkinlik", ad: "Online Farkındalık Atölyesi", aciklama: "Canlı katılımlı farkındalık ve nefes atölyesi.", gorsel: "", fiyat: "", link: "" },
    { kategori: "etkinlik", ad: "Birebir Koçluk Seansı", aciklama: "Kişiye özel spiritüel rehberlik görüşmesi.", gorsel: "", fiyat: "", link: "" }
  ];

  let urunler = [];
  let filtre = "hepsi";

  /* "Işık Kartları" ürününe özel premium "Hakkında" içeriği.
     Mağazada bu ürüne dokununca detay ekranı bu metni gösterir. */
  const ISIK_HAKKINDA = {
    baslik: "IŞIK KARTLARI",
    alt: "Sezgi · Farkındalık · Dönüşüm",
    paragraflar: [
      "Bu kartlar bir oyun değil.\nBir fal değil.\nBir tesadüf hiç değil…",
      "Elindeki bu deste, bilinçle evren arasındaki bir köprüdür. Her kart, içinde zaten var olan bir gerçeği sana hatırlatmak için karşına çıkar.",
      "Çünkü senin hayatında değişim; dışarıdan gelen bir mucizeyle değil, içeride verilen bir izinle başlar.",
      "Işık Kartları; sezgi, cesaret, denge, para, aile, sınırlar, şifa, bırakış, kabul ve yükseliş gibi hayatının tüm katmanlarına dokunan bilinç anahtarlarıdır.",
      "Bu kartlar sana “Ne olacak?” demek için değil, “Neye hazırsın?” sorusunu sormak için vardır.",
      "Bu destede seçtiğin hiçbir kart rastgele değildir. Her seçim, o anki enerjinin bir yansımasıdır.",
      { metin: "Kartı sen seçmezsin, kart seni bulur.", vurgu: true },
      "Bu kartları açarken tek bir şeye ihtiyacın var: Niyet.\nGerisi zaten senin içinde…"
    ]
  };

  // Listeye "Işık Kartları" Hakkında içeriğini bağla; yoksa yerleşik ürünü ekle.
  function ekleHakkinda(liste) {
    const l = Array.isArray(liste) ? liste.slice() : [];
    let bulundu = false;
    l.forEach(u => {
      if (u && typeof u.ad === "string" && u.ad.trim().toLocaleLowerCase("tr") === "ışık kartları") {
        u._hakkinda = ISIK_HAKKINDA; bulundu = true;
      }
    });
    if (!bulundu) {
      l.unshift({ kategori: "isik-kartlari", ad: "Işık Kartları", aciklama: "Sezgi, farkındalık ve dönüşüm için ilham ve bilinç kartları.", gorsel: "", fiyat: "", link: "", _hakkinda: ISIK_HAKKINDA });
    }
    return l;
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function gecerliLink(l) { return typeof l === "string" && /^https?:\/\//i.test(String(l).trim()); }
  function katById(id) { return KATEGORILER.find(k => k.id === id); }
  function katIkon(id) { const k = katById(id); return k ? k.ikon : "✨"; }

  /* ---------- Supabase'den ürünleri çek (herkese açık okuma) ---------- */
  async function supabasedenGetir() {
    try {
      if (typeof SUPABASE_URL === "undefined" || !SUPABASE_URL || typeof SUPABASE_ANON === "undefined" || !SUPABASE_ANON) return null;
      const url = SUPABASE_URL.replace(/\/$/, "") + "/rest/v1/magaza_urunler?aktif=eq.true&order=sira.asc,id.asc&select=*";
      const r = await fetch(url, { headers: { apikey: SUPABASE_ANON, Authorization: "Bearer " + SUPABASE_ANON } });
      if (!r.ok) return null;
      const veri = await r.json();
      return Array.isArray(veri) ? veri : null;
    } catch (e) { return null; }
  }
  function cacheOku() { try { return JSON.parse(localStorage.getItem(CACHE) || "null"); } catch (e) { return null; } }
  function cacheYaz(v) { try { localStorage.setItem(CACHE, JSON.stringify(v)); } catch (e) {} }

  async function yukle(yenidenCiz) {
    // 1) anında: cache veya varsayılan
    const c = cacheOku();
    urunler = ekleHakkinda((c && c.length) ? c : VARSAYILAN.slice());
    if (yenidenCiz) ciz();
    // 2) arka planda: Supabase'den tazele
    const taze = await supabasedenGetir();
    if (taze && taze.length) { cacheYaz(taze); urunler = ekleHakkinda(taze); ciz(); }
    else if (taze && taze.length === 0 && !(c && c.length)) { /* tablo boş + cache yok → varsayılan kalır */ }
  }

  /* ---------- kategori çipleri ---------- */
  function cizChips() {
    const kutu = $("#mg-kat-chips"); if (!kutu) return;
    kutu.innerHTML = "";
    const ekle = (id, etiket) => {
      const b = document.createElement("button");
      b.className = "mg-kat" + (filtre === id ? " aktif" : "");
      b.type = "button"; b.textContent = etiket;
      b.addEventListener("click", () => { filtre = id; cizChips(); cizGrid(); });
      kutu.appendChild(b);
    };
    ekle("hepsi", "Tümü");
    KATEGORILER.forEach(k => {
      if (urunler.some(u => u.kategori === k.id)) ekle(k.id, k.ikon + " " + k.ad);
    });
  }

  /* ---------- ürün grid ---------- */
  function gorselHTML(u, buyuk) {
    const sinif = buyuk ? "mgd-gorsel" : "mg-kart-gorsel";
    if (gecerliLink(u.gorsel) || (u.gorsel && /^\//.test(u.gorsel))) {
      return `<div class="${sinif}"><img src="${esc(u.gorsel)}" alt="${esc(u.ad)}" loading="lazy" /></div>`;
    }
    return `<div class="${sinif} bos"><span>${esc(katIkon(u.kategori))}</span></div>`;
  }
  function cizGrid() {
    const grid = $("#mg-grid"); if (!grid) return;
    const liste = filtre === "hepsi" ? urunler : urunler.filter(u => u.kategori === filtre);
    grid.innerHTML = "";
    if (!liste.length) { $("#mg-durum").textContent = "Bu kategoride henüz ürün yok."; return; }
    $("#mg-durum").textContent = "";
    liste.forEach((u, i) => {
      const kart = document.createElement("button");
      kart.className = "mg-kart"; kart.type = "button";
      kart.innerHTML = `
        ${gorselHTML(u, false)}
        <div class="mg-kart-ad">${esc(u.ad)}</div>
        <div class="mg-kart-aciklama">${esc(u.aciklama)}</div>
        <span class="mg-incele">İncele ✦</span>`;
      kart.addEventListener("click", () => detayAc(u));
      grid.appendChild(kart);
    });
  }

  /* ---------- ürün detay ---------- */
  function detayAc(u) {
    const d = $("#mg-detay"); if (!d) return;
    const fiyat = (u.fiyat && String(u.fiyat).trim()) ? `<div class="mgd-fiyat">${esc(u.fiyat)}</div>` : "";
    // Gelecek hazırlığı: u.tip === "iap" olduğunda burada uygulama-içi satın alma akışı devreye alınabilir.
    const aksiyon = gecerliLink(u.link)
      ? `<a class="mgd-satinal" href="${esc(u.link)}" target="_blank" rel="noopener noreferrer">Satın Al ✦</a>`
      : `<span class="mgd-satinal yakinda" aria-disabled="true">Yakında ✨</span>`;
    if (u._hakkinda) {
      // Premium "Işık Kartları Hakkında" detayı
      const h = u._hakkinda;
      const paras = h.paragraflar.map(p => (typeof p === "object" && p)
        ? `<p class="mgd-hk-vurgu">${esc(p.metin)}</p>`
        : `<p>${esc(p).replace(/\n/g, "<br/>")}</p>`
      ).join("");
      d.innerHTML = `
        <button class="mgd-geri" type="button">‹ Geri</button>
        ${gecerliLink(u.gorsel) || (u.gorsel && /^\//.test(u.gorsel)) ? gorselHTML(u, true) : `<div class="mgd-amblem" aria-hidden="true">✦</div>`}
        <h3 class="mgd-hk-baslik">${esc(h.baslik)}</h3>
        <p class="mgd-hk-alt">${esc(h.alt)}</p>
        <div class="mgd-hk-cizgi"></div>
        <div class="mgd-hk-metin">${paras}</div>
        ${fiyat}
        ${aksiyon}
        <p class="muted small mgd-not">Satın alma, güvenli dış mağazada tamamlanır.</p>`;
    } else {
      d.innerHTML = `
        <button class="mgd-geri" type="button">‹ Geri</button>
        ${gorselHTML(u, true)}
        <div class="mgd-kat">${esc(katIkon(u.kategori))} ${esc((katById(u.kategori) || {}).ad || "")}</div>
        <h3 class="mgd-ad">${esc(u.ad)}</h3>
        ${fiyat}
        <p class="mgd-aciklama">${esc(u.aciklama)}</p>
        ${aksiyon}
        <p class="muted small mgd-not">Satın alma, güvenli dış mağazada tamamlanır.</p>`;
    }
    d.querySelector(".mgd-geri").addEventListener("click", detayKapat);
    $("#mg-liste").hidden = true;
    d.hidden = false;
    const ic = $(".mg-ic"); if (ic) ic.scrollTop = 0;
  }
  function detayKapat() { $("#mg-detay").hidden = true; $("#mg-liste").hidden = false; }

  function ciz() { cizChips(); cizGrid(); }

  /* ---------- overlay aç/kapat ---------- */
  function ac() {
    const ov = $("#magaza-overlay"); if (!ov) return;
    detayKapat();
    yukle(true);
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

  return { ac, kapat, yenile: () => yukle(true), kategoriler: () => KATEGORILER };
})();
