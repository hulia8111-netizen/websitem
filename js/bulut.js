/* ============================================================
   bulut.js — Bulut Üyelik & Cihazlar Arası Senkron ☁️✨
   Supabase Auth (e-posta + şifre) ile gerçek üyelik; localStorage verileri
   kullanıcıya özel buluta yedeklenir/senkronlanır (RLS ile korunur).
   Offline-first: uygulama yine yerelden okur; giriş yapınca veri iner/yükselir.
   Global: window.Bulut
   ============================================================ */

const Bulut = window.Bulut = (() => {
  const $ = id => document.getElementById(id);
  const TABLO = "kullanici_veri";
  let sb = null, oturum = null, hazir = false;
  let bekleyen = {}, pushTimer = null, indiriliyor = false;

  function yapilandirilmis() {
    return typeof SUPABASE_URL === "string" && /^https:\/\/.+\.supabase\.co/.test(SUPABASE_URL) &&
      typeof SUPABASE_ANON === "string" && SUPABASE_ANON.length > 30;
  }
  function kullaniciId() { return oturum && oturum.user ? oturum.user.id : null; }
  function girisli() { return !!kullaniciId(); }

  /* ---------- başlat ---------- */
  function init() {
    if (!yapilandirilmis()) { durumCiz(); return; }
    if (!window.supabase || !window.supabase.createClient) { console.warn("supabase-js yüklenmedi"); durumCiz(); return; }
    sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON, { auth: { persistSession: true, autoRefreshToken: true } });
    hazir = true;
    sb.auth.getSession().then(({ data }) => {
      oturum = data.session || null;
      durumCiz();
      if (oturum) ilkSenkron();
    });
    sb.auth.onAuthStateChange((_e, session) => { oturum = session || null; durumCiz(); });
    window.addEventListener("focus", () => { if (girisli() && !indiriliyor) indir(true); });
  }

  /* ---------- AUTH ---------- */
  async function kayitOl(email, sifre) {
    if (!hazir) return { ok: false, mesaj: "Bulut yapılandırılmamış" };
    const { data, error } = await sb.auth.signUp({ email: email.trim(), password: sifre });
    if (error) return { ok: false, mesaj: cevir(error.message) };
    if (data.session) { oturum = data.session; await ilkSenkron(); return { ok: true, mesaj: "Kayıt tamam, giriş yapıldı ✨" }; }
    return { ok: true, mesaj: "Kayıt oluşturuldu. (E-posta doğrulaması açıksa gelen kutunu kontrol et.)" };
  }
  async function girisYap(email, sifre) {
    if (!hazir) return { ok: false, mesaj: "Bulut yapılandırılmamış" };
    const { data, error } = await sb.auth.signInWithPassword({ email: email.trim(), password: sifre });
    if (error) return { ok: false, mesaj: cevir(error.message) };
    oturum = data.session; await ilkSenkron();
    return { ok: true, mesaj: "Giriş yapıldı ✨" };
  }
  async function cikis() { if (sb) await sb.auth.signOut(); oturum = null; durumCiz(); }

  /* ---------- SENKRON ---------- */
  function tumYerel() {
    const o = {};
    Store.allKeys().forEach(k => { o[k.slice(Store.PREFIX.length)] = localStorage.getItem(k); });
    return o;
  }
  // İlk giriş: yereldekileri buluta gönder + buluttakileri yerele indir, sonra tazele
  async function ilkSenkron() {
    durumCiz("senkron");
    try {
      await yukleYerelleri();
      await indir(false);
    } catch (e) { console.warn("ilk senkron:", e); }
    durumCiz();
    setTimeout(() => location.reload(), 400); // tüm modüller yerelden okuyor → tazele
  }
  async function yukleYerelleri() {
    const id = kullaniciId(); if (!id) return;
    const yerel = tumYerel();
    const satirlar = Object.entries(yerel).map(([anahtar, ham]) => {
      let deger; try { deger = JSON.parse(ham); } catch { deger = ham; }
      return { user_id: id, anahtar, deger, guncelleme: new Date().toISOString() };
    });
    for (let i = 0; i < satirlar.length; i += 200) {
      const dilim = satirlar.slice(i, i + 200);
      if (dilim.length) await sb.from(TABLO).upsert(dilim, { onConflict: "user_id,anahtar" });
    }
  }
  async function indir(sessiz) {
    const id = kullaniciId(); if (!id) return;
    indiriliyor = true;
    const { data, error } = await sb.from(TABLO).select("anahtar,deger").eq("user_id", id);
    indiriliyor = false;
    if (error) { console.warn("indir:", error.message); return; }
    let degisti = false;
    (data || []).forEach(r => {
      const yeni = JSON.stringify(r.deger);
      const tamAnahtar = Store.PREFIX + r.anahtar;
      if (localStorage.getItem(tamAnahtar) !== yeni) { localStorage.setItem(tamAnahtar, yeni); degisti = true; }
    });
    if (degisti && sessiz) location.reload();
  }

  // Store.set'ten çağrılır — değişikliği buluta (debounce) it
  function kaydet(key, value) {
    if (!hazir || !girisli() || indiriliyor) return;
    bekleyen[key] = value;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(it, 900);
  }
  async function it() {
    const id = kullaniciId(); if (!id) return;
    const keys = Object.keys(bekleyen); if (!keys.length) return;
    const satirlar = keys.map(k => ({ user_id: id, anahtar: k, deger: bekleyen[k], guncelleme: new Date().toISOString() }));
    bekleyen = {};
    const { error } = await sb.from(TABLO).upsert(satirlar, { onConflict: "user_id,anahtar" });
    if (error) console.warn("bulut yazma:", error.message);
    else durumCiz();
  }

  /* ---------- hata çevirisi ---------- */
  function cevir(msg) {
    const m = (msg || "").toLowerCase();
    if (m.includes("invalid login")) return "E-posta ya da şifre hatalı.";
    if (m.includes("already registered") || m.includes("already exists")) return "Bu e-posta zaten kayıtlı. Giriş yap.";
    if (m.includes("password") && m.includes("6")) return "Şifre en az 6 karakter olmalı.";
    if (m.includes("email") && m.includes("invalid")) return "Geçerli bir e-posta gir.";
    if (m.includes("not confirmed")) return "E-postanı doğrulaman gerekiyor.";
    return msg || "Bir hata oluştu.";
  }

  /* ---------- UI ---------- */
  function durumCiz(mod) {
    const durum = $("hesap-durum"); if (!durum) return;
    const form = $("hesap-form");
    if (!yapilandirilmis() || !hazir) {
      durum.innerHTML = `<p class="muted small">Bulut senkron henüz yapılandırılmadı. <code>js/supabase-config.js</code> dosyasına Supabase bilgileri eklenince aktifleşir. Şu an veriler yalnızca bu cihazda.</p>`;
      if (form) form.hidden = true;
      return;
    }
    if (girisli()) {
      if (form) form.hidden = true;
      durum.innerHTML = `
        <div class="hesap-girisli">
          <div><span class="hesap-rozet">☁️ Bağlı</span> <b>${esc(oturum.user.email)}</b></div>
          <p class="muted small">${mod === "senkron" ? "Senkronlanıyor…" : "Verilerin buluta yedekleniyor ve cihazlar arası senkronlanıyor ✨"}</p>
          <button class="btn ghost sm" id="hesap-cikis">Çıkış Yap</button>
        </div>`;
      const c = $("hesap-cikis"); if (c) c.addEventListener("click", cikis);
    } else {
      if (form) form.hidden = false;
      durum.innerHTML = `<p class="muted small">Giriş yap ya da hesap oluştur — verilerin tüm cihazlarında senkronlansın ☁️</p>`;
    }
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  function bilgi(msg, hata) { const el = $("hesap-bilgi"); if (!el) return; el.textContent = msg; el.style.color = hata ? "var(--uyari)" : "var(--basari)"; setTimeout(() => { if (el.textContent === msg) el.textContent = ""; }, 4000); }

  function baglan() {
    init();
    const g = $("hesap-giris"), k = $("hesap-kayit");
    const al = () => ({ email: ($("hesap-email") || {}).value || "", sifre: ($("hesap-sifre") || {}).value || "" });
    if (g) g.addEventListener("click", async () => { const { email, sifre } = al(); if (!email || !sifre) return bilgi("E-posta ve şifre gir", true); g.disabled = true; const r = await girisYap(email, sifre); g.disabled = false; bilgi(r.mesaj, !r.ok); });
    if (k) k.addEventListener("click", async () => { const { email, sifre } = al(); if (!email || !sifre) return bilgi("E-posta ve şifre gir", true); k.disabled = true; const r = await kayitOl(email, sifre); k.disabled = false; bilgi(r.mesaj, !r.ok); });
  }
  document.addEventListener("DOMContentLoaded", baglan);

  return { kaydet, girisYap, kayitOl, cikis, durum: () => ({ girisli: girisli(), email: oturum && oturum.user ? oturum.user.email : null }) };
})();
