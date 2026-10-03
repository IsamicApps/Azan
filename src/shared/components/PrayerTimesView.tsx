import React, { useState, useEffect } from 'react';
import {
  Mosque,
  PrayerTimesResult,
  getAllMosques,
  saveCustomMosque,
  calculateMosquePrayerTimes,
  getMosquesSortedByDistance,
  getSelectedMosque,
  saveSelectedMosque,
  getMosqueJumuah
} from '../utils/prayerTimes';
import {
  playAzan,
  stopAzan,
  isAzanPlaying,
  getAzanSettings,
  saveAzanSettings,
  AzanSettings,
  MUEZZIN_SOURCES,
  AZAN_PRAYERS,
  AzanPrayer,
  getMuezzinForPrayer,
  withPrayerMuezzin,
  MuezzinId
} from '../utils/azanAudio';
import { speakDua, stopSpeaking, isSpeaking } from '../utils/speech';
import { IslamicPattern, IslamicCornerOrnament } from './IslamicPattern';
import { AzanLiveModal } from './AzanLiveModal';
import { useI18n } from '../i18n';
import { PrayerRemindersCard } from './PrayerRemindersCard';
import { MonthlyTimetable } from './MonthlyTimetable';
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
  RotateCcw,
  Volume1,
  PlusCircle,
  X,
  Heart,
  Utensils
} from 'lucide-react';

interface PrayerTimesViewProps {
  onMosqueChange?: (mosque: Mosque) => void;
}

export const PrayerTimesView: React.FC<PrayerTimesViewProps> = ({ onMosqueChange }) => {
  const i18n = useI18n();
  const { t } = i18n;
  const [allMosquesList, setAllMosquesList] = useState<Mosque[]>(getAllMosques());
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
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [showAzanLiveModal, setShowAzanLiveModal] = useState(false);
  const [showTimetable, setShowTimetable] = useState(false);
  const [activeAzanPrayer, setActiveAzanPrayer] = useState({ name: 'Asr', time: '03:43 PM' });

  // Fasting Du'a recitation state
  const [isRecitingFastingDua, setIsRecitingFastingDua] = useState(false);
  const [copiedFastingDua, setCopiedFastingDua] = useState(false);

  // Custom Mosque Form state
  const [customForm, setCustomForm] = useState({
    name: '',
    suburb: '',
    state: '',
    address: '',
    lat: '',
    lng: '',
    jumuah: '1:15 PM & 2:15 PM',
    fajrOffset: 20,
    dhuhrOffset: 15,
    asrOffset: 15,
    maghribOffset: 5,
    ishaOffset: 10
  });

  // Digital Tasbih Counter State
  const [dhikrCount, setDhikrCount] = useState(0);
  const [selectedDhikr, setSelectedDhikr] = useState<'SubhanAllah' | 'Alhamdulillah' | 'AllahuAkbar' | 'Astaghfirullah'>('SubhanAllah');

  // Update countdown every second (auto-Azan is triggered globally in App)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const currentResult = calculateMosquePrayerTimes(selectedMosque, now);
      setPrayerData(currentResult);
      const isPlaying = isAzanPlaying();
      setIsPlayingAzan(isPlaying);
      if (!isPlaying) setCurrentlyPlayingMuezzin(null);
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedMosque]);

  const handleFindClosestMosque = () => {
    if (!navigator.geolocation) {
      setLocationError(t('Geolocation is not supported by your browser.'));
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
        setLocationError(t('Could not retrieve GPS location. You can select your mosque manually or add a custom one below.'));
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleAutofillFormGPS = () => {
    if (!navigator.geolocation) {
      alert(t('Geolocation is not supported by your browser.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCustomForm((prev) => ({
          ...prev,
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6)
        }));
      },
      (err) => {
        alert(t('Could not detect GPS coordinates. Please enter them manually.'));
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSaveCustomMosqueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(customForm.lat);
    const lng = parseFloat(customForm.lng);

    if (!customForm.name.trim() || isNaN(lat) || isNaN(lng)) {
      alert(t('Please provide a valid Mosque Name, Latitude, and Longitude.'));
      return;
    }

    const created = saveCustomMosque({
      name: customForm.name.trim(),
      loc: `${customForm.suburb.trim()}, ${customForm.state.trim()}`,
      suburb: customForm.suburb.trim() || 'Custom Location',
      state: customForm.state.trim().toUpperCase() || 'CUSTOM',
      area: customForm.suburb.trim(),
      address: customForm.address.trim() || `${customForm.suburb.trim()}, ${customForm.state.trim()}`,
      lat,
      lng,
      link: 'https://www.awqat.com.au/',
      jumuah: customForm.jumuah.trim() || '1:15 PM',
      iqamaOffsets: {
        Fajr: customForm.fajrOffset,
        Dhuhr: customForm.dhuhrOffset,
        Asr: customForm.asrOffset,
        Maghrib: customForm.maghribOffset,
        Isha: customForm.ishaOffset
      }
    });

    setAllMosquesList(getAllMosques());
    setSelectedMosque(created);
    setPrayerData(calculateMosquePrayerTimes(created, new Date()));
    setShowAddCustomModal(false);
    if (onMosqueChange) onMosqueChange(created);
  };

  const handleSelectMosque = (m: Mosque) => {
    setSelectedMosque(m);
    saveSelectedMosque(m.id);
    setPrayerData(calculateMosquePrayerTimes(m, new Date()));
    setShowMosqueSelector(false);
    if (onMosqueChange) onMosqueChange(m);
  };

  const handlePlayMuezzin = (muezzinId: MuezzinId, prayer?: AzanPrayer) => {
    if (isPlayingAzan && currentlyPlayingMuezzin === muezzinId) {
      stopAzan();
      setIsPlayingAzan(false);
      setCurrentlyPlayingMuezzin(null);
      return;
    }

    setCurrentlyPlayingMuezzin(muezzinId);
    setActiveAzanPrayer(
      prayer
        ? { name: prayer, time: prayerData[prayer.toLowerCase() as 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'] }
        : { name: prayerData.nextPrayer.name, time: prayerData.nextPrayer.time }
    );
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
      handlePlayMuezzin(nextPrayerMuezzin);
    }
  };

  // The voice that will play for the upcoming prayer (Sunrise has no Azan, so it shows the default)
  const nextPrayerMuezzin = getMuezzinForPrayer(azanSettings, prayerData.nextPrayer.name);

  const updateAzanSetting = (patch: Partial<AzanSettings>) => {
    const updated = { ...azanSettings, ...patch };
    setAzanSettings(updated);
    saveAzanSettings(updated);
  };

  const iftarDuaArabic = "ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ وَثَبَتَ الأَجْرُ إِنْ شَاءَ اللَّهُ";
  const iftarDuaTranslation = "The thirst has gone, the veins are moistened, and the reward is confirmed, if Allah wills.";

  const handleToggleFastingDua = () => {
    if (isRecitingFastingDua || isSpeaking()) {
      stopSpeaking();
      setIsRecitingFastingDua(false);
    } else {
      setIsRecitingFastingDua(true);
      speakDua(
        iftarDuaArabic,
        iftarDuaTranslation,
        () => setIsRecitingFastingDua(true),
        () => setIsRecitingFastingDua(false)
      );
    }
  };

  const handleCopyFastingDua = async () => {
    try {
      await navigator.clipboard.writeText(`${iftarDuaArabic}\n\n"${iftarDuaTranslation}"\n— Sunan Abi Dawud #2357`);
      setCopiedFastingDua(true);
      setTimeout(() => setCopiedFastingDua(false), 2000);
    } catch {}
  };

  const filteredMosques = allMosquesList.filter((m) => {
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
    { key: 'Fajr', name: 'Fajr', time: prayerData.fajr, icon: '🌅', iqama: prayerData.iqama.Fajr },
    { key: 'Sunrise', name: 'Sunrise', time: prayerData.sunrise, icon: '☀️', iqama: undefined },
    { key: 'Dhuhr', name: 'Dhuhr', time: prayerData.dhuhr, icon: '☀️', iqama: prayerData.iqama.Dhuhr },
    { key: 'Asr', name: 'Asr', time: prayerData.asr, icon: '🌤️', iqama: prayerData.iqama.Asr },
    { key: 'Maghrib', name: 'Maghrib', time: prayerData.maghrib, icon: '🌇', iqama: prayerData.iqama.Maghrib },
    { key: 'Isha', name: 'Isha', time: prayerData.isha, icon: '🌙', iqama: prayerData.iqama.Isha }
  ];

  const compassPoints = i18n.isArabic
    ? ['شمال', 'شمال شرق', 'شرق', 'جنوب شرق', 'جنوب', 'جنوب غرب', 'غرب', 'شمال غرب']
    : ['North', 'North-East', 'East', 'South-East', 'South', 'South-West', 'West', 'North-West'];
  const qiblaDirection = compassPoints[Math.round(prayerData.qiblaBearing / 45) % 8];

  const handleDhikrTap = () => {
    setDhikrCount((prev) => prev + 1);
  };

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
                <span>
                  {selectedMosque.isCustom
                    ? t('Custom Location')
                    : prayerData.timesSite
                      ? t('Selected Mosque ({site})', { site: prayerData.timesSite })
                      : t('Selected Mosque')}
                </span>
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

          {/* Action Buttons: Closest Mosque, Add Custom & Directory */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleFindClosestMosque}
              disabled={isLocating}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-neutral-950 font-semibold text-xs shadow-lg transition disabled:opacity-50 cursor-pointer"
            >
              <Navigation className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{t(isLocating ? 'Locating...' : 'Closest Mosque (GPS)')}</span>
            </button>

            <button
              onClick={() => setShowAddCustomModal(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold border border-amber-500/40 transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t('Add Custom City/Mosque')}</span>
            </button>

            <button
              onClick={() => setShowMosqueSelector(!showMosqueSelector)}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-neutral-100 text-xs font-medium border border-white/10 transition cursor-pointer"
            >
              {t(showMosqueSelector ? 'Close Directory' : 'Change Mosque')}
            </button>

            <a
              href={selectedMosque.link}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-amber-300 border border-white/5 transition"
              title={selectedMosque.link.includes('awqat.com.au') ? t('View on Awqat.com.au') : t('Mosque website')}
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
              <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('Search by mosque name, suburb, or area (e.g. Footscray, Tarneit, Melbourne)...')}
                className="w-full ps-10 pe-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* State Filter */}
            <div className="flex space-x-1 overflow-x-auto pb-1">
              {['ALL', 'CUSTOM', 'VIC', 'NSW', 'QLD', 'WA', 'SA', 'TAS', 'ACT'].map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedState(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    selectedState === st
                      ? 'bg-amber-500 text-neutral-950 font-bold'
                      : 'bg-white/5 text-neutral-400 hover:text-white'
                  }`}
                >
                  {st === 'ALL' ? t('All') : st === 'CUSTOM' ? t('Custom') : st}
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
                  <div className="space-y-1 truncate pe-2">
                    <div className="font-semibold text-sm text-white truncate flex items-center space-x-2">
                      <span>{m.name}</span>
                      {m.isCustom && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/30 text-purple-300 font-semibold uppercase">
                          {t('Custom')}
                        </span>
                      )}
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-neutral-300 font-mono">
                        {m.state}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-400 truncate">{m.suburb}, {m.state}</div>
                    <div className="text-[11px] text-amber-300/80">{t("Jumu'ah")}: {i18n.time(getMosqueJumuah(m))}</div>
                  </div>

                  <div className="shrink-0 flex items-center space-x-2">
                    {m.distanceKm !== undefined && (
                      <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">
                        {m.distanceKm} {t('km')}
                      </span>
                    )}
                    {isSelected ? (
                      <Check className="w-5 h-5 text-amber-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-neutral-500 rtl:rotate-180" />
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

        <div className="relative z-10 space-y-2 text-center md:text-start">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5" />
            <span>{t('Next Prayer')} ({prayerData.timesSite ?? t(selectedMosque.isCustom ? 'Custom Coords' : 'Calculated')})</span>
          </div>

          <h2 className="font-serif text-3xl md:text-5xl font-bold text-white">
            {t('{prayer} at {time}', {
              prayer: i18n.prayer(prayerData.isFriday && prayerData.nextPrayer.name === 'Dhuhr' ? "Jumu'ah" : prayerData.nextPrayer.name),
              time: i18n.time(prayerData.nextPrayer.time)
            })}
          </h2>

          <p className="text-xs md:text-sm text-neutral-300">
            {selectedMosque.name} • {prayerData.nextPrayer.iqamaTime ? `${t('Iqamah')}: ${i18n.time(prayerData.nextPrayer.iqamaTime)}` : t('Prayer Time')}
          </p>

          {/* Auto-Azan Live Status */}
          <div className="pt-2 flex items-center justify-center md:justify-start space-x-2 text-xs">
            <span className={`inline-block w-2 h-2 rounded-full ${azanSettings.autoAzanEnabled ? 'bg-emerald-400 animate-ping' : 'bg-neutral-500'}`} />
            <span className="text-neutral-300">
              {azanSettings.autoAzanEnabled
                ? t('Auto-Azan enabled ({name})', { name: t(MUEZZIN_SOURCES[nextPrayerMuezzin].name) })
                : t('Auto Azan is paused')}
            </span>
          </div>
        </div>

        {/* Big Countdown Timer & Azan Audio Actions */}
        <div className="relative z-10 flex flex-col items-center space-y-3 w-full md:w-auto">
          <div className="p-4 px-6 rounded-2xl bg-black/60 border border-amber-500/30 text-center shadow-inner w-full">
            <div className="text-[11px] uppercase tracking-widest text-neutral-400 font-semibold">
              {t('Time Remaining')}
            </div>
            <div className="text-2xl md:text-3xl font-mono font-bold text-amber-300 mt-1">
              {i18n.duration(prayerData.nextPrayer.remainingFormatted)}
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
            <span>{isPlayingAzan ? t('Stop Playing Azan') : t('Play Azan ({name})', { name: t(MUEZZIN_SOURCES[nextPrayerMuezzin].name) })}</span>
          </button>
        </div>
      </div>

      {/* 4. FASTING / IFTAR & SUHOOR (IMSAK) COUNTDOWN CARD — Ramadan only */}
      {prayerData.isRamadan && (
      <div className="relative rounded-3xl bg-gradient-to-r from-emerald-950/40 via-[#101918] to-[#0c1214] border border-emerald-500/30 p-6 shadow-xl overflow-hidden">
        <IslamicPattern opacity={12} color="#10b981" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-start">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <Utensils className="w-3.5 h-3.5" />
              <span>{t('Fasting & Meal Schedule')}</span>
            </div>
            {prayerData.ramadanDay && (
              <div className="text-sm font-semibold text-emerald-300">{t('Ramadan, day {n} of 30', { n: prayerData.ramadanDay })}</div>
            )}

            <div className="text-xl md:text-2xl font-serif font-bold text-white">
              {prayerData.nextFastingEvent.type === 'Iftar'
                ? t('Iftar (Fast Breaking) at Maghrib ({time})', { time: i18n.time(prayerData.maghrib) })
                : t('Suhoor / Imsak End at Fajr ({time})', { time: i18n.time(prayerData.nextFastingEvent.time) })}
            </div>

            {/* Fasting Du'a */}
            <div className="pt-2 text-start space-y-1">
              <div className="text-xs font-arabic text-amber-300 font-semibold">
                {iftarDuaArabic}
              </div>
              <p className="text-[11px] text-neutral-300 italic">
                {i18n.isArabic ? null : <>&ldquo;{iftarDuaTranslation}&rdquo; </>}<span className="text-neutral-500">({t('Abu Dawud #2357')})</span>
              </p>
            </div>

            {/* The last ten nights: seek Laylat al-Qadr */}
            {/* The coming night belongs to the next Islamic day (it starts at Maghrib) */}
            {(() => {
              const night = prayerData.ramadanDay === undefined ? 0 : prayerData.nextFastingEvent.type === 'Iftar' ? prayerData.ramadanDay + 1 : prayerData.ramadanDay;
              return night >= 21 && night <= 30;
            })() && (
              <div className="mt-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-start space-y-1">
                <div className="text-xs font-bold text-amber-300">
                  {t('The last ten nights: seek Laylat al-Qadr')}
                  {(() => {
                    const night = prayerData.nextFastingEvent.type === 'Iftar' ? prayerData.ramadanDay! + 1 : prayerData.ramadanDay!;
                    return night % 2 === 1 ? ` • ${t('Tonight is the {n}th night (odd)', { n: night })}` : ` • ${t('Tonight is the {n}th night', { n: night })}`;
                  })()}
                </div>
                <div className="font-arabic text-sm text-amber-200">اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي</div>
                {!i18n.isArabic && <p className="text-[11px] text-neutral-300 italic">&ldquo;O Allah, You are Pardoning and love to pardon, so pardon me.&rdquo;</p>}
                <p className="text-[10px] text-neutral-500">{t("Jami' at-Tirmidhi #3513 (Sahih, Al-Albani)")}</p>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center space-y-2 w-full md:w-auto">
            <div className="p-4 px-6 rounded-2xl bg-black/60 border border-emerald-500/30 text-center w-full">
              <div className="text-[10px] uppercase tracking-widest text-emerald-400/80 font-semibold">
                {t('Remaining to {event}', { event: i18n.prayer(prayerData.nextFastingEvent.type) })}
              </div>
              <div className="text-2xl md:text-3xl font-mono font-bold text-emerald-300 mt-0.5">
                {i18n.duration(prayerData.nextFastingEvent.remainingFormatted)}
              </div>
            </div>

            <div className="flex space-x-2 w-full">
              <button
                onClick={handleToggleFastingDua}
                className={`flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  isRecitingFastingDua
                    ? 'bg-emerald-500 text-neutral-950 animate-pulse font-bold'
                    : 'bg-white/10 hover:bg-white/20 text-neutral-200'
                }`}
              >
                {isRecitingFastingDua ? <Square className="w-3.5 h-3.5 fill-current" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span>{t(isRecitingFastingDua ? "Stop Du'a" : "Recite Du'a")}</span>
              </button>

              <button
                onClick={handleCopyFastingDua}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-xs font-medium border border-white/10 transition cursor-pointer"
              >
                {t(copiedFastingDua ? 'Copied' : 'Copy')}
              </button>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* 5. AUTHENTIC VOCAL MUEZZIN SOUND SELECTOR & PREVIEW */}
      <div className="p-6 rounded-3xl bg-[#11131c] border border-white/10 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            <div>
              <h4 className="font-serif text-lg font-semibold text-white">
                {t('Authentic Vocal Muezzin Recordings')}
              </h4>
              <p className="text-xs text-neutral-400">
                {t('Choose the Muezzin voice that will play at prayer times (Powered by Islamic Network API)')}
              </p>
            </div>
          </div>

          {/* Auto Azan Toggle & Volume Slider */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-2 bg-black/40 px-3 py-1.5 rounded-xl border border-white/10 text-xs">
              <Volume1 className="w-3.5 h-3.5 text-neutral-400" />
              <input
                type="range"
                min="0.2"
                max="1.0"
                step="0.05"
                value={azanSettings.volume}
                onChange={(e) => updateAzanSetting({ volume: parseFloat(e.target.value) })}
                className="w-20 accent-amber-400 cursor-pointer"
                title={t('Azan Volume')}
              />
            </div>

            <label className="flex items-center space-x-2 bg-black/40 px-3.5 py-2 rounded-xl border border-white/10 cursor-pointer self-start">
              <span className="text-xs font-semibold text-neutral-200">{t('Auto-Play on Prayer Time')}</span>
              <input
                type="checkbox"
                checked={azanSettings.autoAzanEnabled}
                onChange={(e) => updateAzanSetting({ autoAzanEnabled: e.target.checked })}
                className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
              />
            </label>
          </div>
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
                      <span>{t(m.name)}</span>
                    </span>
                    {isSelected && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500 text-neutral-950 font-bold uppercase">
                        {t('Default')}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-amber-300/80 font-medium truncate">{t(m.subtitle)}</p>
                  <p className="text-[10px] text-neutral-400 truncate">{t(m.location)}</p>
                </div>

                <div className="flex items-center space-x-2 pt-2 border-t border-white/5">
                  <button
                    onClick={() => updateAzanSetting({ selectedMuezzin: mId })}
                    className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-neutral-950 font-bold'
                        : 'bg-white/5 hover:bg-white/10 text-neutral-300'
                    }`}
                  >
                    {t(isSelected ? 'Selected' : 'Set as Default')}
                  </button>

                  <button
                    onClick={() => handlePlayMuezzin(mId)}
                    className={`p-2 rounded-lg transition cursor-pointer ${
                      isPlayingThis
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                    title={t(isPlayingThis ? 'Stop' : 'Listen / Test Voice')}
                  >
                    {isPlayingThis ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Azan voice per prayer */}
        <div className="space-y-2.5 pt-2">
          <div>
            <h4 className="text-sm font-bold text-white">{t('Azan Voice for Each Prayer')}</h4>
            <p className="text-[11px] text-neutral-400">
              {t('Prayers set to Default use {name}.', { name: t(MUEZZIN_SOURCES[azanSettings.selectedMuezzin]?.name ?? '') })}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {AZAN_PRAYERS.map((prayer) => {
              const own = azanSettings.prayerMuezzins?.[prayer];
              const effective = getMuezzinForPrayer(azanSettings, prayer);
              const isPlayingThis = isPlayingAzan && currentlyPlayingMuezzin === effective;
              return (
                <div key={prayer} className="p-3 rounded-xl bg-neutral-900/60 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{i18n.prayer(prayer)}</span>
                    <button
                      onClick={() => handlePlayMuezzin(effective, prayer)}
                      className={`p-1.5 rounded-lg transition cursor-pointer ${
                        isPlayingThis ? 'bg-rose-500 text-white animate-pulse' : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                      title={isPlayingThis ? t('Stop') : t('Listen to {prayer} Azan', { prayer: i18n.prayer(prayer) })}
                    >
                      {isPlayingThis ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                    </button>
                  </div>
                  <select
                    value={own ?? ''}
                    onChange={(e) => {
                      const updated = withPrayerMuezzin(azanSettings, prayer, (e.target.value || null) as MuezzinId | null);
                      setAzanSettings(updated);
                      saveAzanSettings(updated);
                    }}
                    aria-label={t('Azan voice for {prayer}', { prayer: i18n.prayer(prayer) })}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-neutral-100 cursor-pointer"
                  >
                    <option value="">{t('Default')} ({t(MUEZZIN_SOURCES[azanSettings.selectedMuezzin]?.name)})</option>
                    {(Object.keys(MUEZZIN_SOURCES) as MuezzinId[]).map((mId) => (
                      <option key={mId} value={mId}>{t(MUEZZIN_SOURCES[mId].name)}</option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 6. DAILY PRAYER TIMETABLE GRID */}
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
                    {t('Next')}
                  </span>
                )}
              </div>

              <div className="space-y-0.5">
                <div className="font-semibold text-xs text-neutral-300">{i18n.prayer(prayerData.isFriday && p.key === 'Dhuhr' ? "Jumu'ah" : p.name)}</div>
                <div className="font-mono text-base md:text-lg font-bold text-white">{i18n.time(p.time)}</div>
              </div>

              <div className="pt-2 border-t border-white/5 text-[10px] text-neutral-400">
                {prayerData.isFriday && p.key === 'Dhuhr'
                  ? i18n.time(prayerData.jumuah)
                  : p.iqama
                  ? `${t('Iqamah')} ${i18n.time(p.iqama)}`
                  : p.key === 'Sunrise'
                    ? t('Sunrise')
                    : prayerData.iqamaCheck[p.key as keyof typeof prayerData.iqamaCheck]
                      ? t('Iqamah: check with the mosque')
                      : `${t('Iqamah')} —`}
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => setShowTimetable(true)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold text-amber-300 cursor-pointer"
      >
        <Calendar className="w-4 h-4" />
        <span>{t('Monthly Timetable')}</span>
      </button>
      {showTimetable && <MonthlyTimetable mosque={selectedMosque} onClose={() => setShowTimetable(false)} />}

      <PrayerRemindersCard />

      {/* 7. INTERACTIVE QIBLA COMPASS & DIGITAL TASBIH DHIKR COUNTER */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Friday Jumu'ah Card */}
        <div className="p-5 rounded-3xl bg-[#11131c] border border-white/10 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6 text-amber-400" />
          </div>
          <div className="space-y-1">
            <h4 className="font-semibold text-sm text-white">{t("Friday Jumu'ah Prayers")}</h4>
            <p className="text-xs text-neutral-300">{i18n.time(prayerData.jumuah)}</p>
            <p className="text-[11px] text-neutral-500">{selectedMosque.name}</p>
          </div>
        </div>

        {/* Rotating Qibla Compass Dial */}
        <div className="p-5 rounded-3xl bg-[#11131c] border border-white/10 flex items-center space-x-4">
          <div className="relative w-14 h-14 rounded-full bg-sky-950/40 border border-sky-500/40 flex items-center justify-center shrink-0">
            <div
              className="absolute inset-0 flex items-center justify-center transition-transform duration-700"
              style={{ transform: `rotate(${prayerData.qiblaBearing}deg)` }}
            >
              <div className="w-1.5 h-6 bg-gradient-to-t from-amber-400 to-red-500 rounded-full mb-6" />
            </div>
            <Compass className="w-6 h-6 text-sky-400" />
          </div>
          <div className="space-y-1">
            <h4 className="font-semibold text-sm text-white">{t('Qibla Direction')}</h4>
            <p className="text-xs text-sky-300 font-mono font-bold">
              {t('{bearing}° from North ({direction})', { bearing: prayerData.qiblaBearing, direction: qiblaDirection })}
            </p>
            <p className="text-[11px] text-neutral-500">{t('Toward the Kaaba from {place}', { place: selectedMosque.loc })}</p>
          </div>
        </div>

        {/* Digital Tasbih Dhikr Counter */}
        <div
          onClick={handleDhikrTap}
          className="p-5 rounded-3xl bg-gradient-to-br from-neutral-900 to-[#121622] border border-amber-500/25 hover:border-amber-400/50 transition cursor-pointer flex items-center justify-between shadow-lg group select-none"
        >
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-neutral-300">{t('Digital Tasbih')}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDhikrCount(0);
                }}
                className="p-1 rounded text-neutral-500 hover:text-white cursor-pointer"
                title={t('Reset counter')}
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
            <div className="font-arabic text-sm text-amber-300">
              {selectedDhikr === 'SubhanAllah' ? 'سُبْحَانَ اللَّهِ' : selectedDhikr === 'Alhamdulillah' ? 'الْحَمْدُ لِلَّهِ' : 'اللَّهُ أَكْبَرُ'}
            </div>
            <p className="text-[10px] text-neutral-400">{t('Tap to count • 33x cycle')}</p>
          </div>

          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-mono text-2xl font-bold group-hover:scale-105 transition-transform">
            {dhikrCount}
          </div>
        </div>
      </div>

      {/* 8. ADD CUSTOM MOSQUE MODAL */}
      {showAddCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#11131c] border border-amber-500/40 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <PlusCircle className="w-5 h-5 text-amber-400" />
                <h3 className="font-serif text-lg font-bold text-white">{t('Add Custom Mosque / Location')}</h3>
              </div>
              <button
                onClick={() => setShowAddCustomModal(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomMosqueSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">{t('Mosque / Location Name *')}</label>
                <input
                  type="text"
                  required
                  placeholder={t('e.g. East London Mosque or Home Prayer Room')}
                  value={customForm.name}
                  onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">{t('City / Suburb')}</label>
                  <input
                    type="text"
                    placeholder={t('e.g. London or Auburn')}
                    value={customForm.suburb}
                    onChange={(e) => setCustomForm({ ...customForm, suburb: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">{t('State / Region')}</label>
                  <input
                    type="text"
                    placeholder={t('e.g. UK, VIC, or CA')}
                    value={customForm.state}
                    onChange={(e) => setCustomForm({ ...customForm, state: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Coordinates with Autofill button */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-neutral-300 font-semibold">{t('GPS Coordinates *')}</label>
                  <button
                    type="button"
                    onClick={handleAutofillFormGPS}
                    className="text-amber-400 hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>{t('Auto-detect GPS')}</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder={t('Latitude (e.g. 51.5186)')}
                    value={customForm.lat}
                    onChange={(e) => setCustomForm({ ...customForm, lat: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                  />
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder={t('Longitude (e.g. -0.0664)')}
                    value={customForm.lng}
                    onChange={(e) => setCustomForm({ ...customForm, lng: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">{t("Friday Jumu'ah Times")}</label>
                <input
                  type="text"
                  placeholder={t('e.g. 1:15 PM & 2:15 PM')}
                  value={customForm.jumuah}
                  onChange={(e) => setCustomForm({ ...customForm, jumuah: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Iqamah Offsets */}
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">{t('Iqamah Offsets (Minutes after Azan)')}</label>
                <div className="grid grid-cols-5 gap-2">
                  <div>
                    <span className="text-[10px] text-neutral-400">{i18n.prayer('Fajr')}</span>
                    <input
                      type="number"
                      value={customForm.fajrOffset}
                      onChange={(e) => setCustomForm({ ...customForm, fajrOffset: parseInt(e.target.value) || 0 })}
                      className="w-full p-2 rounded-lg bg-black/50 border border-white/10 text-white text-center"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400">{i18n.prayer('Dhuhr')}</span>
                    <input
                      type="number"
                      value={customForm.dhuhrOffset}
                      onChange={(e) => setCustomForm({ ...customForm, dhuhrOffset: parseInt(e.target.value) || 0 })}
                      className="w-full p-2 rounded-lg bg-black/50 border border-white/10 text-center text-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400">{i18n.prayer('Asr')}</span>
                    <input
                      type="number"
                      value={customForm.asrOffset}
                      onChange={(e) => setCustomForm({ ...customForm, asrOffset: parseInt(e.target.value) || 0 })}
                      className="w-full p-2 rounded-lg bg-black/50 border border-white/10 text-center text-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400">{i18n.prayer('Maghrib')}</span>
                    <input
                      type="number"
                      value={customForm.maghribOffset}
                      onChange={(e) => setCustomForm({ ...customForm, maghribOffset: parseInt(e.target.value) || 0 })}
                      className="w-full p-2 rounded-lg bg-black/50 border border-white/10 text-center text-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400">{i18n.prayer('Isha')}</span>
                    <input
                      type="number"
                      value={customForm.ishaOffset}
                      onChange={(e) => setCustomForm({ ...customForm, ishaOffset: parseInt(e.target.value) || 0 })}
                      className="w-full p-2 rounded-lg bg-black/50 border border-white/10 text-center text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-neutral-300 cursor-pointer"
                >
                  {t('Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold shadow-lg transition cursor-pointer"
                >
                  {t('Save & Apply Mosque')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
