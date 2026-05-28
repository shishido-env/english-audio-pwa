import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    await db.execute(sql`SELECT 1 as ok`);
    return NextResponse.json({ ok: true, db: "reachable" });
  } catch (err) {
    console.error("[/api/health] db unreachable", err);
    return NextResponse.json(
      { ok: false, error: "db_unreachable" },
      { status: 503 },
    );
  }
}
