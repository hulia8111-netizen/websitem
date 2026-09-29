/* ============================================================
   bildirimayar.js — Bildirim Ayarları 2.0 (3 kategori) 🔔
   ------------------------------------------------------------
   Tek sade kart, üç kategori:
     • Duyurular  (duyuru)
     • Topluluk   (topluluk)
     • Günün İlham Cümlesi (ilham) — hafta içi 12:00 / hafta sonu 16:00 sabit
       + kullanıcının seçtiği en fazla 2 ek saat (ilhamEkSaatler)
   Tercihler bildirim.js ile ortak "bildirim-ayar" anahtarında tutulur;
   değişince pushtoken.js buluttaki push_token satırını senkronlar.
   Global: window.BildirimAyar
   ============================================================ */

const BildirimAyar = window.BildirimAyar = (() => {
  const $ = s => document.querySelector(s);
  const AYAR = "bildirim-ayar";
  const destekVar = "Notification" in window;

  function ayarAl() { return Store.get(AYAR, {}) || {}; }
  function ayarYaz(a) {
    Store.set(AYAR, a);
    // Buluttaki tercihleri güncelle (native push için)
    if (window.PushToken && PushToken.tercihGuncelle) PushToken.tercihGuncelle();
  }

  /* ---------- izin ---------- */
  function izinDurum() { return destekVar ? Notification.permission : "yok"; }
  function izinIste() { if (!destekVar) return; Notification.requestPermission().then(izinCiz); }
  function izinCiz() {
    const k = $("#bildirim-izin");
    if (!k) return;
    if (!destekVar) { k.innerHTML = `<p class="muted small">Bildirimler uygulama içinde gösterilir.</p>`; return; }
    const d = izinDurum();
    if (d === "granted") k.innerHTML = `<p class="bld-izinli">Bildirim izni verildi ✓</p>`;
    else if (d === "denied") k.innerHTML = `<p class="muted small">Bildirim izni kapalı. Telefon ayarlarından açabilirsin (uygulama içi bildirimler yine çalışır).</p>`;
    else k.innerHTML = `<button class="btn ghost" id="ba-izin-btn">Bildirimlere izin ver</button>`;
    const b = $("#ba-izin-btn");
    if (b) b.addEventListener("click", izinIste);
  }

  /* ---------- ek ilham saatleri (en fazla 2, yarım saatlik) ---------- */
  const SAATLER = [];
  for (let h = 6; h <= 23; h++) for (const m of ["00", "30"]) SAATLER.push(String(h).padStart(2, "0") + ":" + m);

  function ekDoldur(sel, secili) {
    sel.innerHTML = `<option value="">Ek saat yok</option>` +
      SAATLER.map(s => `<option value="${s}"${s === secili ? " selected" : ""}>${s}</option>`).join("");
  }
  function ekKaydet() {
    const x = ayarAl();
    const set = new Set([$("#ba-ek-1").value, $("#ba-ek-2").value].filter(Boolean));
    x.ilhamEkSaatler = [...set].sort();
    ayarYaz(x);
  }
  function ekGorunur() { const k = $("#ba-ek"); if (k) k.hidden = !$("#ba-ilham").checked; }

  /* ---------- UI ---------- */
  function baglan() {
    if (!$("#ba-ilham")) return;             // bu ekran yoksa çık
    const a = ayarAl();
    // Varsayılan AÇIK: yalnızca açıkça false ise kapalı
    $("#ba-duyuru").checked   = a.duyuru   !== false;
    $("#ba-topluluk").checked = a.topluluk !== false;
    $("#ba-ilham").checked    = a.ilham    !== false;
    if ($("#ba-hatirlatma")) $("#ba-hatirlatma").checked = a.hatirlatma !== false;
    izinCiz();

    const ek = Array.isArray(a.ilhamEkSaatler) ? a.ilhamEkSaatler : [];
    if ($("#ba-ek-1")) {
      ekDoldur($("#ba-ek-1"), ek[0] || "");
      ekDoldur($("#ba-ek-2"), ek[1] || "");
      $("#ba-ek-1").addEventListener("change", ekKaydet);
      $("#ba-ek-2").addEventListener("change", ekKaydet);
      $("#ba-ilham").addEventListener("change", ekGorunur);
      ekGorunur();
    }

    function baglaToggle(sel, alan) {
      const el = $(sel);
      if (!el) return;
      el.addEventListener("change", e => {
        const x = ayarAl();
        x[alan] = e.target.checked;
        ayarYaz(x);
        if (e.target.checked && destekVar && Notification.permission === "default") izinIste();
      });
    }
    baglaToggle("#ba-duyuru", "duyuru");
    baglaToggle("#ba-topluluk", "topluluk");
    baglaToggle("#ba-ilham", "ilham");
    baglaToggle("#ba-hatirlatma", "hatirlatma");

    const dene = $("#ba-dene");
    if (dene) dene.addEventListener("click", () => {
      if (window.GunlukIlham && GunlukIlham.ac) GunlukIlham.ac();
    });
  }

  document.addEventListener("DOMContentLoaded", baglan);
  return { ayarAl };
})();
