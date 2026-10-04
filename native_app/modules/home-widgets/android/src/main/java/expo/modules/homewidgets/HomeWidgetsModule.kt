package expo.modules.homewidgets

import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/** Lets the app hand the widgets their settings: requireNativeModule('HomeWidgets') in JavaScript. */
class HomeWidgetsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("HomeWidgets")

    /** Settings JSON (mosqueId, mosqueName, language, hijriAdjust) and a custom mosque's prayer times, or null */
    Function("save") { settingsJson: String, customTimesJson: String? ->
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      WidgetData.save(context, settingsJson, customTimesJson)
      BaseWidget.refreshAll(context)
    }

    Function("refresh") {
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      BaseWidget.refreshAll(context)
    }
  }
}
