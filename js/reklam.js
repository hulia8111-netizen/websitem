/* ============================================================
   reklam.js — Ödüllü reklam köprüsü 🎬 (Ekstra İlham + Destekçi rozeti)
   ------------------------------------------------------------
   SADECE native (Play) uygulamada + AdMob reklamı yüklüyken çalışır.
   Kullanıcı "Reklam izle" der → native ödüllü reklamı gösterir →
   ödül kazanınca web'e döner → kullanıcıya EKSTRA İLHAM (bonus söz) +
   "Destekçi 🤍" rozeti. Web/iPhone (native olmayan)'da buton hiç görünmez.

   Native köprü sözleşmesi (App.js gönderir):
     • reklam yüklendi:  window.__ISIGINI_REKLAM_HAZIR=true  + event 'isigini-reklam-hazir'
     • ödül kazanıldı:   event 'isigini-reklam-odul'
     • reklam kapandı:   event 'isigini-reklam-kapandi'
   Web → native:  postMessage({type:"reklam-goster"})
   Global: window.Reklam
   ============================================================ */
window.Reklam = (() => {
  const $ = id => document.getElementById(id);
  let bekliyor = false;

  function native() { return !!(window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === "function"); }
  function hazirMi() { return native() && window.__ISIGINI_REKLAM_HAZIR === true; }
  function destekSayi() { try { return parseInt(Store.get("destek-sayi", 0), 10) || 0; } catch (e) { return 0; } }

  /* ---------- reklam izle ---------- */
  function izle() {
    if (!hazirMi() || bekliyor) return;
    bekliyor = true;
    butonDurum();
    try { window.ReactNativeWebView.postMessage(JSON.stringify({ type: "reklam-goster" })); }
    catch (e) { bekliyor = false; butonDurum(); }
    setTimeout(() => { if (bekliyor) { bekliyor = false; butonDurum(); } }, 45000);  // güvenlik
  }

  /* ---------- ödül: Ekstra İlham + Destekçi ---------- */
  function odulVer() {
    bekliyor = false;
    try { Store.set("destek-sayi", destekSayi() + 1); } catch (e) {}
    ekstraIlhamGoster();
    rozetGuncelle();
    butonDurum();
    try { if (window.Keyif) Keyif.kutlama(); } catch (e) {}
  }

  function rastgeleSoz() {
    const havuz = window.ACILIS_CUMLELERI || [];
    if (!havuz.length) return "Işığın hep seninle. ✨";
    return havuz[Math.floor(Math.random() * havuz.length)];
  }

  function ekstraIlhamGoster() {
    let p = $("reklam-odul");
    if (!p) {
      p = document.createElement("div");
      p.id = "reklam-odul"; p.className = "reklam-modal"; p.hidden = true;
      document.body.appendChild(p);
      p.addEventListener("click", e => { if (e.target === p || e.target.classList.contains("reklam-kapat")) kapatModal(); });
    }
    const n = destekSayi();
    p.innerHTML =
      '<div class="reklam-ic">' +
        '<button class="reklam-kapat" aria-label="Kapat">✕</button>' +
        '<div class="reklam-amblem">✨</div>' +
        '<div class="reklam-baslik">Ekstra İlham</div>' +
        '<blockquote class="reklam-soz">“' + esc(rastgeleSoz()) + '”</blockquote>' +
        '<div class="reklam-destek">🤍 Destekçi oldun · ' + n + '. kez teşekkürler</div>' +
        '<p class="reklam-not muted small">Reklam izleyerek Işığını Bul\'u desteklediğin için minnettarım 🌙</p>' +
        '<button class="reklam-tamam" type="button">Teşekkürler ✦</button>' +
      '</div>';
    p.querySelector(".reklam-tamam").addEventListener("click", kapatModal);
    p.hidden = false; requestAnimationFrame(() => p.classList.add("gor"));
  }
  function kapatModal() { const p = $("reklam-odul"); if (!p) return; p.classList.remove("gor"); setTimeout(() => { p.hidden = true; }, 250); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

  /* ---------- buton + rozet (İlham ekranında) ---------- */
  function butonDurum() {
    const kutu = $("ilham-reklam"), btn = $("ilham-reklam-btn");
    if (!kutu || !btn) return;
    kutu.hidden = !hazirMi();
    btn.disabled = bekliyor || !hazirMi();
    btn.textContent = bekliyor ? "Reklam yükleniyor…" : "🎬 Reklam izle · Ekstra İlham al ✨";
  }
  function rozetGuncelle() {
    const el = $("ilham-destekci");
    const n = destekSayi();
    if (el) { if (n > 0) { el.hidden = false; el.textContent = "🤍 Destekçi · " + n + " kez"; } else el.hidden = true; }
    const prof = $("destekci-rozet");
    if (prof) { if (n > 0) { prof.hidden = false; prof.querySelector(".dr-sayi").textContent = n; } else prof.hidden = true; }
  }

  // İlham ekranı açılınca butona bağlan + durumu tazele
  function butonaBagla() {
    const btn = $("ilham-reklam-btn");
    if (btn && !btn.dataset.bagli) { btn.dataset.bagli = "1"; btn.addEventListener("click", izle); }
    butonDurum(); rozetGuncelle();
  }

  window.addEventListener("isigini-reklam-hazir", butonDurum);
  window.addEventListener("isigini-reklam-kapandi", () => { bekliyor = false; butonDurum(); });
  window.addEventListener("isigini-reklam-odul", odulVer);
  document.addEventListener("DOMContentLoaded", () => { setTimeout(rozetGuncelle, 800); });

  return { izle, hazirMi, destekSayi, butonaBagla, butonDurum, rozetGuncelle };
})();
