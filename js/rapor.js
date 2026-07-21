/* ============================================================
   rapor.js — Aylık Kişisel Gelişim Raporu 📊✨
   ------------------------------------------------------------
   Her ay için kullanıcı verilerini (yerel Store) toplar, yerel/kural-tabanlı
   bir değerlendirme üretir ve premium bir kartta (çemberler, yüzde çubukları,
   animasyonlar) sunar. Geçmiş aylar arşivde: ay gezgini ile tekrar görüntülenir.
   Tüm veriler cihazda; harici AI yok. Global: window.Rapor
   ============================================================ */
window.Rapor = (() => {
  const P = Store.PREFIX;
  const AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  const MOOD_VAL = { great: 5, good: 4, ok: 3, low: 2, down: 1 };
  const MOOD_AD = { great: "Mutlu", good: "Huzurlu", ok: "Durgun", low: "Üzgün", down: "Hüzünlü" };
  const MOOD_EMOJI = { great: "✨", good: "🌿", ok: "🌙", low: "💜", down: "🤍" };
  const EMAP = { "😄": "great", "🙂": "good", "😐": "ok", "😔": "low", "😢": "down" };
  const moodNorm = v => (v && MOOD_VAL[v]) ? v : (EMAP[v] || null);

  const GUC = {
    fiziksel: "Bedenine düzenli özen gösterdin, fiziksel görevlerin güçlüydü.",
    zihinsel: "Zihnini beslemeye özen gösterdin, zihinsel görevlerde güçlüydün.",
    ruhsal: "Ruhsal görevlerini büyük oranda tamamladın.",
    meditasyon: "Meditasyon alışkanlığın güçlenmeye başladı.",
    gunluk: "Düşüncelerini yazıya dökme alışkanlığın güçlüydü.",
    sukran: "Şükran pratiğin bu ay parladı."
  };
  const GELIS = {
    fiziksel: "Fiziksel görevlere biraz daha zaman ayırabilirsin.",
    zihinsel: "Zihinsel hedeflerine biraz daha odaklanabilirsin.",
    ruhsal: "Ruhsal görevlerine biraz daha alan açabilirsin.",
    meditasyon: "Meditasyonu rutinine biraz daha yerleştirebilirsin.",
    gunluk: "Günlük yazmayı biraz daha sık deneyebilirsin.",
    sukran: "Şükran notlarını biraz daha sık tutabilirsin."
  };
  const ONERI = {
    fiziksel: "Gelecek ay her güne küçük bir fiziksel görevle başlamayı dene.",
    zihinsel: "Gelecek ay günde bir zihinsel göreve odaklanmayı dene.",
    ruhsal: "Gelecek ay akşamları kısa bir ruhsal ritüel eklemeyi dene.",
    meditasyon: "Gelecek ay haftada 3 gün, 5 dakikalık meditasyonla başla.",
    gunluk: "Gelecek ay her akşam bir cümlelik günlük yazmayı dene.",
    sukran: "Gelecek ay her sabah bir şükran notu yazmayı dene."
  };

  let aktifAy = null;

  /* ---------- ay yardımcıları ---------- */
  function buAy(d = new Date()) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); }
  function ayEtiket(ay) { const p = ay.split("-"); return AYLAR[+p[1] - 1] + " " + p[0]; }
  function ayGunSayisi(ay) { const p = ay.split("-").map(Number); return new Date(p[0], p[1], 0).getDate(); }
  function gecerliGun(ay) { const b = new Date(); return ay === buAy(b) ? b.getDate() : ayGunSayisi(ay); }
  function oncekiAy(ay) { const p = ay.split("-").map(Number); const d = new Date(p[0], p[1] - 2, 1); return buAy(d); }
  function sonrakiAy(ay) { const p = ay.split("-").map(Number); const d = new Date(p[0], p[1], 1); return buAy(d); }

  /* ---------- sayım ---------- */
  function gunSay(prefix, ay) {
    return Store.allKeys().filter(k => k.startsWith(P + prefix + ay)).filter(k => Store.get(k.slice(P.length))).length;
  }
  function gunSayTum(prefix) {
    return Store.allKeys().filter(k => k.startsWith(P + prefix)).filter(k => Store.get(k.slice(P.length))).length;
  }
  function gorevAy(ay) {
    const r = { fiziksel: 0, zihinsel: 0, ruhsal: 0 };
    Store.allKeys().filter(k => k.startsWith(P + "gorevler-" + ay)).forEach(k => {
      const d = Store.get(k.slice(P.length), {}) || {};
      if (d.fiziksel) r.fiziksel++; if (d.zihinsel) r.zihinsel++; if (d.ruhsal) r.ruhsal++;
    });
    return r;
  }
  function moodAy(ay) {
    const say = { great: 0, good: 0, ok: 0, low: 0, down: 0 };
    let top = 0, adet = 0;
    Store.allKeys().filter(k => k.startsWith(P + "mood-" + ay)).forEach(k => {
      const key = moodNorm(Store.get(k.slice(P.length)));
      if (key && MOOD_VAL[key]) { say[key]++; top += MOOD_VAL[key]; adet++; }
    });
    return { say, adet, ort: adet ? top / adet : 0 };
  }
  function rozetDurum() {
    const g = {
      girisGun: gunSayTum("visit-"), medGun: gunSayTum("med-"),
      sukranTop: (Store.get("gratitude", []) || []).length, gorevTop: gunSayTum("task-"),
      moodSeri: (typeof mevcutSeri === "function" ? mevcutSeri("mood-") : 0), moodTop: gunSayTum("mood-")
    };
    const R = (typeof DATA !== "undefined" && DATA.rozetler) || [];
    let acik = 0; R.forEach(r => { if ((g[r.metrik] || 0) >= r.hedef) acik++; });
    return { acik, toplam: R.length || 6 };
  }

  function ayVerisi(ay) {
    const gorev = gorevAy(ay);
    return {
      ay, gun: gecerliGun(ay),
      giris: gunSay("visit-", ay),
      fiziksel: gorev.fiziksel, zihinsel: gorev.zihinsel, ruhsal: gorev.ruhsal,
      meditasyon: gunSay("med-", ay),
      kart: gunSay("card-", ay) + gunSay("card2-", ay),
      gunluk: gunSay("gunluk-sayfa-", ay),
      sukran: (Store.get("gratitude", []) || []).filter(n => (n.tarih || "").startsWith(ay)).length,
      haftalik: (Store.get("hh-arsiv", []) || []).filter(x => (x.tarih || "").startsWith(ay)).length,
      mood: moodAy(ay),
      rozet: rozetDurum()
    };
  }

  /* Verisi olan aylar (arşiv gezgini için) — en eski aya kadar geri gidilebilir */
  function ilkVeriAyi() {
    const pfx = ["visit-", "gorevler-", "med-", "card-", "gunluk-sayfa-", "mood-"];
    let enEski = null;
    Store.allKeys().forEach(k => {
      const s = k.slice(P.length);
      if (!pfx.some(p => s.startsWith(p))) return;
      const m = s.match(/(\d{4}-\d{2})-\d{2}$/);
      if (m && (!enEski || m[1] < enEski)) enEski = m[1];
    });
    return enEski || buAy();
  }

  /* ---------- değerlendirme (yerel / kural-tabanlı) ---------- */
  function degerlendir(v) {
    const gun = Math.max(1, v.gun);
    const alan = [
      { id: "fiziksel", ad: "fiziksel görevler", emoji: "🌿", val: v.fiziksel },
      { id: "zihinsel", ad: "zihinsel görevler", emoji: "🧠", val: v.zihinsel },
      { id: "ruhsal", ad: "ruhsal görevler", emoji: "🌙", val: v.ruhsal },
      { id: "meditasyon", ad: "meditasyon", emoji: "🧘", val: v.meditasyon },
      { id: "gunluk", ad: "günlük yazma", emoji: "📔", val: v.gunluk },
      { id: "sukran", ad: "şükran", emoji: "💜", val: v.sukran }
    ].map(a => Object.assign(a, { oran: a.val / gun }));
    const sirali = alan.slice().sort((a, b) => b.oran - a.oran);
    const guclu = sirali[0], zayif = sirali[sirali.length - 1];
    const tutar = v.giris / gun;

    const p = [];
    if (tutar >= 0.7) p.push("Bu ay kendine düzenli zaman ayırdın.");
    else if (tutar >= 0.4) p.push("Bu ay uygulamaya düzenli sayılabilecek biçimde uğradın.");
    else if (v.giris > 0) p.push("Bu ay ara ara kendine dönmeyi denedin.");
    else p.push("Bu ay yolculuğuna yeni başlıyorsun.");
    if (guclu.val > 0) p.push(GUC[guclu.id]);
    if (v.mood.adet >= 5) {
      if (v.mood.ort >= 4) p.push("Genel ruh halin bu ay oldukça iyiydi.");
      else if (v.mood.ort >= 3) p.push("Ruh halin bu ay dengeli seyretti.");
      else p.push("Bu ay duygusal olarak zorlu anların olmuş olabilir; kendine şefkat göster.");
    }
    if (zayif.val === 0 || zayif.oran < 0.15) p.push("Önümüzdeki ay " + zayif.ad + " alanına biraz daha odaklanman gelişimini destekleyebilir.");

    return {
      metin: p.join(" "),
      enGuclu: { emoji: guclu.emoji, ad: guclu.ad, metin: guclu.val > 0 ? GUC[guclu.id] : "Bu ay yeni başlıyorsun; her küçük adım değerli." },
      gelistir: { emoji: zayif.emoji, ad: zayif.ad, metin: GELIS[zayif.id] },
      oneri: { metin: ONERI[zayif.id] }
    };
  }

  /* ---------- görsel yardımcılar ---------- */
  function ring(oran, renk, sayi, etiket, buyuk) {
    const R = buyuk ? 50 : 34, W = buyuk ? 9 : 7, cev = 2 * Math.PI * R, boyut = (R + W) * 2;
    const off = (cev * (1 - Math.max(0, Math.min(1, oran)))).toFixed(1);
    return `<div class="rp-ring${buyuk ? " buyuk" : ""}">
      <svg viewBox="0 0 ${boyut} ${boyut}">
        <circle class="rp-ring-bg" cx="${R + W}" cy="${R + W}" r="${R}" stroke-width="${W}"/>
        <circle class="rp-ring-on" cx="${R + W}" cy="${R + W}" r="${R}" stroke-width="${W}" stroke="${renk}"
          stroke-dasharray="${cev.toFixed(1)}" stroke-dashoffset="${cev.toFixed(1)}" data-off="${off}"/>
      </svg>
      <div class="rp-ring-ic"><b data-say="${sayi}">0</b><span>${etiket}</span></div>
    </div>`;
  }
  function tile(emoji, sayi, etiket) {
    return `<div class="rp-tile"><span class="rp-tile-emoji">${emoji}</span><b data-say="${sayi}">0</b><span class="rp-tile-et">${etiket}</span></div>`;
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

  /* ---------- render ---------- */
  function ciz() {
    const ov = document.getElementById("rapor-overlay"); if (!ov) return;
    const v = ayVerisi(aktifAy);
    const d = degerlendir(v);
    const gun = Math.max(1, v.gun);
    const gelecekVar = sonrakiAy(aktifAy) <= buAy();
    const gecmisVar = aktifAy > ilkVeriAyi();
    const mood = v.mood;
    const moodBaskin = Object.keys(mood.say).sort((a, b) => mood.say[b] - mood.say[a])[0];
    const moodDagilim = ["great", "good", "ok", "low", "down"].map(k => {
      const yuz = mood.adet ? Math.round(mood.say[k] / mood.adet * 100) : 0;
      return `<div class="rp-mood-row"><span class="rp-mood-ad">${MOOD_EMOJI[k]} ${MOOD_AD[k]}</span><span class="rp-mood-bar"><i style="width:${yuz}%"></i></span><span class="rp-mood-yuz">${yuz}%</span></div>`;
    }).join("");

    ov.innerHTML = `
      <div class="rapor-kart" id="rapor-kart">
        <button class="gece-kapat" id="rapor-kapat" aria-label="Kapat">✕</button>
        <div class="rp-baslik">
          <span class="rp-mini">Aylık Gelişim Raporu</span>
          <div class="rp-ay-nav">
            <button class="rp-ok" id="rp-onceki" ${gecmisVar ? "" : "disabled"} aria-label="Önceki ay">‹</button>
            <h2 id="rp-ay-etiket">${ayEtiket(aktifAy)}</h2>
            <button class="rp-ok" id="rp-sonraki" ${gelecekVar ? "" : "disabled"} aria-label="Sonraki ay">›</button>
          </div>
        </div>

        <div class="rp-hero">
          ${ring(v.giris / gun, "var(--gold-soft)", v.giris, "aktif gün", true)}
          <p class="rp-hero-alt">${gun} günün <b>${v.giris}</b>'inde kendine döndün ✨</p>
        </div>

        <div class="rp-ringler">
          ${ring(v.fiziksel / gun, "#7fe3b0", v.fiziksel, "🌿 Fiziksel")}
          ${ring(v.zihinsel / gun, "#8bb8ff", v.zihinsel, "🧠 Zihinsel")}
          ${ring(v.ruhsal / gun, "#c9a2ff", v.ruhsal, "🌙 Ruhsal")}
        </div>

        <div class="rp-tiles">
          ${tile("🧘", v.meditasyon, "Meditasyon")}
          ${tile("🃏", v.kart, "Kart")}
          ${tile("📔", v.gunluk, "Günlük")}
          ${tile("💜", v.sukran, "Şükran")}
          ${tile("🏆", v.haftalik, "Haftalık")}
          ${tile("🎖️", v.rozet.acik + "/" + v.rozet.toplam, "Rozet")}
        </div>

        ${mood.adet ? `<div class="rp-mood">
          <div class="rp-mood-ust"><span class="rp-mood-emoji">${MOOD_EMOJI[moodBaskin]}</span>
            <div><b>Ruh Hali</b><p class="muted small">Bu ay en çok <b>${MOOD_AD[moodBaskin]}</b> hissettin · ${mood.adet} kayıt</p></div></div>
          <div class="rp-mood-dagilim">${moodDagilim}</div>
        </div>` : ""}

        <div class="rp-degerlendirme">
          <p class="rp-deg-metin">${esc(d.metin)}</p>
          <div class="rp-vurgular">
            <div class="rp-vurgu guclu"><span>✨ Bu ayın en güçlü yönün</span><p>${d.enGuclu.emoji} ${esc(d.enGuclu.metin)}</p></div>
            <div class="rp-vurgu gelis"><span>🌱 Geliştirebileceğin alan</span><p>${esc(d.gelistir.metin)}</p></div>
            <div class="rp-vurgu oneri"><span>🎯 Gelecek ay için öneri</span><p>${esc(d.oneri.metin)}</p></div>
          </div>
        </div>

        <p class="rp-dip muted small">🌙 Geçmiş aylar arşivde saklanır — istediğin zaman ‹ › ile gezebilirsin.</p>
      </div>`;

    // olaylar
    const kapat = document.getElementById("rapor-kapat");
    if (kapat) kapat.addEventListener("click", ac.bind(null, false));
    const onc = document.getElementById("rp-onceki");
    if (onc && gecmisVar) onc.addEventListener("click", () => { aktifAy = oncekiAy(aktifAy); ciz(); });
    const son = document.getElementById("rp-sonraki");
    if (son && gelecekVar) son.addEventListener("click", () => { aktifAy = sonrakiAy(aktifAy); ciz(); });
    ov.addEventListener("click", e => { if (e.target === ov) ac(false); }, { once: true });

    // animasyon: çemberleri çiz + sayıları say + kartı göster
    // (rAF gizli sekmede duraklayabilir → setTimeout yedeği ile kart her durumda görünür olur)
    let acildiBir = false;
    const reveal = () => {
      if (acildiBir) return; acildiBir = true;
      ov.querySelectorAll(".rp-ring-on").forEach(c => { c.style.strokeDashoffset = c.getAttribute("data-off"); });
      ov.querySelectorAll("[data-say]").forEach(el => sayAnim(el, el.getAttribute("data-say")));
      const kart = document.getElementById("rapor-kart"); if (kart) kart.classList.add("gor");
    };
    requestAnimationFrame(reveal);
    setTimeout(reveal, 60);
  }

  function sayAnim(el, hedefStr) {
    // "3/6" gibi degerleri oldugu gibi birak; saf sayilari say
    if (!/^\d+$/.test(String(hedefStr))) { el.textContent = hedefStr; return; }
    const hedef = parseInt(hedefStr, 10); if (hedef <= 0) { el.textContent = "0"; return; }
    // Az-hareket veya gizli sayfa (rAF durur) → dogrudan son deger
    const azHareket = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (azHareket || document.hidden) { el.textContent = String(hedef); return; }
    const sure = 700, bas = performance.now ? performance.now() : Date.now();
    function tik(now) {
      const t = Math.min(1, ((now || Date.now()) - bas) / sure);
      el.textContent = Math.round(hedef * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(tik);
    }
    requestAnimationFrame(tik);
    setTimeout(() => { el.textContent = String(hedef); }, sure + 80); // yedek: son deger garanti
  }

  /* ---------- aç / kapat ---------- */
  function ac(goster) {
    const ov = document.getElementById("rapor-overlay"); if (!ov) return;
    if (goster === false) { ov.hidden = true; return; }
    if (!aktifAy) aktifAy = buAy();
    ov.hidden = false;
    ciz();
  }

  function baglan() {
    const btn = document.getElementById("rapor-ac");
    if (btn) btn.addEventListener("click", () => ac(true));
  }
  document.addEventListener("DOMContentLoaded", baglan);

  return { ac, ayVerisi, degerlendir, buAy };
})();
