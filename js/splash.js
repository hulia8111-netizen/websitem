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
  var FADEIN_SURE = 1400;   // cümlenin görünür hale gelmesi (ms)
  var BEKLE = 7000;         // cümle ekranda kalsın (ms)
  var FADEOUT_SURE = 800;   // kapanış solması (ms)

  function rastgeleCumle() {
    var liste = window.ACILIS_CUMLELERI;
    if (!liste || !liste.length) return "";
    return liste[Math.floor(Math.random() * liste.length)];
  }

  function basla() {
    var splash = document.getElementById("splash");
    if (!splash) return;

    var sozEl = document.getElementById("splash-soz");
    if (sozEl) sozEl.textContent = rastgeleCumle();

    // cümle fade-in animasyonunu tetikle
    requestAnimationFrame(function () { splash.classList.add("soz-gir"); });

    // cümle göründükten sonra 5 sn bekle → kapat
    setTimeout(function () {
      splash.classList.add("kapali");
      setTimeout(function () { splash.style.display = "none"; }, FADEOUT_SURE);
    }, FADEIN_SURE + BEKLE);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", basla);
  } else {
    basla();
  }
})();
