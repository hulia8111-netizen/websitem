/* ============================================================
   data.js — Sitenin sabit içeriği.
   Buradaki dizileri dilediğin gibi genişletebilirsin.
   Yeni ses/görsel eklersen ilgili listeye bir satır ekle.
   ============================================================ */

const DATA = {
  /* Günün motivasyon cümleleri (tarihe göre her gün biri seçilir) */
  motivasyon: [
    "Bugün, dünden bir adım daha ileridesin.",
    "Nefes al. Şu an her şey yolunda.",
    "Küçük adımlar büyük yolculuklar yaratır.",
    "Kendine güven; içinde ihtiyacın olan her şey var.",
    "Bugün ektiğin tohum, yarın çiçek açacak.",
    "Olduğun yer, olman gereken yer.",
    "Zihnin sakin olduğunda evren seninle konuşur.",
    "Sen, değişimin ta kendisisin.",
    "Bugünün enerjisi, niyetinle başlar.",
    "Her zorluk, gizli bir hediyedir.",
    "Şükranla başlayan gün, bollukla devam eder.",
    "Kendine nazik ol; sen elinden gelenin en iyisini yapıyorsun.",
    "Hayallerin, gerçeğe dönüşmek için sabırsızlanıyor.",
    "Bugün sadece 'evet' demen gereken şey: kendin.",
    "İçindeki ışık, dışarıdaki her gölgeden güçlü.",
    "Akışına bırak; doğru olan zaten yoluna çıkıyor.",
    "Bugün küçük bir mucize seni bekliyor.",
    "Düşüncelerin gerçeğini şekillendirir; güzelini seç.",
    "Cesaret, korkunun yokluğu değil; ona rağmen ilerlemektir.",
    "Bugün kendine bir söz ver ve onu tut.",
    "Geçmiş bir ders, gelecek bir armağan, şimdi ise hediyedir.",
    "Sen yeterlisin. Tam da olduğun gibi.",
    "Niyetini netleştir, evren gerisini halleder.",
    "Bugünü değerli kılan, ona kattığın anlamdır.",
    "Sabır, çiçeğin açmasını beklemektir; zorlamak değil.",
    "İç huzur, dışarıdaki fırtınaya verdiğin en güzel cevaptır.",
    "Bugün gülümse; bu basit eylem dünyanı değiştirir.",
    "Bolluk bir his; onu önce içinde hissedersen dışarıda görürsün.",
    "Her gün yeni bir sayfa; kalem senin elinde.",
    "Kendini affet, sonra özgürce ilerle."
  ],

  /* Kart çekme destesi — Görsellerim/ klasöründeki gerçek görseller.
     baslik: kart açıldığında gösterilecek isim
     img: dosya yolu  | mesaj: kısa rehber cümlesi */
  kartlar: [
    { baslik: "Taşınma",      img: "Görsellerim/47. TAŞINMA.jpg",      mesaj: "Bir değişim kapıda. Eskiyi bırakmaya hazır ol." },
    { baslik: "Yükseliş",     img: "Görsellerim/48. YÜKSELİŞ.jpg",     mesaj: "Enerjin yükseliyor. Kendini daha yükseğe taşı." },
    { baslik: "İlerle",       img: "Görsellerim/53. İLERLE.jpg",       mesaj: "Durma vakti değil. Bir adım daha at." },
    { baslik: "Sorumluluk",   img: "Görsellerim/58. SORUMLULUK.jpg",   mesaj: "Hayatının dümeni sende. Sahiplen." },
    { baslik: "Netlik",       img: "Görsellerim/62. NETLİK.jpg",       mesaj: "Sis dağılıyor. Gerçek niyetini gör." },
    { baslik: "Temizlik",     img: "Görsellerim/71 TEMİZLİK.jpg",      mesaj: "Sana hizmet etmeyeni bırak. Alan aç." },
    { baslik: "Biliyorsun",   img: "Görsellerim/95. BİLİYORSUN.jpg",   mesaj: "Cevap zaten içinde. Sezgine güven." }
  ],

  /* Meditasyon kategorileri — sekme sırası ve etiketleri */
  kategoriler: [
    { id: "uyku",       ad: "Uyku" },
    { id: "frekans",    ad: "Frekans" },
    { id: "sifa",       ad: "Şifa" },
    { id: "odak",       ad: "Odak" },
    { id: "rahatlama",  ad: "Rahatlama" }
  ],

  /* Meditasyon sesleri — her sese bir 'kategori' alanı eklendi.
     Kendi mp3'lerini ekleyip uygun kategoriyi yazabilirsin. */
  sesler: [
    { ad: "Mucize Frekans", kategori: "frekans",   dosya: "Ses dosyalarım/vidssave.com Mucize Frekans 💎 Bu Frekansı Günde 3 Kez Dinle 💎 Mucizeler OLdu OLdu OLdu 💎 128KBPS.mp3" },
    { ad: "Meditasyon Sesi", kategori: "rahatlama", dosya: "Ses dosyalarım/mp3.mpeg" }
  ],

  /* ---- Spiritüel Müzik & Frekans Alanı ---- */
  muzikKategorileri: [
    { id: "uyku",          ad: "Uyku",            ikon: "🌙" },
    { id: "sifa",          ad: "Şifa",            ikon: "🌸" },
    { id: "rahatlama",     ad: "Rahatlama",       ikon: "🌿" },
    { id: "odak",          ad: "Odak",            ikon: "🎯" },
    { id: "derinMed",      ad: "Derin Meditasyon", ikon: "🧘" },
    { id: "disil",         ad: "Dişil Enerji",    ikon: "🌹" },
    { id: "yuksekFrekans", ad: "Yüksek Frekans",  ikon: "✨" }
  ],
  /* tip: ton(hz) | gurultu(alt: yagmur/orman/gece) | can | pad(alt: lofi/derin/disil)
     sure: nominal saniye (ilerleme çubuğu + otomatik geçiş için) */
  frekansAlani: [
    { id: "f174", ad: "174 Hz · Derin Gevşeme",   kategori: "uyku",          tip: "ton", hz: 174, sure: 300 },
    { id: "yagmur", ad: "Yağmur Sesi",             kategori: "uyku",          tip: "gurultu", alt: "yagmur", sure: 600 },
    { id: "gece", ad: "Gece Ambience",             kategori: "uyku",          tip: "gurultu", alt: "gece", sure: 600 },
    { id: "f528", ad: "528 Hz · Mucize / Şifa",    kategori: "sifa",          tip: "ton", hz: 528, sure: 300 },
    { id: "f396", ad: "396 Hz · Arınma",           kategori: "sifa",          tip: "ton", hz: 396, sure: 300 },
    { id: "f432", ad: "432 Hz · Doğal Uyum",       kategori: "rahatlama",     tip: "ton", hz: 432, sure: 300 },
    { id: "lofi", ad: "Lo-fi Spiritüel",           kategori: "rahatlama",     tip: "pad", alt: "lofi", sure: 420 },
    { id: "f741", ad: "741 Hz · Sezgi & Odak",     kategori: "odak",          tip: "ton", hz: 741, sure: 300 },
    { id: "orman", ad: "Orman Sesi",               kategori: "odak",          tip: "gurultu", alt: "orman", sure: 600 },
    { id: "tibet", ad: "Tibet Çanı",               kategori: "derinMed",      tip: "can", sure: 480 },
    { id: "drone", ad: "Derin Meditasyon Drone",   kategori: "derinMed",      tip: "pad", alt: "derin", sure: 480 },
    { id: "f639", ad: "639 Hz · Kalp & Bağ",       kategori: "disil",         tip: "ton", hz: 639, sure: 300 },
    { id: "disilpad", ad: "Dişil Enerji Pad",      kategori: "disil",         tip: "pad", alt: "disil", sure: 420 },
    { id: "f852", ad: "852 Hz · İçsel Uyanış",     kategori: "yuksekFrekans", tip: "ton", hz: 852, sure: 300 },
    { id: "f963", ad: "963 Hz · İlahi Bağlantı",   kategori: "yuksekFrekans", tip: "ton", hz: 963, sure: 300 }
  ],

  /* Web Audio ile tarayıcıda üretilen frekans tonları (telifsiz).
     'Frekans' kategorisinde listelenir. hz: ton frekansı | not: kısa açıklama */
  frekanslar: [
    { ad: "396 Hz · Korkudan Arınma", hz: 396, kategori: "sifa" },
    { ad: "432 Hz · Doğal Uyum",      hz: 432, kategori: "rahatlama" },
    { ad: "528 Hz · Mucize / Onarım", hz: 528, kategori: "sifa" },
    { ad: "639 Hz · Bağ & İlişki",    hz: 639, kategori: "frekans" },
    { ad: "741 Hz · Sezgi & Odak",    hz: 741, kategori: "odak" },
    { ad: "852 Hz · İçsel Uyanış",    hz: 852, kategori: "frekans" },
    { ad: "174 Hz · Derin Gevşeme",   hz: 174, kategori: "uyku" }
  ],

  /* Günün mini görevleri */
  gorevler: [
    "5 dakika boyunca sadece nefesine odaklan.",
    "Bugün bir kişiye içten bir iltifat et.",
    "Telefonsuz 20 dakika geçir.",
    "Bir bardak suyu yavaşça, farkındalıkla iç.",
    "Bugün 10 dakika yürüyüşe çık.",
    "Odanda küçük bir köşeyi düzenle.",
    "Sevdiğin bir şarkıyı sonuna kadar dinle.",
    "Bugün 'hayır' demen gereken bir şeye 'hayır' de.",
    "Birine teşekkür mesajı gönder.",
    "Gözlerini kapat ve 3 derin nefes al.",
    "Doğada veya pencereden 5 dakika gökyüzünü izle.",
    "Bugün kendine küçük bir ödül ver.",
    "Yapacaklar listenden en kolay maddeyi hemen yap.",
    "Bir an için sadece çevrendeki sesleri dinle.",
    "Aynaya bak ve kendine güzel bir şey söyle.",
    "Bugün yeni bir şey dene, küçük de olsa.",
    "Germe egzersizi yap; bedenini esnet.",
    "Bir fincan çayı/kahveyi telaşsız yudumla.",
    "Bugün bir anını fotoğrafla.",
    "Geceden yarına bir niyet belirle."
  ],

  /* Ritüel kategorileri — ikon (emoji) + ad */
  rituelKategorileri: {
    nefes:      { ad: "Nefes Çalışması", ikon: "🌬️" },
    sukran:     { ad: "Şükran Pratiği",  ikon: "🙏" },
    ayna:       { ad: "Ayna Olumlaması", ikon: "🪞" },
    sessizlik:  { ad: "Sessizlik Anı",   ikon: "🌙" },
    meditasyon: { ad: "Meditasyon",      ikon: "🎧" },
    su:         { ad: "Su İçme",         ikon: "💧" },
    doga:       { ad: "Doğa Bağlantısı", ikon: "🌿" },
    gunluk:     { ad: "Günlük Yazımı",   ikon: "📖" },
    sefkat:     { ad: "Kendine Şefkat",  ikon: "🤍" }
  },

  /* Günlük ritüeller — zorluk: Hafif(10) · Orta(20) · Derin(30) XP */
  ritueller: [
    { id: "r1",  kategori: "nefes",      zorluk: "Hafif", xp: 10, metin: "Bugün 3 derin nefes al ve bedenini hisset." },
    { id: "r2",  kategori: "nefes",      zorluk: "Orta",  xp: 20, metin: "4-7-8 ritminde 4 tur nefes egzersizi yap." },
    { id: "r3",  kategori: "sukran",     zorluk: "Hafif", xp: 10, metin: "Bugün şükrettiğin 3 şeyi yaz ✨" },
    { id: "r4",  kategori: "sukran",     zorluk: "Orta",  xp: 20, metin: "Bir kişiye içten bir teşekkür mesajı gönder." },
    { id: "r5",  kategori: "ayna",       zorluk: "Hafif", xp: 10, metin: "Aynaya bak ve kendine güzel bir cümle söyle." },
    { id: "r6",  kategori: "ayna",       zorluk: "Derin", xp: 30, metin: "Aynada gözlerine bakarak 1 dakika 'Seni seviyorum' de." },
    { id: "r7",  kategori: "sessizlik",  zorluk: "Hafif", xp: 10, metin: "5 dakika sessizce otur 🌙" },
    { id: "r8",  kategori: "sessizlik",  zorluk: "Orta",  xp: 20, metin: "10 dakika telefonsuz, sessiz bir mola ver." },
    { id: "r9",  kategori: "meditasyon", zorluk: "Orta",  xp: 20, metin: "Bir frekans seç ve 5 dakika dinle 🎧" },
    { id: "r10", kategori: "meditasyon", zorluk: "Derin", xp: 30, metin: "10 dakikalık bir nefes meditasyonu yap." },
    { id: "r11", kategori: "su",         zorluk: "Hafif", xp: 10, metin: "Bir bardak suyu farkındalıkla, yavaşça iç 💧" },
    { id: "r12", kategori: "doga",       zorluk: "Hafif", xp: 10, metin: "Pencereden ya da dışarıda 5 dakika gökyüzünü izle." },
    { id: "r13", kategori: "doga",       zorluk: "Orta",  xp: 20, metin: "Çıplak ayakla toprağa/çimene birkaç dakika bas." },
    { id: "r14", kategori: "gunluk",     zorluk: "Orta",  xp: 20, metin: "Bugün kendin için güzel bir cümle yaz." },
    { id: "r15", kategori: "gunluk",     zorluk: "Derin", xp: 30, metin: "Günlüğüne bugünkü duygularını 5 satır yaz 📖" },
    { id: "r16", kategori: "sefkat",     zorluk: "Hafif", xp: 10, metin: "Kendine küçük bir iyilik yap; molanı hak ettin 🤍" },
    { id: "r17", kategori: "sefkat",     zorluk: "Orta",  xp: 20, metin: "Kendini eleştirdiğin bir an için kendinden özür dile." }
  ],

  /* Ritüel özel (gizli) rozetleri */
  rituelRozetleri: [
    { id: "ilk",       ad: "İlk Ritüel ✨",     ipucu: "İlk ritüelini tamamla." },
    { id: "yedi",      ad: "Ritüel Ustası 🔮",  ipucu: "Toplam 7 ritüel tamamla." },
    { id: "gezgin",    ad: "Kategori Gezgini 🌌", ipucu: "5 farklı kategoride ritüel yap." },
    { id: "derin",    ad: "Derin Ruh 🌑",        ipucu: "3 'Derin' ritüel tamamla." }
  ],

  /* Günün farkındalık soruları */
  sorular: [
    "Şu an bedeninde neyi hissediyorsun?",
    "Bugün seni en çok ne mutlu etti?",
    "Neyi bırakmaya hazırsın?",
    "Kendine bugün nasıl iyi davrandın?",
    "Şu an neye ihtiyacın var?",
    "Bugün hangi düşünce sana hizmet etmiyor?",
    "Kime/neye minnettarsın?",
    "Bugün gurur duyduğun bir şey ne?",
    "Hangi duygu seninle konuşmaya çalışıyor?",
    "Kendine sormaktan kaçındığın soru ne?",
    "Bugün enerjini ne yükseltti, ne düşürdü?",
    "Şu an olduğun yerde neyi takdir edebilirsin?",
    "Gelecekteki sen, bugünkü senden ne isterdi?",
    "Hangi küçük adım seni hedefine yaklaştırır?",
    "Bugün kendine hangi sözü verdin?",
    "Korkun aslında sana neyi göstermeye çalışıyor?",
    "Bugün neyi 'yeterince iyi' kabul edebilirsin?",
    "Sınırların nerede zorlandı?",
    "Bugün hangi anı yeniden yaşamak isterdin?",
    "Şu an huzuru nerede bulabilirsin?"
  ],

  /* ---- Spiritüel Mağaza / Keşfet ---- */
  magazaKategorileri: [
    { id: "deste",      ad: "Kart Destesi",       ikon: "🃏" },
    { id: "mum",        ad: "Ritüel Mumları",     ikon: "🕯️" },
    { id: "kristal",    ad: "Kristaller",         ikon: "💎" },
    { id: "meditasyon", ad: "Meditasyon",         ikon: "🧘" },
    { id: "defter",     ad: "Defterler",          ikon: "📖" },
    { id: "koleksiyon", ad: "Özel Koleksiyonlar", ikon: "✨" }
  ],
  /* Ürünler — link: Shopier/yayınevi vitrini (kendi bağlantınla değiştir).
     renk: ürün görseli degrade tonları | ikon: emoji (büyük görsel) */
  magazaUrunleri: [
    { id: "u1",  kategori: "deste",      ad: "Işığını Bul Kart Destesi", fiyat: "₺349", ikon: "🃏", renk: ["#3a2a6d", "#160f33"], link: "#",
      aciklama: "78 kartlık spiritüel rehberlik destesi. Her gün bir kart çek, evrenin sana fısıldadığı mesajı dinle 🌙" },
    { id: "u2",  kategori: "deste",      ad: "Cep Boy Mini Deste",       fiyat: "₺199", ikon: "🃏", renk: ["#4a2a6d", "#1a1338"], link: "#",
      aciklama: "Çantanda taşı, gün içinde dilediğin an rehberlik al. Yeni başlayanlar için ideal ✨" },
    { id: "u3",  kategori: "mum",        ad: "Lavanta Ritüel Mumu",      fiyat: "₺189", ikon: "🕯️", renk: ["#5a3f86", "#2a1d52"], link: "#",
      aciklama: "Bu mum sakinleşme ve içsel denge ritüelleri için tasarlandı 🌙 Soya wax + saf lavanta yağı." },
    { id: "u4",  kategori: "mum",        ad: "Beyaz Adaçayı Mumu",       fiyat: "₺179", ikon: "🕯️", renk: ["#6d5a3a", "#2a1d3a"], link: "#",
      aciklama: "Mekânını ve enerjini arındır. Niyet belirleme ve temizlik ritüelleri için 🤍" },
    { id: "u5",  kategori: "kristal",    ad: "Ametist Kristali",         fiyat: "₺249", ikon: "💜", renk: ["#5a3f86", "#241a40"], link: "#",
      aciklama: "Sezgiyi güçlendirir, zihni sakinleştirir. Meditasyon ve uyku için huzur taşı." },
    { id: "u6",  kategori: "kristal",    ad: "Gül Kuvarsı",              fiyat: "₺219", ikon: "💗", renk: ["#7a3a5a", "#2a1838"], link: "#",
      aciklama: "Kalbi açar, öz-sevgiyi ve şefkati besler. İlişkiler ve kalp çakrası için 🌹" },
    { id: "u7",  kategori: "kristal",    ad: "Selenit Çubuk",            fiyat: "₺159", ikon: "🤍", renk: ["#3a5a86", "#1a2452"], link: "#",
      aciklama: "Diğer kristalleri ve mekânı arındırır. Enerji temizliği için vazgeçilmez." },
    { id: "u8",  kategori: "meditasyon", ad: "Meditasyon Minderi",       fiyat: "₺399", ikon: "🧘", renk: ["#3a5a5a", "#16332a"], link: "#",
      aciklama: "Ergonomik tasarımıyla uzun oturuşlarda duruşunu destekler. Derin meditasyon için konfor." },
    { id: "u9",  kategori: "meditasyon", ad: "Tibet Çanı Seti",          fiyat: "₺459", ikon: "🔔", renk: ["#6d5a2a", "#2a2010"], link: "#",
      aciklama: "Derin meditasyon ve ses terapisi için el yapımı çan. Titreşimiyle çakralarını dengele." },
    { id: "u10", kategori: "defter",     ad: "Şükran Defteri",           fiyat: "₺169", ikon: "📖", renk: ["#5a3f86", "#2a1d52"], link: "#",
      aciklama: "Günlük şükran ve niyet pratiği için el yapımı premium defter. Bolluğa kapı aç 🙏" },
    { id: "u11", kategori: "defter",     ad: "Rüya Günlüğü",             fiyat: "₺159", ikon: "🌙", renk: ["#3a3a6d", "#161633"], link: "#",
      aciklama: "Rüyalarını ve sezgilerini kaydet. Bilinçaltının mesajlarını çöz 🌌" },
    { id: "u12", kategori: "koleksiyon", ad: "Yeni Ay Ritüel Seti",      fiyat: "₺599", ikon: "🌑", renk: ["#3a2a6d", "#0f0a24"], link: "#",
      aciklama: "Mum, ametist ve niyet kartlarıyla eksiksiz yeni ay ritüeli. Niyetlerini ek, hayallerini büyüt ✨" },
    { id: "u13", kategori: "koleksiyon", ad: "Öz-Sevgi Koleksiyonu",     fiyat: "₺549", ikon: "🌹", renk: ["#7a3a5a", "#2a1838"], link: "#",
      aciklama: "Gül kuvarsı, şükran defteri ve olumlama kartlarıyla kendine dönüş seti 🤍" }
  ],

  /* Çift (ayna) saat anlamları — HH:MM eşit olduğunda gösterilir.
     mesaj: spiritüel mesaj | yorum: kısa farkındalık | olumlama: mini olumlama */
  ciftSaatler: [
    { saat: "00:00", mesaj: "Yeni bir döngü başlıyor.", yorum: "Geçmişi bırak, taze bir sayfa aç.", olumlama: "Her an yeniden doğabilirim." },
    { saat: "01:01", mesaj: "Bir niyet tohumu at.", yorum: "Düşüncelerin yeni bir başlangıcı çağırıyor.", olumlama: "Niyetim nettir ve güçlüdür." },
    { saat: "02:02", mesaj: "Denge ve uyum zamanı.", yorum: "İlişkilerinde yumuşaklık ve sabır göster.", olumlama: "Hayatımda denge ve huzur akıyor." },
    { saat: "03:03", mesaj: "Rehberlerin seninle.", yorum: "Sezgilerine güven; yalnız değilsin.", olumlama: "İlahi rehberliğe açığım ve korunuyorum." },
    { saat: "04:04", mesaj: "Sağlam temeller at.", yorum: "Emek ve istikrar bugün ödüllendirilecek.", olumlama: "Güçlü ve sağlam temeller üzerinde duruyorum." },
    { saat: "05:05", mesaj: "Değişim kapıda.", yorum: "Esnek ol; akışa direnme.", olumlama: "Değişime güvenle kucak açıyorum." },
    { saat: "10:10", mesaj: "İlerleme ve yeni fırsatlar.", yorum: "Bir kapı kapanırken yenisi açılıyor.", olumlama: "Önümdeki yol aydınlık ve açık." },
    { saat: "11:11", mesaj: "Düşüncelerin hızla şekilleniyor. Niyetlerine odaklan.", yorum: "Evrenle güçlü bir hizadasın; ne istediğini netleştir.", olumlama: "Hayat benim için doğru kapıları açıyor." },
    { saat: "12:12", mesaj: "İlham ve uyanış anı.", yorum: "Kalbinin sesi sana yol gösteriyor.", olumlama: "İçsel ışığım yolumu aydınlatıyor." },
    { saat: "13:13", mesaj: "Dönüşüm ve büyüme.", yorum: "Eskiyi bırak; yeniye yer aç.", olumlama: "Dönüşümüme güveniyorum." },
    { saat: "14:14", mesaj: "Koruma ve şefkat.", yorum: "Kendine nazik ol; destekleniyorsun.", olumlama: "Sevgiyle çevrili ve güvendeyim." },
    { saat: "15:15", mesaj: "Olumlu haber yolda.", yorum: "Umudunu koru; iyi şeyler geliyor.", olumlama: "Güzel sürprizlere açığım." },
    { saat: "20:20", mesaj: "İlişkilerde uyum.", yorum: "Bağlarını sevgiyle güçlendir.", olumlama: "Kalbim açık, ilişkilerim besleyici." },
    { saat: "21:21", mesaj: "Yeni bir bağ ya da fırsat.", yorum: "Cesur ol; kalbinin istediğine yönel.", olumlama: "Bana hizmet eden her şeyi çekiyorum." },
    { saat: "22:22", mesaj: "Denge ve manifestasyon gücü.", yorum: "Hayallerin gerçeğe dönüşmek üzere; inan.", olumlama: "Niyetlerim gerçeğe dönüşüyor." },
    { saat: "23:23", mesaj: "Tamamlanma ve şükran.", yorum: "Günü minnetle kapat; emeklerini onurlandır.", olumlama: "Sahip olduklarım için minnettarım." }
  ],
  /* Listede olmayan ayna saatler için genel anlam */
  ciftSaatGenel: { mesaj: "Bir senkronizasyon anı.", yorum: "Dur, nefes al ve içinden geçen niyeti fark et.", olumlama: "Evrenle uyum içindeyim." },

  /* Bildirim mesajları — kategoriye ve akıllı duruma göre seçilir. */
  bildirimMesajlari: {
    olumlama: [
      "Bugün içsel ışığını beslemeyi unutma ✨",
      "Kendine bir olumlama fısılda 🤍",
      "Sen yeterlisin, tam da olduğun gibi 🌸"
    ],
    ruhHali: [
      "Ruh halini kaydetmek ister misin? 🌸",
      "Şu an nasıl hissediyorsun? Bir dur ve fark et 🌙",
      "Bugünkü duygunu bahçene ekle 🌿"
    ],
    meditasyon: [
      "Derin nefes al ve kendine dön 🤍",
      "Birkaç dakikalık meditasyon zamanı 🎧",
      "Zihnine sükûnet armağan et ✨"
    ],
    sukran: [
      "Bugün neye şükrediyorsun? 🙏",
      "Küçük bir minnet, büyük bir huzur getirir 🌟",
      "Şükran defterine bir satır ekle 📖"
    ],
    kart: [
      "Bugünün kartı seni bekliyor 🌙",
      "Evrenin bugünkü mesajını çek 🔮",
      "Günün kartında bir işaret olabilir ✨"
    ],
    ciftSaat: [
      "{saat} ✨ Bir niyet tut, evren dinliyor.",
      "{saat} 🌙 Senkronizasyon anı — kalbinden bir dilek geçir.",
      "{saat} 💫 Melekler seninle; içinden geçeni onayla."
    ],
    uzakKaldin: [
      "Seni özledik 🌙 İçsel bahçen seni bekliyor.",
      "Bir süredir yoksun ✨ Kendine birkaç dakika ayırmaya ne dersin?",
      "Işığın hâlâ burada parlıyor 🤍 Geri dönmen güzel olur."
    ],
    dusukMod: [
      "Kendine nazik ol 🤍 Bugün küçük bir şey bile yeterli.",
      "Zor günler de geçer 🌙 Derin bir nefes al, buradayım.",
      "Bugün sadece var olman kâfi ✨ Kendine şefkat göster."
    ],
    streakUyari: [
      "Serini kaybetme 🔥 Bugün kısa bir uğrama yeter.",
      "İstikrar serin seni bekliyor ✨ Bir adım at.",
      "Bahçeni sulamayı unutma 🌱 Serin devam etsin."
    ],
    haftalik: [
      "Bu haftaki spiritüel yolculuğun için kendini takdir et ✨",
      "Haftan boyunca attığın her adım için teşekkürler 🤍 Yeni hafta, yeni ışık.",
      "Geçen haftanın enerjisini onurlandır, yeni niyetler belirle 🌙"
    ]
  },

  /* İstikrar serisi (streak) seviyeleri — ardışık gün sayısına göre. */
  streakSeviyeleri: [
    { gun: 3,  ad: "Başlangıç" },
    { gun: 7,  ad: "İstikrar" },
    { gun: 21, ad: "Farkındalık" },
    { gun: 30, ad: "İçsel Uyanış" }
  ],

  /* Kişisel Spiritüel Profil — ruhsal seviyeler (puana göre, index 0..5).
     Her seviyenin kendi glow/çerçeve sınıfı (profil.js'te sv-0..5). */
  ruhselSeviyeler: [
    { ad: "Başlangıç",            esik: 0 },
    { ad: "Uyanış",               esik: 30 },
    { ad: "Denge",                esik: 75 },
    { ad: "Farkındalık",          esik: 140 },
    { ad: "İçsel Rehber",         esik: 230 },
    { ad: "Işığını Bulmuş Ruh ✨", esik: 350 }
  ],

  /* Ruh Bahçesi seviyeleri — toplam puana göre açılır (index 0..5).
     esik: bu seviyeye geçmek için gereken toplam puan. */
  bahceSeviyeleri: [
    { ad: "Küçük Filiz",     esik: 0,   mesaj: "Yolculuğun başladı; minik bir filiz toprağı deldi." },
    { ad: "Çiçek",           esik: 18,  mesaj: "İlk çiçeğin açtı. Özenin meyvesini veriyor." },
    { ad: "Lotus",           esik: 45,  mesaj: "Lotus açtı — sakinlik ve arınmanın simgesi." },
    { ad: "Ay Çiçeği",       esik: 85,  mesaj: "Ay çiçeğin ışıldıyor; sezgilerin güçleniyor." },
    { ad: "Işık Ağacı",      esik: 145, mesaj: "Bir ışık ağacına dönüştün; köklerin derin, dalların parlak." },
    { ad: "Spiritüel Bahçe", esik: 230, mesaj: "Bahçen tam anlamıyla açtı. Işığını buldun ✨" }
  ],

  /* Bahçe gizli başarımları — koşul sağlanınca açılır (mantık bahce.js'te). */
  bahceGizli: [
    { id: "tamRituel", ad: "Tam Ritüel 🌸", ipucu: "Bir günde tüm ritüelleri tamamla." },
    { id: "bahcivan",  ad: "Bahçıvan 🪴",   ipucu: "Bolca şükret." },
    { id: "kokSalan",  ad: "Kök Salan 🌳",  ipucu: "Uzun süre düzenli kal." },
    { id: "gececi",    ad: "Gece Bekçisi 🌙", ipucu: "Sık sık meditasyon yap." }
  ],

  /* Günün Enerji Seviyesi — gizli rozetler (koşul mantığı energy.js'te). */
  enerjiRozetleri: [
    { id: "isik",    ad: "İlk Işık ✨",      ipucu: "Güçlü bir güne ulaş (≥%61)." },
    { id: "frekans", ad: "Yüksek Frekans 🌟", ipucu: "Zirveye çık (≥%86)." },
    { id: "sabit",   ad: "Sürekli Işık 🔆",   ipucu: "Haftalık ortalaman ≥%70 olsun." }
  ],

  /* Ay evreleri — gerçek zamanlı hesaplanan evreye göre (index 0..7) gösterilir.
     İstenen 4 ana evre (Yeni Ay/İlk Dördün/Dolunay/Son Dördün) + ara evreler. */
  ayEvreleri: [
    { ad: "Yeni Ay",        emoji: "🌑", aciklama: "Niyet belirlemek için güçlü bir dönem. Yeni başlangıçların tohumunu ek." },
    { ad: "Büyüyen Hilal",  emoji: "🌒", aciklama: "Niyetlerini besleme zamanı; küçük ama kararlı adımlar at." },
    { ad: "İlk Dördün",     emoji: "🌓", aciklama: "Eyleme geç ve engelleri aş; kararlılığın sınanıyor." },
    { ad: "Büyüyen Ay",     emoji: "🌔", aciklama: "İnce ayar ve sabır zamanı; hedefine yaklaşıyorsun." },
    { ad: "Dolunay",        emoji: "🌕", aciklama: "Bırakma ve dönüşüm zamanı. Tamamlananı kutla." },
    { ad: "Solan Ay",       emoji: "🌖", aciklama: "Şükret ve bilgeliğini içe al; paylaşma vakti." },
    { ad: "Son Dördün",     emoji: "🌗", aciklama: "Affet ve serbest bırak; sana hizmet etmeyeni bırak." },
    { ad: "Solan Hilal",    emoji: "🌘", aciklama: "Dinlen ve arın; içe dönüş ve huzur zamanı." }
  ],

  /* Ruh Eşleşmesi / Enerji Uyumu — enerji tipleri.
     Sıra hem günlük rotasyon nudge'ı hem eşitlik önceliği için kullanılır.
     renk: aura orb degrade tonları | uyumlu: en uyumlu tip id | med: muzikKategorileri id */
  enerjiTipleri: [
    { id: "ay",     ad: "Ay Ruhu",            ikon: "🌙", renk: ["#3a3a6d", "#8b6fd6"], uyumlu: "su",     med: "rahatlama",
      analiz: "Sezgisel, sakin ve derin bir enerji taşıyorsun. İç dünyana dönüşte güçlüsün.",
      gunluk: "Bugün sakinleşmek ve iç sesini dinlemek sana iyi gelebilir." },
    { id: "gunes",  ad: "Güneş Enerjisi",     ikon: "☀️", renk: ["#e9c46a", "#ff8a3a"], uyumlu: "kozmik", med: "odak",
      analiz: "Parlak, cömert ve hayat dolu bir enerjin var. Çevrene sıcaklık yayıyorsun.",
      gunluk: "Bugün ışığını paylaş ve harekete geç; enerjin yüksek." },
    { id: "sifaci", ad: "Şifacı Ruh",         ikon: "✨", renk: ["#6fe0a8", "#b38cff"], uyumlu: "ay",     med: "sifa",
      analiz: "Şefkatli, iyileştiren ve nazik bir enerji yayıyorsun. Kalbin geniş.",
      gunluk: "Bugün hem kendine hem çevrene şefkat göstermek sana huzur verir." },
    { id: "su",     ad: "Derin Su Enerjisi",  ikon: "🌊", renk: ["#3a5a86", "#5bbf9a"], uyumlu: "sifaci", med: "uyku",
      analiz: "Duygusal derinliğin ve sezgilerin güçlü. Akışta olmayı seviyorsun.",
      gunluk: "Bugün duygularınla akmaya izin ver; direnme, hisset." },
    { id: "kozmik", ad: "Kozmik Gezgin",      ikon: "🌌", renk: ["#7c3aed", "#b38cff"], uyumlu: "gunes",  med: "yuksekFrekans",
      analiz: "Meraklı, özgür ve genişleyen bir ruhsun. Yeni ihtimallere açıksın.",
      gunluk: "Bugün yeni bir ihtimale kapı arala; merakını takip et." },
    { id: "bilge",  ad: "İçsel Bilge",        ikon: "🔮", renk: ["#5a3f86", "#e9c46a"], uyumlu: "kozmik", med: "rahatlama",
      analiz: "Bilge, dengeli ve farkındalığı yüksek bir enerjin var. Gözlemcisin.",
      gunluk: "Bugün sezgine güven, acele etme ve gözlemle." }
  ],

  /* Kader Haritası / Günlük Spiritüel Rehber temaları.
     Güne göre (ruh hali + test sonucuyla kişiselleşerek) biri seçilir.
     meditasyonKategori: muzikKategorileri id | kartBaslik: DATA.kartlar başlığı */
  kaderTemalari: [
    { id: "ice",        enerji: "Bugünün enerjisi içe dönüş ve sakinleşme üzerine yoğunlaşıyor 🌙", tema: "Dinlenme & Şefkat", meditasyonKategori: "sifa", olumlama: "Kendime güveniyor ve hayatın akışına izin veriyorum.", kartBaslik: "Temizlik", dikkat: "Bugün kendini zorlamak yerine akışta kalmayı dene.", rituel: "5 dakika sessizlikte otur ve nefesine odaklan." },
    { id: "yenilenme",  enerji: "Bugün taze bir başlangıç enerjisi taşıyor 🌱", tema: "Yeniden Doğuş", meditasyonKategori: "rahatlama", olumlama: "Her an yeniden başlayabilirim; geçmişi nazikçe bırakıyorum.", kartBaslik: "Taşınma", dikkat: "Eskiye tutunma; yeniye yer aç.", rituel: "Bir niyet yaz ve önünde bir mum yak." },
    { id: "guc",        enerji: "Bugün güç ve kararlılık enerjisi yüksek 🔥", tema: "İçsel Güç", meditasyonKategori: "odak", olumlama: "İçimdeki güç sınırsız; net adımlarla ilerliyorum.", kartBaslik: "İlerle", dikkat: "Ertelemekten kaçın; küçük de olsa bir adım at.", rituel: "Bugünün en önemli tek işine 25 dakika ver." },
    { id: "sezgi",      enerji: "Bugün sezgi ve farkındalık güçleniyor ✨", tema: "Uyanış", meditasyonKategori: "yuksekFrekans", olumlama: "Sezgilerime güveniyor, içsel sesimi dinliyorum.", kartBaslik: "Biliyorsun", dikkat: "Aşırı düşünme; hissetmeye izin ver.", rituel: "852 Hz dinle ve içinden geçen ilk düşünceyi yaz." },
    { id: "bolluk",     enerji: "Bugün bolluk ve genişleme enerjisi akıyor 🌟", tema: "Bereket", meditasyonKategori: "yuksekFrekans", olumlama: "Bolluk bana doğal olarak akıyor; almaya açığım.", kartBaslik: "Yükseliş", dikkat: "Kıtlık korkusunu bırak, minnete odaklan.", rituel: "Şu an sahip olduğun 3 şey için yüksek sesle şükret." },
    { id: "denge",      enerji: "Bugün denge ve uyum enerjisi öne çıkıyor 🌿", tema: "Denge", meditasyonKategori: "rahatlama", olumlama: "İçimde denge ve huzur akıyor.", kartBaslik: "Netlik", dikkat: "Aşırılıklardan kaçın; orta yolu bul.", rituel: "4-7-8 ritminde birkaç tur nefes egzersizi yap." },
    { id: "sevgi",      enerji: "Bugün sevgi ve bağ enerjisi güçlü 🤍", tema: "Kalp", meditasyonKategori: "disil", olumlama: "Sevgiye layığım; kalbim bağ kurmaya açık.", kartBaslik: "Biliyorsun", dikkat: "Başkalarına verirken kendini ihmal etme.", rituel: "Değer verdiğin birine içten bir mesaj gönder." },
    { id: "arinis",     enerji: "Bugün arınma ve bırakma enerjisi hâkim 🌊", tema: "Şifa & Arınma", meditasyonKategori: "sifa", olumlama: "Bana hizmet etmeyeni bırakıyor, hafifliyorum.", kartBaslik: "Temizlik", dikkat: "Eski yükleri taşımayı bırak.", rituel: "Bırakmak istediğin bir şeyi kâğıda yaz ve buruştur." }
  ],

  /* Spiritüel Başlangıç Testi — sorular + sonuç kategorileri.
     Her seçenek bir kategori anahtarına puan ekler; en yüksek kazanır. */
  spiriTest: {
    sorular: [
      {
        soru: "Son zamanlarda kendini nasıl hissediyorsun?",
        secenekler: [
          { metin: "Yorgun ve hassas", kat: "sifa" },
          { metin: "Kafam karışık, arayıştayım", kat: "denge" },
          { metin: "Bir şeyler değişiyor, uyanıyorum", kat: "uyanis" },
          { metin: "Güçlü ve net", kat: "gucu" }
        ]
      },
      {
        soru: "En çok neye ihtiyaç duyuyorsun?",
        secenekler: [
          { metin: "Dinlenme ve şifa", kat: "sifa" },
          { metin: "Netlik ve denge", kat: "denge" },
          { metin: "Taze bir başlangıç", kat: "baslangic" },
          { metin: "Yükselme ve genişleme", kat: "yukselis" }
        ]
      },
      {
        soru: "Zihnin mi yoksa kalbin mi daha yorgun?",
        secenekler: [
          { metin: "Kalbim yorgun", kat: "sifa" },
          { metin: "Zihnim yorgun", kat: "denge" },
          { metin: "İkisi de uyanışta", kat: "uyanis" },
          { metin: "İkisi de dinç ve güçlü", kat: "gucu" }
        ]
      },
      {
        soru: "Şu an hayatında en baskın enerji ne?",
        secenekler: [
          { metin: "İyileşme ve hüzün", kat: "sifa" },
          { metin: "Belirsizlik", kat: "denge" },
          { metin: "Dönüşüm", kat: "uyanis" },
          { metin: "Yenilenme isteği", kat: "baslangic" }
        ]
      },
      {
        soru: "Ruhun bugün hangi enerjiyi çağırıyor?",
        secenekler: [
          { metin: "Şefkat ve şifa", kat: "sifa" },
          { metin: "Kararlılık ve güç", kat: "gucu" },
          { metin: "Yeni bir sayfa", kat: "baslangic" },
          { metin: "Işık ve yükseliş", kat: "yukselis" }
        ]
      }
    ],
    /* meditasyonKategori: muzikKategorileri id | kartBaslik: DATA.kartlar başlığı */
    sonuclar: {
      sifa:      { ad: "Şifa Dönemi", analiz: "Şu an ruhun biraz dinlenmeye ve yavaşlamaya ihtiyaç duyuyor 🌙", meditasyonKategori: "sifa", olumlama: "Her nefeste iyileşiyorum; kendime şefkatle alan açıyorum.", kartBaslik: "Temizlik", rituel: "5 dakika sessizce otur ve bedenini şefkatle dinle." },
      uyanis:    { ad: "Uyanış Süreci", analiz: "İçinde bir şeyler uyanıyor; dönüşüme açıksın ✨", meditasyonKategori: "yuksekFrekans", olumlama: "Uyanışıma güveniyor, ışığımı takip ediyorum.", kartBaslik: "Yükseliş", rituel: "852 Hz dinle ve içinden geçen niyeti yaz." },
      denge:     { ad: "Denge Arayışı", analiz: "Zihnin netlik, kalbin denge arıyor 🌿", meditasyonKategori: "rahatlama", olumlama: "İçimde denge ve huzur akıyor.", kartBaslik: "Netlik", rituel: "4-7-8 ritminde birkaç tur nefes egzersizi yap." },
      gucu:      { ad: "İçsel Güç", analiz: "Güçlü bir dönemdesin; bu enerjiyi niyetlerine yönelt 🔥", meditasyonKategori: "odak", olumlama: "İçimdeki güç sınırsız; net adımlarla ilerliyorum.", kartBaslik: "İlerle", rituel: "Bugünün en önemli tek işine 25 dakika ver." },
      baslangic: { ad: "Yeniden Başlangıç", analiz: "Yeni bir sayfa açma vaktindesin; eskiyi nazikçe bırak 🌱", meditasyonKategori: "uyku", olumlama: "Her an yeniden başlayabilirim; geçmişi bırakıyorum.", kartBaslik: "Taşınma", rituel: "Sana hizmet etmeyen bir şeyi bugün sembolik olarak bırak." },
      yukselis:  { ad: "Ruhsal Yükseliş ✨", analiz: "Enerjin yüksek; genişle ve ışığını paylaş 🌟", meditasyonKategori: "yuksekFrekans", olumlama: "Işığımı buldum ve özgürce genişliyorum.", kartBaslik: "Biliyorsun", rituel: "963 Hz dinle, üç şey için şükret ve genişle." }
    },
    /* Eşitlik durumunda öncelik sırası */
    oncelik: ["sifa", "denge", "uyanis", "baslangic", "gucu", "yukselis"]
  },

  /* Geri dönen kullanıcı için kişisel karşılama şablonları.
     {ad} kullanıcının ismiyle değiştirilir; güne göre biri seçilir. */
  karsilamalar: [
    "Tekrar hoş geldin {ad} 🌙",
    "Bugün ruhun neye ihtiyaç duyuyor {ad}?",
    "Seni görmek güzel {ad} ✨",
    "Hoş geldin {ad}, derin bir nefes al 🌌",
    "Bugün de buradasın {ad} 🤍"
  ],

  /* İçsel Rehber — olumlamalar (genel havuz + rehber gruplarında özel olanlar) */
  olumlamalar: [
    "Nefes alıyorum; şu an güvendeyim ve yeterliyim.",
    "İçimdeki huzura her zaman erişebilirim.",
    "Bugün bana iyi gelen seçimleri yapıyorum.",
    "Hislerim geçicidir; ben onlardan daha büyüğüm.",
    "Kendime şefkatle ve sabırla yaklaşıyorum.",
    "Hayat beni doğru yöne taşıyor; akışına güveniyorum.",
    "Bolluk ve sevgi bana doğru akıyor.",
    "Adım adım, en iyi versiyonuma dönüşüyorum."
  ],

  /* Sesli Olumlama Sistemi — kategoriler ve olumlamalar.
     Web Speech API ile sesli okunur; favori/rastgele/günün önerisi destekler. */
  olumlamaKategorileri: [
    { id: "ozsevgi", ad: "Öz Sevgi", liste: [
      "Kendimi seviyor ve olduğum halimi kabul ediyorum.",
      "Kendime şefkatle davranmayı hak ediyorum.",
      "Olduğum gibi yeterliyim.",
      "Bedenime ve ruhuma sevgiyle bakıyorum.",
      "Kendimle barışığım ve huzurluyum."
    ]},
    { id: "guven", ad: "Güven", liste: [
      "Hayat bana destek oluyor.",
      "Kendime ve yoluma güveniyorum.",
      "İhtiyacım olan her şey çoktan içimde.",
      "Güvendeyim ve korunuyorum.",
      "Doğru zamanda, doğru yerdeyim."
    ]},
    { id: "bolluk", ad: "Bolluk", liste: [
      "Bolluk bana doğal olarak akıyor.",
      "Hak ettiğim bereketi almaya açığım.",
      "Verdikçe daha çoğunu alıyorum.",
      "Fırsatlar her yerde beni buluyor.",
      "Refah ve bolluk hayatımın bir parçası."
    ]},
    { id: "sifa", ad: "Şifa", liste: [
      "Her nefeste iyileşiyorum.",
      "Bedenim kendini onarma gücüne sahip.",
      "Geçmişi bırakıyor, bugünü iyileştiriyorum.",
      "Şifa içimden yükseliyor.",
      "Kendime iyileşmem için izin veriyorum."
    ]},
    { id: "motivasyon", ad: "Motivasyon", liste: [
      "Bugün içsel ışığım daha da güçleniyor.",
      "Hedeflerime her gün bir adım daha yaklaşıyorum.",
      "İçimde sınırsız bir güç taşıyorum.",
      "Engeller beni daha güçlü kılıyor.",
      "Bugün güzel şeyler başarabilirim."
    ]},
    { id: "sakinlesme", ad: "Sakinleşme", liste: [
      "Nefes alıyorum ve sakinleşiyorum.",
      "Zihnim sakin, kalbim huzurlu.",
      "Şu an güvendeyim, her şey yolunda.",
      "Gerginliği bırakıyor, huzuru davet ediyorum.",
      "İçimde dingin bir deniz var."
    ]},
    { id: "disil", ad: "Dişil Enerji", liste: [
      "Dişil enerjimle akıştayım ve güçlüyüm.",
      "Sezgilerime güveniyor, kalbimi dinliyorum.",
      "Yumuşaklığım benim gücüm.",
      "Ay gibi parlıyor, akışıma güveniyorum.",
      "İçimdeki bilge kadına kulak veriyorum."
    ]}
  ],

  /* İçsel Rehber motoru — kullanıcının yazdığı duygu metnine göre öneri.
     anahtarlar: küçük harfle aranır | meditasyonKategori: DATA.kategoriler id'si
     kartBaslik: DATA.kartlar içindeki bir başlık | gorev/olumlama: öneri metni */
  rehber: {
    gruplar: [
      {
        id: "kaygi",
        anahtarlar: ["kaygı", "kaygi", "endişe", "endise", "stres", "panik", "gergin", "tedirgin", "huzursuz", "kötü hiss", "kotu hiss", "bunal"],
        durum: "Kaygılı ve gergin hissediyorsun",
        destek: "Bugün zihnin biraz yorgun olabilir. Derin bir nefes al ve kendine yumuşak davran 🤍",
        meditasyonKategori: "rahatlama",
        meditasyon: "Sakinleşme Frekansı",
        kartBaslik: "Netlik",
        olumlama: "Güvendeyim ve her şey olması gerektiği gibi ilerliyor.",
        gorev: "5 dakika sessizce nefesine odaklan."
      },
      {
        id: "uzgun",
        anahtarlar: ["üzgün", "uzgun", "mutsuz", "hüzün", "huzun", "ağla", "agla", "kırgın", "kirgin", "boşluk", "bosluk", "umutsuz", "çöküntü", "cokuntu"],
        durum: "Hüzünlü ve duygusal hissediyorsun",
        destek: "Hislerine kucak aç; bu duygu da bir misafir ve geçip gidecek 💜",
        meditasyonKategori: "sifa",
        meditasyon: "Şifa & Onarım Sesi",
        kartBaslik: "Biliyorsun",
        olumlama: "Duygularıma yer açıyorum; iyileşiyorum ve yeniden açılıyorum.",
        gorev: "Kendine sarıl ve sevdiğin bir kişiye kısa bir mesaj yaz."
      },
      {
        id: "yorgun",
        anahtarlar: ["yorgun", "bitkin", "tükendim", "tukendim", "uykusuz", "enerjim yok", "halsiz", "yorgunluk"],
        durum: "Yorgun ve dinlenmeye ihtiyacın var",
        destek: "Bedenin dinlenmek istiyor. Yavaşlamana nazikçe izin ver 🌙",
        meditasyonKategori: "uyku",
        meditasyon: "Derin Uyku Tonu",
        kartBaslik: "Temizlik",
        olumlama: "Dinlenmek hakkım. Bedenime şefkatle alan açıyorum.",
        gorev: "Telefonu bırak, 10 dakika gözlerini kapatıp sadece nefesini izle."
      },
      {
        id: "ofke",
        anahtarlar: ["öfke", "ofke", "sinir", "kızgın", "kizgin", "kız", "kiz", "bıktım", "biktim", "gıcık", "rahatsız"],
        durum: "Öfkeli ve dolu hissediyorsun",
        destek: "Öfken sana bir şey söylüyor. Onu yargılamadan nazikçe bırakmaya çalış 🌿",
        meditasyonKategori: "sifa",
        meditasyon: "Arınma Frekansı",
        kartBaslik: "Temizlik",
        olumlama: "Öfkemi fark ediyor ve serbest bırakıyorum. Sakinlik benim seçimim.",
        gorev: "Hızlı bir yürüyüşe çık ya da yastığa birkaç kez güçlüce nefes ver."
      },
      {
        id: "mutlu",
        anahtarlar: ["mutlu", "iyi hiss", "harika", "huzurlu", "minnettar", "şükür", "sukur", "keyif", "neşe", "nese", "umutlu"],
        durum: "Mutlu ve enerjin yüksek",
        destek: "Bu güzel enerjiyi hisset ve kutla; tam da hak ediyorsun ✨",
        meditasyonKategori: "yuksekFrekans",
        meditasyon: "Bolluk Frekansı",
        kartBaslik: "Yükseliş",
        olumlama: "Bu sevinci kutluyorum; iyi olan her şeyi daha çok çekiyorum.",
        gorev: "Bu güzel hissi pekiştirmek için bugün için 3 şükran notu yaz."
      },
      {
        id: "motivasyon",
        anahtarlar: ["motivasyon", "hedef", "başar", "basar", "odak", "çalış", "calis", "üretken", "uretken", "ilerle", "disiplin"],
        durum: "Üretmeye ve ilerlemeye hazırsın",
        destek: "İçinde güçlü bir niyet var. Tek bir küçük adımla başla 🔥",
        meditasyonKategori: "odak",
        meditasyon: "Odak & Netlik Tonu",
        kartBaslik: "İlerle",
        olumlama: "Net niyetimle ilerliyorum; her adım beni hedefime yaklaştırıyor.",
        gorev: "Bugünün en önemli tek işini seç ve ona 25 dakika ver."
      },
      {
        id: "yalniz",
        anahtarlar: ["yalnız", "yalniz", "kimsesiz", "anlaşılm", "anlasilm", "uzak", "kopuk", "özlem", "ozlem"],
        durum: "Bağ kurmaya ve şefkate ihtiyacın var",
        destek: "Yalnız değilsin; kalbin sevgiyle bağ kurmaya hâlâ açık 🤍",
        meditasyonKategori: "disil",
        meditasyon: "Kalp Frekansı · 639 Hz",
        kartBaslik: "Biliyorsun",
        olumlama: "Sevgiye layığım; kalbim bağ kurmaya açık ve değerliyim.",
        gorev: "Değer verdiğin birine içten bir 'seni düşündüm' mesajı gönder."
      },
      {
        id: "korku",
        anahtarlar: ["korku", "korkuyorum", "endişeliyim", "cesaret", "çekiniyorum", "cekiniyorum", "güvensiz", "guvensiz", "tereddüt"],
        durum: "Korkunun eşiğinde, cesarete ihtiyacın var",
        destek: "Korku, cesaretin habercisidir. Küçük bir adım bile yeterli 🌌",
        meditasyonKategori: "sifa",
        meditasyon: "Cesaret & Köklenme",
        kartBaslik: "Sorumluluk",
        olumlama: "Korkuma rağmen ilerliyorum; güvendeyim ve gücüm içimde.",
        gorev: "Korktuğun şeyle ilgili atabileceğin en küçük adımı bugün at."
      }
    ],
    /* Hiçbir anahtar eşleşmezse */
    varsayilan: {
      id: "varsayilan",
      durum: "Bugün kendinle nazikçe bağlantıda kalmak güzel olur",
      destek: "Seni dinliyorum. Bugün kendine biraz alan açman güzel olabilir 🤍",
      meditasyonKategori: "rahatlama",
      meditasyon: "Rahatlama Sesi",
      kartBaslik: null,
      olumlama: "Olduğum yer, olmam gereken yer. Kendime güveniyorum.",
      gorev: "Üç derin nefes al ve şu an minnettar olduğun bir şeyi düşün."
    }
  },

  /* Başarımlar (kümülatif / lifetime).
     metrik: app.js'teki toplam sayaç anahtarı | hedef: rozet için gereken toplam
     ikon: inline SVG path (24x24 viewBox, stroke tabanlı minimal ikon) */
  rozetler: [
    {
      id: "giris", ad: "Sadık Yolcu", metrik: "girisGun", hedef: 7,
      aciklama: "7 farklı gün uygulamaya giriş yap.",
      ikon: '<path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4"/><circle cx="12" cy="12" r="4"/>'
    },
    {
      id: "meditasyon", ad: "Huzur Ustası", metrik: "medGun", hedef: 21,
      aciklama: "21 farklı gün meditasyon/frekans dinle.",
      ikon: '<path d="M12 4a4 4 0 0 1 4 4c0 2-1.5 3-2 4M12 4a4 4 0 0 0-4 4c0 2 1.5 3 2 4"/><path d="M5 14c2 1.5 4.5 2 7 2s5-.5 7-2"/><path d="M5 18c2 1.5 4.5 2 7 2s5-.5 7-2"/>'
    },
    {
      id: "sukran", ad: "Şükran Kalbi", metrik: "sukranTop", hedef: 30,
      aciklama: "Toplam 30 şükran notu kaydet.",
      ikon: '<path d="M12 20s-7-4.35-7-9a4 4 0 0 1 7-2.65A4 4 0 0 1 19 11c0 4.65-7 9-7 9z"/>'
    },
    {
      id: "gorev", ad: "Kararlı Ruh", metrik: "gorevTop", hedef: 10,
      aciklama: "Toplam 10 mini görev tamamla.",
      ikon: '<path d="M20 6L9 17l-5-5"/>'
    },
    {
      id: "moodSeri", ad: "Kendini Tanıyorum", metrik: "moodSeri", hedef: 7,
      aciklama: "7 gün üst üste ruh halini kaydet.",
      ikon: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14c1 .9 2.2 1.3 3.5 1.3s2.5-.4 3.5-1.3"/><path d="M9 9h.01M15 9h.01"/>'
    },
    {
      id: "moodTop", ad: "İçsel Farkındalık", metrik: "moodTop", hedef: 30,
      aciklama: "Toplam 30 gün ruh hali kaydı tut.",
      ikon: '<path d="M12 3a9 9 0 1 0 9 9"/><path d="M12 7v5l3 2"/><path d="M16 3l2 2-2 2"/>'
    }
  ]
};
