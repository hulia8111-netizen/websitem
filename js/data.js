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

  /* Meditasyon sesleri — Ses dosyalarım/ klasöründeki gerçek dosyalar */
  sesler: [
    { ad: "Mucize Frekans 💎", dosya: "Ses dosyalarım/vidssave.com Mucize Frekans 💎 Bu Frekansı Günde 3 Kez Dinle 💎 Mucizeler OLdu OLdu OLdu 💎 128KBPS.mp3" },
    { ad: "Meditasyon Sesi",   dosya: "Ses dosyalarım/mp3.mpeg" }
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

  /* Ürün satın alma linkleri — kendi linklerinle değiştir */
  urunler: [
    { ad: "Meditasyon Minderi", aciklama: "Rahat oturuş için ergonomik minder.", link: "#" },
    { ad: "Mum", aciklama: "Sıcak ışığıyla ortamını sakinleştiren mum.", link: "#" },
    { ad: "Şükran Defteri", aciklama: "Günlük yazıların için özel defter.", link: "#" },
    { ad: "Kristal Set", aciklama: "Enerji dengesi için başlangıç seti.", link: "#" }
  ],

  /* Haftalık rozet kuralları.
     metrik: hafta içindeki ilgili sayaç | hedef: rozet için gereken gün/adet */
  rozetler: [
    { id: "istikrar",   ad: "İstikrar 🏅",   metrik: "gorev",   hedef: 5, aciklama: "Bir haftada 5 mini görev tamamla." },
    { id: "huzur",      ad: "İç Huzur 🧘",    metrik: "mood",    hedef: 5, aciklama: "Bir haftada 5 gün ruh halini kaydet." },
    { id: "yazar",      ad: "Kalem 📓",       metrik: "gunluk",  hedef: 3, aciklama: "Bir haftada 3 günlük yaz." },
    { id: "minnet",     ad: "Minnettarlık 🙏", metrik: "sukran", hedef: 5, aciklama: "Bir haftada 5 şükran notu ekle." },
    { id: "farkindalik", ad: "Farkındalık 🔮", metrik: "soru", hedef: 4, aciklama: "Bir haftada 4 farkındalık sorusu yanıtla." }
  ]
};
