import { useCallback, useEffect, useRef, useState } from "react";
import { speechLocale } from "../i18n/language";
import { useSettingsStore } from "../store/settingsStore";
import i18n from "../i18n";
import {
  createSpeechRecognition,
  isSpeechRecognitionSupported,
  type SpeechRecognitionLike,
} from "../utils/speech";

type UseToriVoiceOptions = {
  enabled: boolean;
  onFinal: (transcript: string) => void;
  onInterim: (transcript: string) => void;
  onError: (message: string) => void;
};

export function useToriVoice({ enabled, onFinal, onInterim, onError }: UseToriVoiceOptions) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onFinalRef = useRef(onFinal);
  const onInterimRef = useRef(onInterim);
  const onErrorRef = useRef(onError);

  onFinalRef.current = onFinal;
  onInterimRef.current = onInterim;
  onErrorRef.current = onError;

  const stop = useCallback(() => {
    const rec = recognitionRef.current;
    recognitionRef.current = null;
    setListening(false);
    rec?.stop();
  }, []);

  const start = useCallback(() => {
    if (!enabled) return;
    const rec = createSpeechRecognition();
    if (!rec) {
      onErrorRef.current(i18n.t("errors.voiceUnavailable"));
      return;
    }

    recognitionRef.current?.abort();
    rec.lang = speechLocale(useSettingsStore.getState().language);
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const piece = result?.[0]?.transcript ?? "";
        if (result.isFinal) finalText += piece;
        else interimText += piece;
      }
      const spoken = (finalText || interimText).trim();
      if (spoken) onInterimRef.current(spoken);
      if (finalText.trim()) {
        onFinalRef.current(finalText.trim());
      }
    };
    rec.onerror = (event) => {
      if (event.error === "aborted" || event.error === "no-speech") return;
      onErrorRef.current(
        event.error === "not-allowed"
          ? i18n.t("errors.micBlocked")
          : i18n.t("errors.voiceHearFailed")
      );
    };
    rec.onend = () => {
      recognitionRef.current = null;
      setListening(false);
    };

    try {
      rec.start();
      recognitionRef.current = rec;
      setListening(true);
    } catch {
      onErrorRef.current(i18n.t("errors.micStartFailed"));
    }
  }, [enabled]);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  useEffect(
    () => () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    },
    []
  );

  return {
    supported: isSpeechRecognitionSupported(),
    listening,
    start,
    stop,
    toggle,
  };
}
