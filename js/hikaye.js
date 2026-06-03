/* ============================================================
   hikaye.js — Topluluk Hikayeleri & Anlık Paylaşım 📸✨
   24 saatte kaybolan glow halkalı story'ler (emoji reaksiyon + hızlı cevap),
   fotoğraf/yazı/günlük enerji paylaşımı, beğeni-yorum-reaksiyon, profile
   sabitleme, haftanın en ilham veren paylaşımı ve "Topluluk Enerjisi" alanı.
   Statik uygulama: içerik yerel + örnek; fotoğraflar cihazdan yüklenir.
   Global: window.Hikaye
   ============================================================ */

const Hikaye = window.Hikaye = (() => {
  const $ = id => document.getElementById(id);
  function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  function bana(m) { if (window.Bildirim && Bildirim.tetikle) Bildirim.tetikle(m, true); }
  function uid(p) { return p + Date.now().toString(36) + Math.floor(Math.random() * 99); }
  function isim() { return (Store.get("profil", {}) || {}).isim || "Sen"; }

  const STORY = "hikaye-storyler", POST = "hikaye-postlar", PREAK = "hikaye-postreak", YORUM = "hikaye-yorum", SREAK = "hikaye-storyreak";
  let aktifStory = null;

  function zaman(ts) { const f = Math.round((Date.now() - ts) / 60000); if (f < 60) return f + " dk"; if (f < 1440) return Math.round(f / 60) + " sa"; return Math.round(f / 1440) + " g"; }
  function harf(a) { return (a || "?").charAt(0).toUpperCase(); }

  function fotoOku(file, cb) {
    const r = new FileReader();
    r.onload = e => { const img = new Image(); img.onload = () => { const c = document.createElement("canvas"); const max = 900; const sc = Math.min(1, max / Math.max(img.width, img.height)); c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc); c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); cb(c.toDataURL("image/jpeg", 0.72)); }; img.src = e.target.result; };
    r.readAsDataURL(file);
  }

  /* ---------- STORYLER ---------- */
  function seedStoryler() {
    return DATA.hikayeSeedStory.map((s, i) => ({ id: "ss" + i, kim: s.kim, emoji: s.emoji, metin: s.metin, ts: Date.now() - s.oncesiSaat * 3600000, seed: true }));
  }
  function kullaniciStoryler() {
    const sinir = Date.now() - 86400000;
    return (Store.get(STORY, []) || []).filter(s => s.ts > sinir);
  }
  function tumStoryler() { return kullaniciStoryler().concat(seedStoryler()).sort((a, b) => b.ts - a.ts); }

  function cizStoryBar() {
    const bar = $("hk-story-bar"); if (!bar) return;
    const benimAktif = kullaniciStoryler().length;
    let h = `<button class="hk-story hk-ekle" id="hk-story-ekle"><span class="hk-ring hk-ring-ekle"><span class="hk-av">+</span></span><span class="hk-story-ad">Senin hikayen</span></button>`;
    h += tumStoryler().map(s => `<button class="hk-story" data-story="${s.id}"><span class="hk-ring${s.seed ? "" : " benim"}"><span class="hk-av">${esc(s.emoji || harf(s.kim))}</span></span><span class="hk-story-ad">${esc(s.kim)}</span></button>`).join("");
    bar.innerHTML = h;
    $("hk-story-ekle").addEventListener("click", storyOlustur);
    bar.querySelectorAll("[data-story]").forEach(b => b.addEventListener("click", () => storyAc(b.dataset.story)));
  }
  function storyBul(id) { return tumStoryler().find(s => s.id === id); }
  function storyOlustur() {
    const metin = prompt("Hikayene kısa bir not yaz (24 saat sonra kaybolur):");
    if (metin === null) return;
    const l = Store.get(STORY, []) || [];
    l.unshift({ id: uid("s"), kim: isim(), emoji: "💜", metin: (metin || "").trim() || "Bugün buradayım ✨", ts: Date.now() });
    Store.set(STORY, l); bana("Hikayen paylaşıldı 📸 (24 saat görünür)"); cizStoryBar();
  }
  function storyAc(id) {
    const s = storyBul(id); if (!s) return;
    aktifStory = id;
    const v = $("hk-story-viewer");
    const reak = Store.get(SREAK, {})[id] || {};
    v.innerHTML = `
      <div class="hk-sv-bar"><span></span></div>
      <button class="hk-sv-kapat" id="hk-sv-kapat" aria-label="Kapat">✕</button>
      <div class="hk-sv-ust"><span class="top-avatar sm"><span>${esc(harf(s.kim))}</span></span><b>${esc(s.kim)}</b><span class="muted small">${zaman(s.ts)} önce</span></div>
      <div class="hk-sv-icerik"><div class="hk-sv-emoji">${esc(s.emoji || "✨")}</div><p class="hk-sv-metin">${esc(s.metin)}</p></div>
      <div class="hk-sv-reak">${DATA.hikayeReaksiyonlar.map(r => `<button class="hk-reak-btn" data-sr="${r.em}">${r.em}${reak[r.em] ? " " + reak[r.em] : ""}</button>`).join("")}</div>
      <div class="hk-sv-cevap"><input type="text" id="hk-sv-inp" placeholder="Hızlı cevap gönder…"/><button class="btn sm" id="hk-sv-gonder">Gönder</button></div>`;
    v.hidden = false; v.classList.remove("gor"); void v.offsetWidth; v.classList.add("gor");
    $("hk-sv-kapat").addEventListener("click", storyKapat);
    $("hk-sv-gonder").addEventListener("click", () => { const i = $("hk-sv-inp"); if ((i.value || "").trim()) { bana("Cevabın gönderildi 💜"); i.value = ""; } });
    v.querySelectorAll("[data-sr]").forEach(b => b.addEventListener("click", () => { const all = Store.get(SREAK, {}); all[id] = all[id] || {}; all[id][b.dataset.sr] = (all[id][b.dataset.sr] || 0) + 1; Store.set(SREAK, all); b.textContent = b.dataset.sr + " " + all[id][b.dataset.sr]; ucanReak(b, b.dataset.sr); }));
  }
  function storyKapat() { const v = $("hk-story-viewer"); v.classList.remove("gor"); setTimeout(() => { v.hidden = true; v.innerHTML = ""; }, 300); aktifStory = null; }

  /* floating reaksiyon */
  function ucanReak(btn, em) {
    const r = btn.getBoundingClientRect();
    const s = document.createElement("span"); s.className = "hk-ucan"; s.textContent = em;
    s.style.left = (r.left + r.width / 2) + "px"; s.style.top = r.top + "px";
    document.body.appendChild(s); setTimeout(() => s.remove(), 1100);
  }

  /* ---------- POSTLAR ---------- */
  function seedPostlar() {
    return DATA.hikayeSeedPost.map((p, i) => ({ id: "sp" + i, kim: p.kim, emoji: p.emoji, metin: p.metin, ts: Date.now() - p.oncesiSaat * 3600000, baz: p.baz || {}, challenge: !!p.challenge, seed: true }));
  }
  function tumPostlar() {
    const benim = (Store.get(POST, []) || []);
    return benim.concat(seedPostlar());
  }
  function postReak(id) { return (Store.get(PREAK, {})[id]) || { rx: {}, liked: false }; }
  function reakSay(p) { const r = postReak(p.id).rx || {}; const baz = p.baz || {}; const t = {}; DATA.hikayeReaksiyonlar.forEach(x => t[x.em] = (baz[x.em] || 0) + (r[x.em] || 0)); return t; }
  function ilhamSkor(p) { return reakSay(p)["✨"] || 0; }

  function cizEnerji() {
    const el = $("hk-enerji"); if (!el) return;
    const benim = (window.Enerji && Enerji.hesapla) ? Enerji.hesapla() : 0;
    const hepsi = DATA.hikayeEnerjiSeed.concat(benim ? [benim] : []);
    const ort = Math.round(hepsi.reduce((a, b) => a + b, 0) / hepsi.length);
    const vibe = ort >= 75 ? "yüksek ve parlak 🌟" : ort >= 55 ? "dengeli ve huzurlu 🌿" : "yumuşak, dinlenme modunda 🌙";
    el.innerHTML = `<div class="hk-en-bas">🌍 Topluluk Enerjisi</div><div class="hk-en-yuzde">%${ort}</div><div class="hk-en-yuva"><span style="width:${ort}%"></span></div><div class="muted small">Bugün topluluğun enerjisi ${vibe}</div>`;
  }
  function cizIlham() {
    const el = $("hk-ilham"); if (!el) return;
    const en = tumPostlar().slice().sort((a, b) => ilhamSkor(b) - ilhamSkor(a))[0];
    if (!en) { el.innerHTML = ""; return; }
    el.innerHTML = `<div class="hk-ilham-rozet">⭐ Haftanın En İlham Veren Paylaşımı</div>
      <div class="hk-ilham-ic"><span class="top-avatar sm"><span>${esc(harf(en.kim))}</span></span><div><b>${esc(en.kim)}</b><p>${esc(en.metin)}</p></div></div>
      <div class="muted small">✨ ${ilhamSkor(en)} ilham</div>`;
  }

  function cizFeed() {
    const f = $("hk-feed"); if (!f) return;
    const postlar = tumPostlar().sort((a, b) => (b.sabit ? 1 : 0) - (a.sabit ? 1 : 0) || b.ts - a.ts);
    f.innerHTML = postlar.map(postKart).join("");
    f.querySelectorAll("[data-like]").forEach(b => b.addEventListener("click", () => like(b.dataset.like)));
    f.querySelectorAll("[data-rx]").forEach(b => b.addEventListener("click", () => reakVer(b.dataset.rx, b.dataset.em, b)));
    f.querySelectorAll("[data-yorumla]").forEach(b => b.addEventListener("click", () => yorumAc(b.dataset.yorumla)));
    f.querySelectorAll("[data-sabit]").forEach(b => b.addEventListener("click", () => sabitle(b.dataset.sabit)));
    f.querySelectorAll("[data-sil]").forEach(b => b.addEventListener("click", () => postSil(b.dataset.sil)));
    f.querySelectorAll("[data-yorumgonder]").forEach(b => b.addEventListener("click", () => yorumGonder(b.dataset.yorumgonder)));
  }
  function postKart(p) {
    const r = postReak(p.id); const say = reakSay(p);
    const liked = r.liked; const likeBaz = (p.baz && p.baz["💜"] ? 0 : 0);
    const yorumlar = (Store.get(YORUM, {})[p.id]) || [];
    const benim = !p.seed;
    return `<div class="hk-post glow-in${p.challenge ? " challenge" : ""}${p.sabit ? " sabit" : ""}">
      ${p.challenge ? `<span class="hk-etiket challenge">🏆 Challenge</span>` : ""}
      ${p.sabit ? `<span class="hk-etiket sabit">📌 Profilde sabit</span>` : ""}
      <div class="hk-post-bas"><span class="top-avatar sm"><span>${esc(harf(p.kim))}</span></span><div><b>${esc(p.kim)}</b><span class="muted small"> · ${zaman(p.ts)} önce</span></div></div>
      <p class="hk-post-metin">${p.emoji ? p.emoji + " " : ""}${esc(p.metin)}</p>
      ${p.foto ? `<img class="hk-post-foto" src="${p.foto}" alt="paylaşım"/>` : ""}
      ${p.enerji ? `<div class="hk-post-enerji">⚡ Enerji: %${p.enerji}</div>` : ""}
      <div class="hk-reaksiyonlar">
        <button class="hk-like${liked ? " aktif" : ""}" data-like="${p.id}">♥ ${ (p.baz && p.baz.like || 0) + (liked ? 1 : 0) }</button>
        ${DATA.hikayeReaksiyonlar.map(x => `<button class="hk-rx" data-rx="${p.id}" data-em="${x.em}" title="${x.ad}">${x.em} ${say[x.em] || 0}</button>`).join("")}
        <button class="hk-yorum-btn" data-yorumla="${p.id}">💬 ${yorumlar.length}</button>
        ${benim ? `<button class="hk-sabit-btn" data-sabit="${p.id}" title="Profile sabitle">📌</button><button class="hk-sil-btn" data-sil="${p.id}" aria-label="Sil">✕</button>` : ""}
      </div>
      <div class="hk-yorumlar" id="hk-yorum-${p.id}" hidden>
        ${yorumlar.map(y => `<div class="hk-yorum"><b>${esc(y.kim)}</b> ${esc(y.metin)}</div>`).join("")}
        <div class="top-ekle-satir"><input type="text" id="hk-yi-${p.id}" placeholder="Destek mesajı yaz…"/><button class="btn sm" data-yorumgonder="${p.id}">Gönder</button></div>
      </div>
    </div>`;
  }
  function like(id) { const all = Store.get(PREAK, {}); all[id] = all[id] || { rx: {}, liked: false }; all[id].liked = !all[id].liked; Store.set(PREAK, all); cizFeed(); }
  function reakVer(id, em, btn) { const all = Store.get(PREAK, {}); all[id] = all[id] || { rx: {}, liked: false }; all[id].rx = all[id].rx || {}; all[id].rx[em] = (all[id].rx[em] || 0) + 1; Store.set(PREAK, all); ucanReak(btn, em); cizIlham(); cizFeed(); }
  function yorumAc(id) { const el = $("hk-yorum-" + id); if (el) el.hidden = !el.hidden; }
  function yorumGonder(id) { const inp = $("hk-yi-" + id); const v = (inp.value || "").trim(); if (!v) return; const all = Store.get(YORUM, {}); all[id] = all[id] || []; all[id].push({ kim: isim(), metin: v, ts: Date.now() }); Store.set(YORUM, all); cizFeed(); const e = $("hk-yorum-" + id); if (e) e.hidden = false; }
  function sabitle(id) { const l = Store.get(POST, []) || []; const p = l.find(x => x.id === id); if (!p) return; p.sabit = !p.sabit; Store.set(POST, l); bana(p.sabit ? "Paylaşım profiline sabitlendi 📌" : "Sabit kaldırıldı"); cizFeed(); }
  function postSil(id) { Store.set(POST, (Store.get(POST, []) || []).filter(x => x.id !== id)); cizFeed(); cizIlham(); }

  /* ---------- paylaşım oluştur ---------- */
  let fotoData = null;
  function cizOlustur() {
    const el = $("hk-olustur"); if (!el) return;
    el.innerHTML = `
      <textarea id="hk-yeni-metin" rows="2" placeholder="Bir anını, enerjini ya da ilhamını paylaş…"></textarea>
      <div id="hk-foto-onizle"></div>
      <div class="hk-olustur-alt">
        <label class="btn ghost sm">📷 Fotoğraf<input type="file" id="hk-foto-inp" accept="image/*" hidden/></label>
        <button class="btn ghost sm" id="hk-enerji-btn">⚡ Enerjimi paylaş</button>
        <label class="hk-chall-chk"><input type="checkbox" id="hk-chall"/> Challenge</label>
        <button class="btn sm" id="hk-paylas-btn">Paylaş ✨</button>
      </div>`;
    fotoData = null;
    $("hk-foto-inp").addEventListener("change", e => { const file = e.target.files[0]; if (file) fotoOku(file, d => { fotoData = d; $("hk-foto-onizle").innerHTML = `<img class="hk-onizle-img" src="${d}" alt="önizleme"/>`; }); });
    $("hk-enerji-btn").addEventListener("click", () => { const p = (window.Enerji && Enerji.hesapla) ? Enerji.hesapla() : 0; $("hk-yeni-metin").value = `Bugünkü enerjim %${p} ✨`; $("hk-yeni-metin").dataset.enerji = p; });
    $("hk-paylas-btn").addEventListener("click", paylas);
  }
  function paylas() {
    const ta = $("hk-yeni-metin"); const v = (ta.value || "").trim();
    if (!v && !fotoData) { ta.focus(); return; }
    const l = Store.get(POST, []) || [];
    l.unshift({ id: uid("p"), kim: isim(), metin: v, foto: fotoData, enerji: ta.dataset.enerji ? +ta.dataset.enerji : null, challenge: $("hk-chall").checked, ts: Date.now(), sabit: false });
    Store.set(POST, l); bana("Paylaşımın topluluğa eklendi 📸✨"); fotoData = null; cizOlustur(); cizFeed(); cizIlham();
  }

  function ciz() { cizStoryBar(); cizEnerji(); cizIlham(); cizOlustur(); cizFeed(); }

  function ac() {
    if (!$("hk-overlay")) return;
    storyKapat(); ciz();
    const ov = $("hk-overlay"); document.body.classList.add("hk-mod");
    ov.hidden = false; ov.classList.remove("gor"); void ov.offsetWidth; ov.classList.add("gor");
  }
  function kapat() { const ov = $("hk-overlay"); if (!ov) return; ov.classList.remove("gor"); setTimeout(() => { ov.hidden = true; document.body.classList.remove("hk-mod"); }, 450); }

  function baglan() {
    [$("hk-ac"), $("hk-ac-2")].forEach(b => { if (b) b.addEventListener("click", ac); });
    if (!$("hk-overlay")) return;
    $("hk-kapat").addEventListener("click", kapat);
    $("hk-overlay").addEventListener("click", e => { if (e.target === $("hk-overlay")) kapat(); });
  }
  document.addEventListener("DOMContentLoaded", baglan);
  return { ac, kapat };
})();
