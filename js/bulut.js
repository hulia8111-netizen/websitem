/* ============================================================
   bulut.js — Bulut Üyelik & Cihazlar Arası Senkron ☁️✨
   Supabase Auth (e-posta + şifre) + offline-first senkron.
   Güçlendirilmiş: anlık (realtime) senkron, senkron durumu + manuel senkron,
   şifre sıfırlama, çıkışta bu cihazdaki verileri silme seçeneği.
   Global: window.Bulut
   ============================================================ */

const Bulut = window.Bulut = (() => {
  const $ = id => document.getElementById(id);
  const TABLO = "kullanici_veri";
  let sb = null, oturum = null, hazir = false;
  let bekleyen = {}, pushTimer = null, indiriliyor = false;
  let kanal = null, sonSenkron = 0, kurtarmaModu = false;

  function yapilandirilmis() {
    return typeof SUPABASE_URL === "string" && /^https:\/\/.+\.supabase\.co/.test(SUPABASE_URL) &&
      typeof SUPABASE_ANON === "string" && SUPABASE_ANON.length > 30;
  }
  function kullaniciId() { return oturum && oturum.user ? oturum.user.id : null; }
  function girisli() { return !!kullaniciId(); }
  function cevrimici() { return navigator.onLine !== false; }
  // Senkron (kaba) oturum tespiti — Supabase token'ı localStorage'da var mı?
  function oturumVarMi() {
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && /^sb-.*-auth-token$/.test(k) && localStorage.getItem(k)) return true; } } catch (e) {}
    return false;
  }

  /* ---------- başlat ---------- */
  function init() {
    if (!yapilandirilmis()) { durumCiz(); return; }
    if (!window.supabase || !window.supabase.createClient) { console.warn("supabase-js yüklenmedi"); durumCiz(); return; }
    sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
    hazir = true;
    sb.auth.getSession().then(({ data }) => {
      oturum = data.session || null;
      durumCiz();
      if (oturum) { if (window.girisKapisiGizle) window.girisKapisiGizle(); acilisSenkron(); realtimeBaslat(); }
      else if (window.girisKapisiGoster) window.girisKapisiGoster();
    });
    sb.auth.onAuthStateChange((event, session) => {
      oturum = session || null;
      if (event === "PASSWORD_RECOVERY") kurtarmaModu = true;
      if (event === "SIGNED_OUT") { realtimeDur(); if (window.girisKapisiGoster) window.girisKapisiGoster(); }
      if (event === "SIGNED_IN" && oturum) realtimeBaslat();
      durumCiz();
    });
    window.addEventListener("focus", () => { if (girisli() && !indiriliyor) indir().then(d => { if (d) softTazele(); }); });
    window.addEventListener("online", durumCiz);
    window.addEventListener("offline", durumCiz);
    // Güvence: realtime çalışmasa da düzenli çek (yakın-anlık senkron)
    setInterval(() => { if (girisli() && cevrimici() && !indiriliyor && document.visibilityState === "visible") indir().then(d => { if (d) softTazele(); }); }, 25000);
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
  async function cikis(temizle) {
    realtimeDur();
    if (sb) await sb.auth.signOut();
    oturum = null;
    if (temizle) { Store.allKeys().forEach(k => localStorage.removeItem(k)); }
    durumCiz();
    if (temizle) setTimeout(() => location.reload(), 200);
  }
  async function sifreSifirla(email) {
    if (!hazir) return { ok: false, mesaj: "Bulut yapılandırılmamış" };
    if (!email) return { ok: false, mesaj: "Önce e-postanı yaz." };
    const { error } = await sb.auth.resetPasswordForEmail(email.trim(), { redirectTo: location.origin + location.pathname });
    if (error) return { ok: false, mesaj: cevir(error.message) };
    return { ok: true, mesaj: "Sıfırlama bağlantısı e-postana gönderildi 📩" };
  }
  async function yeniSifre(sifre) {
    if (!sb) return { ok: false, mesaj: "Hazır değil" };
    const { error } = await sb.auth.updateUser({ password: sifre });
    if (error) return { ok: false, mesaj: cevir(error.message) };
    kurtarmaModu = false; durumCiz();
    return { ok: true, mesaj: "Şifren güncellendi ✨" };
  }

  /* ---------- REALTIME (anlık senkron) ---------- */
  function realtimeBaslat() {
    const id = kullaniciId(); if (!id || kanal || !sb) return;
    kanal = sb.channel("kv-" + id)
      .on("postgres_changes", { event: "*", schema: "public", table: TABLO, filter: "user_id=eq." + id }, payload => {
        const r = payload.new; if (!r || !r.anahtar) return;
        const yeni = JSON.stringify(r.deger);
        const tam = Store.PREFIX + r.anahtar;
        if (localStorage.getItem(tam) !== yeni) {   // echo değilse (başka cihazdan)
          localStorage.setItem(tam, yeni);
          sonSenkron = Date.now(); softTazele(); durumCiz();
        }
      })
      .subscribe();
  }
  function realtimeDur() { if (kanal && sb) { try { sb.removeChannel(kanal); } catch (e) {} kanal = null; } }

  /* ---------- SENKRON ---------- */
  async function acilisSenkron() {
    try { const d = await indir(); if (d) softTazele(); } catch (e) { console.warn("açılış senkron:", e); }
    durumCiz();
  }
  function softTazele() {
    ["Profil", "Enerji", "Streak", "Kader", "Cakra", "EnerjiTipi", "Gorevler", "Hafta"].forEach(m => {
      try { if (window[m] && window[m].ciz) window[m].ciz(); } catch (e) {}
    });
  }
  async function ilkSenkron() {
    durumCiz("senkron");
    try {
      const bulutAnahtarlar = await indirMerge();
      await yukleYerelEksikleri(bulutAnahtarlar);
      sonSenkron = Date.now();
    } catch (e) { console.warn("ilk senkron:", e); }
    durumCiz();
    setTimeout(() => location.reload(), 500);
  }
  async function indirMerge() {
    const id = kullaniciId(); const set = new Set(); if (!id) return set;
    const { data, error } = await sb.from(TABLO).select("anahtar,deger").eq("user_id", id);
    if (error) { console.warn("indirMerge:", error.message); return set; }
    (data || []).forEach(r => { set.add(r.anahtar); localStorage.setItem(Store.PREFIX + r.anahtar, JSON.stringify(r.deger)); });
    return set;
  }
  async function yukleYerelEksikleri(bulutSet) {
    const id = kullaniciId(); if (!id) return;
    const satirlar = [];
    Store.allKeys().forEach(k => {
      const ad = k.slice(Store.PREFIX.length);
      if (bulutSet.has(ad)) return;
      let deger; try { deger = JSON.parse(localStorage.getItem(k)); } catch { deger = localStorage.getItem(k); }
      satirlar.push({ user_id: id, anahtar: ad, deger, guncelleme: new Date().toISOString() });
    });
    for (let i = 0; i < satirlar.length; i += 200) {
      const dilim = satirlar.slice(i, i + 200);
      if (dilim.length) await sb.from(TABLO).upsert(dilim, { onConflict: "user_id,anahtar" });
    }
  }
  async function indir() {
    const id = kullaniciId(); if (!id) return false;
    indiriliyor = true;
    const { data, error } = await sb.from(TABLO).select("anahtar,deger").eq("user_id", id);
    indiriliyor = false;
    if (error) { console.warn("indir:", error.message); return false; }
    let degisti = false;
    (data || []).forEach(r => {
      const yeni = JSON.stringify(r.deger);
      const tam = Store.PREFIX + r.anahtar;
      if (localStorage.getItem(tam) !== yeni) { localStorage.setItem(tam, yeni); degisti = true; }
    });
    sonSenkron = Date.now();
    return degisti;
  }
  // Manuel "Şimdi Senkronla": bekleyenleri it + buluttan çek
  async function manuelSenkron() {
    if (!girisli()) return;
    durumCiz("senkron");
    try { await it(); const d = await indir(); if (d) softTazele(); } catch (e) { console.warn(e); }
    durumCiz(); bilgi("Senkron edildi ✨");
  }

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
    else { sonSenkron = Date.now(); durumCiz(); }
  }

  /* ---------- yardımcı ---------- */
  function cevir(msg) {
    const m = (msg || "").toLowerCase();
    if (m.includes("invalid login")) return "E-posta ya da şifre hatalı.";
    if (m.includes("already registered") || m.includes("already exists")) return "Bu e-posta zaten kayıtlı. Giriş yap.";
    if (m.includes("password") && (m.includes("6") || m.includes("short") || m.includes("least"))) return "Şifre en az 6 karakter olmalı.";
    if (m.includes("email") && m.includes("invalid")) return "Geçerli bir e-posta gir.";
    if (m.includes("not confirmed")) return "E-postanı doğrulaman gerekiyor.";
    if (m.includes("rate") || m.includes("seconds")) return "Çok sık denedin, biraz bekle.";
    return msg || "Bir hata oluştu.";
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  function zamanFarki(ts) { if (!ts) return ""; const s = Math.round((Date.now() - ts) / 1000); if (s < 60) return "az önce"; if (s < 3600) return Math.round(s / 60) + " dk önce"; return Math.round(s / 3600) + " sa önce"; }
  function bilgi(msg, hata) { const el = $("hesap-bilgi"); if (!el) return; el.textContent = msg; el.style.color = hata ? "var(--uyari)" : "var(--basari)"; setTimeout(() => { if (el.textContent === msg) el.textContent = ""; }, 4000); }

  /* ---------- UI ---------- */
  function durumCiz(mod) {
    const durum = $("hesap-durum"); if (!durum) return;
    const form = $("hesap-form");

    if (!yapilandirilmis() || !hazir) {
      durum.innerHTML = `<p class="muted small">Bulut senkron henüz yapılandırılmadı. Şu an veriler yalnızca bu cihazda.</p>`;
      if (form) form.hidden = true; return;
    }

    // Şifre kurtarma modu (e-postadaki bağlantıyla gelindi)
    if (kurtarmaModu) {
      if (form) form.hidden = true;
      durum.innerHTML = `
        <div class="hesap-girisli">
          <p class="muted small">Yeni şifreni belirle:</p>
          <input type="password" id="hesap-yeni-sifre" placeholder="Yeni şifre (en az 6)" autocomplete="new-password"/>
          <button class="btn sm" id="hesap-yeni-kaydet">Şifreyi Kaydet</button>
        </div>`;
      const b = $("hesap-yeni-kaydet");
      if (b) b.addEventListener("click", async () => { const s = ($("hesap-yeni-sifre") || {}).value || ""; if (s.length < 6) return bilgi("Şifre en az 6 karakter", true); b.disabled = true; const r = await yeniSifre(s); b.disabled = false; bilgi(r.mesaj, !r.ok); });
      return;
    }

    if (girisli()) {
      if (form) form.hidden = true;
      const cevrim = cevrimici();
      const durumMetin = mod === "senkron" ? "Senkronlanıyor…"
        : !cevrim ? "Çevrimdışı — bağlanınca senkronlanacak 🌙"
          : (sonSenkron ? `Son senkron: ${zamanFarki(sonSenkron)} · anlık senkron açık ✨` : "Anlık senkron açık ✨");
      durum.innerHTML = `
        <div class="hesap-girisli">
          <div><span class="hesap-rozet${cevrim ? "" : " offline"}">${cevrim ? "☁️ Bağlı" : "⚠️ Çevrimdışı"}</span> <b>${esc(oturum.user.email)}</b></div>
          <p class="muted small" id="hesap-senkron-metin">${durumMetin}</p>
          <div class="hesap-btnlar">
            <button class="btn sm" id="hesap-senkronla">Şimdi Senkronla</button>
            <button class="btn ghost sm" id="hesap-cikis">Çıkış Yap</button>
          </div>
          <button class="hesap-link" id="hesap-cikis-temizle">Çıkış yap + bu cihazdan verileri sil</button>
        </div>`;
      const s = $("hesap-senkronla"); if (s) s.addEventListener("click", manuelSenkron);
      const c = $("hesap-cikis"); if (c) c.addEventListener("click", () => cikis(false));
      const ct = $("hesap-cikis-temizle"); if (ct) ct.addEventListener("click", () => { if (confirm("Çıkış yapılacak ve bu cihazdaki yerel veriler silinecek. Bulut hesabındaki veriler korunur. Devam edilsin mi?")) cikis(true); });
    } else {
      if (form) form.hidden = false;
      durum.innerHTML = `<p class="muted small">Giriş yap ya da hesap oluştur — verilerin tüm cihazlarında senkronlansın ☁️</p><button class="hesap-link" id="hesap-unuttum">Şifremi unuttum</button>`;
      const u = $("hesap-unuttum");
      if (u) u.addEventListener("click", async () => { const email = ($("hesap-email") || {}).value || ""; const r = await sifreSifirla(email); bilgi(r.mesaj, !r.ok); });
    }
  }

  function baglan() {
    init();
    const g = $("hesap-giris"), k = $("hesap-kayit");
    const al = () => ({ email: ($("hesap-email") || {}).value || "", sifre: ($("hesap-sifre") || {}).value || "" });
    if (g) g.addEventListener("click", async () => { const { email, sifre } = al(); if (!email || !sifre) return bilgi("E-posta ve şifre gir", true); g.disabled = true; const r = await girisYap(email, sifre); g.disabled = false; bilgi(r.mesaj, !r.ok); });
    if (k) k.addEventListener("click", async () => { const { email, sifre } = al(); if (!email || !sifre) return bilgi("E-posta ve şifre gir", true); k.disabled = true; const r = await kayitOl(email, sifre); k.disabled = false; bilgi(r.mesaj, !r.ok); });
    const gost = $("hesap-sifre-goster");
    if (gost) gost.addEventListener("change", () => { const s = $("hesap-sifre"); if (s) s.type = gost.checked ? "text" : "password"; });
  }
  document.addEventListener("DOMContentLoaded", baglan);

  return { kaydet, girisYap, kayitOl, cikis, manuelSenkron, sifreSifirla, oturumVarMi, durum: () => ({ girisli: girisli(), email: oturum && oturum.user ? oturum.user.email : null, sonSenkron, realtime: !!kanal }) };
})();
