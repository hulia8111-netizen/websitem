/* ============================================================
   guncelle.js — "Yeni sürüm hazır" güncelleme bildirimi 🌟
   ------------------------------------------------------------
   İnternet varken, sunucudaki surum.json'daki sürüm numarası bu
   koddaki YEREL_SURUM'dan büyükse → alt kısımda nazik bir "Güncelle"
   bandı çıkar. Kullanıcı dokununca önbellek + service worker temizlenir
   ve sayfa TAZE yüklenir (kimse "iki kez kapat-aç" yapmak zorunda kalmaz).
   Her yeni yayında: index ?v=NNN + service-worker CACHE + surum.json "v"
   + buradaki YEREL_SURUM birlikte artırılır.
   ============================================================ */
(function () {
  var YEREL_SURUM = 232;          // bu kodun (yüklenen sürümün) numarası
  var GOSTERILDI = false;

  function bannerGoster() {
    if (GOSTERILDI || document.getElementById("guncelle-banner")) return;
    GOSTERILDI = true;
    var b = document.createElement("div");
    b.id = "guncelle-banner";
    b.className = "guncelle-banner";
    b.innerHTML =
      '<span class="gb-ikon">🌟</span>' +
      '<span class="gb-metin">Yeni sürüm hazır</span>' +
      '<button class="gb-btn" type="button">Güncelle</button>' +
      '<button class="gb-kapat" type="button" aria-label="Kapat">✕</button>';
    document.body.appendChild(b);
    requestAnimationFrame(function () { b.classList.add("gor"); });
    b.querySelector(".gb-btn").addEventListener("click", guncelle);
    b.querySelector(".gb-kapat").addEventListener("click", function () {
      b.classList.remove("gor");
      setTimeout(function () { if (b.parentNode) b.remove(); }, 320);
    });
  }

  async function guncelle() {
    var btn = document.querySelector("#guncelle-banner .gb-btn");
    if (btn) { btn.disabled = true; btn.textContent = "Güncelleniyor…"; }
    try {
      if ("serviceWorker" in navigator) {
        var rs = await navigator.serviceWorker.getRegistrations();
        for (var i = 0; i < rs.length; i++) { try { await rs[i].unregister(); } catch (e) {} }
      }
    } catch (e) {}
    try {
      if (window.caches) {
        var ks = await caches.keys();
        for (var j = 0; j < ks.length; j++) { try { await caches.delete(ks[j]); } catch (e) {} }
      }
    } catch (e) {}
    try { location.reload(true); } catch (e) { location.reload(); }
  }

  function kontrol() {
    if (navigator.onLine === false) return;
    fetch("surum.json?cb=" + Date.now(), { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (d && typeof d.v === "number" && d.v > YEREL_SURUM) bannerGoster();
      })
      .catch(function () { /* offline / erişilemedi → sessiz */ });
  }

  function baglan() {
    setTimeout(kontrol, 4500);                 // splash bitsin, sonra sessizce kontrol et
    window.addEventListener("online", function () { setTimeout(kontrol, 1500); });
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible") setTimeout(kontrol, 1500);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", baglan);
  else baglan();
})();
