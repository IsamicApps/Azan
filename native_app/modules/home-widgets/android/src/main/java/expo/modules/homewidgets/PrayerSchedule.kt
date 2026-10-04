package expo.modules.homewidgets

import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import java.util.TimeZone

/** Words and number formats in the app's language (not the phone's), as in the app. */
class Labels(val arabic: Boolean) {
  private val prayersEn = listOf("Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha")
  private val prayersAr = listOf("الفجر", "الشروق", "الظهر", "العصر", "المغرب", "العشاء")

  fun prayer(index: Int, friday: Boolean = false): String =
    if (index == 2 && friday) jumuah else (if (arabic) prayersAr else prayersEn)[index]

  val jumuah get() = if (arabic) "الجمعة" else "Jumu'ah"
  val nextPrayer get() = if (arabic) "الصلاة القادمة" else "Next prayer"
  val dailyHadith get() = if (arabic) "حديث اليوم" else "Daily Hadith"
  val adhan get() = if (arabic) "الأذان" else "Adhan"
  val iqamah get() = if (arabic) "الإقامة" else "Iqamah"
  val countdownFormat get() = if (arabic) "بعد %s" else "in %s"
  val noTimes get() = if (arabic) "افتح التطبيق لتحميل مواقيت الصلاة" else "Open the app to load prayer times"
  val noHadith get() = if (arabic) "افتح التطبيق لتحميل حديث اليوم" else "Open the app to load today's Hadith"

  fun iqamahAt(time: String) = if (arabic) "الإقامة $time" else "Iqamah $time"

  /** "4:22 AM" / "٤:٢٢ ص" */
  fun time(minutes: Int): String {
    val h = (minutes / 60) % 24
    val m = minutes % 60
    val h12 = if (h % 12 == 0) 12 else h % 12
    val text = String.format(Locale.US, "%d:%02d", h12, m)
    return if (arabic) "${digits(text)} ${if (h < 12) "ص" else "م"}" else "$text ${if (h < 12) "AM" else "PM"}"
  }

  /** Gregorian date with Western digits (as the app shows it in Arabic too), e.g. "Sat 3 Oct" */
  fun date(instant: Long, zone: TimeZone = TimeZone.getDefault()): String {
    val locale = if (arabic) Locale.forLanguageTag("ar-u-nu-latn") else Locale.forLanguageTag("en-AU")
    val format = SimpleDateFormat(if (arabic) "EEEE d MMMM" else "EEE d MMM", locale)
    format.timeZone = zone
    return format.format(Date(instant))
  }

  fun digits(text: String): String = if (!arabic) text else buildString {
    text.forEach { c -> append(if (c in '0'..'9') '٠' + (c - '0') else c) }
  }
}

/** Where the day is: today's times and the next prayer (Sunrise counts, as in the app). */
class PrayerSchedule private constructor(
  val feed: WidgetData.TimesFeed,
  val dayIndex: Int,
  val row: IntArray,
  val isFriday: Boolean,
  /** 0…5 (Fajr…Isha) today, or 0 for tomorrow's Fajr when `nextIsTomorrow` */
  val nextIndex: Int,
  val nextIsTomorrow: Boolean,
  val nextAt: Long,
  val nextMinutes: Int,
  /** Iqamah of the next prayer in minutes, if it has one later than the Adhan */
  val nextIqamah: Int?
) {
  fun adhan(index: Int) = row[index]

  /** Iqamah of prayer 0…5 (none for Sunrise) */
  fun iqamah(index: Int): Int? = IQAMAH_COLUMN[index]?.let { row[it] }?.takeIf { it >= 0 }

  /** When the widget should next change: the next prayer, or midnight at the mosque if sooner */
  fun nextChange(now: Long): Long {
    val midnight = Calendar.getInstance(feed.timeZone).apply {
      timeInMillis = now
      add(Calendar.DAY_OF_MONTH, 1)
      set(Calendar.HOUR_OF_DAY, 0)
      set(Calendar.MINUTE, 0)
      set(Calendar.SECOND, 1)
      set(Calendar.MILLISECOND, 0)
    }.timeInMillis
    return minOf(nextAt + 1000, midnight)
  }

  companion object {
    /** Columns of the Fajr, Dhuhr, Asr, Maghrib, Isha Iqamah in a feed row */
    private val IQAMAH_COLUMN = mapOf(0 to 6, 2 to 7, 3 to 8, 4 to 9, 5 to 10)

    fun at(feed: WidgetData.TimesFeed, now: Long): PrayerSchedule? {
      val index = feed.dayIndex(now)
      val row = feed.row(index) ?: return null
      for (i in 0..5) {
        val at = feed.instant(index, row[i])
        if (at > now) {
          val iq = IQAMAH_COLUMN[i]?.let { row[it] }?.takeIf { it > row[i] }
          return PrayerSchedule(feed, index, row, feed.isFriday(index), i, false, at, row[i], iq)
        }
      }
      // After Isha: tomorrow's Fajr
      val tomorrow = feed.row(index + 1) ?: return null
      val iq = tomorrow[6].takeIf { it > tomorrow[0] }
      return PrayerSchedule(feed, index, row, feed.isFriday(index), 0, true, feed.instant(index + 1, tomorrow[0]), tomorrow[0], iq)
    }
  }
}
