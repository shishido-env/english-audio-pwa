# F3: PWA / Serwist 導入 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Next.js 15 上で Serwist による Service Worker と Web App Manifest を導入し、F2 まで揃った UI を **インストール可能な PWA** に戻す。オフライン時は App Shell + 既存 localStorage キャッシュで起動できる。Lighthouse PWA カテゴリ（installability・offline）の主要項目をクリアできる状態にする。

**Architecture:**
- Service Worker は `@serwist/next` の `withSerwistInit` ラッパーが自動生成・自動登録（`register: true` デフォルト）。
- SW エントリは `app/sw.ts`。`defaultCache` を `runtimeCaching` として使用しつつ、navigation 用に `/~offline` フォールバックを定義。
- `public/manifest.json` を静的配置。F1 で参照されている既存アイコン（`public/icon-192.png`, `icon-512.png`, `icon-maskable.png`, `favicon.svg`）を流用。
- `app/layout.tsx` で manifest と theme-color を `<head>` に注入。
- 旧 Vite 由来の `manifest` 定義（`vite.config.ts` 内に存在していた、F1 で撤去済）と同等の内容を JSON ファイル化する。

**Tech Stack:** `@serwist/next`, `serwist`, Next.js 15 App Router, Tailwind v4

**Pre-conditions:**
- 親 spec: `docs/superpowers/specs/2026-05-28-auth-sync-foundation-design.md`
- F2 完了（`feat/migrate-next` ブランチ、HEAD `d57a572`）
- 既存 PWA 資産: `public/icon-192.png`, `public/icon-512.png`, `public/icon-maskable.png`, `public/favicon.svg`, `public/icons.svg`

**Out of Scope（F4 以降）:**
- 認証付きルートのキャッシュ戦略の細分化（Clerk 導入後の F4 で必要に応じ調整）
- Server Actions レスポンスの runtimeCaching カスタマイズ（F6 で必要に応じ調整）
- Push 通知 / Background Sync / Periodic Sync などの高度な PWA 機能
- Lighthouse スコア最適化のための追加メタデータ調整

**Rollback:** タスクごとの commit を `git revert` で巻き戻し可能。

---

### Task 1: 依存パッケージのインストール

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml`

- [x] **Step 1: @serwist/next と serwist をインストール**

```bash
pnpm add @serwist/next
pnpm add -D serwist
```

- [x] **Step 2: バージョンと整合性確認**

```bash
cat package.json | grep -E '"@serwist|"serwist'
```

期待: `@serwist/next` が `dependencies`、`serwist` が `devDependencies` に入っている。

- [x] **Step 3: コミット**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore(f3): install @serwist/next and serwist"
```

---

### Task 2: tsconfig.json に Serwist 用設定を追加

**Files:**
- Modify: `tsconfig.json`

- [x] **Step 1: types と lib に Serwist 用エントリ追加、exclude に sw.js 追加**

既存 `tsconfig.json` を以下のように更新:

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "lib": ["dom", "dom.iterable", "esnext", "webworker"],
    "types": ["@serwist/next/typings"],
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
  "exclude": ["node_modules", "public/sw.js"]
}
```

差分:
- `lib` に `"webworker"` を追加
- `compilerOptions` に `"types": ["@serwist/next/typings"]` を追加
- `exclude` に `"public/sw.js"` を追加（ビルド時に生成される、TS 対象から除外）

- [x] **Step 2: typecheck で破綻していないこと確認**

```bash
pnpm typecheck
```

期待: PASS（sw.ts まだ無いが、include パターンに該当しないので OK）。

- [x] **Step 3: コミット**

```bash
git add tsconfig.json
git commit -m "chore(f3): add serwist typings and webworker lib"
```

---

### Task 3: app/sw.ts (Service Worker エントリ) を作成

**Files:**
- Create: `app/sw.ts`

- [x] **Step 1: 以下の内容で新規作成**

```ts
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
```

- [x] **Step 2: typecheck**

```bash
pnpm typecheck
```

期待: PASS。`self.__SW_MANIFEST` が `webworker` lib + Serwist typings によって解決される。

- [x] **Step 3: コミット**

```bash
git add app/sw.ts
git commit -m "feat(f3): add serwist service worker entry"
```

---

### Task 4: オフラインフォールバックページ app/~offline/page.tsx を作成

**Files:**
- Create: `app/~offline/page.tsx`

- [x] **Step 1: 最小オフラインページを作成**

```bash
mkdir -p "app/~offline"
```

`app/~offline/page.tsx`:

```tsx
export const metadata = {
  title: "オフライン - English Audio PWA",
};

export default function OfflinePage() {
  return (
    <main className="min-h-dvh flex items-center justify-center p-8">
      <div className="text-center max-w-sm">
        <h1 className="text-2xl font-bold">オフラインです</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          ネットワーク接続を確認してから、再読み込みしてください。
          既に開いていたデッキは引き続き再生できます。
        </p>
      </div>
    </main>
  );
}
```

- [x] **Step 2: build で疎通**

```bash
pnpm build
```

期待: ✓ Compiled successfully、ルートに `/~offline` が増える（4 ルート: `/`, `/_not-found`, `/~offline`、Serwist sw 用エントリ）。

- [x] **Step 3: コミット**

```bash
git add "app/~offline/page.tsx"
git commit -m "feat(f3): add minimal offline fallback page"
```

---

### Task 5: next.config.mjs を Serwist でラップ

**Files:**
- Modify: `next.config.mjs`

- [x] **Step 1: 以下に置換**

```js
import { spawnSync } from "node:child_process";
import withSerwistInit from "@serwist/next";

const revision =
  spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout?.trim() ||
  crypto.randomUUID();

const withSerwist = withSerwistInit({
  additionalPrecacheEntries: [{ url: "/~offline", revision }],
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default withSerwist(nextConfig);
```

注: `revision` は `git rev-parse HEAD` の出力を使う。デプロイごとに `sw.js` が更新されることを保証。`trim()` で改行を除去、失敗時は UUID にフォールバック。

- [x] **Step 2: build で sw.js 生成確認**

```bash
pnpm build
ls -la public/sw.js
```

期待: `public/sw.js` が生成される（数十KB〜）。`✓ Compiled successfully` も維持。

- [x] **Step 3: コミット**

```bash
git add next.config.mjs
git commit -m "feat(f3): wrap next config with withSerwistInit"
```

---

### Task 6: public/sw.js を .gitignore に追加

**Files:**
- Modify: `.gitignore`

- [x] **Step 1: .gitignore 末尾に追加**

```
# Service Worker (generated)
public/sw.js
public/sw.js.map
public/swe-worker-*.js
```

- [x] **Step 2: 既に sw.js が tracked 状態なら untrack**

```bash
git rm --cached public/sw.js public/sw.js.map 2>/dev/null
```

エラーになるなら（ファイル無いか既に untracked）スキップ。

- [x] **Step 3: コミット**

```bash
git add .gitignore
git commit -m "chore(f3): ignore generated service worker artifacts"
```

---

### Task 7: public/manifest.json を作成

**Files:**
- Create: `public/manifest.json`

- [x] **Step 1: 旧 vite.config.ts の manifest 設定を JSON 化**

```bash
git show c932b74:vite.config.ts | grep -A 25 "manifest:"
```

確認した内容を以下の `manifest.json` として書き出し。

`public/manifest.json`:

```json
{
  "name": "English Audio PWA",
  "short_name": "EnglishAudio",
  "description": "日本語と英語の例文を読み上げる学習用PWA",
  "theme_color": "#7c3aed",
  "background_color": "#09090b",
  "display": "standalone",
  "start_url": "/",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icon-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

差分: アイコン URL を `"icon-192.png"` → `"/icon-192.png"` に変更（絶対パス化）。

- [x] **Step 2: dev でアクセス確認**

```bash
pnpm dev > /tmp/next-dev.log 2>&1 &
DEV_PID=$!
sleep 8
curl -s -o /dev/null -w "manifest HTTP %{http_code}\n" http://localhost:3000/manifest.json
curl -s -o /dev/null -w "icon-192 HTTP %{http_code}\n" http://localhost:3000/icon-192.png
kill $DEV_PID 2>/dev/null
wait 2>/dev/null
```

期待: それぞれ HTTP 200。

- [x] **Step 3: コミット**

```bash
git add public/manifest.json
git commit -m "feat(f3): add web app manifest"
```

---

### Task 8: app/layout.tsx に manifest と theme-color のメタデータを追加

**Files:**
- Modify: `app/layout.tsx`

- [x] **Step 1: metadata と viewport に PWA 用エントリを追加**

Next.js 15 では `manifest` と `themeColor` は `Metadata` / `Viewport` API で宣言できる。

`app/layout.tsx` 全体を以下に置換:

```tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "English Audio PWA",
  description: "日本語と英語の例文を読み上げる学習用PWA",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.svg",
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#7c3aed",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const themeScript = `
(function() {
  try {
    var t = localStorage.getItem('english-audio-pwa:theme');
    var dark = t === 'dark' || ((t === 'system' || t === null) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (dark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

差分:
- `Viewport` 型を import、`export const viewport` を追加
- `metadata` に `manifest`, `icons` を追加

- [x] **Step 2: dev で <link rel="manifest"> がレンダリングされること確認**

```bash
pnpm dev > /tmp/next-dev.log 2>&1 &
DEV_PID=$!
sleep 8
curl -s http://localhost:3000 | grep -oE 'rel="manifest"|content="#7c3aed"' | head -5
kill $DEV_PID 2>/dev/null
wait 2>/dev/null
```

期待: `rel="manifest"` と `content="#7c3aed"` が両方検出される。

- [x] **Step 3: コミット**

```bash
git add app/layout.tsx
git commit -m "feat(f3): wire manifest and theme-color in layout metadata"
```

---

### Task 9: ESLint で app/sw.ts を除外

**Files:**
- Modify: `eslint.config.js`

`app/sw.ts` は webworker globals を使うので、通常の React ルールが噛むと誤検知する可能性がある。

- [x] **Step 1: globalIgnores に app/sw.ts を追加**

```js
// Before
globalIgnores(['.next', 'dist', 'node_modules']),

// After
globalIgnores(['.next', 'dist', 'node_modules', 'app/sw.ts', 'public/sw.js']),
```

- [x] **Step 2: lint 確認**

```bash
pnpm lint
```

期待: エラー 0、警告 0（既存と同じ）。

- [x] **Step 3: コミット**

```bash
git add eslint.config.js
git commit -m "chore(f3): exclude generated and worker files from eslint"
```

---

### Task 10: 最終検証

**Files:** なし

- [x] **Step 1: クリーンインストール + 全チェック**

```bash
rm -rf node_modules .next public/sw.js public/sw.js.map
pnpm install
pnpm typecheck
pnpm lint
pnpm test:run
pnpm build
```

期待:
- typecheck PASS
- lint エラー 0
- test:run 52 tests PASS
- build PASS、`public/sw.js` 生成、ルートに `/`, `/_not-found`, `/~offline` が含まれる

- [x] **Step 2: dev で SW 配信と /~offline 疎通**

```bash
pnpm dev > /tmp/next-dev.log 2>&1 &
DEV_PID=$!
sleep 10
curl -s -o /dev/null -w "/  HTTP %{http_code}\n" http://localhost:3000
curl -s -o /dev/null -w "/~offline HTTP %{http_code}\n" http://localhost:3000/~offline
curl -s -o /dev/null -w "/sw.js HTTP %{http_code}\n" http://localhost:3000/sw.js
curl -s -o /dev/null -w "/manifest.json HTTP %{http_code}\n" http://localhost:3000/manifest.json
kill $DEV_PID 2>/dev/null
wait 2>/dev/null
```

期待: すべて HTTP 200。

注意: dev では SW が登録モード `register: true` でクライアントに登録される。Chrome DevTools → Application → Service Workers で `sw.js` が active になっていればOK。検証は本タスクの自動確認 + ユーザー側ブラウザ確認の併用。

- [x] **Step 3: 最終コミット（必要なら）**

```bash
git status
# 変更があれば
git add -A
git commit -m "chore(f3): final cleanup after verification"
```

---

### Task 11: F3 plan のチェックリスト更新と完了レポート

**Files:**
- Modify: `docs/superpowers/plans/2026-05-28-sub1-f3-pwa-serwist.md`
- Modify: `docs/superpowers/specs/2026-05-28-auth-sync-foundation-design.md`

- [x] **Step 1: 本 plan の `- [ ]` を `- [x]` に全置換**

- [x] **Step 2: 完了レポート章を追加（巻末）**

以下の情報を記載:
- 作成コミット数と最終 SHA
- typecheck / lint / test:run / build / dev 確認結果
- spec から逸脱した点（あれば）
- F4 への申し送り事項

- [x] **Step 3: 親 spec のフェーズ表更新**

F3 を「✅ 完了（YYYY-MM-DD）」、F4 を「🔄 次フェーズ」に変更。

- [x] **Step 4: コミット**

```bash
git add docs/
git commit -m "docs(f3): mark F3 complete and queue F4"
```

---

## 完了基準（このplan全体）

- [x] `feat/migrate-next` ブランチ上で全タスクの「完了基準」がチェック済み
- [x] `pnpm typecheck` / `pnpm lint` / `pnpm test:run` / `pnpm build` 全て成功
- [x] `public/sw.js` が build 時に生成される（約 41 KB、`.gitignore` 対象）
- [x] `pnpm dev` で `/`, `/~offline`, `/sw.js`, `/manifest.json` がすべて HTTP 200
- [x] HTML レンダリング結果に `<link rel="manifest">` と `<meta name="theme-color" content="#7c3aed">` が含まれる
- [x] 親 spec のフェーズ表で F3 が完了マーク

---

## 実装完了レポート（2026-05-28）

`feat/migrate-next` 上で F3 計 9 コミット作成。最終検証は全項目 PASS。

**作成コミット（古い順）:**

```
c5c39e5 chore(f3): install @serwist/next and serwist
351d9e3 chore(f3): add serwist typings and webworker lib
81d7253 feat(f3): add serwist service worker entry
f4f8884 feat(f3): add minimal offline fallback page
d71436e feat(f3): wrap next config with withSerwistInit
e7f0284 chore(f3): ignore generated service worker artifacts
307e4c9 feat(f3): add web app manifest
289f329 feat(f3): wire manifest and theme-color in layout metadata
35fca68 chore(f3): exclude generated and worker files from eslint
```

**検証結果（クリーン再インストール後）:**
- `pnpm typecheck`: PASS
- `pnpm lint`: PASS（エラー 0、警告 0）
- `pnpm test:run`: 7 files / 52 tests PASS
- `pnpm build`: PASS、`public/sw.js` 約 41 KB を生成、prerendered routes は `/`, `/_not-found`, `/~offline`
- `pnpm dev` HTTP 200 確認: `/`, `/~offline`, `/sw.js`, `/manifest.json` の 4 つすべて 200

**spec から逸脱した点:**
- なし。`public/swe-worker-*.js` は Serwist v9 が本体に統合する仕様で生成されないが、念のため `.gitignore` には記載済み（無害）。

**F4 への申し送り事項:**
- Service Worker は `register: true` デフォルトでクライアント自動登録される。F4 で Clerk 導入時に「サインインページのキャッシュ戦略を NetworkFirst に変更したい」等の細分化が必要になった場合は `app/sw.ts` の `runtimeCaching` をカスタマイズする（現状は `defaultCache` のみ）。
- 実機ブラウザでの Service Worker 登録・インストール可否・オフライン挙動は手動確認推奨（Chrome DevTools → Application タブ）。本 plan の自動検証は dev サーバの HTTP 応答までで完結。
- Lighthouse PWA 監査の細項目（splash screen 用 apple-touch アイコン形状、`scope` フィールド等）は範囲外。必要なら F7 の polish フェーズで対処。
- `public/sw.js` は build 成果物のため `.gitignore` 対象。本番デプロイは Vercel ビルド時に自動生成される前提。
