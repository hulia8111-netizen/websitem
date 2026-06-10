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

    // Seviye çipleri (3 / 7 / 21 / 30)
    $("streak-tier-serit").innerHTML = DATA.streakSeviyeleri.map(t =>
      `<span class="streak-tier${g >= t.gun ? " kazanildi" : ""}"><b>${t.gun}</b>${t.ad}</span>`
    ).join("");

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

  document.addEventListener("DOMContentLoaded", ciz);
  return { ciz };
})();
