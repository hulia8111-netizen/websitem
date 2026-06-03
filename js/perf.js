/* ============================================================
   perf.js — Animasyon performans optimizasyonu ⚡
   1) Sayfa arka plana alınınca (sekme gizli) tüm animasyonları
      duraklatır → pil/CPU tasarrufu.
   2) Ekran dışındaki sürekli animasyonlu öğeleri IntersectionObserver
      ile duraklatır → aynı anda çalışan animasyon sayısını azaltır.
   Yalnız transform/opacity tabanlı CSS animasyonlarını etkiler;
   davranış değişmez, görünür alan her zaman canlıdır.
   ============================================================ */

(() => {
  /* 1) Sekme görünürlüğü */
  document.addEventListener("visibilitychange", () => {
    document.body.classList.toggle("sayfa-gizli", document.hidden);
  });

  /* 2) Ekran dışı ağır/sürekli animasyonlu öğeler */
  if (!("IntersectionObserver" in window)) return;

  const SECICILER = [
    ".streak-alev", ".ay-gorsel", ".enerji-gosterge", ".kader-flip",
    ".bahce-sahne", ".et-aura", ".aura-sahne", ".kk-ay", ".sg-gunes",
    ".rituel-kart", ".urun-gorsel"
  ].join(",");

  const io = new IntersectionObserver(
    entries => entries.forEach(e => e.target.classList.toggle("anim-duraklat", !e.isIntersecting)),
    { rootMargin: "120px" }
  );

  let gozlenenSet = new WeakSet();
  function gozle() {
    document.querySelectorAll(SECICILER).forEach(el => {
      if (!gozlenenSet.has(el)) { gozlenenSet.add(el); io.observe(el); }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    gozle();
    // Dinamik olarak eklenen kartlar (görünüm değişimi vb.) için ara tarama
    setInterval(gozle, 4000);
  });
})();
