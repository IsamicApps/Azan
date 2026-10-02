import { useEffect } from 'react';
import { getReminderConfig } from '../utils/storage';
import { getDailyHadith, formatDateKey } from '../utils/dailyEngine';
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

      const today = getDailyHadith(now).hadith;
      showNotification('Daily Hadith Reminder', {
        body: today.excerpt.length > 180 ? `${today.excerpt.slice(0, 177)}...` : today.excerpt,
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35" fill="%23d9ab3d"/></svg>'
      });
    }, 15000);

    return () => clearInterval(timer);
  }, []);
}
