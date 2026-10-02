/**
 * The Daily Hadith library: every Hadith published on sunnah.com (17 collections,
 * 50,884 Hadiths), built by scripts/build-hadith-data.mjs into small JSON chunks
 * that are downloaded only when needed.
 */
import { Hadith, DailySelection, GradeCategory, HadithGrade } from '../types/hadith';
import { SITE_ROOT } from './siteRoot';
import { getDaysSinceEpoch, formatDateKey, getDailyHadith as getBundledDailyHadith } from './dailyEngine';
import { getHijriDate } from './hijri';

interface LibraryCollection {
  slug: string;
  name: string;
  count: number;
  books: string[];
  /** sunnah.com book id per book, as in its URLs: "12", "35b" or "introduction" */
  bookRefs: string[];
}

interface LibraryIndex {
  total: number;
  chunkSize: number;
  /** [grade, category, graded by] */
  grades: [string, GradeCategory, string][];
  collections: LibraryCollection[];
}

/** [book index, number within book, narrator, English text, Arabic (only when there is no English), grade id] */
type HadithRecord = [number, number, string, string, string?, number?];

const LIBRARY_URL = `${SITE_ROOT}hadith/v2/`;

let indexPromise: Promise<LibraryIndex> | null = null;
const chunkPromises = new Map<string, Promise<HadithRecord[]>>();

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

export function loadLibraryIndex(): Promise<LibraryIndex> {
  if (!indexPromise) {
    indexPromise = fetchJson<LibraryIndex>(`${LIBRARY_URL}index.json`);
    indexPromise.catch(() => (indexPromise = null)); // retry later (e.g. back online)
  }
  return indexPromise;
}

function loadChunk(slug: string, chunk: number): Promise<HadithRecord[]> {
  const key = `${slug}/${chunk}`;
  let promise = chunkPromises.get(key);
  if (!promise) {
    promise = fetchJson<HadithRecord[]>(`${LIBRARY_URL}${key}.json`);
    promise.catch(() => chunkPromises.delete(key));
    chunkPromises.set(key, promise);
  }
  return promise;
}

const EXCERPT_WORDS = 60;

/**
 * sunnah.com page for a Hadith. Positions within a book match sunnah.com's
 * "In-book reference", so the link opens the exact book; single-book collections
 * (the Forty Hadith books) link straight to the Hadith.
 */
function sunnahUrl(collection: LibraryCollection, book: number, number: number): string {
  if (collection.books.length === 1) return `https://sunnah.com/${collection.slug}:${number}`;
  return `https://sunnah.com/${collection.slug}/${collection.bookRefs[book]}`;
}

/** sunnah.com's wording, e.g. "In-book reference: Book 12, Hadith 102". */
function inBookReference(collection: LibraryCollection, book: number, number: number): string {
  if (collection.books.length === 1) return `Hadith ${number}`;
  const ref = collection.bookRefs[book];
  return `In-book reference: ${ref === 'introduction' ? 'Introduction' : `Book ${ref}`}, Hadith ${number}`;
}

function toHadith(index: LibraryIndex, collection: LibraryCollection, record: HadithRecord): Hadith {
  const [book, number, narrator, english, arabic, gradeId] = record;
  const grade = gradeId === undefined ? undefined : index.grades[gradeId];
  const isArabic = !english;
  const text = english || arabic || '';
  const words = text.split(/\s+/).filter(Boolean);
  const isLong = words.length > EXCERPT_WORDS + 20;
  return {
    id: `${collection.slug}-${book + 1}-${number}`,
    collection: collection.name,
    collectionSlug: collection.slug,
    source: 'sunnah.com',
    isArabic,
    reference: inBookReference(collection, book, number),
    volume: 0,
    bookNumber: parseInt(collection.bookRefs[book], 10) || 0,
    bookName: collection.books[book] ?? '',
    hadithNumber: String(number),
    narrator,
    text,
    excerpt: isLong ? `${words.slice(0, EXCERPT_WORDS).join(' ')}…` : text,
    isLong,
    wordCount: words.length,
    startPage: 0,
    endPage: 0,
    pdfPage: 0,
    sourceUrl: sunnahUrl(collection, book, number),
    grade: grade && { text: grade[0], category: grade[1], by: grade[2] }
  };
}

/** Loads the Hadith at a position (0 … total-1) across all collections. */
export async function loadHadithAt(position: number): Promise<Hadith> {
  const index = await loadLibraryIndex();
  let local = ((position % index.total) + index.total) % index.total;
  for (const collection of index.collections) {
    if (local < collection.count) {
      const records = await loadChunk(collection.slug, Math.floor(local / index.chunkSize));
      return toHadith(index, collection, records[local % index.chunkSize]);
    }
    local -= collection.count;
  }
  throw new Error('Hadith position out of range');
}

/**
 * Shuffled order of the whole library: a keyed Feistel permutation (with cycle walking),
 * so day n maps to a random-looking Hadith and every Hadith appears once before any repeats.
 */
export function shuffledPosition(n: number, total: number): number {
  let bits = 2;
  while (1 << bits < total) bits++;
  if (bits % 2) bits++;
  const half = bits / 2;
  const mask = (1 << half) - 1;
  const round = (value: number, key: number) => {
    let h = Math.imul(value ^ key, 0x9e3779b1);
    h ^= h >>> 15;
    h = Math.imul(h, 0x85ebca77);
    h ^= h >>> 13;
    return h & mask;
  };
  const keys = [0x5ad1e1, 0x1f2b3c, 0x7a6b5c, 0x3c2d1e];
  let x = n;
  do {
    let left = x >>> half;
    let right = x & mask;
    for (const key of keys) {
      [left, right] = [right, left ^ round(right, key)];
    }
    x = (left << half) | right;
  } while (x >= total);
  return x;
}

// A few entries only point to another Hadith ("As above.", "See hadith 4909"); they're not used as a daily pick.
const CROSS_REFERENCE = /^[\s(\["]*(as above|see (the )?(previous|above|next) hadith|see hadith|as (in )?hadith (no\.?|number))/i;

const dailyCache = new Map<string, DailySelection>();

/** Hadith of the Day from the full sunnah.com library — the same on every device. */
export async function loadDailyHadith(date: Date = new Date()): Promise<DailySelection> {
  const dateString = formatDateKey(date);
  const cached = dailyCache.get(dateString);
  if (cached) return cached;

  const index = await loadLibraryIndex();
  const day = ((getDaysSinceEpoch(date) % index.total) + index.total) % index.total;
  let position = shuffledPosition(day, index.total);
  let hadith = await loadHadithAt(position);
  // "As above" entries are replaced by the Hadith they point back to
  for (let i = 0; i < 5 && hadith.text.length < 80 && CROSS_REFERENCE.test(hadith.text); i++) {
    position = (position - 1 + index.total) % index.total;
    hadith = await loadHadithAt(position);
  }

  const selection: DailySelection = { dateString, hadith, index: position, hijriDate: getHijriDate(date).formatted };
  dailyCache.set(dateString, selection);
  return selection;
}

/** Hadith of the Day, or the bundled Bukhari pick when the library can't be reached (offline first run). */
export async function loadDailyHadithOrBundled(date: Date = new Date()): Promise<DailySelection> {
  try {
    return await loadDailyHadith(date);
  } catch (err) {
    console.warn('Hadith library unavailable, using the bundled collection:', err);
    return getBundledDailyHadith(date);
  }
}

/** URL of the chunk file holding a Hadith (used to check offline availability). */
export async function chunkUrlFor(position: number): Promise<string> {
  const index = await loadLibraryIndex();
  let local = position;
  for (const collection of index.collections) {
    if (local < collection.count) return `${LIBRARY_URL}${collection.slug}/${Math.floor(local / index.chunkSize)}.json`;
    local -= collection.count;
  }
  return `${LIBRARY_URL}index.json`;
}

/** Any Hadith from the whole library, chosen at random. */
export async function loadRandomHadith(): Promise<Hadith> {
  const index = await loadLibraryIndex();
  return loadHadithAt(Math.floor(Math.random() * index.total));
}

/** Short human reference, e.g. "Sahih Muslim • The Book of Faith • In-book reference: Book 1, Hadith 12". */
export function describeHadith(h: Hadith): { collection: string; reference: string; detail: string; sourceLabel: string } {
  if (h.source === 'sunnah.com') {
    return {
      collection: h.collection,
      reference: h.bookName,
      detail: h.reference ?? `Hadith ${h.hadithNumber}`,
      sourceLabel: 'sunnah.com'
    };
  }
  return {
    collection: h.collection || 'Sahih al-Bukhari',
    reference: `Book ${h.bookNumber}: ${h.bookName}`,
    detail: `Vol. ${h.volume}, Hadith #${h.hadithNumber}`,
    sourceLabel: `Source PDF p. ${h.pdfPage}`
  };
}

/** Badge text and colour for a Hadith's grade, e.g. "Daʻif" / "Graded by Al-Albani". */
export function describeGrade(h: Hadith): { label: string; by: string; category: GradeCategory | 'none' } {
  if (h.grade) {
    const isCollection = h.grade.by === h.collection;
    return { label: h.grade.text, by: isCollection ? `Part of ${h.collection}` : `Graded by ${h.grade.by}`, category: h.grade.category };
  }
  if (h.source !== 'sunnah.com') return { label: 'Sahih', by: 'Part of Sahih al-Bukhari', category: 'sahih' };
  return { label: 'Not graded', by: 'No grade available for this collection', category: 'none' };
}

/** "Grade: Daʻif (Al-Albani)" for sharing and copying, or '' when there is no grade. */
export function gradeLine(h: Hadith): string {
  const g = describeGrade(h);
  if (g.category === 'none') return '';
  return `Grade: ${g.label} (${h.grade && h.grade.by !== h.collection ? h.grade.by : h.collection})`;
}

/** Citation text used when copying or sharing a Hadith. */
export function citeHadith(h: Hadith): string {
  if (h.source === 'sunnah.com') {
    const grade = gradeLine(h);
    return `${h.collection}, ${h.bookName}, ${h.reference ?? `Hadith ${h.hadithNumber}`}${grade ? ` — ${grade}` : ''} — sunnah.com`;
  }
  return `Sahih al-Bukhari, Vol. ${h.volume}, Book ${h.bookNumber} (${h.bookName}), Hadith #${h.hadithNumber}, PDF p. ${h.pdfPage}`;
}
