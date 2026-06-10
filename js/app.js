/* ============================================================
   app.js — Görünüm gezinmesi, profil ve tüm bölümlerin mantığı.
   ============================================================ */

/* Ruh hali ikonları — minimal stroke SVG (emoji yerine).
   val: haftalık ortalama için puan | mesaj: o ruh hali haftanın çoğunluğuysa
   gösterilecek dinamik istatistik mesajı (her duyguya özel). */
const MOOD_LIST = [
  { key: "great", label: "Mutlu",   emoji: "✨", val: 5, mesaj: "Bu hafta en çok mutlu hissettin ✨" },
  { key: "good",  label: "Huzurlu", emoji: "🌿", val: 4, mesaj: "Bu hafta en çok huzurlu hissettin 🌿" },
  { key: "ok",    label: "Durgun",  emoji: "🌙", val: 3, mesaj: "Bu hafta biraz durgun hissettin 🌙" },
  { key: "low",   label: "Üzgün",   emoji: "💜", val: 2, mesaj: "Bu hafta duygusal olarak zorlanmış görünüyorsun 💜" },
  { key: "down",  label: "Hüzünlü", emoji: "🤍", val: 1, mesaj: "Kendine biraz şefkat göstermenin zamanı olabilir 🤍" }
];
const MOOD_META = MOOD_LIST.reduce((o, m) => (o[m.key] = m, o), {});
const MOOD_ICON = {
  great: '<circle cx="12" cy="12" r="9"/><path d="M8 13.5s1.4 2.2 4 2.2 4-2.2 4-2.2"/><path d="M9 9h.01M15 9h.01"/>',
  good:  '<circle cx="12" cy="12" r="9"/><path d="M8.5 14c1 .9 2.2 1.3 3.5 1.3s2.5-.4 3.5-1.3"/><path d="M9 9h.01M15 9h.01"/>',
  ok:    '<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5h7"/><path d="M9 9h.01M15 9h.01"/>',
  low:   '<circle cx="12" cy="12" r="9"/><path d="M8.5 15.4s1.2-1.4 3.5-1.4 3.5 1.4 3.5 1.4"/><path d="M9 9h.01M15 9h.01"/>',
  down:  '<circle cx="12" cy="12" r="9"/><path d="M8.5 15.6s1.2-1.6 3.5-1.6 3.5 1.6 3.5 1.6"/><path d="M9 9h.01M15 9h.01"/><path d="M8 12.4l-.7 1.9a.75.75 0 0 0 1.45.25z"/>'
};
const EMOJI_MAP = { "😄": "great", "🙂": "good", "😐": "ok", "😔": "low", "😢": "down" };
function moodKeyNormalize(v) {
  if (!v) return null;
  return MOOD_ICON[v] ? v : (EMOJI_MAP[v] || null);
}
function moodSvg(key, cls = "") {
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${MOOD_ICON[key]}</svg>`;
}
const SES_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M16 9a4 4 0 0 1 0 6M19 6.5a8 8 0 0 1 0 11"/></svg>';

document.addEventListener("DOMContentLoaded", () => {
  const $ = sel => document.querySelector(sel);
  const today = todayKey();

  /* Giriş/açılış takibi — bugünün açılış sayısını artır (streak + usage) */
  const acilis = (Store.get("visit-" + today, 0) || 0) + 1;
  Store.set("visit-" + today, acilis);

  /* Profil başlangıç tarihi (ilk açılış) */
  let profil = Store.get("profil", null);
  if (!profil) { profil = { isim: "", baslangic: today }; Store.set("profil", profil); }

  /* ---------- Üst başlık tarih ---------- */
  $("#bugun-tarih").textContent = new Date().toLocaleDateString("tr-TR", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });

  /* ====================================================
     KARŞILAMA / ONBOARDING
     ==================================================== */
  function setKarsilama(yeni = false) {
    const ad = (Store.get("profil", {}).isim || "").trim();
    const el = $("#karsilama");
    if (!ad) { el.textContent = ""; return; }
    el.textContent = yeni
      ? `Hoş geldin ${ad} ✨`
      : pickByDate(DATA.karsilamalar).replace("{ad}", ad);
  }
  /* ---------- GİRİŞ KAPISI (zorunlu): isim → mail+şifre ---------- */
  const ob = $("#onboarding");
  const bulutVar = (typeof SUPABASE_URL !== "undefined" && /^https/.test(SUPABASE_URL || ""));

  function obBilgi(m, hata) { const el = $("#ob-hesap-bilgi"); if (el) { el.textContent = m || ""; el.style.color = hata ? "var(--uyari)" : "var(--basari)"; } }

  function obIsimAdimi() {
    if ($("#ob-adim-isim")) $("#ob-adim-isim").hidden = false;
    if ($("#ob-adim-hesap")) $("#ob-adim-hesap").hidden = true;
    const inp = $("#ob-isim"), btn = $("#ob-basla");
    const mevcut = (Store.get("profil", {}).isim || "").trim();
    if (inp && mevcut) inp.value = mevcut;
    setTimeout(() => { if (inp) inp.focus(); }, 300);
    const ileri = () => {
      const v = (inp.value || "").trim(); if (!v) { inp.focus(); return; }
      const p = Store.get("profil", { baslangic: today }); p.isim = v; Store.set("profil", p);
      if (bulutVar) obHesapAdimi(v); else girisKapisiGizle();
    };
    if (btn) btn.onclick = ileri;
    if (inp) inp.onkeydown = e => { if (e.key === "Enter") ileri(); };
  }
  function obHesapAdimi(ad) {
    if ($("#ob-adim-isim")) $("#ob-adim-isim").hidden = true;
    const h = $("#ob-adim-hesap"); if (h) h.hidden = false;
    const bas = $("#ob-hesap-baslik"); if (bas) bas.textContent = `Hoş geldin ${ad || ""} ✨ Devam etmek için giriş yap ya da hesap oluştur.`;
    setTimeout(() => { const e = $("#ob-email"); if (e) e.focus(); }, 200);
    const al = () => ({ email: ($("#ob-email") || {}).value || "", sifre: ($("#ob-sifre") || {}).value || "" });
    const kayitBtn = $("#ob-kayit"), girisBtn = $("#ob-giris");
    if (kayitBtn) kayitBtn.onclick = async () => {
      const { email, sifre } = al(); if (!email || sifre.length < 6) return obBilgi("E-posta ve en az 6 karakter şifre gir", true);
      kayitBtn.disabled = true; girisBtn.disabled = true; obBilgi("Hesap oluşturuluyor…");
      try { sessionStorage.setItem("ob-yeni", "1"); } catch (e) {}
      const r = await window.Bulut.kayitOl(email, sifre);
      kayitBtn.disabled = false; girisBtn.disabled = false; obBilgi(r.mesaj, !r.ok);
    };
    if (girisBtn) girisBtn.onclick = async () => {
      const { email, sifre } = al(); if (!email || !sifre) return obBilgi("E-posta ve şifre gir", true);
      kayitBtn.disabled = true; girisBtn.disabled = true; obBilgi("Giriş yapılıyor…");
      const r = await window.Bulut.girisYap(email, sifre);
      kayitBtn.disabled = false; girisBtn.disabled = false; obBilgi(r.mesaj, !r.ok);
    };
    const gost = $("#ob-sifre-goster");
    if (gost) gost.onchange = () => { const s = $("#ob-sifre"); if (s) s.type = gost.checked ? "text" : "password"; };
    const unut = $("#ob-unuttum");
    if (unut) unut.onclick = async () => {
      const { email } = al(); if (!window.Bulut || !window.Bulut.sifreSifirla) return;
      const r = await window.Bulut.sifreSifirla(email);
      obBilgi(r.mesaj, !r.ok);
    };
  }
  function girisKapisiGoster() {
    if (!ob) return;
    ob.hidden = false; ob.classList.remove("kapaniyor");
    if (bulutVar && (Store.get("profil", {}).isim || "").trim()) obHesapAdimi((Store.get("profil", {}).isim || "").trim());
    else obIsimAdimi();
  }
  function girisKapisiGizle() {
    if (!ob) return;
    const zatenGizli = ob.hidden;
    if (!zatenGizli) { ob.classList.add("kapaniyor"); setTimeout(() => { ob.hidden = true; ob.classList.remove("kapaniyor"); }, 500); }
    setKarsilama(true);
    if (window.Profil) window.Profil.ciz();
    try {
      if (sessionStorage.getItem("ob-yeni") && !Store.get("spiritest-sonuc")) {
        sessionStorage.removeItem("ob-yeni");
        setTimeout(() => { if (window.SpiriTest) window.SpiriTest.baslat(); }, 800);
      }
    } catch (e) {}
  }
  window.girisKapisiGoster = girisKapisiGoster;
  window.girisKapisiGizle = girisKapisiGizle;

  (function girisKapisiBaslat() {
    if (!bulutVar) { // Bulut yoksa: yalnız isim (zorunlu değil)
      if ((profil.isim || "").trim()) { setKarsilama(); return; }
      girisKapisiGoster(); return;
    }
    // Bulut var → oturum yoksa kapı kapalı kalsın. Bulut.init asıl kararı verir.
    const muhtemelGiris = window.Bulut && Bulut.oturumVarMi && Bulut.oturumVarMi();
    if (muhtemelGiris) { if (ob) ob.hidden = true; setKarsilama(); }
    else { girisKapisiGoster(); }
  })();

  /* ====================================================
     GÖRÜNÜM GEZİNMESİ (bottom navigation)
     ==================================================== */
  const views = document.querySelectorAll(".view");
  const navBtns = document.querySelectorAll(".bottom-nav .nav-btn");
  function gotoView(id) {
    views.forEach(v => v.classList.toggle("active", v.id === "view-" + id));
    navBtns.forEach(b => b.classList.toggle("active", b.dataset.view === id));
    if (window.kilitGuncelle) window.kilitGuncelle();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  navBtns.forEach(b => b.addEventListener("click", () => {
    gunBilgiToast(b.dataset.view);   // kaç gün sonra açılır bilgisi (engellemez)
    gotoView(b.dataset.view);
  }));
  window.gotoView = gotoView;  // rehber.js için

  /* ====================================================
     SEVİYE BİLGİSİ — bölümler KİLİTLİ DEĞİL (her zaman açık).
     Tıklayınca "kaç gün sonra açılır" bilgisi gösterilir (motivasyon).
     30 gün: profil fotoğrafına İçsel Uyanış rozeti.
     ==================================================== */
  const KILIT = { kartlar: 3, meditasyon: 7, gunluk: 21 };
  const KILIT_AD = { kartlar: "Kartlar", meditasyon: "Meditasyon", gunluk: "Günlük" };
  function toplamGun() { try { return streakBilgisi().toplam || 0; } catch (e) { return 0; } }
  function gunBilgiToast(id) {
    const N = KILIT[id]; if (!N) return;          // home/profil → bilgi yok
    const t = toplamGun(); if (t >= N) return;     // hedefe ulaşıldı → bilgi gösterme
    const kalan = N - t;
    let el = document.getElementById("kilit-toast");
    if (!el) { el = document.createElement("div"); el.id = "kilit-toast"; el.className = "kilit-toast"; document.body.appendChild(el); }
    el.innerHTML = `🌙 <b>${KILIT_AD[id]}</b> · <b>${N}. gün</b> özel açılımına <b>${kalan} gün</b> kaldı (şu an ${t}/${N}) ✨`;
    el.classList.remove("gor"); void el.offsetWidth; el.classList.add("gor");
    clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove("gor"), 3200);
  }
  function kilitGuncelle() {
    const rozet = document.getElementById("profil-rozet");   // 30 gün → İçsel Uyanış rozeti
    if (rozet) rozet.hidden = toplamGun() < 30;
  }
  window.kilitGuncelle = kilitGuncelle;
  kilitGuncelle();

  /* Günün Kartı bildiriminden açılış → Kartlar ekranı */
  if (/[?&]kart=1\b/.test(location.search)) setTimeout(() => gotoView("kartlar"), 400);
  if (navigator.serviceWorker) navigator.serviceWorker.addEventListener("message", e => { if (e.data && e.data.tip === "kart-goster") gotoView("kartlar"); });

  /* ====================================================
     SPİRİTÜEL MÜZİK & FREKANS — js/muzik.js modülünde yönetilir.
        (med-<gün> + med-sure-sn entegrasyonu ve window.setMeditasyonKategori orada)
     ==================================================== */

  /* ====================================================
     3. GÜNÜN RUH HALİ
     ==================================================== */
  const moodKutu = $("#mood-butonlar");
  /* Seçili (henüz kaydedilmemiş olabilir) ruh hali. Bugünün kaydı varsa onu seç. */
  let seciliMood = moodKeyNormalize(Store.get("mood-" + today)) || null;

  MOOD_LIST.forEach(m => {
    const btn = document.createElement("button");
    btn.className = "mood";
    btn.dataset.mood = m.key;
    btn.title = m.label;
    btn.setAttribute("aria-label", m.label);
    btn.innerHTML = moodSvg(m.key) + `<span class="mood-ad">${m.label}</span>`;
    btn.addEventListener("click", () => {     // tıkla = seç (kaydetme)
      seciliMood = m.key;
      isaretleMood();
    });
    moodKutu.appendChild(btn);
  });
  const moodBtns = moodKutu.querySelectorAll(".mood");

  function isaretleMood() {
    moodBtns.forEach(b => b.classList.toggle("aktif", b.dataset.mood === seciliMood));
  }
  $("#mood-kaydet").addEventListener("click", () => {
    if (!seciliMood) { flash("#mood-bilgi", "Önce bir ruh hali seç"); return; }
    Store.set("mood-" + today, seciliMood);   // gün başına tek kayıt; tekrar = güncelle
    flash("#mood-bilgi", "Kaydedildi ✓");
    cizRozetler();
    if (window.tazeleDurum) window.tazeleDurum();   // tüm bağımlı bölümleri tek noktadan tazele
  });

  /* Son 7 gün — yatay mini kartlar (gün adı + ikon) */
  function cizMoodSerit() {
    const serit = $("#mood-serit");
    serit.innerHTML = "";
    lastNDays(7).forEach(gun => {
      const key = moodKeyNormalize(Store.get("mood-" + gun));
      const gunAd = new Date(gun).toLocaleDateString("tr-TR", { weekday: "short" });
      const kart = document.createElement("div");
      kart.className = "mood-gun" + (key ? "" : " bos") + (gun === today ? " bugun" : "");
      kart.title = gun + (key ? " · " + MOOD_META[key].label : "");
      kart.innerHTML = `<span class="gun-ad">${gunAd}</span>` +
        (key ? moodSvg(key) : `<span class="gun-bos">·</span>`);
      serit.appendChild(kart);
    });
  }

  /* Haftalık istatistik: en sık duygu + ortalama + mesaj */
  function cizMoodIstatistik() {
    const kutu = $("#mood-istatistik");
    const kayitlar = lastNDays(7)
      .map(g => moodKeyNormalize(Store.get("mood-" + g)))
      .filter(Boolean);
    if (!kayitlar.length) { kutu.hidden = true; return; }

    const sayim = {};
    let toplamPuan = 0;
    kayitlar.forEach(k => { sayim[k] = (sayim[k] || 0) + 1; toplamPuan += MOOD_META[k].val; });

    // En sık hissedilen (eşitlikte daha yüksek puanlı)
    const enSik = Object.keys(sayim).sort((a, b) =>
      sayim[b] - sayim[a] || MOOD_META[b].val - MOOD_META[a].val)[0];
    const sik = MOOD_META[enSik];

    // Ortalamayı en yakın ruh haline eşle
    const ort = toplamPuan / kayitlar.length;
    const ortMood = MOOD_LIST.reduce((a, b) =>
      Math.abs(b.val - ort) < Math.abs(a.val - ort) ? b : a);

    kutu.hidden = false;
    kutu.innerHTML = `
      <div class="mood-ist-mesaj">${sik.mesaj}</div>
      <div class="mood-ist-alt">${kayitlar.length}/7 gün kayıt · Haftalık ruh hali ortalaması: <strong>${ortMood.label}</strong> (${ort.toFixed(1)}/5)</div>`;
  }

  /* Dışarıdan (sabah ritüeli, bulut senkron) ana sayfa ruh hali bölümünü yenile */
  window.RuhHali = {
    ciz() {
      const k = moodKeyNormalize(Store.get("mood-" + todayKey()));
      if (k) seciliMood = k;
      isaretleMood(); cizMoodSerit(); cizMoodIstatistik();
    }
  };
  /* Ruh hali / günlük veri değişince tüm bağımlı bölümleri TEK noktadan tazele.
     (Ana sayfa ruh hali UI'ı, enerji, aura/çakra, profil, streak, bahçe, haftalık…) */
  window.tazeleDurum = function () {
    ["RuhHali", "Enerji", "Cakra", "Profil", "Streak", "Bahce", "EnerjiTipi", "Hafta"].forEach(m => {
      try { if (window[m] && window[m].ciz) window[m].ciz(); } catch (e) {}
    });
    try { if (window.Nefes && window.Nefes.girisGuncelle) window.Nefes.girisGuncelle(); } catch (e) {}
  };

  isaretleMood();
  cizMoodSerit();
  cizMoodIstatistik();

  /* ====================================================
     4. KART ÇEKME + GEÇMİŞ
     ==================================================== */
  const kartAlani = $("#kart-alani");
  const kartCekBtn = $("#kart-cek");
  const kartTekrarBtn = $("#kart-tekrar");

  const kartLimitNot = $("#kart-limit-not");
  function kartEkle(kart) {
    const wrap = document.createElement("div");
    wrap.className = "kart-icerik";
    const cerceve = document.createElement("div");
    cerceve.className = "kart-gorsel-cerceve";
    const img = document.createElement("img");
    img.src = encodeURI(kart.img);
    img.alt = kart.baslik;
    img.loading = "lazy";
    cerceve.appendChild(img);
    const h = document.createElement("h3");
    h.textContent = kart.baslik;
    const p = document.createElement("p");
    p.textContent = kart.mesaj;
    wrap.append(cerceve, h, p);
    kartAlani.appendChild(wrap);
  }
  // Günde en fazla 2 kart: card-<gün> (1.) + card2-<gün> (2.)
  function gosterKartlar() {
    const idx1 = Store.get("card-" + today);
    const idx2 = Store.get("card2-" + today);
    let sayi = 0;
    kartAlani.innerHTML = "";
    if (idx1 !== null && DATA.kartlar[idx1]) { kartEkle(DATA.kartlar[idx1]); sayi++; }
    if (idx2 !== null && DATA.kartlar[idx2]) { kartEkle(DATA.kartlar[idx2]); sayi++; }
    if (sayi === 0) kartAlani.innerHTML = `<div class="kart-placeholder">Kartını çekmek için butona dokun</div>`;
    kartCekBtn.hidden = sayi >= 1;          // ilk karttan sonra gizle
    kartTekrarBtn.hidden = sayi !== 1;      // tam 1 kart varken "+1 Kart Daha"
    if (kartLimitNot) kartLimitNot.hidden = sayi < 2;
  }
  function kartCek() {
    if (Store.get("card-" + today) === null) Store.set("card-" + today, Math.floor(Math.random() * DATA.kartlar.length));
    gosterKartlar();
  }
  function ikinciKart() {
    if (Store.get("card-" + today) !== null && Store.get("card2-" + today) === null)
      Store.set("card2-" + today, Math.floor(Math.random() * DATA.kartlar.length));
    gosterKartlar();
  }
  gosterKartlar();
  kartCekBtn.addEventListener("click", kartCek);
  kartTekrarBtn.addEventListener("click", ikinciKart);

  /* 5. GÜNÜN RİTÜELİ — js/rituel.js modülünde yönetilir (task-<gün> entegrasyonu orada). */

  /* ====================================================
     6. FARKINDALIK SORUSU
     Sorular Word dosyasından (js/farkindalik-sorulari.js →
     window.FARKINDALIK_SORULARI) gelir; her gün 1 farklı soru.
     ==================================================== */
  const soruHavuzu = (window.FARKINDALIK_SORULARI && window.FARKINDALIK_SORULARI.length)
    ? window.FARKINDALIK_SORULARI : DATA.sorular;
  const soruMetin = $("#soru-metin");
  soruMetin.textContent = pickByDate(soruHavuzu);
  requestAnimationFrame(() => soruMetin.classList.add("gir"));   // zarif fade-in
  const soruCevap = $("#soru-cevap");
  soruCevap.value = Store.get("awa-" + today, "");
  $("#soru-kaydet").addEventListener("click", () => {
    Store.set("awa-" + today, soruCevap.value.trim());
    flash("#soru-bilgi", "Kaydedildi ✓");
  });

  /* ====================================================
     ŞÜKRAN DEFTERİ
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
      span.innerHTML = `<small>${n.tarih}</small><br>${escapeHtml(n.text)}`;
      const sil = document.createElement("button");
      sil.className = "sil";
      sil.textContent = "✕";
      sil.addEventListener("click", () => {
        notlar.splice(i, 1);
        Store.set("gratitude", notlar);
        cizSukran();
        cizRozetler();
        if (window.Bahce) window.Bahce.ciz();
        if (window.Enerji) window.Enerji.ciz();
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
    if (window.Bahce) window.Bahce.ciz();
    if (window.Enerji) window.Enerji.ciz();
  }
  $("#sukran-ekle").addEventListener("click", sukranEkle);
  $("#sukran-input").addEventListener("keydown", e => { if (e.key === "Enter") sukranEkle(); });
  cizSukran();

  /* 9. GÜNLÜK — js/gunluk.js modülünde yönetilir. */

  /* ====================================================
     10. BAŞARIMLAR (kümülatif)
     ==================================================== */
  function gunSayisi(prefix) {
    return Store.allKeys()
      .filter(k => k.startsWith(Store.PREFIX + prefix))
      .filter(k => Store.get(k.slice(Store.PREFIX.length)))   // truthy
      .length;
  }
  function basarimSayaclari() {
    return {
      girisGun:  gunSayisi("visit-"),
      medGun:    gunSayisi("med-"),
      sukranTop: Store.get("gratitude", []).length,
      gorevTop:  gunSayisi("task-"),
      moodSeri:  mevcutSeri("mood-"),
      moodTop:   gunSayisi("mood-")
    };
  }
  function cizRozetler() {
    const sayac = basarimSayaclari();
    const grid = $("#rozet-grid");
    grid.innerHTML = "";
    DATA.rozetler.forEach(r => {
      const deger = sayac[r.metrik] || 0;
      const kazanildi = deger >= r.hedef;
      const yuzde = Math.min(100, Math.round(deger / r.hedef * 100));
      const div = document.createElement("div");
      div.className = "rozet" + (kazanildi ? " kazanildi" : "");
      div.innerHTML = `
        <div class="rozet-madalya">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${r.ikon}</svg>
        </div>
        <div class="rozet-govde">
          <div class="rozet-ad">${escapeHtml(r.ad)}${kazanildi ? " ✦" : ""}</div>
          <div class="rozet-aciklama">${escapeHtml(r.aciklama)}</div>
          <div class="rozet-bar"><span style="width:${yuzde}%"></span></div>
          <div class="rozet-sayi">${Math.min(deger, r.hedef)} / ${r.hedef}</div>
        </div>`;
      grid.appendChild(div);
    });
  }
  cizRozetler();

  /* ====================================================
     11. PROFİL — isim düzenleme (görsel/seviye/grafik js/profil.js'te)
     ==================================================== */
  const profilForm = $("#profil-form");
  const isimInput = $("#profil-isim-input");
  $("#profil-duzenle").addEventListener("click", () => {
    const acik = !profilForm.hidden;
    profilForm.hidden = acik;
    if (!acik) { isimInput.value = (Store.get("profil", {}).isim || ""); isimInput.focus(); }
  });
  function profilKaydet() {
    const p = Store.get("profil", { baslangic: today });
    p.isim = isimInput.value.trim();
    Store.set("profil", p);
    profilForm.hidden = true;
    if (window.Profil) window.Profil.ciz();
    setKarsilama();
  }
  $("#profil-kaydet").addEventListener("click", profilKaydet);
  isimInput.addEventListener("keydown", e => { if (e.key === "Enter") profilKaydet(); });

  /* ====================================================
     12. SPİRİTÜEL MAĞAZA — js/magaza.js modülünde yönetilir.
     ==================================================== */

  /* ====================================================
     13. YEDEKLEME
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
});

/* escapeHtml — global */
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
