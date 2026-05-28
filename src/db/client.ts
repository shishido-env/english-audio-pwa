import "server-only";
import { Pool } from "@neondatabase/serverless";
import { drizzle, type NeonDatabase } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

export type DB = NeonDatabase<typeof schema>;

// Use globalThis to survive Next.js dev HMR module re-evaluation.
// In production each isolate gets a fresh globalThis; this only affects dev.
const globalForDb = globalThis as unknown as { _db?: DB };

export function getDb(): DB {
  if (globalForDb._db) return globalForDb._db;
  // Only the pooled URL is consumed at runtime; drizzle-kit uses UNPOOLED.
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. F5 セットアップでは Neon プロジェクトを作成し .env.local に接続文字列を貼ってください。",
    );
  }
  const pool = new Pool({ connectionString: url });
  globalForDb._db = drizzle(pool, { schema });
  return globalForDb._db;
}
