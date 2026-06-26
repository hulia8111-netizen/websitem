# Google Play — Hazır Form Cevapları (Işığını Bul)

> Hesap kilidi açılınca Play Console'da bu cevapları sırayla kullan. Çoğu kopyala-yapıştır.
> Hesap Kimliği: 6232586665604971954 · E-posta: hulia8111@gmail.com

---

## 1) Uygulama oluşturma (Create app)
| Alan | Cevap |
|---|---|
| Uygulama adı | **Işığını Bul** |
| Varsayılan dil | **Türkçe (tr-TR)** |
| Uygulama mı / oyun mu | **Uygulama** |
| Ücretsiz / Ücretli | **Ücretsiz** |
| Beyanlar | İki kutucuğu da **işaretle** |

---

## 2) Mağaza girişi (Main store listing)
| Alan | Cevap |
|---|---|
| Uygulama adı | Işığını Bul |
| Kısa açıklama (80) | `Kartlar, meditasyon, ruh hali ve farkındalıkla huzurlu bir içsel yolculuk.` |
| Tam açıklama | `play-store/metinler.md` dosyasındaki uzun metin |
| Uygulama simgesi (512×512) | `play-store/icon-512.png` |
| Öne çıkan grafik (1024×500) | `play-store/tanitim.png` |
| Telefon ekran görüntüleri | Sohbetteki 6 görüntü |
| İletişim e-postası | hulia8111@gmail.com |
| Web sitesi | https://isiginibull.net |
| Gizlilik politikası | https://isiginibull.net/gizlilik/ |

**Kategori:** Uygulama kategorisi → **Sağlık ve Fitness** (alternatif: Yaşam Tarzı)
**Etiketler:** meditasyon, farkındalık, ruh hali, günlük, wellbeing

---

## 3) Uygulama içeriği (App content) — kurulum görevleri

### 3.1 Uygulama erişimi (App access)
- Uygulama **giriş (e-posta + şifre) gerektiriyor** → "Tüm işlevler özel erişim olmadan kullanılamaz" seçeneğini seç.
- **Test hesabı bilgisi** ekle (Google inceleyici giriş yapabilsin diye):
  - Talimat: *"Uygulama açılınca isim girip aşağıdaki test hesabıyla giriş yapın."*
  - E-posta: **(test hesabı — yayından önce oluşturacağız)**
  - Şifre: **(test hesabı şifresi)**
  > Not: Yayından hemen önce bir test hesabı oluşturup bilgilerini buraya yazacağız.

### 3.2 Reklamlar (Ads)
- **Hayır** — uygulamada reklam yok.

### 3.3 İçerik derecelendirmesi (Content rating anketi)
- E-posta: hulia8111@gmail.com
- Kategori: **Yardımcı program / Yaşam tarzı / Diğer** (sosyal/oyun değil)
- Sorulara cevaplar:
  - Şiddet → **Hayır**
  - Cinsel içerik / çıplaklık → **Hayır**
  - Küfür / kaba dil → **Hayır**
  - Uyuşturucu, alkol, tütün → **Hayır**
  - Kumar (gerçek/sanal) → **Hayır**
  - Korku / ürkütücü içerik → **Hayır**
  - Kullanıcılar arası iletişim / sohbet → **Hayır**
  - Kullanıcı konumu paylaşımı → **Hayır**
  - Kullanıcı içeriği paylaşımı (herkese açık) → **Hayır**
- Beklenen sonuç: **Herkes (3+)**

### 3.4 Hedef kitle ve içerik (Target audience)
- Hedef yaş grubu: **18 ve üzeri** (yetişkin) seç. **13 altını SEÇME.**
- "Uygulamanız çocuklara mı yönelik?" → **Hayır**
- (Böylece çocuk/aile politikaları devreye girmez.)

### 3.5 Veri güvenliği (Data safety)
- Uygulama veri **topluyor mu?** → **Evet**
- Toplanan veriler:
  - **E-posta adresi** → amaç: Hesap yönetimi / uygulama işlevi
  - **Uygulama içi etkinlik / kullanıcı içeriği** (ruh hali, günlük, görev cevapları, ayarlar) → amaç: Uygulama işlevi, cihazlar arası senkron
- Veriler **aktarım sırasında şifreleniyor mu?** → **Evet** (HTTPS)
- Kullanıcı **verisinin silinmesini isteyebilir mi?** → **Evet** (e-posta ile: hulia8111@gmail.com)
- Veriler **üçüncü taraflarla paylaşılıyor mu?** → **Hayır** (Supabase yalnızca altyapı/işleyici; reklam/izleme yok)
- **Reklam/izleme amaçlı veri** → **Hayır**

### 3.6 Diğer beyanlar
- Devlet uygulaması mı? → **Hayır**
- Finansal özellikler → **Yok**
- Sağlık/COVID uygulaması → **Hayır** (wellbeing, tıbbi değil)
- Haber uygulaması → **Hayır**

---

## 4) Sürüm — Kapalı test (Closed testing)
- Yükleme dosyası: `play-store/isigini-bul-1.0.0.aab`
- Sürüm adı: 1.0.0 (1)
- Sürüm notları (TR): `İlk sürüm: günün kartı, ruh hali, meditasyon, günlük, görevler, mağaza ve daha fazlası.`
- **Test kullanıcıları:** en az **12 kişi** (Gmail adresleri) → 14 gün açık kalacak
- Testçi listesi `play-store/test-kullanicilari.md` dosyasında toplanıyor.

---

## 5) Yayın sırası (kilit açılınca)
1. Uygulama oluştur (bölüm 1)
2. Mağaza girişi + grafikler (bölüm 2)
3. Uygulama içeriği formları (bölüm 3)
4. Kapalı test sürümü + AAB yükle + 12 testçi (bölüm 4)
5. İncelemeye gönder → onay → 14 gün test → üretime (production) çıkar
