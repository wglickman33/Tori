import type { Language } from "../i18n/language";
import { speechLocale } from "../i18n/language";

export type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
};

export type SpeechRecognitionResultEventLike = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognitionCtor() != null;
}

export function createSpeechRecognition(): SpeechRecognitionLike | null {
  const Ctor = getSpeechRecognitionCtor();
  if (!Ctor) return null;
  try {
    return new Ctor();
  } catch {
    return null;
  }
}

export function plainTextForSpeech(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`*_#>~|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const SPANISH_VOICE_PREFERENCES = ["es-mx", "es-us", "es-419", "es-co", "es-ar", "es-cl", "es"];

function normalizeVoiceLang(lang: string): string {
  return lang.toLowerCase().replace("_", "-");
}

export function pickSpeechVoice(locale: string, voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;

  const target = normalizeVoiceLang(locale);
  const languagePrefix = target.split("-")[0] ?? target;
  const candidates = voices.filter((voice) => normalizeVoiceLang(voice.lang).startsWith(languagePrefix));
  if (candidates.length === 0) return null;

  if (languagePrefix === "es") {
    for (const pref of SPANISH_VOICE_PREFERENCES) {
      const match = candidates.find((voice) => {
        const lang = normalizeVoiceLang(voice.lang);
        return lang === pref || lang.startsWith(`${pref}-`);
      });
      if (match) return match;
    }
  }

  const exact = candidates.find((voice) => normalizeVoiceLang(voice.lang) === target);
  return exact ?? candidates[0] ?? null;
}

let activeUtterance: SpeechSynthesisUtterance | null = null;
let speakEnd: (() => void) | null = null;

function clearSpeaking() {
  const onEnd = speakEnd;
  speakEnd = null;
  activeUtterance = null;
  onEnd?.();
}

type SpeakTextOptions = {
  onEnd?: () => void;
  language?: Language;
};

export function speakText(text: string, options?: SpeakTextOptions): void {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    options?.onEnd?.();
    return;
  }
  const spoken = plainTextForSpeech(text);
  if (!spoken) {
    options?.onEnd?.();
    return;
  }

  stopSpeaking();

  const locale = speechLocale(options?.language ?? "en");
  const utterance = new SpeechSynthesisUtterance(spoken);
  utterance.lang = locale;
  utterance.rate = 1.02;

  const voices = window.speechSynthesis.getVoices();
  const voice = pickSpeechVoice(locale, voices);
  if (voice) utterance.voice = voice;

  speakEnd = options?.onEnd ?? null;
  activeUtterance = utterance;
  utterance.onend = () => {
    if (activeUtterance !== utterance) return;
    clearSpeaking();
  };
  utterance.onerror = () => {
    if (activeUtterance !== utterance) return;
    clearSpeaking();
  };

  if (voices.length === 0) {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.onvoiceschanged = null;
      const loaded = window.speechSynthesis.getVoices();
      const loadedVoice = pickSpeechVoice(locale, loaded);
      if (loadedVoice) utterance.voice = loadedVoice;
      window.speechSynthesis.speak(utterance);
    };
  }

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  clearSpeaking();
}
