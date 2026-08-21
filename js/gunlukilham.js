/* ============================================================
   gunlukilham.js — "Günün İlham Cümlesi" ✨
   Her gün (tarihe göre sabit) bir ilham cümlesi gösteren ekran.
   Kaynak: window.ACILIS_CUMLELERI (açılış ekranıyla aynı havuz).
   Bildirime tıklayınca (pushtoken.js → PushToken) buraya yönlenir.
   Ana ekranda "Ritüeller & Araçlar → ✨ Günün İlhamı" ile de açılır.
   Global: window.GunlukIlham
   ============================================================ */
const GunlukIlham = window.GunlukIlham = (() => {
  let ov = null;

  function bugununSozu() {
    const havuz = window.ACILIS_CUMLELERI || [];
    if (!havuz.length) return "Işığın hep seninle. ✨";
    // tarihe göre deterministik (o gün herkes aynı cümleyi görür)
    const idx = (typeof dayIndex === "function") ? (dayIndex() % havuz.length) : 0;
    return havuz[idx];
  }

  function tarihMetni() {
    try { return new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "long" }); }
    catch (e) { return ""; }
  }

  function kur() {
    if (ov) return ov;
    ov = document.createElement("div");
    ov.className = "ilham-overlay";
    ov.id = "ilham-overlay";
    ov.hidden = true;
    ov.innerHTML =
      '<div class="ilham-yildizlar" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>' +
      '<div class="ilham-ic">' +
        '<button class="gece-kapat ilham-kapat" aria-label="Kapat">✕</button>' +
        '<div class="ilham-ay">🌙</div>' +
        '<p class="ilham-tarih" id="ilham-tarih"></p>' +
        '<div class="ilham-amblem">✨</div>' +
        '<blockquote class="ilham-soz" id="ilham-soz"></blockquote>' +
        '<p class="ilham-alt muted small">Günün ilham cümlesi · her gün yeni</p>' +
      '</div>';
    document.body.appendChild(ov);
    ov.querySelector(".ilham-kapat").addEventListener("click", kapat);
    ov.addEventListener("click", e => { if (e.target === ov) kapat(); });
    return ov;
  }

  function ac() {
    kur();
    const s = ov.querySelector("#ilham-soz");
    const t = ov.querySelector("#ilham-tarih");
    if (s) s.textContent = "“" + bugununSozu() + "”";
    if (t) t.textContent = tarihMetni();
    document.body.classList.add("ilham-aktif");
    ov.hidden = false; ov.classList.remove("gor"); void ov.offsetWidth; ov.classList.add("gor");
  }
  function kapat() {
    if (!ov) return;
    ov.classList.remove("gor");
    setTimeout(() => { ov.hidden = true; document.body.classList.remove("ilham-aktif"); }, 350);
  }

  function baglan() {
    const btn = document.getElementById("ilham-ac");
    if (btn) btn.addEventListener("click", ac);
  }
  document.addEventListener("DOMContentLoaded", baglan);

  return { ac, kapat, bugununSozu };
})();
