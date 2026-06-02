/* ============================================================
   ay.js — Gerçek zamanlı Ay Evresi sistemi.
   Senodik ay döngüsünden güncel evreyi hesaplar, dinamik bir SVG
   ay (aydınlanan kısım faza göre çizilir) ve spiritüel açıklama gösterir.
   İçerik DATA.ayEvreleri içinden gelir. Global: window.AyEvresi
   ============================================================ */

const AyEvresi = (() => {
  const SENODIK = 29.53058867;                 // ortalama senodik ay (gün)
  const REF_YENI_AY = Date.UTC(2000, 0, 6, 18, 14, 0); // bilinen yeni ay (ms)

  /* Faz kesri: 0 = Yeni Ay · 0.5 = Dolunay · → 1 = tekrar Yeni Ay */
  function fraz(d = new Date()) {
    const gun = (d.getTime() - REF_YENI_AY) / 86400000;
    let f = (gun % SENODIK) / SENODIK;
    if (f < 0) f += 1;
    return f;
  }

  /* Aydınlanma oranı (0..1) */
  function aydinlanma(f) {
    return (1 - Math.cos(2 * Math.PI * f)) / 2;
  }

  /* 8 evreden hangisi (DATA.ayEvreleri index'i) — her evre ~1/8'lik pencere */
  function evreIndex(f) {
    return Math.floor(((f + 0.0625) % 1) * 8) % 8;
  }

  /* Aydınlanan kısmın SVG path'i (daire merkezi 0,0, yarıçap r).
     Dış yarım daire (aydınlık yarımküre) + terminatör elipsi ile çizilir. */
  function isikPath(f, r = 48) {
    const cos = Math.cos(2 * Math.PI * f);
    const rx = (Math.abs(cos) * r).toFixed(2);
    let sweepA, sweepB;
    if (f <= 0.5) { sweepA = 1; sweepB = cos > 0 ? 0 : 1; }   // büyüyen: sağ aydınlık
    else { sweepA = 0; sweepB = cos > 0 ? 1 : 0; }            // solan: sol aydınlık
    return `M0,${-r} A${r},${r} 0 0 ${sweepA} 0,${r} A${rx},${r} 0 0 ${sweepB} 0,${-r} Z`;
  }

  function svg(f) {
    return `<svg viewBox="-50 -50 100 100" class="ay-svg" aria-hidden="true">
      <defs>
        <radialGradient id="ayIsikG" cx="40%" cy="35%" r="75%">
          <stop offset="0%" stop-color="#fff4d6"/>
          <stop offset="60%" stop-color="#f3d98c"/>
          <stop offset="100%" stop-color="#e9c46a"/>
        </radialGradient>
      </defs>
      <circle r="48" fill="#160f33" stroke="rgba(179,140,255,0.25)" stroke-width="1.5"/>
      <path d="${isikPath(f)}" fill="url(#ayIsikG)"/>
      <circle r="48" fill="none" stroke="rgba(233,196,106,0.4)" stroke-width="1.5"/>
    </svg>`;
  }

  function ciz() {
    const gorsel = document.getElementById("ay-gorsel");
    const ad = document.getElementById("ay-ad");
    const aciklama = document.getElementById("ay-aciklama");
    const oran = document.getElementById("ay-aydinlanma");
    if (!gorsel || !ad || !aciklama || !DATA.ayEvreleri) return;

    const f = fraz();
    const evre = DATA.ayEvreleri[evreIndex(f)];
    gorsel.innerHTML = svg(f);
    ad.textContent = `${evre.emoji} ${evre.ad}`;
    aciklama.textContent = evre.aciklama;
    if (oran) oran.textContent = `Aydınlanma: %${Math.round(aydinlanma(f) * 100)}`;
  }

  document.addEventListener("DOMContentLoaded", ciz);

  return { fraz, aydinlanma, evreIndex, ciz };
})();
