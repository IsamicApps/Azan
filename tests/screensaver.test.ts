import { afterEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ScreensaverView } from '../src/shared/components/ScreensaverView';
import { calculateMosquePrayerTimes, getSelectedMosque } from '../src/shared/utils/prayerTimes';
import { saveScreensaverConfig, DEFAULT_SCREENSAVER_CONFIG } from '../src/shared/utils/storage';
import pool from '../src/shared/data/daily_pool.json';
import { Hadith } from '../src/shared/types/hadith';

const render = () =>
  renderToStaticMarkup(
    React.createElement(ScreensaverView, { hadith: (pool as Hadith[])[0], hijriDate: '21 Rabiʻ II 1448 AH', onClose: () => {} })
  );

const text = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ');

afterEach(() => {
  vi.useRealTimers();
  localStorage.clear();
});

describe('screensaver', () => {
  it('shows the next prayer with its countdown and Iqamah', () => {
    // 8 pm in Melbourne: next is tomorrow's Fajr
    vi.useFakeTimers({ now: new Date('2026-10-03T10:00:00Z') });
    const next = calculateMosquePrayerTimes(getSelectedMosque(), new Date()).nextPrayer;
    const shown = text(render());
    expect(shown).toContain('Next Prayer');
    expect(shown).toContain(`${next.name} ${next.time}`);
    expect(shown).toContain(`in ${next.remainingFormatted}`);
    expect(shown).toContain(`Iqamah ${next.iqamaTime}`);
  });

  it("calls Friday's Dhuhr Jumu'ah", () => {
    vi.useFakeTimers({ now: new Date('2026-10-02T00:00:00Z') }); // 10 am Friday in Melbourne
    expect(text(render())).toContain("Jumu'ah");
  });

  it('is in Arabic in the Arabic interface', () => {
    vi.useFakeTimers({ now: new Date('2026-10-03T10:00:00Z') });
    localStorage.setItem('daily_hadith_language', 'ar');
    const shown = text(render());
    expect(shown).toContain('الصلاة القادمة');
    expect(shown).toContain('الفجر');
    expect(shown).toContain('بعد');
  });

  it('can be turned off', () => {
    saveScreensaverConfig({ ...DEFAULT_SCREENSAVER_CONFIG, showNextPrayer: false });
    expect(text(render())).not.toContain('Next Prayer');
  });
});
