/* ============================================================
   topluluk-sosyal.js — Topluluk Faz 2 (UGC) 📝
   Paylaşımlar / Yorumlar / Tepkiler / Takip / Raporla / Engelle + Moderasyon.
   KURAL: paylaşım ve yorumlar moderatör ONAYLAMADAN görünmez (pre-moderation).
   Topluluk overlay'ine "📝 Paylaşımlar" ve (moderatöre) "🛡️ Moderasyon" sekmeleri ekler.
   Global: window.ToplulukSosyal
   ============================================================ */
const ToplulukSosyal = window.ToplulukSosyal = (() => {
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  function sb() { try { return window.Bulut && Bulut.client ? Bulut.client() : null; } catch (e) { return null; } }
  function uid() { try { return window.Bulut && Bulut.kullaniciId ? Bulut.kullaniciId() : null; } catch (e) { return null; } }
  function benimAd() { const p = Store.get("profil", {}) || {}; return (p.isim || "").trim() || "İsimsiz Işık"; }

  const TIP = { paylasim: { ad: "Düşünce", ikon: "💭" }, sukran: { ad: "Şükran", ikon: "🙏" }, basari: { ad: "Başarı", ikon: "🏆" } };
  const TEPKI = [["tebrikler", "❤️", "Tebrikler"], ["ilham", "🌿", "İlham Oldun"], ["yaninda", "✨", "Yanındayım"]];

  let _moderator = false, _hazir = false;
  let _engel = new Set(), _takip = new Set();
  let _akis = [], _filtre = "tumu", _acik = {};   // _acik[gonderiId] = yorum dizisi (açık ise)

  function zamanFark(iso) {
    const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return "az önce";
    if (s < 3600) return Math.floor(s / 60) + " dk";
    if (s < 86400) return Math.floor(s / 3600) + " sa";
    if (s < 604800) return Math.floor(s / 86400) + " gün";
    return new Date(iso).toLocaleDateString("tr-TR");
  }

  /* ---------- Veri katmanı ---------- */
  async function moderatorMuAsync() {
    const c = sb(), id = uid(); if (!c || !id) return false;
    try { const { data } = await c.from("topluluk_moderator").select("user_id").eq("user_id", id).maybeSingle(); return !!data; }
    catch (e) { return false; }
  }
  async function listeyiYukle(tablo, kolon) {
    const c = sb(), id = uid(); if (!c || !id) return new Set();
    try { const { data } = await c.from(tablo).select(kolon).eq("user_id", id); return new Set((data || []).map(r => r[kolon])); }
    catch (e) { return new Set(); }
  }
  async function hazirla() {
    if (!uid()) { _moderator = false; _hazir = true; return; }
    [_moderator, _engel, _takip] = await Promise.all([
      moderatorMuAsync(),
      listeyiYukle("topluluk_engel", "engellenen_id"),
      listeyiYukle("topluluk_takip", "takip_edilen_id"),
    ]);
    _hazir = true;
  }
  function moderatorMuCached() { return _moderator; }

  async function akisYukle() {
    const c = sb(); if (!c) return [];
    try {
      const { data: gon } = await c.from("topluluk_gonderi").select("*").eq("durum", "onayli").order("olusturma", { ascending: false }).limit(50);
      const liste = (gon || []).filter(g => !_engel.has(g.user_id));
      const ids = liste.map(g => g.id);
      let tepki = [], yorumlar = [];
      if (ids.length) {
        const [tp, yr] = await Promise.all([
          c.from("topluluk_tepki").select("gonderi_id,user_id,tip").in("gonderi_id", ids),
          c.from("topluluk_yorum").select("gonderi_id").eq("durum", "onayli").in("gonderi_id", ids),
        ]);
        tepki = tp.data || []; yorumlar = yr.data || [];
      }
      const id = uid();
      liste.forEach(g => {
        const t = tepki.filter(x => x.gonderi_id === g.id);
        g._tepki = { tebrikler: 0, ilham: 0, yaninda: 0 };
        t.forEach(x => { if (g._tepki[x.tip] != null) g._tepki[x.tip]++; });
        g._benimTepki = (t.find(x => x.user_id === id) || {}).tip || null;
        g._yorumSayi = yorumlar.filter(x => x.gonderi_id === g.id).length;
        g._takipli = _takip.has(g.user_id);
        g._benim = g.user_id === id;
      });
      _akis = liste; return liste;
    } catch (e) { _akis = []; return []; }
  }

  async function paylas(tip, metin) {
    const c = sb(), id = uid(); if (!c || !id) return { ok: false, mesaj: "Giriş gerekli" };
    metin = (metin || "").trim(); if (metin.length < 3) return { ok: false, mesaj: "Biraz daha yaz 🌿" };
    if (metin.length > 1000) metin = metin.slice(0, 1000);
    try { const { error } = await c.from("topluluk_gonderi").insert({ user_id: id, ad: benimAd(), tip: TIP[tip] ? tip : "paylasim", metin }); return { ok: !error, mesaj: error ? error.message : "" }; }
    catch (e) { return { ok: false, mesaj: String(e) }; }
  }
  async function yorumlariAl(gonderiId) {
    const c = sb(); if (!c) return [];
    try { const { data } = await c.from("topluluk_yorum").select("*").eq("gonderi_id", gonderiId).order("olusturma", { ascending: true }); return (data || []).filter(y => !_engel.has(y.user_id)); }
    catch (e) { return []; }
  }
  async function yorumYap(gonderiId, metin) {
    const c = sb(), id = uid(); if (!c || !id) return { ok: false };
    metin = (metin || "").trim(); if (metin.length < 2) return { ok: false, mesaj: "Biraz daha yaz" };
    if (metin.length > 600) metin = metin.slice(0, 600);
    try { const { error } = await c.from("topluluk_yorum").insert({ gonderi_id: gonderiId, user_id: id, ad: benimAd(), metin }); return { ok: !error }; }
    catch (e) { return { ok: false }; }
  }
  async function tepkiVer(gonderiId, tip) {
    const c = sb(), id = uid(); if (!c || !id) return;
    const g = _akis.find(x => x.id === gonderiId);
    try {
      if (g && g._benimTepki === tip) { await c.from("topluluk_tepki").delete().eq("gonderi_id", gonderiId).eq("user_id", id); }
      else { await c.from("topluluk_tepki").upsert({ gonderi_id: gonderiId, user_id: id, tip }, { onConflict: "gonderi_id,user_id" }); }
    } catch (e) {}
  }
  async function takipDegis(hedefId, etmek) {
    const c = sb(), id = uid(); if (!c || !id || hedefId === id) return;
    try {
      if (etmek) { await c.from("topluluk_takip").upsert({ user_id: id, takip_edilen_id: hedefId }, { onConflict: "user_id,takip_edilen_id" }); _takip.add(hedefId); }
      else { await c.from("topluluk_takip").delete().eq("user_id", id).eq("takip_edilen_id", hedefId); _takip.delete(hedefId); }
    } catch (e) {}
  }
  async function engelle(hedefId) {
    const c = sb(), id = uid(); if (!c || !id) return;
    try { await c.from("topluluk_engel").upsert({ user_id: id, engellenen_id: hedefId }, { onConflict: "user_id,engellenen_id" }); _engel.add(hedefId); } catch (e) {}
  }
  async function raporla(hedefTip, hedefId, sebep) {
    const c = sb(), id = uid(); if (!c || !id) return { ok: false };
    try { const { error } = await c.from("topluluk_rapor").insert({ hedef_tip: hedefTip, hedef_id: hedefId, user_id: id, sebep: sebep || null }); return { ok: !error }; }
    catch (e) { return { ok: false }; }
  }
  /* Moderasyon */
  async function bekleyenler() {
    const c = sb(); if (!c) return { gonderi: [], yorum: [], rapor: [] };
    try {
      const [g, y, r] = await Promise.all([
        c.from("topluluk_gonderi").select("*").eq("durum", "beklemede").order("olusturma", { ascending: true }).limit(100),
        c.from("topluluk_yorum").select("*").eq("durum", "beklemede").order("olusturma", { ascending: true }).limit(100),
        c.from("topluluk_gonderi").select("*").gt("rapor_sayisi", 0).order("rapor_sayisi", { ascending: false }).limit(50),
      ]);
      return { gonderi: g.data || [], yorum: y.data || [], rapor: r.data || [] };
    } catch (e) { return { gonderi: [], yorum: [], rapor: [] }; }
  }
  async function modKarar(tip, id, durum) {
    const c = sb(); if (!c) return;
    const tablo = tip === "yorum" ? "topluluk_yorum" : "topluluk_gonderi";
    try { await c.from(tablo).update({ durum }).eq("id", id); } catch (e) {}
  }
  async function modSil(tip, id) {
    const c = sb(); if (!c) return;
    const tablo = tip === "yorum" ? "topluluk_yorum" : "topluluk_gonderi";
    try { await c.from(tablo).delete().eq("id", id); } catch (e) {}
  }

  /* ---------- Render: Paylaşımlar ---------- */
  function tepkiBtnlar(g) {
    return TEPKI.map(([k, em, ad]) => {
      const n = g._tepki[k] || 0; const aktif = g._benimTepki === k ? " aktif" : "";
      return `<button class="ts-tepki${aktif}" data-act="tepki" data-id="${g.id}" data-tip="${k}" title="${esc(ad)}">${em} ${esc(ad)}${n ? ` <b>${n}</b>` : ""}</button>`;
    }).join("");
  }
  function gonderiKart(g) {
    const tp = TIP[g.tip] || TIP.paylasim;
    const takipBtn = g._benim ? "" :
      `<button class="ts-mini" data-act="takip" data-id="${g.user_id}" data-on="${g._takipli ? 1 : 0}">${g._takipli ? "✓ Takipte" : "+ Takip"}</button>`;
    return `<article class="ts-gonderi" data-gid="${g.id}">
      <header class="ts-g-bas">
        <div class="ts-g-avatar">${esc((g.ad || "?").slice(0, 1).toUpperCase())}</div>
        <div class="ts-g-kim"><div class="ts-g-ad">${esc(g.ad || "İsimsiz Işık")}</div><div class="ts-g-meta">${tp.ikon} ${esc(tp.ad)} · ${zamanFark(g.olusturma)}</div></div>
        ${takipBtn}
      </header>
      <div class="ts-g-metin">${esc(g.metin).replace(/\n/g, "<br>")}</div>
      <div class="ts-g-tepkiler">${tepkiBtnlar(g)}</div>
      <div class="ts-g-alt">
        <button class="ts-mini" data-act="yorumAc" data-id="${g.id}">💬 Yorumlar${g._yorumSayi ? ` (${g._yorumSayi})` : ""}</button>
        ${g._benim
        ? `<button class="ts-mini sil" data-act="gonderiSil" data-id="${g.id}">🗑️ Sil</button>`
        : `<button class="ts-mini" data-act="rapor" data-id="${g.id}" data-rtip="gonderi">🚩 Bildir</button>
           <button class="ts-mini" data-act="engel" data-id="${g.user_id}" data-ad="${esc(g.ad || "")}">🚫 Engelle</button>`}
      </div>
      <div class="ts-yorum-alan" id="ts-yorum-${g.id}" hidden></div>
    </article>`;
  }
  function feedHTML() {
    const id = uid();
    if (!id) return `<div class="tp-bilgi">🔒 Paylaşım yapmak ve görmek için <b>giriş yap</b> (Profil → Giriş).</div>`;
    const composer = `
      <div class="ts-composer">
        <div class="ts-tipler">
          ${Object.keys(TIP).map((k, i) => `<button class="ts-tip-sec${i === 0 ? " aktif" : ""}" data-tip="${k}">${TIP[k].ikon} ${esc(TIP[k].ad)}</button>`).join("")}
        </div>
        <textarea class="ts-metin" id="ts-yeni-metin" maxlength="1000" rows="3" placeholder="İlhamını, şükranını ya da bir başarını paylaş… 🌿"></textarea>
        <div class="ts-composer-alt">
          <span class="ts-mod-not">🛡️ Paylaşımın onaylandıktan sonra görünür.</span>
          <button class="btn ts-paylas-btn" id="ts-paylas">Paylaş</button>
        </div>
      </div>`;
    const filtre = `<div class="ts-filtre">
        <button class="ts-fil${_filtre === "tumu" ? " aktif" : ""}" data-fil="tumu">🌍 Tümü</button>
        <button class="ts-fil${_filtre === "takip" ? " aktif" : ""}" data-fil="takip">👥 Takip ettiklerim</button>
      </div>`;
    let liste = _akis;
    if (_filtre === "takip") liste = _akis.filter(g => _takip.has(g.user_id) || g._benim);
    const feed = liste.length
      ? liste.map(gonderiKart).join("")
      : `<div class="ts-bos">🌿 ${_filtre === "takip" ? "Takip ettiklerinden henüz paylaşım yok." : "Henüz paylaşım yok. İlk ışığı sen yak!"}</div>`;
    return composer + filtre + `<div class="ts-feed">${feed}</div>`;
  }

  async function yorumlariCiz(gonderiId) {
    const alan = document.getElementById("ts-yorum-" + gonderiId); if (!alan) return;
    alan.innerHTML = `<div class="ts-yorum-yukle">Yorumlar yükleniyor…</div>`;
    const yorumlar = await yorumlariAl(gonderiId);
    const id = uid();
    const liste = yorumlar.map(y => {
      const beklemede = y.durum !== "onayli";
      return `<div class="ts-yorum${beklemede ? " beklemede" : ""}">
        <span class="ts-y-ad">${esc(y.ad || "İsimsiz Işık")}</span>
        <span class="ts-y-metin">${esc(y.metin).replace(/\n/g, "<br>")}</span>
        <span class="ts-y-meta">${zamanFark(y.olusturma)}${beklemede ? " · ⏳ onay bekliyor" : ""}</span>
        ${y.user_id !== id ? `<button class="ts-y-rapor" data-act="rapor" data-id="${y.id}" data-rtip="yorum">🚩</button>` : ""}
      </div>`;
    }).join("") || `<div class="ts-yorum-bos">İlk yorumu sen yaz 🌿</div>`;
    alan.innerHTML = `<div class="ts-yorum-liste">${liste}</div>
      <div class="ts-yorum-yeni">
        <input class="ts-y-input" id="ts-yi-${gonderiId}" maxlength="600" placeholder="Yorum yaz…">
        <button class="ts-y-gonder" data-act="yorumGonder" data-id="${gonderiId}">Gönder</button>
      </div>
      <div class="ts-y-not">🛡️ Yorumun onaylandıktan sonra görünür.</div>`;
  }

  let _govde = null, _yeniTip = "paylasim";
  function bindFeed() {
    if (!_govde) return;
    // composer tip seçimi
    _govde.querySelectorAll(".ts-tip-sec").forEach(b => b.addEventListener("click", () => {
      _yeniTip = b.dataset.tip; _govde.querySelectorAll(".ts-tip-sec").forEach(x => x.classList.toggle("aktif", x === b));
    }));
    const pBtn = _govde.querySelector("#ts-paylas");
    if (pBtn) pBtn.addEventListener("click", async () => {
      const ta = _govde.querySelector("#ts-yeni-metin"); const r = await paylas(_yeniTip, ta.value);
      if (r.ok) { ta.value = ""; bilgiBalon("✨ Paylaşımın gönderildi. Onaylandıktan sonra görünecek."); }
      else bilgiBalon("⚠️ " + (r.mesaj || "Gönderilemedi"));
    });
    _govde.querySelectorAll(".ts-fil").forEach(b => b.addEventListener("click", async () => { _filtre = b.dataset.fil; await yenile(); }));
    // delegasyon
    _govde.querySelectorAll("[data-act]").forEach(el => el.addEventListener("click", async (e) => {
      const act = el.dataset.act, id = el.dataset.id;
      if (act === "tepki") { await tepkiVer(Number(id), el.dataset.tip); await yenile(); }
      else if (act === "yorumAc") {
        const alan = document.getElementById("ts-yorum-" + id);
        if (alan.hidden) { alan.hidden = false; await yorumlariCiz(Number(id)); bindYorum(alan); } else alan.hidden = true;
      }
      else if (act === "takip") { await takipDegis(id, el.dataset.on !== "1"); await yenile(); }
      else if (act === "gonderiSil") { if (confirm("Bu paylaşımı silmek istiyor musun?")) { await modSil("gonderi", Number(id)); await yenile(); } }
      else if (act === "engel") { if (confirm((el.dataset.ad || "Bu kullanıcı") + " engellensin mi? Paylaşımlarını görmezsin.")) { await engelle(id); await yenile(); bilgiBalon("🚫 Engellendi."); } }
      else if (act === "rapor") { await raporAkisi(el.dataset.rtip, Number(id)); }
    }));
  }
  function bindYorum(alan) {
    const g = alan.querySelector("[data-act='yorumGonder']");
    if (g) g.addEventListener("click", async () => {
      const inp = alan.querySelector("#ts-yi-" + g.dataset.id); const r = await yorumYap(Number(g.dataset.id), inp.value);
      if (r.ok) { inp.value = ""; await yorumlariCiz(Number(g.dataset.id)); bindYorum(document.getElementById("ts-yorum-" + g.dataset.id)); bilgiBalon("✨ Yorumun gönderildi, onay bekliyor."); }
    });
    alan.querySelectorAll("[data-act='rapor']").forEach(b => b.addEventListener("click", () => raporAkisi("yorum", Number(b.dataset.id))));
  }
  async function raporAkisi(hedefTip, hedefId) {
    const sebep = prompt("Neden bildiriyorsun? (kısa açıklama, isteğe bağlı)\nUygunsuz / spam / hakaret vb.");
    if (sebep === null) return;
    const r = await raporla(hedefTip, hedefId, sebep);
    bilgiBalon(r.ok ? "🚩 Bildirin alındı, moderatöre iletildi. Teşekkürler." : "⚠️ Bildirilemedi.");
  }
  function bilgiBalon(msg) {
    let b = document.getElementById("ts-balon");
    if (!b) { b = document.createElement("div"); b.id = "ts-balon"; b.className = "ts-balon"; document.body.appendChild(b); }
    b.textContent = msg; b.classList.add("gor");
    clearTimeout(b._t); b._t = setTimeout(() => b.classList.remove("gor"), 3200);
  }
  async function yenile() { await akisYukle(); if (_govde) { _govde.innerHTML = feedHTML(); bindFeed(); } }

  async function cizPaylasimlar(govde) {
    _govde = govde;
    govde.innerHTML = `<div class="tp-bilgi">📝 Paylaşımlar yükleniyor…</div>`;
    if (!_hazir) await hazirla();
    await akisYukle();
    govde.innerHTML = feedHTML(); bindFeed();
  }

  /* ---------- Render: Moderasyon ---------- */
  function modKart(item, tip) {
    const tp = TIP[item.tip] || null;
    return `<div class="ts-mod-kart" data-mid="${item.id}">
      <div class="ts-mod-ust"><b>${esc(item.ad || "İsimsiz")}</b> <span class="muted">· ${tip === "yorum" ? "yorum" : (tp ? tp.ikon + " " + tp.ad : "paylaşım")} · ${zamanFark(item.olusturma)}${item.rapor_sayisi ? ` · 🚩${item.rapor_sayisi}` : ""}</span></div>
      <div class="ts-mod-metin">${esc(item.metin).replace(/\n/g, "<br>")}</div>
      <div class="ts-mod-btnlar">
        <button class="ts-mod-onay" data-mact="onayla" data-mtip="${tip}" data-id="${item.id}">✅ Onayla</button>
        <button class="ts-mod-red" data-mact="reddet" data-mtip="${tip}" data-id="${item.id}">🚫 Reddet</button>
        <button class="ts-mod-sil" data-mact="sil" data-mtip="${tip}" data-id="${item.id}">🗑️ Sil</button>
      </div>
    </div>`;
  }
  let _modGovde = null;
  async function cizModerasyon(govde) {
    _modGovde = govde;
    govde.innerHTML = `<div class="tp-bilgi">🛡️ Bekleyenler yükleniyor…</div>`;
    const d = await bekleyenler();
    const bolum = (baslik, arr, tip) => arr.length
      ? `<h3 class="ts-mod-baslik">${baslik} (${arr.length})</h3>` + arr.map(x => modKart(x, tip)).join("")
      : `<h3 class="ts-mod-baslik">${baslik}</h3><div class="ts-bos">Yok 🌿</div>`;
    govde.innerHTML = `<div class="ts-mod-not2">🛡️ Bu alan yalnız sana görünür. Onayladıkların herkese açılır.</div>`
      + bolum("⏳ Bekleyen Paylaşımlar", d.gonderi, "gonderi")
      + bolum("⏳ Bekleyen Yorumlar", d.yorum, "yorum")
      + (d.rapor.length ? `<h3 class="ts-mod-baslik">🚩 Bildirilen Paylaşımlar (${d.rapor.length})</h3>` + d.rapor.map(x => modKart(x, "gonderi")).join("") : "");
    govde.querySelectorAll("[data-mact]").forEach(b => b.addEventListener("click", async () => {
      const act = b.dataset.mact, tip = b.dataset.mtip, id = Number(b.dataset.id);
      if (act === "onayla") await modKarar(tip, id, "onayli");
      else if (act === "reddet") await modKarar(tip, id, "red");
      else if (act === "sil") { if (!confirm("Kalıcı silinsin mi?")) return; await modSil(tip, id); }
      const kart = b.closest(".ts-mod-kart"); if (kart) kart.remove();
      bilgiBalon(act === "onayla" ? "✅ Onaylandı, yayında." : act === "reddet" ? "🚫 Reddedildi." : "🗑️ Silindi.");
    }));
  }

  return { hazirla, moderatorMuCached, cizPaylasimlar, cizModerasyon };
})();
