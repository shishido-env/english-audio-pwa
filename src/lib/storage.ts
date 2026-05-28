import { LIBRARY_STORAGE_KEY, STORAGE_KEY, ACTIVE_ID_STORAGE_KEY } from "@/config";
import type { Deck, Library } from "@/types";

const EMPTY: Library = { decks: [], activeId: null };

function isValidDeck(value: unknown): value is Deck {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.name === "string" &&
    Array.isArray(v.pairs) &&
    typeof v.importedAt === "number"
  );
}

function isValidLibrary(value: unknown): value is Library {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (!Array.isArray(v.decks)) return false;
  if (!v.decks.every(isValidDeck)) return false;
  return v.activeId === null || typeof v.activeId === "string";
}

function migrateLegacyDeck(): Library | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const legacy = JSON.parse(raw) as Partial<Deck>;
    if (
      typeof legacy.name !== "string" ||
      !Array.isArray(legacy.pairs) ||
      typeof legacy.importedAt !== "number"
    ) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    const id = createDeckId();
    const deck: Deck = {
      id,
      name: legacy.name,
      pairs: legacy.pairs,
      importedAt: legacy.importedAt,
    };
    const library: Library = { decks: [deck], activeId: id };
    saveLibrary(library);
    localStorage.removeItem(STORAGE_KEY);
    return library;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function createDeckId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `deck-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function loadLibrary(): Library {
  const raw = localStorage.getItem(LIBRARY_STORAGE_KEY);
  if (!raw) {
    const migrated = migrateLegacyDeck();
    return migrated ?? EMPTY;
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isValidLibrary(parsed)) return EMPTY;
    return parsed;
  } catch {
    return EMPTY;
  }
}

export function saveLibrary(library: Library): void {
  localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(library));
}

export function clearLibrary(): void {
  localStorage.removeItem(LIBRARY_STORAGE_KEY);
}

export function loadActiveId(): string | null {
  const v = localStorage.getItem(ACTIVE_ID_STORAGE_KEY);
  return v && v.length > 0 ? v : null;
}

export function saveActiveId(id: string | null): void {
  if (id === null) {
    localStorage.removeItem(ACTIVE_ID_STORAGE_KEY);
  } else {
    localStorage.setItem(ACTIVE_ID_STORAGE_KEY, id);
  }
}
