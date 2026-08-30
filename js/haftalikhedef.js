/* ============================================================
   haftalikhedef.js — Haftalık Deneyim Hedefleri 🌟📸
   ------------------------------------------------------------
   Her pazar (00:00) yeni bir haftalık deneyim görevi rastgele atanır.
   Kullanıcı görevi gerçek hayatta yapar, FOTOĞRAF yükler ve tamamlar
   (fotoğrafsız tamamlanmaz). Tamamlanan deneyim "Deneyim Arşivim"e
   anı olarak eklenir; +XP kazandırır. Veriler Store → Supabase'e senkron.
   Global: window.HaftalikHedef
   ============================================================ */
const HaftalikHedef = window.HaftalikHedef = (() => {
  const $ = id => document.getElementById(id);
  const AKTIF = "hh-aktif";      // { hafta, hedefId, foto, tamam, tamamTarih }
  const ARSIV = "hh-arsiv";      // [ { hafta, hedefId, ad, emoji, tarih, foto } ]
  const XP = "hh-xp";            // toplam XP
  const GECMIS = "hh-gecmis";    // son atanan hedef id'leri (yakın tekrarı azalt)

  function pool() { return window.HAFTALIK_HEDEFLER || []; }
  function hedefById(id) { return pool().find(h => h.id === id) || pool()[0]; }

  /* ---- hafta hesabı: hafta PAZAR günü başlar ---- */
  function pazarBaslangic(d) {
    const x = new Date(d || Date.now()); x.setHours(0, 0, 0, 0);
    x.setDate(x.getDate() - x.getDay());   // getDay: 0=Pazar
    return x;
  }
  function gunStr(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function haftaAnahtar() { return gunStr(pazarBaslangic()); }
  function kalanGun() {
    const sonraki = pazarBaslangic(); sonraki.setDate(sonraki.getDate() + 7);
    return Math.max(0, Math.ceil((sonraki - Date.now()) / 86400000));
  }

  /* ---- hedef seçimi (yakın tekrarı azalt) ---- */
  function hedefSec() {
    const liste = pool(); if (!liste.length) return null;
    let g; try { g = Store.get(GECMIS, []) || []; } catch (e) { g = []; }
    if (!Array.isArray(g)) g = [];
    const maxG = Math.min(liste.length - 1, 6);
    let aday = liste.filter(h => g.indexOf(h.id) === -1);
    if (!aday.length) aday = liste.slice();
    const h = aday[Math.floor(Math.random() * aday.length)];
    g.push(h.id); while (g.length > maxG) g.shift();
    Store.set(GECMIS, g);
    return h;
  }

  /* ---- aktif hafta görevi (gerekirse yeni atar) ---- */
  function aktifAl() {
    let a = Store.get(AKTIF, null);
    const wk = haftaAnahtar();
    if (!a || a.hafta !== wk || !hedefById(a.hedefId)) {
      const h = hedefSec(); if (!h) return null;
      a = { hafta: wk, hedefId: h.id, foto: null, tamam: false, tamamTarih: null };
      Store.set(AKTIF, a);
    }
    return a;
  }

  function arsiv() { const a = Store.get(ARSIV, []) || []; return Array.isArray(a) ? a : []; }
  function xpToplam() { return Number(Store.get(XP, 0)) || 0; }
  function istatistik() {
    const ar = arsiv();
    return { tamamlanan: ar.length, ani: ar.length, foto: ar.filter(x => x.foto).length, xp: xpToplam() };
  }
  // Haftalık değerlendirme için durum cümlesi
  function buHaftaDurum() {
    const a = Store.get(AKTIF, null);
    return (a && a.hafta === haftaAnahtar() && a.tamam)
      ? "🌟 Bu hafta deneyim görevini tamamladın."
      : "🌟 Bu hafta deneyim görevini henüz tamamlamadın.";
  }

  /* ---- görsel küçültme (kare-uyumlu, mobil dostu) ---- */
  function kucult(file) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => {
        const img = new Image();
        img.onload = () => {
          const max = 1000;
          let { width: w, height: h } = img;
          if (w > max || h > max) { const o = max / Math.max(w, h); w = Math.round(w * o); h = Math.round(h * o); }
          const c = document.createElement("canvas"); c.width = w; c.height = h;
          c.getContext("2d").drawImage(img, 0, 0, w, h);
          resolve(c.toDataURL("image/jpeg", 0.72));
        };
        img.onerror = reject; img.src = fr.result;
      };
      fr.onerror = reject; fr.readAsDataURL(file);
    });
  }

  async function fotoSec(file) {
    if (!file) return;
    const durum = $("hh-foto-durum");
    try {
      if (durum) durum.textContent = "Fotoğraf hazırlanıyor…";
      const dataUrl = await kucult(file);
      const a = aktifAl(); a.foto = dataUrl; Store.set(AKTIF, a);
      ciz();
    } catch (e) { if (durum) durum.textContent = "Fotoğraf yüklenemedi, tekrar dene."; }
  }

  function tamamla() {
    const a = aktifAl(); if (!a) return;
    if (!a.foto) { const d = $("hh-foto-durum"); if (d) d.textContent = "Önce bir fotoğraf yükle 📸"; return; }
    if (a.tamam) return;
    const h = hedefById(a.hedefId);
    a.tamam = true; a.tamamTarih = gunStr(new Date()); Store.set(AKTIF, a);
    // arşive anı olarak ekle
    const ar = arsiv();
    ar.push({ hafta: a.hafta, hedefId: h.id, ad: h.ad, emoji: h.emoji, tarih: a.tamamTarih, foto: a.foto });
    Store.set(ARSIV, ar);
    // XP ver
    Store.set(XP, xpToplam() + (h.xp || 100));
    ciz(); arsivCiz(); istatCiz();
    if (window.Hafta && Hafta.ciz) Hafta.ciz();
    kutla(h);
    // İyi an → native uygulamada nazikçe puan iste (yalnız Play sürümü)
    try { if (window.Puanla) Puanla.isteGecikmeli("haftalik-hedef", 2200); } catch (e) {}
    // Otomatik topluluk paylaşımı (onay kutusu işaretliyse) → topluluğu canlı tutar
    toplulukaPaylas(h, a.foto);
  }

  /* ---- deneyim fotoğrafını otomatik toplulukta paylaş ---- */
  function dataUrlToBlob(dataUrl) {
    try {
      const [head, b64] = String(dataUrl).split(",");
      const mime = (head.match(/:(.*?);/) || [])[1] || "image/jpeg";
      const bin = atob(b64); const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      return new Blob([arr], { type: mime });
    } catch (e) { return null; }
  }
  async function toplulukaPaylas(h, fotoDataUrl) {
    const onay = $("hh-paylas-onay");
    if (onay && !onay.checked) return;                        // kullanıcı paylaşmak istemedi
    const not = () => $("hh-tamam-not");
    const girisli = !!(window.Bulut && Bulut.girisli && Bulut.girisli());
    if (!girisli) { const n = not(); if (n) n.textContent = "Deneyimin arşivine eklendi 🌟 Toplulukta da paylaşmak istersen Profil → Hesap'tan giriş yap."; return; }
    if (!(window.ToplulukSosyal && ToplulukSosyal.paylas && ToplulukSosyal.fotoYukle)) return;
    { const n = not(); if (n) n.textContent = "🌐 Deneyimin toplulukta paylaşılıyor…"; }
    try {
      const blob = fotoDataUrl ? dataUrlToBlob(fotoDataUrl) : null;
      const url = blob ? await ToplulukSosyal.fotoYukle(blob) : null;
      const metin = `🌟 Bu haftaki deneyimim: ${h.emoji || ""} ${h.ad}`;
      const r = await ToplulukSosyal.paylas("basari", metin, url);
      const n = not();
      if (n) n.textContent = (r && r.ok)
        ? "✅ Deneyimin toplulukta paylaşıldı — onaydan sonra Haftanın Işığı'nda herkes görecek 🌟"
        : ("Deneyimin arşivine eklendi 🌟 (Toplulukta paylaşılamadı" + ((r && r.mesaj) ? ": " + r.mesaj : "") + ")");
    } catch (e) { const n = not(); if (n) n.textContent = "Deneyimin arşivine eklendi 🌟"; }
  }

  /* ---- kutlama ---- */
  function kutla(h) {
    let el = $("hh-kutlama");
    if (!el) {
      el = document.createElement("div"); el.id = "hh-kutlama"; el.className = "hh-kutlama"; el.hidden = true;
      el.innerHTML = `<div class="hh-kutlama-ic">
        <div class="hh-kutlama-emoji"></div>
        <div class="hh-kutlama-baslik">Haftalık görev tamamlandı ✅</div>
        <div class="hh-kutlama-xp"></div>
        <div class="hh-kutlama-not">Bu anı Deneyim Arşivine eklendi 📖</div>
        <button class="btn sm" id="hh-kutlama-kapat">Harika ✨</button>
      </div>`;
      document.body.appendChild(el);
      el.addEventListener("click", e => { if (e.target === el || e.target.id === "hh-kutlama-kapat") { el.classList.remove("gor"); setTimeout(() => { el.hidden = true; }, 300); } });
    }
    el.querySelector(".hh-kutlama-emoji").textContent = h.emoji || "🌟";
    el.querySelector(".hh-kutlama-xp").textContent = "+" + (h.xp || 100) + " XP";
    el.hidden = false; void el.offsetWidth; el.classList.add("gor");
  }

  /* ---- aktif görev kartı (ana sayfa) ---- */
  function ciz() {
    if (!$("hh-kart")) return;
    const a = aktifAl(); if (!a) return;
    const h = hedefById(a.hedefId);
    $("hh-emoji").textContent = h.emoji;
    $("hh-ad").textContent = h.ad;
    $("hh-aciklama").textContent = h.aciklama;
    $("hh-xp-rozet").textContent = "+" + (h.xp || 100) + " XP";

    const tamamAlan = $("hh-tamam-alan"), aktifAlan = $("hh-aktif-alan");
    if (a.tamam) {
      aktifAlan.hidden = true; tamamAlan.hidden = false;
      $("hh-tamam-foto").src = a.foto || "";
      $("hh-tamam-not").textContent = "Bu haftaki deneyimini tamamladın 🌟 Bir sonraki pazar yeni bir görev seni bekliyor.";
    } else {
      tamamAlan.hidden = true; aktifAlan.hidden = false;
      $("hh-kalan").textContent = kalanGun() + " gün kaldı";
      const onz = $("hh-foto-onizleme");
      if (a.foto) { onz.src = a.foto; onz.hidden = false; $("hh-foto-btn-metin").textContent = "Fotoğrafı Değiştir"; }
      else { onz.hidden = true; onz.removeAttribute("src"); $("hh-foto-btn-metin").textContent = "Fotoğraf Yükle"; }
      const tb = $("hh-tamamla"); tb.disabled = !a.foto;
      $("hh-foto-durum").textContent = a.foto ? "" : "Tamamlamak için bir fotoğraf yükle 📸";
    }
  }

  /* ---- istatistikler (profil) ---- */
  function istatCiz() {
    const el = $("hh-istat"); if (!el) return;
    const s = istatistik();
    el.innerHTML =
      `<div class="hh-stat"><span class="hh-stat-sayi">${s.tamamlanan}</span><span class="hh-stat-ad">Tamamlanan Hedef</span></div>
       <div class="hh-stat"><span class="hh-stat-sayi">${s.ani}</span><span class="hh-stat-ad">Anı</span></div>
       <div class="hh-stat"><span class="hh-stat-sayi">${s.foto}</span><span class="hh-stat-ad">Fotoğraf</span></div>
       <div class="hh-stat"><span class="hh-stat-sayi">${s.xp}</span><span class="hh-stat-ad">XP</span></div>`;
  }

  /* ---- Deneyim Arşivim (albüm) ---- */
  function arsivCiz() {
    const el = $("hh-arsiv"); if (!el) return;
    const ar = arsiv().slice().reverse();
    const bos = $("hh-arsiv-bos");
    if (!ar.length) { el.innerHTML = ""; if (bos) bos.hidden = false; return; }
    if (bos) bos.hidden = true;
    el.innerHTML = ar.map(x => {
      const t = (() => { try { return keyToDate(x.tarih).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }); } catch (e) { return x.tarih; } })();
      return `<figure class="hh-ani">
        <div class="hh-ani-foto">${x.foto ? `<img src="${x.foto}" alt="" loading="lazy"/>` : `<span class="hh-ani-yok">${x.emoji || "🌟"}</span>`}</div>
        <figcaption><span class="hh-ani-ad">${x.emoji || "🌟"} ${escapeHtmlHH(x.ad)}</span><span class="hh-ani-tarih">${t}</span></figcaption>
      </figure>`;
    }).join("");
  }
  function escapeHtmlHH(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

  function baglan() {
    if (!$("hh-kart")) return;
    ciz(); istatCiz(); arsivCiz();
    const inp = $("hh-foto-input");
    if (inp) inp.addEventListener("change", e => { const f = e.target.files && e.target.files[0]; fotoSec(f); e.target.value = ""; });
    const tb = $("hh-tamamla"); if (tb) tb.addEventListener("click", tamamla);
  }
  document.addEventListener("DOMContentLoaded", baglan);

  return { ciz, istatCiz, arsivCiz, buHaftaDurum, istatistik };
})();
