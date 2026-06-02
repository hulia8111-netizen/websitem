/* ============================================================
   magaza.js — Spiritüel Mağaza / Keşfet Alanı 🛍️✨
   Kategorili premium ürün vitrini: filtre, favoriler, "Bugün önerilen
   ürün", ürün detay popup'ı ve dış bağlantı (Shopier/yayınevi) entegrasyonu.
   Global: window.Magaza
   ============================================================ */

const Magaza = window.Magaza = (() => {
  const $ = sel => document.querySelector(sel);
  let filtre = "hepsi";   // "hepsi" | kategori id | "favori"

  function urunById(id) { return DATA.magazaUrunleri.find(u => u.id === id); }
  function katAd(id) { const k = DATA.magazaKategorileri.find(x => x.id === id); return k ? k.ad : id; }
  function favAl() { return Store.get("magaza-fav", []); }
  function favMi(id) { return favAl().includes(id); }
  function favToggle(id) { const l = favAl(); const i = l.indexOf(id); if (i >= 0) l.splice(i, 1); else l.push(id); Store.set("magaza-fav", l); }

  function grad(u) { const r = u.renk || ["#3a2a6d", "#160f33"]; return `linear-gradient(140deg, ${r[0]}, ${r[1]})`; }

  function favSvg() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20s-7-4.35-7-9a4 4 0 0 1 7-2.65A4 4 0 0 1 19 11c0 4.65-7 9-7 9z"/></svg>';
  }

  /* ---------- öneri ---------- */
  function cizOneri() {
    const kutu = $("#magaza-oneri");
    if (!kutu) return;
    const u = pickByDate(DATA.magazaUrunleri);
    kutu.innerHTML = `
      <div class="mo-et">Bugün önerilen ürün</div>
      <div class="magaza-oneri-ic">
        <div class="moi-gorsel" style="background:${grad(u)}"><span>${u.ikon}</span></div>
        <div class="moi-bilgi">
          <div class="moi-ad">${escapeHtml(u.ad)}</div>
          <div class="moi-aciklama">${escapeHtml(u.aciklama)}</div>
          <button class="btn sm" data-id="${u.id}">Keşfet ✦</button>
        </div>
      </div>`;
    kutu.querySelector("[data-id]").addEventListener("click", () => popupAc(u.id));
  }

  /* ---------- filtre çipleri ---------- */
  function cizKategoriler() {
    const kutu = $("#magaza-kat");
    if (!kutu) return;
    kutu.innerHTML = "";
    const ekle = (id, etiket) => {
      const b = document.createElement("button");
      b.className = "kat-btn" + (filtre === id ? " aktif" : "");
      b.textContent = etiket;
      b.addEventListener("click", () => { filtre = id; cizKategoriler(); cizGrid(); });
      kutu.appendChild(b);
    };
    ekle("hepsi", "Tümü");
    DATA.magazaKategorileri.forEach(k => ekle(k.id, k.ikon + " " + k.ad));
    ekle("favori", "♥ Favoriler");
  }

  /* ---------- ürün grid ---------- */
  function listele() {
    if (filtre === "hepsi") return DATA.magazaUrunleri;
    if (filtre === "favori") return DATA.magazaUrunleri.filter(u => favMi(u.id));
    return DATA.magazaUrunleri.filter(u => u.kategori === filtre);
  }
  function cizGrid() {
    const grid = $("#magaza-grid");
    if (!grid) return;
    const liste = listele();
    grid.innerHTML = "";
    if (!liste.length) { grid.innerHTML = `<p class="muted small">Bu bölümde ürün yok.</p>`; return; }
    liste.forEach(u => {
      const el = document.createElement("article");
      el.className = "urun2";
      el.innerHTML = `
        <div class="urun2-gorsel" style="background:${grad(u)}">
          <span class="u2-ikon">${u.ikon}</span>
          <button class="u2-fav${favMi(u.id) ? " aktif" : ""}" aria-label="Favori">${favSvg()}</button>
        </div>
        <div class="urun2-govde">
          <h4>${escapeHtml(u.ad)}</h4>
          <div class="u2-fiyat">${escapeHtml(u.fiyat || "")}</div>
          <button class="btn sm u2-kesfet">Keşfet →</button>
        </div>`;
      el.querySelector(".u2-fav").addEventListener("click", e => { e.stopPropagation(); favToggle(u.id); cizGrid(); });
      el.querySelector(".u2-kesfet").addEventListener("click", () => popupAc(u.id));
      el.querySelector(".urun2-gorsel").addEventListener("click", () => popupAc(u.id));
      grid.appendChild(el);
    });
  }

  /* ---------- detay popup ---------- */
  function popupAc(id) {
    const u = urunById(id);
    if (!u) return;
    $("#up-gorsel").style.background = grad(u);
    $("#up-gorsel").innerHTML = `<span>${u.ikon}</span>`;
    $("#up-kat").textContent = katAd(u.kategori);
    $("#up-ad").textContent = u.ad;
    $("#up-fiyat").textContent = u.fiyat || "";
    $("#up-aciklama").textContent = u.aciklama;
    const link = $("#up-link");
    link.href = u.link || "#";
    const favBtn = $("#up-fav");
    favBtn.classList.toggle("aktif", favMi(u.id));
    favBtn.onclick = () => { favToggle(u.id); favBtn.classList.toggle("aktif", favMi(u.id)); cizGrid(); };
    const pop = $("#urun-popup");
    pop.hidden = false;
    pop.classList.remove("gor"); void pop.offsetWidth; pop.classList.add("gor");
  }
  function popupKapat() { const p = $("#urun-popup"); p.classList.remove("gor"); setTimeout(() => { p.hidden = true; }, 350); }

  function baglan() {
    if (!$("#magaza-grid")) return;
    const kapat = $("#up-kapat");
    if (kapat) kapat.addEventListener("click", popupKapat);
    const pop = $("#urun-popup");
    if (pop) pop.addEventListener("click", e => { if (e.target === pop) popupKapat(); });
    cizOneri();
    cizKategoriler();
    cizGrid();
  }

  document.addEventListener("DOMContentLoaded", baglan);
  return { popupAc };
})();
