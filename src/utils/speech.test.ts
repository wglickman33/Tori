import { describe, it, expect, vi, afterEach } from "vitest";
import {
  createSpeechRecognition,
  isSpeechRecognitionSupported,
  pickSpeechVoice,
  plainTextForSpeech,
  speakText,
  stopSpeaking,
} from "./speech";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("plainTextForSpeech", () => {
  it("strips markdown so replies can be spoken", () => {
    expect(plainTextForSpeech("Keep **milk** in the [fridge](https://example.com).")).toBe(
      "Keep milk in the fridge."
    );
  });
});

describe("pickSpeechVoice", () => {
  it("prefers Latin American Spanish voices", () => {
    const voices = [
      { lang: "en-US", name: "English" },
      { lang: "es-ES", name: "Castilian" },
      { lang: "es-MX", name: "Mexican" },
    ] as SpeechSynthesisVoice[];

    expect(pickSpeechVoice("es-MX", voices)?.name).toBe("Mexican");
  });
});

describe("speech recognition helpers", () => {
  it("reports unsupported when no constructor exists", () => {
    vi.stubGlobal("window", { ...window, SpeechRecognition: undefined, webkitSpeechRecognition: undefined });
    expect(isSpeechRecognitionSupported()).toBe(false);
    expect(createSpeechRecognition()).toBeNull();
  });

  it("creates a recognizer when the browser provides one", () => {
    const start = vi.fn();
    class FakeRec {
      start = start;
    }
    vi.stubGlobal("webkitSpeechRecognition", FakeRec);
    expect(isSpeechRecognitionSupported()).toBe(true);
    expect(createSpeechRecognition()).toBeInstanceOf(FakeRec);
  });
});

describe("speakText", () => {
  it("speaks plain text and can be cancelled", () => {
    const speak = vi.fn();
    const cancel = vi.fn();
    const getVoices = vi.fn().mockReturnValue([{ lang: "en-US", name: "English" }]);
    vi.stubGlobal("speechSynthesis", { speak, cancel, getVoices, onvoiceschanged: null });
    vi.stubGlobal("SpeechSynthesisUtterance", class {
      text = "";
      rate = 1;
      lang = "";
      voice: SpeechSynthesisVoice | null = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(text: string) {
        this.text = text;
      }
    });

    speakText("**Hello** there");
    expect(cancel).toHaveBeenCalled();
    expect(speak).toHaveBeenCalled();
    expect(speak.mock.calls[0][0].text).toBe("Hello there");

    const onEnd = vi.fn();
    speakText("Again", { onEnd });
    stopSpeaking();
    expect(onEnd).toHaveBeenCalled();
    expect(cancel).toHaveBeenCalledTimes(3);
  });

  it("selects a Spanish voice when language is es", () => {
    const speak = vi.fn();
    const cancel = vi.fn();
    const getVoices = vi.fn().mockReturnValue([
      { lang: "en-US", name: "English" },
      { lang: "es-MX", name: "Mexican" },
    ]);
    vi.stubGlobal("speechSynthesis", { speak, cancel, getVoices, onvoiceschanged: null });
    vi.stubGlobal("SpeechSynthesisUtterance", class {
      text = "";
      rate = 1;
      lang = "";
      voice: SpeechSynthesisVoice | null = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(text: string) {
        this.text = text;
      }
    });

    speakText("Hola", { language: "es" });
    expect(speak.mock.calls[0][0].lang).toBe("es-MX");
    expect(speak.mock.calls[0][0].voice?.name).toBe("Mexican");
  });
});
