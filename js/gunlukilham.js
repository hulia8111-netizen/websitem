/* ============================================================
   gunlukilham.js — "Günün İlham Cümlesi" ✨
   Her gün (tarihe göre sabit) bir ilham cümlesi gösteren ekran.
   Kaynak: window.ACILIS_CUMLELERI (açılış ekranıyla aynı havuz).
   Bildirime tıklayınca (pushtoken.js → PushToken) buraya yönlenir.
   Ana ekranda "Ritüeller & Araçlar → ✨ Günün İlhamı" ile de açılır.
   Global: window.GunlukIlham
   ============================================================ */
const GunlukIlham = window.GunlukIlham = (() => {
  let ov = null;

  function bugununSozu() {
    const havuz = window.ACILIS_CUMLELERI || [];
    if (!havuz.length) return "Işığın hep seninle. ✨";
    // tarihe göre deterministik (o gün herkes aynı cümleyi görür)
    const idx = (typeof dayIndex === "function") ? (dayIndex() % havuz.length) : 0;
    return havuz[idx];
  }

  function tarihMetni() {
    try { return new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "long" }); }
    catch (e) { return ""; }
  }

  function kur() {
    if (ov) return ov;
    ov = document.createElement("div");
    ov.className = "ilham-overlay";
    ov.id = "ilham-overlay";
    ov.hidden = true;
    ov.innerHTML =
      '<div class="ilham-yildizlar" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>' +
      '<div class="ilham-ic">' +
        '<button class="gece-kapat ilham-kapat" aria-label="Kapat">✕</button>' +
        '<div class="ilham-ay">🌙</div>' +
        '<p class="ilham-tarih" id="ilham-tarih"></p>' +
        '<div class="ilham-amblem">✨</div>' +
        '<blockquote class="ilham-soz" id="ilham-soz"></blockquote>' +
        '<p class="ilham-alt muted small">Günün ilham cümlesi · her gün yeni</p>' +
        '<button class="ilham-ayar-link" id="ilham-ayar-link" type="button">🔔 Bildirim saatlerini ayarla</button>' +
        '<div class="ilham-paylas">' +
          '<span class="ilham-paylas-baslik">Paylaş</span>' +
          '<div class="ilham-paylas-btnlar">' +
            '<button class="ilham-pay wa" id="ilham-pay-wa" type="button" aria-label="WhatsApp\'ta paylaş">💬<span>WhatsApp</span></button>' +
            '<button class="ilham-pay ig" id="ilham-pay-ig" type="button" aria-label="Instagram\'da paylaş">📸<span>Instagram</span></button>' +
            '<button class="ilham-pay fb" id="ilham-pay-fb" type="button" aria-label="Facebook\'ta paylaş">👍<span>Facebook</span></button>' +
          '</div>' +
        '</div>' +
        '<div class="ilham-reklam" id="ilham-reklam" hidden>' +
          '<button class="ilham-reklam-btn" id="ilham-reklam-btn" type="button">🎬 Reklam izle · Ekstra İlham al ✨</button>' +
          '<div class="ilham-destekci" id="ilham-destekci" hidden></div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(ov);
    ov.querySelector(".ilham-kapat").addEventListener("click", kapat);
    ov.addEventListener("click", e => { if (e.target === ov) kapat(); });
    ov.querySelector("#ilham-ayar-link").addEventListener("click", () => { kapat(); setTimeout(bildirimAyarinaGit, 380); });
    ov.querySelector("#ilham-pay-wa").addEventListener("click", waPaylas);
    ov.querySelector("#ilham-pay-fb").addEventListener("click", fbPaylas);
    ov.querySelector("#ilham-pay-ig").addEventListener("click", igPaylas);
    return ov;
  }

  /* ---------- paylaşım ---------- */
  const APP_URL = "https://isiginibull.net";
  function paylasMetni() { return "“" + bugununSozu() + "”\n\n— Işığını Bul ✨"; }
  function waPaylas() {
    window.open("https://wa.me/?text=" + encodeURIComponent(paylasMetni() + "\n" + APP_URL), "_blank", "noopener,noreferrer");
  }
  function fbPaylas() {
    window.open("https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(APP_URL) + "&quote=" + encodeURIComponent(paylasMetni()), "_blank", "noopener,noreferrer");
  }
  /* ---------- Instagram: Hikaye boyutunda (1080×1920) görsel ----------
     Instagram dışarıdan metin almaz, görsel alır. Ekrandaki cümleyi markalı
     bir görsele çizer ve telefonun paylaşım menüsüne verir; Instagram orada
     Hikaye / Reels / Gönderi / Mesaj seçenekleriyle çıkar.
       • Uygulama v10+  → native köprü (gorsel-paylas)
       • Tarayıcı (dosya paylaşımı destekliyse) → navigator.share({ files })
       • Diğer (eski uygulama / masaüstü) → görseli önizlemede göster (+ indir) */
  function ekrandakiSoz() {
    const el = ov && ov.querySelector("#ilham-soz");
    const t = el ? el.textContent.replace(/^[“"\s]+|[”"\s]+$/g, "") : "";
    return t || bugununSozu();
  }
  function satirla(ctx, metin, maxW) {
    const kelimeler = String(metin).split(/\s+/), satirlar = [];
    let s = "";
    for (const k of kelimeler) {
      const dene = s ? s + " " + k : k;
      if (ctx.measureText(dene).width > maxW && s) { satirlar.push(s); s = k; } else s = dene;
    }
    if (s) satirlar.push(s);
    return satirlar;
  }
  async function hikayeGorseli() {
    const W = 1080, H = 1920;
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d");
    const g = ctx.createRadialGradient(W / 2, H * 0.25, 60, W / 2, H * 0.45, H * 0.85);
    g.addColorStop(0, "#2a1d52"); g.addColorStop(0.55, "#1a1233"); g.addColorStop(1, "#0e0922");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // yıldızlar (tarihe göre sabit desen)
    let tohum = (typeof dayIndex === "function" ? dayIndex() : 7) * 9301 + 49297;
    const rnd = () => (tohum = (tohum * 9301 + 49297) % 233280) / 233280;
    for (let i = 0; i < 70; i++) {
      ctx.globalAlpha = 0.25 + rnd() * 0.6; ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(rnd() * W, rnd() * H, 1 + rnd() * 2.6, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    const sozEl = ov && ov.querySelector("#ilham-soz");
    const baslikFont = (sozEl && getComputedStyle(sozEl).fontFamily) || "Georgia, serif";
    try { if (document.fonts && document.fonts.ready) await document.fonts.ready; } catch (e) {}
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    // ay + başlık
    ctx.font = "120px serif"; ctx.fillText("🌙", W / 2, 360);
    ctx.fillStyle = "#e9c46a"; ctx.font = "600 40px " + baslikFont;
    ctx.fillText("GÜNÜN İLHAM CÜMLESİ", W / 2, 500);
    ctx.fillStyle = "rgba(233,196,106,0.55)"; ctx.fillRect(W / 2 - 70, 545, 140, 3);
    // cümle (sığana kadar küçült)
    const soz = "“" + ekrandakiSoz() + "”";
    let boyut = 92, satirlar, lh;
    do {
      ctx.font = "500 " + boyut + "px " + baslikFont;
      satirlar = satirla(ctx, soz, W - 180); lh = boyut * 1.4; boyut -= 4;
    } while (satirlar.length * lh > 900 && boyut > 44);
    ctx.fillStyle = "#fdf3d6";
    ctx.shadowColor = "rgba(233,196,106,0.35)"; ctx.shadowBlur = 24;
    const bas = 1000 - (satirlar.length - 1) * lh / 2;
    satirlar.forEach((s, i) => ctx.fillText(s, W / 2, bas + i * lh));
    ctx.shadowBlur = 0;
    // marka
    ctx.fillStyle = "#e9c46a"; ctx.font = "600 54px " + baslikFont;
    ctx.fillText("Işığını Bul ✨", W / 2, 1630);
    ctx.fillStyle = "rgba(253,243,214,0.7)"; ctx.font = "34px sans-serif";
    ctx.fillText("isiginibull.net", W / 2, 1700);
    return cv;
  }
  function onizlemeGoster(dataUrl) {
    const k = document.createElement("div");
    k.className = "ilham-onizleme";
    k.innerHTML = '<div class="io-ic"><img alt="İlham cümlesi görseli" src="' + dataUrl + '" />' +
      '<p class="io-not">Uygulamanı Play Store\'dan güncellediğinde bu görsel doğrudan Instagram Hikaye ve Reels\'e paylaşılır. Şimdilik ekran görüntüsü alıp paylaşabilirsin.</p>' +
      '<div class="io-btnlar"><a class="btn" download="isigini-bul-ilham.jpg" href="' + dataUrl + '">Görseli indir</a>' +
      '<button class="btn ghost" type="button">Kapat</button></div></div>';
    k.addEventListener("click", e => { if (e.target === k || e.target.matches("button")) k.remove(); });
    document.body.appendChild(k);
  }
  async function igPaylas() {
    const btn = ov && ov.querySelector("#ilham-pay-ig");
    if (btn) btn.disabled = true;
    try {
      const cv = await hikayeGorseli();
      const dataUrl = cv.toDataURL("image/jpeg", 0.92);
      if (window.__ISIGINI_NATIVE && Number(window.__ISIGINI_NATIVE_SURUM || 0) >= 10 && window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: "gorsel-paylas", base64: dataUrl.split(",")[1], mime: "image/jpeg",
          ad: "isigini-bul-ilham.jpg", baslik: "Günün ilham cümlesini paylaş"
        }));
        return;
      }
      const blob = await new Promise(r => cv.toBlob(r, "image/jpeg", 0.92));
      const dosya = blob && new File([blob], "isigini-bul-ilham.jpg", { type: "image/jpeg" });
      if (dosya && navigator.canShare && navigator.canShare({ files: [dosya] })) {
        try { await navigator.share({ files: [dosya], text: paylasMetni() + "\n" + APP_URL }); } catch (e) { /* vazgeçti */ }
        return;
      }
      onizlemeGoster(dataUrl);
    } catch (e) {
      try { await navigator.clipboard.writeText(paylasMetni() + "\n" + APP_URL); } catch (x) {}
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function ac() {
    kur();
    const s = ov.querySelector("#ilham-soz");
    const t = ov.querySelector("#ilham-tarih");
    if (s) s.textContent = "“" + bugununSozu() + "”";
    if (t) t.textContent = tarihMetni();
    document.body.classList.add("ilham-aktif");
    ov.hidden = false; ov.classList.remove("gor"); void ov.offsetWidth; ov.classList.add("gor");
    try { if (window.Reklam) Reklam.butonaBagla(); } catch (e) {}
  }
  /* Profil › Ayarlar › Bildirimler kartına götür (aç-kapa + ek saatler) */
  function bildirimAyarinaGit() {
    if (window.gotoView) gotoView("profil");
    const sekme = document.querySelector('#profil-sekme .psek-btn[data-pgrup="ayarlar"]');
    if (sekme) sekme.click();
    setTimeout(() => {
      const kart = document.getElementById("bildirim");
      if (!kart) return;
      // gotoView'in "en üste yumuşak kaydır"ı ile çakışmasın diye anında kaydır
      window.scrollTo({ top: kart.getBoundingClientRect().top + window.scrollY - 12, behavior: "auto" });
      kart.classList.remove("vurgu-parla"); void kart.offsetWidth; kart.classList.add("vurgu-parla");
    }, 600);
  }

  function kapat() {
    if (!ov) return;
    ov.classList.remove("gor");
    setTimeout(() => { ov.hidden = true; document.body.classList.remove("ilham-aktif"); }, 350);
  }

  function baglan() {
    const btn = document.getElementById("ilham-ac");
    if (btn) btn.addEventListener("click", ac);
  }
  document.addEventListener("DOMContentLoaded", baglan);

  return { ac, kapat, bugununSozu };
})();
