import React, { useEffect, useMemo, useState } from 'react';
import { Hadith } from '../types/hadith';
import { Search, BookOpen, ExternalLink, Bookmark, ChevronLeft, ChevronRight, Loader2, Library } from 'lucide-react';
import {
  loadLibraryCollections,
  loadCollectionRange,
  loadArabicText,
  describeHadith,
  LibraryCollectionInfo
} from '../utils/hadithLibrary';
import { useDisplayedHadith } from '../hooks/useHadithLanguage';
import { GradeBadge } from './GradeBadge';
import { useI18n } from '../i18n';

interface SearchLibraryProps {
  onSelectHadith: (hadith: Hadith) => void;
  onToggleFavorite: (hadith: Hadith) => void;
  isFavorited: (id: string) => boolean;
}

const PER_PAGE = 20;

/** Arabic is compared without vowel marks and with plain alif, so "الصلاة" finds "الصَّلَاةِ". */
const plain = (text: string) =>
  text
    .toLowerCase()
    .replace(/[ً-ٰٟـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا');

/**
 * The whole sunnah.com library: pick a collection and a book, read it in English or
 * Arabic, and search within the book or the whole collection.
 */
export const SearchLibrary: React.FC<SearchLibraryProps> = ({ onSelectHadith, onToggleFavorite, isFavorited }) => {
  const i18n = useI18n();
  const { t, isArabic } = i18n;
  const [collections, setCollections] = useState<LibraryCollectionInfo[] | null>(null);
  const [slug, setSlug] = useState('bukhari');
  const [bookIndex, setBookIndex] = useState<number | null>(null);
  const [hadiths, setHadiths] = useState<Hadith[] | null>(null);
  const [arabicTexts, setArabicTexts] = useState<Map<string, string>>(new Map());
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLibraryCollections()
      .then(setCollections)
      .catch(() => setError(t('The library needs an internet connection the first time.')));
  }, []);

  const collection = collections?.find((c) => c.slug === slug) ?? null;
  const book = collection && bookIndex !== null ? collection.books[bookIndex] : null;
  // Searching from the book list searches the whole collection
  const searchingCollection = bookIndex === null && query.trim().length >= 2;

  // Load the open book, or the whole collection when searching it
  useEffect(() => {
    if (!collection || (!book && !searchingCollection)) {
      setHadiths(null);
      return;
    }
    let cancelled = false;
    const start = book ? book.start : 0;
    const end = book ? book.start + book.count : Number.MAX_SAFE_INTEGER;
    setHadiths(null);
    setError(null);
    setProgress(null);
    loadCollectionRange(slug, start, end, (done, total) => {
      if (!cancelled && total > 1) setProgress(`${Math.round((done / total) * 100)}%`);
    })
      .then((list) => !cancelled && setHadiths(list))
      .catch(() => !cancelled && setError(t('Could not load this part of the library. Check the internet connection.')))
      .finally(() => !cancelled && setProgress(null));
    return () => {
      cancelled = true;
    };
  }, [slug, bookIndex, searchingCollection, collections]);

  // Arabic search needs the Arabic text of what is loaded
  const hasQuery = query.trim().length > 0;
  useEffect(() => {
    if (!isArabic || !hadiths || !hasQuery) return;
    let cancelled = false;
    Promise.all(
      hadiths.map(async (h) => [h.id, h.isArabic ? h.text : ((await loadArabicText(h).catch(() => null)) ?? '')] as const)
    ).then((pairs) => !cancelled && setArabicTexts(new Map(pairs)));
    return () => {
      cancelled = true;
    };
  }, [isArabic, hadiths, hasQuery]);

  const results = useMemo(() => {
    if (!hadiths) return [];
    const q = plain(query.trim());
    if (!q) return hadiths;
    return hadiths.filter(
      (h) =>
        plain(h.text).includes(q) ||
        plain(h.narrator).includes(q) ||
        plain(arabicTexts.get(h.id) ?? '').includes(q) ||
        h.hadithNumber === q
    );
  }, [hadiths, query, arabicTexts]);

  const totalPages = Math.max(1, Math.ceil(results.length / PER_PAGE));
  const slice = results.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const openBook = (i: number | null) => {
    setBookIndex(i);
    setPage(1);
    setQuery('');
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Collection & search */}
      <div className="p-4 rounded-2xl bg-neutral-900/60 border border-white/10 space-y-3">
        <div className="flex items-center gap-2 text-amber-300 text-sm font-semibold">
          <Library className="w-4 h-4" />
          <span>{t('sunnah.com Library')}</span>
        </div>
        <select
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            openBook(null);
          }}
          className="w-full py-2.5 px-3 rounded-xl bg-black/40 border border-white/10 text-neutral-100 text-sm focus:outline-none focus:border-amber-400/50"
        >
          {(collections ?? []).map((c) => (
            <option key={c.slug} value={c.slug}>
              {i18n.collection(c.name)}
            </option>
          ))}
        </select>
        <div className="relative">
          <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="search"
            dir="auto"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder={t(book ? 'Search this book...' : 'Search the whole collection...')}
            className="w-full ps-10 pe-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-neutral-100 text-sm placeholder-neutral-500 focus:outline-none focus:border-amber-400/50"
          />
        </div>
        {book && (
          <button onClick={() => openBook(null)} className="flex items-center gap-1 text-xs text-amber-300 hover:underline cursor-pointer">
            <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
            <span>{t('All books')}</span>
          </button>
        )}
      </div>

      {error && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">{error}</div>}

      {/* Book list */}
      {collection && !book && !searchingCollection && (
        <div className="space-y-2">
          {collection.books.map((b, i) => (
            <button
              key={i}
              onClick={() => openBook(i)}
              className="w-full flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#11131b]/80 border border-white/5 hover:border-amber-500/30 text-start cursor-pointer"
            >
              <span className="flex items-center gap-3 min-w-0">
                <span className="w-8 h-8 shrink-0 rounded-lg bg-amber-500/10 text-amber-300 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                <span dir="auto" className="text-sm text-neutral-100 truncate">
                  {isArabic ? b.nameAr : b.name}
                </span>
              </span>
              <span className="shrink-0 text-[11px] text-neutral-400">{t('{n} Hadiths', { n: b.count })}</span>
            </button>
          ))}
        </div>
      )}

      {/* Hadiths of the book / search results */}
      {(book || searchingCollection) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 text-xs text-neutral-400">
            <span dir="auto" className="truncate">
              {book ? (isArabic ? book.nameAr : book.name) : t('Search results in {name}', { name: i18n.collection(collection?.name ?? '') })}
            </span>
            {hadiths && <span className="shrink-0">{t('{n} Hadiths', { n: results.length })}</span>}
          </div>

          {!hadiths && !error && (
            <div className="p-8 text-center text-sm text-neutral-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>
                {t('Loading…')} {progress}
              </span>
            </div>
          )}

          {hadiths && slice.length === 0 && (
            <div className="text-center py-12 rounded-2xl bg-neutral-900/30 border border-white/5 space-y-2">
              <BookOpen className="w-9 h-9 text-neutral-600 mx-auto" />
              <p className="text-neutral-300 font-serif text-lg">{t('No Hadiths match your search query')}</p>
            </div>
          )}

          {slice.map((h) => (
            <LibraryHadithCard key={h.id} hadith={h} fav={isFavorited(h.id)} onView={() => onSelectHadith(h)} onFavorite={() => onToggleFavorite(h)} />
          ))}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2.5 rounded-xl bg-neutral-900 border border-white/10 text-neutral-300 disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
              </button>
              <span className="text-xs text-neutral-300">{t('Page {page} of {total}', { page, total: totalPages })}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2.5 rounded-xl bg-neutral-900 border border-white/10 text-neutral-300 disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/** One Hadith in the Library, in the chosen language. */
const LibraryHadithCard: React.FC<{ hadith: Hadith; fav: boolean; onView: () => void; onFavorite: () => void }> = ({
  hadith: source,
  fav,
  onView,
  onFavorite
}) => {
  const { t, language } = useI18n();
  const { hadith } = useDisplayedHadith(source);
  const info = describeHadith(hadith, language);

  return (
    <div className="p-4 rounded-2xl bg-[#11131b]/80 border border-white/5 hover:border-amber-500/30 space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 min-w-0">
          <div className="text-xs font-semibold text-amber-400">{info.detail}</div>
          <GradeBadge hadith={hadith} />
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onFavorite}
            title={t(fav ? 'Remove from Favourites' : 'Save to Favourites')}
            className={`p-2 rounded-lg ${fav ? 'bg-rose-500/20 text-rose-400' : 'bg-white/5 text-neutral-400 hover:text-white'} cursor-pointer`}
          >
            <Bookmark className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onView}
            className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-medium border border-amber-500/20 cursor-pointer"
          >
            {t('View')}
          </button>
        </div>
      </div>
      {hadith.narrator && <p className="text-xs text-amber-200/80 italic">{hadith.narrator}</p>}
      <p
        dir={hadith.isArabic ? 'rtl' : 'ltr'}
        className={`${hadith.isArabic ? 'font-arabic text-base' : 'font-serif text-sm'} leading-relaxed text-neutral-200`}
      >
        {hadith.isArabic ? hadith.excerpt : <>&ldquo;{hadith.excerpt}&rdquo;</>}
      </p>
      <a href={hadith.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-emerald-400/90">
        <span>sunnah.com</span>
        <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
};
