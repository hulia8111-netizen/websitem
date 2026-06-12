/* ============================================================
   splash.js — Açılış (Splash Screen) deneyimi
   ------------------------------------------------------------
   Akış: tam ekran açılış → logo + "Işığını Bul" + Word'den
   rastgele bir ilham cümlesi (zarif fade-in) → 5 sn ekranda →
   fade-out → ana sayfa görünür. Hiçbir buton/etkileşim yok.
   Cümleler window.ACILIS_CUMLELERI dizisinden gelir
   (acilis-cumleler.js → Word dosyasından üretilir).
   ============================================================ */
(function () {
  var TOPLAM = 5000;        // açılış cümlesi ekranda toplam kalma süresi (ms) = 5 sn
  var FADEOUT_SURE = 800;   // kapanış solması (ms)
  var GECMIS_ANAHTAR = "kdm_acilis-gecmis";

  // Tekrar önleyen rastgele seçim: son gösterilenler bir süre tekrar gelmez.
  function rastgeleCumle() {
    var liste = window.ACILIS_CUMLELERI;
    if (!liste || !liste.length) return "";
    if (liste.length === 1) return liste[0];
    var gecmis;
    try { gecmis = JSON.parse(localStorage.getItem(GECMIS_ANAHTAR) || "[]"); } catch (e) { gecmis = []; }
    if (!Array.isArray(gecmis)) gecmis = [];
    var maxGecmis = Math.min(liste.length - 1, 15);   // son ~15 cümleyi tekrarlama
    var adaylar = [];
    for (var i = 0; i < liste.length; i++) if (gecmis.indexOf(i) === -1) adaylar.push(i);
    var idx = adaylar.length
      ? adaylar[Math.floor(Math.random() * adaylar.length)]
      : Math.floor(Math.random() * liste.length);
    gecmis.push(idx);
    while (gecmis.length > maxGecmis) gecmis.shift();
    try { localStorage.setItem(GECMIS_ANAHTAR, JSON.stringify(gecmis)); } catch (e) {}
    return liste[idx];
  }

  function basla() {
    var splash = document.getElementById("splash");
    if (!splash) return;

    var sozEl = document.getElementById("splash-soz");
    if (sozEl) sozEl.textContent = rastgeleCumle();

    // simge + isim + cümle hemen ard arda fade-in olsun
    requestAnimationFrame(function () { splash.classList.add("soz-gir"); });

    // açılıştan itibaren 5 sn → fade-out → ana sayfa
    setTimeout(function () {
      splash.classList.add("kapali");
      setTimeout(function () { splash.style.display = "none"; }, FADEOUT_SURE);
    }, TOPLAM);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", basla);
  } else {
    basla();
  }
})();
