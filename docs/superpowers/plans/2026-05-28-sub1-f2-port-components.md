# F2: 既存コンポーネント・フック・ライブラリの Next.js 移植 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** F1 で残した `src/` 配下のコード（components / hooks / lib / types / config）を Next.js 15 App Router 規約に沿って整理し、`app/page.tsx` 単一ページで「ライブラリ + 読み上げプレイヤー + 練習モード切替」が動く状態を復活させる。Tailwind v4 + shadcn/ui（new-york, Zinc + Violet）を Next.js 上で再構成し、React 19 + ESLint Next.js プラグインの厳格ルール（`react-hooks/refs`, `react-hooks/set-state-in-effect`）を全クリアする。

**Architecture:**
- `src/lib`, `src/types.ts`, `src/config.ts` は純粋モジュールのためほぼそのまま `src/` 配下に残置（Next.js は `src/` を標準対応）。
- `src/hooks/*` と `src/components/*` は **Client Components** として明示（先頭に `"use client"`）。
- `app/page.tsx` を **Server Component** とし、必要な状態をすべて持つ `<LibraryShell />` Client Component を呼び出す薄いコンテナにする（既存 `src/App.tsx` の責務はこちらへ）。
- `components.json` を Next.js / RSC 構成に更新（`rsc: true`、`utils: "@/lib/utils"`）。
- 既存 `eslint.config.js` の `globalIgnores: ['src']` を最終的に解除する。

**Tech Stack:** Next.js 15 App Router, React 19 (Client Components), TypeScript strict, Tailwind v4, shadcn/ui (new-york / Zinc + Violet), sonner, lucide-react, Vitest 4

**Pre-conditions:**
- 親 spec: `docs/superpowers/specs/2026-05-28-auth-sync-foundation-design.md`
- F1 完了（`feat/migrate-next` ブランチ、13 コミット + docs merge）
- 作業ブランチ: `feat/migrate-next` を継続使用（PR は F2 完了時に作成判断）
- `eslint.config.js` の `globalIgnores` に `'src'` が一時的に追加されている前提

**Out of Scope（F3 以降）:**
- PWA / Serwist / Service Worker / manifest.json
- Clerk 認証 / Neon DB / Server Actions（このフェーズは依然 localStorage ベース）
- 既存テスト内容の本質的な変更（移動・import path 修正のみ）
- 新規機能追加（暗記モード本体・SRSなど）

**Rollback:** タスクごとの commit を `git revert` で巻き戻し可能。Task 11 以降の失敗時は `git reset --hard <Task 10 commit>` で復帰してから再着手。

---

## ファイル構造（移植後）

```
app/
  layout.tsx               既存（テーマ未対応 → このフェーズで更新）
  page.tsx                 ライブラリ + プレイヤー画面（薄いコンテナ）
  globals.css              既存 + 既存 src/index.css のテーマトークン移植
src/
  app-shell/
    LibraryShell.tsx       既存 src/App.tsx 相当（"use client"）
  components/              既存維持（"use client" 付与）
    ui/                    shadcn/ui（既存維持、import path のみ確認）
  hooks/                   既存維持（"use client" 不要、Client Component から呼ばれる前提）
  lib/                     既存維持（純粋関数）
  test/setup.ts            既存維持
  config.ts                既存維持
  types.ts                 既存維持
types/globals.d.ts         既存維持（"*.css" 宣言）
components.json            更新（rsc: true, css: "app/globals.css"）
```

---

### Task 1: 既存 src/index.css のテーマトークンを app/globals.css に移植

**Files:**
- Read: `src/index.css`（F1 で残存している既存ファイル）
- Modify: `app/globals.css`

- [ ] **Step 1: 既存 src/index.css を確認**

```bash
cat src/index.css
```

`@theme inline` / `:root` / `.dark` の CSS 変数を確認する。Tailwind v4 ではこれらを `@theme inline` ブロックで定義する。

- [ ] **Step 2: app/globals.css に統合**

`app/globals.css` 全体を以下の構造に置換:

```css
@import "tailwindcss";
@import "@fontsource-variable/geist";

/* src/index.css の @theme inline ブロックをここへ移植 */
@theme inline {
  /* 既存トークンをそのままコピー */
}

/* 既存 :root と .dark のカラー変数定義をそのままコピー */
:root {
  /* ... */
}

.dark {
  /* ... */
}

html, body {
  height: 100%;
}

body {
  font-family: 'Geist Variable', sans-serif;
}
```

注: 元の `src/index.css` に書かれている内容は変更せず **そのままコピー**。トークン名・値を変更してはいけない。

- [ ] **Step 3: dev 起動して既存スタイル（Zinc + Violet）を確認**

```bash
pnpm dev
```

`http://localhost:3000` のプレースホルダーページにダーク/ライトの境界が認識される CSS 変数が読み込まれていることを `--background` などで確認（DevTools の Computed style）。

`Ctrl+C` で停止。

- [ ] **Step 4: コミット**

```bash
git add app/globals.css
git commit -m "chore(f2): port theme tokens from src/index.css to app/globals.css"
```

---

### Task 2: 純粋モジュール（lib, types, config）の lint 確認

**Files:** なし（既存維持）

- [ ] **Step 1: ESLint 除外を一時的に外して lib / types / config だけスキャン**

`eslint.config.js` 末尾に **一時的に** 以下の override を追加（後で戻す）:

```js
// 一時: src/lib, src/types.ts, src/config.ts のみ lint
```

または直接コマンドラインで:

```bash
pnpm exec eslint src/lib src/types.ts src/config.ts
```

- [ ] **Step 2: エラーが無いことを確認**

期待: エラー 0。`react-hooks/refs` や `set-state-in-effect` は純粋モジュールなので発生しない。

万一警告/エラーがあれば内容を記録（このタスクでは修正しない、後の Task で対応）。

- [ ] **Step 3: コミット（変更が無ければスキップ）**

このタスクは検証のみのためコミットなし。

---

### Task 3: hooks ディレクトリの単純移植可能フックを確認

**Files:**
- Verify: `src/hooks/useIntervals.ts`, `useWakeLock.ts`, `useTheme.ts`

- [ ] **Step 1: 該当 3 フックの内容を確認**

```bash
pnpm exec eslint src/hooks/useIntervals.ts src/hooks/useWakeLock.ts src/hooks/useTheme.ts
```

期待: エラー 0（これらは ref を render 中に触らず、useEffect 内で setState もループ条件付きで使用しているため厳格ルールに引っかからない想定）。

警告のみであれば次へ。エラーがあれば内容を記録して次の Task で扱う。

- [ ] **Step 2: コミット（変更なしのためスキップ）**

検証タスクのためコミットなし。

---

### Task 4: usePracticeMode の lint 確認と必要なら修正

**Files:**
- Verify: `src/hooks/usePracticeMode.ts`
- Verify: `src/hooks/usePracticeMode.test.ts`

- [ ] **Step 1: lint 実行**

```bash
pnpm exec eslint src/hooks/usePracticeMode.ts
```

- [ ] **Step 2: エラーがあれば原因を特定して最小修正**

典型パターンと対処:
- `react-hooks/set-state-in-effect`: `useEffect` 内の `setState` を、依存配列に基づく `useMemo` での派生値計算へ置換できる場合は派生に変更する。状態として保持する必要があれば、初期化のみ `useState(() => init)` で行い `useEffect` での同期は外部入力（props/storage）変化時に限定する。
- `useEffect` の本来の意図が「外部システムとの同期」であれば、コメントで意図を明示した上で eslint-disable を **行単位** で使う（ファイル全体の disable は禁止）。

- [ ] **Step 3: テスト緑を確認**

```bash
pnpm exec vitest run src/hooks/usePracticeMode.test.ts
```

期待: テスト全 PASS。

- [ ] **Step 4: コミット（変更があれば）**

```bash
git add src/hooks/usePracticeMode.ts
git commit -m "fix(f2): satisfy react-hooks rules in usePracticeMode"
```

変更なしならスキップ。

---

### Task 5: useLibrary を react-hooks 厳格ルール対応

**Files:**
- Modify: `src/hooks/useLibrary.ts`
- Verify: `src/hooks/useLibrary.test.ts`

`src/hooks/useLibrary.ts:17` で `react-hooks/set-state-in-effect` が出ている前提（F1 実装レポートで判明）。

- [ ] **Step 1: 該当ファイルを確認**

```bash
cat src/hooks/useLibrary.ts
```

`useEffect` 内の `setLibrary(...)` 呼び出しが恐らく初期化目的。

- [ ] **Step 2: 初期化を useState の lazy initializer に移す**

例:

```ts
// Before
const [library, setLibrary] = useState<Library>(emptyLibrary);
useEffect(() => {
  setLibrary(loadLibrary());
}, []);

// After
const [library, setLibrary] = useState<Library>(() =>
  typeof window === "undefined" ? emptyLibrary : loadLibrary()
);
```

注: SSR 環境（Next.js Server Component から間接利用）の可能性を考慮し、`typeof window === "undefined"` ガードを入れる。

- [ ] **Step 3: テスト緑を確認**

```bash
pnpm exec vitest run src/hooks/useLibrary.test.ts
```

期待: テスト全 PASS。jsdom 環境なので `typeof window` は常に `"object"` 側。

- [ ] **Step 4: lint 確認**

```bash
pnpm exec eslint src/hooks/useLibrary.ts
```

期待: エラー 0。

- [ ] **Step 5: コミット**

```bash
git add src/hooks/useLibrary.ts
git commit -m "fix(f2): hoist useLibrary init to lazy useState initializer"
```

---

### Task 6: usePlayer を react-hooks 厳格ルール対応

**Files:**
- Modify: `src/hooks/usePlayer.ts`
- Verify: `src/hooks/usePlayer.test.ts`

F1 レポートで `usePlayer.ts:30` に `react-hooks/refs`（render 中に ref を mutate）と `exhaustive-deps` 警告。

- [ ] **Step 1: 該当箇所を確認**

```bash
cat src/hooks/usePlayer.ts
```

render 中の `someRef.current = ...` 代入を特定する。

- [ ] **Step 2: ref mutation を useEffect 内に移す**

```ts
// Before
const ref = useRef<X>(initial);
ref.current = computedValue; // render 中の代入 → エラー

// After
const ref = useRef<X>(initial);
useEffect(() => {
  ref.current = computedValue;
}, [computedValue]);
```

ただし「render 中に最新値を反映したい」目的なら `useEffect` だと反映タイミングが 1 フレーム遅れる。本当に必要なら：

- 状態を `useState` に置く、または
- `useSyncExternalStore` を使う、または
- 明確な意図のもと該当行のみ `// eslint-disable-next-line react-hooks/refs` で許容（コメントで理由を明記）

選択基準: テストが PASS する最小の対処を取る。

- [ ] **Step 3: `react-hooks/exhaustive-deps` 警告も解消**

依存配列に不足があれば追加。`useCallback`/`useMemo` で安定化が必要なら導入。

- [ ] **Step 4: テスト緑を確認**

```bash
pnpm exec vitest run src/hooks/usePlayer.test.ts
```

期待: テスト全 PASS。

- [ ] **Step 5: lint 確認**

```bash
pnpm exec eslint src/hooks/usePlayer.ts
```

期待: エラー 0（警告も解消）。

- [ ] **Step 6: コミット**

```bash
git add src/hooks/usePlayer.ts
git commit -m "fix(f2): comply with react-hooks/refs and exhaustive-deps in usePlayer"
```

---

### Task 7: NowPlayingHero の set-state-in-effect 解消

**Files:**
- Modify: `src/components/NowPlayingHero.tsx`

F1 レポートで `NowPlayingHero.tsx:29, 33` に `react-hooks/set-state-in-effect`。

- [ ] **Step 1: 該当箇所を確認**

```bash
cat src/components/NowPlayingHero.tsx
```

`useEffect(() => { setRevealed(false); }, [index, hideEnglish])` と
`useEffect(() => { if (activePhase === "en") setRevealed(true); }, [activePhase, index])` が問題。

- [ ] **Step 2: 派生値で置換できる箇所を派生に変更**

`revealed` は「行が変わったらリセット」「英語フェーズになったら自動表示」の両方が必要。

解法案:
1. `useState` ではなく `useReducer` で「現在の index / 表示状態」を一緒に管理し、`index` 変化を `dispatch` で扱う（render 中の setState を回避）
2. または、`revealed` 自体を引数化（親で管理し props で渡す）して `NowPlayingHero` 内では状態を持たない
3. または、`activePhase === "en"` の判定は派生値で常に true として `revealed || activePhase === "en"` を直接導出

最も単純な解（推奨）:

```tsx
// Before
const [revealed, setRevealed] = useState(false);
useEffect(() => { setRevealed(false); }, [index, hideEnglish]);
useEffect(() => { if (activePhase === "en") setRevealed(true); }, [activePhase, index]);

// After
const [manualReveal, setManualReveal] = useState<{ index: number; revealed: boolean }>({
  index, revealed: false,
});
// index 変化時の自動リセットは派生で扱う
const isManuallyRevealed = manualReveal.index === index && manualReveal.revealed;
const englishHidden = hideEnglish && !isManuallyRevealed && activePhase !== "en";

// revealNow:
const revealNow = () => {
  if (englishHidden) setManualReveal({ index, revealed: true });
};
```

このパターンなら useEffect 不要・index 変化で自動リセット・activePhase==='en' で自動表示すべてが派生で表現できる。

- [ ] **Step 3: lint 確認**

```bash
pnpm exec eslint src/components/NowPlayingHero.tsx
```

期待: エラー 0。

- [ ] **Step 4: コミット**

```bash
git add src/components/NowPlayingHero.tsx
git commit -m "fix(f2): derive NowPlayingHero reveal state without effect"
```

---

### Task 8: CsvFileInput の react-hooks/refs 対応

**Files:**
- Modify: `src/components/CsvFileInput.tsx`

F1 レポートで `CsvFileInput.tsx:37` に `react-hooks/refs`。

- [ ] **Step 1: 該当箇所を確認**

```bash
cat src/components/CsvFileInput.tsx
```

`onChange` ハンドラ内の `e.target.value = ""` は ref ではなくイベントターゲット操作なので問題なし。問題は render 中の `inputRef.current?.click()` 呼び出し（`openPicker` 関数）が `children` props 経由で render 中に呼ばれるパターン。

実体は `children(open: () => void)` で受け取った関数を click ハンドラ内で呼ぶ前提なので render 中の ref 触りではない。lint がこれを誤検出している可能性。

- [ ] **Step 2: lint の指摘行を正確に特定**

```bash
pnpm exec eslint src/components/CsvFileInput.tsx --format=stylish
```

37 行目に正確に何が書いてあるか確認。

- [ ] **Step 3: 妥当な対処を選択**

ケース A: `inputRef.current` を render 中の式（例: `inputRef.current?.disabled`）で参照している
→ `useImperativeHandle` で値を露出し直す or `useState` で代替

ケース B: lint の誤検出
→ 該当行のみ `// eslint-disable-next-line react-hooks/refs -- 親 children へ open ハンドラを渡すための ref` を付与

- [ ] **Step 4: コミット**

```bash
git add src/components/CsvFileInput.tsx
git commit -m "fix(f2): satisfy react-hooks/refs in CsvFileInput"
```

---

### Task 9: components.json を Next.js / RSC 構成に更新

**Files:**
- Modify: `components.json`

- [ ] **Step 1: 現状確認**

```bash
cat components.json
```

`rsc: false`, `tailwind.css: "src/index.css"` が問題。

- [ ] **Step 2: 以下のように更新**

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "app/globals.css",
    "baseColor": "zinc",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "rtl": false,
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "registries": {}
}
```

注: 既存 shadcn/ui コンポーネントは現状で動作している。`components.json` 更新は将来 `pnpm dlx shadcn@latest add` を使う際の整合性確保が目的。既存ファイルの再生成は行わない。

- [ ] **Step 3: コミット**

```bash
git add components.json
git commit -m "chore(f2): update components.json for next.js app router"
```

---

### Task 10: 全 components / hooks に "use client" ディレクティブを付与

**Files:**
- Modify: 全 `src/components/*.tsx`, `src/hooks/*.ts`, `src/lib/speechInstance.ts`

`src/lib/csv.ts` `src/lib/storage.ts` `src/lib/speech.ts` `src/lib/utils.ts` `src/types.ts` `src/config.ts` は server-safe なので **付与しない**。

`speechInstance.ts` はモジュールトップで `window.speechSynthesis` を触る可能性があるため Client 限定。

- [ ] **Step 1: components 配下に "use client" を付与**

```bash
for f in src/components/AppHeader.tsx src/components/CsvFileInput.tsx src/components/DeckSwitcher.tsx src/components/EmptyState.tsx src/components/NowPlayingHero.tsx src/components/PlayerBar.tsx src/components/SettingsSheet.tsx src/components/UpcomingList.tsx; do
  # 先頭に "use client" が無ければ追加
  head -n1 "$f" | grep -q '"use client"' || (printf '"use client";\n\n' | cat - "$f" > "$f.tmp" && mv "$f.tmp" "$f")
done
```

注: shadcn/ui の `src/components/ui/*` には個別判断で。Radix ベースのインタラクティブなもの（dialog, dropdown-menu, sheet, alert-dialog, radio-group, sonner）は要 "use client"。`button`, `badge`, `card`, `input`, `progress`, `separator` は静的な場合が多いが、Radix slot を使うため安全側に倒して "use client" 付与でよい。

- [ ] **Step 2: shadcn/ui 配下にも "use client" を付与**

```bash
for f in src/components/ui/*.tsx; do
  head -n1 "$f" | grep -q '"use client"' || (printf '"use client";\n\n' | cat - "$f" > "$f.tmp" && mv "$f.tmp" "$f")
done
```

- [ ] **Step 3: hooks 配下に "use client" を付与**

```bash
for f in src/hooks/*.ts; do
  # テストファイルは除外
  case "$f" in *.test.ts) continue ;; esac
  head -n1 "$f" | grep -q '"use client"' || (printf '"use client";\n\n' | cat - "$f" > "$f.tmp" && mv "$f.tmp" "$f")
done
```

注: hooks ファイル単体で "use client" は必須ではない（呼び出し元 Client Component から呼ばれる前提）が、付与しても害は無く、SSR 環境での誤利用を防ぐ意味でも有効。

- [ ] **Step 4: speechInstance に "use client" 付与**

```bash
head -n1 src/lib/speechInstance.ts | grep -q '"use client"' || (printf '"use client";\n\n' | cat - src/lib/speechInstance.ts > src/lib/speechInstance.ts.tmp && mv src/lib/speechInstance.ts.tmp src/lib/speechInstance.ts)
```

- [ ] **Step 5: テスト緑を確認**

```bash
pnpm test:run
```

期待: 全テスト PASS。

- [ ] **Step 6: コミット**

```bash
git add -A src/
git commit -m 'chore(f2): mark client components/hooks with "use client"'
```

---

### Task 11: LibraryShell（旧 src/App.tsx 相当）を作成

**Files:**
- Create: `src/app-shell/LibraryShell.tsx`

src/App.tsx は F1 で削除済み。GIT 履歴から内容を取得して移植する。

- [ ] **Step 1: 既存 src/App.tsx の最後のバージョンを git から取得**

```bash
git show feat/migrate-next~9:src/App.tsx > /tmp/old-app.tsx
cat /tmp/old-app.tsx
```

（`~9` は Phase A の Vite 削除コミット直前。実際の SHA は `git log --oneline | grep "wire all"` 等で `b6b4716` の親より前を探す。`8729209 feat: wire all components in App.tsx` あたりが該当）

具体的には:

```bash
git show 8729209:src/App.tsx > /tmp/old-app.tsx
```

- [ ] **Step 2: LibraryShell.tsx を作成**

```bash
mkdir -p src/app-shell
```

`src/app-shell/LibraryShell.tsx` 全体を以下の構造に書く（旧 App.tsx の中身をベースに調整）:

```tsx
"use client";

import { Toaster } from "@/components/ui/sonner";
import { AppHeader } from "@/components/AppHeader";
// ... 残りの import は旧 App.tsx と同等

// 旧 App.tsx の関数本体をそのまま LibraryShell として export
export function LibraryShell() {
  // 旧 App() のロジックをそのままコピー
  // ...
}
```

ポイント:
- 関数名を `App` → `LibraryShell` に変更
- export を `default` から `named` (`export function LibraryShell`) に変更
- 先頭に `"use client"` 必須
- import path はすべて `@/...` のまま（変更不要）

- [ ] **Step 3: 型エラーが無いことを確認**

```bash
pnpm typecheck
```

期待: エラー 0。

- [ ] **Step 4: lint 確認**

```bash
pnpm exec eslint src/app-shell/LibraryShell.tsx
```

期待: エラー 0。

- [ ] **Step 5: コミット**

```bash
git add src/app-shell/LibraryShell.tsx
git commit -m "feat(f2): port app shell into src/app-shell/LibraryShell.tsx"
```

---

### Task 12: app/page.tsx を LibraryShell の薄いコンテナに更新

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: 現状 app/page.tsx を確認**

```bash
cat app/page.tsx
```

F1 で書かれた placeholder（"English Audio PWA" 見出し）が入っている。

- [ ] **Step 2: 以下に置換**

```tsx
import { LibraryShell } from "@/app-shell/LibraryShell";

export default function Page() {
  return <LibraryShell />;
}
```

注: `app/page.tsx` は Server Component（"use client" なし）のまま。`LibraryShell` 自体が Client Component なのでクライアント側で hydrate される。

- [ ] **Step 3: dev 起動して動作確認**

```bash
pnpm dev
```

`http://localhost:3000` でライブラリ画面が表示され、CSV ファイルをアップロードしてデッキ追加→再生開始まで一連の動作を確認する。

確認項目（最低限）:
- ヘッダー / 空状態の表示
- CSV インポート（既存のサンプル CSV を使用）
- デッキ切替
- 再生開始 / 一時停止 / 停止（長押し）
- テーマ切替（light / dark / system）

`Ctrl+C` で停止。

- [ ] **Step 4: コミット**

```bash
git add app/page.tsx
git commit -m "feat(f2): wire LibraryShell from app/page.tsx"
```

---

### Task 13: app/layout.tsx でテーマ初期化スクリプトを追加（FOUC 防止）

**Files:**
- Modify: `app/layout.tsx`

`useTheme` フックは初回マウント時に DOM に `.dark` を付与するため、初回 SSR では一瞬ライト表示になり得る。

- [ ] **Step 1: layout.tsx を更新**

`app/layout.tsx` を以下に書き換え:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "English Audio PWA",
  description: "日本語と英語の例文を読み上げる学習用PWA",
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

注: `THEME_STORAGE_KEY` はリテラル `'english-audio-pwa:theme'` を直接書く（Server Component なので config.ts からの import でも問題ないが、`script` タグへの埋め込みは文字列リテラルが明示的）。

- [ ] **Step 2: dev で再確認**

```bash
pnpm dev
```

ダークモードに切替後リロードして、白チラ（FOUC）が起きないことを確認。

`Ctrl+C` で停止。

- [ ] **Step 3: コミット**

```bash
git add app/layout.tsx
git commit -m "feat(f2): pre-hydrate dark class to avoid theme FOUC"
```

---

### Task 14: eslint.config.js の src 除外を解除

**Files:**
- Modify: `eslint.config.js`

- [ ] **Step 1: globalIgnores から 'src' を外す**

```js
// Before
globalIgnores(['.next', 'dist', 'node_modules', 'src']),

// After
globalIgnores(['.next', 'dist', 'node_modules']),
```

- [ ] **Step 2: lint 全体実行**

```bash
pnpm lint
```

期待: エラー 0。警告のみであれば許容。

- [ ] **Step 3: もしエラーが残れば該当ファイルを修正**

Task 4-8 で対処漏れがあれば該当箇所を最小修正してコミット分割する。

- [ ] **Step 4: コミット**

```bash
git add eslint.config.js
git commit -m "chore(f2): re-enable eslint on src/ after F2 migration"
```

---

### Task 15: 最終検証

**Files:** なし

- [ ] **Step 1: クリーンインストール**

```bash
rm -rf node_modules .next
pnpm install
```

期待: エラーなく完了。

- [ ] **Step 2: typecheck**

```bash
pnpm typecheck
```

期待: PASS。

- [ ] **Step 3: lint**

```bash
pnpm lint
```

期待: エラー 0。

- [ ] **Step 4: test:run**

```bash
pnpm test:run
```

期待: 既存 52 テスト + 移植時に追加分すべて PASS。

- [ ] **Step 5: build**

```bash
pnpm build
```

期待: ✓ Compiled successfully、`/` ルート + `/_not-found` の 2 ルート。

- [ ] **Step 6: dev 起動と手動疎通**

```bash
pnpm dev
```

UI の全機能（CSV インポート、再生、デッキ切替、テーマ切替、暗記モード/読み上げモード切替）を `http://localhost:3000` で目視確認。

`Ctrl+C` で停止。

- [ ] **Step 7: 最終コミット（必要なら）**

```bash
git add -A
git status  # 何も無ければスキップ
git commit -m "chore(f2): final verification cleanup"
```

---

### Task 16: F2 plan のチェックリスト更新と完了レポート追記

**Files:**
- Modify: `docs/superpowers/plans/2026-05-28-sub1-f2-port-components.md`
- Modify: `docs/superpowers/specs/2026-05-28-auth-sync-foundation-design.md`

- [ ] **Step 1: 本 plan の全 checkbox を `- [x]` に置換**

`docs/superpowers/plans/2026-05-28-sub1-f2-port-components.md` の `- [ ]` を `- [x]` に一括置換。

- [ ] **Step 2: 実装完了レポート章を追加**

巻末に「## 実装完了レポート（YYYY-MM-DD）」章を追加し、以下を記録:
- 作成コミット数と最終 SHA
- typecheck / lint / test:run / build の結果
- spec から逸脱した点（あれば）
- F3 への申し送り事項

- [ ] **Step 3: 親 spec のフェーズ表を更新**

`docs/superpowers/specs/2026-05-28-auth-sync-foundation-design.md` の section 10 のフェーズ表で F2 の状態を「🔄 着手中」→「✅ 完了」へ変更。F3 を「🔄 着手中」に。

- [ ] **Step 4: コミット**

```bash
git add docs/
git commit -m "docs(f2): mark F2 plan complete and update sub-project status"
```

---

## 完了基準（このplan全体）

- [ ] `feat/migrate-next` ブランチ上で全タスクの「完了基準」がチェック済み
- [ ] `pnpm typecheck` / `pnpm lint` / `pnpm test:run` / `pnpm build` 全て成功
- [ ] `pnpm dev` で既存機能（読み上げモード・暗記モード切替・デッキ管理・テーマ切替）が手動確認で動作
- [ ] `eslint.config.js` の `globalIgnores` から `'src'` が外れている（再有効化済み）
- [ ] components.json が Next.js App Router 構成（`rsc: true`, `css: "app/globals.css"`）
- [ ] 親 spec のフェーズ表で F2 が完了マーク
