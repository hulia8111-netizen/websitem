/* ============================================================
   takvim.js — Spiritüel Takvim & Özel Günler 📅✨
   Aylık kozmik takvim: dolunay/yeni ay (gerçek zamanlı hesaplanır),
   Merkür retrosu, enerji geçişleri, farkındalık günleri ve kullanıcının
   kendi ritüel günleri. Her gün için enerji yorumu + önerilen ritüel +
   meditasyon + günlük olumlama. Ritüel hatırlatmaları bildirim sistemiyle
   entegre; bugünün enerji kartıyla bağlantılı çalışır.
   Global: window.Takvim
   ============================================================ */

const Takvim = window.Takvim = (() => {
  const $ = id => document.getElementById(id);
  function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

  const OZEL = "takvim-ozel";          // kullanıcının özel günleri
  const BLOG = "takvim-bildirim-log";  // hatırlatma tekrarını önle

  const AY_ADLARI = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  const GUN_KISA = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

  let goster = (() => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d; })();
  let secili = null; // 'YYYY-MM-DD'

  function iki(n) { return String(n).padStart(2, "0"); }
  function key(d) { return d.getFullYear() + "-" + iki(d.getMonth() + 1) + "-" + iki(d.getDate()); }

  /* ---------- ay fazı tespiti (ay.js'nin fraz fonksiyonuyla) ---------- */
  function ayFazi(d) {
    if (typeof AyEvresi === "undefined" || !AyEvresi.fraz) return null;
    const noon = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12);
    const pv = new Date(noon); pv.setDate(noon.getDate() - 1);
    const nx = new Date(noon); nx.setDate(noon.getDate() + 1);
    const f = AyEvresi.fraz(noon), fp = AyEvresi.fraz(pv), fn = AyEvresi.fraz(nx);
    const dnew = x => Math.min(x, 1 - x); // 0/1'e (yeni ay) uzaklık
    const dful = x => Math.abs(x - 0.5);  // 0.5'e (dolunay) uzaklık
    const TH = 0.02; // ~yarım gün penceresi
    if (dnew(f) < TH && dnew(f) <= dnew(fp) && dnew(f) <= dnew(fn)) return "yeniay";
    if (dful(f) < TH && dful(f) <= dful(fp) && dful(f) <= dful(fn)) return "dolunay";
    return null;
  }

  /* ---------- olay derleme ---------- */
  function retroMu(d) { const k = key(d); return (DATA.merkurRetro || []).some(r => k >= r.bas && k <= r.bit); }
  function sabitGunler(d) { return (DATA.spirituelGunler || []).filter(x => x.ay === d.getMonth() + 1 && x.gun === d.getDate()); }
  function ozelAl() { return Store.get(OZEL, []) || []; }
  function ozelGunler(k) { return ozelAl().filter(x => x.tarih === k); }

  /* Bir güne ait tüm olaylar (birleştirilmiş içerikle) */
  function olaylar(d) {
    const k = key(d), out = [];
    const faz = ayFazi(d);
    if (faz) out.push(Object.assign({}, DATA.takvimTipleri[faz], { tip: faz }));
    if (retroMu(d)) out.push(Object.assign({}, DATA.takvimTipleri.retro, { tip: "retro" }));
    sabitGunler(d).forEach(s => out.push(Object.assign({}, DATA.takvimTipleri[s.tip] || {}, s)));
    ozelGunler(k).forEach(o => {
      const base = DATA.takvimTipleri[o.tip] || DATA.takvimTipleri.kisisel;
      out.push(Object.assign({}, base, { baslik: o.baslik, mesaj: o.not || base.mesaj, ozelId: o.id, tip: o.tip || "kisisel" }));
    });
    return out;
  }

  /* ---------- takvim ızgarası ---------- */
  function cizHaftalik() {
    const h = $("tk-haftalik"); if (!h) return;
    h.innerHTML = GUN_KISA.map(g => `<span>${g}</span>`).join("");
  }
  function cizGrid() {
    const grid = $("tk-grid"); if (!grid) return;
    const adEl = $("tk-ay-ad"); if (adEl) adEl.textContent = `${AY_ADLARI[goster.getMonth()]} ${goster.getFullYear()}`;
    grid.innerHTML = "";
    const ilk = new Date(goster.getFullYear(), goster.getMonth(), 1);
    const bas = (ilk.getDay() + 6) % 7; // Pazartesi = 0
    const gunSay = new Date(goster.getFullYear(), goster.getMonth() + 1, 0).getDate();
    const bugunK = key(new Date());
    for (let i = 0; i < bas; i++) { const e = document.createElement("div"); e.className = "tk-bos"; grid.appendChild(e); }
    for (let g = 1; g <= gunSay; g++) {
      const d = new Date(goster.getFullYear(), goster.getMonth(), g);
      const k = key(d);
      const evs = olaylar(d);
      const cell = document.createElement("button");
      cell.className = "tk-gun" + (k === bugunK ? " bugun" : "") + (evs.length ? " olayli" : "") + (k === secili ? " secili" : "");
      if (evs[0] && evs[0].renk) cell.style.setProperty("--renk", evs[0].renk);
      const ikonlar = evs.slice(0, 3).map(e => `<span>${e.ikon}</span>`).join("");
      cell.innerHTML = `<span class="tk-gun-no">${g}</span><span class="tk-gun-ikon">${ikonlar}</span>`;
      cell.addEventListener("click", () => { secili = k; cizGrid(); cizDetay(d); });
      grid.appendChild(cell);
    }
  }

  /* ---------- gün detayı ---------- */
  function cizDetay(d) {
    const el = $("tk-detay"); if (!el) return;
    const k = key(d);
    const evs = olaylar(d);
    const tarihStr = d.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" });
    let html = `<h3 class="tk-detay-tarih">${tarihStr}</h3>`;
    if (k === key(new Date()) && window.Enerji && Enerji.hesapla) {
      html += `<button class="tk-enerji" id="tk-enerji-link">Bugünkü enerjin: <b>%${Enerji.hesapla()}</b> ✨ <span class="muted small">— ana sayfada gör</span></button>`;
    }
    if (evs.length) {
      html += evs.map(e => `
        <div class="tk-olay" style="--renk:${e.renk || 'var(--accent)'}">
          <div class="tk-olay-bas"><span class="tk-olay-ikon">${e.ikon || "✨"}</span><b>${esc(e.baslik || e.ad || "")}</b>${e.ozelId ? `<button class="tk-sil" data-sil="${e.ozelId}" aria-label="Sil">✕</button>` : ""}</div>
          <p class="tk-olay-mesaj">${esc(e.mesaj || "")}</p>
          ${e.rituel ? `<div class="tk-sat"><span class="tk-et">Ritüel</span><span>${esc(e.rituel)}</span></div>` : ""}
          ${e.meditasyon ? `<div class="tk-sat"><span class="tk-et">Meditasyon</span><span>${esc(e.meditasyon)}</span></div>` : ""}
          ${e.olumlama ? `<div class="tk-olumlama">“${esc(e.olumlama)}”</div>` : ""}
        </div>`).join("");
    } else {
      html += `<p class="muted small tk-bos-mesaj">Bu gün için özel bir enerji işareti yok. Aşağıdan kendi ritüel gününü ekleyebilirsin ✨</p>`;
    }
    el.innerHTML = html;
    el.classList.remove("tk-fade"); void el.offsetWidth; el.classList.add("tk-fade");
    el.querySelectorAll("[data-sil]").forEach(b => b.addEventListener("click", () => { ozelSil(b.dataset.sil); cizGrid(); cizDetay(d); }));
    const enLink = $("tk-enerji-link");
    if (enLink) enLink.addEventListener("click", () => { kapat(); if (window.gotoView) window.gotoView("home"); const en = document.getElementById("enerji"); if (en) setTimeout(() => en.scrollIntoView({ behavior: "smooth", block: "center" }), 450); });
    const di = $("tk-ekle-tarih"); if (di) di.value = k;
  }

  /* ---------- özel gün ekle/sil ---------- */
  function ozelEkle() {
    const tarih = ($("tk-ekle-tarih").value || key(new Date()));
    const baslik = ($("tk-ekle-baslik").value || "").trim();
    if (!baslik) { $("tk-ekle-baslik").focus(); return; }
    const not = ($("tk-ekle-not").value || "").trim();
    const tip = $("tk-ekle-tip").value || "kisisel";
    const hatirlat = $("tk-ekle-hatirlat").checked;
    const saat = $("tk-ekle-saat").value || "09:00";
    const liste = ozelAl();
    liste.push({ id: "t" + Date.now().toString(36) + Math.floor(Math.random() * 99), tarih, baslik, not, tip, hatirlatSaat: hatirlat ? saat : "" });
    Store.set(OZEL, liste);
    $("tk-ekle-baslik").value = ""; $("tk-ekle-not").value = "";
    const det = document.querySelector(".tk-ekle-detay"); if (det) det.open = false;
    // eklenen ayın görünümüne geç ve o günü seç
    const d = new Date(tarih + "T00:00:00");
    goster = new Date(d.getFullYear(), d.getMonth(), 1);
    secili = tarih;
    cizGrid(); cizDetay(d); girisGuncelle();
    if (window.Bildirim) Bildirim.tetikle(`📅 “${baslik}” takvimine eklendi ✨`, true);
  }
  function ozelSil(id) {
    Store.set(OZEL, ozelAl().filter(x => x.id !== id));
    girisGuncelle();
  }

  /* ---------- ritüel hatırlatmaları (bildirim entegrasyonu) ---------- */
  function bildirimKontrol() {
    if (!window.Bildirim || !Bildirim.tetikle) return;
    const now = new Date();
    const k = key(now);
    const hh = iki(now.getHours()) + ":" + iki(now.getMinutes());
    const log = Store.get(BLOG, {}) || {};
    let degisti = false;
    ozelGunler(k).forEach(o => {
      if (o.hatirlatSaat && o.hatirlatSaat === hh && log[o.id] !== k) {
        log[o.id] = k; degisti = true;
        Bildirim.tetikle(`📅 ${o.baslik} · ritüel zamanı ✨`, false);
      }
    });
    if (degisti) Store.set(BLOG, log);
  }

  /* ---------- araç kutusu altyazısı ---------- */
  function girisGuncelle() {
    const el = $("tk-alt"); if (!el) return;
    const evs = olaylar(new Date());
    el.textContent = evs.length ? `${evs[0].ikon} ${evs[0].baslik || evs[0].ad}` : "";
  }

  /* ---------- açıklama (legend) ---------- */
  function cizLegend() {
    const el = $("tk-aciklama"); if (!el || !DATA.takvimTipleri) return;
    el.innerHTML = Object.values(DATA.takvimTipleri)
      .map(t => `<span class="tk-lg"><span class="tk-lg-ikon">${t.ikon}</span>${t.ad}</span>`).join("");
  }

  /* ---------- aç / kapat ---------- */
  function ac() {
    const today = new Date();
    goster = new Date(today.getFullYear(), today.getMonth(), 1);
    secili = key(today);
    cizHaftalik(); cizLegend(); cizGrid(); cizDetay(today);
    const ov = $("takvim-overlay");
    document.body.classList.add("takvim-mod");
    ov.hidden = false; ov.classList.remove("gor"); void ov.offsetWidth; ov.classList.add("gor");
  }
  function kapat() {
    const ov = $("takvim-overlay");
    ov.classList.remove("gor");
    setTimeout(() => { ov.hidden = true; document.body.classList.remove("takvim-mod"); }, 400);
    girisGuncelle();
  }

  function baglan() {
    const acBtn = $("takvim-ac");
    if (acBtn) acBtn.addEventListener("click", ac);
    girisGuncelle();
    // hatırlatma zamanlayıcısı her durumda çalışsın
    setInterval(bildirimKontrol, 30000);
    setTimeout(bildirimKontrol, 4000);
    if (!$("takvim-overlay")) return;
    $("takvim-kapat").addEventListener("click", kapat);
    $("takvim-overlay").addEventListener("click", e => { if (e.target === $("takvim-overlay")) kapat(); });
    $("tk-onceki").addEventListener("click", () => { goster.setMonth(goster.getMonth() - 1); cizGrid(); });
    $("tk-sonraki").addEventListener("click", () => { goster.setMonth(goster.getMonth() + 1); cizGrid(); });
    $("tk-ekle-btn").addEventListener("click", ozelEkle);
  }

  document.addEventListener("DOMContentLoaded", baglan);
  return { ac, kapat, olaylar, bugununBilgisi: () => olaylar(new Date()) };
})();
