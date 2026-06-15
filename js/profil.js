/* ============================================================
   profil.js — Kişisel Spiritüel Profil 👤✨
   Ruhsal seviye (6 kademe, glow çerçeve + level-up), profil fotoğrafı,
   genişletilmiş istatistikler, 30 günlük gelişim grafiği ve meditasyon
   geçmişi. İsim düzenleme app.js'te; bu modül görseli render eder.
   Global: window.Profil
   ============================================================ */

const Profil = window.Profil = (() => {
  const $ = sel => document.querySelector(sel);

  /* ---------- sayımlar ---------- */
  function sayim() {
    return {
      giris: aktifGunSayisi("visit-"),
      med: aktifGunSayisi("med-"),
      mood: aktifGunSayisi("mood-"),
      gorev: aktifGunSayisi("task-"),
      sukran: (Store.get("gratitude", []) || []).length,
      kart: aktifGunSayisi("card-")
    };
  }
  function medDakika() { return Math.round((Store.get("med-sure-sn", 0) || 0) / 60); }

  /* Açılan rozet sayısı (app.js'teki başarım mantığıyla aynı) */
  function rozetDurum() {
    const c = sayim();
    const deger = {
      girisGun: c.giris, medGun: c.med, sukranTop: c.sukran,
      gorevTop: c.gorev, moodSeri: mevcutSeri("mood-"), moodTop: c.mood
    };
    let acik = 0;
    (DATA.rozetler || []).forEach(r => { if ((deger[r.metrik] || 0) >= r.hedef) acik++; });
    return { acik, toplam: (DATA.rozetler || []).length };
  }

  function enerjiOrt() {
    const v = lastNDays(30).map(g => Store.get("enerji-" + g)).filter(x => typeof x === "number");
    if (!v.length) return 0;
    return Math.round(v.reduce((a, b) => a + b, 0) / v.length);
  }

  /* ---------- ruhsal seviye ---------- */
  function skor() {
    const c = sayim();
    const rz = rozetDurum().acik;
    return c.giris * 2 + c.med * 3 + c.mood * 2 + c.gorev * 3 + c.sukran * 2 + rz * 12;
  }
  function seviyeIndex(s) {
    let li = 0;
    DATA.ruhselSeviyeler.forEach((x, i) => { if (s >= x.esik) li = i; });
    return li;
  }

  /* ---------- profil fotoğrafı ---------- */
  function fotoIsle(file) {
    const r = new FileReader();
    r.onload = e => {
      const img = new Image();
      img.onload = () => {
        const S = 256, c = document.createElement("canvas");
        c.width = S; c.height = S;
        const size = Math.min(img.width, img.height);
        const sx = (img.width - size) / 2, sy = (img.height - size) / 2;
        c.getContext("2d").drawImage(img, sx, sy, size, size, 0, 0, S, S);
        try { Store.set("profil-foto", c.toDataURL("image/jpeg", 0.82)); } catch (err) {}
        ciz();
      };
      img.src = e.target.result;
    };
    r.readAsDataURL(file);
  }

  /* ---------- grafik (son 30 gün enerji) ---------- */
  function cizGrafik() {
    const el = $("#profil-grafik");
    if (!el) return;
    const gunler = lastNDays(30);
    el.innerHTML = gunler.map(g => {
      const v = Store.get("enerji-" + g, 0) || 0;
      return `<span class="pg-bar" style="height:${Math.max(3, v)}%" title="${g}: %${v}"></span>`;
    }).join("");
  }
  function cizOzet() {
    const el = $("#profil-ozet");
    if (!el) return;
    const son30 = lastNDays(30);
    const aktif = son30.filter(g => Store.get("visit-" + g)).length;
    const ort = enerjiOrt();
    el.innerHTML = `Son 30 günde <strong>${aktif}</strong> gün aktiftin · <strong>${medDakika()}</strong> dk meditasyon · ortalama enerji <strong>%${ort}</strong>. İçindeki ışık büyüyor ✨`;
  }

  /* ---------- meditasyon geçmişi ---------- */
  function cizMedGecmis() {
    const kutu = $("#med-gecmis");
    if (!kutu) return;
    const gunler = Store.allKeys()
      .filter(k => k.startsWith(Store.PREFIX + "med-"))
      .map(k => k.replace(Store.PREFIX + "med-", ""))
      .filter(g => Store.get("med-" + g))
      .sort().reverse();
    kutu.innerHTML = gunler.length
      ? gunler.map(g => `<span class="gun-rozet">${g}</span>`).join("")
      : `<p class="muted small">Henüz dinleme kaydın yok.</p>`;
  }

  /* ---------- ana render ---------- */
  function ciz() {
    if (!$("#profil")) return;
    const p = Store.get("profil", { isim: "", baslangic: todayKey() });
    const isim = (p.isim || "").trim();
    const s = skor();
    const li = seviyeIndex(s);
    const sev = DATA.ruhselSeviyeler[li];
    const sonraki = DATA.ruhselSeviyeler[li + 1] || null;

    // Avatar (foto veya baş harf) + seviye çerçevesi
    const foto = Store.get("profil-foto", null);
    const av = $("#profil-avatar");
    if (foto) { av.style.backgroundImage = `url(${foto})`; av.classList.add("foto"); av.textContent = ""; }
    else { av.style.backgroundImage = ""; av.classList.remove("foto"); av.textContent = isim ? isim.charAt(0).toLocaleUpperCase("tr") : "✦"; }
    const sar = $("#profil-avatar-sar");
    sar.className = "profil-avatar-sar sv-" + li;

    // İsim + seviye
    $("#profil-isim").textContent = isim || "Hoş geldin";
    $("#profil-seviye").innerHTML = `<span class="seviye-rozet">${escapeHtml(sev.ad)}</span>`;
    const tarih = new Date(p.baslangic).toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" });
    $("#profil-uyelik").textContent = "Yolculuk başlangıcı: " + tarih;

    // Spiritüel test sonucu + tekrar çöz
    const testEl = document.querySelector("#profil-test");
    if (testEl) {
      const ts = Store.get("spiritest-sonuc", null);
      testEl.innerHTML = ts
        ? `<span class="profil-test-rozet">🧠 ${escapeHtml(ts.ad)}</span><button class="profil-test-btn" id="profil-test-btn">Testi tekrar çöz</button>`
        : `<button class="profil-test-btn" id="profil-test-btn">Spiritüel testi çöz ✦</button>`;
      const tb = testEl.querySelector("#profil-test-btn");
      if (tb) tb.addEventListener("click", () => { if (window.SpiriTest) window.SpiriTest.baslat(); });
    }

    // Seviye ilerleme
    if (sonraki) {
      const yuzde = Math.min(100, Math.round((s - sev.esik) / (sonraki.esik - sev.esik) * 100));
      $("#profil-seviye-dolu").style.width = yuzde + "%";
      $("#profil-seviye-bilgi").textContent = `${s} / ${sonraki.esik} puan · sonraki: ${sonraki.ad}`;
    } else {
      $("#profil-seviye-dolu").style.width = "100%";
      $("#profil-seviye-bilgi").textContent = `${s} puan · En yüksek seviye ✦`;
    }

    // İstatistikler
    const rz = rozetDurum();
    const st = streakBilgisi();
    const stats = [
      { et: "Güncel Seri", d: st.guncel, b: "gün" },
      { et: "Meditasyon", d: medDakika(), b: "dk" },
      { et: "Ruh Hali", d: sayim().mood, b: "kayıt" },
      { et: "Tamamlanan Görev", d: sayim().gorev, b: "" },
      { et: "Açılan Rozet", d: rz.acik + "/" + rz.toplam, b: "" },
      { et: "Enerji Ort.", d: enerjiOrt(), b: "%" },
      { et: "Aktif Gün", d: st.toplam, b: "gün" }
    ];
    const grid = $("#stat-grid");
    grid.innerHTML = "";
    stats.forEach(x => {
      const div = document.createElement("div");
      div.className = "stat" + (x.metin ? " stat-metin" : "");
      div.innerHTML = `<div class="stat-deger">${escapeHtml(String(x.d))}${x.b ? `<small>${x.b}</small>` : ""}</div><div class="stat-etiket">${x.et}</div>`;
      grid.appendChild(div);
    });

    cizGrafik();
    cizOzet();
    cizMedGecmis();

    // Seviye atlama animasyonu + bildirim
    const gorulen = Store.get("profil-seviye-gorulen", -1);
    if (li > gorulen) {
      if (gorulen >= 0) {
        sar.classList.remove("level-up"); void sar.offsetWidth; sar.classList.add("level-up");
        if (window.Bildirim && window.Bildirim.tetikle) window.Bildirim.tetikle(`🌟 Yeni ruhsal seviye: ${sev.ad}!`, true);
      }
      Store.set("profil-seviye-gorulen", li);
    }
  }

  function baglan() {
    if (!$("#profil")) return;
    const btn = $("#profil-foto-btn");
    const inp = $("#profil-foto-input");
    if (btn && inp) {
      btn.addEventListener("click", () => inp.click());
      inp.addEventListener("change", e => { const f = e.target.files[0]; if (f) fotoIsle(f); });
    }
    // Alt sekmeler (Enerji & Aura / Başarımlar / Ayarlar)
    const sekme = document.querySelector("#profil-sekme");
    if (sekme) {
      const gruplar = document.querySelectorAll("section[data-pgrup]");
      const goster = g => {
        sekme.querySelectorAll(".psek-btn").forEach(b => b.classList.toggle("aktif", b.dataset.pgrup === g));
        gruplar.forEach(c => c.classList.toggle("profil-gizli", c.dataset.pgrup !== g));
      };
      sekme.querySelectorAll(".psek-btn").forEach(b => b.addEventListener("click", () => goster(b.dataset.pgrup)));
      goster("enerji");
    }
    ciz();
  }

  document.addEventListener("DOMContentLoaded", baglan);
  return { ciz };
})();
