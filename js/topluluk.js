/* ============================================================
   topluluk.js — Topluluk & Birlik Alanı 👥✨
   Topluluk kurma/katılma, etkinlik planlama (tarih/konum/katılımcı/sohbet),
   grup görevleri + grup streak, arkadaş ekleme/takip, başarı rozetleri ve
   gerçek paylaşılabilir davet linki (Web Share). Tüm topluluk verisi bu
   cihazda (localStorage) tutulur — statik uygulama; davet linki uygulamayı paylaşır.
   Global: window.Topluluk
   ============================================================ */

const Topluluk = window.Topluluk = (() => {
  const $ = id => document.getElementById(id);
  function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  function uid(p) { return p + Date.now().toString(36) + Math.floor(Math.random() * 99); }
  function bana(msg) { if (window.Bildirim && Bildirim.tetikle) Bildirim.tetikle(msg, true); }

  const G = "top-gruplar", E = "top-etkinlikler", A = "top-arkadaslar", R = "top-rozetler";
  let sekme = "gruplar", detayId = null;

  /* ---------- veri ---------- */
  const gruplar = () => Store.get(G, []) || [];
  const grupYaz = l => Store.set(G, l);
  const etkinlikler = () => Store.get(E, []) || [];
  const etkYaz = l => Store.set(E, l);
  const arkadaslar = () => Store.get(A, []) || [];
  const arkYaz = l => Store.set(A, l);
  const grupBul = id => gruplar().find(g => g.id === id);

  /* ---------- davet / paylaşım ---------- */
  function appURL() { return location.origin + location.pathname; }
  function paylas(metin) {
    const url = appURL();
    if (navigator.share) { navigator.share({ title: "Işığını Bul ✨", text: metin, url }).catch(() => {}); }
    else if (navigator.clipboard) { navigator.clipboard.writeText(metin + " " + url); bana("Davet linki kopyalandı ✨"); }
    else bana(url);
  }

  /* ---------- grup streak ---------- */
  function grupSeri(g) {
    const log = g.streakLog || {};
    let seri = 0; const d = new Date();
    for (;;) {
      const k = todayKey(d);
      if (log[k]) { seri++; d.setDate(d.getDate() - 1); }
      else { if (k === todayKey()) { d.setDate(d.getDate() - 1); continue; } break; }
    }
    return seri;
  }

  /* ---------- rozetler ---------- */
  function rozetDurum() {
    const gl = gruplar();
    return {
      ilk: gl.length >= 1,
      kurucu: gl.some(g => g.kaynak === "kullanici"),
      planlayici: etkinlikler().length >= 1,
      birlik: arkadaslar().length >= 3,
      istikrar: gl.some(g => grupSeri(g) >= 3)
    };
  }
  function cizRozetler() {
    const el = $("top-rozetler"); if (!el) return;
    const d = rozetDurum();
    Store.set(R, d);
    el.innerHTML = DATA.toplulukRozetleri.map(r =>
      `<span class="top-rozet${d[r.id] ? " kazanildi" : ""}" title="${d[r.id] ? r.ad : r.ipucu}">${d[r.id] ? r.ad : "🔒"}</span>`).join("");
  }

  /* ---------- sekme: TOPLULUKLAR ---------- */
  function cizGruplar() {
    const p = $("top-panel");
    const mine = gruplar();
    const katildimAdlar = mine.map(g => g.ad);
    const oneriler = DATA.toplulukOnerileri.filter(o => !katildimAdlar.includes(o.ad));
    p.innerHTML = `
      <div class="top-ekle-kart">
        <input type="text" id="top-grup-ad" placeholder="Topluluk adı (örn. Sabah Çemberi)"/>
        <input type="text" id="top-grup-ikon" maxlength="2" placeholder="✨" class="top-ikon-inp"/>
        <input type="text" id="top-grup-acik" placeholder="Kısa açıklama (opsiyonel)"/>
        <button class="btn sm" id="top-grup-kur">Topluluk Kur</button>
      </div>
      <h3 class="top-alt-baslik">Topluluklarım</h3>
      <div class="top-grup-liste">${mine.length ? mine.map(grupKart).join("") : `<p class="muted small">Henüz bir topluluğa katılmadın. Aşağıdan keşfet ✨</p>`}</div>
      <h3 class="top-alt-baslik">Keşfet</h3>
      <div class="top-grup-liste">${oneriler.map(oneriKart).join("") || `<p class="muted small">Tüm önerilere katıldın 🌟</p>`}</div>`;
    $("top-grup-kur").addEventListener("click", grupKur);
    p.querySelectorAll("[data-ac]").forEach(b => b.addEventListener("click", () => { detayId = b.dataset.ac; cizDetay(); }));
    p.querySelectorAll("[data-katil]").forEach(b => b.addEventListener("click", () => katil(b.dataset.katil)));
  }
  function grupKart(g) {
    return `<div class="top-grup-kart glow-in"><div class="tg-ust"><span class="tg-ikon">${g.ikon || "✨"}</span><div><div class="tg-ad">${esc(g.ad)}</div><div class="tg-meta">${(g.uyeler || []).length + 1} üye · 🔥 ${grupSeri(g)} gün</div></div></div><p class="tg-acik">${esc(g.aciklama || "")}</p><button class="btn ghost sm" data-ac="${g.id}">Aç →</button></div>`;
  }
  function oneriKart(o) {
    return `<div class="top-grup-kart oneri"><div class="tg-ust"><span class="tg-ikon">${o.ikon}</span><div><div class="tg-ad">${esc(o.ad)}</div><div class="tg-meta">${esc(o.aciklama)}</div></div></div><button class="btn sm" data-katil="${esc(o.ad)}">Katıl ✨</button></div>`;
  }
  function grupKur() {
    const ad = ($("top-grup-ad").value || "").trim(); if (!ad) { $("top-grup-ad").focus(); return; }
    const l = gruplar();
    l.unshift({ id: uid("g"), ad, ikon: ($("top-grup-ikon").value || "✨").trim(), aciklama: ($("top-grup-acik").value || "").trim(), uyeler: [], gorevler: [], streakLog: {}, kaynak: "kullanici", kurulus: todayKey() });
    grupYaz(l); bana(`“${ad}” topluluğu kuruldu 👑`); cizGruplar(); cizRozetler();
  }
  function katil(ad) {
    const o = DATA.toplulukOnerileri.find(x => x.ad === ad); if (!o) return;
    const l = gruplar();
    l.unshift({ id: uid("g"), ad: o.ad, ikon: o.ikon, aciklama: o.aciklama, uyeler: [], gorevler: [], streakLog: {}, kaynak: "oneri", kurulus: todayKey() });
    grupYaz(l); bana(`“${o.ad}” topluluğuna katıldın ✨`); cizGruplar(); cizRozetler();
  }

  /* ---------- topluluk DETAYI ---------- */
  function cizDetay() {
    const g = grupBul(detayId); if (!g) { detayId = null; return geriDon(); }
    $("top-sekmeler").style.display = "none";
    $("top-panel").style.display = "none";
    const d = $("top-detay"); d.hidden = false;
    const today = todayKey();
    const durum = (g.gorevDurum || {})[today] || {};
    d.innerHTML = `
      <button class="top-geri" id="top-geri">‹ Geri</button>
      <div class="top-detay-bas"><span class="td-ikon">${g.ikon || "✨"}</span><div><h3>${esc(g.ad)}</h3><p class="muted small">${esc(g.aciklama || "")} · 🔥 ${grupSeri(g)} günlük seri</p></div></div>

      <h4 class="top-alt-baslik">Üyeler (${(g.uyeler || []).length + 1})</h4>
      <div class="top-uyeler">${["Sen", ...(g.uyeler || [])].map(uyeAvatar).join("")}</div>
      <div class="top-ekle-satir"><input type="text" id="top-uye-ad" placeholder="Üye/arkadaş ekle"/><button class="btn sm" id="top-uye-ekle">Ekle</button></div>

      <h4 class="top-alt-baslik">Ortak Görevler</h4>
      <div class="top-gorevler" id="top-gorevler">${(g.gorevler || []).length ? g.gorevler.map(gr => grupGorevSatir(gr, durum)).join("") : `<p class="muted small">Henüz ortak görev yok.</p>`}</div>
      <div class="top-oneri-cipler">${DATA.grupGorevOnerileri.map(t => `<button class="top-oneri-cip" data-gorev="${esc(t)}">+ ${esc(t)}</button>`).join("")}</div>

      <h4 class="top-alt-baslik">Bu Topluluğun Etkinlikleri</h4>
      <div class="top-grup-etk">${grupEtkinlikleri(g.id)}</div>`;
    $("top-geri").addEventListener("click", geriDon);
    $("top-uye-ekle").addEventListener("click", () => uyeEkle(g.id));
    d.querySelectorAll("[data-gorev]").forEach(b => b.addEventListener("click", () => grupGorevEkle(g.id, b.dataset.gorev)));
    d.querySelectorAll("[data-tamam]").forEach(b => b.addEventListener("click", () => grupGorevTopla(g.id, b.dataset.tamam)));
  }
  function geriDon() {
    const d = $("top-detay"); d.hidden = true; d.innerHTML = "";
    $("top-sekmeler").style.display = "";
    $("top-panel").style.display = "";
    detayId = null;
  }
  function uyeAvatar(ad) {
    const harf = (ad || "?").trim().charAt(0).toUpperCase();
    return `<span class="top-avatar" title="${esc(ad)}"><span>${esc(harf)}</span></span>`;
  }
  function uyeEkle(gid) {
    const inp = $("top-uye-ad"); const v = (inp.value || "").trim(); if (!v) return;
    const l = gruplar(); const g = l.find(x => x.id === gid); if (!g) return;
    g.uyeler = g.uyeler || []; g.uyeler.push(v); grupYaz(l); cizDetay();
  }
  function grupGorevSatir(gr, durum) {
    const ok = !!durum[gr.id];
    return `<div class="top-gorev${ok ? " tamam" : ""}"><span>${esc(gr.metin)}</span><button class="top-gorev-check" data-tamam="${gr.id}" aria-label="Tamamla">${ok ? "✓" : ""}</button></div>`;
  }
  function grupGorevEkle(gid, metin) {
    const l = gruplar(); const g = l.find(x => x.id === gid); if (!g) return;
    g.gorevler = g.gorevler || [];
    if (g.gorevler.some(x => x.metin === metin)) { bana("Bu görev zaten var"); return; }
    g.gorevler.push({ id: uid("t"), metin }); grupYaz(l); cizDetay();
  }
  function grupGorevTopla(gid, tid) {
    const l = gruplar(); const g = l.find(x => x.id === gid); if (!g) return;
    const today = todayKey();
    g.gorevDurum = g.gorevDurum || {}; g.gorevDurum[today] = g.gorevDurum[today] || {};
    g.gorevDurum[today][tid] = !g.gorevDurum[today][tid];
    g.streakLog = g.streakLog || {};
    if (Object.values(g.gorevDurum[today]).some(Boolean)) g.streakLog[today] = true; else delete g.streakLog[today];
    grupYaz(l); cizDetay(); cizRozetler();
    if (g.streakLog[today]) bana(`Birlikte tamamladınız! 🔥 ${grupSeri(g)} günlük seri`);
  }
  function grupEtkinlikleri(gid) {
    const es = etkinlikler().filter(e => e.grupId === gid).sort((a, b) => (a.tarih || "").localeCompare(b.tarih || ""));
    if (!es.length) return `<p class="muted small">Bu topluluk için etkinlik yok. “Etkinlikler” sekmesinden ekle.</p>`;
    return es.map(e => `<div class="top-mini-etk"><b>${esc(e.baslik)}</b><span class="muted small">${e.tarih || ""}${e.konum ? " · " + esc(e.konum) : ""}</span></div>`).join("");
  }

  /* ---------- sekme: ETKİNLİKLER ---------- */
  function cizEtkinlikler() {
    const p = $("top-panel");
    const gl = gruplar();
    const es = etkinlikler().slice().sort((a, b) => (a.tarih || "").localeCompare(b.tarih || ""));
    p.innerHTML = `
      <div class="top-ekle-kart">
        <input type="text" id="top-etk-baslik" placeholder="Etkinlik adı (örn. Dolunay Pikniği 🌕)"/>
        <div class="top-ekle-satir"><input type="date" id="top-etk-tarih"/><input type="text" id="top-etk-konum" placeholder="Konum"/></div>
        <textarea id="top-etk-acik" rows="2" placeholder="Açıklama (opsiyonel)"></textarea>
        <select id="top-etk-grup"><option value="">Topluluk seç (opsiyonel)</option>${gl.map(g => `<option value="${g.id}">${esc(g.ad)}</option>`).join("")}</select>
        <div class="top-oneri-cipler">${DATA.etkinlikOnerileri.map(t => `<button class="top-oneri-cip" data-etk="${esc(t)}">+ ${esc(t)}</button>`).join("")}</div>
        <button class="btn sm" id="top-etk-kur">Etkinlik Oluştur</button>
      </div>
      <h3 class="top-alt-baslik">Yaklaşan Etkinlikler</h3>
      <div class="top-etk-liste">${es.length ? es.map(etkKart).join("") : `<p class="muted small">Henüz etkinlik yok. İlk buluşmayı sen planla ✨</p>`}</div>`;
    $("top-etk-kur").addEventListener("click", etkKur);
    p.querySelectorAll("[data-etk]").forEach(b => b.addEventListener("click", () => { $("top-etk-baslik").value = b.dataset.etk; }));
    p.querySelectorAll("[data-rsvp]").forEach(b => b.addEventListener("click", () => rsvp(b.dataset.rsvp)));
    p.querySelectorAll("[data-sohbet]").forEach(b => b.addEventListener("click", () => sohbetGonder(b.dataset.sohbet)));
    p.querySelectorAll("[data-etksil]").forEach(b => b.addEventListener("click", () => etkSil(b.dataset.etksil)));
  }
  function etkKart(e) {
    const grup = e.grupId ? grupBul(e.grupId) : null;
    const katil = e.katiliyorum;
    const tarihStr = e.tarih ? new Date(e.tarih + "T00:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "long" }) : "Tarih yok";
    return `<div class="top-etk-kart glow-in">
      <div class="te-bas"><b>${esc(e.baslik)}</b><button class="top-mini-sil" data-etksil="${e.id}" aria-label="Sil">✕</button></div>
      <div class="te-meta">📅 ${tarihStr}${e.konum ? " · 📍 " + esc(e.konum) : ""}${grup ? " · " + grup.ikon + " " + esc(grup.ad) : ""}</div>
      ${e.aciklama ? `<p class="te-acik">${esc(e.aciklama)}</p>` : ""}
      <div class="te-katilim"><span class="muted small">Katılımcılar: ${(e.katilimcilar || []).length}${katil ? " · sen dahil" : ""}</span>
        <button class="btn ghost sm ${katil ? "aktif" : ""}" data-rsvp="${e.id}">${katil ? "Katılıyorsun ✓" : "Katıl"}</button></div>
      <div class="te-sohbet">${(e.sohbet || []).slice(-4).map(m => `<div class="te-msg"><b>${esc(m.kim)}</b> ${esc(m.metin)}</div>`).join("")}</div>
      <div class="top-ekle-satir"><input type="text" id="te-msg-${e.id}" placeholder="Mesaj yaz…"/><button class="btn sm" data-sohbet="${e.id}">Gönder</button></div>
    </div>`;
  }
  function etkKur() {
    const baslik = ($("top-etk-baslik").value || "").trim(); if (!baslik) { $("top-etk-baslik").focus(); return; }
    const l = etkinlikler();
    l.unshift({ id: uid("e"), baslik, tarih: $("top-etk-tarih").value || "", konum: ($("top-etk-konum").value || "").trim(), aciklama: ($("top-etk-acik").value || "").trim(), grupId: $("top-etk-grup").value || "", katiliyorum: true, katilimcilar: ["Sen"], sohbet: [] });
    etkYaz(l); bana(`“${baslik}” etkinliği oluşturuldu 📅`); cizEtkinlikler(); cizRozetler();
  }
  function rsvp(id) {
    const l = etkinlikler(); const e = l.find(x => x.id === id); if (!e) return;
    e.katiliyorum = !e.katiliyorum; e.katilimcilar = e.katilimcilar || [];
    if (e.katiliyorum) { if (!e.katilimcilar.includes("Sen")) e.katilimcilar.push("Sen"); }
    else e.katilimcilar = e.katilimcilar.filter(x => x !== "Sen");
    etkYaz(l); cizEtkinlikler();
  }
  function sohbetGonder(id) {
    const inp = $("te-msg-" + id); const v = (inp.value || "").trim(); if (!v) return;
    const l = etkinlikler(); const e = l.find(x => x.id === id); if (!e) return;
    e.sohbet = e.sohbet || []; e.sohbet.push({ kim: "Sen", metin: v, ts: Date.now() });
    etkYaz(l); cizEtkinlikler();
  }
  function etkSil(id) { etkYaz(etkinlikler().filter(x => x.id !== id)); cizEtkinlikler(); cizRozetler(); }

  /* ---------- sekme: ARKADAŞLAR & DAVET ---------- */
  function cizArkadaslar() {
    const p = $("top-panel");
    const ark = arkadaslar();
    p.innerHTML = `
      <div class="top-davet-kart">
        <h3 class="top-alt-baslik">Arkadaşını davet et</h3>
        <p class="muted small">Davet linki uygulamanın kendisini paylaşır 🤍</p>
        <div class="top-davet-btnlar">
          <button class="btn sm" id="top-davet">🔗 Davet Linki Paylaş</button>
          <button class="btn ghost sm" id="top-oner">💜 Uygulamayı Öner</button>
        </div>
      </div>
      <h3 class="top-alt-baslik">Arkadaşlarım & Takip</h3>
      <div class="top-ekle-satir"><input type="text" id="top-ark-ad" placeholder="Arkadaş adı ekle / takip et"/><button class="btn sm" id="top-ark-ekle">Ekle</button></div>
      <div class="top-ark-liste">${ark.length ? ark.map((a, i) => `<div class="top-ark-sat"><span class="top-avatar"><span>${esc(a.charAt(0).toUpperCase())}</span></span><span class="top-ark-ad">${esc(a)}</span><button class="top-mini-sil" data-arksil="${i}" aria-label="Sil">✕</button></div>`).join("") : `<p class="muted small">Henüz arkadaş eklemedin.</p>`}</div>`;
    $("top-davet").addEventListener("click", () => paylas("Birlikte gelişelim! Işığını Bul ✨ uygulamasına seni davet ediyorum:"));
    $("top-oner").addEventListener("click", () => paylas("Bu spiritüel wellbeing uygulamasını çok sevdim, sana da öneririm ✨"));
    $("top-ark-ekle").addEventListener("click", arkEkle);
    p.querySelectorAll("[data-arksil]").forEach(b => b.addEventListener("click", () => { const l = arkadaslar(); l.splice(+b.dataset.arksil, 1); arkYaz(l); cizArkadaslar(); cizRozetler(); }));
  }
  function arkEkle() {
    const inp = $("top-ark-ad"); const v = (inp.value || "").trim(); if (!v) return;
    const l = arkadaslar(); l.push(v); arkYaz(l); bana(`${v} eklendi 🤝`); cizArkadaslar(); cizRozetler();
  }

  /* ---------- sekme yönlendirme ---------- */
  function cizSekme() {
    if (sekme === "gruplar") cizGruplar();
    else if (sekme === "etkinlik") cizEtkinlikler();
    else cizArkadaslar();
  }

  function ac() {
    if (!$("top-overlay")) return;
    geriDon(); cizRozetler(); cizSekme();
    const ov = $("top-overlay");
    document.body.classList.add("top-mod");
    ov.hidden = false; ov.classList.remove("gor"); void ov.offsetWidth; ov.classList.add("gor");
  }
  function kapat() {
    const ov = $("top-overlay"); if (!ov) return;
    ov.classList.remove("gor");
    setTimeout(() => { ov.hidden = true; document.body.classList.remove("top-mod"); }, 450);
  }

  function baglan() {
    const acBtn = $("top-ac");
    if (acBtn) acBtn.addEventListener("click", ac);
    if (!$("top-overlay")) return;
    $("top-kapat").addEventListener("click", kapat);
    $("top-overlay").addEventListener("click", e => { if (e.target === $("top-overlay")) kapat(); });
    $("top-sekmeler").querySelectorAll(".top-sek").forEach(b => b.addEventListener("click", () => {
      sekme = b.dataset.sek;
      $("top-sekmeler").querySelectorAll(".top-sek").forEach(x => x.classList.toggle("aktif", x === b));
      geriDon(); cizSekme();
    }));
  }
  document.addEventListener("DOMContentLoaded", baglan);
  return { ac, kapat };
})();
