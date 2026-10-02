import React, { useRef, useState } from 'react';
import { Hadith } from '../types/hadith';
import { X, Copy, Check, Download, Share2 } from 'lucide-react';
import { IslamicPattern, IslamicCornerOrnament } from './IslamicPattern';
import { toPng } from 'html-to-image';

interface ShareModalProps {
  hadith: Hadith;
  isOpen: boolean;
  onClose: () => void;
  dateString?: string;
  hijriDate?: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  hadith,
  isOpen,
  onClose,
  dateString,
  hijriDate
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const formattedText = `"${hadith.text}"\n\n— ${hadith.narrator || 'Sahih al-Bukhari'}\n[${hadith.collection}, Vol. ${hadith.volume}, Book ${hadith.bookNumber} (${hadith.bookName}), Hadith #${hadith.hadithNumber}, PDF p. ${hadith.pdfPage}]\nSource: ${hadith.sourceUrl}`;

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(formattedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
    }
  };

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    try {
      setIsExporting(true);
      const dataUrl = await toPng(cardRef.current, { quality: 0.95, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `DailyHadith-Bukhari-v${hadith.volume}-b${hadith.bookNumber}-n${hadith.hadithNumber}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error generating image:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#12141c] border border-amber-500/20 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <Share2 className="w-5 h-5 text-amber-400" />
            <h3 className="font-serif text-xl text-neutral-100 font-semibold tracking-wide">Share Hadith</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Card Preview */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center">
          <div
            ref={cardRef}
            className="relative w-full rounded-2xl bg-gradient-to-b from-[#0e1017] via-[#07090e] to-[#040608] border border-amber-500/30 p-8 shadow-2xl flex flex-col justify-between overflow-hidden text-center select-none"
          >
            <IslamicPattern opacity={22} color="#d4af37" />
            <IslamicCornerOrnament className="absolute top-2 left-2 rotate-0" />
            <IslamicCornerOrnament className="absolute top-2 right-2 rotate-90" />
            <IslamicCornerOrnament className="absolute bottom-2 left-2 -rotate-90" />
            <IslamicCornerOrnament className="absolute bottom-2 right-2 rotate-180" />

            {/* Header Badge */}
            <div className="relative z-10 mb-4 flex flex-col items-center">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs tracking-wider uppercase font-sans font-medium">
                <span>Daily Hadith</span>
                <span>•</span>
                <span>Sahih al-Bukhari</span>
              </div>
              {hijriDate && (
                <span className="text-[11px] text-amber-200/60 mt-1 font-sans">{hijriDate}</span>
              )}
            </div>

            {/* Narrator */}
            {hadith.narrator && (
              <p className="relative z-10 text-sm font-sans font-medium text-amber-300/90 mb-3 tracking-wide italic">
                {hadith.narrator}
              </p>
            )}

            {/* Hadith Main Text */}
            <div className="relative z-10 my-auto py-2">
              <p className="font-serif text-lg md:text-xl leading-relaxed text-neutral-100 font-normal">
                &ldquo;{hadith.text}&rdquo;
              </p>
            </div>

            {/* Source Reference Footer */}
            <div className="relative z-10 mt-6 pt-4 border-t border-amber-500/20 text-xs text-neutral-400 flex flex-col items-center space-y-1">
              <div className="font-medium text-amber-400">
                Book {hadith.bookNumber}: {hadith.bookName} • Hadith #{hadith.hadithNumber}
              </div>
              <div className="text-[11px] text-neutral-500">
                Volume {hadith.volume} • PDF Page {hadith.pdfPage} (Verified Text)
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-black/40 border-t border-white/10 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleCopyText}
            className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-neutral-200 hover:text-white transition font-sans text-sm font-medium"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Citation Copied!' : 'Copy Citation Text'}</span>
          </button>
          <button
            onClick={handleDownloadImage}
            disabled={isExporting}
            className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 transition font-sans text-sm font-semibold shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Generating...' : 'Download Image Card'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
