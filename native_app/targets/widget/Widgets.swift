import SwiftUI
import WidgetKit

/// The app's widgets: Prayer Times and Daily Hadith (home screen and Lock Screen).
@main
struct DailyHadithWidgets: WidgetBundle {
  var body: some Widget {
    PrayerWidget()
    HadithWidget()
  }
}
