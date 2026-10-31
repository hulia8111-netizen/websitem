/* ============================================================
   zikir.js — 🪷 Toplu Mantra (eski Toplu Zikir; aynı sayaç sistemi)
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

  /* 🪷 Mantra kütüphanesi — moderatör formu buradan seçer; ekranda anlamı / yararı / kaynağı gösterilir.
     (Veritabanı aynı: group_zikirs + add_zikir. Kayıt başlığı = mantranın adı → detay buradan bulunur.) */
  const MANTRALAR = [
    { ad: "Om Swastyastu", okunus: "Om Svasti-astu",
      anlam: "“Sana esenlik ve iyilik olsun.” Sanskritçe svasti (esenlik, iyi oluş) ve astu (olsun) kelimelerinden gelir.",
      yarar: "Kalbi açar, karşıdakine ve kendine iyi niyet gönderme alışkanlığı kazandırır; güne yumuşak ve bağlantılı bir başlangıç yaptırır.",
      kaynak: "Bali geleneği. Bali'de günlük selamlaşmadır; insanlar ellerini göğüs hizasında birleştirerek birbirine bu dileği söyler." },
    { ad: "Om Shanti Shanti Shanti", okunus: "Om Şanti Şanti Şanti",
      anlam: "“Barış, barış, barış.” Üç kez söylenir: bedende, sözde ve zihinde (ya da içimizde, çevremizde ve evrende) huzur dileği.",
      yarar: "Sinir sistemini yatıştırır, nefesi yavaşlatır; gerginlik ve kaygı anlarında içsel sessizliğe dönmeye yardım eder.",
      kaynak: "Upanişadlar'daki “barış dualarının” (Şanti mantraları) kapanış sözüdür. Bali'de de dualar ve törenler genellikle bu sözle kapanır." },
    { ad: "Lokah Samastah Sukhino Bhavantu", okunus: "Lokah Samastah Sukino Bavantu",
      anlam: "“Tüm âlemlerdeki bütün varlıklar mutlu ve özgür olsun.”",
      yarar: "Şefkati ve bütünlük duygusunu büyütür; kendi derdinden çıkıp herkes için iyilik dilemek kalbi hafifletir.",
      kaynak: "Hint geleneğinden gelen Sanskritçe bir iyi dilek duası. Günümüzde yoga ve meditasyon derslerinin kapanış mantrası olarak bilinir." },
    { ad: "Om Mani Padme Hum", okunus: "Om Mani Padme Hum",
      anlam: "“Lotustaki mücevher.” Çamurdan doğup tertemiz açan lotus gibi, her kalbin özünde saf bir ışık olduğunu hatırlatır.",
      yarar: "Şefkat ve merhamet mantrası olarak bilinir; yargıyı yumuşatır, kalbe sabır ve sevgi getirir.",
      kaynak: "Tibet Budizmi'nin en bilinen mantrası; şefkatin sembolü Avalokiteşvara ile ilişkilendirilir. İlk kez Karandavyuha Sutra'da (yaklaşık MS 4.–5. yüzyıl) geçer." },
    { ad: "So Hum", okunus: "So Ham",
      anlam: "“Ben O'yum” — ben de bütünün, evrenin bir parçasıyım.",
      yarar: "Nefes mantrasıdır: nefes alırken içinden “So”, verirken “Ham” denir. Zihni nefese bağlar, odak ve dinginlik getirir.",
      kaynak: "Kökü Upanişadlar'a (İşa Upanişad'daki “so 'ham asmi” – “O benim” ifadesi) dayanır; yoga geleneğinde doğal nefes mantrası olarak kullanılır." },
    { ad: "Gayatri Mantra", okunus: "Om Bur Buva Svaha · Tat Savitur Vareniyam · Bargo Devasya Dimahi · Diyo Yo Nah Praçodayat",
      anlam: "“Varoluşun tüm katmanlarını aydınlatan o kutsal ışığın parlaklığı üzerine düşünürüz; o ışık zihnimizi aydınlatsın.”",
      yarar: "Berraklık ve farkındalık mantrası olarak bilinir; zihni toparlar, güne ya da meditasyona aydınlık bir niyetle başlatır.",
      kaynak: "Bilinen en eski mantralardandır: Rigveda'da (3.62.10) yer alır ve bilge Vişvamitra'ya atfedilir. Bali'de günde üç kez okunan Puja Trisandhya duasının ilk bölümüdür." }
  ];
  function mantraBul(ad) { const a = String(ad || "").trim().toLowerCase(); return MANTRALAR.find(m => m.ad.toLowerCase() === a) || null; }
  // Eski dini zikir kayıtları (ör. Salavat) mantra listesinde görünmesin
  const ESKI_ZIKIR = /salavat|zikir|tesbih|esma|allah|subhan|sübhan|elhamd|estağfir|kelime-i|lailahe/i;

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
      return (data || []).filter(z => !ESKI_ZIKIR.test((z.title || "") + " " + (z.zikir_text || "")));
    } catch (e) { return null; }
  }
  async function tekZikir(id) {
    const c = sb(); if (!c) return null;
    try { const { data } = await c.from("group_zikirs").select("*").eq("id", id).maybeSingle(); return data || null; } catch (e) { return null; }
  }

  /* ---------- Moderatör (yalnız sen): yeni zikir başlat / listeden kaldır ---------- */
  function moderatorMu() {
    try { const em = (window.Bulut && Bulut.durum ? (Bulut.durum().email || "") : "").toLowerCase(); if (em === "hulia8111@gmail.com") return true; } catch (e) {}
    return !!(window.ToplulukSosyal && ToplulukSosyal.moderatorMuCached && ToplulukSosyal.moderatorMuCached());
  }
  function formHTML() {
    return `<div class="zk-form">
      <div class="zk-form-bas">🛡️ Yeni Toplu Mantra <span class="muted small">(yalnız sana görünür)</span></div>
      <select class="td-inp" id="zk-f-sec">
        <option value="">Kütüphaneden mantra seç…</option>
        ${MANTRALAR.map((m, i) => `<option value="${i}">${esc(m.ad)}</option>`).join("")}
      </select>
      <input class="td-inp" id="zk-f-baslik" maxlength="80" placeholder="Mantranın adı (ör. Om Shanti Shanti Shanti)"/>
      <input class="td-inp" id="zk-f-metin" maxlength="200" placeholder="Okunuşu (Türkçe harflerle)"/>
      <input class="td-inp" id="zk-f-aciklama" maxlength="160" placeholder="Kısa anlamı / niyet (isteğe bağlı)"/>
      <input class="td-inp" id="zk-f-hedef" type="number" inputmode="numeric" min="1" step="1" placeholder="Hedef adet (ör. 10000)"/>
      <button class="btn" type="button" id="zk-f-ekle">🪷 Mantrayı başlat</button>
      <p class="td-durum" id="zk-f-bilgi"></p>
    </div>`;
  }
  async function zikirEkle(govde) {
    const al = id => ((govde.querySelector(id) || {}).value || "").trim();
    const bil = govde.querySelector("#zk-f-bilgi");
    const yaz = (m, hata) => { bil.textContent = m; bil.style.color = hata ? "var(--uyari)" : "var(--basari)"; };
    const title = al("#zk-f-baslik"), hedef = parseInt(al("#zk-f-hedef").replace(/\D/g, ""), 10);
    if (!title) return yaz("Mantranın adını yaz 🙏", true);
    if (!(hedef > 0)) return yaz("Hedef adedi gir (ör. 10000)", true);
    const c = sb(); if (!c) return yaz("Bağlantı yok", true);
    const btn = govde.querySelector("#zk-f-ekle"); btn.disabled = true; yaz("Başlatılıyor…");
    try {
      const { error } = await c.from("group_zikirs").insert({ title, zikir_text: al("#zk-f-metin") || null, description: al("#zk-f-aciklama") || null, target_count: hedef });
      if (error) throw error;
      await cizListe(govde);
    } catch (e) {
      const m = String((e && e.message) || e);
      yaz(/row-level security|policy/i.test(m) ? "İzin yok: önce supabase/zikir-moderator.sql çalıştırılmalı." : "⚠️ " + m, true);
      btn.disabled = false;
    }
  }
  async function zikirKaldir(govde, id) {
    if (!confirm("Bu mantra listeden kaldırılsın mı? (Sayılar silinmez, sadece gizlenir)")) return;
    const c = sb(); if (!c) return;
    try {
      const { error } = await c.from("group_zikirs").update({ is_active: false }).eq("id", id);
      if (error) { alert(/row-level security|policy/i.test(error.message || "") ? "İzin yok: önce supabase/zikir-moderator.sql çalıştırılmalı." : error.message); return; }
    } catch (e) {}
    await cizListe(govde);
  }

  /* ---------- Topluluk sekmesi: liste ---------- */
  function ilerleme(cur, hedef) { return hedef > 0 ? Math.min(100, (cur / hedef) * 100) : 0; }
  function kartHTML(z) {
    const bitti = !!z.completed_at, m = mantraBul(z.title);
    const kisa = m ? m.anlam : z.description;
    return `<button class="zk-kart" type="button" data-zikir="${esc(z.id)}">
      <div class="zk-k-bas">🪷 ${esc(z.title)}</div>
      ${z.zikir_text ? `<div class="zk-k-okunus">“${esc(z.zikir_text)}”</div>` : ""}
      ${kisa ? `<div class="zk-k-aciklama">${esc(kisa)}</div>` : ""}
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
      govde.innerHTML = `<div class="tp-bilgi">🌙 Toplu mantra için internet bağlantısı gerekiyor. Bağlanınca burası kendiliğinden yenilenir.</div>`;
      return;
    }
    govde.innerHTML = `<div class="tp-bilgi">🪷 Toplu mantralar yükleniyor…</div>`;
    eskiBekleyenleriGonder();
    const liste = await aktifler();
    if (listeGovde !== govde) return;   // bu arada başka sekmeye geçildi
    if (liste === null) { govde.innerHTML = `<div class="ts-bos">Toplu mantralar şu an yüklenemedi. Biraz sonra tekrar dene 🌿</div>`; return; }
    const mod = moderatorMu();
    govde.innerHTML = (mod ? formHTML() : "") +
      `<p class="zk-giris muted small">Bali'de olduğu gibi, hep birlikte tek niyetle 🤍 Bir mantraya dokun, sayaç açılsın; her tekrarında bir kez dokun. Kimin ne kadar okuduğu görünmez; sadece toplam ve katılımcı sayısı.</p>` +
      (liste.length
        ? `<div class="zk-liste">${liste.map(z => `<div class="zk-sarmal">${kartHTML(z)}${mod ? `<button class="td-mini td-sil zk-kaldir" type="button" data-zk-kaldir="${esc(z.id)}">🙈 Listeden kaldır</button>` : ""}</div>`).join("")}</div>`
        : `<div class="ts-bos">Şu an aktif toplu mantra yok 🌙${mod ? " Yukarıdan ilk mantrayı başlat ✨" : ""}</div>`);
    govde.querySelectorAll("[data-zikir]").forEach(b => b.addEventListener("click", () => {
      const z = liste.find(x => x.id === b.dataset.zikir); if (z) ac(z);
    }));
    if (mod) {
      const e = govde.querySelector("#zk-f-ekle"); if (e) e.addEventListener("click", () => zikirEkle(govde));
      const s = govde.querySelector("#zk-f-sec");
      if (s) s.addEventListener("change", () => {
        const m = MANTRALAR[+s.value]; if (!m) return;
        govde.querySelector("#zk-f-baslik").value = m.ad;
        govde.querySelector("#zk-f-metin").value = m.okunus;
        govde.querySelector("#zk-f-aciklama").value = m.anlam.slice(0, 160);
      });
      govde.querySelectorAll("[data-zk-kaldir]").forEach(b => b.addEventListener("click", () => zikirKaldir(govde, b.dataset.zkKaldir)));
    }
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
        '<details class="zk-detay" id="zk-detay"><summary>ℹ️ Anlamı · Yararı · Kaynağı</summary><div id="zk-detay-ic"></div></details>' +
        '<div class="zk-bar buyuk"><span id="zk-bar"></span></div>' +
        '<div class="zk-sayilar"><b id="zk-toplam"></b><span id="zk-katilimci"></span></div>' +
        '<div class="zk-orta" id="zk-orta"></div>' +
        '<p class="zk-ipucu muted small" id="zk-ipucu">Her okuyuşta bir kez dokun</p>' +
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
      orta.innerHTML = '<div class="zk-tamam"><div class="zk-tamam-ikon">🪷</div><div>Mantra tamamlandı.<br>Ortak niyetimiz evrene ulaştı 🤍</div></div>';
      ov.querySelector("#zk-ipucu").hidden = true;
    } else {
      let b = orta.querySelector(".zk-buton");
      if (!b) {
        orta.innerHTML = '<button class="zk-buton" type="button" aria-label="Mantrayı say"><span id="zk-benim">0</span></button>';
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
    const mk = mantraBul(z.title);
    const okunus = z.zikir_text || (mk && mk.okunus) || "";
    ov.querySelector("#zk-baslik").textContent = "🪷 " + z.title;
    ov.querySelector("#zk-metin").textContent = okunus;
    ov.querySelector("#zk-metin").hidden = !okunus;
    ov.querySelector("#zk-aciklama").textContent = mk ? "" : (z.description || "");
    ov.querySelector("#zk-aciklama").hidden = !!mk || !z.description;
    const detay = ov.querySelector("#zk-detay");
    detay.hidden = !mk; detay.open = false;
    ov.querySelector("#zk-detay-ic").innerHTML = mk
      ? `<p><b>✨ Anlamı:</b> ${esc(mk.anlam)}</p><p><b>🌿 Yararı:</b> ${esc(mk.yarar)}</p><p><b>📜 Kaynağı:</b> ${esc(mk.kaynak)}</p>`
      : "";
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
