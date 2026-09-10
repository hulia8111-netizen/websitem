/* ============================================================
   yeniayrituel.js — Ücretsiz Yeni Ay Ritüeli 🌑🎁
   ------------------------------------------------------------
   Tanıtım amaçlı, HERKESE AÇIK (giriş/ödeme yok) bir ritüel.
   Mağaza → Ritüel & Araçlar → Spiritüel Ritüeller bölümünün en
   üstünde "🎁 Ücretsiz" kartı olarak görünür; tıklayınca içerik
   şık bir okuyucu katmanında anında açılır. Kimseyi kaydetmez,
   hiçbir veri toplamaz — sadece uygulamayı tanıtır ve Cumartesi
   canlı "mühürleme" yayınına nazikçe davet eder.
   Global: window.YeniAyRituel
   ============================================================ */

const YeniAyRituel = window.YeniAyRituel = (() => {
  const $ = s => document.querySelector(s);
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

  /* ---------- RİTÜEL İÇERİĞİ ---------- */
  const RITUEL = {
    rozet: "🎁 Ücretsiz",
    baslik: "Yeni Ay Işık Kapısı Ritüeli",
    altbaslik: "Niyetini tohumla, ışığını çağır",
    ozet: "Niyetini tohumla, ışığını yeni bir döngüye taşı. 🌙",
    pdf: "/ritueller/yeni-ay-isik-kapisi-rituel.pdf",
    pdfAd: "Yeni-Ay-Isik-Kapisi-Rituel.pdf",
    giris: "Yeni ay, gökyüzünün “yeniden başlama” anıdır — niyetler, tohumlar ve taze başlangıçlar için en güçlü zaman. Ay karanlıkken ektiğin niyet, o büyürken seninle birlikte büyür. Bu ritüel, içindeki ışığı yeni bir döngüye taşıman için hazırlandı. 🤍",
    malzemeler: ["<b>1 mum</b> (beyaz ideal, elindeki de olur)", "1 <b>kağıt</b> + <b>kalem</b>", "Küçük bir <b>kase su</b>", "Bir tutam <b>tuz</b>", "<i>İsteğe bağlı:</i> <b>koku / tütsü</b>"],
    hazirlik: "",
    adimlar: [
      { ikon: "🌙", ad: "Alanını Hazırla", metin: "Sessiz bir köşe bul, telefonu sessize al. Üç kez derin nefes al — burnundan al, ağzından ver. Omuzlarını indir.", soz: "" },
      { ikon: "🚪", ad: "Kapıyı Aç", metin: "Mumu yak. Ateşe bakarak içinden söyle:", soz: "Bu ışıkla yeni bir kapı açıyorum. Kalbim açık, niyetim net." },
      { ikon: "🌱", ad: "Tohumunu Ek", metin: "Kağıda, hayatına <b>daha çok ne çağırdığını</b> yaz. Tek cümle yeter: “Huzuru çağırıyorum.” / “Bereketi çağırıyorum.”", soz: "" },
      { ikon: "💫", ad: "Işıkla Sula", metin: "Gözlerini kapat. Niyetinin <b>çoktan gerçekleştiğini hisset</b> — sadece düşünme, hisset. O duyguda 11 saniye kal.", soz: "" },
      { ikon: "🔒", ad: "Mühürle", metin: "Kaseye bir tutam tuz at, parmağını suya değdir ve kağıdın köşesine dokun. Niyetini üç kez tekrarla, sonra kağıdı katla:", soz: "Ektim. Güveniyorum. Bırakıyorum." }
    ],
    kapanis: "Mumu güvenle söndür. Yeni ay boyunca niyetinin filizlendiğini hayal et. Sen yalnız değilsin — aynı kapıdan geçen bir topluluğun parçasısın. 🌱",
    olumlama: "Yeni başlangıçlara güvenle açığım. Niyetim ışıkla mühürlendi, tohumum artık büyüyor.",
    ig: "hulia.isiginibul"
  };

  /* ---------- MAĞAZA KARTI ---------- */
  function kart(grid) {
    if (!grid) return;
    const k = document.createElement("div");
    k.className = "mg-kart yar-kart";
    k.innerHTML = `
      <div class="yar-kapak">
        <span class="yar-kapak-ay">🌑</span>
        <span class="yar-rozet">${esc(RITUEL.rozet)}</span>
      </div>
      <div class="yar-kart-govde">
        <div class="mg-kart-ad">${esc(RITUEL.baslik)}</div>
        <div class="yar-kart-alt">${esc(RITUEL.altbaslik)}</div>
        <p class="mg-kart-aciklama">${esc(RITUEL.ozet)}</p>
        <button class="yar-ac-btn" type="button">Ücretsiz Aç ✦</button>
      </div>`;
    k.querySelector(".yar-ac-btn").addEventListener("click", ac);
    grid.appendChild(k);
  }

  /* ---------- OKUYUCU KATMANI ---------- */
  function overlayYap() {
    let ov = $("#yar-overlay");
    if (ov) return ov;
    ov = document.createElement("div");
    ov.id = "yar-overlay"; ov.className = "yar-overlay"; ov.hidden = true;
    document.body.appendChild(ov);
    ov.addEventListener("click", e => { if (e.target === ov || e.target.classList.contains("yar-kapat")) kapat(); });
    return ov;
  }

  function icerikHTML() {
    const malz = RITUEL.malzemeler.map(m => `<li>${m}</li>`).join("");
    const adimlar = RITUEL.adimlar.map((a, i) => `
      <div class="yar-adim">
        <div class="yar-adim-bas"><span class="yar-adim-no">${i + 1}</span><span class="yar-adim-ikon">${a.ikon}</span><b>${esc(a.ad)}</b></div>
        <p class="yar-adim-metin">${a.metin}</p>
        ${a.soz ? `<div class="yar-soz">“${esc(a.soz)}”</div>` : ""}
      </div>`).join("");
    return `
      <div class="yar-govde" role="dialog" aria-label="${esc(RITUEL.baslik)}">
        <button class="yar-kapat yar-kapat-x" type="button" aria-label="Kapat">✕</button>
        <div class="yar-ust">
          <div class="yar-ust-ay">🌑</div>
          <span class="yar-rozet">${esc(RITUEL.rozet)}</span>
          <h2 class="yar-baslik">${esc(RITUEL.baslik)}</h2>
          <div class="yar-altbaslik">${esc(RITUEL.altbaslik)}</div>
        </div>
        <div class="yar-ic">
          <p class="yar-giris">${RITUEL.giris}</p>
          <div class="yar-sec-h">🕯️ Malzemeler <span class="muted small">· hepsi evinde var</span></div>
          <ul class="yar-malz">${malz}</ul>
          <div class="yar-sec-h">✨ Uygulama <span class="muted small">· yaklaşık 10 dakika</span></div>
          ${adimlar}
          <div class="yar-kapanis">
            <div class="yar-olumlama">“${esc(RITUEL.olumlama)}”</div>
            <p>${esc(RITUEL.kapanis)}</p>
          </div>
          <div class="yar-cta">
            <button class="yar-indir" type="button">📥 Ritüeli PDF İndir</button>
            <a class="yar-ig" href="https://www.instagram.com/${esc(RITUEL.ig)}" target="_blank" rel="noopener noreferrer">📸 Uygulamalı Reels anlatımı için: <b>@${esc(RITUEL.ig)}</b></a>
            <div class="yar-ucretsiz-not">Tamamen ücretsiz 🤍</div>
          </div>
        </div>
        <button class="yar-kapat yar-kapat-alt" type="button">Kapat</button>
      </div>`;
  }

  /* ---------- PDF indir (web: kaydet · uygulama/mobil: yeni sekmede aç) ---------- */
  function indir() {
    const url = RITUEL.pdf;
    const abs = location.origin + url;
    const native = window.__ISIGINI_NATIVE === true || /\bwv\b/i.test(navigator.userAgent || "");
    try {
      if (native) { window.open(abs, "_blank", "noopener,noreferrer"); return; }
      const a = document.createElement("a");
      a.href = url; a.download = RITUEL.pdfAd; a.rel = "noopener";
      document.body.appendChild(a); a.click(); a.remove();
    } catch (e) {
      try { window.open(abs, "_blank", "noopener,noreferrer"); } catch (_e) {}
    }
  }

  function ac() {
    const ov = overlayYap();
    ov.innerHTML = icerikHTML();
    ov.querySelectorAll(".yar-kapat").forEach(b => b.addEventListener("click", kapat));
    const ind = ov.querySelector(".yar-indir"); if (ind) ind.addEventListener("click", indir);
    ov.hidden = false;
    document.body.classList.add("yar-acik");
    requestAnimationFrame(() => ov.classList.add("gor"));
    const g = ov.querySelector(".yar-govde"); if (g) g.scrollTop = 0;
  }
  function kapat() {
    const ov = $("#yar-overlay"); if (!ov) return;
    ov.classList.remove("gor");
    setTimeout(() => { ov.hidden = true; document.body.classList.remove("yar-acik"); }, 300);
  }

  return { kart, ac, kapat };
})();
