import React, { useState } from 'react';
import namesData from '../data/namesOfAllah.json';
import { IslamicPattern, IslamicCornerOrnament } from './IslamicPattern';
import { speakDua, stopSpeaking, isSpeaking } from '../utils/speech';
import { Search, Volume2, Square, Sparkles, Check, Bookmark, Heart, BookOpen, Share2 } from 'lucide-react';
import { useI18n } from '../i18n';

const SURAHS_AR: Record<string, string> = {
  'Ad-Duha': 'الضحى', 'Adh-Dhariyat': 'الذاريات', 'Al-Ahzab': 'الأحزاب', "Al-An'am": 'الأنعام', 'Al-Anfal': 'الأنفال',
  'Al-Baqarah': 'البقرة', 'Al-Buruj': 'البروج', 'Al-Fatihah': 'الفاتحة', 'Al-Hadid': 'الحديد', 'Al-Hajj': 'الحج',
  'Al-Hashr': 'الحشر', 'Al-Hijr': 'الحجر', 'Al-Ikhlas': 'الإخلاص', 'Al-Infitar': 'الانفطار', 'Al-Kahf': 'الكهف',
  'Al-Mulk': 'الملك', 'Al-Qamar': 'القمر', "Al-Waqi'ah": 'الواقعة', "Ali 'Imran": 'آل عمران', 'An-Najm': 'النجم',
  'An-Nisa': 'النساء', 'An-Nur': 'النور', "Ar-Ra'd": 'الرعد', 'Ar-Rahman': 'الرحمن', 'Ar-Rum': 'الروم',
  'As-Sajdah': 'السجدة', 'Ash-Shura': 'الشورى', 'At-Tur': 'الطور', 'Az-Zumar': 'الزمر', Fatir: 'فاطر', Hud: 'هود',
  Ibrahim: 'إبراهيم', Maryam: 'مريم', Nuh: 'نوح', Qaf: 'ق', Saba: 'سبأ', Sad: 'ص'
};

/** "Surah Al-Fatihah (1:3)" -> "سورة الفاتحة (1:3)" */
function quranRefInArabic(ref: string): string {
  return ref.replace(/^Surah (.+?)(\s*\(.*)?$/, (whole, name: string, rest = '') =>
    SURAHS_AR[name] ? `سورة ${SURAHS_AR[name]}${rest}` : whole
  );
}

interface NameOfAllah {
  id: number;
  arabic: string;
  transliteration: string;
  meaning: string;
  explanation: string;
  quranRef: string;
}

export const NamesOfAllahView: React.FC = () => {
  const { t, isArabic } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedName, setSelectedName] = useState<NameOfAllah | null>(null);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<number[]>(() => {
    try {
      const raw = localStorage.getItem('daily_hadith_fav_names');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const toggleFavorite = (id: number) => {
    const updated = favoriteIds.includes(id)
      ? favoriteIds.filter(i => i !== id)
      : [...favoriteIds, id];
    setFavoriteIds(updated);
    try {
      localStorage.setItem('daily_hadith_fav_names', JSON.stringify(updated));
    } catch {}
  };

  const handlePlayAudio = (item: NameOfAllah) => {
    if (playingId === item.id || isSpeaking()) {
      stopSpeaking();
      setPlayingId(null);
      return;
    }

    setPlayingId(item.id);
    speakDua(
      item.arabic,
      `${item.transliteration}. ${item.meaning}. ${item.explanation}`,
      () => setPlayingId(item.id),
      () => setPlayingId(null)
    );
  };

  const handleCopy = async (item: NameOfAllah) => {
    try {
      await navigator.clipboard.writeText(`${item.arabic} (${item.transliteration})\nMeaning: ${item.meaning}\nRef: ${item.quranRef}\n"${item.explanation}"`);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  };

  // Arabic is matched without vowel marks, so "الرحمن" finds "الرَّحْمَنُ"
  const plainArabic = (text: string) => text.replace(/[\u064B-\u065F\u0670\u0640]/g, '').replace(/[أإآٱ]/g, 'ا');
  const filteredNames = (namesData as NameOfAllah[]).filter((n) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      n.transliteration.toLowerCase().includes(q) ||
      n.meaning.toLowerCase().includes(q) ||
      n.explanation.toLowerCase().includes(q) ||
      plainArabic(n.arabic).includes(plainArabic(q)) ||
      String(n.id) === q
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-amber-600/25 via-[#181a26] to-[#0d1018] border border-amber-500/40 p-6 md:p-8 shadow-2xl overflow-hidden">
        <IslamicPattern opacity={18} color="#d4af37" />
        <IslamicCornerOrnament className="absolute top-2 left-2 rotate-0 opacity-30" />
        <IslamicCornerOrnament className="absolute top-2 right-2 rotate-90 opacity-30" />

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('Asma-ul-Husna • 99 Divine Names')}</span>
          </div>

          <h2 className="font-serif text-3xl md:text-5xl font-bold text-white tracking-tight">
            {t('The 99 Beautiful Names of Allah')}
          </h2>

          <p className="text-xs md:text-sm text-neutral-300 max-w-2xl leading-relaxed">
            &ldquo;{t('Allah has ninety-nine Names, one-hundred less one; and he who memorizes them will enter Paradise.')}&rdquo;
            <span className="text-amber-400 font-serif italic ms-1">— {t('Sahih al-Bukhari #2736')}</span>
          </p>
          {isArabic && <p className="text-[11px] text-neutral-500">{t('The meanings and explanations of the names are in English.')}</p>}
        </div>
      </div>

      {/* Search & Statistics Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-[#11131c] border border-white/10">
        <div className="relative w-full sm:w-80">
          <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('Search by name, meaning, or # (e.g. Ar-Rahman, Peace, 1)...')}
            className="w-full ps-10 pe-4 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex items-center space-x-3 text-xs text-neutral-400">
          <span>{t('Showing {count} of 99 Names', { count: filteredNames.length })}</span>
          <span>•</span>
          <span className="text-amber-300">{t('{count} Saved', { count: favoriteIds.length })}</span>
        </div>
      </div>

      {/* 99 Names Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNames.map((item) => {
          const isFav = favoriteIds.includes(item.id);
          const isPlayingThis = playingId === item.id;

          return (
            <div
              key={item.id}
              className="p-5 rounded-3xl bg-gradient-to-b from-[#141724] via-[#0f121d] to-[#0a0c14] border border-white/10 hover:border-amber-500/40 transition-all duration-300 shadow-xl flex flex-col justify-between space-y-4 group hover:scale-[1.01]"
            >
              <div className="space-y-3">
                {/* Number Badge & Action Controls */}
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold flex items-center justify-center">
                    {item.id}
                  </span>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handlePlayAudio(item)}
                      className={`p-2 rounded-xl transition cursor-pointer ${
                        isPlayingThis
                          ? 'bg-amber-500 text-neutral-950 font-bold animate-pulse'
                          : 'bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white'
                      }`}
                      title={t(isPlayingThis ? 'Stop recitation' : 'Listen to name & meaning')}
                    >
                      {isPlayingThis ? <Square className="w-3.5 h-3.5 fill-current" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => toggleFavorite(item.id)}
                      className={`p-2 rounded-xl transition cursor-pointer ${
                        isFav
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white'
                      }`}
                      title={t('Save to Favourites')}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                    </button>

                    <button
                      onClick={() => handleCopy(item)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition cursor-pointer"
                      title={t('Copy Name & Translation')}
                    >
                      {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Big Arabic Calligraphy */}
                <div className="text-center py-2">
                  <h3 dir="rtl" className="font-arabic text-3xl md:text-4xl font-bold text-amber-200 tracking-wide group-hover:text-amber-300 transition-colors">
                    {item.arabic}
                  </h3>
                  {!isArabic && (
                    <div className="font-serif text-lg font-bold text-white mt-1">
                      {item.transliteration}
                    </div>
                  )}
                  <div dir="ltr" className="text-xs text-amber-300/90 font-medium">
                    {item.meaning}
                  </div>
                </div>

                {/* Explanation */}
                <p dir="ltr" className="text-xs text-neutral-300 leading-relaxed italic font-serif border-t border-white/5 pt-2.5">
                  &ldquo;{item.explanation}&rdquo;
                </p>
              </div>

              {/* Quranic Reference Footnote */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-neutral-400">
                <span className="flex items-center space-x-1">
                  <BookOpen className="w-3 h-3 text-amber-400" />
                  <span>{isArabic ? quranRefInArabic(item.quranRef) : item.quranRef}</span>
                </span>
                <span className="text-emerald-400/80 font-mono">{t('Bukhari #2736')}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
