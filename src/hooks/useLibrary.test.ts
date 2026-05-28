import "@/test/library-action-mocks";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import {
  mockGetLibrary,
  mockCreateDeckFromCsv,
  mockRenameDeck,
  mockRemoveDeck,
  mockClearAllDecks,
  resetLibraryActionMocks,
} from "@/test/library-action-mocks";
import { useLibrary } from "./useLibrary";

const { mockToastError } = vi.hoisted(() => ({ mockToastError: vi.fn() }));
vi.mock("sonner", () => ({
  toast: { error: mockToastError, success: vi.fn() },
}));

describe("useLibrary", () => {
  beforeEach(() => {
    localStorage.clear();
    resetLibraryActionMocks();
  });

  it("初期状態は空 (キャッシュなし)", async () => {
    const { result } = renderHook(() => useLibrary());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.library.decks).toEqual([]);
    expect(result.current.activeDeck).toBeNull();
  });

  it("起動時に getLibrary が呼ばれサーバ最新で state が更新される", async () => {
    mockGetLibrary.mockResolvedValueOnce({
      ok: true,
      data: {
        decks: [
          {
            id: "d1",
            name: "from_server",
            importedAt: 100,
            pairs: [{ ja: "あ", en: "A" }],
          },
        ],
        activeId: null,
      },
    });
    const { result } = renderHook(() => useLibrary());
    await waitFor(() => expect(result.current.library.decks).toHaveLength(1));
    expect(result.current.library.decks[0].name).toBe("from_server");
    expect(mockGetLibrary).toHaveBeenCalledTimes(1);
  });

  it("importCsv で createDeckFromCsv が呼ばれ再フェッチされる", async () => {
    mockGetLibrary
      .mockResolvedValueOnce({ ok: true, data: { decks: [], activeId: null } })
      .mockResolvedValueOnce({
        ok: true,
        data: {
          decks: [
            { id: "new-id", name: "a", importedAt: 1, pairs: [{ ja: "あ", en: "A" }] },
          ],
          activeId: null,
        },
      });
    const { result } = renderHook(() => useLibrary());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => {
      await result.current.importCsv("a.csv", "あ,A");
    });
    expect(mockCreateDeckFromCsv).toHaveBeenCalledWith({
      name: "a",
      pairs: [{ ja: "あ", en: "A" }],
    });
    await waitFor(() => expect(result.current.library.decks).toHaveLength(1));
    expect(result.current.activeDeck?.name).toBe("a");
    expect(result.current.library.activeId).toBe("new-id");
  });

  it("selectDeck はクライアントのみで activeId を切替", async () => {
    mockGetLibrary.mockResolvedValueOnce({
      ok: true,
      data: {
        decks: [
          { id: "d1", name: "a", importedAt: 1, pairs: [{ ja: "あ", en: "A" }] },
          { id: "d2", name: "b", importedAt: 2, pairs: [{ ja: "い", en: "I" }] },
        ],
        activeId: null,
      },
    });
    const { result } = renderHook(() => useLibrary());
    await waitFor(() => expect(result.current.library.decks).toHaveLength(2));
    act(() => result.current.selectDeck("d1"));
    expect(result.current.activeDeck?.id).toBe("d1");
    expect(result.current.library.activeId).toBe("d1");
    expect(localStorage.getItem("english-audio-pwa:active-deck-id")).toBe("d1");
  });

  it("renameDeck で renameDeck action が呼ばれ再フェッチされる", async () => {
    mockGetLibrary
      .mockResolvedValueOnce({
        ok: true,
        data: {
          decks: [{ id: "d1", name: "old", importedAt: 1, pairs: [{ ja: "あ", en: "A" }] }],
          activeId: null,
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        data: {
          decks: [{ id: "d1", name: "new", importedAt: 1, pairs: [{ ja: "あ", en: "A" }] }],
          activeId: null,
        },
      });
    const { result } = renderHook(() => useLibrary());
    await waitFor(() => expect(result.current.library.decks).toHaveLength(1));
    await act(async () => {
      await result.current.renameDeck("d1", "  new  ");
    });
    expect(mockRenameDeck).toHaveBeenCalledWith({ id: "d1", name: "  new  " });
    await waitFor(() => expect(result.current.library.decks[0].name).toBe("new"));
  });

  it("removeDeck で removeDeck action が呼ばれ再フェッチされる", async () => {
    mockGetLibrary
      .mockResolvedValueOnce({
        ok: true,
        data: {
          decks: [
            { id: "d1", name: "a", importedAt: 1, pairs: [{ ja: "あ", en: "A" }] },
            { id: "d2", name: "b", importedAt: 2, pairs: [{ ja: "い", en: "I" }] },
          ],
          activeId: null,
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        data: {
          decks: [{ id: "d2", name: "b", importedAt: 2, pairs: [{ ja: "い", en: "I" }] }],
          activeId: null,
        },
      });
    const { result } = renderHook(() => useLibrary());
    await waitFor(() => expect(result.current.library.decks).toHaveLength(2));
    await act(async () => {
      await result.current.removeDeck("d1");
    });
    expect(mockRemoveDeck).toHaveBeenCalledWith({ id: "d1" });
    await waitFor(() => expect(result.current.library.decks).toHaveLength(1));
  });

  it("clearAll で clearAllDecks action が呼ばれ再フェッチされる", async () => {
    mockGetLibrary
      .mockResolvedValueOnce({
        ok: true,
        data: {
          decks: [{ id: "d1", name: "a", importedAt: 1, pairs: [{ ja: "あ", en: "A" }] }],
          activeId: null,
        },
      })
      .mockResolvedValueOnce({ ok: true, data: { decks: [], activeId: null } });
    const { result } = renderHook(() => useLibrary());
    await waitFor(() => expect(result.current.library.decks).toHaveLength(1));
    await act(async () => {
      await result.current.clearAll();
    });
    expect(mockClearAllDecks).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(result.current.library.decks).toEqual([]));
  });

  it("古い refetch は新しい refetch の結果を上書きしない", async () => {
    let resolveFirst!: (v: { ok: true; data: import("@/types").Library }) => void;
    const firstPromise = new Promise<{ ok: true; data: import("@/types").Library }>(
      (resolve) => {
        resolveFirst = resolve;
      },
    );
    mockGetLibrary.mockReturnValueOnce(firstPromise);
    mockGetLibrary.mockResolvedValueOnce({
      ok: true,
      data: {
        decks: [
          { id: "d2", name: "newer", importedAt: 2, pairs: [{ ja: "い", en: "I" }] },
        ],
        activeId: null,
      },
    });
    const { result } = renderHook(() => useLibrary());
    // 2 回目の refetch を rename 経由で発火（mockRenameDeck は success デフォルト）
    await act(async () => {
      await result.current.renameDeck("dummy", "x");
    });
    // 2 回目の結果が反映されている
    await waitFor(() =>
      expect(result.current.library.decks.map((d) => d.id)).toEqual(["d2"]),
    );
    // 古い refetch を後から解決させる
    await act(async () => {
      resolveFirst({
        ok: true,
        data: {
          decks: [
            { id: "d1", name: "older", importedAt: 1, pairs: [{ ja: "あ", en: "A" }] },
          ],
          activeId: null,
        },
      });
      await firstPromise;
    });
    // 上書きされていないこと
    expect(result.current.library.decks.map((d) => d.id)).toEqual(["d2"]);
  });

  it("renameDeck が失敗するとエラー toast が出る", async () => {
    mockGetLibrary.mockResolvedValueOnce({
      ok: true,
      data: {
        decks: [{ id: "d1", name: "a", importedAt: 1, pairs: [{ ja: "あ", en: "A" }] }],
        activeId: null,
      },
    });
    mockRenameDeck.mockResolvedValueOnce({ ok: false, error: "not_found" });
    mockToastError.mockClear();
    const { result } = renderHook(() => useLibrary());
    await waitFor(() => expect(result.current.library.decks).toHaveLength(1));
    await act(async () => {
      await result.current.renameDeck("d1", "new");
    });
    expect(mockToastError).toHaveBeenCalledTimes(1);
    expect(mockToastError).toHaveBeenCalledWith(
      expect.stringContaining("名称変更"),
    );
  });

  it("removeDeck が失敗するとエラー toast が出る", async () => {
    mockGetLibrary.mockResolvedValueOnce({
      ok: true,
      data: {
        decks: [{ id: "d1", name: "a", importedAt: 1, pairs: [{ ja: "あ", en: "A" }] }],
        activeId: null,
      },
    });
    mockRemoveDeck.mockResolvedValueOnce({ ok: false, error: "not_found" });
    mockToastError.mockClear();
    const { result } = renderHook(() => useLibrary());
    await waitFor(() => expect(result.current.library.decks).toHaveLength(1));
    await act(async () => {
      await result.current.removeDeck("d1");
    });
    expect(mockToastError).toHaveBeenCalledTimes(1);
    expect(mockToastError).toHaveBeenCalledWith(
      expect.stringContaining("削除"),
    );
  });

  it("clearAll が失敗するとエラー toast が出る", async () => {
    mockClearAllDecks.mockResolvedValueOnce({ ok: false, error: "unauthorized" });
    mockToastError.mockClear();
    const { result } = renderHook(() => useLibrary());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => {
      await result.current.clearAll();
    });
    expect(mockToastError).toHaveBeenCalledTimes(1);
    expect(mockToastError).toHaveBeenCalledWith(
      expect.stringContaining("全削除"),
    );
  });

  it("空CSVは throw する（サーバ呼出前にバリデーション失敗）", async () => {
    const { result } = renderHook(() => useLibrary());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await expect(
      act(async () => {
        await result.current.importCsv("empty.csv", "");
      }),
    ).rejects.toThrow();
    expect(mockCreateDeckFromCsv).not.toHaveBeenCalled();
  });
});
