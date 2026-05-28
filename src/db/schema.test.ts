import { describe, it, expect } from "vitest";
import { getTableConfig } from "drizzle-orm/pg-core";
import { decks, cards, reviewHistory } from "./schema";

describe("db/schema", () => {
  it("decks テーブルは想定カラムを持つ", () => {
    const cfg = getTableConfig(decks);
    expect(cfg.name).toBe("decks");
    const names = cfg.columns.map((c) => c.name).sort();
    expect(names).toEqual(
      ["created_at", "id", "imported_at", "name", "updated_at", "user_id"].sort()
    );
  });

  it("cards テーブルは想定カラムを持つ", () => {
    const cfg = getTableConfig(cards);
    expect(cfg.name).toBe("cards");
    const names = cfg.columns.map((c) => c.name).sort();
    expect(names).toEqual(["deck_id", "en", "id", "ja", "position"].sort());
  });

  it("review_history テーブルは想定カラムを持つ", () => {
    const cfg = getTableConfig(reviewHistory);
    expect(cfg.name).toBe("review_history");
    const names = cfg.columns.map((c) => c.name).sort();
    expect(names).toEqual(
      ["card_id", "id", "result", "reviewed_at", "user_id"].sort()
    );
  });

  it("decks.user_id は notNull", () => {
    const cfg = getTableConfig(decks);
    const col = cfg.columns.find((c) => c.name === "user_id");
    expect(col?.notNull).toBe(true);
  });

  it("cards.deck_id は notNull かつ FK 設定あり", () => {
    const cfg = getTableConfig(cards);
    const col = cfg.columns.find((c) => c.name === "deck_id");
    expect(col?.notNull).toBe(true);
    expect(cfg.foreignKeys.length).toBeGreaterThan(0);
  });
});
