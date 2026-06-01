/* ============================================================
   app.js — Tüm bölümlerin mantığı ve olay bağlamaları.
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  const $ = sel => document.querySelector(sel);
  const today = todayKey();

  /* ---------- Üst başlık tarih ---------- */
  $("#bugun-tarih").textContent = new Date().toLocaleDateString("tr-TR", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });

  /* ====================================================
     1. GÜNÜN MOTİVASYON CÜMLESİ
     ==================================================== */
  const motivasyonEl = $("#motivasyon-metin");
  function gosterMotivasyon(rastgele = false) {
    const liste = DATA.motivasyon;
    const metin = rastgele
      ? liste[Math.floor(Math.random() * liste.length)]
      : pickByDate(liste);
    motivasyonEl.textContent = metin;
  }
  gosterMotivasyon();
  $("#motivasyon-yeni").addEventListener("click", () => gosterMotivasyon(true));

  /* ====================================================
     2. MEDİTASYON SESLERİ
     ==================================================== */
  const sesListesi = $("#ses-listesi");
  const player = $("#ses-player");
  DATA.sesler.forEach(ses => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.className = "ses-btn";
    btn.textContent = "▶ " + ses.ad;
    btn.addEventListener("click", () => {
      player.src = encodeURI(ses.dosya);
      player.play().catch(() => {/* tarayıcı etkileşim bekleyebilir */});
      sesListesi.querySelectorAll(".ses-btn").forEach(b => b.classList.remove("aktif"));
      btn.classList.add("aktif");
    });
    li.appendChild(btn);
    sesListesi.appendChild(li);
  });

  /* ====================================================
     3. GÜNÜN RUH HALİ
     ==================================================== */
  const moodBtns = document.querySelectorAll("#mood-butonlar .mood");
  function isaretleMood() {
    const secili = Store.get("mood-" + today);
    moodBtns.forEach(b => b.classList.toggle("aktif", b.dataset.mood === secili));
  }
  moodBtns.forEach(b => {
    b.addEventListener("click", () => {
      Store.set("mood-" + today, b.dataset.mood);
      isaretleMood();
      cizMoodSerit();
      cizRozetler();
    });
  });
  function cizMoodSerit() {
    const serit = $("#mood-serit");
    serit.innerHTML = "";
    lastNDays(7).forEach(gun => {
      const m = Store.get("mood-" + gun);
      const span = document.createElement("span");
      span.className = "mood-gun";
      span.title = gun;
      span.textContent = m || "·";
      serit.appendChild(span);
    });
  }
  isaretleMood();
  cizMoodSerit();

  /* ====================================================
     4. KART ÇEKME
     ==================================================== */
  const kartAlani = $("#kart-alani");
  const kartCekBtn = $("#kart-cek");
  const kartTekrarBtn = $("#kart-tekrar");

  function gosterKart(kart) {
    kartAlani.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "kart-icerik";
    const img = document.createElement("img");
    img.src = encodeURI(kart.img);
    img.alt = kart.baslik;
    img.loading = "lazy";
    const h = document.createElement("h3");
    h.textContent = kart.baslik;
    const p = document.createElement("p");
    p.textContent = kart.mesaj;
    wrap.append(img, h, p);
    kartAlani.appendChild(wrap);
    kartCekBtn.hidden = true;
    kartTekrarBtn.hidden = false;
  }

  function kartCek(zorla = false) {
    let kayit = Store.get("card-" + today);
    if (!kayit || zorla) {
      const idx = Math.floor(Math.random() * DATA.kartlar.length);
      kayit = idx;
      Store.set("card-" + today, idx);
    }
    gosterKart(DATA.kartlar[kayit]);
  }
  // Bugün zaten çekilmişse göster
  if (Store.get("card-" + today) !== null) kartCek();
  kartCekBtn.addEventListener("click", () => kartCek());
  kartTekrarBtn.addEventListener("click", () => kartCek(true));

  /* ====================================================
     5. GÜNÜN MİNİ GÖREVİ
     ==================================================== */
  $("#gorev-metin").textContent = pickByDate(DATA.gorevler);
  const gorevCheck = $("#gorev-check");
  gorevCheck.checked = !!Store.get("task-" + today);
  gorevCheck.addEventListener("change", () => {
    Store.set("task-" + today, gorevCheck.checked);
    cizRozetler();
  });

  /* ====================================================
     6. FARKINDALIK SORUSU
     ==================================================== */
  $("#soru-metin").textContent = pickByDate(DATA.sorular);
  const soruCevap = $("#soru-cevap");
  soruCevap.value = Store.get("awa-" + today, "");
  $("#soru-kaydet").addEventListener("click", () => {
    Store.set("awa-" + today, soruCevap.value.trim());
    flash("#soru-bilgi", "Kaydedildi ✓");
    cizRozetler();
  });

  /* ====================================================
     7. MANİFEST HEDEFLERİ
     ==================================================== */
  const hedefListesi = $("#hedef-listesi");
  function cizHedefler() {
    const hedefler = Store.get("goals", []);
    hedefListesi.innerHTML = "";
    hedefler.forEach((h, i) => {
      const li = document.createElement("li");
      li.className = h.done ? "tamam" : "";
      const span = document.createElement("span");
      span.className = "liste-metin";
      span.textContent = h.text;
      span.title = "Gerçekleşti olarak işaretle";
      span.addEventListener("click", () => {
        hedefler[i].done = !hedefler[i].done;
        Store.set("goals", hedefler);
        cizHedefler();
      });
      const sil = document.createElement("button");
      sil.className = "sil";
      sil.textContent = "✕";
      sil.addEventListener("click", () => {
        hedefler.splice(i, 1);
        Store.set("goals", hedefler);
        cizHedefler();
      });
      li.append(span, sil);
      hedefListesi.appendChild(li);
    });
  }
  function hedefEkle() {
    const inp = $("#hedef-input");
    const v = inp.value.trim();
    if (!v) return;
    const hedefler = Store.get("goals", []);
    hedefler.push({ text: v, done: false });
    Store.set("goals", hedefler);
    inp.value = "";
    cizHedefler();
  }
  $("#hedef-ekle").addEventListener("click", hedefEkle);
  $("#hedef-input").addEventListener("keydown", e => { if (e.key === "Enter") hedefEkle(); });
  cizHedefler();

  /* ====================================================
     8. ŞÜKRAN DEFTERİ
     ==================================================== */
  const sukranListesi = $("#sukran-listesi");
  function cizSukran() {
    const notlar = Store.get("gratitude", []);
    sukranListesi.innerHTML = "";
    notlar.slice().reverse().forEach((n, revIdx) => {
      const i = notlar.length - 1 - revIdx;
      const li = document.createElement("li");
      const span = document.createElement("span");
      span.className = "liste-metin";
      span.innerHTML = `<small class="muted">${n.tarih}</small><br>${escapeHtml(n.text)}`;
      const sil = document.createElement("button");
      sil.className = "sil";
      sil.textContent = "✕";
      sil.addEventListener("click", () => {
        notlar.splice(i, 1);
        Store.set("gratitude", notlar);
        cizSukran();
        cizRozetler();
      });
      li.append(span, sil);
      sukranListesi.appendChild(li);
    });
  }
  function sukranEkle() {
    const inp = $("#sukran-input");
    const v = inp.value.trim();
    if (!v) return;
    const notlar = Store.get("gratitude", []);
    notlar.push({ text: v, tarih: today });
    Store.set("gratitude", notlar);
    inp.value = "";
    cizSukran();
    cizRozetler();
  }
  $("#sukran-ekle").addEventListener("click", sukranEkle);
  $("#sukran-input").addEventListener("keydown", e => { if (e.key === "Enter") sukranEkle(); });
  cizSukran();

  /* ====================================================
     9. GÜNLÜK
     ==================================================== */
  const gunlukMetin = $("#gunluk-metin");
  gunlukMetin.value = Store.get("journal-" + today, "");
  $("#gunluk-kaydet").addEventListener("click", () => {
    Store.set("journal-" + today, gunlukMetin.value.trim());
    flash("#gunluk-bilgi", "Kaydedildi ✓");
    cizGunlukGecmis();
    cizRozetler();
  });
  function cizGunlukGecmis() {
    const ul = $("#gunluk-gecmis");
    ul.innerHTML = "";
    Store.allKeys()
      .filter(k => k.startsWith(Store.PREFIX + "journal-"))
      .map(k => k.replace(Store.PREFIX + "journal-", ""))
      .sort().reverse()
      .forEach(gun => {
        const metin = Store.get("journal-" + gun, "");
        if (!metin) return;
        const li = document.createElement("li");
        li.innerHTML = `<small class="muted">${gun}</small><br>${escapeHtml(metin).slice(0, 200)}`;
        ul.appendChild(li);
      });
  }
  cizGunlukGecmis();

  /* ====================================================
     10. HAFTALIK ROZETLER
     ==================================================== */
  function haftalikSayac() {
    const hafta = weekId();
    const gunler = lastNDays(7).filter(g => weekId(new Date(g)) === hafta);
    let gorev = 0, mood = 0, gunluk = 0, soru = 0;
    gunler.forEach(g => {
      if (Store.get("task-" + g)) gorev++;
      if (Store.get("mood-" + g)) mood++;
      if (Store.get("journal-" + g)) gunluk++;
      if (Store.get("awa-" + g)) soru++;
    });
    const sukran = Store.get("gratitude", []).filter(n => weekId(new Date(n.tarih)) === hafta).length;
    return { gorev, mood, gunluk, soru, sukran };
  }
  function cizRozetler() {
    const sayac = haftalikSayac();
    const grid = $("#rozet-grid");
    grid.innerHTML = "";
    DATA.rozetler.forEach(r => {
      const deger = sayac[r.metrik] || 0;
      const kazanildi = deger >= r.hedef;
      const div = document.createElement("div");
      div.className = "rozet" + (kazanildi ? " kazanildi" : "");
      div.title = r.aciklama;
      div.innerHTML = `
        <div class="rozet-ikon">${r.ad}</div>
        <div class="rozet-ilerleme">${Math.min(deger, r.hedef)}/${r.hedef}</div>
        <div class="rozet-bar"><span style="width:${Math.min(100, deger / r.hedef * 100)}%"></span></div>`;
      grid.appendChild(div);
    });
  }
  cizRozetler();

  /* ====================================================
     11. ÜRÜN LİNKLERİ
     ==================================================== */
  const urunGrid = $("#urun-grid");
  DATA.urunler.forEach(u => {
    const a = document.createElement("a");
    a.className = "urun";
    a.href = u.link;
    a.target = "_blank";
    a.rel = "noopener";
    a.innerHTML = `<h4>${escapeHtml(u.ad)}</h4><p>${escapeHtml(u.aciklama)}</p><span class="urun-link">Satın Al →</span>`;
    urunGrid.appendChild(a);
  });

  /* ====================================================
     12. YEDEKLEME
     ==================================================== */
  $("#export-btn").addEventListener("click", () => Store.exportAll());
  $("#import-input").addEventListener("change", e => {
    const f = e.target.files[0];
    if (!f) return;
    Store.importAll(f, ok => {
      flash("#yedek-bilgi", ok ? "Yüklendi, sayfa yenileniyor…" : "Hata: geçersiz dosya");
      if (ok) setTimeout(() => location.reload(), 800);
    });
  });

  /* ---------- yardımcılar ---------- */
  function flash(sel, mesaj) {
    const el = $(sel);
    el.textContent = mesaj;
    setTimeout(() => { el.textContent = ""; }, 2000);
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
});
