/* ============================================================
   bahce.js — Ruh Bahçesi 🌱
   Kullanıcının tüm aktivitelerinden (giriş, meditasyon, ruh hali,
   görev, şükran) beslenen, 6 seviyeli, dinamik SVG bir bahçe.
   Seviye yükseldikçe yeni bitki + glow + ışık parçacıkları açılır.
   Günlük ritüel ilerlemesi, seviye rozetleri ve gizli başarımlar içerir.
   app.js'ten sonra yüklenir. Global: window.Bahce
   ============================================================ */

const Bahce = window.Bahce = (() => {
  const $ = id => document.getElementById(id);

  /* ---------- Puan & seviye ---------- */
  function sayaclar() {
    return {
      giris: aktifGunSayisi("visit-"),
      med: aktifGunSayisi("med-"),
      mood: aktifGunSayisi("mood-"),
      gorev: aktifGunSayisi("task-"),
      sukran: (Store.get("gratitude", []) || []).length
    };
  }
  function toplamPuan(c) {
    return c.giris * 1 + c.med * 3 + c.mood * 2 + c.gorev * 2 + c.sukran * 2;
  }
  function seviyeIndex(puan) {
    let li = 0;
    DATA.bahceSeviyeleri.forEach((s, i) => { if (puan >= s.esik) li = i; });
    return li;
  }

  /* ---------- Günlük ritüel ---------- */
  function ritmDurum() {
    const today = todayKey();
    const items = [
      { ad: "Giriş",      ok: !!Store.get("visit-" + today) },
      { ad: "Meditasyon", ok: !!Store.get("med-" + today) },
      { ad: "Ruh hali",   ok: !!Store.get("mood-" + today) },
      { ad: "Mini görev", ok: !!Store.get("task-" + today) },
      { ad: "Şükran",     ok: (Store.get("gratitude", []) || []).some(n => n.tarih === today) }
    ];
    return { items, done: items.filter(i => i.ok).length };
  }

  /* ---------- SVG bitki parçaları ---------- */
  function sap(x, y1, y2) {
    return `<path class="b-sap" d="M${x} ${y1} C ${x - 5} ${(y1 + y2) / 2} ${x + 5} ${(y1 + y2) / 2} ${x} ${y2}"/>`;
  }
  function yaprak(cx, cy, yon) {
    const d = yon < 0
      ? `M${cx} ${cy} c -18 -4 -26 5 -22 17 14 1 22 -7 22 -17z`
      : `M${cx} ${cy} c 18 -4 26 5 22 17 -14 1 -22 -7 -22 -17z`;
    return `<path class="b-yaprak" d="${d}"/>`;
  }
  function petaller(n, rx, ry, dist) {
    let s = "";
    for (let i = 0; i < n; i++) s += `<ellipse class="b-petal" cx="0" cy="${-dist}" rx="${rx}" ry="${ry}" transform="rotate(${i * 360 / n})"/>`;
    return s;
  }
  function cicek(cx, cy, scale) {
    return `<g class="b-cicek" transform="translate(${cx} ${cy}) scale(${scale})">${petaller(6, 7, 13, 14)}<circle class="b-merkez" r="6.5"/></g>`;
  }
  function lotus(cx, cy, scale) {
    let p = "";
    [-62, -37, -12, 12, 37, 62].forEach(a =>
      p += `<path class="b-petal" d="M0 0 C -9 -28 -4 -44 0 -50 C 4 -44 9 -28 0 0Z" transform="rotate(${a})"/>`);
    p += `<path class="b-petal-on" d="M0 0 C -7 -22 -3 -34 0 -40 C 3 -34 7 -22 0 0Z"/>`;
    return `<g class="b-lotus" transform="translate(${cx} ${cy}) scale(${scale})">${p}</g>`;
  }
  function ay(cx, cy) {
    return `<g class="b-ay" transform="translate(${cx} ${cy})"><path d="M9 1a9 9 0 1 1-9-1 7 7 0 0 0 9 1z"/></g>`;
  }
  function agac(scale) {
    return `<g class="b-agac" transform="translate(100 152) scale(${scale})">
      <path class="b-govde" d="M0 0 C -4 -22 -4 -38 0 -54 C 4 -38 4 -22 0 0Z"/>
      <circle class="b-tac" cx="0" cy="-66" r="36"/>
      <circle class="b-tac-ic" cx="0" cy="-66" r="22"/>
    </g>`;
  }
  const TOPRAK = `<ellipse class="b-toprak" cx="100" cy="162" rx="56" ry="10"/>`;

  function sahneSVG(level) {
    let ic;
    switch (level) {
      case 0: ic = TOPRAK + sap(100, 162, 122) + yaprak(100, 140, -1) + yaprak(100, 134, 1) + `<circle class="b-tomurcuk" cx="100" cy="120" r="5"/>`; break;
      case 1: ic = TOPRAK + sap(100, 162, 88) + yaprak(100, 130, -1) + yaprak(100, 122, 1) + cicek(100, 82, 1); break;
      case 2: ic = TOPRAK + lotus(100, 152, 1.15) + cicek(58, 152, 0.5) + cicek(142, 152, 0.5); break;
      case 3: ic = ay(150, 44) + TOPRAK + sap(100, 162, 82) + yaprak(100, 132, -1) + yaprak(100, 122, 1) + cicek(100, 76, 1.05); break;
      case 4: ic = TOPRAK + agac(1) + cicek(52, 152, 0.5) + cicek(148, 152, 0.5); break;
      default: ic = ay(166, 40) + TOPRAK + agac(0.95) + lotus(60, 158, 0.7) + lotus(140, 158, 0.7) + cicek(38, 152, 0.55) + cicek(162, 152, 0.55); break;
    }
    return `<svg viewBox="0 0 200 180" class="b-svg" preserveAspectRatio="xMidYMid meet">${ic}</svg>`;
  }

  /* ---------- Işık parçacıkları ---------- */
  function parcaciklar(n) {
    let s = "";
    for (let i = 0; i < n; i++) {
      const left = (Math.random() * 100).toFixed(1);
      const top = (15 + Math.random() * 70).toFixed(1);
      const size = (3 + Math.random() * 4).toFixed(1);
      const delay = (Math.random() * 4).toFixed(2);
      const dur = (3 + Math.random() * 3).toFixed(2);
      s += `<span class="b-parcacik" style="left:${left}%;top:${top}%;width:${size}px;height:${size}px;animation-delay:${delay}s;animation-duration:${dur}s"></span>`;
    }
    return s;
  }

  /* ---------- Rozetler (seviye + gizli) ---------- */
  function cizRozet(puan, c, streak, done) {
    const grid = $("bahce-rozet-grid");
    if (!grid) return;
    let html = "";
    DATA.bahceSeviyeleri.forEach((s, i) => {
      if (i === 0) return;
      const acik = puan >= s.esik;
      html += `<div class="b-rozet${acik ? " kazanildi" : ""}"><span class="b-rozet-ad">${s.ad}</span><span class="b-rozet-durum">${acik ? "açıldı ✦" : s.esik + " puan"}</span></div>`;
    });

    const kazanilan = Store.get("bahce-gizli-kazanilan", {});
    const kosul = { tamRituel: done >= 5, bahcivan: c.sukran >= 20, kokSalan: streak >= 14, gececi: c.med >= 15 };
    let degisti = false;
    DATA.bahceGizli.forEach(g => { if (kosul[g.id] && !kazanilan[g.id]) { kazanilan[g.id] = true; degisti = true; } });
    if (degisti) Store.set("bahce-gizli-kazanilan", kazanilan);

    DATA.bahceGizli.forEach(g => {
      const acik = !!kazanilan[g.id];
      html += `<div class="b-rozet gizli${acik ? " kazanildi" : ""}" title="${acik ? "" : g.ipucu}"><span class="b-rozet-ad">${acik ? g.ad : "🔒 ???"}</span><span class="b-rozet-durum">${acik ? "açıldı ✦" : "gizli"}</span></div>`;
    });
    grid.innerHTML = html;
  }

  /* ---------- Günlük ritüel kartı ---------- */
  function cizRitm(durum) {
    const bar = $("bahce-gun-bar-dolu");
    if (bar) bar.style.width = (durum.done / 5 * 100) + "%";
    const bilgi = $("bahce-gun-bilgi");
    if (bilgi) bilgi.textContent = `${durum.done}/5 ritüel tamamlandı`;
    const mesaj = $("bahce-gun-mesaj");
    if (mesaj) mesaj.textContent = durum.done >= 5
      ? "Bugün bahçeni tam besledin 🌸"
      : durum.done >= 3 ? "Bugün bahçeni büyüttün 🌱" : "Bugün bahçende yeni bir filiz var 🌱";
    const liste = $("bahce-ritm");
    if (liste) liste.innerHTML = durum.items.map(i =>
      `<div class="ritm${i.ok ? " ok" : ""}"><span class="ritm-ikon">${i.ok ? "✓" : "○"}</span>${i.ad}</div>`).join("");
  }

  /* ---------- Ana render ---------- */
  function ciz() {
    const sahne = $("bahce-sahne");
    if (!sahne || !DATA.bahceSeviyeleri) return;

    const c = sayaclar();
    const puan = toplamPuan(c);
    const li = seviyeIndex(puan);
    const sev = DATA.bahceSeviyeleri[li];
    const sonraki = DATA.bahceSeviyeleri[li + 1] || null;
    const streak = mevcutSeri("visit-");
    const durum = ritmDurum();

    // Sahne + parçacıklar (seviye + seri ile artar)
    sahne.className = "bahce-sahne sv-" + li;
    sahne.innerHTML = sahneSVG(li) +
      `<div class="b-parcaciklar">${parcaciklar(Math.min(26, 5 + li * 3 + Math.min(streak, 8)))}</div>`;

    // Seviye + mesaj (seviye atlama tespiti)
    $("bahce-seviye").textContent = `${sev.ad} · Seviye ${li + 1}/${DATA.bahceSeviyeleri.length}`;
    const gorulen = Store.get("bahce-gorulen", -1);
    let mesaj = sev.mesaj;
    if (li > gorulen) {
      if (gorulen >= 0) mesaj = `🌟 Yeni seviye açıldı: ${sev.ad}!`;
      Store.set("bahce-gorulen", li);
    }
    $("bahce-mesaj").textContent = mesaj;

    // Seviye ilerleme çubuğu (puan)
    if (sonraki) {
      const yuzde = Math.min(100, Math.round((puan - sev.esik) / (sonraki.esik - sev.esik) * 100));
      $("bahce-bar-dolu").style.width = yuzde + "%";
      $("bahce-bar-bilgi").textContent = `${puan} / ${sonraki.esik} puan · sonraki: ${sonraki.ad}`;
    } else {
      $("bahce-bar-dolu").style.width = "100%";
      $("bahce-bar-bilgi").textContent = `${puan} puan · En yüksek seviye ✦`;
    }

    cizRitm(durum);
    cizRozet(puan, c, streak, durum.done);
  }

  /* Profil için seviye bilgisi */
  function bilgi() {
    const p = toplamPuan(sayaclar());
    const li = seviyeIndex(p);
    return { puan: p, index: li, ad: DATA.bahceSeviyeleri[li].ad };
  }

  document.addEventListener("DOMContentLoaded", ciz);
  return { ciz, bilgi };
})();
