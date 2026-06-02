/* ============================================================
   bildirim.js — Günlük Spiritüel Bildirim Sistemi 🔔
   Web Notifications API (uygulama açıkken) + her durumda çalışan
   premium in-app toast. Günlük saat, kategoriler, çift saat,
   akıllı tetikleyiciler (uzak kalma, düşük mod, streak riski),
   sessiz mod, gece rahatsız etmeme ve haftalık özet.
   Not: Statik uygulamada arka plan push yoktur; bildirimler
   uygulama açıkken tetiklenir. Tercihler localStorage'da.
   Global: window.Bildirim
   ============================================================ */

const Bildirim = window.Bildirim = (() => {
  const $ = sel => document.querySelector(sel);
  const AYAR = "bildirim-ayar";
  const LOG = "bildirim-log";

  const KATEGORILER = [
    { id: "olumlama",   ad: "Günlük Olumlama" },
    { id: "ciftSaat",   ad: "Çift Saat Mesajları" },
    { id: "ruhHali",    ad: "Ruh Hali Hatırlatması" },
    { id: "meditasyon", ad: "Meditasyon Zamanı" },
    { id: "sukran",     ad: "Şükran Hatırlatması" },
    { id: "kart",       ad: "Günün Kartı" }
  ];
  const VARSAYILAN = {
    aktif: false, saat: "09:00", sessiz: false,
    gece: true, geceBas: "22:00", geceBit: "08:00", haftalik: true,
    kategori: { olumlama: true, ciftSaat: true, ruhHali: true, meditasyon: true, sukran: true, kart: true }
  };

  const destekVar = "Notification" in window;
  let toastEl = null;

  /* ---------- ayar ---------- */
  function ayarAl() { return Object.assign({}, VARSAYILAN, Store.get(AYAR, {})); }
  function ayarYaz(a) { Store.set(AYAR, a); }
  function logAl() { return Store.get(LOG, {}); }
  function logYaz(l) { Store.set(LOG, l); }

  /* ---------- izin ---------- */
  function izinDurum() { return destekVar ? Notification.permission : "yok"; }
  function izinVar() { return destekVar && Notification.permission === "granted"; }
  function izinIste() {
    if (!destekVar) return;
    Notification.requestPermission().then(() => { izinCiz(); });
  }

  /* ---------- mesaj seçimi ---------- */
  function rast(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function mesaj(kat) { const m = DATA.bildirimMesajlari[kat]; return m ? rast(m) : ""; }
  function gunlukMesaj() {
    const ayar = ayarAl();
    const acik = KATEGORILER.map(k => k.id)
      .filter(id => id !== "ciftSaat" && ayar.kategori[id]);
    if (!acik.length) return mesaj("olumlama");
    return mesaj(rast(acik));
  }

  /* ---------- gönderim ---------- */
  function geceDndAktif(ayar, now = new Date()) {
    if (!ayar.gece) return false;
    const dk = now.getHours() * 60 + now.getMinutes();
    const [bh, bm] = ayar.geceBas.split(":").map(Number);
    const [eh, em] = ayar.geceBit.split(":").map(Number);
    const bas = bh * 60 + bm, bit = eh * 60 + em;
    return bas <= bit ? (dk >= bas && dk < bit) : (dk >= bas || dk < bit); // gece aşımı
  }
  function gonderilebilir() {
    const ayar = ayarAl();
    return ayar.aktif && !ayar.sessiz && !geceDndAktif(ayar);
  }
  function toast(metin) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "bildirim-toast";
      toastEl.innerHTML = `<span class="bt-ikon">🔔</span><span class="bt-metin"></span>`;
      document.body.appendChild(toastEl);
    }
    toastEl.querySelector(".bt-metin").textContent = metin;
    toastEl.classList.add("gor");
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(() => toastEl.classList.remove("gor"), 5500);
  }
  function bildir(metin) {
    if (!metin) return;
    toast(metin);
    if (izinVar() && document.hidden) {
      try { new Notification("Işığını Bul ✨", { body: metin, icon: "icon.svg", silent: true }); } catch (e) {}
    }
  }
  /* zorla = ayar/DND kontrolü olmadan (ör. "dene" butonu) */
  function tetikle(metin, zorla) {
    if (zorla || gonderilebilir()) bildir(metin);
  }

  /* ---------- günlük log (tekrarı önle) ---------- */
  function dahaOnce(tip, deger) { return logAl()[tip] === deger; }
  function isaretle(tip, deger) { const l = logAl(); l[tip] = deger; logYaz(l); }

  /* ---------- zamanlayıcı ---------- */
  function hhmm(d = new Date()) { return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); }
  function tick() {
    if (!gonderilebilir()) return;
    const ayar = ayarAl();
    const now = new Date();
    const t = hhmm(now);
    const gun = todayKey();

    // Günlük hatırlatma saati
    if (t === ayar.saat && !dahaOnce("gunluk", gun)) {
      isaretle("gunluk", gun);
      bildir(gunlukMesaj());
    }
    // Çift/ayna saat bildirimleri js/ciftsaat.js modülünde yönetilir.
  }

  /* ---------- akıllı kontroller (açılışta) ---------- */
  function akilli() {
    if (!gonderilebilir()) return;
    const gun = todayKey();
    const now = new Date();

    // 1) Uzun süre uzak kalma
    const ziyaretler = (typeof gunAnahtarlari === "function") ? gunAnahtarlari("visit-") : [];
    const oncekiler = ziyaretler.filter(g => g !== gun);
    if (oncekiler.length) {
      const son = keyToDate(oncekiler[oncekiler.length - 1]);
      const fark = Math.round((keyToDate(gun) - son) / 86400000);
      if (fark >= 3 && !dahaOnce("uzak", gun)) { isaretle("uzak", gun); bildir(mesaj("uzakKaldin")); return; }
    }
    // 2) Streak riski (akşam, bugün hiçbir şey yapılmadıysa)
    const seri = (typeof mevcutSeri === "function") ? mevcutSeri("visit-") : 0;
    const bugunAktif = Store.get("mood-" + gun) || Store.get("med-" + gun) || Store.get("task-" + gun) ||
      (Store.get("gratitude", []) || []).some(n => n.tarih === gun);
    if (seri >= 2 && !bugunAktif && now.getHours() >= 18 && !dahaOnce("streak", gun)) {
      isaretle("streak", gun); bildir(mesaj("streakUyari")); return;
    }
    // 3) Düşük ruh hali → yumuşak destek
    const mood = (typeof moodKeyNormalize === "function") ? moodKeyNormalize(Store.get("mood-" + gun)) : null;
    if ((mood === "low" || mood === "down") && !dahaOnce("dusuk", gun)) {
      isaretle("dusuk", gun); bildir(mesaj("dusukMod")); return;
    }
    // 4) Haftalık özet (her ISO haftada bir kez)
    const ayar = ayarAl();
    const hafta = weekId(now);
    if (ayar.haftalik && !dahaOnce("haftalik", hafta)) {
      isaretle("haftalik", hafta); bildir(mesaj("haftalik"));
    }
  }

  /* ---------- UI ---------- */
  function izinCiz() {
    const kutu = $("#bildirim-izin");
    if (!kutu) return;
    if (!destekVar) { kutu.innerHTML = `<p class="muted small">Bu cihaz/tarayıcı sistem bildirimlerini desteklemiyor; mesajlar uygulama içinde gösterilir.</p>`; return; }
    const d = izinDurum();
    if (d === "granted") kutu.innerHTML = `<p class="bld-izinli">Bildirim izni verildi ✓</p>`;
    else if (d === "denied") kutu.innerHTML = `<p class="muted small">Bildirim izni reddedildi. Tarayıcı ayarlarından açabilirsin (uygulama içi mesajlar yine çalışır).</p>`;
    else kutu.innerHTML = `<button class="btn ghost" id="bld-izin-btn">Bildirimlere izin ver</button>`;
    const b = $("#bld-izin-btn");
    if (b) b.addEventListener("click", izinIste);
  }

  function detayGoster(aktif) {
    const d = $("#bld-detay");
    if (d) d.style.display = aktif ? "block" : "none";
  }

  function ciz() {
    if (!$("#bildirim")) return;
    const ayar = ayarAl();
    izinCiz();

    $("#bld-aktif").checked = ayar.aktif;
    $("#bld-saat").value = ayar.saat;
    $("#bld-sessiz").checked = ayar.sessiz;
    $("#bld-gece").checked = ayar.gece;
    $("#bld-gece-bas").value = ayar.geceBas;
    $("#bld-gece-bit").value = ayar.geceBit;
    $("#bld-haftalik").checked = ayar.haftalik;
    detayGoster(ayar.aktif);

    // kategori çipleri
    const kk = $("#bld-kategoriler");
    kk.innerHTML = "";
    KATEGORILER.forEach(k => {
      const b = document.createElement("button");
      b.className = "bld-cip" + (ayar.kategori[k.id] ? " aktif" : "");
      b.textContent = k.ad;
      b.addEventListener("click", () => {
        const a = ayarAl(); a.kategori[k.id] = !a.kategori[k.id]; ayarYaz(a);
        b.classList.toggle("aktif", a.kategori[k.id]);
      });
      kk.appendChild(b);
    });
  }

  function baglan() {
    if (!$("#bildirim")) return;
    ciz();

    $("#bld-aktif").addEventListener("change", e => {
      const a = ayarAl(); a.aktif = e.target.checked; ayarYaz(a);
      detayGoster(a.aktif);
      if (a.aktif && destekVar && Notification.permission === "default") izinIste();
    });
    $("#bld-saat").addEventListener("change", e => { const a = ayarAl(); a.saat = e.target.value || "09:00"; ayarYaz(a); });
    $("#bld-sessiz").addEventListener("change", e => { const a = ayarAl(); a.sessiz = e.target.checked; ayarYaz(a); });
    $("#bld-gece").addEventListener("change", e => { const a = ayarAl(); a.gece = e.target.checked; ayarYaz(a); });
    $("#bld-gece-bas").addEventListener("change", e => { const a = ayarAl(); a.geceBas = e.target.value || "22:00"; ayarYaz(a); });
    $("#bld-gece-bit").addEventListener("change", e => { const a = ayarAl(); a.geceBit = e.target.value || "08:00"; ayarYaz(a); });
    $("#bld-haftalik").addEventListener("change", e => { const a = ayarAl(); a.haftalik = e.target.checked; ayarYaz(a); });
    $("#bld-dene").addEventListener("click", () => tetikle(gunlukMesaj() || mesaj("olumlama"), true));

    // Zamanlayıcı + açılış akıllı kontrolü
    setInterval(tick, 20000);
    setTimeout(akilli, 3500);
  }

  document.addEventListener("DOMContentLoaded", baglan);
  return { tetikle, gunlukMesaj, mesaj, geceDndAktif };
})();
