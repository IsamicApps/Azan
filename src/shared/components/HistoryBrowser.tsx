import React, { useState, useEffect } from 'react';
import { Hadith, DailySelection } from '../types/hadith';
import { loadDailyHadithOrBundled, describeHadith } from '../utils/hadithLibrary';
import { GradeBadge } from './GradeBadge';
import { useDisplayedHadith } from '../hooks/useHadithLanguage';
import { useI18n } from '../i18n';
import { getHijriDate } from '../utils/hijri';
import { Calendar, ChevronRight, ChevronLeft, BookOpen, Clock, Sparkles } from 'lucide-react';

interface HistoryBrowserProps {
  onSelectHadith: (hadith: Hadith, dateStr: string, hijriDate: string) => void;
  currentDateStr: string;
}

export const HistoryBrowser: React.FC<HistoryBrowserProps> = ({
  onSelectHadith,
  currentDateStr
}) => {
  const { t } = useI18n();
  const [recentDays, setRecentDays] = useState<DailySelection[] | null>(null);

  // The last 30 days' Hadiths, loaded from the sunnah.com library
  useEffect(() => {
    let cancelled = false;
    const now = new Date();
    const days = Array.from({ length: 30 }, (_, i) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - i));
    Promise.all(days.map((d) => loadDailyHadithOrBundled(d))).then((list) => {
      if (!cancelled) setRecentDays(list);
    });
    return () => {
      cancelled = true;
    };
  }, [currentDateStr]);

  const handleCustomDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      const parts = val.split('-');
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      const selection = await loadDailyHadithOrBundled(d);
      onSelectHadith(selection.hadith, selection.dateString, selection.hijriDate);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Date Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-neutral-900/60 border border-white/10 backdrop-blur-md">
        <div className="space-y-1">
          <h3 className="font-serif text-xl font-semibold text-neutral-100 flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            <span>{t('Daily Hadith Archive')}</span>
          </h3>
          <p className="text-xs text-neutral-400">
            {t('Browse previous daily selections or jump to any specific date in history.')}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <label className="text-xs text-neutral-400 font-sans flex items-center space-x-2 bg-black/40 px-3 py-2 rounded-xl border border-white/10">
            <span>{t('Jump to Date:')}</span>
            <input
              type="date"
              defaultValue={currentDateStr}
              onChange={handleCustomDateChange}
              className="bg-transparent text-amber-300 text-xs focus:outline-none cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* 30-Day Timeline List */}
      {!recentDays && (
        <div className="p-8 text-center text-sm text-neutral-400 animate-pulse">{t('Loading the last 30 days…')}</div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(recentDays ?? []).map((item, idx) => (
          <HistoryCard
            key={item.dateString}
            item={item}
            daysAgo={idx}
            isToday={item.dateString === currentDateStr}
            onSelect={() => onSelectHadith(item.hadith, item.dateString, item.hijriDate)}
          />
        ))}
      </div>
    </div>
  );
};

interface HistoryCardProps {
  item: DailySelection;
  daysAgo: number;
  isToday: boolean;
  onSelect: () => void;
}

/** One day's Hadith in the archive, in the chosen language. */
const HistoryCard: React.FC<HistoryCardProps> = ({ item, daysAgo, isToday, onSelect }) => {
  const i18n = useI18n();
  const { t, language } = i18n;
  const { hadith } = useDisplayedHadith(item.hadith);
  const info = describeHadith(hadith, language);
  const displayDate = i18n.date(new Date(item.dateString + 'T00:00:00'), {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div
      onClick={onSelect}
      className={`group cursor-pointer p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
        isToday
          ? 'bg-gradient-to-r from-amber-500/15 via-[#181a24] to-[#12141d] border-amber-500/40 shadow-lg shadow-amber-500/5'
          : 'bg-neutral-900/40 hover:bg-neutral-900/80 border-white/5 hover:border-amber-500/30'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {isToday ? (
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-neutral-950 font-bold text-[10px] tracking-wider uppercase">
              {t('Today')}
            </span>
          ) : (
            <span className="text-xs font-sans text-neutral-400 font-medium">
              {daysAgo === 1 ? t('Yesterday') : t('{n} days ago', { n: daysAgo })}
            </span>
          )}
          <span className="text-xs text-neutral-300 font-medium">{displayDate}</span>
        </div>
        <span className="text-[11px] text-amber-300/80 font-sans">{i18n.hijri(getHijriDate(new Date(item.dateString + 'T00:00:00')).formatted)}</span>
      </div>

      {hadith.narrator && <div className="text-xs font-sans font-medium text-amber-400/90 truncate">{hadith.narrator}</div>}

      <p
        dir={hadith.isArabic ? 'rtl' : undefined}
        className={`${hadith.isArabic ? 'font-arabic' : 'font-serif'} text-sm leading-snug text-neutral-200 line-clamp-2`}
      >
        {hadith.isArabic ? hadith.excerpt : <>&ldquo;{hadith.excerpt}&rdquo;</>}
      </p>

      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-neutral-400">
        <span className="flex items-center gap-2 min-w-0">
          <GradeBadge hadith={hadith} />
          <span className="truncate max-w-[180px]">
            {info.collection} • {info.reference}
          </span>
        </span>
        <span className="text-amber-400 flex items-center group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
          <span>{t('View')}</span>
          <ChevronRight className="w-3.5 h-3.5 ms-0.5 rtl:rotate-180" />
        </span>
      </div>
    </div>
  );
};
