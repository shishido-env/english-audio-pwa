import "@/test/action-mocks";
import { describe, it, expect, beforeEach } from "vitest";
import { mockAuth, mockGetDb, resetActionMocks } from "@/test/action-mocks";
import { getLibrary } from "./library";

describe("getLibrary", () => {
  beforeEach(() => {
    resetActionMocks();
  });

  it("未認証なら ok:false / unauthorized を返す", async () => {
    mockAuth.mockResolvedValueOnce({ userId: null });
    const res = await getLibrary();
    expect(res).toEqual({ ok: false, error: "unauthorized" });
  });

  it("デッキが 0 件なら空の Library を返す", async () => {
    mockGetDb.mockReturnValueOnce({
      query: {
        decks: {
          findMany: async () => [],
        },
      },
    });
    const res = await getLibrary();
    expect(res).toEqual({
      ok: true,
      data: { decks: [], activeId: null },
    });
  });

  it("デッキとカードを UI 形に整形して返す", async () => {
    mockGetDb.mockReturnValueOnce({
      query: {
        decks: {
          findMany: async () => [
            {
              id: "deck-uuid-1",
              userId: "user_test_123",
              name: "lessons_01",
              importedAt: new Date("2026-05-01T00:00:00Z"),
              cards: [
                { id: "c1", deckId: "deck-uuid-1", ja: "おはよう", en: "Good morning", position: 0 },
                { id: "c2", deckId: "deck-uuid-1", ja: "こんにちは", en: "Hello", position: 1 },
              ],
            },
          ],
        },
      },
    });
    const res = await getLibrary();
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.decks).toHaveLength(1);
    expect(res.data.decks[0]).toEqual({
      id: "deck-uuid-1",
      name: "lessons_01",
      importedAt: new Date("2026-05-01T00:00:00Z").getTime(),
      pairs: [
        { ja: "おはよう", en: "Good morning" },
        { ja: "こんにちは", en: "Hello" },
      ],
    });
    expect(res.data.activeId).toBeNull();
  });

  it("カードは position 順にソートされる", async () => {
    mockGetDb.mockReturnValueOnce({
      query: {
        decks: {
          findMany: async () => [
            {
              id: "d1",
              userId: "user_test_123",
              name: "x",
              importedAt: new Date(0),
              cards: [
                { id: "c2", deckId: "d1", ja: "二", en: "Two", position: 1 },
                { id: "c1", deckId: "d1", ja: "一", en: "One", position: 0 },
              ],
            },
          ],
        },
      },
    });
    const res = await getLibrary();
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.decks[0].pairs.map((p) => p.en)).toEqual(["One", "Two"]);
  });
});
