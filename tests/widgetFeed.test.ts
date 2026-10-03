import { beforeAll, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { INITIAL_MOSQUES, Mosque, calculateMosquePrayerTimes } from '../src/shared/utils/prayerTimes';
import { getHijriDate } from '../src/shared/utils/hijri';
import { getAwqatHijriOffset } from '../src/shared/utils/awqat';
import { loadDailyHadith } from '../src/shared/utils/hadithLibrary';
import { WIDGET_HIJRI_MARGIN, buildHadithMonth, buildTimesFeed, buildWidgetHadith } from '../src/shared/utils/widgetFeed';

const PUBLIC = path.join(__dirname, '../public');

beforeAll(() => {
  // The Hadith library is fetched from the site; serve it from public/
  globalThis.fetch = (async (input: string | URL) => {
    const file = path.join(PUBLIC, String(input).replace(/^\.?\//, '').replace(/\?.*$/, ''));
    return fs.existsSync(file) ? new Response(fs.readFileSync(file)) : new Response(null, { status: 404 });
  }) as typeof fetch;
});

const byId = (id: string) => INITIAL_MOSQUES.find((m) => m.id === id)!;

describe('widget prayer times', () => {
  it('match the app for every mosque, including the day daylight saving starts', () => {
    const from = new Date(2026, 9, 1);
    for (const mosque of INITIAL_MOSQUES) {
      const feed = buildTimesFeed(mosque, from, 7);
      expect(feed.days).toHaveLength(7);
      expect(feed.from).toBe('2026-10-01');
      feed.days.forEach((row, i) => {
        // Midday at the mosque on day i
        const app = calculateMosquePrayerTimes(mosque, new Date(Date.UTC(2026, 9, 1 + i, 2)));
        const { Fajr, Dhuhr, Asr, Maghrib, Isha } = app.adhanMinutes;
        expect(row.slice(0, 6)).toEqual([Fajr, app.sunriseMinutes, Dhuhr, Asr, Maghrib, Isha]);
        expect(row.slice(6)).toEqual((['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const).map((p) => app.iqamaMinutes[p] ?? -1));
      });
    }
  });

  it('move an hour on the day the clocks change (Melbourne, 4 October 2026)', () => {
    const feed = buildTimesFeed(byId('amssa'), new Date(2026, 9, 3), 2);
    expect(feed.timeZone).toBe('Australia/Melbourne');
    expect(feed.days[1][2] - feed.days[0][2]).toBeGreaterThanOrEqual(59);
  });

  it('carry Hijri dates with a margin for the ±2 day correction', () => {
    const mosque = byId('amssa');
    const feed = buildTimesFeed(mosque, new Date(2026, 9, 3), 10);
    expect(feed.hijri).toHaveLength(10 + 2 * WIDGET_HIJRI_MARGIN);
    const offset = getAwqatHijriOffset(mosque.id) ?? 1;
    expect(feed.hijri[WIDGET_HIJRI_MARGIN][0]).toBe(getHijriDate(new Date(2026, 9, 3), offset).formatted);
    expect(feed.hijri[0][0]).toBe(getHijriDate(new Date(2026, 9, 1), offset).formatted);
    expect(feed.hijri[WIDGET_HIJRI_MARGIN][1]).toMatch(/^[٠-٩]+ .+ [٠-٩]+ هـ$/);
  });

  it('use the device time zone for custom mosques', () => {
    const custom: Mosque = { ...byId('amssa'), id: 'custom-1', state: '', isCustom: true };
    const feed = buildTimesFeed(custom, new Date(2026, 9, 3), 1);
    expect(feed.timeZone).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone);
    expect(feed.days[0].every((n) => Number.isInteger(n))).toBe(true);
  });
});

describe('widget Hadith', () => {
  it('is the Hadith of the Day, in English and Arabic', async () => {
    const date = new Date(2026, 9, 3);
    const [widget, daily] = await Promise.all([buildWidgetHadith(date), loadDailyHadith(date)]);
    expect(widget.en.text).toBe(daily.hadith.excerpt);
    expect(widget.en.collection).toBe(daily.hadith.collection);
    expect(widget.url).toBe(daily.hadith.sourceUrl);
    expect(widget.ar.text).toMatch(/[؀-ۿ]/);
    expect(widget.ar.collection).toMatch(/[؀-ۿ]/);
  });

  it('covers every day of a month', async () => {
    const month = await buildHadithMonth('2027-02');
    expect(Object.keys(month.days)).toHaveLength(28);
    expect(Object.keys(month.days)[0]).toBe('2027-02-01');
  });
});
