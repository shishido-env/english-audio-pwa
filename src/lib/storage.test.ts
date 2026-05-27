import { describe, it, expect, beforeEach } from "vitest";
import { loadDeck, saveDeck, clearDeck } from "./storage";
import { STORAGE_KEY } from "@/config";
import type { Deck } from "@/types";

describe("storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("デッキが無いとき loadDeck は null を返す", () => {
    expect(loadDeck()).toBeNull();
  });

  it("save → load で同じデッキが取れる", () => {
    const deck: Deck = {
      name: "lessons_28",
      pairs: [{ ja: "おはよう", en: "Good morning" }],
      importedAt: 1700000000000,
    };
    saveDeck(deck);
    expect(loadDeck()).toEqual(deck);
  });

  it("clearDeck でデッキを消せる", () => {
    saveDeck({ name: "x", pairs: [], importedAt: 0 });
    clearDeck();
    expect(loadDeck()).toBeNull();
  });

  it("壊れたJSONの場合 null を返す（既存データは破棄）", () => {
    localStorage.setItem(STORAGE_KEY, "{broken json");
    expect(loadDeck()).toBeNull();
  });
});
