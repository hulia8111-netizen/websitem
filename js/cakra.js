/* ============================================================
   cakra.js — Aura ve Çakra Dengesi 🌀✨
   Ruh hali, meditasyon, günlük, enerji seviyesi ve test sonucundan
   7 çakranın enerji seviyesini ve günlük aura rengini türetir.
   Her çakra: seviye + açıklama + meditasyon + olumlama + dengeleme görevi.
   Aura orb, dönen enerji çemberleri, geçmiş ve AI/müzik entegrasyonu.
   Global: window.Cakra
   ============================================================ */

const Cakra = window.Cakra = (() => {
  const $ = id => document.getElementById(id);
  function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  function katAd(id) { const k = (DATA.muzikKategorileri || []).find(x => x.id === id); return k ? k.ad : id; }
  function cakraById(id) { return DATA.cakralar.find(c => c.id === id); }

  const MOOD_CAKRA = {
    great: { solar: 10, tac: 6, kalp: 4 },
    good: { kalp: 10, solar: 6 },
    ok: { bogaz: 5, ucuncuGoz: 3 },
    low: { kok: -8, sakral: -6, kalp: 3 },
    down: { kalp: -8, kok: -6, ucuncuGoz: 4 }
  };
  const TEST_CAKRA = { sifa: "kalp", uyanis: "ucuncuGoz", denge: "bogaz", gucu: "solar", baslangic: "kok", yukselis: "tac" };
  const AURA = {
    kok: { ad: "Kızıl Aura", renk: ["#ff8a8a", "#7a2a3a"], aciklama: "Topraklanmış ve güçlü; köklerin sağlam, güvendesin." },
    sakral: { ad: "Turuncu Aura", renk: ["#ffae6a", "#7a3a1a"], aciklama: "Yaratıcı ve canlı bir enerji yayıyorsun." },
    solar: { ad: "Altın Aura", renk: ["#f3d98c", "#b5882a"], aciklama: "Özgüven ve bilgelik ışıldıyor; iraden güçlü." },
    kalp: { ad: "Yeşil Aura", renk: ["#7fe8b8", "#2a7a5a"], aciklama: "Şifa, sevgi ve denge enerjisi baskın." },
    bogaz: { ad: "Mavi Aura", renk: ["#7abaff", "#2a4a8a"], aciklama: "Sakinlik ve berrak ifade ön planda." },
    ucuncuGoz: { ad: "Mor Aura", renk: ["#c2a0ff", "#4a2a8a"], aciklama: "Sezgi ve ruhsal derinlik güçlü." },
    tac: { ad: "Işık Aurası", renk: ["#fff4d6", "#b38cff"], aciklama: "Yüksek titreşim; evrenle bağlantın açık." }
  };

  /* deterministik gün+çakra çekirdeği (0..1) */
  function seed(n) { const x = Math.sin(n * 99.13) * 10000; return x - Math.floor(x); }

  function seviyeler() {
    const today = todayKey();
    const di = (typeof dayIndex === "function") ? dayIndex() : 0;
    const enerji = Store.get("enerji-" + today, 0) || 0;
    const mood = (typeof moodKeyNormalize === "function") ? moodKeyNormalize(Store.get("mood-" + today)) : null;
    const medBugun = !!Store.get("med-" + today);
    const gunlukBugun = (Store.get("gunluk-kayitlar", []) || []).some(e => e.tarih === today);
    const sukranBugun = (Store.get("gratitude", []) || []).some(n => n.tarih === today);
    const ts = Store.get("spiritest-sonuc", null);

    const out = {};
    DATA.cakralar.forEach((c, i) => {
      let v = 48 + Math.round(seed(di * 7 + i * 13) * 32);   // 48..80, güne göre sabit
      v += Math.round((enerji - 50) / 6);                     // enerji etkisi
      if (mood && MOOD_CAKRA[mood] && MOOD_CAKRA[mood][c.id]) v += MOOD_CAKRA[mood][c.id];
      if (medBugun && (c.id === "ucuncuGoz" || c.id === "tac")) v += 12;
      if (gunlukBugun && c.id === "bogaz") v += 12;
      if (sukranBugun && c.id === "kalp") v += 10;
      if (ts && TEST_CAKRA[ts.kat] === c.id) v += 10;
      out[c.id] = Math.max(8, Math.min(100, v));
    });
    return out;
  }

  function enGuclu(s) { return Object.keys(s).sort((a, b) => s[b] - s[a])[0]; }
  function enZayif(s) { return Object.keys(s).sort((a, b) => s[a] - s[b])[0]; }

  /* ---------- geçmiş ---------- */
  function gecmisUpsert(cakraId) {
    const g = Store.get("aura-gecmis", []);
    const v = { tarih: todayKey(), cakra: cakraId };
    const i = g.findIndex(x => x.tarih === v.tarih);
    if (i >= 0) g[i] = v; else g.unshift(v);
    while (g.length > 60) g.pop();
    Store.set("aura-gecmis", g);
  }
  function cizGecmis() {
    const el = $("aura-gecmis-liste");
    if (!el) return;
    const g = Store.get("aura-gecmis", []).slice(0, 14);
    el.innerHTML = g.length
      ? `<div class="aura-gecmis-cipler">${g.map(x => { const a = AURA[x.cakra] || AURA.tac; return `<span class="aura-cip" title="${esc((cakraById(x.cakra) || {}).ad || "")}"><span class="aura-nokta" style="background:linear-gradient(135deg,${a.renk[0]},${a.renk[1]})"></span>${x.tarih}</span>`; }).join("")}</div>`
      : `<p class="muted small">Henüz aura kaydın yok.</p>`;
  }

  function medGit(katId) {
    if (typeof window.setMeditasyonKategori === "function") window.setMeditasyonKategori(katId);
    if (typeof window.gotoView === "function") window.gotoView("meditasyon");
  }

  /* ---------- render ---------- */
  function ciz() {
    if (!$("cakra")) return;
    const s = seviyeler();
    const guclu = enGuclu(s), zayif = enZayif(s);
    const gc = cakraById(guclu), zc = cakraById(zayif);
    const aura = AURA[guclu] || AURA.tac;

    // Aura orb
    const orb = $("aura-orb");
    orb.style.background = `radial-gradient(circle at 38% 32%, ${aura.renk[0]}, ${aura.renk[1]})`;
    $("aura-ad").textContent = aura.ad;
    $("aura-aciklama").textContent = aura.aciklama;
    $("cakra-headline").innerHTML = `${esc(gc.ad)} bugün güçlü görünüyor ${gc.ikon}`;

    // Çakra listesi
    const liste = $("cakra-liste");
    liste.innerHTML = "";
    DATA.cakralar.forEach(c => {
      const v = s[c.id];
      const sat = document.createElement("div");
      sat.className = "cakra-blok";
      sat.innerHTML = `
        <button class="cakra-sat">
          <span class="ck-ikon">${c.ikon}</span>
          <div class="ck-bilgi">
            <div class="ck-ust"><span class="ck-ad">${esc(c.ad)}</span><span class="ck-yuzde">%${v}</span></div>
            <div class="ck-bar"><span style="width:${v}%;background:linear-gradient(90deg,${c.renk},var(--gold))"></span></div>
          </div>
          <span class="ck-ok">▾</span>
        </button>
        <div class="ck-detay" hidden>
          <p class="ck-aciklama">${esc(c.aciklama)}</p>
          <div class="ck-oneri"><span class="ck-et">Olumlama</span><p>“${esc(c.olumlama)}”</p></div>
          <div class="ck-oneri"><span class="ck-et">Dengeleme</span><p>${esc(c.gorev)}</p></div>
          <button class="btn ghost sm" data-med="${c.med}">Meditasyon · ${esc(katAd(c.med))} →</button>
        </div>`;
      const btn = sat.querySelector(".cakra-sat");
      const det = sat.querySelector(".ck-detay");
      btn.addEventListener("click", () => { det.hidden = !det.hidden; sat.classList.toggle("acik", !det.hidden); });
      sat.querySelector("[data-med]").addEventListener("click", e => { e.stopPropagation(); medGit(c.med); });
      liste.appendChild(sat);
    });

    // Dengeleme görevi (en zayıf çakra)
    $("cakra-gorev").innerHTML = `<span class="ck-et">Bugünün Dengeleme Görevi · ${esc(zc.ad)} ${zc.ikon}</span><p>${esc(zc.gorev)}</p>`;

    gecmisUpsert(guclu);
    cizGecmis();
  }

  document.addEventListener("DOMContentLoaded", ciz);
  return { ciz, seviyeler };
})();
