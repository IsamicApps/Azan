import React, { useState, useEffect, useRef } from 'react';
import { Hadith, ScreensaverConfig, ScreensaverTheme } from '../types/hadith';
import { getScreensaverConfig, saveScreensaverConfig } from '../utils/storage';
import { IslamicPattern, IslamicCornerOrnament } from './IslamicPattern';
import { X, Settings2, Sun, Type, Palette, Shield, Info, Volume2, VolumeX } from 'lucide-react';
import { speakHadith, stopSpeaking, isSpeaking } from '../utils/speech';

interface ScreensaverViewProps {
  hadith: Hadith;
  hijriDate?: string;
  onClose: () => void;
}

const THEME_STYLES: Record<ScreensaverTheme, { bg: string; accent: string; subAccent: string; patternColor: string }> = {
  obsidian: {
    bg: 'from-[#08090d] via-[#040507] to-[#020203]',
    accent: 'text-amber-400',
    subAccent: 'text-amber-200/70',
    patternColor: '#d4af37'
  },
  emerald: {
    bg: 'from-[#041d15] via-[#02120d] to-[#010805]',
    accent: 'text-emerald-300',
    subAccent: 'text-emerald-200/70',
    patternColor: '#34d399'
  },
  navy: {
    bg: 'from-[#081426] via-[#040b15] to-[#010408]',
    accent: 'text-sky-300',
    subAccent: 'text-sky-200/70',
    patternColor: '#38bdf8'
  },
  desert: {
    bg: 'from-[#1a130b] via-[#100b06] to-[#060402]',
    accent: 'text-amber-300',
    subAccent: 'text-amber-200/70',
    patternColor: '#f59e0b'
  },
  amethyst: {
    bg: 'from-[#140b1e] via-[#0d0714] to-[#050208]',
    accent: 'text-purple-300',
    subAccent: 'text-purple-200/70',
    patternColor: '#c084fc'
  }
};

export const ScreensaverView: React.FC<ScreensaverViewProps> = ({
  hadith,
  hijriDate,
  onClose
}) => {
  const [config, setConfig] = useState<ScreensaverConfig>(getScreensaverConfig());
  const [showControls, setShowControls] = useState(true);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showNativeGuide, setShowNativeGuide] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [driftOffset, setDriftOffset] = useState({ x: 0, y: 0 });
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const hideTimerRef = useRef<number | null>(null);
  const wakeLockRef = useRef<any>(null);

  // Request WakeLock to keep screen on
  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        }
      } catch (e) {
        console.log('WakeLock not active:', e);
      }
    };
    requestWakeLock();

    // The browser drops the wake lock whenever the page is hidden; take it again on return
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') requestWakeLock();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
      stopSpeaking();
    };
  }, []);

  // Update Clock every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: config.clockFormat === '12h'
      });
      const dateStr = now.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
      setCurrentTime(timeStr);
      setCurrentDate(dateStr);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [config.clockFormat]);

  // Burn-in / OLED drift protection
  useEffect(() => {
    if (!config.driftEnabled) {
      setDriftOffset({ x: 0, y: 0 });
      return;
    }

    const driftInterval = setInterval(() => {
      // Gentle micro-shift between -18px and +18px
      const randomX = Math.floor(Math.random() * 36) - 18;
      const randomY = Math.floor(Math.random() * 36) - 18;
      setDriftOffset({ x: randomX, y: randomY });
    }, config.driftIntervalSeconds * 1000);

    return () => clearInterval(driftInterval);
  }, [config.driftEnabled, config.driftIntervalSeconds]);

  // Auto-hide HUD controls after 3.5s of no interaction
  const resetHideTimer = () => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (!showSettingsModal && !showNativeGuide) {
        setShowControls(false);
      }
    }, 3500);
  };

  useEffect(() => {
    resetHideTimer();
    const handleActivity = () => resetHideTimer();
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('keydown', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [showSettingsModal, showNativeGuide]);

  const updateConfig = (newConfig: Partial<ScreensaverConfig>) => {
    const updated = { ...config, ...newConfig };
    setConfig(updated);
    saveScreensaverConfig(updated);
  };

  const currentTheme = THEME_STYLES[config.theme] || THEME_STYLES.obsidian;

  const fontClasses = {
    small: 'text-xl md:text-2xl leading-relaxed',
    medium: 'text-2xl md:text-3xl lg:text-4xl leading-relaxed md:leading-loose',
    large: 'text-3xl md:text-4xl lg:text-5xl leading-relaxed md:leading-loose',
    huge: 'text-4xl md:text-5xl lg:text-6xl leading-tight'
  }[config.fontSize];

  const handleAudioToggle = () => {
    if (isPlayingAudio || isSpeaking()) {
      stopSpeaking();
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      speakHadith(
        hadith.narrator,
        hadith.text,
        () => setIsPlayingAudio(true),
        () => setIsPlayingAudio(false)
      );
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden select-none bg-gradient-to-b ${currentTheme.bg} flex flex-col justify-between p-6 md:p-12 lg:p-16 transition-colors duration-1000`}
      style={{ filter: `brightness(${config.brightness}%)` }}
      onClick={resetHideTimer}
    >
      {/* Background Dynamic Islamic Pattern */}
      <IslamicPattern
        opacity={config.patternOpacity}
        color={currentTheme.patternColor}
        className="transition-opacity duration-1000"
      />

      {/* Decorative Ornaments */}
      <IslamicCornerOrnament
        color={currentTheme.patternColor}
        className="absolute top-6 left-6 rotate-0 opacity-25"
      />
      <IslamicCornerOrnament
        color={currentTheme.patternColor}
        className="absolute top-6 right-6 rotate-90 opacity-25"
      />
      <IslamicCornerOrnament
        color={currentTheme.patternColor}
        className="absolute bottom-6 left-6 -rotate-90 opacity-25"
      />
      <IslamicCornerOrnament
        color={currentTheme.patternColor}
        className="absolute bottom-6 right-6 rotate-180 opacity-25"
      />

      {/* Top Floating Bar / Controls */}
      <header
        className={`relative z-20 flex items-center justify-between transition-opacity duration-500 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-sans text-neutral-300 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span>Peaceful Screensaver</span>
          </span>
          {config.driftEnabled && (
            <span className="hidden sm:inline-flex items-center space-x-1 text-[11px] px-2 py-0.5 rounded bg-white/5 text-neutral-400">
              <Shield className="w-3 h-3 text-emerald-400" />
              <span>OLED Burn-in Protection Active</span>
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleAudioToggle}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition shadow-lg"
            title="Audio Recite"
          >
            {isPlayingAudio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setShowNativeGuide(true)}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition shadow-lg"
            title="Native System Screensaver Setup Guide"
          >
            <Info className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition shadow-lg"
            title="Screensaver Settings"
          >
            <Settings2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition shadow-lg"
            title="Exit Screensaver"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Peaceful Hadith Canvas with OLED Drift Animation */}
      <main
        className="relative z-10 my-auto max-w-5xl mx-auto w-full text-center flex flex-col items-center justify-center transition-transform duration-1000 ease-in-out px-4"
        style={{
          transform: `translate(${driftOffset.x}px, ${driftOffset.y}px)`
        }}
      >
        {/* Clock & Date Header if enabled */}
        {(config.showClock || config.showDate) && (
          <div className="mb-6 md:mb-10 flex flex-col items-center space-y-1">
            {config.showClock && (
              <div className="font-sans text-3xl md:text-5xl font-light text-neutral-200 tracking-wider">
                {currentTime}
              </div>
            )}
            {config.showDate && (
              <div className="text-xs md:text-sm font-sans text-neutral-400 tracking-wide flex items-center space-x-2">
                <span>{currentDate}</span>
                {config.showHijri && hijriDate && (
                  <>
                    <span>•</span>
                    <span className={currentTheme.subAccent}>{hijriDate}</span>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Narrator */}
        {hadith.narrator && (
          <div className="mb-4">
            <p className={`font-sans font-medium ${currentTheme.subAccent} text-sm md:text-lg tracking-wider uppercase`}>
              {hadith.narrator}
            </p>
          </div>
        )}

        {/* Hadith Main Text */}
        <div className="my-2 max-w-4xl">
          <p
            className={`font-serif text-neutral-100 font-normal tracking-wide transition-all ${fontClasses}`}
          >
            &ldquo;{hadith.text}&rdquo;
          </p>
        </div>

        {/* Hadith Canonical Reference */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col items-center space-y-1.5">
          <div className={`font-serif text-base md:text-lg ${currentTheme.accent} font-medium`}>
            Sahih al-Bukhari • Book {hadith.bookNumber}: {hadith.bookName}
          </div>
          <div className="text-xs md:text-sm font-sans text-neutral-400">
            Volume {hadith.volume}, Hadith #{hadith.hadithNumber} • PDF Page {hadith.pdfPage}
          </div>
        </div>
      </main>

      {/* Bottom Hint */}
      <footer
        className={`relative z-20 text-center transition-opacity duration-500 ${
          showControls ? 'opacity-70' : 'opacity-0'
        }`}
      >
        <p className="text-[11px] font-sans text-neutral-400">
          Tap anywhere or move mouse to reveal controls • Screen will stay awake
        </p>
      </footer>

      {/* Screensaver Settings Drawer Modal */}
      {showSettingsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-[#11131a] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-6 text-neutral-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <Settings2 className="w-5 h-5 text-amber-400" />
                <h3 className="font-serif text-xl font-semibold">Screensaver Settings</h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Theme Selector */}
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-neutral-400 font-semibold flex items-center space-x-2">
                <Palette className="w-4 h-4 text-amber-400" />
                <span>Background Theme</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'obsidian', label: 'Obsidian', color: '#10121a' },
                  { id: 'emerald', label: 'Emerald', color: '#041d15' },
                  { id: 'navy', label: 'Navy', color: '#081426' },
                  { id: 'desert', label: 'Desert Gold', color: '#1a130b' },
                  { id: 'amethyst', label: 'Amethyst', color: '#140b1e' }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => updateConfig({ theme: t.id as ScreensaverTheme })}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium transition flex items-center space-x-2 ${
                      config.theme === t.id
                        ? 'border-amber-400 bg-white/10 text-white'
                        : 'border-white/10 bg-white/5 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }}></span>
                    <span className="truncate">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-neutral-400 font-semibold flex items-center space-x-2">
                <Type className="w-4 h-4 text-amber-400" />
                <span>Typography Size</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['small', 'medium', 'large', 'huge'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => updateConfig({ fontSize: size })}
                    className={`py-2 px-2 rounded-xl border text-xs capitalize font-medium transition ${
                      config.fontSize === size
                        ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                        : 'border-white/10 bg-white/5 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Brightness Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span className="uppercase tracking-wider font-semibold flex items-center space-x-2">
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span>Brightness</span>
                </span>
                <span>{config.brightness}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                value={config.brightness}
                onChange={(e) => updateConfig({ brightness: Number(e.target.value) })}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Geometric Pattern Opacity */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span className="uppercase tracking-wider font-semibold">Islamic Pattern Opacity</span>
                <span>{config.patternOpacity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                value={config.patternOpacity}
                onChange={(e) => updateConfig({ patternOpacity: Number(e.target.value) })}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Clock & Date Toggles */}
            <div className="space-y-3 pt-2 border-t border-white/10">
              <label className="flex items-center justify-between text-sm cursor-pointer">
                <span>Display Real-time Clock</span>
                <input
                  type="checkbox"
                  checked={config.showClock}
                  onChange={(e) => updateConfig({ showClock: e.target.checked })}
                  className="rounded accent-amber-400 w-4 h-4"
                />
              </label>

              {config.showClock && (
                <div className="flex items-center justify-between text-xs pl-4 text-neutral-400">
                  <span>Clock Format</span>
                  <div className="flex space-x-2">
                    {(['12h', '24h'] as const).map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => updateConfig({ clockFormat: fmt })}
                        className={`px-2.5 py-1 rounded-lg text-xs ${
                          config.clockFormat === fmt ? 'bg-amber-500 text-black font-bold' : 'bg-white/10 text-white'
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <label className="flex items-center justify-between text-sm cursor-pointer">
                <span>Display Date & Hijri Calendar</span>
                <input
                  type="checkbox"
                  checked={config.showDate}
                  onChange={(e) => updateConfig({ showDate: e.target.checked })}
                  className="rounded accent-amber-400 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between text-sm cursor-pointer">
                <div className="flex flex-col">
                  <span>OLED Anti-Burn-in Drift</span>
                  <span className="text-xs text-neutral-400">Gentle micro-shifts to protect screen</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.driftEnabled}
                  onChange={(e) => updateConfig({ driftEnabled: e.target.checked })}
                  className="rounded accent-amber-400 w-4 h-4"
                />
              </label>
            </div>

            <button
              onClick={() => setShowSettingsModal(false)}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold transition"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Native Screensaver Guide Modal */}
      {showNativeGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-[#11131a] border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 text-neutral-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-amber-400" />
                <h3 className="font-serif text-xl font-semibold">Screensaver Integration</h3>
              </div>
              <button
                onClick={() => setShowNativeGuide(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm text-neutral-300 leading-relaxed">
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
                <strong>Platform Operating System Notice:</strong> Mobile operating systems (iOS and Android) do not allow third-party apps to directly replace system lock screens or native display timeout locks for security reasons.
              </div>

              <h4 className="font-semibold text-white pt-2">How to use Daily Hadith Screensaver:</h4>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-neutral-300">
                <li>
                  <strong>In-App Ambient Mode:</strong> Open this view, place your phone on a charger / stand. The app engages the screen WakeLock to prevent device sleep safely without bypassing security.
                </li>
                <li>
                  <strong>iOS StandBy Mode (iOS 17+):</strong> Use our Large or Medium Widget in StandBy mode horizontally while charging on MagSafe.
                </li>
                <li>
                  <strong>Android Daydream / Screen Saver:</strong> On Android, you can configure our Widget on your ambient display or launch Daily Hadith in Ambient mode.
                </li>
                <li>
                  <strong>macOS / Windows Screensaver:</strong> You can add Daily Hadith web app as a standalone webview screensaver or use our exported Swift Widget.
                </li>
              </ul>
            </div>

            <button
              onClick={() => setShowNativeGuide(false)}
              className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
