"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Deck, Library } from "@/types";
import { parseCsv } from "@/lib/csv";
import {
  loadLibrary,
  saveLibrary,
  loadActiveId,
  saveActiveId,
} from "@/lib/storage";
import {
  getLibrary,
  createDeckFromCsv,
  renameDeck as renameDeckAction,
  removeDeck as removeDeckAction,
  clearAllDecks,
} from "@/actions/library";

const EMPTY_LIBRARY: Library = { decks: [], activeId: null };

function stripExtension(filename: string): string {
  return filename.replace(/\.[^.]+$/, "");
}

function mergeActiveId(library: Library, fallback: string | null): Library {
  if (library.activeId) return library;
  if (!fallback) {
    return { ...library, activeId: library.decks[0]?.id ?? null };
  }
  const exists = library.decks.some((d) => d.id === fallback);
  return { ...library, activeId: exists ? fallback : library.decks[0]?.id ?? null };
}

export function useLibrary() {
  const [library, setLibrary] = useState<Library>(() => {
    if (typeof window === "undefined") return EMPTY_LIBRARY;
    const cached = loadLibrary();
    const activeId = loadActiveId();
    return mergeActiveId(cached, activeId);
  });
  const [isLoading, setIsLoading] = useState(true);
  const requestIdRef = useRef(0);

  const refetch = useCallback(async () => {
    const myId = ++requestIdRef.current;
    const res = await getLibrary();
    if (myId !== requestIdRef.current) return;
    if (!res.ok) {
      setIsLoading(false);
      return;
    }
    const activeId = typeof window !== "undefined" ? loadActiveId() : null;
    const merged = mergeActiveId(res.data, activeId);
    setLibrary(merged);
    if (typeof window !== "undefined") {
      saveLibrary({ ...merged, activeId: null });
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refetch();
  }, [refetch]);

  const activeDeck: Deck | null =
    library.decks.find((d) => d.id === library.activeId) ?? null;

  const importCsv = useCallback(
    async (filename: string, content: string) => {
      const pairs = parseCsv(content);
      if (pairs.length === 0) throw new Error("有効な行がありません");
      const name = stripExtension(filename);
      const res = await createDeckFromCsv({ name, pairs });
      if (!res.ok) throw new Error(res.error);
      await refetch();
      setLibrary((lib) => {
        const exists = lib.decks.some((d) => d.id === res.data.id);
        if (!exists) return lib;
        if (typeof window !== "undefined") saveActiveId(res.data.id);
        return { ...lib, activeId: res.data.id };
      });
    },
    [refetch],
  );

  const selectDeck = useCallback((id: string) => {
    setLibrary((lib) => {
      if (!lib.decks.some((d) => d.id === id)) return lib;
      if (typeof window !== "undefined") saveActiveId(id);
      return { ...lib, activeId: id };
    });
  }, []);

  const renameDeck = useCallback(
    async (id: string, name: string) => {
      const trimmed = name.trim();
      if (trimmed === "") return;
      const res = await renameDeckAction({ id, name });
      if (!res.ok) {
        toast.error("デッキの名称変更に失敗しました");
        return;
      }
      await refetch();
    },
    [refetch],
  );

  const removeDeck = useCallback(
    async (id: string) => {
      const res = await removeDeckAction({ id });
      if (!res.ok) {
        toast.error("デッキの削除に失敗しました");
        return;
      }
      const wasActive = library.activeId === id;
      await refetch();
      if (wasActive) {
        setLibrary((lib) => {
          const next = lib.decks[0]?.id ?? null;
          if (typeof window !== "undefined") saveActiveId(next);
          return { ...lib, activeId: next };
        });
      }
    },
    [library.activeId, refetch],
  );

  const clearAll = useCallback(async () => {
    const res = await clearAllDecks();
    if (!res.ok) {
      toast.error("デッキの全削除に失敗しました");
      return;
    }
    if (typeof window !== "undefined") saveActiveId(null);
    await refetch();
  }, [refetch]);

  return {
    library,
    activeDeck,
    isLoading,
    importCsv,
    selectDeck,
    renameDeck,
    removeDeck,
    clearAll,
  };
}
