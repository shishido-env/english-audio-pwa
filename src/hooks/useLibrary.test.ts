import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLibrary } from "./useLibrary";

describe("useLibrary", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("初期状態は空", () => {
    const { result } = renderHook(() => useLibrary());
    expect(result.current.library.decks).toEqual([]);
    expect(result.current.activeDeck).toBeNull();
  });

  it("importCsv で新デッキが追加されアクティブになる", async () => {
    const { result } = renderHook(() => useLibrary());
    await act(async () => {
      await result.current.importCsv("a.csv", "おはよう,Good morning");
    });
    expect(result.current.library.decks).toHaveLength(1);
    expect(result.current.activeDeck?.name).toBe("a");
    expect(result.current.library.activeId).toBe(result.current.activeDeck?.id);
  });

  it("importCsv を2回呼ぶと両方のデッキが残る", async () => {
    const { result } = renderHook(() => useLibrary());
    await act(async () => {
      await result.current.importCsv("a.csv", "おはよう,Good morning");
    });
    await act(async () => {
      await result.current.importCsv("b.csv", "こんにちは,Hello");
    });
    expect(result.current.library.decks).toHaveLength(2);
    expect(result.current.activeDeck?.name).toBe("b");
  });

  it("selectDeck でアクティブを切替", async () => {
    const { result } = renderHook(() => useLibrary());
    await act(async () => {
      await result.current.importCsv("a.csv", "あ,A");
      await result.current.importCsv("b.csv", "い,B");
    });
    const firstId = result.current.library.decks[0].id;
    act(() => result.current.selectDeck(firstId));
    expect(result.current.activeDeck?.id).toBe(firstId);
  });

  it("renameDeck で名前変更", async () => {
    const { result } = renderHook(() => useLibrary());
    await act(async () => {
      await result.current.importCsv("a.csv", "あ,A");
    });
    const id = result.current.library.decks[0].id;
    act(() => result.current.renameDeck(id, "  新しい名前  "));
    expect(result.current.activeDeck?.name).toBe("新しい名前");
  });

  it("renameDeck で空文字は無視される", async () => {
    const { result } = renderHook(() => useLibrary());
    await act(async () => {
      await result.current.importCsv("a.csv", "あ,A");
    });
    const id = result.current.library.decks[0].id;
    act(() => result.current.renameDeck(id, "   "));
    expect(result.current.activeDeck?.name).toBe("a");
  });

  it("removeDeck でアクティブを削除すると別デッキがアクティブになる", async () => {
    const { result } = renderHook(() => useLibrary());
    await act(async () => {
      await result.current.importCsv("a.csv", "あ,A");
      await result.current.importCsv("b.csv", "い,B");
    });
    const activeId = result.current.library.activeId!;
    act(() => result.current.removeDeck(activeId));
    expect(result.current.library.decks).toHaveLength(1);
    expect(result.current.activeDeck).not.toBeNull();
    expect(result.current.activeDeck?.id).not.toBe(activeId);
  });

  it("最後の1個を removeDeck すると activeId は null", async () => {
    const { result } = renderHook(() => useLibrary());
    await act(async () => {
      await result.current.importCsv("a.csv", "あ,A");
    });
    const id = result.current.library.activeId!;
    act(() => result.current.removeDeck(id));
    expect(result.current.activeDeck).toBeNull();
    expect(result.current.library.activeId).toBeNull();
  });

  it("空CSVは throw する", async () => {
    const { result } = renderHook(() => useLibrary());
    await expect(
      act(async () => {
        await result.current.importCsv("empty.csv", "");
      }),
    ).rejects.toThrow();
  });

  it("clearAll で全消去される", async () => {
    const { result } = renderHook(() => useLibrary());
    await act(async () => {
      await result.current.importCsv("a.csv", "あ,A");
    });
    act(() => result.current.clearAll());
    expect(result.current.library.decks).toEqual([]);
    expect(result.current.activeDeck).toBeNull();
  });
});
