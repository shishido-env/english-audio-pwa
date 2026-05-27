import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDeck } from "./useDeck";

describe("useDeck", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("初期状態はnull", () => {
    const { result } = renderHook(() => useDeck());
    expect(result.current.deck).toBeNull();
  });

  it("CSV読み込みでデッキがセットされる", async () => {
    const { result } = renderHook(() => useDeck());
    await act(async () => {
      await result.current.importCsv(
        "lessons.csv",
        "おはよう,Good morning\nありがとう,Thank you",
      );
    });
    expect(result.current.deck?.pairs).toHaveLength(2);
    expect(result.current.deck?.name).toBe("lessons");
  });

  it("clearDeck でリセットされる", async () => {
    const { result } = renderHook(() => useDeck());
    await act(async () => {
      await result.current.importCsv("x.csv", "a,b");
    });
    act(() => result.current.clear());
    expect(result.current.deck).toBeNull();
  });

  it("空のCSVは throw する", async () => {
    const { result } = renderHook(() => useDeck());
    await expect(
      act(async () => {
        await result.current.importCsv("empty.csv", "");
      }),
    ).rejects.toThrow();
  });
});
