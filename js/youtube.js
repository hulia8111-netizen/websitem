/* ============================================================
   youtube.js — Işığını Bul YouTube kanalı köprüsü ▶️
   ------------------------------------------------------------
   • KANAL: tüm uygulamadaki "YouTube" bağlantıları buradan.
   • VIDEOLAR: uygulamadaki kartlara bağlı kanal videoları. Her video
     "yayin" zamanından ÖNCE kartta "… yayında" sayacı gösterir, sonra
     dokununca uygulama İÇİNDE oynatıcı açılır (youtube-nocookie embed)
     + "YouTube'da aç" / "Abone ol". Yayın saati gelince kendiliğinden açılır.
   • Yönetici isterse video kimliğini site_ayar'dan ezebilir:
     anahtar "yt_<video-anahtarı>" (ör. yt_uyku) = YouTube video ID.
   Global: window.YouTube
   ============================================================ */
const YouTube = window.YouTube = (() => {
  const KANAL = "https://www.youtube.com/channel/UCZSJZsySAh83h3gOp9p-xVw";
  const ABONE = KANAL + "?sub_confirmation=1";
  const VIDEOLAR = {
    uyku: { id: "gdeZIfSZ7iY", baslik: "🌙 Uyku Meditasyonu", yayin: "2026-10-08T20:00:00+03:00" }
  };
  let ov = null;

  function videoId(anahtar) {
    const v = VIDEOLAR[anahtar]; if (!v) return null;
    try { const o = window.SiteAyar && SiteAyar.get("yt_" + anahtar, ""); if (o) return String(o).trim(); } catch (e) {}
    return v.id;
  }
  function yayindaMi(anahtar) {
    const v = VIDEOLAR[anahtar]; if (!v) return false;
    return Date.now() >= Date.parse(v.yayin);
  }
  function yayinYazisi(anahtar) {
    const v = VIDEOLAR[anahtar]; if (!v) return "";
    try {
      return new Date(v.yayin).toLocaleString("tr-TR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
    } catch (e) { return ""; }
  }
  function izleUrl(id) { return "https://www.youtube.com/watch?v=" + encodeURIComponent(id); }
  function disariAc(url) { try { window.open(url, "_blank", "noopener,noreferrer"); } catch (e) { location.href = url; } }

  function kur() {
    if (ov) return ov;
    ov = document.createElement("div");
    ov.className = "yt-overlay";
    ov.id = "yt-overlay";
    ov.hidden = true;
    ov.innerHTML =
      '<div class="yt-ic">' +
        '<div class="yt-ust"><span class="yt-baslik" id="yt-baslik"></span><button class="yt-kapat" type="button" aria-label="Kapat">✕</button></div>' +
        '<div class="yt-cerceve" id="yt-cerceve"></div>' +
        '<div class="yt-butonlar">' +
          '<button class="btn" type="button" id="yt-disari">▶️ YouTube\'da aç</button>' +
          '<button class="btn ghost" type="button" id="yt-abone">🔔 Kanala abone ol</button>' +
        '</div>' +
        '<p class="muted small yt-not">Kulaklıkla, yatağında rahatça uzanarak dinlemen önerilir 🌙</p>' +
      '</div>';
    document.body.appendChild(ov);
    if (window.OverlayGeri && OverlayGeri.izle) OverlayGeri.izle(ov);   // telefon GERİ tuşu kapatsın
    ov.querySelector(".yt-kapat").addEventListener("click", kapat);
    ov.addEventListener("click", e => { if (e.target === ov) kapat(); });
    ov.querySelector("#yt-abone").addEventListener("click", () => disariAc(ABONE));
    return ov;
  }

  /* Videoyu uygulama içinde oynat */
  function oynat(anahtar) {
    const id = videoId(anahtar); if (!id) return;
    kur();
    const v = VIDEOLAR[anahtar];
    ov.querySelector("#yt-baslik").textContent = v.baslik;
    const c = ov.querySelector("#yt-cerceve");
    if (navigator.onLine === false) {
      c.innerHTML = '<div class="yt-cevrimdisi">🌙 Videoyu izlemek için internet gerekiyor. Bağlanınca tekrar dene.</div>';
    } else {
      c.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) +
        '?autoplay=1&rel=0&modestbranding=1&playsinline=1" title="' + v.baslik.replace(/"/g, "") +
        '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>';
    }
    const d = ov.querySelector("#yt-disari");
    d.onclick = () => disariAc(izleUrl(id));
    ov.hidden = false;
    document.body.classList.add("yt-aktif");
  }
  function kapat() {
    if (!ov) return;
    ov.querySelector("#yt-cerceve").innerHTML = "";   // sesi durdur
    ov.hidden = true;
    document.body.classList.remove("yt-aktif");
  }

  /* Karttaki buton/sayaç: yayından önce geri sayım, sonra "İzle" */
  function kartBagla() {
    document.querySelectorAll("[data-yt-video]").forEach(kart => {
      const anahtar = kart.dataset.ytVideo;
      const btn = kart.querySelector("[data-yt-izle]");
      const durum = kart.querySelector("[data-yt-durum]");
      const guncelle = () => {
        const acik = yayindaMi(anahtar);
        if (btn) { btn.textContent = acik ? "▶️ Şimdi izle" : "🔔 Kanala abone ol, kaçırma"; }
        if (durum) durum.textContent = acik ? "Yayında ✨ Dokun, uygulamanın içinde izle." : "✨ " + yayinYazisi(anahtar) + "'de YouTube kanalımda yayında.";
      };
      guncelle();
      if (btn && !btn.dataset.bagli) {
        btn.dataset.bagli = "1";
        btn.addEventListener("click", () => { if (yayindaMi(anahtar)) oynat(anahtar); else disariAc(ABONE); });
      }
      // Yayın saatine yakınsa dakikada bir kontrol et (uygulama açıkken saat gelince kart kendiliğinden açılsın)
      if (!yayindaMi(anahtar) && !kart.dataset.ytZaman) {
        kart.dataset.ytZaman = "1";
        const t = setInterval(() => { guncelle(); if (yayindaMi(anahtar)) clearInterval(t); }, 60000);
      }
    });
    // Genel "YouTube kanalı" bağlantıları
    document.querySelectorAll("[data-yt-kanal]").forEach(a => { a.href = KANAL; a.target = "_blank"; a.rel = "noopener noreferrer"; });
  }
  document.addEventListener("DOMContentLoaded", kartBagla);

  return { KANAL, ABONE, oynat, kapat, yayindaMi, kartBagla };
})();
