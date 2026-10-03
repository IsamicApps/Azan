import React, { useState, useEffect } from 'react';
import { IslamicPattern, IslamicCornerOrnament } from './IslamicPattern';
import { getHijriDate } from '../utils/hijri';
import { Calendar, Sparkles, Moon, Sun, Heart, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '../i18n';
import { HijriAdjust } from './HijriAdjust';
import { HIJRI_ADJUST_EVENT } from '../utils/hijri';

export const HijriCalendarView: React.FC = () => {
  const i18n = useI18n();
  const { t } = i18n;
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  // Re-render when the Hijri adjustment changes
  const [, setAdjustVersion] = useState(0);
  useEffect(() => {
    const bump = () => setAdjustVersion((v) => v + 1);
    window.addEventListener(HIJRI_ADJUST_EVENT, bump);
    return () => window.removeEventListener(HIJRI_ADJUST_EVENT, bump);
  }, []);
  const today = new Date();

  const hijriObj = getHijriDate(selectedDate);
  const hijriStr = i18n.hijri(hijriObj.formatted);
  const gregFormatted = i18n.date(selectedDate, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Calculate day of month and month grid
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Hijri months covered by this Gregorian month, e.g. "Rabiʻ II – Jumada I 1448 AH"
  const firstHijri = getHijriDate(new Date(year, month, 1));
  const lastHijri = getHijriDate(new Date(year, month, daysInMonth));
  const hijriMonthsLabel = i18n.hijri(
    firstHijri.month === lastHijri.month
      ? `${firstHijri.month} ${firstHijri.year} AH`
      : firstHijri.year === lastHijri.year
        ? `${firstHijri.month} – ${lastHijri.month} ${lastHijri.year} AH`
        : `${firstHijri.month} ${firstHijri.year} – ${lastHijri.month} ${lastHijri.year} AH`
  );

  const changeMonth = (delta: number) => {
    const nextDate = new Date(year, month + delta, 1);
    setSelectedDate(nextDate);
  };

  const isToday = (dayNum: number) => {
    return (
      dayNum === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const isSunnahFastingDay = (d: Date) => {
    const dayOfWeek = d.getDay(); // 1 = Monday, 4 = Thursday
    const isMondayOrThursday = dayOfWeek === 1 || dayOfWeek === 4;
    return isMondayOrThursday;
  };

  const isFriday = (d: Date) => d.getDay() === 5;

  const islamicEvents = [
    { name: 'Ramadan Fasting', desc: 'The holy month of obligatory fasting and Quran revelation', icon: '🌙' },
    { name: 'Laylat al-Qadr', desc: 'The Night of Decree, better than 1,000 months', icon: '✨' },
    { name: 'Eid al-Fitr', desc: '1st Shawwal - Festival of breaking the Ramadan fast', icon: '🎉' },
    { name: 'Day of Arafah', desc: '9th Dhul-Hijjah - Greatest day of Hajj, highly recommended fasting', icon: '🕋' },
    { name: 'Eid al-Adha', desc: '10th Dhul-Hijjah - Feast of the Sacrifice', icon: '🐑' },
    { name: 'Day of Ashura', desc: '10th Muharram - Sunnah fasting that expiates sins of previous year', icon: '🌊' },
    { name: 'Ayyam al-Beed (White Days)', desc: '13th, 14th & 15th of every lunar month - Sunnah fasting', icon: '🌕' }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-amber-600/20 via-(--s3) to-(--s1) border border-amber-500/40 p-6 md:p-8 shadow-2xl overflow-hidden">
        <IslamicPattern opacity={18} />
        <IslamicCornerOrnament className="absolute top-2 left-2 rotate-0 opacity-30" />
        <IslamicCornerOrnament className="absolute top-2 right-2 rotate-90 opacity-30" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5" />
              <span>{t('Islamic Hijri & Gregorian Calendar')}</span>
            </div>

            <h2 className="font-serif text-3xl md:text-5xl font-bold text-white tracking-tight">
              {hijriStr}
            </h2>

            <p className="text-xs md:text-sm text-neutral-300">
              {t('Gregorian:')} <span className="text-amber-300 font-semibold">{gregFormatted}</span>
            </p>
            <HijriAdjust />
          </div>

          <div className="flex items-center space-x-2 self-start md:self-auto">
            <button
              onClick={() => changeMonth(-1)}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white transition cursor-pointer"
              title={t('Previous Month')}
            >
              <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
            </button>
            <button
              onClick={() => setSelectedDate(new Date())}
              className="px-4 py-2 rounded-xl bg-amber-500 text-neutral-950 font-bold text-xs shadow-md transition cursor-pointer"
            >
              {t('Today')}
            </button>
            <button
              onClick={() => changeMonth(1)}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white transition cursor-pointer"
              title={t('Next Month')}
            >
              <ChevronRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid & Sunnah Fasting Badges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Month Calendar Grid */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-(--s2) border border-white/10 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div>
              <h3 className="font-serif text-lg font-bold text-white">
                {i18n.date(selectedDate, { month: 'long', year: 'numeric' })}
              </h3>
              <div className="text-[11px] text-amber-300/80">{hijriMonthsLabel}</div>
            </div>
            <div className="flex items-center space-x-3 text-[11px] text-neutral-400">
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                <span>{t('Sunnah Fasting (Mon/Thu)')}</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                <span>{t("Friday (Jumu'ah)")}</span>
              </span>
            </div>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-neutral-400">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="py-1">{t(d)}</div>
            ))}
          </div>

          {/* Day Cells */}
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="p-3 rounded-2xl bg-transparent" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateObj = new Date(year, month, dayNum);
              const isTodayCell = isToday(dayNum);
              const isFasting = isSunnahFastingDay(dateObj);
              const isFri = isFriday(dateObj);
              const hijriDay = getHijriDate(dateObj);

              return (
                <div
                  key={dayNum}
                  title={i18n.hijri(hijriDay.formatted)}
                  className={`px-1 py-2 rounded-2xl border text-center transition-all flex flex-col items-center justify-between min-h-[64px] ${
                    isTodayCell
                      ? 'bg-amber-500 text-neutral-950 font-bold border-amber-400 shadow-lg scale-105 z-10'
                      : isFri
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                      : isFasting
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-black/30 border-white/5 text-neutral-200 hover:border-white/20'
                  }`}
                >
                  <span className="text-sm font-semibold">{dayNum}</span>
                  {/* Hijri day (as on Awqat); the 1st of a month is underlined, its name is in the tooltip */}
                  <span
                    className={`text-[10px] leading-tight ${
                      isTodayCell ? 'text-neutral-900' : hijriDay.day === 1 ? 'text-amber-300 font-bold underline' : 'text-amber-300/70'
                    }`}
                  >
                    {hijriDay.day}
                  </span>

                  <div className="flex gap-1 mt-1">
                    {isFri && <span className={`w-1.5 h-1.5 rounded-full ${isTodayCell ? 'bg-neutral-900' : 'bg-amber-400'}`} title={t("Jumu'ah")} />}
                    {isFasting && <span className={`w-1.5 h-1.5 rounded-full ${isTodayCell ? 'bg-neutral-900' : 'bg-emerald-400'}`} title={t('Sunnah fast')} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sacred Islamic Days & Sunnah Fasting Guide */}
        <div className="p-6 rounded-3xl bg-(--s2) border border-white/10 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="font-serif text-lg font-bold text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{t('Sacred Islamic Occasions')}</span>
            </h3>

            <div className="space-y-2.5 max-h-96 overflow-y-auto pe-1 text-xs">
              {islamicEvents.map((ev) => (
                <div key={ev.name} className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1">
                  <div className="font-semibold text-white flex items-center space-x-1.5">
                    <span>{ev.icon}</span>
                    <span>{t(ev.name)}</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">{t(ev.desc)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-start space-x-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <span>
              &ldquo;{t("Fasting on the Day of 'Arafah expiates the sins of the preceding year and the coming year.")}&rdquo; — {t('Sahih Muslim')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
