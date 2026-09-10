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
    altbaslik: "11 Eylül · Başak Yeni Ayı",
    ozet: "Niyetini tohumla — Cumartesi canlı yayında birlikte mühürleyelim. 🌙",
    giris: "11 Eylül, yılın en güçlü niyet kapılarından biri. Bugün niyetini <b>tohumluyorsun</b>. Cumartesi canlı yayında hep birlikte o niyeti <b>mühürleyeceğiz</b> — evrene teslim edeceğiz. Bugün ektiğin tohum, Cumartesi kök salacak.",
    hazirlik: "Sessiz bir köşe bul. İstersen bir mum ya da telefon ışığını yak. Üç kez yavaşça nefes al — burnundan al, ağzından ver. Omuzlarını indir.",
    adimlar: [
      { ikon: "🚪", ad: "Kapıyı Aç", metin: "Kalbine elini koy ve içinden söyle:", soz: "Bugün yeni ay kapısındayım. Kalbim açık, niyetim net." },
      { ikon: "🌱", ad: "Tohumu Ek", metin: "Şu soruyu kendine sor ve <b>tek bir cümleyle</b> cevapla: “Hayatıma daha çok ne çağırıyorum?” (Örn. “Huzuru çağırıyorum.” / “Bereketi çağırıyorum.”) Bu cümle senin niyet tohumun — bir kağıda ya da günlüğüne yaz.", soz: "" },
      { ikon: "💫", ad: "Işıkla Sula", metin: "Gözlerini kapat. Niyetinin çoktan gerçekleştiğini <b>hisset</b> — sadece düşünme, hisset. O huzur, o bereket şu an içinde. 11 saniye bu duyguda kal.", soz: "" },
      { ikon: "🔒", ad: "Mührü Bekle", metin: "Niyetini içinden üç kez tekrarla, sonra bırak:", soz: "Ektim. Güveniyorum. Cumartesi mühürlüyorum." }
    ],
    kapanis: "Bugün tohumunu ektin. Cumartesi canlı yayında bu tohumları hep birlikte ışıkla mühürleyeceğiz. Sen yalnız değilsin — aynı kapıdan geçen bir topluluğun parçasısın. 🌙",
    olumlama: "Yeni başlangıçlara güvenle açığım; niyetim ışıkla mühürleniyor."
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
          <div class="yar-hazirlik">
            <div class="yar-hazirlik-bas">🕯️ Hazırlık <span class="muted small">(2 dakika)</span></div>
            <p>${esc(RITUEL.hazirlik)}</p>
          </div>
          ${adimlar}
          <div class="yar-kapanis">
            <p>${esc(RITUEL.kapanis)}</p>
            <div class="yar-olumlama">“${esc(RITUEL.olumlama)}”</div>
          </div>
        </div>
        <button class="yar-kapat yar-kapat-alt" type="button">Kapat</button>
      </div>`;
  }

  function ac() {
    const ov = overlayYap();
    ov.innerHTML = icerikHTML();
    ov.querySelectorAll(".yar-kapat").forEach(b => b.addEventListener("click", kapat));
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
