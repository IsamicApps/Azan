import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';
import { ExtensionStorage } from '@bacons/apple-targets';

/**
 * Hands the home-screen widgets their settings. The website (running in the app's
 * WebView) sends them whenever the mosque, language or Hijri correction changes;
 * see src/shared/utils/nativeBridge.ts in the website.
 *
 * iOS: the App Group's UserDefaults, read by targets/widget (WidgetKit).
 * Android: SharedPreferences, read by the widgets in this module's android/ folder.
 */

/** Must match ios.entitlements in app.json and AppGroup in targets/widget/WidgetData.swift */
export const APP_GROUP = 'group.com.dailyhadith.app';

export interface WidgetSettings {
  mosqueId: string;
  mosqueName: string;
  language: 'en' | 'ar';
  hijriAdjust: number;
}

interface HomeWidgetsAndroid {
  save(settingsJson: string, customTimesJson: string | null): void;
  refresh(): void;
}

const android = Platform.OS === 'android' ? requireOptionalNativeModule<HomeWidgetsAndroid>('HomeWidgets') : null;
const ios = Platform.OS === 'ios' ? new ExtensionStorage(APP_GROUP) : null;

/** Saves the settings (and a custom mosque's prayer times, or null) and redraws the widgets. */
export function saveWidgetSettings(settings: WidgetSettings, customTimes: unknown | null): void {
  const settingsJson = JSON.stringify(settings);
  const customJson = customTimes ? JSON.stringify(customTimes) : null;
  if (ios) {
    ios.set('settings', settingsJson);
    if (customJson) ios.set('customTimes', customJson);
    else ios.remove('customTimes');
    ExtensionStorage.reloadWidget();
  } else if (android) {
    android.save(settingsJson, customJson);
  }
}

/** Redraws the widgets (e.g. when the app comes to the foreground, so they download fresh data). */
export function refreshWidgets(): void {
  if (ios) ExtensionStorage.reloadWidget();
  else android?.refresh();
}
