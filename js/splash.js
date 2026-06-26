/* ============================================================
   splash.js — Açılış (Splash Screen) deneyimi
   ------------------------------------------------------------
   Akış: tam ekran açılış → simge + "Işığını Bul" + Word'den rastgele
   ilham cümlesi belirir. En altta "🔄 Senkronla" butonu. Kullanıcı
   basınca ~18 sn premium yükleme (yumuşak ilerleme çubuğu + sırayla
   rastgele bilgilendirme mesajları) → başarı animasyonu (2 sn) →
   fade-out → ana sayfa. Kullanıcı basmazsa 9 sn sonra OTOMATİK başlar
   (splash'te asla takılı kalınmaz).
   Cümleler window.ACILIS_CUMLELERI dizisinden gelir
   (acilis-cumleler.js → Word dosyasından üretilir).
   ============================================================ */
(function () {
  var MESAJ_GECIKME = 900;   // simge+isim sonrası ilham cümlesinin belirmesi (ms)
  var BUTON_GECIKME = 1600;  // "Senkronla" butonunun belirmesi (ms)
  var OTOMATIK_GECIKME = 9000; // kullanıcı basmazsa otomatik senkron başlar (takılma olmasın)
  var SENK_SURE = 12000;     // senkron yükleme toplam süresi (ms) ≈ 12 sn
  var BASARI_SURE = 2000;    // başarı animasyonu ekranda kalma süresi (ms) = 2 sn
  var FADEOUT_SURE = 800;    // kapanış solması (ms)
  var GECMIS_ANAHTAR = "kdm_acilis-gecmis";
  var baslatildi = false;    // senkron bir kez başlasın (buton ya da otomatik)

  // Yükleme sırasında sırayla (rastgele sıralı) gösterilen bilgilendirme mesajları
  var SENK_MESAJLARI = [
    "✨ Enerji alanın güncelleniyor...",
    "✨ Günlük rehber hazırlanıyor...",
    "✨ Kart frekansların hizalanıyor...",
    "✨ Ruhsal denge analiz ediliyor...",
    "✨ Bugünün mesajları seçiliyor...",
    "✨ Meditasyon önerileri hazırlanıyor...",
    "✨ İçsel rehberin bağlanıyor...",
    "✨ Senkronizasyon tamamlanıyor..."
  ];

  // Tekrar önleyen rastgele seçim: son gösterilenler bir süre tekrar gelmez.
  function rastgeleCumle() {
    var liste = window.ACILIS_CUMLELERI;
    if (!liste || !liste.length) return "";
    if (liste.length === 1) return liste[0];
    var gecmis;
    try { gecmis = JSON.parse(localStorage.getItem(GECMIS_ANAHTAR) || "[]"); } catch (e) { gecmis = []; }
    if (!Array.isArray(gecmis)) gecmis = [];
    var maxGecmis = liste.length - 1;   // tüm havuz dönmeden hiçbir söz tekrar etmesin (tam döngü)
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

  // Diziyi yerinde karıştır (Fisher-Yates) → mesajlar rastgele sırada
  function karistir(d) {
    for (var i = d.length - 1; i > 0; i--) {
      var k = Math.floor(Math.random() * (i + 1));
      var t = d[i]; d[i] = d[k]; d[k] = t;
    }
    return d;
  }

  // Gerçek ilerleme hissi: hafif yavaşlayan, doğal bir dolum eğrisi
  function ilerlemeEgrisi(t) { return 1 - Math.pow(1 - t, 1.7); }

  function kapat(splash) {
    splash.classList.add("kapali");
    setTimeout(function () {
      splash.style.display = "none";
      if (window.gotoView) try { gotoView("home"); } catch (e) {}
    }, FADEOUT_SURE);
  }

  function senkronBasla(splash) {
    if (baslatildi) return;   // buton + otomatik aynı anda tetiklenmesin
    baslatildi = true;
    var btn = document.getElementById("splash-senk");
    var yuk = document.getElementById("splash-senk-yukleme");
    var bar = document.getElementById("splash-bar-dolu");
    var yzd = document.getElementById("splash-yuzde");
    var msg = document.getElementById("splash-senk-mesaj");
    var basari = document.getElementById("splash-senk-basari");
    if (!yuk || !bar) return;

    if (btn) btn.classList.add("gizli");           // butonu sola/yukarı sönümle
    yuk.hidden = false;
    requestAnimationFrame(function () { yuk.classList.add("acik"); });

    // mesajları rastgele sırada hazırla ve sırayla göster
    var liste = karistir(SENK_MESAJLARI.slice());
    var mi = 0;
    function gosterMesaj() {
      if (!msg) return;
      msg.classList.remove("gir"); void msg.offsetWidth;   // animasyonu yeniden tetikle
      msg.textContent = liste[mi % liste.length];
      msg.classList.add("gir");
      mi++;
    }
    gosterMesaj();
    var msgInt = setInterval(gosterMesaj, Math.round(SENK_SURE / liste.length));

    // ilerleme çubuğu — rAF ile yumuşak dolum
    var bas = performance.now();
    (function tik(now) {
      var t = Math.min(1, (now - bas) / SENK_SURE);
      var p = Math.round(ilerlemeEgrisi(t) * 100);
      bar.style.width = p + "%";
      if (yzd) yzd.textContent = "%" + p;
      if (t < 1) { requestAnimationFrame(tik); return; }
      // bitti → başarı animasyonu
      clearInterval(msgInt);
      bar.style.width = "100%"; if (yzd) yzd.textContent = "%100";
      setTimeout(function () {
        yuk.classList.remove("acik");
        setTimeout(function () {
          yuk.hidden = true;
          if (basari) {
            basari.hidden = false;
            requestAnimationFrame(function () { basari.classList.add("acik"); });
          }
          setTimeout(function () { kapat(splash); }, BASARI_SURE);
        }, 280);
      }, 200);
    })(bas);
  }

  function basla() {
    var splash = document.getElementById("splash");
    if (!splash) return;

    var sozEl = document.getElementById("splash-soz");
    if (sozEl) sozEl.textContent = rastgeleCumle();

    // simge + "Işığını Bul" hemen, cümle ve buton ard arda yumuşak belirir
    requestAnimationFrame(function () { splash.classList.add("soz-gir"); });
    setTimeout(function () { splash.classList.add("soz-goster"); }, MESAJ_GECIKME);
    setTimeout(function () { splash.classList.add("buton-goster"); }, BUTON_GECIKME);

    var btn = document.getElementById("splash-senk");
    if (btn) btn.addEventListener("click", function () { senkronBasla(splash); });
    // Kullanıcı butona basmazsa otomatik başlat → splash'te asla takılı kalınmaz
    setTimeout(function () { senkronBasla(splash); }, OTOMATIK_GECIKME);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", basla);
  } else {
    basla();
  }
})();
