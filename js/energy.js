/* ============================================================
   energy.js — Günün Enerji Seviyesi ✨
   Bugünün aktivitelerinden (ruh hali, meditasyon, görev, şükran,
   streak, AI rehber) 0-100 enerji puanı hesaplar; dairesel glow
   gösterge + son 7 günlük grafik + gizli rozetlerle sunar.
   Günlük enerji geçmişi enerji-<gün> anahtarlarında saklanır.
   app.js'ten sonra yüklenir. Global: window.Enerji
   ============================================================ */

const Enerji = window.Enerji = (() => {
  const $ = id => document.getElementById(id);
  const R = 52, C = 2 * Math.PI * R;   // gösterge çemberi

  const SEVIYELER = [
    { min: 86, ad: "Yüksek Frekans", sinif: "cok-yuksek", mesaj: "Yüksek bir frekanstasın, ışıldıyorsun 🌟" },
    { min: 61, ad: "Güçlü Enerji",   sinif: "yuksek",     mesaj: "İçsel dengen bugün oldukça güçlü ✨" },
    { min: 31, ad: "Dengeleniyor",   sinif: "orta",       mesaj: "İçsel dengen yavaşça kuruluyor 🌿" },
    { min: 0,  ad: "Düşük Enerji",   sinif: "dusuk",      mesaj: "Enerjini biraz dinlendirmeye ihtiyacın olabilir 🌙" }
  ];
  function seviye(p) { return SEVIYELER.find(s => p >= s.min); }

  /* Bugünün enerji puanı (toplam 100) */
  function hesapla() {
    const today = todayKey();
    let p = 0;
    if (Store.get("mood-" + today)) p += 20;                       // ruh hali
    if (Store.get("med-" + today)) p += 20;                        // meditasyon
    if (Store.get("task-" + today)) p += 15;                       // görev
    const g = (Store.get("gratitude", []) || []).filter(n => n.tarih === today).length;
    p += g >= 2 ? 15 : (g === 1 ? 10 : 0);                         // şükran
    p += Math.round(Math.min(mevcutSeri("visit-"), 7) / 7 * 15);  // streak
    if (Store.get("rehber-" + today)) p += 15;                     // AI rehber
    return Math.min(100, p);
  }

  function cizGrafik(today, bugun) {
    const el = $("enerji-grafik");
    if (!el) return;
    el.innerHTML = lastNDays(7).map(g => {
      const v = g === today ? bugun : (Store.get("enerji-" + g, 0) || 0);
      const ad = new Date(g).toLocaleDateString("tr-TR", { weekday: "short" });
      return `<div class="e-bar${g === today ? " bugun" : ""}">
        <span class="e-bar-deg">${v}</span>
        <div class="e-bar-yuva"><div class="e-bar-dolu" style="height:${Math.max(3, v)}%"></div></div>
        <span class="e-bar-ad">${ad}</span>
      </div>`;
    }).join("");
  }

  function cizRozet(p) {
    const el = $("enerji-rozet");
    if (!el || !DATA.enerjiRozetleri) return;
    const kaz = Store.get("enerji-rozet", {});
    const gunler = lastNDays(7).map(g => Store.get("enerji-" + g, 0) || 0);
    const ort = Math.round(gunler.reduce((a, b) => a + b, 0) / 7);
    const kosul = { isik: p >= 61, frekans: p >= 86, sabit: ort >= 70 };
    let degisti = false;
    DATA.enerjiRozetleri.forEach(r => { if (kosul[r.id] && !kaz[r.id]) { kaz[r.id] = true; degisti = true; } });
    if (degisti) Store.set("enerji-rozet", kaz);
    el.innerHTML = DATA.enerjiRozetleri.map(r => {
      const a = !!kaz[r.id];
      return `<span class="e-rozet${a ? " kazanildi" : ""}" title="${a ? "" : r.ipucu}">${a ? r.ad : "🔒 ???"}</span>`;
    }).join("");
  }

  function ciz() {
    if (!$("enerji")) return;
    const today = todayKey();
    const p = hesapla();
    Store.set("enerji-" + today, p);          // günlük geçmişe yaz
    const sev = seviye(p);

    const ring = $("enerji-ring");
    if (ring) {
      ring.style.strokeDasharray = C.toFixed(1);
      ring.style.strokeDashoffset = (C * (1 - p / 100)).toFixed(1);
    }
    $("enerji-yuzde").textContent = p + "%";
    $("enerji-gosterge").className = "enerji-gosterge " + sev.sinif;
    $("enerji-seviye").textContent = `Bugünkü enerji seviyen %${p} ✨`;
    $("enerji-mesaj").textContent = sev.mesaj;

    cizGrafik(today, p);
    cizRozet(p);
  }

  document.addEventListener("DOMContentLoaded", ciz);
  return { ciz, hesapla };
})();
