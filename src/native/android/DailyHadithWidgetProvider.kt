package com.dailyhadith.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.RemoteViews
import com.dailyhadith.R
import java.text.SimpleDateFormat
import java.util.*

class DailyHadithWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    companion object {
        fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val options = appWidgetManager.getAppWidgetOptions(appWidgetId)
            val minWidth = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH)
            val minHeight = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT)

            // Select layout based on widget cell dimensions (small, medium, large)
            val layoutId = when {
                minHeight > 180 && minWidth > 180 -> R.layout.widget_large
                minWidth > 220 -> R.layout.widget_medium
                else -> R.layout.widget_small
            }

            val views = RemoteViews(context.packageName, layoutId)

            // Load shared daily hadith data cached locally
            val prefs = context.getSharedPreferences("DailyHadithPrefs", Context.MODE_PRIVATE)
            val hadithText = prefs.getString("daily_text", "The reward of deeds depends upon intentions...")
            val narrator = prefs.getString("daily_narrator", "Narrated 'Umar bin Al-Khattab")
            val hadithNumber = prefs.getString("daily_number", "1")
            val bookName = prefs.getString("daily_book_name", "Revelation")
            val bookNumber = prefs.getInt("daily_book_number", 1)
            val hadithId = prefs.getString("daily_id", "bukhari-v1-b1-n1")

            views.setTextViewText(R.id.widget_hadith_text, "\"$hadithText\"")
            views.setTextViewText(R.id.widget_narrator, narrator)
            views.setTextViewText(R.id.widget_reference, "Sahih al-Bukhari • Book $bookNumber: $bookName • #$hadithNumber")

            val dateFormat = SimpleDateFormat("EEE, MMM d", Locale.getDefault())
            views.setTextViewText(R.id.widget_date, dateFormat.format(Date()))

            // Deep-link intent to open full Hadith view in Daily Hadith App
            val intent = Intent(Intent.ACTION_VIEW).apply {
                data = Uri.parse("dailyhadith://hadith/$hadithId")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val pendingIntent = PendingIntent.getActivity(
                context,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_root, pendingIntent)

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}
