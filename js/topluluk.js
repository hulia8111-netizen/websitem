/* ============================================================
   topluluk.js — "Topluluk · Haftanın Işığı" 🌟 (Faz 1: otomatik liderlik)
   - UGC YOK: yalnızca otomatik haftalık puan + liderlik + rozet + arşiv.
   - Puan, mevcut Store aktivitelerinden hesaplanır (yerel, offline çalışır).
   - Giriş yapan kullanıcılar skorunu Supabase'e yazar; Top 50 oradan okunur.
   - Pazar 23:59'da bir Edge Function kazananları seçip arşivler (sunucu tarafı).
   Sekmeler: 🌟 Haftanın Işığı · 🏅 Rozetlerim · 📜 Geçmiş Kazananlar
   Global: window.Topluluk
   ============================================================ */
const Topluluk = window.Topluluk = (() => {
  const $ = id => document.getElementById(id);
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

  // Puan tablosu (gün başına / adet başına)
  const PUAN = { giris: 5, kart: 10, meditasyon: 15, gorev: 10, gunluk: 15, farkindalik: 5, sukran: 10, haftalik: 50 };
  const ETIKET = {
    giris: { ad: "Günlük giriş", ikon: "🌅" }, kart: { ad: "Günün kartı", ikon: "🃏" },
    meditasyon: { ad: "Meditasyon", ikon: "🧘" }, gorev: { ad: "Günün görevleri", ikon: "✅" },
    gunluk: { ad: "Günlük defteri", ikon: "📔" }, farkindalik: { ad: "Farkındalık sorusu", ikon: "🔎" },
    sukran: { ad: "Şükran defteri", ikon: "🙏" }, haftalik: { ad: "Haftalık görev", ikon: "🌟" }
  };

  let aktifSekme = "paylasim";   // varsayılan: Paylaşımlar (sonra Duyurular, Işık, Galeri, Rozet, Geçmiş)
  let liderlik = null, kazananlar = null, yukleniyor = false;

  /* ---------- Hafta hesabı (Pazartesi başlangıç → Pazar 23:59 bitiş) ---------- */
  function haftaBaslangic(d) { d = d || new Date(); const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); const gun = (x.getDay() + 6) % 7; x.setDate(x.getDate() - gun); return x; }
  function haftaId(d) { return todayKey(haftaBaslangic(d)); }              // "YYYY-MM-DD" (o haftanın Pazartesi'si)
  function haftaGunleri() { const b = haftaBaslangic(); const bugun = new Date(); const out = []; for (let i = 0; i < 7; i++) { const g = new Date(b); g.setDate(b.getDate() + i); if (g > bugun) break; out.push(todayKey(g)); } return out; }
  function haftaNo(d) { d = d || new Date(); const t = new Date(d.getFullYear(), d.getMonth(), d.getDate()); const gun = (t.getDay() + 6) % 7; t.setDate(t.getDate() - gun + 3); const ilk = new Date(t.getFullYear(), 0, 4); return 1 + Math.round(((t - ilk) / 86400000 - 3 + ((ilk.getDay() + 6) % 7)) / 7); }
  function kalanGunYazi() {
    const b = haftaBaslangic(); const bit = new Date(b); bit.setDate(b.getDate() + 7);
    const kalanMs = bit - new Date(); const gun = Math.floor(kalanMs / 86400000); const saat = Math.floor((kalanMs % 86400000) / 3600000);
    if (gun > 0) return `${gun} gün ${saat} saat`; return `${saat} saat`;
  }

  /* ---------- Puan hesabı (yerel, offline) ---------- */
  function gunSay(prefix, gunler) { return gunler.filter(g => Store.get(prefix + g)).length; }
  function kirilim() {
    const gunler = haftaGunleri(); const gset = new Set(gunler);
    const adet = {
      giris: gunSay("visit-", gunler), kart: gunSay("card-", gunler), meditasyon: gunSay("med-", gunler),
      gorev: gunSay("task-", gunler), gunluk: gunSay("gunluk-sayfa-", gunler), farkindalik: gunSay("awa-", gunler),
      sukran: ((Store.get("gratitude", []) || []).filter(x => x && gset.has(x.tarih)).length),
      haftalik: 0
    };
    // Haftalık görev: tamamlanma tarihi bu haftanın gün aralığında mı? (hafta-id şeması fark etmez)
    const a = Store.get("hh-aktif", null); const arsiv = Store.get("hh-arsiv", []) || [];
    const haftalikTamam =
      (a && a.tamam && a.tamamTarih && gset.has(a.tamamTarih)) ||
      arsiv.some(x => x && x.tarih && gset.has(x.tarih));
    adet.haftalik = haftalikTamam ? 1 : 0;
    const puanlar = {}; let toplam = 0;
    Object.keys(PUAN).forEach(k => { puanlar[k] = adet[k] * PUAN[k]; toplam += puanlar[k]; });
    return { adet, puanlar, toplam };
  }
  function puan() { return kirilim().toplam; }

  /* ---------- Supabase (giriş yapan kullanıcı) ---------- */
  function sb() { try { return window.Bulut && Bulut.client ? Bulut.client() : null; } catch (e) { return null; } }
  function uid() { try { return window.Bulut && Bulut.kullaniciId ? Bulut.kullaniciId() : null; } catch (e) { return null; } }
  function benimAdim() { const p = Store.get("profil", {}) || {}; return (p.isim || "").trim() || "İsimsiz Işık"; }
  // Vitrinde/sıralamada görünmek istemeyen kullanıcı → herkese "Bir Işık Yolcusu" olarak görünür
  function vitrinGizli() { return Store.get("vitrin-gizli") === true; }
  function skorAdi() { return vitrinGizli() ? "Bir Işık Yolcusu" : benimAdim(); }

  async function skorGonder() {
    const c = sb(); const id = uid(); if (!c || !id) return false;
    try {
      const k = kirilim();
      const { error } = await c.from("topluluk_skor").upsert(
        { user_id: id, hafta: haftaId(), ad: skorAdi(), puan: k.toplam, kirilim: k.puanlar, guncelleme: new Date().toISOString() },
        { onConflict: "user_id,hafta" });
      return !error;
    } catch (e) { return false; }
  }
  async function liderlikAl() {
    const c = sb(); if (!c) return null;
    try {
      const { data, error } = await c.from("topluluk_skor").select("user_id,ad,puan").eq("hafta", haftaId()).order("puan", { ascending: false }).limit(50);
      if (error) return null; return data || [];
    } catch (e) { return null; }
  }
  async function kazananlarAl() {
    const c = sb(); if (!c) return null;
    try {
      const { data, error } = await c.from("topluluk_kazananlar").select("*").order("hafta", { ascending: false }).order("sira", { ascending: true }).limit(300);
      if (error) return null; return data || [];
    } catch (e) { return null; }
  }

  /* ---------- Render ---------- */
  function rozetEtiket(r, sira) {
    if (r === "yukselen" || sira === 0) return { ad: "Yükselen Işık", ikon: "🌱" };
    if (r === "altin" || sira === 1) return { ad: "Altın Işık Rozeti", ikon: "🥇" };
    return { ad: "Haftanın Işık Rozeti", ikon: "🏅" };
  }

  // Kazanan kartını çöz: 1. sıra Word kartını taşır (kart_baslik dolu);
  // 2..10 yalnız deste indeksi taşır → başlık/mesaj DATA.kartlar'dan çözülür.
  function kazananKart(r) {
    if (r.kart_baslik) return { baslik: r.kart_baslik, aciklama: r.kart_aciklama || "" };
    try {
      if (r.rozet === "hafta" && r.kart_no != null && typeof DATA !== "undefined" && DATA.kartlar && DATA.kartlar[r.kart_no]) {
        const d = DATA.kartlar[r.kart_no]; return { baslik: d.baslik, aciklama: d.mesaj || "" };
      }
    } catch (e) {}
    return null;
  }

  function cizSekmeler() {
    const sek = [["paylasim", "📝 Paylaşımlar"], ["duyuru", "📢 Duyurular"], ["isik", "🌟 Işık"], ["galeri", "📸 Galeri"], ["rozet", "🏅 Rozetler"], ["gecmis", "📜 Geçmiş"]];
    if (window.ToplulukSosyal && ToplulukSosyal.moderatorMuCached && ToplulukSosyal.moderatorMuCached()) sek.push(["moderasyon", "🛡️ Moderasyon"]);
    return `<div class="tp-sekmeler tp-sekmeler-kaydir">${sek.map(([id, ad]) =>
      `<button class="tp-sekme${aktifSekme === id ? " aktif" : ""}" data-sek="${id}">${esc(ad)}</button>`).join("")}</div>`;
  }

  function cizIsik() {
    const k = kirilim(); const id = uid();
    // kişisel puan kartı + kırılım
    const satirlar = Object.keys(PUAN).filter(x => k.adet[x] > 0).map(x =>
      `<li><span class="tp-kr-sol">${ETIKET[x].ikon} ${esc(ETIKET[x].ad)}${k.adet[x] > 1 ? ` ×${k.adet[x]}` : ""}</span><span class="tp-kr-puan">+${k.puanlar[x]}</span></li>`).join("")
      || `<li class="tp-kr-bos">Bu hafta henüz puan yok — bir kart çek, meditasyon yap, görevini tamamla 🌿</li>`;

    let liderHtml = "";
    if (!id) {
      liderHtml = `<div class="tp-bilgi">🔒 Liderlik tablosunda yer almak için <b>giriş yap</b>. Puanların yine de aşağıda birikiyor; giriş yapınca tabloya eklenirsin.</div>`;
    } else if (liderlik === null) {
      liderHtml = navigator.onLine === false
        ? `<div class="tp-bilgi">🌙 Liderlik tablosu için internet gerekiyor. Bağlanınca kendiliğinden yenilenir.</div>`
        : `<div class="tp-bilgi">🌐 Liderlik tablosu yükleniyor…</div>`;
    } else if (!liderlik.length) {
      liderHtml = `<div class="tp-bilgi">✨ Bu hafta tablo henüz boş. İlk ışık sen ol — etkinliklerini tamamla!</div>`;
    } else {
      const benim = liderlik.findIndex(r => r.user_id === id);
      const sat = liderlik.slice(0, 50).map((r, i) => {
        const madalya = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`;
        const ben = r.user_id === id ? " ben" : "";
        return `<li class="tp-lider${ben}${i < 3 ? " ust" : ""}"><span class="tp-sira">${madalya}</span><span class="tp-ad">${esc(r.ad || "İsimsiz Işık")}${ben ? " <b>(sen)</b>" : ""}</span><span class="tp-puan">${r.puan} ✨</span></li>`;
      }).join("");
      let benimSira = "";
      if (benim >= 0) {
        const p = liderlik[benim].puan || 0;
        const ucuncu = liderlik[2] ? (liderlik[2].puan || 0) : 0;
        const motive = benim < 3
          ? `🌟 Şu an ilk 3'tesin — Pazar 23:59'a kadar böyle kalırsan vitrine çıkarsın!`
          : `✨ İlk 3'e <b>${Math.max(1, ucuncu - p + 1)}</b> ışık kaldı — vitrine çıkmak sana çok yakın.`;
        benimSira = `<div class="tp-benim-sira">📍 Senin sıran: <b>${benim + 1}.</b> · ${p} ✨<div class="tp-motive">${motive}</div></div>`;
      }
      liderHtml = `${benimSira}<ol class="tp-liderlik">${sat}</ol>`;
    }

    return `
      <div class="tp-hafta-bilgi">🗓️ ${haftaNo()}. hafta · sıralama yenilenmesine <b>${kalanGunYazi()}</b></div>
      <div class="tp-puan-kart">
        <div class="tp-puan-buyuk">${k.toplam}<span>✨ bu hafta</span></div>
        <ul class="tp-kirilim">${satirlar}</ul>
      </div>
      <div class="tp-odul-not">
        <h3>🏆 Haftanın Ödülleri</h3>
        <p>🥇 <b>1. sıra:</b> “Haftanın Işık Saçan Ruhu” unvanı + Altın Işık Rozeti + özel bir ışık kartı ve uzun mesajı.</p>
        <p>🏅 <b>İlk 10:</b> Haftanın Işık Rozeti + sana özel bir Işık Kartı.</p>
        <p>👑 <b>İlk 3</b> ve 🌱 <b>Yükselen Işık</b> (geçen haftaya göre en çok parlayan): bir hafta boyunca topluluk vitrininde ve adının yanında rozetle görünür.</p>
      </div>
      <h3 class="tp-baslik2">🌟 Liderlik Tablosu</h3>
      ${liderHtml}
      <label class="tp-vitrin-ayar"><input type="checkbox" id="tp-vitrin-gorun"${vitrinGizli() ? "" : " checked"}> Adım haftanın vitrininde ve sıralamada görünebilir <span class="muted small">(kapatırsan “Bir Işık Yolcusu” olarak görünürsün)</span></label>`;
  }

  function cizRozet() {
    const id = uid();
    if (!id) return `<div class="tp-bilgi">🔒 Rozetlerini görmek ve kazanmak için <b>giriş yap</b>.</div>`;
    if (kazananlar === null) return `<div class="tp-bilgi">🌐 Rozetlerin yükleniyor…</div>`;
    const benim = kazananlar.filter(r => r.user_id === id);
    if (!benim.length) return `
      <div class="tp-rozet-bos">
        <div class="tp-rb-ikon">🏅</div>
        <p>Henüz rozetin yok. Bu hafta ilk 10'a gir, ilk rozetini kazan! 🌿</p>
        <p class="muted small">Pazar 23:59'da sıralama kapanır ve kazananlar belirlenir.</p>
      </div>`;
    const kart = benim.map(r => {
      const rz = rozetEtiket(r.rozet, r.sira);
      const kk = kazananKart(r);
      const kartHtml = kk ? `<div class="tp-rz-kart"><div class="tp-rz-kart-bas">🃏 ${esc(kk.baslik)}</div>${kk.aciklama ? `<div class="tp-rz-kart-ac">${esc(kk.aciklama).replace(/\n/g, "<br>")}</div>` : ""}</div>` : "";
      return `<div class="tp-rozet-kart${r.sira === 1 ? " altin" : ""}">
        <div class="tp-rz-ust"><span class="tp-rz-ikon">${rz.ikon}</span><div><div class="tp-rz-ad">${esc(rz.ad)}</div><div class="tp-rz-hafta">${esc(r.hafta)} · ${r.sira}. sıra · ${r.puan || 0} ✨</div></div></div>
        ${r.unvan ? `<div class="tp-rz-unvan">👑 ${esc(r.unvan)}</div>` : ""}
        ${kartHtml}
      </div>`;
    }).join("");
    return `<div class="tp-rozetlerim">${kart}</div>`;
  }

  function cizGecmis() {
    if (kazananlar === null) return `<div class="tp-bilgi">🌐 Geçmiş kazananlar yükleniyor…</div>`;
    if (!kazananlar.length) return `
      <div class="tp-rozet-bos"><div class="tp-rb-ikon">📜</div>
      <p>Henüz tamamlanmış bir hafta yok. İlk kazananlar bu Pazar belli olacak! ✨</p></div>`;
    // haftalara göre grupla
    const gruplar = {};
    kazananlar.forEach(r => { (gruplar[r.hafta] = gruplar[r.hafta] || []).push(r); });
    const haftalar = Object.keys(gruplar).sort().reverse();
    return haftalar.map(h => {
      const yukselen = gruplar[h].find(r => r.sira === 0);
      const liste = gruplar[h].filter(r => r.sira > 0).sort((a, b) => a.sira - b.sira);
      const bir = liste[0];
      const digerleri = liste.slice(1).map(r =>
        `<li><span class="tp-g-sira">${r.sira}</span><span class="tp-g-ad">${esc(r.ad || "İsimsiz Işık")}</span><span class="tp-g-puan">${r.puan || 0} ✨</span></li>`).join("");
      return `<div class="tp-gecmis-hafta">
        <div class="tp-gh-bas">🗓️ ${esc(h)} haftası</div>
        ${bir ? `<div class="tp-gh-bir">
          <div class="tp-ghb-madalya">🥇</div>
          <div class="tp-ghb-ad">${esc(bir.ad || "İsimsiz Işık")}</div>
          ${bir.unvan ? `<div class="tp-ghb-unvan">👑 ${esc(bir.unvan)}</div>` : ""}
          ${bir.kart_baslik ? `<div class="tp-ghb-kart">🃏 ${esc(bir.kart_baslik)}</div>` : ""}
        </div>` : ""}
        ${digerleri ? `<ol class="tp-gecmis-liste">${digerleri}</ol>` : ""}
        ${yukselen ? `<div class="tp-gh-yukselen">🌱 Yükselen Işık: <b>${esc(yukselen.ad || "İsimsiz Işık")}</b></div>` : ""}
      </div>`;
    }).join("");
  }

  function ciz() {
    const kutu = $("topluluk-icerik"); if (!kutu) return;
    kutu.innerHTML = cizSekmeler() + `<div class="tp-govde" id="tp-govde"></div>`;
    kutu.querySelectorAll(".tp-sekme").forEach(b => b.addEventListener("click", () => { aktifSekme = b.dataset.sek; ciz(); if ((aktifSekme === "rozet" || aktifSekme === "gecmis") && kazananlar === null) verileriYukle(); }));
    const govde = $("tp-govde"); if (!govde) return;
    // İnternet yoksa: buluttan gelen sekmelerde süresiz "yükleniyor" yerine açık mesaj
    if (navigator.onLine === false && (["duyuru", "paylasim", "galeri", "moderasyon"].includes(aktifSekme) ||
        ((aktifSekme === "rozet" || aktifSekme === "gecmis") && kazananlar === null))) {
      govde.innerHTML = `<div class="tp-bilgi">🌙 Topluluk için internet bağlantısı gerekiyor. Bağlandığında burası kendiliğinden yenilenir.<br><span class="muted small">Uygulamanın geri kalanını internetsiz de kullanabilirsin.</span></div>`;
      return;
    }
    if (aktifSekme === "isik") {
      govde.innerHTML = cizIsik();
      const vg = $("tp-vitrin-gorun");
      if (vg) vg.addEventListener("change", async () => {
        Store.set("vitrin-gizli", !vg.checked);
        await skorGonder();                       // adı hemen güncelle (sıralama + vitrin)
        liderlik = await liderlikAl(); ciz();
      });
    }
    else if (aktifSekme === "rozet") govde.innerHTML = cizRozet();
    else if (aktifSekme === "gecmis") govde.innerHTML = cizGecmis();
    else if (aktifSekme === "duyuru") { if (window.ToplulukDuyuru) ToplulukDuyuru.cizDuyurular(govde); else govde.innerHTML = `<div class="tp-bilgi">Yükleniyor…</div>`; }
    else if (aktifSekme === "paylasim") { if (window.ToplulukSosyal) ToplulukSosyal.cizPaylasimlar(govde); else govde.innerHTML = `<div class="tp-bilgi">Yükleniyor…</div>`; }
    else if (aktifSekme === "galeri") { if (window.ToplulukSosyal) ToplulukSosyal.cizGaleri(govde); else govde.innerHTML = `<div class="tp-bilgi">Yükleniyor…</div>`; }
    else if (aktifSekme === "moderasyon") { if (window.ToplulukSosyal) ToplulukSosyal.cizModerasyon(govde); }
  }

  async function verileriYukle() {
    if (yukleniyor) return; yukleniyor = true;
    await skorGonder();
    const [lid, kaz] = await Promise.all([liderlikAl(), kazananlarAl()]);
    // null (tablo yok / hata) → boş liste: süresiz "yükleniyor" yerine dostça boş-durum göster
    liderlik = lid === null ? [] : lid; kazananlar = kaz === null ? [] : kaz; yukleniyor = false;
    ciz();
  }

  // İnternet geri gelince Topluluk açıksa tazele
  window.addEventListener("online", () => {
    const ov = $("topluluk-overlay");
    if (ov && !ov.hidden) { if (liderlik === null || kazananlar === null) verileriYukle(); else ciz(); }
  });

  /* ---------- Overlay aç/kapat ---------- */
  function ac() {
    const ov = $("topluluk-overlay"); if (!ov) return;
    ov.hidden = false;
    aktifSekme = "paylasim"; ciz();
    verileriYukle();
    // Sosyal modülü hazırla (moderatör/engel/takip) → bitince sekmeleri tazele (Moderasyon sekmesi belirsin)
    if (window.ToplulukSosyal && ToplulukSosyal.hazirla) ToplulukSosyal.hazirla().then(() => { if (!$("topluluk-overlay").hidden) ciz(); });
  }
  function kapat() { const ov = $("topluluk-overlay"); if (ov) ov.hidden = true; }

  function baglan() {
    const acBtn = $("topluluk-ac"); if (acBtn) acBtn.addEventListener("click", ac);
    const kapatBtn = $("topluluk-kapat"); if (kapatBtn) kapatBtn.addEventListener("click", kapat);
    const ov = $("topluluk-overlay"); if (ov) ov.addEventListener("click", e => { if (e.target === ov) kapat(); });
  }
  document.addEventListener("DOMContentLoaded", baglan);

  return { ac, kapat, ciz, puan, kirilim, haftaId, skorGonder };
})();
