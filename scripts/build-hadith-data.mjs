/**
 * Builds the Daily Hadith library from every Hadith published on sunnah.com.
 *
 * Source: the hadith-json dataset (scraped from sunnah.com, 50,884 Hadiths in 17 books),
 * pinned to a release tag so the data — and therefore each day's Hadith — never shifts.
 *
 * Grades: the hadith-api dataset (sunnah.com's graders — Al-Albani, Zubair Ali Zai, …) for the
 * Sunan and the Muwatta, matched by in-book reference and checked against the English text.
 * Sahih al-Bukhari and Sahih Muslim are Sahih as collections; the other books carry no grades.
 *
 * Output: public/hadith/v3/
 *   index.json              collections, book names and chunk layout
 *   <collection>/<n>.json   Hadiths in chunks of CHUNK_SIZE, fetched on demand by the app
 *   ar/<collection>/<n>.json the Arabic text of the same Hadiths, for the Arabic display option
 *
 * Run: npm run hadith:data
 */
import fs from 'fs';
import path from 'path';

const TAG = 'v1.2.0';
const BASE = `https://raw.githubusercontent.com/AhmedBaset/hadith-json/${TAG}/db/by_book`;
const CACHE_DIR = path.resolve('node_modules/.cache/hadith-json', TAG);
const OUT_DIR = path.resolve('public/hadith/v3');
const GRADES_REV = 'df57907be35291c91ad6a6691180e22ca9920784';
const GRADES_BASE = `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@${GRADES_REV}/editions`;
const GRADES_CACHE = path.resolve('node_modules/.cache/hadith-api', GRADES_REV);
const CHUNK_SIZE = 100;

// Order here is the order of the global index; never reorder (it would change every day's Hadith).
const COLLECTIONS = [
  { file: 'the_9_books/bukhari', slug: 'bukhari', name: 'Sahih al-Bukhari', sahih: true },
  { file: 'the_9_books/muslim', slug: 'muslim', name: 'Sahih Muslim', sahih: true },
  { file: 'the_9_books/abudawud', slug: 'abudawud', name: 'Sunan Abi Dawud', grades: 'abudawud' },
  { file: 'the_9_books/tirmidhi', slug: 'tirmidhi', name: "Jami` at-Tirmidhi", grades: 'tirmidhi' },
  { file: 'the_9_books/nasai', slug: 'nasai', name: "Sunan an-Nasa'i", grades: 'nasai' },
  { file: 'the_9_books/ibnmajah', slug: 'ibnmajah', name: 'Sunan Ibn Majah', grades: 'ibnmajah' },
  { file: 'the_9_books/malik', slug: 'malik', name: 'Muwatta Malik', grades: 'malik' },
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

async function loadGrades(edition) {
  const cached = path.join(GRADES_CACHE, `${edition}.json`);
  if (!fs.existsSync(cached)) {
    fs.mkdirSync(GRADES_CACHE, { recursive: true });
    const res = await fetch(`${GRADES_BASE}/eng-${edition}.min.json`);
    if (!res.ok) throw new Error(`Download failed for grades of ${edition}: ${res.status}`);
    fs.writeFileSync(cached, Buffer.from(await res.arrayBuffer()));
  }
  return JSON.parse(fs.readFileSync(cached, 'utf8')).hadiths;
}

// One grade per Hadith, preferring the grader sunnah.com shows first
const GRADERS = ['Al-Albani', 'Zubair Ali Zai', 'Salim al-Hilali'];
const pickGrade = (grades) =>
  grades
    .filter((g) => g.grade && g.grade.trim() !== '-')
    .sort((a, b) => (GRADERS.indexOf(a.name) + 1 || 99) - (GRADERS.indexOf(b.name) + 1 || 99))[0];

const prettyGrade = (grade) =>
  grade
    .trim()
    .replace(/^Sanad Daif$/, 'Daif Isnaad')
    .replace(/\bDaif\b/g, 'Daʻif')
    .replace(/\bMawdu\b/g, 'Mawduʻ')
    .replace(/\b(Muquf|Mauquf)\b/g, 'Mawquf')
    .replace(/\bMaqtu\b/g, 'Maqtuʻ')
    .replace(/\bIsnaad\b/g, 'Isnad')
    .replace(/\bLighairihi\b/g, 'li-ghayrihi')
    .replace(/^Sahih - Agreed Upon$/, 'Sahih (Agreed upon)')
    .replace(/^Sahih - Bukhari And Muslim$/, 'Sahih (Bukhari and Muslim)')
    .replace(/^Sahih Bukhari \(\d+\) Sahih Muslim \(\d+\)$/, 'Sahih (Bukhari and Muslim)')
    .replace(/^Sahih (Bukhari|Muslim)( \(\d+\))?$/, 'Sahih ($1)')
    .replace(/\bMalool\b/g, 'Maʻlul');

/** sahih | hasan | daif | fabricated | other — used for the badge colour. */
function gradeCategory(grade) {
  const g = grade.toLowerCase().replace(/ʻ/g, '');
  if (/mawdu/.test(g)) return 'fabricated';
  if (/daif|munkar|shadh/.test(g)) return 'daif';
  if (/\bsahih\b/.test(g)) return 'sahih';
  if (/hasan/.test(g)) return 'hasan';
  return 'other';
}

const words = (s) => new Set((s || '').toLowerCase().replace(/[^a-z ]/g, ' ').split(/\s+/).filter((w) => w.length > 3));
function overlap(a, b) {
  if (!a.size || !b.size) return 0;
  let n = 0;
  for (const w of a) if (b.has(w)) n++;
  return n / Math.min(a.size, b.size);
}

/** Finds the graded entry for a Hadith: same in-book reference with matching text, else the best text match in that book. */
function matchGrade(byBook, bookRef, position, text) {
  if (bookRef === 'introduction') bookRef = '0';
  const num = parseInt(bookRef, 10);
  const candidates = [...(byBook.get(num) || []), ...(bookRef.endsWith('b') ? byBook.get(num + 1) || [] : [])];
  const mine = words(text);
  const same = candidates.find((e) => e.ref === position && (!bookRef.endsWith('b') || e.book === num));
  if (same && overlap(mine, same.words) >= 0.5) return same;
  let best = null;
  let bestScore = 0.7;
  for (const e of candidates) {
    const score = overlap(mine, e.words);
    if (score > bestScore && Math.min(mine.size, e.words.size) >= 6) [best, bestScore] = [e, score];
  }
  return best;
}

fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

const index = {
  source: 'sunnah.com',
  dataset: `AhmedBaset/hadith-json@${TAG}`,
  gradesDataset: `fawazahmed0/hadith-api@${GRADES_REV}`,
  chunkSize: CHUNK_SIZE,
  total: 0,
  /** [grade, category, graded by] — referenced by index from each Hadith record */
  grades: [],
  /** Positions (across all collections) never picked for display: graded other than Sahih or Hasan, or incomplete */
  excluded: [],
  collections: []
};
const SHOWN_GRADES = new Set(['sahih', 'hasan']);
// Short entries that only point to another Hadith ("This hadith has been narrated through another chain…",
// "The rest of the hadith is the same") — not complete on their own
const INCOMPLETE =
  /(rest of the (tradition|hadith|narration)|to the same effect|(a |the )?similar (tradition|hadith|narration|version)|(a )?hadith like (it|this|that)|(this|a) tradition has (also )?been (narrated|transmitted|reported)|has been (narrated|reported|transmitted) (on the authority|through|by)|with (this|the same) (chain|isnad)|same as (the )?(above|previous)|as above|like the (previous|preceding)|mentioned above|this hadith has been (narrated|transmitted|reported))/i;
let excludedGrades = 0;
let excludedIncomplete = 0;
const gradeIds = new Map();
const gradeId = (grade, by) => {
  const key = `${grade}|${by}`;
  if (!gradeIds.has(key)) {
    gradeIds.set(key, index.grades.length);
    index.grades.push([grade, gradeCategory(grade), by]);
  }
  return gradeIds.get(key);
};

for (const c of COLLECTIONS) {
  const book = await loadBook(c.file);
  let byBook = null;
  if (c.grades) {
    byBook = new Map();
    for (const g of await loadGrades(c.grades)) {
      const entry = { book: g.reference.book, ref: g.reference.hadith, words: words(g.text), grade: pickGrade(g.grades || []) };
      if (!byBook.has(entry.book)) byBook.set(entry.book, []);
      byBook.get(entry.book).push(entry);
    }
  }
  let graded = 0;
  const chapterNames = new Map(book.chapters.map((ch) => [ch.id, clean(ch.english) || clean(ch.arabic)]));
  const chapterNamesAr = new Map(book.chapters.map((ch) => [ch.id, clean(ch.arabic)]));

  // Books in the order they first appear; each Hadith keeps its position within its book,
  // which matches sunnah.com's "In-book reference" (Book <chapter id>, Hadith <position>)
  const books = [];
  // Arabic book names, for the Arabic interface
  const booksAr = [];
  // sunnah.com book id per book, as used in its URLs: the dataset's chapter id, with
  // 0 → "introduction", and an unnumbered book → "<previous>b" (sunnah.com's "8b", "35b")
  const bookRefs = [];
  const bookIndex = new Map();
  const positionInBook = new Map();
  const records = book.hadiths.map((h, i) => {
    if (!bookIndex.has(h.chapterId)) {
      bookIndex.set(h.chapterId, books.length);
      books.push(chapterNames.get(h.chapterId) || `Book ${books.length + 1}`);
      booksAr.push(chapterNamesAr.get(h.chapterId) || '');
      const previous = bookRefs[bookRefs.length - 1];
      bookRefs.push(
        h.chapterId === 0 ? 'introduction' : Number.isInteger(h.chapterId) ? String(h.chapterId) : `${previous ?? 0}b`
      );
    }
    const b = bookIndex.get(h.chapterId);
    const pos = (positionInBook.get(b) || 0) + 1;
    positionInBook.set(b, pos);
    const english = clean(h.english?.text);
    const narrator = clean(h.english?.narrator);
    let grade;
    if (c.sahih && bookRefs[b] !== 'introduction') grade = gradeId('Sahih', c.name);
    if (byBook) {
      const match = matchGrade(byBook, bookRefs[b], pos, `${narrator} ${english}`);
      if (match?.grade) grade = gradeId(prettyGrade(match.grade.grade), match.grade.name);
    }
    if (grade !== undefined) graded++;
    if (grade !== undefined && !SHOWN_GRADES.has(index.grades[grade][1])) {
      excludedGrades++;
      index.excluded.push(index.total + i);
    } else if (english && english.split(/\s+/).length < 70 && INCOMPLETE.test(english)) {
      excludedIncomplete++;
      index.excluded.push(index.total + i);
    }
    // [book index, number within book, narrator, English text, Arabic (only when there is no English), grade id]
    const record = [b, pos, narrator, english];
    if (!english || grade !== undefined) record.push(english ? '' : clean(h.arabic));
    if (grade !== undefined) record.push(grade);
    return record;
  });

  const dir = path.join(OUT_DIR, c.slug);
  fs.mkdirSync(dir);
  for (let i = 0; i * CHUNK_SIZE < records.length; i++) {
    fs.writeFileSync(path.join(dir, `${i}.json`), JSON.stringify(records.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)));
  }

  // Arabic text of every Hadith, in the same chunk layout, fetched only when Arabic is chosen
  const arabic = book.hadiths.map((h) => clean(h.arabic));
  const arDir = path.join(OUT_DIR, 'ar', c.slug);
  fs.mkdirSync(arDir, { recursive: true });
  for (let i = 0; i * CHUNK_SIZE < arabic.length; i++) {
    fs.writeFileSync(path.join(arDir, `${i}.json`), JSON.stringify(arabic.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)));
  }

  index.collections.push({ slug: c.slug, name: c.name, count: records.length, books, booksAr, bookRefs });
  index.total += records.length;
  console.log(`${c.name.padEnd(34)} ${String(records.length).padStart(6)} Hadiths, ${String(graded).padStart(6)} graded`);
}

fs.writeFileSync(path.join(OUT_DIR, 'index.json'), JSON.stringify(index));
console.log(`Not shown: ${excludedGrades} graded Daʻif, Mawduʻ or other; ${excludedIncomplete} incomplete (refer to another Hadith)`);
console.log(`Total: ${index.total} Hadiths → ${path.relative(process.cwd(), OUT_DIR)}`);
