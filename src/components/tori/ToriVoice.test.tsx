import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ToriAiPage from "../../pages/ToriAiPage";
import { useToriStore } from "../../store/toriStore";
import { useHouseholdStore } from "../../store/householdStore";
import type { SpeechRecognitionLike } from "../../utils/speech";

const chatStream = vi.fn();
const speakText = vi.fn();
const stopSpeaking = vi.fn();
let fakeRec: FakeRec | null = null;

class FakeRec implements SpeechRecognitionLike {
  lang = "";
  interimResults = false;
  continuous = false;
  start = vi.fn();
  stop = vi.fn(() => {
    this.onend?.();
  });
  abort = vi.fn();
  onresult: SpeechRecognitionLike["onresult"] = null;
  onerror: SpeechRecognitionLike["onerror"] = null;
  onend: SpeechRecognitionLike["onend"] = null;
}

vi.mock("../../components/layout/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("../../api/client", async () => {
  const actual = await vi.importActual<typeof import("../../api/client")>("../../api/client");
  return {
    ...actual,
    toriApi: {
      chatStream: (...args: unknown[]) => chatStream(...args),
    },
  };
});

vi.mock("../../store/toastStore", () => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("../../utils/speech", async () => {
  const actual = await vi.importActual<typeof import("../../utils/speech")>("../../utils/speech");
  return {
    ...actual,
    isSpeechRecognitionSupported: () => true,
    createSpeechRecognition: () => {
      fakeRec = new FakeRec();
      return fakeRec;
    },
    speakText: (...args: unknown[]) => speakText(...args),
    stopSpeaking: (...args: unknown[]) => stopSpeaking(...args),
  };
});

beforeEach(() => {
  fakeRec = null;
  chatStream.mockImplementation(async () => ({ reply: "Milk is in the fridge." }));
  useHouseholdStore.setState({
    household: {
      id: "h1",
      name: "Glickman Home",
      inviteCode: "CODE",
      role: "owner",
      ownerId: "u1",
      memberCount: 1,
      locationPresets: ["Fridge"],
    },
  });
});

afterEach(() => {
  cleanup();
  chatStream.mockReset();
  speakText.mockReset();
  stopSpeaking.mockReset();
  useToriStore.getState().resetChat();
  useToriStore.getState().closeWidget();
  useHouseholdStore.setState({ household: null, households: [] });
});

describe("Tori voice", () => {
  it("sends a spoken question and reads the reply aloud", async () => {
    render(
      <MemoryRouter>
        <ToriAiPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /talk to tori ai/i }));
    expect(fakeRec?.start).toHaveBeenCalled();
    expect(screen.getByPlaceholderText(/listening/i)).toBeTruthy();

    fakeRec?.onresult?.({
      resultIndex: 0,
      results: [{ isFinal: true, 0: { transcript: "Do we have milk?" } }],
    });

    await waitFor(() => {
      expect(chatStream).toHaveBeenCalledWith(
        [{ role: "user", content: "Do we have milk?" }],
        "h1",
        expect.any(Function)
      );
      expect(screen.getByText("Milk is in the fridge.")).toBeTruthy();
    });
    expect(speakText).toHaveBeenCalledWith("Milk is in the fridge.", expect.any(Function));
  });

  it("turns Send into Stop while Tori AI is speaking", async () => {
    render(
      <MemoryRouter>
        <ToriAiPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /talk to tori ai/i }));
    fakeRec?.onresult?.({
      resultIndex: 0,
      results: [{ isFinal: true, 0: { transcript: "Any milk?" } }],
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /stop speaking/i })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: /stop speaking/i }));
    expect(stopSpeaking).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /^send$/i })).toBeTruthy();
  });
});
