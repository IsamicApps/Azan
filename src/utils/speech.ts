/**
 * Calm and dignified speech synthesis helper for reading Hadith text.
 */
let currentUtterance: SpeechSynthesisUtterance | null = null;

export function speakHadith(
  narrator: string,
  hadithText: string,
  onStart?: () => void,
  onEnd?: () => void
): boolean {
  if (!('speechSynthesis' in window)) return false;

  stopSpeaking();

  const fullText = `${narrator ? narrator + '. ' : ''}${hadithText}`;
  const utterance = new SpeechSynthesisUtterance(fullText);
  
  // Find a serene English voice if available
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(v => 
    (v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Serena') || v.name.includes('Daniel') || v.name.includes('Oliver') || v.name.includes('Google')))
  ) || voices.find(v => v.lang.startsWith('en'));

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  utterance.rate = 0.88; // Gentle, measured cadence
  utterance.pitch = 0.98;

  utterance.onstart = () => {
    if (onStart) onStart();
  };

  utterance.onend = () => {
    currentUtterance = null;
    if (onEnd) onEnd();
  };

  utterance.onerror = () => {
    currentUtterance = null;
    if (onEnd) onEnd();
  };

  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopSpeaking(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  currentUtterance = null;
}

export function isSpeaking(): boolean {
  if (!('speechSynthesis' in window)) return false;
  return window.speechSynthesis.speaking;
}
