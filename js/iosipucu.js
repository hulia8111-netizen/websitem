/* ============================================================
   iosipucu.js — iPhone "Ana Ekrana Ekle" ipucu 🍎
   ------------------------------------------------------------
   iOS Safari, PWA'yı otomatik kuramaz (Android'deki gibi buton yok);
   kullanıcıya elle göstermek gerekir. Bu modül SADECE iPhone/iPad
   Safari'de, uygulama HENÜZ ana ekrana eklenmemişken ve NATIVE app
   değilken nazik bir alt bilgi çubuğu gösterir: "Paylaş → Ana Ekrana Ekle".
   Kapatınca bir daha rahatsız etmez. Global etki yok, tamamen additive.
   ============================================================ */
(() => {
  function iOSmu() {
    const ua = navigator.userAgent || "";
    return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  }
  function safariMi() {
    const ua = navigator.userAgent || "";
    // iOS'ta Chrome/Firefox 'CriOS'/'FxiOS' içerir; onlarda "Ana Ekrana Ekle" farklı → yalnız Safari'de göster
    return !/CriOS|FxiOS|EdgiOS/.test(ua);
  }
  function standaloneMu() {
    try { return (("standalone" in navigator) && navigator.standalone) || matchMedia("(display-mode: standalone)").matches; } catch (e) { return false; }
  }
  function nativeMi() { return window.__ISIGINI_NATIVE === true || /\bwv\b/i.test(navigator.userAgent || ""); }
  function gizliMi() { try { return localStorage.getItem("ios-ekle-gizle") === "1"; } catch (e) { return false; } }
  function gizle() { try { localStorage.setItem("ios-ekle-gizle", "1"); } catch (e) {} }

  function goster() {
    if (document.getElementById("ios-ekle-ipucu")) return;
    const bar = document.createElement("div");
    bar.id = "ios-ekle-ipucu";
    bar.innerHTML = `
      <button class="ios-kapat" type="button" aria-label="Kapat">✕</button>
      <div class="ios-ic">
        <div class="ios-ay">🌙</div>
        <div class="ios-metin">
          <b>iPhone'da uygulama gibi kullan</b>
          <span>Aşağıdaki <b>Paylaş</b> <svg class="ios-share" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M12 3v12M12 3l-4 4M12 3l4 4" fill="none" stroke="#5ac8fa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 11H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-1" fill="none" stroke="#5ac8fa" stroke-width="2" stroke-linecap="round"/></svg> → <b>“Ana Ekrana Ekle”</b>ye dokun ✨</span>
        </div>
      </div>`;
    document.body.appendChild(bar);
    requestAnimationFrame(() => bar.classList.add("gor"));
    bar.querySelector(".ios-kapat").addEventListener("click", () => { bar.classList.remove("gor"); gizle(); setTimeout(() => bar.remove(), 300); });
  }

  function kur() {
    if (!iOSmu() || !safariMi() || standaloneMu() || nativeMi() || gizliMi()) return;
    setTimeout(goster, 2500);   // sayfa otursun, sonra nazikçe belir
  }
  document.addEventListener("DOMContentLoaded", kur);
})();
