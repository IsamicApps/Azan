import React, { useEffect, useRef, useState } from 'react';
import { useDailyHadith } from '../shared/hooks/useDailyHadith';
import { MobileAppShell } from '../shared/components/MobileAppShell';
import { ScreensaverView } from '../shared/components/ScreensaverView';
import { AutoAzanHost } from '../shared/components/AutoAzanHost';
import { useDailyReminder } from '../shared/hooks/useDailyReminder';
import { useDocumentLanguage } from '../shared/i18n';
import { getHijriDate } from '../shared/utils/hijri';
import { formatDateKey } from '../shared/utils/dailyEngine';
import { useAppTheme } from '../shared/theme';

export function MobileApp() {
  const [isScreensaverOpen, setIsScreensaverOpen] = useState(false);

  useDailyReminder();
  useDocumentLanguage();
  // Theme colours for the whole page (time-based themes follow the prayer times)
  useAppTheme();

  // Re-render at midnight, so a screensaver left on overnight moves to the new day's Hadith and Hijri date
  const [, setDayKey] = useState(() => formatDateKey(new Date()));
  useEffect(() => {
    const timer = setInterval(() => setDayKey(formatDateKey(new Date())), 30000);
    return () => clearInterval(timer);
  }, []);

  // The previous day's stays up while the new one loads, so the screensaver doesn't close at midnight
  const loaded = useDailyHadith(new Date());
  const lastLoaded = useRef(loaded);
  if (loaded) lastLoaded.current = loaded;
  const today = loaded ?? lastLoaded.current;

  return (
    <div className="w-full h-[100dvh] flex flex-col bg-(--s0)">
      <MobileAppShell onOpenScreensaver={() => setIsScreensaverOpen(true)} />

      {isScreensaverOpen && today && (
        <ScreensaverView
          hadith={today.hadith}
          hijriDate={getHijriDate(new Date()).formatted}
          onClose={() => setIsScreensaverOpen(false)}
        />
      )}

      <AutoAzanHost />
    </div>
  );
}

export default MobileApp;
