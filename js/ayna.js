/* ============================================================
   ayna.js — Ayna Modu / Kendinle Konuş 🪞✨
   Öz şefkat için güvenli bir alan: cam yansıma hissi veren (isteğe
   bağlı kamera açılabilen) ayna, günlük öz sevgi cümleleri, sesli
   tekrar (TTS), kendi olumlamanı yazma, "bugün kendine ne söylemek
   istersin?" alanı, günlük öz şefkat puanı ve favoriler.
   Global: window.Ayna
   ============================================================ */

const Ayna = window.Ayna = (() => {
  const $ = id => document.getElementById(id);
  function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  function bugun() { return todayKey(); }

  let stream = null, aktifOlumlama = "";

  /* ---------- öz şefkat puanı ---------- */
  function isaretle(flag) { Store.set("ayna-" + flag + "-" + bugun(), true); puanCiz(); }
  function puan() {
    const t = bugun();
    let p = 0;
    if (Store.get("ayna-acildi-" + t)) p += 15;
    if (Store.get("ayna-okundu-" + t)) p += 20;
    if (Store.get("ayna-yazdi-" + t)) p += 20;
    if ((Store.get("ayna-mesaj-" + t, "") || "").trim()) p += 15;
    if (Store.get("ayna-gorev-" + t)) p += 20;
    if (Store.get("ayna-favgun-" + t)) p += 10;
    return Math.min(100, p);
  }
  function puanCiz() { const el = $("ayna-puan"); if (el) el.innerHTML = `🤍 Öz Şefkat Puanın: <strong>%${puan()}</strong>`; }

  /* ---------- favori & kayıtlar ---------- */
  function favAl() { return Store.get("ayna-fav", []); }
  function favMi(t) { return favAl().includes(t); }
  function favToggle(t) {
    const l = favAl(); const i = l.indexOf(t);
    if (i >= 0) l.splice(i, 1); else { l.unshift(t); isaretle("favgun"); }
    Store.set("ayna-fav", l);
  }
  function cumlelerAl() { return Store.get("ayna-cumleler", []); }

  /* ---------- ses (TTS) ---------- */
  function konus(t) {
    if (!("speechSynthesis" in window) || !t) return;
    const synth = window.speechSynthesis; synth.cancel();
    const u = new SpeechSynthesisUtterance(t);
    const vs = synth.getVoices() || [];
    const tr = vs.find(v => /tr/i.test(v.lang) && /female|kad[ıi]n|yelda|filiz|google/i.test(v.name)) || vs.find(v => /tr/i.test(v.lang));
    if (tr) u.voice = tr;
    u.lang = "tr-TR"; u.rate = 0.92; u.pitch = 1.06;
    synth.speak(u);
    isaretle("okundu");
  }

  /* ---------- kamera ---------- */
  async function kameraAc() {
    if (stream) return kameraKapat();
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      const v = $("ayna-video"); v.srcObject = stream; v.hidden = false;
      $("ayna-glass").classList.add("kamerali");
      $("ayna-cam-yazi").textContent = "📷 Kamerayı Kapat";
      $("ayna-cam-not").textContent = "";
    } catch (e) {
      $("ayna-cam-not").textContent = "Kamera açılamadı; cam yansıma modu aktif 🤍";
    }
  }
  function kameraKapat() {
    if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
    const v = $("ayna-video"); if (v) { v.hidden = true; v.srcObject = null; }
    $("ayna-glass").classList.remove("kamerali");
    $("ayna-cam-yazi").textContent = "📷 Kamerayı Aç";
  }

  /* ---------- olumlama gösterimi ---------- */
  function olumlamaGoster(t) {
    aktifOlumlama = t;
    $("ayna-olumlama").textContent = t;
    $("ayna-fav").classList.toggle("aktif", favMi(t));
  }

  /* ---------- listeler ---------- */
  function cizListe() {
    const el = $("ayna-liste");
    if (!el) return;
    const fav = favAl(), cum = cumlelerAl();
    const sat = (t) => `<li><span class="liste-metin">${esc(t)}</span><button class="ayna-dinle-mini" data-t="${esc(t)}" aria-label="Dinle">🔊</button></li>`;
    el.innerHTML =
      (fav.length ? `<p class="cs-alt-baslik">Favori Olumlamalar</p><ul class="liste">${fav.map(sat).join("")}</ul>` : "") +
      (cum.length ? `<p class="cs-alt-baslik">Yazdığın Cümleler</p><ul class="liste">${cum.slice().reverse().map(c => sat(c.text)).join("")}</ul>` : (fav.length ? "" : `<p class="muted small">Henüz bir şey yazmadın 🤍</p>`));
    el.querySelectorAll(".ayna-dinle-mini").forEach(b => b.addEventListener("click", () => { olumlamaGoster(b.dataset.t); konus(b.dataset.t); }));
  }

  /* ---------- aç/kapat ---------- */
  function ac() {
    const ov = $("ayna-overlay");
    document.body.classList.add("ayna-mod");
    const p = Store.get("profil", {});
    const isim = (p.isim || "").trim();
    const foto = Store.get("profil-foto", null);
    const yans = $("ayna-yansima");
    if (foto) { yans.style.backgroundImage = `url(${foto})`; yans.textContent = ""; yans.classList.add("foto"); }
    else { yans.style.backgroundImage = ""; yans.classList.remove("foto"); yans.textContent = isim ? isim.charAt(0).toLocaleUpperCase("tr") : "🤍"; }
    olumlamaGoster(pickByDate(DATA.aynaOlumlamalari));
    $("ayna-gorev-metin").textContent = pickByDate(DATA.aynaGorevleri);
    $("ayna-gorev-btn").disabled = !!Store.get("ayna-gorev-" + bugun());
    $("ayna-gorev-btn").textContent = Store.get("ayna-gorev-" + bugun()) ? "Tamamlandı ✦" : "Tamamladım ✦";
    $("ayna-mesaj").value = Store.get("ayna-mesaj-" + bugun(), "");
    isaretle("acildi");
    cizListe(); puanCiz();
    ov.hidden = false; ov.classList.remove("gor"); void ov.offsetWidth; ov.classList.add("gor");
  }
  function kapat() {
    kameraKapat();
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    const ov = $("ayna-overlay");
    ov.classList.remove("gor");
    setTimeout(() => { ov.hidden = true; document.body.classList.remove("ayna-mod"); }, 400);
    girisGuncelle();
  }
  function girisGuncelle() {
    const el = $("am-puan"); if (!el) return;
    el.textContent = `🤍 Bugünkü öz şefkat: %${puan()}`;
  }
  function parcacikDoldur() {
    const k = $("ayna-parcaciklar"); if (!k || k.dataset.dolu) return;
    let s = "";
    for (let i = 0; i < 16; i++) s += `<span style="left:${(Math.random() * 100).toFixed(1)}%;top:${(Math.random() * 100).toFixed(1)}%;animation-delay:${(Math.random() * 6).toFixed(2)}s;animation-duration:${(7 + Math.random() * 7).toFixed(2)}s"></span>`;
    k.innerHTML = s; k.dataset.dolu = "1";
  }

  function baglan() {
    const acBtn = $("ayna-ac");
    if (acBtn) acBtn.addEventListener("click", ac);
    girisGuncelle();
    if (!$("ayna-overlay")) return;
    parcacikDoldur();
    $("ayna-kapat").addEventListener("click", kapat);
    $("ayna-bitir").addEventListener("click", kapat);
    $("ayna-cam").addEventListener("click", kameraAc);
    $("ayna-dinle").addEventListener("click", () => konus(aktifOlumlama));
    $("ayna-yeni").addEventListener("click", () => olumlamaGoster(DATA.aynaOlumlamalari[Math.floor(Math.random() * DATA.aynaOlumlamalari.length)]));
    $("ayna-fav").addEventListener("click", () => { favToggle(aktifOlumlama); $("ayna-fav").classList.toggle("aktif", favMi(aktifOlumlama)); cizListe(); });
    $("ayna-yazi-ekle").addEventListener("click", () => {
      const inp = $("ayna-yazi-input"); const v = (inp.value || "").trim();
      if (!v) { inp.focus(); return; }
      const c = cumlelerAl(); c.push({ text: v, tarih: bugun() }); Store.set("ayna-cumleler", c);
      inp.value = ""; isaretle("yazdi"); olumlamaGoster(v); cizListe();
    });
    $("ayna-mesaj-kaydet").addEventListener("click", () => {
      Store.set("ayna-mesaj-" + bugun(), ($("ayna-mesaj").value || "").trim());
      puanCiz();
      const b = $("ayna-mesaj-kaydet"); b.textContent = "Kaydedildi ✓"; setTimeout(() => b.textContent = "Kaydet", 1600);
    });
    $("ayna-gorev-btn").addEventListener("click", () => {
      Store.set("ayna-gorev-" + bugun(), true);
      $("ayna-gorev-btn").disabled = true; $("ayna-gorev-btn").textContent = "Tamamlandı ✦";
      puanCiz();
    });
  }

  document.addEventListener("DOMContentLoaded", baglan);
  return { ac, kapat };
})();
