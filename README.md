# Daily Hadith & Azan (sunnah.com & Awqat)

Two apps from one codebase — a **mobile app** and a **Google TV / big-screen app** — featuring a **Daily Hadith from every collection on [sunnah.com](https://sunnah.com/)** (50,884 Hadiths) and **Automatic Azan & Prayer Times** synchronized with **[Awqat.com.au](https://www.awqat.com.au/)** and the **[Islamic Network API](https://islamic.network/api/)**.

| App | URL | Built from |
| --- | --- | --- |
| 📱 Mobile app | [isamicapps.github.io/Azan/](https://isamicapps.github.io/Azan/) | `index.html` → `src/mobile/` |
| 📺 Google TV app | [isamicapps.github.io/Azan/tv/](https://isamicapps.github.io/Azan/tv/) | `tv/index.html` → `src/tv/` |

Both apps share everything in `src/shared/` (components, prayer-time & Azan engine, Hadith data) and one service worker, and are built and deployed together by `npm run build`.

---

## 🌟 Key Features

### 1. 📖 Daily Hadith (all of sunnah.com)
- **50,884 Hadiths from all 17 sunnah.com collections**: Sahih al-Bukhari, Sahih Muslim, Sunan Abi Dawud, Jami` at-Tirmidhi, Sunan an-Nasa'i, Sunan Ibn Majah, Muwatta Malik, Musnad Ahmad, Sunan ad-Darimi (Arabic only — sunnah.com has no English yet), Riyad as-Salihin, Ash-Shama'il, Bulugh al-Maram, Al-Adab Al-Mufrad, Mishkat al-Masabih and the three Forty Hadith books.
- **English / العربية**: one switch (on the Hadith card, or the TV footer and **L** key) changes the whole app — every screen, prayer names, Arabic numerals (٠١٢٣), times (ص/م), dates, the Hijri calendar, grades and book names — and switches the layout to right-to-left. The Hadith is then shown in its original Arabic. Strings live in `src/shared/i18n.ar.ts`, keyed by their English text. The 99 Names show Arabic meanings from Dr. Saeed bin Wahf al-Qahtani's explanation of the Names (via [rn0x/Names_Of_Allah_Json](https://github.com/rn0x/Names_Of_Allah_Json), MIT); the 26 names not in his list keep their English explanation.
- **Random order, no repeats**: each date maps to a Hadith through a shuffled order of the whole library, so every Hadith appears once (≈139 years) before any repeats — and phone and TV show the same Hadith of the Day.
- **Data**: built by `npm run hadith:data` from [hadith-json](https://github.com/AhmedBaset/hadith-json) (scraped from sunnah.com, pinned to `v1.2.0`) into `public/hadith/v3/` — an index plus 100-Hadith chunks, so each day downloads ~40 KB. The bundled Bukhari pool is the offline fallback.
- **Full-Text & Excerpt Engine**: Long Hadiths provide a one-tap "Read Full Hadith" toggle.
- **Source Verification**: Each Hadith shows sunnah.com's in-book reference (e.g. *Book 12, Hadith 102*) and links to that book on sunnah.com.
- **Grades**: each Hadith shows its grade (Sahih, Hasan, Daʻif, Mawduʻ) — Al-Albani's first, as on sunnah.com — from [hadith-api](https://github.com/fawazahmed0/hadith-api) for Abu Dawud, Tirmidhi, Nasa'i, Ibn Majah and Malik, matched by in-book reference and text. Bukhari and Muslim are shown as Sahih; the other collections have no grades in the data and show "Not graded". Only Sahih, Hasan and ungraded Hadiths are shown: those graded Daʻif, Mawduʻ or otherwise (Mursal, Maqtuʻ…), and short entries that only refer to another Hadith, are left out of the daily and random picks.
- **Audio Recitation**: Serene Web Speech synthesis reading narration and Hadith text.
- **Social Graphic Card Generator**: Export shareable cards and copy formatted citations.

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
- **Hijri calendar as on Awqat**: the arithmetic Islamic calendar moved by the selected mosque's Awqat day offset (+1 on most pages).
- **Qibla Direction Compass**: Exact degree bearing to the Holy Kaaba in Makkah.

### 3. 📱 Mobile App
- **Full-screen installable PWA** with bottom tab navigation: Today, Awqat, 99 Names, Adhkar, Hijri, Library, Saved.
- **Library**: the whole sunnah.com library by collection and book, in English or Arabic, with search in a book or a whole collection (Arabic search ignores vowel marks). Only Hadiths the app displays (Sahih, Hasan, ungraded) are listed.
- **Daily Hadith reminder notification** at your chosen time.
- **Widget reference code**: Swift (iOS WidgetKit) and Kotlin (Android Glance / AppWidget) in `src/native/`.

### 3b. 📺 Google TV App
- **Remote-control (D-pad) navigation**: arrows move focus, OK selects, Back closes dialogs; Channel +/− browses Hadiths.
- **Hadith slide speed**: each Hadith stays 10 sec, 15 sec, 25 sec (default), 45 sec, 1 min, 2 min or 5 min, or the slides can be paused (footer button or **S** key). Remembered on the TV.
- **Themes** (moon button or **T** key): Obsidian, Emerald, Sapphire and Royal Gold recolour the whole screen (background, panels, highlights, buttons and dialogs). Remembered on the TV.
- **Screen brightness**: dim the whole screen to 85%, 70%, 55%, 40% or 25% (footer button or **B** key), e.g. for the night. Remembered on the TV.
- **"Press OK to Start" screen** — the one remote press lets the TV play the Azan automatically afterwards.
- **Mosque picker**, full-screen landscape layout, live next-prayer countdown and Iqamah times.
- **Wake Lock & OLED micro-drift** so the screen stays on without burn-in.

### 4. 🌙 Peaceful Ambient Screensaver
- **5 Serene Dark Themes**: Midnight Obsidian, Deep Emerald, Royal Navy, Desert Gold, Mystic Amethyst.
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

# Start development server (mobile: http://localhost:5173/  •  TV: http://localhost:5173/tv/)
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
