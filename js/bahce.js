/* ============================================================
   bahce.js — Işık Bahçesi 🌱 (büyüyen görsel yolculuk)
   ------------------------------------------------------------
   Toplam yolculuk gününe (streakBilgisi().toplam) göre büyüyen canlı
   bir bahçe çizer: tohum → filiz → fidan → çiçekler → ay ışığında tam
   açmış bahçe. Bugün görev/ruh hali/kart yaptıysan ekstra parıltı ("bugünün
   ışığı"). Görev/ritüel/mood kaydında app.js & diğerleri Bahce.ciz() çağırır.
   Global: window.Bahce  ·  hedef: alışkanlık + görsel ödül.
   ============================================================ */
window.Bahce = (() => {
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // Renk paleti
  const YESIL = "#4bbd8b", YESIL2 = "#2f9e73", SAP = "#3f9d74";
  const CICEK = ["#f6c6e0", "#f3d98c", "#c9a7ff", "#ffd0b0", "#b8e0ff"];

  function toplamGun() { try { return (streakBilgisi().toplam) || 0; } catch (e) { return 0; } }
  function bugunKey() { try { return todayKey(); } catch (e) { return ""; } }
  function bugunEylem() {
    const t = bugunKey();
    let n = 0;
    try { if (Store.get("task-" + t)) n++; } catch (e) {}
    try { if (Store.get("mood-" + t)) n++; } catch (e) {}
    try { if (Store.get("kart-" + t) || Store.get("card-" + t) || Store.get("gununkarti-" + t)) n++; } catch (e) {}
    return n; // 0..3
  }

  // Toplam güne göre aşama (0..5) — streakSeviyeleri eşiklerine (3/7/21/30) hizalı
  function asama(g) {
    if (g < 1) return 0;       // tohum
    if (g < 3) return 1;       // filiz
    if (g < 7) return 2;       // fidan (🌱 Başlangıç)
    if (g < 21) return 3;      // çiçekleniyor (🔥 İstikrar)
    if (g < 30) return 4;      // canlı bahçe (🌟 Farkındalık)
    return 5;                  // tam açmış (🌙 İçsel Uyanış)
  }
  const ASAMA_AD = ["Tohum", "Filiz", "Fidan", "Çiçekleniyor", "Canlı Bahçe", "Tam Açmış Bahçe"];

  /* ---------- SVG parçaları ---------- */
  function yaprak(x, y, yon, s) {
    const d = yon < 0 ? -1 : 1;
    return `<path d="M${x} ${y} q ${18 * d} -10 ${30 * d} -2 q -12 12 -30 2 z" fill="${YESIL}" opacity="0.95" transform="scale(${s},${s})" transform-origin="${x} ${y}"/>`;
  }
  function cicek(x, y, r, renk, i) {
    let petals = "";
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2 + (i || 0);
      const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
      petals += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${(r * 0.72).toFixed(1)}" fill="${renk}" opacity="0.92"/>`;
    }
    return `<g class="bh-cicek" style="transform-origin:${x}px ${y}px">${petals}<circle cx="${x}" cy="${y}" r="${(r * 0.6).toFixed(1)}" fill="#fff3c9"/></g>`;
  }
  function atesbocegi(x, y, gecikme) {
    return `<circle class="bh-firefly" cx="${x}" cy="${y}" r="2.4" fill="#fff2b0" style="animation-delay:${gecikme}s"/>`;
  }
  function yildiz(x, y, gecikme) {
    return `<circle class="bh-yildiz" cx="${x}" cy="${y}" r="1.3" fill="#fff" style="animation-delay:${gecikme}s"/>`;
  }

  function sahne(g) {
    const a = asama(g);
    const bugun = bugunEylem();                       // 0..3 bugünkü eylem
    const W = 300, H = 220, taban = 196, merkez = 150;

    // Ay parlaklığı: 30 güne doğru artar, sonra tam
    const ayIsik = Math.min(1, 0.35 + (g / 30) * 0.65);
    const ayR = 20 + Math.min(10, g / 3);

    // Yıldızlar
    let gokyuzu = "";
    const yildizlar = [[40, 30], [80, 55], [120, 25], [210, 40], [250, 60], [190, 22], [30, 70], [270, 30]];
    yildizlar.forEach((p, i) => gokyuzu += yildiz(p[0], p[1], (i * 0.3).toFixed(1)));

    // Ay
    const ay = `<g opacity="${ayIsik.toFixed(2)}">
      <circle cx="240" cy="52" r="${(ayR + 6).toFixed(0)}" fill="#f3d98c" opacity="0.16"/>
      <circle cx="240" cy="52" r="${ayR.toFixed(0)}" fill="#fdf4d6"/>
      <circle cx="248" cy="48" r="${(ayR * 0.85).toFixed(0)}" fill="#1a1436"/>
    </g>`;

    // Toprak / tepe
    const yer = `<ellipse cx="${merkez}" cy="${taban + 14}" rx="150" ry="34" fill="#241a44"/>
                 <ellipse cx="${merkez}" cy="${taban + 8}" rx="120" ry="22" fill="#2e2350"/>`;

    // Bitki
    let bitki = "";
    if (a === 0) {
      // tohum
      bitki = `<ellipse cx="${merkez}" cy="${taban - 2}" rx="10" ry="6" fill="#3a2c14"/>
               <circle cx="${merkez}" cy="${taban - 4}" r="4" fill="#caa15a"/>`;
    } else {
      const boy = [0, 26, 60, 92, 118, 142][a];
      const tepe = taban - boy;
      // sap
      bitki += `<path d="M${merkez} ${taban} C ${merkez - 8} ${taban - boy * 0.4}, ${merkez + 8} ${tepe + boy * 0.4}, ${merkez} ${tepe}" stroke="${SAP}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
      // yapraklar (boya göre çift)
      const yaprakSayi = Math.min(6, a + 1);
      for (let i = 0; i < yaprakSayi; i++) {
        const yy = taban - (boy * (i + 1) / (yaprakSayi + 1));
        const yon = i % 2 === 0 ? 1 : -1;
        bitki += `<path d="M${merkez} ${yy.toFixed(1)} q ${20 * yon} -12 ${34 * yon} -3 q ${-14 * yon} 13 ${-34 * yon} 3 z" fill="${i % 2 ? YESIL2 : YESIL}" opacity="0.95"/>`;
      }
      // çiçekler
      let cicekSayi = [0, 0, 1, 2, 4, 5][a];
      if (a === 5) cicekSayi = Math.min(9, 5 + Math.floor((g - 30) / 7));
      const noktalar = [
        [merkez, tepe - 2], [merkez - 26, tepe + 16], [merkez + 26, tepe + 14],
        [merkez - 40, tepe + 40], [merkez + 40, tepe + 42], [merkez - 14, tepe + 30],
        [merkez + 16, tepe + 34], [merkez - 52, tepe + 66], [merkez + 52, tepe + 64]
      ];
      for (let i = 0; i < cicekSayi; i++) {
        const p = noktalar[i % noktalar.length];
        const r = 8 - (i % 3);
        bitki += cicek(p[0], p[1], r, CICEK[i % CICEK.length], i);
      }
    }

    // Ateşböcekleri (güne göre) + bugünün ışığı
    let isik = "";
    const fSayi = Math.min(7, Math.floor(g / 3)) + bugun; // bugünkü eylem ekstra parıltı
    const fpos = [[70, 120], [110, 90], [200, 110], [230, 140], [90, 150], [180, 80], [140, 60], [250, 100], [60, 95], [210, 70]];
    for (let i = 0; i < Math.min(fpos.length, fSayi); i++) isik += atesbocegi(fpos[i][0], fpos[i][1], (i * 0.4).toFixed(1));

    return `<svg viewBox="0 0 ${W} ${H}" class="bh-svg" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
      ${gokyuzu}${ay}${yer}
      <g class="bh-bitki" style="transform-origin:${merkez}px ${taban}px">${bitki}</g>
      ${isik}
    </svg>`;
  }

  /* ---------- çiz ---------- */
  function ciz() {
    const bolum = $("bahce"); if (!bolum) return;
    const sah = $("bahce-sahne"); if (!sah) return;
    const g = toplamGun();
    const a = asama(g);
    sah.innerHTML = sahne(g);

    // Başlık + aşama
    const bas = $("bahce-asama");
    if (bas) bas.textContent = ASAMA_AD[a];

    // Alt metin: sıradaki eşik
    const seviyeler = (typeof DATA !== "undefined" && DATA.streakSeviyeleri) ? DATA.streakSeviyeleri : [];
    const son = seviyeler.find(x => x.gun > g);
    const alt = $("bahce-alt");
    if (alt) {
      if (g === 0) alt.textContent = "İlk adımı at, tohumun filizlensin 🌱";
      else if (son) alt.textContent = `${g} gündür buradasın · ${son.gun - g} gün sonra bahçen daha da açılacak ${son.rozet || "🌸"}`;
      else alt.textContent = `${g} gündür buradasın · bahçen tam açmış, her gün biraz daha parlıyor ✨`;
    }

    // Bugünün ışığı notu
    const not = $("bahce-bugun");
    if (not) {
      const b = bugunEylem();
      if (b > 0) { not.hidden = false; not.textContent = "✨ Bugünün ışığı bahçene eklendi"; }
      else { not.hidden = false; not.textContent = "🌙 Bugün bir şey yap, bahçen parlasın"; }
    }
  }

  function baglan() { ciz(); setTimeout(ciz, 400); }
  document.addEventListener("DOMContentLoaded", baglan);
  return { ciz, _sahne: sahne, _asama: asama };
})();
