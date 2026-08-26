/* ============================================================
   ilhamyonet.js — Self-servis İlham Cümleleri Yönetimi ✨
   ------------------------------------------------------------
   Yönetici panelinden ilham cümlesi ekle / sil / düzenle.
   Supabase `ilham_cumle` tablosundan yüklenip uygulamadaki 542
   temel cümlenin ÜSTÜNE eklenir → window.ACILIS_CUMLELERI genişler
   (splash, Günün İlhamı, Evren bildirimleri hep bunu kullanır).
   Global: window.IlhamYonet
   ============================================================ */

const IlhamYonet = window.IlhamYonet = (() => {
  const $ = s => document.querySelector(s);
  let TEMEL = null;          // hardcoded 542 cümlenin anlık kopyası
  let dbCumleler = [];       // panelde yönetilen cümleler

  function sb() { try { return window.Bulut && Bulut.client ? Bulut.client() : null; } catch (e) { return null; } }
  function moderatorMu() {
    try { const em = (window.Bulut && Bulut.durum ? (Bulut.durum().email || "") : "").toLowerCase(); if (em === "hulia8111@gmail.com") return true; } catch (e) {}
    try { return !!(window.ToplulukSosyal && ToplulukSosyal.moderatorMuCached && ToplulukSosyal.moderatorMuCached()); } catch (e) { return false; }
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

  /* ---------- yükle + havuza kat ---------- */
  async function yukle() {
    if (TEMEL === null) TEMEL = (window.ACILIS_CUMLELERI || []).slice();
    const c = sb();
    if (c) {
      try {
        const { data } = await c.from("ilham_cumle").select("id,metin,sira").eq("aktif", true).order("sira", { ascending: true });
        dbCumleler = data || [];
      } catch (e) { /* sessiz → yalnız temel */ }
    }
    // havuzu yeniden kur: temel + db (yinelenmeyen)
    const set = new Set(TEMEL);
    const ek = dbCumleler.map(r => r.metin).filter(m => m && !set.has(m));
    window.ACILIS_CUMLELERI = TEMEL.concat(ek);
    listeCiz(); paneliGoster();
    return dbCumleler.length;
  }

  /* ---------- yönetici işlemleri ---------- */
  async function ekle() {
    const bil = $("#ic-bilgi"), ta = $("#ic-yeni");
    const satirlar = (ta.value || "").split("\n").map(s => s.trim()).filter(Boolean);
    if (!satirlar.length) { bil.textContent = "En az bir cümle yaz."; bil.style.color = "var(--uyari,#c9a24a)"; return; }
    const c = sb(); if (!c) return;
    const t0 = Date.now();
    const kayitlar = satirlar.map((m, i) => ({ metin: m, sira: t0 + i, aktif: true }));
    bil.textContent = "Ekleniyor…"; bil.style.color = "var(--muted)";
    try {
      const { error } = await c.from("ilham_cumle").insert(kayitlar);
      if (error) throw error;
      ta.value = "";
      await yukle();
      bil.textContent = `✅ ${satirlar.length} cümle eklendi — uygulamaya düştü ✨`; bil.style.color = "var(--basari,#4caf7d)";
    } catch (e) { bil.textContent = "Hata: " + ((e && e.message) || ""); bil.style.color = "var(--hata,#e06a6a)"; }
  }
  async function guncelle(id, metin) {
    const c = sb(); if (!c) return false;
    try { const { error } = await c.from("ilham_cumle").update({ metin }).eq("id", id); if (error) throw error; await yukle(); return true; }
    catch (e) { return false; }
  }
  async function sil(id) {
    const c = sb(); if (!c) return;
    try { await c.from("ilham_cumle").delete().eq("id", id); await yukle(); } catch (e) {}
  }

  /* ---------- panel ---------- */
  function paneliGoster() {
    const bolum = $("#ilham-yonetici"); if (!bolum) return;
    bolum.hidden = !moderatorMu();
  }
  function listeCiz() {
    const liste = $("#ic-liste"); if (!liste) return;
    if (!dbCumleler.length) { liste.innerHTML = `<p class="muted small">Henüz eklediğin cümle yok. Yukarıdan ekle (her satır bir cümle).</p>`; return; }
    liste.innerHTML = "";
    dbCumleler.forEach(r => {
      const row = document.createElement("div");
      row.className = "ic-satir";
      row.innerHTML = `<input type="text" class="ic-metin" value="${esc(r.metin)}" />
        <button class="ic-kaydet" type="button" title="Kaydet">💾</button>
        <button class="ic-sil" type="button" aria-label="Sil">✕</button>`;
      const inp = row.querySelector(".ic-metin");
      row.querySelector(".ic-kaydet").addEventListener("click", async () => {
        const yeni = (inp.value || "").trim(); if (!yeni) return;
        const ok = await guncelle(r.id, yeni);
        const bil = $("#ic-bilgi"); if (bil) { bil.textContent = ok ? "✅ Güncellendi" : "⚠️ Güncellenemedi"; bil.style.color = ok ? "var(--basari,#4caf7d)" : "var(--hata,#e06a6a)"; }
      });
      row.querySelector(".ic-sil").addEventListener("click", () => { if (confirm("Bu cümle silinsin mi?")) sil(r.id); });
      liste.appendChild(row);
    });
  }

  function baglan() {
    const ekleBtn = $("#ic-ekle"); if (ekleBtn) ekleBtn.addEventListener("click", ekle);
    paneliGoster();
    yukle();
    setTimeout(yukle, 2500);
    [5000, 9000].forEach(ms => setTimeout(paneliGoster, ms));
    window.addEventListener("isigini-oturum-degisti", () => { setTimeout(yukle, 1500); });
  }
  document.addEventListener("DOMContentLoaded", baglan);

  return { yukle };
})();
