/* ============================================================
   bildirimayar.js — Bildirim Ayarları 2.0 (3 kategori) 🔔
   ------------------------------------------------------------
   Tek sade kart, üç kategori:
     • Duyurular  (duyuru)
     • Topluluk   (topluluk)
     • Günün İlham Cümlesi (ilham) — her gün 12:00 sabit
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

  /* ---------- UI ---------- */
  function baglan() {
    if (!$("#ba-ilham")) return;             // bu ekran yoksa çık
    const a = ayarAl();
    // Varsayılan AÇIK: yalnızca açıkça false ise kapalı
    $("#ba-duyuru").checked   = a.duyuru   !== false;
    $("#ba-topluluk").checked = a.topluluk !== false;
    $("#ba-ilham").checked    = a.ilham    !== false;
    izinCiz();

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

    const dene = $("#ba-dene");
    if (dene) dene.addEventListener("click", () => {
      if (window.GunlukIlham && GunlukIlham.ac) GunlukIlham.ac();
    });
  }

  document.addEventListener("DOMContentLoaded", baglan);
  return { ayarAl };
})();
