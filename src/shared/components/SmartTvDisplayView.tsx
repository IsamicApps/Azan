import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Hadith } from '../types/hadith';
import dailyPoolData from '../data/daily_pool.json';
import { getHijriDate } from '../utils/hijri';
import { loadDailyHadithOrBundled, loadRandomHadith, describeHadith } from '../utils/hadithLibrary';
import { GradeBadge } from './GradeBadge';
import { LanguageToggle } from './LanguageToggle';
import { useDisplayedHadith, getHadithLanguage, setHadithLanguage } from '../hooks/useHadithLanguage';
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
  MUEZZIN_SOURCES,
  MuezzinId,
  AZAN_PRAYERS,
  AzanPrayer,
  getMuezzinForPrayer,
  withPrayerMuezzin,
  playAzan,
  stopAzan,
  getAzanPlayCount
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
  X,
  Music,
  Play,
  Square
} from 'lucide-react';

const MUEZZIN_IDS = Object.keys(MUEZZIN_SOURCES) as MuezzinId[];

interface SmartTvDisplayViewProps {
  onClose?: () => void;
}

// Offline fallback when the sunnah.com library can't be downloaded
const pool = dailyPoolData as Hadith[];

const CROSS_REFERENCE = /^[\s(\["]*(as above|see (the )?(previous|above|next) hadith|see hadith)/i;

/** A random Hadith from the whole sunnah.com library (skipping "As above" stubs). */
async function pickRandomHadith(): Promise<Hadith> {
  try {
    for (let i = 0; i < 5; i++) {
      const h = await loadRandomHadith();
      if (!(h.text.length < 80 && CROSS_REFERENCE.test(h.text))) return h;
    }
  } catch {}
  return pool[Math.floor(Math.random() * pool.length)];
}

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
  // Starts on the Hadith of the Day, then shows random Hadiths from all of sunnah.com
  const [activeHadith, setActiveHadith] = useState<Hadith | null>(null);
  const [isDailyHadith, setIsDailyHadith] = useState(true);
  const [showExcerpt, setShowExcerpt] = useState(false);
  const shownHadithsRef = useRef<{ hadith: Hadith; isDaily: boolean }[]>([]);
  const [isAutoCycling, setIsAutoCycling] = useState(true);
  const [tvTheme, setTvTheme] = useState<'obsidian' | 'emerald' | 'sapphire' | 'royal-gold'>('obsidian');
  const [driftOffset, setDriftOffset] = useState({ x: 0, y: 0 });
  const [openDialog, setOpenDialog] = useState<'mosque' | 'azan' | null>(null);
  const isMosquePickerOpen = openDialog === 'mosque';
  const [previewingRow, setPreviewingRow] = useState<string | null>(null);
  // playAzan() count of the running preview; a newer count means the real Azan took over
  const previewPlayRef = useRef(0);
  const azanDialogFirstButtonRef = useRef<HTMLButtonElement>(null);
  const selectedMosqueButtonRef = useRef<HTMLButtonElement>(null);
  const hadithBoxRef = useRef<HTMLDivElement>(null);
  const hadithContentRef = useRef<HTMLDivElement>(null);
  const hadithTextRef = useRef<HTMLQuoteElement>(null);

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

      setCurrentHijriStr(getHijriDate(now).formatted);
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

  useEffect(() => {
    loadDailyHadithOrBundled(new Date()).then((daily) => {
      setActiveHadith((current) => current ?? daily.hadith);
    });
  }, []);

  const showHadith = (hadith: Hadith, isDaily: boolean) => {
    setShowExcerpt(false);
    setActiveHadith(hadith);
    setIsDailyHadith(isDaily);
  };

  const activeHadithRef = useRef<{ hadith: Hadith | null; isDaily: boolean }>({ hadith: null, isDaily: true });
  activeHadithRef.current = { hadith: activeHadith, isDaily: isDailyHadith };

  const showNextHadith = async () => {
    const next = await pickRandomHadith();
    const { hadith, isDaily } = activeHadithRef.current;
    if (hadith) shownHadithsRef.current = [...shownHadithsRef.current.slice(-49), { hadith, isDaily }];
    showHadith(next, false);
  };

  const showPreviousHadith = () => {
    const previous = shownHadithsRef.current.pop();
    if (previous) showHadith(previous.hadith, previous.isDaily);
  };

  // Auto-rotate Hadiths every 25 seconds
  useEffect(() => {
    if (!isAutoCycling) return;
    const hadithTimer = setInterval(showNextHadith, 25000);
    return () => clearInterval(hadithTimer);
  }, [isAutoCycling]);

  // Keyboard navigation for TV Remotes (D-Pad / Keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'MediaTrackNext' || e.key === 'ChannelUp' || e.key === 'MediaFastForward') {
        showNextHadith();
      } else if (e.key === 'MediaTrackPrevious' || e.key === 'ChannelDown' || e.key === 'MediaRewind') {
        showPreviousHadith();
      } else if (e.key === 'm' || e.key === 'M') {
        const next = !azanSettings.autoAzanEnabled;
        const updated = { ...azanSettings, autoAzanEnabled: next };
        setAzanSettings(updated);
        saveAzanSettings(updated);
      } else if (e.key === 'l' || e.key === 'L') {
        setHadithLanguage(getHadithLanguage() === 'ar' ? 'en' : 'ar');
      } else if (e.key === 't' || e.key === 'T') {
        const themes: ('obsidian' | 'emerald' | 'sapphire' | 'royal-gold')[] = ['obsidian', 'emerald', 'sapphire', 'royal-gold'];
        const nextIdx = (themes.indexOf(tvTheme) + 1) % themes.length;
        setTvTheme(themes[nextIdx]);
      } else if (e.key === 'Escape' || e.key === 'GoBack' || e.key === 'BrowserBack') {
        if (openDialog) {
          e.preventDefault();
          closeDialog();
        } else if (onClose) {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [azanSettings, tvTheme, onClose, openDialog]);

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

  // Put the remote's focus inside a dialog when it opens
  useEffect(() => {
    if (openDialog === 'mosque') selectedMosqueButtonRef.current?.focus();
    if (openDialog === 'azan') azanDialogFirstButtonRef.current?.focus();
  }, [openDialog]);

  // The remote's Back button (and Esc in fullscreen) never reaches the page as a key;
  // it navigates history. A history entry per open dialog lets Back close it.
  useEffect(() => {
    const handlePopState = () => setOpenDialog(null);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Stop any voice preview when the Azan dialog closes
  useEffect(() => {
    if (openDialog !== 'azan' && previewingRow) {
      stopPreview();
    }
  }, [openDialog, previewingRow]);

  // Stops only the preview, never a prayer's Azan that started since
  const stopPreview = () => {
    if (getAzanPlayCount() === previewPlayRef.current) stopAzan();
    setPreviewingRow(null);
  };

  const openDialogOf = (kind: 'mosque' | 'azan') => {
    window.history.pushState({ tvDialog: true }, '');
    setOpenDialog(kind);
  };

  const closeDialog = () => {
    if (window.history.state?.tvDialog) {
      window.history.back();
    } else {
      setOpenDialog(null);
    }
  };

  const handleSelectMosque = (m: Mosque) => {
    setSelectedMosque(m);
    saveSelectedMosque(m.id);
    setPrayerData(calculateMosquePrayerTimes(m, new Date()));
    closeDialog();
  };

  const updateAzanSettings = (updated: AzanSettings) => {
    setAzanSettings(updated);
    saveAzanSettings(updated);
  };

  // OK on "Change" steps through the voices; a prayer's list also includes "Default"
  const cycleDefaultMuezzin = () => {
    const next = MUEZZIN_IDS[(MUEZZIN_IDS.indexOf(azanSettings.selectedMuezzin) + 1) % MUEZZIN_IDS.length];
    updateAzanSettings({ ...azanSettings, selectedMuezzin: next });
  };

  const cyclePrayerMuezzin = (prayer: AzanPrayer) => {
    const choices: (MuezzinId | null)[] = [null, ...MUEZZIN_IDS];
    const current = azanSettings.prayerMuezzins?.[prayer] ?? null;
    const next = choices[(choices.indexOf(current) + 1) % choices.length];
    updateAzanSettings(withPrayerMuezzin(azanSettings, prayer, next));
  };

  const togglePreview = (row: string, muezzin: MuezzinId) => {
    if (previewingRow === row) {
      stopPreview();
      return;
    }
    setPreviewingRow(row);
    playAzan(undefined, () => setPreviewingRow((current) => (current === row ? null : current)), muezzin);
    previewPlayRef.current = getAzanPlayCount();
  };

  const hasCustomPrayerVoices = AZAN_PRAYERS.some((p) => azanSettings.prayerMuezzins?.[p]);

  const mosquesByState = getAllMosques()
    .slice()
    .sort((a, b) => a.state.localeCompare(b.state) || a.name.localeCompare(b.name));


  // The Hadith in the chosen language; a language switch starts again from the full text
  const { hadith: shownHadith } = useDisplayedHadith(activeHadith);
  const fittedTextRef = useRef<string | undefined>(undefined);

  // Largest font (52px down to 24px) at which the whole Hadith fits its panel,
  // whatever the screen's shape — re-fitted when the Hadith or the screen changes.
  useLayoutEffect(() => {
    if (fittedTextRef.current !== shownHadith?.text) {
      fittedTextRef.current = shownHadith?.text;
      if (showExcerpt) {
        setShowExcerpt(false);
        return;
      }
    }
    const fit = () => {
      const box = hadithBoxRef.current;
      const content = hadithContentRef.current;
      const text = hadithTextRef.current;
      if (!box || !content || !text) return;
      let size = 52;
      text.style.fontSize = `${size}px`;
      while (size > 24 && content.offsetHeight > box.clientHeight) {
        size -= 2;
        text.style.fontSize = `${size}px`;
      }
      // Some Hadiths are pages long; show the excerpt when even the smallest size won't fit
      if (content.offsetHeight > box.clientHeight && shownHadith?.isLong && !showExcerpt) setShowExcerpt(true);
    };
    fit();
    // Web fonts arrive after the first paint and change the text's height
    document.fonts?.ready.then(fit).catch(() => {});
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [shownHadith?.text, showExcerpt]);

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

  // Designed for a fixed 1920x1080 canvas (scaled to the screen by the TV app),
  // so sizes are absolute and readable from across the room — no breakpoints.
  const compassPoints = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const qiblaDirection = compassPoints[Math.round(prayerData.qiblaBearing / 45) % 8];

  return (
    <div
      ref={containerRef}
      style={{
        transform: `translate3d(${driftOffset.x}px, ${driftOffset.y}px, 0)`
      }}
      className={`fixed inset-0 z-50 w-full h-full ${currentTheme.bg} text-white flex flex-col px-[72px] py-[44px] select-none overflow-hidden transition-colors duration-700`}
    >
      <IslamicPattern opacity={12} color={currentTheme.patternColor} />
      <IslamicCornerOrnament color={currentTheme.patternColor} className="absolute top-4 left-4 rotate-0 opacity-40 scale-125" />
      <IslamicCornerOrnament color={currentTheme.patternColor} className="absolute top-4 right-4 rotate-90 opacity-40 scale-125" />
      <IslamicCornerOrnament color={currentTheme.patternColor} className="absolute bottom-4 left-4 -rotate-90 opacity-40 scale-125" />
      <IslamicCornerOrnament color={currentTheme.patternColor} className="absolute bottom-4 right-4 rotate-180 opacity-40 scale-125" />

      {/* 1. HEADER: brand & mosque | dates | clock */}
      <header className="relative z-20 shrink-0 grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-12 pb-6 border-b border-white/15">
        <div className="flex items-center gap-5 min-w-0">
          <AppLogo size={76} glow={true} />
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <span className="font-serif text-[40px] leading-tight font-extrabold tracking-tight text-white whitespace-nowrap">
                Daily Hadith & Azan
              </span>
            </div>
            <div className="text-[22px] text-neutral-300 flex items-start gap-2 mt-1 min-w-0">
              <Building2 className="w-6 h-6 mt-0.5 shrink-0 text-amber-400" />
              <span className="line-clamp-2">
                <span className="font-semibold text-amber-200">{selectedMosque.name}</span>
                <span className="text-neutral-500"> • </span>
                <span className="whitespace-nowrap">{selectedMosque.suburb}, {selectedMosque.state}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center text-center">
          <div className="font-arabic text-[34px] leading-tight text-amber-300 font-semibold whitespace-nowrap">
            {currentHijriStr}
          </div>
          <div className="text-[22px] text-neutral-300 font-medium whitespace-nowrap">
            {currentDateStr}
          </div>
        </div>

        <div className="flex items-center justify-end">
          <div className="font-mono text-[76px] leading-none font-extrabold tracking-tight text-white flex items-baseline whitespace-nowrap">
            <span>{currentTimeStr}</span>
            <span className="text-[28px] text-amber-400 ml-2 font-bold">:{currentSecondsStr}</span>
          </div>
        </div>
      </header>

      {/* 2. BODY: Hadith (7/12) | Next prayer & timetable (5/12) */}
      <main className="relative z-20 flex-1 min-h-0 grid grid-cols-12 gap-8 my-7">
        {/* Featured Hadith */}
        <div className="col-span-7 min-h-0 flex flex-col rounded-[32px] bg-[#0c0f18]/80 border border-amber-500/30 px-12 py-10 shadow-2xl relative overflow-hidden backdrop-blur-md">
          <IslamicPattern opacity={16} color={currentTheme.patternColor} />

          <div className="relative z-10 shrink-0 flex items-center justify-between gap-6">
            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[20px] font-bold uppercase tracking-wider whitespace-nowrap">
              <Sparkles className="w-6 h-6" />
              <span>{activeHadith?.collection ?? 'sunnah.com'}</span>
            </div>

            <div className="flex items-center gap-3 text-[20px] text-neutral-400">
              <span className="whitespace-nowrap">{isDailyHadith ? 'Hadith of the Day' : 'From all of sunnah.com'}</span>
              <button
                onClick={showPreviousHadith}
                title="Previous Hadith"
                className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={showNextHadith}
                title="Next Hadith"
                className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div ref={hadithBoxRef} className="relative z-10 flex-1 min-h-0 flex flex-col justify-center overflow-hidden my-6">
            <div ref={hadithContentRef}>
              {shownHadith?.narrator && (
                <div className="font-serif text-[34px] font-bold text-amber-300 mb-5">
                  {shownHadith.narrator}
                </div>
              )}
              <blockquote
                ref={hadithTextRef}
                data-hadith-text
                dir={shownHadith?.isArabic ? 'rtl' : undefined}
                className={`${shownHadith?.isArabic ? 'font-arabic' : 'font-serif'} text-[52px] leading-[1.45] text-neutral-100`}
              >
                {!shownHadith
                  ? 'Loading the Hadith of the Day…'
                  : shownHadith.isArabic
                    ? (showExcerpt ? shownHadith.excerpt : shownHadith.text)
                    : <>&ldquo;{showExcerpt ? shownHadith.excerpt : shownHadith.text}&rdquo;</>}
              </blockquote>
            </div>
          </div>

          <div className="relative z-10 shrink-0 pt-6 border-t border-white/10 flex items-center justify-between gap-6">
            <div className="text-[22px] text-neutral-300 font-mono flex flex-wrap items-center gap-x-4 gap-y-1 min-w-0">
              {activeHadith && (
                <>
                  <GradeBadge hadith={activeHadith} size="tv" showGrader />
                  <span className="text-amber-400 font-semibold">{describeHadith(activeHadith).reference}</span>
                  <span className="text-neutral-500">•</span>
                  <span>{describeHadith(activeHadith).detail}</span>
                  {showExcerpt && <span className="text-neutral-500">(excerpt)</span>}
                </>
              )}
            </div>

            {prayerData.isRamadan && (
            <div className="shrink-0 flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-emerald-950/50 border border-emerald-500/30 text-[22px] whitespace-nowrap">
              <Utensils className="w-6 h-6 text-emerald-400" />
              <span className="text-neutral-300">
                {prayerData.nextFastingEvent.type === 'Iftar'
                  ? `Iftar ${prayerData.maghrib}`
                  : `Suhoor ends ${prayerData.fajr}`}
              </span>
              <span className="text-emerald-400 font-bold font-mono">
                ({prayerData.nextFastingEvent.remainingFormatted})
              </span>
            </div>
            )}
          </div>
        </div>

        {/* Next prayer & timetable */}
        <div className="col-span-5 min-h-0 flex flex-col gap-5">
          <div className="shrink-0 px-9 py-7 rounded-[32px] bg-gradient-to-r from-amber-600/30 via-[#1a1f30] to-[#101420] border border-amber-500/40 shadow-2xl relative overflow-hidden flex items-center justify-between gap-6">
            <IslamicPattern opacity={14} color="#d4af37" />
            <div className="relative z-10 min-w-0">
              <div className="text-[20px] uppercase tracking-widest text-amber-300 font-bold">
                Next Prayer
              </div>
              <h3 className="font-serif text-[64px] leading-tight font-extrabold text-white">
                {prayerData.nextPrayer.name}
              </h3>
              <div className="text-[22px] font-mono text-neutral-300 flex flex-wrap gap-x-4">
                <span className="whitespace-nowrap">Adhan <span className="text-amber-300 font-bold">{prayerData.nextPrayer.time}</span></span>
                {prayerData.nextPrayer.iqamaTime && (
                  <span className="whitespace-nowrap text-emerald-400">Iqamah {prayerData.nextPrayer.iqamaTime}</span>
                )}
              </div>
            </div>

            <div className="relative z-10 text-right shrink-0">
              <div className="text-[18px] uppercase tracking-widest text-neutral-400 font-semibold">
                Remaining
              </div>
              <div className="text-[60px] leading-tight font-mono font-extrabold text-amber-300 whitespace-nowrap">
                {prayerData.nextPrayer.remainingFormatted}
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-0 grid grid-cols-2 grid-rows-3 gap-4">
            {prayerCards.map((p) => {
              const isNext = prayerData.nextPrayer.name === p.name;
              const isCurrent = prayerData.currentPrayer === p.name;

              return (
                <div
                  key={p.name}
                  data-prayer-card
                  className={`min-h-0 px-6 py-3 rounded-3xl border transition-all flex flex-col justify-center ${
                    isNext
                      ? 'bg-gradient-to-r from-amber-500/25 via-[#22293d] to-[#151a28] border-amber-400 ring-4 ring-amber-500/40 shadow-xl'
                      : isCurrent
                      ? 'bg-neutral-900/90 border-emerald-500/50'
                      : 'bg-[#0f121d]/80 border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-[26px] leading-none">{p.icon}</span>
                      <span className="font-bold text-[26px] leading-tight text-white">{p.name}</span>
                    </div>
                    {isNext && (
                      <span className="shrink-0 text-[14px] px-3 py-0.5 rounded-full bg-amber-500 text-neutral-950 font-extrabold uppercase tracking-wider">
                        Next
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-[36px] leading-tight font-bold text-amber-300 whitespace-nowrap">
                    {p.time}
                  </div>
                  <div className="text-[18px] text-neutral-400 flex items-center gap-2 whitespace-nowrap">
                    <span className="font-arabic">{p.arabic}</span>
                    <span>•</span>
                    <span>{p.offset > 0 ? `Iqamah +${p.offset}m` : 'Transit'}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="shrink-0 px-6 py-4 rounded-3xl bg-[#0e121c] border border-white/10 flex items-center justify-between gap-4 text-[22px] text-neutral-300">
            <div className="flex items-center gap-3 min-w-0">
              <Calendar className="w-6 h-6 shrink-0 text-amber-400" />
              <span>Jumu&apos;ah <strong className="text-white">{selectedMosque.jumuah}</strong></span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Compass className="w-6 h-6 text-sky-400" />
              <span>Qibla <strong className="text-sky-300 font-mono">{prayerData.qiblaBearing}° {qiblaDirection}</strong></span>
            </div>
          </div>
        </div>
      </main>

      {/* 3. FOOTER: status | controls */}
      <footer className="relative z-20 shrink-0 pt-3 border-t border-white/10 flex items-center justify-between gap-6 text-[18px] text-neutral-400">
        <div className="flex items-center gap-4 whitespace-nowrap">
          <span className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            <span>Screen kept awake</span>
          </span>
          <span>•</span>
          <span>
            Azan: <strong className="text-amber-300">{MUEZZIN_SOURCES[azanSettings.selectedMuezzin]?.name}</strong>
            {hasCustomPrayerVoices && <span className="text-neutral-500"> (custom per prayer)</span>}
          </span>
        </div>

        <div className="flex items-center gap-6">
          <span className="text-neutral-500 font-mono text-[16px] whitespace-nowrap">Ch +/−: Hadiths</span>
            <div className="flex items-center gap-3">
              <LanguageToggle size="tv" />

              <button
                onClick={() => openDialogOf('mosque')}
                className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-neutral-200 hover:text-white transition cursor-pointer"
                title="Choose Mosque"
              >
                <MapPin className="w-6 h-6" />
              </button>

              <button
                onClick={() => openDialogOf('azan')}
                className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-neutral-200 hover:text-white transition cursor-pointer"
                title="Azan Voices"
              >
                <Music className="w-6 h-6" />
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
                <Moon className="w-6 h-6" />
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
                {azanSettings.autoAzanEnabled ? <Volume2 className="w-6 h-6 text-emerald-400" /> : <VolumeX className="w-6 h-6" />}
              </button>

              <button
                onClick={toggleFullscreen}
                className="p-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold transition shadow-lg cursor-pointer"
                title="Toggle Fullscreen [F]"
              >
                {isFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
              </button>

              {onClose && (
                <button
                  onClick={onClose}
                  className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-rose-500/30 text-neutral-200 hover:text-white text-lg font-bold transition cursor-pointer"
                >
                  Exit TV View
                </button>
              )}
            </div>
        </div>
      </footer>

      {/* Azan Voices (remote-friendly): default voice + one per prayer */}
      {openDialog === 'azan' && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center px-[96px] py-[54px] bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-[1300px] max-h-full flex flex-col rounded-[36px] bg-[#10131d] border border-amber-500/30 p-10 shadow-2xl">
            <div className="flex items-center justify-between pb-6 mb-4 border-b border-white/10">
              <div>
                <h3 className="font-serif text-[48px] leading-tight font-bold text-white">Azan Voices</h3>
                <p className="text-[22px] text-neutral-400">Press OK on Change to pick a voice for each prayer</p>
              </div>
              <button
                onClick={closeDialog}
                className="p-4 rounded-2xl bg-white/10 hover:bg-white/20 text-neutral-200 cursor-pointer"
                title="Close"
              >
                <X className="w-8 h-8" />
              </button>
            </div>

            <div className="flex flex-col gap-3 overflow-y-auto p-2">
              {[{ key: 'default', label: 'Default (all prayers)' }, ...AZAN_PRAYERS.map((p) => ({ key: p, label: p }))].map((row, index) => {
                const isDefaultRow = row.key === 'default';
                const own = isDefaultRow ? null : azanSettings.prayerMuezzins?.[row.key as AzanPrayer];
                const effective = isDefaultRow ? azanSettings.selectedMuezzin : getMuezzinForPrayer(azanSettings, row.key);
                const isPreviewing = previewingRow === row.key;
                return (
                  <div
                    key={row.key}
                    className={`flex items-center gap-6 px-7 py-4 rounded-3xl border ${
                      isDefaultRow ? 'bg-amber-500/10 border-amber-500/30' : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="w-[300px] shrink-0 text-[28px] font-bold text-white">{row.label}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[26px] font-semibold text-amber-200 truncate">
                        {MUEZZIN_SOURCES[effective].name}
                      </div>
                      <div className="text-[20px] text-neutral-400">
                        {isDefaultRow ? 'Used by every prayer set to Default' : own ? MUEZZIN_SOURCES[own].location : 'Default'}
                      </div>
                    </div>
                    <button
                      ref={index === 0 ? azanDialogFirstButtonRef : undefined}
                      onClick={() => (isDefaultRow ? cycleDefaultMuezzin() : cyclePrayerMuezzin(row.key as AzanPrayer))}
                      className="px-7 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-[22px] font-bold text-white cursor-pointer"
                      title={`Change ${row.label} voice`}
                    >
                      Change
                    </button>
                    <button
                      onClick={() => togglePreview(row.key, effective)}
                      className={`p-4 rounded-2xl cursor-pointer ${isPreviewing ? 'bg-rose-500 text-white' : 'bg-amber-500 text-neutral-950'}`}
                      title={isPreviewing ? `Stop ${row.label} preview` : `Listen to ${row.label} voice`}
                    >
                      {isPreviewing ? <Square className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Mosque Picker (remote-friendly) */}
      {isMosquePickerOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center px-[96px] py-[54px] bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-[1500px] max-h-full flex flex-col rounded-[36px] bg-[#10131d] border border-amber-500/30 p-10 shadow-2xl">
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-white/10">
              <h3 className="font-serif text-[48px] font-bold text-white">Choose Your Mosque</h3>
              <button
                onClick={closeDialog}
                className="p-4 rounded-2xl bg-white/10 hover:bg-white/20 text-neutral-200 cursor-pointer"
                title="Close"
              >
                <X className="w-8 h-8" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4 overflow-y-auto pr-2 p-2">
              {mosquesByState.map((m) => {
                const isSelected = m.id === selectedMosque.id;
                return (
                  <button
                    key={m.id}
                    ref={isSelected ? selectedMosqueButtonRef : undefined}
                    onClick={() => handleSelectMosque(m)}
                    className={`text-left px-6 py-5 rounded-3xl border transition cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 text-white'
                        : 'bg-white/5 border-white/10 text-neutral-200 hover:bg-white/10'
                    }`}
                  >
                    <div className="font-semibold text-[24px] leading-snug">{m.name}</div>
                    <div className="text-[20px] text-neutral-400 mt-1">{m.suburb}, {m.state}</div>
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
