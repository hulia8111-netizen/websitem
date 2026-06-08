/* ============================================================
   Işığını Bul — Mobil uygulama (Expo SDK 54)
   isiginibull.net sitesini tam ekran bir WebView içinde çalıştırır.
   Tüm özellikler (giriş, senkron, günlük, kartlar…) web tarafından gelir.
   ============================================================ */
import React, { useRef, useState, useEffect } from "react";
import { View, ActivityIndicator, StyleSheet, BackHandler, Platform, StatusBar } from "react-native";
import { WebView } from "react-native-webview";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";

const SITE = "https://isiginibull.net";
const BG = "#0c0a1c";

export default function App() {
  const webRef = useRef(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [geriGidebilir, setGeriGidebilir] = useState(false);

  // Android donanım geri tuşu → sitede geri git (varsa)
  useEffect(() => {
    const geri = () => {
      if (geriGidebilir && webRef.current) { webRef.current.goBack(); return true; }
      return false;
    };
    const sub = BackHandler.addEventListener("hardwareBackPress", geri);
    return () => sub.remove();
  }, [geriGidebilir]);

  return (
    <View style={styles.root}>
      <ExpoStatusBar style="light" backgroundColor={BG} />
      <WebView
        ref={webRef}
        source={{ uri: SITE }}
        style={styles.web}
        onLoadEnd={() => setYukleniyor(false)}
        onNavigationStateChange={(s) => setGeriGidebilir(s.canGoBack)}
        javaScriptEnabled
        domStorageEnabled
        thirdPartyCookiesEnabled
        sharedCookiesEnabled
        originWhitelist={["*"]}
        allowsBackForwardNavigationGestures
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        setSupportMultipleWindows={false}
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
