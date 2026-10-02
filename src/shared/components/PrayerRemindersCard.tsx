import React, { useState } from 'react';
import { BellRing } from 'lucide-react';
import { getReminderSettings, saveReminderSettings, PrayerReminderSettings, REMINDER_PRAYERS } from '../utils/prayerReminders';
import { useI18n } from '../i18n';

const MINUTE_CHOICES: PrayerReminderSettings['minutesBefore'][] = [0, 5, 10, 15, 30];

/** Settings for the notifications before each prayer's Adhan and Iqamah. */
export const PrayerRemindersCard: React.FC = () => {
  const i18n = useI18n();
  const { t } = i18n;
  const [settings, setSettings] = useState(getReminderSettings);
  const [note, setNote] = useState<string | null>(null);

  const update = async (patch: Partial<PrayerReminderSettings>) => {
    const next = { ...settings, ...patch };
    const anyOn = (s: PrayerReminderSettings) => s.minutesBefore > 0 || s.beforeIqamah || s.suhoorMinutes > 0 || s.iftar;
    const turningOn = anyOn(next) && !anyOn(settings);
    if (turningOn && 'Notification' in window && Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setNote(t('Notification permission was declined. Please enable in browser settings.'));
        return;
      }
    }
    if (!('Notification' in window)) setNote(t('This browser cannot show notifications.'));
    setSettings(next);
    saveReminderSettings(next);
  };

  return (
    <div className="p-5 rounded-3xl bg-[#11131c] border border-white/10 space-y-3">
      <div className="flex items-center gap-2">
        <BellRing className="w-5 h-5 text-amber-400" />
        <h4 className="font-semibold text-sm text-white">{t('Prayer Reminders')}</h4>
      </div>

      <div className="space-y-1.5">
        <div className="text-xs text-neutral-300">{t('Notify me before the Adhan')}</div>
        <div className="flex flex-wrap gap-1.5">
          {MINUTE_CHOICES.map((n) => (
            <button
              key={n}
              onClick={() => update({ minutesBefore: n })}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                settings.minutesBefore === n ? 'bg-amber-500 text-neutral-950' : 'bg-white/5 text-neutral-300 hover:bg-white/10'
              }`}
            >
              {n === 0 ? t('Off') : t('{n} min', { n })}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {REMINDER_PRAYERS.map((p) => (
          <label key={p} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 text-xs text-neutral-200 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.prayers[p]}
              onChange={(e) => update({ prayers: { ...settings.prayers, [p]: e.target.checked } })}
              className="accent-amber-400"
            />
            <span>{i18n.prayer(p)}</span>
          </label>
        ))}
      </div>

      <label className="flex items-center justify-between gap-3 text-xs text-neutral-200 cursor-pointer">
        <span>{t('Also 5 minutes before the Iqamah')}</span>
        <input
          type="checkbox"
          checked={settings.beforeIqamah}
          onChange={(e) => update({ beforeIqamah: e.target.checked })}
          className="w-4 h-4 accent-amber-400"
        />
      </label>

      <div className="pt-2 border-t border-white/5 space-y-1.5">
        <div className="text-xs text-neutral-300">{t('Ramadan: wake me for Suhoor')}</div>
        <div className="flex flex-wrap gap-1.5">
          {([0, 30, 45, 60, 90] as const).map((n) => (
            <button
              key={n}
              onClick={() => update({ suhoorMinutes: n })}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                settings.suhoorMinutes === n ? 'bg-emerald-500 text-neutral-950' : 'bg-white/5 text-neutral-300 hover:bg-white/10'
              }`}
            >
              {n === 0 ? t('Off') : t('{n} min before Fajr', { n })}
            </button>
          ))}
        </div>
        <label className="flex items-center justify-between gap-3 text-xs text-neutral-200 cursor-pointer">
          <span>{t('Ramadan: notify me at Iftar')}</span>
          <input type="checkbox" checked={settings.iftar} onChange={(e) => update({ iftar: e.target.checked })} className="w-4 h-4 accent-emerald-400" />
        </label>
      </div>

      <p className="text-[11px] text-neutral-500">
        {t('Reminders arrive while the app is open or installed and running in the background; phones may pause it to save battery.')}
      </p>
      {note && <p className="text-[11px] text-rose-300">{note}</p>}
    </div>
  );
};
