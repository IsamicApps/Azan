import React from 'react';
import { useHadithLanguage } from '../hooks/useHadithLanguage';
import { translate } from '../i18n';

interface LanguageToggleProps {
  /** 'tv' uses the 1920-wide TV type scale */
  size?: 'sm' | 'tv';
}

/** English / العربية switch for the Hadith text. */
export const LanguageToggle: React.FC<LanguageToggleProps> = ({ size = 'sm' }) => {
  const [language, setLanguage] = useHadithLanguage();
  const options = [
    { value: 'en' as const, label: 'English', className: 'font-sans' },
    { value: 'ar' as const, label: 'العربية', className: 'font-arabic' }
  ];
  const sizing = size === 'tv' ? 'text-[20px] px-4 py-2 rounded-xl' : 'text-xs px-3 py-1.5 rounded-full';

  return (
    <div
      role="radiogroup"
      aria-label={translate(language, 'Language')}
      className={`inline-flex items-center p-1 gap-1 bg-white/5 border border-white/10 ${size === 'tv' ? 'rounded-2xl' : 'rounded-full'}`}
    >
      {options.map((option) => (
        <button
          key={option.value}
          role="radio"
          aria-checked={language === option.value}
          title={translate(language, option.value === 'ar' ? 'Show the app and Hadith in Arabic [L]' : 'Show the app and Hadith in English [L]')}
          onClick={() => setLanguage(option.value)}
          className={`${sizing} ${option.className} font-semibold whitespace-nowrap transition cursor-pointer ${
            language === option.value
              ? 'bg-amber-500 text-neutral-950'
              : 'text-neutral-300 hover:text-white hover:bg-white/10'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};
