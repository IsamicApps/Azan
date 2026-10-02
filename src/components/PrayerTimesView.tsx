import React, { useState, useEffect } from 'react';
import {
  Mosque,
  PrayerTimesResult,
  ALL_MOSQUES,
  calculateMosquePrayerTimes,
  getMosquesSortedByDistance,
  getSelectedMosque,
  saveSelectedMosque
} from '../utils/prayerTimes';
import {
  playAzan,
  stopAzan,
  isAzanPlaying,
  getAzanSettings,
  saveAzanSettings,
  AzanSettings,
  MUEZZIN_SOURCES,
  MuezzinId
} from '../utils/azanAudio';
import { IslamicPattern, IslamicCornerOrnament } from './IslamicPattern';
import { AzanLiveModal } from './AzanLiveModal';
import {
  Clock,
  Compass,
  MapPin,
  Volume2,
  VolumeX,
  ExternalLink,
  Navigation,
  Sparkles,
  ChevronRight,
  Search,
  Check,
  Building2,
  Calendar,
  Sliders,
  Play,
  Square,
  Radio
} from 'lucide-react';

interface PrayerTimesViewProps {
  onMosqueChange?: (mosque: Mosque) => void;
}

export const PrayerTimesView: React.FC<PrayerTimesViewProps> = ({ onMosqueChange }) => {
  const [selectedMosque, setSelectedMosque] = useState<Mosque>(getSelectedMosque());
  const [prayerData, setPrayerData] = useState<PrayerTimesResult>(
    calculateMosquePrayerTimes(selectedMosque, new Date())
  );
  const [azanSettings, setAzanSettings] = useState<AzanSettings>(getAzanSettings());
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isPlayingAzan, setIsPlayingAzan] = useState(false);
  const [currentlyPlayingMuezzin, setCurrentlyPlayingMuezzin] = useState<MuezzinId | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState<string>('ALL');
  const [showMosqueSelector, setShowMosqueSelector] = useState(false);
  const [showAzanLiveModal, setShowAzanLiveModal] = useState(false);
  const [activeAzanPrayer, setActiveAzanPrayer] = useState({ name: 'Asr', time: '03:43 PM' });

  // Update countdown every second and monitor automatic prayer time Azan trigger
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const currentResult = calculateMosquePrayerTimes(selectedMosque, now);
      setPrayerData(currentResult);
      const isPlaying = isAzanPlaying();
      setIsPlayingAzan(isPlaying);
      if (!isPlaying) setCurrentlyPlayingMuezzin(null);

      // AUTO-AZAN TRIGGER ENGINE:
      // Check if current minute matches any prayer time
      if (azanSettings.autoAzanEnabled) {
        const schedule = [
          { name: 'Fajr', time: currentResult.fajr },
          { name: 'Dhuhr', time: currentResult.dhuhr },
          { name: 'Asr', time: currentResult.asr },
          { name: 'Maghrib', time: currentResult.maghrib },
          { name: 'Isha', time: currentResult.isha }
        ];

        const currentTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        const dateKey = now.toISOString().split('T')[0];

        for (const prayer of schedule) {
          if (prayer.time.trim() === currentTimeStr.trim()) {
            const triggerKey = `${dateKey}_${prayer.name}`;
            if (azanSettings.lastPlayedPrayerKey !== triggerKey && !isAzanPlaying()) {
              const updated = { ...azanSettings, lastPlayedPrayerKey: triggerKey };
              setAzanSettings(updated);
              saveAzanSettings(updated);

              setActiveAzanPrayer({ name: prayer.name, time: prayer.time });
              setShowAzanLiveModal(true);
              setCurrentlyPlayingMuezzin(azanSettings.selectedMuezzin);
              playAzan(
                () => {
                  setIsPlayingAzan(true);
                  setCurrentlyPlayingMuezzin(azanSettings.selectedMuezzin);
                },
                () => {
                  setIsPlayingAzan(false);
                  setCurrentlyPlayingMuezzin(null);
                },
                azanSettings.selectedMuezzin
              );

              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(`Allahu Akbar • Time for ${prayer.name} Prayer`, {
                  body: `Prayer time has arrived at ${selectedMosque.name} (${selectedMosque.suburb}).`,
                  icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="%23d4af37"/></svg>'
                });
              }
            }
          }
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedMosque, azanSettings]);

  const handleFindClosestMosque = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;
        const sorted = getMosquesSortedByDistance(userLat, userLng);

        if (sorted.length > 0) {
          const closest = sorted[0];
          setSelectedMosque(closest);
          saveSelectedMosque(closest.id);
          setPrayerData(calculateMosquePrayerTimes(closest, new Date()));
          if (onMosqueChange) onMosqueChange(closest);
        }
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
        setLocationError('Could not retrieve GPS location. You can select your mosque manually below.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSelectMosque = (m: Mosque) => {
    setSelectedMosque(m);
    saveSelectedMosque(m.id);
    setPrayerData(calculateMosquePrayerTimes(m, new Date()));
    setShowMosqueSelector(false);
    if (onMosqueChange) onMosqueChange(m);
  };

  const handlePlayMuezzin = (muezzinId: MuezzinId) => {
    if (isPlayingAzan && currentlyPlayingMuezzin === muezzinId) {
      stopAzan();
      setIsPlayingAzan(false);
      setCurrentlyPlayingMuezzin(null);
      return;
    }

    setCurrentlyPlayingMuezzin(muezzinId);
    setActiveAzanPrayer({ name: prayerData.nextPrayer.name, time: prayerData.nextPrayer.time });
    setShowAzanLiveModal(true);

    playAzan(
      () => {
        setIsPlayingAzan(true);
        setCurrentlyPlayingMuezzin(muezzinId);
      },
      () => {
        setIsPlayingAzan(false);
        setCurrentlyPlayingMuezzin(null);
      },
      muezzinId
    );
  };

  const handleToggleCurrentAzan = () => {
    if (isPlayingAzan || isAzanPlaying()) {
      stopAzan();
      setIsPlayingAzan(false);
      setCurrentlyPlayingMuezzin(null);
    } else {
      handlePlayMuezzin(azanSettings.selectedMuezzin);
    }
  };

  const updateAzanSetting = (patch: Partial<AzanSettings>) => {
    const updated = { ...azanSettings, ...patch };
    setAzanSettings(updated);
    saveAzanSettings(updated);
  };

  const filteredMosques = ALL_MOSQUES.filter((m) => {
    if (selectedState !== 'ALL' && m.state !== selectedState) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.loc.toLowerCase().includes(q) ||
      m.suburb.toLowerCase().includes(q) ||
      m.area.toLowerCase().includes(q)
    );
  });

  const prayerCards = [
    { key: 'Fajr', name: 'Fajr', time: prayerData.fajr, icon: '🌅', offset: selectedMosque.iqamaOffsets?.Fajr || 25 },
    { key: 'Sunrise', name: 'Sunrise', time: prayerData.sunrise, icon: '☀️', offset: 0 },
    { key: 'Dhuhr', name: 'Dhuhr', time: prayerData.dhuhr, icon: '☀️', offset: selectedMosque.iqamaOffsets?.Dhuhr || 15 },
    { key: 'Asr', name: 'Asr', time: prayerData.asr, icon: '🌤️', offset: selectedMosque.iqamaOffsets?.Asr || 15 },
    { key: 'Maghrib', name: 'Maghrib', time: prayerData.maghrib, icon: '🌇', offset: selectedMosque.iqamaOffsets?.Maghrib || 5 },
    { key: 'Isha', name: 'Isha', time: prayerData.isha, icon: '🌙', offset: selectedMosque.iqamaOffsets?.Isha || 10 }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. TOP MOSQUE SELECTOR HERO BANNER */}
      <div className="relative rounded-3xl bg-gradient-to-b from-[#141926] via-[#0f121d] to-[#0a0c14] border border-amber-500/30 p-6 shadow-2xl overflow-hidden backdrop-blur-md">
        <IslamicPattern opacity={20} color="#d4af37" />
        <IslamicCornerOrnament className="absolute top-2 left-2 rotate-0 opacity-25" />
        <IslamicCornerOrnament className="absolute top-2 right-2 rotate-90 opacity-25" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold tracking-wide uppercase">
                <Building2 className="w-3.5 h-3.5" />
                <span>Selected Mosque (Awqat.com.au)</span>
              </span>
              <span className="text-xs text-amber-300/80 font-medium">
                {selectedMosque.state}
              </span>
            </div>

            <h3 className="font-serif text-2xl md:text-3xl font-bold text-white tracking-tight">
              {selectedMosque.name}
            </h3>

            <p className="text-xs md:text-sm text-neutral-300 flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{selectedMosque.address}</span>
            </p>
          </div>

          {/* Action Buttons: Closest Mosque & Change Mosque */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleFindClosestMosque}
              disabled={isLocating}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-neutral-950 font-semibold text-xs shadow-lg transition disabled:opacity-50"
            >
              <Navigation className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Locating...' : 'Closest Mosque (GPS)'}</span>
            </button>

            <button
              onClick={() => setShowMosqueSelector(!showMosqueSelector)}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-neutral-100 text-xs font-medium border border-white/10 transition"
            >
              {showMosqueSelector ? 'Close Directory' : 'Change Mosque'}
            </button>

            <a
              href={selectedMosque.link}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-amber-300 border border-white/5 transition"
              title="View on Awqat.com.au"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {locationError && (
          <div className="mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
            {locationError}
          </div>
        )}
      </div>

      {/* 2. SEARCHABLE MOSQUE DIRECTORY DRAWER */}
      {showMosqueSelector && (
        <div className="p-6 rounded-3xl bg-[#11131c] border border-amber-500/30 space-y-4 animate-fade-in shadow-2xl">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by mosque name, suburb, or area (e.g. Footscray, Tarneit, Melbourne)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* State Filter */}
            <div className="flex space-x-1 overflow-x-auto pb-1">
              {['ALL', 'VIC', 'NSW', 'QLD', 'WA', 'SA', 'TAS', 'ACT'].map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedState(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    selectedState === st
                      ? 'bg-amber-500 text-neutral-950 font-bold'
                      : 'bg-white/5 text-neutral-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
            {filteredMosques.map((m) => {
              const isSelected = m.id === selectedMosque.id;
              return (
                <div
                  key={m.id}
                  onClick={() => handleSelectMosque(m)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-400 shadow-md'
                      : 'bg-neutral-900/60 hover:bg-neutral-900/90 border-white/5 hover:border-amber-500/30'
                  }`}
                >
                  <div className="space-y-1 truncate pr-2">
                    <div className="font-semibold text-sm text-white truncate flex items-center space-x-2">
                      <span>{m.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-neutral-300 font-mono">
                        {m.state}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-400 truncate">{m.suburb}, {m.state}</div>
                    <div className="text-[11px] text-amber-300/80">Jumu&apos;ah: {m.jumuah}</div>
                  </div>

                  <div className="shrink-0 flex items-center space-x-2">
                    {m.distanceKm !== undefined && (
                      <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">
                        {m.distanceKm} km
                      </span>
                    )}
                    {isSelected ? (
                      <Check className="w-5 h-5 text-amber-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-neutral-500" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. NEXT PRAYER & AZAN AUTO-PLAY CONTROLS */}
      <div className="relative rounded-3xl bg-gradient-to-r from-amber-600/20 via-[#181a26] to-[#10131e] border border-amber-500/40 p-6 md:p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
        <IslamicPattern opacity={15} color="#d4af37" />

        <div className="relative z-10 space-y-2 text-center md:text-left">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5" />
            <span>Next Prayer (Awqat.com.au)</span>
          </div>

          <h2 className="font-serif text-3xl md:text-5xl font-bold text-white">
            {prayerData.nextPrayer.name} at {prayerData.nextPrayer.time}
          </h2>

          <p className="text-xs md:text-sm text-neutral-300">
            {selectedMosque.name} • {prayerData.nextPrayer.iqamaTime ? `Iqamah: ${prayerData.nextPrayer.iqamaTime}` : 'Prayer Time'}
          </p>

          {/* Auto-Azan Live Status */}
          <div className="pt-2 flex items-center justify-center md:justify-start space-x-2 text-xs">
            <span className={`inline-block w-2 h-2 rounded-full ${azanSettings.autoAzanEnabled ? 'bg-emerald-400 animate-ping' : 'bg-neutral-500'}`} />
            <span className="text-neutral-300">
              {azanSettings.autoAzanEnabled
                ? `Auto-Azan enabled (${MUEZZIN_SOURCES[azanSettings.selectedMuezzin]?.name})`
                : 'Auto Azan is paused'}
            </span>
          </div>
        </div>

        {/* Big Countdown Timer & Azan Audio Actions */}
        <div className="relative z-10 flex flex-col items-center space-y-3 w-full md:w-auto">
          <div className="p-4 px-6 rounded-2xl bg-black/60 border border-amber-500/30 text-center shadow-inner w-full">
            <div className="text-[11px] uppercase tracking-widest text-neutral-400 font-semibold">
              Time Remaining
            </div>
            <div className="text-2xl md:text-3xl font-mono font-bold text-amber-300 mt-1">
              {prayerData.nextPrayer.remainingFormatted}
            </div>
          </div>

          {/* Play / Stop Azan Button */}
          <button
            onClick={handleToggleCurrentAzan}
            className={`w-full flex items-center justify-center space-x-2 py-3 px-5 rounded-2xl font-sans text-xs font-bold shadow-lg transition-all cursor-pointer ${
              isPlayingAzan
                ? 'bg-amber-500 text-neutral-950 ring-4 ring-amber-500/40 animate-pulse'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950'
            }`}
          >
            {isPlayingAzan ? <Square className="w-4 h-4 fill-current" /> : <Volume2 className="w-4 h-4" />}
            <span>{isPlayingAzan ? 'Stop Playing Azan' : `Play Azan (${MUEZZIN_SOURCES[azanSettings.selectedMuezzin]?.name})`}</span>
          </button>
        </div>
      </div>

      {/* 4. AUTHENTIC VOCAL MUEZZIN SOUND SELECTOR & PREVIEW */}
      <div className="p-6 rounded-3xl bg-[#11131c] border border-white/10 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            <div>
              <h4 className="font-serif text-lg font-semibold text-white">
                Authentic Vocal Muezzin Recordings
              </h4>
              <p className="text-xs text-neutral-400">
                Choose the Muezzin voice that will play at prayer times (Powered by Islamic Network API)
              </p>
            </div>
          </div>

          {/* Auto Azan Toggle */}
          <label className="flex items-center space-x-2 bg-black/40 px-3.5 py-2 rounded-xl border border-white/10 cursor-pointer self-start">
            <span className="text-xs font-semibold text-neutral-200">Auto-Play on Prayer Time</span>
            <input
              type="checkbox"
              checked={azanSettings.autoAzanEnabled}
              onChange={(e) => updateAzanSetting({ autoAzanEnabled: e.target.checked })}
              className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
            />
          </label>
        </div>

        {/* Muezzin Reciters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {(Object.keys(MUEZZIN_SOURCES) as MuezzinId[]).map((mId) => {
            const m = MUEZZIN_SOURCES[mId];
            const isSelected = azanSettings.selectedMuezzin === mId;
            const isPlayingThis = isPlayingAzan && currentlyPlayingMuezzin === mId;

            return (
              <div
                key={mId}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-400 shadow-md ring-1 ring-amber-500/30'
                    : 'bg-neutral-900/60 hover:bg-neutral-900/90 border-white/5'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                      <span>{m.name}</span>
                    </span>
                    {isSelected && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500 text-neutral-950 font-bold uppercase">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-amber-300/80 font-medium truncate">{m.subtitle}</p>
                  <p className="text-[10px] text-neutral-400 truncate">{m.location}</p>
                </div>

                <div className="flex items-center space-x-2 pt-2 border-t border-white/5">
                  <button
                    onClick={() => updateAzanSetting({ selectedMuezzin: mId })}
                    className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-medium transition ${
                      isSelected
                        ? 'bg-amber-500 text-neutral-950 font-bold'
                        : 'bg-white/5 hover:bg-white/10 text-neutral-300'
                    }`}
                  >
                    {isSelected ? 'Selected' : 'Set as Default'}
                  </button>

                  <button
                    onClick={() => handlePlayMuezzin(mId)}
                    className={`p-2 rounded-lg transition ${
                      isPlayingThis
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                    title={isPlayingThis ? 'Stop' : 'Listen / Test Voice'}
                  >
                    {isPlayingThis ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. DAILY PRAYER TIMETABLE GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {prayerCards.map((p) => {
          const isCurrent = prayerData.currentPrayer === p.name;
          const isNext = prayerData.nextPrayer.name === p.name;

          return (
            <div
              key={p.name}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-2 text-center ${
                isNext
                  ? 'bg-gradient-to-b from-amber-500/25 via-[#1a1e2c] to-[#121520] border-amber-400 ring-2 ring-amber-500/30 shadow-xl scale-[1.02]'
                  : isCurrent
                  ? 'bg-neutral-900/80 border-emerald-500/40'
                  : 'bg-[#11131c]/70 border-white/5 hover:border-white/15'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="text-base">{p.icon}</span>
                {isNext && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-neutral-950 font-extrabold text-[9px] uppercase tracking-wider">
                    Next
                  </span>
                )}
              </div>

              <div className="space-y-0.5">
                <div className="font-semibold text-xs text-neutral-300">{p.name}</div>
                <div className="font-mono text-base md:text-lg font-bold text-white">{p.time}</div>
              </div>

              <div className="pt-2 border-t border-white/5 text-[10px] text-neutral-400">
                {p.offset > 0 ? `Iqamah +${p.offset}m` : 'Sun Transit'}
              </div>
            </div>
          );
        })}
      </div>

      {/* 6. JUMU'AH & QIBLA EXTRA INFO CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Friday Jumu'ah Card */}
        <div className="p-5 rounded-3xl bg-[#11131c] border border-white/10 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6 text-amber-400" />
          </div>
          <div className="space-y-1">
            <h4 className="font-semibold text-sm text-white">Friday Jumu&apos;ah Prayers</h4>
            <p className="text-xs text-neutral-300">{selectedMosque.jumuah}</p>
            <p className="text-[11px] text-neutral-500">{selectedMosque.name}</p>
          </div>
        </div>

        {/* Qibla Direction Compass Card */}
        <div className="p-5 rounded-3xl bg-[#11131c] border border-white/10 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
            <Compass className="w-6 h-6 text-sky-400" />
          </div>
          <div className="space-y-1">
            <h4 className="font-semibold text-sm text-white">Qibla Direction (Makkah)</h4>
            <p className="text-xs text-sky-300 font-mono font-bold">
              {prayerData.qiblaBearing}° from North (North-West)
            </p>
            <p className="text-[11px] text-neutral-500">Calculated from {selectedMosque.loc}</p>
          </div>
        </div>
      </div>

      {/* LIVE AZAN PRAYER MODAL */}
      <AzanLiveModal
        isOpen={showAzanLiveModal}
        prayerName={activeAzanPrayer.name}
        prayerTime={activeAzanPrayer.time}
        mosque={selectedMosque}
        onClose={() => {
          setShowAzanLiveModal(false);
          setIsPlayingAzan(false);
          setCurrentlyPlayingMuezzin(null);
        }}
      />
    </div>
  );
};
