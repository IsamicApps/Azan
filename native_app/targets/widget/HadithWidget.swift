import SwiftUI
import WidgetKit

struct HadithEntry: TimelineEntry {
  let date: Date
  let labels: Labels
  /// nil when today's Hadith isn't downloaded yet (first run offline)
  let hadith: WidgetData.HadithText?
  /// "Sat 3 Oct · 20 Rabiʻ II 1448 AH"
  let dateLine: String
}

struct HadithProvider: TimelineProvider {
  func placeholder(in context: Context) -> HadithEntry {
    HadithEntry(date: Date(), labels: Labels(arabic: false), hadith: nil, dateLine: "")
  }

  func getSnapshot(in context: Context, completion: @escaping (HadithEntry) -> Void) {
    Task { completion(await entry(for: Date(), allowNetwork: !context.isPreview)) }
  }

  /// Today's Hadith, then tomorrow's from midnight (it changes on the device's date, as in the app)
  func getTimeline(in context: Context, completion: @escaping (Timeline<HadithEntry>) -> Void) {
    Task {
      let now = Date()
      let midnight = WidgetData.nextMidnight(after: now)
      let today = await entry(for: now, allowNetwork: true)
      let tomorrow = await entry(for: midnight, allowNetwork: true)
      var entries = [today]
      if tomorrow.hadith != nil { entries.append(tomorrow) }
      // Not downloaded yet: try again in half an hour
      let reload = today.hadith == nil ? now.addingTimeInterval(30 * 60) : midnight.addingTimeInterval(60)
      completion(Timeline(entries: entries, policy: .after(reload)))
    }
  }

  private func entry(for date: Date, allowNetwork: Bool) async -> HadithEntry {
    let settings = WidgetData.settings()
    let labels = Labels(arabic: settings.arabic)
    let hadith = await WidgetData.hadith(WidgetData.dateKey(date), settings, allowNetwork: allowNetwork)
    // Hijri date from the cached prayer times (no download for it here)
    let feed = await WidgetData.times(settings, allowNetwork: false)
    let hijri = feed.flatMap { f in f.dayIndex(date).flatMap { f.hijri($0, settings) } }
    let line = [labels.date(date), hijri].compactMap { $0 }.joined(separator: " · ")
    return HadithEntry(date: date, labels: labels, hadith: hadith, dateLine: line)
  }
}

struct HadithWidgetView: View {
  let entry: HadithEntry
  @Environment(\.widgetFamily) private var family

  var body: some View {
    content
      .environment(\.layoutDirection, entry.labels.direction)
      .environment(\.locale, entry.labels.locale)
      .containerBackground(for: .widget) { Theme.background }
      .widgetURL(URL(string: "dailyhadith://today"))
  }

  @ViewBuilder private var content: some View {
    if let h = entry.hadith {
      switch family {
      case .systemSmall: small(h)
      case .systemLarge, .systemExtraLarge: large(h)
      case .accessoryRectangular: rectangular(h)
      case .accessoryInline: Text(h.text)
      default: medium(h)
      }
    } else {
      Text(entry.labels.noHadith)
        .font(.system(size: 13))
        .foregroundStyle(Theme.muted)
        .multilineTextAlignment(.center)
    }
  }

  private var label: some View {
    Text(entry.labels.dailyHadith.uppercased())
      .font(.system(size: 10, weight: .heavy))
      .foregroundStyle(Theme.gold)
  }

  private func hadithText(_ text: String, size: CGFloat, lines: Int) -> some View {
    Text(text)
      .font(.system(size: size, design: .serif))
      .foregroundStyle(Theme.text)
      .lineSpacing(2)
      .lineLimit(lines)
      .multilineTextAlignment(.leading)
      .frame(maxWidth: .infinity, alignment: .leading)
  }

  private func small(_ h: WidgetData.HadithText) -> some View {
    VStack(alignment: .leading, spacing: 4) {
      label
      hadithText(h.text, size: 13, lines: 6)
      Spacer(minLength: 0)
      Text(h.collection).font(.system(size: 10, weight: .semibold)).foregroundStyle(Theme.gold).lineLimit(1)
    }
  }

  private func medium(_ h: WidgetData.HadithText) -> some View {
    VStack(alignment: .leading, spacing: 4) {
      HStack {
        label
        Spacer()
        Text(h.collection).font(.system(size: 10)).foregroundStyle(Theme.muted).lineLimit(1)
      }
      if !h.narrator.isEmpty {
        Text(h.narrator).font(.system(size: 11, weight: .semibold)).foregroundStyle(Theme.gold).lineLimit(1)
      }
      hadithText(h.text, size: 13.5, lines: 4)
      Spacer(minLength: 0)
      Text(entry.labels.digits(h.reference)).font(.system(size: 10)).foregroundStyle(Theme.muted).lineLimit(1)
    }
  }

  private func large(_ h: WidgetData.HadithText) -> some View {
    VStack(alignment: .leading, spacing: 6) {
      label
      Text(entry.dateLine).font(.system(size: 10)).foregroundStyle(Theme.muted).lineLimit(1)
      Divider().overlay(Color.white.opacity(0.12))
      if !h.narrator.isEmpty {
        Text(h.narrator).font(.system(size: 12, weight: .semibold)).foregroundStyle(Theme.gold).lineLimit(2)
      }
      hadithText(h.text, size: 15, lines: 14)
      Spacer(minLength: 0)
      Divider().overlay(Color.white.opacity(0.12))
      Text(h.collection).font(.system(size: 11, weight: .bold)).foregroundStyle(Theme.text).lineLimit(1)
      Text(h.book).font(.system(size: 10)).foregroundStyle(Theme.muted).lineLimit(1)
      HStack {
        Text(entry.labels.digits(h.reference)).font(.system(size: 10)).foregroundStyle(Theme.muted).lineLimit(1)
        Spacer()
        if !h.grade.isEmpty {
          Text(h.grade).font(.system(size: 10, weight: .bold)).foregroundStyle(Theme.green)
        }
      }
    }
  }

  private func rectangular(_ h: WidgetData.HadithText) -> some View {
    VStack(alignment: .leading, spacing: 1) {
      HStack(spacing: 3) {
        Image(systemName: "book.closed.fill").font(.system(size: 9))
        Text(h.collection).font(.system(size: 10, weight: .bold)).lineLimit(1)
      }
      Text(h.text).font(.system(size: 12)).lineLimit(3)
    }
    .frame(maxWidth: .infinity, alignment: .leading)
  }
}

struct HadithWidget: Widget {
  let kind = "HadithWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: HadithProvider()) { entry in
      HadithWidgetView(entry: entry)
    }
    .configurationDisplayName("Daily Hadith")
    .description("The Hadith of the Day from sunnah.com, in English or Arabic.")
    .supportedFamilies([.systemSmall, .systemMedium, .systemLarge, .accessoryRectangular, .accessoryInline])
  }
}
