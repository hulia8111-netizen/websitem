/* ============================================================
   yolculuk21.js — "Bana Ait Olan Bana Dönüyor" 21 Günlük Ses Ritüeli 🎧∞
   ------------------------------------------------------------
   Premium, erişime kapalı (satın alınca açılan) 21 günlük yolculuk.
   YouTube'da olmayan fark: uygulama içinde 21 gün TAKİP + günlük söz +
   niyet notu + güvenli oynatıcı (indirilemez) + tamamlama kutlaması.
   Erişim, mevcut Kütüphane sistemine bağlıdır (Kutuphane.sahipMi).
   Medya, özel Supabase deposundan imzalı URL ile AKIŞ olarak çalınır.
   İlerleme Store'da tutulur (buluta otomatik senkronlanır).
   Global: window.Yolculuk21
   ============================================================ */

const Yolculuk21 = window.Yolculuk21 = (() => {
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

  const URUN = {
    kod: "ses-bana-ait-olan",
    baslik: "Bana Ait Olan Bana Dönüyor",
    altbaslik: "21 Günlük Ses Ritüeli",
    ozet: "Emeğinin karşılığını almaya hazır mısın? 21 gün dinle — bir kez al, sonsuza kadar senin. 🤍",
    fiyat: "888 TL",
    kapak: "/urunler/bana-ait-olan-kapak.png",
    shopier: "",                       // SiteAyar → "yolculuk_link_ses-bana-ait-olan" ile ayarlanır
    bucket: "ritueller",
    medyaYol: "ses-bana-ait-olan/rituel.mp3",   // depoya yüklenecek dosya (mp3/mp4)
    gunSayisi: 21,
    sozler: [
      "Bana ait olan bana dönüyor.",
      "Bolluğa açığım; almaya hazırım.",
      "Emeğimin karşılığını alıyorum.",
      "Hak ettiğim her şey bana akıyor.",
      "Değerimi biliyorum; evren de biliyor.",
      "Kapılar benim için açılıyor.",
      "Bereket benim doğal halim.",
      "Verdikçe alıyorum, aldıkça çoğalıyorum.",
      "Bolluk bana kolayca ve sürekli geliyor.",
      "Fırsatlar beni buluyor.",
      "Eskiyi bırakıyorum, bollağa yer açıyorum.",
      "İyi şeyleri hak ediyorum.",
      "Evren benim için çalışıyor.",
      "Niyetim netleştikçe yolum açılıyor.",
      "Güvendeyim, desteklenmişim, bolluk içindeyim.",
      "Bana gelen her şey en yüksek hayrım için.",
      "Kalbim şükranla, elim bereketle dolu.",
      "İçimdeki ışık taşıyor; karşılığı geri dönüyor.",
      "Almaya izin veriyorum.",
      "Hayat bana cömert davranıyor.",
      "Bana ait olan tamamen bana döndü. Şükürler olsun. ✨"
    ]
  };

  /* ---------- yardımcı ---------- */
  function sb() { try { return window.Bulut && Bulut.client ? Bulut.client() : null; } catch (e) { return null; } }
  function girisli() { try { return !!(window.Bulut && Bulut.girisli && Bulut.girisli()); } catch (e) { return false; } }
  function nativeMi() { return window.__ISIGINI_NATIVE === true || /\bwv\b/i.test(navigator.userAgent || ""); }
  function bugun() { try { return todayKey(); } catch (e) { return new Date().toISOString().slice(0, 10); } }
  function sahipMi() {
    try { if (window.Kutuphane && Kutuphane.sahipMi) return Kutuphane.sahipMi(URUN.kod); } catch (e) {}
    return false;
  }
  function shopierLink() {
    try { if (window.SiteAyar && SiteAyar.get) return SiteAyar.get("yolculuk_link_" + URUN.kod, URUN.shopier); } catch (e) {}
    return URUN.shopier;
  }
  function gecerliLink(l) { return typeof l === "string" && /^https?:\/\//i.test(String(l).trim()); }

  /* ---------- ilerleme (Store → buluta senkron) ---------- */
  function ilerlemeAl() {
    const d = Store.get("y21-" + URUN.kod, null);
    if (d && typeof d === "object") return d;
    return { gun: 0, sonTarih: "", dongu: 1, notlar: {} };
  }
  function ilerlemeKaydet(d) { Store.set("y21-" + URUN.kod, d); }

  /* ---------- MAĞAZA KARTI ---------- */
  function kart(grid) {
    if (!grid) return;
    const sahip = sahipMi();
    const k = document.createElement("div");
    k.className = "mg-kart y21-kart";
    let butonHTML;
    if (sahip) {
      const il = ilerlemeAl();
      butonHTML = `<div class="y21-ilerleme-mini">${il.gun >= URUN.gunSayisi ? "✓ Tamamlandı" : "Gün " + il.gun + " / " + URUN.gunSayisi}</div>
        <button class="y21-ac-btn" type="button">▶️ Yolculuğa Başla</button>`;
    } else if (!girisli()) {
      butonHTML = `<div class="y21-fiyat">${esc(URUN.fiyat)}</div><button class="y21-ac-btn giris" type="button">Erişmek için Giriş Yap</button>`;
    } else if (nativeMi()) {
      butonHTML = `<div class="y21-fiyat">${esc(URUN.fiyat)}</div><button class="y21-ac-btn web" type="button">🌐 Web'den Edin</button>`;
    } else {
      butonHTML = `<div class="y21-fiyat">${esc(URUN.fiyat)}</div><button class="y21-ac-btn satinal" type="button">Satın Al ✦</button>`;
    }
    k.innerHTML = `
      <div class="y21-kapak" style="background-image:url('${esc(URUN.kapak)}')">
        <span class="y21-rozet">${sahip ? "🎧 Senin" : "∞ 21 Gün"}</span>
      </div>
      <div class="y21-govde">
        <div class="mg-kart-ad">${esc(URUN.baslik)}</div>
        <div class="y21-alt">${esc(URUN.altbaslik)}</div>
        <p class="mg-kart-aciklama">${esc(URUN.ozet)}</p>
        ${butonHTML}
      </div>`;
    k.querySelector(".y21-ac-btn").addEventListener("click", () => {
      if (sahip) return ac();
      if (!girisli()) return girisUyar();
      if (nativeMi()) return webdenEdin();
      return satinAl();
    });
    grid.appendChild(k);
  }

  function girisUyar() {
    try { if (window.Magaza && Magaza.kapat) Magaza.kapat(); } catch (e) {}
    const gid = document.querySelector('.nav-btn[data-view="profil"]'); if (gid) gid.click();
    setTimeout(() => { const h = document.getElementById("hesap"); if (h) h.scrollIntoView({ block: "center" }); }, 300);
  }
  function satinAl() {
    const l = shopierLink();
    if (gecerliLink(l)) { window.open(l, "_blank", "noopener,noreferrer"); return; }
    bilgiKutu("Çok Yakında", "Bu ritüel çok yakında satışa açılacak. Duyurular için takipte kal ✨");
  }
  function webdenEdin() {
    bilgiKutu("🌐 Web'den Edin", `Bu ritüeli <b>isiginibull.net</b> üzerinden edinebilirsin. Aynı hesapla giriş yaptığında burada, <b>${esc(URUN.baslik)}</b> yolculuğun seni bekliyor olacak. 🤍`);
  }
  function bilgiKutu(baslik, metin) {
    let p = document.getElementById("y21-bilgi");
    if (!p) { p = document.createElement("div"); p.id = "y21-bilgi"; p.className = "y21-modal"; document.body.appendChild(p);
      p.addEventListener("click", e => { if (e.target === p || e.target.classList.contains("y21-modal-kapat")) { p.classList.remove("gor"); setTimeout(() => p.hidden = true, 220); } }); }
    p.innerHTML = `<div class="y21-modal-ic"><button class="y21-modal-kapat" aria-label="Kapat">✕</button><div class="y21-modal-amblem">🌙</div><h3>${esc(baslik)}</h3><p>${metin}</p></div>`;
    p.hidden = false; requestAnimationFrame(() => p.classList.add("gor"));
  }

  /* ---------- YOLCULUK KATMANI ---------- */
  function overlayYap() {
    let ov = document.getElementById("y21-overlay");
    if (ov) return ov;
    ov = document.createElement("div"); ov.id = "y21-overlay"; ov.className = "y21-overlay"; ov.hidden = true;
    document.body.appendChild(ov);
    ov.addEventListener("click", e => { if (e.target === ov) kapat(); });
    return ov;
  }

  function gridHTML(il) {
    let s = "";
    for (let g = 1; g <= URUN.gunSayisi; g++) {
      const tamam = g <= il.gun;
      const bugunMu = g === il.gun + 1 && il.sonTarih !== bugun();
      s += `<div class="y21-gun${tamam ? " tamam" : ""}${bugunMu ? " bugun" : ""}">${tamam ? "✓" : g}</div>`;
    }
    return s;
  }

  function icerikHTML() {
    const il = ilerlemeAl();
    const aktifGun = Math.min(il.gun + 1, URUN.gunSayisi);
    const soz = URUN.sozler[(aktifGun - 1) % URUN.sozler.length] || "";
    const bugunYapildi = il.sonTarih === bugun();
    const tamamlandi = il.gun >= URUN.gunSayisi;
    const yuzde = Math.round((il.gun / URUN.gunSayisi) * 100);
    const not = (il.notlar && il.notlar[aktifGun]) || "";
    return `
      <div class="y21-govde-ov" role="dialog" aria-label="${esc(URUN.baslik)}">
        <button class="y21-kapat y21-kapat-x" type="button" aria-label="Kapat">✕</button>
        <div class="y21-ust">
          <div class="y21-ust-amblem">∞</div>
          <h2 class="y21-baslik">${esc(URUN.baslik)}</h2>
          <div class="y21-altbaslik">${esc(URUN.altbaslik)}</div>
          <div class="y21-ilerleme-cubuk"><span style="width:${yuzde}%"></span></div>
          <div class="y21-ilerleme-yazi">${tamamlandi ? "🎉 21 gün tamamlandı — tebrikler!" : "Gün " + aktifGun + " / " + URUN.gunSayisi}</div>
        </div>
        <div class="y21-ic">
          <div class="y21-soz">“${esc(soz)}”</div>
          <div class="y21-player" id="y21-player"><button class="y21-dinle" id="y21-dinle" type="button">🎧 Ritüeli Dinle</button><div class="y21-player-durum" id="y21-player-durum"></div></div>
          <div class="y21-not-kutu">
            <label class="y21-not-baslik">✍️ Bugünün niyeti / notu</label>
            <textarea id="y21-not" class="y21-not" rows="2" placeholder="Bugün ne hissediyorsun, neyi çağırıyorsun?">${esc(not)}</textarea>
          </div>
          ${tamamlandi
        ? `<button class="y21-tamamla bitti" id="y21-yeni" type="button">🔄 Yeni 21 Güne Başla</button>`
        : bugunYapildi
          ? `<button class="y21-tamamla yapildi" type="button" disabled>✓ Bugün tamamlandı — yarın görüşürüz 🌙</button>`
          : `<button class="y21-tamamla" id="y21-tamamla" type="button">Bugünü Tamamla ✦</button>`}
          <div class="y21-grid">${gridHTML(il)}</div>
          <p class="y21-alt-not">🤍 Bir kez al, sonsuza kadar senin. Ne zaman istersen yeniden 21 güne başlayabilirsin.</p>
        </div>
        <div class="y21-parcacik" id="y21-parcacik"></div>
      </div>`;
  }

  function ciz() {
    const ov = overlayYap();
    ov.innerHTML = icerikHTML();
    ov.querySelectorAll(".y21-kapat").forEach(b => b.addEventListener("click", kapat));
    const t = ov.querySelector("#y21-tamamla"); if (t) t.addEventListener("click", bugunuTamamla);
    const y = ov.querySelector("#y21-yeni"); if (y) y.addEventListener("click", yeniDongu);
    const d = ov.querySelector("#y21-dinle"); if (d) d.addEventListener("click", dinle);
    const n = ov.querySelector("#y21-not"); if (n) n.addEventListener("change", notKaydet);
    const g = ov.querySelector(".y21-govde-ov"); if (g) g.scrollTop = 0;
  }

  function ac() {
    if (!sahipMi()) return;
    const ov = overlayYap();
    ciz();
    ov.hidden = false; document.body.classList.add("y21-acik");
    requestAnimationFrame(() => ov.classList.add("gor"));
  }
  function kapat() {
    const ov = document.getElementById("y21-overlay"); if (!ov) return;
    const a = ov.querySelector("audio"); if (a) { try { a.pause(); } catch (e) {} }
    ov.classList.remove("gor");
    setTimeout(() => { ov.hidden = true; document.body.classList.remove("y21-acik"); }, 300);
  }

  function notKaydet(e) {
    const il = ilerlemeAl();
    const aktifGun = Math.min(il.gun + 1, URUN.gunSayisi);
    if (!il.notlar) il.notlar = {};
    il.notlar[aktifGun] = (e.target.value || "").slice(0, 500);
    ilerlemeKaydet(il);
  }

  function bugunuTamamla() {
    const il = ilerlemeAl();
    if (il.sonTarih === bugun()) return;          // günde bir kez
    if (il.gun >= URUN.gunSayisi) return;
    il.gun += 1; il.sonTarih = bugun();
    ilerlemeKaydet(il);
    parcacikPatlat();
    // başarım/streak/enerji ekosistemine küçük katkı
    try { Store.set("task-" + bugun(), true); } catch (e) {}
    try { if (window.Enerji && Enerji.ciz) Enerji.ciz(); } catch (e) {}
    try { if (window.Streak && Streak.ciz) Streak.ciz(); } catch (e) {}
    setTimeout(ciz, 650);
    if (window.Bildirim && Bildirim.tetikle) {
      Bildirim.tetikle(il.gun >= URUN.gunSayisi ? "🎉 21 günü tamamladın — bana ait olan bana döndü! ✨" : `✨ Gün ${il.gun}/${URUN.gunSayisi} tamam · yarın devam 🌙`, true);
    }
  }
  function yeniDongu() {
    const il = ilerlemeAl();
    ilerlemeKaydet({ gun: 0, sonTarih: "", dongu: (il.dongu || 1) + 1, notlar: {} });
    ciz();
  }

  /* ---------- güvenli oynatıcı (özel depodan imzalı akış) ---------- */
  async function dinle() {
    const durum = document.getElementById("y21-player-durum");
    const player = document.getElementById("y21-player");
    if (!player) return;
    if (player.querySelector("audio")) return;    // zaten yüklendi
    if (durum) durum.textContent = "Açılıyor… 🌙";
    const c = sb();
    if (!c || !girisli()) { if (durum) durum.textContent = "Dinlemek için giriş yapmalısın."; return; }
    try {
      const { data, error } = await c.storage.from(URUN.bucket).createSignedUrl(URUN.medyaYol, 3600);
      if (error || !data || !data.signedUrl) throw error || new Error("erişim yok");
      const video = /\.mp4$/i.test(URUN.medyaYol);
      const el = document.createElement(video ? "video" : "audio");
      el.src = data.signedUrl; el.controls = true; el.autoplay = true; el.className = "y21-medya";
      el.setAttribute("controlsList", "nodownload noplaybackrate");
      el.oncontextmenu = () => false;
      const btn = document.getElementById("y21-dinle"); if (btn) btn.remove();
      if (durum) durum.textContent = "";
      player.insertBefore(el, durum || null);
    } catch (e) {
      if (durum) durum.innerHTML = "İçerik açılamadı 😔<br><span class='muted small'>Erişimin yoksa satın alman gerekebilir; aldıysan biraz sonra tekrar dene.</span>";
    }
  }

  function parcacikPatlat() {
    const kutu = document.getElementById("y21-parcacik"); if (!kutu) return;
    let s = "";
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * 360, dist = 50 + Math.random() * 60;
      const x = Math.cos(a * Math.PI / 180) * dist, y = Math.sin(a * Math.PI / 180) * dist;
      s += `<span style="--x:${x.toFixed(0)}px;--y:${y.toFixed(0)}px;animation-delay:${(Math.random() * 0.12).toFixed(2)}s"></span>`;
    }
    kutu.innerHTML = s; setTimeout(() => { kutu.innerHTML = ""; }, 1200);
  }

  return { kart, ac, kapat, KOD: URUN.kod };
})();
