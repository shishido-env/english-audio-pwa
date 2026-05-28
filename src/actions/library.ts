"use server";

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db/client";
import { decks, cards } from "@/db/schema";
import type { Library, Pair } from "@/types";
import type { Result } from "./types";

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

const createDeckSchema = z.object({
  name: z.string().trim().min(1),
  pairs: z
    .array(z.object({ ja: z.string(), en: z.string() }))
    .min(1),
});

export async function createDeckFromCsv(input: {
  name: string;
  pairs: Pair[];
}): Promise<Result<{ id: string }>> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "unauthorized" };

  const parsed = createDeckSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_input" };

  const db = getDb();
  const importedAt = new Date();

  let result: { id: string };
  try {
    result = await db.transaction(async (tx) => {
      const inserted = await tx
        .insert(decks)
        .values({
          userId,
          name: parsed.data.name,
          importedAt,
        })
        .returning();
      const deck = inserted[0];
      if (!deck) throw new Error("insert_failed");
      const cardRows = parsed.data.pairs.map((p, i) => ({
        deckId: deck.id,
        ja: p.ja,
        en: p.en,
        position: i,
      }));
      await tx.insert(cards).values(cardRows).returning();
      return { id: deck.id };
    });
  } catch {
    return { ok: false, error: "insert_failed" };
  }

  revalidatePath("/decks");
  return { ok: true, data: result };
}
