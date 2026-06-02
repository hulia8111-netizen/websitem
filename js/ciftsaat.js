/* ============================================================
   ciftsaat.js — Çift (Ayna) Saat Anlamları ⏰✨
   Güncel saati izler; HH:MM eşit olduğunda (11:11, 22:22…) kozmik
   glow popup ile spiritüel mesaj + farkındalık + olumlama gösterir.
   Anlam kütüphanesi, favoriler, görülme geçmişi ve bildirim entegrasyonu.
   Widget altyapısı için window.CiftSaat API'si sunar.
   Global: window.CiftSaat
   ============================================================ */

const CiftSaat = window.CiftSaat = (() => {
  const $ = sel => document.querySelector(sel);
  const FAV = "ciftsaat-fav";
  const GECMIS = "ciftsaat-gecmis";
  let sonDakika = null;

  function ikiHane(n) { return String(n).padStart(2, "0"); }
  function suanHHMM(d = new Date()) { return ikiHane(d.getHours()) + ":" + ikiHane(d.getMinutes()); }
  function aynaMi(d = new Date()) { return d.getHours() === d.getMinutes(); }

  /* ---------- veri / API ---------- */
  function anlam(saat) {
    return (DATA.ciftSaatler || []).find(x => x.saat === saat)
      || Object.assign({ saat }, DATA.ciftSaatGenel);
  }
  function suankiAnlam() { return aynaMi() ? anlam(suanHHMM()) : null; }
  function sonGorulen() { const g = gecmisAl(); return g.length ? g[0] : null; }

  function favAl() { return Store.get(FAV, []); }
  function favYaz(l) { Store.set(FAV, l); }
  function favMi(saat) { return favAl().includes(saat); }
  function favToggle(saat) {
    const l = favAl(); const i = l.indexOf(saat);
    if (i >= 0) l.splice(i, 1); else l.push(saat);
    favYaz(l); return favMi(saat);
  }
  function gecmisAl() { return Store.get(GECMIS, []); }
  function gecmisEkle(saat) {
    const g = gecmisAl();
    g.unshift({ saat, ts: Date.now() });
    while (g.length > 50) g.pop();
    Store.set(GECMIS, g);
  }

  /* ---------- popup ---------- */
  function popupAc(saat, gecmiseEkle) {
    const a = anlam(saat);
    $("#cs-saat").textContent = saat;
    $("#cs-mesaj").textContent = a.mesaj;
    $("#cs-yorum").textContent = a.yorum;
    $("#cs-olumlama").textContent = "“" + a.olumlama + "”";
    const favBtn = $("#cs-fav");
    favBtn.classList.toggle("aktif", favMi(saat));
    favBtn.onclick = () => { favToggle(saat); favBtn.classList.toggle("aktif", favMi(saat)); cizFavGecmis(); cizGrid(); };
    const pop = $("#cs-popup");
    pop.hidden = false;
    pop.classList.remove("gor"); void pop.offsetWidth; pop.classList.add("gor");
    if (gecmiseEkle) { gecmisEkle(saat); cizFavGecmis(); }
  }
  function popupKapat() { const p = $("#cs-popup"); p.classList.remove("gor"); setTimeout(() => { p.hidden = true; }, 350); }

  /* ---------- algılama ---------- */
  function kontrol() {
    const now = new Date();
    const t = suanHHMM(now);
    const canli = $("#cs-canli");
    if (canli) canli.textContent = t;

    if (aynaMi(now)) {
      if (sonDakika !== t) {
        sonDakika = t;
        gecmisEkle(t);
        cizFavGecmis();
        if (document.visibilityState === "visible") {
          popupAc(t, false);
        } else if (window.Bildirim && window.Bildirim.tetikle) {
          const a = anlam(t);
          window.Bildirim.tetikle(`${t} ✨ ${a.mesaj}`);  // arka planda OS bildirimi
        }
      }
    } else if (now.getMinutes() !== Number(sonDakika && sonDakika.slice(3))) {
      sonDakika = null; // farklı dakikaya geçince sıfırla
    }
  }

  /* ---------- kart UI ---------- */
  function cizGrid() {
    const grid = $("#cs-grid");
    if (!grid) return;
    grid.innerHTML = "";
    (DATA.ciftSaatler || []).forEach(x => {
      const b = document.createElement("button");
      b.className = "cs-cip" + (favMi(x.saat) ? " fav" : "");
      b.innerHTML = `${x.saat}${favMi(x.saat) ? " ★" : ""}`;
      b.addEventListener("click", () => popupAc(x.saat, false));
      grid.appendChild(b);
    });
  }
  function cizFavGecmis() {
    const favEl = $("#cs-fav-liste");
    const gecEl = $("#cs-gecmis-liste");
    if (favEl) {
      const f = favAl();
      favEl.innerHTML = `<p class="cs-alt-baslik">Favori Saatler</p>` + (f.length
        ? `<div class="cs-mini-grid">${f.map(s => `<button class="cs-cip fav" data-s="${s}">${s} ★</button>`).join("")}</div>`
        : `<p class="muted small">Henüz favori saat yok.</p>`);
      favEl.querySelectorAll("[data-s]").forEach(b => b.addEventListener("click", () => popupAc(b.dataset.s, false)));
    }
    if (gecEl) {
      const g = gecmisAl().slice(0, 12);
      gecEl.innerHTML = `<p class="cs-alt-baslik">Son Görülenler</p>` + (g.length
        ? `<div class="cs-mini-grid">${g.map(x => `<button class="cs-cip" data-s="${x.saat}">${x.saat}</button>`).join("")}</div>`
        : `<p class="muted small">Henüz çift saat yakalamadın.</p>`);
      gecEl.querySelectorAll("[data-s]").forEach(b => b.addEventListener("click", () => popupAc(b.dataset.s, false)));
    }
  }

  function baglan() {
    if (!$("#ciftsaat")) return;
    const kapat = $("#cs-kapat");
    if (kapat) kapat.addEventListener("click", popupKapat);
    const pop = $("#cs-popup");
    if (pop) pop.addEventListener("click", e => { if (e.target === pop) popupKapat(); });
    cizGrid();
    cizFavGecmis();
    kontrol();
    setInterval(kontrol, 1000);
  }

  document.addEventListener("DOMContentLoaded", baglan);

  /* Widget altyapısı: dış kullanım için API */
  return { anlam, suankiAnlam, sonGorulen, suanHHMM, aynaMi, favAl, gecmisAl };
})();
