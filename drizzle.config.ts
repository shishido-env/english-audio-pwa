import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) {
  throw new Error(
    "drizzle-kit requires DATABASE_URL_UNPOOLED or DATABASE_URL. Set it in .env.local (Neon ダッシュボードの接続文字列).",
  );
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  // Prefer the direct (unpooled) connection for migrations; falls back to pooled.
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
