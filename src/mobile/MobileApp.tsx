import React, { useState } from 'react';
import { getDailyHadith } from '../shared/utils/dailyEngine';
import { MobileAppShell } from '../shared/components/MobileAppShell';
import { ScreensaverView } from '../shared/components/ScreensaverView';
import { AutoAzanHost } from '../shared/components/AutoAzanHost';
import { useDailyReminder } from '../shared/hooks/useDailyReminder';

export function MobileApp() {
  const [isScreensaverOpen, setIsScreensaverOpen] = useState(false);

  useDailyReminder();

  const today = getDailyHadith(new Date());

  return (
    <div className="w-full h-[100dvh] flex flex-col bg-[#080a0f]">
      <MobileAppShell onOpenScreensaver={() => setIsScreensaverOpen(true)} />

      {isScreensaverOpen && (
        <ScreensaverView
          hadith={today.hadith}
          hijriDate={today.hijriDate}
          onClose={() => setIsScreensaverOpen(false)}
        />
      )}

      <AutoAzanHost />
    </div>
  );
}

export default MobileApp;
