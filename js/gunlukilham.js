/* ============================================================
   gunlukilham.js — "Günün İlham Cümlesi" ✨
   Her gün (tarihe göre sabit) bir ilham cümlesi gösteren ekran.
   Kaynak: window.ACILIS_CUMLELERI (açılış ekranıyla aynı havuz).
   Bildirime tıklayınca (pushtoken.js → PushToken) buraya yönlenir.
   Ana ekranda "Ritüeller & Araçlar → ✨ Günün İlhamı" ile de açılır.
   Global: window.GunlukIlham
   ============================================================ */
const GunlukIlham = window.GunlukIlham = (() => {
  let ov = null;

  function bugununSozu() {
    const havuz = window.ACILIS_CUMLELERI || [];
    if (!havuz.length) return "Işığın hep seninle. ✨";
    // tarihe göre deterministik (o gün herkes aynı cümleyi görür)
    const idx = (typeof dayIndex === "function") ? (dayIndex() % havuz.length) : 0;
    return havuz[idx];
  }

  function tarihMetni() {
    try { return new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "long" }); }
    catch (e) { return ""; }
  }

  function kur() {
    if (ov) return ov;
    ov = document.createElement("div");
    ov.className = "ilham-overlay";
    ov.id = "ilham-overlay";
    ov.hidden = true;
    ov.innerHTML =
      '<div class="ilham-yildizlar" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>' +
      '<div class="ilham-ic">' +
        '<button class="gece-kapat ilham-kapat" aria-label="Kapat">✕</button>' +
        '<div class="ilham-ay">🌙</div>' +
        '<p class="ilham-tarih" id="ilham-tarih"></p>' +
        '<div class="ilham-amblem">✨</div>' +
        '<blockquote class="ilham-soz" id="ilham-soz"></blockquote>' +
        '<p class="ilham-alt muted small">Günün ilham cümlesi · her gün yeni</p>' +
        '<div class="ilham-paylas">' +
          '<span class="ilham-paylas-baslik">Paylaş</span>' +
          '<div class="ilham-paylas-btnlar">' +
            '<button class="ilham-pay wa" id="ilham-pay-wa" type="button" aria-label="WhatsApp\'ta paylaş">💬<span>WhatsApp</span></button>' +
            '<button class="ilham-pay ig" id="ilham-pay-ig" type="button" aria-label="Instagram\'da paylaş">📸<span>Instagram</span></button>' +
            '<button class="ilham-pay fb" id="ilham-pay-fb" type="button" aria-label="Facebook\'ta paylaş">👍<span>Facebook</span></button>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(ov);
    ov.querySelector(".ilham-kapat").addEventListener("click", kapat);
    ov.addEventListener("click", e => { if (e.target === ov) kapat(); });
    ov.querySelector("#ilham-pay-wa").addEventListener("click", waPaylas);
    ov.querySelector("#ilham-pay-fb").addEventListener("click", fbPaylas);
    ov.querySelector("#ilham-pay-ig").addEventListener("click", igPaylas);
    return ov;
  }

  /* ---------- paylaşım ---------- */
  const APP_URL = "https://isiginibull.net";
  function paylasMetni() { return "“" + bugununSozu() + "”\n\n— Işığını Bul ✨"; }
  function waPaylas() {
    window.open("https://wa.me/?text=" + encodeURIComponent(paylasMetni() + "\n" + APP_URL), "_blank", "noopener,noreferrer");
  }
  function fbPaylas() {
    window.open("https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(APP_URL) + "&quote=" + encodeURIComponent(paylasMetni()), "_blank", "noopener,noreferrer");
  }
  async function igPaylas() {
    const metin = paylasMetni() + "\n" + APP_URL;
    // Instagram metni doğrudan URL ile almaz → önce yerel paylaşım penceresi (Instagram burada çıkar)
    if (navigator.share) { try { await navigator.share({ text: metin }); return; } catch (e) { if (e && e.name === "AbortError") return; } }
    // Değilse: panoya kopyala + Instagram'ı aç
    try { await navigator.clipboard.writeText(metin); } catch (e) {}
    try { alert("İlham cümlesi kopyalandı ✨ Instagram'ı açıp gönderine yapıştırabilirsin."); } catch (e) {}
    window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
  }

  function ac() {
    kur();
    const s = ov.querySelector("#ilham-soz");
    const t = ov.querySelector("#ilham-tarih");
    if (s) s.textContent = "“" + bugununSozu() + "”";
    if (t) t.textContent = tarihMetni();
    document.body.classList.add("ilham-aktif");
    ov.hidden = false; ov.classList.remove("gor"); void ov.offsetWidth; ov.classList.add("gor");
  }
  function kapat() {
    if (!ov) return;
    ov.classList.remove("gor");
    setTimeout(() => { ov.hidden = true; document.body.classList.remove("ilham-aktif"); }, 350);
  }

  function baglan() {
    const btn = document.getElementById("ilham-ac");
    if (btn) btn.addEventListener("click", ac);
  }
  document.addEventListener("DOMContentLoaded", baglan);

  return { ac, kapat, bugununSozu };
})();
