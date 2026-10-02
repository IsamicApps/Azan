import React, { useState, useEffect, useRef } from 'react';
import { Hadith } from '../types/hadith';
import { getDailyHadith } from '../utils/dailyEngine';
import dailyPoolData from '../data/daily_pool.json';
import {
  Mosque,
  PrayerTimesResult,
  calculateMosquePrayerTimes,
  getSelectedMosque,
  getAllMosques,
  saveSelectedMosque
} from '../utils/prayerTimes';
import {
  getAzanSettings,
  saveAzanSettings,
  AzanSettings,
  MUEZZIN_SOURCES
} from '../utils/azanAudio';
import { speakHadith, stopSpeaking, isSpeaking } from '../utils/speech';
import { IslamicPattern, IslamicCornerOrnament } from './IslamicPattern';
import { AppLogo } from './AppLogo';
import {
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  Clock,
  Calendar,
  Compass,
  Building2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Shield,
  Utensils,
  Tv,
  Sun,
  Moon,
  Eye,
  BookOpen,
  MapPin,
  X
} from 'lucide-react';

interface SmartTvDisplayViewProps {
  onClose?: () => void;
}

const pool = dailyPoolData as Hadith[];

export const SmartTvDisplayView: React.FC<SmartTvDisplayViewProps> = ({ onClose }) => {
  const [selectedMosque, setSelectedMosque] = useState<Mosque>(getSelectedMosque());
  const [prayerData, setPrayerData] = useState<PrayerTimesResult>(
    calculateMosquePrayerTimes(selectedMosque, new Date())
  );
  const [azanSettings, setAzanSettings] = useState<AzanSettings>(getAzanSettings());
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [currentSecondsStr, setCurrentSecondsStr] = useState('');
  const [currentDateStr, setCurrentDateStr] = useState('');
  const [currentHijriStr, setCurrentHijriStr] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hadithIndex, setHadithIndex] = useState(0);
  const [isAutoCycling, setIsAutoCycling] = useState(true);
  const [tvTheme, setTvTheme] = useState<'obsidian' | 'emerald' | 'sapphire' | 'royal-gold'>('obsidian');
  const [driftOffset, setDriftOffset] = useState({ x: 0, y: 0 });
  const [isMosquePickerOpen, setIsMosquePickerOpen] = useState(false);
  const selectedMosqueButtonRef = useRef<HTMLButtonElement>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Wake lock ref to keep TV display awake
  const wakeLockRef = useRef<any>(null);

  // Request Wake Lock so TV screen never dims or turns off
  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {
        console.warn('Wake Lock request failed:', err);
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
      }
    };
  }, []);

  // Clock, Prayer Timer & OLED Anti-Burn-in drift engine
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const currentCalc = calculateMosquePrayerTimes(selectedMosque, now);
      setPrayerData(currentCalc);

      const hours = String(now.getHours() % 12 || 12).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const ampm = now.getHours() >= 12 ? 'PM' : 'AM';

      setCurrentTimeStr(`${hours}:${minutes} ${ampm}`);
      setCurrentSecondsStr(seconds);

      setCurrentDateStr(
        now.toLocaleDateString(undefined, {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      );

      const daily = getDailyHadith(now);
      setCurrentHijriStr(daily.hijriDate);
    };

    updateTime();
    const clockInterval = setInterval(updateTime, 1000);
    return () => clearInterval(clockInterval);
  }, [selectedMosque]);

  // OLED Burn-in micro-drift (shifts content 1-3 pixels every 90 seconds)
  useEffect(() => {
    const driftInterval = setInterval(() => {
      const randomX = (Math.random() - 0.5) * 6;
      const randomY = (Math.random() - 0.5) * 6;
      setDriftOffset({ x: randomX, y: randomY });
    }, 90000);

    return () => clearInterval(driftInterval);
  }, []);

  // Auto-rotate Hadiths every 25 seconds
  useEffect(() => {
    if (!isAutoCycling || pool.length === 0) return;
    const hadithTimer = setInterval(() => {
      setHadithIndex((prev) => (prev + 1) % pool.length);
    }, 25000);
    return () => clearInterval(hadithTimer);
  }, [isAutoCycling]);

  // Keyboard navigation for TV Remotes (D-Pad / Keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'MediaTrackNext' || e.key === 'ChannelUp' || e.key === 'MediaFastForward') {
        setHadithIndex((prev) => (prev + 1) % pool.length);
      } else if (e.key === 'MediaTrackPrevious' || e.key === 'ChannelDown' || e.key === 'MediaRewind') {
        setHadithIndex((prev) => (prev - 1 + pool.length) % pool.length);
      } else if (e.key === 'm' || e.key === 'M') {
        const next = !azanSettings.autoAzanEnabled;
        const updated = { ...azanSettings, autoAzanEnabled: next };
        setAzanSettings(updated);
        saveAzanSettings(updated);
      } else if (e.key === 't' || e.key === 'T') {
        const themes: ('obsidian' | 'emerald' | 'sapphire' | 'royal-gold')[] = ['obsidian', 'emerald', 'sapphire', 'royal-gold'];
        const nextIdx = (themes.indexOf(tvTheme) + 1) % themes.length;
        setTvTheme(themes[nextIdx]);
      } else if (e.key === 'Escape' || e.key === 'GoBack' || e.key === 'BrowserBack') {
        if (isMosquePickerOpen) {
          e.preventDefault();
          closeMosquePicker();
        } else if (onClose) {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [azanSettings, tvTheme, onClose, isMosquePickerOpen]);

  useEffect(() => {
    const syncFullscreen = () => setIsFullscreen(!!document.fullscreenElement);
    syncFullscreen();
    document.addEventListener('fullscreenchange', syncFullscreen);
    return () => document.removeEventListener('fullscreenchange', syncFullscreen);
  }, []);

  // Whole document (not just this view) so the Azan modal stays visible in fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Focus the current mosque when the picker opens so the remote starts there
  useEffect(() => {
    if (isMosquePickerOpen) selectedMosqueButtonRef.current?.focus();
  }, [isMosquePickerOpen]);

  // The remote's Back button (and Esc in fullscreen) never reaches the page as a key;
  // it navigates history. A history entry per open picker lets Back close it.
  useEffect(() => {
    const handlePopState = () => setIsMosquePickerOpen(false);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const openMosquePicker = () => {
    window.history.pushState({ tvMosquePicker: true }, '');
    setIsMosquePickerOpen(true);
  };

  const closeMosquePicker = () => {
    if (window.history.state?.tvMosquePicker) {
      window.history.back();
    } else {
      setIsMosquePickerOpen(false);
    }
  };

  const handleSelectMosque = (m: Mosque) => {
    setSelectedMosque(m);
    saveSelectedMosque(m.id);
    setPrayerData(calculateMosquePrayerTimes(m, new Date()));
    closeMosquePicker();
  };

  const mosquesByState = getAllMosques()
    .slice()
    .sort((a, b) => a.state.localeCompare(b.state) || a.name.localeCompare(b.name));

  const activeHadith = pool[hadithIndex] || pool[0];

  const themes = {
    obsidian: {
      bg: 'bg-gradient-to-br from-[#06080e] via-[#090d18] to-[#040508]',
      accent: 'border-amber-500/40 text-amber-300',
      heroGrad: 'from-amber-600/20 via-[#121624] to-[#0a0d16]',
      patternColor: '#d4af37'
    },
    emerald: {
      bg: 'bg-gradient-to-br from-[#03140e] via-[#062016] to-[#020a07]',
      accent: 'border-emerald-500/40 text-emerald-300',
      heroGrad: 'from-emerald-600/25 via-[#0c241a] to-[#05140e]',
      patternColor: '#10b981'
    },
    sapphire: {
      bg: 'bg-gradient-to-br from-[#050e1f] via-[#091630] to-[#030710]',
      accent: 'border-sky-500/40 text-sky-300',
      heroGrad: 'from-sky-600/25 via-[#0d1f40] to-[#060e1d]',
      patternColor: '#38bdf8'
    },
    'royal-gold': {
      bg: 'bg-gradient-to-br from-[#191206] via-[#241a08] to-[#0d0903]',
      accent: 'border-amber-400/50 text-amber-200',
      heroGrad: 'from-amber-500/30 via-[#2d200a] to-[#120d04]',
      patternColor: '#fbbf24'
    }
  };

  const currentTheme = themes[tvTheme];

  const prayerCards = [
    { name: 'Fajr', arabic: 'الفجر', time: prayerData.fajr, icon: '🌅', offset: selectedMosque.iqamaOffsets?.Fajr ?? 20 },
    { name: 'Sunrise', arabic: 'الشروق', time: prayerData.sunrise, icon: '☀️', offset: 0 },
    { name: 'Dhuhr', arabic: 'الظهر', time: prayerData.dhuhr, icon: '☀️', offset: selectedMosque.iqamaOffsets?.Dhuhr ?? 15 },
    { name: 'Asr', arabic: 'العصر', time: prayerData.asr, icon: '🌤️', offset: selectedMosque.iqamaOffsets?.Asr ?? 15 },
    { name: 'Maghrib', arabic: 'المغرب', time: prayerData.maghrib, icon: '🌇', offset: selectedMosque.iqamaOffsets?.Maghrib ?? 5 },
    { name: 'Isha', arabic: 'العشاء', time: prayerData.isha, icon: '🌙', offset: selectedMosque.iqamaOffsets?.Isha ?? 10 }
  ];

  return (
    <div
      ref={containerRef}
      style={{
        transform: `translate3d(${driftOffset.x}px, ${driftOffset.y}px, 0)`
      }}
      className={`fixed inset-0 z-50 w-full h-full ${currentTheme.bg} text-white flex flex-col justify-between p-6 lg:p-10 select-none overflow-hidden transition-colors duration-700`}
    >
      <IslamicPattern opacity={12} color={currentTheme.patternColor} />
      <IslamicCornerOrnament color={currentTheme.patternColor} className="absolute top-4 left-4 rotate-0 opacity-40 scale-125" />
      <IslamicCornerOrnament color={currentTheme.patternColor} className="absolute top-4 right-4 rotate-90 opacity-40 scale-125" />
      <IslamicCornerOrnament color={currentTheme.patternColor} className="absolute bottom-4 left-4 -rotate-90 opacity-40 scale-125" />
      <IslamicCornerOrnament color={currentTheme.patternColor} className="absolute bottom-4 right-4 rotate-180 opacity-40 scale-125" />

      {/* 1. TOP SMART TV HEADER BAR */}
      <header className="relative z-20 flex items-center justify-between pb-4 border-b border-white/15">
        {/* Left: Mosque & Brand with Logo */}
        <div className="flex items-center space-x-4">
          <AppLogo size={58} glow={true} />
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-serif text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
                Daily Hadith & Azan
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold text-xs border border-amber-500/30">
                TV Mode
              </span>
            </div>
            <div className="text-xs lg:text-sm text-neutral-300 flex items-center space-x-2 mt-0.5">
              <Building2 className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-amber-200">{selectedMosque.name}</span>
              <span>•</span>
              <span>{selectedMosque.suburb}, {selectedMosque.state}</span>
              <span>•</span>
              <span className="text-emerald-400 font-mono">Awqat.com.au</span>
            </div>
          </div>
        </div>

        {/* Center: Live Date (Gregorian & Hijri) */}
        <div className="hidden md:flex flex-col items-center text-center">
          <div className="font-arabic text-lg lg:text-xl text-amber-300 font-semibold">
            {currentHijriStr}
          </div>
          <div className="text-xs lg:text-sm text-neutral-300 font-medium">
            {currentDateStr}
          </div>
        </div>

        {/* Right: Giant TV Clock & Controls */}
        <div className="flex items-center space-x-5">
          <div className="text-right">
            <div className="font-mono text-3xl lg:text-5xl font-extrabold tracking-tight text-white flex items-baseline">
              <span>{currentTimeStr}</span>
              <span className="text-xs lg:text-sm text-amber-400 ml-1.5 font-bold">:{currentSecondsStr}</span>
            </div>
          </div>

          {/* Quick TV Control Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={openMosquePicker}
              className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-neutral-200 hover:text-white transition cursor-pointer"
              title="Choose Mosque"
            >
              <MapPin className="w-5 h-5" />
            </button>

            <button
              onClick={() => {
                const themes: ('obsidian' | 'emerald' | 'sapphire' | 'royal-gold')[] = ['obsidian', 'emerald', 'sapphire', 'royal-gold'];
                const nextIdx = (themes.indexOf(tvTheme) + 1) % themes.length;
                setTvTheme(themes[nextIdx]);
              }}
              className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-neutral-200 hover:text-white transition cursor-pointer"
              title="Switch Theme [T]"
            >
              <Moon className="w-5 h-5" />
            </button>

            <button
              onClick={() => {
                const next = !azanSettings.autoAzanEnabled;
                const updated = { ...azanSettings, autoAzanEnabled: next };
                setAzanSettings(updated);
                saveAzanSettings(updated);
              }}
              className={`p-3 rounded-2xl transition cursor-pointer ${
                azanSettings.autoAzanEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-white/10 text-neutral-400'
              }`}
              title={azanSettings.autoAzanEnabled ? 'Auto-Azan On [M]' : 'Auto-Azan Muted [M]'}
            >
              {azanSettings.autoAzanEnabled ? <Volume2 className="w-5 h-5 text-emerald-400" /> : <VolumeX className="w-5 h-5" />}
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold transition shadow-lg cursor-pointer"
              title="Toggle Fullscreen [F]"
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-rose-500/30 text-neutral-200 hover:text-white text-xs font-bold transition cursor-pointer"
              >
                Exit TV View
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. MAIN TV BODY (Split 60% Hadith & Fasting / 40% Prayer & Next Countdown) */}
      <main className="relative z-20 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 my-4 overflow-hidden items-stretch">
        
        {/* LEFT COLUMN: Featured Sahih al-Bukhari Hadith (7 Columns) */}
        <div className="lg:col-span-7 flex flex-col justify-between rounded-3xl bg-[#0c0f18]/80 border border-amber-500/30 p-6 lg:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
          <IslamicPattern opacity={16} color={currentTheme.patternColor} />
          
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Sahih al-Bukhari • Daily Verified Selection</span>
              </div>

              {/* Hadith cycling controls */}
              <div className="flex items-center space-x-2 text-xs text-neutral-400">
                <span>{hadithIndex + 1} of {pool.length}</span>
                <button
                  onClick={() => setHadithIndex((prev) => (prev - 1 + pool.length) % pool.length)}
                  title="Previous Hadith"
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setHadithIndex((prev) => (prev + 1) % pool.length)}
                  title="Next Hadith"
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Narrator */}
            {activeHadith.narrator && (
              <div className="font-serif text-lg lg:text-xl font-bold text-amber-300">
                {activeHadith.narrator}
              </div>
            )}

            {/* Hadith English Text in Big TV Typography */}
            <blockquote className="font-serif text-xl lg:text-2xl xl:text-3xl text-neutral-100 leading-relaxed max-h-[36vh] overflow-y-auto pr-2 scrollbar-none">
              &ldquo;{activeHadith.text}&rdquo;
            </blockquote>
          </div>

          {/* Bottom Hadith Reference Bar & Fasting Ribbon */}
          <div className="relative z-10 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs lg:text-sm text-neutral-300 font-mono space-x-3">
              <span className="text-amber-400 font-semibold">Book {activeHadith.bookNumber}: {activeHadith.bookName}</span>
              <span>•</span>
              <span>Hadith #{activeHadith.hadithNumber}</span>
              <span>•</span>
              <span className="text-neutral-400">PDF Page {activeHadith.pdfPage}</span>
            </div>

            {/* Fasting Suhoor/Iftar Pill */}
            <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-2xl bg-emerald-950/50 border border-emerald-500/30 text-xs">
              <Utensils className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-neutral-300">
                {prayerData.nextFastingEvent.type === 'Iftar'
                  ? `Iftar at ${prayerData.maghrib}`
                  : `Suhoor end at ${prayerData.fajr}`}
              </span>
              <span className="text-emerald-400 font-bold font-mono">
                ({prayerData.nextFastingEvent.remainingFormatted})
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Next Prayer Card & Full Timetable (5 Columns) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          
          {/* Top: Giant Next Prayer Countdown Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-600/30 via-[#1a1f30] to-[#101420] border border-amber-500/40 shadow-2xl relative overflow-hidden flex items-center justify-between">
            <IslamicPattern opacity={14} color="#d4af37" />
            <div className="relative z-10 space-y-1">
              <div className="text-[11px] uppercase tracking-widest text-amber-300 font-bold">
                Next Prayer
              </div>
              <h3 className="font-serif text-3xl lg:text-4xl font-extrabold text-white">
                {prayerData.nextPrayer.name}
              </h3>
              <div className="text-sm font-mono text-neutral-300">
                Adhan: <span className="text-amber-300 font-bold">{prayerData.nextPrayer.time}</span>
                {prayerData.nextPrayer.iqamaTime && (
                  <span className="ml-2 text-emerald-400">• Iqamah: {prayerData.nextPrayer.iqamaTime}</span>
                )}
              </div>
            </div>

            <div className="relative z-10 text-right">
              <div className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold">
                Time Remaining
              </div>
              <div className="text-2xl lg:text-4xl font-mono font-extrabold text-amber-300 mt-0.5">
                {prayerData.nextPrayer.remainingFormatted}
              </div>
            </div>
          </div>

          {/* Bottom: 6 Daily Prayers Timetable with Iqamah */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3 max-h-[46vh] overflow-y-auto pr-1">
            {prayerCards.map((p) => {
              const isNext = prayerData.nextPrayer.name === p.name;
              const isCurrent = prayerData.currentPrayer === p.name;

              return (
                <div
                  key={p.name}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                    isNext
                      ? 'bg-gradient-to-r from-amber-500/25 via-[#22293d] to-[#151a28] border-amber-400 ring-2 ring-amber-500/40 shadow-xl scale-[1.02]'
                      : isCurrent
                      ? 'bg-neutral-900/90 border-emerald-500/50'
                      : 'bg-[#0f121d]/80 border-white/10'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-base">{p.icon}</span>
                      <span className="font-bold text-sm lg:text-base text-white">{p.name}</span>
                      <span className="font-arabic text-xs text-neutral-400">{p.arabic}</span>
                    </div>
                    <div className="text-[10px] text-neutral-400">
                      {p.offset > 0 ? `Iqamah +${p.offset}m` : 'Transit'}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono text-base lg:text-xl font-bold text-amber-300">
                      {p.time}
                    </div>
                    {isNext && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500 text-neutral-950 font-extrabold uppercase tracking-wider">
                        Next
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Friday Jumu'ah & Qibla Strip */}
          <div className="p-3.5 rounded-2xl bg-[#0e121c] border border-white/10 flex items-center justify-between text-xs text-neutral-300">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Jumu&apos;ah: <strong className="text-white">{selectedMosque.jumuah}</strong></span>
            </div>
            <div className="flex items-center space-x-2">
              <Compass className="w-4 h-4 text-sky-400" />
              <span>Qibla: <strong className="text-sky-300 font-mono">{prayerData.qiblaBearing}° NW</strong></span>
            </div>
          </div>
        </div>
      </main>

      {/* 3. TV BOTTOM TICKER / KEYBOARD SHORTCUTS BAR */}
      <footer className="relative z-20 pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-[11px] lg:text-xs text-neutral-400 gap-2">
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>OLED Protection & Wake Lock Active</span>
          </span>
          <span>•</span>
          <span>Muezzin: <strong className="text-amber-300">{MUEZZIN_SOURCES[azanSettings.selectedMuezzin]?.name}</strong></span>
        </div>

        {/* TV Remote Shortcuts Help */}
        <div className="flex items-center space-x-3 text-neutral-500 font-mono text-[10px]">
          <span>[Arrows] Navigate</span>
          <span>[OK] Select</span>
          <span>[Ch +/−] Browse Hadiths</span>
          <span>[F] Fullscreen</span>
          <span>[M] Mute Azan</span>
          <span>[T] Theme</span>
        </div>
      </footer>

      {/* Mosque Picker (remote-friendly) */}
      {isMosquePickerOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-10 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-5xl max-h-full flex flex-col rounded-3xl bg-[#10131d] border border-amber-500/30 p-8 shadow-2xl">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
              <h3 className="font-serif text-3xl font-bold text-white">Choose Your Mosque</h3>
              <button
                onClick={closeMosquePicker}
                className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-neutral-200 cursor-pointer"
                title="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto pr-2 p-1">
              {mosquesByState.map((m) => {
                const isSelected = m.id === selectedMosque.id;
                return (
                  <button
                    key={m.id}
                    ref={isSelected ? selectedMosqueButtonRef : undefined}
                    onClick={() => handleSelectMosque(m)}
                    className={`text-left p-4 rounded-2xl border transition cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 text-white'
                        : 'bg-white/5 border-white/10 text-neutral-200 hover:bg-white/10'
                    }`}
                  >
                    <div className="font-semibold text-base leading-snug">{m.name}</div>
                    <div className="text-sm text-neutral-400 mt-1">{m.suburb}, {m.state}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
