/* ============================================================
   rehber.js — AI Ruh Rehberi (yerel, kural-tabanlı sohbet).
   Kullanıcının yazdığı duyguyu DATA.rehber anahtarlarıyla eşler;
   destek mesajı + olumlama + meditasyon + kart + mini görev üretir.
   Sohbet balonları, loading animasyonu ve geçmiş (localStorage) içerir.
   İnternet/AI servisi gerektirmez; tamamen offline çalışır.
   Global: window.Rehber
   ============================================================ */

const Rehber = (() => {
  const GECMIS_KEY = "rehber-gecmis";
  const GECMIS_MAX = 40;

  let sohbet, girdi, btn, temizleBtn;

  /* ---------- analiz motoru ---------- */
  function normalize(s) { return String(s || "").toLocaleLowerCase("tr").trim(); }

  function analiz(metin) {
    const t = normalize(metin);
    if (!t) return null;
    let enIyi = null, enYuksek = 0;
    DATA.rehber.gruplar.forEach(g => {
      let skor = 0;
      g.anahtarlar.forEach(a => { if (t.includes(normalize(a))) skor++; });
      if (skor > enYuksek) { enYuksek = skor; enIyi = g; }
    });
    return enIyi || DATA.rehber.varsayilan;
  }
  function grupById(id) {
    return DATA.rehber.gruplar.find(g => g.id === id) || DATA.rehber.varsayilan;
  }
  function kategoriAd(id) {
    const k = (DATA.muzikKategorileri || []).find(x => x.id === id);
    return k ? k.ad : id;
  }
  function kartBul(baslik) {
    if (!baslik) return null;
    return (DATA.kartlar || []).find(k => k.baslik === baslik) || null;
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* ---------- geçmiş (localStorage) ---------- */
  function gecmisAl() { return Store.get(GECMIS_KEY, []); }
  function gecmisKaydet(girdiMetni, grupId) {
    const g = gecmisAl();
    g.push({ t: Date.now(), girdi: girdiMetni, grup: grupId });
    while (g.length > GECMIS_MAX) g.shift();
    Store.set(GECMIS_KEY, g);
  }
  function gecmisTemizle() { Store.remove(GECMIS_KEY); }

  /* ---------- balon oluşturma ---------- */
  function balon(rol, html, animasyonsuz) {
    const div = document.createElement("div");
    div.className = "balon " + rol;
    if (animasyonsuz) div.style.animation = "none";
    div.innerHTML = html;
    sohbet.appendChild(div);
    return div;
  }
  function altaKaydir() { sohbet.scrollTop = sohbet.scrollHeight; }

  function aiIcerik(grup) {
    const kart = kartBul(grup.kartBaslik);
    const katAd = kategoriAd(grup.meditasyonKategori);
    return `
      <div class="ai-destek">${esc(grup.destek || grup.durum)}</div>
      <div class="ai-oneri olumlama">
        <span class="et">Olumlama</span>
        <p>“${esc(grup.olumlama)}”</p>
      </div>
      <div class="ai-oneri">
        <span class="et">Önerilen Meditasyon · ${esc(katAd)}</span>
        <p>${esc(grup.meditasyon || katAd)}</p>
        <button class="btn ghost sm" data-go-med="${esc(grup.meditasyonKategori)}">Meditasyona Git →</button>
      </div>
      ${kart ? `
      <div class="ai-oneri">
        <span class="et">Önerilen Kart</span>
        <div class="ai-kart-mini">
          <img src="${encodeURI(kart.img)}" alt="${esc(kart.baslik)}" loading="lazy" />
          <div><strong>${esc(kart.baslik)}</strong><p>${esc(kart.mesaj)}</p></div>
        </div>
      </div>` : ""}
      <div class="ai-oneri">
        <span class="et">Mini Görev</span>
        <p>${esc(grup.gorev)}</p>
      </div>`;
  }

  function medBtnBagla(el) {
    const b = el.querySelector("[data-go-med]");
    if (!b) return;
    b.addEventListener("click", () => {
      if (typeof window.setMeditasyonKategori === "function") window.setMeditasyonKategori(b.dataset.goMed);
      if (typeof window.gotoView === "function") window.gotoView("meditasyon");
    });
  }

  /* ---------- akış ---------- */
  function cevapla(metin) {
    const grup = analiz(metin);
    if (!grup) return;

    balon("kullanici", esc(metin));
    altaKaydir();

    // loading (yazıyor) balonu
    const yaz = balon("ai yaziyor", `<div class="yaziyor"><span></span><span></span><span></span></div>`);
    altaKaydir();

    setTimeout(() => {
      yaz.classList.remove("yaziyor");
      yaz.style.animation = "balonGir 0.5s ease both";
      yaz.innerHTML = aiIcerik(grup);
      medBtnBagla(yaz);
      altaKaydir();
    }, 900);

    gecmisKaydet(metin, grup.id);
    Store.set("rehber-" + todayKey(), true);     // enerji puanı için "AI rehber kullanımı"
    if (window.Enerji) window.Enerji.ciz();
    temizleBtnGuncelle();
  }

  function gecmisCiz() {
    sohbet.innerHTML = "";
    const g = gecmisAl();
    if (!g.length) {
      balon("ai", `<div class="ai-destek">Merhaba 🌙 Bugün içinden ne geçiyor? Birkaç kelimeyle yazman yeterli — sana özel bir yol göstereyim.</div>`, true);
    } else {
      g.forEach(k => {
        balon("kullanici", esc(k.girdi), true);
        balon("ai", aiIcerik(grupById(k.grup)), true);
      });
      sohbet.querySelectorAll(".balon.ai").forEach(medBtnBagla);
    }
    temizleBtnGuncelle();
    altaKaydir();
  }

  function temizleBtnGuncelle() {
    if (temizleBtn) temizleBtn.hidden = gecmisAl().length === 0;
  }

  /* ---------- UI bağlama ---------- */
  function gonder() {
    const v = girdi.value.trim();
    if (!v) { girdi.focus(); return; }
    girdi.value = "";
    cevapla(v);
  }
  function baglan() {
    sohbet = document.getElementById("rehber-sohbet");
    girdi = document.getElementById("rehber-girdi");
    btn = document.getElementById("rehber-btn");
    temizleBtn = document.getElementById("rehber-temizle");
    if (!sohbet || !girdi || !btn) return;

    btn.addEventListener("click", gonder);
    girdi.addEventListener("keydown", e => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); gonder(); }
    });
    if (temizleBtn) {
      temizleBtn.addEventListener("click", () => { gecmisTemizle(); gecmisCiz(); });
    }
    gecmisCiz();
  }

  document.addEventListener("DOMContentLoaded", baglan);
  return { analiz };
})();
