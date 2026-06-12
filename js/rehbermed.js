/* ============================================================
   rehbermed.js — "Rehberin Sesinden" ödül meditasyonları 🌙🎙️
   İstikrar (7 gün) seviyesine ulaşınca açılan ÖZEL bölüm.
   - İlk günden görünür; açılana kadar içerik gizli, kalan gün yazar (kilit YOK).
   - Açılınca "Tebrikler" kutlaması + 5 özel meditasyon listesi.
   - Sesler "Meditasyon seslerim/" klasöründen (sonra eklenecek); yoksa
     "ses yakında" mesajı gösterilir. Mevcut müzik sistemine DOKUNMAZ.
   Global: window.RehberMed
   ============================================================ */
const RehberMed = window.RehberMed = (() => {
  const $ = id => document.getElementById(id);
  function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  const SEV = (DATA.streakSeviyeleri && DATA.streakSeviyeleri[1]) || { gun: 7, ad: "İstikrar" };
  const ACILIS_GUN = SEV.gun || 7;
  const ACILIS_AD = SEV.ad || "İstikrar";

  function toplamGun() { try { return streakBilgisi().toplam || 0; } catch (e) { return 0; } }
  function acik() { return toplamGun() >= ACILIS_GUN; }

  let aktifId = null, durumMesaj = "";

  function ciz() {
    const kutu = $("rehber-med-icerik"); if (!kutu) return;

    if (!acik()) {
      // Henüz seviye gelmedi → teaser (kilit ikonu YOK)
      const kalan = Math.max(1, ACILIS_GUN - toplamGun());
      const yuzde = Math.min(100, Math.round(toplamGun() / ACILIS_GUN * 100));
      kutu.innerHTML = `
        <div class="rm-teaser">
          <div class="rm-ikon">🎙️</div>
          <div class="rm-rozet">✨ İstikrar Ödülü · 🌿 Yakında Açılıyor</div>
          <p class="rm-kalan">${esc(ACILIS_AD)} seviyesine ulaşmana <b>${kalan} gün</b> kaldı 🌿</p>
          <div class="rm-bar"><span class="rm-bar-dolu" style="width:${yuzde}%"></span></div>
        </div>`;
      return;
    }

    // Açık
    let ust = "";
    if (!Store.get("rehbermed-acildi")) {
      Store.set("rehbermed-acildi", true);
      ust = `
        <div class="rm-kutlama">
          <div class="rm-tik">✨</div>
          <div class="rm-kutlama-baslik">Tebrikler!</div>
          <p class="rm-kutlama-alt">🌿 İstikrar Seviyesi Tamamlandı<br>🎙️ Rehberin Sesinden Meditasyonlar Açıldı</p>
        </div>`;
    }
    const liste = (DATA.rehberMeditasyonlari || []).map(m => `
      <li class="rm-item${aktifId === m.id ? " caliyor" : ""}" data-id="${m.id}">
        <button class="rm-play" aria-label="Çal/Duraklat">${aktifId === m.id ? "⏸" : "▶"}</button>
        <div class="rm-bilgi"><div class="rm-ad">${esc(m.ad)}</div><div class="rm-alt">${esc(m.aciklama || "")}</div></div>
      </li>`).join("");
    kutu.innerHTML = ust + `<ul class="rm-liste">${liste}</ul>` +
      (durumMesaj ? `<p class="rm-not muted small">${esc(durumMesaj)}</p>` : "");
    kutu.querySelectorAll(".rm-item").forEach(li => li.addEventListener("click", () => cal(li.dataset.id)));
  }

  function cal(id) {
    const m = (DATA.rehberMeditasyonlari || []).find(x => x.id === id); if (!m) return;
    const audio = $("rehber-med-audio"); if (!audio) return;
    if (aktifId === id && !audio.paused) { audio.pause(); aktifId = null; durumMesaj = ""; ciz(); return; }
    aktifId = id; durumMesaj = "";
    ciz();  // hemen "çalıyor" durumu görünsün
    audio.src = encodeURI(m.ses || "");
    audio.play()
      .then(() => { durumMesaj = "🎧 " + m.ad + " çalıyor…"; ciz(); })
      .catch(() => { aktifId = null; durumMesaj = "🎙️ Bu meditasyonun ses kaydı yakında eklenecek."; ciz(); });
    audio.onended = () => { aktifId = null; durumMesaj = ""; ciz(); };
  }

  function baglan() { if ($("rehber-med-icerik")) ciz(); }
  document.addEventListener("DOMContentLoaded", baglan);
  return { ciz };
})();
