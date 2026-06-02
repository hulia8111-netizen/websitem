/* ============================================================
   kader.js — Kader Haritası / Günlük Spiritüel Rehber 🪐✨
   Her gün için kozmik bir oracle kartı: günün enerjisi, ruhsal tema,
   önerilen meditasyon + olumlama + kart, dikkat enerjisi ve mini ritüel.
   Ruh hali ve test sonucuna göre kişiselleşir. Flip ile açılır,
   favori + geçmiş tutar, AI rehber ve müzikle bağlantılı çalışır.
   Global: window.Kader
   ============================================================ */

const Kader = window.Kader = (() => {
  const $ = id => document.getElementById(id);

  const MOOD_TEMA = { great: "bolluk", good: "sevgi", ok: "denge", low: "arinis", down: "ice" };
  const TEST_TEMA = { sifa: "arinis", uyanis: "sezgi", denge: "denge", gucu: "guc", baslangic: "yenilenme", yukselis: "bolluk" };

  function temaById(id) { return DATA.kaderTemalari.find(t => t.id === id); }
  function kartBul(b) { return (DATA.kartlar || []).find(k => k.baslik === b); }
  function katAd(id) { const k = (DATA.muzikKategorileri || []).find(x => x.id === id); return k ? k.ad : id; }
  function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

  /* Günün teması — ruh hali > test sonucu > günlük rotasyon */
  function gununTema() {
    const today = todayKey();
    const mood = (typeof moodKeyNormalize === "function") ? moodKeyNormalize(Store.get("mood-" + today)) : null;
    if (mood && MOOD_TEMA[mood]) return temaById(MOOD_TEMA[mood]);
    const ts = Store.get("spiritest-sonuc", null);
    if (ts && TEST_TEMA[ts.kat]) return temaById(TEST_TEMA[ts.kat]);
    return pickByDate(DATA.kaderTemalari);
  }

  /* ---------- geçmiş & favori ---------- */
  function gecmisAl() { return Store.get("kader-gecmis", []); }
  function gecmisUpsert(t) {
    const g = gecmisAl();
    const v = { tarih: todayKey(), id: t.id, enerji: t.enerji };
    const i = g.findIndex(x => x.tarih === v.tarih);
    if (i >= 0) g[i] = v; else g.unshift(v);
    while (g.length > 60) g.pop();
    Store.set("kader-gecmis", g);
  }
  function favAl() { return Store.get("kader-fav", []); }
  function favMi(tarih) { return favAl().some(x => x.tarih === tarih); }
  function favToggle(t) {
    const l = favAl(); const tarih = todayKey();
    const i = l.findIndex(x => x.tarih === tarih);
    if (i >= 0) l.splice(i, 1); else l.unshift({ tarih, id: t.id, enerji: t.enerji });
    Store.set("kader-fav", l);
  }

  /* ---------- render ---------- */
  function acikIcerik(t) {
    const kart = kartBul(t.kartBaslik);
    return `
      <div class="kader-parcacik" id="kader-parcacik" aria-hidden="true"></div>
      <div class="kd-tema">${esc(t.tema)}</div>
      <h3 class="kd-enerji">${esc(t.enerji)}</h3>
      <div class="altin-divider"></div>
      <div class="kd-oneri olumlama"><span class="kd-et">Önerilen Olumlama</span><p>“${esc(t.olumlama)}”</p></div>
      <div class="kd-oneri"><span class="kd-et">Önerilen Meditasyon · ${esc(katAd(t.meditasyonKategori))}</span>
        <button class="btn ghost sm" data-go-med="${esc(t.meditasyonKategori)}">Meditasyona Git →</button></div>
      ${kart ? `<div class="kd-oneri"><span class="kd-et">Önerilen Kart</span>
        <div class="kd-kart"><img src="${encodeURI(kart.img)}" alt="${esc(kart.baslik)}" loading="lazy"/>
        <div><strong>${esc(kart.baslik)}</strong><p>${esc(kart.mesaj)}</p></div></div></div>` : ""}
      <div class="kd-oneri dikkat"><span class="kd-et">Dikkat Enerjisi</span><p>${esc(t.dikkat)}</p></div>
      <div class="kd-oneri"><span class="kd-et">Mini Ritüel</span><p>${esc(t.rituel)}</p></div>
      <div class="kd-aksiyon">
        <button class="kd-fav" id="kader-fav" aria-label="Favori">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20s-7-4.35-7-9a4 4 0 0 1 7-2.65A4 4 0 0 1 19 11c0 4.65-7 9-7 9z"/></svg>
        </button>
        <button class="btn ghost sm" id="kader-rehber">İçsel Rehber'e Sor</button>
      </div>`;
  }

  function olayBagla(t) {
    const med = $("kader-acik").querySelector("[data-go-med]");
    if (med) med.addEventListener("click", () => {
      if (typeof window.setMeditasyonKategori === "function") window.setMeditasyonKategori(med.dataset.goMed);
      if (typeof window.gotoView === "function") window.gotoView("meditasyon");
    });
    const fav = $("kader-fav");
    if (fav) {
      fav.classList.toggle("aktif", favMi(todayKey()));
      fav.addEventListener("click", () => { favToggle(t); fav.classList.toggle("aktif", favMi(todayKey())); cizGecmis(); });
    }
    const reh = $("kader-rehber");
    if (reh) reh.addEventListener("click", () => {
      if (typeof window.gotoView === "function") window.gotoView("home");
      const r = document.getElementById("rehber"); if (r) r.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  function parcacik() {
    const kutu = $("kader-parcacik");
    if (!kutu) return;
    let s = "";
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * 360, dist = 45 + Math.random() * 45;
      s += `<span style="--x:${(Math.cos(a * Math.PI / 180) * dist).toFixed(0)}px;--y:${(Math.sin(a * Math.PI / 180) * dist).toFixed(0)}px;animation-delay:${(Math.random() * 0.12).toFixed(2)}s"></span>`;
    }
    kutu.innerHTML = s;
    setTimeout(() => { if (kutu) kutu.innerHTML = ""; }, 1100);
  }

  function icerikYerlestir(t) {
    $("kader-acik").innerHTML = acikIcerik(t);
    olayBagla(t);
    gecmisUpsert(t);
    cizGecmis();
  }

  function ac() {
    const t = gununTema();
    const sahne = $("kader-flip");
    sahne.classList.remove("flip"); void sahne.offsetWidth; sahne.classList.add("flip");
    setTimeout(() => {
      $("kader-kapali").hidden = true;
      $("kader-acik").hidden = false;
      icerikYerlestir(t);
      parcacik();
    }, 220);
    Store.set("kader-acildi-" + todayKey(), true);
  }

  function cizGecmis() {
    const el = $("kader-gecmis-liste");
    if (!el) return;
    const fav = favAl();
    const g = gecmisAl().slice(0, 10);
    el.innerHTML =
      (fav.length ? `<p class="cs-alt-baslik">Favori Rehberler</p><div class="kader-mini">${fav.map(x => `<span class="kader-cip" title="${esc((temaById(x.id) || {}).tema || "")}">${x.tarih} ★</span>`).join("")}</div>` : "") +
      `<p class="cs-alt-baslik">Son Rehberler</p>` + (g.length
        ? `<ul class="liste">${g.map(x => `<li><span class="liste-metin"><small>${x.tarih}</small><br>${esc(x.enerji)}</span></li>`).join("")}</ul>`
        : `<p class="muted small">Henüz rehber açmadın.</p>`);
  }

  /* Açıksa içeriği güncel temaya göre yenile (ruh hali değişince) */
  function ciz() {
    if (!$("kader")) return;
    if (Store.get("kader-acildi-" + todayKey())) {
      $("kader-kapali").hidden = true;
      $("kader-acik").hidden = false;
      icerikYerlestir(gununTema());
    } else {
      cizGecmis();
    }
  }

  function baglan() {
    if (!$("kader")) return;
    const kapali = $("kader-kapali");
    if (Store.get("kader-acildi-" + todayKey())) {
      kapali.hidden = true;
      $("kader-acik").hidden = false;
      icerikYerlestir(gununTema());
    } else {
      kapali.addEventListener("click", ac);
      cizGecmis();
    }
  }

  document.addEventListener("DOMContentLoaded", baglan);
  return { ciz, gununTema };
})();
