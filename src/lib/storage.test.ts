import { describe, it, expect, beforeEach } from "vitest";
import {
  loadLibrary,
  saveLibrary,
  clearLibrary,
  createDeckId,
} from "./storage";
import { LIBRARY_STORAGE_KEY, STORAGE_KEY } from "@/config";
import type { Deck, Library } from "@/types";

describe("storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("空のとき loadLibrary は空の Library を返す", () => {
    expect(loadLibrary()).toEqual({ decks: [], activeId: null });
  });

  it("save → load で同じ Library が取れる", () => {
    const deck: Deck = {
      id: "abc",
      name: "lessons_28",
      pairs: [{ ja: "おはよう", en: "Good morning" }],
      importedAt: 1700000000000,
    };
    const library: Library = { decks: [deck], activeId: "abc" };
    saveLibrary(library);
    expect(loadLibrary()).toEqual(library);
  });

  it("clearLibrary で全消去できる", () => {
    saveLibrary({
      decks: [
        { id: "x", name: "x", pairs: [{ ja: "a", en: "b" }], importedAt: 0 },
      ],
      activeId: "x",
    });
    clearLibrary();
    expect(loadLibrary()).toEqual({ decks: [], activeId: null });
  });

  it("壊れた JSON は空の Library として扱う", () => {
    localStorage.setItem(LIBRARY_STORAGE_KEY, "{broken json");
    expect(loadLibrary()).toEqual({ decks: [], activeId: null });
  });

  it("旧形式の単一デッキを Library に移行する", () => {
    const legacy = {
      name: "old",
      pairs: [{ ja: "x", en: "y" }],
      importedAt: 1000,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(legacy));
    const library = loadLibrary();
    expect(library.decks).toHaveLength(1);
    expect(library.decks[0].name).toBe("old");
    expect(library.decks[0].pairs).toEqual(legacy.pairs);
    expect(library.activeId).toBe(library.decks[0].id);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("createDeckId は重複しない", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) ids.add(createDeckId());
    expect(ids.size).toBe(100);
  });
});
