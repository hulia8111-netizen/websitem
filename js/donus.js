/* ============================================================
   donus.js — "Dönüş Eşiği" 🌙 (nazik geri çağırma karşılaması)
   ------------------------------------------------------------
   Bir süredir uygulamaya girmemiş kişiye giden nazik hatırlatma
   bildirimine dokununca açılır (pushtoken.js → yol "donus:<öne>:<aşama>").
   Kaç gün uzak kalındığını, kaybedilen seriyi, birikmiş görevleri ASLA
   göstermez. Sadece: bugünün ay evresi + 3 küçük başlangıç seçeneği
   (bildirimin söz verdiği seçenek en başta) + "Sadece etrafa bakacağım".
   Son ruh hali düşükse nefes en başa alınır.
   Global: window.Donus
   ============================================================ */
const Donus = window.Donus = (() => {
  let ov = null;

  const SECENEK = {
    nefes:      { ikon: "🌬️", ad: "1 dakikalık nefes", git: () => { if (window.Nefes && Nefes.ac) Nefes.ac(); } },
    kart:       { ikon: "🔮", ad: "Bugünün kartı",      git: () => goster("kartlar") },
    yaz:        { ikon: "✍️", ad: "Tek bir cümle",      git: () => goster("gunluk", "gunluk") },
    ruh:        { ikon: "🌿", ad: "Ruh halimi yaz",     git: () => goster("gunluk", "ruhhali") },
    soru:       { ikon: "❓", ad: "Günün sorusu",       git: () => goster("gunluk", "soru") },
    meditasyon: { ikon: "🎧", ad: "Bir meditasyon",     git: () => goster("meditasyon") },
    takvim:     { ikon: "🌕", ad: "Spiritüel Takvim",   git: () => { if (window.Takvim && Takvim.ac) Takvim.ac(); } }
  };
  const VARSAYILAN = ["nefes", "kart", "yaz"];

  function goster(gorunum, bolum) {
    if (window.gotoView) gotoView(gorunum);
    // gotoView'in "en üste yumuşak kaydır"ı ile çakışmasın diye anında kaydır
    if (bolum) setTimeout(() => { const el = document.getElementById(bolum); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 12, behavior: "auto" }); }, 600);
  }

  /* Son 14 gün içinde kaydedilen en yeni ruh hali düşük mü? */
  function ruhDusuk() {
    try {
      for (let i = 0; i < 14; i++) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const v = Store.get("mood-" + todayKey(d));
        if (!v) continue;
        const k = typeof moodKeyNormalize === "function" ? moodKeyNormalize(v) : v;
        return k === "low" || k === "down";
      }
    } catch (e) {}
    return false;
  }

  function ayMetni() {
    try {
      const i = AyEvresi.evreIndex(AyEvresi.fraz());
      const e = DATA.ayEvreleri[i];
      return { emoji: e.emoji, ad: e.ad };
    } catch (e) { return { emoji: "🌙", ad: "" }; }
  }

  function kur() {
    if (ov) return ov;
    ov = document.createElement("div");
    ov.className = "ilham-overlay donus-overlay";
    ov.id = "donus-overlay";
    ov.hidden = true;
    ov.innerHTML =
      '<div class="ilham-yildizlar" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>' +
      '<div class="ilham-ic">' +
        '<button class="gece-kapat ilham-kapat" aria-label="Kapat">✕</button>' +
        '<div class="ilham-ay" id="donus-ay">🌙</div>' +
        '<p class="ilham-tarih" id="donus-evre"></p>' +
        '<h2 class="donus-baslik" id="donus-baslik"></h2>' +
        '<p class="donus-metin" id="donus-metin"></p>' +
        '<div class="donus-secenekler" id="donus-secenekler"></div>' +
        '<button class="donus-bak" id="donus-bak" type="button">Sadece etrafa bakacağım →</button>' +
      '</div>';
    document.body.appendChild(ov);
    ov.querySelector(".ilham-kapat").addEventListener("click", kapat);
    ov.querySelector("#donus-bak").addEventListener("click", kapat);
    ov.addEventListener("click", e => { if (e.target === ov) kapat(); });
    return ov;
  }

  /* one: bildirimin söz verdiği seçenek · asama: "7" | "14" | "ay" | "30" */
  function ac(one, asama) {
    kur();
    const ay = ayMetni();
    ov.querySelector("#donus-ay").textContent = ay.emoji;
    ov.querySelector("#donus-evre").textContent = ay.ad ? "Bugün gökyüzünde " + ay.ad : "";
    const yeniSayfa = asama === "14";
    ov.querySelector("#donus-baslik").textContent = yeniSayfa ? "Yeni bir sayfa açıldı 🌱" : "Hoş geldin.";
    ov.querySelector("#donus-metin").textContent = yeniSayfa
      ? "İlk adım bugün, ne kadar küçük olursa olsun. Belki şunlardan biriyle başlamak istersin:"
      : "Burada istediğin kadar kalabilirsin. Belki küçük bir şeyle başlamak istersin:";

    let sira = [];
    if (ruhDusuk()) sira.push("nefes");
    if (one && SECENEK[one]) sira.push(one);
    sira = [...new Set(sira.concat(VARSAYILAN))].slice(0, 3);

    const kutu = ov.querySelector("#donus-secenekler");
    kutu.innerHTML = "";
    sira.forEach((k, i) => {
      const s = SECENEK[k];
      const b = document.createElement("button");
      b.type = "button";
      b.className = "donus-secenek" + (i === 0 ? " one" : "");
      b.innerHTML = `<span class="ds-ikon">${s.ikon}</span><span>${s.ad}</span>`;
      b.addEventListener("click", () => { kapat(); setTimeout(s.git, 380); });
      kutu.appendChild(b);
    });

    document.body.classList.add("ilham-aktif");
    ov.hidden = false; ov.classList.remove("gor"); void ov.offsetWidth; ov.classList.add("gor");
  }

  function kapat() {
    if (!ov) return;
    ov.classList.remove("gor");
    setTimeout(() => { ov.hidden = true; document.body.classList.remove("ilham-aktif"); }, 350);
  }

  return { ac, kapat, ruhDusuk };
})();
