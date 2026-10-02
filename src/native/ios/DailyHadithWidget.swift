//
//  DailyHadithWidget.swift
//  DailyHadith iOS Widget Extension
//
//  Created for Daily Hadith - Sahih al-Bukhari.
//

import WidgetKit
import SwiftUI

struct DailyHadithEntry: TimelineEntry {
    let date: Date
    let hadithId: String
    let narrator: String
    let text: String
    let excerpt: String
    let bookNumber: Int
    let bookName: String
    let hadithNumber: String
    let volume: Int
    let pdfPage: Int
    let hijriDate: String
}

struct DailyHadithWidgetEntryView : View {
    var entry: DailyHadithEntry
    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .systemSmall:
            SmallHadithWidgetView(entry: entry)
        case .systemMedium:
            MediumHadithWidgetView(entry: entry)
        case .systemLarge:
            LargeHadithWidgetView(entry: entry)
        case .accessoryRectangular:
            LockScreenRectangularWidgetView(entry: entry)
        case .accessoryCircular:
            LockScreenCircularWidgetView(entry: entry)
        case .accessoryInline:
            LockScreenInlineWidgetView(entry: entry)
        @unknown default:
            MediumHadithWidgetView(entry: entry)
        }
    }
}

// MARK: - Small Widget (2x2)
struct SmallHadithWidgetView: View {
    let entry: DailyHadithEntry

    var body: some View {
        ZStack {
            LinearGradient(
                gradient: Gradient(colors: [Color(hex: "161a24"), Color(hex: "0c0e14")]),
                startPoint: .top,
                endPoint: .bottom
            )
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Image(systemName: "sparkles")
                        .foregroundColor(Color(hex: "d4af37"))
                        .font(.system(size: 10, weight: .bold))
                    Text("HADITH")
                        .font(.system(size: 9, weight: .bold))
                        .foregroundColor(Color(hex: "d4af37"))
                    Spacer()
                    Text(entry.date, format: .dateTime.weekday(.short))
                        .font(.system(size: 9))
                        .foregroundColor(.gray)
                }

                Text("\"\(entry.excerpt)\"")
                    .font(.custom("CormorantGaramond-Regular", size: 12))
                    .foregroundColor(.white)
                    .lineLimit(4)
                    .lineSpacing(2)

                Spacer()

                HStack {
                    Text("Bukhari #\(entry.hadithNumber)")
                        .font(.system(size: 8, weight: .semibold))
                        .foregroundColor(Color(hex: "d4af37").opacity(0.8))
                    Spacer()
                    Text("p.\(entry.pdfPage)")
                        .font(.system(size: 8))
                        .foregroundColor(.gray)
                }
            }
            .padding(12)
        }
        .widgetURL(URL(string: "dailyhadith://hadith/\(entry.hadithId)"))
    }
}

// MARK: - Medium Widget (4x2)
struct MediumHadithWidgetView: View {
    let entry: DailyHadithEntry

    var body: some View {
        ZStack {
            LinearGradient(
                gradient: Gradient(colors: [Color(hex: "161a24"), Color(hex: "0a0c10")]),
                startPoint: .top,
                endPoint: .bottom
            )
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text("DAILY HADITH")
                        .font(.system(size: 9, weight: .heavy))
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color(hex: "d4af37").opacity(0.2))
                        .cornerRadius(4)
                        .foregroundColor(Color(hex: "d4af37"))
                    Spacer()
                    Text("Sahih al-Bukhari")
                        .font(.system(size: 10, weight: .medium))
                        .foregroundColor(.gray)
                }

                if !entry.narrator.isEmpty {
                    Text(entry.narrator)
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundColor(Color(hex: "d4af37").opacity(0.9))
                        .lineLimit(1)
                }

                Text("\"\(entry.excerpt)\"")
                    .font(.custom("CormorantGaramond-Regular", size: 13.5))
                    .foregroundColor(.white)
                    .lineLimit(3)
                    .lineSpacing(3)

                Spacer()

                HStack {
                    Text("Book \(entry.bookNumber): \(entry.bookName) • #\(entry.hadithNumber)")
                        .font(.system(size: 9, weight: .medium))
                        .foregroundColor(.gray)
                        .lineLimit(1)
                    Spacer()
                    Text("Open →")
                        .font(.system(size: 9, weight: .bold))
                        .foregroundColor(Color(hex: "d4af37"))
                }
            }
            .padding(14)
        }
        .widgetURL(URL(string: "dailyhadith://hadith/\(entry.hadithId)"))
    }
}

// MARK: - Large Widget (4x4)
struct LargeHadithWidgetView: View {
    let entry: DailyHadithEntry

    var body: some View {
        ZStack {
            LinearGradient(
                gradient: Gradient(colors: [Color(hex: "181c28"), Color(hex: "080a0f")]),
                startPoint: .top,
                endPoint: .bottom
            )
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("DAILY HADITH")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(Color(hex: "d4af37"))
                        Text(entry.hijriDate)
                            .font(.system(size: 9))
                            .foregroundColor(.gray)
                    }
                    Spacer()
                    Text(entry.date, format: .dateTime.month(.abbreviated).day())
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundColor(.white)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.white.opacity(0.1))
                        .cornerRadius(6)
                }

                Divider().background(Color.white.opacity(0.1))

                if !entry.narrator.isEmpty {
                    Text(entry.narrator)
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(Color(hex: "d4af37"))
                }

                Text("\"\(entry.text)\"")
                    .font(.custom("CormorantGaramond-Regular", size: 15))
                    .foregroundColor(.white)
                    .lineLimit(6)
                    .lineSpacing(4)

                Spacer()

                VStack(alignment: .leading, spacing: 4) {
                    Divider().background(Color.white.opacity(0.1))
                    HStack {
                        Text("Sahih al-Bukhari • Book \(entry.bookNumber): \(entry.bookName)")
                            .font(.system(size: 10, weight: .semibold))
                            .foregroundColor(.white)
                            .lineLimit(1)
                    }
                    HStack {
                        Text("Volume \(entry.volume), Hadith #\(entry.hadithNumber)")
                            .font(.system(size: 9))
                            .foregroundColor(.gray)
                        Spacer()
                        Text("PDF Page \(entry.pdfPage)")
                            .font(.system(size: 9, weight: .medium))
                            .foregroundColor(Color.green.opacity(0.8))
                    }
                }
            }
            .padding(16)
        }
        .widgetURL(URL(string: "dailyhadith://hadith/\(entry.hadithId)"))
    }
}

// MARK: - Lock Screen Widgets
struct LockScreenRectangularWidgetView: View {
    let entry: DailyHadithEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            HStack {
                Image(systemName: "sparkles")
                    .font(.system(size: 8))
                Text("HADITH #\(entry.hadithNumber)")
                    .font(.system(size: 9, weight: .bold))
            }
            Text("\"\(entry.excerpt)\"")
                .font(.system(size: 11))
                .lineLimit(2)
            Text("Book \(entry.bookNumber) • p.\(entry.pdfPage)")
                .font(.system(size: 8))
                .foregroundColor(.secondary)
        }
        .widgetURL(URL(string: "dailyhadith://hadith/\(entry.hadithId)"))
    }
}

struct LockScreenCircularWidgetView: View {
    let entry: DailyHadithEntry

    var body: some View {
        ZStack {
            AccessoryWidgetBackground()
            VStack(spacing: 1) {
                Image(systemName: "book.closed.fill")
                    .font(.system(size: 12))
                Text("#\(entry.hadithNumber)")
                    .font(.system(size: 9, weight: .bold))
            }
        }
        .widgetURL(URL(string: "dailyhadith://hadith/\(entry.hadithId)"))
    }
}

struct LockScreenInlineWidgetView: View {
    let entry: DailyHadithEntry

    var body: some View {
        Text("Bukhari #\(entry.hadithNumber): \(entry.excerpt)")
            .widgetURL(URL(string: "dailyhadith://hadith/\(entry.hadithId)"))
    }
}

// Helper Color hex initializer
extension Color {
    init(hex: String) {
        let scanner = Scanner(string: hex)
        var rgbValue: UInt64 = 0
        scanner.scanHexInt64(&rgbValue)
        let r = Double((rgbValue & 0xFF0000) >> 16) / 255.0
        let g = Double((rgbValue & 0x00FF00) >> 8) / 255.0
        let b = Double(rgbValue & 0x0000FF) / 255.0
        self.init(red: r, green: g, blue: b)
    }
}
