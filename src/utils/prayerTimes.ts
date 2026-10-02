import mosquesData from '../data/mosques.json';

export interface Mosque {
  id: string;
  name: string;
  loc: string;
  suburb: string;
  state: string;
  area: string;
  address: string;
  lat: number;
  lng: number;
  link: string;
  iqamaOffsets: Record<string, number>;
  jumuah: string;
  distanceKm?: number;
}

export interface PrayerTimesResult {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  nextPrayer: {
    name: 'Fajr' | 'Sunrise' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';
    time: string;
    remainingFormatted: string;
    remainingSeconds: number;
    iqamaTime?: string;
  };
  currentPrayer: string;
  qiblaBearing: number;
  mosque: Mosque;
}

export const ALL_MOSQUES: Mosque[] = mosquesData as Mosque[];

/**
 * Calculates Haversine distance between two GPS coordinates in kilometers.
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Returns mosques sorted by distance from user coordinates.
 */
export function getMosquesSortedByDistance(userLat: number, userLng: number): Mosque[] {
  return ALL_MOSQUES.map(m => ({
    ...m,
    distanceKm: calculateDistanceKm(userLat, userLng, m.lat, m.lng)
  })).sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
}

/**
 * Calculates Qibla direction in degrees from north towards Makkah (21.4225° N, 39.8262° E).
 */
export function calculateQiblaBearing(lat: number, lng: number): number {
  const mLat = 21.422487 * (Math.PI / 180);
  const mLon = 39.826206 * (Math.PI / 180);
  const uLat = lat * (Math.PI / 180);
  const uLon = lng * (Math.PI / 180);

  const y = Math.sin(mLon - uLon);
  const x = Math.cos(uLat) * Math.tan(mLat) - Math.sin(uLat) * Math.cos(mLon - uLon);
  let qibla = Math.atan2(y, x) * (180 / Math.PI);
  return (qibla + 360) % 360;
}

/**
 * Computes exact daily prayer times using astronomical solar equations matching Awqat.com.au.
 */
export function calculateMosquePrayerTimes(
  mosque: Mosque = ALL_MOSQUES[0],
  date: Date = new Date(),
  fajrAngle: number = 18.0,
  ishaAngle: number = 18.0
): PrayerTimesResult {
  const lat = mosque.lat;
  const lng = mosque.lng;
  
  // Timezone offset in hours
  const tzOffset = -date.getTimezoneOffset() / 60;

  // Day of year
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const diff = (date.getTime() - startOfYear.getTime()) + ((startOfYear.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
  const oneDay = 1000 * 60 * 60 * 24;
  const N = Math.floor(diff / oneDay);

  // Solar calculations
  const M = (357.5291 + 0.98560028 * N) % 360;
  const M_rad = (M * Math.PI) / 180;
  const C = 1.9148 * Math.sin(M_rad) + 0.02 * Math.sin(2 * M_rad) + 0.0003 * Math.sin(3 * M_rad);
  const L = (280.4665 + 0.98564736 * N + C) % 360;
  const L_rad = (L * Math.PI) / 180;

  const sin_dec = Math.sin((23.44 * Math.PI) / 180) * Math.sin(L_rad);
  const dec_rad = Math.asin(sin_dec);

  const y = Math.tan((23.44 * Math.PI) / 360) ** 2;
  const EqT = 4 * ((y * Math.sin(2 * L_rad) - 2 * 0.0167 * Math.sin(M_rad) + 4 * 0.0167 * y * Math.sin(M_rad) * Math.cos(2 * L_rad) - 0.5 * (y ** 2) * Math.sin(4 * L_rad) - 1.25 * (0.0167 ** 2) * Math.sin(2 * M_rad)) * 180) / Math.PI;

  const dhuhr_utc = 12 + (-lng / 15.0) - (EqT / 60.0);
  const dhuhr_val = dhuhr_utc + tzOffset;

  const lat_rad = (lat * Math.PI) / 180;

  const hour_angle = (angle: number, is_sun = false): number | null => {
    const h0 = is_sun ? -0.8333 : -angle;
    const h0_rad = (h0 * Math.PI) / 180;
    const cos_ha = (Math.sin(h0_rad) - Math.sin(lat_rad) * Math.sin(dec_rad)) / (Math.cos(lat_rad) * Math.cos(dec_rad));
    if (cos_ha > 1 || cos_ha < -1) return null;
    return (Math.acos(cos_ha) * 180) / Math.PI / 15.0;
  };

  const ha_sun = hour_angle(0, true) || 6;
  const sunrise_val = dhuhr_val - ha_sun;
  const sunset_val = dhuhr_val + ha_sun;

  const ha_fajr = hour_angle(fajrAngle);
  const fajr_val = ha_fajr ? dhuhr_val - ha_fajr : sunrise_val - 1.5;

  const ha_isha = hour_angle(ishaAngle);
  const isha_val = ha_isha ? dhuhr_val + ha_isha : sunset_val + 1.5;

  const asr_alt = (Math.atan(1.0 / (1.0 + Math.tan(Math.abs(lat_rad - dec_rad)))) * 180) / Math.PI;
  const asr_alt_rad = (asr_alt * Math.PI) / 180;
  const cos_ha_asr = (Math.sin(asr_alt_rad) - Math.sin(lat_rad) * Math.sin(dec_rad)) / (Math.cos(lat_rad) * Math.cos(dec_rad));
  const ha_asr = (Math.acos(Math.max(-1, Math.min(1, cos_ha_asr))) * 180) / Math.PI / 15.0;
  const asr_val = dhuhr_val + ha_asr;
  const maghrib_val = sunset_val;

  const formatDecTime = (t: number): { formatted: string; totalMinutes: number } => {
    let normalized = (t % 24 + 24) % 24;
    const hours = Math.floor(normalized);
    let mins = Math.round((normalized - hours) * 60);
    let finalH = hours;
    if (mins === 60) {
      finalH = (finalH + 1) % 24;
      mins = 0;
    }
    const period = finalH < 12 ? 'AM' : 'PM';
    let h12 = finalH % 12;
    if (h12 === 0) h12 = 12;
    const formatted = `${String(h12).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${period}`;
    return { formatted, totalMinutes: finalH * 60 + mins };
  };

  const fObj = formatDecTime(fajr_val);
  const sObj = formatDecTime(sunrise_val);
  const dObj = formatDecTime(dhuhr_val);
  const aObj = formatDecTime(asr_val);
  const mObj = formatDecTime(maghrib_val);
  const iObj = formatDecTime(isha_val);

  // Compute Next Prayer and Countdown
  const currentMinutes = date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
  const schedule = [
    { name: 'Fajr' as const, mins: fObj.totalMinutes, time: fObj.formatted, offset: mosque.iqamaOffsets?.Fajr || 20 },
    { name: 'Sunrise' as const, mins: sObj.totalMinutes, time: sObj.formatted, offset: 0 },
    { name: 'Dhuhr' as const, mins: dObj.totalMinutes, time: dObj.formatted, offset: mosque.iqamaOffsets?.Dhuhr || 15 },
    { name: 'Asr' as const, mins: aObj.totalMinutes, time: aObj.formatted, offset: mosque.iqamaOffsets?.Asr || 15 },
    { name: 'Maghrib' as const, mins: mObj.totalMinutes, time: mObj.formatted, offset: mosque.iqamaOffsets?.Maghrib || 5 },
    { name: 'Isha' as const, mins: iObj.totalMinutes, time: iObj.formatted, offset: mosque.iqamaOffsets?.Isha || 10 }
  ];

  let next = schedule.find(p => p.mins > currentMinutes);
  let currentPrayerName = 'Isha';
  let diffSec = 0;

  if (next) {
    diffSec = Math.round((next.mins - currentMinutes) * 60);
    // Find current prayer
    const idx = schedule.indexOf(next);
    currentPrayerName = idx === 0 ? 'Isha' : schedule[idx - 1].name;
  } else {
    // Past Isha -> Next is Tomorrow's Fajr
    next = schedule[0];
    diffSec = Math.round((1440 - currentMinutes + next.mins) * 60);
    currentPrayerName = 'Isha';
  }

  const remHours = Math.floor(diffSec / 3600);
  const remMins = Math.floor((diffSec % 3600) / 60);
  const remSecs = diffSec % 60;
  const remainingFormatted = remHours > 0
    ? `${remHours}h ${remMins}m`
    : `${remMins}m ${remSecs}s`;

  // Compute Iqamah time
  const iqamaMins = next.mins + next.offset;
  const iqamaFormatted = formatDecTime(iqamaMins / 60).formatted;

  const qibla = calculateQiblaBearing(lat, lng);

  return {
    fajr: fObj.formatted,
    sunrise: sObj.formatted,
    dhuhr: dObj.formatted,
    asr: aObj.formatted,
    maghrib: mObj.formatted,
    isha: iObj.formatted,
    nextPrayer: {
      name: next.name,
      time: next.time,
      remainingFormatted,
      remainingSeconds: diffSec,
      iqamaTime: next.offset > 0 ? iqamaFormatted : undefined
    },
    currentPrayer: currentPrayerName,
    qiblaBearing: Math.round(qibla),
    mosque
  };
}

/**
 * Storage helpers for selected Mosque
 */
const SELECTED_MOSQUE_KEY = 'daily_hadith_selected_mosque_id_v1';

export function getSelectedMosque(): Mosque {
  try {
    const savedId = localStorage.getItem(SELECTED_MOSQUE_KEY);
    if (savedId) {
      const found = ALL_MOSQUES.find(m => m.id === savedId);
      if (found) return found;
    }
  } catch {}
  return ALL_MOSQUES[0]; // AMSSA North Melbourne default
}

export function saveSelectedMosque(mosqueId: string): void {
  localStorage.setItem(SELECTED_MOSQUE_KEY, mosqueId);
}
