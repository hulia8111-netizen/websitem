/* ============================================================
   evrenmesaji.js — "Evrenden Mesajını Al" 🔔✨
   ------------------------------------------------------------
   Gün içinde, kullanıcının seçtiği saatlerde, açılış sözlerinden
   (window.ACILIS_CUMLELERI — 69 söz; açılış ekranıyla aynı havuz)
   rastgele ilham cümleleri bildirim olarak gönderir.

   Kullanıcı: aç/kapat · günlük sayı (1–3) · her bildirimin saati.
   İçerik: aynı gün aynı söz tekrar etmez; yakın günlerde tekrarı
   azaltılır; tüm sözler dönüşümlü kullanılır.
   Bildirim: başlık "✨ Evrenden mesajın var", gövde = rastgele söz.
   Tıklanınca uygulama açılır → ana sayfaya yönlenir.

   Ayarlar Profil ekranında (ev-* elemanları). Global: window.EvrenMesaji
   ============================================================ */

const EvrenMesaji = window.EvrenMesaji = (() => {
  const $ = id => document.getElementById(id);
  const AYAR = "evren-ayar";       // { aktif, sayi(1-3), saatler[3] }
  const LOG = "evren-log";         // { "gün": { slot:[...], soz:[...] } }
  const GECMIS = "kdm_evren-gecmis"; // cihaz-yerel: yakın tekrarı azaltan indeks geçmişi
  const VARSAYILAN = { aktif: false, sayi: 1, saatler: ["10:00", "15:00", "20:00"] };
  const destekVar = "Notification" in window;

  function ayar() {
    const a = Object.assign({}, VARSAYILAN, Store.get(AYAR, {}) || {});
    if (!Array.isArray(a.saatler) || a.saatler.length < 3) a.saatler = VARSAYILAN.saatler.slice();
    a.sayi = Math.min(3, Math.max(1, parseInt(a.sayi, 10) || 1));
    return a;
  }
  function ayarYaz(a) { Store.set(AYAR, a); }   // Store.set → otomatik buluta senkron
  function izinDurum() { return destekVar ? Notification.permission : "yok"; }
  function izinVar() { return destekVar && Notification.permission === "granted"; }
  function hhmm(d = new Date()) { return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); }

  /* ---------- günlük gönderim kaydı ---------- */
  function bugunLog() { const m = Store.get(LOG, {}) || {}; return m[todayKey()] || { slot: [], soz: [] }; }
  function logYaz(l) {
    const m = Store.get(LOG, {}) || {};
    m[todayKey()] = l;
    const gunler = Object.keys(m).sort();
    while (gunler.length > 7) delete m[gunler.shift()]; // sadece son ~7 günü tut
    Store.set(LOG, m);
  }

  /* ---------- söz seçimi: aynı gün tekrar yok + yakın tekrarı azalt + dönüşümlü ---------- */
  function cumleSec() {
    const liste = window.ACILIS_CUMLELERI || [];
    if (!liste.length) return { idx: -1, soz: "Işığın hep seninle. ✨" };
    let gecmis; try { gecmis = JSON.parse(localStorage.getItem(GECMIS) || "[]"); } catch (e) { gecmis = []; }
    if (!Array.isArray(gecmis)) gecmis = [];
    const bugun = bugunLog().soz;                       // bugün gönderilen söz indeksleri
    const maxG = liste.length - 1;                      // tüm havuz dönmeden tekrar yok (21 gün+ aralık)
    let adaylar = [];
    for (let i = 0; i < liste.length; i++) if (bugun.indexOf(i) === -1 && gecmis.indexOf(i) === -1) adaylar.push(i);
    if (!adaylar.length) for (let i = 0; i < liste.length; i++) if (bugun.indexOf(i) === -1) adaylar.push(i); // bugünkü hariç hepsi
    if (!adaylar.length) for (let i = 0; i < liste.length; i++) adaylar.push(i);
    const idx = adaylar[Math.floor(Math.random() * adaylar.length)];
    gecmis.push(idx); while (gecmis.length > maxG) gecmis.shift();
    try { localStorage.setItem(GECMIS, JSON.stringify(gecmis)); } catch (e) {}
    return { idx, soz: liste[idx] };
  }

  /* ---------- Web Push aboneliği (ileride sunucudan gönderim için hazır) ---------- */
  function b64ToUint8(b64) {
    const pad = "=".repeat((4 - (b64.length % 4)) % 4);
    const base64 = (b64 + pad).replace(/-/g, "+").replace(/_/g, "/");
    const raw = atob(base64); const arr = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
    return arr;
  }
  async function pushAbonelik() {
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
      if (typeof VAPID_PUBLIC === "undefined" || !VAPID_PUBLIC) return;
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToUint8(VAPID_PUBLIC) });
      if (window.Bulut && Bulut.pushAboneKaydet) await Bulut.pushAboneKaydet(sub.toJSON());
    } catch (e) { console.warn("evren push abonelik:", e); }
  }

  /* ---------- bildirim gönder ---------- */
  async function gonder(slot) {
    const { idx, soz } = cumleSec();
    const opt = { body: soz, icon: "icon.svg", badge: "icon.svg", tag: "evren-mesaji", renotify: true, data: { url: "./", tip: "ana-sayfa" } };
    try {
      if (navigator.serviceWorker) { const reg = await navigator.serviceWorker.ready; await reg.showNotification("✨ Evrenden mesajın var", opt); }
      else new Notification("✨ Evrenden mesajın var", opt);
    } catch (e) { try { new Notification("✨ Evrenden mesajın var", opt); } catch (x) {} }
    if (slot != null && idx >= 0) {
      const l = bugunLog();
      if (l.slot.indexOf(slot) === -1) l.slot.push(slot);
      l.soz.push(idx); logYaz(l);
    }
  }

  async function aboneVar() {
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
      const reg = await navigator.serviceWorker.ready;
      return !!(await reg.pushManager.getSubscription());
    } catch (e) { return false; }
  }

  /* ---------- zamanlama kontrolü ----------
     Push aboneliği varsa teslimi SUNUCU (Edge Function cron) yapar → uygulama
     kapalıyken de çalışır ve çift bildirim olmaz; istemci sadece push YOKKEN
     (yedek) uygulama açıkken gönderir. */
  async function kontrol(acilis) {
    const a = ayar();
    if (!a.aktif || !izinVar()) return;
    // Merkezi kural: sessiz mod / gece rahatsız etmeme → gönderme (bildirim.js)
    if (window.Bildirim && Bildirim.rahatsizEtmeAktif && Bildirim.rahatsizEtmeAktif()) return;
    if (await aboneVar()) return;   // sunucu push devrede → istemci göndermez
    const su = hhmm(), l = bugunLog();
    if (acilis) {
      // açılışta: saati geçmiş ama henüz gönderilmemiş EN SON slotu bir kez gönder (spam olmasın)
      let sec = -1;
      for (let s = 0; s < a.sayi; s++) if (l.slot.indexOf(s) === -1 && su >= a.saatler[s]) sec = s;
      if (sec >= 0) gonder(sec);
      return;
    }
    for (let s = 0; s < a.sayi; s++) {
      if (l.slot.indexOf(s) === -1 && su === a.saatler[s]) { gonder(s); break; }
    }
  }

  /* Seçilen saat "gece rahatsız etmeme" aralığına düşüyor mu? (yalnız uyarı için;
     asıl engelleme Bildirim.rahatsizEtmeAktif() ve sunucu tarafında yapılır) */
  function geceyeDenkMi(hhmmStr) {
    const b = Store.get("bildirim-ayar", {}) || {};
    if (b.sessiz) return true;
    if (b.gece === false) return false;
    const par = s => { const q = String(s || "").split(":"); return (parseInt(q[0], 10) || 0) * 60 + (parseInt(q[1], 10) || 0); };
    const d = par(hhmmStr), bas = par(b.geceBas || "22:00"), bit = par(b.geceBit || "08:00");
    return bas <= bit ? (d >= bas && d < bit) : (d >= bas || d < bit);
  }

  /* ---------- UI (Profil) ---------- */
  function durumCiz() {
    const el = $("ev-durum"); if (!el) return;
    if (!destekVar) { el.textContent = "Bu cihaz/tarayıcı sistem bildirimini desteklemiyor."; return; }
    el.textContent = izinDurum() === "denied" ? "Bildirim izni reddedilmiş. Tarayıcı/uygulama ayarlarından açabilirsin." : "";
  }
  function ciz() {
    if (!$("ev-toggle")) return;
    const a = ayar();
    $("ev-toggle").checked = a.aktif;
    $("ev-detay").style.display = a.aktif ? "block" : "none";
    document.querySelectorAll(".ev-sayi").forEach(b => b.classList.toggle("aktif", parseInt(b.dataset.sayi, 10) === a.sayi));
    const wrap = $("ev-saatler"); if (wrap) {
      wrap.innerHTML = "";
      for (let s = 0; s < a.sayi; s++) {
        const row = document.createElement("label"); row.className = "bld-satir";
        const sp = document.createElement("span"); sp.textContent = (s + 1) + ". Bildirim";
        const inp = document.createElement("input"); inp.type = "time"; inp.value = a.saatler[s] || VARSAYILAN.saatler[s];
        inp.addEventListener("change", () => { const x = ayar(); x.saatler[s] = inp.value || VARSAYILAN.saatler[s]; ayarYaz(x); ciz(); });
        row.appendChild(sp); row.appendChild(inp);
        if (geceyeDenkMi(inp.value)) {
          const uy = document.createElement("small");
          uy.className = "ev-uyari";
          uy.textContent = "🌙 Bu saat “gece rahatsız etme” aralığında — bildirim gönderilmez.";
          row.appendChild(uy);
        }
        wrap.appendChild(row);
      }
    }
    durumCiz();
  }

  function baglan() {
    if (!$("ev-toggle")) return;
    ciz();
    $("ev-toggle").addEventListener("change", async e => {
      const a = ayar();
      if (e.target.checked) {
        if (!destekVar) { e.target.checked = false; durumCiz(); return; }
        if (Notification.permission === "default") {
          const izin = await Notification.requestPermission();
          if (izin !== "granted") { e.target.checked = false; durumCiz(); return; }
        } else if (Notification.permission === "denied") { e.target.checked = false; durumCiz(); return; }
        a.aktif = true; ayarYaz(a); ciz();
        pushAbonelik(); // gerçek push için buluta abone ol (ileride sunucu gönderimi)
        return;
      }
      a.aktif = false; ayarYaz(a); ciz();
    });
    document.querySelectorAll(".ev-sayi").forEach(b => b.addEventListener("click", () => {
      const x = ayar(); x.sayi = parseInt(b.dataset.sayi, 10) || 1; ayarYaz(x); ciz();
    }));
    const dene = $("ev-dene");
    if (dene) dene.addEventListener("click", () => { if (izinVar()) gonder(null); else durumCiz(); });

    setInterval(() => kontrol(false), 30000);
    setTimeout(() => kontrol(true), 8000); // açılışta (senkron bitince) kaçan mesajı yakala
  }
  document.addEventListener("DOMContentLoaded", baglan);
  return { kontrol, gonder, ciz, ayar };
})();
