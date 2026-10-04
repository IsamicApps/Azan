import SwiftUI

/// Colours of the app's Obsidian theme
enum Theme {
  static let gold = Color(red: 0xD4 / 255, green: 0xAF / 255, blue: 0x37 / 255)
  static let text = Color(red: 0xF5 / 255, green: 0xF1 / 255, blue: 0xE6 / 255)
  static let muted = Color(red: 0x9A / 255, green: 0xA0 / 255, blue: 0xAD / 255)
  static let green = Color(red: 0x6F / 255, green: 0xCF / 255, blue: 0x97 / 255)
  static let background = LinearGradient(
    colors: [Color(red: 0x18 / 255, green: 0x1C / 255, blue: 0x28 / 255), Color(red: 0x0A / 255, green: 0x0C / 255, blue: 0x10 / 255)],
    startPoint: .top,
    endPoint: .bottom
  )
}

/// Words and number formats in the app's language (not the phone's), as in the app
struct Labels {
  let arabic: Bool

  private static let prayersEn = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"]
  private static let prayersAr = ["الفجر", "الشروق", "الظهر", "العصر", "المغرب", "العشاء"]

  func prayer(_ index: Int, friday: Bool = false) -> String {
    if index == 2 && friday { return jumuah }
    return (arabic ? Labels.prayersAr : Labels.prayersEn)[index]
  }

  var jumuah: String { arabic ? "الجمعة" : "Jumu'ah" }
  var nextPrayer: String { arabic ? "الصلاة القادمة" : "Next prayer" }
  var dailyHadith: String { arabic ? "حديث اليوم" : "Daily Hadith" }
  var adhan: String { arabic ? "الأذان" : "Adhan" }
  var iqamah: String { arabic ? "الإقامة" : "Iqamah" }
  var noTimes: String { arabic ? "افتح التطبيق لتحميل مواقيت الصلاة" : "Open the app to load prayer times" }
  var noHadith: String { arabic ? "افتح التطبيق لتحميل حديث اليوم" : "Open the app to load today's Hadith" }

  func iqamahAt(_ time: String) -> String { arabic ? "الإقامة \(time)" : "Iqamah \(time)" }

  /// "4:22 AM" / "٤:٢٢ ص"
  func time(_ minutes: Int) -> String {
    let h = (minutes / 60) % 24
    let m = minutes % 60
    let h12 = h % 12 == 0 ? 12 : h % 12
    let text = String(format: "%d:%02d", h12, m)
    return arabic ? "\(digits(text)) \(h < 12 ? "ص" : "م")" : "\(text) \(h < 12 ? "AM" : "PM")"
  }

  /// Gregorian date with Western digits (as the app shows it in Arabic too), e.g. "Sat 3 Oct"
  func date(_ date: Date, timeZone: TimeZone = .current) -> String {
    let f = DateFormatter()
    f.locale = Locale(identifier: arabic ? "ar@numbers=latn" : "en_AU")
    f.timeZone = timeZone
    f.setLocalizedDateFormatFromTemplate(arabic ? "EEEEdMMMM" : "EEEdMMM")
    return f.string(from: date)
  }

  func digits(_ text: String) -> String {
    guard arabic else { return text }
    let arabicDigits = Array("٠١٢٣٤٥٦٧٨٩")
    return String(text.map { c in c.wholeNumberValue.map { c.isASCII ? arabicDigits[$0] : c } ?? c })
  }

  var locale: Locale { Locale(identifier: arabic ? "ar" : "en_AU") }
  var direction: LayoutDirection { arabic ? .rightToLeft : .leftToRight }
}

/// Where the day is: today's times and the next prayer (Sunrise counts, as in the app)
struct PrayerState {
  struct Row {
    let name: String
    let adhan: String
    let iqamah: String
    let isNext: Bool
  }

  let mosqueName: String
  let hijri: String
  let date: String
  let nextName: String
  let nextTime: String
  let nextDate: Date
  let nextIqamah: String?
  /// Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha
  let rows: [Row]
  let jumuah: String
  /// When this state stops being right: the next prayer, or midnight at the mosque if sooner
  let validUntil: Date

  /// Columns of the Fajr, Dhuhr, Asr, Maghrib, Isha Iqamah in a feed row
  private static let iqamahColumn: [Int: Int] = [0: 6, 2: 7, 3: 8, 4: 9, 5: 10]

  static func at(_ date: Date, feed: WidgetData.TimesFeed, settings: WidgetData.Settings) -> PrayerState? {
    guard let index = feed.dayIndex(date), let row = feed.row(index) else { return nil }
    let labels = Labels(arabic: settings.arabic)
    let friday = feed.isFriday(index)

    var next: (index: Int, date: Date, minutes: Int, iqamah: Int, tomorrow: Bool)?
    for i in 0..<6 {
      if let at = feed.instant(index, row[i]), at > date {
        next = (i, at, row[i], iqamahColumn[i].map { row[$0] } ?? -1, false)
        break
      }
    }
    if next == nil {
      // After Isha: tomorrow's Fajr
      guard let tomorrow = feed.row(index + 1), let at = feed.instant(index + 1, tomorrow[0]) else { return nil }
      next = (0, at, tomorrow[0], tomorrow[6], true)
    }
    guard let next else { return nil }

    let rows = (0..<6).map { i -> Row in
      let iq = iqamahColumn[i].map { row[$0] } ?? -1
      return Row(name: labels.prayer(i, friday: friday), adhan: labels.time(row[i]), iqamah: iq >= 0 ? labels.time(iq) : "", isNext: !next.tomorrow && next.index == i)
    }
    let cal = feed.calendar
    let midnight = cal.date(byAdding: .day, value: 1, to: cal.startOfDay(for: date)) ?? next.date

    return PrayerState(
      mosqueName: settings.mosqueName.isEmpty ? feed.mosque.name : settings.mosqueName,
      hijri: feed.hijri(index, settings) ?? "",
      date: labels.date(date, timeZone: feed.zone),
      nextName: labels.prayer(next.index, friday: friday && !next.tomorrow),
      nextTime: labels.time(next.minutes),
      nextDate: next.date,
      nextIqamah: next.iqamah > next.minutes ? labels.iqamahAt(labels.time(next.iqamah)) : nil,
      rows: rows,
      jumuah: feed.jumuah.isEmpty ? "" : "\(labels.jumuah): \(labels.digits(feed.jumuah))",
      validUntil: min(next.date, midnight)
    )
  }
}
