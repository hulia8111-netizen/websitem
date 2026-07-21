/* ============================================================
   overlay-geri.js — Overlay'leri telefon/tarayıcı GERİ tuşuyla kapat 🔙
   ------------------------------------------------------------
   Bir tam-ekran overlay/popup açıldığında tarayıcı geçmişine bir giriş
   ekler (hash ile → WebView de algılar). Geri tuşuna basılınca (popstate)
   o overlay kapanır, uygulamadan çıkılmaz. X/arka planla kapatınca eklenen
   geçmiş girişi de temizlenir → geri tuşu tutarlı kalır.

   Not: Tamamen web tarafı; native/App.js'e dokunmaz. Mevcut X butonları
   çalışmaya devam eder — bu sadece geri tuşunu da bir kapatma yolu yapar.
   Global: window.OverlayGeri
   ============================================================ */
window.OverlayGeri = (() => {
  // index.html'deki tüm overlay/popup id'leri ("hidden" ile açılıp kapanır)
  const IDLER = [
    "hafta-overlay", "takvim-overlay", "vision-overlay", "nefes-overlay",
    "test-overlay", "urun-popup", "cs-popup", "ciftsaat-overlay",
    "magaza-overlay", "topluluk-overlay", "odul-popup", "rapor-overlay"
  ];

  const acik = [];                     // açık overlay id'leri (açılma sırasıyla)
  const popIle = new Set();            // geri tuşuyla kapatılıyor (history zaten tüketildi)

  // "hidden" özniteliği bu overlay'lerde açık/kapalı için tek ve güvenilir sinyal
  function gorunur(el) { return el && !el.hidden; }

  // İlgili overlay'in kapatma butonunu bul (modülün kendi kapatma mantığı çalışsın)
  function kapatButonu(el, id) {
    const kb = id.replace("-overlay", "-kapat").replace("-popup", "-kapat");
    return el.querySelector('[aria-label="Kapat"]')
      || el.querySelector("#" + kb)
      || el.querySelector(".gece-kapat, .cs-kapat, .up-kapat");
  }

  function acildi(id) {
    if (acik.indexOf(id) !== -1) return;
    acik.push(id);
    // Geçmişe giriş ekle. Hash değişimi WebView'in de "geri gidilebilir" saymasını sağlar.
    try { history.pushState({ _ov: id }, "", "#ekran"); } catch (e) {}
  }
  function kapandi(id) {
    const i = acik.indexOf(id);
    if (i === -1) return;
    acik.splice(i, 1);
    if (popIle.has(id)) { popIle.delete(id); return; } // geri tuşuyla kapandı → history tüketilmiş
    // X / arka plan ile kapandı → eklediğimiz geçmiş girişini geri al
    try { if (history.state && history.state._ov) history.back(); } catch (e) {}
  }

  // Geri tuşu → en son açılan overlay'i kapat
  window.addEventListener("popstate", () => {
    if (!acik.length) return;                 // açık overlay yok → normal geri
    const id = acik[acik.length - 1];
    const el = document.getElementById(id);
    popIle.add(id);
    acik.pop();
    const btn = el && kapatButonu(el, id);
    if (btn) btn.click();
    else if (el) el.hidden = true;            // yedek: doğrudan kapat
  });

  const obs = new MutationObserver(muts => {
    for (const m of muts) {
      const el = m.target;
      if (!el.id || IDLER.indexOf(el.id) === -1) continue;
      if (gorunur(el)) acildi(el.id); else kapandi(el.id);
    }
  });

  function baglan() {
    IDLER.forEach(id => {
      const el = document.getElementById(id);
      if (el) obs.observe(el, { attributes: true, attributeFilter: ["hidden"] });
    });
  }
  if (document.readyState !== "loading") baglan();
  else document.addEventListener("DOMContentLoaded", baglan);

  return { acikSayisi: () => acik.length };
})();
