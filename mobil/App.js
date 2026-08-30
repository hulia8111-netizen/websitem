/* ============================================================
   Işığını Bul — Mobil uygulama (Expo SDK 54)
   isiginibull.net sitesini tam ekran bir WebView içinde çalıştırır.
   + NATIVE PUSH: expo-notifications ile Expo push token alınır, WebView'e
     köprülenir (site push_token'a yazar). Bildirime tıklanınca ilgili
     ekrana yönlendirir. Uygulama kapalıyken de push çalışır (FCM).
   ============================================================ */
import React, { useRef, useState, useEffect } from "react";
import { View, ActivityIndicator, StyleSheet, BackHandler, Platform, StatusBar } from "react-native";
import { WebView } from "react-native-webview";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import * as StoreReview from "expo-store-review";

const SITE = "https://isiginibull.net";
const BG = "#0c0a1c";

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
async function pushTokenAl() {
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
    if (izin !== "granted") {
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

  // Web'den gelen mesaj (ör. puan penceresi isteği)
  async function mesajGeldi(e) {
    let veri = {};
    try { veri = JSON.parse((e && e.nativeEvent && e.nativeEvent.data) || "{}"); } catch (_e) { return; }
    if (veri && veri.type === "puan-iste") {
      try {
        if (await StoreReview.isAvailableAsync()) await StoreReview.requestReview();
      } catch (_e) { /* sessiz */ }
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
        injectedJavaScriptBeforeContentLoaded={"window.__ISIGINI_NATIVE=true;true;"}
        javaScriptEnabled
        domStorageEnabled
        thirdPartyCookiesEnabled
        sharedCookiesEnabled
        originWhitelist={["*"]}
        allowsBackForwardNavigationGestures
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        setSupportMultipleWindows={false}
        cacheEnabled={false}
        cacheMode="LOAD_NO_CACHE"
      />
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
});
