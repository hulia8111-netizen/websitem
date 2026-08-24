/* ============================================================
   kutuphane.js — Dijital Ürün Kütüphanesi 📚
   ------------------------------------------------------------
   Aylık spiritüel ritüel PDF'i gibi dijital ürünler. Satın alan
   kullanıcının hesabına KALICI erişim tanınır (Supabase
   kullanici_kutuphane). İçerik özel depoda (bucket "ritueller")
   durur; yalnız yetkili kullanıcı görüntüler + indirir.

   Play politikası: dijital içerik satışı uygulama İÇİNDE yapılamaz.
   → Native uygulamada "Satın Al" GİZLİ; satın alma yalnız web'de.
     Uygulamada satın alınmış içerik açılıp indirilebilir.

   Erişim verme: yönetici (moderatör) 'eris-ver' Edge Function ile
   alıcının e-postasına ürünü tanımlar (manuel, ilk aşama).

   Global: window.Kutuphane
   ============================================================ */

const Kutuphane = window.Kutuphane = (() => {
  const $ = s => document.querySelector(s);

  /* ---------- KATALOG (dijital ürünler; en yeni en üstte) ---------- */
  const KATALOG = [
    {
      kod: "ritueller-2026-08",
      baslik: "Ağustos 2026 · Spiritüel Ritüeller",
      ozet: "Dolunay Bırakma Ritüeli · 28 Ağustos",
      aciklama: "Bu ayın teması: Bırakma · Arınma · Yeni alana yer açma. Dolunay bırakma ritüeli, ritüel sonrası farkındalık soruları ve yazdırılabilir “Ayın Niyeti” kartı — hepsi kalıcı olarak senin.",
      icerik: ["Aylık Spiritüel Ritüeller PDF’si", "PDF’ye kalıcı erişim", "İstediğin zaman tekrar aç & indir"],
      fiyat: "88 TL",
      tarih: "2026-08",
      dosyalar: [{ tip: "pdf", ad: "Ritüel Rehberi (PDF)", yol: "rehber.pdf" }]
    }
  ];

  /* ---------- ödeme bilgisi (web satın alma penceresi) ----------
     IBAN ve ad kullanıcı tarafından doldurulacak. */
  const ODEME = {
    iban: "TR__ ____ ____ ____ ____ ____ __",   // ← gerçek IBAN buraya
    ad: "Ad Soyad",                              // ← hesap sahibi adı
    wa: "905345276192"                            // WhatsApp (dekont + e-posta için)
  };

  const BUCKET = "ritueller";
  let sahip = new Set();   // sahip olunan urun_kod'lar
  let yuklendi = false;

  /* ---------- yardımcı ---------- */
  function sb() { try { return window.Bulut && Bulut.client ? Bulut.client() : null; } catch (e) { return null; } }
  function uid() { try { return window.Bulut && Bulut.kullaniciId ? Bulut.kullaniciId() : null; } catch (e) { return null; } }
  function girisli() { return !!uid(); }
  function benimEmail() { try { return (Bulut.durum && Bulut.durum().email) || ""; } catch (e) { return ""; } }
  function moderatorMu() { try { return !!(window.ToplulukSosyal && ToplulukSosyal.moderatorMuCached && ToplulukSosyal.moderatorMuCached()); } catch (e) { return false; } }
  function nativeMi() { return window.__ISIGINI_NATIVE === true || /\bwv\b/i.test(navigator.userAgent || ""); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  function urunBul(kod) { return KATALOG.find(u => u.kod === kod) || null; }
  function sahipMi(kod) { return sahip.has(kod); }

  /* ---------- yetkileri buluttan çek ---------- */
  async function yenile() {
    sahip = new Set();
    const c = sb();
    if (!c || !uid()) { yuklendi = true; return sahip; }
    try {
      const { data } = await c.from("kullanici_kutuphane").select("urun_kod");
      (data || []).forEach(r => sahip.add(r.urun_kod));
    } catch (e) { /* sessiz */ }
    yuklendi = true;
    kutuphaneCiz();
    return sahip;
  }

  /* ---------- dosya indir (özel depo, RLS yetkilendirir) ---------- */
  async function dosyaBlob(urun, dosya) {
    const c = sb();
    if (!c) throw new Error("Bağlantı yok");
    const yol = urun.kod + "/" + dosya.yol;
    const { data, error } = await c.storage.from(BUCKET).download(yol);
    if (error) throw error;
    return data;
  }

  /* ---------- PDF görüntüleyici overlay ---------- */
  function izleyici() {
    let ov = $("#ktp-izleyici");
    if (!ov) {
      ov = document.createElement("div");
      ov.id = "ktp-izleyici"; ov.className = "ktp-izleyici"; ov.hidden = true;
      ov.innerHTML = `
        <div class="ktp-iz-ust">
          <button class="ktp-iz-geri" type="button" aria-label="Kapat">‹ Kapat</button>
          <span class="ktp-iz-baslik"></span>
          <button class="ktp-iz-indir" type="button">⬇ İndir</button>
        </div>
        <div class="ktp-iz-govde"><div class="ktp-iz-yukleme">Açılıyor… 🌙</div></div>`;
      document.body.appendChild(ov);
      ov.querySelector(".ktp-iz-geri").addEventListener("click", izleyiciKapat);
    }
    return ov;
  }
  function izleyiciKapat() {
    const ov = $("#ktp-izleyici"); if (!ov) return;
    const f = ov.querySelector("iframe");
    if (f && f.src.startsWith("blob:")) { try { URL.revokeObjectURL(f.src); } catch (e) {} }
    ov.classList.remove("gor");
    setTimeout(() => { ov.hidden = true; ov.querySelector(".ktp-iz-govde").innerHTML = `<div class="ktp-iz-yukleme">Açılıyor… 🌙</div>`; document.body.classList.remove("ktp-izleyici-acik"); }, 250);
  }
  function indirTetikle(blob, adSoyad) {
    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = adSoyad;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch (e) {}
  }

  async function ac(urun, dosya) {
    urun = typeof urun === "string" ? urunBul(urun) : urun;
    if (!urun) return;
    dosya = dosya || (urun.dosyalar && urun.dosyalar[0]);
    if (!dosya) return;
    if (!girisli()) { girisUyar(); return; }

    const ov = izleyici();
    ov.querySelector(".ktp-iz-baslik").textContent = urun.baslik;
    ov.hidden = false; requestAnimationFrame(() => ov.classList.add("gor"));
    document.body.classList.add("ktp-izleyici-acik");
    const govde = ov.querySelector(".ktp-iz-govde");
    govde.innerHTML = `<div class="ktp-iz-yukleme">Açılıyor… 🌙</div>`;

    try {
      const blob = await dosyaBlob(urun, dosya);
      const indirAd = urun.kod + "-" + dosya.yol;
      const url = URL.createObjectURL(blob);
      govde.innerHTML = `<iframe src="${url}#toolbar=1" title="${esc(urun.baslik)}"></iframe>`;
      const indirBtn = ov.querySelector(".ktp-iz-indir");
      indirBtn.onclick = () => indirTetikle(blob, indirAd);
    } catch (e) {
      govde.innerHTML = `<div class="ktp-iz-hata">İçerik açılamadı 😔<br><span class="muted small">${esc((e && e.message) || "Erişim yok")}</span><br><br>Bu ürüne erişimin yoksa satın alman gerekebilir; eğer aldıysan biraz sonra tekrar dene ya da bize yaz.</div>`;
    }
  }

  /* ---------- giriş uyarısı ---------- */
  function girisUyar() {
    if (window.Magaza && Magaza.kapat) Magaza.kapat();
    const gid = $('.nav-btn[data-view="profil"]'); if (gid) gid.click();
    setTimeout(() => { const h = $("#hesap"); if (h) h.scrollIntoView({ block: "center" }); }, 300);
  }

  /* ---------- satın alma penceresi (yalnız web) ---------- */
  function satinAlPencere(urun) {
    let p = $("#ktp-satinal");
    if (!p) {
      p = document.createElement("div");
      p.id = "ktp-satinal"; p.className = "ktp-modal"; p.hidden = true;
      document.body.appendChild(p);
      p.addEventListener("click", e => { if (e.target === p || e.target.classList.contains("ktp-modal-kapat")) { p.classList.remove("gor"); setTimeout(() => p.hidden = true, 220); } });
    }
    const waMesaj = encodeURIComponent(`Merhaba, "${urun.baslik}" (${urun.fiyat}) satın almak istiyorum. Havaleyi yaptım ✨ Uygulama e-postam: `);
    const waLink = `https://wa.me/${ODEME.wa}?text=${waMesaj}`;
    p.innerHTML = `
      <div class="ktp-modal-ic">
        <button class="ktp-modal-kapat" aria-label="Kapat">✕</button>
        <div class="ktp-sa-amblem">🌙</div>
        <h3 class="ktp-sa-baslik">${esc(urun.baslik)}</h3>
        <div class="ktp-sa-fiyat">${esc(urun.fiyat)}</div>
        <p class="ktp-sa-not">Bu içerik satın aldığında hesabına <strong>kalıcı</strong> olarak eklenir; istediğin zaman açar ve indirirsin. 🌸</p>
        <div class="ktp-sa-adimlar">
          <div class="ktp-sa-adim"><span>1</span> Aşağıdaki IBAN'a <strong>${esc(urun.fiyat)}</strong> havale/EFT yap.</div>
          <div class="ktp-iban">
            <div class="ktp-iban-ad">${esc(ODEME.ad)}</div>
            <div class="ktp-iban-no">${esc(ODEME.iban)}</div>
          </div>
          <div class="ktp-sa-adim"><span>2</span> Dekontu + <strong>uygulama e-postanı</strong> WhatsApp'tan bize gönder.</div>
          <div class="ktp-sa-adim"><span>3</span> Erişimin açılır; içerik <strong>Kütüphanem 📚</strong> bölümüne düşer.</div>
        </div>
        <a class="ktp-sa-wa" href="${waLink}" target="_blank" rel="noopener noreferrer">💬 WhatsApp'tan Bilgi Gönder</a>
        <p class="ktp-sa-mini muted small">Ödeme ve erişim güvenli şekilde elle onaylanır. Sorun olursa bize yazman yeterli.</p>
      </div>`;
    p.hidden = false; requestAnimationFrame(() => p.classList.add("gor"));
  }

  /* ---------- native (Play) bilgi penceresi ---------- */
  function webdenEdinPencere(urun) {
    let p = $("#ktp-webden");
    if (!p) {
      p = document.createElement("div");
      p.id = "ktp-webden"; p.className = "ktp-modal"; p.hidden = true;
      document.body.appendChild(p);
      p.addEventListener("click", e => { if (e.target === p || e.target.classList.contains("ktp-modal-kapat")) { p.classList.remove("gor"); setTimeout(() => p.hidden = true, 220); } });
    }
    p.innerHTML = `
      <div class="ktp-modal-ic">
        <button class="ktp-modal-kapat" aria-label="Kapat">✕</button>
        <div class="ktp-sa-amblem">🌐</div>
        <h3 class="ktp-sa-baslik">${esc(urun.baslik)}</h3>
        <div class="ktp-sa-fiyat">${esc(urun.fiyat)}</div>
        <p class="ktp-sa-not">Bu dijital içeriği <strong>web sitemizden</strong> edinebilirsin. Satın aldıktan sonra <strong>aynı hesapla</strong> giriş yaptığında burada, <strong>Kütüphanem 📚</strong> bölümünde seni bekliyor olacak — istediğin zaman aç ve indir. 🌸</p>
        <div class="ktp-web-adres">🔗 isiginibull.net</div>
        <p class="ktp-sa-mini muted small">İçeriğin hesabına bağlıdır; farklı cihazlarda da aynı hesapla erişebilirsin.</p>
      </div>`;
    p.hidden = false; requestAnimationFrame(() => p.classList.add("gor"));
  }

  /* ---------- MAĞAZA: sabit dijital kart(lar) ---------- */
  // magaza.js "rituel-araclar" bölümünü çizince en üste ekler.
  function magazaKartlari(grid) {
    if (!grid) return;
    KATALOG.forEach(urun => {
      const kart = document.createElement("div");
      kart.className = "mg-kart ktp-kart";
      const sahipVar = sahipMi(urun.kod);
      const icerikHTML = (urun.icerik || []).map(i => `<li>${esc(i)}</li>`).join("");
      let btnTxt, btnCls = "ktp-btn";
      if (sahipVar) { btnTxt = "📚 Kütüphanemde Aç"; btnCls += " sahip"; }
      else if (!girisli()) { btnTxt = "Erişmek için Giriş Yap"; btnCls += " giris"; }
      else if (nativeMi()) { btnTxt = "🌐 Web'den Edin"; btnCls += " web"; }
      else { btnTxt = "Satın Al · " + esc(urun.fiyat); btnCls += " satinal"; }

      kart.innerHTML = `
        <div class="ktp-kart-kapak">
          <div class="ktp-kapak-ay"></div>
          <div class="ktp-kapak-marka">Işığını Bul</div>
          <div class="ktp-kapak-baslik">${esc(urun.baslik)}</div>
          <div class="ktp-kapak-rozet">📖 Dijital · Kalıcı Erişim</div>
        </div>
        <div class="ktp-kart-govde">
          <div class="ktp-kart-ozet">${esc(urun.ozet)}</div>
          <p class="ktp-kart-aciklama">${esc(urun.aciklama)}</p>
          <ul class="ktp-kart-icerik">${icerikHTML}</ul>
          ${sahipVar ? `<div class="ktp-kart-sahip">✓ Kütüphanende — her zaman senin</div>` : `<div class="ktp-kart-fiyat">${esc(urun.fiyat)}</div>`}
          <button class="${btnCls}" type="button">${btnTxt}</button>
        </div>`;
      kart.querySelector("button").addEventListener("click", () => {
        if (sahipMi(urun.kod)) return ac(urun);
        if (!girisli()) return girisUyar();
        if (nativeMi()) return webdenEdinPencere(urun);
        return satinAlPencere(urun);
      });
      grid.appendChild(kart);
    });
  }

  /* ---------- PROFİL: Kütüphanem listesi ---------- */
  function kutuphaneCiz() {
    const liste = $("#kutuphane-liste"); if (!liste) return;
    const bolum = $("#kutuphane-bolum");
    const sahipUrunler = KATALOG.filter(u => sahipMi(u.kod));

    if (!girisli()) {
      liste.innerHTML = `<p class="muted small ktp-bos">Satın aldığın dijital ritüeller burada, hesabına bağlı olarak kalıcı görünür. Görmek için giriş yap. 🌙</p>`;
      if (bolum) bolum.hidden = false;
      return;
    }
    if (!sahipUrunler.length) {
      liste.innerHTML = `<p class="muted small ktp-bos">Henüz bir dijital ritüelin yok. Mağaza → Ritüel & Araçlar bölümünden edinebilirsin. Aldıkların burada kalıcı kalır. ✨</p>`;
      if (bolum) bolum.hidden = false;
      return;
    }
    liste.innerHTML = "";
    sahipUrunler.forEach(urun => {
      const s = document.createElement("div");
      s.className = "ktp-sahip-kart";
      s.innerHTML = `
        <div class="ktp-sk-ay">🌙</div>
        <div class="ktp-sk-ic">
          <div class="ktp-sk-baslik">${esc(urun.baslik)}</div>
          <div class="ktp-sk-ozet muted small">${esc(urun.ozet)}</div>
        </div>
        <button class="ktp-sk-ac" type="button">Aç</button>`;
      s.querySelector(".ktp-sk-ac").addEventListener("click", () => ac(urun));
      liste.appendChild(s);
    });
    if (bolum) bolum.hidden = false;
  }

  /* ---------- YÖNETİCİ: erişim verme paneli ---------- */
  function yoneticiCiz() {
    const bolum = $("#eris-yonetici"); if (!bolum) return;
    if (!moderatorMu()) { bolum.hidden = true; return; }
    bolum.hidden = false;
    const sec = $("#ey-urun");
    if (sec && !sec.children.length) {
      KATALOG.forEach(u => { const o = document.createElement("option"); o.value = u.kod; o.textContent = u.baslik; sec.appendChild(o); });
    }
  }
  async function erisVer() {
    const email = ($("#ey-email").value || "").trim();
    const kod = $("#ey-urun").value;
    const bil = $("#ey-bilgi");
    if (!email || !kod) { bil.textContent = "E-posta ve ürün seç."; bil.style.color = "var(--uyari,#c9a24a)"; return; }
    const urun = urunBul(kod);
    bil.textContent = "Gönderiliyor…"; bil.style.color = "var(--muted)";
    try {
      const c = sb();
      const { data, error } = await c.functions.invoke("eris-ver", { body: { email, urun_kod: kod, baslik: urun && urun.baslik, fiyat: urun && urun.fiyat, kaynak: "manuel" } });
      if (error) throw error;
      if (data && data.ok) { bil.textContent = "✅ " + data.mesaj; bil.style.color = "var(--basari,#4caf7d)"; $("#ey-email").value = ""; }
      else { bil.textContent = "⚠️ " + ((data && data.mesaj) || "Olmadı"); bil.style.color = "var(--uyari,#c9a24a)"; }
    } catch (e) {
      bil.textContent = "Hata: " + ((e && e.message) || "bağlantı"); bil.style.color = "var(--hata,#e06a6a)";
    }
  }

  /* ---------- bağlan ---------- */
  function baglan() {
    kutuphaneCiz();
    yoneticiCiz();
    const eyBtn = $("#ey-ver"); if (eyBtn) eyBtn.addEventListener("click", erisVer);
    // Oturum hazır olunca / değişince yetkileri çek
    yenile();
    setTimeout(yenile, 2500);   // Bulut geç hazır olabilir
    window.addEventListener("isigini-oturum-degisti", () => { yenile(); yoneticiCiz(); });
  }
  document.addEventListener("DOMContentLoaded", baglan);

  return { yenile, sahipMi, ac, magazaKartlari, kutuphaneCiz, yoneticiCiz, katalog: () => KATALOG };
})();
