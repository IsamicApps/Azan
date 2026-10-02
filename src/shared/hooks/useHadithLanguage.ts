import { useEffect, useState } from 'react';
import { Hadith } from '../types/hadith';
import { loadArabicText, withArabicText } from '../utils/hadithLibrary';

export type HadithLanguage = 'en' | 'ar';

const STORAGE_KEY = 'daily_hadith_language';
const CHANGE_EVENT = 'hadith-language-change';

export function getHadithLanguage(): HadithLanguage {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'ar' ? 'ar' : 'en';
  } catch {
    return 'en';
  }
}

export function setHadithLanguage(language: HadithLanguage): void {
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // Storage blocked: the choice still applies until the page is reloaded
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: language }));
}

/** The chosen Hadith language, kept in sync across every view that uses it. */
export function useHadithLanguage(): [HadithLanguage, (language: HadithLanguage) => void] {
  const [language, setLanguage] = useState<HadithLanguage>(getHadithLanguage);
  useEffect(() => {
    const onChange = (e: Event) => setLanguage((e as CustomEvent<HadithLanguage>).detail);
    const onStorage = (e: StorageEvent) => e.key === STORAGE_KEY && setLanguage(getHadithLanguage());
    window.addEventListener(CHANGE_EVENT, onChange);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(CHANGE_EVENT, onChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);
  return [language, setHadithLanguage];
}

/**
 * The Hadith as it should be displayed in the chosen language. In Arabic mode the
 * English is shown until the Arabic has loaded, and stays when there is no Arabic
 * (the bundled offline Bukhari collection); `arabicUnavailable` is then true.
 */
export function useDisplayedHadith<T extends Hadith | null>(hadith: T): { hadith: T; language: HadithLanguage; arabicUnavailable: boolean } {
  const [language] = useHadithLanguage();
  const [arabic, setArabic] = useState<{ id: string; text: string | null } | null>(null);
  const id = hadith?.id;

  useEffect(() => {
    if (!hadith || language !== 'ar') return;
    let cancelled = false;
    loadArabicText(hadith)
      .then((text) => !cancelled && setArabic({ id: hadith.id, text }))
      .catch(() => !cancelled && setArabic({ id: hadith.id, text: null }));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, language]);

  if (!hadith || language !== 'ar') return { hadith, language, arabicUnavailable: false };
  if (arabic?.id === hadith.id && arabic.text) return { hadith: withArabicText(hadith, arabic.text) as T, language, arabicUnavailable: false };
  return { hadith, language, arabicUnavailable: arabic?.id === hadith.id };
}
