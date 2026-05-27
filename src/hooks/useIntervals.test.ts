import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useIntervals } from "./useIntervals";
import {
  INTERVALS_STORAGE_KEY,
  DEFAULT_SILENCE_JA_TO_EN_MS,
  DEFAULT_SILENCE_BETWEEN_ROWS_MS,
} from "@/config";

describe("useIntervals", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("デフォルト値で初期化される", () => {
    const { result } = renderHook(() => useIntervals());
    expect(result.current.jaToEnMs).toBe(DEFAULT_SILENCE_JA_TO_EN_MS);
    expect(result.current.betweenRowsMs).toBe(DEFAULT_SILENCE_BETWEEN_ROWS_MS);
  });

  it("localStorage に保存された値を読み込む", () => {
    localStorage.setItem(
      INTERVALS_STORAGE_KEY,
      JSON.stringify({ jaToEnMs: 3000, betweenRowsMs: 1500 }),
    );
    const { result } = renderHook(() => useIntervals());
    expect(result.current.jaToEnMs).toBe(3000);
    expect(result.current.betweenRowsMs).toBe(1500);
  });

  it("壊れたJSONはデフォルトにフォールバックする", () => {
    localStorage.setItem(INTERVALS_STORAGE_KEY, "{not json");
    const { result } = renderHook(() => useIntervals());
    expect(result.current.jaToEnMs).toBe(DEFAULT_SILENCE_JA_TO_EN_MS);
    expect(result.current.betweenRowsMs).toBe(DEFAULT_SILENCE_BETWEEN_ROWS_MS);
  });

  it("setJaToEnMs で値が変わり localStorage に保存される", () => {
    const { result } = renderHook(() => useIntervals());
    act(() => result.current.setJaToEnMs(5000));
    expect(result.current.jaToEnMs).toBe(5000);
    const stored = JSON.parse(localStorage.getItem(INTERVALS_STORAGE_KEY)!);
    expect(stored.jaToEnMs).toBe(5000);
  });

  it("setBetweenRowsMs で値が変わり localStorage に保存される", () => {
    const { result } = renderHook(() => useIntervals());
    act(() => result.current.setBetweenRowsMs(3000));
    expect(result.current.betweenRowsMs).toBe(3000);
    const stored = JSON.parse(localStorage.getItem(INTERVALS_STORAGE_KEY)!);
    expect(stored.betweenRowsMs).toBe(3000);
  });
});
