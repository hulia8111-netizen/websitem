/* ============================================================
   premium.js — Premium Üyelik & Kurucu Rehber Etkinlikleri 👑✨
   Premium etkinlikler (canlı meditasyon, kurucu yayını, özel oda, premium
   challenge, özel grup görevi, kurucu sohbet) yalnızca premium üyelere açık.
   Ücretsiz kullanıcı görebilir + önizleme alır ama katılamaz. Kurucu (admin)
   paneli sadece admin hesabında: yeni etkinlik/yayın/görev/challenge oluşturma.
   Statik uygulama — üyelik/admin yerel bayraklarla simüle edilir (ödeme yok).
   Global: window.Premium
   ============================================================ */

const Premium = window.Premium = (() => {
  const $ = id => document.getElementById(id);
  function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  function bana(m) { if (window.Bildirim && Bildirim.tetikle) Bildirim.tetikle(m, true); }
  function uid(p) { return p + Date.now().toString(36) + Math.floor(Math.random() * 99); }
  function isim() { return (Store.get("profil", {}) || {}).isim || "Sen"; }

  const ADMIN_KOD = "kurucu"; // kurucu (admin) giriş kodu
  const PREM = "premium", ADMIN = "premium-admin", AETK = "premium-admin-etkinlik", KAT = "premium-katildim", SOH = "premium-sohbet";

  function premiumMu() { return !!Store.get(PREM); }
  function adminMi() { return !!Store.get(ADMIN); }
  function tip(t) { return DATA.premiumTipleri[t] || { ikon: "✨", ad: "Etkinlik" }; }
  function etkinlikler() { return (Store.get(AETK, []) || []).concat(DATA.premiumEtkinlikleri); }
  function katildim() { return Store.get(KAT, {}) || {}; }

  /* ---------- üyelik ---------- */
  function premiumYap() {
    Store.set(PREM, true); Store.set("premium-ts", Date.now());
    kilitAnimasyon(); bana("Premium üyeliğin aktif 👑✨"); ciz();
  }
  function premiumKapat() { Store.set(PREM, false); bana("Premium kapatıldı (demo)"); ciz(); }
  function adminGiris() {
    if (adminMi()) { Store.set(ADMIN, false); bana("Kurucu modundan çıkıldı"); ciz(); return; }
    const kod = prompt("Kurucu (admin) giriş kodu:");
    if (kod === null) return;
    if (kod.trim().toLowerCase() === ADMIN_KOD) { Store.set(ADMIN, true); Store.set(PREM, true); bana("Kurucu paneli açıldı 👑"); ciz(); }
    else bana("Kod hatalı.");
  }
  function kilitAnimasyon() {
    const f = document.createElement("div");
    f.className = "prem-kilit-flash"; f.innerHTML = `<div class="pkf-ic">🔓<span>Premium Açıldı ✨</span></div>`;
    document.body.appendChild(f);
    setTimeout(() => f.classList.add("gor"), 10);
    setTimeout(() => { f.classList.remove("gor"); setTimeout(() => f.remove(), 500); }, 1800);
  }

  /* ---------- rozetler ---------- */
  function rozetDurum() {
    return { kurucu: premiumMu(), isik: Object.values(katildim()).some(Boolean), derinlik: (Store.get(SOH, []) || []).some(m => m.kim === isim()) };
  }

  /* ---------- render ---------- */
  function ciz() {
    cizUyelik(); cizRozetler(); cizAdmin(); cizEtkinlikler(); cizSohbet();
  }

  function cizUyelik() {
    const el = $("prem-uyelik"); if (!el) return;
    const p = premiumMu();
    el.className = "prem-uyelik" + (p ? " aktif" : "");
    el.innerHTML = p
      ? `<div class="pu-rozet">👑 Premium Üye</div><p class="muted small">Tüm kurucu rehber etkinliklerine erişimin açık ✨</p>
         <div class="pu-btnlar"><button class="btn ghost sm" id="prem-kapat">Premium'u kapat (demo)</button></div>`
      : `<div class="pu-rozet free">🔒 Ücretsiz Üyelik</div><p class="muted small">Etkinlikleri görebilir ve önizleyebilirsin; katılmak için premium gerekir.</p>
         <button class="btn prem-gec-btn" id="prem-gec">Premium'a Geç ✨</button>`;
    const g = $("prem-gec"); if (g) g.addEventListener("click", premiumYap);
    const k = $("prem-kapat"); if (k) k.addEventListener("click", premiumKapat);
  }
  function cizRozetler() {
    const el = $("prem-rozetler"); if (!el) return;
    const d = rozetDurum();
    el.innerHTML = DATA.premiumRozetleri.map(r => `<span class="prem-rozet${d[r.id] ? " kazanildi" : ""}" title="${d[r.id] ? r.ad : r.ipucu}">${d[r.id] ? r.ad : "🔒 " + r.ad.replace(/ .$/, "")}</span>`).join("");
  }

  function cizAdmin() {
    const el = $("prem-admin"); if (!el) return;
    if (!adminMi()) { el.innerHTML = ""; el.hidden = true; return; }
    el.hidden = false;
    el.innerHTML = `
      <h3 class="prem-bolum-bas">👑 Kurucu Paneli</h3>
      <p class="muted small">Yeni premium etkinlik / yayın / görev / challenge oluştur.</p>
      <input type="text" id="pa-baslik" placeholder="Başlık"/>
      <div class="prem-satir">
        <select id="pa-tip">${Object.keys(DATA.premiumTipleri).map(t => `<option value="${t}">${tip(t).ikon} ${tip(t).ad}</option>`).join("")}</select>
      </div>
      <div class="prem-satir"><input type="date" id="pa-tarih"/><input type="time" id="pa-saat" value="20:00"/></div>
      <textarea id="pa-acik" rows="2" placeholder="Açıklama"></textarea>
      <button class="btn sm" id="pa-olustur">Yayınla ✨</button>
      <div class="prem-admin-liste" id="pa-liste"></div>`;
    $("pa-olustur").addEventListener("click", adminEtkinlikEkle);
    cizAdminListe();
  }
  function cizAdminListe() {
    const el = $("pa-liste"); if (!el) return;
    const l = Store.get(AETK, []) || [];
    el.innerHTML = l.length ? `<p class="muted small">Oluşturduklarım:</p>` + l.map(e => `<div class="pa-sat"><span>${tip(e.tip).ikon} ${esc(e.baslik)}</span><button class="hk-sil-btn" data-asil="${e.id}">✕</button></div>`).join("") : "";
    el.querySelectorAll("[data-asil]").forEach(b => b.addEventListener("click", () => { Store.set(AETK, (Store.get(AETK, []) || []).filter(x => x.id !== b.dataset.asil)); ciz(); }));
  }
  function adminEtkinlikEkle() {
    const baslik = ($("pa-baslik").value || "").trim(); if (!baslik) { $("pa-baslik").focus(); return; }
    const l = Store.get(AETK, []) || [];
    l.unshift({ id: uid("pe"), tip: $("pa-tip").value, baslik, tarih: $("pa-tarih").value || "", saat: $("pa-saat").value || "", aciklama: ($("pa-acik").value || "").trim(), admin: true });
    Store.set(AETK, l); bana("Premium etkinlik yayınlandı 👑✨"); ciz();
  }

  function cizEtkinlikler() {
    const el = $("prem-etkinlikler"); if (!el) return;
    const p = premiumMu();
    el.innerHTML = etkinlikler().map(e => etkKart(e, p)).join("");
    if (p) {
      el.querySelectorAll("[data-katil]").forEach(b => b.addEventListener("click", () => katil(b.dataset.katil)));
      el.querySelectorAll("[data-sohbet]").forEach(b => b.addEventListener("click", () => { const s = $("prem-sohbet-bolum"); if (s) s.scrollIntoView({ behavior: "smooth" }); }));
      el.querySelectorAll("[data-takvim]").forEach(b => b.addEventListener("click", () => takvimeEkle(b.dataset.takvim, false)));
      el.querySelectorAll("[data-hatirlat]").forEach(b => b.addEventListener("click", () => takvimeEkle(b.dataset.hatirlat, true)));
    } else {
      el.querySelectorAll("[data-kilitac]").forEach(b => b.addEventListener("click", premiumYap));
    }
  }
  function etkKart(e, p) {
    const t = tip(e.tip);
    const tarihStr = e.tarih ? new Date(e.tarih + "T00:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "long" }) : "";
    const katildi = !!katildim()[e.id];
    return `<div class="prem-etk glow-in${p ? "" : " kilitli"}">
      <div class="pe-bas"><span class="pe-ikon">${t.ikon}</span><div><div class="pe-tip">${t.ad}</div><div class="pe-baslik">${esc(e.baslik)}</div></div>${p ? "" : `<span class="pe-kilit">🔒</span>`}</div>
      <div class="pe-meta">📅 ${tarihStr}${e.saat ? " · 🕐 " + e.saat : ""}</div>
      <p class="pe-acik">${esc(e.aciklama)}</p>
      ${p
        ? `<div class="pe-btnlar">
            <button class="akis-mini-btn ${katildi ? "aktif" : ""}" data-katil="${e.id}">${katildi ? "Katıldın ✓" : "Katıl ✨"}</button>
            <button class="akis-ikon-btn" data-sohbet="${e.id}" title="Sohbete katıl">💬</button>
            <button class="akis-ikon-btn" data-takvim="${e.id}" title="Takvime ekle">📅</button>
            <button class="akis-ikon-btn" data-hatirlat="${e.id}" title="Hatırlatıcı kur">⏰</button>
          </div>`
        : `<div class="pe-kilit-mesaj">Bu etkinlik premium üyeler için özel oluşturulmuştur ✨</div>
           <button class="btn prem-gec-btn sm" data-kilitac="1">🔓 Premium'a Geç</button>`}
    </div>`;
  }
  function katil(id) {
    const k = katildim(); k[id] = !k[id]; Store.set(KAT, k);
    if (k[id]) bana("Premium etkinliğe katıldın 👑✨"); ciz();
  }
  function takvimeEkle(id, hatirlat) {
    const e = etkinlikler().find(x => x.id === id); if (!e) return;
    const l = Store.get("takvim-ozel", []) || [];
    if (l.some(x => x.kaynakId === id)) { bana("Bu etkinlik zaten takvimde"); return; }
    l.push({ id: uid("t"), kaynakId: id, tarih: e.tarih || todayKey(), baslik: tip(e.tip).ikon + " " + e.baslik, not: e.aciklama, tip: "kisisel", hatirlatSaat: hatirlat ? (e.saat || "09:00") : "" });
    Store.set("takvim-ozel", l);
    bana(hatirlat ? "Takvime eklendi + hatırlatıcı kuruldu ⏰✨" : "Spiritüel Takvim'e eklendi 📅");
  }

  function cizSohbet() {
    const el = $("prem-sohbet-bolum"); if (!el) return;
    if (!premiumMu()) {
      el.innerHTML = `<h3 class="prem-bolum-bas">💬 Kurucu Sohbet Alanı</h3><div class="pe-kilit-mesaj">Bu alan premium üyeler için özel oluşturulmuştur ✨</div>`;
      return;
    }
    const seed = DATA.premiumSohbetSeed.map((m, i) => ({ id: " s" + i, kim: m.kim, metin: m.metin, ts: Date.now() - m.oncesiSaat * 3600000 }));
    const benim = Store.get(SOH, []) || [];
    const msgs = seed.concat(benim).sort((a, b) => a.ts - b.ts);
    el.innerHTML = `<h3 class="prem-bolum-bas">💬 Kurucu Sohbet Alanı</h3>
      <div class="prem-sohbet" id="prem-sohbet">${msgs.map(m => `<div class="prem-msg${m.kim === isim() ? " ben" : ""}"><b>${esc(m.kim)}</b> ${esc(m.metin)}</div>`).join("")}</div>
      <div class="top-ekle-satir"><input type="text" id="prem-msg-inp" placeholder="Çembere bir şeyler yaz…"/><button class="btn sm" id="prem-msg-gonder">Gönder</button></div>`;
    $("prem-msg-gonder").addEventListener("click", () => {
      const i = $("prem-msg-inp"); const v = (i.value || "").trim(); if (!v) return;
      const l = Store.get(SOH, []) || []; l.push({ kim: isim(), metin: v, ts: Date.now() }); Store.set(SOH, l); cizSohbet();
    });
  }

  /* ---------- aç / kapat ---------- */
  function ac() {
    if (!$("prem-overlay")) return;
    ciz();
    const ov = $("prem-overlay"); document.body.classList.add("prem-mod");
    ov.hidden = false; ov.classList.remove("gor"); void ov.offsetWidth; ov.classList.add("gor");
  }
  function kapat() { const ov = $("prem-overlay"); if (!ov) return; ov.classList.remove("gor"); setTimeout(() => { ov.hidden = true; document.body.classList.remove("prem-mod"); }, 450); }

  function baglan() {
    const a = $("prem-ac"); if (a) a.addEventListener("click", ac);
    if (!$("prem-overlay")) return;
    $("prem-kapat-btn").addEventListener("click", kapat);
    $("prem-overlay").addEventListener("click", e => { if (e.target === $("prem-overlay")) kapat(); });
    $("prem-admin-giris").addEventListener("click", adminGiris);
  }
  document.addEventListener("DOMContentLoaded", baglan);
  return { ac, kapat, premiumMu, adminMi };
})();
