/* ============================================================
   siteayar.js — Ödeme & İletişim Ayarları 💳
   ------------------------------------------------------------
   IBAN, hesap adı ve WhatsApp numaraları Supabase `site_ayar`
   tablosundan okunur; yönetici panelinden değiştirilebilir.
   Diğer modüller: SiteAyar.get("iban", varsayilan)
   Global: window.SiteAyar
   ============================================================ */

const SiteAyar = window.SiteAyar = (() => {
  const $ = s => document.querySelector(s);
  const VARSAYILAN = {
    iban: "TR77 0015 7000 0000 0203 2018 98",
    iban_ad: "Hülya Işıkoğlu",
    wa_dijital: "905345276192",
    wa_mum: "905300421259"
  };
  let cache = Object.assign({}, VARSAYILAN);

  function sb() { try { return window.Bulut && Bulut.client ? Bulut.client() : null; } catch (e) { return null; } }
  function moderatorMu() {
    try { const em = (window.Bulut && Bulut.durum ? (Bulut.durum().email || "") : "").toLowerCase(); if (em === "hulia8111@gmail.com") return true; } catch (e) {}
    try { return !!(window.ToplulukSosyal && ToplulukSosyal.moderatorMuCached && ToplulukSosyal.moderatorMuCached()); } catch (e) { return false; }
  }

  function get(k, def) {
    const v = cache[k];
    return (v != null && v !== "") ? v : (def != null ? def : (VARSAYILAN[k] || ""));
  }

  async function yukle() {
    const c = sb(); if (!c) return;
    try {
      const { data } = await c.from("site_ayar").select("anahtar,deger");
      (data || []).forEach(r => { if (r.deger != null) cache[r.anahtar] = r.deger; });
    } catch (e) { /* varsayılan kalır */ }
    panelDoldur();
  }

  /* ---------- yönetici paneli ---------- */
  function panelDoldur() {
    const mod = moderatorMu();
    const oa = $("#odeme-ayar"); if (oa) oa.hidden = !mod;
    const tl = $("#tas-link-yonetici"); if (tl) tl.hidden = !mod;
    if (!mod) return;
    const set = (id, k) => { const el = $("#" + id); if (el && document.activeElement !== el) el.value = get(k); };
    set("oa-iban", "iban"); set("oa-ad", "iban_ad"); set("oa-wa-dijital", "wa_dijital"); set("oa-wa-mum", "wa_mum");
    tasLinkCiz();
  }

  /* ---------- Doğal Taşlar — link düzenleme ---------- */
  function taslar() {
    try {
      const kats = (window.Magaza && Magaza.kategoriler) ? Magaza.kategoriler() : [];
      const ra = kats.find(k => k.id === "rituel-araclar");
      return (ra && ra.urunler) ? ra.urunler.filter(u => u.id) : [];
    } catch (e) { return []; }
  }
  function tasLinkCiz() {
    const liste = $("#tas-link-liste"); if (!liste) return;
    const ts = taslar();
    if (!ts.length) { liste.innerHTML = `<p class="muted small">Taş bulunamadı.</p>`; return; }
    liste.innerHTML = "";
    ts.forEach(t => {
      const sar = document.createElement("div");
      sar.className = "tl-satir";
      const mevcut = get("tas_link_" + t.id, t.link || "");
      sar.innerHTML = `<label class="ue-label">${(t.ikon || "💎") + " " + escHtml(t.ad)}</label>
        <input type="text" id="tl-${escAttr(t.id)}" value="${escAttr(mevcut)}" placeholder="https://www.shopier.com/..." spellcheck="false" />`;
      liste.appendChild(sar);
    });
  }
  function escHtml(s) { return String(s == null ? "" : s).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c])); }
  function escAttr(s) { return String(s == null ? "" : s).replace(/"/g, "&quot;"); }
  async function tasLinkKaydet() {
    const bil = $("#tl-bilgi"); const c = sb(); if (!c) return;
    const ts = taslar();
    const satirlar = ts.map(t => ({ anahtar: "tas_link_" + t.id, deger: (($("#tl-" + t.id) || {}).value || "").trim(), guncelleme: new Date().toISOString() }));
    bil.textContent = "Kaydediliyor…"; bil.style.color = "var(--muted)";
    try {
      const { error } = await c.from("site_ayar").upsert(satirlar);
      if (error) throw error;
      satirlar.forEach(r => cache[r.anahtar] = r.deger);
      bil.textContent = "✅ Taş linkleri kaydedildi"; bil.style.color = "var(--basari,#4caf7d)";
    } catch (e) { bil.textContent = "Hata: " + ((e && e.message) || ""); bil.style.color = "var(--hata,#e06a6a)"; }
  }

  function temizNo(s) { return String(s || "").replace(/[^0-9]/g, ""); }

  async function kaydet() {
    const bil = $("#oa-bilgi");
    const c = sb();
    if (!c) { bil.textContent = "Bağlantı yok"; return; }
    const satirlar = [
      { anahtar: "iban", deger: ($("#oa-iban").value || "").trim() },
      { anahtar: "iban_ad", deger: ($("#oa-ad").value || "").trim() },
      { anahtar: "wa_dijital", deger: temizNo($("#oa-wa-dijital").value) },
      { anahtar: "wa_mum", deger: temizNo($("#oa-wa-mum").value) }
    ].map(r => Object.assign(r, { guncelleme: new Date().toISOString() }));
    bil.textContent = "Kaydediliyor…"; bil.style.color = "var(--muted)";
    try {
      const { error } = await c.from("site_ayar").upsert(satirlar);
      if (error) throw error;
      satirlar.forEach(r => cache[r.anahtar] = r.deger);
      bil.textContent = "✅ Ödeme & iletişim bilgileri kaydedildi"; bil.style.color = "var(--basari,#4caf7d)";
    } catch (e) { bil.textContent = "Hata: " + ((e && e.message) || ""); bil.style.color = "var(--hata,#e06a6a)"; }
  }

  function baglan() {
    const btn = $("#oa-kaydet"); if (btn) btn.addEventListener("click", kaydet);
    const tlBtn = $("#tl-kaydet"); if (tlBtn) tlBtn.addEventListener("click", tasLinkKaydet);
    panelDoldur();
    yukle();
    setTimeout(yukle, 2500);
    [4000, 8000].forEach(ms => setTimeout(panelDoldur, ms));
    window.addEventListener("isigini-oturum-degisti", () => { setTimeout(yukle, 1200); });
  }
  document.addEventListener("DOMContentLoaded", baglan);

  return { get, yukle };
})();
