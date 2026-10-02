import { getAwqatHijriOffset } from './awqat';

// Month names are kept here rather than taken from the browser: TV browsers with
// trimmed calendar data return Gregorian names ("April" for Rabiʻ II).
export const HIJRI_MONTHS = [
  'Muharram',
  'Safar',
  'Rabiʻ I',
  'Rabiʻ II',
  'Jumada I',
  'Jumada II',
  'Rajab',
  'Shaʻban',
  'Ramadan',
  'Shawwal',
  'Dhuʻl-Qiʻdah',
  'Dhuʻl-Hijjah'
];

interface HijriParts {
  day: number;
  month: number; // 1-12
  year: number;
}

/** Arithmetic (tabular, "Kuwaiti") Islamic calendar, as used by awqat.com.au. */
function hijriTabular(date: Date): HijriParts {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  const jd = d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;

  let l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  l = l - 10631 * n + 354;
  const j =
    Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) +
    Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
  l = l - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const month = Math.floor((24 * l) / 709);
  const day = l - Math.floor((709 * month) / 24);
  const year = 30 * n + j - 30;
  return { day, month, year };
}

const SELECTED_MOSQUE_KEY = 'daily_hadith_selected_mosque_id_v2';
const DEFAULT_MOSQUE_ID = 'amssa';
/** Awqat's site-wide default (hijridate.js) for mosques that aren't on Awqat */
const DEFAULT_OFFSET = 1;

/** Days the selected mosque's Awqat page adds to the arithmetic calendar. */
export function getHijriOffset(): number {
  let id = DEFAULT_MOSQUE_ID;
  try {
    id = localStorage.getItem(SELECTED_MOSQUE_KEY) || DEFAULT_MOSQUE_ID;
  } catch {}
  return getAwqatHijriOffset(id) ?? DEFAULT_OFFSET;
}

/**
 * Converts a Gregorian Date into an Islamic Hijri date with English month names,
 * following awqat.com.au: the arithmetic calendar moved by the selected mosque's
 * day offset (+1 on most Awqat pages).
 */
export function getHijriDate(date: Date = new Date(), offsetDays: number = getHijriOffset()): { day: number; month: string; year: number; formatted: string } {
  const shifted = new Date(date.getFullYear(), date.getMonth(), date.getDate() + offsetDays);
  const { day, month, year } = hijriTabular(shifted);
  const monthName = HIJRI_MONTHS[month - 1];
  return { day, month: monthName, year, formatted: `${day} ${monthName} ${year} AH` };
}
