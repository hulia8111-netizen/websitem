/* ============================================================
   bildirimayar.js — Bildirim Ayarları 3.0 (sade) 🔔
   ------------------------------------------------------------
   Tek sade kart:
     • Günün İlham Cümlesi — ZORUNLU (anahtar yok): hafta içi 12:00,
       hafta sonu 16:00. (Telefon ayarından kapatılabilir.)
     • "Diğer bildirimler" — TEK anahtar: duyurular + topluluk + nazik
       hatırlatmalar + seçilen ek ilham saatleri (en fazla 2) birlikte.
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
  /* "Diğer bildirimler" açık mı? (varsayılan AÇIK) */
  function digerAcik(a) {
    a = a || ayarAl();
    if (a.diger !== undefined) return a.diger !== false;
    // Eski ayarlardan geçiş: üçü birden kapatılmışsa kapalı say
    return !(a.duyuru === false && a.topluluk === false && a.hatirlatma === false);
  }

  /* ---------- izin ---------- */
  function izinDurum() { return destekVar ? Notification.permission : "yok"; }
  function izinIste() { if (!destekVar) return; Notification.requestPermission().then(izinCiz); }
  function izinCiz() {
    const k = $("#bildirim-izin");
    if (!k) return;
    // Mobil uygulamada: telefonun (native) bildirim durumu
    if (window.BildirimDavet && BildirimDavet.ayarSatiri(k)) return;
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
  function ekGorunur() { const k = $("#ba-ek"); if (k) k.hidden = !$("#ba-diger").checked; }

  /* ---------- UI ---------- */
  function baglan() {
    if (!$("#ba-diger")) return;             // bu ekran yoksa çık
    const a = ayarAl();
    $("#ba-diger").checked = digerAcik(a);
    izinCiz();

    const ek = Array.isArray(a.ilhamEkSaatler) ? a.ilhamEkSaatler : [];
    ekDoldur($("#ba-ek-1"), ek[0] || "");
    ekDoldur($("#ba-ek-2"), ek[1] || "");
    $("#ba-ek-1").addEventListener("change", ekKaydet);
    $("#ba-ek-2").addEventListener("change", ekKaydet);
    ekGorunur();

    // Tek anahtar → duyuru + topluluk + nazik hatırlatma birlikte; ilham hep açık
    $("#ba-diger").addEventListener("change", e => {
      const acik = e.target.checked;
      const x = ayarAl();
      x.diger = acik; x.duyuru = acik; x.topluluk = acik; x.hatirlatma = acik; x.ilham = true;
      ayarYaz(x);
      ekGorunur();
      if (acik && destekVar && Notification.permission === "default") izinIste();
    });

    const dene = $("#ba-dene");
    if (dene) dene.addEventListener("click", () => {
      if (window.GunlukIlham && GunlukIlham.ac) GunlukIlham.ac();
    });
  }

  document.addEventListener("DOMContentLoaded", baglan);
  return { ayarAl, digerAcik };
})();
