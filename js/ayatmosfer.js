/* ============================================================
   ayatmosfer.js — Ay evresine tepki veren atmosfer 🌙
   ------------------------------------------------------------
   Gerçek ay evresine göre uygulamanın arka planına ÇOK HAFİF bir
   atmosfer katar: dolunaya yakın → gümüşi parlak; yeni aya yakın →
   derin/karanlık; arası → büyüyen/solan tonları. Okunabilirliği
   bozmaz (içeriğin ARKASINDA, düşük opaklık). ay.js'ten sonra yüklenir.
   ============================================================ */
(() => {
  function uygula() {
    try {
      if (typeof AyEvresi === "undefined" || !AyEvresi.fraz) return;
      const f = AyEvresi.fraz();
      const isik = AyEvresi.aydinlanma(f);              // 0 (yeni ay) .. 1 (dolunay)
      let sinif;
      if (isik > 0.85) sinif = "ay-dolunay";
      else if (isik < 0.15) sinif = "ay-yeniay";
      else sinif = (f < 0.5) ? "ay-buyuyen" : "ay-solan";
      const kok = document.documentElement;
      kok.classList.remove("ay-dolunay", "ay-yeniay", "ay-buyuyen", "ay-solan");
      kok.classList.add(sinif);
      kok.style.setProperty("--ay-isik", isik.toFixed(2));
    } catch (e) { /* sessiz */ }
  }
  function kur() {
    if (!document.querySelector(".ay-atmosfer")) {
      const d = document.createElement("div");
      d.className = "ay-atmosfer"; d.setAttribute("aria-hidden", "true");
      document.body.insertBefore(d, document.body.firstChild);
    }
    uygula();
  }
  document.addEventListener("DOMContentLoaded", kur);
  setInterval(uygula, 60 * 60 * 1000);                  // saatte bir tazele
})();
