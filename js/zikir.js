/* ============================================================
   zikir.js — 📿 Toplu Zikir (zikirmatik)
   ------------------------------------------------------------
   Supabase: group_zikirs (herkes okur) + add_zikir(p_zikir_id,
   p_client_id, p_amount) RPC (supabase toplu_zikir.sql — kullanıcı
   kendisi çalıştırır). Sayı yalnız RPC ile artar.
   • Topluluk › "📿 Toplu Zikir" sekmesi: aktif zikirler (ilerleme,
     toplam adet / hedef, katılımcı sayısı) — İSİM GÖSTERİLMEZ.
   • Zikirmatik: büyük buton; dokunuşlar 2 sn'de bir TOPLU gönderilir,
     ekrandan çıkarken / arka plana geçerken kalanlar gönderilir.
     İnternet yoksa bekleyenler cihazda saklanır, sonra gönderilir.
   • Kişi başı toplam sınır YOK (sunucu yalnız bot hızını sınırlar).
   • Başkalarının çektikleri Realtime ile canlı yansır (+ yedek yoklama).
   Global: window.Zikir
   ============================================================ */
const Zikir = window.Zikir = (() => {
  const KIMLIK = "kdm_group-zikir-client-id";   // anonim cihaz kimliği (sunucuda hash'lenir)
  const BEKLEYEN = "kdm_zikir-bekleyen";          // { zikirId: adet } — gönderilemeyenler
  let ov = null, aktif = null, kanal = null, yoklama = null, gonderTimer = null;
  let sunucu = 0, katilimci = 0, tamam = false, bekleyen = 0, ucuyor = 0, benim = 0, gonderiliyor = false;
  let listeGovde = null;

  function sb() { try { return window.Bulut && Bulut.client ? Bulut.client() : null; } catch (e) { return null; } }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  function bicim(n) { return String(Math.max(0, n | 0)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }

  /* Anonim katılımcı kimliği: girişliyse kullanıcı id'si, değilse cihazda üretilen rastgele id */
  function kimlik() {
    try { const u = window.Bulut && Bulut.kullaniciId && Bulut.kullaniciId(); if (u) return u; } catch (e) {}
    let id = null;
    try { id = localStorage.getItem(KIMLIK); } catch (e) {}
    if (!id) {
      id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID()
        : "z" + Date.now().toString(36) + Math.random().toString(36).slice(2, 12);
      try { localStorage.setItem(KIMLIK, id); } catch (e) {}
    }
    return id;
  }

  /* ---------- gönderilemeyen dokunuşlar (internetsiz) ---------- */
  function bekleyenAl() { try { return JSON.parse(localStorage.getItem(BEKLEYEN) || "{}") || {}; } catch (e) { return {}; } }
  function bekleyenYaz(m) { try { localStorage.setItem(BEKLEYEN, JSON.stringify(m)); } catch (e) {} }
  function bekleyeneEkle(id, n) { if (n <= 0) return; const m = bekleyenAl(); m[id] = (m[id] || 0) + n; bekleyenYaz(m); }
  async function eskiBekleyenleriGonder() {
    const c = sb(); if (!c || navigator.onLine === false) return;
    const m = bekleyenAl(); const ids = Object.keys(m); if (!ids.length) return;
    for (const id of ids) {
      if (aktif && aktif.id === id) continue;   // açık ekran kendi gönderiyor
      try {
        const { error } = await c.rpc("add_zikir", { p_zikir_id: id, p_client_id: kimlik(), p_amount: m[id] });
        // Hata "aktif değil / tamamlandı" ise de bekleyeni temizle (gönderilecek yer kalmadı)
        if (!error || /aktif|tamamland|Gecersiz/i.test(error.message || "")) { const s = bekleyenAl(); delete s[id]; bekleyenYaz(s); }
      } catch (e) { /* ağ: sonra tekrar */ }
    }
  }

  /* ---------- veri ---------- */
  async function aktifler() {
    const c = sb(); if (!c) return null;
    try {
      const { data, error } = await c.from("group_zikirs").select("*").eq("is_active", true).order("created_at", { ascending: false });
      if (error) return null;
      return data || [];
    } catch (e) { return null; }
  }
  async function tekZikir(id) {
    const c = sb(); if (!c) return null;
    try { const { data } = await c.from("group_zikirs").select("*").eq("id", id).maybeSingle(); return data || null; } catch (e) { return null; }
  }

  /* ---------- Topluluk sekmesi: liste ---------- */
  function ilerleme(cur, hedef) { return hedef > 0 ? Math.min(100, (cur / hedef) * 100) : 0; }
  function kartHTML(z) {
    const bitti = !!z.completed_at;
    return `<button class="zk-kart" type="button" data-zikir="${esc(z.id)}">
      <div class="zk-k-bas">📿 ${esc(z.title)}</div>
      ${z.description ? `<div class="zk-k-aciklama">${esc(z.description)}</div>` : ""}
      <div class="zk-bar"><span style="width:${ilerleme(z.current_count, z.target_count).toFixed(1)}%"></span></div>
      <div class="zk-k-alt">
        <span>${bitti ? "✅ Tamamlandı" : `${bicim(z.current_count)} / ${bicim(z.target_count)}`}</span>
        <span>${bicim(z.participant_count)} katılımcı</span>
      </div>
    </button>`;
  }
  async function cizListe(govde) {
    listeGovde = govde;
    if (navigator.onLine === false) {
      govde.innerHTML = `<div class="tp-bilgi">🌙 Toplu zikir için internet bağlantısı gerekiyor. Bağlanınca burası kendiliğinden yenilenir.</div>`;
      return;
    }
    govde.innerHTML = `<div class="tp-bilgi">📿 Toplu zikirler yükleniyor…</div>`;
    eskiBekleyenleriGonder();
    const liste = await aktifler();
    if (listeGovde !== govde) return;   // bu arada başka sekmeye geçildi
    if (liste === null) { govde.innerHTML = `<div class="ts-bos">Toplu zikirler şu an yüklenemedi. Biraz sonra tekrar dene 🌿</div>`; return; }
    govde.innerHTML = `<p class="zk-giris muted small">Hep birlikte, tek niyetle 🤍 Bir zikre dokun, zikirmatik açılsın. Kimin ne kadar çektiği görünmez; sadece toplam ve katılımcı sayısı.</p>` +
      (liste.length ? `<div class="zk-liste">${liste.map(kartHTML).join("")}</div>` : `<div class="ts-bos">Şu an aktif toplu zikir yok 🌙</div>`);
    govde.querySelectorAll("[data-zikir]").forEach(b => b.addEventListener("click", () => {
      const z = liste.find(x => x.id === b.dataset.zikir); if (z) ac(z);
    }));
  }

  /* ---------- Zikirmatik ekranı ---------- */
  function kur() {
    if (ov) return ov;
    ov = document.createElement("div");
    ov.className = "zk-overlay"; ov.id = "zikir-overlay"; ov.hidden = true;
    ov.innerHTML =
      '<div class="zk-ic">' +
        '<div class="zk-ust"><span class="zk-baslik" id="zk-baslik"></span><button class="zk-kapat" type="button" aria-label="Kapat">✕</button></div>' +
        '<div class="zk-metin" id="zk-metin"></div>' +
        '<div class="zk-aciklama muted small" id="zk-aciklama"></div>' +
        '<div class="zk-bar buyuk"><span id="zk-bar"></span></div>' +
        '<div class="zk-sayilar"><b id="zk-toplam"></b><span id="zk-katilimci"></span></div>' +
        '<div class="zk-orta" id="zk-orta"></div>' +
        '<p class="zk-ipucu muted small" id="zk-ipucu">Çekmek için dokun</p>' +
      '</div>';
    document.body.appendChild(ov);
    if (window.OverlayGeri && OverlayGeri.izle) OverlayGeri.izle(ov);   // telefon GERİ tuşu kapatsın
    ov.querySelector(".zk-kapat").addEventListener("click", kapat);
    return ov;
  }
  function gosterilen() { return aktif ? Math.min(sunucu + ucuyor + bekleyen, aktif.target_count) : 0; }
  function guncelle() {
    if (!ov || !aktif) return;
    const g = gosterilen();
    ov.querySelector("#zk-bar").style.width = ilerleme(g, aktif.target_count).toFixed(2) + "%";
    ov.querySelector("#zk-toplam").textContent = `${bicim(g)} / ${bicim(aktif.target_count)}`;
    ov.querySelector("#zk-katilimci").textContent = `${bicim(katilimci)} katılımcı`;
    const orta = ov.querySelector("#zk-orta");
    if (tamam) {
      orta.innerHTML = '<div class="zk-tamam"><div class="zk-tamam-ikon">✅</div><div>Zikir tamamlandı.<br>Allah kabul etsin 🤍</div></div>';
      ov.querySelector("#zk-ipucu").hidden = true;
    } else {
      let b = orta.querySelector(".zk-buton");
      if (!b) {
        orta.innerHTML = '<button class="zk-buton" type="button" aria-label="Zikir çek"><span id="zk-benim">0</span></button>';
        b = orta.querySelector(".zk-buton");
        b.addEventListener("pointerdown", e => { e.preventDefault(); dokun(); });
        b.addEventListener("keydown", e => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); dokun(); } });
      }
      orta.querySelector("#zk-benim").textContent = bicim(benim);
      ov.querySelector("#zk-ipucu").hidden = false;
    }
  }
  function dokun() {
    if (!aktif || tamam || gosterilen() >= aktif.target_count) return;
    bekleyen++; benim++;
    try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) {}
    const b = ov.querySelector(".zk-buton"); if (b) { b.classList.remove("vur"); void b.offsetWidth; b.classList.add("vur"); }
    guncelle();
  }
  async function gonder() {
    if (!aktif || bekleyen === 0 || gonderiliyor || tamam) return;
    const c = sb(); if (!c) return;
    if (navigator.onLine === false) return;   // internet gelince gönderilir
    gonderiliyor = true;
    ucuyor = bekleyen; bekleyen = 0;
    const id = aktif.id;
    try {
      const { data, error } = await c.rpc("add_zikir", { p_zikir_id: id, p_client_id: kimlik(), p_amount: ucuyor });
      if (error) throw error;
      ucuyor = 0;
      if (aktif && aktif.id === id && data) {
        sunucu = Math.max(sunucu, data.current_count | 0);
        katilimci = Math.max(katilimci, data.participant_count | 0);
        tamam = tamam || !!data.completed;
      }
    } catch (e) {
      const m = String((e && e.message) || "");
      if (/aktif|tamamland/i.test(m)) { tamam = true; ucuyor = 0; }   // zikir kapandı / doldu
      else { bekleyen += ucuyor; ucuyor = 0; }                        // ağ: sonra tekrar dene
    } finally {
      gonderiliyor = false;
      guncelle();
    }
  }
  /* Ekran kapanırken / uygulama kapanırken kalanları kaybetme: gönder, olmazsa cihaza yaz */
  function kalanlariKurtar() {
    if (!aktif) return;
    const kalan = bekleyen + ucuyor;
    if (kalan > 0 && !tamam) { bekleyeneEkle(aktif.id, bekleyen); bekleyen = 0; }
  }

  function canliBaslat(id) {
    const c = sb(); if (!c) return;
    try {
      kanal = c.channel("zikir-" + id)
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "group_zikirs", filter: "id=eq." + id }, p => {
          const z = p && p.new; if (!z || !aktif || z.id !== aktif.id) return;
          sunucu = Math.max(sunucu, z.current_count | 0);
          katilimci = Math.max(katilimci, z.participant_count | 0);
          tamam = tamam || !!z.completed_at;
          guncelle();
        }).subscribe();
    } catch (e) {}
    // Yedek: Realtime çalışmazsa 10 sn'de bir tazele
    yoklama = setInterval(async () => {
      if (!aktif || document.visibilityState !== "visible" || navigator.onLine === false) return;
      const z = await tekZikir(aktif.id); if (!z || !aktif || z.id !== aktif.id) return;
      sunucu = Math.max(sunucu, z.current_count | 0); katilimci = Math.max(katilimci, z.participant_count | 0);
      tamam = tamam || !!z.completed_at; guncelle();
    }, 10000);
  }
  function canliDurdur() {
    try { const c = sb(); if (kanal && c) c.removeChannel(kanal); } catch (e) {}
    kanal = null; clearInterval(yoklama); yoklama = null;
  }

  function ac(z) {
    kur();
    aktif = z; sunucu = z.current_count | 0; katilimci = z.participant_count | 0; tamam = !!z.completed_at;
    bekleyen = 0; ucuyor = 0; benim = 0;
    // Bu zikir için daha önce gönderilemeyenler varsa önce onları kuyruğa al
    const m = bekleyenAl(); if (m[z.id]) { bekleyen = m[z.id]; delete m[z.id]; bekleyenYaz(m); }
    ov.querySelector("#zk-baslik").textContent = "📿 " + z.title;
    ov.querySelector("#zk-metin").textContent = z.zikir_text || "";
    ov.querySelector("#zk-metin").hidden = !z.zikir_text;
    ov.querySelector("#zk-aciklama").textContent = z.description || "";
    ov.querySelector("#zk-aciklama").hidden = !z.description;
    ov.querySelector("#zk-orta").innerHTML = "";
    guncelle();
    ov.hidden = false;
    document.body.classList.add("zk-aktif");
    gonderTimer = setInterval(gonder, 2000);
    canliBaslat(z.id);
  }
  function kapat() {
    if (!ov || ov.hidden) return;
    const kapanan = aktif;
    gonder().finally(() => { if (aktif === kapanan) { kalanlariKurtar(); aktif = null; } });
    clearInterval(gonderTimer); gonderTimer = null;
    canliDurdur();
    ov.hidden = true;
    document.body.classList.remove("zk-aktif");
    if (listeGovde && document.body.contains(listeGovde)) cizListe(listeGovde);   // sayılar tazelensin
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") { gonder(); kalanlariKurtar(); }
  });
  window.addEventListener("pagehide", () => { kalanlariKurtar(); });
  window.addEventListener("online", () => { gonder(); eskiBekleyenleriGonder(); });
  document.addEventListener("DOMContentLoaded", () => setTimeout(eskiBekleyenleriGonder, 12000));

  return { cizListe, ac, kapat };
})();
