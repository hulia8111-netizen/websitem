/* ============================================================
   ambiyans.js — Arka plan huzur müziği 🎵 (Healing Meditation Flute — BerryDeep, Pixabay lisansı)
   ------------------------------------------------------------
   Uygulama açıldığı andan itibaren düşük seste, döngüde çalar.
   • Varsayılan AÇIK; köşedeki 🎵 butonuyla aç/kapa (tercih hatırlanır).
   • Uygulama içinde başka bir ses çalınca (meditasyon frekansı, Hasat,
     YouTube, nefes) kendiliğinden SUSAR, o bitince yavaşça geri gelir.
   • Uygulama arka plana geçince durur, dönünce devam eder.
   • Tarayıcı otomatik oynatmayı engellerse ilk dokunuşta başlar
     (mobil uygulamada mediaPlaybackRequiresUserAction=false → hemen çalar).
   Global: window.Ambiyans
   ============================================================ */
const Ambiyans = window.Ambiyans = (() => {
  const DOSYA = "sesler/ambiyans-flut.mp3";
  const TERCIH = "kdm_ambiyans";          // "acik" | "kapali" (yalnız bu cihaz)
  const HEDEF_SES = 0.22;                 // huzurlu, arka planda kalan seviye
  let ses = null, solma = null, buton = null;

  function acikMi() { try { return localStorage.getItem(TERCIH) !== "kapali"; } catch (e) { return true; } }
  function tercihYaz(acik) { try { localStorage.setItem(TERCIH, acik ? "acik" : "kapali"); } catch (e) {} }

  /* Başka bir ses/görüntü çalıyor mu? (o zaman ambiyans susar) */
  function baskaSesVar() {
    try { if (window.SesMotoru && SesMotoru.caliyor && SesMotoru.caliyor()) return true; } catch (e) {}
    if (document.body.classList.contains("yt-aktif") || document.body.classList.contains("nefes-mod")) return true;
    return [...document.querySelectorAll("audio, video")].some(m => m !== ses && !m.paused && !m.muted);
  }

  function hazirla() {
    if (ses) return ses;
    ses = new Audio(DOSYA);
    ses.loop = true; ses.preload = "auto"; ses.volume = 0;
    ses.setAttribute("data-ambiyans", "1");
    return ses;
  }
  function soldur(hedef, ms, bitince) {
    clearInterval(solma);
    const bas = ses.volume, adim = 50, n = Math.max(1, Math.round(ms / adim)); let i = 0;
    solma = setInterval(() => {
      i++; ses.volume = Math.min(1, Math.max(0, bas + (hedef - bas) * (i / n)));
      if (i >= n) { clearInterval(solma); if (bitince) bitince(); }
    }, adim);
  }

  function baslat() {
    if (!acikMi() || document.visibilityState === "hidden" || baskaSesVar()) return;
    hazirla();
    if (!ses.paused && ses.volume > 0) return;
    const p = ses.play();
    if (p && p.then) p.then(() => soldur(HEDEF_SES, 3500)).catch(() => ilkDokunustaBaslat());
    else soldur(HEDEF_SES, 3500);
    butonCiz();
  }
  function sustur(hizli) {
    if (!ses || ses.paused) return;
    soldur(0, hizli ? 400 : 1200, () => { try { ses.pause(); } catch (e) {} });
  }

  /* Otomatik oynatma engellendiyse: kullanıcının ilk dokunuşunda başla */
  let dokunusBekliyor = false;
  function ilkDokunustaBaslat() {
    if (dokunusBekliyor) return; dokunusBekliyor = true;
    const f = () => { dokunusBekliyor = false; ["pointerdown", "keydown"].forEach(t => document.removeEventListener(t, f, true)); setTimeout(baslat, 150); };
    ["pointerdown", "keydown"].forEach(t => document.addEventListener(t, f, true));
  }

  /* ---------- 🎵 aç/kapa butonu ---------- */
  function butonCiz() {
    if (!buton) return;
    const acik = acikMi();
    buton.textContent = acik ? "🎵" : "🔇";
    buton.classList.toggle("kapali", !acik);
    buton.setAttribute("aria-label", acik ? "Arka plan müziğini kapat" : "Arka plan müziğini aç");
    buton.title = acik ? "Müzik açık" : "Müzik kapalı";
  }
  function butonKur() {
    buton = document.createElement("button");
    buton.type = "button"; buton.className = "ambiyans-btn";
    buton.addEventListener("click", e => {
      e.stopPropagation();
      const yeni = !acikMi(); tercihYaz(yeni);
      if (yeni) baslat(); else sustur(true);
      butonCiz();
    });
    document.body.appendChild(buton);
    butonCiz();
  }

  /* ---------- diğer seslerle uyum ---------- */
  // Herhangi bir <audio>/<video> çalınca sus; bitince/durunca geri gel
  document.addEventListener("play", e => { if (e.target !== ses) sustur(true); }, true);
  ["pause", "ended"].forEach(t => document.addEventListener(t, e => { if (e.target !== ses) setTimeout(baslat, 800); }, true));
  // Meditasyon frekansları (Web Audio) ve YouTube/nefes ekranları: 1,5 sn'de bir kontrol
  setInterval(() => {
    if (!acikMi() || document.visibilityState === "hidden") return;
    if (baskaSesVar()) sustur(true);
    else if (!ses || ses.paused) baslat();
  }, 1500);
  // Uygulama arka plana geçince dur, dönünce devam
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") sustur(true); else setTimeout(baslat, 600); });

  document.addEventListener("DOMContentLoaded", () => { butonKur(); baslat(); });

  return { baslat, sustur, acikMi };
})();
