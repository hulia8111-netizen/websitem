/* ============================================================
   Işığını Bul — Mobil uygulama (Expo SDK 54)
   isiginibull.net sitesini tam ekran bir WebView içinde çalıştırır.
   + NATIVE PUSH: expo-notifications ile Expo push token alınır, WebView'e
     köprülenir (site push_token'a yazar). Bildirime tıklanınca ilgili
     ekrana yönlendirir. Uygulama kapalıyken de push çalışır (FCM).
   ============================================================ */
import React, { useRef, useState, useEffect } from "react";
import { View, Text, Pressable, ActivityIndicator, StyleSheet, BackHandler, Platform, StatusBar, Linking, AppState } from "react-native";
import { WebView } from "react-native-webview";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import * as StoreReview from "expo-store-review";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import mobileAds, { RewardedAd, RewardedAdEventType, InterstitialAd, AdEventType } from "react-native-google-mobile-ads";

const SITE = "https://isiginibull.net";
const BG = "#0c0a1c";
const REKLAM_BIRIMI = "ca-app-pub-6623600258686617/8573778487";  // Ödüllü (Rewarded)
const GECIS_BIRIMI = "ca-app-pub-6623600258686617/6642583864";   // Geçiş (Interstitial) — kart

// Bildirim geldiğinde (uygulama açıkken) sistemde göster
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Expo push token al (izin + Android kanalı)
// iste=false → izin penceresi açma; yalnız izin zaten verildiyse jeton al
async function pushTokenAl(iste = true) {
  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Işığını Bul",
        importance: Notifications.AndroidImportance.DEFAULT,
        lightColor: "#f3d98c",
      });
    }
    if (!Device.isDevice) return null;
    const mevcut = await Notifications.getPermissionsAsync();
    let izin = mevcut.status;
    if (izin !== "granted" && iste) {
      const istek = await Notifications.requestPermissionsAsync();
      izin = istek.status;
    }
    if (izin !== "granted") return null;
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ||
      Constants?.easConfig?.projectId;
    const t = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    return t?.data || null;
  } catch (e) {
    return null;
  }
}

export default function App() {
  const webRef = useRef(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [geriGidebilir, setGeriGidebilir] = useState(false);
  const [token, setToken] = useState(null);
  const [sayfaHazir, setSayfaHazir] = useState(false);
  const bekleyenYol = useRef(null);
  const reklamRef = useRef(null);
  const reklamHazirRef = useRef(false);
  const gecisRef = useRef(null);
  const gecisHazirRef = useRef(false);
  // İnternetsiz kullanım: önce normal yükle; hata olursa (çevrimdışı) telefon
  // önbelleğinden aç. Önbellek de boşsa sade bir "bağlantı yok" ekranı göster.
  const [cacheModu, setCacheModu] = useState("LOAD_DEFAULT");
  const [cevrimdisiHata, setCevrimdisiHata] = useState(false);

  function yuklemeHatasi() {
    if (cacheModu !== "LOAD_CACHE_ELSE_NETWORK") {
      setCacheModu("LOAD_CACHE_ELSE_NETWORK");
      setTimeout(() => { try { webRef.current && webRef.current.reload(); } catch (e) {} }, 60);
    } else {
      setCevrimdisiHata(true);
      setYukleniyor(false);
    }
  }
  function tekrarDene() {
    setCevrimdisiHata(false);
    setYukleniyor(true);
    setCacheModu("LOAD_DEFAULT");
    setTimeout(() => { try { webRef.current && webRef.current.reload(); } catch (e) {} }, 60);
  }

  // Android donanım geri tuşu → sitede geri git
  useEffect(() => {
    const geri = () => {
      if (geriGidebilir && webRef.current) { webRef.current.goBack(); return true; }
      return false;
    };
    const sub = BackHandler.addEventListener("hardwareBackPress", geri);
    return () => sub.remove();
  }, [geriGidebilir]);

  // Push token al
  useEffect(() => { pushTokenAl().then(setToken); }, []);

  // Kullanıcı ayarlardan bildirim iznini açıp geri dönerse → yeniden başlatmadan jeton al
  useEffect(() => {
    const sub = AppState.addEventListener("change", (durum) => {
      if (durum === "active" && !token) pushTokenAl(false).then((t) => { if (t) setToken(t); });
    });
    return () => sub.remove();
  }, [token]);

  // Bildirime tıklanınca hangi ekrana gidileceğini sakla → sayfaya köprüle
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((yanit) => {
      const yol = yanit?.notification?.request?.content?.data?.yol || null;
      if (!yol) return;
      if (sayfaHazir && webRef.current) yolGonder(yol);
      else bekleyenYol.current = yol;
    });
    return () => sub.remove();
  }, [sayfaHazir]);

  function yolGonder(yol) {
    const js = `window.__ISIGINI_PUSH_YOL=${JSON.stringify(yol)};window.dispatchEvent(new Event('isigini-push-yol'));true;`;
    try { webRef.current.injectJavaScript(js); } catch (e) {}
  }

  /* ---------- Ödüllü reklam (AdMob) ---------- */
  function reklamWebBildir(js) { try { webRef.current && webRef.current.injectJavaScript(js); } catch (e) {} }
  function reklamHazirGonder(h) {
    reklamHazirRef.current = h;
    reklamWebBildir(`window.__ISIGINI_REKLAM_HAZIR=${h ? "true" : "false"};window.dispatchEvent(new Event('isigini-reklam-hazir'));true;`);
  }
  function yeniReklamYukle() {
    try {
      const r = RewardedAd.createForAdRequest(REKLAM_BIRIMI);
      reklamRef.current = r;
      r.addAdEventListener(RewardedAdEventType.LOADED, () => reklamHazirGonder(true));
      r.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () =>
        reklamWebBildir("window.dispatchEvent(new Event('isigini-reklam-odul'));true;"));
      r.addAdEventListener(AdEventType.CLOSED, () => {
        reklamHazirGonder(false);
        reklamWebBildir("window.dispatchEvent(new Event('isigini-reklam-kapandi'));true;");
        setTimeout(yeniReklamYukle, 1000);           // sonraki için yeni reklam yükle
      });
      r.addAdEventListener(AdEventType.ERROR, () => { reklamHazirGonder(false); setTimeout(yeniReklamYukle, 30000); });
      r.load();
    } catch (e) { /* sessiz */ }
  }
  // Geçiş (interstitial) reklamı — kart açılışında (günde 1, sıklık web'de)
  function gecisHazirGonder(h) {
    gecisHazirRef.current = h;
    reklamWebBildir(`window.__ISIGINI_GECIS_HAZIR=${h ? "true" : "false"};window.dispatchEvent(new Event('isigini-gecis-hazir'));true;`);
  }
  function yeniGecisYukle() {
    try {
      const g = InterstitialAd.createForAdRequest(GECIS_BIRIMI);
      gecisRef.current = g;
      g.addAdEventListener(AdEventType.LOADED, () => gecisHazirGonder(true));
      g.addAdEventListener(AdEventType.CLOSED, () => { gecisHazirGonder(false); setTimeout(yeniGecisYukle, 1000); });
      g.addAdEventListener(AdEventType.ERROR, () => { gecisHazirGonder(false); setTimeout(yeniGecisYukle, 30000); });
      g.load();
    } catch (e) { /* sessiz */ }
  }
  // AdMob başlat + ilk reklamları yükle
  useEffect(() => {
    let iptal = false;
    try { mobileAds().initialize().then(() => { if (!iptal) { yeniReklamYukle(); yeniGecisYukle(); } }).catch(() => {}); } catch (e) {}
    return () => { iptal = true; };
  }, []);
  // Sayfa hazır olunca mevcut reklam durumlarını bildir
  useEffect(() => { if (sayfaHazir) { reklamHazirGonder(reklamHazirRef.current); gecisHazirGonder(gecisHazirRef.current); } }, [sayfaHazir]);

  // Web'den gelen mesaj (ör. puan penceresi isteği)
  async function mesajGeldi(e) {
    let veri = {};
    try { veri = JSON.parse((e && e.nativeEvent && e.nativeEvent.data) || "{}"); } catch (_e) { return; }
    if (veri && veri.type === "puan-iste") {
      try {
        if (await StoreReview.isAvailableAsync()) await StoreReview.requestReview();
      } catch (_e) { /* sessiz */ }
      return;
    }
    if (veri && veri.type === "reklam-goster") {
      try { if (reklamRef.current && reklamHazirRef.current) reklamRef.current.show(); } catch (_e) { /* sessiz */ }
      return;
    }
    if (veri && veri.type === "gecis-reklam-goster") {
      try { if (gecisRef.current && gecisHazirRef.current) gecisRef.current.show(); } catch (_e) { /* sessiz */ }
      return;
    }
    // Bildirim izni kapalıysa: telefonun bu uygulamaya ait ayar ekranını aç
    if (veri && veri.type === "bildirim-ayari-ac") {
      try { await Linking.openSettings(); } catch (_e) { /* sessiz */ }
      return;
    }
    // Görsel paylaş (ör. Günün ilham cümlesi 1080×1920): dosyaya yaz → sistem paylaşım menüsü
    // (Instagram burada Hikaye / Reels / Gönderi / Mesaj seçenekleriyle çıkar)
    if (veri && veri.type === "gorsel-paylas" && typeof veri.base64 === "string") {
      try {
        const ad = String(veri.ad || "isigini-bul.jpg").replace(/[^a-z0-9._-]/gi, "_");
        const yol = FileSystem.cacheDirectory + ad;
        await FileSystem.writeAsStringAsync(yol, veri.base64, { encoding: FileSystem.EncodingType.Base64 });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(yol, { mimeType: veri.mime || "image/jpeg", dialogTitle: veri.baslik || "Paylaş" });
        }
      } catch (_e) { /* sessiz */ }
      return;
    }
  }

  // Token + sayfa hazır olunca token'ı siteye köprüle (site push_token'a yazar)
  useEffect(() => {
    if (token && sayfaHazir && webRef.current) {
      const js = `window.__ISIGINI_PUSH=${JSON.stringify({ token, platform: Platform.OS })};window.dispatchEvent(new Event('isigini-push-token'));true;`;
      try { webRef.current.injectJavaScript(js); } catch (e) {}
      if (bekleyenYol.current) { yolGonder(bekleyenYol.current); bekleyenYol.current = null; }
    }
  }, [token, sayfaHazir]);

  return (
    <View style={styles.root}>
      <ExpoStatusBar style="light" backgroundColor={BG} />
      <WebView
        ref={webRef}
        source={{ uri: SITE }}
        style={styles.web}
        onLoadEnd={() => { setYukleniyor(false); setSayfaHazir(true); }}
        onNavigationStateChange={(s) => setGeriGidebilir(s.canGoBack)}
        onMessage={mesajGeldi}
        injectedJavaScriptBeforeContentLoaded={"window.__ISIGINI_NATIVE=true;window.__ISIGINI_NATIVE_SURUM=10;true;"}
        javaScriptEnabled
        domStorageEnabled
        thirdPartyCookiesEnabled
        sharedCookiesEnabled
        originWhitelist={["*"]}
        allowsBackForwardNavigationGestures
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        setSupportMultipleWindows={false}
        cacheEnabled
        cacheMode={cacheModu}
        onError={yuklemeHatasi}
        renderError={() => <View style={styles.web} />}
      />
      {cevrimdisiHata && (
        <View style={styles.cevrimdisi}>
          <Text style={styles.cdIkon}>🌙</Text>
          <Text style={styles.cdBaslik}>İnternet bağlantısı yok</Text>
          <Text style={styles.cdMetin}>Uygulamayı bir kez internete bağlıyken açtığında, sonraki seferlerde internetsiz de kullanabilirsin.</Text>
          <Pressable style={styles.cdButon} onPress={tekrarDene}><Text style={styles.cdButonYazi}>Tekrar dene</Text></Pressable>
        </View>
      )}
      {yukleniyor && (
        <View style={styles.yukleyici} pointerEvents="none">
          <ActivityIndicator size="large" color="#f3d98c" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG, paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 },
  web: { flex: 1, backgroundColor: BG },
  yukleyici: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center", backgroundColor: BG },
  cevrimdisi: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center", backgroundColor: BG, padding: 32 },
  cdIkon: { fontSize: 44, marginBottom: 12 },
  cdBaslik: { color: "#f3d98c", fontSize: 20, fontWeight: "600", marginBottom: 10, textAlign: "center" },
  cdMetin: { color: "#c9bfe0", fontSize: 15, lineHeight: 22, textAlign: "center", marginBottom: 24 },
  cdButon: { backgroundColor: "#b38cff", paddingVertical: 12, paddingHorizontal: 28, borderRadius: 999 },
  cdButonYazi: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
