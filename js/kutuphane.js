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

  /* ---------- KATALOG (dijital ürünler; en yeni en üstte) ----------
     Not: Asıl katalog Supabase `dijital_urun` tablosundan yüklenir
     (katalogYukle). Aşağıdaki dizi yalnızca bulut gelmezse yedektir. */
  let KATALOG = [
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
    iban: "TR77 0015 7000 0000 0203 2018 98",
    ad: "Hülya Işıkoğlu",
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
  const YONETICI_EPOSTA = ["hulia8111@gmail.com"];   // tam yetkili yönetici(ler)
  function moderatorMu() {
    try {
      const em = (window.Bulut && Bulut.durum ? (Bulut.durum().email || "") : "").toLowerCase();
      if (em && YONETICI_EPOSTA.indexOf(em) !== -1) return true;
    } catch (e) {}
    try { return !!(window.ToplulukSosyal && ToplulukSosyal.moderatorMuCached && ToplulukSosyal.moderatorMuCached()); } catch (e) { return false; }
  }
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

  /* ---------- katalogu buluttan yükle (dijital_urun) ---------- */
  function satirToUrun(r) {
    return {
      kod: r.kod, baslik: r.baslik, ozet: r.ozet || "", aciklama: r.aciklama || "",
      icerik: Array.isArray(r.icerik) ? r.icerik : (r.icerik ? [r.icerik] : []),
      fiyat: r.fiyat || "", tarih: r.tarih || "",
      dosyalar: [{ tip: "pdf", ad: "Ritüel Rehberi (PDF)", yol: r.dosya_ad || "rehber.pdf" }]
    };
  }
  async function katalogYukle() {
    const c = sb();
    if (!c) return;
    try {
      const { data, error } = await c.from("dijital_urun").select("*").eq("aktif", true).order("sira", { ascending: false });
      if (error || !data) return;                 // hata → yedek katalog kalır
      if (data.length) KATALOG = data.map(satirToUrun);
    } catch (e) { /* sessiz → yedek */ }
    // yeniden çiz
    kutuphaneCiz();
    yoneticiCiz();
    listeDijital();
    // mağaza açıksa ve ürünler görünüyorsa tazele
    if (window.Magaza && Magaza.yenidenCiz) Magaza.yenidenCiz();
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
    const A = k => (window.SiteAyar ? SiteAyar.get(k, null) : null);
    const iban = A("iban") || ODEME.iban;
    const ibanAd = A("iban_ad") || ODEME.ad;
    const waNo = A("wa_dijital") || ODEME.wa;
    const waMesaj = encodeURIComponent(`Merhaba, "${urun.baslik}" (${urun.fiyat}) satın almak istiyorum. Havaleyi yaptım ✨ Uygulama e-postam: `);
    const waLink = `https://wa.me/${waNo}?text=${waMesaj}`;
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
            <div class="ktp-iban-ad">${esc(ibanAd)}</div>
            <div class="ktp-iban-no">${esc(iban)}</div>
          </div>
          <div class="ktp-sa-adim"><span>2</span> Dekontu + <strong>uygulama e-postanı</strong> WhatsApp'tan bize gönder.</div>
          <div class="ktp-sa-adim"><span>3</span> Erişimin açılır; içerik <strong>Kütüphanem 📚</strong> bölümüne düşer.</div>
        </div>
        <a class="ktp-sa-wa" href="${waLink}" target="_blank" rel="noopener noreferrer">💬 WhatsApp'tan Bilgi Gönder</a>
        <p class="ktp-sa-mini muted small">Ödeme ve erişim güvenli şekilde elle onaylanır. Sorun olursa bize yazman yeterli.</p>
      </div>`;
    const waBtn = p.querySelector(".ktp-sa-wa");
    if (waBtn) waBtn.addEventListener("click", () => {
      talepGonder(urun);
      const not = p.querySelector(".ktp-sa-mini");
      if (not) { not.textContent = "✅ Talebin bize ulaştı — ödemen görülünce erişimin otomatik açılacak ✨"; not.style.color = "var(--basari,#4caf7d)"; }
    });
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
    const mod = moderatorMu();
    const bolum = $("#eris-yonetici");
    const ekle = $("#urun-ekle-yonetici");
    const talep = $("#talep-yonetici");
    if (bolum) bolum.hidden = !mod;
    if (ekle) ekle.hidden = !mod;
    if (talep) talep.hidden = !mod;
    if (!mod) return;
    talepleriYukle();
    // Erişim-ver ürün listesini güncel katalogdan kur
    const sec = $("#ey-urun");
    if (sec) {
      const secili = sec.value;
      sec.innerHTML = "";
      KATALOG.forEach(u => { const o = document.createElement("option"); o.value = u.kod; o.textContent = u.baslik; sec.appendChild(o); });
      if (secili) sec.value = secili;
    }
  }
  // Erişim ver çekirdeği: e-posta + ürün kodu → eris-ver Edge Function. { ok, mesaj }
  async function erisVerCekirdek(email, kod, kaynak) {
    const urun = urunBul(kod);
    try {
      const c = sb();
      const { data, error } = await c.functions.invoke("eris-ver", { body: { email, urun_kod: kod, baslik: urun && urun.baslik, fiyat: urun && urun.fiyat, kaynak: kaynak || "manuel" } });
      if (error) throw error;
      return data && data.ok ? { ok: true, mesaj: data.mesaj } : { ok: false, mesaj: (data && data.mesaj) || "Olmadı" };
    } catch (e) { return { ok: false, mesaj: (e && e.message) || "bağlantı" }; }
  }
  async function erisVer() {
    const email = ($("#ey-email").value || "").trim();
    const kod = $("#ey-urun").value;
    const bil = $("#ey-bilgi");
    if (!email || !kod) { bil.textContent = "E-posta ve ürün seç."; bil.style.color = "var(--uyari,#c9a24a)"; return; }
    bil.textContent = "Gönderiliyor…"; bil.style.color = "var(--muted)";
    const r = await erisVerCekirdek(email, kod, "manuel");
    if (r.ok) { bil.textContent = "✅ " + r.mesaj; bil.style.color = "var(--basari,#4caf7d)"; $("#ey-email").value = ""; }
    else { bil.textContent = "⚠️ " + r.mesaj; bil.style.color = "var(--uyari,#c9a24a)"; }
  }

  /* ---------- SATIN ALMA TALEBİ (kullanıcı "ödedim" der) ---------- */
  // Satın alma penceresindeki WhatsApp butonuna basınca çağrılır:
  // talebi kaydeder (yönetici paneline düşer) + yöneticiye push atar.
  async function talepGonder(urun) {
    const c = sb(); if (!c || !uid()) return;
    const kayit = {
      user_id: uid(), email: benimEmail(), urun_kod: urun.kod,
      urun_baslik: urun.baslik, fiyat: urun.fiyat,
      kaynak: nativeMi() ? "native" : "web", durum: "talep"
    };
    try { await c.from("satinalma_talep").insert(kayit); } catch (e) { /* sessiz */ }
    // yöneticiye anlık bildirim (fonksiyon yoksa sessizce geçilir)
    try { c.functions.invoke("satis-bildir", { body: { email: kayit.email, urun_baslik: urun.baslik, fiyat: urun.fiyat } }); } catch (e) {}
  }

  /* ---------- YÖNETİCİ: talep listesi + tek tıkla onay ---------- */
  let talepler = [];
  async function talepleriYukle() {
    if (!moderatorMu()) return;
    const c = sb(); if (!c) return;
    try {
      const { data } = await c.from("satinalma_talep").select("*").order("created_at", { ascending: false }).limit(100);
      talepler = data || [];
    } catch (e) { talepler = []; }
    talepCiz();
  }
  function talepRozetGuncelle() {
    const bekleyen = talepler.filter(t => t.durum === "talep").length;
    const r = $("#talep-rozet"); if (r) { r.textContent = bekleyen; r.hidden = bekleyen === 0; }
  }
  function talepCiz() {
    const liste = $("#talep-liste"); if (!liste) return;
    talepRozetGuncelle();
    if (!talepler.length) { liste.innerHTML = `<p class="muted small">Henüz talep yok. Biri "ödedim" dediğinde burada görünür. 🌙</p>`; return; }
    liste.innerHTML = "";
    talepler.forEach(t => {
      const bekliyor = t.durum === "talep";
      const tarih = (t.created_at || "").slice(0, 16).replace("T", " ");
      const s = document.createElement("div");
      s.className = "talep-satir" + (bekliyor ? " bekliyor" : " " + t.durum);
      const durumEt = t.durum === "tamam" ? `<span class="talep-durum tamam">✓ Erişim verildi</span>`
        : t.durum === "iptal" ? `<span class="talep-durum iptal">İptal</span>`
        : `<span class="talep-durum bekliyor">⏳ Bekliyor</span>`;
      s.innerHTML = `
        <div class="talep-ic">
          <div class="talep-urun">${esc(t.urun_baslik || t.urun_kod)} ${t.fiyat ? `<span class="muted small">· ${esc(t.fiyat)}</span>` : ""}</div>
          <div class="talep-mail muted small">${esc(t.email || "e-posta yok")} · ${esc(tarih)}</div>
          ${durumEt}
        </div>
        <div class="talep-btnlar">
          ${bekliyor ? `<button class="btn talep-onay" type="button">✓ Erişim Ver</button>
                        <button class="btn ghost talep-iptal" type="button">İptal</button>` : ""}
        </div>`;
      if (bekliyor) {
        s.querySelector(".talep-onay").addEventListener("click", () => talepOnayla(t, s));
        s.querySelector(".talep-iptal").addEventListener("click", () => talepDurum(t, "iptal"));
      }
      liste.appendChild(s);
    });
  }
  async function talepOnayla(t, satir) {
    const bil = $("#talep-bilgi");
    if (!t.email) { if (bil) { bil.textContent = "Bu talepte e-posta yok, elle ver."; bil.style.color = "var(--uyari,#c9a24a)"; } return; }
    const btn = satir && satir.querySelector(".talep-onay"); if (btn) { btn.disabled = true; btn.textContent = "Veriliyor…"; }
    if (bil) { bil.textContent = "Erişim veriliyor…"; bil.style.color = "var(--muted)"; }
    const r = await erisVerCekirdek(t.email, t.urun_kod, "talep");
    if (r.ok) {
      await talepDurum(t, "tamam");
      if (bil) { bil.textContent = "✅ " + t.email + " → erişim verildi"; bil.style.color = "var(--basari,#4caf7d)"; }
    } else {
      if (btn) { btn.disabled = false; btn.textContent = "✓ Erişim Ver"; }
      if (bil) { bil.textContent = "⚠️ " + r.mesaj; bil.style.color = "var(--uyari,#c9a24a)"; }
    }
  }
  async function talepDurum(t, durum) {
    const c = sb(); if (!c) return;
    try {
      await c.from("satinalma_talep").update({ durum, onay_at: durum === "tamam" ? new Date().toISOString() : null }).eq("id", t.id);
      t.durum = durum;
      talepCiz();
    } catch (e) {}
  }

  /* ---------- YÖNETİCİ: yeni dijital ürün ekle ---------- */
  async function urunEkle() {
    const bil = $("#ue-bilgi");
    const val = id => (($("#" + id) && $("#" + id).value) || "").trim();
    const kod = val("ue-kod"), baslik = val("ue-baslik");
    if (!kod || !baslik) { bil.textContent = "Ürün kodu ve başlık gerekli."; bil.style.color = "var(--uyari,#c9a24a)"; return; }
    if (!/^[a-z0-9-]+$/.test(kod)) { bil.textContent = "Ürün kodu yalnız küçük harf, rakam ve tire içermeli (ör: ritueller-2026-09)."; bil.style.color = "var(--uyari,#c9a24a)"; return; }
    const icerik = val("ue-icerik").split("\n").map(s => s.trim()).filter(Boolean);
    const satir = {
      kod, baslik, ozet: val("ue-ozet"), aciklama: val("ue-aciklama"),
      icerik: icerik.length ? icerik : null, fiyat: val("ue-fiyat"),
      tarih: val("ue-tarih"), sira: Date.now() % 1000000000, aktif: true
    };
    bil.textContent = "Ekleniyor…"; bil.style.color = "var(--muted)";
    try {
      const c = sb();
      const { error } = await c.from("dijital_urun").upsert(satir, { onConflict: "kod" });
      if (error) throw error;
      await katalogYukle();
      bil.innerHTML = `✅ Kaydedildi! <b>Not:</b> yeni üründe PDF/dosyayı depoda <b>ritueller → ${esc(kod)}</b> klasörüne yükle.`;
      bil.style.color = "var(--basari,#4caf7d)";
      formTemizleDijital();
    } catch (e) {
      bil.textContent = "Hata: " + ((e && e.message) || "eklenemedi"); bil.style.color = "var(--hata,#e06a6a)";
    }
  }

  /* ---------- dijital ürün düzenle / sil / liste ---------- */
  function formTemizleDijital() {
    ["ue-kod", "ue-baslik", "ue-ozet", "ue-aciklama", "ue-icerik", "ue-fiyat", "ue-tarih"].forEach(id => { if ($("#" + id)) $("#" + id).value = ""; });
    const b = $("#ue-ekle"); if (b) b.textContent = "Ürünü Ekle";
    const ip = $("#ue-iptal"); if (ip) ip.style.display = "none";
    const kod = $("#ue-kod"); if (kod) kod.readOnly = false;
  }
  function dijitalDuzenle(u) {
    const v = (id, val) => { if ($("#" + id)) $("#" + id).value = val || ""; };
    v("ue-kod", u.kod); v("ue-baslik", u.baslik); v("ue-ozet", u.ozet); v("ue-aciklama", u.aciklama);
    v("ue-icerik", (u.icerik || []).join("\n")); v("ue-fiyat", u.fiyat); v("ue-tarih", u.tarih);
    const kod = $("#ue-kod"); if (kod) kod.readOnly = true;                 // düzenlemede kod değişmesin
    const b = $("#ue-ekle"); if (b) b.textContent = "Değişikliği Kaydet";
    const ip = $("#ue-iptal"); if (ip) ip.style.display = "inline-block";
    const sec = $("#urun-ekle-yonetici"); if (sec) sec.scrollIntoView({ block: "start" });
  }
  async function dijitalSil(kod, ad) {
    if (!confirm(`"${ad || kod}" ürünü silinsin mi?`)) return;
    const c = sb(); if (!c) return;
    try { await c.from("dijital_urun").delete().eq("kod", kod); await katalogYukle(); } catch (e) {}
  }
  function listeDijital() {
    const liste = $("#ue-liste"); if (!liste) return;
    if (!KATALOG.length) { liste.innerHTML = `<p class="muted small">Henüz ürün yok.</p>`; return; }
    liste.innerHTML = "";
    KATALOG.forEach(u => {
      const s = document.createElement("div");
      s.className = "mu-satir";
      s.innerHTML = `<div class="mu-satir-foto">🌙</div>
        <div class="mu-satir-ic"><b>${esc(u.baslik)}</b><span class="muted small">${esc(u.fiyat || "fiyat yok")} · ${esc(u.kod)}</span></div>
        <button class="mu-duzenle" type="button">Düzenle</button>
        <button class="mu-sil" type="button" aria-label="Sil">✕</button>`;
      s.querySelector(".mu-duzenle").addEventListener("click", () => dijitalDuzenle(u));
      s.querySelector(".mu-sil").addEventListener("click", () => dijitalSil(u.kod, u.baslik));
      liste.appendChild(s);
    });
  }

  /* ---------- bağlan ---------- */
  function baglan() {
    kutuphaneCiz();
    yoneticiCiz();
    const eyBtn = $("#ey-ver"); if (eyBtn) eyBtn.addEventListener("click", erisVer);
    const ueBtn = $("#ue-ekle"); if (ueBtn) ueBtn.addEventListener("click", urunEkle);
    const ueIptal = $("#ue-iptal"); if (ueIptal) ueIptal.addEventListener("click", formTemizleDijital);
    // Katalogu buluttan yükle (herkese açık; oturumsuz da çalışır)
    katalogYukle();
    setTimeout(katalogYukle, 2500);
    // Oturum hazır olunca / değişince yetkileri çek
    yenile();
    setTimeout(yenile, 2500);   // Bulut geç hazır olabilir
    // Moderatör durumu (ToplulukSosyal) geç yüklenebilir → paneli birkaç kez dene
    [2500, 5000, 9000].forEach(ms => setTimeout(yoneticiCiz, ms));
    window.addEventListener("isigini-oturum-degisti", () => { yenile(); katalogYukle(); setTimeout(yoneticiCiz, 1500); setTimeout(yoneticiCiz, 4000); });
  }
  document.addEventListener("DOMContentLoaded", baglan);

  return { yenile, sahipMi, ac, magazaKartlari, kutuphaneCiz, yoneticiCiz, talepleriYukle, katalog: () => KATALOG };
})();
