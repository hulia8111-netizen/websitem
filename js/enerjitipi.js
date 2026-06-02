/* ============================================================
   enerjitipi.js — Ruh Eşleşmesi / Enerji Uyumu 💞✨
   Ruh hali + spiritüel test + enerji seviyesi + günlük seçimlerden
   bir enerji tipi (Ay Ruhu, Güneş Enerjisi, Şifacı Ruh, Derin Su,
   Kozmik Gezgin, İçsel Bilge) türetir. Günlük analiz + uyum mesajı,
   en uyumlu enerji, geçmiş kaydı ve AI/müzik entegrasyonu.
   Global: window.EnerjiTipi
   ============================================================ */

const EnerjiTipi = window.EnerjiTipi = (() => {
  const $ = id => document.getElementById(id);
  function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  function tipById(id) { return DATA.enerjiTipleri.find(t => t.id === id); }
  function katAd(id) { const k = (DATA.muzikKategorileri || []).find(x => x.id === id); return k ? k.ad : id; }

  /* ---------- hesaplama ---------- */
  function puanlar() {
    const today = todayKey();
    const p = { ay: 0, gunes: 0, sifaci: 0, su: 0, kozmik: 0, bilge: 0 };
    const ekle = (o) => Object.keys(o).forEach(k => p[k] += o[k]);

    const mood = (typeof moodKeyNormalize === "function") ? moodKeyNormalize(Store.get("mood-" + today)) : null;
    const moodMap = { great: { gunes: 2, kozmik: 1 }, good: { sifaci: 2, gunes: 1 }, ok: { bilge: 2, su: 1 }, low: { su: 2, ay: 1 }, down: { ay: 2, su: 1 } };
    if (mood && moodMap[mood]) ekle(moodMap[mood]);

    const ts = Store.get("spiritest-sonuc", null);
    if (ts) {
      const m = { sifa: { sifaci: 2, su: 1 }, uyanis: { kozmik: 2, bilge: 1 }, denge: { bilge: 2 }, gucu: { gunes: 2 }, baslangic: { ay: 1, kozmik: 1 }, yukselis: { kozmik: 2, gunes: 1 } }[ts.kat];
      if (m) ekle(m);
    }
    const en = Store.get("enerji-" + today, 0) || 0;   // günlük seçimleri yansıtır
    if (en >= 70) ekle({ gunes: 1, kozmik: 1 });
    else if (en > 0 && en <= 35) ekle({ ay: 1, su: 1 });

    // Günlük rotasyon nudge'ı (her gün ufak değişim)
    const sira = DATA.enerjiTipleri.map(t => t.id);
    p[sira[dayIndex() % sira.length]] += 1;
    return p;
  }
  function gununTipi() {
    const p = puanlar();
    let en = DATA.enerjiTipleri[0].id, mx = -1;
    DATA.enerjiTipleri.forEach(t => { if (p[t.id] > mx) { mx = p[t.id]; en = t.id; } });
    return tipById(en);
  }

  /* ---------- geçmiş ---------- */
  function gecmisUpsert(t) {
    const g = Store.get("enerjitipi-gecmis", []);
    const v = { tarih: todayKey(), id: t.id };
    const i = g.findIndex(x => x.tarih === v.tarih);
    if (i >= 0) g[i] = v; else g.unshift(v);
    while (g.length > 60) g.pop();
    Store.set("enerjitipi-gecmis", g);
  }
  function cizGecmis() {
    const el = $("et-gecmis");
    if (!el) return;
    const g = Store.get("enerjitipi-gecmis", []).slice(0, 12);
    el.innerHTML = g.length
      ? `<div class="kader-mini">${g.map(x => { const t = tipById(x.id) || {}; return `<span class="kader-cip">${x.tarih} ${t.ikon || ""}</span>`; }).join("")}</div>`
      : `<p class="muted small">Henüz enerji kaydın yok.</p>`;
  }

  function parcacik() {
    const kutu = $("et-parcacik");
    if (!kutu) return;
    let s = "";
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * 360, dist = 50 + Math.random() * 35;
      s += `<span style="--x:${(Math.cos(a * Math.PI / 180) * dist).toFixed(0)}px;--y:${(Math.sin(a * Math.PI / 180) * dist).toFixed(0)}px;animation-delay:${(Math.random() * 0.1).toFixed(2)}s"></span>`;
    }
    kutu.innerHTML = s;
    setTimeout(() => { if (kutu) kutu.innerHTML = ""; }, 1100);
  }

  /* ---------- render ---------- */
  function ciz() {
    if (!$("enerjitipi")) return;
    const t = gununTipi();
    const uy = tipById(t.uyumlu);
    const orb = $("et-orb");
    orb.style.background = `radial-gradient(circle at 35% 30%, ${t.renk[0]}, ${t.renk[1]})`;
    $("et-ikon").textContent = t.ikon;
    $("et-ad").innerHTML = `Bugün <strong>${esc(t.ad)}</strong> enerjin baskın görünüyor ${t.ikon}`;
    $("et-analiz").textContent = t.analiz;
    $("et-gunluk").textContent = t.gunluk;
    $("et-uyum").innerHTML = uy ? `En uyumlu enerjin: <strong>${esc(uy.ad)}</strong> ${uy.ikon}` : "";
    const med = $("et-med");
    med.textContent = `Önerilen meditasyon · ${katAd(t.med)} →`;
    med.onclick = () => {
      if (typeof window.setMeditasyonKategori === "function") window.setMeditasyonKategori(t.med);
      if (typeof window.gotoView === "function") window.gotoView("meditasyon");
    };
    gecmisUpsert(t);
    cizGecmis();
    parcacik();
  }

  function baglan() { ciz(); }
  document.addEventListener("DOMContentLoaded", baglan);
  return { ciz, gununTipi };
})();
