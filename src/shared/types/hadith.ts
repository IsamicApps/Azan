export interface Hadith {
  id: string;
  collection: string; // "Sahih al-Bukhari"
  volume: number;
  bookNumber: number;
  bookName: string;
  hadithNumber: string;
  narrator: string;
  text: string;
  excerpt: string;
  isLong: boolean;
  wordCount: number;
  startPage: number;
  endPage: number;
  sourceUrl: string;
  pdfPage: number;
}

export interface BookMeta {
  bookNumber: number;
  bookName: string;
  hadithCount: number;
}

export interface DailySelection {
  dateString: string; // YYYY-MM-DD
  hadith: Hadith;
  index: number;
  hijriDate: string;
}

export type ScreensaverTheme = 'obsidian' | 'emerald' | 'navy' | 'desert' | 'amethyst';

export interface ScreensaverConfig {
  theme: ScreensaverTheme;
  brightness: number; // 20 to 100
  fontSize: 'small' | 'medium' | 'large' | 'huge';
  showClock: boolean;
  clockFormat: '12h' | '24h';
  showDate: boolean;
  showHijri: boolean;
  patternOpacity: number; // 0 to 100
  driftEnabled: boolean;
  driftIntervalSeconds: number;
}

export interface FavoriteItem {
  hadithId: string;
  hadith: Hadith;
  savedAt: string;
  notes?: string;
}

export interface ReminderConfig {
  enabled: boolean;
  time: string; // "07:00"
  hasPermission: boolean;
}
