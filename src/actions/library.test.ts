import "@/test/action-mocks";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockAuth, mockGetDb, mockRevalidatePath, resetActionMocks } from "@/test/action-mocks";
import { getLibrary, createDeckFromCsv } from "./library";

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

describe("createDeckFromCsv", () => {
  beforeEach(() => {
    resetActionMocks();
  });

  it("未認証は unauthorized", async () => {
    mockAuth.mockResolvedValueOnce({ userId: null });
    const res = await createDeckFromCsv({
      name: "x",
      pairs: [{ ja: "あ", en: "A" }],
    });
    expect(res).toEqual({ ok: false, error: "unauthorized" });
  });

  it("空の name は invalid_input", async () => {
    const res = await createDeckFromCsv({
      name: "  ",
      pairs: [{ ja: "あ", en: "A" }],
    });
    expect(res).toEqual({ ok: false, error: "invalid_input" });
  });

  it("空の pairs は invalid_input", async () => {
    const res = await createDeckFromCsv({ name: "x", pairs: [] });
    expect(res).toEqual({ ok: false, error: "invalid_input" });
  });

  it("成功時に deck と cards を tx 内で insert し新デッキを返す", async () => {
    const insertedDeck = {
      id: "new-deck-uuid",
      userId: "user_test_123",
      name: "new_deck",
      importedAt: new Date(),
    };
    const txMock = {
      insert: vi.fn().mockImplementation(() => ({
        values: vi.fn().mockImplementation((vals: unknown) => ({
          returning: vi.fn().mockResolvedValue(
            Array.isArray(vals) ? vals : [insertedDeck],
          ),
        })),
      })),
    };
    const dbMock = {
      transaction: vi.fn().mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
        return fn(txMock);
      }),
    };
    mockGetDb.mockReturnValueOnce(dbMock);
    const res = await createDeckFromCsv({
      name: "new_deck",
      pairs: [
        { ja: "あ", en: "A" },
        { ja: "い", en: "I" },
      ],
    });
    expect(res.ok).toBe(true);
    expect(dbMock.transaction).toHaveBeenCalledTimes(1);
    expect(txMock.insert).toHaveBeenCalledTimes(2); // 1 deck + 1 cards-bulk
    expect(mockRevalidatePath).toHaveBeenCalledWith("/decks");
  });
});
