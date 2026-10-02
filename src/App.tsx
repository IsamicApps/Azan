import React, { useState, useEffect } from 'react';
import { Hadith, DailySelection, FavoriteItem, ReminderConfig } from './types/hadith';
import { getDailyHadith, formatDateKey } from './utils/dailyEngine';
import {
  getFavorites,
  saveFavorite,
  removeFavorite,
  isFavorite,
  getReminderConfig,
  saveReminderConfig,
  getAppTheme,
  saveAppTheme
} from './utils/storage';
import {
  Mosque,
  PrayerTimesResult,
  calculateMosquePrayerTimes,
  getSelectedMosque,
  getDuePrayer,
  MOSQUE_CHANGE_EVENT
} from './utils/prayerTimes';
import {
  playAzan,
  stopAzan,
  getAzanSettings,
  claimAzanTrigger
} from './utils/azanAudio';
import { AzanLiveModal } from './components/AzanLiveModal';
import { AppLogo } from './components/AppLogo';
import { SmartTvDisplayView } from './components/SmartTvDisplayView';
import { NamesOfAllahView } from './components/NamesOfAllahView';
import { AdhkarView } from './components/AdhkarView';
import { HijriCalendarView } from './components/HijriCalendarView';
import { DailyHadithCard } from './components/DailyHadithCard';
import { ScreensaverView } from './components/ScreensaverView';
import { WidgetSimulator } from './components/WidgetSimulator';
import { HistoryBrowser } from './components/HistoryBrowser';
import { SearchLibrary } from './components/SearchLibrary';
import { FavoritesView } from './components/FavoritesView';
import { PrayerTimesView } from './components/PrayerTimesView';
import { DailyReminderModal } from './components/DailyReminderModal';
import { VerificationModal } from './components/VerificationModal';
import { NativeIntegrationGuide } from './components/NativeIntegrationGuide';
import { PhoneSimulator } from './components/PhoneSimulator';
import {
  Sparkles,
  Smartphone,
  Moon,
  Search,
  Calendar,
  Bookmark,
  Bell,
  ShieldCheck,
  Code2,
  Layout,
  Clock,
  Building2,
  Heart,
  Sun,
  Tv
} from 'lucide-react';

const REMINDER_SENT_KEY = 'daily_hadith_reminder_last_sent_v1';

type Tab =
  | 'mobile-phone'
  | 'today'
  | 'prayer'
  | 'names-of-allah'
  | 'adhkar'
  | 'calendar'
  | 'widgets'
  | 'library'
  | 'history'
  | 'favorites'
  | 'native';

export function App() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [dailySelection, setDailySelection] = useState<DailySelection>(getDailyHadith(currentDate));
  const [activeTab, setActiveTab] = useState<Tab>('mobile-phone');
  const [activeHadithOverride, setActiveHadithOverride] = useState<Hadith | null>(null);

  const [favorites, setFavorites] = useState<FavoriteItem[]>(getFavorites());
  const [reminderConfig, setReminderConfig] = useState<ReminderConfig>(getReminderConfig());
  const [appTheme, setAppTheme] = useState<'dark' | 'light'>(getAppTheme());

  const [isScreensaverOpen, setIsScreensaverOpen] = useState(false);
  const [isTvDisplayOpen, setIsTvDisplayOpen] = useState(false);
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [textSize, setTextSize] = useState<'normal' | 'large'>('normal');

  // Prayer times & Global Auto-Azan state
  const [selectedMosque, setSelectedMosque] = useState<Mosque>(getSelectedMosque());
  const [prayerData, setPrayerData] = useState<PrayerTimesResult>(
    calculateMosquePrayerTimes(selectedMosque, new Date())
  );
  const [showGlobalAzanModal, setShowGlobalAzanModal] = useState(false);
  const [globalAzanPrayer, setGlobalAzanPrayer] = useState({ name: 'Fajr', time: '05:00 AM' });

  // Keep the global watcher on whichever mosque was last selected anywhere in the app
  useEffect(() => {
    const syncMosque = () => setSelectedMosque(getSelectedMosque());
    window.addEventListener(MOSQUE_CHANGE_EVENT, syncMosque);
    return () => window.removeEventListener(MOSQUE_CHANGE_EVENT, syncMosque);
  }, []);

  // Global Prayer Watcher and Auto-Azan (the only auto-Azan trigger in the app)
  useEffect(() => {
    const timer = setInterval(() => {
      const currentResult = calculateMosquePrayerTimes(selectedMosque, new Date());
      setPrayerData(currentResult);

      const azanSettings = getAzanSettings();
      const duePrayer = azanSettings.autoAzanEnabled ? getDuePrayer(currentResult) : null;
      if (duePrayer && claimAzanTrigger(`${currentResult.localDateKey}_${duePrayer.name}`)) {
        setGlobalAzanPrayer(duePrayer);
        setShowGlobalAzanModal(true);

        playAzan(undefined, () => {}, azanSettings.selectedMuezzin);

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`Allahu Akbar • Time for ${duePrayer.name} Prayer`, {
            body: `Prayer time has arrived at ${selectedMosque.name} (${selectedMosque.suburb}).`,
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="%23d4af37"/></svg>'
          });
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedMosque]);

  // Daily Hadith reminder notification
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
      new Notification('Daily Hadith Reminder', {
        body: today.excerpt.length > 180 ? `${today.excerpt.slice(0, 177)}...` : today.excerpt,
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35" fill="%23d9ab3d"/></svg>'
      });
    }, 15000);

    return () => clearInterval(timer);
  }, []);

  // Sync daily selection when date rolls over
  useEffect(() => {
    const checkDateChange = () => {
      const now = new Date();
      if (formatDateKey(now) !== dailySelection.dateString) {
        setCurrentDate(now);
        setDailySelection(getDailyHadith(now));
      }
    };
    const timer = setInterval(checkDateChange, 30000);
    return () => clearInterval(timer);
  }, [dailySelection.dateString]);

  const activeHadith = activeHadithOverride || dailySelection.hadith;
  const isCurrentHadithFav = isFavorite(activeHadith.id);

  const handleToggleFavorite = (targetHadith: Hadith = activeHadith) => {
    if (isFavorite(targetHadith.id)) {
      removeFavorite(targetHadith.id);
    } else {
      saveFavorite({
        hadithId: targetHadith.id,
        hadith: targetHadith,
        savedAt: new Date().toISOString()
      });
    }
    setFavorites(getFavorites());
  };

  const handleSelectHadithFromAnywhere = (hadith: Hadith) => {
    setActiveHadithOverride(hadith);
    setActiveTab('today');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetToToday = () => {
    setActiveHadithOverride(null);
    const now = new Date();
    setCurrentDate(now);
    setDailySelection(getDailyHadith(now));
  };

  return (
    <div className={`min-h-screen flex flex-col ${appTheme === 'dark' ? 'bg-[#080a0f] text-neutral-100' : 'bg-neutral-100 text-neutral-900'} transition-colors`}>
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0c0e16]/90 backdrop-blur-lg px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo & Branding with new custom AppLogo */}
          <div
            onClick={resetToToday}
            className="flex items-center space-x-3.5 cursor-pointer group"
          >
            <AppLogo size={42} glow={true} className="group-hover:scale-105 transition-transform" />
            <div>
              <div className="font-serif text-xl md:text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
                <span>Daily Hadith & Azan</span>
                <span className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                  Sahih al-Bukhari
                </span>
              </div>
              <div className="text-[11px] font-sans text-neutral-400 flex items-center space-x-2">
                <span>100% Verified Dataset</span>
                <span>•</span>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab('prayer');
                  }}
                  className="text-amber-400 hover:underline cursor-pointer flex items-center space-x-1"
                >
                  <Clock className="w-3 h-3" />
                  <span>Next: {prayerData.nextPrayer.name} {prayerData.nextPrayer.time} ({prayerData.nextPrayer.remainingFormatted})</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Badges */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsTvDisplayOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition cursor-pointer"
              title="Launch Smart TV & Big Screen Landscape Mode"
            >
              <Tv className="w-4 h-4" />
              <span className="hidden sm:inline">TV / Big Screen Mode</span>
              <span className="sm:hidden">TV</span>
            </button>

            <button
              onClick={() => setActiveTab(activeTab === 'mobile-phone' ? 'today' : 'mobile-phone')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold shadow-md transition cursor-pointer ${
                activeTab === 'mobile-phone'
                  ? 'bg-amber-500 text-neutral-950 border-amber-400 font-bold'
                  : 'bg-white/5 hover:bg-white/10 text-amber-300 border-amber-500/30'
              }`}
              title="Toggle Mobile Phone Simulator"
            >
              <Smartphone className="w-4 h-4" />
              <span>Mobile View</span>
            </button>

            <button
              onClick={() => setIsScreensaverOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 border border-amber-500/30 text-amber-300 text-xs font-semibold shadow-md transition cursor-pointer"
              title="Peaceful Full-Screen Screensaver"
            >
              <Moon className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Screensaver</span>
            </button>

            <button
              onClick={() => setIsReminderOpen(true)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-amber-300 border border-white/5 transition cursor-pointer"
              title="Daily Reminder Settings"
            >
              <Bell className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsVerificationOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-medium transition cursor-pointer"
              title="Verification & Accuracy Suite"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="hidden md:inline">Source Verified</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tab Bar */}
      <nav className="border-b border-white/5 bg-[#090b11] px-4">
        <div className="max-w-7xl mx-auto flex items-center space-x-1 overflow-x-auto py-2 scrollbar-none">
          {[
            { id: 'mobile-phone', label: '📱 Mobile Experience', icon: Smartphone },
            { id: 'today', label: "Today's Hadith", icon: Sparkles },
            { id: 'prayer', label: '🕌 Prayer Times (Awqat)', icon: Clock },
            { id: 'names-of-allah', label: '✨ 99 Names of Allah', icon: Heart },
            { id: 'adhkar', label: '🛡️ Daily Adhkar', icon: ShieldCheck },
            { id: 'calendar', label: '📅 Hijri & Fasting', icon: Calendar },
            { id: 'widgets', label: 'Mobile Widgets Preview', icon: Layout },
            { id: 'library', label: 'Library (6,720)', icon: Search },
            { id: 'history', label: 'Daily Archive', icon: Calendar },
            { id: 'favorites', label: `Favourites (${favorites.length})`, icon: Bookmark },
            { id: 'native', label: 'Native Code (Swift / Kotlin)', icon: Code2 }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as Tab);
                  if (tab.id === 'today') setActiveHadithOverride(null);
                }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-neutral-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main View Area */}
      <main className="flex-1 w-full flex flex-col items-center">
        {activeTab === 'mobile-phone' && (
          <div className="w-full flex-1 py-4">
            <PhoneSimulator />
          </div>
        )}

        {activeTab === 'today' && (
          <div className="max-w-5xl mx-auto w-full px-4 py-8 space-y-6 animate-fade-in">
            {activeHadithOverride && (
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
                <span>Viewing selected Hadith from Archive/Library</span>
                <button
                  onClick={resetToToday}
                  className="font-bold underline hover:text-white cursor-pointer"
                >
                  Return to Today&apos;s Hadith
                </button>
              </div>
            )}

            {/* Typography Scaler Toolbar */}
            <div className="flex items-center justify-between text-xs text-neutral-400 px-2">
              <span className="font-sans">
                {activeHadithOverride ? 'Selected Hadith' : `Device Date: ${dailySelection.dateString}`}
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-neutral-500">Text Size:</span>
                <button
                  onClick={() => setTextSize('normal')}
                  className={`px-2 py-0.5 rounded text-xs cursor-pointer ${textSize === 'normal' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-neutral-400'}`}
                >
                  Regular
                </button>
                <button
                  onClick={() => setTextSize('large')}
                  className={`px-2 py-0.5 rounded text-xs cursor-pointer ${textSize === 'large' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-neutral-400'}`}
                >
                  Large
                </button>
              </div>
            </div>

            {/* Daily Hadith Hero Card */}
            <DailyHadithCard
              hadith={activeHadith}
              isFav={isCurrentHadithFav}
              onToggleFav={() => handleToggleFavorite(activeHadith)}
              dateLabel={dailySelection.dateString}
              hijriDate={dailySelection.hijriDate}
              onOpenScreensaver={() => setIsScreensaverOpen(true)}
              textSize={textSize}
            />

            {/* Quick Feature Highlights Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
              <div
                onClick={() => setActiveTab('prayer')}
                className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-neutral-900/40 border border-emerald-500/30 hover:border-emerald-400/50 transition cursor-pointer space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <Clock className="w-5 h-5 text-emerald-400" />
                  <span className="text-[10px] text-emerald-400/80 font-mono">Awqat</span>
                </div>
                <h4 className="font-serif text-base font-semibold text-neutral-200 group-hover:text-emerald-300 transition">
                  Prayer Times & Azan
                </h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Next: {prayerData.nextPrayer.name} at {prayerData.nextPrayer.time}
                </p>
              </div>

              <div
                onClick={() => setActiveTab('names-of-allah')}
                className="p-5 rounded-2xl bg-neutral-900/40 border border-white/5 hover:border-amber-500/30 transition cursor-pointer space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <Heart className="w-5 h-5 text-amber-400" />
                  <span className="text-[10px] text-amber-400/80 font-mono">99 Names</span>
                </div>
                <h4 className="font-serif text-base font-semibold text-neutral-200 group-hover:text-amber-300 transition">
                  Asma-ul-Husna
                </h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Audio recitation & meanings of Allah&apos;s Divine Names.
                </p>
              </div>

              <div
                onClick={() => setActiveTab('adhkar')}
                className="p-5 rounded-2xl bg-neutral-900/40 border border-white/5 hover:border-amber-500/30 transition cursor-pointer space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <ShieldCheck className="w-5 h-5 text-sky-400" />
                  <span className="text-[10px] text-sky-400/80 font-mono">Adhkar</span>
                </div>
                <h4 className="font-serif text-base font-semibold text-neutral-200 group-hover:text-sky-300 transition">
                  Morning & Evening
                </h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Hisn al-Muslim supplications with tap-to-count circles.
                </p>
              </div>

              <div
                onClick={() => setActiveTab('calendar')}
                className="p-5 rounded-2xl bg-neutral-900/40 border border-white/5 hover:border-amber-500/30 transition cursor-pointer space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <Calendar className="w-5 h-5 text-amber-400" />
                  <span className="text-[10px] text-neutral-500">Hijri</span>
                </div>
                <h4 className="font-serif text-base font-semibold text-neutral-200 group-hover:text-amber-300 transition">
                  Fasting Calendar
                </h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Sunnah White Days (Ayyam al-Beed) & Islamic occasions.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'prayer' && (
          <div className="max-w-5xl mx-auto w-full px-4 py-8">
            <PrayerTimesView onMosqueChange={(m) => setSelectedMosque(m)} />
          </div>
        )}

        {activeTab === 'names-of-allah' && (
          <div className="max-w-5xl mx-auto w-full px-4 py-8">
            <NamesOfAllahView />
          </div>
        )}

        {activeTab === 'adhkar' && (
          <div className="max-w-5xl mx-auto w-full px-4 py-8">
            <AdhkarView />
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="max-w-5xl mx-auto w-full px-4 py-8">
            <HijriCalendarView />
          </div>
        )}

        {activeTab === 'widgets' && (
          <div className="max-w-5xl mx-auto w-full px-4 py-8">
            <WidgetSimulator
              hadith={dailySelection.hadith}
              dateString={dailySelection.dateString}
              hijriDate={dailySelection.hijriDate}
              onSelectHadith={handleSelectHadithFromAnywhere}
            />
          </div>
        )}

        {activeTab === 'library' && (
          <div className="max-w-5xl mx-auto w-full px-4 py-8">
            <SearchLibrary
              onSelectHadith={handleSelectHadithFromAnywhere}
              onToggleFavorite={handleToggleFavorite}
              isFavorited={(id) => isFavorite(id)}
            />
          </div>
        )}

        {activeTab === 'history' && (
          <div className="max-w-5xl mx-auto w-full px-4 py-8">
            <HistoryBrowser
              onSelectHadith={(h) => handleSelectHadithFromAnywhere(h)}
              currentDateStr={dailySelection.dateString}
            />
          </div>
        )}

        {activeTab === 'favorites' && (
          <div className="max-w-5xl mx-auto w-full px-4 py-8">
            <FavoritesView
              favorites={favorites}
              onRemoveFavorite={(id) => {
                removeFavorite(id);
                setFavorites(getFavorites());
              }}
              onSelectHadith={handleSelectHadithFromAnywhere}
            />
          </div>
        )}

        {activeTab === 'native' && (
          <div className="max-w-5xl mx-auto w-full px-4 py-8">
            <NativeIntegrationGuide />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#08090e] py-6 px-4 text-center text-xs text-neutral-500 space-y-2">
        <div>
          Daily Hadith • Sahih al-Bukhari (M. Muhsin Khan Translation) & Prayer Times via <a href="https://www.awqat.com.au/" target="_blank" rel="noopener noreferrer" className="underline text-emerald-400">Awqat.com.au</a>
        </div>
        <div className="text-[11px] text-neutral-600">
          Source PDF: <a href="https://d1.islamhouse.com/data/en/ih_books/single/en_Sahih_Al-Bukhari.pdf" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-400">IslamHouse 1,700-page verified edition</a>
        </div>
      </footer>

      {/* Full-Screen Smart TV & Big Screen Landscape View */}
      {isTvDisplayOpen && (
        <SmartTvDisplayView onClose={() => setIsTvDisplayOpen(false)} />
      )}

      {/* Full-Screen Ambient Screensaver View */}
      {isScreensaverOpen && (
        <ScreensaverView
          hadith={activeHadith}
          hijriDate={dailySelection.hijriDate}
          onClose={() => setIsScreensaverOpen(false)}
        />
      )}

      {/* Daily Reminder Settings Modal */}
      <DailyReminderModal
        config={reminderConfig}
        isOpen={isReminderOpen}
        onClose={() => setIsReminderOpen(false)}
        onUpdateConfig={(cfg) => setReminderConfig(cfg)}
      />

      {/* Accuracy & Verification Suite Modal */}
      <VerificationModal
        isOpen={isVerificationOpen}
        onClose={() => setIsVerificationOpen(false)}
      />

      {/* Global Live Azan Modal */}
      <AzanLiveModal
        isOpen={showGlobalAzanModal}
        prayerName={globalAzanPrayer.name}
        prayerTime={globalAzanPrayer.time}
        mosque={selectedMosque}
        onClose={() => {
          setShowGlobalAzanModal(false);
          stopAzan();
        }}
      />
    </div>
  );
}

export default App;
