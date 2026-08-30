/* ============================================================
   puanla.js — In-App Review köprüsü ⭐
   ------------------------------------------------------------
   Sadece NATIVE (Play) uygulamada çalışır. İyi bir andan (ör. haftalık
   hedef tamamlanınca) Puanla.iste() çağrılır → native tarafa mesaj gider
   → Expo StoreReview.requestReview() Google'ın "uygulamadan çıkmadan
   puan ver" penceresini açar. Web'de (native değilse) hiçbir şey yapmaz.

   Aşırı istememek için koruma: en fazla 3 kez, 45 günde bir. Google zaten
   kendi kotasıyla pencereyi her seferinde göstermeyebilir — bu normaldir.
   Global: window.Puanla
   ============================================================ */
window.Puanla = (() => {
  const GUN = 86400000;
  const MAX = 3;            // toplam en fazla deneme
  const ARALIK = 45 * GUN;  // iki deneme arası en az süre

  function native() {
    return !!(window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === "function");
  }
  function oku(k, def) { try { return localStorage.getItem(k) == null ? def : localStorage.getItem(k); } catch (e) { return def; } }
  function yaz(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  // İyi bir andan puan penceresini iste (vesile: sadece log/iç kullanım)
  function iste(vesile) {
    if (!native()) return false;
    const say = parseInt(oku("puan-say", "0"), 10) || 0;
    const son = parseInt(oku("puan-son", "0"), 10) || 0;
    if (say >= MAX) return false;
    if (son && (Date.now() - son) < ARALIK) return false;
    yaz("puan-say", String(say + 1));
    yaz("puan-son", String(Date.now()));
    try {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: "puan-iste", vesile: vesile || "" }));
      return true;
    } catch (e) { return false; }
  }

  // Bir süre sonra iste (kutlama animasyonu otursun diye)
  function isteGecikmeli(vesile, ms) { setTimeout(() => iste(vesile), ms || 1800); }

  return { iste, isteGecikmeli, native };
})();
