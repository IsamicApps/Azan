import SwiftUI
import WidgetKit

struct PrayerEntry: TimelineEntry {
  let date: Date
  let labels: Labels
  /// nil when there are no prayer times yet (first run offline)
  let state: PrayerState?
}

struct PrayerProvider: TimelineProvider {
  func placeholder(in context: Context) -> PrayerEntry {
    PrayerEntry(date: Date(), labels: Labels(arabic: false), state: nil)
  }

  func getSnapshot(in context: Context, completion: @escaping (PrayerEntry) -> Void) {
    Task {
      let settings = WidgetData.settings()
      let feed = await WidgetData.times(settings, allowNetwork: !context.isPreview)
      let now = Date()
      completion(PrayerEntry(date: now, labels: Labels(arabic: settings.arabic), state: feed.flatMap { PrayerState.at(now, feed: $0, settings: settings) }))
    }
  }

  /// One entry per prayer for the next day, so the next prayer moves on without a reload
  func getTimeline(in context: Context, completion: @escaping (Timeline<PrayerEntry>) -> Void) {
    Task {
      let settings = WidgetData.settings()
      let labels = Labels(arabic: settings.arabic)
      let now = Date()
      guard let feed = await WidgetData.times(settings), let first = PrayerState.at(now, feed: feed, settings: settings) else {
        let entry = PrayerEntry(date: now, labels: labels, state: nil)
        completion(Timeline(entries: [entry], policy: .after(now.addingTimeInterval(30 * 60))))
        return
      }
      var entries = [PrayerEntry(date: now, labels: labels, state: first)]
      var at = first.validUntil
      while entries.count < 12, at < now.addingTimeInterval(26 * 3600), let state = PrayerState.at(at, feed: feed, settings: settings) {
        entries.append(PrayerEntry(date: at, labels: labels, state: state))
        at = state.validUntil
      }
      // Reload a few times a day for fresh times (Awqat changes) even when entries remain
      let reload = min(at, now.addingTimeInterval(6 * 3600))
      completion(Timeline(entries: entries, policy: .after(reload)))
    }
  }
}

struct PrayerWidgetView: View {
  let entry: PrayerEntry
  @Environment(\.widgetFamily) private var family

  var body: some View {
    content
      .environment(\.layoutDirection, entry.labels.direction)
      .environment(\.locale, entry.labels.locale)
      .containerBackground(for: .widget) { Theme.background }
      .widgetURL(URL(string: "dailyhadith://prayer"))
  }

  @ViewBuilder private var content: some View {
    if let state = entry.state {
      switch family {
      case .systemSmall: small(state)
      case .systemLarge, .systemExtraLarge: large(state)
      case .accessoryRectangular: rectangular(state)
      case .accessoryCircular: circular(state)
      case .accessoryInline: Text("\(state.nextName) \(state.nextTime)")
      default: medium(state)
      }
    } else {
      Text(entry.labels.noTimes)
        .font(.system(size: 13))
        .foregroundStyle(Theme.muted)
        .multilineTextAlignment(.center)
    }
  }

  private func countdown(_ state: PrayerState, size: CGFloat) -> some View {
    Text(state.nextDate, style: .timer)
      .font(.system(size: size, weight: .bold).monospacedDigit())
      .foregroundStyle(Theme.gold)
  }

  private func small(_ s: PrayerState) -> some View {
    VStack(alignment: .leading, spacing: 2) {
      Text(s.hijri).font(.system(size: 11)).foregroundStyle(Theme.muted).lineLimit(1)
      Spacer(minLength: 0)
      Text(entry.labels.nextPrayer).font(.system(size: 11)).foregroundStyle(Theme.gold)
      Text(s.nextName).font(.system(size: 24, weight: .bold)).foregroundStyle(Theme.text).lineLimit(1).minimumScaleFactor(0.7)
      Text(s.nextTime).font(.system(size: 15)).foregroundStyle(Theme.text)
      countdown(s, size: 13)
      if let iq = s.nextIqamah {
        Text(iq).font(.system(size: 11)).foregroundStyle(Theme.muted).lineLimit(1)
      }
    }
    .frame(maxWidth: .infinity, alignment: .leading)
  }

  private func header(_ s: PrayerState, detail: String) -> some View {
    HStack {
      Text(s.mosqueName).font(.system(size: 12, weight: .bold)).foregroundStyle(Theme.text).lineLimit(1)
      Spacer(minLength: 8)
      Text(detail).font(.system(size: 11)).foregroundStyle(Theme.muted).lineLimit(1)
    }
  }

  private func nextBlock(_ s: PrayerState, nameSize: CGFloat) -> some View {
    HStack(alignment: .bottom) {
      VStack(alignment: .leading, spacing: 0) {
        Text(entry.labels.nextPrayer).font(.system(size: 11)).foregroundStyle(Theme.gold)
        Text(s.nextName).font(.system(size: nameSize, weight: .bold)).foregroundStyle(Theme.text).lineLimit(1)
      }
      Spacer()
      VStack(alignment: .trailing, spacing: 0) {
        Text(s.nextTime).font(.system(size: 15)).foregroundStyle(Theme.text)
        countdown(s, size: 14).multilineTextAlignment(.trailing)
        if let iq = s.nextIqamah {
          Text(iq).font(.system(size: 11)).foregroundStyle(Theme.muted).lineLimit(1)
        }
      }
    }
  }

  private func medium(_ s: PrayerState) -> some View {
    VStack(spacing: 6) {
      header(s, detail: s.hijri)
      nextBlock(s, nameSize: 22)
      Spacer(minLength: 0)
      HStack(spacing: 2) {
        // The five prayers (no Sunrise)
        ForEach([0, 2, 3, 4, 5], id: \.self) { i in
          let row = s.rows[i]
          VStack(spacing: 1) {
            Text(row.name).font(.system(size: 11)).lineLimit(1).minimumScaleFactor(0.7)
            Text(row.adhan).font(.system(size: 11, weight: .bold)).lineLimit(1).minimumScaleFactor(0.7)
          }
          .foregroundStyle(row.isNext ? Theme.gold : Theme.text)
          .frame(maxWidth: .infinity)
          .padding(.vertical, 4)
          .background(row.isNext ? Theme.gold.opacity(0.15) : .clear, in: RoundedRectangle(cornerRadius: 8))
        }
      }
    }
  }

  private func large(_ s: PrayerState) -> some View {
    VStack(spacing: 6) {
      header(s, detail: "\(s.date) · \(s.hijri)")
      nextBlock(s, nameSize: 24)
      HStack {
        Spacer()
        Text(entry.labels.adhan).frame(width: 80, alignment: .trailing)
        Text(entry.labels.iqamah).frame(width: 80, alignment: .trailing)
      }
      .font(.system(size: 10))
      .foregroundStyle(Theme.muted)
      .padding(.horizontal, 8)
      .padding(.top, 4)
      ForEach(Array(s.rows.enumerated()), id: \.offset) { _, row in
        HStack {
          Text(row.name)
          Spacer()
          Text(row.adhan).frame(width: 80, alignment: .trailing)
          Text(row.iqamah).frame(width: 80, alignment: .trailing)
        }
        .font(.system(size: 14, weight: row.isNext ? .bold : .regular))
        .foregroundStyle(row.isNext ? Theme.gold : Theme.text)
        .padding(.horizontal, 8)
        .padding(.vertical, 5)
        .background(row.isNext ? Theme.gold.opacity(0.15) : .clear, in: RoundedRectangle(cornerRadius: 8))
      }
      Spacer(minLength: 0)
      if !s.jumuah.isEmpty {
        Text(s.jumuah).font(.system(size: 11)).foregroundStyle(Theme.muted).frame(maxWidth: .infinity, alignment: .leading)
      }
    }
  }

  private func rectangular(_ s: PrayerState) -> some View {
    VStack(alignment: .leading, spacing: 0) {
      HStack(spacing: 4) {
        Image(systemName: "moon.stars.fill")
        Text(s.nextName).font(.headline).lineLimit(1)
        Text(s.nextTime).font(.subheadline).lineLimit(1)
      }
      Text(s.nextDate, style: .timer).font(.body.monospacedDigit())
      Text(s.hijri).font(.caption2).lineLimit(1).foregroundStyle(.secondary)
    }
    .frame(maxWidth: .infinity, alignment: .leading)
  }

  private func circular(_ s: PrayerState) -> some View {
    ZStack {
      AccessoryWidgetBackground()
      VStack(spacing: 0) {
        Text(s.nextName).font(.system(size: 10, weight: .semibold)).lineLimit(1).minimumScaleFactor(0.6)
        Text(s.nextTime).font(.system(size: 11, weight: .bold)).lineLimit(1).minimumScaleFactor(0.6)
      }
      .padding(4)
    }
  }
}

struct PrayerWidget: Widget {
  let kind = "PrayerWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: PrayerProvider()) { entry in
      PrayerWidgetView(entry: entry)
    }
    .configurationDisplayName("Prayer Times")
    .description("Next prayer with a countdown, and today's Adhan and Iqamah times for your mosque.")
    .supportedFamilies([.systemSmall, .systemMedium, .systemLarge, .accessoryRectangular, .accessoryCircular, .accessoryInline])
  }
}
