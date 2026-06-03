/* ============================================================
   nefes.js — Nefes & Sakinleşme Alanı 🌬️✨
   "Şu an sakinleşmek istiyorum" → rehberli nefes egzersizi. Merkezde
   genişleyip küçülen ışık küresi, nefes al/tut/ver yönlendirmesi,
   5 nefes türü, süre seçimi, sakin arka plan sesi, titreşim ve seans
   geçmişi. Ruh hali düşükse ana ekranda nefes önerisi gösterir.
   Global: window.Nefes
   ============================================================ */

const Nefes = window.Nefes = (() => {
  const $ = id => document.getElementById(id);
  function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

  let seciliTur = DATA.nefesTurleri[0], seciliSure = 180;  // saniye
  let sesAcik = true, titresimAcik = true;
  let calisiyor = false, fazTimer = null, sayacTimer = null, seansBitis = 0, dongu = 0;

  function seanslar() { return Store.get("nefes-seanslar", []); }
  function seansKaydet(turAd, dk) {
    const l = seanslar();
    l.unshift({ tarih: todayKey(), tur: turAd, dk });
    while (l.length > 50) l.pop();
    Store.set("nefes-seanslar", l);
  }

  /* ---------- nefes döngüsü ---------- */
  function fazlarOf(t) {
    const f = [{ ad: "Nefes Al", sure: t.al, sinif: "genis" }];
    if (t.tut > 0) f.push({ ad: "Tut", sure: t.tut, sinif: "tut" });
    f.push({ ad: "Ver", sure: t.ver, sinif: "dar" });
    return f;
  }
  function seansBaslat() {
    calisiyor = true; dongu = 0;
    seansBitis = Date.now() + seciliSure * 1000;
    $("nefes-tur-ad").textContent = seciliTur.ad;
    const kure = $("nefes-kure"); kure.style.background = `radial-gradient(circle at 38% 32%, ${seciliTur.renk[0]}, ${seciliTur.renk[1]})`;
    if (sesAcik) SesMotoru.cal({ tip: "pad", alt: "derin" });
    const fazlar = fazlarOf(seciliTur);
    let fi = 0;
    const faz = $("nefes-faz");
    const adim = () => {
      if (!calisiyor) return;
      if (Date.now() >= seansBitis) { bitir(true); return; }
      const f = fazlar[fi];
      faz.textContent = f.ad;
      kure.style.transitionDuration = f.sure + "s";
      kure.className = "nefes-kure " + f.sinif;
      if (titresimAcik && navigator.vibrate) navigator.vibrate(f.sinif === "genis" ? 180 : f.sinif === "dar" ? [60, 60, 60] : 40);
      if (fi === fazlar.length - 1) dongu++;
      fi = (fi + 1) % fazlar.length;
      fazTimer = setTimeout(adim, f.sure * 1000);
    };
    adim();
    sayacTimer = setInterval(sayacGuncelle, 500);
  }
  function sayacGuncelle() {
    if (!calisiyor) return;
    const kalan = Math.max(0, Math.round((seansBitis - Date.now()) / 1000));
    $("nefes-sayac").textContent = `${Math.floor(kalan / 60)}:${String(kalan % 60).padStart(2, "0")} · ${dongu} döngü`;
  }
  function bitir(tamam) {
    calisiyor = false;
    if (fazTimer) clearTimeout(fazTimer);
    if (sayacTimer) clearInterval(sayacTimer);
    SesMotoru.durdur();
    if (navigator.vibrate) navigator.vibrate(0);
    if (tamam) seansKaydet(seciliTur.ad, Math.round(seciliSure / 60));
    $("nefes-seans").hidden = true;
    const b = $("nefes-bitti"); b.hidden = false;
    b.innerHTML = `<div class="nefes-bitti-ay">🌙</div><p class="nefes-bitti-mesaj">${tamam ? "Harika, biraz daha sakinsin ✨" : "Kendine zaman ayırdığın için teşekkürler 🤍"}</p>
      <p class="muted small">Toplam ${seanslar().length} nefes seansı tamamladın.</p>
      <div class="nefes-bitti-btns"><button class="btn ghost sm" id="nefes-tekrar">Tekrar</button><button class="btn" id="nefes-bitti-kapat">Kapat</button></div>`;
    $("nefes-tekrar").addEventListener("click", () => { $("nefes-bitti").hidden = true; setupGoster(); });
    $("nefes-bitti-kapat").addEventListener("click", kapat);
  }

  /* ---------- setup ---------- */
  function setupGoster() {
    $("nefes-bitti").hidden = true; $("nefes-seans").hidden = true; $("nefes-setup").hidden = false;
    cizTurler(); cizSureler(); cizAyarlar(); cizGecmis();
  }
  function cizTurler() {
    const kutu = $("nefes-turler"); kutu.innerHTML = "";
    DATA.nefesTurleri.forEach(t => {
      const b = document.createElement("button");
      b.className = "nefes-tur-btn" + (seciliTur.id === t.id ? " aktif" : "");
      b.innerHTML = `<strong>${esc(t.ad)}</strong><span>${esc(t.aciklama)}</span><small>${t.al}-${t.tut}-${t.ver}</small>`;
      b.addEventListener("click", () => { seciliTur = t; cizTurler(); });
      kutu.appendChild(b);
    });
  }
  function cizSureler() {
    const kutu = $("nefes-sureler"); kutu.innerHTML = "";
    [[60, "1 dk"], [180, "3 dk"], [300, "5 dk"]].forEach(([sn, ad]) => {
      const b = document.createElement("button");
      b.className = "nefes-sure-btn" + (seciliSure === sn ? " aktif" : "");
      b.textContent = ad;
      b.addEventListener("click", () => { seciliSure = sn; cizSureler(); });
      kutu.appendChild(b);
    });
  }
  function cizAyarlar() {
    const ses = $("nefes-ses-toggle"), tit = $("nefes-titresim-toggle");
    sesAcik = Store.get("nefes-ses", true); titresimAcik = Store.get("nefes-titresim", true);
    ses.checked = sesAcik; tit.checked = titresimAcik;
    ses.onchange = () => { sesAcik = ses.checked; Store.set("nefes-ses", sesAcik); };
    tit.onchange = () => { titresimAcik = tit.checked; Store.set("nefes-titresim", titresimAcik); };
  }
  function cizGecmis() {
    const el = $("nefes-gecmis");
    if (!el) return;
    const l = seanslar().slice(0, 8);
    el.innerHTML = l.length
      ? `<p class="cs-alt-baslik">Son seanslar (${seanslar().length})</p><div class="kader-mini">${l.map(x => `<span class="kader-cip">${x.tarih} · ${esc(x.tur)} · ${x.dk}dk</span>`).join("")}</div>`
      : `<p class="muted small">Henüz nefes seansın yok.</p>`;
  }

  /* ---------- aç/kapat ---------- */
  function ac() {
    const ov = $("nefes-overlay");
    document.body.classList.add("nefes-mod");
    setupGoster();
    ov.hidden = false; ov.classList.remove("gor"); void ov.offsetWidth; ov.classList.add("gor");
  }
  function basla() {
    $("nefes-setup").hidden = true; $("nefes-bitti").hidden = true; $("nefes-seans").hidden = false;
    const kure = $("nefes-kure"); kure.className = "nefes-kure"; $("nefes-faz").textContent = "Hazırlan";
    setTimeout(seansBaslat, 500);
  }
  function kapat() {
    if (calisiyor) bitir(false);
    const ov = $("nefes-overlay");
    ov.classList.remove("gor");
    SesMotoru.durdur();
    setTimeout(() => { ov.hidden = true; document.body.classList.remove("nefes-mod"); }, 400);
  }

  function parcacikDoldur() {
    const k = $("nefes-parcaciklar"); if (!k || k.dataset.dolu) return;
    let s = "";
    for (let i = 0; i < 16; i++) s += `<span style="left:${(Math.random() * 100).toFixed(1)}%;top:${(Math.random() * 100).toFixed(1)}%;animation-delay:${(Math.random() * 6).toFixed(2)}s;animation-duration:${(6 + Math.random() * 8).toFixed(2)}s"></span>`;
    k.innerHTML = s; k.dataset.dolu = "1";
  }

  /* Ana ekran giriş kartı + ruh hali önerisi */
  function girisGuncelle() {
    const el = $("nf-oneri"), kart = $("nefes-giris");
    if (!el) return;
    const mood = (typeof moodKeyNormalize === "function") ? moodKeyNormalize(Store.get("mood-" + todayKey())) : null;
    const dusuk = mood === "low" || mood === "down";
    el.textContent = dusuk ? "Şu an kısa bir nefes egzersizi sana iyi gelebilir 🌙" : "Stres veya yoğunlukta tek tıkla sakinleş";
    if (kart) kart.classList.toggle("oneri-aktif", dusuk);
  }

  function baglan() {
    const acBtn = $("nefes-ac");
    if (acBtn) acBtn.addEventListener("click", ac);
    girisGuncelle();
    if (!$("nefes-overlay")) return;
    parcacikDoldur();
    $("nefes-kapat").addEventListener("click", kapat);
    $("nefes-basla").addEventListener("click", basla);
    $("nefes-bitir-erken").addEventListener("click", () => bitir(false));
  }

  document.addEventListener("DOMContentLoaded", baglan);
  return { ac, kapat, girisGuncelle };
})();
