/* ============================================================
   muzik.js — Spiritüel Müzik & Frekans Alanı 🎵✨
   SesMotoru üzerine kurulu premium çalar: kategoriler, parça listesi,
   play/pause, süre, volume, otomatik geçiş, favoriler, "Bugün önerilen
   frekans", ruh haline göre öneri ve AI rehber entegrasyonu.
   Meditasyon takibi (med-<gün> + med-sure-sn) burada yapılır.
   Global: window.Muzik (+ window.setMeditasyonKategori)
   ============================================================ */

const Muzik = window.Muzik = (() => {
  const $ = sel => document.querySelector(sel);
  let aktifKat = (DATA.muzikKategorileri[0] || {}).id;
  let calan = null, calityor = false, ilerlemeTimer = null, medBaslangic = null;

  /* ---------- veri ---------- */
  function tracksOf(kat) { return DATA.frekansAlani.filter(t => t.kategori === kat); }
  function trackById(id) { return DATA.frekansAlani.find(t => t.id === id); }
  function katAd(id) { const k = DATA.muzikKategorileri.find(x => x.id === id); return k ? k.ad : id; }
  function favAl() { return Store.get("muzik-fav", []); }
  function favMi(id) { return favAl().includes(id); }
  function favToggle(id) { const l = favAl(); const i = l.indexOf(id); if (i >= 0) l.splice(i, 1); else l.push(id); Store.set("muzik-fav", l); }

  function ikon(t) {
    if (t.tip === "ton") return "🎵";
    if (t.tip === "can") return "🔔";
    if (t.tip === "pad") return t.alt === "derin" ? "🧘" : t.alt === "disil" ? "🌹" : "🎧";
    return { yagmur: "🌧️", orman: "🌲", gece: "🌌" }[t.alt] || "✨";
  }
  function sureFmt(sn) { sn = Math.max(0, Math.floor(sn)); return Math.floor(sn / 60) + ":" + String(sn % 60).padStart(2, "0"); }

  /* ---------- meditasyon takibi ---------- */
  function medBasla() {
    if (medBaslangic === null) medBaslangic = Date.now();
    Store.set("med-" + todayKey(), true);
    if (window.Enerji) window.Enerji.ciz();
    if (window.Bahce) window.Bahce.ciz();
    if (window.Streak) window.Streak.ciz();
    if (window.Profil) window.Profil.ciz();
  }
  function medBitir() {
    if (medBaslangic === null) return;
    const sn = Math.round((Date.now() - medBaslangic) / 1000);
    medBaslangic = null;
    if (sn > 0 && sn < 7200) Store.set("med-sure-sn", (Store.get("med-sure-sn", 0) || 0) + sn);
    if (window.Profil) window.Profil.ciz();
  }

  /* ---------- çalma ---------- */
  function cal(track) {
    SesMotoru.cal(track);
    calan = track; calityor = true;
    medBasla();
    playerGuncelle();
    ilerlemeBaslat();
  }
  function durdur() {
    SesMotoru.durdur(); calityor = false; medBitir();
    ilerlemeDur(); playerGuncelle();
  }
  function toggle() { if (!calan) return; calityor ? durdur() : cal(calan); }
  function komsu(yon) {
    if (!calan) return;
    const liste = tracksOf(calan.kategori);
    let i = liste.findIndex(t => t.id === calan.id);
    i = (i + yon + liste.length) % liste.length;
    cal(liste[i]);
  }
  function ilerlemeDur() { if (ilerlemeTimer) { clearInterval(ilerlemeTimer); ilerlemeTimer = null; } }
  function ilerlemeBaslat() {
    ilerlemeDur();
    ilerlemeTimer = setInterval(() => {
      if (!calan) return;
      const g = SesMotoru.gecen(), top = calan.sure || 300;
      const dolu = $("#mp-dolu"), gecenEl = $("#mp-gecen"), topEl = $("#mp-toplam");
      if (dolu) dolu.style.width = Math.min(100, g / top * 100) + "%";
      if (gecenEl) gecenEl.textContent = sureFmt(g);
      if (topEl) topEl.textContent = sureFmt(top);
      if (g >= top) komsu(1);  // otomatik geçiş
    }, 500);
  }

  /* ---------- öneri ---------- */
  function onerilen() {
    const mood = (typeof moodKeyNormalize === "function") ? moodKeyNormalize(Store.get("mood-" + todayKey())) : null;
    const map = { great: "yuksekFrekans", good: "rahatlama", ok: "odak", low: "sifa", down: "uyku" };
    if (mood && map[mood]) { const l = tracksOf(map[mood]); if (l.length) return { track: pickByDate(l), sebep: "Ruh haline göre öneri" }; }
    // Spiritüel test sonucuna göre kişiselleştir
    const ts = Store.get("spiritest-sonuc", null);
    if (ts && DATA.spiriTest && DATA.spiriTest.sonuclar[ts.kat]) {
      const kat = DATA.spiriTest.sonuclar[ts.kat].meditasyonKategori;
      const l = tracksOf(kat);
      if (l.length) return { track: pickByDate(l), sebep: "Spiritüel profiline göre" };
    }
    return { track: pickByDate(DATA.frekansAlani), sebep: "Bugün önerilen frekans" };
  }

  /* ---------- render ---------- */
  function cizKategoriler() {
    const kutu = $("#muzik-kat"); if (!kutu) return;
    kutu.innerHTML = "";
    DATA.muzikKategorileri.forEach(k => {
      const b = document.createElement("button");
      b.className = "kat-btn" + (k.id === aktifKat ? " aktif" : "");
      b.textContent = k.ikon + " " + k.ad;
      b.addEventListener("click", () => { aktifKat = k.id; cizKategoriler(); cizListe(); });
      kutu.appendChild(b);
    });
  }
  function cizListe() {
    const ul = $("#muzik-liste"); if (!ul) return;
    ul.innerHTML = "";
    tracksOf(aktifKat).forEach(t => {
      const li = document.createElement("li");
      const calanMi = calan && calan.id === t.id && calityor;
      li.className = "muzik-sat" + (calanMi ? " caliyor" : "");
      li.innerHTML = `
        <button class="ms-cal" aria-label="Çal"><span class="ms-ikon">${ikon(t)}</span></button>
        <span class="ms-ad">${escapeHtml(t.ad)}</span>
        <button class="ms-fav${favMi(t.id) ? " aktif" : ""}" aria-label="Favori">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20s-7-4.35-7-9a4 4 0 0 1 7-2.65A4 4 0 0 1 19 11c0 4.65-7 9-7 9z"/></svg>
        </button>`;
      li.querySelector(".ms-cal").addEventListener("click", () => cal(t));
      li.querySelector(".ms-ad").addEventListener("click", () => cal(t));
      li.querySelector(".ms-fav").addEventListener("click", e => { e.stopPropagation(); favToggle(t.id); cizListe(); });
      ul.appendChild(li);
    });
  }
  function cizOneri() {
    const kutu = $("#muzik-oneri"); if (!kutu) return;
    const o = onerilen();
    kutu.innerHTML = `
      <div class="mo-et">${o.sebep}</div>
      <div class="mo-sat">
        <span class="mo-ikon">${ikon(o.track)}</span>
        <span class="mo-ad">${escapeHtml(o.track.ad)}</span>
        <button class="btn sm mo-cal">Dinle ✦</button>
      </div>`;
    kutu.querySelector(".mo-cal").addEventListener("click", () => cal(o.track));
  }
  function playerGuncelle() {
    const p = $("#muzik-player"); if (!p) return;
    p.hidden = !calan;
    if (!calan) return;
    $("#mp-ad").textContent = calan.ad;
    $("#mp-kat").textContent = katAd(calan.kategori);
    $("#mp-play").innerHTML = calityor
      ? '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="7" y="6" width="3.5" height="12" rx="1"/><rect x="13.5" y="6" width="3.5" height="12" rx="1"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
    p.classList.toggle("calityor", calityor);
    const favBtn = $("#mp-fav");
    favBtn.classList.toggle("aktif", favMi(calan.id));
    cizListe();
  }

  /* ---------- dışa açık (AI rehber) ---------- */
  function setKategori(id) {
    if (!DATA.muzikKategorileri.some(k => k.id === id)) return;
    aktifKat = id; cizKategoriler(); cizListe();
  }

  function baglan() {
    if (!$("#muzik-liste")) return;
    // volume
    const vol = $("#mp-vol");
    const kayitli = parseInt(Store.get("muzik-vol", 60), 10);
    if (vol) { vol.value = kayitli; vol.addEventListener("input", () => { SesMotoru.setVolume(vol.value / 100); Store.set("muzik-vol", parseInt(vol.value, 10)); }); }
    SesMotoru.setVolume(kayitli / 100);

    $("#mp-play").addEventListener("click", toggle);
    $("#mp-onceki").addEventListener("click", () => komsu(-1));
    $("#mp-sonraki").addEventListener("click", () => komsu(1));
    $("#mp-fav").addEventListener("click", () => { if (calan) { favToggle(calan.id); playerGuncelle(); } });

    cizKategoriler(); cizListe(); cizOneri(); playerGuncelle();
  }

  document.addEventListener("DOMContentLoaded", baglan);
  window.setMeditasyonKategori = setKategori;  // rehber.js entegrasyonu
  return { cal, setKategori, onerilen };
})();
