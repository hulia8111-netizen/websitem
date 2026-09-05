/* ============================================================
   keyif.js — Delight katmanı ✨ (hafif titreşim + yumuşak ses + mikro-kutlama)
   ------------------------------------------------------------
   Mevcut olayların (görev tamam, kart çek, kutlama…) ÜSTÜNE kozmetik
   keyif ekler. Tamamen additive + guard'lı: hiçbir mantığı/veriyi bozmaz.
   • Titreşim: desteklenmeyen cihazda sessizce atlanır (try/catch).
   • Ses: VARSAYILAN KAPALI (`keyif-ses` ayarı). Kendi mini Web Audio'su,
     kullanıcı dokunuşunda çalar (autoplay engeline takılmaz).
   • Animasyon: küçük parıltı; prefers-reduced-motion'da otomatik kapanır.
   Global: window.Keyif
   ============================================================ */
window.Keyif = (() => {
  const azHareket = () => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } };
  function sesAcik() { try { return Store.get("keyif-ses", false) === true; } catch (e) { return false; } }

  /* ---------- titreşim ---------- */
  function titret(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

  /* ---------- ses (lazy, kendine ait mini AudioContext) ---------- */
  let ac = null;
  function ctx() {
    try {
      if (!ac) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; ac = new AC(); }
      if (ac.state === "suspended") ac.resume();
      return ac;
    } catch (e) { return null; }
  }
  function nota(c, freq, t0, sure, kazanc) {
    const o = c.createOscillator(), g = c.createGain();
    o.type = "sine"; o.frequency.value = freq;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(kazanc, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + sure);
    o.connect(g).connect(c.destination);
    o.start(t0); o.stop(t0 + sure + 0.02);
  }
  function cal(diziler) {
    if (!sesAcik()) return;
    const c = ctx(); if (!c) return;
    const t = c.currentTime;
    diziler.forEach((n, i) => nota(c, n, t + i * 0.09, 0.35, 0.05));
  }

  /* ---------- mikro parıltı ---------- */
  function parlama(el, adet, renkler) {
    if (azHareket()) return;
    let x, y;
    if (el && el.getBoundingClientRect) { const r = el.getBoundingClientRect(); x = r.left + r.width / 2; y = r.top + r.height / 2; }
    else { x = innerWidth / 2; y = innerHeight / 3; }
    const kap = document.createElement("div");
    kap.className = "keyif-parlama";
    kap.style.left = x + "px"; kap.style.top = y + "px";
    const N = adet || 9;
    for (let i = 0; i < N; i++) {
      const s = document.createElement("span");
      const a = (i / N) * Math.PI * 2 + Math.random() * 0.4;
      const mesafe = 26 + Math.random() * 34;
      s.style.setProperty("--dx", (Math.cos(a) * mesafe).toFixed(1) + "px");
      s.style.setProperty("--dy", (Math.sin(a) * mesafe).toFixed(1) + "px");
      s.style.background = (renkler || ["#f3d98c", "#ffe6a8", "#b38cff", "#fff"])[i % 4];
      s.style.animationDelay = (Math.random() * 0.08).toFixed(2) + "s";
      kap.appendChild(s);
    }
    document.body.appendChild(kap);
    setTimeout(() => kap.remove(), 900);
  }

  /* ---------- genel yardımcılar (dışarıdan çağrılır) ---------- */
  function dokun() { titret(12); }
  function basari(el) { titret([10, 30, 14]); parlama(el, 9); cal([660, 988]); }
  function kutlama(el) { titret([10, 30, 10, 30, 60]); parlama(el, 16); cal([523.25, 659.25, 783.99]); }

  /* ---------- ayar toggle ---------- */
  function baglan() {
    const t = document.getElementById("keyif-ses-toggle");
    if (t) {
      t.checked = sesAcik();
      t.addEventListener("change", () => {
        Store.set("keyif-ses", t.checked);
        if (t.checked) { const c = ctx(); if (c) cal([660, 988]); }   // açınca minik önizleme
      });
    }
  }
  document.addEventListener("DOMContentLoaded", baglan);
  return { dokun, basari, kutlama, parlama, sesAcik };
})();
