/* ============================================================
   store.js — localStorage tabanlı veri katmanı + yardımcılar.
   Tüm veriler kullanıcının tarayıcısında saklanır.
   ============================================================ */

const Store = {
  PREFIX: "kdm_", // tüm anahtarların önüne eklenir (kişisel-dashboard)

  /* Bir değeri kaydet (otomatik JSON) */
  set(key, value) {
    try {
      localStorage.setItem(this.PREFIX + key, JSON.stringify(value));
      if (window.Bulut && Bulut.kaydet) Bulut.kaydet(key, value); // bulut senkron (giriş varsa)
    } catch (e) {
      console.warn("Kaydedilemedi:", key, e);
    }
  },

  /* Bir değeri oku, yoksa varsayılanı döndür */
  get(key, fallback = null) {
    const raw = localStorage.getItem(this.PREFIX + key);
    if (raw === null) return fallback;
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  },

  remove(key) {
    localStorage.removeItem(this.PREFIX + key);
  },

  /* PREFIX ile başlayan tüm anahtarlar */
  allKeys() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(this.PREFIX)) keys.push(k);
    }
    return keys;
  },

  /* Tüm veriyi JSON dosyası olarak indir (yedek) */
  exportAll() {
    const dump = {};
    this.allKeys().forEach(k => {
      dump[k] = localStorage.getItem(k);
    });
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "yedek-" + todayKey() + ".json";
    a.click();
    URL.revokeObjectURL(url);
  },

  /* JSON dosyasından veriyi geri yükle */
  importAll(file, onDone) {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const dump = JSON.parse(e.target.result);
        Object.entries(dump).forEach(([k, v]) => {
          if (k.startsWith(this.PREFIX)) localStorage.setItem(k, v);
        });
        onDone && onDone(true);
      } catch (err) {
        console.error(err);
        onDone && onDone(false);
      }
    };
    reader.readAsText(file);
  }
};

/* ---------- Tarih / zaman yardımcıları ---------- */

/* Bugünün anahtarı: YYYY-MM-DD (yerel saat) */
function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/* ISO hafta kimliği: "2026-W23" (rozet penceresi için) */
function weekId(d = new Date()) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (date.getUTCDay() + 6) % 7; // Pazartesi = 0
  date.setUTCDate(date.getUTCDate() - dayNum + 3); // Perşembeye taşı
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((date - firstThursday) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/* Bir tarihin gün indeksini (epoch günü) verir — deterministik seçim için */
function dayIndex(d = new Date()) {
  return Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 86400000);
}

/* Diziden tarihe göre sabit (o gün hep aynı) bir eleman seçer */
function pickByDate(arr, d = new Date()) {
  if (!arr || !arr.length) return null;
  return arr[dayIndex(d) % arr.length];
}

/* Son n günün tarih anahtarları (bugünden geriye) */
function lastNDays(n) {
  const out = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    out.push(todayKey(d));
  }
  return out;
}

/* Bir 'YYYY-MM-DD' anahtarını Date'e çevirir (yerel) */
function keyToDate(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/* Belirli önekli, değeri truthy olan anahtar (gün) sayısı.
   örn: aktifGunSayisi("med-") → kaç farklı gün meditasyon yapılmış */
function aktifGunSayisi(prefix) {
  const tam = Store.PREFIX + prefix;
  return Store.allKeys()
    .filter(k => k.startsWith(tam))
    .filter(k => Store.get(k.slice(Store.PREFIX.length)))
    .length;
}

/* Belirli bir önekli (truthy) günlerin tarih anahtarlarını artan sırada verir.
   örn: gunAnahtarlari("mood-") → ["2026-05-30", "2026-05-31", ...] */
function gunAnahtarlari(prefix) {
  const tam = Store.PREFIX + prefix;
  return Store.allKeys()
    .filter(k => k.startsWith(tam))
    .map(k => k.slice(tam.length))
    .filter(g => Store.get(prefix + g))   // truthy
    .sort();
}

/* Bugünden (yoksa dünden) geriye doğru ardışık gün serisi sayısı. */
function mevcutSeri(prefix) {
  const set = new Set(gunAnahtarlari(prefix));
  if (!set.size) return 0;
  let n = 0;
  const imlec = new Date();
  if (!set.has(todayKey(imlec))) imlec.setDate(imlec.getDate() - 1);
  while (set.has(todayKey(imlec))) {
    n++;
    imlec.setDate(imlec.getDate() - 1);
  }
  return n;
}

/* Giriş (visit-*) anahtarlarından streak bilgisi.
   { guncel, enUzun, toplam } — guncel: bugünden geriye ardışık gün sayısı */
function streakBilgisi() {
  const gunler = Store.allKeys()
    .filter(k => k.startsWith(Store.PREFIX + "visit-"))
    .map(k => k.replace(Store.PREFIX + "visit-", ""))
    .filter(g => Store.get("visit-" + g))   // truthy
    .sort();                                  // artan

  const toplam = gunler.length;
  if (!toplam) return { guncel: 0, enUzun: 0, toplam: 0 };

  const set = new Set(gunler);
  const birGun = 86400000;

  // En uzun ardışık seri
  let enUzun = 1, seri = 1;
  for (let i = 1; i < gunler.length; i++) {
    const fark = Math.round((keyToDate(gunler[i]) - keyToDate(gunler[i - 1])) / birGun);
    seri = (fark === 1) ? seri + 1 : 1;
    if (seri > enUzun) enUzun = seri;
  }

  // Güncel seri: bugünden (yoksa dünden) geriye ardışık
  let guncel = 0;
  let imlec = new Date();
  if (!set.has(todayKey(imlec))) imlec.setDate(imlec.getDate() - 1);
  while (set.has(todayKey(imlec))) {
    guncel++;
    imlec.setDate(imlec.getDate() - 1);
  }

  return { guncel, enUzun, toplam };
}
