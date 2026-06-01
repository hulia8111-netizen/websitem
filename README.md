# 🌙 Ruh & Niyet

Statik, sunucusuz bir kişisel farkındalık & motivasyon panosu. Tüm veriler
tarayıcıda (`localStorage`) saklanır; giriş veya internet gerektirmez (meditasyon
sesleri hariç).

## Bölümler
Günün motivasyon cümlesi · Meditasyon çaları · Günlük ruh hali · Kart çekme ·
Mini görev · Farkındalık sorusu · Manifest hedefler · Şükran defteri · Günlük ·
Haftalık rozetler · Ürün linkleri · JSON yedek al/yükle.

## Çalıştırma
Sesler ve görsellerin düzgün yüklenmesi için yerel bir sunucuyla aç:

```bash
node .claude/server.js
# sonra tarayıcıda: http://localhost:5500
```

## Özelleştirme
İçerikler [js/data.js](js/data.js) içinde: motivasyon cümleleri, kart destesi,
görevler, sorular, ses listesi ve ürün linkleri buradan düzenlenir.
