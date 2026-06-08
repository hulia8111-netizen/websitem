/* ============================================================
   gunluk.js — Kilitli Günlük Defteri 📖🔐✨
   Çocukluktaki kilitli günlük hissi: altın kilitli nostaljik defter.
   - İlk kullanımda kullanıcı kendine özel bir şifre belirler (SHA-256
     ile hash'lenip saklanır → Supabase'e senkron).
   - Deftere her girişte şifre sorulur; doğruysa açılır, yanlışsa uyarı.
   - Şifre doğru → bugünün sayfası açılır; yazı kaydedilir (otomatik +
     Kaydet) ve Supabase'e gider (gunluk-sayfa-<gün>).
   - Sayfa çevirme: ‹ önceki gün · sonraki gün › (kronolojik, arşiv).
     Geçmiş sayfalar salt-okunur; boş günlerde nazik mesaj.
   - Şifre değiştirme: Profil > Ayarlar.
   Global: window.Gunluk
   ============================================================ */

const Gunluk = window.Gunluk = (() => {
  const $ = sel => document.querySelector(sel);
  const SIFRE = "gunluk-sifre-hash";
  const SAYFA_ON = "gunluk-sayfa-";          // gunluk-sayfa-<YYYY-MM-DD>
  let acik = false;                           // bu oturumda kilit açık mı
  let bakilanGun = null;                      // görüntülenen gün
  let otoZaman = null;

  /* ---------- şifre (hash) ---------- */
  async function hash(metin) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(metin));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
  }
  function sifreVarMi() { return !!Store.get(SIFRE); }

  /* ---------- sayfa verisi ---------- */
  function sayfaAl(gun) { return Store.get(SAYFA_ON + gun, "") || ""; }
  function sayfaYaz(gun, metin) {
    const t = (metin || "").trim();
    if (t) Store.set(SAYFA_ON + gun, t);       // Store.set → otomatik Supabase senkron
    else Store.remove(SAYFA_ON + gun);
  }
  function tumGunler() {
    const on = Store.PREFIX + SAYFA_ON;
    return Store.allKeys()
      .filter(k => k.startsWith(on))
      .map(k => k.slice(on.length))
      .filter(g => /^\d{4}-\d{2}-\d{2}$/.test(g))
      .sort();
  }
  function enEskiGun() { const g = tumGunler(); return g.length ? g[0] : todayKey(); }

  /* ---------- tarih yardımcıları ---------- */
  function gunStr(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
  function gunKaydir(g, delta) { const d = keyToDate(g); d.setDate(d.getDate() + delta); return gunStr(d); }
  function uzunTarih(g) { return keyToDate(g).toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }); }

  /* ---------- eski veriyi defter sayfalarına taşı (bir kez) ---------- */
  function migrate() {
    if (Store.get("gunluk-defter-migrasyon")) return;
    const eski = Store.get("gunluk-kayitlar", []) || [];
    const map = {};
    eski.forEach(e => {
      if (!e || !e.tarih || !e.metin) return;
      map[e.tarih] = map[e.tarih] ? (map[e.tarih] + "\n\n" + e.metin) : e.metin;
    });
    Object.keys(map).forEach(g => { if (!sayfaAl(g)) Store.set(SAYFA_ON + g, map[g]); });
    Store.set("gunluk-defter-migrasyon", true);
  }

  /* ---------- KAPAK ---------- */
  function kapakCiz() {
    const acBtn = $("#defter-ac-btn"); if (!acBtn) return;
    acBtn.textContent = sifreVarMi() ? "Defteri Aç 🔑" : "Defteri Oluştur ✨";
  }
  function sifreAlaniGoster() {
    const ilk = !sifreVarMi();
    $("#defter-ac-btn").hidden = true;
    $("#defter-sifre-alan").hidden = false;
    $("#defter-sifre-baslik").textContent = ilk ? "Defterine özel bir şifre belirle 🔐" : "Şifreni gir 🔑";
    $("#defter-sifre2").hidden = !ilk;
    $("#defter-sifre").value = ""; $("#defter-sifre2").value = "";
    $("#defter-uyari").textContent = "";
    $("#defter-sifre-onay").textContent = ilk ? "Oluştur" : "Aç";
    setTimeout(() => $("#defter-sifre").focus(), 60);
  }
  async function sifreOnayla() {
    const ilk = !sifreVarMi();
    const s1 = $("#defter-sifre").value || "";
    const uyari = $("#defter-uyari");
    if (ilk) {
      const s2 = $("#defter-sifre2").value || "";
      if (s1.length < 4) { uyari.textContent = "Şifre en az 4 karakter olmalı."; return; }
      if (s1 !== s2) { uyari.textContent = "Şifreler aynı değil."; kilitSalla(); return; }
      Store.set(SIFRE, await hash(s1));
      sifreAyarCiz();
      acDefter();
    } else {
      if ((await hash(s1)) === Store.get(SIFRE)) acDefter();
      else { uyari.textContent = "Şifre yanlış. Tekrar dene 🔒"; kilitSalla(); $("#defter-sifre").select(); }
    }
  }
  function kilitSalla() {
    const k = $("#defter-kilit"); if (!k) return;
    k.classList.remove("salla"); void k.offsetWidth; k.classList.add("salla");
  }

  /* ---------- AÇ / KİLİTLE ---------- */
  function acDefter() {
    acik = true;
    const kilit = $("#defter-kilit");
    kilit.classList.add("acildi");              // anahtar döner, kilit açılır
    setTimeout(() => {
      $("#defter-kapak").hidden = true;
      const ad = $("#defter-acik");
      ad.hidden = false;
      ad.classList.remove("acilis-anim"); void ad.offsetWidth; ad.classList.add("acilis-anim");
      bakilanGun = todayKey();
      sayfaGoster(bakilanGun);
    }, 850);
  }
  function kilitle() {
    acik = false;
    $("#defter-acik").hidden = true;
    $("#defter-kapak").hidden = false;
    const kilit = $("#defter-kilit"); kilit.classList.remove("acildi", "salla");
    $("#defter-sifre-alan").hidden = true;
    $("#defter-ac-btn").hidden = false;
    kapakCiz();
  }

  /* ---------- SAYFA ---------- */
  function sayfaGoster(gun) {
    bakilanGun = gun;
    const bugun = gun === todayKey();
    $("#sayfa-tarih").textContent = uzunTarih(gun) + (bugun ? " · Bugün" : "");
    const ta = $("#defter-metin"), oku = $("#sayfa-okuma"), kaydet = $("#defter-kaydet");
    const metin = sayfaAl(gun);
    if (bugun) {
      ta.hidden = false; oku.hidden = true; kaydet.hidden = false;
      ta.value = metin;
      $("#defter-bilgi").textContent = "";
    } else {
      ta.hidden = true; oku.hidden = false; kaydet.hidden = true;
      oku.innerHTML = metin
        ? `<p class="okuma-metin">${escapeHtml(metin).replace(/\n/g, "<br>")}</p>`
        : `<p class="okuma-bos">Bu güne ait bir kayıt yok 🌙</p>`;
      $("#defter-bilgi").textContent = "";
    }
    $("#sayfa-geri").disabled = gun <= enEskiGun();
    $("#sayfa-ileri").disabled = gun >= todayKey();
  }
  function sayfaCevir(yon) {
    if (yon < 0 && bakilanGun <= enEskiGun()) return;
    if (yon > 0 && bakilanGun >= todayKey()) return;
    const hedef = gunKaydir(bakilanGun, yon);
    const sayfa = $("#defter-sayfa");
    const sinif = yon < 0 ? "cevir-geri" : "cevir-ileri";
    sayfa.classList.remove("cevir-geri", "cevir-ileri"); void sayfa.offsetWidth;
    sayfa.classList.add(sinif);
    setTimeout(() => sayfaGoster(hedef), 200);            // animasyon ortasında içerik değişir
    setTimeout(() => sayfa.classList.remove(sinif), 460);
  }
  function kaydet(sessiz) {
    if (bakilanGun !== todayKey()) return;
    const metin = $("#defter-metin").value;
    sayfaYaz(todayKey(), metin);
    if (!sessiz) {
      const b = $("#defter-bilgi");
      b.textContent = metin.trim() ? "Kaydedildi ✦" : "Bugünün sayfası boş.";
      setTimeout(() => { if (b.textContent) b.textContent = ""; }, 2200);
    }
  }

  /* ---------- PROFİL > şifre değiştir ---------- */
  function sifreAyarCiz() {
    const el = $("#gunluk-sifre-alan"); if (!el) return;
    if (!sifreVarMi()) {
      el.innerHTML = `<p class="muted small">Henüz günlük şifren yok. Defteri ilk açtığında bir şifre belirleyeceksin.</p>`;
      return;
    }
    el.innerHTML = `
      <input type="password" id="gs-eski" placeholder="Mevcut şifre" autocomplete="off" />
      <input type="password" id="gs-yeni" placeholder="Yeni şifre (en az 4)" autocomplete="off" />
      <input type="password" id="gs-yeni2" placeholder="Yeni şifre (tekrar)" autocomplete="off" />
      <button class="btn sm" id="gs-degistir">Şifreyi Değiştir</button>
      <span class="kayit-bilgi" id="gs-bilgi"></span>`;
    $("#gs-degistir").addEventListener("click", async () => {
      const eski = $("#gs-eski").value || "", yeni = $("#gs-yeni").value || "", yeni2 = $("#gs-yeni2").value || "";
      const bilgi = $("#gs-bilgi");
      const goster = (m, ok) => { bilgi.textContent = m; bilgi.style.color = ok ? "var(--basari)" : "var(--uyari)"; };
      if ((await hash(eski)) !== Store.get(SIFRE)) return goster("Mevcut şifre yanlış.", false);
      if (yeni.length < 4) return goster("Yeni şifre en az 4 karakter olmalı.", false);
      if (yeni !== yeni2) return goster("Yeni şifreler aynı değil.", false);
      Store.set(SIFRE, await hash(yeni));
      $("#gs-eski").value = $("#gs-yeni").value = $("#gs-yeni2").value = "";
      goster("Şifren güncellendi ✦", true);
    });
  }

  /* ---------- bağlama ---------- */
  function baglan() {
    if (!$("#gunluk")) return;
    migrate();
    kapakCiz();
    sifreAyarCiz();

    $("#defter-ac-btn").addEventListener("click", sifreAlaniGoster);
    $("#defter-sifre-onay").addEventListener("click", sifreOnayla);
    $("#defter-sifre").addEventListener("keydown", e => { if (e.key === "Enter") { if ($("#defter-sifre2").hidden) sifreOnayla(); else $("#defter-sifre2").focus(); } });
    $("#defter-sifre2").addEventListener("keydown", e => { if (e.key === "Enter") sifreOnayla(); });

    $("#sayfa-geri").addEventListener("click", () => sayfaCevir(-1));
    $("#sayfa-ileri").addEventListener("click", () => sayfaCevir(1));
    $("#defter-kaydet").addEventListener("click", () => kaydet(false));
    $("#defter-kilitle").addEventListener("click", kilitle);

    // otomatik kayıt (bugünün sayfası) — yazarken Supabase'e gider
    $("#defter-metin").addEventListener("input", () => {
      clearTimeout(otoZaman);
      otoZaman = setTimeout(() => kaydet(true), 700);
    });
  }

  document.addEventListener("DOMContentLoaded", baglan);
  return { sifreAyarCiz };
})();
