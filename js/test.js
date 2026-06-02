/* ============================================================
   test.js — Spiritüel Başlangıç Testi 🧠✨
   İlk açılışta (isim onboarding'inden sonra) çözülen kısa farkındalık
   testi. Skor → 6 sonuç kategorisinden biri. Sonuç ekranında analiz +
   meditasyon + olumlama + kart + ritüel önerisi. Sonuç profile kaydedilir,
   tekrar çözülebilir, ana ekran önerilerini kişiselleştirir.
   Global: window.SpiriTest
   ============================================================ */

const SpiriTest = window.SpiriTest = (() => {
  const $ = id => document.getElementById(id);
  let adim = 0, puan = {}, acik = false;

  function sorular() { return DATA.spiriTest.sorular; }
  function kartBul(b) { return (DATA.kartlar || []).find(k => k.baslik === b); }
  function katAd(id) { const k = (DATA.muzikKategorileri || []).find(x => x.id === id); return k ? k.ad : id; }
  function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

  function kazanan() {
    const onc = DATA.spiriTest.oncelik;
    let en = onc[0], enP = -1;
    onc.forEach(k => { const p = puan[k] || 0; if (p > enP) { enP = p; en = k; } });
    return en;
  }

  /* ---------- soru aşaması ---------- */
  function soruCiz() {
    const s = sorular()[adim];
    $("test-ilerleme-dolu").style.width = (adim / sorular().length * 100) + "%";
    $("test-adim").textContent = `${adim + 1} / ${sorular().length}`;
    $("test-soru").textContent = s.soru;
    const kutu = $("test-secenekler");
    kutu.innerHTML = "";
    s.secenekler.forEach(sec => {
      const b = document.createElement("button");
      b.className = "test-secenek";
      b.textContent = sec.metin;
      b.addEventListener("click", () => sec_(sec));
      kutu.appendChild(b);
    });
    gecisAnim();
  }
  function sec_(sec) {
    puan[sec.kat] = (puan[sec.kat] || 0) + 1;
    adim++;
    if (adim >= sorular().length) sonucCiz();
    else soruCiz();
  }
  function gecisAnim() {
    const k = $("test-kart");
    k.classList.remove("gecis"); void k.offsetWidth; k.classList.add("gecis");
  }

  /* ---------- sonuç aşaması ---------- */
  function sonucCiz() {
    const katKey = kazanan();
    const r = DATA.spiriTest.sonuclar[katKey];
    Store.set("spiritest-sonuc", { kat: katKey, ad: r.ad, tarih: todayKey() });

    $("test-soru-alan").hidden = true;
    const alan = $("test-sonuc-alan");
    alan.hidden = false;
    const kart = kartBul(r.kartBaslik);
    alan.innerHTML = `
      <div class="ts-parcacik" id="ts-parcacik" aria-hidden="true"></div>
      <div class="ts-rozet">Spiritüel Profilin</div>
      <h2 class="ts-ad">${esc(r.ad)}</h2>
      <p class="ts-analiz">${esc(r.analiz)}</p>
      <div class="altin-divider"></div>
      <div class="ts-oneri"><span class="ts-et">Olumlama</span><p>“${esc(r.olumlama)}”</p></div>
      <div class="ts-oneri"><span class="ts-et">Önerilen Meditasyon · ${esc(katAd(r.meditasyonKategori))}</span>
        <button class="btn ghost sm" id="ts-med">Meditasyona Git →</button></div>
      ${kart ? `<div class="ts-oneri"><span class="ts-et">Önerilen Kart</span>
        <div class="ts-kart"><img src="${encodeURI(kart.img)}" alt="${esc(kart.baslik)}" loading="lazy"/>
        <div><strong>${esc(kart.baslik)}</strong><p>${esc(kart.mesaj)}</p></div></div></div>` : ""}
      <div class="ts-oneri"><span class="ts-et">Önerilen Ritüel</span><p>${esc(r.rituel)}</p></div>
      <button class="btn ts-bitir" id="ts-bitir">Yolculuğuma Başla ✦</button>`;

    parcacik();
    $("test-ilerleme-dolu").style.width = "100%";
    $("ts-med").addEventListener("click", () => {
      kapat();
      if (typeof window.setMeditasyonKategori === "function") window.setMeditasyonKategori(r.meditasyonKategori);
      if (typeof window.gotoView === "function") window.gotoView("meditasyon");
    });
    $("ts-bitir").addEventListener("click", kapat);

    if (window.Profil) window.Profil.ciz();
    if (window.Muzik) window.Muzik.ciz && window.Muzik.ciz();
  }

  function parcacik() {
    const kutu = $("ts-parcacik");
    if (!kutu) return;
    let s = "";
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * 360, dist = 50 + Math.random() * 60;
      const x = Math.cos(a * Math.PI / 180) * dist, y = Math.sin(a * Math.PI / 180) * dist;
      s += `<span style="--x:${x.toFixed(0)}px;--y:${y.toFixed(0)}px;animation-delay:${(Math.random() * 0.15).toFixed(2)}s"></span>`;
    }
    kutu.innerHTML = s;
    setTimeout(() => { if (kutu) kutu.innerHTML = ""; }, 1200);
  }

  /* ---------- akış ---------- */
  function baslat() {
    if (acik) return;
    acik = true;
    adim = 0; puan = {};
    $("test-soru-alan").hidden = false;
    $("test-sonuc-alan").hidden = true;
    const ov = $("test-overlay");
    ov.hidden = false;
    ov.classList.remove("gor"); void ov.offsetWidth; ov.classList.add("gor");
    soruCiz();
  }
  function kapat() {
    const ov = $("test-overlay");
    ov.classList.remove("gor");
    setTimeout(() => { ov.hidden = true; acik = false; }, 400);
  }

  function baglan() {
    if (!$("test-overlay")) return;
    // İsim var ama test çözülmemişse otomatik başlat (geri dönen kullanıcı)
    const isim = (Store.get("profil", {}).isim || "").trim();
    if (isim && !Store.get("spiritest-sonuc")) setTimeout(baslat, 700);
  }

  document.addEventListener("DOMContentLoaded", baglan);
  return { baslat, kapat };
})();
