/* ============================================================
   streak.js — Yolculuk / toplam aktif gün widget'ı.
   Uygulamayı kullandığın TOPLAM (farklı) gün sayısını gösterir; asla
   sıfırlanmaz, her yeni günde artar. Veri visit-* (localStorage) anahtarlarından
   streakBilgisi().toplam ile okunur. Görev/ruh hali kaydı bonus gösterir.
   app.js'ten sonra yüklenir (bugünün ziyareti önce işlenir). Global: window.Streak
   ============================================================ */

const Streak = window.Streak = (() => {
  const $ = id => document.getElementById(id);

  function aktifSeviye(g) {
    let t = null;
    (DATA.streakSeviyeleri || []).forEach(x => { if (g >= x.gun) t = x; });
    return t;
  }
  function sonrakiSeviye(g) {
    return (DATA.streakSeviyeleri || []).find(x => x.gun > g) || null;
  }

  function ciz() {
    const widget = $("streak-widget");
    if (!widget || !DATA.streakSeviyeleri) return;

    const today = todayKey();
    const g = streakBilgisi().toplam;           // TOPLAM aktif gün (asla sıfırlanmaz)
    const gorevTamam = !!Store.get("task-" + today);
    const moodVar = !!Store.get("mood-" + today);

    // Sayı + başlık
    $("streak-sayi").textContent = g > 0 ? g : "";
    $("streak-baslik-metin").textContent = g > 0 ? "gün · toplam yolculuk ✨" : "Yolculuğa başla 🌙";

    // Motive edici mesaj
    let mesaj;
    if (g === 0) mesaj = "Bugün ilk adımı at 🌙";
    else if (gorevTamam && moodVar) mesaj = "Harika gidiyorsun ✨";
    else if (g >= 7) mesaj = "Harika gidiyorsun, böyle devam!";
    else mesaj = "Bugün de devam et";
    $("streak-mesaj").textContent = mesaj;

    // Seviye + ilerleme çubuğu
    const akt = aktifSeviye(g);
    const son = sonrakiSeviye(g);
    if (son) {
      const taban = akt ? akt.gun : 0;
      const yuzde = Math.min(100, Math.round((g - taban) / (son.gun - taban) * 100));
      $("streak-bar-dolu").style.width = yuzde + "%";
      $("streak-seviye-bilgi").textContent =
        `${akt ? akt.ad : "—"} · ${son.gun - g} gün sonra: ${son.ad}`;
    } else {
      $("streak-bar-dolu").style.width = "100%";
      $("streak-seviye-bilgi").textContent = `${akt ? akt.ad : ""} · En yüksek seviye ✦`;
    }

    // Seviye çipleri (3 / 7 / 21 / 30) + rozet
    $("streak-tier-serit").innerHTML = DATA.streakSeviyeleri.map(t =>
      `<span class="streak-tier${g >= t.gun ? " kazanildi" : ""}"><b>${t.gun}</b><span class="st-rozet">${t.rozet || "✦"}</span>${t.ad}${t.acilim ? `<span class="st-acilim">${t.acilim}</span>` : ""}</span>`
    ).join("");

    // Ödül kontrolü: yeni ulaşılan seviye varsa kutla (geçmişte ulaşılanlar sessizce işaretlenir)
    odulKontrol(g);

    // Görev / ruh hali bonus durumu
    widget.classList.toggle("gorev-tamam", gorevTamam);
    widget.classList.toggle("mood-bonus", moodVar);
    const bonus = $("streak-bonus");
    const notlar = [];
    if (gorevTamam) notlar.push("Görev tamam 🔥");
    if (moodVar) notlar.push("Ruh hali +bonus 🌟");
    bonus.textContent = notlar.join("   ·   ");
    bonus.hidden = notlar.length === 0;
  }

  /* ---------- Seviye ödülü ---------- */
  function odulKontrol(g) {
    const alinan = Store.get("streak-odul", null);
    const ulasilan = (DATA.streakSeviyeleri || []).filter(t => g >= t.gun);
    if (alinan === null) {
      // İlk çalıştırma: geçmişte zaten ulaşılmış seviyeleri sessizce işaretle (retro kutlama yok)
      const ilk = {}; ulasilan.forEach(t => ilk[t.gun] = true);
      Store.set("streak-odul", ilk);
      return;
    }
    const yeni = ulasilan.filter(t => !alinan[t.gun]);
    if (!yeni.length) return;
    yeni.forEach(t => alinan[t.gun] = true);
    Store.set("streak-odul", alinan);
    odulGoster(yeni[yeni.length - 1]);   // en yüksek yeni seviyeyi kutla
  }
  function odulGoster(t) {
    const pop = $("odul-popup"); if (!pop) return;
    $("odul-rozet").textContent = t.rozet || "✨";
    $("odul-ad").textContent = t.ad;
    $("odul-mesaj").textContent = t.odul || "";
    const yk = $("odul-yildizlar");
    if (yk) {
      yk.innerHTML = Array.from({ length: 16 }, () => "<span></span>").join("");
      [...yk.children].forEach(s => {
        s.style.left = (Math.random() * 100).toFixed(1) + "%";
        s.style.top = (Math.random() * 100).toFixed(1) + "%";
        s.style.animationDelay = (Math.random() * 0.7).toFixed(2) + "s";
      });
    }
    pop.hidden = false; pop.classList.remove("gor"); void pop.offsetWidth; pop.classList.add("gor");
  }
  function odulKapat() { const p = $("odul-popup"); if (!p) return; p.classList.remove("gor"); setTimeout(() => { p.hidden = true; }, 350); }

  function baglan() {
    const k = $("odul-kapat"); if (k) k.addEventListener("click", odulKapat);
    const pop = $("odul-popup"); if (pop) pop.addEventListener("click", e => { if (e.target === pop) odulKapat(); });
    ciz();
  }
  document.addEventListener("DOMContentLoaded", baglan);
  return { ciz };
})();
