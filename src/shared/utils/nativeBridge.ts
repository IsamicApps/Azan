import { MOSQUE_CHANGE_EVENT, getSelectedMosque } from './prayerTimes';
import { HIJRI_ADJUST_EVENT, getHijriAdjustment } from './hijri';
import { HADITH_LANGUAGE_EVENT, getHadithLanguage } from '../hooks/useHadithLanguage';
import { WidgetTimesFeed, buildTimesFeed } from './widgetFeed';

/**
 * Link to the native apps (IslamicApplications/Andriodapps and Appleiosapp), which show this site in a WebView
 * and adds home-screen widgets. The widgets download their data from widget/v1/;
 * the page tells them which mosque, language and Hijri correction to use, and sends
 * the prayer times itself for custom mosques (the site has no feed for those).
 */

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage(message: string): void };
  }
}

export interface WidgetSettingsMessage {
  type: 'widget-settings';
  mosqueId: string;
  mosqueName: string;
  language: 'en' | 'ar';
  hijriAdjust: number;
  /** Prayer times for a custom mosque */
  customTimes: WidgetTimesFeed | null;
}

/** Days of prayer times sent for a custom mosque (the app sends them again each time it opens) */
const CUSTOM_DAYS = 60;

export function isNativeApp(): boolean {
  return typeof window !== 'undefined' && !!window.ReactNativeWebView;
}

let lastSent = '';

function send(): void {
  const mosque = getSelectedMosque();
  const message: WidgetSettingsMessage = {
    type: 'widget-settings',
    mosqueId: mosque.id,
    mosqueName: mosque.name,
    language: getHadithLanguage(),
    hijriAdjust: getHijriAdjustment(),
    customTimes: mosque.isCustom ? buildTimesFeed(mosque, new Date(), CUSTOM_DAYS) : null
  };
  // Custom times carry a timestamp; compare without it
  const key = JSON.stringify({ ...message, customTimes: message.customTimes && { ...message.customTimes, generated: '' } });
  if (key === lastSent) return;
  lastSent = key;
  window.ReactNativeWebView?.postMessage(JSON.stringify(message));
}

/** Keeps the widgets in step with the app's settings (does nothing outside the native app). */
export function startWidgetSync(): void {
  if (!isNativeApp()) return;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(send, 300);
  };
  window.addEventListener(MOSQUE_CHANGE_EVENT, schedule);
  window.addEventListener(HIJRI_ADJUST_EVENT, schedule);
  window.addEventListener(HADITH_LANGUAGE_EVENT, schedule);
  // Custom mosque times run for CUSTOM_DAYS from today: send them again on a new day
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && schedule());
  send();
}
