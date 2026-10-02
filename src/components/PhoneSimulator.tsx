import React, { useState, useEffect } from 'react';
import { Hadith, DailySelection } from '../types/hadith';
import { getDailyHadith } from '../utils/dailyEngine';
import { MobileAppShell } from './MobileAppShell';
import { ScreensaverView } from './ScreensaverView';
import { WidgetSimulator } from './WidgetSimulator';
import { IslamicPattern } from './IslamicPattern';
import { AppLogo } from './AppLogo';
import {
  Wifi,
  Battery,
  Signal,
  Lock,
  Moon,
  Sparkles,
  Smartphone,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Layers,
  CheckCircle2,
  Clock,
  Compass,
  BookOpen
} from 'lucide-react';

export type DeviceSkin = 'iphone-16-pro' | 'pixel-9-pro' | 'responsive';
export type PhoneState = 'in-app' | 'home-screen' | 'lock-screen' | 'screensaver';

interface PhoneSimulatorProps {
  onDirectFullscreen?: () => void;
}

export const PhoneSimulator: React.FC<PhoneSimulatorProps> = ({ onDirectFullscreen }) => {
  const [deviceSkin, setDeviceSkin] = useState<DeviceSkin>('iphone-16-pro');
  const [phoneState, setPhoneState] = useState<PhoneState>('in-app');
  const [currentTime, setCurrentTime] = useState('09:41');
  const [currentDateStr, setCurrentDateStr] = useState('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [playingTitle, setPlayingTitle] = useState('');
  const [scale, setScale] = useState<number>(1);
  const [showWidgetSheet, setShowWidgetSheet] = useState(false);
  const [selectedHadith, setSelectedHadith] = useState<Hadith | null>(null);

  const dailySelection: DailySelection = getDailyHadith(new Date());

  // Clock sync
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
      setCurrentDateStr(
        now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleAudioStatus = (playing: boolean, title: string) => {
    setIsPlayingAudio(playing);
    setPlayingTitle(title);
  };

  const unlockPhone = () => {
    setPhoneState('in-app');
  };

  const lockPhone = () => {
    setPhoneState((prev) => (prev === 'lock-screen' ? 'in-app' : 'lock-screen'));
  };

  const goToHomeScreen = () => {
    setPhoneState('home-screen');
  };

  const openApp = (hadith?: Hadith) => {
    if (hadith) setSelectedHadith(hadith);
    setPhoneState('in-app');
  };

  if (deviceSkin === 'responsive') {
    return (
      <div className="w-full h-screen bg-[#080a0f] flex flex-col">
        <MobileAppShell
          onOpenScreensaver={() => setPhoneState('screensaver')}
          onOpenWidgetSimulator={() => setShowWidgetSheet(true)}
          onHadithPlayStatusChange={handleAudioStatus}
          initialHadith={selectedHadith}
        />

        {phoneState === 'screensaver' && (
          <ScreensaverView
            hadith={selectedHadith || dailySelection.hadith}
            hijriDate={dailySelection.hijriDate}
            onClose={() => setPhoneState('in-app')}
          />
        )}
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-130px)] flex flex-col items-center justify-center p-2 sm:p-6 select-none animate-fade-in">
      {/* Device Toolbar Controls */}
      <div className="mb-5 flex flex-wrap items-center justify-center gap-2 p-2.5 rounded-2xl bg-neutral-900/80 border border-white/10 backdrop-blur-md shadow-xl text-xs z-20">
        <div className="flex items-center space-x-1.5 px-2 text-neutral-400 font-medium">
          <Smartphone className="w-4 h-4 text-amber-400" />
          <span>Device:</span>
        </div>

        {/* Skin Switcher */}
        <div className="bg-black/40 p-1 rounded-xl border border-white/10 flex space-x-1">
          <button
            onClick={() => setDeviceSkin('iphone-16-pro')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
              deviceSkin === 'iphone-16-pro'
                ? 'bg-amber-500 text-neutral-950 font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            iPhone 16 Pro
          </button>
          <button
            onClick={() => setDeviceSkin('pixel-9-pro')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
              deviceSkin === 'pixel-9-pro'
                ? 'bg-amber-500 text-neutral-950 font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Pixel 9 Pro
          </button>
        </div>

        {/* Phone State Simulation Buttons */}
        <div className="bg-black/40 p-1 rounded-xl border border-white/10 flex space-x-1">
          <button
            onClick={() => setPhoneState('in-app')}
            className={`px-2.5 py-1 rounded-lg text-xs transition ${
              phoneState === 'in-app' ? 'bg-white/20 text-white font-semibold' : 'text-neutral-400'
            }`}
          >
            In-App
          </button>
          <button
            onClick={() => setPhoneState('home-screen')}
            className={`px-2.5 py-1 rounded-lg text-xs transition ${
              phoneState === 'home-screen' ? 'bg-white/20 text-white font-semibold' : 'text-neutral-400'
            }`}
          >
            Home Screen & Widgets
          </button>
          <button
            onClick={() => setPhoneState('lock-screen')}
            className={`px-2.5 py-1 rounded-lg text-xs transition ${
              phoneState === 'lock-screen' ? 'bg-white/20 text-white font-semibold' : 'text-neutral-400'
            }`}
          >
            Lock Screen
          </button>
        </div>

        {/* Action Button: Quick Screensaver */}
        <button
          onClick={() => setPhoneState('screensaver')}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition font-medium"
        >
          <Moon className="w-3.5 h-3.5 text-amber-400" />
          <span>Screensaver</span>
        </button>
      </div>

      {/* Realistic Mobile Device Frame */}
      <div
        className="relative transition-transform duration-300 ease-out"
        style={{ transform: `scale(${scale})` }}
      >
        {/* PHYSICAL HARDWARE FRAME (Titanium finish with antenna bands & bezel) */}
        <div className="relative w-[375px] h-[780px] sm:w-[390px] sm:h-[812px] bg-[#1a1b22] rounded-[55px] p-[12px] shadow-[0_25px_70px_rgba(0,0,0,0.85),0_0_0_2px_#333745,inset_0_0_0_2px_#12131a] flex flex-col">
          {/* Physical Side Buttons */}
          {/* Left: Volume Up, Volume Down, Action Button */}
          <div
            onClick={() => setPhoneState('screensaver')}
            className="absolute -left-[14px] top-[105px] w-[4px] h-[32px] bg-[#2a2d39] rounded-l-md cursor-pointer hover:bg-amber-400 transition"
            title="Action Button (Screensaver)"
          />
          <div
            className="absolute -left-[14px] top-[155px] w-[4px] h-[50px] bg-[#2a2d39] rounded-l-md cursor-pointer hover:bg-neutral-500"
            title="Volume Up"
          />
          <div
            className="absolute -left-[14px] top-[215px] w-[4px] h-[50px] bg-[#2a2d39] rounded-l-md cursor-pointer hover:bg-neutral-500"
            title="Volume Down"
          />

          {/* Right: Power / Lock Button */}
          <div
            onClick={lockPhone}
            className="absolute -right-[14px] top-[170px] w-[4px] h-[65px] bg-[#2a2d39] rounded-r-md cursor-pointer hover:bg-amber-400 transition"
            title="Power / Lock Button (Tap to Lock/Unlock)"
          />

          {/* PHONE SCREEN DISPLAY */}
          <div className="relative w-full h-full bg-[#08090e] rounded-[44px] overflow-hidden flex flex-col justify-between border border-black/80 shadow-inner">
            {/* 1. TOP STATUS BAR */}
            <div className="relative z-40 shrink-0 h-[44px] px-6 flex items-center justify-between text-white text-[13px] font-sans font-medium tracking-tight bg-transparent">
              {/* Clock */}
              <span className="w-14 font-semibold">{currentTime}</span>

              {/* DYNAMIC ISLAND / CAMERA CUTOUT */}
              {deviceSkin === 'iphone-16-pro' ? (
                <div
                  onClick={() => {
                    if (isPlayingAudio) {
                      openApp();
                    }
                  }}
                  className={`cursor-pointer transition-all duration-300 rounded-full bg-black flex items-center justify-between px-3 z-50 border border-white/10 ${
                    isPlayingAudio
                      ? 'w-[190px] h-[34px] shadow-lg shadow-amber-500/20'
                      : 'w-[115px] h-[28px]'
                  }`}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-[#111] border border-neutral-800" />
                  {isPlayingAudio ? (
                    <div className="flex items-center space-x-1.5 text-[10px] text-amber-300 font-sans truncate">
                      <Sparkles className="w-3 h-3 text-amber-400 animate-spin" />
                      <span className="truncate">Reciting Hadith...</span>
                    </div>
                  ) : null}
                  <div className="w-2.5 h-2.5 rounded-full bg-[#0a1420] border border-blue-900/50" />
                </div>
              ) : (
                /* Pixel 9 Center Punch Hole */
                <div className="w-3.5 h-3.5 rounded-full bg-black border border-white/10" />
              )}

              {/* Status Icons */}
              <div className="w-14 flex items-center justify-end space-x-1.5 text-neutral-200">
                <Signal className="w-3.5 h-3.5" />
                <Wifi className="w-3.5 h-3.5" />
                <Battery className="w-4 h-4 text-white fill-white" />
              </div>
            </div>

            {/* 2. MAIN SCREEN CONTENT CONTAINER */}
            <div className="flex-1 w-full overflow-hidden relative">
              {/* STATE A: IN-APP VIEW */}
              {phoneState === 'in-app' && (
                <MobileAppShell
                  onOpenScreensaver={() => setPhoneState('screensaver')}
                  onOpenWidgetSimulator={() => setShowWidgetSheet(true)}
                  onHadithPlayStatusChange={handleAudioStatus}
                  initialHadith={selectedHadith}
                />
              )}

              {/* STATE B: PHONE HOME SCREEN (WITH LIVE WIDGETS!) */}
              {phoneState === 'home-screen' && (
                <div className="w-full h-full bg-gradient-to-b from-[#0e1628] via-[#09101c] to-[#040810] p-4 flex flex-col justify-between overflow-y-auto scrollbar-none animate-fade-in relative">
                  <IslamicPattern opacity={15} color="#d4af37" />

                  {/* Top: Daily Hadith Medium Widget (4x2) placed on Home Screen */}
                  <div className="space-y-4 pt-1 relative z-10">
                    <div
                      onClick={() => openApp(dailySelection.hadith)}
                      className="cursor-pointer group relative w-full h-[155px] rounded-[24px] bg-gradient-to-b from-[#181c2a] via-[#10131e] to-[#0a0c13] border border-amber-500/35 p-4 flex flex-col justify-between shadow-2xl overflow-hidden hover:scale-[1.02] transition-all"
                    >
                      <IslamicPattern opacity={22} color="#d4af37" />
                      <div className="relative z-10 flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[9px] font-bold tracking-wider">
                          DAILY HADITH
                        </span>
                        <span className="text-[10px] text-neutral-400 font-sans">
                          {dailySelection.hijriDate.split(' ')[0]} {dailySelection.hijriDate.split(' ')[1]}
                        </span>
                      </div>

                      <div className="relative z-10 my-auto py-1">
                        {dailySelection.hadith.narrator && (
                          <p className="text-[10px] font-sans font-medium text-amber-300/90 truncate">
                            {dailySelection.hadith.narrator}
                          </p>
                        )}
                        <p className="font-serif text-xs leading-snug text-neutral-100 line-clamp-3">
                          &ldquo;{dailySelection.hadith.excerpt}&rdquo;
                        </p>
                      </div>

                      <div className="relative z-10 pt-1 border-t border-white/10 flex items-center justify-between text-[9px] text-neutral-400">
                        <span className="truncate max-w-[170px]">
                          Book {dailySelection.hadith.bookNumber} • #{dailySelection.hadith.hadithNumber}
                        </span>
                        <span className="text-amber-400 font-medium">Tap to open</span>
                      </div>
                    </div>

                    {/* App Grid Simulation */}
                    <div className="grid grid-cols-4 gap-4 px-1 pt-2">
                      {/* Daily Hadith App Icon */}
                      <div
                        onClick={() => openApp()}
                        className="flex flex-col items-center space-y-1.5 cursor-pointer group"
                      >
                        <AppLogo size={56} glow={true} className="group-hover:scale-105 transition-transform" />
                        <span className="text-[10.5px] text-white font-medium text-center truncate w-full">
                          Daily Hadith
                        </span>
                      </div>

                      {/* Mock System Apps */}
                      {[
                        { name: 'Screensaver', icon: Moon, color: 'from-purple-600 to-indigo-700', action: () => setPhoneState('screensaver') },
                        { name: 'Calendar', icon: Clock, color: 'from-red-500 to-rose-600', action: () => openApp() },
                        { name: 'Library', icon: BookOpen, color: 'from-emerald-600 to-teal-700', action: () => openApp() }
                      ].map((app, i) => {
                        const Icon = app.icon;
                        return (
                          <div
                            key={i}
                            onClick={app.action}
                            className="flex flex-col items-center space-y-1.5 cursor-pointer group"
                          >
                            <div className={`w-[56px] h-[56px] rounded-[15px] bg-gradient-to-tr ${app.color} p-0.5 shadow-lg group-hover:scale-105 transition-transform flex items-center justify-center`}>
                              <Icon className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-[10.5px] text-neutral-300 font-medium text-center truncate w-full">
                              {app.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Phone Dock Bar */}
                  <div className="relative z-10 mx-auto w-full p-2.5 rounded-[28px] bg-white/10 backdrop-blur-2xl border border-white/15 flex items-center justify-around mb-2 shadow-2xl">
                    <div onClick={() => openApp()} className="cursor-pointer">
                      <AppLogo size={48} glow={false} className="hover:scale-105 transition-transform" />
                    </div>
                    <div onClick={() => setPhoneState('screensaver')} className="cursor-pointer">
                      <div className="w-[48px] h-[48px] rounded-[13px] bg-gradient-to-tr from-purple-700 to-indigo-900 p-0.5 shadow-lg flex items-center justify-center text-white">
                        <Moon className="w-5 h-5" />
                      </div>
                    </div>
                    <div onClick={() => openApp()} className="cursor-pointer">
                      <div className="w-[48px] h-[48px] rounded-[13px] bg-gradient-to-tr from-emerald-600 to-teal-800 p-0.5 shadow-lg flex items-center justify-center text-white">
                        <BookOpen className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STATE C: PHONE LOCK SCREEN */}
              {phoneState === 'lock-screen' && (
                <div
                  onClick={unlockPhone}
                  className="cursor-pointer w-full h-full bg-gradient-to-b from-[#0a0d18] via-[#05070e] to-[#020306] p-6 flex flex-col justify-between text-neutral-100 relative animate-fade-in"
                >
                  <IslamicPattern opacity={18} color="#d4af37" />

                  {/* Top Lock Indicator */}
                  <div className="flex flex-col items-center pt-2 space-y-1 relative z-10">
                    <Lock className="w-4 h-4 text-amber-400" />
                    <div className="text-[11px] font-sans text-neutral-400">
                      {currentDateStr} • {dailySelection.hijriDate}
                    </div>
                    <div className="font-sans text-6xl font-extralight text-white tracking-tight pt-1">
                      {currentTime}
                    </div>
                  </div>

                  {/* Lock Screen Accessory Widget */}
                  <div className="relative z-10 my-auto space-y-3">
                    <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 shadow-2xl space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-amber-300 font-bold">
                        <span className="flex items-center space-x-1.5">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span>DAILY HADITH</span>
                        </span>
                        <span className="text-[10px] text-neutral-400 font-normal">Sahih al-Bukhari</span>
                      </div>
                      <p className="font-serif text-xs text-white line-clamp-2 leading-relaxed">
                        &ldquo;{dailySelection.hadith.excerpt}&rdquo;
                      </p>
                      <div className="text-[9px] text-neutral-400">
                        Book {dailySelection.hadith.bookNumber}: {dailySelection.hadith.bookName} • #{dailySelection.hadith.hadithNumber}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center text-xs text-amber-300 font-medium">
                      Notification: Today&apos;s Hadith is ready for contemplation.
                    </div>
                  </div>

                  {/* Bottom Unlock Prompt */}
                  <div className="relative z-10 text-center pb-2 space-y-1">
                    <p className="text-xs text-neutral-400 font-sans animate-bounce">
                      Tap anywhere or swipe up to unlock
                    </p>
                  </div>
                </div>
              )}

              {/* STATE D: PEACEFUL SCREENSAVER WITHIN PHONE */}
              {phoneState === 'screensaver' && (
                <ScreensaverView
                  hadith={selectedHadith || dailySelection.hadith}
                  hijriDate={dailySelection.hijriDate}
                  onClose={() => setPhoneState('in-app')}
                />
              )}
            </div>

            {/* 3. BOTTOM HOME GESTURE BAR */}
            <div
              onClick={goToHomeScreen}
              className="relative z-40 shrink-0 h-[22px] flex items-center justify-center cursor-pointer group bg-black/40"
              title="Home Indicator (Tap to return to Phone Home Screen)"
            >
              <div className="w-[135px] h-[4.5px] bg-white/60 group-hover:bg-amber-400 rounded-full transition-all" />
            </div>
          </div>
        </div>
      </div>

      {/* Widget Sheet Modal */}
      {showWidgetSheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#12141c] border border-amber-500/30 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-serif text-xl font-bold text-white">Interactive Mobile Widgets</h3>
              <button
                onClick={() => setShowWidgetSheet(false)}
                className="px-4 py-2 rounded-xl bg-white/10 text-xs text-white"
              >
                Close
              </button>
            </div>
            <WidgetSimulator
              hadith={dailySelection.hadith}
              dateString={dailySelection.dateString}
              hijriDate={dailySelection.hijriDate}
              onSelectHadith={(h) => {
                setSelectedHadith(h);
                setPhoneState('in-app');
                setShowWidgetSheet(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
