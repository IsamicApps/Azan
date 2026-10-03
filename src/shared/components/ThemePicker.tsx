import React from 'react';
import { Check } from 'lucide-react';
import { THEMES, useThemeChoice } from '../theme';
import { useI18n } from '../i18n';

/** Swatches for the app-wide theme (the phone, the screensaver and the TV share it). */
export const ThemePicker: React.FC = () => {
  const { t } = useI18n();
  const [theme, setTheme] = useThemeChoice();
  const selected = THEMES.find((x) => x.id === theme)!;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {THEMES.map((x) => (
          <button
            key={x.id}
            onClick={() => setTheme(x.id)}
            aria-pressed={theme === x.id}
            className={`flex items-center gap-2 py-2 px-2.5 rounded-xl border text-xs font-semibold text-start transition cursor-pointer ${
              theme === x.id ? 'border-amber-400 bg-amber-500/10 text-white' : 'border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10'
            }`}
          >
            <span className="shrink-0 w-5 h-5 rounded-full border border-white/20" style={{ background: x.swatch }} />
            <span className="flex-1 truncate">{t(x.label)}</span>
            {theme === x.id && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
          </button>
        ))}
      </div>
      {selected.description && <p className="text-[11px] text-neutral-400">{t(selected.description)}</p>}
    </div>
  );
};
