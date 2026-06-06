/* ============================================================
   gorevler.js — Günün Görevleri 🌿🌙🧠
   Her gün otomatik olarak 3 dengeli görev üretir: Fiziksel, Ruhsal,
   Zihinsel. Tamamlanan görev glow alır, ilerleme yüzdesi oluşur, hepsi
   bitince kutlama animasyonu + mesaj çıkar. Enerji puanı ve Ruh Bahçesi
   sistemiyle entegre çalışır. Görevler her gün yenilenir.
   Global: window.Gorevler
   ============================================================ */

const Gorevler = window.Gorevler = (() => {
  const $ = id => document.getElementById(id);
  function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

  const ANAHTAR = "gorevler-";
  const KATLAR = [
    { id: "fiziksel", ad: "Fiziksel", ikon: "🌿" },
    { id: "ruhsal", ad: "Ruhsal", ikon: "🌙" },
    { id: "zihinsel", ad: "Zihinsel", ikon: "🧠" }
  ];
  const CEK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';

  /* Görevler Word dosyasından (js/mini-gorevler.js → window.MINI_GOREVLER)
     gelir; yoksa DATA.gorevHavuzlari'na güvenli geri dönüş. */
  function bugunGorev(katId) {
    const wd = window.MINI_GOREVLER && window.MINI_GOREVLER[katId];
    const havuz = (wd && wd.length) ? wd : ((DATA.gorevHavuzlari || {})[katId] || []);
    return pickByDate(havuz);
  }
  function durum() { return Store.get(ANAHTAR + todayKey(), {}) || {}; }
  function durumYaz(d) { Store.set(ANAHTAR + todayKey(), d); }
  function tamamSayi() { const d = durum(); return KATLAR.filter(k => d[k.id]).length; }

  /* ---------- render ---------- */
  function cizKartlar() {
    const wrap = $("gorev-kartlar"); if (!wrap) return;
    const d = durum();
    wrap.innerHTML = "";
    KATLAR.forEach(k => {
      const tamam = !!d[k.id];
      const kart = document.createElement("div");
      kart.className = "gorev-kart g-" + k.id + (tamam ? " tamam" : "");
      kart.innerHTML = `
        <div class="gk-bas"><span class="gk-ikon">${k.ikon}</span><span class="gk-ad">${k.ad}</span></div>
        <p class="gk-gorev">${esc(bugunGorev(k.id))}</p>
        <button class="gk-check" aria-label="${tamam ? "Tamamlandı" : "Tamamla"}">${CEK}</button>`;
      kart.querySelector(".gk-check").addEventListener("click", () => topla(k.id, kart));
      kart.classList.add("gir");   // zarif fade-in (kademeli)
      wrap.appendChild(kart);
    });
    // fade-in bitince 'gir' sınıfını kaldır (glow animasyonuyla çakışmasın)
    setTimeout(() => wrap.querySelectorAll(".gorev-kart.gir").forEach(k => k.classList.remove("gir")), 1000);
    cizIlerleme();
  }

  function cizIlerleme() {
    const n = tamamSayi();
    const yuzde = Math.round(n / KATLAR.length * 100);
    const bar = $("gorev-bar"); if (bar) bar.style.width = yuzde + "%";
    const yz = $("gorev-yuzde"); if (yz) yz.textContent = "%" + yuzde;
  }

  /* ---------- görev tamamlama ---------- */
  function topla(katId, kart) {
    const d = durum();
    const oncekiHepsi = tamamSayi() === KATLAR.length;
    d[katId] = !d[katId];
    durumYaz(d);
    kart.classList.toggle("tamam", !!d[katId]);
    if (d[katId]) { kart.classList.remove("glow"); void kart.offsetWidth; kart.classList.add("glow"); }
    cizIlerleme();

    // task-<gün> paylaşılan bayrak (enerji/bahçe/streak/profil/başarım)
    if (tamamSayi() > 0) Store.set("task-" + todayKey(), true);

    // bağlı sistemleri tazele
    if (window.Enerji && Enerji.ciz) Enerji.ciz();
    if (window.Bahce && Bahce.ciz) Bahce.ciz();
    if (window.Streak && Streak.ciz) Streak.ciz();
    if (window.Profil && Profil.ciz) Profil.ciz();

    // hepsi yeni tamamlandıysa kutlama
    if (!oncekiHepsi && tamamSayi() === KATLAR.length) kutla();
  }

  /* ---------- kutlama animasyonu ---------- */
  function kutla() {
    const el = $("gorev-kutlama"); if (!el) return;
    el.innerHTML = `<div class="gkut-yildizlar" aria-hidden="true">${Array.from({ length: 14 }, () => "<span></span>").join("")}</div>
      <div class="gkut-ikon">✨</div>
      <p class="gkut-mesaj">Bugün kendin için güzel şeyler yaptın ✨</p>`;
    [...el.querySelectorAll(".gkut-yildizlar span")].forEach(s => {
      s.style.left = (Math.random() * 100).toFixed(1) + "%";
      s.style.top = (Math.random() * 100).toFixed(1) + "%";
      s.style.animationDelay = (Math.random() * 0.6).toFixed(2) + "s";
    });
    el.hidden = false; el.classList.remove("gor"); void el.offsetWidth; el.classList.add("gor");
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.classList.remove("gor"); setTimeout(() => { el.hidden = true; }, 600); }, 5200);
  }

  function ciz() { cizKartlar(); }

  document.addEventListener("DOMContentLoaded", ciz);
  return { ciz, tamamSayi };
})();
