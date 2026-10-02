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

const isPlausible = (h: HijriParts) =>
  h.year >= 1300 && h.year <= 1700 && h.month >= 1 && h.month <= 12 && h.day >= 1 && h.day <= 30;

/** Umm al-Qura date from the browser, or null if it doesn't really support the Islamic calendar. */
function hijriFromIntl(date: Date): HijriParts | null {
  try {
    const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    });
    // Browsers without the calendar quietly fall back to Gregorian
    if (!formatter.resolvedOptions().calendar.startsWith('islamic')) return null;
    const parts = formatter.formatToParts(date);
    const get = (type: string) => parseInt(parts.find((p) => p.type === type)?.value.replace(/\D/g, '') ?? '', 10);
    const result = { day: get('day'), month: get('month'), year: get('year') || get('relatedYear') };
    return isPlausible(result) ? result : null;
  } catch {
    return null;
  }
}

// Official Umm al-Qura month lengths from 1 Muharram 1440 (11 Sep 2018) to the end
// of 1480 AH, one digit per month: 1 = 30 days, 0 = 29 days.
const UMM_AL_QURA_START = Date.UTC(2018, 8, 11);
const UMM_AL_QURA_START_YEAR = 1440;
const UMM_AL_QURA_MONTHS =
  '010111010100101011011010010101011010101010101011010110010101' +
  '011101001001011101100100101110101010010110110101001010110110' +
  '101001010110111001001101101100100101101101010010101101101010' +
  '010110101101001010101110100100101111010010010111011001001011' +
  '011010100101011010101100101011010110010101011101010010011101' +
  '101001001101110100010110110110010101010110101010010110110101' +
  '001011011010100101011011010010101101010110010101011011001010' +
  '011011100100101011101010010011110101001010110110100101010110' +
  '101010101010';

function hijriFromTable(date: Date): HijriParts | null {
  let days = Math.round((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - UMM_AL_QURA_START) / 86400000);
  if (days < 0) return null;
  for (let i = 0; i < UMM_AL_QURA_MONTHS.length; i++) {
    const length = UMM_AL_QURA_MONTHS[i] === '1' ? 30 : 29;
    if (days < length) {
      return { day: days + 1, month: (i % 12) + 1, year: UMM_AL_QURA_START_YEAR + Math.floor(i / 12) };
    }
    days -= length;
  }
  return null;
}

/** Arithmetic (tabular) Islamic calendar for dates outside the table; within a day or two of Umm al-Qura. */
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

/**
 * Converts a Gregorian Date into an Islamic Hijri date with English month names.
 * Uses the browser's Umm al-Qura calendar when available, otherwise the built-in
 * Umm al-Qura table (1440–1480 AH), and the tabular calendar beyond it.
 */
export function getHijriDate(date: Date = new Date()): { day: number; month: string; year: number; formatted: string } {
  const { day, month, year } = hijriFromIntl(date) ?? hijriFromTable(date) ?? hijriTabular(date);
  const monthName = HIJRI_MONTHS[month - 1];
  return { day, month: monthName, year, formatted: `${day} ${monthName} ${year} AH` };
}
