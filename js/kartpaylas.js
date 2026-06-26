/* ============================================================
   kartpaylas.js — "Günün Kartını Paylaş" 📲
   ------------------------------------------------------------
   Çekilen kartı (görsel + başlık + mesaj + "Işığını Bul" markası)
   tek bir şık görsele (canvas) dönüştürür ve cihazın paylaşım
   menüsüyle (Instagram/WhatsApp vb.) paylaşır. Paylaşım yoksa
   görseli indirir. Organik büyüme için.
   Global: window.KartPaylas
   ============================================================ */
const KartPaylas = window.KartPaylas = (() => {

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function wrapText(ctx, text, cx, y, maxW, lh) {
    var words = String(text || "").split(" ");
    var line = "", lines = [];
    for (var i = 0; i < words.length; i++) {
      var test = line ? line + " " + words[i] : words[i];
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = words[i]; }
      else line = test;
    }
    if (line) lines.push(line);
    for (var j = 0; j < lines.length; j++) ctx.fillText(lines[j], cx, y + j * lh);
    return lines.length;
  }

  // Kartı 1080x1350 (4:5) şık bir PNG'ye dönüştür
  function gorselUret(kart) {
    return new Promise(function (resolve, reject) {
      var W = 1080, H = 1350;
      var cv = document.createElement("canvas"); cv.width = W; cv.height = H;
      var ctx = cv.getContext("2d");
      // arka plan: mor → gece mavisi radyal
      var g = ctx.createRadialGradient(W * 0.32, H * 0.24, 60, W * 0.5, H * 0.5, H);
      g.addColorStop(0, "#2a1d52"); g.addColorStop(0.55, "#161033"); g.addColorStop(1, "#0c0a1c");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

      var img = new Image();
      img.onload = function () {
        var cardW = 600, cardH = 840, cx = (W - cardW) / 2, cy = 80;
        // object-fit: cover
        var ar = img.width / img.height, tr = cardW / cardH, sw, sh, sx, sy;
        if (ar > tr) { sh = img.height; sw = sh * tr; sx = (img.width - sw) / 2; sy = 0; }
        else { sw = img.width; sh = sw / tr; sx = 0; sy = (img.height - sh) / 2; }
        roundRect(ctx, cx, cy, cardW, cardH, 28); ctx.save(); ctx.clip();
        ctx.drawImage(img, sx, sy, sw, sh, cx, cy, cardW, cardH); ctx.restore();
        ctx.lineWidth = 3; ctx.strokeStyle = "rgba(243,217,140,0.6)";
        roundRect(ctx, cx, cy, cardW, cardH, 28); ctx.stroke();

        ctx.textAlign = "center";
        // başlık (altın)
        ctx.fillStyle = "#f3d98c";
        ctx.font = "700 62px 'Playfair Display', Georgia, serif";
        ctx.fillText(kart.baslik || "", W / 2, cy + cardH + 92);
        // mesaj (beyaz, sarmalı)
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.font = "400 36px Inter, Arial, sans-serif";
        wrapText(ctx, kart.mesaj || "", W / 2, cy + cardH + 155, W - 150, 48);
        // marka
        ctx.fillStyle = "#f3d98c";
        ctx.font = "600 40px 'Playfair Display', Georgia, serif";
        ctx.fillText("✨ Işığını Bul", W / 2, H - 86);
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.font = "400 30px Inter, Arial, sans-serif";
        ctx.fillText("isiginibull.net", W / 2, H - 44);

        cv.toBlob(function (b) { b ? resolve(b) : reject(new Error("blob")); }, "image/png", 0.95);
      };
      img.onerror = function () { reject(new Error("gorsel")); };
      img.src = encodeURI(kart.img || "");
    });
  }

  async function paylas(kart) {
    if (!kart) return;
    var metin = (kart.baslik ? kart.baslik + "\n" : "") + (kart.mesaj || "") + "\n\n✨ Işığını Bul · isiginibull.net";
    try {
      var blob = await gorselUret(kart);
      var dosya = new File([blob], "isigini-bul-kart.png", { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [dosya] })) {
        await navigator.share({ files: [dosya], title: "Günün Kartı", text: metin });
        return;
      }
      // görsel paylaşımı yoksa: görseli indir
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a"); a.href = url; a.download = "isigini-bul-kart.png";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 3000);
    } catch (e) {
      // görsel üretilemediyse en azından metni paylaş
      try { if (navigator.share) { await navigator.share({ title: "Günün Kartı", text: metin }); } } catch (x) {}
    }
  }

  return { paylas, gorselUret };
})();
