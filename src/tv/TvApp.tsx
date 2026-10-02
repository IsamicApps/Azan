import React, { useState, useEffect, useRef } from 'react';
import { SmartTvDisplayView } from '../shared/components/SmartTvDisplayView';
import { AutoAzanHost } from '../shared/components/AutoAzanHost';
import { AppLogo } from '../shared/components/AppLogo';
import { unlockAudio } from '../shared/utils/azanAudio';
import { useSpatialNavigation } from './useSpatialNavigation';

export function TvApp() {
  const [hasStarted, setHasStarted] = useState(false);
  const startButtonRef = useRef<HTMLButtonElement>(null);

  useSpatialNavigation();

  useEffect(() => {
    if (!hasStarted) startButtonRef.current?.focus();
  }, [hasStarted]);

  // The remote's OK press is the user gesture browsers require before
  // the Azan may play automatically and before fullscreen is allowed.
  const handleStart = () => {
    unlockAudio();
    document.documentElement.requestFullscreen?.().catch(() => {});
    setHasStarted(true);
  };

  if (!hasStarted) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-[#06080e] text-white space-y-8">
        <AppLogo size={120} glow={true} />
        <div className="text-center space-y-2">
          <h1 className="font-serif text-5xl font-bold">Daily Hadith & Azan</h1>
          <p className="text-xl text-neutral-400">Prayer times, live Azan and Sahih al-Bukhari for your TV</p>
        </div>
        <button
          ref={startButtonRef}
          onClick={handleStart}
          className="px-12 py-5 rounded-3xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-2xl font-bold shadow-2xl shadow-amber-500/30 cursor-pointer"
        >
          Press OK to Start
        </button>
        <p className="text-base text-neutral-500">Starting enables the automatic Azan sound on this TV</p>
      </div>
    );
  }

  return (
    <>
      <SmartTvDisplayView />
      <AutoAzanHost />
    </>
  );
}

export default TvApp;
