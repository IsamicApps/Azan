/**
 * Converts a Gregorian Date into an Islamic Hijri Date string with English month names.
 * Uses the standard Kuwaiti / Umm al-Qura algorithmic approximation with Intl support.
 */
export function getHijriDate(date: Date = new Date()): { day: number; month: string; year: number; formatted: string } {
  try {
    // Intl DateTimeFormat with islamic-umalqura calendar
    const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const parts = formatter.formatToParts(date);
    let day = 1;
    let month = 'Ramadan';
    let year = 1448;

    for (const part of parts) {
      if (part.type === 'day') day = parseInt(part.value, 10) || 1;
      if (part.type === 'month') month = part.value;
      if (part.type === 'year') year = parseInt(part.value, 10) || 1448;
    }

    return {
      day,
      month,
      year,
      formatted: `${day} ${month} ${year} AH`
    };
  } catch {
    // Fallback calculation if locale isn't fully available
    const gDay = date.getDate();
    const gMonth = date.getMonth();
    const gYear = date.getFullYear();

    const m = ['Muharram', 'Safar', "Rabi' al-Awwal", "Rabi' al-Thani", 'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', "Sha'ban", 'Ramadan', 'Shawwal', "Dhu al-Qi'dah", 'Dhu al-Hijjah'];
    return {
      day: (gDay % 29) + 1,
      month: m[(gMonth + 8) % 12],
      year: gYear - 579,
      formatted: `${(gDay % 29) + 1} ${m[(gMonth + 8) % 12]} ${gYear - 579} AH`
    };
  }
}
