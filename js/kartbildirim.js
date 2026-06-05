/* ============================================================
   kartbildirim.js — Günün Kartı Hatırlatma Bildirimi 🔔🔮
   Her gün belirlenen saatte (varsayılan 15:00) kontrol eder; kullanıcı o gün
   Günün Kartı'nı çekmediyse bir hatırlatma bildirimi gönderir. Çektiyse göndermez.
   Mesajlar rastgele dönüşümlü. Bildirime tıklayınca Kartlar ekranı açılır.
   Kart durumu yereldeki card-<gün> üzerinden okunur (Supabase ile senkron
   olduğundan başka cihazda çektiysen de burada görünür → tekrar hatırlatmaz).
   Ayarlar Profil ekranında (toggle + saat). Global: window.KartBildirim
   ============================================================ */

const KartBildirim = window.KartBildirim = (() => {
  const $ = id => document.getElementById(id);
  const AYAR = "kartbildirim-ayar";
  const LOG = "kartbildirim-log";
  const VARSAYILAN = { aktif: false, saat: "15:00" };
  const destekVar = "Notification" in window;

  function ayar() { return Object.assign({}, VARSAYILAN, Store.get(AYAR, {})); }
  function ayarYaz(a) { Store.set(AYAR, a); }
  function izinDurum() { return destekVar ? Notification.permission : "yok"; }
  function izinVar() { return destekVar && Notification.permission === "granted"; }

  function kartCekildi() { const t = todayKey(); return Store.get("card-" + t) !== null || Store.get("card2-" + t) !== null; }
  function gonderildi() { return (Store.get(LOG, {}) || {})[todayKey()] === true; }
  function isaretle() { const l = Store.get(LOG, {}) || {}; l[todayKey()] = true; Store.set(LOG, l); }
  function hhmm(d = new Date()) { return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); }

  /* ---------- Web Push aboneliği (gerçek push) ---------- */
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
    } catch (e) { console.warn("push abonelik:", e); }
  }
  async function pushAbonelikIptal() {
    try {
      if (window.Bulut && Bulut.pushAboneSil) await Bulut.pushAboneSil();
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
    } catch (e) {}
  }

  /* ---------- bildirim gönder ---------- */
  async function gonder() {
    const liste = DATA.kartBildirimMesajlari || ["Bugünün kartını çekmeyi unutma ✨"];
    const mesaj = liste[Math.floor(Math.random() * liste.length)];
    const opt = { body: mesaj, icon: "icon.svg", badge: "icon.svg", tag: "gunun-karti", data: { url: "./?kart=1" } };
    try {
      if (navigator.serviceWorker) {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification("Günün Kartı 🔮", opt);
        return;
      }
    } catch (e) {}
    try { new Notification("Günün Kartı 🔮", opt); } catch (e) {}
  }

  /* ---------- kontrol ---------- */
  function kontrol(acilis) {
    const a = ayar();
    if (!a.aktif || !izinVar()) return;
    if (kartCekildi() || gonderildi()) return;
    const su = hhmm();
    // acilis: uygulama açıldı + saat geçmiş → geç kalmış hatırlatma
    // periyodik: tam saatinde
    if (acilis ? (su >= a.saat) : (su === a.saat)) { gonder(); isaretle(); }
  }

  /* ---------- UI (Profil) ---------- */
  function durumCiz() {
    const el = $("kb-durum"); if (!el) return;
    if (!destekVar) { el.textContent = "Bu cihaz/tarayıcı sistem bildirimini desteklemiyor."; return; }
    const d = izinDurum();
    el.textContent = d === "denied" ? "Bildirim izni reddedilmiş. Tarayıcı ayarlarından açabilirsin." : "";
  }
  function ciz() {
    if (!$("kb-toggle")) return;
    const a = ayar();
    $("kb-toggle").checked = a.aktif;
    $("kb-saat").value = a.saat;
    $("kb-detay").style.display = a.aktif ? "block" : "none";
    durumCiz();
  }

  function baglan() {
    if (!$("kb-toggle")) return;
    ciz();
    $("kb-toggle").addEventListener("change", async e => {
      const a = ayar();
      if (e.target.checked) {
        if (!destekVar) { e.target.checked = false; durumCiz(); return; }
        if (Notification.permission === "default") {
          const izin = await Notification.requestPermission();
          if (izin !== "granted") { e.target.checked = false; durumCiz(); return; }
        } else if (Notification.permission === "denied") { e.target.checked = false; durumCiz(); return; }
        a.aktif = true; ayarYaz(a); ciz();
        pushAbonelik(); // gerçek push için buluta abone ol
        return;
      } else { a.aktif = false; pushAbonelikIptal(); }
      ayarYaz(a); ciz();
    });
    $("kb-saat").addEventListener("change", e => { const a = ayar(); a.saat = e.target.value || "15:00"; ayarYaz(a); });
    const dene = $("kb-dene");
    if (dene) dene.addEventListener("click", () => { if (izinVar()) gonder(); else durumCiz(); });

    setInterval(() => kontrol(false), 30000);
    setTimeout(() => kontrol(true), 7000); // açılışta (senkron bitince) geç kalmış hatırlatma
  }
  document.addEventListener("DOMContentLoaded", baglan);
  return { kontrol, gonder, ciz };
})();
