import React, { useState } from 'react';
import { Hadith } from '../types/hadith';
import { Bookmark, BookmarkCheck, Volume2, VolumeX, Share2, ExternalLink, Sparkles, BookOpen, ChevronDown, ChevronUp, Check, Copy } from 'lucide-react';
import { IslamicPattern, IslamicCornerOrnament } from './IslamicPattern';
import { speakHadith, stopSpeaking, isSpeaking } from '../utils/speech';
import { ShareModal } from './ShareModal';
import { describeHadith, citeHadith, describeGrade } from '../utils/hadithLibrary';
import { GradeBadge } from './GradeBadge';

interface DailyHadithCardProps {
  hadith: Hadith;
  isFav: boolean;
  onToggleFav: () => void;
  dateLabel?: string;
  hijriDate?: string;
  onOpenScreensaver?: () => void;
  textSize?: 'normal' | 'large';
}

export const DailyHadithCard: React.FC<DailyHadithCardProps> = ({
  hadith,
  isFav,
  onToggleFav,
  dateLabel,
  hijriDate,
  onOpenScreensaver,
  textSize = 'normal'
}) => {
  const [showFull, setShowFull] = useState(!hadith.isLong);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const info = describeHadith(hadith);

  const handleAudioToggle = () => {
    if (isPlayingAudio || isSpeaking()) {
      stopSpeaking();
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      speakHadith(
        hadith.narrator,
        showFull ? hadith.text : hadith.excerpt,
        () => setIsPlayingAudio(true),
        () => setIsPlayingAudio(false)
      );
    }
  };

  const handleCopyCitation = async () => {
    const textToCopy = `"${hadith.text}"\n\n— ${hadith.narrator}\n[${citeHadith(hadith)}]\nSource: ${hadith.sourceUrl}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      setCopiedLink(true);
    }
  };

  return (
    <>
      <div className="relative w-full rounded-3xl bg-gradient-to-b from-[#131722]/90 via-[#0e111a]/95 to-[#090b10] border border-amber-500/25 shadow-2xl p-6 md:p-10 overflow-hidden transition-all duration-300 backdrop-blur-md">
        {/* Subtle Background Pattern */}
        <IslamicPattern opacity={18} color="#d4af37" />

        {/* Decorative Islamic Corner Ornaments */}
        <IslamicCornerOrnament className="absolute top-3 left-3 rotate-0 opacity-30" />
        <IslamicCornerOrnament className="absolute top-3 right-3 rotate-90 opacity-30" />
        <IslamicCornerOrnament className="absolute bottom-3 left-3 -rotate-90 opacity-30" />
        <IslamicCornerOrnament className="absolute bottom-3 right-3 rotate-180 opacity-30" />

        {/* Top Header Row */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-amber-500/15">
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Hadith of the Day</span>
              </span>
              <GradeBadge hadith={hadith} />
              {hadith.isLong && !showFull && (
                <span className="text-[11px] px-2 py-0.5 rounded bg-white/10 text-neutral-300">
                  Excerpt
                </span>
              )}
            </div>
            {hijriDate && (
              <span className="text-xs text-amber-200/70 mt-1.5 font-sans">
                {hijriDate} {dateLabel ? `• ${dateLabel}` : ''}
              </span>
            )}
          </div>

          {/* Action Icons */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <button
              onClick={handleAudioToggle}
              title={isPlayingAudio ? 'Stop Recitation' : 'Listen to Hadith'}
              className={`p-2.5 rounded-full transition-all ${
                isPlayingAudio
                  ? 'bg-amber-500 text-neutral-950 ring-4 ring-amber-500/30 animate-pulse'
                  : 'bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-amber-300'
              }`}
            >
              {isPlayingAudio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onToggleFav}
              title={isFav ? 'Remove from Favourites' : 'Save to Favourites'}
              className={`p-2.5 rounded-full transition-all ${
                isFav
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : 'bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-rose-400'
              }`}
            >
              {isFav ? <BookmarkCheck className="w-4 h-4 text-rose-400" /> : <Bookmark className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setShowShareModal(true)}
              title="Share Hadith Card"
              className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-amber-300 transition-all"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {onOpenScreensaver && (
              <button
                onClick={onOpenScreensaver}
                title="Open Peaceful Screensaver View"
                className="hidden sm:flex items-center space-x-1.5 px-3 py-2 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-medium transition-all"
              >
                <span>Screensaver</span>
              </button>
            )}
          </div>
        </div>

        {/* Narrator Section */}
        {hadith.narrator && (
          <div className="relative z-10 pt-6 pb-2">
            <p className="text-sm md:text-base font-sans font-medium text-amber-400/95 tracking-wide">
              {hadith.narrator}
            </p>
          </div>
        )}

        {/* Main Hadith Content */}
        <div className="relative z-10 py-4">
          <p
            dir={hadith.isArabic ? 'rtl' : undefined}
            className={`${hadith.isArabic ? 'font-arabic text-right' : 'font-serif'} leading-relaxed text-neutral-100 font-normal tracking-wide transition-all ${
              textSize === 'large'
                ? 'text-2xl md:text-3xl lg:text-3xl leading-relaxed md:leading-loose'
                : 'text-xl md:text-2xl lg:text-2xl leading-relaxed md:leading-loose'
            }`}
          >
            {hadith.isArabic ? (showFull ? hadith.text : hadith.excerpt) : <>&ldquo;{showFull ? hadith.text : hadith.excerpt}&rdquo;</>}
          </p>
          {hadith.isArabic && (
            <p className="mt-3 text-xs text-neutral-500 font-sans">
              sunnah.com has no English translation of this collection yet; the original Arabic is shown.
            </p>
          )}

          {/* Long Hadith Excerpt / Full Toggle */}
          {hadith.isLong && (
            <div className="mt-4 flex items-center">
              <button
                onClick={() => setShowFull(!showFull)}
                className="inline-flex items-center space-x-2 text-sm font-sans font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-4 py-2 rounded-xl border border-amber-500/30 transition-all"
              >
                <BookOpen className="w-4 h-4" />
                <span>{showFull ? 'Show Shorter Excerpt' : 'Read Full Hadith'}</span>
                {showFull ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
              </button>
            </div>
          )}
        </div>

        {/* Source Citation & Verification Footer */}
        <div className="relative z-10 mt-6 pt-5 border-t border-amber-500/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-sm font-sans font-semibold text-neutral-200 flex flex-wrap items-center gap-x-2">
              <span className="text-amber-400">{info.collection}</span>
              <span className="text-neutral-500">•</span>
              <span>{info.reference}</span>
            </div>
            <div className="text-xs text-neutral-400 flex flex-wrap items-center gap-x-3">
              <span>{info.detail}</span>
              <span>•</span>
              <span>{describeGrade(hadith).by}</span>
              <span>•</span>
              <span className="text-emerald-400 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping"></span>
                <span>{info.sourceLabel}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyCitation}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-neutral-300 hover:text-white transition flex items-center space-x-1.5"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied' : 'Copy'}</span>
            </button>

            <a
              href={hadith.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-medium border border-amber-500/25 transition"
            >
              <span>{hadith.source === 'sunnah.com' ? 'View on sunnah.com' : 'Source PDF'}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      <ShareModal
        hadith={hadith}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        dateString={dateLabel}
        hijriDate={hijriDate}
      />
    </>
  );
};
