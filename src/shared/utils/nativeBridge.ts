import { MOSQUE_CHANGE_EVENT, getSelectedMosque } from './prayerTimes';
import { HIJRI_ADJUST_EVENT, getHijriAdjustment } from './hijri';
import { HADITH_LANGUAGE_EVENT, getHadithLanguage } from '../hooks/useHadithLanguage';
import { WidgetTimesFeed, buildTimesFeed } from './widgetFeed';
import { AZAN_SETTINGS_EVENT, getAzanSettings } from './azanAudio';
import { AzanNotification, buildAzanSchedule } from './azanSchedule';

/**
 * Link to the native apps (IslamicApplications/Andriodapps and Appleiosapp), which show this site in a WebView
 * and adds home-screen widgets. The widgets download their data from widget/v1/;
 * the page tells them which mosque, language and Hijri correction to use, and sends
 * the prayer times itself for custom mosques (the site has no feed for those).
 *
 * It also sends the next Adhans, which the app schedules as notifications so the Azan
 * sounds with the phone locked, and asks the app to keep the screen on while the
 * screensaver is open (the browser's own wake lock isn't granted on iPhone).
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

export interface AzanScheduleMessage {
  type: 'azan-schedule';
  /** Auto-Azan is on; when off the app cancels its notifications */
  enabled: boolean;
  notifications: AzanNotification[];
}

export interface KeepAwakeMessage {
  type: 'keep-awake';
  on: boolean;
}

/** Days of prayer times sent for a custom mosque (the app sends them again each time it opens) */
const CUSTOM_DAYS = 60;

export function isNativeApp(): boolean {
  return typeof window !== 'undefined' && !!window.ReactNativeWebView;
}

let lastSent = '';
let lastSchedule = '';

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

function sendAzanSchedule(): void {
  const settings = getAzanSettings();
  const message: AzanScheduleMessage = {
    type: 'azan-schedule',
    enabled: settings.autoAzanEnabled,
    notifications: buildAzanSchedule(getSelectedMosque(), settings, getHadithLanguage())
  };
  const json = JSON.stringify(message);
  if (json === lastSchedule) return;
  lastSchedule = json;
  window.ReactNativeWebView?.postMessage(json);
}

/** Keeps the phone's screen on (true) or lets it sleep again (false); only in the native app. */
export function setNativeKeepAwake(on: boolean): void {
  if (!isNativeApp()) return;
  const message: KeepAwakeMessage = { type: 'keep-awake', on };
  window.ReactNativeWebView?.postMessage(JSON.stringify(message));
}

/** Keeps the widgets in step with the app's settings (does nothing outside the native app). */
export function startWidgetSync(): void {
  if (!isNativeApp()) return;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const sendAll = () => {
    send();
    sendAzanSchedule();
  };
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(sendAll, 300);
  };
  window.addEventListener(MOSQUE_CHANGE_EVENT, schedule);
  window.addEventListener(HIJRI_ADJUST_EVENT, schedule);
  window.addEventListener(HADITH_LANGUAGE_EVENT, schedule);
  window.addEventListener(AZAN_SETTINGS_EVENT, schedule);
  // Custom mosque times and the Azan schedule run from today: send them again when the app comes back
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && schedule());
  sendAll();
}
