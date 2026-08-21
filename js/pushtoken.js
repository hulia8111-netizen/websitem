/* ============================================================
   pushtoken.js — Native (Expo/FCM) push token köprüsü 🔔
   ------------------------------------------------------------
   Mobil uygulama (mobil/App.js) Expo push token'ı WebView'e enjekte eder:
     window.__ISIGINI_PUSH = { token, platform }
     window dispatchEvent('isigini-push-token')
   Bu modül token'ı Supabase `push_token` tablosuna yazar (misafir dahil),
   bildirim tercihlerini senkronlar ve bildirime tıklanınca ilgili ekrana
   yönlendirir (window 'isigini-push-yol').
   Global: window.PushToken
   ============================================================ */

const PushToken = window.PushToken = (() => {
  const CIHAZ = "cihaz-id";
  const AYAR = "bildirim-ayar";          // bildirim.js ile ortak
  let sonToken = null;

  function sb() { try { return window.Bulut && Bulut.client ? Bulut.client() : null; } catch (e) { return null; } }
  function uid() { try { return window.Bulut && Bulut.kullaniciId ? Bulut.kullaniciId() : null; } catch (e) { return null; } }

  /* Kalıcı cihaz kimliği (misafir eşleşmesi için) */
  function cihazId() {
    let id = Store.get(CIHAZ, null);
    if (!id) {
      id = "c_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);
      Store.set(CIHAZ, id);
    }
    return id;
  }

  /* Bildirim tercihleri (ayarlar ekranıyla ortak; makul varsayılanlar) */
  function tercihler() {
    const a = Store.get(AYAR, {}) || {};
    return {
      duyuru:   a.duyuru   !== false,          // temel — varsayılan açık
      topluluk: a.topluluk !== false,
      ilham:    a.ilham    !== false,          // temel — varsayılan açık
      ilham_saat: a.ilhamSaat || "12:00",
      ek_saatler: Array.isArray(a.ilhamEkSaatler) ? a.ilhamEkSaatler : []
    };
  }

  function tz() {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Istanbul"; } catch (e) { return "Europe/Istanbul"; }
  }

  /* Token'ı buluta yaz (upsert — token birincil anahtar) */
  async function kaydet() {
    const c = sb();
    if (!c || !sonToken) return;
    const t = tercihler();
    const satir = {
      token: sonToken,
      user_id: uid() || null,
      cihaz_id: cihazId(),
      platform: (window.__ISIGINI_PUSH && window.__ISIGINI_PUSH.platform) || "android",
      duyuru: t.duyuru, topluluk: t.topluluk, ilham: t.ilham,
      ilham_saat: t.ilham_saat, ek_saatler: t.ek_saatler,
      tz: tz(), guncelleme: new Date().toISOString()
    };
    try { await c.from("push_token").upsert(satir, { onConflict: "token" }); }
    catch (e) { /* sessiz */ }
  }

  /* Ayarlar değişince yeniden yaz (bildirim.js çağırır) */
  function tercihGuncelle() { if (sonToken) kaydet(); }

  /* ---------- native köprü: token ---------- */
  function tokenGeldi() {
    const p = window.__ISIGINI_PUSH;
    if (!p || !p.token) return;
    sonToken = p.token;
    // Bulut hazır olmayabilir → hazır olunca da dener
    kaydet();
    // giriş/çıkış sonrası tekrar bağla (user_id güncellensin)
    setTimeout(kaydet, 4000);
  }
  window.addEventListener("isigini-push-token", tokenGeldi);

  /* ---------- native köprü: bildirime tıklama → yönlendirme ---------- */
  function yol(hedef) {
    if (!hedef) return;
    try {
      if (hedef === "ilham") {
        if (window.GunlukIlham && GunlukIlham.ac) GunlukIlham.ac();
      } else if (hedef === "duyuru") {
        if (window.ToplulukDuyuru && ToplulukDuyuru.ac) ToplulukDuyuru.ac();
        else if (window.Topluluk && Topluluk.ac) Topluluk.ac();
      } else if (hedef === "topluluk") {
        if (window.Topluluk && Topluluk.ac) Topluluk.ac();
      }
    } catch (e) {}
  }
  window.addEventListener("isigini-push-yol", () => yol(window.__ISIGINI_PUSH_YOL));

  // Sayfa yüklendiğinde token zaten enjekte edilmiş olabilir
  document.addEventListener("DOMContentLoaded", () => {
    if (window.__ISIGINI_PUSH && window.__ISIGINI_PUSH.token) tokenGeldi();
    if (window.__ISIGINI_PUSH_YOL) setTimeout(() => yol(window.__ISIGINI_PUSH_YOL), 800);
  });

  return { kaydet, tercihGuncelle, cihazId, tercihler };
})();
