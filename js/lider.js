/* ============================================================
   lider.js — Haftanın Yıldızları & Liderlik Sistemi ⭐🏆
   Kullanıcının gerçek haftalık aktivitesinden puan hesaplar; her hafta
   değişen örnek topluluk üyeleri arasında sıralar (haftalık reset). İlk 30
   "Haftanın Yıldızları", 1. için özel alan + premium rozet + haftalık plan
   paylaşma hakkı. Şehir/topluluk bazlı filtre, rozetler, plan + oylama +
   katılım %, başarı geçmişi. Statik uygulama — diğer üyeler örnektir.
   Global: window.Lider
   ============================================================ */

const Lider = window.Lider = (() => {
  const $ = id => document.getElementById(id);
  function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  function bana(m) { if (window.Bildirim && Bildirim.tetikle) Bildirim.tetikle(m, true); }
  function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }

  let filtre = "genel";
  const UYE_IKON = ["🌿", "🌙", "✨", "🌊", "🔮", "💫", "☀️", "🪷"];

  /* ---------- kullanıcı haftalık metrikleri ---------- */
  function metrik() {
    const gs = lastNDays(7);
    const gorevGun = gs.reduce((t, g) => t + Object.values(Store.get("gorevler-" + g, {}) || {}).filter(Boolean).length, 0);
    const medGun = gs.filter(g => Store.get("med-" + g)).length;
    const akisGorev = gs.reduce((t, g) => t + Object.values((Store.get("akis-gorev", {}) || {})[g] || {}).filter(Boolean).length, 0);
    const streak = Math.min(typeof mevcutSeri === "function" ? mevcutSeri("visit-") : 0, 7);
    const etkOlustur = (Store.get("top-etkinlikler", []) || []).length;
    const katildi = Object.values(Store.get("akis-katildim", {}) || {}).filter(Boolean).length;
    const arkadas = (Store.get("top-arkadaslar", []) || []).length;
    const reak = Object.values(Store.get("akis-reaksiyon", {}) || {}).reduce((t, o) => t + Object.values(o).reduce((a, b) => a + b, 0), 0);
    const paylasim = (Store.get("akis-paylasim", []) || []).length;
    const etkilesim = reak + paylasim;
    return { gorevGun, medGun, akisGorev, streak, etkOlustur, katildi, arkadas, etkilesim };
  }
  function puanla(m) {
    return m.gorevGun * 10 + m.medGun * 15 + m.akisGorev * 10 + m.streak * 5 + m.etkOlustur * 30 + m.katildi * 10 + m.arkadas * 20 + m.etkilesim * 3;
  }
  function puanDokum(m) {
    return [
      ["Günlük görevler", m.gorevGun * 10], ["Meditasyon", m.medGun * 15],
      ["Topluluk görevleri", m.akisGorev * 10], ["Streak", m.streak * 5],
      ["Etkinlik oluşturma", m.etkOlustur * 30], ["Etkinliğe katılma", m.katildi * 10],
      ["Arkadaş davet", m.arkadas * 20], ["Etkileşim", m.etkilesim * 3]
    ].filter(x => x[1] > 0);
  }

  /* ---------- üyeler + sıralama ---------- */
  function profil() { return Store.get("profil", {}) || {}; }
  function sehirim() { return profil().sehir || DATA.liderSehirler[0]; }
  function toplulukum() { const g = Store.get("top-gruplar", []) || []; return g.length ? g[0].ad : "Genel"; }

  function uyeler() {
    const wid = weekId();
    const list = DATA.liderIsimler.map((ad, i) => {
      const h = hash(ad + wid);
      return { ad, ikon: UYE_IKON[i % UYE_IKON.length], sehir: DATA.liderSehirler[h % DATA.liderSehirler.length], topluluk: DATA.toplulukOnerileri[(h >>> 3) % DATA.toplulukOnerileri.length].ad, puan: 40 + (h % 281) };
    });
    const m = metrik();
    const ben = { ad: (profil().isim || "Sen"), ikon: "💜", sehir: sehirim(), topluluk: toplulukum(), puan: puanla(m), ben: true };
    list.push(ben);
    return { list, ben };
  }
  function sirala(list) {
    return list.slice().sort((a, b) => b.puan - a.puan || (a.ben ? -1 : 1));
  }
  function filtrele(list, ben) {
    if (filtre === "sehir") return list.filter(u => u.sehir === ben.sehir);
    if (filtre === "topluluk") return list.filter(u => u.topluluk === ben.topluluk || u.ben);
    return list;
  }
  function madalya(sira) {
    if (sira === 1) return "🥇"; if (sira === 2) return "🥈"; if (sira === 3) return "🥉";
    if (sira <= 10) return "⭐"; if (sira <= 30) return "✨"; return "·";
  }

  /* ---------- rozetler ---------- */
  function rozetDurum(m, benSira) {
    return {
      lider: benSira === 1,
      enerji: puanla(m) >= 150,
      sifa: m.arkadas >= 3,
      meditasyon: m.medGun >= 4,
      isik: m.etkilesim >= 5
    };
  }

  /* ---------- plan + oylama ---------- */
  function planlar() { return Store.get("lider-planlar-" + weekId(), []) || []; }
  function planYaz(l) { Store.set("lider-planlar-" + weekId(), l); }

  /* ---------- render ---------- */
  function ciz() {
    const m = metrik();
    const { list, ben } = uyeler();
    const sirali = sirala(list);
    const benSira = sirali.findIndex(u => u.ben) + 1;
    const lider = sirali[0];
    const gosterilen = filtrele(sirali, ben);

    // haftalık snapshot (başarı geçmişi)
    Store.set("lider-puan-" + weekId(), { puan: ben.puan, sira: benSira });

    cizYildiz(lider, benSira === 1);
    cizDurum(ben, benSira, m);
    cizRozetler(m, benSira);
    cizTablo(gosterilen, ben);
    cizPlan(benSira === 1);
  }

  function cizYildiz(lider, benLider) {
    const el = $("lider-yildiz"); if (!el) return;
    el.innerHTML = `
      <div class="ly-tac">👑</div>
      <div class="ly-parcaciklar" aria-hidden="true">${Array.from({ length: 10 }, () => "<span></span>").join("")}</div>
      <span class="top-avatar ly-avatar"><span>${esc((lider.ad || "?").charAt(0).toUpperCase())}</span></span>
      <div class="ly-ad">${esc(lider.ad)}${benLider ? " (sen)" : ""}</div>
      <div class="ly-etiket">Haftanın Yıldızı ⭐</div>
      <div class="ly-puan">${lider.puan} puan</div>`;
    [...el.querySelectorAll(".ly-parcaciklar span")].forEach(s => { s.style.left = (Math.random() * 100).toFixed(1) + "%"; s.style.top = (Math.random() * 100).toFixed(1) + "%"; s.style.animationDelay = (Math.random() * 2).toFixed(2) + "s"; });
  }
  function cizDurum(ben, sira, m) {
    const el = $("lider-durum"); if (!el) return;
    const dokum = puanDokum(m);
    el.innerHTML = `
      <div class="ld-ust"><span class="ld-sira">${madalya(sira)} ${sira}. sıra</span><span class="ld-puan">${ben.puan} puan</span></div>
      <div class="ld-dokum">${dokum.length ? dokum.map(d => `<span class="ld-cip">${d[0]} +${d[1]}</span>`).join("") : `<span class="muted small">Bu hafta puan kazanmak için görev tamamla, etkinliğe katıl ✨</span>`}</div>`;
  }
  function cizRozetler(m, sira) {
    const el = $("lider-rozetler"); if (!el) return;
    const d = rozetDurum(m, sira);
    Store.set("lider-rozet-" + weekId(), d);
    el.innerHTML = DATA.liderRozetleri.map(r => `<span class="lider-rozet${d[r.id] ? " kazanildi" : ""}" title="${d[r.id] ? r.ad : r.ipucu}">${d[r.id] ? r.ad : "🔒 " + r.ad.replace(/ .$/, "")}</span>`).join("");
  }
  function cizTablo(liste, ben) {
    const el = $("lider-tablo"); if (!el) return;
    const ilk30 = liste.slice(0, 30);
    el.innerHTML = ilk30.map((u, i) => {
      const sira = i + 1;
      return `<div class="lider-sat${u.ben ? " ben" : ""}${sira <= 3 ? " ust3" : ""}" style="animation-delay:${Math.min(i * 0.03, 0.5)}s">
        <span class="ls-sira">${madalya(sira)}<b>${sira}</b></span>
        <span class="top-avatar sm ls-av"><span>${esc((u.ad || "?").charAt(0).toUpperCase())}</span></span>
        <div class="ls-bilgi"><div class="ls-ad">${esc(u.ad)}${u.ben ? " <span class='ls-sen'>sen</span>" : ""}</div><div class="ls-meta">${u.ikon} ${esc(u.sehir)} · ${esc(u.topluluk)}</div></div>
        <span class="ls-puan">${u.puan}</span>
      </div>`;
    }).join("") || `<p class="muted small">Bu filtrede üye yok.</p>`;
  }
  function cizPlan(benLider) {
    const el = $("lider-plan"); if (!el) return;
    const pl = planlar();
    el.innerHTML = `
      <h3 class="lider-bolum-bas">📋 Haftalık Topluluk Planı</h3>
      ${benLider
        ? `<div class="lider-plan-kutu"><p class="muted small">1. sıradasın 👑 — bu haftanın planını paylaşma hakkın var!</p>
            <input type="text" id="lider-plan-inp" placeholder="Örn. ${esc(DATA.liderPlanOrnekleri[Math.floor(Math.random() * DATA.liderPlanOrnekleri.length)])}"/>
            <button class="btn sm" id="lider-plan-btn">Planı Paylaş ✨</button></div>`
        : `<p class="muted small lider-plan-kilit">🔒 Haftalık planı 1. sıradaki kullanıcı paylaşır. Sen de challenge başlatıp oylayabilirsin 👇</p>
           <div class="lider-plan-kutu"><input type="text" id="lider-plan-inp" placeholder="Bir challenge öner (örn. 7 günlük şükran)"/><button class="btn ghost sm" id="lider-plan-btn">Challenge Öner</button></div>`}
      <div class="lider-plan-liste">${pl.length ? pl.map(planKart).join("") : `<p class="muted small">Henüz plan/challenge yok. İlkini sen öner ✨</p>`}</div>`;
    const btn = $("lider-plan-btn"); if (btn) btn.addEventListener("click", planEkle);
    el.querySelectorAll("[data-oy]").forEach(b => b.addEventListener("click", () => oyVer(b.dataset.oy)));
  }
  function planKart(p) {
    const benOy = (p.oyVerenler || []).includes("ben");
    const katilim = Math.min(100, (p.katilimBaz || 40) + (benOy ? 6 : 0));
    return `<div class="lider-plan-kart${p.lider ? " one" : ""}">
      ${p.lider ? `<span class="lpk-rozet">👑 Haftanın Planı</span>` : ""}
      <p class="lpk-metin">${esc(p.metin)}</p>
      <div class="lpk-alt">
        <button class="akis-mini-btn ${benOy ? "aktif" : ""}" data-oy="${p.id}">${benOy ? "Oyladın ✓" : "👍 Oy ver"} · ${p.oy || 0}</button>
        <div class="lpk-katilim"><div class="lpk-yuva"><span style="width:${katilim}%"></span></div><span class="muted small">%${katilim} katılım</span></div>
      </div>
    </div>`;
  }
  function planEkle() {
    const inp = $("lider-plan-inp"); const v = (inp.value || "").trim(); if (!v) { inp.focus(); return; }
    const { ben } = uyeler(); const sirali = sirala(uyeler().list); const benLider = sirali[0].ben;
    const l = planlar();
    l.unshift({ id: "p" + Date.now().toString(36), kim: ben.ad, metin: v, oy: 1, oyVerenler: ["ben"], katilimBaz: 35 + Math.floor(Math.random() * 30), lider: !!benLider });
    planYaz(l); bana("Plan paylaşıldı 📋✨"); cizPlan(benLider);
  }
  function oyVer(id) {
    const l = planlar(); const p = l.find(x => x.id === id); if (!p) return;
    p.oyVerenler = p.oyVerenler || [];
    const i = p.oyVerenler.indexOf("ben");
    if (i >= 0) { p.oyVerenler.splice(i, 1); p.oy = Math.max(0, (p.oy || 1) - 1); }
    else { p.oyVerenler.push("ben"); p.oy = (p.oy || 0) + 1; }
    planYaz(l);
    const sirali = sirala(uyeler().list);
    cizPlan(sirali[0].ben);
  }

  /* ---------- aç / kapat ---------- */
  function ac() {
    if (!$("lider-overlay")) return;
    ciz();
    const ov = $("lider-overlay");
    document.body.classList.add("lider-mod");
    ov.hidden = false; ov.classList.remove("gor"); void ov.offsetWidth; ov.classList.add("gor");
  }
  function kapat() {
    const ov = $("lider-overlay"); if (!ov) return;
    ov.classList.remove("gor");
    setTimeout(() => { ov.hidden = true; document.body.classList.remove("lider-mod"); }, 450);
  }

  function baglan() {
    [$("lider-ac"), $("lider-ac-2"), $("lider-ac-3")].forEach(b => { if (b) b.addEventListener("click", ac); });
    if (!$("lider-overlay")) return;
    $("lider-kapat").addEventListener("click", kapat);
    $("lider-overlay").addEventListener("click", e => { if (e.target === $("lider-overlay")) kapat(); });
    // şehir seçici
    const sec = $("lider-sehir");
    if (sec) {
      sec.innerHTML = DATA.liderSehirler.map(s => `<option value="${s}"${s === sehirim() ? " selected" : ""}>${s}</option>`).join("");
      sec.addEventListener("change", () => { const p = profil(); p.sehir = sec.value; Store.set("profil", p); ciz(); });
    }
    $("lider-filtreler").querySelectorAll(".lider-fil").forEach(b => b.addEventListener("click", () => {
      filtre = b.dataset.fil;
      $("lider-filtreler").querySelectorAll(".lider-fil").forEach(x => x.classList.toggle("aktif", x === b));
      ciz();
    }));
  }
  document.addEventListener("DOMContentLoaded", baglan);
  return { ac, kapat };
})();
