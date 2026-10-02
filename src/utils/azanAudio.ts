/**
 * Authentic Muezzin Vocal Audio & Azan Controller
 * Integrated with Islamic Network API (https://islamic.network/api/)
 */

export type MuezzinId = 'makkah' | 'madinah' | 'alafasy' | 'alaqsa' | 'abdulbasit' | 'chime';

export interface AzanSettings {
  autoAzanEnabled: boolean;
  selectedMuezzin: MuezzinId;
  volume: number; // 0.1 to 1.0
  notifyBrowser: boolean;
  lastPlayedPrayerKey?: string;
}

const AZAN_SETTINGS_KEY = 'daily_hadith_azan_settings_v2';

export const DEFAULT_AZAN_SETTINGS: AzanSettings = {
  autoAzanEnabled: true,
  selectedMuezzin: 'makkah',
  volume: 0.95,
  notifyBrowser: true
};

const baseUrl = import.meta.env.BASE_URL || './';
const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

export const MUEZZIN_SOURCES: Record<MuezzinId, { name: string; subtitle: string; location: string; url: string }> = {
  makkah: {
    name: 'Makkah Al-Mukarramah',
    subtitle: 'Sheikh Ali Ahmed Mulla (Grand Mosque Chief Muezzin)',
    location: 'Masjid al-Haram, Makkah',
    url: `${cleanBase}audio/adhan_makkah.mp3`
  },
  madinah: {
    name: 'Al-Madinah Al-Munawwarah',
    subtitle: 'Sheikh Essam Bukhari (Prophet\'s Mosque Muezzin)',
    location: 'Masjid an-Nabawi, Madinah',
    url: `${cleanBase}audio/adhan_madinah.mp3`
  },
  alafasy: {
    name: 'Mishary Rashid Alafasy',
    subtitle: 'Sheikh Mishary Rashid Alafasy',
    location: 'Grand Mosque, Kuwait',
    url: `${cleanBase}audio/adhan_alafasy.mp3`
  },
  alaqsa: {
    name: 'Masjid Al-Aqsa (Jerusalem)',
    subtitle: 'Sheikh Najee Qazaz (Al-Aqsa Muezzin)',
    location: 'Al-Aqsa Mosque, Jerusalem',
    url: `${cleanBase}audio/adhan_alaqsa.mp3`
  },
  abdulbasit: {
    name: 'Sheikh Abdul Basit Abdul Samad',
    subtitle: 'Classic Historic Egyptian Adhan',
    location: 'Cairo, Egypt',
    url: `${cleanBase}audio/adhan_abdulbasit.mp3`
  },
  chime: {
    name: 'Gentle Acoustic Adhan Chime',
    subtitle: 'Harmonic 4-Tone Melodic Chime',
    location: 'Acoustic Synthesizer',
    url: ''
  }
};

export function getAzanSettings(): AzanSettings {
  try {
    const raw = localStorage.getItem(AZAN_SETTINGS_KEY);
    return raw ? { ...DEFAULT_AZAN_SETTINGS, ...JSON.parse(raw) } : DEFAULT_AZAN_SETTINGS;
  } catch {
    return DEFAULT_AZAN_SETTINGS;
  }
}

export function saveAzanSettings(settings: AzanSettings): void {
  localStorage.setItem(AZAN_SETTINGS_KEY, JSON.stringify(settings));
}

let activeAudio: HTMLAudioElement | null = null;
let audioContextInstance: AudioContext | null = null;

/**
 * Plays the authentic vocal Azan audio with callback handlers
 */
export function playAzan(
  onStart?: () => void,
  onEnd?: () => void,
  muezzinKey?: MuezzinId
): boolean {
  stopAzan();

  const settings = getAzanSettings();
  const selectedKey = muezzinKey || settings.selectedMuezzin;

  if (selectedKey === 'chime') {
    playAcousticAdhanChime(onEnd);
    if (onStart) onStart();
    return true;
  }

  const source = MUEZZIN_SOURCES[selectedKey] || MUEZZIN_SOURCES.makkah;

  try {
    const audio = new Audio(source.url);
    audio.volume = Math.max(0.1, Math.min(1.0, settings.volume));

    audio.onplay = () => {
      if (onStart) onStart();
    };

    audio.onended = () => {
      activeAudio = null;
      if (onEnd) onEnd();
    };

    audio.onerror = (e) => {
      console.warn('Audio file error, falling back to harmonic chime:', e);
      playAcousticAdhanChime(onEnd);
      if (onStart) onStart();
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('Audio play prevented or interrupted:', err);
        // Fallback to synthesized audio on permission block
        playAcousticAdhanChime(onEnd);
        if (onStart) onStart();
      });
    }

    activeAudio = audio;
    return true;
  } catch (err) {
    console.warn('Azan audio play exception:', err);
    playAcousticAdhanChime(onEnd);
    if (onStart) onStart();
    return true;
  }
}

export function stopAzan(): void {
  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.currentTime = 0;
    } catch {}
    activeAudio = null;
  }
}

export function isAzanPlaying(): boolean {
  return activeAudio !== null && !activeAudio.paused;
}

/**
 * Acoustic multi-harmonic chime fallback using Web Audio API
 */
export function playAcousticAdhanChime(onEnd?: () => void): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioContextInstance) audioContextInstance = new AudioContextClass();
    if (audioContextInstance.state === 'suspended') audioContextInstance.resume();

    const now = audioContextInstance.currentTime;
    const notes = [
      { freq: 293.66, time: 0.0, dur: 1.2 }, // D4 (Allahu)
      { freq: 392.00, time: 1.0, dur: 1.5 }, // G4 (Akbar)
      { freq: 349.23, time: 2.2, dur: 1.2 }, // F4 (Allahu)
      { freq: 440.00, time: 3.2, dur: 2.0 }, // A4 (Akbar)
      { freq: 392.00, time: 5.0, dur: 2.5 }  // G4 (La ilaha illallah)
    ];

    notes.forEach((n) => {
      if (!audioContextInstance) return;
      const osc = audioContextInstance.createOscillator();
      const gain = audioContextInstance.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.freq, now + n.time);

      gain.gain.setValueAtTime(0, now + n.time);
      gain.gain.linearRampToValueAtTime(0.35, now + n.time + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.time + n.dur);

      osc.connect(gain);
      gain.connect(audioContextInstance.destination);

      osc.start(now + n.time);
      osc.stop(now + n.time + n.dur);
    });

    if (onEnd) {
      setTimeout(onEnd, 7500);
    }
  } catch (e) {
    if (onEnd) onEnd();
  }
}
