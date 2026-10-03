/**
 * Writes the home-screen widget data into dist/widget/v1/ (run by `npm run build`,
 * after vite build, with vite-node so it uses the app's own code):
 *
 *   times/<mosque id>.json   prayer times, Iqamah and Hijri dates for WIDGET_TIMES_DAYS days
 *   hadith/<YYYY-MM>.json    Hadith of the Day for every day of the month, English and Arabic
 *
 * The Hadith library is read from public/hadith/v3/ instead of being downloaded.
 */
import fs from 'node:fs';
import path from 'node:path';
import { INITIAL_MOSQUES } from '../src/shared/utils/prayerTimes';
import { WIDGET_TIMES_DAYS, buildHadithMonth, buildTimesFeed } from '../src/shared/utils/widgetFeed';

const ROOT = path.resolve(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const OUT = path.join(ROOT, 'dist', 'widget', 'v1');

// The library loader fetches "./hadith/v3/…": serve those from public/
globalThis.fetch = (async (input: string | URL) => {
  const url = String(input).replace(/^\.?\//, '').replace(/\?.*$/, '');
  const file = path.join(PUBLIC, url);
  if (!file.startsWith(PUBLIC) || !fs.existsSync(file)) return new Response(null, { status: 404 });
  return new Response(fs.readFileSync(file), { status: 200, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

function write(relative: string, data: unknown): number {
  const file = path.join(OUT, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const json = JSON.stringify(data);
  fs.writeFileSync(file, json);
  return json.length;
}

const today = new Date();
// From yesterday, so a widget a time zone behind the build still has its "today"
const from = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);

let bytes = 0;
for (const mosque of INITIAL_MOSQUES) {
  bytes += write(`times/${mosque.id}.json`, buildTimesFeed(mosque, from, WIDGET_TIMES_DAYS));
}
console.log(`widget feed: prayer times for ${INITIAL_MOSQUES.length} mosques (${(bytes / 1024).toFixed(0)} KB)`);

// Last month through the month the prayer times end in
const months: string[] = [];
const last = new Date(from.getFullYear(), from.getMonth(), from.getDate() + WIDGET_TIMES_DAYS);
for (let d = new Date(from.getFullYear(), from.getMonth() - 1, 1); d <= last; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
  months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
}
bytes = 0;
for (const month of months) bytes += write(`hadith/${month}.json`, await buildHadithMonth(month));
console.log(`widget feed: Hadith of the Day for ${months[0]} … ${months[months.length - 1]} (${(bytes / 1024).toFixed(0)} KB)`);

write('index.json', { v: 1, generated: new Date().toISOString(), mosques: INITIAL_MOSQUES.map((m) => m.id), months });
