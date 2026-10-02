import React, { useState } from 'react';
import { Hadith, DailySelection } from '../types/hadith';
import { getRecentDailyHadiths, getDailyHadith } from '../utils/dailyEngine';
import { Calendar, ChevronRight, ChevronLeft, BookOpen, Clock, Sparkles } from 'lucide-react';

interface HistoryBrowserProps {
  onSelectHadith: (hadith: Hadith, dateStr: string, hijriDate: string) => void;
  currentDateStr: string;
}

export const HistoryBrowser: React.FC<HistoryBrowserProps> = ({
  onSelectHadith,
  currentDateStr
}) => {
  const [selectedOffsetDays, setSelectedOffsetDays] = useState(0);
  const recentDays = getRecentDailyHadiths(30, new Date());

  const handleCustomDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      const parts = val.split('-');
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      const selection = getDailyHadith(d);
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
            <span>Daily Hadith Archive</span>
          </h3>
          <p className="text-xs text-neutral-400">
            Browse previous daily selections or jump to any specific date in history.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <label className="text-xs text-neutral-400 font-sans flex items-center space-x-2 bg-black/40 px-3 py-2 rounded-xl border border-white/10">
            <span>Jump to Date:</span>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recentDays.map((item, idx) => {
          const isToday = item.dateString === currentDateStr;
          const displayDate = new Date(item.dateString + 'T00:00:00').toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });

          return (
            <div
              key={item.dateString}
              onClick={() => onSelectHadith(item.hadith, item.dateString, item.hijriDate)}
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
                      Today
                    </span>
                  ) : (
                    <span className="text-xs font-sans text-neutral-400 font-medium">
                      {idx === 1 ? 'Yesterday' : `${idx} days ago`}
                    </span>
                  )}
                  <span className="text-xs text-neutral-300 font-medium">{displayDate}</span>
                </div>
                <span className="text-[11px] text-amber-300/80 font-sans">{item.hijriDate}</span>
              </div>

              {item.hadith.narrator && (
                <div className="text-xs font-sans font-medium text-amber-400/90 truncate">
                  {item.hadith.narrator}
                </div>
              )}

              <p className="font-serif text-sm leading-snug text-neutral-200 line-clamp-2">
                &ldquo;{item.hadith.excerpt}&rdquo;
              </p>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-neutral-400">
                <span className="truncate max-w-[220px]">
                  Book {item.hadith.bookNumber}: {item.hadith.bookName} • #{item.hadith.hadithNumber}
                </span>
                <span className="text-amber-400 flex items-center group-hover:translate-x-1 transition-transform">
                  <span>View</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
