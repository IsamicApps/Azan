/**
 * Builds the Daily Hadith library from every Hadith published on sunnah.com.
 *
 * Source: the hadith-json dataset (scraped from sunnah.com, 50,884 Hadiths in 17 books),
 * pinned to a release tag so the data — and therefore each day's Hadith — never shifts.
 *
 * Output: public/hadith/v1/
 *   index.json              collections, book names and chunk layout
 *   <collection>/<n>.json   Hadiths in chunks of CHUNK_SIZE, fetched on demand by the app
 *
 * Run: npm run hadith:data
 */
import fs from 'fs';
import path from 'path';

const TAG = 'v1.2.0';
const BASE = `https://raw.githubusercontent.com/AhmedBaset/hadith-json/${TAG}/db/by_book`;
const CACHE_DIR = path.resolve('node_modules/.cache/hadith-json', TAG);
const OUT_DIR = path.resolve('public/hadith/v1');
const CHUNK_SIZE = 100;

// Order here is the order of the global index; never reorder (it would change every day's Hadith).
const COLLECTIONS = [
  { file: 'the_9_books/bukhari', slug: 'bukhari', name: 'Sahih al-Bukhari' },
  { file: 'the_9_books/muslim', slug: 'muslim', name: 'Sahih Muslim' },
  { file: 'the_9_books/abudawud', slug: 'abudawud', name: 'Sunan Abi Dawud' },
  { file: 'the_9_books/tirmidhi', slug: 'tirmidhi', name: "Jami` at-Tirmidhi" },
  { file: 'the_9_books/nasai', slug: 'nasai', name: "Sunan an-Nasa'i" },
  { file: 'the_9_books/ibnmajah', slug: 'ibnmajah', name: 'Sunan Ibn Majah' },
  { file: 'the_9_books/malik', slug: 'malik', name: 'Muwatta Malik' },
  { file: 'the_9_books/ahmed', slug: 'ahmad', name: 'Musnad Ahmad' },
  { file: 'the_9_books/darimi', slug: 'darimi', name: 'Sunan ad-Darimi' },
  { file: 'other_books/riyad_assalihin', slug: 'riyadussalihin', name: 'Riyad as-Salihin' },
  { file: 'other_books/shamail_muhammadiyah', slug: 'shamail', name: "Ash-Shama'il Al-Muhammadiyah" },
  { file: 'other_books/bulugh_almaram', slug: 'bulugh', name: 'Bulugh al-Maram' },
  { file: 'other_books/aladab_almufrad', slug: 'adab', name: 'Al-Adab Al-Mufrad' },
  { file: 'other_books/mishkat_almasabih', slug: 'mishkat', name: 'Mishkat al-Masabih' },
  { file: 'forties/nawawi40', slug: 'nawawi40', name: 'The Forty Hadith of an-Nawawi' },
  { file: 'forties/qudsi40', slug: 'qudsi40', name: 'Forty Hadith Qudsi' },
  { file: 'forties/shahwaliullah40', slug: 'shahwaliullah40', name: 'Forty Hadith of Shah Waliullah' }
];

const clean = (s) => (s || '').replace(/\r/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

async function loadBook(file) {
  const cached = path.join(CACHE_DIR, `${path.basename(file)}.json`);
  if (!fs.existsSync(cached)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    const res = await fetch(`${BASE}/${file}.json`);
    if (!res.ok) throw new Error(`Download failed for ${file}: ${res.status}`);
    fs.writeFileSync(cached, Buffer.from(await res.arrayBuffer()));
  }
  return JSON.parse(fs.readFileSync(cached, 'utf8'));
}

fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

const index = { source: 'sunnah.com', dataset: `AhmedBaset/hadith-json@${TAG}`, chunkSize: CHUNK_SIZE, total: 0, collections: [] };

for (const c of COLLECTIONS) {
  const book = await loadBook(c.file);
  const chapterNames = new Map(book.chapters.map((ch) => [ch.id, clean(ch.english) || clean(ch.arabic)]));

  // Books in the order they first appear; each Hadith keeps its position within its book,
  // which matches sunnah.com's "In-book reference" (Book <chapter id>, Hadith <position>)
  const books = [];
  // sunnah.com book id per book, as used in its URLs: the dataset's chapter id, with
  // 0 → "introduction", and an unnumbered book → "<previous>b" (sunnah.com's "8b", "35b")
  const bookRefs = [];
  const bookIndex = new Map();
  const positionInBook = new Map();
  const records = book.hadiths.map((h) => {
    if (!bookIndex.has(h.chapterId)) {
      bookIndex.set(h.chapterId, books.length);
      books.push(chapterNames.get(h.chapterId) || `Book ${books.length + 1}`);
      const previous = bookRefs[bookRefs.length - 1];
      bookRefs.push(
        h.chapterId === 0 ? 'introduction' : Number.isInteger(h.chapterId) ? String(h.chapterId) : `${previous ?? 0}b`
      );
    }
    const b = bookIndex.get(h.chapterId);
    const pos = (positionInBook.get(b) || 0) + 1;
    positionInBook.set(b, pos);
    const english = clean(h.english?.text);
    // [book index, number within book, narrator, English text, Arabic (only when there is no English)]
    const record = [b, pos, clean(h.english?.narrator), english];
    if (!english) record.push(clean(h.arabic));
    return record;
  });

  const dir = path.join(OUT_DIR, c.slug);
  fs.mkdirSync(dir);
  for (let i = 0; i * CHUNK_SIZE < records.length; i++) {
    fs.writeFileSync(path.join(dir, `${i}.json`), JSON.stringify(records.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)));
  }

  index.collections.push({ slug: c.slug, name: c.name, count: records.length, books, bookRefs });
  index.total += records.length;
  console.log(`${c.name.padEnd(34)} ${String(records.length).padStart(6)} Hadiths`);
}

fs.writeFileSync(path.join(OUT_DIR, 'index.json'), JSON.stringify(index));
console.log(`Total: ${index.total} Hadiths → ${path.relative(process.cwd(), OUT_DIR)}`);
