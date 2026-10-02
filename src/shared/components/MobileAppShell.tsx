import React, { useState, useEffect } from 'react';
import { Hadith, DailySelection, FavoriteItem, ReminderConfig } from '../types/hadith';
import { getDailyHadith } from '../utils/dailyEngine';
import {
  getFavorites,
  saveFavorite,
  removeFavorite,
  isFavorite,
  getReminderConfig
} from '../utils/storage';
import {
  Mosque,
  PrayerTimesResult,
  calculateMosquePrayerTimes,
  getSelectedMosque
} from '../utils/prayerTimes';
import { AppLogo } from './AppLogo';
import { NamesOfAllahView } from './NamesOfAllahView';
import { AdhkarView } from './AdhkarView';
import { HijriCalendarView } from './HijriCalendarView';
import { DailyHadithCard } from './DailyHadithCard';
import { HistoryBrowser } from './HistoryBrowser';
import { SearchLibrary } from './SearchLibrary';
import { FavoritesView } from './FavoritesView';
import { PrayerTimesView } from './PrayerTimesView';
import { DailyReminderModal } from './DailyReminderModal';
import { VerificationModal } from './VerificationModal';
import {
  Sparkles,
  Search,
  Calendar,
  Bookmark,
  Moon,
  Bell,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Clock,
  Heart
} from 'lucide-react';
import { speakHadith, stopSpeaking, isSpeaking } from '../utils/speech';

export type MobileTab = 'today' | 'prayer' | 'names' | 'adhkar' | 'calendar' | 'library' | 'history' | 'favorites';

interface MobileAppShellProps {
  onOpenScreensaver: () => void;
  onHadithPlayStatusChange?: (isPlaying: boolean, hadithTitle: string) => void;
  initialHadith?: Hadith | null;
}

export const MobileAppShell: React.FC<MobileAppShellProps> = ({
  onOpenScreensaver,
  onHadithPlayStatusChange,
  initialHadith
}) => {
  const [dayOffset, setDayOffset] = useState(0);
  const [activeTab, setActiveTab] = useState<MobileTab>('today');
  const [activeHadithOverride, setActiveHadithOverride] = useState<Hadith | null>(initialHadith || null);
  const [favorites, setFavorites] = useState<FavoriteItem[]>(getFavorites());
  const [reminderConfig, setReminderConfig] = useState<ReminderConfig>(getReminderConfig());
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Prayer time tracking
  const [selectedMosque, setSelectedMosque] = useState<Mosque>(getSelectedMosque());
  const [prayerData, setPrayerData] = useState<PrayerTimesResult>(
    calculateMosquePrayerTimes(selectedMosque, new Date())
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setPrayerData(calculateMosquePrayerTimes(selectedMosque, new Date()));
    }, 1000);
    return () => clearInterval(timer);
  }, [selectedMosque]);

  const computeSelectedDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    return d;
  };

  const selectedDate = computeSelectedDate();
  const currentDailySelection: DailySelection = getDailyHadith(selectedDate);
  const displayedHadith = activeHadithOverride || currentDailySelection.hadith;
  const isFav = isFavorite(displayedHadith.id);

  useEffect(() => {
    if (initialHadith) {
      setActiveHadithOverride(initialHadith);
      setActiveTab('today');
    }
  }, [initialHadith]);

  const handleToggleFavorite = (target: Hadith = displayedHadith) => {
    if (isFavorite(target.id)) {
      removeFavorite(target.id);
    } else {
      saveFavorite({
        hadithId: target.id,
        hadith: target,
        savedAt: new Date().toISOString()
      });
    }
    setFavorites(getFavorites());
  };

  const handleAudioToggle = () => {
    if (isPlayingAudio || isSpeaking()) {
      stopSpeaking();
      setIsPlayingAudio(false);
      if (onHadithPlayStatusChange) onHadithPlayStatusChange(false, '');
    } else {
      setIsPlayingAudio(true);
      const title = `Bukhari #${displayedHadith.hadithNumber} • ${displayedHadith.narrator || 'Hadith'}`;
      if (onHadithPlayStatusChange) onHadithPlayStatusChange(true, title);
      speakHadith(
        displayedHadith.narrator,
        displayedHadith.text,
        () => {
          setIsPlayingAudio(true);
          if (onHadithPlayStatusChange) onHadithPlayStatusChange(true, title);
        },
        () => {
          setIsPlayingAudio(false);
          if (onHadithPlayStatusChange) onHadithPlayStatusChange(false, '');
        }
      );
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || activeTab !== 'today') return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > 55) {
      if (diff > 0) {
        if (dayOffset < 0) {
          setActiveHadithOverride(null);
          setDayOffset((prev) => prev + 1);
        }
      } else {
        setActiveHadithOverride(null);
        setDayOffset((prev) => prev - 1);
      }
    }
    setTouchStartX(null);
  };

  const handleSelectHadith = (hadith: Hadith) => {
    setActiveHadithOverride(hadith);
    setActiveTab('today');
  };

  const isToday = dayOffset === 0 && !activeHadithOverride;

  return (
    <div
      className="w-full h-full flex flex-col bg-[#090b10] text-neutral-100 overflow-hidden select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Mobile Top App Header */}
      <header className="shrink-0 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2.5 bg-[#0e111a]/95 border-b border-white/10 backdrop-blur-md flex items-center justify-between z-30">
        <div
          onClick={() => {
            setDayOffset(0);
            setActiveHadithOverride(null);
            setActiveTab('today');
          }}
          className="flex items-center space-x-2.5 cursor-pointer"
        >
          <AppLogo size={34} glow={false} />
          <div>
            <div className="font-serif text-base font-bold text-white leading-tight flex items-center space-x-1.5">
              <span>Daily Hadith</span>
            </div>
            {/* Quick Next Prayer Pill */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab('prayer');
              }}
              className="text-[10px] font-sans text-amber-300 font-semibold flex items-center space-x-1 hover:underline cursor-pointer"
            >
              <Clock className="w-2.5 h-2.5 text-amber-400" />
              <span>{prayerData.nextPrayer.name} {prayerData.nextPrayer.time} ({prayerData.nextPrayer.remainingFormatted})</span>
            </div>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={handleAudioToggle}
            className={`p-2 rounded-xl transition ${
              isPlayingAudio
                ? 'bg-amber-500 text-neutral-950 ring-2 ring-amber-500/40 animate-pulse'
                : 'bg-white/5 hover:bg-white/10 text-neutral-300'
            }`}
            title="Listen to Hadith"
          >
            {isPlayingAudio ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onOpenScreensaver}
            className="p-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-300 border border-amber-500/30"
            title="Screensaver"
          >
            <Moon className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsReminderOpen(true)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300"
            title="Reminder Settings"
          >
            <Bell className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsVerificationOpen(true)}
            className="p-2 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
            title="Verification Suite"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </button>
        </div>
      </header>

      {/* Main Scrollable View Area */}
      <main className="flex-1 overflow-y-auto px-3.5 py-4 space-y-4 scrollbar-none overscroll-contain">
        {activeTab === 'today' && (
          <div className="space-y-3.5 animate-fade-in">
            {/* Day Navigation Bar */}
            <div className="flex items-center justify-between px-2 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs">
              <button
                onClick={() => {
                  setActiveHadithOverride(null);
                  setDayOffset((p) => p - 1);
                }}
                className="flex items-center space-x-1 text-neutral-400 hover:text-amber-300 px-2 py-1 rounded-lg hover:bg-white/5 transition"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev Day</span>
              </button>

              <div className="text-center font-sans">
                {isToday ? (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] tracking-wider uppercase">
                    Today
                  </span>
                ) : (
                  <span className="text-xs text-amber-300 font-medium">
                    {selectedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>

              <button
                onClick={() => {
                  if (dayOffset < 0) {
                    setActiveHadithOverride(null);
                    setDayOffset((p) => p + 1);
                  }
                }}
                disabled={dayOffset >= 0 && !activeHadithOverride}
                className="flex items-center space-x-1 text-neutral-400 hover:text-amber-300 px-2 py-1 rounded-lg hover:bg-white/5 transition disabled:opacity-25 disabled:cursor-not-allowed"
              >
                <span>Next Day</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Daily Hadith Main Card */}
            <DailyHadithCard
              hadith={displayedHadith}
              isFav={isFav}
              onToggleFav={() => handleToggleFavorite(displayedHadith)}
              dateLabel={currentDailySelection.dateString}
              hijriDate={currentDailySelection.hijriDate}
              onOpenScreensaver={onOpenScreensaver}
            />

            {/* Quick Banner: Prayer Times at Closest Mosque */}
            <div
              onClick={() => setActiveTab('prayer')}
              className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-neutral-900 to-[#101420] border border-emerald-500/30 hover:border-emerald-400/50 transition cursor-pointer flex items-center justify-between shadow-lg"
            >
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 font-bold">
                  🕌
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-neutral-100 flex items-center space-x-1.5">
                    <span>Prayer Times (Awqat)</span>
                    <span className="text-[10px] text-amber-400 font-mono">
                      {prayerData.nextPrayer.name} {prayerData.nextPrayer.time}
                    </span>
                  </h4>
                  <p className="text-[10px] text-neutral-400 truncate max-w-[200px]">
                    {selectedMosque.name} ({selectedMosque.suburb})
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
        )}

        {activeTab === 'prayer' && (
          <PrayerTimesView onMosqueChange={(m) => setSelectedMosque(m)} />
        )}

        {activeTab === 'names' && (
          <NamesOfAllahView />
        )}

        {activeTab === 'adhkar' && (
          <AdhkarView />
        )}

        {activeTab === 'calendar' && (
          <HijriCalendarView />
        )}

        {activeTab === 'library' && (
          <SearchLibrary
            onSelectHadith={handleSelectHadith}
            onToggleFavorite={handleToggleFavorite}
            isFavorited={(id) => isFavorite(id)}
          />
        )}

        {activeTab === 'history' && (
          <HistoryBrowser
            onSelectHadith={(h) => handleSelectHadith(h)}
            currentDateStr={currentDailySelection.dateString}
          />
        )}

        {activeTab === 'favorites' && (
          <FavoritesView
            favorites={favorites}
            onRemoveFavorite={(id) => {
              removeFavorite(id);
              setFavorites(getFavorites());
            }}
            onSelectHadith={handleSelectHadith}
          />
        )}
      </main>

      {/* Persistent Mini Audio Bar if Reciting */}
      {isPlayingAudio && (
        <div className="shrink-0 px-4 py-2 bg-amber-500 text-neutral-950 flex items-center justify-between text-xs font-medium animate-pulse shadow-lg z-20">
          <div className="flex items-center space-x-2 truncate">
            <Volume2 className="w-4 h-4 shrink-0" />
            <span className="truncate">Reciting: Bukhari #{displayedHadith.hadithNumber}</span>
          </div>
          <button
            onClick={handleAudioToggle}
            className="px-2 py-0.5 rounded bg-black/20 text-neutral-950 font-bold hover:bg-black/30 cursor-pointer"
          >
            Stop
          </button>
        </div>
      )}

      {/* Native Mobile Bottom Navigation Bar */}
      <nav className="shrink-0 border-t border-white/10 bg-[#0b0d14]/98 backdrop-blur-xl px-1 py-1 flex items-center justify-around z-30 pb-[max(0.25rem,env(safe-area-inset-bottom))] overflow-x-auto scrollbar-none">
        {[
          { id: 'today', label: 'Today', icon: Sparkles },
          { id: 'prayer', label: 'Awqat', icon: Clock },
          { id: 'names', label: '99 Names', icon: Heart },
          { id: 'adhkar', label: 'Adhkar', icon: ShieldCheck },
          { id: 'calendar', label: 'Hijri', icon: Calendar },
          { id: 'library', label: 'Library', icon: Search },
          { id: 'favorites', label: `Saved (${favorites.length})`, icon: Bookmark }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as MobileTab);
                if (tab.id === 'today') setActiveHadithOverride(null);
              }}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
                isActive ? 'text-amber-400 font-bold scale-105' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-amber-400 stroke-[2.5]' : 'text-neutral-400'}`} />
              <span className="text-[9.5px] tracking-tight whitespace-nowrap">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Reminder Modal */}
      <DailyReminderModal
        config={reminderConfig}
        isOpen={isReminderOpen}
        onClose={() => setIsReminderOpen(false)}
        onUpdateConfig={(cfg) => setReminderConfig(cfg)}
      />

      {/* Verification Suite Modal */}
      <VerificationModal
        isOpen={isVerificationOpen}
        onClose={() => setIsVerificationOpen(false)}
      />
    </div>
  );
};
