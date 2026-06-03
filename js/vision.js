/* ============================================================
   vision.js — Dijital Vision Board / Hayal Panosu 🌟✨
   Sürükle-bırak tuvalde görsel, motivasyon cümlesi ve glow sticker'lar
   ile hayal panosu oluşturma. Hedef kategorileri, AI öneri (mesaj +
   olumlama + mini görev), "Bugünkü niyetin", kaydedilen panolar
   (favoriler), günlük hatırlatma ve paylaşım altyapısı.
   Global: window.Vision
   ============================================================ */

const Vision = window.Vision = (() => {
  const $ = id => document.getElementById(id);
  function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

  let board = { items: [], niyet: "" };
  let aktifKat = DATA.visionKategorileri[0].id;
  let suruklenen = null, canvasRect = null;

  function kategori(id) { return DATA.visionKategorileri.find(k => k.id === id) || DATA.visionKategorileri[0]; }
  function yukle() { board = Store.get("vision-board", { items: [], niyet: "" }); }
  function kaydet() { Store.set("vision-board", board); }
  function yeniId() { return "v" + Date.now().toString(36) + Math.floor(Math.random() * 99); }

  /* ---------- öğe ekleme ---------- */
  function itemEkle(p) {
    const it = Object.assign({ id: yeniId(), x: 30 + Math.random() * 40, y: 25 + Math.random() * 40, kat: aktifKat }, p);
    board.items.push(it); kaydet(); cizCanvas(); aiCiz();
  }
  function gorselEkle(file) {
    const r = new FileReader();
    r.onload = e => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas"), max = 420;
        const sc = Math.min(1, max / Math.max(img.width, img.height));
        c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        try { itemEkle({ tip: "gorsel", img: c.toDataURL("image/jpeg", 0.7) }); } catch (err) {}
      };
      img.src = e.target.result;
    };
    r.readAsDataURL(file);
  }

  /* ---------- sürükle-bırak ---------- */
  function dragBagla(el) {
    el.addEventListener("pointerdown", e => {
      if (e.target.closest(".vb-sil")) return;
      suruklenen = el; el.classList.add("suru");
      canvasRect = $("vb-canvas").getBoundingClientRect();
      try { el.setPointerCapture(e.pointerId); } catch (x) {}
    });
    el.addEventListener("pointermove", e => {
      if (suruklenen !== el || !canvasRect) return;
      let x = (e.clientX - canvasRect.left) / canvasRect.width * 100;
      let y = (e.clientY - canvasRect.top) / canvasRect.height * 100;
      x = Math.max(3, Math.min(97, x)); y = Math.max(4, Math.min(96, y));
      el.style.left = x + "%"; el.style.top = y + "%";
      el.dataset.x = x; el.dataset.y = y;
    });
    const bitir = () => {
      if (suruklenen !== el) return;
      el.classList.remove("suru");
      const it = board.items.find(i => i.id === el.dataset.id);
      if (it) { it.x = parseFloat(el.dataset.x); it.y = parseFloat(el.dataset.y); kaydet(); }
      suruklenen = null;
    };
    el.addEventListener("pointerup", bitir);
    el.addEventListener("pointercancel", bitir);
  }

  /* ---------- render ---------- */
  function cizCanvas() {
    const c = $("vb-canvas");
    c.querySelectorAll(".vb-item").forEach(e => e.remove());
    if (!board.items.length) c.classList.add("bos"); else c.classList.remove("bos");
    board.items.forEach(it => {
      const kat = kategori(it.kat);
      const el = document.createElement("div");
      el.className = "vb-item vb-" + it.tip;
      el.dataset.id = it.id; el.dataset.x = it.x; el.dataset.y = it.y;
      el.style.left = it.x + "%"; el.style.top = it.y + "%";
      el.style.setProperty("--kat", kat.renk);
      let ic = "";
      if (it.tip === "gorsel") ic = `<img src="${it.img}" alt="hayal"/>`;
      else if (it.tip === "sticker") ic = `<span class="vb-sticker-ic">${it.sembol}</span>`;
      else ic = `<span class="vb-metin-ic">${esc(it.metin)}</span>`;
      el.innerHTML = ic + `<button class="vb-sil" aria-label="Sil">✕</button>`;
      el.querySelector(".vb-sil").addEventListener("click", () => { board.items = board.items.filter(i => i.id !== it.id); kaydet(); cizCanvas(); aiCiz(); });
      dragBagla(el);
      c.appendChild(el);
    });
  }
  function cizKategoriler() {
    const k = $("vb-kat-chips"); k.innerHTML = "";
    DATA.visionKategorileri.forEach(c => {
      const b = document.createElement("button");
      b.className = "vb-kat-chip" + (aktifKat === c.id ? " aktif" : "");
      b.style.setProperty("--kat", c.renk);
      b.innerHTML = `${c.ikon} ${c.ad}`;
      b.addEventListener("click", () => { aktifKat = c.id; cizKategoriler(); });
      k.appendChild(b);
    });
  }
  function cizStickerlar() {
    const s = $("vb-stickerlar"); s.innerHTML = "";
    DATA.visionStickerlar.forEach(sem => {
      const b = document.createElement("button");
      b.className = "vb-sticker-btn"; b.textContent = sem;
      b.addEventListener("click", () => itemEkle({ tip: "sticker", sembol: sem }));
      s.appendChild(b);
    });
  }
  function aiCiz() {
    const el = $("vb-ai"); if (!el) return;
    const say = {};
    board.items.forEach(i => { say[i.kat] = (say[i.kat] || 0) + 1; });
    const baskinId = Object.keys(say).sort((a, b) => say[b] - say[a])[0];
    const k = baskinId ? kategori(baskinId) : pickByDate(DATA.visionKategorileri);
    el.innerHTML = `
      <div class="vb-ai-mesaj">${esc(pickByDate(DATA.visionMesajlari))}</div>
      <div class="vb-ai-sat"><span class="vb-ai-et">Olumlama · ${esc(k.ad)}</span><p>“${esc(k.olumlama)}”</p></div>
      <div class="vb-ai-sat"><span class="vb-ai-et">Mini Görev</span><p>${esc(k.gorev)}</p></div>`;
  }

  /* ---------- favoriler / paylaşım ---------- */
  function favListe() { return Store.get("vision-favoriler", []); }
  function cizFavoriler() {
    const el = $("vb-favori-liste"); if (!el) return;
    const f = favListe();
    el.innerHTML = f.length
      ? `<ul class="liste">${f.map(p => `<li><span class="liste-metin">${esc(p.ad)} · ${p.items.length} öğe</span><button class="vb-yukle" data-id="${p.id}">Aç</button><button class="sil vb-fav-sil" data-id="${p.id}">✕</button></li>`).join("")}</ul>`
      : `<p class="muted small">Henüz kayıtlı pano yok.</p>`;
    el.querySelectorAll(".vb-yukle").forEach(b => b.addEventListener("click", () => {
      const p = favListe().find(x => x.id === b.dataset.id);
      if (p) { board = { items: JSON.parse(JSON.stringify(p.items)), niyet: p.niyet || "" }; kaydet(); cizCanvas(); $("vb-niyet").value = board.niyet; aiCiz(); }
    }));
    el.querySelectorAll(".vb-fav-sil").forEach(b => b.addEventListener("click", () => { Store.set("vision-favoriler", favListe().filter(x => x.id !== b.dataset.id)); cizFavoriler(); }));
  }
  function panoKaydet() {
    const f = favListe();
    const ad = "Pano · " + new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    f.unshift({ id: yeniId(), ad, items: JSON.parse(JSON.stringify(board.items)), niyet: board.niyet });
    while (f.length > 6) f.pop();
    Store.set("vision-favoriler", f); cizFavoriler();
    const b = $("vb-favori"); b.textContent = "Kaydedildi ♥"; setTimeout(() => b.textContent = "Panoyu Kaydet ♥", 1600);
  }
  function paylas() {
    const cumleler = board.items.filter(i => i.tip === "metin").map(i => i.metin);
    const ozet = `🌟 Hayal Panom${cumleler.length ? "\n• " + cumleler.join("\n• ") : ""}${board.niyet ? "\n\nBugünkü niyetim: " + board.niyet : ""}\n\nIşığını Bul ✨`;
    if (navigator.share) navigator.share({ title: "Hayal Panom ✨", text: ozet }).catch(() => {});
    else if (navigator.clipboard) { navigator.clipboard.writeText(ozet); const b = $("vb-paylas"); b.textContent = "Kopyalandı ✓"; setTimeout(() => b.textContent = "Paylaş", 1600); }
  }

  /* ---------- aç/kapat ---------- */
  function ac() {
    yukle();
    document.body.classList.add("vision-mod");
    cizKategoriler(); cizStickerlar(); cizCanvas(); cizFavoriler(); aiCiz();
    $("vb-niyet").value = board.niyet || "";
    const ov = $("vision-overlay");
    ov.hidden = false; ov.classList.remove("gor"); void ov.offsetWidth; ov.classList.add("gor");
  }
  function kapat() {
    const ov = $("vision-overlay");
    ov.classList.remove("gor");
    setTimeout(() => { ov.hidden = true; document.body.classList.remove("vision-mod"); }, 400);
    girisGuncelle();
  }
  function girisGuncelle() {
    const el = $("vis-alt"); if (!el) return;
    const b = Store.get("vision-board", { items: [] });
    el.textContent = b.items.length ? `Hayallerine bir göz at 🌟 · ${b.items.length} öğe` : "Hedeflerini görsel bir panoda topla";
  }

  function baglan() {
    const acBtn = $("vision-ac");
    if (acBtn) acBtn.addEventListener("click", ac);
    girisGuncelle();
    if (!$("vision-overlay")) return;
    $("vision-kapat").addEventListener("click", kapat);
    $("vb-metin-ekle").addEventListener("click", () => {
      const inp = $("vb-metin-input"); const v = (inp.value || "").trim();
      if (!v) { inp.focus(); return; }
      itemEkle({ tip: "metin", metin: v }); inp.value = "";
    });
    $("vb-gorsel-input").addEventListener("change", e => { const f = e.target.files[0]; if (f) gorselEkle(f); e.target.value = ""; });
    $("vb-niyet-kaydet").addEventListener("click", () => {
      board.niyet = ($("vb-niyet").value || "").trim(); kaydet();
      const b = $("vb-niyet-kaydet"); b.textContent = "Kaydedildi ✓"; setTimeout(() => b.textContent = "Kaydet", 1600);
    });
    $("vb-favori").addEventListener("click", panoKaydet);
    $("vb-paylas").addEventListener("click", paylas);
    $("vb-temizle").addEventListener("click", () => { if (!board.items.length) return; board.items = []; kaydet(); cizCanvas(); aiCiz(); });
  }

  document.addEventListener("DOMContentLoaded", baglan);
  return { ac, kapat };
})();
