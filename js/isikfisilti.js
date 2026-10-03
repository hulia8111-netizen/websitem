/* ============================================================
   isikfisilti.js — "Destenin Fısıltısı" 🃏🌙 (Işık Kartları ön-lansman)
   ------------------------------------------------------------
   Deste 99 kart; kart görselleri yayınevi gereği uygulamada YOK.
   Kullanıcı günde 1 kez numara alır → "No. 37" + kısa fısıltı
   (yazarın yeni yazdığı cümle, kitapçık metni değil) + "Tam hâli destede".
   Koleksiyon X/99 (tekrarsız). "Destem gelince haber ver" → Supabase
   `isik_bekleme` (lansman günü bu listeye push gider).
   - AKTİF_TARIH öncesi gizli. Önizleme: adres sonuna ?fisilti=1 (kapat: ?fisilti=0)
   - SATIS_LINK doldurulunca bekleme butonu "Desteni Al" olur (yönlendirme linki).
   Global: window.IsikFisilti
   ============================================================ */

window.IsikFisilti = (() => {
  const AKTIF_TARIH = "2026-10-12";
  const SATIS_LINK = "";             // lansman günü: "https://isiginibull.net/kart"
  const TOPLAM = 99;

  const FISILTI = [
    "Bugün geri çekilmek, kaybetmek değil.",
    "Kalbin bildiğini aklın henüz yetiştiremedi; biraz bekle.",
    "Sana ait olan, kapıyı çalmadan da içeri girer.",
    "Bugün bir ‘hayır’, sana en büyük ‘evet’i getirebilir.",
    "Yavaşlamak, yoldan çıkmak değildir.",
    "Söylemediğin söz içinde ağırlaşıyor. Hafiflet.",
    "Bir şeyi bırakmak için onu önce sevgiyle görmen gerekir.",
    "Işığın kimseye kanıtlanmak zorunda değil.",
    "Bugün kendine bir dostun gibi davran.",
    "Kapanan kapının ardında boşluk değil, yer açılıyor.",
    "Cevap beklediğin yerden değil, beklemediğin bir sesten gelecek.",
    "Yorgunluğun bir hata değil, bir mesaj.",
    "Kendini küçültmeden de sevilebilirsin.",
    "Bugün sadece bir adım. O kadarı yeter.",
    "İçindeki çocuk bir şey istiyor; ona kulak ver.",
    "Herkesin yolu aynı hızda açılmaz. Seninki de açılıyor.",
    "Kalbini korumak, onu kapatmak anlamına gelmez.",
    "Bugün sessizlik en dürüst cevabın olabilir.",
    "Kıyasladığın an kendi ışığını karartırsın.",
    "Bir döngü kapanıyor; teşekkür et ve yürü.",
    "Seni yoran yerde kalmak sadakat değil.",
    "Hak ettiğinden azına razı olma.",
    "Bugün bir şeyi düzeltmek yerine onu kabul et.",
    "Kökün sağlamsa rüzgârdan korkma.",
    "Gözyaşı da bir arınmadır.",
    "Kimin yükünü taşıdığını fark et; senin değilse bırak.",
    "Bugün kendine verdiğin söz, başkasınınkinden önce gelir.",
    "Bekleyiş boşa değil; tohum toprağın altında çalışıyor.",
    "Sezgin fısıldıyor; gürültüyü kıs.",
    "Değişim seni korkutuyor, çünkü önemli.",
    "Bugün affedebileceğin en küçük şeyi affet.",
    "Bolluk önce minnetle açılan kapıdan girer.",
    "Sınır koymak sevgisizlik değil, öz saygıdır.",
    "Geçmişin seni tanımlamıyor; yalnızca anlatıyor.",
    "Ne istediğini yüksek sesle söyle; evren duymak istiyor.",
    "Bugün mükemmel değil, gerçek ol.",
    "Bedenin sana bir şey söylüyor; dinle.",
    "Gitmesine izin verdiğin şey sana yer açar.",
    "Kendine şefkat bir lüks değil, ihtiyaç.",
    "Şüphe geldiğinde ilk hissine dön.",
    "Bir başkasının fırtınası senin havanı belirlemesin.",
    "Bugün ışığı dışarıda değil, içeride ara.",
    "Zamanlama sana ait değil; hazırlık sana ait.",
    "Küçük bir neşe büyük bir kapıyı aralar.",
    "Yalnızlık bazen kendinle buluşma davetidir.",
    "Sırtındaki yükün yarısı aslında başkasına ait.",
    "Bugün ‘yeterince’ olduğunu hatırla.",
    "Hayallerini erteleme; küçült ama başla.",
    "Hiçbir şey bitmiyor; yalnızca şekil değiştiriyor.",
    "Senin ritmin, senin doğrun.",
    "Her ‘keşke’ yeni bir ‘bu sefer’e dönüşebilir.",
    "İçindeki ses sertse, ona yumuşaklığı öğret.",
    "Bugün almaya izin ver; hep veren sen olma.",
    "Kalbinin kırıldığı yer, ışığın girdiği yerdir.",
    "Doğru insanlar seni çabalatmaz, rahatlatır.",
    "Kontrolü bırak; akış seni taşıyacak.",
    "Bugün bir şeye ilk kez evet de.",
    "Unuttuğun bir yeteneğin seni bekliyor.",
    "Korkun, yolunun nereye gittiğini gösteriyor.",
    "Sabır beklemek değil, güvenmektir.",
    "Bir mesaj geliyor; işaretlere açık ol.",
    "Kendi sesini başkalarının sesinden ayır.",
    "Bugün bedenine iyi bak; ruhun orada yaşıyor.",
    "Eksik hissettiğin şey, vermeyi beklediğin şeydir.",
    "Her yeni ay gibi sen de yeniden başlayabilirsin.",
    "Kendini açıklamak zorunda değilsin.",
    "Bugün bir pencere aç: hem odana hem kalbine.",
    "Yorulduğunda dinlen, vazgeçme.",
    "Güzellik bugün ayrıntılarda saklı.",
    "İçindeki bilge cevabı zaten biliyor.",
    "Seni sevenler seni değiştirmeye çalışmaz.",
    "Bugün kendine bir çiçek al; ya da bir çiçek ol.",
    "Bıraktığın yerden değil, olduğun yerden başla.",
    "Kalbinle konuşmaktan korkma; o seni hiç yanıltmadı.",
    "Her veda bir merhabanın habercisi.",
    "Hak ettiğin huzur, ona izin verdiğin kadar yakın.",
    "Bugün ışığını kısma; kimseyi incitmez.",
    "Kendine verdiğin değer, başkalarına öğrettiğindir.",
    "İçinde kilitli bir kapı var; anahtarı sende.",
    "Bugün az konuş, çok hisset.",
    "Kaybolduğunu sandığın yerde aslında bulunuyorsun.",
    "Kendi hikâyenin kahramanı sensin, figüranı değil.",
    "Bir şeyi zorlamayı bırakınca o kendiliğinden gelir.",
    "Bugün minnet listene kendini de yaz.",
    "Kırılganlık, cesaretin en saf hâli.",
    "Ne ekersen, mevsimi gelince onu biçersin.",
    "Kalbin hafifledikçe adımların hızlanacak.",
    "Bugün dünü değil, şimdiyi yaşa.",
    "Enerjin değerli; nereye harcadığına dikkat et.",
    "Sevilmek için kendini kanıtlaman gerekmiyor.",
    "Bugün bir dilek değil, bir teşekkür fısılda.",
    "Yeni bir sen doğuyor; sancısı ondan.",
    "Gölgeni kucakla; ışığın gücünü ondan alır.",
    "Bir işaret bekliyorsan: işte bu o.",
    "Bugün kendine dönmek için tek bir neden yeter: sen.",
    "Yolun sonunda değil, bir virajdasın.",
    "Sende olan kimseden eksilmez.",
    "Işığın karanlığa rağmen değil, karanlıkla birlikte parlar.",
    "Kart seni seçti. Şimdi sen kendini seç."
  ];

  const $ = s => document.querySelector(s);
  const K_KOLEKSIYON = "fisilti-koleksiyon";   // [numara, ...]
  const K_GUN = "fisilti-";                    // + todayKey → numara
  const K_BEKLEME = "fisilti-bekleme";         // true
  const K_ONIZLEME = "fisilti-onizleme";

  function onizlemeOku() {
    try {
      const q = new URLSearchParams(location.search).get("fisilti");
      if (q === "1") Store.set(K_ONIZLEME, true);
      if (q === "0") Store.remove ? Store.remove(K_ONIZLEME) : Store.set(K_ONIZLEME, false);
    } catch (e) {}
  }
  function aktif() { return todayKey() >= AKTIF_TARIH || Store.get(K_ONIZLEME, false) === true; }
  function koleksiyon() { const k = Store.get(K_KOLEKSIYON, []); return Array.isArray(k) ? k : []; }

  function numaraAl() {
    const t = todayKey();
    if (Store.get(K_GUN + t, null) !== null) return;
    const sahip = koleksiyon();
    const kalan = [];
    for (let i = 1; i <= TOPLAM; i++) if (sahip.indexOf(i) === -1) kalan.push(i);
    const havuz = kalan.length ? kalan : Array.from({ length: TOPLAM }, (_, i) => i + 1);
    const no = havuz[Math.floor(Math.random() * havuz.length)];
    Store.set(K_GUN + t, no);
    if (sahip.indexOf(no) === -1) { sahip.push(no); Store.set(K_KOLEKSIYON, sahip); }
    ciz();
    if (window.Keyif) Keyif.basari($("#ik-fisilti"));
  }

  async function beklemeyeKatil() {
    Store.set(K_BEKLEME, true);
    ciz();
    try {
      const c = window.Bulut && Bulut.client ? Bulut.client() : null;
      if (!c) return;
      await c.from("isik_bekleme").upsert({
        cihaz_id: window.PushToken && PushToken.cihazId ? PushToken.cihazId() : null,
        user_id: Bulut.kullaniciId ? Bulut.kullaniciId() : null,
        koleksiyon: koleksiyon().length
      }, { onConflict: "cihaz_id" });
    } catch (e) {}
  }

  function ciz() {
    const alan = $("#ik-fisilti"); if (!alan) return;
    const eskiBtn = $("#ik-tanitim-ac");
    if (!aktif()) { alan.hidden = true; if (eskiBtn) eskiBtn.style.display = ""; return; }
    alan.hidden = false;
    if (eskiBtn) eskiBtn.style.display = "none";   // .ik-t-btn display:block → hidden yetmez

    const no = Store.get(K_GUN + todayKey(), null);
    const adet = koleksiyon().length;
    const yuzde = Math.round(adet / TOPLAM * 100);
    const bekliyor = Store.get(K_BEKLEME, false) === true;

    const ust = no === null
      ? `<div class="ikf-kart ikf-kapali" aria-hidden="true"><span>?</span></div>
         <p class="ikf-davet">99 kartlık destede bugün seni bir numara bekliyor.</p>
         <button class="btn ikf-cek" type="button" id="ikf-cek">Numaramı Göster 🌙</button>`
      : `<div class="ikf-kart" aria-hidden="true"><span>${no}</span></div>
         <div class="ikf-etiket">Bugün seni seçen kart · <b>No. ${no}</b></div>
         <p class="ikf-fisilti">“${FISILTI[no - 1]}”</p>
         <p class="ikf-tam muted small">Bu kartın tam hâli Işık Kartları destesinde. ✦</p>`;

    let cta;
    if (SATIS_LINK) cta = `<a class="btn ik-t-btn" href="${SATIS_LINK}" target="_blank" rel="noopener">Desteni Al · 99 Kart ✦</a>`;
    else if (bekliyor) cta = `<div class="ikf-tamam">🕊️ Listedesin. Deste açıldığı an sana ilk ben haber vereceğim.</div>`;
    else cta = `<button class="btn ik-t-btn" type="button" id="ikf-bekle">Destem Gelince Haber Ver ✦</button>`;

    alan.innerHTML = `
      <div class="ikf-baslik">🌙 Destenin Fısıltısı</div>
      ${ust}
      <div class="ikf-koleksiyon">
        <div class="ikf-k-metin">Seni seçen kartlar: <b>${adet} / ${TOPLAM}</b></div>
        <div class="ikf-bar"><span style="width:${yuzde}%"></span></div>
      </div>
      ${cta}`;

    const cekBtn = $("#ikf-cek"); if (cekBtn) cekBtn.addEventListener("click", numaraAl);
    const bekBtn = $("#ikf-bekle"); if (bekBtn) bekBtn.addEventListener("click", beklemeyeKatil);
  }

  function baslat() { onizlemeOku(); ciz(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", baslat);
  else baslat();

  return { ciz, toplam: TOPLAM };
})();
