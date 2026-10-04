package expo.modules.homewidgets

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.util.Calendar
import java.util.Locale
import java.util.TimeZone

/**
 * Data for the widgets: the settings the app sends (mosque, language, Hijri correction)
 * and the feed the website publishes at widget/v1/ (scripts/build-widget-feed.ts),
 * cached on the device so the widgets keep working offline.
 */
object WidgetData {
  const val FEED_URL = "https://isamicapps.github.io/Azan/widget/v1/"
  private const val PREFS = "home_widgets"
  private const val DEFAULT_MOSQUE = "amssa"
  /** Hijri dates in the feed start this many days before its first day (WIDGET_HIJRI_MARGIN) */
  private const val HIJRI_MARGIN = 2
  private const val TIMES_MAX_AGE_MS = 12 * 60 * 60 * 1000L

  data class Settings(val mosqueId: String, val mosqueName: String, val language: String, val hijriAdjust: Int) {
    val arabic get() = language == "ar"
    val isCustomMosque get() = mosqueId.startsWith("custom-")
  }

  fun settings(context: Context): Settings {
    val raw = prefs(context).getString("settings", null)
    return try {
      val o = JSONObject(raw ?: "{}")
      Settings(
        o.optString("mosqueId", DEFAULT_MOSQUE).ifEmpty { DEFAULT_MOSQUE },
        o.optString("mosqueName", ""),
        if (o.optString("language") == "ar") "ar" else "en",
        o.optInt("hijriAdjust", 0).coerceIn(-2, 2)
      )
    } catch (e: Exception) {
      Settings(DEFAULT_MOSQUE, "", "en", 0)
    }
  }

  /** Called by the app (HomeWidgetsModule) when the mosque, language or Hijri correction changes. */
  fun save(context: Context, settingsJson: String, customTimesJson: String?) {
    val editor = prefs(context).edit().putString("settings", settingsJson)
    if (customTimesJson != null) editor.putString("customTimes", customTimesJson) else editor.remove("customTimes")
    editor.apply()
  }

  private fun prefs(context: Context) = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

  // ---- Prayer times ----

  class TimesFeed(
    val mosqueName: String,
    val timeZone: TimeZone,
    private val fromY: Int,
    private val fromM: Int,
    private val fromD: Int,
    private val days: List<IntArray>,
    private val hijri: List<Pair<String, String>>,
    val jumuah: String
  ) {
    val dayCount get() = days.size

    /** Index of the calendar day containing `instant` at the mosque (may be outside the feed). */
    fun dayIndex(instant: Long): Int {
      val c = Calendar.getInstance(timeZone).apply { timeInMillis = instant }
      return (epochDay(c.get(Calendar.YEAR), c.get(Calendar.MONTH) + 1, c.get(Calendar.DAY_OF_MONTH)) - epochDay(fromY, fromM, fromD)).toInt()
    }

    fun row(index: Int): IntArray? = days.getOrNull(index)

    /** Wall-clock minutes on day `index` as an instant (daylight saving handled by the calendar) */
    fun instant(index: Int, minutes: Int): Long = Calendar.getInstance(timeZone).apply {
      clear()
      set(fromY, fromM - 1, fromD + index, minutes / 60, minutes % 60, 0)
    }.timeInMillis

    fun isFriday(index: Int): Boolean = Calendar.getInstance(timeZone).apply {
      clear()
      set(fromY, fromM - 1, fromD + index, 12, 0, 0)
    }.get(Calendar.DAY_OF_WEEK) == Calendar.FRIDAY

    fun hijri(index: Int, settings: Settings): String? =
      hijri.getOrNull(index + HIJRI_MARGIN + settings.hijriAdjust)?.let { if (settings.arabic) it.second else it.first }

    companion object {
      fun parse(json: String): TimesFeed? = try {
        val o = JSONObject(json)
        val (y, m, d) = o.getString("from").split("-").map { it.toInt() }
        val days = o.getJSONArray("days").let { a -> List(a.length()) { i -> a.getJSONArray(i).toIntArray() } }
        val hijri = o.getJSONArray("hijri").let { a -> List(a.length()) { i -> a.getJSONArray(i).let { it.getString(0) to it.getString(1) } } }
        TimesFeed(
          o.getJSONObject("mosque").optString("name"),
          TimeZone.getTimeZone(o.optString("timeZone", TimeZone.getDefault().id)),
          y, m, d, days, hijri,
          o.optString("jumuah", "")
        )
      } catch (e: Exception) {
        null
      }
    }
  }

  /**
   * Prayer times for the chosen mosque: the app's own for a custom mosque, else the
   * cached feed, downloaded again when it is old or running out.
   */
  fun times(context: Context, settings: Settings, allowNetwork: Boolean): TimesFeed? {
    if (settings.isCustomMosque) return prefs(context).getString("customTimes", null)?.let { TimesFeed.parse(it) }
    val file = cacheFile(context, "times-${safe(settings.mosqueId)}.json")
    val cached = readFile(file)?.let { TimesFeed.parse(it) }
    val now = System.currentTimeMillis()
    val index = cached?.dayIndex(now) ?: -1
    val runningOut = cached == null || index < 0 || index + 3 >= cached.dayCount
    if (allowNetwork && (runningOut || now - file.lastModified() > TIMES_MAX_AGE_MS)) {
      val body = download("${FEED_URL}times/${safe(settings.mosqueId)}.json")
      val fresh = body?.let { TimesFeed.parse(it) }
      if (body != null && fresh != null) {
        file.writeText(body)
        return fresh
      }
    }
    return cached
  }

  // ---- Hadith of the Day ----

  class Hadith(val collection: String, val book: String, val reference: String, val narrator: String, val text: String, val grade: String)

  /** The Hadith of the Day for a local date ("YYYY-MM-DD") in the chosen language. */
  fun hadith(context: Context, dateKey: String, settings: Settings, allowNetwork: Boolean): Hadith? {
    val month = dateKey.substring(0, 7)
    val file = cacheFile(context, "hadith-$month.json")
    var json = readFile(file)
    if (json == null && allowNetwork) {
      json = download("${FEED_URL}hadith/$month.json")?.also { body ->
        if (runCatching { JSONObject(body) }.isSuccess) {
          file.writeText(body)
          pruneHadithCache(context)
        }
      }
    }
    return try {
      val day = JSONObject(json ?: return null).getJSONObject("days").getJSONObject(dateKey)
      val t = day.getJSONObject(if (settings.arabic) "ar" else "en")
      Hadith(t.optString("collection"), t.optString("book"), t.optString("reference"), t.optString("narrator"), t.optString("text"), t.optString("grade"))
    } catch (e: Exception) {
      null
    }
  }

  /** Removes Hadith files for months already over */
  private fun pruneHadithCache(context: Context) {
    val current = dateKey().substring(0, 7)
    cacheDir(context).listFiles()?.forEach { f ->
      val month = f.name.removePrefix("hadith-").removeSuffix(".json")
      if (f.name.startsWith("hadith-") && month < current) f.delete()
    }
  }

  // ---- Helpers ----

  private fun cacheDir(context: Context) = File(context.filesDir, "home_widgets").apply { mkdirs() }

  private fun cacheFile(context: Context, name: String) = File(cacheDir(context), name)

  private fun readFile(file: File): String? = try {
    if (file.exists()) file.readText() else null
  } catch (e: Exception) {
    null
  }

  private fun safe(id: String) = id.replace(Regex("[^A-Za-z0-9_-]"), "")

  private fun download(url: String): String? = try {
    val connection = URL(url).openConnection() as HttpURLConnection
    connection.connectTimeout = 4000
    connection.readTimeout = 4000
    connection.useCaches = false
    try {
      if (connection.responseCode == 200) connection.inputStream.bufferedReader().use { it.readText() } else null
    } finally {
      connection.disconnect()
    }
  } catch (e: Exception) {
    null
  }

  private fun JSONArray.toIntArray() = IntArray(length()) { getInt(it) }

  fun epochDay(y: Int, m: Int, d: Int): Long = Calendar.getInstance(TimeZone.getTimeZone("UTC")).apply {
    clear()
    set(y, m - 1, d)
  }.timeInMillis / 86_400_000L

  /** Today's date on the device, "YYYY-MM-DD" (the Hadith of the Day follows the device's date, as in the app) */
  fun dateKey(instant: Long = System.currentTimeMillis()): String {
    val c = Calendar.getInstance().apply { timeInMillis = instant }
    return String.format(Locale.US, "%04d-%02d-%02d", c.get(Calendar.YEAR), c.get(Calendar.MONTH) + 1, c.get(Calendar.DAY_OF_MONTH))
  }
}
