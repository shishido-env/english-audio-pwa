import { vi } from "vitest";
import type { Library } from "@/types";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export const mockGetLibrary = vi.fn<() => Promise<Result<Library>>>();
export const mockCreateDeckFromCsv = vi.fn();
export const mockRenameDeck = vi.fn();
export const mockRemoveDeck = vi.fn();
export const mockClearAllDecks = vi.fn();

export function resetLibraryActionMocks(): void {
  mockGetLibrary.mockReset();
  mockGetLibrary.mockResolvedValue({
    ok: true,
    data: { decks: [], activeId: null },
  });
  mockCreateDeckFromCsv.mockReset();
  mockCreateDeckFromCsv.mockResolvedValue({ ok: true, data: { id: "new-id" } });
  mockRenameDeck.mockReset();
  mockRenameDeck.mockResolvedValue({ ok: true, data: null });
  mockRemoveDeck.mockReset();
  mockRemoveDeck.mockResolvedValue({ ok: true, data: null });
  mockClearAllDecks.mockReset();
  mockClearAllDecks.mockResolvedValue({ ok: true, data: null });
}

vi.mock("@/actions/library", () => ({
  getLibrary: mockGetLibrary,
  createDeckFromCsv: mockCreateDeckFromCsv,
  renameDeck: mockRenameDeck,
  removeDeck: mockRemoveDeck,
  clearAllDecks: mockClearAllDecks,
}));
