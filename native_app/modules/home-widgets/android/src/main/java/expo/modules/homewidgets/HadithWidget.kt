package expo.modules.homewidgets

import android.content.Context
import android.view.View
import android.widget.RemoteViews
import java.util.Calendar

/** Daily Hadith widget: the app's Hadith of the Day, changing at midnight. */
class HadithWidget : BaseWidget() {
  override val link = "dailyhadith://today"

  override fun render(context: Context, size: Size, now: Long, allowNetwork: Boolean): Pair<RemoteViews, Long?> {
    val settings = WidgetData.settings(context)
    val labels = Labels(settings.arabic)
    val layout = when (size) {
      Size.SMALL -> R.layout.hadith_small
      Size.MEDIUM -> R.layout.hadith_medium
      Size.LARGE -> R.layout.hadith_large
    }
    val views = RemoteViews(context.packageName, layout)
    val nextMidnight = Calendar.getInstance().apply {
      timeInMillis = now
      add(Calendar.DAY_OF_MONTH, 1)
      set(Calendar.HOUR_OF_DAY, 0)
      set(Calendar.MINUTE, 0)
      set(Calendar.SECOND, 1)
      set(Calendar.MILLISECOND, 0)
    }.timeInMillis
    views.setTextViewText(R.id.header_left, labels.dailyHadith)

    val hadith = WidgetData.hadith(context, WidgetData.dateKey(now), settings, allowNetwork)
    if (hadith == null) {
      views.setViewVisibility(R.id.content, View.GONE)
      views.setViewVisibility(R.id.message, View.VISIBLE)
      views.setTextViewText(R.id.message, labels.noHadith)
      return views to nextMidnight
    }
    views.setViewVisibility(R.id.content, View.VISIBLE)
    views.setViewVisibility(R.id.message, View.GONE)
    // Next month's file ahead of time, so the 1st works offline
    if (allowNetwork) WidgetData.hadith(context, WidgetData.dateKey(nextMidnight + 27L * 86_400_000L), settings, true)

    views.setTextViewText(R.id.hadith_text, hadith.text)
    views.setTextViewText(R.id.collection, hadith.collection)
    if (size != Size.SMALL) {
      views.setViewVisibility(R.id.narrator, if (hadith.narrator.isNotEmpty()) View.VISIBLE else View.GONE)
      views.setTextViewText(R.id.narrator, hadith.narrator)
      views.setTextViewText(R.id.reference, labels.digits(hadith.reference))
    }
    if (size == Size.LARGE) {
      views.setTextViewText(R.id.header_right, hijriLine(context, settings, labels, now))
      views.setTextViewText(R.id.book, hadith.book)
      views.setViewVisibility(R.id.grade, if (hadith.grade.isNotEmpty()) View.VISIBLE else View.GONE)
      views.setTextViewText(R.id.grade, hadith.grade)
    }
    return views to nextMidnight
  }

  /** "Sat 3 Oct · 20 Rabiʻ II 1448 AH", the Hijri date from the cached prayer times (no download here) */
  private fun hijriLine(context: Context, settings: WidgetData.Settings, labels: Labels, now: Long): String {
    val feed = WidgetData.times(context, settings, allowNetwork = false)
    val hijri = feed?.hijri(feed.dayIndex(now), settings)
    return listOfNotNull(labels.date(now), hijri).joinToString(" · ")
  }
}
