/* ============================================================
   magazaurun.js — Self-servis fiziksel ürün (Işık Mumları…) 🕯️
   ------------------------------------------------------------
   Ürünler Supabase `magaza_urun` tablosundan. Yönetici panelinden
   ürün/foto/fiyat ekle-çıkar. "Sipariş Oluştur" → WhatsApp.
   Global: window.MagazaUrun
   ============================================================ */

const MagazaUrun = window.MagazaUrun = (() => {
  const $ = s => document.querySelector(s);
  const BUCKET = "urun-foto";
  const AKTIF_BOLUM = "isik-mumlari";                 // panelin yönettiği bölüm
  const WA_VARSAYILAN = { "isik-mumlari": "905300421259" };

  let cache = {};   // { bolum: [urun...] }
  let duzenId = null;
  let seciliFotoUrl = "";

  function sb() { try { return window.Bulut && Bulut.client ? Bulut.client() : null; } catch (e) { return null; } }
  const YONETICI_EPOSTA = ["hulia8111@gmail.com"];
  function moderatorMu() {
    try {
      const em = (window.Bulut && Bulut.durum ? (Bulut.durum().email || "") : "").toLowerCase();
      if (em && YONETICI_EPOSTA.indexOf(em) !== -1) return true;
    } catch (e) {}
    try { return !!(window.ToplulukSosyal && ToplulukSosyal.moderatorMuCached && ToplulukSosyal.moderatorMuCached()); } catch (e) { return false; }
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  function gorselli(g) { return typeof g === "string" && /^https?:\/\//i.test(g); }

  /* ---------- veri ---------- */
  async function yukle(bolum) {
    const c = sb();
    if (!c) return cache[bolum] || [];
    try {
      const { data } = await c.from("magaza_urun").select("*").eq("bolum", bolum).eq("aktif", true).order("sira", { ascending: false });
      cache[bolum] = data || [];
    } catch (e) { cache[bolum] = cache[bolum] || []; }
    return cache[bolum];
  }

  function waNo(u, bolum) {
    if (u && u.wa_no) return u.wa_no;
    // Bölüme göre ayardan (Işık Mumları → wa_mum)
    const anahtar = (bolum || AKTIF_BOLUM) === "isik-mumlari" ? "wa_mum" : null;
    if (anahtar && window.SiteAyar) { const v = SiteAyar.get(anahtar, null); if (v) return v; }
    return WA_VARSAYILAN[bolum || AKTIF_BOLUM] || "905300421259";
  }
  function siparisWA(u, bolum) {
    const mesaj = `Merhaba, "${u.ad}" için sipariş vermek / bilgi almak istiyorum ✨`;
    return `https://wa.me/${waNo(u, bolum)}?text=${encodeURIComponent(mesaj)}`;
  }

  /* ---------- MAĞAZA kartları ---------- */
  function urunKart(u, bolum) {
    const kart = document.createElement("div");
    kart.className = "mg-kart sade";
    const gorselHTML = gorselli(u.gorsel)
      ? `<div class="mg-kart-gorsel"><img src="${esc(u.gorsel)}" alt="${esc(u.ad)}" loading="lazy" /></div>`
      : `<div class="mg-kart-gorsel bos"><span>🕯️</span></div>`;
    const fiyatHTML = u.fiyat ? `<div class="mg-kart-fiyat">${esc(u.fiyat)}</div>` : "";
    kart.innerHTML = `
      ${gorselHTML}
      <div class="mg-kart-ad">${esc(u.ad)}</div>
      ${u.aciklama ? `<div class="mg-kart-aciklama">${esc(u.aciklama)}</div>` : ""}
      ${fiyatHTML}
      <div class="mg-siparis-not">🕊️ Siparişle özel hazırlanır</div>
      <button class="mg-satinal siparis" type="button">Sipariş Oluştur ✦</button>`;
    kart.querySelector(".mg-satinal").addEventListener("click", () => window.open(siparisWA(u, bolum), "_blank", "noopener,noreferrer"));
    return kart;
  }

  // magaza.js çağırır: bölümün ürünlerini grid'e ekler (yoksa "sipariş" kartı)
  async function magazaKartlari(grid, bolum) {
    if (!grid) return;
    const urunler = await yukle(bolum);
    if (urunler.length) {
      urunler.forEach(u => grid.appendChild(urunKart(u, bolum)));
    } else {
      // Bölüm boş ama KAPALI değil → sipariş/iletişim kartı
      const kart = document.createElement("div");
      kart.className = "mg-kart sade mu-bos-kart";
      kart.innerHTML = `
        <div class="mg-kart-gorsel bos"><span>🕯️</span></div>
        <div class="mg-kart-ad">Işık Mumları</div>
        <div class="mg-kart-aciklama">Niyetle hazırlanan özel mumlar çok yakında. Şimdiden sipariş ve bilgi için bize yazabilirsin.</div>
        <button class="mg-satinal siparis" type="button">Sipariş / Bilgi Al ✦</button>`;
      kart.querySelector(".mg-satinal").addEventListener("click", () => window.open(siparisWA({ ad: "Işık Mumları" }, bolum), "_blank", "noopener,noreferrer"));
      grid.appendChild(kart);
    }
  }

  /* ---------- YÖNETİCİ paneli ---------- */
  async function fotoYukle(file) {
    const c = sb();
    if (!c) throw new Error("Bağlantı yok");
    const temiz = (file.name || "foto.jpg").replace(/[^a-zA-Z0-9.]/g, "_");
    const yol = AKTIF_BOLUM + "/" + Date.now() + "_" + temiz;
    const { error } = await c.storage.from(BUCKET).upload(yol, file, { upsert: false, contentType: file.type || "image/jpeg" });
    if (error) throw error;
    return c.storage.from(BUCKET).getPublicUrl(yol).data.publicUrl;
  }

  function formTemizle() {
    duzenId = null; seciliFotoUrl = "";
    ["mu-ad", "mu-aciklama", "mu-fiyat"].forEach(id => { if ($("#" + id)) $("#" + id).value = ""; });
    const f = $("#mu-foto"); if (f) f.value = "";
    fotoOnizle();
    const btn = $("#mu-ekle"); if (btn) btn.textContent = "Ürünü Ekle";
    const ipt = $("#mu-iptal"); if (ipt) ipt.style.display = "none";
  }
  function fotoOnizle() {
    const on = $("#mu-onizle"); if (!on) return;
    if (gorselli(seciliFotoUrl)) { on.innerHTML = `<img src="${esc(seciliFotoUrl)}" alt="" /><button type="button" class="mu-foto-kaldir">Fotoğrafı kaldır ✕</button>`; on.style.display = "block"; const k = on.querySelector(".mu-foto-kaldir"); if (k) k.addEventListener("click", () => { seciliFotoUrl = ""; const f = $("#mu-foto"); if (f) f.value = ""; fotoOnizle(); }); }
    else { on.innerHTML = ""; on.style.display = "none"; }
  }

  async function fotoSecildi(e) {
    const file = e.target.files && e.target.files[0]; if (!file) return;
    const bil = $("#mu-bilgi"); bil.textContent = "Fotoğraf yükleniyor…"; bil.style.color = "var(--muted)";
    try { seciliFotoUrl = await fotoYukle(file); fotoOnizle(); bil.textContent = "Fotoğraf hazır ✓"; bil.style.color = "var(--basari,#4caf7d)"; }
    catch (err) { bil.textContent = "Foto yüklenemedi: " + ((err && err.message) || ""); bil.style.color = "var(--hata,#e06a6a)"; }
  }

  async function kaydet() {
    const bil = $("#mu-bilgi");
    const ad = ($("#mu-ad").value || "").trim();
    if (!ad) { bil.textContent = "Ürün adı gerekli."; bil.style.color = "var(--uyari,#c9a24a)"; return; }
    const satir = {
      bolum: AKTIF_BOLUM, ad,
      aciklama: ($("#mu-aciklama").value || "").trim() || null,
      fiyat: ($("#mu-fiyat").value || "").trim() || null,
      gorsel: seciliFotoUrl || null,
      wa_no: WA_VARSAYILAN[AKTIF_BOLUM],
      aktif: true
    };
    if (duzenId) satir.id = duzenId; else satir.sira = Date.now() % 1000000000;
    bil.textContent = "Kaydediliyor…"; bil.style.color = "var(--muted)";
    try {
      const c = sb();
      const { error } = await c.from("magaza_urun").upsert(satir);
      if (error) throw error;
      cache[AKTIF_BOLUM] = null; await yukle(AKTIF_BOLUM);
      bil.textContent = duzenId ? "✅ Güncellendi" : "✅ Eklendi"; bil.style.color = "var(--basari,#4caf7d)";
      formTemizle(); listeCiz();
    } catch (e) { bil.textContent = "Hata: " + ((e && e.message) || ""); bil.style.color = "var(--hata,#e06a6a)"; }
  }

  async function sil(id) {
    const c = sb(); if (!c) return;
    try { await c.from("magaza_urun").delete().eq("id", id); cache[AKTIF_BOLUM] = null; await yukle(AKTIF_BOLUM); listeCiz(); }
    catch (e) {}
  }
  function duzenle(u) {
    duzenId = u.id; seciliFotoUrl = u.gorsel || "";
    $("#mu-ad").value = u.ad || ""; $("#mu-aciklama").value = u.aciklama || ""; $("#mu-fiyat").value = u.fiyat || "";
    fotoOnizle();
    const btn = $("#mu-ekle"); if (btn) btn.textContent = "Değişikliği Kaydet";
    const ipt = $("#mu-iptal"); if (ipt) ipt.style.display = "inline-block";
    const bolum = $("#urun-yonetici"); if (bolum) bolum.scrollIntoView({ block: "center" });
  }

  function listeCiz() {
    const liste = $("#mu-liste"); if (!liste) return;
    const urunler = cache[AKTIF_BOLUM] || [];
    if (!urunler.length) { liste.innerHTML = `<p class="muted small">Henüz mum yok. Yukarıdan ekle → mağazada anında görünür.</p>`; return; }
    liste.innerHTML = "";
    urunler.forEach(u => {
      const s = document.createElement("div");
      s.className = "mu-satir";
      s.innerHTML = `
        <div class="mu-satir-foto">${gorselli(u.gorsel) ? `<img src="${esc(u.gorsel)}" alt="" />` : "🕯️"}</div>
        <div class="mu-satir-ic"><b>${esc(u.ad)}</b><span class="muted small">${esc(u.fiyat || "fiyat yok")}</span></div>
        <button class="mu-duzenle" type="button">Düzenle</button>
        <button class="mu-sil" type="button" aria-label="Sil">✕</button>`;
      s.querySelector(".mu-duzenle").addEventListener("click", () => duzenle(u));
      s.querySelector(".mu-sil").addEventListener("click", () => { if (confirm(`"${u.ad}" silinsin mi?`)) sil(u.id); });
      liste.appendChild(s);
    });
  }

  async function yoneticiCiz() {
    const bolum = $("#urun-yonetici"); if (!bolum) return;
    if (!moderatorMu()) { bolum.hidden = true; return; }
    bolum.hidden = false;
    await yukle(AKTIF_BOLUM);
    listeCiz();
  }

  function baglan() {
    const ekle = $("#mu-ekle"); if (ekle) ekle.addEventListener("click", kaydet);
    const foto = $("#mu-foto"); if (foto) foto.addEventListener("change", fotoSecildi);
    const iptal = $("#mu-iptal"); if (iptal) iptal.addEventListener("click", formTemizle);
    yoneticiCiz();
    [2500, 5000, 9000].forEach(ms => setTimeout(yoneticiCiz, ms));
    window.addEventListener("isigini-oturum-degisti", () => setTimeout(yoneticiCiz, 1500));
  }
  document.addEventListener("DOMContentLoaded", baglan);

  return { magazaKartlari, yukle, yoneticiCiz };
})();
