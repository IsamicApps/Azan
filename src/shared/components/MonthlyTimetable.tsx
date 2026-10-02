import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Printer, X } from 'lucide-react';
import { Mosque, calculateMosquePrayerTimes } from '../utils/prayerTimes';
import { getHijriDate } from '../utils/hijri';
import { useI18n } from '../i18n';

interface MonthlyTimetableProps {
  mosque: Mosque;
  onClose: () => void;
}

const PRAYERS = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;

/** "04:24 AM" -> "4:24": mosque timetables leave out AM/PM */
const short = (time: string | undefined) => (time ? time.replace(/\s?(AM|PM)$/, '').replace(/^0/, '') : '');

/** A month of prayer and Iqamah times for one mosque, printable or saved as PDF. */
export const MonthlyTimetable: React.FC<MonthlyTimetableProps> = ({ mosque, onClose }) => {
  const i18n = useI18n();
  const { t } = i18n;
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const rows = useMemo(() => {
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return Array.from({ length: days }, (_, i) => {
      const date = new Date(month.getFullYear(), month.getMonth(), i + 1, 12);
      const r = calculateMosquePrayerTimes(mosque, date);
      return {
        date,
        hijri: getHijriDate(date),
        times: [r.fajr, r.sunrise, r.dhuhr, r.asr, r.maghrib, r.isha],
        iqama: [r.iqama.Fajr, undefined, r.isFriday ? undefined : r.iqama.Dhuhr, r.iqama.Asr, r.iqama.Maghrib, r.iqama.Isha],
        isFriday: r.isFriday,
        isToday: date.toDateString() === new Date().toDateString()
      };
    });
  }, [month, mosque]);

  // Printed on its own: everything else on the page is hidden while it is open (see index.css)
  useEffect(() => {
    document.body.classList.add('printing-timetable');
    return () => document.body.classList.remove('printing-timetable');
  }, []);

  const changeMonth = (delta: number) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));

  return createPortal(
    <div className="timetable-portal fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-start justify-center p-3 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="timetable-print w-full max-w-4xl rounded-3xl bg-[#11131c] border border-amber-500/30 p-4 md:p-6 space-y-4 text-neutral-100 print:bg-white print:text-black print:border-0 print:rounded-none">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-serif text-xl md:text-2xl font-bold">{t('Monthly Prayer Timetable')}</h3>
            <p className="text-xs text-neutral-400 print:text-neutral-700">{mosque.name}</p>
            <p className="text-sm font-semibold text-amber-300 print:text-black">
              {i18n.date(month, { month: 'long', year: 'numeric' })}
              {' • '}
              {i18n.hijri(
                rows[0].hijri.month === rows[rows.length - 1].hijri.month
                  ? `${rows[0].hijri.month} ${rows[0].hijri.year} AH`
                  : `${rows[0].hijri.month} – ${rows[rows.length - 1].hijri.month} ${rows[rows.length - 1].hijri.year} AH`
              )}
            </p>
          </div>
          <div className="flex items-center gap-1.5 print:hidden">
            <button onClick={() => changeMonth(-1)} className="p-2 rounded-xl bg-white/10 hover:bg-white/15 cursor-pointer" title={t('Previous Month')}>
              <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
            </button>
            <button onClick={() => changeMonth(1)} className="p-2 rounded-xl bg-white/10 hover:bg-white/15 cursor-pointer" title={t('Next Month')}>
              <ChevronRight className="w-4 h-4 rtl:rotate-180" />
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 text-neutral-950 text-xs font-bold cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{t('Print / Save PDF')}</span>
            </button>
            <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/15 cursor-pointer" title={t('Close')}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[10px] sm:text-[11px] md:text-xs text-center border-collapse">
            <thead>
              <tr className="text-amber-300 print:text-black border-b border-white/15 print:border-black">
                <th className="py-2 px-1 text-start">{t('Date')}</th>
                <th className="py-2 px-1">{t('Hijri')}</th>
                {PRAYERS.map((p) => (
                  <th key={p} className="py-2 px-1">{i18n.prayer(p)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.date.getDate()}
                  className={`border-b border-white/5 print:border-neutral-300 ${
                    row.isToday ? 'bg-amber-500/15 print:bg-transparent' : row.isFriday ? 'bg-white/5 print:bg-neutral-100' : ''
                  }`}
                >
                  <td className="py-1.5 px-0.5 sm:px-1 text-start whitespace-nowrap">{i18n.date(row.date, { weekday: 'short', day: 'numeric' })}</td>
                  <td className="py-1.5 px-0.5 sm:px-1 whitespace-nowrap text-amber-200/80 print:text-black">
                    {row.hijri.day === 1 ? i18n.hijri(`1 ${row.hijri.month}`) : row.hijri.day}
                  </td>
                  {row.times.map((time, i) => (
                    <td key={i} className="py-1.5 px-0.5 sm:px-1 font-mono whitespace-nowrap">
                      <div>{short(time)}</div>
                      {row.iqama[i] && <div className="text-[9px] sm:text-[10px] text-emerald-300/80 print:text-neutral-600">{short(row.iqama[i])}</div>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-neutral-500 print:text-neutral-600">
          {t('Green: Iqamah. Fridays are shaded (Jumu’ah: {jumuah}).', { jumuah: i18n.time(calculateMosquePrayerTimes(mosque, new Date()).jumuah) })}
        </p>
      </div>
    </div>,
    document.body
  );
};
