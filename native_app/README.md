# Daily Hadith: native app and widgets (iPhone and Android)

An Expo app that shows the Daily Hadith & Azan site ([isamicapps.github.io/Azan](https://isamicapps.github.io/Azan/)) in a WebView, and adds two home-screen widgets:

| Widget | Sizes | Shows |
| --- | --- | --- |
| **Prayer Times** | small, medium, large; iOS Lock Screen (rectangular, circular, inline) | next prayer with a live countdown and its Iqamah, the five times (medium), Adhan and Iqamah table with Jumu'ah (large), Hijri date |
| **Daily Hadith** | small, medium, large; iOS Lock Screen (rectangular, inline) | the app's Hadith of the Day: text, narrator, collection, book, in-book reference, grade |

The website and the widget data feed live in [IsamicApps/Azan](https://github.com/IsamicApps/Azan). Paths below starting with `src/`, `scripts/`, `tests/` or `.github/` are in that repository.

Both follow the app's settings: the selected mosque, English / العربية, and the Hijri correction. Tapping a widget opens the app on the Awqat or Today tab.

## How it works

```
website build ──► widget/v1/times/<mosque>.json   200 days of Adhan + Iqamah + Hijri (EN/AR)
(scripts/build-widget-feed.ts)  widget/v1/hadith/<YYYY-MM>.json   Hadith of the Day, EN + AR
                        │
                        ▼ downloaded and cached by the widgets themselves
app WebView ──postMessage──► mosque id, language, Hijri correction (+ times for a custom mosque)
(src/shared/utils/nativeBridge.ts)      │
                        ▼
   iOS: App Group UserDefaults ──► targets/widget (WidgetKit, SwiftUI)
   Android: SharedPreferences  ──► modules/home-widgets/android (AppWidgetProvider, RemoteViews)
```

- The times and the Hadith come from the website's own code (`src/shared/utils/widgetFeed.ts`), so the widgets show what the app shows. `tests/widgetFeed.test.ts` checks that.
- The widgets download their data, so they keep working when the app isn't opened, and offline from the cache. The feed runs 200 days ahead, and the daily sync workflow redeploys the site every Friday.
- A custom mosque (one you added yourself) has no feed on the site, so the app sends 60 days of its times each time it opens.

| Path | What |
| --- | --- |
| `App.tsx` | WebView, widget links (`dailyhadith://prayer`, `dailyhadith://today`), external links open in the browser, Android location permission |
| `modules/home-widgets/index.ts` | `saveWidgetSettings()` for both platforms |
| `modules/home-widgets/android/` | Android widgets (Kotlin) and their layouts. They are part of this local Expo module, so no config plugin is needed. |
| `targets/widget/` | iOS widget extension (Swift), linked by `@bacons/apple-targets` on prebuild |

The bundle id `com.dailyhadith.app` and App Group `group.com.dailyhadith.app` appear in `app.json`, `modules/home-widgets/index.ts` and `targets/widget/WidgetData.swift`. If you change them, change all three.

## Building

You need [EAS](https://docs.expo.dev/build/introduction/) (cloud builds; no Xcode or Android Studio needed) and an Expo account:

```bash
cd native_app
npm install
npx eas-cli@latest login
npx eas-cli@latest build -p android --profile preview   # an .apk to install on any Android phone
npx eas-cli@latest build -p ios --profile production     # needs an Apple Developer account
```

- **iOS**: add your Apple Team ID as `ios.appleTeamId` in `app.json`. EAS creates the certificates, the widget's bundle id (`com.dailyhadith.app.widget`) and the App Group. Install through TestFlight (`npx eas-cli@latest submit -p ios`).
- **Android**: the preview profile gives an APK link you can open on the phone. The production profile gives an `.aab` for Google Play.
- **Locally** (needs Xcode / Android Studio): `npx expo run:ios` or `npx expo run:android`. The generated `ios/` and `android/` folders aren't committed. Rebuild them with `npx expo prebuild --clean` after changing `app.json` or `targets/widget/expo-target.config.js`.

Adding a widget: on iPhone, long-press the home screen → **Edit** → **Add Widget** → *Daily Hadith*. On Android, long-press the home screen → **Widgets** → *Daily Hadith*.
