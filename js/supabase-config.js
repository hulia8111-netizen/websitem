/* ============================================================
   supabase-config.js — Bulut bağlantı ayarları
   Kendi Supabase projenin değerlerini buraya yapıştır.
   (Supabase paneli → Project Settings → API)
   Bu iki değer "public" anon anahtardır, gizli değildir; istemcide kullanılır.
   Boş bırakılırsa uygulama yalnızca yerel (localStorage) çalışır.
   ============================================================ */

const SUPABASE_URL = "https://liotmhoyoduwidojwrkd.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxpb3RtaG95b2R1d2lkb2p3cmtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NDgwNjksImV4cCI6MjA5NjIyNDA2OX0.xeqD_ioMXJTzsPeyF7YUHFC7urRnreuK3EYQiCBijZE";

/* Web Push (gerçek bildirim) — VAPID public anahtarı (herkese açık, güvenli). */
const VAPID_PUBLIC = "BK112av9alM6c0vGGcvPZUUVP8D1hcMUErcZoKvgxboEJS3NBgrjfrr1ukimVSGiQnIKvthKCR9kuj3y3ji9XaA";
