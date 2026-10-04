/* ============================================================
   vitrin.js — "Haftanın Işıkları" topluluk vitrini 👑
   ------------------------------------------------------------
   Biten haftanın ilk 3'ünü + 🌱 Yükselen Işık'ı (topluluk_kazananlar,
   sira 1..3 ve 0) bir hafta boyunca Paylaşımlar akışının en üstünde
   altın çerçeveli bir kartla onurlandırır. Herkes "✨ Tebrikler"
   bırakabilir (topluluk_vitrin_tepki). Kazananlar o hafta boyunca
   paylaşım/yorumlarında adlarının yanında 👑 🥈 🥉 🌱 ile görünür.
   Sadece ilk 3 + Yükselen gösterilir; kimse sıralamada teşhir edilmez.
   Vitrinde görünmek istemeyen, Işık sekmesinden kapatır → "Bir Işık Yolcusu".
   Global: window.Vitrin
   ============================================================ */
const Vitrin = window.Vitrin = (() => {
  const YEREL = "kdm_vitrin-onbellek";        // internetsizken son vitrin (Store değil: buluta senkronlanmasın)
  const ROZET = {
    1: { ikon: "👑", ad: "Haftanın Işık Saçan Ruhu" },
    2: { ikon: "🥈", ad: "Haftanın Işık Saçanı" },
    3: { ikon: "🥉", ad: "Haftanın Işık Saçanı" },
    0: { ikon: "🌱", ad: "Yükselen Işık" }
  };
  let veri = null;   // { hafta, kazananlar:[{sira,user_id,ad,puan}], tebrik, benim }

  function sb() { try { return window.Bulut && Bulut.client ? Bulut.client() : null; } catch (e) { return null; } }
  function uid() { try { return window.Bulut && Bulut.kullaniciId ? Bulut.kullaniciId() : null; } catch (e) { return null; } }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

  /* Biten (bir önceki) haftanın Pazartesi anahtarı — sunucuyla aynı şema "YYYY-MM-DD" */
  function gecenHafta() {
    const d = new Date(); const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    x.setDate(x.getDate() - ((x.getDay() + 6) % 7) - 7);
    return todayKey(x);
  }
  function yerelAl(hafta) {
    try { const v = JSON.parse(localStorage.getItem(YEREL) || "null"); return v && v.hafta === hafta ? v : null; } catch (e) { return null; }
  }
  function yerelYaz(v) { try { localStorage.setItem(YEREL, JSON.stringify(v)); } catch (e) {} }

  async function yukle() {
    const hafta = gecenHafta();
    const c = sb();
    if (!c || navigator.onLine === false) { veri = yerelAl(hafta); return veri; }
    try {
      const { data, error } = await c.from("topluluk_kazananlar").select("sira,user_id,ad,puan")
        .eq("hafta", hafta).lte("sira", 3).order("sira", { ascending: true });
      if (error) throw error;
      let tebrik = 0, benim = false;
      try {
        const r = await c.from("topluluk_vitrin_tepki").select("user_id", { count: "exact", head: true }).eq("hafta", hafta);
        tebrik = r.count || 0;
        const id = uid();
        if (id) { const b = await c.from("topluluk_vitrin_tepki").select("user_id").eq("hafta", hafta).eq("user_id", id).maybeSingle(); benim = !!(b && b.data); }
      } catch (e) {}
      veri = { hafta, kazananlar: data || [], tebrik, benim };
      yerelYaz(veri);
    } catch (e) { veri = yerelAl(hafta); }
    return veri;
  }

  /* İsim yanına rozet (kazananlar o hafta boyunca) */
  function rozet(userId) {
    if (!veri || !userId) return "";
    const k = veri.kazananlar.filter(x => x.user_id === userId).sort((a, b) => (a.sira || 9) - (b.sira || 9))[0];
    if (!k) return "";
    const r = ROZET[k.sira]; if (!r) return "";
    return ` <span class="vt-rozet" title="${esc(r.ad)}">${r.ikon}</span>`;
  }

  function kartHTML() {
    if (!veri || !veri.kazananlar || !veri.kazananlar.length) return "";
    const s = n => veri.kazananlar.find(x => x.sira === n);
    const bir = s(1), iki = s(2), uc = s(3), yuk = s(0);
    if (!bir) return "";
    const ad = k => esc(k.ad || "Bir Işık Yolcusu");
    const kucuk = (k, n) => k ? `<div class="vt-kisi"><span class="vt-madalya">${ROZET[n].ikon}</span><span class="vt-ad">${ad(k)}</span></div>` : "";
    return `<section class="vt-kart" id="vt-kart">
      <div class="vt-bas">✨ Bu haftanın Işık Saçanları ✨</div>
      <div class="vt-bir">
        <div class="vt-tac">👑</div>
        <div class="vt-bir-ad">${ad(bir)}</div>
        <div class="vt-unvan">Haftanın Işık Saçan Ruhu</div>
      </div>
      <div class="vt-digerleri">${kucuk(iki, 2)}${kucuk(uc, 3)}</div>
      ${yuk ? `<div class="vt-yukselen">🌱 <b>Yükselen Işık:</b> ${ad(yuk)}</div>` : ""}
      <p class="vt-not">Işığınızla topluluğu aydınlattığınız için teşekkürler 🌟</p>
      <button class="vt-tebrik${veri.benim ? " aktif" : ""}" type="button" data-vt="tebrik">✨ Tebrikler${veri.tebrik ? ` <b>${veri.tebrik}</b>` : ""}</button>
    </section>`;
  }

  async function tebrikEt(btn) {
    const c = sb(), id = uid();
    if (!c || !id || !veri) return;
    if (navigator.onLine === false) return;
    btn.disabled = true;
    try {
      if (veri.benim) {
        const { error } = await c.from("topluluk_vitrin_tepki").delete().eq("hafta", veri.hafta).eq("user_id", id);
        if (!error) { veri.benim = false; veri.tebrik = Math.max(0, veri.tebrik - 1); }
      } else {
        const { error } = await c.from("topluluk_vitrin_tepki").insert({ hafta: veri.hafta, user_id: id });
        if (!error) { veri.benim = true; veri.tebrik += 1; }
      }
      yerelYaz(veri);
    } catch (e) {}
    btn.disabled = false;
    btn.classList.toggle("aktif", veri.benim);
    btn.innerHTML = `✨ Tebrikler${veri.tebrik ? ` <b>${veri.tebrik}</b>` : ""}`;
  }

  function bagla(kok) {
    const b = kok && kok.querySelector('[data-vt="tebrik"]');
    if (b && !b.dataset.bagli) { b.dataset.bagli = "1"; b.addEventListener("click", () => tebrikEt(b)); }
  }

  return { yukle, rozet, kartHTML, bagla, gecenHafta };
})();
