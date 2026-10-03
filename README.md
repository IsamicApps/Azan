# Daily Hadith & Azan (sunnah.com & Awqat)

A **mobile app** featuring a **Daily Hadith from every collection on [sunnah.com](https://sunnah.com/)** (50,884 Hadiths) and **Automatic Azan & Prayer Times** synchronized with **[Awqat.com.au](https://www.awqat.com.au/)** and the **[Islamic Network API](https://islamic.network/api/)**.

| App | URL |
| --- | --- |
| 📱 Mobile app | [isamicapps.github.io/Azan/](https://isamicapps.github.io/Azan/) (`index.html` → `src/mobile/`) |
| 📺 Google TV app | moved to its own repo, [IslamicApplications/IslamicTvApps](https://github.com/IslamicApplications/IslamicTvApps), live at [islamicapplications.github.io/IslamicTvApps](https://islamicapplications.github.io/IslamicTvApps/) |

The old TV address, [isamicapps.github.io/Azan/tv/](https://isamicapps.github.io/Azan/tv/), now redirects there (`public/tv/index.html`). The first time a TV is redirected, its settings go with it: the mosque, Azan voices, theme, Quran position and so on.

---

## 🌟 Key Features

### 1. 📖 Daily Hadith (all of sunnah.com)
- **50,884 Hadiths from all 17 sunnah.com collections**: Sahih al-Bukhari, Sahih Muslim, Sunan Abi Dawud, Jami` at-Tirmidhi, Sunan an-Nasa'i, Sunan Ibn Majah, Muwatta Malik, Musnad Ahmad, Sunan ad-Darimi (Arabic only — sunnah.com has no English yet), Riyad as-Salihin, Ash-Shama'il, Bulugh al-Maram, Al-Adab Al-Mufrad, Mishkat al-Masabih and the three Forty Hadith books.
- **English / العربية**: one switch (on the Hadith card) changes the whole app — every screen, prayer names, Arabic numerals (٠١٢٣), times (ص/م), dates, the Hijri calendar, grades and book names — and switches the layout to right-to-left. The Hadith is then shown in its original Arabic. Strings live in `src/shared/i18n.ar.ts`, keyed by their English text. The 99 Names show Arabic meanings from Dr. Saeed bin Wahf al-Qahtani's explanation of the Names (via [rn0x/Names_Of_Allah_Json](https://github.com/rn0x/Names_Of_Allah_Json), MIT); the 26 names not in his list keep their English explanation.
- **Random order, no repeats**: each date maps to a Hadith through a shuffled order of the whole library, so every Hadith appears once (≈139 years) before any repeats — and the phone and the TV app show the same Hadith of the Day.
- **Data**: built by `npm run hadith:data` from [hadith-json](https://github.com/AhmedBaset/hadith-json) (scraped from sunnah.com, pinned to `v1.2.0`) into `public/hadith/v3/` — an index plus 100-Hadith chunks, so each day downloads ~40 KB. The bundled Bukhari pool is the offline fallback.
- **Full-Text & Excerpt Engine**: Long Hadiths provide a one-tap "Read Full Hadith" toggle.
- **Source Verification**: Each Hadith shows sunnah.com's in-book reference (e.g. *Book 12, Hadith 102*) and links to that book on sunnah.com.
- **Grades**: each Hadith shows its grade (Sahih, Hasan, Daʻif, Mawduʻ) — Al-Albani's first, as on sunnah.com — from [hadith-api](https://github.com/fawazahmed0/hadith-api) for Abu Dawud, Tirmidhi, Nasa'i, Ibn Majah and Malik, matched by in-book reference and text. Bukhari and Muslim are shown as Sahih; the other collections have no grades in the data and show "Not graded". Only Sahih, Hasan and ungraded Hadiths are shown: those graded Daʻif, Mawduʻ or otherwise (Mursal, Maqtuʻ…), and short entries that only refer to another Hadith, are left out of the daily and random picks.
- **Audio Recitation**: Serene Web Speech synthesis reading narration and Hadith text.
- **Social Graphic Card Generator**: Export shareable cards and copy formatted citations.

### 🎨 Themes (phone and screensaver)
One theme choice for the whole app (palette button in the phone header, or the screensaver settings), defined in `src/shared/theme.ts`:
- **Time of Day**: the background follows the selected mosque's prayer times: dawn blues from Fajr, teal by day, gold from Asr, plum from Maghrib and night after Isha, fading between them.
- **Day & Night**: light Parchment from sunrise until Maghrib, Obsidian at night.
- **Obsidian, Emerald, Sapphire, Royal Gold** (dark) and **Parchment** (light, for reading in daylight).
- **Ramadan**: a crescent and lantern appear in the header during Ramadan, and the time-based themes use a deeper indigo at night.

### 2. 🕌 Automatic Azan & Prayer Times (Awqat.com.au)
- **Closest Mosque Locator (GPS)**: One-tap automatic distance calculation to find and select your nearest Australian mosque.
- **28+ Mosques Directory**: Includes Melbourne, Tarneit, Footscray, Truganina, Fitzroy, Adelaide, Hobart, Sydney, Brisbane, Perth, Canberra, etc.
- **Auto-Play Azan on Prayer Time**: Automatically plays the authentic vocal Adhan when prayer time arrives.
- **Authentic Vocal Muezzin Recordings**:
  - 🕋 **Makkah Al-Mukarramah** (Sheikh Ali Ahmed Mulla)
  - 🕌 **Al-Madinah Al-Munawwarah** (Sheikh Essam Bukhari)
  - 🇰🇼 **Mishary Rashid Alafasy** (Kuwait)
  - 🇵🇸 **Masjid Al-Aqsa** (Sheikh Najee Qazaz, Jerusalem)
  - 🇪🇬 **Sheikh Abdul Basit Abdul Samad** (Egypt)
  - 🔔 **Gentle Acoustic Chime**
- **Same times as Awqat**: for the 28 mosques on [awqat.com.au](https://www.awqat.com.au/), Adhan times, Iqamah (fixed times or minutes after the Adhan), Jumu'ah and the Hijri date follow each mosque's Awqat page — its timetable file, or Awqat's own PrayTimes.js settings, plus its minute adjustments. Daylight saving is applied automatically. `npm run awqat:data` re-downloads everything (then build and deploy) when Awqat changes. Mosques not on Awqat use the built-in calculation.
- **Mosques' own timetables**: Preston Mosque (Islamic Society of Victoria, [isv.org.au](https://isv.org.au/)) uses the yearly Adhan and Iqamah timetable and Jumu'ah time it publishes on its website (The Masjid App widget). `npm run mosques:data` re-downloads it (then build and deploy); add another Masjid App mosque in `scripts/sync-mosque-timetables.mjs`.
- **Hijri calendar as on Awqat**: the arithmetic Islamic calendar moved by the selected mosque's Awqat day offset (+1 on most pages).
- **Qibla Direction Compass**: Exact degree bearing to the Holy Kaaba in Makkah.

### 3. 📱 Mobile App
- **Full-screen installable PWA** with bottom tab navigation: Today, Awqat, 99 Names, Adhkar, Hijri, Library, Saved.
- **Library**: the whole sunnah.com library by collection and book, in English or Arabic, with search in a book or a whole collection (Arabic search ignores vowel marks). Only Hadiths the app displays (Sahih, Hasan, ungraded) are listed.
- **Daily Hadith reminder notification** at your chosen time.
- **Widget reference code**: Swift (iOS WidgetKit) and Kotlin (Android Glance / AppWidget) in `src/native/`.

### 4. 🌙 Peaceful Ambient Screensaver
- **Follows the app theme** (below).
- **Subtle Islamic Geometric Patterns**: 8-pointed star Girih rosettes with ambient shimmer.
- **OLED Burn-in Micro-Drift**: Periodic repositioning protects OLED screens.
- **WakeLock Screen Keep-Awake**: Keeps the display active while charging on a desk or nightstand.

---

## 🚀 Getting Started Locally

```bash
# Clone repository
git clone https://github.com/IsamicApps/Azan.git
cd Azan

# Install dependencies
npm install

# Start development server (http://localhost:5173/)
npm run dev

# Build for production
npm run build
```

---

## 🛠️ Tech Stack
- **React 19** + **TypeScript** + **Vite**
- **Tailwind CSS v4**
- **Lucide Icons** + **HTML-to-Image**
- **Islamic Network API & Audio Streams**
- **Awqat.com.au Australian Mosques Directory**

---

## 📜 License
MIT License. Content sourced from authentic public Islamic datasets.

## Tests

`npm test` checks prayer times for every mosque over a year, the match with Awqat, daylight saving, the Hijri calendar, the Arabic interface (every text translated, Arabic numerals) and the daily Hadith order. `.github/workflows/test.yml` runs them on every push.
