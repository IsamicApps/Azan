import { Mosque, calculateMosquePrayerTimes, getMosqueJumuah, getMosqueTimeZone } from './prayerTimes';
import { IqamaPrayer, getAwqatHijriOffset } from './awqat';
import { getHijriDate } from './hijri';
import { formatDateKey } from './dailyEngine';
import { describeGrade, describeHadith, loadArabicText, loadDailyHadith, withArabicText } from './hadithLibrary';
import { formatHijri, toArabicDigits } from '../i18n';
import { GradeCategory, Hadith } from '../types/hadith';

/**
 * Data for the home-screen widgets of the native apps (IslamicApplications/Andriodapps and Appleiosapp).
 * The build writes it to widget/v1/ on the site (scripts/build-widget-feed.ts), the
 * widgets download it, and the app sends the same thing for custom mosques, which
 * the build doesn't know about. Widgets read these files without the app running,
 * so they cover months ahead.
 */

export const WIDGET_FEED_VERSION = 1;
/** Days of prayer times in a feed */
export const WIDGET_TIMES_DAYS = 200;
/** Hijri dates start this many days before the first day (and end as many after the last), so the widget can apply the user's ±2 day correction */
export const WIDGET_HIJRI_MARGIN = 2;

export interface WidgetTimesFeed {
  v: typeof WIDGET_FEED_VERSION;
  generated: string;
  mosque: { id: string; name: string; suburb: string };
  /** IANA time zone the minutes are in */
  timeZone: string;
  /** First day, "YYYY-MM-DD" */
  from: string;
  /** Per day: Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha Adhan, then the Fajr…Isha Iqamah (-1: none), as minutes after local midnight */
  days: number[][];
  /** [English, Arabic] Hijri date per day, from WIDGET_HIJRI_MARGIN days before `from` to as many after the last day */
  hijri: [string, string][];
  jumuah: string;
}

export interface WidgetHadithText {
  collection: string;
  book: string;
  reference: string;
  narrator: string;
  text: string;
  grade: string;
}

export interface WidgetHadith {
  en: WidgetHadithText;
  ar: WidgetHadithText;
  grade: GradeCategory | 'none';
  url: string;
}

export interface WidgetHadithMonth {
  v: typeof WIDGET_FEED_VERSION;
  month: string;
  /** "YYYY-MM-DD" -> Hadith of the Day */
  days: Record<string, WidgetHadith>;
}

const IQAMA_ORDER: IqamaPrayer[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

/** Calendar day `offset` days after y-m-d */
function addDays(y: number, m: number, d: number, offset: number): [number, number, number] {
  const t = new Date(Date.UTC(y, m - 1, d + offset));
  return [t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()];
}

/** An instant on that calendar day at the mosque */
function instantOn(y: number, m: number, d: number, timeZone: string | undefined): Date {
  // 02:00 UTC is midday across Australia (the only zones mosques have); custom mosques use the device's
  return timeZone ? new Date(Date.UTC(y, m - 1, d, 2)) : new Date(y, m - 1, d, 12);
}

const hijriPair = (date: Date, offset: number): [string, string] => {
  const formatted = getHijriDate(date, offset).formatted;
  return [formatted, toArabicDigits(formatHijri('ar', formatted))];
};

/** Prayer times for `days` days from `from` (a date whose calendar day is used). */
export function buildTimesFeed(mosque: Mosque, from: Date = new Date(), days: number = WIDGET_TIMES_DAYS): WidgetTimesFeed {
  const zone = getMosqueTimeZone(mosque);
  const y = from.getFullYear();
  const m = from.getMonth() + 1;
  const d = from.getDate();
  const hijriOffset = getAwqatHijriOffset(mosque.id) ?? 1;

  const rows: number[][] = [];
  for (let i = 0; i < days; i++) {
    const [yy, mm, dd] = addDays(y, m, d, i);
    const r = calculateMosquePrayerTimes(mosque, instantOn(yy, mm, dd, zone));
    rows.push([
      r.adhanMinutes.Fajr,
      r.sunriseMinutes,
      r.adhanMinutes.Dhuhr,
      r.adhanMinutes.Asr,
      r.adhanMinutes.Maghrib,
      r.adhanMinutes.Isha,
      ...IQAMA_ORDER.map((p) => r.iqamaMinutes[p] ?? -1)
    ]);
  }

  const hijri: [string, string][] = [];
  for (let i = -WIDGET_HIJRI_MARGIN; i < days + WIDGET_HIJRI_MARGIN; i++) {
    const [yy, mm, dd] = addDays(y, m, d, i);
    hijri.push(hijriPair(new Date(yy, mm - 1, dd), hijriOffset));
  }

  return {
    v: WIDGET_FEED_VERSION,
    generated: new Date().toISOString(),
    mosque: { id: mosque.id, name: mosque.name, suburb: mosque.suburb },
    timeZone: zone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    from: formatDateKey(new Date(y, m - 1, d)),
    days: rows,
    hijri,
    jumuah: getMosqueJumuah(mosque)
  };
}

function hadithText(h: Hadith, language: 'en' | 'ar'): WidgetHadithText {
  const info = describeHadith(h, language);
  const grade = describeGrade(h, language);
  return {
    collection: info.collection,
    book: info.reference,
    reference: info.detail,
    narrator: h.narrator,
    text: h.excerpt,
    grade: grade.category === 'none' ? '' : grade.label
  };
}

/** The Hadith of the Day as the widgets show it, in English and Arabic. */
export async function buildWidgetHadith(date: Date): Promise<WidgetHadith> {
  const { hadith } = await loadDailyHadith(date);
  const arabic = await loadArabicText(hadith).catch(() => null);
  return {
    en: hadithText(hadith, 'en'),
    ar: hadithText(arabic ? withArabicText(hadith, arabic) : hadith, 'ar'),
    grade: describeGrade(hadith).category,
    url: hadith.sourceUrl
  };
}

/** Every day's Hadith in a month ("YYYY-MM"). */
export async function buildHadithMonth(month: string): Promise<WidgetHadithMonth> {
  const [y, m] = month.split('-').map(Number);
  const days: Record<string, WidgetHadith> = {};
  for (let d = 1; new Date(y, m - 1, d).getMonth() === m - 1; d++) {
    const date = new Date(y, m - 1, d);
    days[formatDateKey(date)] = await buildWidgetHadith(date);
  }
  return { v: WIDGET_FEED_VERSION, month, days };
}
