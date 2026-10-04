import Foundation

/// Data for the widgets: the settings the app writes to the App Group (mosque, language,
/// Hijri correction) and the feed the website publishes at widget/v1/
/// (scripts/build-widget-feed.ts), cached in the App Group so the widgets work offline.
enum WidgetData {
  /// Must match ios.entitlements in app.json and APP_GROUP in modules/home-widgets/index.ts
  static let appGroup = "group.com.dailyhadith.app"
  static let feedURL = URL(string: "https://isamicapps.github.io/Azan/widget/v1/")!
  static let defaultMosque = "amssa"
  /// Hijri dates in the feed start this many days before its first day (WIDGET_HIJRI_MARGIN)
  static let hijriMargin = 2
  static let timesMaxAge: TimeInterval = 12 * 60 * 60

  struct Settings: Codable {
    var mosqueId: String
    var mosqueName: String
    var language: String
    var hijriAdjust: Int

    var arabic: Bool { language == "ar" }
    var isCustomMosque: Bool { mosqueId.hasPrefix("custom-") }
  }

  static var defaults: UserDefaults? { UserDefaults(suiteName: appGroup) }

  static func settings() -> Settings {
    let fallback = Settings(mosqueId: defaultMosque, mosqueName: "", language: "en", hijriAdjust: 0)
    guard let raw = defaults?.string(forKey: "settings"), let data = raw.data(using: .utf8),
          var s = try? JSONDecoder().decode(Settings.self, from: data) else { return fallback }
    if s.mosqueId.isEmpty { s.mosqueId = defaultMosque }
    s.hijriAdjust = max(-2, min(2, s.hijriAdjust))
    return s
  }

  // MARK: - Prayer times

  struct TimesFeed: Codable {
    struct Mosque: Codable { let id: String; let name: String; let suburb: String }
    let mosque: Mosque
    let timeZone: String
    let from: String
    /// Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha Adhan, then the Fajr…Isha Iqamah (-1: none), minutes after midnight
    let days: [[Int]]
    /// [English, Arabic], from `hijriMargin` days before `from`
    let hijri: [[String]]
    let jumuah: String

    var zone: TimeZone { TimeZone(identifier: timeZone) ?? .current }

    var calendar: Calendar {
      var c = Calendar(identifier: .gregorian)
      c.timeZone = zone
      return c
    }

    private var firstDay: Date? {
      let parts = from.split(separator: "-").compactMap { Int($0) }
      guard parts.count == 3 else { return nil }
      return calendar.date(from: DateComponents(year: parts[0], month: parts[1], day: parts[2]))
    }

    /// Index of the calendar day containing `date` at the mosque (may be outside the feed)
    func dayIndex(_ date: Date) -> Int? {
      guard let first = firstDay else { return nil }
      return calendar.dateComponents([.day], from: first, to: calendar.startOfDay(for: date)).day
    }

    func row(_ index: Int) -> [Int]? { days.indices.contains(index) && days[index].count >= 11 ? days[index] : nil }

    /// Wall-clock minutes on day `index` as an instant (daylight saving handled by the calendar)
    func instant(_ index: Int, _ minutes: Int) -> Date? {
      guard let first = firstDay, let day = calendar.date(byAdding: .day, value: index, to: first) else { return nil }
      return calendar.date(bySettingHour: minutes / 60, minute: minutes % 60, second: 0, of: day)
    }

    func isFriday(_ index: Int) -> Bool {
      guard let noon = instant(index, 12 * 60) else { return false }
      return calendar.component(.weekday, from: noon) == 6
    }

    func hijri(_ index: Int, _ settings: Settings) -> String? {
      let i = index + WidgetData.hijriMargin + settings.hijriAdjust
      guard hijri.indices.contains(i), hijri[i].count == 2 else { return nil }
      return hijri[i][settings.arabic ? 1 : 0]
    }
  }

  /// Prayer times for the chosen mosque: the app's own for a custom mosque, else the
  /// cached feed, downloaded again when it is old or running out.
  static func times(_ settings: Settings, allowNetwork: Bool = true) async -> TimesFeed? {
    if settings.isCustomMosque {
      guard let raw = defaults?.string(forKey: "customTimes"), let data = raw.data(using: .utf8) else { return nil }
      return try? JSONDecoder().decode(TimesFeed.self, from: data)
    }
    let file = cacheFile("times-\(safe(settings.mosqueId)).json")
    var feed = (try? Data(contentsOf: file)).flatMap { try? JSONDecoder().decode(TimesFeed.self, from: $0) }
    let now = Date()
    let index = feed?.dayIndex(now) ?? -1
    let runningOut = feed == nil || index < 0 || index + 3 >= (feed?.days.count ?? 0)
    if allowNetwork && (runningOut || age(of: file) > timesMaxAge),
       let data = await download(feedURL.appendingPathComponent("times/\(safe(settings.mosqueId)).json")),
       let fresh = try? JSONDecoder().decode(TimesFeed.self, from: data) {
      try? data.write(to: file, options: .atomic)
      feed = fresh
    }
    return feed
  }

  // MARK: - Hadith of the Day

  struct HadithText: Codable {
    let collection: String
    let book: String
    let reference: String
    let narrator: String
    let text: String
    let grade: String
  }

  struct HadithDay: Codable {
    let en: HadithText
    let ar: HadithText
    let grade: String
    let url: String
  }

  struct HadithMonth: Codable {
    let month: String
    let days: [String: HadithDay]
  }

  /// The Hadith of the Day for a local date ("YYYY-MM-DD") in the chosen language
  static func hadith(_ dateKey: String, _ settings: Settings, allowNetwork: Bool = true) async -> HadithText? {
    let month = String(dateKey.prefix(7))
    let file = cacheFile("hadith-\(month).json")
    var data = try? Data(contentsOf: file)
    if data == nil, allowNetwork, let fresh = await download(feedURL.appendingPathComponent("hadith/\(month).json")),
       (try? JSONDecoder().decode(HadithMonth.self, from: fresh)) != nil {
      try? fresh.write(to: file, options: .atomic)
      pruneHadithCache()
      data = fresh
    }
    guard let data, let monthData = try? JSONDecoder().decode(HadithMonth.self, from: data),
          let day = monthData.days[dateKey] else { return nil }
    return settings.arabic ? day.ar : day.en
  }

  /// Removes Hadith files for months already over
  private static func pruneHadithCache() {
    let current = String(dateKey(Date()).prefix(7))
    let files = (try? FileManager.default.contentsOfDirectory(at: cacheDirectory, includingPropertiesForKeys: nil)) ?? []
    for f in files where f.lastPathComponent.hasPrefix("hadith-") {
      let month = f.deletingPathExtension().lastPathComponent.replacingOccurrences(of: "hadith-", with: "")
      if month < current { try? FileManager.default.removeItem(at: f) }
    }
  }

  // MARK: - Helpers

  static var cacheDirectory: URL {
    let base = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroup)
      ?? FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
    let dir = base.appendingPathComponent("widget-feed", isDirectory: true)
    try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
    return dir
  }

  private static func cacheFile(_ name: String) -> URL { cacheDirectory.appendingPathComponent(name) }

  private static func age(of file: URL) -> TimeInterval {
    let modified = (try? file.resourceValues(forKeys: [.contentModificationDateKey]))?.contentModificationDate
    return modified.map { Date().timeIntervalSince($0) } ?? .infinity
  }

  private static func safe(_ id: String) -> String {
    String(id.unicodeScalars.filter { CharacterSet.alphanumerics.contains($0) || $0 == "-" || $0 == "_" })
  }

  private static func download(_ url: URL) async -> Data? {
    var request = URLRequest(url: url, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 10)
    request.setValue("application/json", forHTTPHeaderField: "Accept")
    guard let (data, response) = try? await URLSession.shared.data(for: request),
          (response as? HTTPURLResponse)?.statusCode == 200 else { return nil }
    return data
  }

  /// The device's date, "YYYY-MM-DD" (the Hadith of the Day follows the device's date, as in the app)
  static func dateKey(_ date: Date) -> String {
    let c = Calendar(identifier: .gregorian).dateComponents([.year, .month, .day], from: date)
    return String(format: "%04d-%02d-%02d", c.year ?? 0, c.month ?? 0, c.day ?? 0)
  }

  /// Midnight starting the next day on the device
  static func nextMidnight(after date: Date) -> Date {
    let cal = Calendar(identifier: .gregorian)
    return cal.date(byAdding: .day, value: 1, to: cal.startOfDay(for: date)) ?? date.addingTimeInterval(86_400)
  }
}
