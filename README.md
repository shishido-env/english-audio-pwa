# English Audio PWA

CSVでインポートした日英例文ペアを Web Speech API で読み上げる学習用 PWA。Next.js 15 + Clerk + Neon Postgres でマルチデバイス同期に対応。

## 機能

- CSV 取り込み → デッキ単位で保存（マルチデバイス同期）
- 日→英の連続読み上げ（間隔 / 音声モード切替）
- 練習モード（英語を伏せて思い出す）
- オフライン対応（PWA: アプリシェル + 既存デッキは localStorage キャッシュ）
- ダーク / ライト / システム連動テーマ

## 初回セットアップ

開発・本番デプロイともに、以下のアカウントと環境変数が必要。**個人利用 / 無料枠** での運用を想定。

### 1. 依存インストール

```bash
pnpm install
```

### 2. Clerk プロジェクト作成

1. <https://dashboard.clerk.com> でアカウント作成（無料枠 10K MAU まで）
2. **+ Create application** → 名称任意、サインイン方法は Email/Password を推奨（Google 等も追加可）
3. **API Keys** 画面で `Publishable key` と `Secret key` をコピー

### 3. Neon プロジェクト作成

**推奨: Vercel Marketplace 経由（環境変数を Vercel 側に自動セット）**

1. Vercel ダッシュボード → Storage → **Create Database** → **Neon**
2. プロジェクトを連携。`DATABASE_URL` / `DATABASE_URL_UNPOOLED` が自動で Vercel 側にセットされる
3. ローカル用に Neon ダッシュボードから接続文字列をコピーして `.env.local` に貼る

**代替: Neon 直接サインアップ**

1. <https://console.neon.tech> でアカウント作成（無料枠 0.5 GB）
2. プロジェクト作成 → Connection details から `Pooled` と `Direct` の両 URL をコピー

### 4. `.env.local` を作成

リポジトリ直下に `.env.local` を作る（Git 管理外）:

```dotenv
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/decks
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/decks

# Neon
DATABASE_URL=postgres://...?sslmode=require
DATABASE_URL_UNPOOLED=postgres://...?sslmode=require
```

`.env.example` のテンプレートも参考にする。

### 5. DB スキーマを作成

```bash
pnpm db:migrate
```

`drizzle/` 配下のマイグレーション SQL を Neon に適用する（`decks` / `cards` / `review_history` テーブルが作成される）。

スキーマを変更したときは:

1. `pnpm db:generate` でマイグレーション SQL を生成
2. 差分を確認してコミット
3. `pnpm db:migrate` で適用

開発初期の試行錯誤段階のみ `pnpm db:push` で直接同期も可（破壊的変更は `--force` が必要）。

### 6. 開発サーバ起動

```bash
pnpm dev
```

`http://localhost:3000` を開き、サインインしてから `/decks` で CSV をインポートする。

## マルチデバイス同期の確認

1. 端末 A でサインイン → CSV をインポート
2. 端末 B（別ブラウザ / スマホ）で同じアカウントにサインイン
3. 端末 A のデッキが端末 B でも表示されることを確認

## CSV フォーマット

```
日本語,英語
おはよう,Good morning
ありがとう,Thank you
```

ヘッダ行（`日本語,英語` や `ja,en` 等）は自動でスキップ。1 行目から本文を書いても可。

## スクリプト

| コマンド | 用途 |
|---|---|
| `pnpm dev` | 開発サーバ（Next.js）|
| `pnpm build` | プロダクションビルド |
| `pnpm start` | ビルド済みサーバ起動 |
| `pnpm typecheck` | TypeScript 型チェック |
| `pnpm lint` | ESLint 実行（`next lint` は将来非推奨予定。CI で問題が出たら ESLint CLI へ移行する）|
| `pnpm test` | Vitest watch |
| `pnpm test:run` | Vitest 単発実行 |
| `pnpm db:generate` | スキーマ差分からマイグレーション SQL 生成 |
| `pnpm db:migrate` | `drizzle/` のマイグレーションを適用 |
| `pnpm db:push` | スキーマを直接同期（試行錯誤用、破壊変更は `--force` 必要）|
| `pnpm db:studio` | Drizzle Studio 起動（DB ブラウザ）|

## 技術スタック

Next.js 15 (App Router) / React 19 / TypeScript / Tailwind CSS v4 / shadcn/ui / Clerk v7 / Drizzle ORM 0.38 / Neon Postgres / Web Speech API / Serwist (PWA) / Vercel

## ディレクトリ

- `app/` Next.js App Router（ルートと layout）
- `src/actions/` Server Actions（DB I/O）
- `src/db/` Drizzle スキーマとクライアント
- `src/components/` UI コンポーネント
- `src/hooks/` React フック（`useLibrary` 等）
- `src/lib/` 純粋関数とラッパ
- `src/app-shell/` アプリシェル（`LibraryShell`）

## デプロイ

GitHub と Vercel を連携し、`master` への push で自動デプロイ。Vercel 側で `NEXT_PUBLIC_CLERK_*` / `CLERK_SECRET_KEY` を環境変数として設定する（Marketplace 経由なら Neon は自動セット）。

## ライセンス / コスト

個人利用専用。Vercel Hobby / Clerk Free / Neon Free / GitHub Public の組み合わせで継続費用ゼロを維持。
