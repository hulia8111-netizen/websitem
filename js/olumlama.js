/* ============================================================
   olumlama.js — Sesli Olumlama Sistemi 🎧
   Olumlamaları Web Speech API (SpeechSynthesis) ile yumuşak bir
   Türkçe kadın sesiyle okur. Kategori seçimi, günün önerisi,
   favoriler, rastgele mod, ses aç/kapat ve oynatma animasyonları.
   Ses dosyası gerektirmez; tarayıcıda offline çalışır.
   Global: window.Olumlama
   ============================================================ */

const Olumlama = (() => {
  const synth = window.speechSynthesis || null;
  const $ = id => document.getElementById(id);

  const ICON = {
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
    stop: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="7" y="7" width="10" height="10" rx="2"/></svg>',
    sesAcik: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M16 9a4 4 0 0 1 0 6M19 6.5a8 8 0 0 1 0 11"/></svg>',
    sesKapali: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M22 9l-6 6M16 9l6 6"/></svg>',
    kalp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20s-7-4.35-7-9a4 4 0 0 1 7-2.65A4 4 0 0 1 19 11c0 4.65-7 9-7 9z"/></svg>',
    karistir: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h4v4M20 4l-6 6M16 20h4v-4M4 4l16 16M4 20l5-5"/></svg>'
  };

  let aktifKat = null;     // null = Günün Önerisi (tüm havuz)
  let aktifMetin = "";
  let sesAcik = true;
  let voices = [];

  /* ---------- veri yardımcıları ---------- */
  function tumListe() { return DATA.olumlamaKategorileri.flatMap(k => k.liste); }
  function katListe() {
    if (!aktifKat) return tumListe();
    const k = DATA.olumlamaKategorileri.find(x => x.id === aktifKat);
    return k ? k.liste : tumListe();
  }
  function favAl() { return Store.get("olumlama-fav", []); }
  function favKayit(l) { Store.set("olumlama-fav", l); }

  /* ---------- ses (TTS) ---------- */
  function sesleriYukle() { if (synth) voices = synth.getVoices() || []; }
  function kadinSes() {
    if (!voices.length) return null;
    const tr = voices.filter(v => /tr(-|_)?/i.test(v.lang));
    const kadin = tr.find(v => /female|kad[ıi]n|yelda|filiz|seda|google/i.test(v.name));
    return kadin || tr[0] || voices.find(v => /female/i.test(v.name)) || null;
  }
  function konus(metin) {
    if (!synth || !sesAcik || !metin) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(metin);
    const v = kadinSes();
    if (v) u.voice = v;
    u.lang = "tr-TR";
    u.rate = 0.9;     // yumuşak, sakin tempo
    u.pitch = 1.08;   // hafif kadınsı tını
    u.onstart = () => setCalar(true);
    u.onend = () => setCalar(false);
    u.onerror = () => setCalar(false);
    synth.speak(u);
  }
  function durdur() { if (synth) synth.cancel(); setCalar(false); }

  function setCalar(on) {
    const kutu = $("olumlama");
    if (kutu) kutu.classList.toggle("calar", on);
    const play = $("olumlama-play");
    if (play) play.innerHTML = on ? ICON.stop : ICON.play;
  }

  /* ---------- görünüm ---------- */
  function favMi(metin) { return favAl().includes(metin); }
  function goster(metin, etiket) {
    aktifMetin = metin;
    $("olumlama-metin").textContent = metin;
    $("olumlama-etiket").textContent = etiket;
    const favBtn = $("olumlama-fav");
    favBtn.classList.toggle("aktif", favMi(metin));
  }
  function rastgeleMetin(liste) {
    const havuz = liste.filter(m => m !== aktifMetin);
    const kaynak = havuz.length ? havuz : liste;
    return kaynak[Math.floor(Math.random() * kaynak.length)];
  }

  function cizKategoriler() {
    const kutu = $("olumlama-kat");
    const yap = (id, ad) => {
      const b = document.createElement("button");
      b.className = "kat-btn" + ((aktifKat === id || (!aktifKat && id === null)) ? " aktif" : "");
      b.textContent = ad;
      b.addEventListener("click", () => {
        aktifKat = id;
        kutu.querySelectorAll(".kat-btn").forEach(x => x.classList.remove("aktif"));
        b.classList.add("aktif");
        const etiket = id ? ad : "Günün Önerisi";
        goster(id ? rastgeleMetin(katListe()) : pickByDate(tumListe()), etiket);
      });
      return b;
    };
    kutu.appendChild(yap(null, "Günün Önerisi"));
    DATA.olumlamaKategorileri.forEach(k => kutu.appendChild(yap(k.id, k.ad)));
  }

  function cizFavoriler() {
    const ul = $("olumlama-fav-liste");
    const fav = favAl();
    $("olumlama-fav-sayi").textContent = fav.length;
    ul.innerHTML = "";
    if (!fav.length) { ul.innerHTML = `<li class="muted small">Henüz favori eklemedin.</li>`; return; }
    fav.slice().reverse().forEach(metin => {
      const li = document.createElement("li");
      const span = document.createElement("span");
      span.className = "liste-metin";
      span.textContent = metin;
      const dinle = document.createElement("button");
      dinle.className = "fav-dinle";
      dinle.innerHTML = ICON.play;
      dinle.setAttribute("aria-label", "Dinle");
      dinle.addEventListener("click", () => { goster(metin, "Favori"); konus(metin); });
      const sil = document.createElement("button");
      sil.className = "sil";
      sil.textContent = "✕";
      sil.addEventListener("click", () => {
        favKayit(favAl().filter(m => m !== metin));
        cizFavoriler();
        $("olumlama-fav").classList.toggle("aktif", favMi(aktifMetin));
      });
      li.append(span, dinle, sil);
      ul.appendChild(li);
    });
  }

  function guncelleSesBtn() {
    const b = $("olumlama-ses");
    b.innerHTML = sesAcik ? ICON.sesAcik : ICON.sesKapali;
    b.classList.toggle("kapali", !sesAcik);
    b.setAttribute("aria-label", sesAcik ? "Sesi kapat" : "Sesi aç");
  }

  /* ---------- bağlama ---------- */
  function baglan() {
    if (!$("olumlama")) return;
    sesAcik = Store.get("olumlama-ses", true);
    sesleriYukle();
    if (synth && typeof synth.addEventListener === "function") synth.addEventListener("voiceschanged", sesleriYukle);

    $("olumlama-fav").innerHTML = ICON.kalp;
    $("olumlama-rast").innerHTML = ICON.karistir;
    cizKategoriler();
    goster(pickByDate(tumListe()), "Günün Önerisi");
    cizFavoriler();
    guncelleSesBtn();
    setCalar(false);

    const play = $("olumlama-play");
    if (!synth) { play.disabled = true; play.title = "Bu cihaz sesli okumayı desteklemiyor."; }
    play.addEventListener("click", () => {
      if (synth && synth.speaking) { durdur(); return; }
      if (!sesAcik) { sesAcik = true; Store.set("olumlama-ses", true); guncelleSesBtn(); }
      konus(aktifMetin);
    });

    $("olumlama-fav").addEventListener("click", () => {
      const fav = favAl();
      const i = fav.indexOf(aktifMetin);
      if (i >= 0) fav.splice(i, 1); else fav.push(aktifMetin);
      favKayit(fav);
      $("olumlama-fav").classList.toggle("aktif", favMi(aktifMetin));
      cizFavoriler();
    });

    $("olumlama-rast").addEventListener("click", () => {
      const metin = rastgeleMetin(katListe());
      goster(metin, aktifKat ? (DATA.olumlamaKategorileri.find(k => k.id === aktifKat) || {}).ad : "Rastgele");
      konus(metin);
    });

    $("olumlama-ses").addEventListener("click", () => {
      sesAcik = !sesAcik;
      Store.set("olumlama-ses", sesAcik);
      if (!sesAcik) durdur();
      guncelleSesBtn();
    });
  }

  document.addEventListener("DOMContentLoaded", baglan);
  return { konus };
})();
