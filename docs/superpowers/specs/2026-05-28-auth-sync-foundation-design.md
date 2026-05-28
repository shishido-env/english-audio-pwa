# サブプロジェクト1: 認証 + クラウド同期基盤 設計

- 作成日: 2026-05-28
- ステータス: 実装進行中（F1・F2・F3 完了 / F4 次フェーズ）
- 最終更新: 2026-05-28
- 親ロードマップ: `docs/superpowers/specs/2026-05-28-roadmap.md`
- 前提: 完全無料、AIのみで開発、個人利用専用、Vercel エコシステム最大活用

## 1. 目的

既存の Vite + React + localStorage 構成を、**マルチデバイス同期に対応した Next.js + クラウドDB 構成** に移行する。読み上げモードの既存機能を一切壊さず、ログインしたユーザーが任意の端末から同じデッキを参照できる状態を作る。

## 2. スコープ

### やる
- Next.js App Router への移行（Vite 廃止）
- Clerk 認証導入（サインイン/サインアウト/ミドルウェアによるルート保護）
- Neon Postgres + Drizzle ORM の導入
- デッキ・カード・正誤履歴のスキーマ確立
- 既存 `useLibrary` を Server Actions ベースの DB 同期に置換
- localStorage を読み取りキャッシュ層として再定義
- Serwist による PWA 再構築

### やらない（このサブプロジェクトの範囲外）
- 暗記モード本体の実装（サブプロジェクト3で実装）
- SRS / 学習統計 / AI生成
- 双方向同期や競合解決の高度化（last-write-wins で十分）
- オフライン書き込みキュー
- CSV エクスポート機能
- 元 CSV ファイル本体の保存

## 3. 技術スタック（確定）

| レイヤ | 採用 |
|---|---|
| ホスティング | Vercel Hobby |
| フレームワーク | Next.js 15 App Router |
| 言語 | TypeScript (strict) |
| UI | Tailwind CSS v4 + shadcn/ui（new-york, Zinc + Violet） |
| 認証 | Clerk |
| DB | Neon Postgres (Vercel Marketplace) |
| ORM | Drizzle ORM + Drizzle Kit |
| バリデーション | Zod |
| API | Server Actions + Route Handlers |
| PWA | Serwist |
| TTS | Web Speech API（既存維持） |
| テスト | Vitest（既存維持） |
| Lint/Format | ESLint + Prettier（既存維持） |
| CI/CD | GitHub + Vercel 自動連携 |

## 4. アーキテクチャ全体像

```
Browser (PWA)
  ├─ UI (shadcn/ui + Tailwind)
  ├─ TTS (Web Speech API)
  ├─ Service Worker (Serwist)  ← App Shell + API レスポンスキャッシュ
  └─ localStorage              ← 同期前のフォールバック/読み取りキャッシュ
        │
        │ Server Actions (型安全な RPC)
        ▼
Next.js App Router on Vercel
  ├─ Clerk Middleware (ルート保護)
  ├─ Server Actions          ← mutation
  ├─ Route Handlers          ← Clerk webhook, ヘルスチェック
  └─ Drizzle ORM
        │
        ▼
Neon Postgres
  ├─ decks
  ├─ cards
  └─ review_history
```

## 5. APIスタイル

### Server Actions（主流路）
- mutation 全般を Server Actions で実装
- ファイル: `src/actions/<feature>.ts`
- 例: `createDeck`, `renameDeck`, `removeDeck`, `recordReview`
- Zod スキーマで入力検証
- 戻り値は `{ ok: true, data }` または `{ ok: false, error }` 形式に統一

### Route Handlers
- 外部システム連携用に限定使用
- 主用途:
  - `POST /api/webhooks/clerk` — Clerk ユーザー作成/削除イベントの受信（必要なら user_profiles 拡張テーブルに反映）
  - `GET /api/health` — デプロイ後の疎通確認（任意）

### 採用しない
- tRPC / GraphQL（Server Actions で十分。AIが書きやすい標準パターンを優先）

## 6. 同期戦略

### 原則: server-first + last-write-wins
- **サーバ（Neon Postgres）が常に正データ**
- localStorage は読み取り高速化・オフライン耐性のためのキャッシュ層
- 起動時フロー:
  1. Clerk セッション確認
  2. サインイン済みなら `getLibrary()` Server Action を呼び出し
  3. レスポンスを localStorage に保存（キャッシュ更新）
  4. UI 描画
- mutation フロー:
  1. Server Action 呼び出し → DB 更新
  2. `revalidatePath` でサーバキャッシュ無効化
  3. クライアントは新しいデータを再取得し localStorage を更新

### 競合解決
- 個人利用かつ 1〜2 端末想定のため **last-write-wins** で十分
- `updated_at` を比較する高度な競合解決は導入しない

### オフライン挙動
- **サインイン状態でオフライン**: localStorage キャッシュから読み取り、再生機能は動作。書き込み（デッキ追加・正誤記録）はブロック表示
- **未サインインでオフライン**: サインイン画面で「オンラインで再試行してください」表示
- オフライン書き込みキューは実装しない（範囲外）

## 7. PWAキャッシュ戦略（Serwist）

| 種別 | 戦略 | 備考 |
|---|---|---|
| App Shell（HTML） | NetworkFirst | 認証チェック必須のため Network 優先 |
| 静的アセット（JS/CSS） | CacheFirst (immutable) | ハッシュ付きファイル |
| Fonts / アイコン | CacheFirst | 長期キャッシュ |
| API レスポンス (`/_next/data`, Server Actions) | NetworkFirst | オフライン時のみキャッシュへフォールバック |
| TTS 音声 | キャッシュ対象外 | Web Speech API はサーバ通信ゼロ |

manifest.json と PWA アイコンは既存資産をそのまま流用する。

## 8. データモデル（Drizzle スキーマ）

```ts
// src/db/schema.ts
import { pgTable, uuid, text, timestamp, integer, index } from "drizzle-orm/pg-core";

export const decks = pgTable("decks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),            // Clerk user.id
  name: text("name").notNull(),
  importedAt: timestamp("imported_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("decks_user_id_idx").on(table.userId),
}));

export const cards = pgTable("cards", {
  id: uuid("id").primaryKey().defaultRandom(),
  deckId: uuid("deck_id").notNull().references(() => decks.id, { onDelete: "cascade" }),
  ja: text("ja").notNull(),
  en: text("en").notNull(),
  position: integer("position").notNull(),
}, (table) => ({
  deckIdIdx: index("cards_deck_id_idx").on(table.deckId),
}));

export const reviewHistory = pgTable("review_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  cardId: uuid("card_id").notNull().references(() => cards.id, { onDelete: "cascade" }),
  result: text("result", { enum: ["remembered", "forgot"] }).notNull(),
  reviewedAt: timestamp("reviewed_at").notNull().defaultNow(),
}, (table) => ({
  userCardIdx: index("review_history_user_card_idx").on(table.userId, table.cardId),
}));
```

### 設計上の注意点
- `userId` は Clerk が発行する文字列ID（例: `user_xxx`）。Clerk側にユーザーが存在する前提で運用し、Webhookで作成同期は当面不要（必要になれば user_profiles を追加）
- `cards` は CSV の行順を `position` で保持
- `review_history` は同一カードに対して複数行を持つ（履歴方式）。暗記モードでは `userId + cardId` で最新行を取り出す。「未習」はその組合せの行が存在しないこと
- 将来の SRS 拡張は `cards` への列追加、または `card_states` 別テーブル新設で対応可能（このスキーマでブロックしない）

## 9. ディレクトリ規約（移行後）

```
app/
  layout.tsx                ルートレイアウト + ClerkProvider
  page.tsx                  サインイン状態でデッキ一覧へリダイレクト
  (auth)/
    sign-in/[[...sign-in]]/page.tsx
    sign-up/[[...sign-up]]/page.tsx
  (app)/
    decks/page.tsx          ライブラリ + 読み上げプレイヤー
  api/
    webhooks/clerk/route.ts
    health/route.ts
src/
  components/               既存UI（流用、必要に応じ Client/Server 分離）
    ui/                     shadcn/ui（既存維持）
  hooks/                    React フック（既存流用 + DB対応に拡張）
  lib/                      純粋関数（既存流用）
  db/
    schema.ts               Drizzle スキーマ
    client.ts               Drizzle クライアント (Neon Pool)
  actions/                  Server Actions
    library.ts              createDeck / renameDeck / removeDeck / getLibrary
  config.ts                 既存維持
  types.ts                  既存維持（DB型と整合する形に調整）
middleware.ts               Clerk ミドルウェア
drizzle.config.ts           Drizzle Kit 設定
```

## 10. 移行手順（フェーズ分け）

各フェーズは独立した PR。F2 までで「Next.js 版で既存機能が動く」、F4 までで「ログインできる」、F6 までで「マルチデバイス同期が動く」状態を達成。

| フェーズ | ブランチ案 | 内容 | 完了基準 | 状態 |
|---|---|---|---|---|
| F1 | `feat/migrate-next` | Next.js 15 App Router 初期化。`vite.config.ts`, `index.html` 削除。`tsconfig.json` 更新 | `pnpm next build` 成功 | ✅ 完了（2026-05-28、ローカル検証緑、未 push） |
| F2 | `feat/migrate-next`（継続） | components / hooks / lib を新ディレクトリへ移植。Tailwind v4 / shadcn/ui を Next.js 上で再構成 | 読み上げモードがデモCSVで動作。既存テスト緑 | ✅ 完了（2026-05-28、ローカル検証緑） |
| F3 | `feat/migrate-next`（継続） | Serwist 導入。manifest.json / アイコン移植 | Lighthouse PWA 監査合格、オフラインでアプリシェル起動 | ✅ 完了（2026-05-28、自動検証緑、実機 PWA 確認はユーザー側） |
| F4 | `feat/clerk-auth` | Clerk セットアップ。サインイン/サインアップページ。`middleware.ts` でルート保護 | サインインして `/decks` にアクセス可能 | 🔄 次フェーズ |
| F5 | `feat/db-schema` | Neon プロジェクト作成（Vercel Marketplace）。Drizzle スキーマ＋マイグレーション | `drizzle-kit push` 成功、Vercel Preview で接続確認 | ⏳ 未着手 |
| F6 | `feat/db-sync` | `useLibrary` を Server Actions に置換。localStorage キャッシュ層実装 | 別端末からサインインして同じデッキが見える | ⏳ 未着手 |
| F7 | `chore/test-update` | 既存テストを DB / Server Actions 対応に更新。新規 actions のテスト追加。README に初回セットアップ手順追記 | 全テスト緑、README 更新済み | ⏳ 未着手 |

各フェーズ完了時に master へマージし、Vercel Preview / Production で動作確認する。

## 11. 環境変数

| キー | 用途 | 取得元 | 配置 |
|---|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk クライアント識別 | Clerk dashboard | Vercel + `.env.local` |
| `CLERK_SECRET_KEY` | Clerk サーバAPI | Clerk dashboard | Vercel のみ（Sensitive） |
| `CLERK_WEBHOOK_SECRET` | Webhook 検証用 | Clerk dashboard | Vercel のみ |
| `DATABASE_URL` | Neon Postgres 接続文字列（pooled） | Vercel Marketplace | Vercel が自動セット |
| `DATABASE_URL_UNPOOLED` | マイグレーション用（直接接続） | Vercel Marketplace | Vercel が自動セット |

`.env.local` はリポジトリ管理外。`.env.example` を用意して必要キーを列挙する。

## 12. ライセンス / コスト確認

| 項目 | 利用枠 | 個人利用適合 |
|---|---|---|
| Vercel Hobby | 個人利用専用ライセンス、商用NG | 本プロジェクトは個人利用のため適合 |
| Clerk Free | 10K MAU まで無料 | 個人利用なら永久無料圏内 |
| Neon Free | 0.5GB ストレージ / 1 プロジェクト | 個人学習データなら数百MBで収まる |
| GitHub Public | 個人利用無料 | 適合 |

**継続費用: ゼロ** を維持する。将来クライアントワーク化したくなった時点で Vercel Pro / Clerk Pro に切替。

## 13. 受け入れ条件（このサブプロジェクト完了の判定）

1. Vercel Production にデプロイされ、独自URLでサインインできる
2. デバイスA でデッキを追加 → デバイスB で同じデッキが見える
3. オフライン状態でも localStorage キャッシュから既存デッキを再生できる
4. 既存テスト + 新規テストがすべて緑
5. README に「初回セットアップ手順（Clerk作成、Neon作成、env設定）」が追記されている
6. このスペックの「やらない」項目が依然として未実装である（スコープ膨張していない）

## 14. リスクと対応

| リスク | 対応 |
|---|---|
| Next.js移行で既存PWA機能の劣化 | F3 完了時に Lighthouse + 手動オフラインテストを必須化 |
| Tailwind v4 と Next.js の組み合わせの未成熟 | 公式ドキュメント準拠で構成。問題発生時は v3 暫定降格を検討 |
| Neon Free 枠の制限到達 | 利用量を定期的にダッシュボードで確認。データ蓄積ペース次第で `review_history` の自動間引きを検討 |
| Clerk セッションと PWA キャッシュの干渉 | App Shell を NetworkFirst にして認証チェックを必ず通す |
| マイグレーション中の既存ユーザーデータ消失 | 移行は破壊的変更なし。localStorage は維持し、F6 で 一方向（local→DB）の取り込みヘルパーを提供 |

## 15. 未解決事項（次のフェーズで詰める）

このサブプロジェクト1の **実装計画フェーズ**（writing-plans）で確定する事項:

- Next.js 15 / React 19 / Tailwind v4 の組み合わせで使う公式テンプレート選定（`create-next-app` のオプション）
- shadcn/ui の Next.js 上での再導入方法（`components.json` の更新範囲）
- Serwist の具体的な `runtimeCaching` 設定
- Drizzle Kit のマイグレーションファイル運用（`drizzle/` ディレクトリのコミット方針）
- Vercel Preview Deployment で Clerk Development キーをどう切り替えるか
- localStorage → DB の初回データ取り込みUX（自動 or 明示的ボタン）

---

レビュー後、master へマージしてから **writing-plans スキルで実装計画ドキュメントを作成** する。
