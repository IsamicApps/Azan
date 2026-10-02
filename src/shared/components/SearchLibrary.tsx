import React, { useState, useMemo, useEffect } from 'react';
import { Hadith, BookMeta } from '../types/hadith';
import dailyPoolData from '../data/daily_pool.json';
import booksData from '../data/books.json';
import { Search, Filter, BookOpen, ExternalLink, Bookmark, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

const books: BookMeta[] = booksData as BookMeta[];

interface SearchLibraryProps {
  onSelectHadith: (hadith: Hadith) => void;
  onToggleFavorite: (hadith: Hadith) => void;
  isFavorited: (id: string) => boolean;
}

export const SearchLibrary: React.FC<SearchLibraryProps> = ({
  onSelectHadith,
  onToggleFavorite,
  isFavorited
}) => {
  const [allHadiths, setAllHadiths] = useState<Hadith[]>(dailyPoolData as Hadith[]);
  const [isLoadingFull, setIsLoadingFull] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<number | 'all'>('all');
  const [filterLength, setFilterLength] = useState<'all' | 'short' | 'long'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Load the full 6,720 corpus asynchronously
  useEffect(() => {
    import('../data/bukhari_full.json').then((module) => {
      setAllHadiths(module.default as Hadith[]);
      setIsLoadingFull(false);
    }).catch(() => {
      setIsLoadingFull(false);
    });
  }, []);

  const filteredHadiths = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allHadiths.filter((h) => {
      if (selectedBook !== 'all' && h.bookNumber !== selectedBook) return false;
      if (filterLength === 'short' && h.isLong) return false;
      if (filterLength === 'long' && !h.isLong) return false;

      if (!q) return true;

      return (
        h.text.toLowerCase().includes(q) ||
        h.narrator.toLowerCase().includes(q) ||
        h.bookName.toLowerCase().includes(q) ||
        h.hadithNumber.toLowerCase() === q ||
        `#${h.hadithNumber}` === q
      );
    });
  }, [allHadiths, query, selectedBook, filterLength]);

  const totalPages = Math.ceil(filteredHadiths.length / itemsPerPage) || 1;
  const currentSlice = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredHadiths.slice(start, start + itemsPerPage);
  }, [filteredHadiths, currentPage]);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleBookChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedBook(val === 'all' ? 'all' : parseInt(val, 10));
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search & Filter Bar */}
      <div className="p-5 rounded-2xl bg-neutral-900/60 border border-white/10 backdrop-blur-md space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Text Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={query}
              onChange={handleQueryChange}
              placeholder="Search 6,720 Hadiths by keyword, narrator, book, or number..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-neutral-100 text-sm placeholder-neutral-500 focus:outline-none focus:border-amber-400/50"
            />
            {query && (
              <button
                onClick={() => { setQuery(''); setCurrentPage(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Book Dropdown */}
          <div className="w-full md:w-64">
            <select
              value={selectedBook}
              onChange={handleBookChange}
              className="w-full py-2.5 px-3 rounded-xl bg-black/40 border border-white/10 text-neutral-200 text-xs focus:outline-none focus:border-amber-400/50"
            >
              <option value="all">All 93 Books of Bukhari</option>
              {books.map((b) => (
                <option key={b.bookNumber} value={b.bookNumber}>
                  Book {b.bookNumber}: {b.bookName} ({b.hadithCount})
                </option>
              ))}
            </select>
          </div>

          {/* Length Filter */}
          <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 self-start">
            {(['all', 'short', 'long'] as const).map((len) => (
              <button
                key={len}
                onClick={() => { setFilterLength(len); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs capitalize font-medium transition ${
                  filterLength === len ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                {len === 'all' ? 'All' : len === 'short' ? 'Concise' : 'Extended'}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between text-xs text-neutral-400 pt-1">
          <div className="flex items-center space-x-2">
            <span>
              Found <strong className="text-amber-400">{filteredHadiths.length.toLocaleString()}</strong> verified Hadiths
            </span>
            {isLoadingFull && (
              <span className="flex items-center space-x-1 text-[11px] text-amber-300">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Indexing full dataset...</span>
              </span>
            )}
          </div>
          <span>
            Page {currentPage} of {totalPages}
          </span>
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-4">
        {currentSlice.length === 0 ? (
          <div className="text-center py-16 p-6 rounded-2xl bg-neutral-900/30 border border-white/5 space-y-3">
            <BookOpen className="w-10 h-10 text-neutral-600 mx-auto" />
            <p className="text-neutral-300 font-serif text-lg">No Hadiths match your search query</p>
            <p className="text-xs text-neutral-500">Try searching with different terms or select all books.</p>
          </div>
        ) : (
          currentSlice.map((h) => {
            const fav = isFavorited(h.id);
            return (
              <div
                key={h.id}
                className="group p-5 rounded-2xl bg-[#11131b]/80 border border-white/5 hover:border-amber-500/30 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-sans font-semibold text-amber-400">
                        Book {h.bookNumber}: {h.bookName}
                      </span>
                      <span className="text-neutral-500">•</span>
                      <span className="text-xs text-neutral-400 font-mono">#{h.hadithNumber}</span>
                    </div>
                    {h.narrator && (
                      <p className="text-xs font-sans text-amber-200/80 italic">{h.narrator}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onToggleFavorite(h)}
                      className={`p-2 rounded-lg transition ${
                        fav
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white'
                      }`}
                      title="Favorite"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onSelectHadith(h)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-medium border border-amber-500/20 transition"
                    >
                      View
                    </button>
                  </div>
                </div>

                <p className="font-serif text-sm md:text-base leading-relaxed text-neutral-200">
                  &ldquo;{h.isLong ? h.excerpt : h.text}&rdquo;
                </p>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-neutral-400">
                  <span>Volume {h.volume} • Word count: {h.wordCount}</span>
                  <a
                    href={h.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-emerald-400/90 hover:text-emerald-300 transition"
                  >
                    <span>PDF Page {h.pdfPage}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-3 pt-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2.5 rounded-xl bg-neutral-900 border border-white/10 text-neutral-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-sans text-neutral-300">
            Page <strong className="text-amber-400">{currentPage}</strong> of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2.5 rounded-xl bg-neutral-900 border border-white/10 text-neutral-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
