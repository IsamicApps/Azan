import { Mosque } from './prayerTimes';
import { zoneOffsetMinutes } from './awqat';
import { AzanPrayer, AzanSettings, MuezzinId, getMuezzinForPrayer } from './azanAudio';
import { buildTimesFeed } from './widgetFeed';
import { Language, formatTime, prayerName, translate } from '../i18n';

/**
 * The Azan notifications the native apps schedule, so the Azan still sounds when the
 * phone is locked or the app is closed (the page itself can only play it while open).
 * iOS keeps at most 64 pending notifications, so the schedule covers the next 60 prayers.
 */

export interface AzanNotification {
  /** When the Adhan is due, epoch ms */
  at: number;
  prayer: AzanPrayer;
  muezzin: MuezzinId;
  title: string;
  body: string;
}

export const AZAN_NOTIFICATION_LIMIT = 60;

/** Columns of the five Adhans in a widget feed row (Sunrise is column 1) */
const ADHAN_COLUMNS: [AzanPrayer, number][] = [
  ['Fajr', 0],
  ['Dhuhr', 2],
  ['Asr', 3],
  ['Maghrib', 4],
  ['Isha', 5]
];

/** Wall-clock minutes on a calendar day in `timeZone` as an instant (epoch ms) */
export function zonedInstant(y: number, m: number, d: number, minutes: number, timeZone: string): number {
  const wall = Date.UTC(y, m - 1, d, Math.floor(minutes / 60), minutes % 60);
  // The offset at the wall time read as UTC is a first guess; check it at the result (daylight-saving days)
  const first = wall - zoneOffsetMinutes(wall, timeZone) * 60000;
  return wall - zoneOffsetMinutes(first, timeZone) * 60000;
}

/** "12:14" (minutes after midnight) -> "12:14 PM", the app's time format */
function clock(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h % 12 || 12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

/** The next Adhans at the mosque from `now`, with each prayer's voice and the notification text. */
export function buildAzanSchedule(
  mosque: Mosque,
  settings: AzanSettings,
  language: Language,
  now: Date = new Date(),
  limit: number = AZAN_NOTIFICATION_LIMIT
): AzanNotification[] {
  if (!settings.autoAzanEnabled) return [];
  // From yesterday: the device's date can be a day ahead of the mosque's (a phone in Melbourne,
  // a mosque in Perth, just after midnight). Past Adhans are skipped below.
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const feed = buildTimesFeed(mosque, yesterday, Math.ceil(limit / 5) + 3);
  const [fy, fm, fd] = feed.from.split('-').map(Number);
  const result: AzanNotification[] = [];

  feed.days.forEach((row, i) => {
    const day = new Date(Date.UTC(fy, fm - 1, fd + i));
    const [y, m, d] = [day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate()];
    const friday = day.getUTCDay() === 5;
    for (const [prayer, column] of ADHAN_COLUMNS) {
      const at = zonedInstant(y, m, d, row[column], feed.timeZone);
      if (at <= now.getTime()) continue;
      const name = prayerName(language, prayer === 'Dhuhr' && friday ? "Jumu'ah" : prayer);
      result.push({
        at,
        prayer,
        muezzin: getMuezzinForPrayer(settings, prayer),
        title: translate(language, '{prayer} · {time}', { prayer: name, time: formatTime(language, clock(row[column])) }),
        body: translate(language, 'Time for {prayer} at {mosque}', { prayer: name, mosque: mosque.name })
      });
    }
  });
  return result.sort((a, b) => a.at - b.at).slice(0, limit);
}
