import { FavoriteItem, ScreensaverConfig, ReminderConfig } from '../types/hadith';

const FAVORITES_KEY = 'daily_hadith_favorites_v1';
const SCREENSAVER_KEY = 'daily_hadith_screensaver_v1';
const REMINDER_KEY = 'daily_hadith_reminder_v1';
const THEME_MODE_KEY = 'daily_hadith_app_theme_v1';

export const DEFAULT_SCREENSAVER_CONFIG: ScreensaverConfig = {
  theme: 'obsidian',
  brightness: 90,
  fontSize: 'medium',
  showClock: true,
  clockFormat: '12h',
  showDate: true,
  showHijri: true,
  patternOpacity: 25,
  driftEnabled: true,
  driftIntervalSeconds: 45
};

export const DEFAULT_REMINDER_CONFIG: ReminderConfig = {
  enabled: false,
  time: '07:30',
  hasPermission: false
};

export function getFavorites(): FavoriteItem[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveFavorite(item: FavoriteItem): void {
  const list = getFavorites();
  const exists = list.some(f => f.hadithId === item.hadithId);
  if (!exists) {
    list.unshift(item);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
  }
}

export function removeFavorite(hadithId: string): void {
  const list = getFavorites().filter(f => f.hadithId !== hadithId);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
}

export function isFavorite(hadithId: string): boolean {
  return getFavorites().some(f => f.hadithId === hadithId);
}

export function getScreensaverConfig(): ScreensaverConfig {
  try {
    const raw = localStorage.getItem(SCREENSAVER_KEY);
    return raw ? { ...DEFAULT_SCREENSAVER_CONFIG, ...JSON.parse(raw) } : DEFAULT_SCREENSAVER_CONFIG;
  } catch {
    return DEFAULT_SCREENSAVER_CONFIG;
  }
}

export function saveScreensaverConfig(config: ScreensaverConfig): void {
  localStorage.setItem(SCREENSAVER_KEY, JSON.stringify(config));
}

export function getReminderConfig(): ReminderConfig {
  try {
    const raw = localStorage.getItem(REMINDER_KEY);
    return raw ? { ...DEFAULT_REMINDER_CONFIG, ...JSON.parse(raw) } : DEFAULT_REMINDER_CONFIG;
  } catch {
    return DEFAULT_REMINDER_CONFIG;
  }
}

export function saveReminderConfig(config: ReminderConfig): void {
  localStorage.setItem(REMINDER_KEY, JSON.stringify(config));
}

export function getAppTheme(): 'dark' | 'light' {
  try {
    return (localStorage.getItem(THEME_MODE_KEY) as 'dark' | 'light') || 'dark';
  } catch {
    return 'dark';
  }
}

export function saveAppTheme(theme: 'dark' | 'light'): void {
  localStorage.setItem(THEME_MODE_KEY, theme);
}
