/* ============================================================
   gece.js — Uyku & Gece Rutini 🌙✨
   "Gece Moduna Geç" ile açılan daha karanlık, sakin bir tam ekran
   deneyim: gece olumlaması, 4-7-8 nefes, uyku meditasyonu, şükran,
   gün sonu ruh hali ve rahatlatıcı frekans. Uyku sayacı, gece streak
   ve tamamlama glow'u. SesMotoru + ruh hali/şükran sistemleriyle entegre.
   Global: window.Gece
   ============================================================ */

const Gece = window.Gece = (() => {
  const $ = id => document.getElementById(id);
  function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

  const RUTIN = [
    { id: "olumlama",   ad: "Gece Olumlaması",    ikon: "🌙" },
    { id: "nefes",      ad: "Sakin Nefes",        ikon: "🫧" },
    { id: "meditasyon", ad: "Uyku Meditasyonu",   ikon: "🎧" },
    { id: "sukran",     ad: "Şükran",             ikon: "🙏" },
    { id: "ruhhali",    ad: "Gün Sonu Ruh Hali",  ikon: "💫" },
    { id: "frekans",    ad: "Rahatlatıcı Frekans", ikon: "🌊" }
  ];

  let sayacTimer = null, sayacKalan = 0, nefesTimer = null, medBaslangic = null;

  function bugun() { return todayKey(); }
  function yapilanlar() { return Store.get("gece-rutin-" + bugun(), []); }
  function yapildiMi(id) { return yapilanlar().includes(id); }
  function yap(id) {
    const l = yapilanlar();
    if (!l.includes(id)) { l.push(id); Store.set("gece-rutin-" + bugun(), l); }
    if (l.length >= 3) Store.set("gece-" + bugun(), true);  // gece streak için
    guncelleDurum();
  }

  /* ---------- gece sesi (meditasyon takibi ile) ---------- */
  function geceCal(track) {
    SesMotoru.cal(track);
    if (medBaslangic === null) medBaslangic = Date.now();
    Store.set("med-" + bugun(), true);
    ["Enerji", "Bahce", "Profil", "Cakra"].forEach(m => { if (window[m]) window[m].ciz(); });
  }
  function geceSesDurdur() {
    SesMotoru.durdur();
    if (medBaslangic !== null) {
      const sn = Math.round((Date.now() - medBaslangic) / 1000);
      medBaslangic = null;
      if (sn > 0 && sn < 7200) Store.set("med-sure-sn", (Store.get("med-sure-sn", 0) || 0) + sn);
      if (window.Profil) window.Profil.ciz();
    }
  }

  /* ---------- rutin içerik ---------- */
  function icerikHTML(id) {
    switch (id) {
      case "olumlama": return `<p class="gr-olumlama">“${esc(pickByDate(DATA.geceOlumlamalari))}”</p><button class="btn ghost sm gr-tamam">Hissettim ✦</button>`;
      case "nefes": return `<div class="nefes-orb" id="gr-nefes-orb"><span id="gr-nefes-yazi">Hazırlan</span></div><button class="btn ghost sm gr-tamam">Tamamladım ✦</button>`;
      case "meditasyon": return `<p class="muted small">174 Hz · Derin Gevşeme ile zihnini yatıştır.</p><button class="btn ghost sm gr-cal" data-tip="ton" data-hz="174">▶ Meditasyonu Başlat</button>`;
      case "sukran": return `<div class="ekle-satir"><input type="text" id="gr-sukran-input" placeholder="Bugün neye şükrediyorsun?"/><button class="btn sm gr-sukran-ekle">Ekle</button></div>`;
      case "ruhhali": return `<div class="gr-mood" id="gr-mood"></div>`;
      case "frekans": return `<p class="muted small">Yağmur sesi ya da 528 Hz ile rahatla.</p><div class="gr-frek-btns"><button class="btn ghost sm gr-cal" data-tip="gurultu" data-alt="yagmur">🌧️ Yağmur</button><button class="btn ghost sm gr-cal" data-tip="ton" data-hz="528">528 Hz</button></div>`;
      default: return "";
    }
  }

  function nefesBaslat(orb, yazi) {
    if (nefesTimer) clearInterval(nefesTimer);
    const fazlar = [["Nefes Al", 4000, "al"], ["Tut", 7000, "tut"], ["Ver", 8000, "ver"]];
    let i = 0;
    const uygula = () => {
      const [ad, sure, sinif] = fazlar[i];
      yazi.textContent = ad;
      orb.className = "nefes-orb " + sinif;
      i = (i + 1) % fazlar.length;
    };
    uygula();
    nefesTimer = setInterval(uygula, 6300);
  }

  function icerikBagla(kart, id) {
    const tamamBtn = kart.querySelector(".gr-tamam");
    if (tamamBtn) tamamBtn.addEventListener("click", () => yap(id));

    if (id === "nefes") {
      const orb = kart.querySelector("#gr-nefes-orb"), yazi = kart.querySelector("#gr-nefes-yazi");
      if (orb && yazi) nefesBaslat(orb, yazi);
    }
    kart.querySelectorAll(".gr-cal").forEach(b => b.addEventListener("click", () => {
      const tip = b.dataset.tip;
      const track = tip === "ton" ? { tip: "ton", hz: Number(b.dataset.hz) } : { tip: "gurultu", alt: b.dataset.alt };
      geceCal(track);
      kart.querySelectorAll(".gr-cal").forEach(x => x.classList.remove("aktif"));
      b.classList.add("aktif");
      yap(id);
    }));
    const sukBtn = kart.querySelector(".gr-sukran-ekle");
    if (sukBtn) sukBtn.addEventListener("click", () => {
      const inp = kart.querySelector("#gr-sukran-input"); const v = (inp.value || "").trim();
      if (!v) { inp.focus(); return; }
      const notlar = Store.get("gratitude", []); notlar.push({ text: v, tarih: bugun() }); Store.set("gratitude", notlar);
      inp.value = ""; yap(id);
      ["Enerji", "Bahce", "Profil"].forEach(m => { if (window[m]) window[m].ciz(); });
    });
    const moodKutu = kart.querySelector("#gr-mood");
    if (moodKutu && typeof MOOD_LIST !== "undefined") {
      const secili = (typeof moodKeyNormalize === "function") ? moodKeyNormalize(Store.get("mood-" + bugun())) : null;
      MOOD_LIST.forEach(m => {
        const b = document.createElement("button");
        b.className = "gr-mood-btn" + (secili === m.key ? " aktif" : "");
        b.title = m.label; b.innerHTML = moodSvg(m.key);
        b.addEventListener("click", () => {
          Store.set("mood-" + bugun(), m.key);
          moodKutu.querySelectorAll(".gr-mood-btn").forEach(x => x.classList.remove("aktif"));
          b.classList.add("aktif");
          yap(id);
          ["Enerji", "Bahce", "Profil", "Cakra", "Kader", "EnerjiTipi"].forEach(md => { if (window[md]) window[md].ciz(); });
        });
        moodKutu.appendChild(b);
      });
    }
  }

  function cizRutin() {
    const kutu = $("gece-rutin");
    kutu.innerHTML = "";
    RUTIN.forEach(it => {
      const done = yapildiMi(it.id);
      const kart = document.createElement("div");
      kart.className = "gece-kart gece-rutin-kart" + (done ? " yapildi" : "");
      kart.innerHTML = `
        <button class="gr-bas">
          <span class="gr-ikon">${it.ikon}</span>
          <span class="gr-ad">${esc(it.ad)}</span>
          <span class="gr-check">${done ? "✓" : "○"}</span>
        </button>
        <div class="gr-icerik" hidden>${icerikHTML(it.id)}</div>`;
      const bas = kart.querySelector(".gr-bas");
      const ic = kart.querySelector(".gr-icerik");
      bas.addEventListener("click", () => {
        const acik = ic.hidden;
        ic.hidden = !acik;
        if (acik && !ic.dataset.bagli) { icerikBagla(kart, it.id); ic.dataset.bagli = "1"; }
        if (!acik && it.id === "nefes" && nefesTimer) { clearInterval(nefesTimer); nefesTimer = null; }
      });
      kutu.appendChild(kart);
    });
  }

  function guncelleDurum() {
    const y = yapilanlar();
    document.querySelectorAll("#gece-rutin .gece-rutin-kart").forEach((kart, i) => {
      const id = RUTIN[i].id, done = y.includes(id);
      kart.classList.toggle("yapildi", done);
      const ch = kart.querySelector(".gr-check"); if (ch) ch.textContent = done ? "✓" : "○";
    });
    $("gece-ilerleme-dolu").style.width = (y.length / RUTIN.length * 100) + "%";
    if (y.length >= RUTIN.length) {
      const t = $("gece-tamam");
      t.hidden = false;
      t.innerHTML = `✨ Gece rutinini tamamladın. İyi uykular ${(Store.get("profil", {}).isim || "").trim() || ""} 🌙`;
    }
    const s = $("gece-streak");
    if (s) { const seri = (typeof mevcutSeri === "function") ? mevcutSeri("gece-") : 0; s.textContent = seri > 0 ? `🌙 ${seri} gece üst üste` : "İlk gece rutinini başlat 🌙"; }
  }

  /* ---------- uyku sayacı ---------- */
  function sayacBaslat(dk) {
    sayacDurdur();
    sayacKalan = dk * 60;
    const durum = $("gece-sayac-durum");
    durum.textContent = `Uyku sayacı: ${dk}:00 (durdurmak için tekrar dokun)`;
    sayacTimer = setInterval(() => {
      sayacKalan--;
      if (sayacKalan <= 0) {
        sayacDurdur(); geceSesDurdur();
        durum.textContent = "İyi uykular 🌙";
        return;
      }
      const m = Math.floor(sayacKalan / 60), s = sayacKalan % 60;
      durum.textContent = `Uyku sayacı: ${m}:${String(s).padStart(2, "0")}`;
    }, 1000);
  }
  function sayacDurdur() { if (sayacTimer) { clearInterval(sayacTimer); sayacTimer = null; } }

  /* ---------- aç/kapat ---------- */
  function ac() {
    const ov = $("gece-overlay");
    document.body.classList.add("gece-aktif");
    const isim = (Store.get("profil", {}).isim || "").trim();
    $("gece-baslik").textContent = isim ? `İyi geceler ${isim}` : "İyi geceler";
    $("gece-mesaj").textContent = pickByDate(DATA.geceMesajlari);
    $("gece-tamam").hidden = true;
    cizRutin();
    guncelleDurum();
    $("gece-soru").value = Store.get("gece-soru-" + bugun(), "");
    ov.hidden = false;
    ov.classList.remove("gor"); void ov.offsetWidth; ov.classList.add("gor");
  }
  function kapat() {
    const ov = $("gece-overlay");
    ov.classList.remove("gor");
    sayacDurdur(); geceSesDurdur();
    if (nefesTimer) { clearInterval(nefesTimer); nefesTimer = null; }
    setTimeout(() => { ov.hidden = true; document.body.classList.remove("gece-aktif"); }, 450);
    if (window.Streak) window.Streak.ciz();
    girisGuncelle();
  }

  /* Ana ekrandaki giriş kartı streak'i */
  function girisGuncelle() {
    const el = $("gg-streak");
    if (!el) return;
    const seri = (typeof mevcutSeri === "function") ? mevcutSeri("gece-") : 0;
    el.textContent = seri > 0 ? `🌙 ${seri} gece üst üste` : "Uyku öncesi huzurlu bir rutin";
  }

  /* ---------- yıldızlar ---------- */
  function yildizDoldur() {
    const k = $("gece-yildizlar");
    if (!k || k.dataset.dolu) return;
    let s = "";
    for (let i = 0; i < 40; i++) {
      s += `<span style="left:${(Math.random() * 100).toFixed(1)}%;top:${(Math.random() * 100).toFixed(1)}%;width:${(1 + Math.random() * 2.5).toFixed(1)}px;height:${(1 + Math.random() * 2.5).toFixed(1)}px;animation-delay:${(Math.random() * 4).toFixed(2)}s"></span>`;
    }
    k.innerHTML = s; k.dataset.dolu = "1";
  }

  function baglan() {
    const ac1 = $("gece-ac");
    if (ac1) ac1.addEventListener("click", ac);
    if (!$("gece-overlay")) { girisGuncelle(); return; }
    yildizDoldur();
    $("gece-kapat").addEventListener("click", kapat);
    $("gece-bitir").addEventListener("click", kapat);
    $("gece-soru-kaydet").addEventListener("click", () => {
      Store.set("gece-soru-" + bugun(), ($("gece-soru").value || "").trim());
      const b = $("gece-soru-kaydet"); b.textContent = "Kaydedildi ✓"; setTimeout(() => b.textContent = "Kaydet", 1800);
    });
    document.querySelectorAll(".gece-sayac-btns button").forEach(b => b.addEventListener("click", () => {
      if (sayacTimer) { sayacDurdur(); $("gece-sayac-durum").textContent = "Sayaç durduruldu."; }
      else sayacBaslat(Number(b.dataset.dk));
    }));
    girisGuncelle();
  }

  document.addEventListener("DOMContentLoaded", baglan);
  return { ac, kapat };
})();
