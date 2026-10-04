package expo.modules.homewidgets

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.widget.RemoteViews
import kotlin.concurrent.thread

/**
 * Shared by the Prayer Times and Daily Hadith widgets: loads the data off the main
 * thread (it may be downloaded), picks a layout for the widget's size, and asks to be
 * woken when the content next changes (the next prayer, or midnight).
 */
abstract class BaseWidget : AppWidgetProvider() {
  enum class Size { SMALL, MEDIUM, LARGE }

  /** Builds the views; returns when the widget should next be refreshed (epoch ms), or null */
  protected abstract fun render(context: Context, size: Size, now: Long, allowNetwork: Boolean): Pair<RemoteViews, Long?>

  /** Where a tap opens the app, e.g. "dailyhadith://prayer" */
  protected abstract val link: String

  override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) {
    updateAsync(context, manager, ids)
  }

  override fun onAppWidgetOptionsChanged(context: Context, manager: AppWidgetManager, id: Int, newOptions: Bundle) {
    updateAsync(context, manager, intArrayOf(id))
  }

  override fun onReceive(context: Context, intent: Intent) {
    super.onReceive(context, intent)
    when (intent.action) {
      ACTION_REFRESH, Intent.ACTION_TIME_CHANGED, Intent.ACTION_TIMEZONE_CHANGED, Intent.ACTION_DATE_CHANGED -> {
        val manager = AppWidgetManager.getInstance(context)
        updateAsync(context, manager, manager.getAppWidgetIds(ComponentName(context, javaClass)))
      }
    }
  }

  override fun onDisabled(context: Context) {
    alarmManager(context).cancel(refreshIntent(context))
  }

  private fun updateAsync(context: Context, manager: AppWidgetManager, ids: IntArray) {
    if (ids.isEmpty()) return
    val pending = goAsync()
    thread {
      try {
        val now = System.currentTimeMillis()
        var next: Long? = null
        // Network once per update: the first widget downloads, the rest use the cache
        var allowNetwork = true
        for (id in ids) {
          val (views, refreshAt) = render(context, sizeOf(manager.getAppWidgetOptions(id)), now, allowNetwork)
          allowNetwork = false
          views.setOnClickPendingIntent(R.id.widget_root, openAppIntent(context))
          manager.updateAppWidget(id, views)
          if (refreshAt != null) next = minOf(next ?: refreshAt, refreshAt)
        }
        next?.let { scheduleRefresh(context, it) }
      } finally {
        pending.finish()
      }
    }
  }

  private fun sizeOf(options: Bundle): Size {
    // Portrait: the widget is minWidth wide and maxHeight tall
    val width = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH)
    val height = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT)
    return when {
      height >= 250 && width >= 220 -> Size.LARGE
      width >= 220 -> Size.MEDIUM
      else -> Size.SMALL
    }
  }

  private fun openAppIntent(context: Context): PendingIntent {
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(link)).apply {
      setPackage(context.packageName)
      flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
    }
    return PendingIntent.getActivity(context, link.hashCode(), intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }

  private fun refreshIntent(context: Context): PendingIntent {
    val intent = Intent(context, javaClass).setAction(ACTION_REFRESH)
    return PendingIntent.getBroadcast(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }

  /** Not a wake-up alarm: it is delivered when the screen next comes on, which is when a widget is seen */
  private fun scheduleRefresh(context: Context, at: Long) {
    alarmManager(context).set(AlarmManager.RTC, at, refreshIntent(context))
  }

  private fun alarmManager(context: Context) = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

  companion object {
    const val ACTION_REFRESH = "expo.modules.homewidgets.REFRESH"

    /** Redraws every widget of both kinds (after the app changes the settings) */
    fun refreshAll(context: Context) {
      for (cls in listOf(PrayerWidget::class.java, HadithWidget::class.java)) {
        context.sendBroadcast(Intent(context, cls).setAction(ACTION_REFRESH))
      }
    }
  }
}
