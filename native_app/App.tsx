import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, BackHandler, Linking, PermissionsAndroid, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { WebView, WebViewMessageEvent, WebViewNavigation } from 'react-native-webview';
import type { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';
import { refreshWidgets, saveWidgetSettings } from './modules/home-widgets';

/**
 * The Daily Hadith & Azan website (https://isamicapps.github.io/Azan/) in a WebView,
 * so the phone gets an installed app with home-screen widgets. The site sends the
 * widget settings (mosque, language, Hijri correction) through postMessage; see
 * src/shared/utils/nativeBridge.ts in the website.
 */
const SITE = 'https://isamicapps.github.io/Azan/';
const BACKGROUND = '#07090f';

/** "dailyhadith://prayer" (from a widget) -> "prayer", the app tab to open */
function tabFromLink(url: string | null): string | null {
  const match = url?.match(/^dailyhadith:\/\/([a-z]+)/);
  return match ? match[1] : null;
}

// Android: ask for location permission before the page's first geolocation request
// (iOS shows its own prompt, using NSLocationWhenInUseUsageDescription)
const BEFORE_LOAD =
  Platform.OS === 'android'
    ? `(function () {
  var g = navigator.geolocation;
  if (!g || !window.ReactNativeWebView) return;
  var get = g.getCurrentPosition.bind(g);
  var waiting = [];
  window.__nativeLocationReady = function () { var w = waiting; waiting = []; w.forEach(function (f) { f(); }); };
  g.getCurrentPosition = function (ok, fail, options) {
    waiting.push(function () { get(ok, fail, options); });
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'location-permission' }));
  };
})(); true;`
    : 'true;';

export default function App() {
  const webView = useRef<WebView>(null);
  const [source, setSource] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const canGoBack = useRef(false);

  // Opened from a widget: start on that tab
  useEffect(() => {
    Linking.getInitialURL()
      .then((url) => {
        const tab = tabFromLink(url);
        setSource(tab ? `${SITE}#${tab}` : SITE);
      })
      .catch(() => setSource(SITE));
  }, []);

  // A widget tapped while the app is open: switch tab (the site listens for hash changes)
  useEffect(() => {
    const sub = Linking.addEventListener('url', ({ url }) => {
      const tab = tabFromLink(url);
      if (tab) webView.current?.injectJavaScript(`window.location.hash = ${JSON.stringify(tab)}; true;`);
    });
    return () => sub.remove();
  }, []);

  // Back to the app: let the widgets catch up (fresh times, a new day)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => state === 'active' && refreshWidgets());
    return () => sub.remove();
  }, []);

  // Android back button goes back in the page first
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!canGoBack.current) return false;
      webView.current?.goBack();
      return true;
    });
    return () => sub.remove();
  }, []);

  const onMessage = useCallback(async (event: WebViewMessageEvent) => {
    let message: any;
    try {
      message = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }
    if (message?.type === 'widget-settings') {
      saveWidgetSettings(
        {
          mosqueId: String(message.mosqueId ?? ''),
          mosqueName: String(message.mosqueName ?? ''),
          language: message.language === 'ar' ? 'ar' : 'en',
          hijriAdjust: Number(message.hijriAdjust) || 0
        },
        message.customTimes ?? null
      );
    } else if (message?.type === 'location-permission' && Platform.OS === 'android') {
      await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION).catch(() => null);
      webView.current?.injectJavaScript('window.__nativeLocationReady && window.__nativeLocationReady(); true;');
    }
  }, []);

  // The site stays in the app; other links (sunnah.com, Awqat) open in the browser
  const onShouldStart = useCallback((request: ShouldStartLoadRequest) => {
    const { url } = request;
    if (url.startsWith(SITE) || !/^https?:/.test(url) || request.isTopFrame === false) return true;
    Linking.openURL(url).catch(() => {});
    return false;
  }, []);

  if (!source) return <View style={styles.screen} />;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        {failed ? (
          <View style={styles.center}>
            <Text style={styles.title}>Daily Hadith</Text>
            <Text style={styles.text}>No internet connection. The widgets keep working with the last downloaded times.</Text>
            <Text style={styles.text}>لا يوجد اتصال بالإنترنت</Text>
            <Pressable
              style={styles.button}
              onPress={() => {
                setFailed(false);
                webView.current?.reload();
              }}
            >
              <Text style={styles.buttonText}>Try again · إعادة المحاولة</Text>
            </Pressable>
          </View>
        ) : null}
        <WebView
          ref={webView}
          source={{ uri: source }}
          style={[styles.web, failed && styles.hidden]}
          originWhitelist={['*']}
          injectedJavaScriptBeforeContentLoaded={BEFORE_LOAD}
          onMessage={onMessage}
          onShouldStartLoadWithRequest={onShouldStart}
          onOpenWindow={(e) => Linking.openURL(e.nativeEvent.targetUrl).catch(() => {})}
          onNavigationStateChange={(nav: WebViewNavigation) => (canGoBack.current = nav.canGoBack)}
          onError={() => setFailed(true)}
          onLoadEnd={() => refreshWidgets()}
          startInLoadingState
          renderLoading={() => (
            <View style={[StyleSheet.absoluteFill, styles.center]}>
              <ActivityIndicator color="#d4af37" />
            </View>
          )}
          // Azan plays by itself at prayer time
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback
          geolocationEnabled
          domStorageEnabled
          allowsBackForwardNavigationGestures
          pullToRefreshEnabled
          setSupportMultipleWindows
          decelerationRate="normal"
          overScrollMode="never"
          contentInsetAdjustmentBehavior="never"
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BACKGROUND },
  web: { flex: 1, backgroundColor: BACKGROUND },
  hidden: { display: 'none' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: BACKGROUND },
  title: { color: '#d4af37', fontSize: 22, fontWeight: '700', marginBottom: 12 },
  text: { color: '#f5f1e6', fontSize: 15, textAlign: 'center', marginBottom: 8 },
  button: { marginTop: 16, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, backgroundColor: '#d4af37' },
  buttonText: { color: '#07090f', fontWeight: '700' }
});
