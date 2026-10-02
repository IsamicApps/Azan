import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Share,
  Alert
} from 'react-native';
import * as Speech from 'expo-speech';
import { useKeepAwake } from 'expo-keep-awake';

// Sample dataset anchor for mobile native
const SAMPLE_DAILY_HADITH = {
  id: 'bukhari-v1-b1-n1',
  collection: 'Sahih al-Bukhari',
  volume: 1,
  bookNumber: 1,
  bookName: 'Revelation',
  hadithNumber: '1',
  narrator: "Narrated 'Umar bin Al-Khattab",
  text: "I heard Allah's Apostle saying, \"The reward of deeds depends upon the intentions and every person will get the reward according to what he has intended. So whoever emigrated for worldly benefits or for a woman to marry, his emigration was for what he emigrated for.\"",
  excerpt: "The reward of deeds depends upon the intentions and every person will get the reward according to what he has intended...",
  pdfPage: 7,
  sourceUrl: 'https://d1.islamhouse.com/data/en/ih_books/single/en_Sahih_Al-Bukhari.pdf#page=7'
};

export default function App() {
  const [isScreensaver, setIsScreensaver] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isFull, setIsFull] = useState(false);

  // Keep screen on during screensaver mode
  if (isScreensaver) {
    useKeepAwake();
  }

  const handleSpeech = () => {
    if (isPlayingAudio) {
      Speech.stop();
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      Speech.speak(`${SAMPLE_DAILY_HADITH.narrator}. ${SAMPLE_DAILY_HADITH.text}`, {
        rate: 0.88,
        pitch: 1.0,
        onDone: () => setIsPlayingAudio(false),
        onError: () => setIsPlayingAudio(false)
      });
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `"${SAMPLE_DAILY_HADITH.text}"\n\n— ${SAMPLE_DAILY_HADITH.narrator}\nSahih al-Bukhari, Book ${SAMPLE_DAILY_HADITH.bookNumber} (${SAMPLE_DAILY_HADITH.bookName}), Hadith #${SAMPLE_DAILY_HADITH.hadithNumber}\nSource: ${SAMPLE_DAILY_HADITH.sourceUrl}`
      });
    } catch (error) {
      Alert.alert('Share Error', (error as any).message);
    }
  };

  if (isScreensaver) {
    return (
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => setIsScreensaver(false)}
        style={styles.screensaverContainer}
      >
        <StatusBar hidden />
        <View style={styles.screensaverContent}>
          <Text style={styles.screensaverBadge}>PEACEFUL SCREENSAVER</Text>
          <Text style={styles.screensaverNarrator}>{SAMPLE_DAILY_HADITH.narrator}</Text>
          <Text style={styles.screensaverText}>&ldquo;{SAMPLE_DAILY_HADITH.text}&rdquo;</Text>
          <Text style={styles.screensaverRef}>
            Sahih al-Bukhari • Book {SAMPLE_DAILY_HADITH.bookNumber}: {SAMPLE_DAILY_HADITH.bookName} • #{SAMPLE_DAILY_HADITH.hadithNumber}
          </Text>
          <Text style={styles.screensaverHint}>Tap anywhere to exit screensaver</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Daily Hadith</Text>
          <Text style={styles.headerSub}>Sahih al-Bukhari • Verified</Text>
        </View>
        <TouchableOpacity
          onPress={() => setIsScreensaver(true)}
          style={styles.screensaverButton}
        >
          <Text style={styles.screensaverButtonText}>Screensaver</Text>
        </TouchableOpacity>
      </View>

      {/* Main Hadith Card */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.badgeRow}>
            <Text style={styles.todayBadge}>TODAY&apos;S HADITH</Text>
            <Text style={styles.hijriText}>1448 AH</Text>
          </View>

          <Text style={styles.narrator}>{SAMPLE_DAILY_HADITH.narrator}</Text>

          <Text style={styles.hadithText}>
            &ldquo;{isFull ? SAMPLE_DAILY_HADITH.text : SAMPLE_DAILY_HADITH.excerpt}&rdquo;
          </Text>

          <TouchableOpacity
            onPress={() => setIsFull(!isFull)}
            style={styles.readMoreBtn}
          >
            <Text style={styles.readMoreText}>{isFull ? 'Show Summary' : 'Read Full Hadith'}</Text>
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <View>
              <Text style={styles.footerRef}>
                Book {SAMPLE_DAILY_HADITH.bookNumber}: {SAMPLE_DAILY_HADITH.bookName}
              </Text>
              <Text style={styles.footerSub}>
                Vol. {SAMPLE_DAILY_HADITH.volume} • Hadith #{SAMPLE_DAILY_HADITH.hadithNumber} • PDF p. {SAMPLE_DAILY_HADITH.pdfPage}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity onPress={handleSpeech} style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>{isPlayingAudio ? '⏹ Stop' : '🔊 Listen'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleShare} style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>📤 Share</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080a0f'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'serif'
  },
  headerSub: {
    fontSize: 11,
    color: '#d4af37',
    marginTop: 2
  },
  screensaverButton: {
    backgroundColor: 'rgba(212,175,55,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)'
  },
  screensaverButtonText: {
    color: '#d4af37',
    fontSize: 12,
    fontWeight: '600'
  },
  scrollContent: {
    padding: 16
  },
  card: {
    backgroundColor: '#11131c',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
    padding: 22,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  todayBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#d4af37',
    backgroundColor: 'rgba(212,175,55,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  hijriText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)'
  },
  narrator: {
    fontSize: 13,
    fontWeight: '600',
    color: '#d4af37',
    marginBottom: 10
  },
  hadithText: {
    fontSize: 17,
    lineHeight: 26,
    color: '#f3f4f6',
    fontFamily: 'serif'
  },
  readMoreBtn: {
    marginTop: 12,
    alignSelf: 'flex-start'
  },
  readMoreText: {
    color: '#d4af37',
    fontSize: 13,
    fontWeight: 'bold'
  },
  footerRow: {
    marginTop: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)'
  },
  footerRef: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  footerSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 3
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#161924',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600'
  },
  screensaverContainer: {
    flex: 1,
    backgroundColor: '#040508',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  screensaverContent: {
    alignItems: 'center'
  },
  screensaverBadge: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#d4af37',
    letterSpacing: 2,
    marginBottom: 16
  },
  screensaverNarrator: {
    fontSize: 15,
    color: '#d4af37',
    fontWeight: '600',
    marginBottom: 14,
    textAlign: 'center'
  },
  screensaverText: {
    fontSize: 22,
    lineHeight: 34,
    color: '#ffffff',
    textAlign: 'center',
    fontFamily: 'serif',
    marginBottom: 20
  },
  screensaverRef: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 30
  },
  screensaverHint: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)'
  }
});
