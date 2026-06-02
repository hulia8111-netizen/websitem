/* ============================================================
   kozmik.js — Gece Kozmik Modu 🌌
   Yıldızlar, nebula gradient, akan glow parçacıkları ve hafif
   parallax ile büyüleyici bir gece atmosferi. Profil ayarından
   açılır/kapanır; tercih localStorage'da saklanır.
   Performans: katmanlar yalnız mod açıkken render edilir ve
   yalnız transform/opacity animasyonları kullanılır.
   Global: window.Kozmik
   ============================================================ */

const Kozmik = window.Kozmik = (() => {
  let layer, l1, l2, parc, toggle;
  let kuruldu = false, aktif = false;
  let ticking = false, sy = 0, px = 0, py = 0;
  const hoverVar = window.matchMedia && window.matchMedia("(hover: hover)").matches;

  function yildizlar(n, buyuk) {
    let s = "";
    for (let i = 0; i < n; i++) {
      const x = (Math.random() * 100).toFixed(2);
      const y = (Math.random() * 100).toFixed(2);
      const sz = (buyuk ? 2 + Math.random() * 2 : 1 + Math.random() * 1.6).toFixed(2);
      const d = (Math.random() * 5).toFixed(2);
      const dur = (2.5 + Math.random() * 3.5).toFixed(2);
      const altin = Math.random() < 0.28 ? " altin" : "";
      const bk = buyuk ? " buyuk" : "";
      s += `<span class="kz-yildiz${altin}${bk}" style="left:${x}%;top:${y}%;width:${sz}px;height:${sz}px;animation-delay:${d}s;animation-duration:${dur}s"></span>`;
    }
    return s;
  }
  function parcaciklar(n) {
    let s = "";
    for (let i = 0; i < n; i++) {
      const x = (Math.random() * 100).toFixed(2);
      const y = (55 + Math.random() * 45).toFixed(2);
      const d = (Math.random() * 14).toFixed(2);
      const dur = (10 + Math.random() * 10).toFixed(2);
      s += `<span class="kz-parcacik" style="left:${x}%;top:${y}%;animation-delay:${d}s;animation-duration:${dur}s"></span>`;
    }
    return s;
  }
  function olustur() {
    if (kuruldu) return;
    l1.innerHTML = yildizlar(28, false);
    l2.innerHTML = yildizlar(16, true);
    parc.innerHTML = parcaciklar(9);
    kuruldu = true;
  }

  /* ---------- parallax (rAF ile throttle) ---------- */
  function istek() { if (!ticking) { requestAnimationFrame(guncelle); ticking = true; } }
  function guncelle() {
    ticking = false;
    if (!aktif) return;
    l1.style.transform = `translate3d(${(px * -6).toFixed(1)}px, ${(sy * 0.04 + py * -5).toFixed(1)}px, 0)`;
    l2.style.transform = `translate3d(${(px * -14).toFixed(1)}px, ${(sy * 0.09 + py * -10).toFixed(1)}px, 0)`;
  }
  function onScroll() { sy = window.scrollY || 0; istek(); }
  function onPointer(e) { px = e.clientX / window.innerWidth - 0.5; py = e.clientY / window.innerHeight - 0.5; istek(); }
  function dinle() {
    window.addEventListener("scroll", onScroll, { passive: true });
    if (hoverVar) window.addEventListener("pointermove", onPointer, { passive: true });
  }
  function birak() {
    window.removeEventListener("scroll", onScroll);
    if (hoverVar) window.removeEventListener("pointermove", onPointer);
  }

  /* ---------- mod uygula ---------- */
  function uygula(on) {
    aktif = on;
    document.body.classList.toggle("kozmik", on);
    if (toggle) toggle.checked = on;
    if (on) { olustur(); layer.style.display = "block"; dinle(); istek(); }
    else { layer.style.display = "none"; birak(); }
  }
  function ayarla(on) { uygula(on); Store.set("kozmik-mod", on); }

  function baglan() {
    layer = document.getElementById("kozmik-katman");
    l1 = document.getElementById("kz-l1");
    l2 = document.getElementById("kz-l2");
    parc = document.getElementById("kz-parcaciklar");
    toggle = document.getElementById("kozmik-toggle");
    if (!layer) return;
    if (toggle) toggle.addEventListener("change", () => ayarla(toggle.checked));
    uygula(Store.get("kozmik-mod", false));
  }

  document.addEventListener("DOMContentLoaded", baglan);
  return { ayarla };
})();
