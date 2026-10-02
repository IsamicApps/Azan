import React, { useState } from 'react';
import { IslamicPattern, IslamicCornerOrnament } from './IslamicPattern';
import { Mosque } from '../utils/prayerTimes';
import { Volume2, VolumeX, X, Sparkles, Building2, Bell, Check } from 'lucide-react';
import { stopAzan, getAzanSettings, saveAzanSettings, AzanSettings } from '../utils/azanAudio';

interface AzanLiveModalProps {
  isOpen: boolean;
  prayerName: string;
  prayerTime: string;
  mosque: Mosque;
  onClose: () => void;
}

export const AzanLiveModal: React.FC<AzanLiveModalProps> = ({
  isOpen,
  prayerName,
  prayerTime,
  mosque,
  onClose
}) => {
  const [settings, setSettings] = useState<AzanSettings>(getAzanSettings());
  const [copiedDua, setCopiedDua] = useState(false);

  if (!isOpen) return null;

  const handleStop = () => {
    stopAzan();
    onClose();
  };

  const duaAfterAdhanArabic = "اللَّهُمَّ رَبَّ هَذِهِ الدَّعْوَةِ التَّامَّةِ، وَالصَّلَاةِ الْقَائِمَةِ، آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ، وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ";
  const duaTranslation = "O Allah, Lord of this perfect call and established prayer, grant Muhammad the status of intercession and nobility, and raise him to the praised position which You have promised him.";

  const handleCopyDua = async () => {
    try {
      await navigator.clipboard.writeText(`${duaAfterAdhanArabic}\n\n"${duaTranslation}"\n— Sahih al-Bukhari #614`);
      setCopiedDua(true);
      setTimeout(() => setCopiedDua(false), 2000);
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg animate-fade-in select-none">
      <div className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#161a28] via-[#0f1320] to-[#080a10] border border-amber-500/40 p-6 md:p-8 shadow-2xl overflow-hidden flex flex-col justify-between text-neutral-100 max-h-[92vh] overflow-y-auto">
        <IslamicPattern opacity={24} color="#d4af37" />
        <IslamicCornerOrnament className="absolute top-3 left-3 rotate-0 opacity-40" />
        <IslamicCornerOrnament className="absolute top-3 right-3 rotate-90 opacity-40" />
        <IslamicCornerOrnament className="absolute bottom-3 left-3 -rotate-90 opacity-40" />
        <IslamicCornerOrnament className="absolute bottom-3 right-3 rotate-180 opacity-40" />

        {/* Top Header */}
        <div className="relative z-10 flex items-center justify-between pb-3 border-b border-amber-500/20">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-xs font-sans font-bold tracking-widest text-amber-300 uppercase">
              Azan (Adhan) Now Playing
            </span>
          </div>

          <button
            onClick={handleStop}
            className="p-1.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Center Animated Azan Calligraphy */}
        <div className="relative z-10 py-6 text-center space-y-4">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold">
            <Building2 className="w-3.5 h-3.5" />
            <span>{mosque.name} ({mosque.suburb}, {mosque.state})</span>
          </div>

          <div>
            <div className="text-xs uppercase tracking-widest text-neutral-400 font-medium">Time for</div>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-white tracking-wide mt-1">
              {prayerName} Prayer
            </h2>
            <div className="text-sm font-mono text-amber-400 font-semibold mt-0.5">{prayerTime}</div>
          </div>

          {/* Arabic Calligraphy Banner */}
          <div className="p-4 rounded-2xl bg-black/40 border border-amber-500/20">
            <p className="font-arabic text-2xl md:text-3xl text-amber-200 leading-loose">
              حَيَّ عَلَى الصَّلَاةِ • حَيَّ عَلَى الْفَلَاحِ
            </p>
            <p className="text-xs text-neutral-400 mt-1 italic font-serif">
              &ldquo;Hasten to Prayer • Hasten to Success&rdquo;
            </p>
          </div>

          {/* Animated Audio Equalizer Bars */}
          <div className="flex items-center justify-center space-x-1.5 py-2">
            {[40, 75, 55, 90, 65, 80, 45, 95, 60, 85, 50].map((h, idx) => (
              <span
                key={idx}
                className="w-1.5 bg-gradient-to-t from-amber-500 to-amber-200 rounded-full animate-pulse"
                style={{
                  height: `${h * 0.35}px`,
                  animationDelay: `${idx * 120}ms`,
                  animationDuration: '900ms'
                }}
              />
            ))}
          </div>

          {/* Du'a after Adhan */}
          <div className="p-4 rounded-2xl bg-neutral-900/80 border border-white/10 text-left space-y-2">
            <div className="flex items-center justify-between text-[11px] text-amber-400 font-semibold">
              <span>Du&apos;a after Azan (Bukhari #614)</span>
              <button
                onClick={handleCopyDua}
                className="text-neutral-400 hover:text-white flex items-center space-x-1"
              >
                {copiedDua ? <Check className="w-3 h-3 text-emerald-400" /> : null}
                <span>{copiedDua ? 'Copied' : 'Copy Du\'a'}</span>
              </button>
            </div>
            <p className="font-arabic text-sm text-neutral-200 leading-relaxed text-right dir-rtl">
              {duaAfterAdhanArabic}
            </p>
            <p className="font-serif text-xs text-neutral-400 italic">
              &ldquo;{duaTranslation}&rdquo;
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="relative z-10 pt-3 border-t border-white/10 flex items-center justify-between gap-3">
          <div className="text-[11px] text-neutral-400">
            Source: <a href="https://islamic.network/api/" target="_blank" rel="noopener noreferrer" className="underline text-amber-400">Islamic Network API</a> & <a href="https://www.awqat.com.au/" target="_blank" rel="noopener noreferrer" className="underline text-emerald-400">Awqat.com.au</a>
          </div>

          <button
            onClick={handleStop}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-lg transition"
          >
            Dismiss Azan
          </button>
        </div>
      </div>
    </div>
  );
};
