import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePracticeMode } from "./usePracticeMode";
import { PRACTICE_STORAGE_KEY } from "@/config";

describe("usePracticeMode", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("デフォルトは hideEnglish=false, voiceMode=both", () => {
    const { result } = renderHook(() => usePracticeMode());
    expect(result.current.hideEnglish).toBe(false);
    expect(result.current.voiceMode).toBe("both");
  });

  it("setHideEnglish で値が変わり localStorage に保存される", () => {
    const { result } = renderHook(() => usePracticeMode());
    act(() => result.current.setHideEnglish(true));
    expect(result.current.hideEnglish).toBe(true);
    const stored = JSON.parse(localStorage.getItem(PRACTICE_STORAGE_KEY)!);
    expect(stored.hideEnglish).toBe(true);
  });

  it("setVoiceMode で値が変わり localStorage に保存される", () => {
    const { result } = renderHook(() => usePracticeMode());
    act(() => result.current.setVoiceMode("ja"));
    expect(result.current.voiceMode).toBe("ja");
    const stored = JSON.parse(localStorage.getItem(PRACTICE_STORAGE_KEY)!);
    expect(stored.voiceMode).toBe("ja");
  });

  it("cycleVoiceMode は both→ja→en→both", () => {
    const { result } = renderHook(() => usePracticeMode());
    expect(result.current.voiceMode).toBe("both");
    act(() => result.current.cycleVoiceMode());
    expect(result.current.voiceMode).toBe("ja");
    act(() => result.current.cycleVoiceMode());
    expect(result.current.voiceMode).toBe("en");
    act(() => result.current.cycleVoiceMode());
    expect(result.current.voiceMode).toBe("both");
  });

  it("localStorage に保存された値を読み込む", () => {
    localStorage.setItem(
      PRACTICE_STORAGE_KEY,
      JSON.stringify({ hideEnglish: true, voiceMode: "en" }),
    );
    const { result } = renderHook(() => usePracticeMode());
    expect(result.current.hideEnglish).toBe(true);
    expect(result.current.voiceMode).toBe("en");
  });

  it("壊れた JSON はデフォルトにフォールバック", () => {
    localStorage.setItem(PRACTICE_STORAGE_KEY, "{not json");
    const { result } = renderHook(() => usePracticeMode());
    expect(result.current.hideEnglish).toBe(false);
    expect(result.current.voiceMode).toBe("both");
  });

  it("不正な voiceMode 値はデフォルトに戻す", () => {
    localStorage.setItem(
      PRACTICE_STORAGE_KEY,
      JSON.stringify({ hideEnglish: false, voiceMode: "garbage" }),
    );
    const { result } = renderHook(() => usePracticeMode());
    expect(result.current.voiceMode).toBe("both");
  });
});
