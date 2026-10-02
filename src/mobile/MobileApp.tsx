import React, { useState } from 'react';
import { useDailyHadith } from '../shared/hooks/useDailyHadith';
import { MobileAppShell } from '../shared/components/MobileAppShell';
import { ScreensaverView } from '../shared/components/ScreensaverView';
import { AutoAzanHost } from '../shared/components/AutoAzanHost';
import { useDailyReminder } from '../shared/hooks/useDailyReminder';
import { useDocumentLanguage } from '../shared/i18n';
import { getHijriDate } from '../shared/utils/hijri';

export function MobileApp() {
  const [isScreensaverOpen, setIsScreensaverOpen] = useState(false);

  useDailyReminder();
  useDocumentLanguage();

  const today = useDailyHadith(new Date());

  return (
    <div className="w-full h-[100dvh] flex flex-col bg-[#080a0f]">
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
