/* ============================================================
   topluluk-duyuru.js — Yönetici Duyuruları 📢 (+ okundu takibi + RSVP)
   Topluluk overlay'ine "📢 Duyurular" sekmesi ekler.
   - Herkes aktif duyuruları görür; yalnız moderatör yeni duyuru yayınlar.
   - OKUNDU takibi: kullanıcı duyuruyu görünce duyuru_okundu'ya işlenir
     (yeni duyuru rozeti + moderatöre kaç kişi okudu bilgisi).
   - ETKİNLİK: moderatör bir duyuruyu "etkinlik" işaretlerse kullanıcılar
     Katılıyorum / Katılamıyorum / Sonra seçebilir (duyuru_katilim). Kullanıcı
     yalnız KENDİ durumunu değiştirir; moderatör sayıları görür.
   Global: window.ToplulukDuyuru
   ============================================================ */
const ToplulukDuyuru = window.ToplulukDuyuru = (() => {
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  function sb() { try { return window.Bulut && Bulut.client ? Bulut.client() : null; } catch (e) { return null; } }
  function uid() { try { return window.Bulut && Bulut.kullaniciId ? Bulut.kullaniciId() : null; } catch (e) { return null; } }
  function girisli() { return !!uid(); }
  function moderatorMu() { return !!(window.ToplulukSosyal && ToplulukSosyal.moderatorMuCached && ToplulukSosyal.moderatorMuCached()); }
  // Okundu için kimlik: girişliyse user_id, misafirse cihaz kimliği
  function kimId() { return uid() || ("c:" + (window.PushToken && PushToken.cihazId ? PushToken.cihazId() : "anon")); }

  const DURUM_AD = { katiliyorum: "Katılıyorum", katilamiyorum: "Katılamıyorum", sonra: "Daha Sonra" };
  const DURUM_IKON = { katiliyorum: "✅", katilamiyorum: "❌", sonra: "🕐" };

  function zamanFark(iso) {
    const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return "az önce";
    if (s < 3600) return Math.floor(s / 60) + " dk";
    if (s < 86400) return Math.floor(s / 3600) + " sa";
    if (s < 604800) return Math.floor(s / 86400) + " gün";
    return new Date(iso).toLocaleDateString("tr-TR");
  }

  async function yukle() {
    const c = sb(); if (!c) return [];
    try {
      const { data } = await c.from("topluluk_duyuru").select("*").order("olusturma", { ascending: false }).limit(50);
      return data || [];
    } catch (e) { return []; }
  }
  async function yayinla(baslik, metin, bildir, etkinlik) {
    const c = sb(); if (!c) return { ok: false, mesaj: "Bağlantı yok" };
    if (!baslik.trim() || !metin.trim()) return { ok: false, mesaj: "Başlık ve metin gerekli" };
    try {
      const { error } = await c.from("topluluk_duyuru").insert({ baslik: baslik.trim(), metin: metin.trim(), bildir: !!bildir, etkinlik: !!etkinlik });
      if (error) return { ok: false, mesaj: error.message };
      return { ok: true };
    } catch (e) { return { ok: false, mesaj: String(e) }; }
  }
  async function aktifDegis(id, aktif) { const c = sb(); if (!c) return; try { await c.from("topluluk_duyuru").update({ aktif }).eq("id", id); } catch (e) {} }
  async function sil(id) { const c = sb(); if (!c) return; try { await c.from("topluluk_duyuru").delete().eq("id", id); } catch (e) {} }

  /* ---------- okundu ---------- */
  async function okunanlar() {
    const c = sb(); if (!c) return new Set();
    try {
      const { data } = await c.from("duyuru_okundu").select("duyuru_id").eq("kim", kimId());
      return new Set((data || []).map(r => r.duyuru_id));
    } catch (e) { return new Set(); }
  }
  async function okunduIsaretle(idler) {
    const c = sb(); if (!c || !idler.length) return;
    const km = kimId();
    const satirlar = idler.map(id => ({ duyuru_id: id, kim: km }));
    try { await c.from("duyuru_okundu").upsert(satirlar, { onConflict: "duyuru_id,kim" }); } catch (e) {}
  }

  /* ---------- katılım (RSVP) ---------- */
  async function katilimlarim() {
    const c = sb(); if (!c || !girisli()) return {};
    try {
      const { data } = await c.from("duyuru_katilim").select("duyuru_id,durum").eq("user_id", uid());
      const m = {}; (data || []).forEach(r => { m[r.duyuru_id] = r.durum; }); return m;
    } catch (e) { return {}; }
  }
  async function katilimSayilari() {
    const c = sb(); if (!c) return {};
    try {
      const { data } = await c.from("duyuru_katilim_ozet").select("*");
      const m = {}; (data || []).forEach(r => { m[r.duyuru_id] = r; }); return m;
    } catch (e) { return {}; }
  }
  async function katilimKaydet(duyuruId, durum) {
    const c = sb(); if (!c) return { ok: false };
    if (!girisli()) return { ok: false, giris: true };
    let ad = null; try { ad = window.Profil && Profil.isim ? Profil.isim() : null; } catch (e) {}
    try {
      const { error } = await c.from("duyuru_katilim").upsert(
        { duyuru_id: duyuruId, user_id: uid(), ad, durum, guncelleme: new Date().toISOString() },
        { onConflict: "duyuru_id,user_id" });
      return { ok: !error };
    } catch (e) { return { ok: false }; }
  }

  function rsvpHtml(d, secim, sayim, mod) {
    if (!d.etkinlik) return "";
    const btn = (k) => `<button class="td-rsvp${secim === k ? " secili" : ""}" data-rsvp="${k}" data-id="${d.id}">${DURUM_IKON[k]} ${DURUM_AD[k]}</button>`;
    let modSayim = "";
    if (mod && sayim) modSayim = `<div class="td-rsvp-sayim">✅ ${sayim.katiliyorum || 0} · ❌ ${sayim.katilamiyorum || 0} · 🕐 ${sayim.sonra || 0}</div>`;
    return `<div class="td-rsvp-bar">${btn("katiliyorum")}${btn("katilamiyorum")}${btn("sonra")}</div>${modSayim}`;
  }

  function kart(d, mod, okundu, secim, sayim) {
    const yeni = !okundu ? `<span class="td-yeni-rozet">yeni</span>` : "";
    return `<div class="td-kart${d.aktif ? "" : " pasif"}${d.etkinlik ? " etkinlik" : ""}" data-duyuru="${d.id}">
      <div class="td-ust">
        <span class="td-ikon">${d.etkinlik ? "🗓️" : "📢"}</span>
        <b class="td-baslik">${esc(d.baslik)}</b>${yeni}
        <span class="td-zaman">${zamanFark(d.olusturma)}</span>
      </div>
      <p class="td-metin">${esc(d.metin).replace(/\n/g, "<br>")}</p>
      ${rsvpHtml(d, secim, sayim, mod)}
      ${mod ? `<div class="td-mod">
        <button class="td-mini" data-td-act="${d.aktif ? "gizle" : "goster"}" data-id="${d.id}">${d.aktif ? "🙈 Gizle" : "👁️ Göster"}</button>
        <button class="td-mini td-sil" data-td-act="sil" data-id="${d.id}">🗑️ Sil</button>
      </div>` : ""}
    </div>`;
  }

  async function cizDuyurular(govde) {
    govde.innerHTML = `<div class="tp-bilgi">📢 Duyurular yükleniyor…</div>`;
    const mod = moderatorMu();
    const [liste, okSet, secimler] = await Promise.all([yukle(), okunanlar(), katilimlarim()]);
    const sayimlar = mod ? await katilimSayilari() : {};
    const gorunur = mod ? liste : liste.filter(d => d.aktif);

    let html = "";
    if (mod) {
      html += `<div class="td-yeni">
        <div class="td-yeni-bas">🛡️ Yeni Duyuru <span class="muted small">(yalnız sana görünür)</span></div>
        <input id="td-baslik" class="td-inp" placeholder="Duyuru başlığı" maxlength="80"/>
        <textarea id="td-metin" class="td-inp" placeholder="Duyuru metni… (topluluğa iletmek istediğin mesaj)" maxlength="600" rows="3"></textarea>
        <label class="td-bildir"><input type="checkbox" id="td-etkinlik"/> <span>Etkinlik (Katılıyorum/Katılamıyorum/Sonra) 🗓️</span></label>
        <label class="td-bildir"><input type="checkbox" id="td-bildir"/> <span>Kullanıcılara bildirim gönder 🔔</span></label>
        <button class="btn" id="td-yayinla">📢 Duyuru Yayınla</button>
        <p id="td-bilgi" class="td-durum"></p>
      </div>`;
    }
    html += `<div class="td-liste">` +
      (gorunur.length ? gorunur.map(d => kart(d, mod, okSet.has(d.id), secimler[d.id], sayimlar[d.id])).join("")
        : `<div class="ts-bos">📢 Henüz bir duyuru yok.${mod ? " İlk duyurunu yukarıdan yayınla ✨" : " Yakında burada olacak 🌙"}</div>`) +
      `</div>`;
    govde.innerHTML = html;

    // Görünen aktif duyuruları OKUNDU işaretle (rozet sadece ilk görüşte çıksın)
    const okunacak = gorunur.filter(d => d.aktif && !okSet.has(d.id)).map(d => d.id);
    if (okunacak.length) okunduIsaretle(okunacak);

    // RSVP butonları
    govde.querySelectorAll(".td-rsvp").forEach(b => b.addEventListener("click", async () => {
      const durum = b.dataset.rsvp, id = Number(b.dataset.id);
      if (!girisli()) { b.closest(".td-rsvp-bar").insertAdjacentHTML("afterend", `<p class="td-durum" style="color:var(--uyari)">Katılım için giriş yap 🙏</p>`); return; }
      const bar = b.closest(".td-rsvp-bar");
      bar.querySelectorAll(".td-rsvp").forEach(x => x.classList.toggle("secili", x === b));
      const r = await katilimKaydet(id, durum);
      if (!r.ok && r.giris) bar.querySelectorAll(".td-rsvp").forEach(x => x.classList.remove("secili"));
      else if (mod) { const s = await katilimSayilari(); const kart = bar.closest(".td-kart"); const sc = kart.querySelector(".td-rsvp-sayim"); const v = s[id]; if (sc && v) sc.textContent = `✅ ${v.katiliyorum || 0} · ❌ ${v.katilamiyorum || 0} · 🕐 ${v.sonra || 0}`; }
    }));

    if (mod) {
      const btn = govde.querySelector("#td-yayinla");
      const bil = govde.querySelector("#td-bilgi");
      if (btn) btn.addEventListener("click", async () => {
        const baslik = (govde.querySelector("#td-baslik") || {}).value || "";
        const metin = (govde.querySelector("#td-metin") || {}).value || "";
        const bildir = !!(govde.querySelector("#td-bildir") || {}).checked;
        const etkinlik = !!(govde.querySelector("#td-etkinlik") || {}).checked;
        btn.disabled = true; bil.textContent = "Yayınlanıyor…"; bil.style.color = "var(--metin-faint)";
        const r = await yayinla(baslik, metin, bildir, etkinlik);
        btn.disabled = false;
        if (r.ok) { bil.textContent = "✅ Duyuru yayınlandı" + (bildir ? " · bildirim gönderildi 🔔" : ""); bil.style.color = "var(--basari)"; await cizDuyurular(govde); }
        else { bil.textContent = "⚠️ " + (r.mesaj || "Yayınlanamadı"); bil.style.color = "var(--uyari)"; }
      });
      govde.querySelectorAll("[data-td-act]").forEach(b => b.addEventListener("click", async () => {
        const act = b.dataset.tdAct, id = Number(b.dataset.id);
        if (act === "sil") { if (!confirm("Bu duyuru kalıcı silinsin mi?")) return; await sil(id); }
        else await aktifDegis(id, act === "goster");
        await cizDuyurular(govde);
      }));
    }
  }

  /* En son aktif duyuru — Işık sekmesindeki mini banner için */
  async function sonDuyuru() {
    const liste = await yukle();
    return (liste || []).filter(d => d.aktif)[0] || null;
  }

  /* Bildirime tıklayınca / dışarıdan: Topluluk → Duyurular sekmesini aç */
  function ac() {
    try {
      if (window.Topluluk && Topluluk.ac) Topluluk.ac();
      setTimeout(() => { const b = document.querySelector('.tp-sekme[data-sek="duyuru"]'); if (b) b.click(); }, 350);
    } catch (e) {}
  }

  return { cizDuyurular, yukle, sonDuyuru, ac };
})();
