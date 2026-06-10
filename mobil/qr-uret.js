// exp:// adresinden bağlantı QR'ı üretir → baglanti-qr.png
const QRCode = require("qrcode");
const url = process.argv[2] || "exp://192.168.1.4:8081";
const cikti = process.argv[3] || "baglanti-qr.png";
QRCode.toFile(cikti, url, { width: 640, margin: 2, color: { dark: "#0c0a1c", light: "#ffffff" } }, (err) => {
  if (err) { console.error("HATA:", err.message); process.exit(1); }
  console.log("OLUSTU:", cikti, "->", url);
});
