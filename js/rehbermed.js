/* ============================================================
   rehbermed.js — "Rehberli Meditasyonlar" ödülü 🌙
   İstikrar (7 gün) seviyesine ulaşınca açılan ÖZEL bölüm.
   - İlk günden görünür; açılana kadar içerik gizli, kalan gün yazar (kilit YOK).
   - Açılınca "Tebrikler" kutlaması + 5 yazılı rehberli meditasyon listesi.
   - Ses YOK: bir meditasyona dokununca ekranda adım adım rehber metni açılır
     (oku + nefes al). Mevcut müzik/nefes sistemine DOKUNMAZ.
   Global: window.RehberMed
   ============================================================ */
const RehberMed = window.RehberMed = (() => {
  const $ = id => document.getElementById(id);
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  const SEV = (DATA.streakSeviyeleri && DATA.streakSeviyeleri[1]) || { gun: 7, ad: "İstikrar" };
  const ACILIS_GUN = SEV.gun || 7;
  const ACILIS_AD = SEV.ad || "İstikrar";

  function toplamGun() { try { return streakBilgisi().toplam || 0; } catch (e) { return 0; } }
  function acik() { return toplamGun() >= ACILIS_GUN; }

  let aktifId = null;   // okunan meditasyon (detay görünümü)

  function ciz() {
    const kutu = $("rehber-med-icerik"); if (!kutu) return;

    if (!acik()) {
      // Henüz seviye gelmedi → teaser (kilit ikonu YOK)
      const kalan = Math.max(1, ACILIS_GUN - toplamGun());
      const yuzde = Math.min(100, Math.round(toplamGun() / ACILIS_GUN * 100));
      kutu.innerHTML = `
        <div class="rm-teaser">
          <div class="rm-ikon">🧘</div>
          <div class="rm-rozet">✨ İstikrar Ödülü · 🌿 Yakında Açılıyor</div>
          <p class="rm-kalan">${esc(ACILIS_AD)} seviyesine ulaşmana <b>${kalan} gün</b> kaldı 🌿</p>
          <div class="rm-bar"><span class="rm-bar-dolu" style="width:${yuzde}%"></span></div>
        </div>`;
      return;
    }

    // Açık: detay (okuma) görünümü mü, liste mi?
    const med = aktifId ? (DATA.rehberMeditasyonlari || []).find(m => m.id === aktifId) : null;
    if (med) { cizDetay(kutu, med); return; }

    let ust = "";
    if (!Store.get("rehbermed-acildi")) {
      Store.set("rehbermed-acildi", true);
      ust = `
        <div class="rm-kutlama">
          <div class="rm-tik">✨</div>
          <div class="rm-kutlama-baslik">Tebrikler!</div>
          <p class="rm-kutlama-alt">🌿 İstikrar Seviyesi Tamamlandı<br>🧘 Rehberli Meditasyonlar Açıldı</p>
        </div>`;
    }
    const liste = (DATA.rehberMeditasyonlari || []).map(m => `
      <li class="rm-item" data-id="${m.id}">
        <span class="rm-play">${esc(m.ikon || "🌙")}</span>
        <div class="rm-bilgi"><div class="rm-ad">${esc(m.ad)}</div><div class="rm-alt">${esc(m.aciklama || "")}</div></div>
        <span class="rm-ok">›</span>
      </li>`).join("");
    kutu.innerHTML = ust + `<ul class="rm-liste">${liste}</ul>`;
    kutu.querySelectorAll(".rm-item").forEach(li => li.addEventListener("click", () => { aktifId = li.dataset.id; ciz(); }));
  }

  function cizDetay(kutu, m) {
    const adimlar = (m.adimlar || []).map((a, i) => `
      <li class="rm-adim"><span class="rm-adim-no">${i + 1}</span><p>${esc(a)}</p></li>`).join("");
    kutu.innerHTML = `
      <div class="rm-detay">
        <button class="rm-geri" type="button">‹ Geri</button>
        <div class="rm-detay-ikon">${esc(m.ikon || "🌙")}</div>
        <h3 class="rm-detay-ad">${esc(m.ad)}</h3>
        <p class="rm-detay-alt">${esc(m.aciklama || "")}</p>
        <div class="rm-detay-cizgi"></div>
        <div class="rm-nefes" aria-hidden="true">
          <div class="rm-nefes-halka"></div>
          <span class="rm-nefes-yazi">Nefesinle eşlik et 🌬️</span>
        </div>
        <ol class="rm-adimlar">${adimlar}</ol>
        <p class="rm-detay-kapanis">Hazır olduğunda gözlerini aç ve bu huzuru yanında taşı. 🌙</p>
      </div>`;
    kutu.querySelector(".rm-geri").addEventListener("click", () => { aktifId = null; ciz(); });
    const ic = kutu.closest(".rehber-med"); if (ic) ic.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  function baglan() { if ($("rehber-med-icerik")) ciz(); }
  document.addEventListener("DOMContentLoaded", baglan);
  return { ciz };
})();
