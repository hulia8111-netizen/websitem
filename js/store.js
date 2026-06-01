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
