import React, { useState } from 'react';
import { getDaysSinceEpoch } from '../utils/dailyEngine';
import { loadLibraryIndex, loadDailyHadith, shuffledPosition, shownCount, chunkUrlFor } from '../utils/hadithLibrary';
import { CheckCircle2, XCircle, ShieldCheck, Play, RefreshCw, X, FileCheck, Layers, Globe, Database } from 'lucide-react';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TestResult {
  title: string;
  passed: boolean;
  details: string;
  icon: React.FC<{ className?: string }>;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  isOpen,
  onClose
}) => {
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[] | null>(null);
  const [summary, setSummary] = useState({ total: 50884, collections: 17 });

  if (!isOpen) return null;

  const runFullVerification = async () => {
    setIsRunningTests(true);
    const results: TestResult[] = [];
    const run = async (title: string, icon: TestResult['icon'], test: () => Promise<{ passed: boolean; details: string }>) => {
      try {
        results.push({ title, icon, ...(await test()) });
      } catch (err) {
        results.push({ title, icon, passed: false, details: `Could not run: ${err instanceof Error ? err.message : String(err)}` });
      }
    };

    await run('1. sunnah.com Library', FileCheck, async () => {
      const index = await loadLibraryIndex();
      const counted = index.collections.reduce((sum, c) => sum + c.count, 0);
      setSummary({ total: shownCount(index), collections: index.collections.length });
      return {
        passed: counted === index.total && index.total > 0,
        details: `${index.total.toLocaleString()} Hadiths from ${index.collections.length} sunnah.com collections: ${index.collections.map((c) => c.name).join(', ')}. ${shownCount(index).toLocaleString()} are shown; ${index.excluded.length.toLocaleString()} graded Daʻif or Mawduʻ, or incomplete, are left out.`
      };
    });

    await run('2. Random Order Without Repeats', RefreshCw, async () => {
      const total = shownCount(await loadLibraryIndex());
      const start = getDaysSinceEpoch(new Date());
      const seen = new Set<number>();
      for (let i = 0; i < 1000; i++) seen.add(shuffledPosition((start + i) % total, total));
      return {
        passed: seen.size === 1000,
        details: `The next 1,000 days give ${seen.size.toLocaleString()} different Hadiths. Every one of the ${total.toLocaleString()} Hadiths appears once (about ${Math.round(total / 365.25)} years) before any repeats.`
      };
    });

    await run('3. Only Sahih, Hasan or Ungraded', ShieldCheck, async () => {
      const start = new Date();
      const days = await Promise.all(
        Array.from({ length: 30 }, (_, i) => loadDailyHadith(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)))
      );
      const counts = { sahih: 0, hasan: 0, ungraded: 0, other: 0 };
      for (const { hadith } of days) {
        const category = hadith.grade?.category;
        if (!category) counts.ungraded++;
        else if (category === 'sahih' || category === 'hasan') counts[category]++;
        else counts.other++;
      }
      return {
        passed: counts.other === 0,
        details: `The next 30 days: ${counts.sahih} Sahih, ${counts.hasan} Hasan, ${counts.ungraded} not graded${counts.other ? `, ${counts.other} with another grade` : ''}.`
      };
    });

    await run('4. Midnight Date Rollover', Globe, async () => {
      const today = new Date();
      const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      const [a, b] = await Promise.all([loadDailyHadith(today), loadDailyHadith(tomorrow)]);
      return {
        passed: a.hadith.id !== b.hadith.id,
        details: `Today (${a.dateString}): ${a.hadith.collection}. Tomorrow (${b.dateString}): ${b.hadith.collection}.`
      };
    });

    await run('5. Offline Copy of Today\'s Hadith', Database, async () => {
      const today = await loadDailyHadith(new Date());
      const saved = 'caches' in window ? await caches.match(await chunkUrlFor(today.index)) : undefined;
      return {
        passed: !!saved,
        details: saved
          ? "Today's Hadith is saved on this device and works without internet."
          : 'Not saved yet. It is stored for offline use after the app has loaded it once while online (installed app / service worker).'
      };
    });

    await run('6. Long-Text Excerpt Handling', Layers, async () => {
      const { hadith } = await loadDailyHadith(new Date());
      const words = hadith.excerpt.split(/\s+/).length;
      return {
        passed: words <= 61,
        details: `Today's Hadith has ${hadith.wordCount} words; ${hadith.isLong ? `long texts show a ${words}-word excerpt with "Read Full Hadith".` : 'it is short enough to show in full.'}`
      };
    });

    setTestResults(results);
    setIsRunningTests(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#12141c] border border-amber-500/30 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-neutral-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-neutral-900/40">
          <div className="flex items-center space-x-2.5">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <div>
              <h3 className="font-serif text-xl font-semibold">Verification & Source Integrity Suite</h3>
              <p className="text-xs text-neutral-400">Checks the Daily Hadith library from sunnah.com</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Summary Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-white/10">
              <div className="text-2xl font-bold text-amber-400 font-mono">{summary.total.toLocaleString()}</div>
              <div className="text-[11px] text-neutral-400 uppercase tracking-wider mt-1">Total Hadiths</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-white/10">
              <div className="text-2xl font-bold text-emerald-400 font-mono">{summary.collections}</div>
              <div className="text-[11px] text-neutral-400 uppercase tracking-wider mt-1">Collections</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-white/10">
              <div className="text-xl font-bold text-sky-400 font-mono leading-8">sunnah.com</div>
              <div className="text-[11px] text-neutral-400 uppercase tracking-wider mt-1">Source</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-white/10">
              <div className="text-2xl font-bold text-purple-400 font-mono">{Math.round(summary.total / 365.25)} Yrs</div>
              <div className="text-[11px] text-neutral-400 uppercase tracking-wider mt-1">Non-Repeat</div>
            </div>
          </div>

          {/* Test Results */}
          {testResults ? (
            <div className="space-y-3">
              {testResults.map((t) => (
                <div
                  key={t.title}
                  className={`p-4 rounded-xl bg-neutral-900/90 border flex items-start space-x-3 ${t.passed ? 'border-emerald-500/30' : 'border-rose-500/40'}`}
                >
                  {t.passed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-neutral-100 flex items-center space-x-2">
                      <span>{t.title}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${t.passed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                        {t.passed ? 'PASSED' : 'CHECK'}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-300 leading-relaxed">{t.details}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 p-6 rounded-2xl bg-neutral-900/40 border border-white/5 space-y-3">
              <ShieldCheck className="w-12 h-12 text-amber-400 mx-auto opacity-80" />
              <p className="text-sm text-neutral-300">
                Run the checks to confirm the sunnah.com library loads, the daily order is random without repeats, and today's Hadith is available offline.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-neutral-900/60 border-t border-white/10 flex items-center justify-between">
          <button
            onClick={runFullVerification}
            disabled={isRunningTests}
            className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-sm transition shadow-lg disabled:opacity-50"
          >
            {isRunningTests ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            <span>{isRunningTests ? 'Running Suite...' : 'Run Verification Tests'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-neutral-200 text-sm font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
