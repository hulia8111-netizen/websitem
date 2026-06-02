/* ============================================================
   gunluk.js — Spiritüel Günlük / İçsel Yazım Alanı 📖
   Mood bağlantılı günlük kayıtları, otomatik tarih/saat, taslak
   otomatik-kayıt, arama, favoriler ve kaydetten sonra yerel AI
   analizi (Rehber motoru yeniden kullanılır). Veriler localStorage'da.
   Global: window.Gunluk
   ============================================================ */

const Gunluk = window.Gunluk = (() => {
  const $ = sel => document.querySelector(sel);
  const KAYIT = "gunluk-kayitlar";
  const TASLAK = "gunluk-taslak";

  /* Tona göre kısa analiz (Rehber grubuna göre) */
  const TON = {
    kaygi:      { ton: "kaygılı ama farkında", emoji: "🌙" },
    uzgun:      { ton: "hüzünlü ve duygusal", emoji: "💜" },
    yorgun:     { ton: "yorgun ama umutlu", emoji: "🌙" },
    ofke:       { ton: "gergin ama dürüst", emoji: "🌿" },
    mutlu:      { ton: "mutlu ve aydınlık", emoji: "✨" },
    motivasyon: { ton: "kararlı ve hevesli", emoji: "🔥" },
    yalniz:     { ton: "yalnız ama arayışta", emoji: "🤍" },
    korku:      { ton: "tedirgin ama cesur", emoji: "🌌" },
    varsayilan: { ton: "sakin ve düşünceli", emoji: "🌙" }
  };

  let seciliMood = null;
  let favFiltre = false;
  let arama = "";
  let taslakZaman = null;

  /* ---------- veri ---------- */
  function kayitAl() { return Store.get(KAYIT, []); }
  function kayitYaz(a) { Store.set(KAYIT, a); }

  /* Eski journal-<gün> verisini yeni yapıya taşı (bir kez) */
  function migrate() {
    if (Store.get("gunluk-migrasyon")) return;
    const arr = kayitAl();
    const eski = Store.allKeys()
      .filter(k => k.startsWith(Store.PREFIX + "journal-"))
      .map(k => k.replace(Store.PREFIX + "journal-", ""));
    eski.forEach(gun => {
      const metin = Store.get("journal-" + gun, "");
      if (!metin) return;
      if (arr.some(e => e.id === "m-" + gun)) return;
      arr.push({
        id: "m-" + gun, ts: keyToDate(gun).getTime(), tarih: gun, saat: "",
        metin, mood: typeof moodKeyNormalize === "function" ? moodKeyNormalize(Store.get("mood-" + gun)) : null,
        favori: false
      });
    });
    arr.sort((a, b) => b.ts - a.ts);
    kayitYaz(arr);
    Store.set("gunluk-migrasyon", true);
  }

  /* ---------- yardımcılar ---------- */
  function uzunTarih(g) {
    return keyToDate(g).toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }
  function moodIkon(key) {
    const k = (typeof moodKeyNormalize === "function") ? moodKeyNormalize(key) : key;
    return (k && typeof moodSvg === "function") ? `<span class="gk-mood">${moodSvg(k)}</span>` : "";
  }
  function trLower(s) { return String(s || "").toLocaleLowerCase("tr"); }

  /* ---------- AI analiz ---------- */
  function analizUret(metin) {
    const grup = (typeof Rehber !== "undefined" && Rehber.analiz(metin)) || DATA.rehber.varsayilan;
    const t = TON[grup.id] || TON.varsayilan;
    return {
      analiz: `Bugünkü yazında kendini ${t.ton} ifade etmişsin ${t.emoji}`,
      mesaj: grup.destek || "",
      olumlama: grup.olumlama || ""
    };
  }
  function analizGoster(metin) {
    const a = analizUret(metin);
    const kutu = $("#gunluk-analiz");
    kutu.innerHTML = `
      <span class="ga-et">İçsel Analiz</span>
      <p class="ga-analiz">${escapeHtml(a.analiz)}</p>
      <div class="altin-divider ince"></div>
      <p class="ga-mesaj">${escapeHtml(a.mesaj)}</p>
      <p class="ga-olumlama">“${escapeHtml(a.olumlama)}”</p>`;
    kutu.hidden = false;
    kutu.style.animation = "none"; void kutu.offsetWidth; kutu.style.animation = "";
  }

  /* ---------- mood seçici ---------- */
  function cizMoodSec() {
    const kutu = $("#gunluk-mood-sec");
    if (!kutu || typeof MOOD_LIST === "undefined") return;
    if (seciliMood === null) {
      seciliMood = (typeof moodKeyNormalize === "function") ? moodKeyNormalize(Store.get("mood-" + todayKey())) : null;
    }
    kutu.innerHTML = "";
    MOOD_LIST.forEach(m => {
      const b = document.createElement("button");
      b.className = "gunluk-mood" + (seciliMood === m.key ? " aktif" : "");
      b.title = m.label;
      b.innerHTML = moodSvg(m.key);
      b.addEventListener("click", () => {
        seciliMood = (seciliMood === m.key) ? null : m.key;
        cizMoodSec();
      });
      kutu.appendChild(b);
    });
  }

  /* ---------- geçmiş listesi ---------- */
  function cizListe() {
    const liste = $("#gunluk-liste");
    if (!liste) return;
    let arr = kayitAl();
    if (favFiltre) arr = arr.filter(e => e.favori);
    if (arama) arr = arr.filter(e => trLower(e.metin).includes(trLower(arama)));
    liste.innerHTML = "";
    if (!arr.length) {
      liste.innerHTML = `<p class="muted small">${arama || favFiltre ? "Eşleşen günlük yok." : "Henüz günlük yazmadın. İlk satırını bugün yaz ✦"}</p>`;
      return;
    }
    arr.forEach(e => {
      const art = document.createElement("article");
      art.className = "gk";
      art.innerHTML = `
        <div class="gk-bas">
          <div class="gk-meta">${moodIkon(e.mood)}<span>${uzunTarih(e.tarih)}${e.saat ? " · " + e.saat : ""}</span></div>
          <div class="gk-aksiyon">
            <button class="gk-fav${e.favori ? " aktif" : ""}" aria-label="Favori">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20s-7-4.35-7-9a4 4 0 0 1 7-2.65A4 4 0 0 1 19 11c0 4.65-7 9-7 9z"/></svg>
            </button>
            <button class="gk-sil" aria-label="Sil">✕</button>
          </div>
        </div>
        <p class="gk-metin">${escapeHtml(e.metin)}</p>
        <div class="gk-analiz" hidden></div>`;

      art.querySelector(".gk-metin").addEventListener("click", () => {
        const acik = art.classList.toggle("acik");
        const an = art.querySelector(".gk-analiz");
        if (acik && !an.dataset.dolu) {
          const a = analizUret(e.metin);
          an.innerHTML = `<span class="ga-et">İçsel Analiz</span><p class="ga-analiz">${escapeHtml(a.analiz)}</p>`;
          an.dataset.dolu = "1";
        }
        an.hidden = !acik;
      });
      art.querySelector(".gk-fav").addEventListener("click", () => {
        const all = kayitAl();
        const k = all.find(x => x.id === e.id);
        if (k) { k.favori = !k.favori; kayitYaz(all); cizListe(); }
      });
      art.querySelector(".gk-sil").addEventListener("click", () => {
        kayitYaz(kayitAl().filter(x => x.id !== e.id));
        cizListe();
      });
      liste.appendChild(art);
    });
  }

  /* ---------- kaydet ---------- */
  function kaydet() {
    const ta = $("#gunluk-metin");
    const metin = ta.value.trim();
    if (!metin) { ta.focus(); flash("Birkaç satır yazmayı dene ✦"); return; }
    const now = new Date();
    const entry = {
      id: Date.now().toString(36), ts: Date.now(), tarih: todayKey(),
      saat: now.toTimeString().slice(0, 5), metin, mood: seciliMood, favori: false
    };
    const arr = kayitAl();
    arr.unshift(entry);
    kayitYaz(arr);
    ta.value = "";
    Store.remove(TASLAK);
    flash("Kaydedildi ✦");
    analizGoster(metin);
    sayfaCevir();
    cizListe();
  }

  function flash(msg) {
    const el = $("#gunluk-bilgi");
    el.textContent = msg;
    setTimeout(() => { el.textContent = ""; }, 2200);
  }
  function sayfaCevir() {
    const kart = $("#gunluk");
    kart.classList.remove("ceviriliyor"); void kart.offsetWidth;
    kart.classList.add("ceviriliyor");
    setTimeout(() => kart.classList.remove("ceviriliyor"), 700);
  }

  /* ---------- bağlama ---------- */
  function baglan() {
    if (!$("#gunluk")) return;
    migrate();

    $("#gunluk-tarih").textContent = uzunTarih(todayKey());
    cizMoodSec();

    const ta = $("#gunluk-metin");
    ta.value = Store.get(TASLAK, "");
    ta.addEventListener("input", () => {
      clearTimeout(taslakZaman);
      taslakZaman = setTimeout(() => Store.set(TASLAK, ta.value), 400);
    });
    ta.addEventListener("focus", () => { $("#gunluk-tarih").textContent = uzunTarih(todayKey()); });

    $("#gunluk-kaydet").addEventListener("click", kaydet);

    const ara = $("#gunluk-ara");
    let aramaZaman = null;
    ara.addEventListener("input", () => {
      clearTimeout(aramaZaman);
      aramaZaman = setTimeout(() => { arama = ara.value.trim(); cizListe(); }, 200);
    });
    const favBtn = $("#gunluk-fav-filtre");
    favBtn.addEventListener("click", () => {
      favFiltre = !favFiltre;
      favBtn.classList.toggle("aktif", favFiltre);
      cizListe();
    });

    cizListe();
  }

  document.addEventListener("DOMContentLoaded", baglan);
  return { cizListe };
})();
