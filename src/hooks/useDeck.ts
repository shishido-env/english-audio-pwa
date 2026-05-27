import { useEffect, useState, useCallback } from "react";
import type { Deck } from "@/types";
import { parseCsv } from "@/lib/csv";
import { loadDeck, saveDeck, clearDeck } from "@/lib/storage";

export function useDeck() {
  const [deck, setDeck] = useState<Deck | null>(null);

  useEffect(() => {
    setDeck(loadDeck());
  }, []);

  const importCsv = useCallback(async (filename: string, content: string) => {
    const pairs = parseCsv(content);
    if (pairs.length === 0) {
      throw new Error("有効な行がありません");
    }
    const name = filename.replace(/\.[^.]+$/, "");
    const next: Deck = { name, pairs, importedAt: Date.now() };
    saveDeck(next);
    setDeck(next);
  }, []);

  const clear = useCallback(() => {
    clearDeck();
    setDeck(null);
  }, []);

  return { deck, importCsv, clear };
}
