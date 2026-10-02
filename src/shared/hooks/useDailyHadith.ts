import { useState, useEffect } from 'react';
import { DailySelection } from '../types/hadith';
import { formatDateKey } from '../utils/dailyEngine';
import { loadDailyHadithOrBundled, loadDailyHadith } from '../utils/hadithLibrary';

/**
 * The Hadith of the Day for a date from the sunnah.com library (null while it loads).
 * Tomorrow's Hadith is fetched in the background so it's ready offline.
 */
export function useDailyHadith(date: Date): DailySelection | null {
  const dateKey = formatDateKey(date);
  const [selection, setSelection] = useState<DailySelection | null>(null);

  useEffect(() => {
    let cancelled = false;
    setSelection((current) => (current?.dateString === dateKey ? current : null));
    const [y, m, d] = dateKey.split('-').map(Number);
    const day = new Date(y, m - 1, d);
    loadDailyHadithOrBundled(day).then((result) => {
      if (!cancelled) setSelection(result);
      loadDailyHadith(new Date(y, m - 1, d + 1)).catch(() => {});
    });
    return () => {
      cancelled = true;
    };
  }, [dateKey]);

  return selection?.dateString === dateKey ? selection : null;
}
