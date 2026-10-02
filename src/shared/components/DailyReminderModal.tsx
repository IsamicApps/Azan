import React, { useState } from 'react';
import { ReminderConfig } from '../types/hadith';
import { saveReminderConfig } from '../utils/storage';
import { Bell, Clock, Check, X, Volume2, ShieldCheck, AlertCircle } from 'lucide-react';

interface DailyReminderModalProps {
  config: ReminderConfig;
  isOpen: boolean;
  onClose: () => void;
  onUpdateConfig: (newConfig: ReminderConfig) => void;
}

export const DailyReminderModal: React.FC<DailyReminderModalProps> = ({
  config,
  isOpen,
  onClose,
  onUpdateConfig
}) => {
  const [enabled, setEnabled] = useState(config.enabled);
  const [time, setTime] = useState(config.time || '07:30');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const requestPermissionAndToggle = async (targetState: boolean) => {
    if (!targetState) {
      setEnabled(false);
      const updated = { ...config, enabled: false };
      onUpdateConfig(updated);
      saveReminderConfig(updated);
      setStatusMessage('Daily reminders disabled.');
      return;
    }

    // Only request permission when enabling
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setEnabled(true);
        const updated = { enabled: true, time, hasPermission: true };
        onUpdateConfig(updated);
        saveReminderConfig(updated);
        setStatusMessage('Notification permission granted! Daily Hadith reminder scheduled.');
      } else {
        setEnabled(false);
        setStatusMessage('Notification permission was declined. Please enable in browser settings.');
      }
    } else {
      setEnabled(true);
      const updated = { enabled: true, time, hasPermission: false };
      onUpdateConfig(updated);
      saveReminderConfig(updated);
      setStatusMessage('In-app scheduled reminder enabled.');
    }
  };

  const handleTimeChange = (newTime: string) => {
    setTime(newTime);
    if (enabled) {
      const updated = { ...config, enabled: true, time: newTime };
      onUpdateConfig(updated);
      saveReminderConfig(updated);
    }
  };

  const triggerTestNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Daily Hadith Reminder', {
        body: 'Today\'s wisdom from Sahih al-Bukhari is ready for you.',
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35" fill="%23d9ab3d"/></svg>'
      });
      setStatusMessage('Test notification sent successfully!');
    } else {
      setStatusMessage('Please grant notification permission first.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#12141c] border border-amber-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-6 text-neutral-100">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-amber-400" />
            <h3 className="font-serif text-xl font-semibold">Daily Hadith Reminder</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 leading-relaxed flex items-start space-x-2.5">
            <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong>Privacy First:</strong> Notification permissions are requested strictly on demand only when you choose to activate daily reminders.
            </div>
          </div>

          {/* Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-900/80 border border-white/10">
            <div>
              <div className="font-semibold text-sm">Enable Daily Reminder</div>
              <div className="text-xs text-neutral-400">Receive today&apos;s Hadith at your chosen time</div>
            </div>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => requestPermissionAndToggle(e.target.checked)}
              className="w-5 h-5 accent-amber-400 rounded cursor-pointer"
            />
          </div>

          {/* Time Picker */}
          {enabled && (
            <div className="p-4 rounded-xl bg-neutral-900/80 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-300">
                <span className="flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Reminder Time (Device Local Time)</span>
                </span>
              </div>
              <input
                type="time"
                value={time}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="w-full py-2.5 px-3 rounded-lg bg-black/50 border border-white/20 text-amber-300 font-mono text-base focus:outline-none focus:border-amber-400"
              />
            </div>
          )}

          {statusMessage && (
            <div className="text-xs text-emerald-400 bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20 flex items-center space-x-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {enabled && (
            <button
              onClick={triggerTestNotification}
              className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-neutral-200 transition flex items-center justify-center space-x-2 font-medium"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Send Test Notification</span>
            </button>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold transition"
        >
          Done
        </button>
      </div>
    </div>
  );
};
