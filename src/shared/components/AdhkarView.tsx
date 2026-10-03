import React, { useState } from 'react';
import adhkarData from '../data/adhkar.json';
import { IslamicPattern, IslamicCornerOrnament } from './IslamicPattern';
import { speakDua, stopSpeaking, isSpeaking } from '../utils/speech';
import { Sun, Moon, Volume2, Square, RotateCcw, CheckCircle2, ShieldCheck, Share2, Check } from 'lucide-react';
import { useI18n } from '../i18n';

interface DhikrItem {
  id: string;
  category: 'morning' | 'evening';
  title: string;
  arabic: string;
  transliteration: string;
  translation: string;
  targetCount: number;
  virtue: string;
  source: string;
}

export const AdhkarView: React.FC = () => {
  const { t, isArabic } = useI18n();
  const [activeCategory, setActiveCategory] = useState<'morning' | 'evening'>('morning');
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const currentList = (adhkarData as DhikrItem[]).filter(d => d.category === activeCategory);

  const incrementCount = (id: string, target: number) => {
    const current = counts[id] || 0;
    if (current < target) {
      setCounts(prev => ({ ...prev, [id]: current + 1 }));
    }
  };

  const resetCount = (id: string) => {
    setCounts(prev => ({ ...prev, [id]: 0 }));
  };

  const handlePlayAudio = (item: DhikrItem) => {
    if (playingId === item.id || isSpeaking()) {
      stopSpeaking();
      setPlayingId(null);
      return;
    }

    setPlayingId(item.id);
    speakDua(
      item.arabic,
      `${item.title}. ${item.translation}`,
      () => setPlayingId(item.id),
      () => setPlayingId(null)
    );
  };

  const handleCopy = async (item: DhikrItem) => {
    try {
      await navigator.clipboard.writeText(
        isArabic
          ? `${t(item.title)}\n\n${item.arabic}\n\n${t('Virtue')}: ${t(item.virtue)}\n${t('Source')}: ${t(item.source)}`
          : `${item.title}\n\n${item.arabic}\n\n"${item.translation}"\n\nVirtue: ${item.virtue}\nSource: ${item.source}`
      );
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-emerald-950/40 via-(--s3) to-(--s1) border border-emerald-500/30 p-6 md:p-8 shadow-2xl overflow-hidden">
        <IslamicPattern opacity={16} color="var(--color-emerald-500)" />
        <IslamicCornerOrnament className="absolute top-2 left-2 rotate-0 opacity-30" />
        <IslamicCornerOrnament className="absolute top-2 right-2 rotate-90 opacity-30" />

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{t('Fortress of the Muslim • Hisn al-Muslim')}</span>
          </div>

          <h2 className="font-serif text-3xl md:text-5xl font-bold text-white tracking-tight">
            {t('Daily Morning & Evening Adhkar')}
          </h2>

          <p className="text-xs md:text-sm text-neutral-300 max-w-2xl leading-relaxed">
            {t('Authentic supplications and remembrances prescribed by the Prophet (ﷺ) for daily divine protection and peace of heart.')}
          </p>

          {/* Morning / Evening Toggle Tabs */}
          <div className="pt-3 flex items-center space-x-2">
            <button
              onClick={() => setActiveCategory('morning')}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer ${
                activeCategory === 'morning'
                  ? 'bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20'
                  : 'bg-white/10 hover:bg-white/15 text-neutral-300'
              }`}
            >
              <Sun className="w-4 h-4" />
              <span>{t('Morning Adhkar (After Fajr)')}</span>
            </button>

            <button
              onClick={() => setActiveCategory('evening')}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer ${
                activeCategory === 'evening'
                  ? 'bg-sky-500 text-neutral-950 shadow-lg shadow-sky-500/20'
                  : 'bg-white/10 hover:bg-white/15 text-neutral-300'
              }`}
            >
              <Moon className="w-4 h-4" />
              <span>{t('Evening Adhkar (After Asr/Maghrib)')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Adhkar Cards */}
      <div className="space-y-4">
        {currentList.map((item) => {
          const count = counts[item.id] || 0;
          const isCompleted = count >= item.targetCount;
          const isPlayingThis = playingId === item.id;

          return (
            <div
              key={item.id}
              onClick={() => incrementCount(item.id, item.targetCount)}
              className={`p-6 rounded-3xl border transition-all duration-300 cursor-pointer relative overflow-hidden select-none ${
                isCompleted
                  ? 'bg-emerald-950/20 border-emerald-500/40 shadow-lg'
                  : 'bg-(--s2) hover:bg-(--s3) border-white/10 hover:border-amber-500/30'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 flex items-center space-x-2">
                      <span>{t(item.title)}</span>
                    </span>

                    <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handlePlayAudio(item)}
                        className={`p-2 rounded-xl transition cursor-pointer ${
                          isPlayingThis
                            ? 'bg-amber-500 text-neutral-950 font-bold animate-pulse'
                            : 'bg-white/5 hover:bg-white/10 text-neutral-300'
                        }`}
                        title={t('Listen to audio recitation')}
                      >
                        {isPlayingThis ? <Square className="w-3.5 h-3.5 fill-current" /> : <Volume2 className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => handleCopy(item)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 transition cursor-pointer"
                        title={t('Copy Dhikr')}
                      >
                        {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => resetCount(item.id)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition cursor-pointer"
                        title={t('Reset counter')}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Arabic Text */}
                  <div dir="rtl" className="font-arabic text-xl md:text-2xl text-amber-200 leading-loose text-right py-1">
                    {item.arabic}
                  </div>

                  {/* Translation */}
                  {!isArabic && (
                    <p className="text-xs text-neutral-300 leading-relaxed font-serif italic">
                      &ldquo;{item.translation}&rdquo;
                    </p>
                  )}

                  {/* Virtue & Source Footnote */}
                  <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-neutral-400">
                    <span className="text-emerald-400/90 font-medium">✨ {t(item.virtue)}</span>
                    <span className="font-mono text-neutral-500">{t(item.source)}</span>
                  </div>
                </div>

                {/* Big Tap-to-Count Circle */}
                <div className="shrink-0 flex flex-col items-center justify-center p-3">
                  <div
                    className={`w-16 h-16 rounded-2xl border-2 flex flex-col items-center justify-center font-mono transition-all transform active:scale-95 ${
                      isCompleted
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-lg shadow-emerald-500/20'
                        : 'bg-black/40 border-amber-500/40 text-amber-300'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <>
                        <span className="text-xl font-bold">{count}</span>
                        <span className="text-[9px] text-neutral-400">/ {item.targetCount}</span>
                      </>
                    )}
                  </div>
                  <span className="text-[10px] text-neutral-400 mt-1.5 font-medium">
                    {t(isCompleted ? 'Completed' : 'Tap to Count')}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
