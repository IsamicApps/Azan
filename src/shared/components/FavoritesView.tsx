import React, { useState } from 'react';
import { Hadith, FavoriteItem } from '../types/hadith';
import { BookmarkCheck, Trash2, Search, Share2, Download, BookOpen, ExternalLink, MessageSquare } from 'lucide-react';
import { describeHadith, citeHadith } from '../utils/hadithLibrary';

interface FavoritesViewProps {
  favorites: FavoriteItem[];
  onRemoveFavorite: (id: string) => void;
  onSelectHadith: (hadith: Hadith) => void;
  onUpdateNote?: (id: string, notes: string) => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  favorites,
  onRemoveFavorite,
  onSelectHadith
}) => {
  const [query, setQuery] = useState('');

  const filtered = favorites.filter((f) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      f.hadith.text.toLowerCase().includes(q) ||
      f.hadith.narrator.toLowerCase().includes(q) ||
      f.hadith.bookName.toLowerCase().includes(q)
    );
  });

  const exportFavoritesText = () => {
    const text = favorites
      .map(
        (f, i) =>
          `[${i + 1}] "${f.hadith.text}"\n— ${f.hadith.narrator}\n${citeHadith(f.hadith)}\n`
      )
      .join('\n---\n\n');

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DailyHadith-Favorites-${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-neutral-900/60 border border-white/10 backdrop-blur-md">
        <div className="space-y-1">
          <h3 className="font-serif text-xl font-semibold text-neutral-100 flex items-center space-x-2">
            <BookmarkCheck className="w-5 h-5 text-rose-400" />
            <span>Saved Favourites</span>
          </h3>
          <p className="text-xs text-neutral-400">
            Your personal collection of cherished Hadiths for reflection and contemplation.
          </p>
        </div>

        {favorites.length > 0 && (
          <button
            onClick={exportFavoritesText}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-neutral-200 hover:text-white transition"
          >
            <Download className="w-4 h-4" />
            <span>Export Collection</span>
          </button>
        )}
      </div>

      {/* Search within Favorites */}
      {favorites.length > 3 && (
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search saved Hadiths..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-900/50 border border-white/10 text-neutral-100 text-sm focus:outline-none focus:border-amber-400/50"
          />
        </div>
      )}

      {/* Favorites List */}
      {favorites.length === 0 ? (
        <div className="text-center py-16 p-8 rounded-3xl bg-neutral-900/30 border border-white/5 space-y-4">
          <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto">
            <BookmarkCheck className="w-7 h-7 text-rose-400" />
          </div>
          <h4 className="font-serif text-xl text-neutral-200">No Favourites Saved Yet</h4>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            Tap the bookmark icon on any Daily Hadith to save it to your personal spiritual collection.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => (
            <div
              key={item.hadithId}
              className="p-5 rounded-2xl bg-[#12141c]/80 border border-white/10 hover:border-amber-500/30 transition-all flex flex-col justify-between space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-xs font-sans font-semibold text-amber-400">
                    {describeHadith(item.hadith).collection} • {describeHadith(item.hadith).reference}
                  </span>
                  {item.hadith.narrator && (
                    <p className="text-xs text-neutral-300 font-medium italic">{item.hadith.narrator}</p>
                  )}
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => onSelectHadith(item.hadith)}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-medium border border-amber-500/20 transition"
                  >
                    View Card
                  </button>
                  <button
                    onClick={() => onRemoveFavorite(item.hadithId)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 transition"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p
                dir={item.hadith.isArabic ? 'rtl' : undefined}
                className={`${item.hadith.isArabic ? 'font-arabic' : 'font-serif'} text-sm md:text-base leading-relaxed text-neutral-100`}
              >
                {item.hadith.isArabic ? item.hadith.text : <>&ldquo;{item.hadith.text}&rdquo;</>}
              </p>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-neutral-400">
                <span>Saved on {new Date(item.savedAt).toLocaleDateString()}</span>
                <a
                  href={item.hadith.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-emerald-400 hover:text-emerald-300 text-[11px]"
                >
                  <span>{item.hadith.source === 'sunnah.com' ? 'sunnah.com' : `PDF Page ${item.hadith.pdfPage}`}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
