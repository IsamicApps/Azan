import React, { useState } from 'react';
import { Hadith } from '../types/hadith';
import { IslamicPattern } from './IslamicPattern';
import { Sparkles, Calendar, BookOpen, Clock, Smartphone, ChevronRight, CheckCircle2 } from 'lucide-react';

interface WidgetSimulatorProps {
  hadith: Hadith;
  dateString: string;
  hijriDate: string;
  onSelectHadith?: (h: Hadith) => void;
  onSimulateDateChange?: (newDate: Date) => void;
}

export const WidgetSimulator: React.FC<WidgetSimulatorProps> = ({
  hadith,
  dateString,
  hijriDate,
  onSelectHadith
}) => {
  const [platform, setPlatform] = useState<'ios' | 'android'>('ios');
  const [activeTab, setActiveTab] = useState<'home' | 'lock'>('home');
  const [simulatedDateOffset, setSimulatedDateOffset] = useState<number>(0);

  const formattedDate = new Date().toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="w-full space-y-8 animate-fade-in">
      {/* Platform & Mode Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-neutral-900/60 border border-white/10 backdrop-blur-md">
        <div className="flex items-center space-x-2">
          <Smartphone className="w-5 h-5 text-amber-400" />
          <span className="font-serif text-lg font-semibold text-neutral-100">Mobile Widget Previews</span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Home vs Lock screen */}
          <div className="bg-black/50 p-1 rounded-xl border border-white/10 flex">
            <button
              onClick={() => setActiveTab('home')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === 'home' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Home Screen (2x2, 4x2, 4x4)
            </button>
            <button
              onClick={() => setActiveTab('lock')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === 'lock' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Lock Screen (Widgets)
            </button>
          </div>

          {/* Platform Toggle */}
          <div className="bg-black/50 p-1 rounded-xl border border-white/10 flex">
            <button
              onClick={() => setPlatform('ios')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                platform === 'ios' ? 'bg-white/20 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              iOS 17+ WidgetKit
            </button>
            <button
              onClick={() => setPlatform('android')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                platform === 'android' ? 'bg-white/20 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Android 14+ Glance
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'home' ? (
        /* HOME SCREEN WIDGETS */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* 1. SMALL WIDGET (2x2) */}
          <div className="flex flex-col items-center space-y-3">
            <span className="text-xs uppercase tracking-wider font-semibold text-neutral-400 flex items-center space-x-1.5">
              <span>Small Home Widget</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">2x2</span>
            </span>

            {/* Small Widget Container */}
            <div
              onClick={() => onSelectHadith && onSelectHadith(hadith)}
              className="group cursor-pointer relative w-[170px] h-[170px] rounded-[28px] bg-gradient-to-b from-[#161a24] to-[#0c0e14] border border-amber-500/30 p-4 flex flex-col justify-between shadow-2xl overflow-hidden hover:scale-[1.03] transition-all"
            >
              <IslamicPattern opacity={16} color="#d4af37" />

              {/* Widget Header */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center space-x-1 text-[10px] font-sans font-semibold text-amber-400 tracking-wider">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>HADITH</span>
                </div>
                <span className="text-[9px] font-sans text-neutral-400">{formattedDate.split(',')[0]}</span>
              </div>

              {/* Widget Text Body */}
              <div className="relative z-10 my-auto py-1">
                <p className="font-serif text-[11.5px] leading-tight text-neutral-100 line-clamp-4 font-normal">
                  &ldquo;{hadith.excerpt}&rdquo;
                </p>
              </div>

              {/* Widget Footer */}
              <div className="relative z-10 pt-1 border-t border-white/10 flex items-center justify-between text-[9px] text-neutral-400">
                <span className="truncate max-w-[100px] text-amber-300/80">Bukhari #{hadith.hadithNumber}</span>
                <span className="text-[8px] text-neutral-500">Tap to read</span>
              </div>
            </div>
            <p className="text-[11px] text-neutral-400 text-center max-w-[180px]">
              Glanceable daily wisdom for tight home screen grids.
            </p>
          </div>

          {/* 2. MEDIUM WIDGET (4x2) */}
          <div className="flex flex-col items-center space-y-3">
            <span className="text-xs uppercase tracking-wider font-semibold text-neutral-400 flex items-center space-x-1.5">
              <span>Medium Home Widget</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">4x2</span>
            </span>

            {/* Medium Widget Container */}
            <div
              onClick={() => onSelectHadith && onSelectHadith(hadith)}
              className="group cursor-pointer relative w-full max-w-[360px] h-[170px] rounded-[28px] bg-gradient-to-b from-[#161a24] via-[#10121a] to-[#090b10] border border-amber-500/35 p-5 flex flex-col justify-between shadow-2xl overflow-hidden hover:scale-[1.02] transition-all"
            >
              <IslamicPattern opacity={20} color="#d4af37" />

              {/* Top Row */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-sans font-semibold tracking-wider">
                    DAILY HADITH
                  </span>
                  <span className="text-[10px] text-neutral-400">{hijriDate || formattedDate}</span>
                </div>
                <div className="text-[10px] font-medium text-amber-400/90 truncate max-w-[120px]">
                  Sahih al-Bukhari
                </div>
              </div>

              {/* Hadith Body */}
              <div className="relative z-10 my-auto py-1">
                {hadith.narrator && (
                  <p className="text-[10px] font-sans font-medium text-amber-300/80 mb-1 truncate">
                    {hadith.narrator}
                  </p>
                )}
                <p className="font-serif text-[13px] leading-snug text-neutral-100 line-clamp-3 font-normal">
                  &ldquo;{hadith.text}&rdquo;
                </p>
              </div>

              {/* Bottom Reference */}
              <div className="relative z-10 pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px] text-neutral-400">
                <span className="truncate max-w-[200px]">
                  Book {hadith.bookNumber}: {hadith.bookName} • #{hadith.hadithNumber}
                </span>
                <span className="text-amber-400 flex items-center group-hover:translate-x-0.5 transition-transform">
                  <span>Open in App</span>
                  <ChevronRight className="w-3 h-3 ml-0.5" />
                </span>
              </div>
            </div>
            <p className="text-[11px] text-neutral-400 text-center max-w-[280px]">
              Balanced layout with narrator, readable excerpt, and citation.
            </p>
          </div>

          {/* 3. LARGE WIDGET (4x4) */}
          <div className="flex flex-col items-center space-y-3">
            <span className="text-xs uppercase tracking-wider font-semibold text-neutral-400 flex items-center space-x-1.5">
              <span>Large Home Widget / StandBy</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">4x4</span>
            </span>

            {/* Large Widget Container */}
            <div
              onClick={() => onSelectHadith && onSelectHadith(hadith)}
              className="group cursor-pointer relative w-full max-w-[340px] h-[340px] rounded-[32px] bg-gradient-to-b from-[#181c28] via-[#10131c] to-[#080a0f] border border-amber-500/35 p-6 flex flex-col justify-between shadow-2xl overflow-hidden hover:scale-[1.02] transition-all"
            >
              <IslamicPattern opacity={22} color="#d4af37" />

              {/* Large Header */}
              <div className="relative z-10 flex items-center justify-between pb-3 border-b border-amber-500/20">
                <div className="flex flex-col">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    <span className="text-xs font-sans font-bold text-amber-300 tracking-wider uppercase">
                      Daily Hadith
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-400 mt-0.5">{hijriDate}</span>
                </div>
                <span className="text-xs font-sans text-neutral-300 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                  {formattedDate}
                </span>
              </div>

              {/* Large Body */}
              <div className="relative z-10 my-auto py-2">
                {hadith.narrator && (
                  <p className="text-xs font-sans font-medium text-amber-400/90 mb-2 italic">
                    {hadith.narrator}
                  </p>
                )}
                <p className="font-serif text-[15px] md:text-base leading-relaxed text-neutral-100 font-normal">
                  &ldquo;{hadith.excerpt}&rdquo;
                </p>
                {hadith.isLong && (
                  <span className="inline-block mt-2 text-[11px] text-amber-400 font-sans font-medium">
                    (Tap to read full Hadith)
                  </span>
                )}
              </div>

              {/* Large Footer */}
              <div className="relative z-10 pt-3 border-t border-amber-500/20 space-y-1">
                <div className="text-xs font-semibold text-neutral-200">
                  Sahih al-Bukhari • Book {hadith.bookNumber}: {hadith.bookName}
                </div>
                <div className="text-[11px] text-neutral-400 flex items-center justify-between">
                  <span>Vol. {hadith.volume}, Hadith #{hadith.hadithNumber}</span>
                  <span className="text-emerald-400">PDF Page {hadith.pdfPage}</span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-neutral-400 text-center max-w-[280px]">
              Full reading experience, ideal for iPad, tablet, and iOS StandBy mode.
            </p>
          </div>
        </div>
      ) : (
        /* LOCK SCREEN WIDGETS PREVIEW */
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="relative rounded-3xl bg-neutral-950 border border-white/10 p-8 shadow-2xl overflow-hidden flex flex-col items-center text-neutral-100">
            {/* Lock Screen Clock Simulation */}
            <div className="text-center mb-8 space-y-1">
              <div className="text-xs uppercase tracking-widest text-neutral-400 font-medium">
                Lock Screen Accessory Widgets
              </div>
              <div className="font-sans text-5xl md:text-6xl font-extralight text-neutral-100 tracking-tight">
                09:41
              </div>
              <div className="text-xs text-neutral-400 font-sans">
                {formattedDate} • {hijriDate}
              </div>
            </div>

            {/* Lock Screen Accessory Widgets Tray */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              {/* 1. Inline Accessory Widget */}
              <div className="sm:col-span-3 p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs text-neutral-300 font-sans">
                <div className="flex items-center space-x-2 truncate">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">
                    Bukhari #{hadith.hadithNumber}: {hadith.narrator ? `${hadith.narrator} — ` : ''}
                    {hadith.excerpt.slice(0, 45)}...
                  </span>
                </div>
                <span className="text-[10px] text-neutral-500 uppercase shrink-0 ml-2">Inline</span>
              </div>

              {/* 2. Rectangular Accessory Widget */}
              <div className="sm:col-span-2 p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md flex flex-col justify-between h-[86px] shadow-lg">
                <div className="flex items-center justify-between text-[11px] text-amber-300 font-medium">
                  <span className="flex items-center space-x-1">
                    <Sparkles className="w-3 h-3" />
                    <span>DAILY HADITH</span>
                  </span>
                  <span className="text-[10px] text-neutral-400">Sahih al-Bukhari</span>
                </div>
                <p className="font-serif text-xs text-white line-clamp-2 leading-snug">
                  &ldquo;{hadith.excerpt}&rdquo;
                </p>
                <div className="text-[9px] text-neutral-400 truncate">
                  Book {hadith.bookNumber} • #{hadith.hadithNumber}
                </div>
              </div>

              {/* 3. Circular Accessory Widget */}
              <div className="p-3 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md flex flex-col items-center justify-center text-center h-[86px] shadow-lg space-y-1">
                <BookOpen className="w-4 h-4 text-amber-300" />
                <div className="text-[10px] font-bold text-white uppercase">HADITH</div>
                <div className="text-[9px] text-neutral-400 font-mono">#{hadith.hadithNumber}</div>
              </div>
            </div>

            <div className="mt-6 text-center text-xs text-neutral-400">
              Tapping any lock screen widget immediately launches Daily Hadith to the verified source view.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
