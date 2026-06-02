/* ============================================================
   rituel.js — Ritüel ve Günlük Görev Sistemi 🔮✨
   Her gün kategorili/zorluklu bir ritüel (tarot kartı hissi).
   Tamamlanınca task-<gün> işaretlenir (enerji/bahçe/streak/başarım
   entegrasyonu), XP kazanılır, yıldız parçacıkları patlar.
   Yenile, favori, geçmiş, zorluk seviyeleri ve özel rozetler.
   Global: window.Rituel
   ============================================================ */

const Rituel = window.Rituel = (() => {
  const $ = sel => document.querySelector(sel);
  function bugun() { return todayKey(); }
  function rituelById(id) { return DATA.ritueller.find(r => r.id === id); }

  function aktifId() {
    const k = "rituel-secili-" + bugun();
    let id = Store.get(k);
    if (!id || !rituelById(id)) { id = pickByDate(DATA.ritueller).id; Store.set(k, id); }
    return id;
  }
  function setAktif(id) { Store.set("rituel-secili-" + bugun(), id); }
  function tamamBugun() { return Store.get("rituel-tamam-" + bugun(), []); }
  function gecmisAl() { return Store.get("rituel-gecmis", []); }
  function favAl() { return Store.get("rituel-fav", []); }
  function xpAl() { return Store.get("rituel-xp", 0) || 0; }
  function zorlukSinif(z) { return z === "Derin" ? "derin" : z === "Orta" ? "orta" : "hafif"; }

  function xpCiz() {
    const xp = xpAl(); const sev = Math.floor(xp / 100) + 1;
    $("#rituel-xp").innerHTML = `<span class="xp-rozet">Lv ${sev}</span><span class="xp-deg">${xp} XP</span>`;
  }

  function render(flip) {
    const r = rituelById(aktifId());
    if (!r) return;
    const kat = DATA.rituelKategorileri[r.kategori] || { ad: r.kategori, ikon: "✨" };
    const yap = () => {
      $("#rk-ikon").textContent = kat.ikon;
      $("#rk-kategori").textContent = kat.ad;
      $("#rk-zorluk").textContent = r.zorluk + " · +" + r.xp + " XP";
      $("#rk-zorluk").className = "rk-zorluk " + zorlukSinif(r.zorluk);
      $("#rk-metin").textContent = r.metin;
      const done = tamamBugun().includes(r.id);
      const t = $("#rituel-tamam");
      t.textContent = done ? "Tamamlandı ✦" : "Tamamla ✦";
      t.classList.toggle("tamamlandi", done);
      t.disabled = done;
      $("#rituel-fav").classList.toggle("aktif", favAl().includes(r.id));
      $("#rituel-kart").classList.toggle("done", done);
    };
    if (flip) {
      const k = $("#rituel-kart");
      k.classList.remove("flip"); void k.offsetWidth; k.classList.add("flip");
      setTimeout(yap, 220);
    } else yap();
    xpCiz();
  }

  function parcacikPatlat() {
    const kutu = $("#rituel-parcacik");
    if (!kutu) return;
    let s = "";
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * 360;
      const dist = 40 + Math.random() * 45;
      const x = Math.cos(a * Math.PI / 180) * dist;
      const y = Math.sin(a * Math.PI / 180) * dist;
      s += `<span style="--x:${x.toFixed(0)}px;--y:${y.toFixed(0)}px;animation-delay:${(Math.random() * 0.1).toFixed(2)}s"></span>`;
    }
    kutu.innerHTML = s;
    setTimeout(() => { kutu.innerHTML = ""; }, 1100);
  }

  function tamamla() {
    const r = rituelById(aktifId());
    if (!r) return;
    const tb = tamamBugun();
    if (tb.includes(r.id)) return;
    tb.push(r.id);
    Store.set("rituel-tamam-" + bugun(), tb);
    Store.set("task-" + bugun(), true);          // enerji/bahçe/başarım/streak entegrasyonu
    Store.set("rituel-xp", xpAl() + r.xp);
    const g = gecmisAl();
    g.unshift({ id: r.id, tarih: bugun(), metin: r.metin, kategori: r.kategori, zorluk: r.zorluk, xp: r.xp });
    while (g.length > 60) g.pop();
    Store.set("rituel-gecmis", g);
    parcacikPatlat();
    render(false);
    cizListeler();
    cizRozet();
    if (window.Enerji) window.Enerji.ciz();
    if (window.Bahce) window.Bahce.ciz();
    if (window.Streak) window.Streak.ciz();
    if (window.Profil) window.Profil.ciz();
  }

  function yenile() {
    const cur = aktifId();
    const havuz = DATA.ritueller.filter(r => r.id !== cur);
    const yeni = havuz[Math.floor(Math.random() * havuz.length)];
    setAktif(yeni.id);
    render(true);
  }

  function favToggle() {
    const r = rituelById(aktifId());
    const l = favAl(); const i = l.indexOf(r.id);
    if (i >= 0) l.splice(i, 1); else l.push(r.id);
    Store.set("rituel-fav", l);
    $("#rituel-fav").classList.toggle("aktif", favAl().includes(r.id));
    cizListeler();
  }

  function cizListeler() {
    const favEl = $("#rituel-fav-liste");
    const gecEl = $("#rituel-gecmis-liste");
    if (favEl) {
      const f = favAl().map(rituelById).filter(Boolean);
      favEl.innerHTML = `<p class="cs-alt-baslik">Favori Ritüeller</p>` + (f.length
        ? `<ul class="liste">${f.map(r => `<li><span class="liste-metin">${DATA.rituelKategorileri[r.kategori].ikon} ${escapeHtml(r.metin)}</span></li>`).join("")}</ul>`
        : `<p class="muted small">Henüz favori ritüel yok.</p>`);
    }
    if (gecEl) {
      const g = gecmisAl().slice(0, 10);
      gecEl.innerHTML = `<p class="cs-alt-baslik">Son Tamamlananlar</p>` + (g.length
        ? `<ul class="liste">${g.map(x => `<li><span class="liste-metin"><small>${x.tarih} · +${x.xp} XP</small><br>${(DATA.rituelKategorileri[x.kategori] || {}).ikon || ""} ${escapeHtml(x.metin)}</span></li>`).join("")}</ul>`
        : `<p class="muted small">Henüz tamamlanan ritüel yok.</p>`);
    }
  }

  function cizRozet() {
    const el = $("#rituel-rozet");
    if (!el || !DATA.rituelRozetleri) return;
    const g = gecmisAl();
    const kaz = Store.get("rituel-rozet", {});
    const kategoriler = new Set(g.map(x => x.kategori));
    const derin = g.filter(x => x.zorluk === "Derin").length;
    const kosul = { ilk: g.length >= 1, yedi: g.length >= 7, gezgin: kategoriler.size >= 5, derin: derin >= 3 };
    let d = false;
    DATA.rituelRozetleri.forEach(r => { if (kosul[r.id] && !kaz[r.id]) { kaz[r.id] = true; d = true; } });
    if (d) Store.set("rituel-rozet", kaz);
    el.innerHTML = DATA.rituelRozetleri.map(r => {
      const a = !!kaz[r.id];
      return `<span class="e-rozet${a ? " kazanildi" : ""}" title="${a ? "" : r.ipucu}">${a ? r.ad : "🔒 ???"}</span>`;
    }).join("");
  }

  function baglan() {
    if (!$("#rituel")) return;
    $("#rituel-tamam").addEventListener("click", tamamla);
    $("#rituel-yenile").addEventListener("click", yenile);
    $("#rituel-fav").addEventListener("click", favToggle);
    render(false);
    cizListeler();
    cizRozet();
  }

  document.addEventListener("DOMContentLoaded", baglan);
  return { tamamla, yenile, aktifId };
})();
