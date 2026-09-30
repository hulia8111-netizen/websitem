/* ============================================================
   bildirimdavet.js — Bildirim izni kapalıysa nazik davet kartı 🔔
   ------------------------------------------------------------
   Mobil uygulamada (window.__ISIGINI_NATIVE) push jetonu gelmediyse
   telefonun bildirim izni kapalıdır (ya da uygulama eski sürümdür).
   Ana sayfanın başına sakin bir kart koyar:
     • Uygulama v9+ (window.__ISIGINI_NATIVE_SURUM >= 9) → "Bildirimleri aç"
       butonu telefonun bu uygulamaya ait ayar ekranını açar.
     • Daha eski sürüm → ayarı elle açma adımları + güncelleme notu.
   "Şimdi değil" → 7 gün gösterilmez. Jeton gelirse kart kendiliğinden kalkar.
   Profil › Ayarlar › Bildirimler kartındaki izin satırı da buradan beslenir.
   Global: window.BildirimDavet
   ============================================================ */
const BildirimDavet = window.BildirimDavet = (() => {
  const ERTELE = "bildirim-davet-ertele";     // bu tarihe kadar gösterme (ms)
  const BEKLE_MS = 10000;                     // jetonun gelmesi için bekleme
  let kart = null;

  function uygulamada() { return window.__ISIGINI_NATIVE === true; }
  function jetonVar() { return !!(window.__ISIGINI_PUSH && window.__ISIGINI_PUSH.token); }
  function ayarAcilabilir() { return Number(window.__ISIGINI_NATIVE_SURUM || 0) >= 9; }
  function ertelendi() { try { return Date.now() < Number(Store.get(ERTELE, 0) || 0); } catch (e) { return false; } }

  /* Telefonun bildirim ayarını aç (v9+) */
  function ayariAc() {
    try { window.ReactNativeWebView.postMessage(JSON.stringify({ type: "bildirim-ayari-ac" })); } catch (e) {}
  }

  function adimlarHtml() {
    return '<ol class="bd-adimlar">' +
      '<li>Telefonunun <b>Ayarlar</b> uygulamasını aç</li>' +
      '<li><b>Uygulamalar</b> › <b>Işığını Bul</b> › <b>Bildirimler</b></li>' +
      '<li><b>Bildirimlere izin ver</b> seçeneğini aç</li>' +
      '<li>Işığını Bul\'u kapatıp yeniden aç</li>' +
      '</ol>' +
      '<p class="bd-not muted small">Ayarlarda bu seçeneği bulamıyorsan Play Store\'dan uygulamanın güncel olduğundan emin ol.</p>';
  }

  function kaldir() { if (kart) { kart.remove(); kart = null; } }

  function goster() {
    if (kart || !uygulamada() || jetonVar() || ertelendi()) return;
    const hedef = document.getElementById("onemli-ust");
    if (!hedef || !hedef.parentNode) return;
    kart = document.createElement("section");
    kart.className = "card card-wide bildirim-davet";
    kart.id = "bildirim-davet";
    kart.innerHTML =
      '<div class="bd-ust"><span class="bd-ikon">🔔</span>' +
        '<div><h3 class="bd-baslik">Günün ilham cümlesi sana da gelsin mi?</h3>' +
        '<p class="bd-metin">Telefonunda bu uygulamanın bildirimleri kapalı görünüyor. İstersen açabilirsin; ne zaman ve ne sıklıkta geleceğini sonra sen seçersin.</p></div></div>' +
      (ayarAcilabilir()
        ? '<div class="bd-butonlar"><button class="btn" id="bd-ac" type="button">Bildirimleri aç</button><button class="btn ghost" id="bd-sonra" type="button">Şimdi değil</button></div>'
        : '<div class="bd-butonlar"><button class="btn" id="bd-nasil" type="button">Nasıl açarım?</button><button class="btn ghost" id="bd-sonra" type="button">Şimdi değil</button></div>' +
          '<div class="bd-detay" id="bd-detay" hidden>' + adimlarHtml() + '</div>');
    hedef.parentNode.insertBefore(kart, hedef);

    const ac = kart.querySelector("#bd-ac");
    if (ac) ac.addEventListener("click", ayariAc);
    const nasil = kart.querySelector("#bd-nasil");
    if (nasil) nasil.addEventListener("click", () => { const d = kart.querySelector("#bd-detay"); if (d) d.hidden = !d.hidden; });
    kart.querySelector("#bd-sonra").addEventListener("click", () => {
      try { Store.set(ERTELE, Date.now() + 7 * 86400000); } catch (e) {}
      kaldir();
    });
  }

  /* Ayarlar › Bildirimler kartı için: telefon bildirim durumu satırı */
  function ayarSatiri(kutu) {
    if (!kutu || !uygulamada()) return false;
    if (jetonVar()) { kutu.innerHTML = '<p class="bld-izinli">Telefon bildirimleri açık ✓</p>'; return true; }
    kutu.innerHTML = '<p class="muted small">Telefonunda bu uygulamanın bildirimleri kapalı görünüyor.</p>' +
      (ayarAcilabilir() ? '<button class="btn ghost" id="bd-ayar-ac" type="button">Bildirimleri aç</button>' : adimlarHtml());
    const b = kutu.querySelector("#bd-ayar-ac");
    if (b) b.addEventListener("click", ayariAc);
    return true;
  }

  // Jeton gelirse (izin sonradan verildi) kartı kaldır, ayar satırını tazele
  window.addEventListener("isigini-push-token", () => {
    kaldir();
    ayarSatiri(document.getElementById("bildirim-izin"));
  });
  document.addEventListener("DOMContentLoaded", () => setTimeout(goster, BEKLE_MS));

  return { goster, ayarSatiri, ayariAc };
})();
