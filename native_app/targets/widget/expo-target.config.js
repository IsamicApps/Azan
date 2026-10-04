/** iOS home-screen and Lock Screen widgets (WidgetKit): Prayer Times and Daily Hadith. */
/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: 'widget',
  name: 'DailyHadithWidgets',
  displayName: 'Daily Hadith',
  deploymentTarget: '17.0',
  icon: '../../assets/icon.png',
  colors: {
    $accent: '#D4AF37',
    $widgetBackground: '#0C0E14'
  },
  entitlements: {
    // Shared with the app, which writes the widget settings there (modules/home-widgets)
    'com.apple.security.application-groups': config.ios.entitlements['com.apple.security.application-groups']
  }
});
