import { useEffect } from 'react';
import { getReminderConfig } from '../utils/storage';
import { formatDateKey } from '../utils/dailyEngine';
import { loadDailyHadithOrBundled, loadArabicText, withArabicText } from '../utils/hadithLibrary';
import { currentI18n } from '../i18n';
import { showNotification } from '../utils/notify';

const REMINDER_SENT_KEY = 'daily_hadith_reminder_last_sent_v1';

/**
 * Sends the Daily Hadith notification once a day at the time chosen in reminder settings.
 */
export function useDailyReminder(): void {
  useEffect(() => {
    const timer = setInterval(() => {
      const config = getReminderConfig();
      if (!config.enabled || !('Notification' in window) || Notification.permission !== 'granted') return;

      const now = new Date();
      const nowHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      if (nowHHMM !== config.time) return;

      const todayKey = formatDateKey(now);
      try {
        if (localStorage.getItem(REMINDER_SENT_KEY) === todayKey) return;
        localStorage.setItem(REMINDER_SENT_KEY, todayKey);
      } catch {}

      const i18n = currentI18n();
      loadDailyHadithOrBundled(now)
        .then(async ({ hadith }) => {
          // The Arabic original when the app is in Arabic (English if it can't be loaded)
          if (!i18n.isArabic) return hadith;
          const arabic = await loadArabicText(hadith).catch(() => null);
          return arabic ? withArabicText(hadith, arabic) : hadith;
        })
        .then((today) => showNotification(i18n.t('Daily Hadith Reminder'), {
          body: today.excerpt.length > 180 ? `${today.excerpt.slice(0, 177)}...` : today.excerpt,
          icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35" fill="%23d9ab3d"/></svg>'
        }));
    }, 15000);

    return () => clearInterval(timer);
  }, []);
}
