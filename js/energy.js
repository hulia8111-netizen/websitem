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

  /* Bugünün enerji dökümü — her aktivitenin kazandırdığı puan */
  function parcalar() {
    const today = todayKey();
    const moodP = Store.get("mood-" + today) ? 20 : 0;
    const medP = Store.get("med-" + today) ? 20 : 0;
    const gv = (window.Gorevler && Gorevler.tamamSayi) ? Gorevler.tamamSayi() : 0;
    const gorevP = gv > 0 ? Math.round(gv / 3 * 15) : (Store.get("task-" + today) ? 15 : 0);
    const g = (Store.get("gratitude", []) || []).filter(n => n.tarih === today).length;
    const sukranP = g >= 2 ? 15 : (g === 1 ? 10 : 0);
    const seri = Math.min(mevcutSeri("visit-"), 7);
    const streakP = Math.round(seri / 7 * 15);
    const rehberP = Store.get("rehber-" + today) ? 15 : 0;
    const sabahP = Store.get("sabah-" + today) ? 10 : 0;
    return [
      { simge: "🧘", ad: "Ruh hali girdin", kaz: moodP, max: 20 },
      { simge: "🌬️", ad: "Meditasyon yaptın", kaz: medP, max: 20 },
      { simge: "✅", ad: `Günün görevleri (${gv}/3)`, kaz: gorevP, max: 15 },
      { simge: "🙏", ad: `Şükran yazdın (${g})`, kaz: sukranP, max: 15 },
      { simge: "🔥", ad: `Giriş serin (${seri}/7 gün)`, kaz: streakP, max: 15 },
      { simge: "🔮", ad: "İçsel rehbere danıştın", kaz: rehberP, max: 15 },
      { simge: "🌅", ad: "Sabah ritüeli", kaz: sabahP, max: 10 }
    ];
  }

  /* Bugünün enerji puanı (toplam 100) */
  function hesapla() {
    const p = parcalar().reduce((t, x) => t + x.kaz, 0);
    return Math.min(100, p);
  }

  function cizDokum() {
    const el = $("enerji-dokum");
    if (!el) return;
    const liste = parcalar();
    const ham = liste.reduce((t, x) => t + x.kaz, 0);
    const satirlar = liste.map(x => {
      const tamam = x.kaz >= x.max;
      const hic = x.kaz === 0;
      return `<div class="e-dokum-satir${hic ? " yok" : ""}">
        <span class="e-dokum-ad">${x.simge} ${x.ad}</span>
        <span class="e-dokum-puan">${hic ? "—" : "+" + x.kaz}${tamam ? " ✓" : ""}</span>
      </div>`;
    }).join("");
    el.innerHTML = satirlar +
      `<div class="e-dokum-satir e-dokum-toplam">
        <span class="e-dokum-ad">Toplam</span>
        <span class="e-dokum-puan">%${Math.min(100, ham)}</span>
      </div>
      <p class="e-dokum-not">Her aktivite enerjine puan ekler. Daha çok şey yaptıkça enerjin yükselir 🌿</p>`;
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
    cizDokum();
  }

  function baglan() {
    const btn = $("enerji-dokum-ac"), kutu = $("enerji-dokum");
    if (!btn || !kutu) return;
    btn.addEventListener("click", () => {
      const acik = kutu.hidden;
      kutu.hidden = !acik;
      btn.setAttribute("aria-expanded", acik ? "true" : "false");
      btn.textContent = acik ? "Dökümü gizle ▴" : "Bu puan nasıl hesaplandı? ▾";
    });
  }

  document.addEventListener("DOMContentLoaded", () => { ciz(); baglan(); });
  return { ciz, hesapla };
})();
