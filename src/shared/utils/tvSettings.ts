/** How long each Hadith stays on the TV screen before the next one slides in. 0 = paused. */
export const SLIDE_SPEEDS = [10, 15, 25, 45, 60, 120, 300, 0] as const;
export type SlideSeconds = (typeof SLIDE_SPEEDS)[number];

const STORAGE_KEY = 'daily_hadith_tv_slide_seconds';
const DEFAULT_SECONDS: SlideSeconds = 25;

export function getSlideSeconds(): SlideSeconds {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const seconds = SLIDE_SPEEDS.find((s) => String(s) === saved);
    if (seconds !== undefined) return seconds;
  } catch {
    // Storage blocked: use the default
  }
  return DEFAULT_SECONDS;
}

export function saveSlideSeconds(seconds: SlideSeconds): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(seconds));
  } catch {
    // Storage blocked: the choice still applies until the page is reloaded
  }
}

export function nextSlideSeconds(current: SlideSeconds): SlideSeconds {
  return SLIDE_SPEEDS[(SLIDE_SPEEDS.indexOf(current) + 1) % SLIDE_SPEEDS.length];
}

export function describeSlideSeconds(seconds: SlideSeconds): string {
  if (seconds === 0) return 'Paused';
  return seconds < 60 ? `${seconds} sec` : `${seconds / 60} min`;
}

/** TV screen brightness in percent. Pages can't change the TV's backlight, so lower levels dim the picture. */
/** 'auto' = full by day, dimmed at night (after Isha until before Fajr) */
export const BRIGHTNESS_LEVELS = [100, 85, 70, 55, 40, 25, 'auto'] as const;
export type BrightnessLevel = (typeof BRIGHTNESS_LEVELS)[number];

const BRIGHTNESS_KEY = 'daily_hadith_tv_brightness';

export function getTvBrightness(): BrightnessLevel {
  try {
    const saved = localStorage.getItem(BRIGHTNESS_KEY);
    const level = BRIGHTNESS_LEVELS.find((b) => String(b) === saved);
    if (level !== undefined) return level;
  } catch {
    // Storage blocked: use full brightness
  }
  return 100;
}

export function saveTvBrightness(level: BrightnessLevel): void {
  try {
    localStorage.setItem(BRIGHTNESS_KEY, String(level));
  } catch {
    // Storage blocked: the choice still applies until the page is reloaded
  }
}

export function nextTvBrightness(current: BrightnessLevel): BrightnessLevel {
  return BRIGHTNESS_LEVELS[(BRIGHTNESS_LEVELS.indexOf(current) + 1) % BRIGHTNESS_LEVELS.length];
}

/** Tailwind v4 palettes the TV themes swap in for amber (from tailwindcss/theme.css). */
export const ACCENT_PALETTES = {
  emerald: {
    50: 'oklch(97.9% 0.021 166.113)',
    100: 'oklch(95% 0.052 163.051)',
    200: 'oklch(90.5% 0.093 164.15)',
    300: 'oklch(84.5% 0.143 164.978)',
    400: 'oklch(76.5% 0.177 163.223)',
    500: 'oklch(69.6% 0.17 162.48)',
    600: 'oklch(59.6% 0.145 163.225)',
    700: 'oklch(50.8% 0.118 165.612)',
    800: 'oklch(43.2% 0.095 166.913)',
    900: 'oklch(37.8% 0.077 168.94)',
    950: 'oklch(26.2% 0.051 172.552)'
  },
  sky: {
    50: 'oklch(97.7% 0.013 236.62)',
    100: 'oklch(95.1% 0.026 236.824)',
    200: 'oklch(90.1% 0.058 230.902)',
    300: 'oklch(82.8% 0.111 230.318)',
    400: 'oklch(74.6% 0.16 232.661)',
    500: 'oklch(68.5% 0.169 237.323)',
    600: 'oklch(58.8% 0.158 241.966)',
    700: 'oklch(50% 0.134 242.749)',
    800: 'oklch(44.3% 0.11 240.79)',
    900: 'oklch(39.1% 0.09 240.876)',
    950: 'oklch(29.3% 0.066 243.157)'
  },
  yellow: {
    50: 'oklch(98.7% 0.026 102.212)',
    100: 'oklch(97.3% 0.071 103.193)',
    200: 'oklch(94.5% 0.129 101.54)',
    300: 'oklch(90.5% 0.182 98.111)',
    400: 'oklch(85.2% 0.199 91.936)',
    500: 'oklch(79.5% 0.184 86.047)',
    600: 'oklch(68.1% 0.162 75.834)',
    700: 'oklch(55.4% 0.135 66.442)',
    800: 'oklch(47.6% 0.114 61.907)',
    900: 'oklch(42.1% 0.095 57.708)',
    950: 'oklch(28.6% 0.066 53.813)'
  }
} as const;

export type TvTheme = 'obsidian' | 'emerald' | 'sapphire' | 'royal-gold';
export const TV_THEMES: TvTheme[] = ['obsidian', 'emerald', 'sapphire', 'royal-gold'];

const THEME_KEY = 'daily_hadith_tv_theme';

export function getTvTheme(): TvTheme {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (TV_THEMES.includes(saved as TvTheme)) return saved as TvTheme;
  } catch {
    // Storage blocked: use the default theme
  }
  return 'obsidian';
}

export function saveTvTheme(theme: TvTheme): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Storage blocked: the choice still applies until the page is reloaded
  }
}

export function nextTvTheme(current: TvTheme): TvTheme {
  return TV_THEMES[(TV_THEMES.indexOf(current) + 1) % TV_THEMES.length];
}

/**
 * CSS variables for a theme: its accent palette replaces every amber-* colour, and
 * --tv-* set the tinted panel colours, so the whole screen follows the background.
 */
export function tvThemeVariables(accent: keyof typeof ACCENT_PALETTES | null, surfaces: Record<string, string>): Record<string, string> {
  const vars: Record<string, string> = {};
  if (accent) {
    for (const [shade, color] of Object.entries(ACCENT_PALETTES[accent])) vars[`--color-amber-${shade}`] = color;
  }
  for (const [name, color] of Object.entries(surfaces)) vars[`--tv-${name}`] = color;
  return vars;
}

const ANNOUNCEMENTS_KEY = 'daily_hadith_tv_announcements';

/** Mosque notices shown on the TV between Hadiths (stored on this TV). */
export function getAnnouncements(): string[] {
  try {
    const list = JSON.parse(localStorage.getItem(ANNOUNCEMENTS_KEY) || '[]');
    return Array.isArray(list) ? list.filter((x) => typeof x === 'string' && x.trim()).slice(0, 10) : [];
  } catch {
    return [];
  }
}

export function saveAnnouncements(list: string[]): void {
  try {
    localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(list.slice(0, 10)));
  } catch {}
}

const TOPIC_KEY = 'daily_hadith_tv_topic';

/** Topic the TV's Hadith slides come from; null = the whole library. */
export function getTvTopic(): string | null {
  try {
    return localStorage.getItem(TOPIC_KEY) || null;
  } catch {
    return null;
  }
}

export function saveTvTopic(topic: string | null): void {
  try {
    if (topic) localStorage.setItem(TOPIC_KEY, topic);
    else localStorage.removeItem(TOPIC_KEY);
  } catch {}
}
