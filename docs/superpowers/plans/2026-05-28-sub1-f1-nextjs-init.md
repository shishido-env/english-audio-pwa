# F1: Vite → Next.js 15 App Router Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 既存の Vite 構成を破壊し、Next.js 15 App Router の最小プロジェクトで置き換える。読み上げモードなど既存機能の復活は本 plan の範囲外（F2）。完了時点で `pnpm dev` が "Hello, Next.js" プレースホルダーページを表示し、`pnpm build` と `pnpm test:run` が緑になることを保証する。

**Architecture:** 既存 `src/components`, `src/hooks`, `src/lib`, `src/types.ts`, `src/config.ts` はそのまま残す（F2 で順次 Next.js 規約に移植）。本 plan では Vite 関連の設定（`vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`）と vite-plugin-pwa を撤去し、Next.js のエントリポイント（`app/layout.tsx`, `app/page.tsx`）と Tailwind v4 PostCSS 統合を導入する。

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript 6, Tailwind CSS v4 (`@tailwindcss/postcss`), Vitest 4 (React Testing Library)

**Pre-conditions:**
- 親 spec: `docs/superpowers/specs/2026-05-28-auth-sync-foundation-design.md`
- 作業ブランチ: `feat/migrate-next`（master から分岐）
- 既存 `docs/roadmap` ブランチに ロードマップ・spec が含まれている前提

**Out of Scope（F2以降で実装）:**
- 既存コンポーネント・フックの Next.js への移植
- shadcn/ui の Next.js 上での再導入（テーマカスタマイズ含む）
- PWA / Serwist の復元
- Clerk 認証 / Neon DB / Server Actions
- 既存 vitest テストの内容変更（テスト**設定**は最低限の調整のみ）

**Rollback:** 各タスクの commit を `git revert` で巻き戻し可能。Task 9（Vite 撤去）以降の失敗時は `git reset --hard <Task 8 commit>` で復帰してから再着手する。

---

### Task 1: Pre-flight baseline

**Files:** なし（記録のみ）

- [ ] **Step 1: master へチェックアウトし最新化**

```bash
git checkout master
git pull --ff-only
```

- [ ] **Step 2: 既存テストが緑であることを記録**

```bash
pnpm install
pnpm test:run
```

期待: 全テストPASS。失敗があれば F1 を始めずまず修正する。

- [ ] **Step 3: 既存ビルドが成功することを記録**

```bash
pnpm build
```

期待: tsc + vite build 成功。失敗していたら F1 を始めず修正する。

- [ ] **Step 4: F1 用ブランチを切る**

```bash
git checkout -b feat/migrate-next
```

---

### Task 2: Next.js と関連依存をインストール

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Next.js と Tailwind v4 PostCSS プラグインを追加**

```bash
pnpm add next@^15
pnpm add -D @tailwindcss/postcss
```

期待: `package.json` の `dependencies` に `next`、`devDependencies` に `@tailwindcss/postcss` が追加。

- [ ] **Step 2: package.json を確認**

`package.json` の dependencies に以下が含まれていることを確認:
- `next` (v15.x)
- `react@^19.2.6`
- `react-dom@^19.2.6`

`devDependencies` に `@tailwindcss/postcss` が含まれていることを確認。

- [ ] **Step 3: コミット**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore(f1): add next and @tailwindcss/postcss"
```

---

### Task 3: package.json scripts を Next.js 用に書き換え

**Files:**
- Modify: `package.json`

- [ ] **Step 1: scripts セクションを差し替え**

`package.json` の `scripts` を以下に置換:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "test": "vitest",
  "test:run": "vitest run",
  "typecheck": "tsc -b --noEmit"
}
```

ポイント:
- `dev`/`build`/`start`/`lint` を Next.js に切替
- `test`/`test:run` は維持
- 旧 `preview` (vite preview) は削除
- `typecheck` を新設（旧 build に含まれていた `tsc -b` を独立化）

- [ ] **Step 2: コミット**

```bash
git add package.json
git commit -m "chore(f1): switch scripts to next dev/build/start"
```

---

### Task 4: next.config.mjs を作成

**Files:**
- Create: `next.config.mjs`

- [ ] **Step 1: 最小設定の next.config.mjs を作成**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
```

- [ ] **Step 2: コミット**

```bash
git add next.config.mjs
git commit -m "chore(f1): add minimal next.config.mjs"
```

---

### Task 5: Tailwind v4 用 PostCSS 設定を追加

**Files:**
- Create: `postcss.config.mjs`

- [ ] **Step 1: postcss.config.mjs を作成**

```js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

- [ ] **Step 2: コミット**

```bash
git add postcss.config.mjs
git commit -m "chore(f1): add postcss config for tailwind v4"
```

---

### Task 6: app/ ディレクトリと最小ページを作成

**Files:**
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/globals.css`

- [ ] **Step 1: app/globals.css を作成（Tailwind + フォント import）**

`app/globals.css`:

```css
@import "tailwindcss";
@import "@fontsource-variable/geist";

html, body {
  height: 100%;
}

body {
  font-family: 'Geist Variable', sans-serif;
}
```

注: 既存 `src/index.css` の CSS 変数（テーマカラー）と shadcn 統合は F2 で再導入。F1 では最小限のみ。

- [ ] **Step 2: app/layout.tsx を作成**

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "English Audio PWA",
  description: "日本語と英語の例文を読み上げる学習用PWA",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: app/page.tsx を作成（F1 プレースホルダー）**

```tsx
export default function Page() {
  return (
    <main className="min-h-dvh flex items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">English Audio PWA</h1>
        <p className="mt-2 text-sm text-neutral-500">
          F1: Next.js 15 App Router 移行が完了しました。
        </p>
        <p className="mt-1 text-xs text-neutral-400">
          既存機能の復活は F2 で行います。
        </p>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: コミット**

```bash
git add app/
git commit -m "feat(f1): add app router root layout and placeholder page"
```

---

### Task 7: tsconfig を Next.js 用に書き換え

**Files:**
- Modify: `tsconfig.json`
- Delete: `tsconfig.app.json`
- Delete: `tsconfig.node.json`

- [ ] **Step 1: tsconfig.json を Next.js 推奨に書き換え**

`tsconfig.json` 全体を以下に置換:

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    },
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

ポイント:
- `strict: true` を維持
- `paths` の `@/*` を `./src/*` のまま維持（既存 `src/` 配下のコードが将来も参照できる）
- `jsx: "preserve"` （Next.js 推奨）
- `noEmit: true` を維持

- [ ] **Step 2: 旧 tsconfig 参照ファイルを削除**

```bash
git rm tsconfig.app.json tsconfig.node.json
```

- [ ] **Step 3: typecheck が通ることを確認**

```bash
pnpm typecheck
```

期待: PASS（`next-env.d.ts` は次の dev 起動で自動生成されるため、ここでは未生成でも問題なし。エラーなら Task 8 で対処）。

- [ ] **Step 4: コミット**

```bash
git add tsconfig.json
git commit -m "chore(f1): align tsconfig with next.js app router"
```

---

### Task 8: Next.js dev/build が動くことを確認

**Files:** なし（検証のみ）

- [ ] **Step 1: dev サーバ起動を確認**

```bash
pnpm dev
```

期待:
- ターミナルに `Ready in ...ms` が表示される
- `next-env.d.ts` がルートに自動生成される
- `http://localhost:3000` を開くと "English Audio PWA / F1: Next.js 15 App Router 移行が完了しました。" が表示される
- Tailwind の `min-h-dvh flex items-center justify-center` が効いている

確認後 `Ctrl+C` で停止。

- [ ] **Step 2: 本番ビルドを確認**

```bash
pnpm build
```

期待: ✓ Compiled successfully。エラーがあれば修正してから次へ。

- [ ] **Step 3: next-env.d.ts を .gitignore で除外 or コミット**

Next.js 公式は `next-env.d.ts` をコミットすることを推奨しているため、コミットする:

```bash
git add next-env.d.ts
git commit -m "chore(f1): add next-env.d.ts"
```

---

### Task 9: Vite 関連ファイルと依存を撤去

**Files:**
- Delete: `vite.config.ts`
- Delete: `index.html`
- Delete: `src/main.tsx`
- Delete: `src/App.tsx`
- Modify: `package.json`

- [ ] **Step 1: Vite エントリポイントを削除**

```bash
git rm vite.config.ts index.html src/main.tsx src/App.tsx
```

- [ ] **Step 2: package.json から Vite 系依存を削除**

`devDependencies` から以下を削除:
- `@tailwindcss/vite`
- `@vitejs/plugin-react`
- `vite`
- `vite-plugin-pwa`

`dependencies` から以下を削除:
- `shadcn`（CLI なので devDependencies にも本来不要。後で必要なら `pnpm dlx` で実行）

```bash
pnpm remove @tailwindcss/vite @vitejs/plugin-react vite vite-plugin-pwa shadcn
```

- [ ] **Step 3: コミット**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore(f1): remove vite and related dependencies"
```

---

### Task 10: Vitest 設定を Vite プラグイン依存から切り離す

**Files:**
- Modify: `vitest.config.ts`

- [ ] **Step 1: vitest.config.ts を @vitejs/plugin-react 非依存に書き換え**

`vitest.config.ts` 全体を以下に置換:

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  esbuild: {
    jsx: "automatic",
  },
});
```

ポイント:
- `@vitejs/plugin-react` を撤去（Vite 削除済みなので使えない）
- `esbuild.jsx: "automatic"` で TSX を JSX 変換
- alias `@` は維持（既存テストの import path 互換）

- [ ] **Step 2: テスト緑を確認**

```bash
pnpm test:run
```

期待: 既存テスト（`csv.test.ts`, `speech.test.ts`, `storage.test.ts`, `useIntervals.test.ts`, `useLibrary.test.ts`, `usePlayer.test.ts`, `usePracticeMode.test.ts`）が全てPASS。

失敗時の対処:
- JSX が解釈されない → `esbuild.jsx: "automatic"` を確認
- alias `@/` 解決失敗 → `resolve.alias` を確認

- [ ] **Step 3: コミット**

```bash
git add vitest.config.ts
git commit -m "chore(f1): decouple vitest from vite plugin"
```

---

### Task 11: ESLint 設定を Next.js 用に最小化

**Files:**
- Modify: `eslint.config.js`
- Modify: `package.json`

- [ ] **Step 1: Next.js 公式 ESLint プラグインをインストール**

```bash
pnpm add -D @next/eslint-plugin-next
pnpm remove eslint-plugin-react-refresh
```

理由: `react-refresh` は Vite HMR 用なので Next.js では不要。`@next/eslint-plugin-next` は flat config に直接対応した Next.js の lint プラグイン。

- [ ] **Step 2: eslint.config.js を更新**

`eslint.config.js` 全体を以下に置換:

```js
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'
import nextPlugin from '@next/eslint-plugin-next'

export default defineConfig([
  globalIgnores(['.next', 'dist', 'node_modules']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
    ],
    plugins: { '@next/next': nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
    languageOptions: {
      globals: globals.browser,
    },
  },
])
```

注: Next.js 15 + ESLint flat config では `@next/eslint-plugin-next` を直接読み込む形が標準。

- [ ] **Step 3: Lint が通ることを確認**

```bash
pnpm lint
```

期待: エラーなし（既存 src/ のコードに対する警告は許容するが、エラーは無いこと）。

警告のみであれば次へ進む。エラーがあれば該当箇所を修正する（典型例: 既存 `src/App.tsx` 等はこの時点で既に削除済みなので、エラー対象は src/components, hooks, lib のみ）。

- [ ] **Step 4: コミット**

```bash
git add eslint.config.js package.json pnpm-lock.yaml
git commit -m "chore(f1): switch eslint to next.js configuration"
```

---

### Task 12: .gitignore に Next.js 用エントリを追加

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: 既存 .gitignore に Next.js 関連を追加**

`.gitignore` の末尾に以下を追記（既に dist などはあれば重複させない）:

```
# Next.js
.next/
out/

# Vercel
.vercel
```

- [ ] **Step 2: コミット**

```bash
git add .gitignore
git commit -m "chore(f1): ignore .next, out, .vercel"
```

---

### Task 13: 最終検証

**Files:** なし（検証のみ）

- [ ] **Step 1: クリーン状態から依存再インストール**

```bash
rm -rf node_modules .next
pnpm install
```

期待: エラーなくインストール完了。

- [ ] **Step 2: typecheck**

```bash
pnpm typecheck
```

期待: PASS。

注意: 既存 `src/` 配下のコードは F1 時点では App Router 内で参照されていないため、import グラフから外れている。`src/components/*.tsx` 等は型エラーを起こさず PASS するはず。万一エラーが出る場合は import 元が無いのに型整合が崩れているケース。F2 へ持ち越し可能なら TODO コメントを残す前にエラー内容を確認し、対処すべきか F2 に回すかを判断。

- [ ] **Step 3: lint**

```bash
pnpm lint
```

期待: エラーなし（警告のみ許容）。

- [ ] **Step 4: build**

```bash
pnpm build
```

期待: ✓ Compiled successfully。`.next/` が生成される。

- [ ] **Step 5: test:run**

```bash
pnpm test:run
```

期待: 既存テスト全 PASS。

- [ ] **Step 6: dev 起動と画面確認**

```bash
pnpm dev
```

期待: `http://localhost:3000` でプレースホルダーページが Tailwind スタイル付きで表示される。

確認後 `Ctrl+C` で停止。

- [ ] **Step 7: 最終コミット（必要なら）**

検証で追加変更が無ければスキップ。あれば:

```bash
git add -A
git commit -m "chore(f1): final cleanup after verification"
```

---

### Task 14: PR 作成準備

**Files:** なし（リモート操作）

- [ ] **Step 1: ブランチを push**

```bash
git push -u origin feat/migrate-next
```

- [ ] **Step 2: PR 作成（ユーザー確認後）**

PR タイトル候補: `feat(f1): migrate vite to next.js 15 app router`

PR 説明テンプレ:

```markdown
## Summary
- Vite → Next.js 15 App Router へ基盤移行
- 既存機能の復活は F2 で実施（読み上げモードは現状動かない）
- Tailwind v4 / TypeScript / Vitest は維持

## Verification
- [ ] pnpm typecheck
- [ ] pnpm lint
- [ ] pnpm build
- [ ] pnpm test:run
- [ ] pnpm dev で localhost:3000 にプレースホルダーページ表示

## Out of Scope
- 既存 src/components, hooks, lib の Next.js 配下への移植 → F2
- shadcn/ui の再導入 → F2
- PWA / Serwist 復元 → F3
```

ユーザーに PR を作成して良いか確認してから `gh pr create` を実行。

---

## 完了基準（このplan全体）

- `feat/migrate-next` ブランチ上で全タスクの「完了基準」がチェック済み
- `pnpm dev` / `pnpm build` / `pnpm test:run` / `pnpm typecheck` / `pnpm lint` 全て成功
- 既存 `src/` 配下のコードは未変更で残存（F2 で移植する原本）
- master へのマージ後、Vercel Preview Deployment でも疎通確認
