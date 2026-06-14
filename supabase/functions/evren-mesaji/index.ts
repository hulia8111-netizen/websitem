// ============================================================
// evren-mesaji — "Evrenden Mesajını Al" push gönderimi (Supabase Edge Function)
// Her 5 dakikada bir çalışır (cron). Türkiye saatine göre, kullanıcının
// "evren-ayar" içindeki saatlerinden biri şu anki 5 dk penceresine düşen ve
// o slotu bugün henüz almamış aktif aboneye, açılış sözlerinden rastgele bir
// ilham cümlesi Web Push olarak gönderir. Aynı gün aynı söz tekrar etmez;
// yakın günlerde tekrar azaltılır (gecmis). Uygulama kapalı olsa da çalışır.
//
// Sözler aşağıya gömülüdür (js/acilis-cumleler.js ile birebir). Sözler
// değişince scripts\evren-fonksiyon-guncelle.ps1 ile bu dizi yenilenir.
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// >>> ACILIS_CUMLELERI (otomatik) — js/acilis-cumleler.js ile eşitle
const SOZLER = [
  "Dışa bakan rüya görür, içe bakan uyanır.",
  "Bilinçaltını bilince dönüştürene kadar, o seni yönetir; sen buna kader dersin.",
  "Kendin olmak, dünyadaki en cesur eylemdir.",
  "Başıma gelenlerin toplamı değilim; ben olmayı seçtiğim kişiyim.",
  "Kabul etmediğin şeyi değiştiremezsin; reddetmek özgürleştirmez, zincirler.",
  "Aydınlanmak, ışığı hayal etmekle değil, karanlığı fark etmekle başlar.",
  "En büyük trajedi, yaşanmamış bir hayatın ağırlığı altında ezilmektir.",
  "Kendinle yüzleşmek en zorudur; ama tek gerçek özgürlük budur.",
  "Kendin olmana izin vermeyen kalabalıkta dik durmak, en büyük zaferdir.",
  "Görüşün, ancak kalbinin içine bakabildiğinde berraklaşır.",
  "Kendine dürüst olmak, en sancılı ama en özgürleştirici adımdır.",
  "Başkalarında seni rahatsız eden şey, kendini tanımanın kapısıdır.",
  "İki insan, iki kimyasal madde gibidir: tepki varsa ikisi de dönüşür.",
  "İçindeki çatışmayı çözmezsen, dünya onu sana bir savaş olarak sunar.",
  "Hayatın her dönemi, kendi benzersiz bilgeliğini taşır.",
  "Acı, çoğu zaman bilincin uyanması için ödenen bedeldir.",
  "Zihnindeki fırtınayı durduramazsın; ama içinden geçecek cesareti bulabilirsin.",
  "Direndiğin şey, varlığını sürdürmeye devam eder.",
  "Karanlık duygularını kovma; içeri davet et ve ne söylediğini dinle.",
  "Kendi karanlığını tanımak, başkalarınınkiyle baş etmenin en iyi yoludur.",
  "Ellerin yaratıcılığı, zihnin çözemediği düğümleri çözer.",
  "Anlamak yetmez; bir gerçeği ancak tüm varlığınla hissettiğinde yaşarsın.",
  "Hayatın bir anlamı olmalı; yoksa yalnızca katlanılan bir yüke dönüşür.",
  "Gerçek bilgi kelimeler değil, yaşanmış deneyimdir.",
  "Kendi hikâyeni yazmazsan, başkalarının senaryosunda figüran olursun.",
  "Asıl seçim doğruyla yanlış değil; anlamla anlamsızlık arasındadır.",
  "Dünyayı değiştirmek istiyorsan, önce kendi algını değiştir.",
  "Başkalarının senin hakkındaki düşünceleri, kendi iç dünyalarının yansımasıdır.",
  "Hazır bir yol bulamadıysan, kendi yolunu inşa etme vaktidir.",
  "Kendi yalnızlığını sevemeyen, kalabalıkta kaybolur.",
  "Hayatın amacı topluma uymak değil; kendi bütünlüğünü tamamlamaktır.",
  "Işığa ulaşmak için gölgeni de cesaretle kabul et.",
  "İçindeki karmaşayı dindirmek istiyorsan, dışarıdaki gürültüyü kıs.",
  "Kendine şefkat göstermeyen, başkalarına da gerçekten adil olamaz.",
  "Ruhunun derinliğinden gelen sessiz sesi duymadıkça, gerçek huzuru bulamazsın.",
  "Dikkatini dış dünyadan çektiğin an, enerjini geri çağırırsın.",
  "Minnettarlık, almanın en yüksek hâlidir.",
  "Deneyimsiz bilgi felsefedir; bilgisiz deneyim ise körlük.",
  "Farkındalığın arttıkça, enerjini boşa harcamaktan vazgeçersin.",
  "Tepkisel duygularını bıraktığında, eski benliğine dönmekten kurtulursun.",
  "Anı ne kadar çok yaşarsan, o kadar derin odaklanırsın.",
  "Hep hayatta kalma telaşındaysan, kendine inanma fırsatı bulamazsın.",
  "Daha az öfkelenirsen; daha az incinir, daha az yargılar, daha çok huzur bulursun.",
  "İçindeki bilgeliğe, seni seven biri gibi seslen; çünkü öyledir.",
  "Gerçek teslimiyet, kontrolü bırakıp en iyi çözümün sana gelmesine izin vermektir.",
  "Yeni bir sonuç istiyorsan, eski benlik olma alışkanlığını kır ve yeniden doğ.",
  "Öyle güçlü bir minnet duy ki, yeni hayatın çoktan gerçekleşmiş gibi hisset.",
  "Dua ettiğinde, daha gerçekleşmeden teşekkür etmeyi unutma.",
  "Yüce bir güce teslim ol; engellerini onun çözmesine izin ver.",
  "İnsanlar arası bağlar en güçlüsüdür, çünkü duygu en güçlü enerjiyi taşır.",
  "Bir türlü düşünüp başka türlü hissederken, hayatının değişmesini bekleme.",
  "Olmak istediğin hâli zihninde prova ettikçe, hayatını yeniden yaratırsın.",
  "Beynini farklı çalıştırdığın her an, zihnini de değiştirirsin.",
  "Dış dünyayı saplantı yaparsan, iç gerçekliğine odaklanamazsın.",
  "Gerçek bir meditasyon, kalktığında seni değiştirmiş olandır.",
  "Yeni bir benlik yaratmak için, önce eskisini bırakmalısın.",
  "Kendine her gün pozitif bir gelecek sinyali gönder.",
  "Henüz gerçekleşmemiş güzelliğe bile şimdiden minnet duyabilirsin.",
  "Yeniliğe açılmak için, önce her şeyi bırakıp sıfırlanmayı göze al.",
  "Başkalarına yaptığımızı, aslında kendimize yaparız.",
  "Zihin bedene egemen olduğunda, gerçek değişim başlar.",
  "Var olan her şey, özünde enerji ve bilgidir.",
  "Algın gerçekliği şekillendirir; onu olduğu gibi görmek neredeyse imkânsızdır.",
  "İç dünyanı değiştirdiğinde, dış gerçekliğin de değişir.",
  "Bütün olasılıklar şu anda, bu anın içinde mevcuttur.",
  "Zor zamanlar, cesur adımlar ister.",
  "Bedenin, kendini iyileştirme gücüyle doğmuştur.",
  "Birinden nefret edersen, o nefret seni ona bağlar.",
  "Dünün rutinini sürdürürsen, yarının dününden farklı olmaz.",
];
// <<< ACILIS_CUMLELERI

const PENCERE_DK = 5;   // cron aralığı: bir slot, saatine ulaşınca ilk 5 dk içinde gönderilir

type Gon = { gun: string; slots: number[]; sozler: number[]; gecmis: number[] };

function sozSec(g: Gon): number {
  const n = SOZLER.length;
  const maxG = Math.min(n - 1, 30);
  let aday: number[] = [];
  for (let i = 0; i < n; i++) if (g.sozler.indexOf(i) === -1 && g.gecmis.indexOf(i) === -1) aday.push(i);
  if (!aday.length) for (let i = 0; i < n; i++) if (g.sozler.indexOf(i) === -1) aday.push(i);
  if (!aday.length) for (let i = 0; i < n; i++) aday.push(i);
  const idx = aday[Math.floor(Math.random() * aday.length)];
  g.sozler.push(idx);
  g.gecmis.push(idx);
  while (g.gecmis.length > maxG) g.gecmis.shift();
  return idx;
}

Deno.serve(async () => {
  try {
    const SB_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC");
    const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE");
    if (!SB_URL || !SERVICE_ROLE) return j({ ok: false, hata: "Supabase env eksik" }, 500);
    if (!VAPID_PUBLIC || !VAPID_PRIVATE) return j({ ok: false, hata: "VAPID secrets eksik" }, 500);

    const webpush = (await import("npm:web-push@3.6.7")).default;
    webpush.setVapidDetails("mailto:hulia8111@gmail.com", VAPID_PUBLIC, VAPID_PRIVATE);

    const sb = createClient(SB_URL, SERVICE_ROLE);
    const tr = new Date(Date.now() + 3 * 3600 * 1000);   // Türkiye saati (UTC+3)
    const today = tr.toISOString().slice(0, 10);
    const nowMin = tr.getUTCHours() * 60 + tr.getUTCMinutes();

    const { data: aboneler, error } = await sb.from("push_abone").select("user_id, abone, evren_gon");
    if (error) return j({ ok: false, hata: error.message }, 500);

    let gonderilen = 0, bakilan = 0;
    for (const r of aboneler ?? []) {
      const { data: ayarRow } = await sb.from("kullanici_veri").select("deger")
        .eq("user_id", r.user_id).eq("anahtar", "evren-ayar").maybeSingle();
      const ayar = ayarRow?.deger as { aktif?: boolean; sayi?: number; saatler?: string[] } | undefined;
      if (!ayar?.aktif) continue;
      bakilan++;
      const sayi = Math.min(3, Math.max(1, Number(ayar.sayi) || 1));
      const saatler = Array.isArray(ayar.saatler) ? ayar.saatler : ["10:00", "15:00", "20:00"];

      let g: Gon = (r.evren_gon as Gon) ?? { gun: today, slots: [], sozler: [], gecmis: [] };
      if (g.gun !== today) { g = { gun: today, slots: [], sozler: [], gecmis: g.gecmis ?? [] }; }
      if (!Array.isArray(g.slots)) g.slots = [];
      if (!Array.isArray(g.sozler)) g.sozler = [];
      if (!Array.isArray(g.gecmis)) g.gecmis = [];

      // saatine ulaşmış, bu 5 dk penceresine düşen, henüz gönderilmemiş ilk slot
      let slot = -1;
      for (let s = 0; s < sayi; s++) {
        if (g.slots.indexOf(s) !== -1) continue;
        const parts = String(saatler[s] ?? "").split(":");
        const sm = (parseInt(parts[0]) || 0) * 60 + (parseInt(parts[1]) || 0);
        const fark = nowMin - sm;
        if (fark >= 0 && fark < PENCERE_DK) { slot = s; break; }
      }
      if (slot === -1) continue;

      const soz = SOZLER[sozSec(g)];
      try {
        await webpush.sendNotification(r.abone, JSON.stringify({ title: "✨ Evrenden mesajın var", body: soz, url: "./", tip: "ana-sayfa" }));
        g.slots.push(slot);
        await sb.from("push_abone").update({ evren_gon: g }).eq("user_id", r.user_id);
        gonderilen++;
      } catch (e) {
        const kod = (e as { statusCode?: number })?.statusCode;
        if (kod === 404 || kod === 410) await sb.from("push_abone").delete().eq("user_id", r.user_id);
      }
    }
    return j({ ok: true, today, nowMin, abone: (aboneler ?? []).length, aktif: bakilan, gonderilen });
  } catch (e) {
    return j({ ok: false, hata: String((e as Error)?.message ?? e) }, 500);
  }
});

function j(o: unknown, status = 200) {
  return new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json" } });
}
