/* ============================================================
   dokunmaipucu.js — "Dokunma İpucu" 👆  (reusable tap hint)
   ------------------------------------------------------------
   Bir butonun / etkileşimli alanın üzerinde zarif bir parmak-ucu
   dokunma animasyonu gösterir: kullanıcıya "buraya dokun" der.

   - Kısa, yumuşak; birkaç kez oynar sonra kendiliğinden kaybolur.
   - pointer-events YOK → altındaki butonun tıklanmasını ENGELLEMEZ.
   - tekSefer: aynı ipucu (id) bir kez görülünce tekrar çıkmaz (Store).
   - Hedefe (veya boş bir yere) dokununca anında kapanır + görüldü işaretlenir.
   - prefers-reduced-motion: yol animasyonu yerine sade nabız.

   Kullanım (her ekranda tekrar kullanılabilir):
     DokunmaIpucu.goster("#kart-cek", { id: "kart-cek-ilk" });
     DokunmaIpucu.goster(elem,       { id: "x", tekrar: 3 });
     DokunmaIpucu.gizle();
     DokunmaIpucu.sifirla("kart-cek-ilk");   // tekrar gösterilebilir yap

   Global: window.DokunmaIpucu
   ============================================================ */

const DokunmaIpucu = window.DokunmaIpucu = (() => {
  const GORULEN_ANAHTAR = "dokunma-ipucu-gorulen"; // Store: { id: true, ... }
  const MAX_SURE = 9000;                            // ekranda kalabileceği en uzun süre (ms)
  const TUR_SURE = 1700;                            // bir dokunma turu (ms)

  let kutu = null;                 // tekrar kullanılan tek overlay
  let hedefEl = null;
  let aktifId = null;
  let zamanlayicilar = [];
  let temizleyiciler = [];

  const azHareket = () =>
    !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  /* ---------- görülme kaydı (localStorage) ----------
     Kayıt: { id: { n: gösterim sayısı, ok: kalıcı-bitti } }
     "ok" true → bir daha gösterilmez. ok yalnızca kullanıcı hedefe
     DOKUNUNCA veya maxGosterim'e ulaşınca true olur — tek bir kaçırılan
     oynatma ipucunu sonsuza dek kapatmaz (sonraki açılışta yine denenir). */
  const oturumdaGosterilen = new Set();  // aynı oturumda tekrar oynatmayı önler
  function tumKayit() { return (typeof Store !== "undefined" && Store.get(GORULEN_ANAHTAR, {})) || {}; }
  function kaydiAl(id) {
    const v = tumKayit()[id];
    if (v && typeof v === "object") return { n: v.n || 0, ok: !!v.ok };
    if (v === true) return { n: 99, ok: true };   // eski format uyumu
    return { n: 0, ok: false };
  }
  function kaydiYaz(id, k) {
    if (!id || typeof Store === "undefined") return;
    const t = tumKayit(); t[id] = { n: k.n, ok: k.ok }; Store.set(GORULEN_ANAHTAR, t);
  }
  function gorulduMu(id) { return !!(id && kaydiAl(id).ok); }
  function tiklandiYaz(id) { if (id) kaydiYaz(id, { n: kaydiAl(id).n, ok: true }); }  // dokununca bitti
  function gosterimSay(id, maxG) { if (!id) return; const k = kaydiAl(id); k.n++; if (k.n >= maxG) k.ok = true; kaydiYaz(id, k); }
  function sifirla(id) {
    if (typeof Store === "undefined") return;
    const t = tumKayit();
    if (id) delete t[id]; else { for (const k in t) delete t[k]; }
    Store.set(GORULEN_ANAHTAR, t);
    oturumdaGosterilen.delete(id);
  }

  /* ---------- yardımcılar ---------- */
  function elemBul(hedef) {
    if (!hedef) return null;
    if (typeof hedef === "string") return document.querySelector(hedef);
    return hedef.nodeType === 1 ? hedef : null;
  }
  function ekrandaGorunur(el) {
    if (!el || !el.isConnected) return false;
    const r = el.getBoundingClientRect();
    if (r.width < 6 || r.height < 6) return false;
    const g = getComputedStyle(el);
    if (g.visibility === "hidden" || g.display === "none" || parseFloat(g.opacity) < 0.05) return false;
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const vw = window.innerWidth || document.documentElement.clientWidth;
    return r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw;
  }
  // Ekranı kaplayan bir katman (splash / onboarding / overlay) açık mı?
  function ustKatmanAcikMi() {
    const secs = ".splash, #splash, #onboarding, .onboarding, .magaza-overlay:not([hidden]), .topluluk-overlay:not([hidden]), .ciftsaat-overlay:not([hidden]), .rapor-overlay:not([hidden]), .test-overlay";
    return [...document.querySelectorAll(secs)].some(e => {
      if (e.hasAttribute("hidden")) return false;
      const g = getComputedStyle(e);
      return g.display !== "none" && g.visibility !== "hidden" && parseFloat(g.opacity || "1") > 0.05;
    });
  }

  /* ---------- overlay oluştur ---------- */
  function kutuYap() {
    if (kutu) return kutu;
    kutu = document.createElement("div");
    kutu.className = "dip-katman";
    kutu.setAttribute("aria-hidden", "true");
    kutu.innerHTML =
      '<span class="dip-balon" hidden></span>' +
      '<span class="dip-halka"></span>' +
      '<span class="dip-el">' +
        '<svg class="dip-svg" viewBox="0 0 24 24" width="46" height="46" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
          '<path d="M9 11.24V7.5C9 6.12 10.12 5 11.5 5S14 6.12 14 7.5v3.74c1.21-.81 2-2.18 2-3.74C16 4.46 13.54 2 10.5 2S5 4.46 5 7.5c0 1.56.79 2.93 2 3.74zm9.84 4.63l-4.54-2.26c-.17-.07-.35-.11-.54-.11H13v-6c0-.83-.67-1.5-1.5-1.5S10 6.67 10 7.5v10.74l-3.43-.72c-.08-.01-.15-.03-.24-.03-.31 0-.59.13-.79.33l-.79.8 4.94 4.94c.27.27.65.44 1.06.44h6.79c.75 0 1.33-.55 1.44-1.28l.75-5.27c.01-.07.02-.14.02-.2 0-.62-.38-1.16-.91-1.38z"/>' +
        '</svg>' +
      '</span>';
    document.body.appendChild(kutu);
    return kutu;
  }

  function konumla() {
    if (!kutu || !hedefEl) return;
    const r = hedefEl.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    kutu.style.transform = "translate(" + Math.round(cx) + "px," + Math.round(cy) + "px)";
    // Hedef ekranın alt kenarındaysa parmak ÜSTTEN gelsin (aşağı taşıp kırpılmasın)
    const vh = window.innerHeight || document.documentElement.clientHeight || 0;
    kutu.classList.toggle("dip-ust", cy > vh - 130);
  }

  /* ---------- göster ---------- */
  function goster(hedef, opts) {
    opts = opts || {};
    const id = opts.id || null;
    const tekSefer = opts.tekSefer !== false;   // varsayılan: bir kez
    const tekrar = Math.max(1, opts.tekrar || 3);
    const maxG = Math.max(1, opts.maxGosterim || 4);  // kaç açılış boyunca gösterilebilir

    if (tekSefer && id) {
      if (gorulduMu(id)) return false;                // kalıcı bitti
      if (oturumdaGosterilen.has(id)) return false;   // bu oturumda zaten oynadı
    }

    const el = elemBul(hedef);
    if (!ekrandaGorunur(el)) return false;
    if (ustKatmanAcikMi() && !opts.zorla) return false; // üstte kaplayan katman varken gösterme

    gizle(); // önceki ipucu varsa temizle

    hedefEl = el;
    aktifId = id;
    kutuYap();
    kutu.style.setProperty("--dip-tekrar", String(tekrar));
    // Yazılı balon (yönlendirme): metin verildiyse göster
    const balon = kutu.querySelector(".dip-balon");
    if (balon) {
      if (opts.metin) { balon.textContent = opts.metin; balon.hidden = false; kutu.classList.add("dip-balonlu"); }
      else { balon.hidden = true; kutu.classList.remove("dip-balonlu"); }
    }
    konumla();
    requestAnimationFrame(() => { if (kutu) kutu.classList.add("gor"); });
    if (tekSefer && id) { oturumdaGosterilen.add(id); gosterimSay(id, maxG); }

    // konumu takip et (scroll / resize)
    let raf = 0;
    const izle = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(konumla); };
    window.addEventListener("scroll", izle, true);
    window.addEventListener("resize", izle);
    temizleyiciler.push(() => { cancelAnimationFrame(raf); window.removeEventListener("scroll", izle, true); window.removeEventListener("resize", izle); });

    // hedefe dokununca: kalıcı olarak bitir + kapat + (varsa) sonraki adımı tetikle
    const onTikla = opts.onTikla;
    const hedefeDokun = () => { tiklandiYaz(id); gizle(); if (typeof onTikla === "function") { try { onTikla(); } catch (e) {} } };
    el.addEventListener("pointerdown", hedefeDokun, { once: true, passive: true });
    temizleyiciler.push(() => el.removeEventListener("pointerdown", hedefeDokun));

    // süre dolunca yalnızca kapat (kalıcı işaretleme YOK; kaçırılırsa sonraki açılışta yine denenir)
    const oynatmaSuresi = azHareket() ? 4200 : Math.min(MAX_SURE, TUR_SURE * tekrar + 500);
    zamanlayicilar.push(setTimeout(gizle, oynatmaSuresi));
    zamanlayicilar.push(setTimeout(gizle, MAX_SURE)); // güvenlik

    return true;
  }

  /* ---------- gizle / temizle ---------- */
  function gizle() {
    zamanlayicilar.forEach(t => clearTimeout(t)); zamanlayicilar = [];
    temizleyiciler.forEach(f => { try { f(); } catch (e) {} }); temizleyiciler = [];
    hedefEl = null; aktifId = null;
    if (kutu) kutu.classList.remove("gor");
  }

  /* ---------- İLK KULLANIM yönlendirmesi (2 adım) ----------
     Yeni kullanıcıya YAZILI, belirgin rehber. Sen anlatmak zorunda kalmazsın.
     Adım 1: alttaki "Kartlar" sekmesi → "Başlamak için buraya dokun".
     Adım 2 (Kartlar açılınca): "Kartını Çek" butonu → "Günün kartını çek".
     Her adım bir kez; dokununca kaybolur, kaçırılırsa sonraki açılışta tekrar. */

  /* ---------- Yeni kullanıcı TURU: en değerli 5 aksiyon ----------
     Sırayla tanıtır; her adım bir kez. Kullanıcı dokununca veya birkaç
     saniye sonra bir sonrakine geçer. Ekran müsait değilse (overlay /
     onboarding) ya da ana ekranda değilsek bekler. Hedef ekran dışındaysa
     görünür alana kaydırır. Kaçırılan adım sonraki açılışta (en çok 3 kez)
     tekrar denenir; hepsi görülünce bir daha çıkmaz. */
  const TUR = [
    { id: "tur-kart2",     sel: '.nav-btn[data-view="kartlar"]', metin: "Günün kartını buradan çek 🔮" },
    { id: "tur-mini2",     sel: "#gorevler",    metin: "Günün mini görevleri — küçük adımların ✅" },
    { id: "tur-hafta2",    sel: "#hh-kart",     metin: "Haftalık görevin burada 🎯" },
    { id: "tur-topluluk2", sel: "#topluluk-ac", metin: "Toplulukta paylaş, ilham al 🌸" },
    { id: "tur-magaza2",   sel: "#magaza-ac",   metin: "Doğal taşlara göz at 🛍️" }
  ];

  function anaEkranMi() {
    const h = document.getElementById("view-home");
    return h ? h.classList.contains("active") : true;
  }

  function turBaslat() {
    let bos = 0;
    const y = setInterval(() => {
      if (kutu && kutu.classList.contains("gor")) { bos = 0; return; }      // ipucu görünüyor → bekle
      if (ustKatmanAcikMi() || !anaEkranMi()) { bos = 0; return; }          // overlay/onboarding/başka ekran → bekle
      const adim = TUR.find(a => !gorulduMu(a.id) && !oturumdaGosterilen.has(a.id));
      if (!adim) { clearInterval(y); return; }                              // hepsi bitti
      const el = document.querySelector(adim.sel);
      if (!el || !el.isConnected) { if (++bos > 12) clearInterval(y); return; }
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 0;
      if (r.height > 6 && (r.top < 56 || r.bottom > vh - 16)) {             // ekran dışı → görünür alana kaydır
        try { el.scrollIntoView({ block: "center", behavior: "smooth" }); } catch (e) { try { el.scrollIntoView(); } catch (e2) {} }
        bos = 0; return;
      }
      const oldu = goster(adim.sel, { id: adim.id, metin: adim.metin, tekrar: 2, maxGosterim: 3 });
      bos = oldu ? 0 : bos + 1;
      if (bos > 12) clearInterval(y);
    }, 1200);
  }
  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(turBaslat, 2500);
  });

  return { goster, gizle, gorulduMu, sifirla };
})();
