# F5: Neon Postgres + Drizzle Schema Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Drizzle ORM 経由で Neon Postgres に接続できる土台を整える（スキーマ定義・クライアント・初期マイグレーションを生成し、`/api/health` で疎通確認可能にする）。

**Architecture:** `src/db/schema.ts` に Drizzle pgTable で `decks` / `cards` / `review_history` を定義し、`src/db/client.ts` で遅延初期化シングルトンの `db` をエクスポートする。Drizzle Kit でマイグレーション SQL を `drizzle/` に生成し、`/api/health` ルートで `SELECT 1` を投げて疎通確認する。F5 ではコード側を「DB が存在すれば動く」状態まで整え、Neon プロジェクト作成と `drizzle-kit push` 実行はユーザー側の手動作業として残す。

**Tech Stack:** Drizzle ORM ^0.38, drizzle-kit ^0.30, @neondatabase/serverless ^0.10, Next.js 15 App Router (Route Handler), Vitest（既存）

**Spec参照:** `docs/superpowers/specs/2026-05-28-auth-sync-foundation-design.md` §8（データモデル）, §9（ディレクトリ）, §11（環境変数）, §10（F5 完了基準）

---

## ファイル構成（このフェーズで作る/触るもの）

**新規作成:**
- `src/db/schema.ts` — Drizzle スキーマ（decks / cards / review_history）
- `src/db/schema.test.ts` — スキーマのスモークテスト（テーブル/カラム存在検証）
- `src/db/client.ts` — Drizzle クライアント（遅延初期化シングルトン）
- `drizzle.config.ts` — Drizzle Kit 設定
- `drizzle/` — 生成されるマイグレーション SQL（コミット対象）
- `app/api/health/route.ts` — DB 疎通確認エンドポイント

**変更:**
- `package.json` — 依存追加 + Drizzle Kit スクリプト追加
- `.env.example` — DATABASE_URL / DATABASE_URL_UNPOOLED のコメントを外し本番形式に
- `middleware.ts` — `/api/health` を public route に追加

**変更しない:**
- 既存 `src/lib/storage.ts`（F6 で扱う）
- `src/types.ts`（F6 で DB 型と整合させる）
- `src/components/*`（F6 で扱う）

---

## 前提知識（実装者向け）

### Drizzle + Neon の構成

Neon 接続方法は 2 系統あります。本プロジェクトは **`drizzle-orm/neon-serverless` + Pool** を採用します（spec §9 で `Drizzle クライアント (Neon Pool)` と明記）。理由は F6 のカード一括 INSERT でトランザクションを使うため。

```ts
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
```

`@neondatabase/serverless` は WebSocket を使う Neon 専用ドライバで、Node ランタイム/Edge ランタイムどちらでも動きます。Vercel Fluid Compute（Node）で利用予定。

### Drizzle Kit コマンド

- `drizzle-kit generate` — schema.ts から SQL マイグレーションを `drizzle/` に出力（**DB接続不要、オフライン動作**）
- `drizzle-kit push` — schema.ts を DB に直接反映（**DB接続必要、本プロジェクトでは Neon 作成後にユーザーが実行**）
- `drizzle-kit migrate` — `drizzle/` の SQL を順次適用（こちらも DB 必要）

F5 では `generate` までを CI/自動化対象とし、`push` または `migrate` は Neon プロジェクト作成後の手動コマンドとして README/ハンドオフに記載します。

### 遅延初期化の理由

`new Pool({ connectionString: process.env.DATABASE_URL! })` をモジュールトップで呼ぶと、`DATABASE_URL` 未設定時に `next build` が落ちます。F5 段階では DB 未接続でビルドが通る必要があるため、**関数の中で初めて Pool を生成する遅延初期化** を採用します。

### `/api/health` のルート保護

`middleware.ts` の `isPublicRoute` に追加しないと Clerk が認証を要求してデバッグできません。F4 で `/~offline` を追加したのと同じパターンで `/api/health` を追記します。

---

## タスク一覧

### Task 1: 依存パッケージのインストール

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

- [x] **Step 1: drizzle-orm と Neon ドライバを runtime 依存に追加**

Run:
```bash
pnpm add drizzle-orm@^0.38.0 @neondatabase/serverless@^0.10.0
```

Expected: `package.json` の `dependencies` に 2 つ追加され、`pnpm-lock.yaml` 更新。

- [x] **Step 2: drizzle-kit を devDependencies に追加**

Run:
```bash
pnpm add -D drizzle-kit@^0.30.0
```

Expected: `package.json` の `devDependencies` に追加。

- [x] **Step 3: インストール後の package.json を確認**

Run:
```bash
grep -E "(drizzle|neondatabase)" package.json
```

Expected出力:
```
    "@neondatabase/serverless": "^0.10.0",
    "drizzle-orm": "^0.38.0",
    "drizzle-kit": "^0.30.0",
```
（バージョン数値は pnpm が解決した実バージョンに変わる可能性があるが ^ プレフィックス維持）

- [x] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore(f5): install drizzle-orm, drizzle-kit, neon driver"
```

---

### Task 2: package.json に Drizzle Kit スクリプトを追加

**Files:**
- Modify: `package.json` (scripts セクション)

- [x] **Step 1: スクリプトを追加**

`package.json` の `scripts` を以下のように更新します（既存スクリプトは保持）:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest",
    "test:run": "vitest run",
    "typecheck": "tsc -b --noEmit",
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio"
  }
}
```

- [x] **Step 2: スクリプト存在を確認**

Run:
```bash
pnpm run | grep -E "db:(generate|push|studio)"
```

Expected:
```
  db:generate
  db:push
  db:studio
```

- [x] **Step 3: Commit**

```bash
git add package.json
git commit -m "chore(f5): add drizzle-kit scripts"
```

---

### Task 3: Drizzle スキーマのスモークテストを書く（失敗させる）

**Files:**
- Create: `src/db/schema.test.ts`

- [x] **Step 1: テストを書く**

`src/db/schema.test.ts` を新規作成し、以下を保存します:

```ts
import { describe, it, expect } from "vitest";
import { getTableConfig } from "drizzle-orm/pg-core";
import { decks, cards, reviewHistory } from "./schema";

describe("db/schema", () => {
  it("decks テーブルは想定カラムを持つ", () => {
    const cfg = getTableConfig(decks);
    expect(cfg.name).toBe("decks");
    const names = cfg.columns.map((c) => c.name).sort();
    expect(names).toEqual(
      ["created_at", "id", "imported_at", "name", "updated_at", "user_id"].sort()
    );
  });

  it("cards テーブルは想定カラムを持つ", () => {
    const cfg = getTableConfig(cards);
    expect(cfg.name).toBe("cards");
    const names = cfg.columns.map((c) => c.name).sort();
    expect(names).toEqual(["deck_id", "en", "id", "ja", "position"].sort());
  });

  it("review_history テーブルは想定カラムを持つ", () => {
    const cfg = getTableConfig(reviewHistory);
    expect(cfg.name).toBe("review_history");
    const names = cfg.columns.map((c) => c.name).sort();
    expect(names).toEqual(
      ["card_id", "id", "result", "reviewed_at", "user_id"].sort()
    );
  });

  it("decks.user_id は notNull", () => {
    const cfg = getTableConfig(decks);
    const col = cfg.columns.find((c) => c.name === "user_id");
    expect(col?.notNull).toBe(true);
  });

  it("cards.deck_id は notNull かつ FK 設定あり", () => {
    const cfg = getTableConfig(cards);
    const col = cfg.columns.find((c) => c.name === "deck_id");
    expect(col?.notNull).toBe(true);
    expect(cfg.foreignKeys.length).toBeGreaterThan(0);
  });
});
```

- [x] **Step 2: テストを実行して失敗を確認**

Run:
```bash
pnpm vitest run src/db/schema.test.ts
```

Expected: FAIL — "Cannot find module './schema'" もしくは類似の解決失敗。

---

### Task 4: Drizzle スキーマを実装してテストをパス

**Files:**
- Create: `src/db/schema.ts`

- [x] **Step 1: schema.ts を書く**

`src/db/schema.ts` を新規作成し、以下を保存します:

```ts
import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  index,
} from "drizzle-orm/pg-core";

export const decks = pgTable(
  "decks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    importedAt: timestamp("imported_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("decks_user_id_idx").on(table.userId),
  }),
);

export const cards = pgTable(
  "cards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    deckId: uuid("deck_id")
      .notNull()
      .references(() => decks.id, { onDelete: "cascade" }),
    ja: text("ja").notNull(),
    en: text("en").notNull(),
    position: integer("position").notNull(),
  },
  (table) => ({
    deckIdIdx: index("cards_deck_id_idx").on(table.deckId),
  }),
);

export const reviewHistory = pgTable(
  "review_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    cardId: uuid("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    result: text("result", { enum: ["remembered", "forgot"] }).notNull(),
    reviewedAt: timestamp("reviewed_at").notNull().defaultNow(),
  },
  (table) => ({
    userCardIdx: index("review_history_user_card_idx").on(
      table.userId,
      table.cardId,
    ),
  }),
);

export type Deck = typeof decks.$inferSelect;
export type NewDeck = typeof decks.$inferInsert;
export type Card = typeof cards.$inferSelect;
export type NewCard = typeof cards.$inferInsert;
export type ReviewHistory = typeof reviewHistory.$inferSelect;
export type NewReviewHistory = typeof reviewHistory.$inferInsert;
```

- [x] **Step 2: テストを実行してパスを確認**

Run:
```bash
pnpm vitest run src/db/schema.test.ts
```

Expected: PASS — 5/5 tests pass.

- [x] **Step 3: 既存テスト全体に影響がないか確認**

Run:
```bash
pnpm test:run
```

Expected: 既存 52 tests + 新規 5 tests = 57 tests, all pass.

- [x] **Step 4: typecheck を実行**

Run:
```bash
pnpm typecheck
```

Expected: 0 errors.

- [x] **Step 5: Commit**

```bash
git add src/db/schema.ts src/db/schema.test.ts
git commit -m "feat(f5): add drizzle schema for decks, cards, review_history"
```

---

### Task 5: `.env.example` を更新

**Files:**
- Modify: `.env.example`

- [x] **Step 1: ファイルを編集**

`.env.example` の最後の Neon セクションを以下に置き換えます（コメントを外して必須キーに昇格）:

変更前:
```
# Neon Postgres (F5 で追加。F4 では未使用)
# DATABASE_URL=postgres://...
# DATABASE_URL_UNPOOLED=postgres://...
```

変更後:
```
# Neon Postgres (F5)
# Vercel Marketplace の Neon Integration が自動で Vercel 側にセットする値です。
# ローカル開発では Neon ダッシュボードから接続文字列をコピーして .env.local に貼ります。
DATABASE_URL=postgres://user:pass@host/db?sslmode=require
DATABASE_URL_UNPOOLED=postgres://user:pass@host-pooler.region.aws.neon.tech/db?sslmode=require
```

- [x] **Step 2: 内容を確認**

Run:
```bash
cat .env.example
```

Expected: Clerk セクションが残っており、その下に Neon 2 行が **コメントなしで** 並んでいる。

- [x] **Step 3: Commit**

```bash
git add .env.example
git commit -m "chore(f5): document DATABASE_URL env vars in .env.example"
```

---

### Task 6: `drizzle.config.ts` を作成

**Files:**
- Create: `drizzle.config.ts`

- [x] **Step 1: 設定ファイルを書く**

リポジトリルートに `drizzle.config.ts` を新規作成し、以下を保存します:

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
});
```

設計メモ:
- `out: "./drizzle"` で生成 SQL は `drizzle/` 配下に出力される
- `dbCredentials.url` は `?? ""` で fallback。`drizzle-kit push` 実行時に空文字列だとエラー出るが、`drizzle-kit generate` は dbCredentials 不要なのでオフライン生成は通る
- `strict: true` で破壊的変更時に確認プロンプトを出す
- マイグレーション実行には UNPOOLED 接続が推奨（プール経由だと長時間トランザクションが切れる）

- [x] **Step 2: typecheck を実行**

Run:
```bash
pnpm typecheck
```

Expected: 0 errors.

- [x] **Step 3: Commit**

```bash
git add drizzle.config.ts
git commit -m "chore(f5): add drizzle-kit config"
```

---

### Task 7: Drizzle クライアント（遅延初期化シングルトン）

**Files:**
- Create: `src/db/client.ts`

- [x] **Step 1: client.ts を書く**

`src/db/client.ts` を新規作成し、以下を保存します:

```ts
import "server-only";
import { Pool } from "@neondatabase/serverless";
import { drizzle, type NeonDatabase } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

type DB = NeonDatabase<typeof schema>;

let _db: DB | null = null;

export function getDb(): DB {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. F5 セットアップでは Neon プロジェクトを作成し .env.local に接続文字列を貼ってください。",
    );
  }
  const pool = new Pool({ connectionString: url });
  _db = drizzle(pool, { schema });
  return _db;
}
```

設計メモ:
- `import "server-only"` はクライアントバンドルへの混入を Next.js がビルド時に検出してエラーにする
- 遅延初期化のため、`DATABASE_URL` 未設定でもモジュール import 自体は成功する → `next build` が通る
- `_db` キャッシュで同一プロセス内の重複生成を回避
- Pool の close は Vercel Fluid Compute が graceful shutdown 時に処理する想定。明示クローズは行わない

- [x] **Step 2: typecheck を実行**

Run:
```bash
pnpm typecheck
```

Expected: 0 errors.

- [x] **Step 3: lint を実行**

Run:
```bash
pnpm lint
```

Expected: 0 warnings, 0 errors。

- [x] **Step 4: Commit**

```bash
git add src/db/client.ts
git commit -m "feat(f5): add lazy-init drizzle client with neon pool"
```

---

### Task 8: 初期マイグレーション SQL を生成

**Files:**
- Create: `drizzle/0000_<auto-generated>.sql`
- Create: `drizzle/meta/_journal.json`
- Create: `drizzle/meta/0000_snapshot.json`

- [x] **Step 1: マイグレーションを生成**

Run:
```bash
pnpm db:generate
```

Expected: `drizzle/` ディレクトリが作成され、以下のファイルが出力される:
- `drizzle/0000_<name>.sql` — `CREATE TABLE decks ...`, `CREATE TABLE cards ...`, `CREATE TABLE review_history ...`, `CREATE INDEX ...` を含む
- `drizzle/meta/_journal.json`
- `drizzle/meta/0000_snapshot.json`

ファイル名の `<name>` は Drizzle が自動生成する形容詞+名詞（例: `0000_dapper_madame_hydra.sql`）。そのまま採用。

- [x] **Step 2: 生成内容をチェック**

Run:
```bash
ls drizzle/ && echo "---" && head -20 drizzle/0000_*.sql
```

Expected:
- `drizzle/` 配下に `0000_*.sql` と `meta/` が存在
- SQL ファイル先頭に `CREATE TABLE "decks"` または `CREATE TABLE IF NOT EXISTS "decks"` が含まれる

- [x] **Step 3: `.gitignore` を確認**

Run:
```bash
grep -i drizzle .gitignore || echo "drizzle is NOT ignored"
```

Expected: "drizzle is NOT ignored"（マイグレーションファイルはコミット対象なので無視されてはいけない）。

もし `drizzle` が `.gitignore` に含まれていた場合は除外行を削除して下さい。

- [x] **Step 4: Commit**

```bash
git add drizzle/
git commit -m "feat(f5): generate initial migration for decks/cards/review_history"
```

---

### Task 9: `/api/health` ルートと middleware 公開設定

**Files:**
- Create: `app/api/health/route.ts`
- Modify: `middleware.ts:5-9`

- [ ] **Step 1: ヘルスチェックルートを作成**

`app/api/health/route.ts` を新規作成し、以下を保存します:

```ts
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    const result = await db.execute(sql`SELECT 1 as ok`);
    return NextResponse.json({
      ok: true,
      db: "reachable",
      rows: result.rows ?? result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 503 },
    );
  }
}
```

設計メモ:
- `runtime = "nodejs"` で Fluid Compute 経由の Node ランタイムを明示
- `dynamic = "force-dynamic"` で静的化されないことを保証（DB クエリは毎回走る）
- 失敗時は 503 を返す（DB 未接続は一時的にサーバ側問題として扱う）

- [ ] **Step 2: middleware を更新**

`middleware.ts` の `createRouteMatcher` 引数に `/api/health` を追加します。

変更前 (5-9行目):
```ts
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/~offline",
]);
```

変更後:
```ts
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/~offline",
  "/api/health",
]);
```

- [ ] **Step 3: typecheck を実行**

Run:
```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Step 4: lint を実行**

Run:
```bash
pnpm lint
```

Expected: 0 warnings, 0 errors.

- [ ] **Step 5: Commit**

```bash
git add app/api/health/route.ts middleware.ts
git commit -m "feat(f5): add /api/health endpoint and expose via middleware"
```

---

### Task 10: F5 自動検証（typecheck / lint / test / build）

**Files:**
- なし（実行のみ）

- [ ] **Step 1: 型チェック**

Run:
```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Step 2: lint**

Run:
```bash
pnpm lint
```

Expected: 0 warnings, 0 errors.

- [ ] **Step 3: テスト全件**

Run:
```bash
pnpm test:run
```

Expected: 既存 52 + 新規 5 = 57 件すべて pass。

- [ ] **Step 4: production ビルド**

Run:
```bash
pnpm build
```

Expected:
- `✓ Compiled successfully`
- ルート一覧に `/api/health` （ƒ = dynamic）が追加されている
- middleware サイズが微増（Clerk + matcher 1行追加分）
- DATABASE_URL 未設定でもビルド成功（遅延初期化のおかげで client.ts は import されるだけで Pool は生成されない）

注意: ビルド中に `/api/health` の静的化が試みられて落ちる場合は `dynamic = "force-dynamic"` の効果が出ていないので Task 9 Step 1 を見直して下さい。

- [ ] **Step 5: 検証結果を `.notes-f5-verification.md` に記録（任意）**

このタスクで検証成功した内容を口頭で controller に報告すれば十分。ファイルへの永続化は不要。

---

### Task 11: spec と F5 plan の状態更新 + ハンドオフ整備

**Files:**
- Modify: `docs/superpowers/specs/2026-05-28-auth-sync-foundation-design.md` (Section 1, Section 10)
- Modify: `docs/superpowers/plans/2026-05-28-sub1-f5-db-schema.md` (このファイル末尾に完了レポート追記)

- [ ] **Step 1: spec の Section 1 ステータス行を更新**

`docs/superpowers/specs/2026-05-28-auth-sync-foundation-design.md` の 4 行目を変更します。

変更前:
```
- ステータス: 実装進行中（F1〜F4 完了 / F5 次フェーズ）
```

変更後:
```
- ステータス: 実装進行中（F1〜F5 完了 / F6 次フェーズ）
```

- [ ] **Step 2: spec の Section 10 テーブルを更新**

同ファイル内の Section 10 のフェーズテーブルで以下 2 行を書き換えます。

F5 行の変更前:
```
| F5 | `feat/db-schema` | Neon プロジェクト作成（Vercel Marketplace）。Drizzle スキーマ＋マイグレーション | `drizzle-kit push` 成功、Vercel Preview で接続確認 | 🔄 次フェーズ |
```

F5 行の変更後:
```
| F5 | `feat/db-schema` | Neon プロジェクト作成（Vercel Marketplace）。Drizzle スキーマ＋マイグレーション | `drizzle-kit push` 成功、Vercel Preview で接続確認 | ✅ コード完了（2026-05-28、スキーマ/クライアント/マイグレーション生成緑、Neon プロジェクト作成と `pnpm db:push` はユーザー側） |
```

F6 行の変更前:
```
| F6 | `feat/db-sync` | `useLibrary` を Server Actions に置換。localStorage キャッシュ層実装 | 別端末からサインインして同じデッキが見える | ⏳ 未着手 |
```

F6 行の変更後:
```
| F6 | `feat/db-sync` | `useLibrary` を Server Actions に置換。localStorage キャッシュ層実装 | 別端末からサインインして同じデッキが見える | 🔄 次フェーズ |
```

- [ ] **Step 3: この F5 プランファイルにチェックボックスを反映**

Task 1〜10 のすべての `- [ ]` を `- [ ]` に変更します。

- [ ] **Step 4: この F5 プランファイル末尾に完了レポートを追記**

`docs/superpowers/plans/2026-05-28-sub1-f5-db-schema.md` の末尾に以下を追記します（`<>` の中は実行時の実際の値に置換）:

```markdown
---

## 完了レポート（2026-05-28）

### 検証結果
- typecheck: 0 errors
- lint: 0 warnings, 0 errors
- test:run: <件数> tests pass
- build: success（DATABASE_URL 未設定で実行、遅延初期化が機能）

### 生成されたマイグレーション
- `drizzle/0000_<生成された実ファイル名>.sql`
- `drizzle/meta/_journal.json`
- `drizzle/meta/0000_snapshot.json`

### ユーザーによる手動セットアップ手順（このフェーズ完了の最終ステップ）
1. Vercel ダッシュボード → Storage → Neon Integration からプロジェクト作成
2. Vercel が自動セットする `DATABASE_URL` / `DATABASE_URL_UNPOOLED` を Production / Preview / Development 全環境で確認
3. ローカル開発用に Neon ダッシュボードで接続文字列をコピー → `.env.local` に貼り付け
4. `pnpm db:push` を実行し、Neon に decks / cards / review_history テーブルが作成されることを確認
5. `pnpm dev` 起動後、ブラウザで `/api/health` にアクセスし `{ "ok": true, "db": "reachable" }` を確認

### F6 で扱うこと
- `useLibrary` を Server Actions ベースに置換
- `src/actions/library.ts` 新規作成（`createDeck` / `renameDeck` / `removeDeck` / `getLibrary` / `appendCards`）
- localStorage を読み取りキャッシュとして再定義
- 起動時の getLibrary フロー実装
```

- [ ] **Step 5: typecheck / lint で docs 編集による影響がないことを最終確認**

Run:
```bash
pnpm typecheck && pnpm lint
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add docs/superpowers/specs/2026-05-28-auth-sync-foundation-design.md docs/superpowers/plans/2026-05-28-sub1-f5-db-schema.md
git commit -m "docs(f5): mark F5 code complete and queue F6"
```

---

## ロールバック手順（万一）

F5 のどこかで詰まったら以下のコマンドで F4 完了状態に戻れます:

```bash
git reset --hard 06c21b4  # F4 完了コミット
rm -rf drizzle/
```

ただし subagent-driven-development のフローでは各 Task 完了ごとにレビューが入るため、ここまで戻ることはまずありません。Task 内で詰まった場合は controller に BLOCKED 報告すること。

---

## 完了基準（spec §10 F5 の達成判定）

F5 はコード/構成側の完成と、ユーザー側の Neon セットアップの 2 段階で完結します。

**このプラン完了時点で達成:**
- ✅ Drizzle スキーマが定義され、smoke test が緑
- ✅ Drizzle クライアントが遅延初期化で実装され、build が DB なしで通る
- ✅ `pnpm db:generate` が成功し `drizzle/` 配下にマイグレーション SQL がコミットされている
- ✅ `/api/health` ルートが追加され、middleware で公開されている
- ✅ `.env.example` に DATABASE_URL 系が記述されている

**ユーザー側で実行が必要（F5 → F6 への前提条件）:**
- ⏳ Vercel Marketplace 経由で Neon プロジェクト作成
- ⏳ ローカル `.env.local` に接続文字列を貼り付け
- ⏳ `pnpm db:push` 実行で実 DB にテーブル作成
- ⏳ `/api/health` が `{ ok: true }` を返すことをブラウザで確認

これらが揃った時点で spec §10 の F5 完了基準（`drizzle-kit push 成功、Vercel Preview で接続確認`）が満たされます。
