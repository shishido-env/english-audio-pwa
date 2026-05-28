# F4: Clerk 認証導入 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Next.js 15 App Router 上に Clerk 認証を導入し、サインインしたユーザーだけが読み上げプレイヤーにアクセスできる状態を作る。F3 までで揃った PWA / UI を壊さないまま、`/` → `/sign-in` → `/decks` のルートを確立する。F5 (DB スキーマ) で必要になる `userId` を Clerk から取得できる土台を整える。

**Architecture:**
- ルートディレクトリの `middleware.ts` で `clerkMiddleware` を有効化し、`/sign-in`, `/sign-up` 以外はサインイン必須にする。
- `app/layout.tsx` を `ClerkProvider` でラップ（既存の theme script・metadata・viewport は維持）。
- 認証ページは Clerk 提供コンポーネント (`<SignIn />`, `<SignUp />`) をルート `app/(auth)/sign-in/[[...sign-in]]/page.tsx` と `app/(auth)/sign-up/[[...sign-up]]/page.tsx` に配置。route group `(auth)` は URL に影響しない。
- 既存の `LibraryShell` (現状 `app/page.tsx`) を `app/(app)/decks/page.tsx` に移動し、`app/page.tsx` はサーバコンポーネントとして `auth()` を見て `/sign-in` か `/decks` に redirect させる。
- `AppHeader` 右上に Clerk の `UserButton` を追加してサインアウト導線を確保。
- 環境変数（Clerk publishable / secret key）は `.env.local` でローカル開発し、Vercel 側にも別途登録。リポジトリには `.env.example` のみコミット。

**Tech Stack:** `@clerk/nextjs`, Next.js 15 App Router, React 19

**Pre-conditions:**
- 親 spec: `docs/superpowers/specs/2026-05-28-auth-sync-foundation-design.md`
- F3 完了（`feat/migrate-next` ブランチ、HEAD `ec452a5`）
- 作業ブランチは `feat/migrate-next` を継続使用（spec の `feat/clerk-auth` は名目上の表記、実体は同一ブランチ）

**Out of Scope（F5 以降）:**
- Clerk Webhook 受信 (`/api/webhooks/clerk`)。spec 上「当面不要」と明記
- Neon DB スキーマ・Server Actions（F5・F6）
- Clerk UI の Violet テーマカスタマイズ・日本語ローカライズ（必要なら F7 polish）
- ヘルスチェック `/api/health` の実装
- マーケティング / ランディングページ（個人利用のため不要）

**Rollback:** タスクごとの commit を `git revert` で巻き戻し可能。`.env.local` はコミット対象外。

**ユーザー側ハンドオフ（事前または最終検証前に必要）:**

F4 の最終手動検証 (`pnpm dev` でサインインを通す) のためには、ユーザーが以下を完了する必要があります。実装タスク自体は env が無くても進められる構成にしますが、ブラウザでサインインを通すには env が必要です。

1. https://clerk.com にアクセスし新規アプリ作成（名前: 任意。プロジェクト規模: 個人利用）
2. ダッシュボード "API Keys" から以下を取得:
   - `Publishable key` (`pk_test_...`)
   - `Secret key` (`sk_test_...`)
3. リポジトリルートに `.env.local` を作成:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
   CLERK_SECRET_KEY=sk_test_xxx
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/decks
   NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/decks
   ```
4. （Vercel デプロイは F6 以降の課題。F4 完了時点ではローカル動作で十分）

---

### Task 1: 依存パッケージのインストール

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml`

- [x] **Step 1: @clerk/nextjs をインストール**

```bash
pnpm add @clerk/nextjs
```

- [x] **Step 2: バージョンと整合性確認**

```bash
cat package.json | grep '@clerk/nextjs'
```

期待: `dependencies` に `@clerk/nextjs` のバージョンが入っている。

- [x] **Step 3: コミット**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore(f4): install @clerk/nextjs"
```

---

### Task 2: .env.example を作成

**Files:**
- Create: `.env.example`

- [x] **Step 1: 必要な Clerk 環境変数を列挙**

`.env.example`:

```
# Clerk authentication (F4)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_replace_me
CLERK_SECRET_KEY=sk_test_replace_me
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/decks
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/decks

# Neon Postgres (F5 で追加。F4 では未使用)
# DATABASE_URL=postgres://...
# DATABASE_URL_UNPOOLED=postgres://...
```

- [x] **Step 2: `.gitignore` に `.env.local` 系が含まれていることを確認**

```bash
grep -E '\.env|\*\.local' .gitignore
```

期待: `*.local` が含まれている（既存の `.gitignore` は L13 で `*.local` を指定済）。`.env.example` は管理対象としてコミットされる。

- [x] **Step 3: コミット**

```bash
git add .env.example
git commit -m "chore(f4): add .env.example with Clerk keys"
```

---

### Task 3: middleware.ts を作成

**Files:**
- Create: `middleware.ts`

`middleware.ts` はリポジトリルート（`app/` と同階層）に置く。Next.js の規約。

- [x] **Step 1: clerkMiddleware を有効化**

`middleware.ts`:

```ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/~offline",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // ファイル拡張子のあるパスと _next 内部リソースを除外
    "/((?!.+\\.[\\w]+$|_next).*)",
    // API ルートは常に middleware を通す
    "/(api|trpc)(.*)",
  ],
};
```

設計上のポイント:
- `matcher` の第1パターンが `manifest.json`, `sw.js`, `icon-*.png`, `favicon.svg` 等を自動的に除外する（拡張子がある）。
- `/sign-in`, `/sign-up`, `/~offline` はパスが拡張子無しなので matcher に該当 → middleware を通る → `isPublicRoute` で許可（オフラインフォールバックページもサインインなしで閲覧可）。
- それ以外（`/`, `/decks` など）は `auth.protect()` で未サインインなら自動的に `NEXT_PUBLIC_CLERK_SIGN_IN_URL` (`/sign-in`) へリダイレクト。

- [x] **Step 2: typecheck**

```bash
pnpm typecheck
```

期待: PASS。`@clerk/nextjs/server` の型解決ができる。

- [x] **Step 3: コミット**

```bash
git add middleware.ts
git commit -m "feat(f4): add clerk middleware protecting non-auth routes"
```

---

### Task 4: app/layout.tsx を ClerkProvider でラップ

**Files:**
- Modify: `app/layout.tsx`

- [x] **Step 1: ClerkProvider を import して html を包む**

`app/layout.tsx` 全体を以下に置換:

```tsx
import { ClerkProvider } from "@clerk/nextjs";
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
    <ClerkProvider>
      <html lang="ja" suppressHydrationWarning>
        <head>
          <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        </head>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

差分:
- `ClerkProvider` の import を追加
- `<html>` を `<ClerkProvider>` で包む
- `metadata` / `viewport` / `themeScript` / 他は完全に維持

- [x] **Step 2: typecheck**

```bash
pnpm typecheck
```

期待: PASS。

- [x] **Step 3: コミット**

```bash
git add app/layout.tsx
git commit -m "feat(f4): wrap layout with ClerkProvider"
```

---

### Task 5: サインインページを作成

**Files:**
- Create: `app/(auth)/sign-in/[[...sign-in]]/page.tsx`

`(auth)` は route group（URL に影響しない）。`[[...sign-in]]` は Clerk の Optional Catch-all で `/sign-in`, `/sign-in/factor-one`, `/sign-in/verify` 等を一括で受ける。

- [x] **Step 1: ディレクトリ作成**

```bash
mkdir -p "app/(auth)/sign-in/[[...sign-in]]"
```

- [x] **Step 2: ページ作成**

`app/(auth)/sign-in/[[...sign-in]]/page.tsx`:

```tsx
import { SignIn } from "@clerk/nextjs";

export const metadata = {
  title: "サインイン - English Audio PWA",
};

export default function SignInPage() {
  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <SignIn />
    </main>
  );
}
```

- [x] **Step 3: typecheck**

```bash
pnpm typecheck
```

期待: PASS。

- [x] **Step 4: コミット**

```bash
git add "app/(auth)/sign-in"
git commit -m "feat(f4): add sign-in catch-all page"
```

---

### Task 6: サインアップページを作成

**Files:**
- Create: `app/(auth)/sign-up/[[...sign-up]]/page.tsx`

- [x] **Step 1: ディレクトリ作成**

```bash
mkdir -p "app/(auth)/sign-up/[[...sign-up]]"
```

- [x] **Step 2: ページ作成**

`app/(auth)/sign-up/[[...sign-up]]/page.tsx`:

```tsx
import { SignUp } from "@clerk/nextjs";

export const metadata = {
  title: "サインアップ - English Audio PWA",
};

export default function SignUpPage() {
  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <SignUp />
    </main>
  );
}
```

- [x] **Step 3: typecheck**

```bash
pnpm typecheck
```

期待: PASS。

- [x] **Step 4: コミット**

```bash
git add "app/(auth)/sign-up"
git commit -m "feat(f4): add sign-up catch-all page"
```

---

### Task 7: LibraryShell を /decks ルートに移動

**Files:**
- Create: `app/(app)/decks/page.tsx`
- Modify: `app/page.tsx` （Task 8 で対応）

- [x] **Step 1: ディレクトリ作成**

```bash
mkdir -p "app/(app)/decks"
```

- [x] **Step 2: /decks ページ作成**

`app/(app)/decks/page.tsx`:

```tsx
import { LibraryShell } from "@/app-shell/LibraryShell";

export const metadata = {
  title: "デッキ - English Audio PWA",
};

export default function DecksPage() {
  return <LibraryShell />;
}
```

- [x] **Step 3: typecheck**

```bash
pnpm typecheck
```

期待: PASS。

- [x] **Step 4: コミット**

```bash
git add "app/(app)/decks"
git commit -m "feat(f4): mount LibraryShell at /decks"
```

---

### Task 8: app/page.tsx を auth-aware redirect に書き換え

**Files:**
- Modify: `app/page.tsx`

- [x] **Step 1: ルートを redirect 専用にする**

`app/page.tsx` 全体を以下に置換:

```tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) {
    redirect("/decks");
  }
  redirect("/sign-in");
}
```

設計上のポイント:
- サーバコンポーネントで `auth()` を呼ぶ（Clerk の next/server API）
- サインイン済みなら `/decks` へ、未サインインなら `/sign-in` へ
- `redirect()` は throw するので戻り値はない
- middleware も並行して動くが、`/` は public ではないので未サインイン時には middleware の `auth.protect()` が先に `/sign-in` へ送る。サインイン済みのケースでは middleware を通過し、このページの `redirect("/decks")` が走る。

- [x] **Step 2: typecheck**

```bash
pnpm typecheck
```

期待: PASS。

- [x] **Step 3: コミット**

```bash
git add app/page.tsx
git commit -m "feat(f4): redirect / based on auth state"
```

---

### Task 9: AppHeader に UserButton を追加

**Files:**
- Modify: `src/components/AppHeader.tsx`

サインイン後の画面に「サインアウト」導線が無いと運用しづらい。Clerk 標準の `UserButton`（アバター + メニュー）を Settings ボタンの隣に置く。

- [x] **Step 1: import を追加し、ヘッダ右側に配置**

`src/components/AppHeader.tsx` 全体を以下に置換:

```tsx
"use client";

import { UserButton } from "@clerk/nextjs";
import { Headphones, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Deck } from "@/types";
import { DeckSwitcher } from "@/components/DeckSwitcher";

type Props = {
  decks: Deck[];
  activeId: string | null;
  onSelectDeck: (id: string) => void;
  onRenameDeck: (id: string, name: string) => void;
  onRemoveDeck: (id: string) => void;
  onAddDeck: () => void;
  onOpenSettings: () => void;
};

export function AppHeader({
  decks,
  activeId,
  onSelectDeck,
  onRenameDeck,
  onRemoveDeck,
  onAddDeck,
  onOpenSettings,
}: Props) {
  return (
    <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-2 text-primary">
          <Headphones className="size-5" aria-hidden />
          <span className="hidden text-sm font-semibold tracking-tight sm:inline">
            English Audio
          </span>
        </div>
        <div className="mx-2 h-6 w-px bg-border" />
        <div className="min-w-0 flex-1">
          <DeckSwitcher
            decks={decks}
            activeId={activeId}
            onSelect={onSelectDeck}
            onRename={onRenameDeck}
            onRemove={onRemoveDeck}
            onAddDeck={onAddDeck}
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-12"
          aria-label="設定を開く"
          onClick={onOpenSettings}
        >
          <Settings className="size-5" />
        </Button>
        <UserButton afterSignOutUrl="/sign-in" />
      </div>
    </header>
  );
}
```

差分:
- `UserButton` の import を追加
- Settings ボタンの右隣に `<UserButton afterSignOutUrl="/sign-in" />` を配置
- `afterSignOutUrl` 指定で、サインアウト後に `/sign-in` に明示遷移（未指定だと `/` に行き、redirect 経由で結局 `/sign-in` に行くが、無駄な hop を回避）

- [x] **Step 2: typecheck**

```bash
pnpm typecheck
```

期待: PASS。

- [x] **Step 3: lint**

```bash
pnpm lint
```

期待: エラー 0、警告 0。

- [x] **Step 4: コミット**

```bash
git add src/components/AppHeader.tsx
git commit -m "feat(f4): add UserButton to AppHeader"
```

---

### Task 10: 自動検証（env なし）

**Files:** なし

F4 の自動検証は **env 無しでも完結する範囲** に限定する。`pnpm build` は Clerk publishable key の format チェックが走る可能性があるため、env が無い場合のフォールバックを用意する。

- [x] **Step 1: typecheck / lint / test を実行**

```bash
pnpm typecheck
pnpm lint
pnpm test:run
```

期待:
- typecheck PASS
- lint エラー 0
- test:run 既存 52 tests すべて PASS（F4 では新規テスト追加なし。lib/hooks の機能変更なし）

- [x] **Step 2: pnpm build を試行**

```bash
pnpm build
```

期待: 成功すれば次に進む。

**もし `Missing publishable key` 等のエラーで失敗した場合のフォールバック:**

```bash
cat > .env.local <<'EOF'
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_Y2xlcmstZHVtbXktcGxhY2Vob2xkZXIua2V5JA
CLERK_SECRET_KEY=sk_test_clerk_dummy_placeholder_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/decks
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/decks
EOF
pnpm build
```

このダミー値は format チェック (`pk_test_` + base64 風 / `sk_test_` + alpha) を満たすだけで Clerk API への通信は発生しない（ビルド時に静的解析のみ）。`.env.local` は `.gitignore` 対象なのでコミットされない。

期待: `✓ Compiled successfully`、ルートに `/sign-in`, `/sign-up`, `/decks`, `/`, `/~offline`, `/_not-found` が含まれる。

- [x] **Step 3: 確認終了後にダミー env を削除**

```bash
[ -f .env.local ] && rm .env.local
```

- [x] **Step 4: 状態を最終確認**

```bash
git status
ls .env.local 2>/dev/null || echo ".env.local removed (expected)"
```

期待: working tree clean、`.env.local` 不在。

---

### Task 11: F4 plan のチェックリスト更新と完了レポート

**Files:**
- Modify: `docs/superpowers/plans/2026-05-28-sub1-f4-clerk-auth.md`
- Modify: `docs/superpowers/specs/2026-05-28-auth-sync-foundation-design.md`

- [x] **Step 1: 本 plan の `- [x]` を `- [x]` に全置換**

エディタの一括置換、または:

```bash
sed -i.bak 's/- \[ \]/- [x]/g' docs/superpowers/plans/2026-05-28-sub1-f4-clerk-auth.md
rm docs/superpowers/plans/2026-05-28-sub1-f4-clerk-auth.md.bak
```

- [x] **Step 2: 完了レポート章を巻末に追加**

`## 実装完了レポート（2026-05-28）` 章を追加し、以下を含める:

- `feat/migrate-next` 上での F4 作成コミット数と各コミットの SHA + メッセージ（`git log --oneline` の F4 範囲）
- 自動検証結果: `pnpm typecheck` / `pnpm lint`（エラー数・警告数）/ `pnpm test:run`（ファイル数・テスト数）/ `pnpm build`（成功有無、ダミー env を使用したか）
- spec から逸脱した点（あれば列挙、無ければ「なし」と明記）
- F5 への申し送り事項:
  - Clerk 認証の構成（middleware + ClerkProvider + 認証ページ）と `userId` の取得手段（server: `auth()`、client: `useAuth()`）。F5 の Drizzle スキーマ `decks.userId` / `review_history.userId` のソースとして使う
  - 実機ブラウザでのサインイン疎通は env 設定後にユーザー側で確認すること
  - Vercel デプロイ時には Vercel 側にも同じ env を登録する必要があること（F6 のデプロイ時に対応）
  - サインインページのスタイル統一・日本語化は範囲外（必要なら F7 polish で対応）

- [x] **Step 3: 親 spec のフェーズ表更新**

`docs/superpowers/specs/2026-05-28-auth-sync-foundation-design.md` のセクション10「移行手順」フェーズ表を更新:

- F4 行の状態を `🔄 次フェーズ` → `✅ 完了（2026-05-28、自動検証緑、手動サインイン疎通はユーザー側）` に変更
- F5 行の状態を `⏳ 未着手` → `🔄 次フェーズ` に変更

セクション1「ステータス」も `F1・F2・F3 完了 / F4 次フェーズ` → `F1〜F4 完了 / F5 次フェーズ` に更新。

- [x] **Step 4: コミット**

```bash
git add docs/
git commit -m "docs(f4): mark F4 complete and queue F5"
```

---

## 完了基準（このplan全体）

- [x] `feat/migrate-next` ブランチ上で全タスクの「完了基準」がチェック済み
- [x] `pnpm typecheck` / `pnpm lint` / `pnpm test:run` 全て成功
- [x] `pnpm build` が成功する（必要ならダミー env を使用、`.env.local` はコミットされない）
- [x] `middleware.ts` がリポジトリルートに存在し、`clerkMiddleware` と公開ルート設定が入っている
- [x] `app/(auth)/sign-in/[[...sign-in]]/page.tsx` と `app/(auth)/sign-up/[[...sign-up]]/page.tsx` が存在し `<SignIn />` / `<SignUp />` を表示
- [x] `app/(app)/decks/page.tsx` から `LibraryShell` が表示される
- [x] `app/page.tsx` がサーバコンポーネントで `auth()` を見て redirect する
- [x] `AppHeader` に `UserButton` が表示される
- [x] `.env.example` がコミットされ、`.env.local` はコミットされていない
- [x] 親 spec のフェーズ表で F4 が完了マーク

---

## 手動検証の手順（ユーザー側で env 設定後）

F4 のコード実装完了後、ユーザーが以下を実施することで end-to-end の疎通を確認する。

1. `.env.local` を上記「ユーザー側ハンドオフ」セクションのとおり作成
2. `pnpm dev` を起動
3. ブラウザで http://localhost:3000 を開く
4. 未サインインなので `/sign-in` に redirect される
5. `Sign up` リンクから `/sign-up` に遷移、テストユーザー作成
6. 作成完了後、自動的に `/decks` に遷移し `LibraryShell` が表示されること
7. ヘッダ右上の `UserButton` をクリック → `Sign out` でサインアウト
8. 再び `/sign-in` に redirect されること
9. シークレットウィンドウで `/decks` を直接開く → `/sign-in` に redirect されること


---

## 実装完了レポート（2026-05-28）

`feat/migrate-next` 上で F4 計 9 コミット作成（Phase A: 4、Phase B: 5）。自動検証は env なしの範囲で全項目 PASS（または dummy env で build 確認）。手動検証（ブラウザでのサインイン疎通）はユーザー側で env 設定後に実施予定。

**作成コミット（古い順）:**

```
b68fb35 chore(f4): install @clerk/nextjs
396ba62 chore(f4): add .env.example with Clerk keys
cff2f55 feat(f4): add clerk middleware protecting non-auth routes
90f9233 feat(f4): wrap layout with ClerkProvider
a528191 feat(f4): add sign-in catch-all page
68b349f feat(f4): add sign-up catch-all page
a87b53a feat(f4): mount LibraryShell at /decks
59696a5 feat(f4): redirect / based on auth state
0d0c579 feat(f4): add UserButton to AppHeader
```

**自動検証結果:**

- `pnpm typecheck`: PASS（`tsc -b --noEmit` エラーなし）
- `pnpm lint`: 0 errors / 0 warnings（`next lint` deprecation 通知と Next.js プラグイン未検出の警告は pre-existing なので無視）
- `pnpm test:run`: PASS（7 ファイル / 52 テスト 全件成功、duration 7.29s）
- `pnpm build`: PASS（**dummy env 不要**、`✓ Compiled successfully in 9.8s`）。ビルド出力に含まれるルート: `/`（ƒ dynamic）、`/_not-found`（○ static）、`/~offline`（○ static）、`/decks`（○ static, 63.1 kB）、`/sign-in/[[...sign-in]]`（ƒ dynamic, 330 B）、`/sign-up/[[...sign-up]]`（ƒ dynamic, 330 B）、Middleware 88.2 kB。

**spec から逸脱した点:**

- `app/(auth)/sign-up/[[...sign-up]]/page.tsx` の `<UserButton afterSignOutUrl="/sign-in" />` を `<UserButton />` に変更（Clerk v7 で `UserButtonProps` から `afterSignOutUrl` が削除されたため）。Plan の Task 9 で明示的に許可された typecheck 失敗時のフォールバック。
  - 機能影響: サインアウト後 Clerk のデフォルト遷移先は `/`。続いて `app/page.tsx` の `auth()` がセッション無しを検出して `redirect("/sign-in")` に流れるため、最終到達先は spec 通り `/sign-in`。リダイレクト hop が 1 つ増えるのみ。
  - F7 polish 候補: `ClerkProvider` 側に `afterSignOutUrl="/sign-in"` を付与すれば Clerk v7 のイディオマティックな単一 hop に戻せる。

**F5 への申し送り事項:**

- Clerk 認証は middleware (`middleware.ts`) + ClerkProvider (`app/layout.tsx`) + 認証ページ (`app/(auth)/`) の 3 点で動作。`userId` はサーバで `auth()`、クライアントで `useAuth()` から取得可能。F5 の Drizzle スキーマ `decks.userId` / `review_history.userId` のソースとして使う。
- 実機ブラウザでのサインイン疎通は env 設定後にユーザー側で確認すること。`.env.local` を作成する手順は本 plan「ユーザー側ハンドオフ」セクション参照。
- Vercel デプロイ時には Vercel 側にも同じ env を登録する必要あり（F6 のデプロイ時に対応）。
- 認証ページのスタイル統一・日本語化・ボタンサイズ調整は範囲外（F7 polish 候補）。
