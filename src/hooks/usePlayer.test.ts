import { describe, it, expect, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { usePlayer } from "./usePlayer";
import type { Pair } from "@/types";
import type { Speech } from "@/lib/speech";

function makeSpeech(): Speech & { calls: { text: string; lang: string }[] } {
  const calls: { text: string; lang: string }[] = [];
  return {
    calls,
    speak: vi.fn(async (text, lang) => {
      calls.push({ text, lang });
    }),
    cancel: vi.fn(),
    isSupported: () => true,
  };
}

const pairs: Pair[] = [
  { ja: "おはよう", en: "Good morning" },
  { ja: "ありがとう", en: "Thank you" },
];

describe("usePlayer", () => {
  it("初期状態は idle", () => {
    const speech = makeSpeech();
    const { result } = renderHook(() => usePlayer(pairs, speech));
    expect(result.current.state.kind).toBe("idle");
  });

  it("play で playing に遷移し、ja → en の順で speak される", async () => {
    const speech = makeSpeech();
    const { result } = renderHook(() => usePlayer(pairs, speech));
    act(() => result.current.play());
    await waitFor(() => {
      expect(speech.calls.length).toBeGreaterThanOrEqual(2);
    });
    expect(speech.calls[0]).toEqual({ text: "おはよう", lang: "ja-JP" });
    expect(speech.calls[1]).toEqual({ text: "Good morning", lang: "en-US" });
  });

  it("最終行のen完了後 idle に戻る", async () => {
    const speech = makeSpeech();
    const { result } = renderHook(() => usePlayer(pairs, speech));
    act(() => result.current.play());
    await waitFor(() => {
      expect(result.current.state.kind).toBe("idle");
    }, { timeout: 3000 });
  });

  it("next/prev で index が変わる", () => {
    const speech = makeSpeech();
    const { result } = renderHook(() => usePlayer(pairs, speech));
    act(() => result.current.next());
    expect(result.current.index).toBe(1);
    act(() => result.current.prev());
    expect(result.current.index).toBe(0);
  });

  it("next は範囲外に出ない", () => {
    const speech = makeSpeech();
    const { result } = renderHook(() => usePlayer(pairs, speech));
    act(() => result.current.next());
    act(() => result.current.next());
    expect(result.current.index).toBe(1);
  });

  it("stop で idle に戻り cancel される", () => {
    const speech = makeSpeech();
    const { result } = renderHook(() => usePlayer(pairs, speech));
    act(() => result.current.play());
    act(() => result.current.stop());
    expect(result.current.state.kind).toBe("idle");
    expect(speech.cancel).toHaveBeenCalled();
  });
});
