package expo.modules.homewidgets

import android.content.Context
import android.os.SystemClock
import android.view.View
import android.widget.RemoteViews

/** Prayer Times widget: the next prayer with a live countdown, and the day's times. */
class PrayerWidget : BaseWidget() {
  override val link = "dailyhadith://prayer"

  override fun render(context: Context, size: Size, now: Long, allowNetwork: Boolean): Pair<RemoteViews, Long?> {
    val settings = WidgetData.settings(context)
    val labels = Labels(settings.arabic)
    val layout = when (size) {
      Size.SMALL -> R.layout.prayer_small
      Size.MEDIUM -> R.layout.prayer_medium
      Size.LARGE -> R.layout.prayer_large
    }
    val views = RemoteViews(context.packageName, layout)
    val feed = WidgetData.times(context, settings, allowNetwork)
    val schedule = feed?.let { PrayerSchedule.at(it, now) }
    if (feed == null || schedule == null) {
      views.setViewVisibility(R.id.content, View.GONE)
      views.setViewVisibility(R.id.message, View.VISIBLE)
      views.setTextViewText(R.id.message, labels.noTimes)
      return views to null
    }
    views.setViewVisibility(R.id.content, View.VISIBLE)
    views.setViewVisibility(R.id.message, View.GONE)

    val mosque = settings.mosqueName.ifEmpty { feed.mosqueName }
    val hijri = feed.hijri(schedule.dayIndex, settings).orEmpty()
    views.setTextViewText(R.id.header_left, if (size == Size.SMALL) hijri else mosque)
    if (size != Size.SMALL) {
      views.setTextViewText(R.id.header_right, if (size == Size.LARGE) "${labels.date(now, feed.timeZone)} · $hijri" else hijri)
    }

    // Next prayer and the countdown to it (the Chronometer ticks by itself)
    val friday = schedule.isFriday && !schedule.nextIsTomorrow
    views.setTextViewText(R.id.next_label, labels.nextPrayer)
    views.setTextViewText(R.id.next_name, labels.prayer(schedule.nextIndex, friday))
    views.setTextViewText(R.id.next_time, labels.time(schedule.nextMinutes))
    views.setChronometer(R.id.countdown, SystemClock.elapsedRealtime() + (schedule.nextAt - now), labels.countdownFormat, true)
    views.setChronometerCountDown(R.id.countdown, true)
    val iqamah = schedule.nextIqamah
    views.setViewVisibility(R.id.next_iqamah, if (iqamah != null) View.VISIBLE else View.GONE)
    if (iqamah != null) views.setTextViewText(R.id.next_iqamah, labels.iqamahAt(labels.time(iqamah)))

    val current = if (schedule.nextIsTomorrow) -1 else schedule.nextIndex
    when (size) {
      Size.MEDIUM -> PRAYER_COLUMNS.forEachIndexed { col, prayer ->
        val ids = MEDIUM_IDS[col]
        views.setTextViewText(ids[1], labels.prayer(prayer, schedule.isFriday))
        views.setTextViewText(ids[2], labels.time(schedule.adhan(prayer)))
        highlight(views, ids, prayer == current)
      }
      Size.LARGE -> {
        views.setTextViewText(R.id.col_adhan, labels.adhan)
        views.setTextViewText(R.id.col_iqamah, labels.iqamah)
        for (prayer in 0..5) {
          val ids = LARGE_IDS[prayer]
          views.setTextViewText(ids[1], labels.prayer(prayer, schedule.isFriday))
          views.setTextViewText(ids[2], labels.time(schedule.adhan(prayer)))
          views.setTextViewText(ids[3], schedule.iqamah(prayer)?.let { labels.time(it) } ?: "")
          highlight(views, ids, prayer == current)
        }
        val jumuah = feed.jumuah
        views.setViewVisibility(R.id.footer, if (jumuah.isNotEmpty()) View.VISIBLE else View.GONE)
        views.setTextViewText(R.id.footer, "${labels.jumuah}: ${labels.digits(jumuah)}")
      }
      Size.SMALL -> Unit
    }
    return views to schedule.nextChange(now)
  }

  private fun highlight(views: RemoteViews, ids: IntArray, on: Boolean) {
    views.setInt(ids[0], "setBackgroundResource", if (on) R.drawable.widget_highlight else 0)
    for (i in 1 until ids.size) views.setTextColor(ids[i], if (on) GOLD else TEXT)
  }

  private companion object {
    const val GOLD = 0xFFD4AF37.toInt()
    const val TEXT = 0xFFF5F1E6.toInt()

    /** The five prayers shown in the medium widget (no Sunrise) */
    val PRAYER_COLUMNS = intArrayOf(0, 2, 3, 4, 5)

    val MEDIUM_IDS = arrayOf(
      intArrayOf(R.id.p0_box, R.id.p0_name, R.id.p0_time),
      intArrayOf(R.id.p1_box, R.id.p1_name, R.id.p1_time),
      intArrayOf(R.id.p2_box, R.id.p2_name, R.id.p2_time),
      intArrayOf(R.id.p3_box, R.id.p3_name, R.id.p3_time),
      intArrayOf(R.id.p4_box, R.id.p4_name, R.id.p4_time)
    )

    val LARGE_IDS = arrayOf(
      intArrayOf(R.id.r0_box, R.id.r0_name, R.id.r0_adhan, R.id.r0_iqamah),
      intArrayOf(R.id.r1_box, R.id.r1_name, R.id.r1_adhan, R.id.r1_iqamah),
      intArrayOf(R.id.r2_box, R.id.r2_name, R.id.r2_adhan, R.id.r2_iqamah),
      intArrayOf(R.id.r3_box, R.id.r3_name, R.id.r3_adhan, R.id.r3_iqamah),
      intArrayOf(R.id.r4_box, R.id.r4_name, R.id.r4_adhan, R.id.r4_iqamah),
      intArrayOf(R.id.r5_box, R.id.r5_name, R.id.r5_adhan, R.id.r5_iqamah)
    )
  }
}
