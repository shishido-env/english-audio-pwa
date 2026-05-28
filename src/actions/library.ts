"use server";

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { decks } from "@/db/schema";
import type { Library, Pair } from "@/types";

export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function getLibrary(): Promise<Result<Library>> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "unauthorized" };

  const db = getDb();
  const rows = await db.query.decks.findMany({
    where: eq(decks.userId, userId),
    with: { cards: true },
    orderBy: (decks, { desc }) => [desc(decks.importedAt)],
  });

  const uiDecks = rows.map((row) => {
    const sortedCards = [...row.cards].sort(
      (a, b) => a.position - b.position,
    );
    const pairs: Pair[] = sortedCards.map((c) => ({ ja: c.ja, en: c.en }));
    return {
      id: row.id,
      name: row.name,
      pairs,
      importedAt:
        row.importedAt instanceof Date
          ? row.importedAt.getTime()
          : Number(row.importedAt),
    };
  });

  return {
    ok: true,
    data: { decks: uiDecks, activeId: null },
  };
}
