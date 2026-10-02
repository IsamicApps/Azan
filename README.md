# Daily Hadith & Azan (Sahih al-Bukhari & Awqat)

A mobile web application, widget system, and peaceful ambient screensaver featuring verified **Daily Hadiths from Sahih al-Bukhari** (1,700-page IslamHouse edition) and **Automatic Azan & Prayer Times** synchronized with **[Awqat.com.au](https://www.awqat.com.au/)** and the **[Islamic Network API](https://islamic.network/api/)**.

🌐 **Live GitHub Pages URL**: [https://isamicapps.github.io/Azan/](https://isamicapps.github.io/Azan/)

---

## 🌟 Key Features

### 1. 📖 Verified Daily Hadith (Sahih al-Bukhari)
- **6,720 Authentic Hadiths** across **92 Books** parsed 1:1 from the official [IslamHouse PDF edition](https://d1.islamhouse.com/data/en/ih_books/single/en_Sahih_Al-Bukhari.pdf).
- **Deterministic 12.2-Year Non-Repeating Cycle**: Daily selection mapped deterministically to the device's local calendar date.
- **Full-Text & Excerpt Engine**: Long Hadiths provide a one-tap "Read Full Hadith" toggle.
- **Source Verification**: Every Hadith links directly to its verified PDF page number.
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
- **Iqamah Offsets & Friday Jumu'ah Timetable**: Congregation times configured per mosque.
- **Qibla Direction Compass**: Exact degree bearing to the Holy Kaaba in Makkah.

### 3. 📱 Mobile Phone & Widget Surfaces
- **Interactive Mobile Phone Simulator**: Experience real iPhone 16 Pro Titanium and Google Pixel 9 Pro frames with Dynamic Island and lock-screen gestures.
- **Mobile Home-Screen Widgets**: Small (2x2), Medium (4x2), and Large (4x4) widgets.
- **Lock-Screen Widgets**: Accessory Rectangular, Circular, and Inline formats.
- **Native Codebases Included**: Swift (iOS WidgetKit) and Kotlin (Android Glance / AppWidget).

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

# Start development server
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
