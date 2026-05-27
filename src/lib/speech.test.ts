import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSpeech } from "./speech";

class MockUtterance {
  text: string;
  lang = "";
  onend: (() => void) | null = null;
  onerror: ((e: SpeechSynthesisErrorEvent) => void) | null = null;
  constructor(text: string) {
    this.text = text;
  }
}

let queue: MockUtterance[] = [];

beforeEach(() => {
  queue = [];
  vi.stubGlobal("SpeechSynthesisUtterance", MockUtterance);
  vi.stubGlobal("speechSynthesis", {
    speak: (u: MockUtterance) => {
      queue.push(u);
      queueMicrotask(() => u.onend?.());
    },
    cancel: () => {
      queue = [];
    },
    pause: vi.fn(),
    resume: vi.fn(),
    getVoices: () => [],
  });
});

describe("createSpeech", () => {
  it("speak は完了時に resolve する", async () => {
    const speech = createSpeech();
    await expect(speech.speak("hello", "en-US")).resolves.toBeUndefined();
  });

  it("speak は lang を utterance に渡す", async () => {
    const speech = createSpeech();
    await speech.speak("こんにちは", "ja-JP");
    expect(queue[0].lang).toBe("ja-JP");
  });

  it("speak はエラー時に reject する", async () => {
    vi.stubGlobal("speechSynthesis", {
      speak: (u: MockUtterance) => {
        queueMicrotask(() =>
          u.onerror?.({ error: "synthesis-failed" } as SpeechSynthesisErrorEvent),
        );
      },
      cancel: vi.fn(),
    });
    const speech = createSpeech();
    await expect(speech.speak("x", "en-US")).rejects.toThrow();
  });

  it("cancel は speechSynthesis.cancel を呼ぶ", () => {
    const cancelSpy = vi.fn();
    vi.stubGlobal("speechSynthesis", {
      speak: vi.fn(),
      cancel: cancelSpy,
    });
    const speech = createSpeech();
    speech.cancel();
    expect(cancelSpy).toHaveBeenCalled();
  });

  it("isSupported は SpeechSynthesisUtterance が無いと false", () => {
    vi.stubGlobal("speechSynthesis", undefined);
    const speech = createSpeech();
    expect(speech.isSupported()).toBe(false);
  });
});
