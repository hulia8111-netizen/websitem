/* ============================================================
   akis.js — Herkese Açık Topluluk Akışı 🌍✨
   Modern community feed: yaklaşan etkinlikler, günlük topluluk görevleri
   (ilerleme % + grup streak), challenge serileri ve kullanıcı paylaşımları.
   Etkinliklerde Katıl / Davet / Sohbet / Kaydet / Paylaş; her etkinliğin ve
   topluluğun kendi sohbeti (emoji + reaksiyon). Statik uygulama olduğundan
   akış demo/yerel içerikle çalışır; paylaşım linki uygulamayı paylaşır.
   Global: window.Akis
   ============================================================ */

const Akis = window.Akis = (() => {
  const $ = id => document.getElementById(id);
  function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  function bana(m) { if (window.Bildirim && Bildirim.tetikle) Bildirim.tetikle(m, true); }

  const KATIL = "akis-katildim", KAYIT = "akis-kayit", GOREV = "akis-gorev", STREAK = "akis-streak", SOH = "akis-sohbet", PAY = "akis-paylasim";
  let aktifOda = null;

  const get = (k, d) => Store.get(k, d);
  const set = (k, v) => Store.set(k, v);

  function appURL() { return location.origin + location.pathname; }
  function paylas(metin) {
    const url = appURL();
    if (navigator.share) navigator.share({ title: "Işığını Bul ✨", text: metin, url }).catch(() => {});
    else if (navigator.clipboard) { navigator.clipboard.writeText(metin + " " + url); bana("Bağlantı kopyalandı ✨"); }
    else bana(url);
  }
  function etkBul(id) { return DATA.akisEtkinlikleri.find(e => e.id === id); }
  function zaman(ts) {
    const fark = Math.round((Date.now() - ts) / 60000);
    if (fark < 60) return fark + " dk önce";
    if (fark < 1440) return Math.round(fark / 60) + " sa önce";
    return Math.round(fark / 1440) + " gün önce";
  }

  /* ---------- grup streak (topluluk görevleri) ---------- */
  function streakLog() { return get(STREAK, {}) || {}; }
  function grupSeri() {
    const log = streakLog(); let s = 0; const d = new Date();
    for (;;) { const k = todayKey(d); if (log[k]) { s++; d.setDate(d.getDate() - 1); } else { if (k === todayKey()) { d.setDate(d.getDate() - 1); continue; } break; } }
    return s;
  }

  /* ---------- FEED ---------- */
  function ciz() {
    const f = $("akis-feed"); if (!f) return;
    const katildim = get(KATIL, {}) || {};
    const kayit = get(KAYIT, {}) || {};
    const gorevDurum = (get(GOREV, {}) || {})[todayKey()] || {};

    f.innerHTML = `
      <section class="akis-bolum">
        <h3 class="akis-bolum-bas">🔥 Günlük Topluluk Görevleri <span class="akis-streak">${grupSeri()} günlük seri</span></h3>
        <div class="akis-gorevler">${DATA.akisGorevleri.map(g => gorevKart(g, !!gorevDurum[g.id])).join("")}</div>
      </section>
      <section class="akis-bolum">
        <h3 class="akis-bolum-bas">📅 Yaklaşan Etkinlikler</h3>
        <div class="akis-etkinlikler">${DATA.akisEtkinlikleri.map(e => etkKart(e, !!katildim[e.id], !!kayit[e.id])).join("")}</div>
      </section>
      <section class="akis-bolum">
        <h3 class="akis-bolum-bas">🏆 Challenge Serileri</h3>
        <div class="akis-challenge">${DATA.akisChallengeleri.map(challKart).join("")}</div>
      </section>
      <section class="akis-bolum">
        <h3 class="akis-bolum-bas">💬 Topluluk Paylaşımları</h3>
        <div class="akis-paylas-kutu"><textarea id="akis-pay-metin" rows="2" placeholder="Topluluğa bir şeyler paylaş…"></textarea><button class="btn sm" id="akis-pay-btn">Paylaş ✨</button></div>
        <div class="akis-akis" id="akis-akis">${paylasimlar().map(paylasimKart).join("")}</div>
      </section>`;

    // görev
    f.querySelectorAll("[data-gorev]").forEach(b => b.addEventListener("click", () => gorevTopla(b.dataset.gorev)));
    // etkinlik butonları
    f.querySelectorAll("[data-katil]").forEach(b => b.addEventListener("click", () => katil(b.dataset.katil)));
    f.querySelectorAll("[data-kaydet]").forEach(b => b.addEventListener("click", () => kaydet(b.dataset.kaydet)));
    f.querySelectorAll("[data-sohbet]").forEach(b => b.addEventListener("click", () => sohbetAc("etk-" + b.dataset.sohbet, etkBul(b.dataset.sohbet).baslik)));
    f.querySelectorAll("[data-davet]").forEach(b => b.addEventListener("click", () => { const e = etkBul(b.dataset.davet); paylas(`${e.ikon} "${e.baslik}" etkinliğine seni davet ediyorum (${e.tarih} ${e.saat})`); }));
    f.querySelectorAll("[data-paylasetk]").forEach(b => b.addEventListener("click", () => { const e = etkBul(b.dataset.paylasetk); paylas(`${e.ikon} "${e.baslik}" · ${e.tarih} ${e.saat} · ${e.konum}`); }));
    // challenge katıl
    f.querySelectorAll("[data-chall]").forEach(b => b.addEventListener("click", () => bana("Challenge'a katıldın 🔥 Her gün küçük bir adım!")));
    // paylaşım
    $("akis-pay-btn").addEventListener("click", paylasimGonder);
    bindReaksiyon(f);
  }

  function gorevKart(g, ok) {
    const yuzde = Math.min(100, g.bazYuzde + (ok ? 8 : 0));
    return `<div class="akis-gorev${ok ? " tamam" : ""}">
      <div class="ag-bas"><span class="ag-ikon">${g.ikon}</span><span class="ag-metin">${esc(g.metin)}</span></div>
      <div class="ag-ilerleme"><div class="ag-yuva"><span style="width:${yuzde}%"></span></div><span class="ag-yuzde">%${yuzde}</span></div>
      <div class="ag-alt"><span class="muted small">${g.katilim}+ kişi katıldı</span><button class="akis-mini-btn ${ok ? "aktif" : ""}" data-gorev="${g.id}">${ok ? "Tamamladın ✓" : "Tamamla"}</button></div>
    </div>`;
  }
  function etkKart(e, katildim, kayitli) {
    const sayi = e.katilim + (katildim ? 1 : 0);
    const tarihStr = new Date(e.tarih + "T00:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "long" });
    return `<div class="akis-etk glow-in">
      <div class="ae-bas"><span class="ae-ikon">${e.ikon}</span><div><div class="ae-baslik">${esc(e.baslik)}</div><div class="ae-meta">📅 ${tarihStr} · 🕐 ${e.saat}</div></div></div>
      <div class="ae-meta2">📍 ${esc(e.konum)} · 👤 ${esc(e.sahip)} · 👥 ${sayi} katılımcı</div>
      <p class="ae-acik">${esc(e.aciklama)}</p>
      <div class="ae-btnlar">
        <button class="akis-mini-btn ${katildim ? "aktif" : ""}" data-katil="${e.id}">${katildim ? "Katıldın ✓" : "Katıl ✨"}</button>
        <button class="akis-ikon-btn" data-davet="${e.id}" title="Arkadaş davet et">🤝</button>
        <button class="akis-ikon-btn" data-sohbet="${e.id}" title="Sohbet">💬</button>
        <button class="akis-ikon-btn ${kayitli ? "aktif" : ""}" data-kaydet="${e.id}" title="Kaydet">${kayitli ? "★" : "☆"}</button>
        <button class="akis-ikon-btn" data-paylasetk="${e.id}" title="Paylaş">🔗</button>
      </div>
    </div>`;
  }
  function challKart(c) {
    return `<div class="akis-chall"><span class="ac-ikon">${c.ikon}</span><div class="ac-bilgi"><div class="ac-baslik">${esc(c.baslik)}</div><div class="muted small">${c.gun} gün · ${esc(c.aciklama)}</div></div><button class="akis-mini-btn" data-chall="${c.id}">Katıl</button></div>`;
  }

  /* ---------- görev tamamlama ---------- */
  function gorevTopla(gid) {
    const all = get(GOREV, {}) || {};
    const t = todayKey();
    all[t] = all[t] || {};
    all[t][gid] = !all[t][gid];
    set(GOREV, all);
    const log = streakLog();
    if (Object.values(all[t]).some(Boolean)) log[t] = true; else delete log[t];
    set(STREAK, log);
    ciz();
    if (all[t][gid]) bana(`Topluluk göreviyle birliktesin 🔥 ${grupSeri()} günlük seri`);
  }
  function katil(id) {
    const k = get(KATIL, {}) || {}; k[id] = !k[id]; set(KATIL, k);
    ciz(); if (k[id]) bana("Etkinliğe katıldın ✨");
  }
  function kaydet(id) {
    const k = get(KAYIT, {}) || {}; k[id] = !k[id]; set(KAYIT, k);
    ciz(); bana(k[id] ? "Etkinlik kaydedildi ★" : "Kayıt kaldırıldı");
  }

  /* ---------- paylaşımlar ---------- */
  function paylasimlar() {
    const seed = DATA.akisPaylasimlari.map((p, i) => ({ id: "s" + i, kim: p.kim, metin: p.metin, ts: Date.now() - p.oncesiSaat * 3600000, seed: true }));
    const benim = get(PAY, []) || [];
    return benim.concat(seed).sort((a, b) => b.ts - a.ts);
  }
  function paylasimKart(p) {
    const harf = (p.kim || "?").charAt(0).toUpperCase();
    const reak = reaksiyonGoster("pay-" + p.id);
    return `<div class="akis-post">
      <div class="ap-bas"><span class="top-avatar sm"><span>${esc(harf)}</span></span><div><b>${esc(p.kim)}</b><span class="muted small"> · ${zaman(p.ts)}</span></div></div>
      <p class="ap-metin">${esc(p.metin)}</p>
      <div class="ap-reak" data-reakoda="pay-${p.id}">${reak}</div>
    </div>`;
  }
  function paylasimGonder() {
    const ta = $("akis-pay-metin"); const v = (ta.value || "").trim(); if (!v) return;
    const l = get(PAY, []) || [];
    l.unshift({ id: "u" + Date.now().toString(36), kim: ((Store.get("profil", {}) || {}).isim || "Sen"), metin: v, ts: Date.now() });
    set(PAY, l); ta.value = ""; ciz(); bana("Paylaşımın akışa eklendi ✨");
  }

  /* ---------- reaksiyon sistemi (paylaşım + sohbet) ---------- */
  function reakStore() { return get("akis-reaksiyon", {}) || {}; }
  function reaksiyonGoster(oda) {
    const r = (reakStore()[oda]) || {};
    const cipler = DATA.akisEmojiler.map(em => `<button class="akis-reak-cip${r[em] ? " var" : ""}" data-em="${em}">${em}${r[em] ? " " + r[em] : ""}</button>`).join("");
    return cipler;
  }
  function bindReaksiyon(kok) {
    kok.querySelectorAll(".ap-reak, .am-reak").forEach(box => {
      box.querySelectorAll(".akis-reak-cip").forEach(b => b.addEventListener("click", () => {
        const oda = box.dataset.reakoda; const em = b.dataset.em;
        const all = reakStore(); all[oda] = all[oda] || {}; all[oda][em] = (all[oda][em] || 0) + 1;
        set("akis-reaksiyon", all);
        b.classList.add("var"); b.textContent = em + " " + all[oda][em];
        b.classList.remove("patla"); void b.offsetWidth; b.classList.add("patla");
      }));
    });
  }

  /* ---------- SOHBET ---------- */
  function odaMsglari(oda) {
    const all = get(SOH, {}) || {};
    if (!all[oda]) {
      // seed
      if (oda === "genel") all[oda] = [{ kim: "Elif", metin: "Bugünkü meditasyon çok iyiydi 🌙", ts: Date.now() - 5400000 }, { kim: "Can", metin: "Yarın yürüyüşte görüşürüz ✨", ts: Date.now() - 1800000 }];
      else { const e = etkBul(oda.replace("etk-", "")); all[oda] = e ? [{ kim: e.sahip, metin: `Herkese merhaba! ${e.baslik} için buradayız 🤍`, ts: Date.now() - 3600000 }] : []; }
      set(SOH, all);
    }
    return all[oda];
  }
  function sohbetAc(oda, baslik) {
    aktifOda = oda;
    const p = $("akis-sohbet-panel"); $("akis-feed").style.display = "none"; $("akis-genel").style.display = "none";
    p.hidden = false; cizSohbet(baslik);
  }
  function sohbetKapat() {
    aktifOda = null; const p = $("akis-sohbet-panel"); p.hidden = true; p.innerHTML = "";
    $("akis-feed").style.display = ""; $("akis-genel").style.display = "";
  }
  function cizSohbet(baslik) {
    const p = $("akis-sohbet-panel");
    const msgs = odaMsglari(aktifOda);
    p.innerHTML = `
      <button class="top-geri" id="akis-soh-geri">‹ Akışa dön</button>
      <h3 class="akis-soh-baslik">💬 ${esc(baslik || "Genel Sohbet")}</h3>
      <div class="akis-msglar" id="akis-msglar">${msgs.map(msgKart).join("")}</div>
      <div class="akis-emoji-bar">${DATA.akisEmojiler.map(em => `<button class="akis-emoji" data-emoji="${em}">${em}</button>`).join("")}</div>
      <div class="top-ekle-satir"><input type="text" id="akis-msg-inp" placeholder="Mesaj yaz…"/><button class="btn sm" id="akis-msg-gonder">Gönder</button></div>`;
    $("akis-soh-geri").addEventListener("click", sohbetKapat);
    $("akis-msg-gonder").addEventListener("click", msgGonder);
    $("akis-msg-inp").addEventListener("keydown", e => { if (e.key === "Enter") msgGonder(); });
    p.querySelectorAll(".akis-emoji").forEach(b => b.addEventListener("click", () => { const i = $("akis-msg-inp"); i.value += b.dataset.emoji; i.focus(); }));
    bindReaksiyon(p);
    const ml = $("akis-msglar"); ml.scrollTop = ml.scrollHeight;
  }
  function msgKart(m, i) {
    const ben = m.kim === "Sen" || m.kim === ((Store.get("profil", {}) || {}).isim);
    const harf = (m.kim || "?").charAt(0).toUpperCase();
    const oda = "msg-" + aktifOda + "-" + m.ts;
    return `<div class="akis-msg${ben ? " ben" : ""}">
      <span class="top-avatar sm"><span>${esc(harf)}</span></span>
      <div class="am-balon"><b>${esc(m.kim)}</b><p>${esc(m.metin)}</p><div class="am-reak" data-reakoda="${oda}">${reaksiyonGoster(oda)}</div></div>
    </div>`;
  }
  function msgGonder() {
    const inp = $("akis-msg-inp"); const v = (inp.value || "").trim(); if (!v) return;
    const all = get(SOH, {}) || {};
    all[aktifOda] = all[aktifOda] || [];
    all[aktifOda].push({ kim: ((Store.get("profil", {}) || {}).isim || "Sen"), metin: v, ts: Date.now() });
    set(SOH, all); inp.value = "";
    cizSohbet($(".akis-soh-baslik") ? $("akis-sohbet-panel").querySelector(".akis-soh-baslik").textContent.replace("💬 ", "") : "");
    const ml = $("akis-msglar"); if (ml) { ml.scrollTop = ml.scrollHeight; ml.classList.add("yeni"); }
  }

  /* ---------- aç / kapat ---------- */
  function ac() {
    if (!$("akis-overlay")) return;
    sohbetKapat(); ciz();
    const ov = $("akis-overlay");
    document.body.classList.add("akis-mod");
    ov.hidden = false; ov.classList.remove("gor"); void ov.offsetWidth; ov.classList.add("gor");
  }
  function kapat() {
    const ov = $("akis-overlay"); if (!ov) return;
    ov.classList.remove("gor");
    setTimeout(() => { ov.hidden = true; document.body.classList.remove("akis-mod"); }, 450);
  }

  function baglan() {
    [$("akis-ac"), $("akis-ac-2")].forEach(b => { if (b) b.addEventListener("click", ac); });
    if (!$("akis-overlay")) return;
    $("akis-kapat").addEventListener("click", kapat);
    $("akis-overlay").addEventListener("click", e => { if (e.target === $("akis-overlay")) kapat(); });
    $("akis-genel").addEventListener("click", () => sohbetAc("genel", "Genel Sohbet"));
  }
  document.addEventListener("DOMContentLoaded", baglan);
  return { ac, kapat };
})();
