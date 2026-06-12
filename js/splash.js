/* ============================================================
   splash.js — Açılış (Splash Screen) deneyimi
   ------------------------------------------------------------
   Akış: tam ekran açılış → ÖNCE simge + "Işığını Bul" (6 sn tek
   başına) → SONRA altında Word'den rastgele ilham cümlesi belirir
   ve 15 sn ekranda kalır (rahatça okunsun) → fade-out → ana sayfa.
   Hiçbir buton/etkileşim yok.
   Cümleler window.ACILIS_CUMLELERI dizisinden gelir
   (acilis-cumleler.js → Word dosyasından üretilir).
   ============================================================ */
(function () {
  var SIMGE_SURE = 6000;    // simge + "Işığını Bul" tek başına ekranda (ms) = 6 sn
  var MESAJ_SURE = 15000;   // mesaj belirdikten sonra ekranda kalma süresi (ms) = 15 sn
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

    // 1) simge + "Işığını Bul" hemen fade-in olur (mesaj henüz görünmez)
    requestAnimationFrame(function () { splash.classList.add("soz-gir"); });

    // 2) 6 sn sonra mesaj alttan yumuşak belirir
    setTimeout(function () {
      splash.classList.add("soz-goster");
    }, SIMGE_SURE);

    // 3) mesaj 15 sn ekranda kaldıktan sonra → fade-out → ana sayfa
    setTimeout(function () {
      splash.classList.add("kapali");
      setTimeout(function () { splash.style.display = "none"; }, FADEOUT_SURE);
    }, SIMGE_SURE + MESAJ_SURE);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", basla);
  } else {
    basla();
  }
})();
