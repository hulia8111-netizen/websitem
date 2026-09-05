/* ============================================================
   seri.js — Nazik Günlük Seri 🔥 + Affet Hakkı 🕊️ + Kutlamalar
   ------------------------------------------------------------
   "Günlük seri" = üst üste (ardışık) gelinen gün sayısı. Ama NAZİK:
   bir günü kaçırırsan "affet hakkın" varsa seri korunur (zincir kırılmaz).
   Affet hakkı: 1 ile başlar, her 7 ardışık günde +1 (en fazla 2).
   3 / 7 / 21 / 40 ardışık günde özel kutlama.
   app.js bugünün ziyaretini işledikten SONRA yüklenir. Global: window.Seri
   ============================================================ */
window.Seri = (() => {
  const $ = id => document.getElementById(id);
  const AFFET_MAX = 2;                    // aynı anda en fazla 2 affet hakkı
  const KUTLAMALAR = [
    { gun: 3,  rozet: "🔥", ad: "3 Günlük Seri",  mesaj: "Üç gün üst üste! Ateşin yandı, böyle devam 🔥" },
    { gun: 7,  rozet: "🌟", ad: "7 Günlük Seri",  mesaj: "Bir hafta boyunca kendine sadık kaldın. İstikrar en güçlü duan ✨" },
    { gun: 21, rozet: "💫", ad: "21 Günlük Seri", mesaj: "21 gün… Yeni bir alışkanlık doğuyor, yeni bir sen 🌸" },
    { gun: 40, rozet: "🌙", ad: "40 Günlük Seri", mesaj: "Kırk gün — bir dönüşüm eşiği. İçindeki ışık artık bambaşka parlıyor 🌙" }
  ];

  function gunFarki(a, b) { return Math.round((keyToDate(b) - keyToDate(a)) / 86400000); }
  function gunEkle(key, n) { const d = keyToDate(key); d.setDate(d.getDate() + n); return todayKey(d); }

  function ziyaretGunleri() {
    return Store.allKeys()
      .filter(k => k.startsWith(Store.PREFIX + "visit-"))
      .map(k => k.replace(Store.PREFIX + "visit-", ""))
      .filter(g => Store.get("visit-" + g))
      .sort();
  }
  // Mevcut günler = ziyaretler ∪ affedilen günler
  function mevcutSet() {
    const s = new Set(ziyaretGunleri());
    (Store.get("seri-affedilen", []) || []).forEach(g => s.add(g));
    return s;
  }
  // Bugünden (yoksa dünden) geriye ardışık gün sayısı
  function guncelSeri() {
    const set = mevcutSet();
    let imlec = todayKey();
    if (!set.has(imlec)) imlec = gunEkle(imlec, -1);
    let seri = 0;
    while (set.has(imlec)) { seri++; imlec = gunEkle(imlec, -1); }
    return seri;
  }

  /* ---------- günde 1 kez: gap kontrolü + affet ---------- */
  function kontrolVeAffet() {
    const bugun = todayKey();
    if (Store.get("seri-son-kontrol") === bugun) return;   // bugün zaten bakıldı
    Store.set("seri-affet-bildirim", "");                  // eski bildirimi temizle

    const ziyaretler = ziyaretGunleri().filter(d => d < bugun);
    if (ziyaretler.length) {
      const son = ziyaretler[ziyaretler.length - 1];
      const fark = gunFarki(son, bugun);
      // fark===1: dün gelmiş (zincir sağlam) · fark===2: tam 1 gün kaçmış → affet
      if (fark === 2) {
        let hak = Store.get("seri-affet-hak", 1);
        if (hak > 0) {
          const eksik = gunEkle(bugun, -1);                // dün
          const aff = Store.get("seri-affedilen", []) || [];
          if (aff.indexOf(eksik) === -1) { aff.push(eksik); Store.set("seri-affedilen", aff); }
          Store.set("seri-affet-hak", hak - 1);
          Store.set("seri-affet-bildirim", eksik);         // mesaj göstermek için
        }
      }
    }
    Store.set("seri-son-kontrol", bugun);
  }

  /* ---------- affet hakkı kazanımı (her 7 ardışık günde +1) ---------- */
  function hakKazanimi(seri) {
    const kat = Math.floor(seri / 7);                      // kaç tam 7 gün
    const oncekiKat = Store.get("seri-affet-kat", 0) || 0;
    if (kat > oncekiKat) {
      let hak = Store.get("seri-affet-hak", 1);
      hak = Math.min(AFFET_MAX, hak + (kat - oncekiKat));
      Store.set("seri-affet-hak", hak);
      Store.set("seri-affet-kat", kat);
    }
  }

  /* ---------- kutlama ---------- */
  function kutlananlar() { return Store.get("seri-kutlanan", null); }
  function kutlamaKontrol(seri) {
    let kutl = kutlananlar();
    const ulasilan = KUTLAMALAR.filter(k => seri >= k.gun);
    if (kutl === null) {                                   // ilk çalıştırma → retro kutlama yok
      const ilk = {}; ulasilan.forEach(k => ilk[k.gun] = true);
      Store.set("seri-kutlanan", ilk); return;
    }
    const yeni = ulasilan.filter(k => !kutl[k.gun]);
    if (!yeni.length) return;
    yeni.forEach(k => kutl[k.gun] = true);
    Store.set("seri-kutlanan", kutl);
    kutla(yeni[yeni.length - 1]);
  }
  function kutla(k) {
    const pop = $("odul-popup"); if (!pop) return;
    if ($("odul-rozet")) $("odul-rozet").textContent = k.rozet;
    if ($("odul-ad")) $("odul-ad").textContent = k.ad;
    if ($("odul-mesaj")) $("odul-mesaj").textContent = k.mesaj;
    const yk = $("odul-yildizlar");
    if (yk) {
      yk.innerHTML = Array.from({ length: 16 }, () => "<span></span>").join("");
      [...yk.children].forEach(s => { s.style.left = (Math.random() * 100).toFixed(1) + "%"; s.style.top = (Math.random() * 100).toFixed(1) + "%"; s.style.animationDelay = (Math.random() * 0.7).toFixed(2) + "s"; });
    }
    pop.hidden = false; pop.classList.remove("gor"); void pop.offsetWidth; pop.classList.add("gor");
    if (window.Keyif) Keyif.kutlama();
  }

  /* ---------- çiz ---------- */
  function ciz() {
    const el = $("streak-seri"); if (!el) return;
    kontrolVeAffet();
    const seri = guncelSeri();
    hakKazanimi(seri);
    kutlamaKontrol(seri);

    const hak = Store.get("seri-affet-hak", 1);
    const affetBildirim = Store.get("seri-affet-bildirim", "");
    const kalpler = hak > 0 ? "🕊️".repeat(hak) : "—";

    let ana;
    if (seri <= 0) ana = `<span class="ss-alev">🔥</span> Yeni bir seri başlat`;
    else ana = `<span class="ss-alev">🔥</span> <b>${seri}</b> günlük seri`;

    let html = `<div class="ss-satir"><div class="ss-ana">${ana}</div>
      <div class="ss-affet" title="Affet hakkı: kaçırılan 1 günü affeder, serini korur">${kalpler} <span class="ss-affet-yazi">${hak} affet hakkı</span></div></div>`;

    if (affetBildirim) {
      html += `<div class="ss-not korundu">🕊️ Bir günü kaçırdın ama serin korundu — 1 affet hakkın kullanıldı</div>`;
    } else if (seri >= 1) {
      const sonraki = KUTLAMALAR.find(k => k.gun > seri);
      if (sonraki) html += `<div class="ss-not">${sonraki.gun - seri} gün sonra: ${sonraki.rozet} ${sonraki.ad}</div>`;
    } else {
      html += `<div class="ss-not">Bugün gel, yarın da gel — zincir başlasın 🌙</div>`;
    }
    el.innerHTML = html;
    el.hidden = false;
  }

  function baglan() { ciz(); setTimeout(ciz, 500); }
  document.addEventListener("DOMContentLoaded", baglan);
  return { ciz, guncelSeri };
})();
