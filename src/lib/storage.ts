import { STORAGE_KEY } from "@/config";
import type { Deck } from "@/types";

export function loadDeck(): Deck | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Deck;
  } catch {
    return null;
  }
}

export function saveDeck(deck: Deck): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(deck));
}

export function clearDeck(): void {
  localStorage.removeItem(STORAGE_KEY);
}
