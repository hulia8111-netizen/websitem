/* ============================================================
   sabah.js — Sabah Ritüeli & Güne Başlangıç ☀️✨
   "Bugüne Başla" ile açılan, gün doğumu hissi veren karşılama ekranı.
   Sabah rutini: günün olumlaması, mini nefes, günlük enerji mesajı,
   ruh hali, günün kartı, mini hedef. Günün Farkındalık Sorusu (ana
   uygulamayla ortak awa-<gün>), sabah streak ve tamamlanınca enerji bonusu.
   Sabah saatlerinde otomatik karşılar. Global: window.Sabah
   ============================================================ */

const Sabah = window.Sabah = (() => {
  const $ = id => document.getElementById(id);
  function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  function bugun() { return todayKey(); }

  const RUTIN = [
    { id: "olumlama", ad: "Günün Olumlaması", ikon: "☀️" },
    { id: "nefes",    ad: "Mini Nefes",       ikon: "🫧" },
    { id: "ruhhali",  ad: "Ruh Hali Seçimi",  ikon: "💫" },
    { id: "kart",     ad: "Günün Kartı",      ikon: "🃏" },
    { id: "hedef",    ad: "Mini Hedef",       ikon: "🎯" }
  ];
  let nefesTimer = null;

  function yapilanlar() { return Store.get("sabah-rutin-" + bugun(), []); }
  function yap(id) {
    const l = yapilanlar();
    if (!l.includes(id)) { l.push(id); Store.set("sabah-rutin-" + bugun(), l); }
    if (l.length >= 3) {
      Store.set("sabah-" + bugun(), true);   // sabah streak + enerji bonusu
      ["Enerji", "Bahce", "Profil", "Streak", "Cakra"].forEach(m => { if (window[m]) window[m].ciz(); });
    }
    guncelleDurum();
  }

  /* ---------- rutin içeriği ---------- */
  function kartCek() {
    let idx = Store.get("card-" + bugun());
    if (idx === null) { idx = Math.floor(Math.random() * DATA.kartlar.length); Store.set("card-" + bugun(), idx); }
    return DATA.kartlar[idx];
  }
  function icerikHTML(id) {
    switch (id) {
      case "olumlama": return `<p class="gr-olumlama">“${esc(pickByDate(DATA.sabahOlumlamalari))}”</p><button class="btn ghost sm gr-tamam">Hissettim ✦</button>`;
      case "nefes": return `<div class="nefes-orb sabah" id="sr-nefes-orb"><span id="sr-nefes-yazi">Hazırlan</span></div><button class="btn ghost sm gr-tamam">Tamamladım ✦</button>`;
      case "ruhhali": return `<div class="gr-mood" id="sr-mood"></div>`;
      case "kart": return `<button class="btn ghost sm sr-kart-cek">Günün kartını çek ✦</button><div class="sr-kart-alan" id="sr-kart-alan"></div>`;
      case "hedef": return `<div class="ekle-satir"><input type="text" id="sr-hedef-input" placeholder="Bugün için küçük bir hedef…"/><button class="btn sm sr-hedef-ekle">Belirle</button></div>`;
      default: return "";
    }
  }
  function nefesBaslat(orb, yazi) {
    if (nefesTimer) clearInterval(nefesTimer);
    const f = [["Nefes Al", "al"], ["Ver", "ver"]];
    let i = 0;
    const uygula = () => { yazi.textContent = f[i][0]; orb.className = "nefes-orb sabah " + f[i][1]; i = (i + 1) % 2; };
    uygula(); nefesTimer = setInterval(uygula, 4300);
  }
  function icerikBagla(kart, id) {
    const tamam = kart.querySelector(".gr-tamam");
    if (tamam) tamam.addEventListener("click", () => yap(id));
    if (id === "nefes") { const o = kart.querySelector("#sr-nefes-orb"), y = kart.querySelector("#sr-nefes-yazi"); if (o && y) nefesBaslat(o, y); }
    const kartCekBtn = kart.querySelector(".sr-kart-cek");
    if (kartCekBtn) kartCekBtn.addEventListener("click", () => {
      const k = kartCek();
      kart.querySelector("#sr-kart-alan").innerHTML = `<div class="sr-kart-ic"><img src="${encodeURI(k.img)}" alt="${esc(k.baslik)}" loading="lazy"/><div><strong>${esc(k.baslik)}</strong><p>${esc(k.mesaj)}</p></div></div>`;
      kartCekBtn.style.display = "none";
      yap(id);
    });
    const hedefBtn = kart.querySelector(".sr-hedef-ekle");
    if (hedefBtn) hedefBtn.addEventListener("click", () => {
      const inp = kart.querySelector("#sr-hedef-input"); const v = (inp.value || "").trim();
      if (!v) { inp.focus(); return; }
      Store.set("sabah-hedef-" + bugun(), v);
      const goals = Store.get("goals", []); goals.push({ text: v, done: false }); Store.set("goals", goals);
      inp.value = ""; hedefBtn.textContent = "Belirlendi ✓";
      yap(id);
    });
    const moodKutu = kart.querySelector("#sr-mood");
    if (moodKutu && typeof MOOD_LIST !== "undefined") {
      const secili = (typeof moodKeyNormalize === "function") ? moodKeyNormalize(Store.get("mood-" + bugun())) : null;
      MOOD_LIST.forEach(m => {
        const b = document.createElement("button");
        b.className = "gr-mood-btn" + (secili === m.key ? " aktif" : "");
        b.title = m.label; b.innerHTML = moodSvg(m.key);
        b.addEventListener("click", () => {
          Store.set("mood-" + bugun(), m.key);
          moodKutu.querySelectorAll(".gr-mood-btn").forEach(x => x.classList.remove("aktif"));
          b.classList.add("aktif"); yap(id);
          ["Enerji", "Bahce", "Profil", "Cakra", "Kader", "EnerjiTipi"].forEach(md => { if (window[md]) window[md].ciz(); });
        });
        moodKutu.appendChild(b);
      });
    }
  }

  function cizRutin() {
    const kutu = $("sabah-rutin");
    kutu.innerHTML = "";
    RUTIN.forEach(it => {
      const done = yapilanlar().includes(it.id);
      const kart = document.createElement("div");
      kart.className = "gece-kart gece-rutin-kart sabah-rutin-kart" + (done ? " yapildi" : "");
      kart.innerHTML = `
        <button class="gr-bas"><span class="gr-ikon">${it.ikon}</span><span class="gr-ad">${esc(it.ad)}</span><span class="gr-check">${done ? "✓" : "○"}</span></button>
        <div class="gr-icerik" hidden>${icerikHTML(it.id)}</div>`;
      const bas = kart.querySelector(".gr-bas"), ic = kart.querySelector(".gr-icerik");
      bas.addEventListener("click", () => {
        const acik = ic.hidden; ic.hidden = !acik;
        if (acik && !ic.dataset.bagli) { icerikBagla(kart, it.id); ic.dataset.bagli = "1"; }
        if (!acik && it.id === "nefes" && nefesTimer) { clearInterval(nefesTimer); nefesTimer = null; }
      });
      kutu.appendChild(kart);
    });
  }
  function guncelleDurum() {
    const y = yapilanlar();
    document.querySelectorAll("#sabah-rutin .sabah-rutin-kart").forEach((kart, i) => {
      const done = y.includes(RUTIN[i].id);
      kart.classList.toggle("yapildi", done);
      const ch = kart.querySelector(".gr-check"); if (ch) ch.textContent = done ? "✓" : "○";
    });
    $("sabah-ilerleme-dolu").style.width = (y.length / RUTIN.length * 100) + "%";
    if (y.length >= RUTIN.length) {
      const t = $("sabah-tamam"); t.hidden = false;
      t.innerHTML = `✨ Güne harika bir başlangıç yaptın ${(Store.get("profil", {}).isim || "").trim() || ""} ☀️`;
    }
    const s = $("sabah-streak");
    if (s) { const seri = (typeof mevcutSeri === "function") ? mevcutSeri("sabah-") : 0; s.textContent = seri > 0 ? `☀️ ${seri} gün üst üste` : "İlk sabah ritüelini başlat ☀️"; }
  }

  /* ---------- aç/kapat ---------- */
  function ac() {
    const ov = $("sabah-overlay");
    document.body.classList.add("sabah-aktif");
    const isim = (Store.get("profil", {}).isim || "").trim();
    $("sabah-baslik").textContent = isim ? `Günaydın ${isim}` : "Günaydın";
    $("sabah-mesaj").textContent = pickByDate(DATA.sabahMesajlari);
    $("sabah-tamam").hidden = true;
    cizRutin(); guncelleDurum();
    // Günün Farkındalık Sorusu (ana uygulamayla aynı soru havuzu + cevap = awa-<gün>)
    const soruHavuzu = (window.FARKINDALIK_SORULARI && window.FARKINDALIK_SORULARI.length)
      ? window.FARKINDALIK_SORULARI : DATA.sorular;
    const soruEl = $("sabah-fark-soru");
    if (soruEl) {
      soruEl.textContent = pickByDate(soruHavuzu);
      soruEl.classList.remove("gir"); void soruEl.offsetWidth; soruEl.classList.add("gir"); // zarif fade-in
    }
    if ($("sabah-fark-cevap")) $("sabah-fark-cevap").value = Store.get("awa-" + bugun(), "");
    Store.set("sabah-gosterildi-" + bugun(), true);
    ov.hidden = false; ov.classList.remove("gor"); void ov.offsetWidth; ov.classList.add("gor");
  }
  function kapat() {
    const ov = $("sabah-overlay");
    ov.classList.remove("gor");
    if (nefesTimer) { clearInterval(nefesTimer); nefesTimer = null; }
    setTimeout(() => { ov.hidden = true; document.body.classList.remove("sabah-aktif"); }, 450);
    girisGuncelle();
  }
  function girisGuncelle() {
    const el = $("sg-streak"); if (!el) return;
    const seri = (typeof mevcutSeri === "function") ? mevcutSeri("sabah-") : 0;
    el.textContent = seri > 0 ? `☀️ ${seri} gün seri` : "";
  }
  function parcacikDoldur() {
    const k = $("sabah-parcaciklar"); if (!k || k.dataset.dolu) return;
    let s = "";
    for (let i = 0; i < 18; i++) s += `<span style="left:${(Math.random() * 100).toFixed(1)}%;top:${(40 + Math.random() * 60).toFixed(1)}%;animation-delay:${(Math.random() * 8).toFixed(2)}s;animation-duration:${(8 + Math.random() * 8).toFixed(2)}s"></span>`;
    k.innerHTML = s; k.dataset.dolu = "1";
  }

  function baglan() {
    const acBtn = $("sabah-ac");
    if (acBtn) acBtn.addEventListener("click", ac);
    girisGuncelle();
    if (!$("sabah-overlay")) return;
    parcacikDoldur();
    $("sabah-kapat").addEventListener("click", kapat);
    $("sabah-bitir").addEventListener("click", kapat);
    const farkBtn = $("sabah-fark-kaydet");
    if (farkBtn) farkBtn.addEventListener("click", () => {
      Store.set("awa-" + bugun(), ($("sabah-fark-cevap").value || "").trim());  // ana uygulamayla ortak + Supabase senkron
      farkBtn.textContent = "Kaydedildi ✓"; setTimeout(() => farkBtn.textContent = "Kaydet", 1800);
    });
    // Sabah saatlerinde (05:00–11:00) otomatik karşılama
    const h = new Date().getHours();
    const isim = (Store.get("profil", {}).isim || "").trim();
    if (isim && h >= 5 && h < 11 && !Store.get("sabah-" + bugun()) && !Store.get("sabah-gosterildi-" + bugun())) {
      setTimeout(ac, 900);
    }
  }

  document.addEventListener("DOMContentLoaded", baglan);
  return { ac, kapat };
})();
