import { describe, expect, it } from 'vitest';
import { INITIAL_MOSQUES, calculateMosquePrayerTimes } from '../src/shared/utils/prayerTimes';
import { DEFAULT_AZAN_SETTINGS } from '../src/shared/utils/azanAudio';
import { AZAN_NOTIFICATION_LIMIT, buildAzanSchedule, zonedInstant } from '../src/shared/utils/azanSchedule';

const amssa = INITIAL_MOSQUES.find((m) => m.id === 'amssa')!;
// 8 pm on Saturday 3 October 2026 in Melbourne; daylight saving starts that night
const evening = new Date('2026-10-03T10:00:00Z');

describe('Azan notifications', () => {
  it('cover the next 60 Adhans, in order and all still to come', () => {
    const list = buildAzanSchedule(amssa, DEFAULT_AZAN_SETTINGS, 'en', evening);
    expect(list).toHaveLength(AZAN_NOTIFICATION_LIMIT);
    expect(list.every((n, i) => n.at > evening.getTime() && (i === 0 || n.at > list[i - 1].at))).toBe(true);
    expect(list.slice(0, 5).map((n) => n.prayer)).toEqual(['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']);
  });

  it('start with the next Adhan the app shows, at the right moment across the clock change', () => {
    const [first] = buildAzanSchedule(amssa, DEFAULT_AZAN_SETTINGS, 'en', evening);
    const next = calculateMosquePrayerTimes(amssa, evening).nextPrayer;
    expect(first.prayer).toBe(next.name);
    // Fajr 05:20 daylight time on 4 October is 18:20 UTC on the 3rd
    expect(new Date(first.at).toISOString()).toBe('2026-10-03T18:20:00.000Z');
    expect(first.at - evening.getTime()).toBe(next.remainingSeconds * 1000);
    expect(first.title).toBe(`Fajr · ${next.time}`);
    expect(first.body).toBe(`Time for Fajr at ${amssa.name}`);
  });

  it("use each prayer's voice and call Friday's Dhuhr Jumu'ah", () => {
    const settings = { ...DEFAULT_AZAN_SETTINGS, prayerMuezzins: { Fajr: 'alafasy' as const } };
    const list = buildAzanSchedule(amssa, settings, 'en', evening);
    expect(list.filter((n) => n.prayer === 'Fajr').every((n) => n.muezzin === 'alafasy')).toBe(true);
    expect(list.filter((n) => n.prayer === 'Asr').every((n) => n.muezzin === 'makkah')).toBe(true);
    // Friday 9 October
    const friday = list.find((n) => n.prayer === 'Dhuhr' && new Date(n.at).toISOString().startsWith('2026-10-09'))!;
    expect(friday.title).toMatch(/^Jumu'ah · /);
  });

  it('are in Arabic in the Arabic interface', () => {
    const [first] = buildAzanSchedule(amssa, DEFAULT_AZAN_SETTINGS, 'ar', evening);
    expect(first.title).toBe('الفجر · ٥:٢٠ ص');
    expect(first.body).toMatch(/^حان وقت صلاة الفجر في /);
  });

  it("include today's Adhans at a mosque whose date is behind the phone's", () => {
    // 00:01 on 5 January in Melbourne (UTC+11) is 21:01 on the 4th in Perth (UTC+8), before Perth's Isha
    const perth = INITIAL_MOSQUES.find((m) => m.state === 'WA')!;
    const now = new Date('2027-01-04T13:01:00Z');
    const isha = calculateMosquePrayerTimes(perth, now).nextPrayer;
    expect(isha.name).toBe('Isha');
    const [first] = buildAzanSchedule(perth, DEFAULT_AZAN_SETTINGS, 'en', now);
    expect(first.prayer).toBe('Isha');
    expect(first.at - now.getTime()).toBe(isha.remainingSeconds * 1000);
  });

  it('are empty when the automatic Azan is off', () => {
    expect(buildAzanSchedule(amssa, { ...DEFAULT_AZAN_SETTINGS, autoAzanEnabled: false }, 'en', evening)).toEqual([]);
  });

  it('turn wall-clock times into the right instant on both sides of a clock change', () => {
    expect(new Date(zonedInstant(2026, 10, 3, 12 * 60, 'Australia/Melbourne')).toISOString()).toBe('2026-10-03T02:00:00.000Z');
    expect(new Date(zonedInstant(2026, 10, 4, 12 * 60, 'Australia/Melbourne')).toISOString()).toBe('2026-10-04T01:00:00.000Z');
    expect(new Date(zonedInstant(2026, 4, 5, 6 * 60, 'Australia/Melbourne')).toISOString()).toBe('2026-04-04T20:00:00.000Z');
  });
});
