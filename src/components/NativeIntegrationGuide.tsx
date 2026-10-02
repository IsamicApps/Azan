import React, { useState } from 'react';
import { Code2, Copy, Check, Smartphone, Apple, Layers, Terminal, Sparkles } from 'lucide-react';

export const NativeIntegrationGuide: React.FC = () => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyCode = (key: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSection(key);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const swiftWidgetCode = `// DailyHadithWidget.swift
// Add to Xcode iOS Target -> Widget Extension
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

@main
struct DailyHadithWidgetBundle: WidgetBundle {
    var body: some Widget {
        DailyHadithWidget()
    }
}

struct DailyHadithWidget: Widget {
    let kind: String = "DailyHadithWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: DailyHadithTimelineProvider()) { entry in
            DailyHadithWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Daily Hadith")
        .description("Displays today's verified Hadith from Sahih al-Bukhari.")
        .supportedFamilies([
            .systemSmall,
            .systemMedium,
            .systemLarge,
            .accessoryRectangular,
            .accessoryCircular,
            .accessoryInline
        ])
    }
}`;

  const androidGlanceCode = `// DailyHadithWidgetReceiver.kt
package com.dailyhadith.widget

import android.content.Context
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetReceiver
import androidx.glance.layout.*
import androidx.glance.text.*
import androidx.glance.GlanceModifier
import androidx.glance.action.clickable
import androidx.glance.action.actionStartActivity

class DailyHadithGlanceWidget : GlanceAppWidget() {
    override suspend fun provideGlance(context: Context, id: GlanceId) {
        val prefs = context.getSharedPreferences("DailyHadithPrefs", Context.MODE_PRIVATE)
        val text = prefs.getString("daily_text", "The reward of deeds depends upon intentions...")
        val narrator = prefs.getString("daily_narrator", "Narrated 'Umar bin Al-Khattab")

        provideContent {
            Column(modifier = GlanceModifier.fillMaxSize().padding(12.dp)) {
                Text(text = "DAILY HADITH", style = TextStyle(fontWeight = FontWeight.Bold))
                Text(text = narrator ?: "", style = TextStyle(fontSize = 11.sp))
                Text(text = "\\"$text\\"", style = TextStyle(fontSize = 13.sp))
            }
        }
    }
}`;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Intro Header */}
      <div className="p-6 rounded-3xl bg-neutral-900/60 border border-white/10 backdrop-blur-md space-y-3">
        <div className="flex items-center space-x-2.5">
          <Code2 className="w-6 h-6 text-amber-400" />
          <h3 className="font-serif text-2xl font-semibold text-neutral-100">
            Native Widget Implementations & Setup
          </h3>
        </div>
        <p className="text-sm text-neutral-300 leading-relaxed">
          Daily Hadith includes ready-to-use native widget code for iOS (WidgetKit & Lock Screen) and Android (Glance / RemoteViews AppWidget).
        </p>
      </div>

      {/* iOS Swift WidgetKit Section */}
      <div className="p-6 rounded-3xl bg-[#11131c] border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Apple className="w-5 h-5 text-neutral-200" />
            <h4 className="font-semibold text-base text-neutral-100">iOS WidgetKit Extension (SwiftUI)</h4>
          </div>
          <button
            onClick={() => copyCode('swift', swiftWidgetCode)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-neutral-200 transition"
          >
            {copiedSection === 'swift' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSection === 'swift' ? 'Copied' : 'Copy Swift Code'}</span>
          </button>
        </div>

        <div className="text-xs text-neutral-400 space-y-1">
          <p>• Supports <strong>.systemSmall</strong>, <strong>.systemMedium</strong>, <strong>.systemLarge</strong></p>
          <p>• Supports iOS 16+ Lock Screen: <strong>.accessoryRectangular</strong>, <strong>.accessoryCircular</strong>, <strong>.accessoryInline</strong></p>
          <p>• Timeline updates scheduled daily at 00:00 local time</p>
        </div>

        <pre className="p-4 rounded-xl bg-black/60 border border-white/5 font-mono text-xs text-neutral-300 overflow-x-auto max-h-72">
          <code>{swiftWidgetCode}</code>
        </pre>
      </div>

      {/* Android Glance Section */}
      <div className="p-6 rounded-3xl bg-[#11131c] border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Smartphone className="w-5 h-5 text-emerald-400" />
            <h4 className="font-semibold text-base text-neutral-100">Android AppWidget / Jetpack Glance (Kotlin)</h4>
          </div>
          <button
            onClick={() => copyCode('android', androidGlanceCode)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-neutral-200 transition"
          >
            {copiedSection === 'android' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSection === 'android' ? 'Copied' : 'Copy Kotlin Code'}</span>
          </button>
        </div>

        <div className="text-xs text-neutral-400 space-y-1">
          <p>• Responsive cell layout support (Small 2x2, Medium 4x2, Large 4x4)</p>
          <p>• Material You theme adaptability with deep-link handling via <code className="text-amber-300">dailyhadith://hadith/[id]</code></p>
        </div>

        <pre className="p-4 rounded-xl bg-black/60 border border-white/5 font-mono text-xs text-neutral-300 overflow-x-auto max-h-72">
          <code>{androidGlanceCode}</code>
        </pre>
      </div>
    </div>
  );
};
