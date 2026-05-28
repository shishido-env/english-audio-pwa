"use client";

import { useCallback, useEffect, useState } from "react";
import type { Deck, Library } from "@/types";
import { parseCsv } from "@/lib/csv";
import { createDeckId, loadLibrary, saveLibrary } from "@/lib/storage";

const EMPTY_LIBRARY: Library = { decks: [], activeId: null };

function stripExtension(filename: string): string {
  return filename.replace(/\.[^.]+$/, "");
}

export function useLibrary() {
  const [library, setLibrary] = useState<Library>(() =>
    typeof window === "undefined" ? EMPTY_LIBRARY : loadLibrary(),
  );

  useEffect(() => {
    saveLibrary(library);
  }, [library]);

  const activeDeck =
    library.decks.find((d) => d.id === library.activeId) ?? null;

  const importCsv = useCallback(
    async (filename: string, content: string) => {
      const pairs = parseCsv(content);
      if (pairs.length === 0) throw new Error("有効な行がありません");
      const deck: Deck = {
        id: createDeckId(),
        name: stripExtension(filename),
        pairs,
        importedAt: Date.now(),
      };
      setLibrary((lib) => ({
        decks: [...lib.decks, deck],
        activeId: deck.id,
      }));
    },
    [],
  );

  const selectDeck = useCallback((id: string) => {
    setLibrary((lib) =>
      lib.decks.some((d) => d.id === id) ? { ...lib, activeId: id } : lib,
    );
  }, []);

  const renameDeck = useCallback((id: string, name: string) => {
    const trimmed = name.trim();
    if (trimmed === "") return;
    setLibrary((lib) => ({
      ...lib,
      decks: lib.decks.map((d) => (d.id === id ? { ...d, name: trimmed } : d)),
    }));
  }, []);

  const removeDeck = useCallback((id: string) => {
    setLibrary((lib) => {
      const decks = lib.decks.filter((d) => d.id !== id);
      const activeId =
        lib.activeId === id ? (decks[0]?.id ?? null) : lib.activeId;
      return { decks, activeId };
    });
  }, []);

  const clearAll = useCallback(() => {
    setLibrary({ decks: [], activeId: null });
  }, []);

  return {
    library,
    activeDeck,
    importCsv,
    selectDeck,
    renameDeck,
    removeDeck,
    clearAll,
  };
}
