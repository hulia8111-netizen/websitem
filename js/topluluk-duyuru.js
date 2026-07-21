/* ============================================================
   topluluk-duyuru.js — Yönetici Duyuruları 📢
   Topluluk overlay'ine "📢 Duyurular" sekmesi ekler.
   Herkes aktif duyuruları görür; yalnız moderatör yeni duyuru yayınlar
   (isteğe bağlı: tüm abonelere Web Push — duyuru-bildirim Edge Function).
   Global: window.ToplulukDuyuru
   ============================================================ */
const ToplulukDuyuru = window.ToplulukDuyuru = (() => {
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  function sb() { try { return window.Bulut && Bulut.client ? Bulut.client() : null; } catch (e) { return null; } }
  function uid() { try { return window.Bulut && Bulut.kullaniciId ? Bulut.kullaniciId() : null; } catch (e) { return null; } }
  function moderatorMu() { return !!(window.ToplulukSosyal && ToplulukSosyal.moderatorMuCached && ToplulukSosyal.moderatorMuCached()); }

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
  async function yayinla(baslik, metin, bildir) {
    const c = sb(); if (!c) return { ok: false, mesaj: "Bağlantı yok" };
    if (!baslik.trim() || !metin.trim()) return { ok: false, mesaj: "Başlık ve metin gerekli" };
    try {
      const { error } = await c.from("topluluk_duyuru").insert({ baslik: baslik.trim(), metin: metin.trim(), bildir: !!bildir });
      if (error) return { ok: false, mesaj: error.message };
      return { ok: true };
    } catch (e) { return { ok: false, mesaj: String(e) }; }
  }
  async function aktifDegis(id, aktif) {
    const c = sb(); if (!c) return;
    try { await c.from("topluluk_duyuru").update({ aktif }).eq("id", id); } catch (e) {}
  }
  async function sil(id) {
    const c = sb(); if (!c) return;
    try { await c.from("topluluk_duyuru").delete().eq("id", id); } catch (e) {}
  }

  /* En son aktif duyuru — Işık sekmesindeki mini banner için */
  async function sonDuyuru() {
    const liste = await yukle();
    return (liste || []).filter(d => d.aktif)[0] || null;
  }

  function kart(d, mod) {
    return `<div class="td-kart${d.aktif ? "" : " pasif"}">
      <div class="td-ust">
        <span class="td-ikon">📢</span>
        <b class="td-baslik">${esc(d.baslik)}</b>
        <span class="td-zaman">${zamanFark(d.olusturma)}</span>
      </div>
      <p class="td-metin">${esc(d.metin).replace(/\n/g, "<br>")}</p>
      ${mod ? `<div class="td-mod">
        <button class="td-mini" data-td-act="${d.aktif ? "gizle" : "goster"}" data-id="${d.id}">${d.aktif ? "🙈 Gizle" : "👁️ Göster"}</button>
        <button class="td-mini td-sil" data-td-act="sil" data-id="${d.id}">🗑️ Sil</button>
      </div>` : ""}
    </div>`;
  }

  async function cizDuyurular(govde) {
    govde.innerHTML = `<div class="tp-bilgi">📢 Duyurular yükleniyor…</div>`;
    const mod = moderatorMu();
    const liste = await yukle();
    const gorunur = mod ? liste : liste.filter(d => d.aktif);

    let html = "";
    if (mod) {
      html += `<div class="td-yeni">
        <div class="td-yeni-bas">🛡️ Yeni Duyuru <span class="muted small">(yalnız sana görünür)</span></div>
        <input id="td-baslik" class="td-inp" placeholder="Duyuru başlığı" maxlength="80"/>
        <textarea id="td-metin" class="td-inp" placeholder="Duyuru metni… (topluluğa iletmek istediğin mesaj)" maxlength="600" rows="3"></textarea>
        <label class="td-bildir"><input type="checkbox" id="td-bildir"/> <span>Kullanıcılara bildirim gönder 🔔</span></label>
        <button class="btn" id="td-yayinla">📢 Duyuru Yayınla</button>
        <p id="td-bilgi" class="td-durum"></p>
      </div>`;
    }
    html += `<div class="td-liste">` +
      (gorunur.length ? gorunur.map(d => kart(d, mod)).join("")
        : `<div class="ts-bos">📢 Henüz bir duyuru yok.${mod ? " İlk duyurunu yukarıdan yayınla ✨" : " Yakında burada olacak 🌙"}</div>`) +
      `</div>`;
    govde.innerHTML = html;

    if (mod) {
      const btn = govde.querySelector("#td-yayinla");
      const bil = govde.querySelector("#td-bilgi");
      if (btn) btn.addEventListener("click", async () => {
        const baslik = (govde.querySelector("#td-baslik") || {}).value || "";
        const metin = (govde.querySelector("#td-metin") || {}).value || "";
        const bildir = !!(govde.querySelector("#td-bildir") || {}).checked;
        btn.disabled = true; bil.textContent = "Yayınlanıyor…"; bil.style.color = "var(--metin-faint)";
        const r = await yayinla(baslik, metin, bildir);
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

  return { cizDuyurular, yukle, sonDuyuru };
})();
