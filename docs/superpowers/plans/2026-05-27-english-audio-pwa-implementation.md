# English Audio PWA 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 日本語/英語の2列CSVを読み込み、ブラウザ内蔵TTSで「日→英→次行」と読み上げる、shadcn/ui ベースの高品質オフラインPWAを構築し、Vercel に公開する。

**Architecture:** Vite + React 19 + TypeScript（strict）。Tailwind CSS v4 + shadcn/ui（new-york, Zinc + Violet）でUI。Web Speech API で音声、localStorage で永続化。Service Worker は vite-plugin-pwa で生成。状態は React hooks のみ（Redux等は不採用）。

**Tech Stack:** Vite, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, lucide-react, sonner, vite-plugin-pwa, Vitest, React Testing Library, Vercel

**前提:**
- 作業ディレクトリ: `~/dev-study/english-audio-pwa/`
- 既存ファイル: `docs/` 配下の仕様書のみ、`.git` 初期化済み
- パッケージマネージャ: `pnpm`（無ければ `npm install -g pnpm` で導入）
- Node.js 20+ が必要

---

## Task 1: Vite + React + TypeScript プロジェクトを初期化

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `.gitignore`

- [ ] **Step 1: 一時ディレクトリにテンプレートを展開**

Run:
```bash
cd ~/dev-study/english-audio-pwa
pnpm create vite@latest .scaffold-tmp --template react-ts
```
Expected: `.scaffold-tmp/` 配下にテンプレート展開、最後に `cd .scaffold-tmp && pnpm install` の案内

- [ ] **Step 2: 内容を現在ディレクトリに展開し、テンプレを削除**

Run:
```bash
cp -R .scaffold-tmp/. .
rm -rf .scaffold-tmp
```
Expected: `package.json`, `vite.config.ts`, `src/`, `public/` などが現在ディレクトリ直下に出現

- [ ] **Step 3: テンプレ同梱の不要ファイルを削除**

Run:
```bash
rm -f src/App.css public/vite.svg src/assets/react.svg
rmdir src/assets 2>/dev/null
```
Expected: 余分な雛形ファイルが消える

- [ ] **Step 4: 依存をインストール**

Run:
```bash
pnpm install
```
Expected: `node_modules/` 生成、エラーなく終了

- [ ] **Step 5: パスエイリアスを `tsconfig.app.json` と `vite.config.ts` に追加**

Edit `tsconfig.app.json` — `compilerOptions` に追記:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

Edit `vite.config.ts`:
```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

- [ ] **Step 6: `src/App.tsx` を最小に置換、Hello表示で動作確認**

Replace `src/App.tsx`:
```tsx
export default function App() {
  return <div className="p-4">English Audio PWA</div>;
}
```

Replace `src/main.tsx`（StrictModeのみ保持、CSSは後で追加）:
```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 7: 起動確認**

Run: `pnpm dev`
Expected: `http://localhost:5173/` で "English Audio PWA" が表示される。確認後 Ctrl+C で停止。

- [ ] **Step 8: コミット**

```bash
git add -A
git commit -m "chore: scaffold vite + react + typescript project"
```

---

## Task 2: Tailwind CSS v4 を導入

**Files:**
- Create: `src/index.css`
- Modify: `vite.config.ts`, `src/main.tsx`

- [ ] **Step 1: Tailwind と Vite プラグインをインストール**

Run:
```bash
pnpm add -D tailwindcss @tailwindcss/vite
```
Expected: `package.json` に依存追加

- [ ] **Step 2: `vite.config.ts` にプラグイン追加**

Edit `vite.config.ts`:
```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

- [ ] **Step 3: `src/index.css` 作成（後でshadcn/uiが上書きするが最低限）**

Create `src/index.css`:
```css
@import "tailwindcss";

html, body, #root {
  height: 100%;
}
```

- [ ] **Step 4: `src/main.tsx` でCSSをインポート**

Edit `src/main.tsx` — 先頭にインポート行を追加:
```tsx
import "./index.css";
```

- [ ] **Step 5: Tailwindが効くことを確認**

Edit `src/App.tsx`:
```tsx
export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100">
      <p className="text-2xl font-semibold">English Audio PWA</p>
    </div>
  );
}
```

Run: `pnpm dev`
Expected: 黒背景・白文字の中央寄せ表示。確認後 Ctrl+C。

- [ ] **Step 6: コミット**

```bash
git add -A
git commit -m "chore: add tailwind css v4 with vite plugin"
```

---

## Task 3: shadcn/ui を初期化

**Files:**
- Create: `components.json`, `src/lib/utils.ts`, `src/components/ui/*.tsx`
- Modify: `src/index.css`, `tsconfig.app.json`

- [ ] **Step 1: shadcn/ui CLI で初期化**

Run:
```bash
pnpm dlx shadcn@latest init
```

対話プロンプト:
- Style: **New York**
- Base color: **Zinc**
- CSS variables: **Yes**

Expected: `components.json` が作成され、`src/index.css` にCSS変数が追記される。`src/lib/utils.ts` が生成される。

- [ ] **Step 2: アクセントを Violet に変更（CSS変数を上書き）**

Edit `src/index.css` — shadcn が生成した `:root` と `.dark` ブロック内の `--primary` 関連を以下に置換（他のトークンは保持）:

```css
:root {
  --primary: oklch(0.541 0.281 293.009);          /* violet-600 */
  --primary-foreground: oklch(0.985 0 0);
  --ring: oklch(0.541 0.281 293.009);
}

.dark {
  --primary: oklch(0.606 0.250 292.717);           /* violet-500 */
  --primary-foreground: oklch(0.985 0 0);
  --ring: oklch(0.606 0.250 292.717);
}
```

注: shadcn 初期化版で既に他のトークン（background, foreground, card 等）が定義されている。`--primary` 系のみ上書きする。

- [ ] **Step 3: 必要な UI コンポーネントを追加**

Run:
```bash
pnpm dlx shadcn@latest add button card progress alert-dialog sheet sonner badge radio-group separator
```
Expected: `src/components/ui/` 配下に各ファイル生成、依存（`@radix-ui/*`, `class-variance-authority`, `clsx`, `tailwind-merge`, `sonner`, `lucide-react`）が自動インストールされる

- [ ] **Step 4: ボタンが動くか確認**

Edit `src/App.tsx`:
```tsx
import { Button } from "@/components/ui/button";

export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center gap-2 bg-background text-foreground">
      <Button>Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
    </div>
  );
}
```

Run: `pnpm dev`
Expected: 3つのボタンがshadcnのスタイルで描画される。Violet基調になっていること。確認後 Ctrl+C。

- [ ] **Step 5: コミット**

```bash
git add -A
git commit -m "chore: init shadcn/ui (new-york, zinc + violet)"
```

---

## Task 4: Vitest + React Testing Library 環境を整備

**Files:**
- Create: `src/test/setup.ts`, `vitest.config.ts`
- Modify: `package.json`

- [ ] **Step 1: テスト依存をインストール**

Run:
```bash
pnpm add -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 2: `vitest.config.ts` 作成**

Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

- [ ] **Step 3: `src/test/setup.ts` 作成**

Create `src/test/setup.ts`:
```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4: `package.json` にスクリプト追加**

Edit `package.json` の `scripts` セクション:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:run": "vitest run"
  }
}
```

- [ ] **Step 5: スモークテストを書いて実行**

Create `src/test/smoke.test.ts`:
```ts
import { describe, it, expect } from "vitest";

describe("smoke", () => {
  it("vitest works", () => {
    expect(1 + 1).toBe(2);
  });
});
```

Run: `pnpm test:run`
Expected: 1 passed.

- [ ] **Step 6: スモークテストを削除**

Run:
```bash
rm src/test/smoke.test.ts
```

- [ ] **Step 7: コミット**

```bash
git add -A
git commit -m "chore: set up vitest + react testing library"
```

---

## Task 5: 型定義と設定定数

**Files:**
- Create: `src/types.ts`, `src/config.ts`

- [ ] **Step 1: 型定義を作成**

Create `src/types.ts`:
```ts
export type Pair = { ja: string; en: string };

export type Deck = {
  name: string;
  pairs: Pair[];
  importedAt: number;
};

export type Phase = "ja" | "en";

export type PlayerState =
  | { kind: "idle" }
  | { kind: "playing"; index: number; phase: Phase }
  | { kind: "paused"; index: number; phase: Phase };

export type Theme = "light" | "dark" | "system";
```

- [ ] **Step 2: 設定定数を作成**

Create `src/config.ts`:
```ts
export const STORAGE_KEY = "english-audio-pwa:deck";
export const THEME_STORAGE_KEY = "english-audio-pwa:theme";

export const SILENCE_JA_TO_EN_MS = 400;
export const SILENCE_BETWEEN_ROWS_MS = 800;

export const LANG_JA = "ja-JP";
export const LANG_EN = "en-US";

export const STOP_LONG_PRESS_MS = 1500;
```

- [ ] **Step 3: コミット**

```bash
git add -A
git commit -m "feat: add core types and config constants"
```

---

## Task 6: CSV パーサー（TDD）

**Files:**
- Create: `src/lib/csv.ts`
- Test: `src/lib/csv.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

Create `src/lib/csv.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { parseCsv } from "./csv";

describe("parseCsv", () => {
  it("2列の基本CSVをパースする", () => {
    const input = "おはよう,Good morning\nありがとう,Thank you";
    expect(parseCsv(input)).toEqual([
      { ja: "おはよう", en: "Good morning" },
      { ja: "ありがとう", en: "Thank you" },
    ]);
  });

  it("典型的なヘッダ行をスキップする（日本語/英語）", () => {
    const input = "日本語,英語\nおはよう,Good morning";
    expect(parseCsv(input)).toEqual([
      { ja: "おはよう", en: "Good morning" },
    ]);
  });

  it("典型的なヘッダ行をスキップする（ja/en、大文字小文字無視）", () => {
    const input = "JA,EN\nおはよう,Good morning";
    expect(parseCsv(input)).toEqual([
      { ja: "おはよう", en: "Good morning" },
    ]);
  });

  it("ヘッダでなければ1行目もデータとして扱う", () => {
    const input = "おはよう,Good morning\nありがとう,Thank you";
    expect(parseCsv(input)).toHaveLength(2);
  });

  it("空行をスキップする", () => {
    const input = "おはよう,Good morning\n\nありがとう,Thank you\n";
    expect(parseCsv(input)).toHaveLength(2);
  });

  it("3列目以降は無視する", () => {
    const input = "おはよう,Good morning,ignored,extra";
    expect(parseCsv(input)).toEqual([
      { ja: "おはよう", en: "Good morning" },
    ]);
  });

  it("ダブルクォート囲みのカンマを処理する", () => {
    const input = `"こんにちは, さん","Hello, sir"`;
    expect(parseCsv(input)).toEqual([
      { ja: "こんにちは, さん", en: "Hello, sir" },
    ]);
  });

  it("2列未満の行はスキップする", () => {
    const input = "おはよう\nありがとう,Thank you";
    expect(parseCsv(input)).toEqual([
      { ja: "ありがとう", en: "Thank you" },
    ]);
  });

  it("両端の空白をトリムする", () => {
    const input = "  おはよう  ,  Good morning  ";
    expect(parseCsv(input)).toEqual([
      { ja: "おはよう", en: "Good morning" },
    ]);
  });
});
```

- [ ] **Step 2: テスト実行 → 失敗確認**

Run: `pnpm test:run src/lib/csv.test.ts`
Expected: FAIL（ファイル未存在）

- [ ] **Step 3: 実装する**

Create `src/lib/csv.ts`:
```ts
import type { Pair } from "@/types";

const HEADER_TOKENS = ["日本語", "英語", "japanese", "english", "ja", "en"];

function parseLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuote) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuote = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuote = true;
      } else if (ch === ",") {
        cells.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }
  cells.push(current);
  return cells;
}

function isHeaderRow(cells: string[]): boolean {
  return cells.slice(0, 2).some((cell) =>
    HEADER_TOKENS.includes(cell.trim().toLowerCase()),
  );
}

export function parseCsv(input: string): Pair[] {
  const lines = input
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return [];

  const startIndex = isHeaderRow(parseLine(lines[0])) ? 1 : 0;

  const pairs: Pair[] = [];
  for (let i = startIndex; i < lines.length; i++) {
    const cells = parseLine(lines[i]);
    if (cells.length < 2) continue;
    const ja = cells[0].trim();
    const en = cells[1].trim();
    if (!ja || !en) continue;
    pairs.push({ ja, en });
  }
  return pairs;
}
```

- [ ] **Step 4: テスト実行 → 全合格**

Run: `pnpm test:run src/lib/csv.test.ts`
Expected: 9 passed.

- [ ] **Step 5: コミット**

```bash
git add -A
git commit -m "feat: add csv parser with header auto-detection and quote handling"
```

---

## Task 7: localStorage ストレージ（TDD）

**Files:**
- Create: `src/lib/storage.ts`
- Test: `src/lib/storage.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

Create `src/lib/storage.test.ts`:
```ts
import { describe, it, expect, beforeEach } from "vitest";
import { loadDeck, saveDeck, clearDeck } from "./storage";
import { STORAGE_KEY } from "@/config";
import type { Deck } from "@/types";

describe("storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("デッキが無いとき loadDeck は null を返す", () => {
    expect(loadDeck()).toBeNull();
  });

  it("save → load で同じデッキが取れる", () => {
    const deck: Deck = {
      name: "lessons_28",
      pairs: [{ ja: "おはよう", en: "Good morning" }],
      importedAt: 1700000000000,
    };
    saveDeck(deck);
    expect(loadDeck()).toEqual(deck);
  });

  it("clearDeck でデッキを消せる", () => {
    saveDeck({ name: "x", pairs: [], importedAt: 0 });
    clearDeck();
    expect(loadDeck()).toBeNull();
  });

  it("壊れたJSONの場合 null を返す（既存データは破棄）", () => {
    localStorage.setItem(STORAGE_KEY, "{broken json");
    expect(loadDeck()).toBeNull();
  });
});
```

- [ ] **Step 2: テスト実行 → 失敗確認**

Run: `pnpm test:run src/lib/storage.test.ts`
Expected: FAIL

- [ ] **Step 3: 実装**

Create `src/lib/storage.ts`:
```ts
import { STORAGE_KEY } from "@/config";
import type { Deck } from "@/types";

export function loadDeck(): Deck | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Deck;
  } catch {
    return null;
  }
}

export function saveDeck(deck: Deck): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(deck));
}

export function clearDeck(): void {
  localStorage.removeItem(STORAGE_KEY);
}
```

- [ ] **Step 4: テスト実行 → 全合格**

Run: `pnpm test:run src/lib/storage.test.ts`
Expected: 4 passed.

- [ ] **Step 5: コミット**

```bash
git add -A
git commit -m "feat: add deck storage with localStorage"
```

---

## Task 8: Web Speech API ラッパ（TDD）

**Files:**
- Create: `src/lib/speech.ts`
- Test: `src/lib/speech.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

Create `src/lib/speech.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSpeech } from "./speech";

class MockUtterance {
  text: string;
  lang = "";
  onend: (() => void) | null = null;
  onerror: ((e: SpeechSynthesisErrorEvent) => void) | null = null;
  constructor(text: string) {
    this.text = text;
  }
}

let queue: MockUtterance[] = [];

beforeEach(() => {
  queue = [];
  vi.stubGlobal("SpeechSynthesisUtterance", MockUtterance);
  vi.stubGlobal("speechSynthesis", {
    speak: (u: MockUtterance) => {
      queue.push(u);
      // 同期的に完了イベントを発火
      queueMicrotask(() => u.onend?.());
    },
    cancel: () => {
      queue = [];
    },
    pause: vi.fn(),
    resume: vi.fn(),
    getVoices: () => [],
  });
});

describe("createSpeech", () => {
  it("speak は完了時に resolve する", async () => {
    const speech = createSpeech();
    await expect(speech.speak("hello", "en-US")).resolves.toBeUndefined();
  });

  it("speak は lang を utterance に渡す", async () => {
    const speech = createSpeech();
    await speech.speak("こんにちは", "ja-JP");
    expect(queue[0].lang).toBe("ja-JP");
  });

  it("speak はエラー時に reject する", async () => {
    vi.stubGlobal("speechSynthesis", {
      speak: (u: MockUtterance) => {
        queueMicrotask(() =>
          u.onerror?.({ error: "synthesis-failed" } as SpeechSynthesisErrorEvent),
        );
      },
      cancel: vi.fn(),
    });
    const speech = createSpeech();
    await expect(speech.speak("x", "en-US")).rejects.toThrow();
  });

  it("cancel は speechSynthesis.cancel を呼ぶ", () => {
    const cancelSpy = vi.fn();
    vi.stubGlobal("speechSynthesis", {
      speak: vi.fn(),
      cancel: cancelSpy,
    });
    const speech = createSpeech();
    speech.cancel();
    expect(cancelSpy).toHaveBeenCalled();
  });

  it("isSupported は SpeechSynthesisUtterance が無いと false", () => {
    vi.stubGlobal("speechSynthesis", undefined);
    const speech = createSpeech();
    expect(speech.isSupported()).toBe(false);
  });
});
```

- [ ] **Step 2: 実装**

Create `src/lib/speech.ts`:
```ts
export type Speech = {
  speak: (text: string, lang: string) => Promise<void>;
  cancel: () => void;
  isSupported: () => boolean;
};

export function createSpeech(): Speech {
  return {
    speak(text, lang) {
      return new Promise<void>((resolve, reject) => {
        if (typeof speechSynthesis === "undefined") {
          reject(new Error("speechSynthesis not available"));
          return;
        }
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.onend = () => resolve();
        utterance.onerror = (e) =>
          reject(new Error(`speech error: ${e.error ?? "unknown"}`));
        speechSynthesis.speak(utterance);
      });
    },
    cancel() {
      if (typeof speechSynthesis !== "undefined") {
        speechSynthesis.cancel();
      }
    },
    isSupported() {
      return (
        typeof speechSynthesis !== "undefined" &&
        typeof SpeechSynthesisUtterance !== "undefined"
      );
    },
  };
}
```

- [ ] **Step 3: テスト実行 → 全合格**

Run: `pnpm test:run src/lib/speech.test.ts`
Expected: 5 passed.

- [ ] **Step 4: コミット**

```bash
git add -A
git commit -m "feat: add web speech api wrapper"
```

---

## Task 9: useTheme フック

**Files:**
- Create: `src/hooks/useTheme.ts`

- [ ] **Step 1: 実装**

Create `src/hooks/useTheme.ts`:
```ts
import { useEffect, useState, useCallback } from "react";
import type { Theme } from "@/types";
import { THEME_STORAGE_KEY } from "@/config";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", isDark);
}

function loadTheme(): Theme {
  const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
  return stored ?? "system";
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => loadTheme());

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => applyTheme("system");
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
  }, []);

  return { theme, setTheme };
}
```

- [ ] **Step 2: ビルドが通ることを確認**

Run: `pnpm build`
Expected: エラーなく `dist/` 生成

- [ ] **Step 3: コミット**

```bash
git add -A
git commit -m "feat: add useTheme hook (light/dark/system)"
```

---

## Task 10: useDeck フック

**Files:**
- Create: `src/hooks/useDeck.ts`
- Test: `src/hooks/useDeck.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

Create `src/hooks/useDeck.test.ts`:
```ts
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDeck } from "./useDeck";

describe("useDeck", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("初期状態はnull", () => {
    const { result } = renderHook(() => useDeck());
    expect(result.current.deck).toBeNull();
  });

  it("CSV読み込みでデッキがセットされる", async () => {
    const { result } = renderHook(() => useDeck());
    await act(async () => {
      await result.current.importCsv(
        "lessons.csv",
        "おはよう,Good morning\nありがとう,Thank you",
      );
    });
    expect(result.current.deck?.pairs).toHaveLength(2);
    expect(result.current.deck?.name).toBe("lessons");
  });

  it("clearDeck でリセットされる", async () => {
    const { result } = renderHook(() => useDeck());
    await act(async () => {
      await result.current.importCsv("x.csv", "a,b");
    });
    act(() => result.current.clear());
    expect(result.current.deck).toBeNull();
  });

  it("空のCSVは throw する", async () => {
    const { result } = renderHook(() => useDeck());
    await expect(
      act(async () => {
        await result.current.importCsv("empty.csv", "");
      }),
    ).rejects.toThrow();
  });
});
```

- [ ] **Step 2: 実装**

Create `src/hooks/useDeck.ts`:
```ts
import { useEffect, useState, useCallback } from "react";
import type { Deck } from "@/types";
import { parseCsv } from "@/lib/csv";
import { loadDeck, saveDeck, clearDeck } from "@/lib/storage";

export function useDeck() {
  const [deck, setDeck] = useState<Deck | null>(null);

  useEffect(() => {
    setDeck(loadDeck());
  }, []);

  const importCsv = useCallback(async (filename: string, content: string) => {
    const pairs = parseCsv(content);
    if (pairs.length === 0) {
      throw new Error("有効な行がありません");
    }
    const name = filename.replace(/\.[^.]+$/, "");
    const next: Deck = { name, pairs, importedAt: Date.now() };
    saveDeck(next);
    setDeck(next);
  }, []);

  const clear = useCallback(() => {
    clearDeck();
    setDeck(null);
  }, []);

  return { deck, importCsv, clear };
}
```

- [ ] **Step 3: テスト実行 → 全合格**

Run: `pnpm test:run src/hooks/useDeck.test.ts`
Expected: 4 passed.

- [ ] **Step 4: コミット**

```bash
git add -A
git commit -m "feat: add useDeck hook"
```

---

## Task 11: usePlayer フック（再生ステートマシン）

**Files:**
- Create: `src/hooks/usePlayer.ts`
- Test: `src/hooks/usePlayer.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

Create `src/hooks/usePlayer.test.ts`:
```ts
import { describe, it, expect, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { usePlayer } from "./usePlayer";
import type { Pair } from "@/types";
import type { Speech } from "@/lib/speech";

function makeSpeech(): Speech & { calls: { text: string; lang: string }[] } {
  const calls: { text: string; lang: string }[] = [];
  return {
    calls,
    speak: vi.fn(async (text, lang) => {
      calls.push({ text, lang });
    }),
    cancel: vi.fn(),
    isSupported: () => true,
  };
}

const pairs: Pair[] = [
  { ja: "おはよう", en: "Good morning" },
  { ja: "ありがとう", en: "Thank you" },
];

describe("usePlayer", () => {
  it("初期状態は idle", () => {
    const speech = makeSpeech();
    const { result } = renderHook(() => usePlayer(pairs, speech));
    expect(result.current.state.kind).toBe("idle");
  });

  it("play で playing に遷移し、ja → en の順で speak される", async () => {
    const speech = makeSpeech();
    const { result } = renderHook(() => usePlayer(pairs, speech));
    act(() => result.current.play());
    await waitFor(() => {
      expect(speech.calls.length).toBeGreaterThanOrEqual(2);
    });
    expect(speech.calls[0]).toEqual({ text: "おはよう", lang: "ja-JP" });
    expect(speech.calls[1]).toEqual({ text: "Good morning", lang: "en-US" });
  });

  it("最終行のen完了後 idle に戻る", async () => {
    const speech = makeSpeech();
    const { result } = renderHook(() => usePlayer(pairs, speech));
    act(() => result.current.play());
    await waitFor(() => {
      expect(result.current.state.kind).toBe("idle");
    }, { timeout: 3000 });
  });

  it("next/prev で index が変わる", () => {
    const speech = makeSpeech();
    const { result } = renderHook(() => usePlayer(pairs, speech));
    act(() => result.current.next());
    expect(result.current.index).toBe(1);
    act(() => result.current.prev());
    expect(result.current.index).toBe(0);
  });

  it("next は範囲外に出ない", () => {
    const speech = makeSpeech();
    const { result } = renderHook(() => usePlayer(pairs, speech));
    act(() => result.current.next());
    act(() => result.current.next());
    expect(result.current.index).toBe(1);
  });

  it("stop で idle に戻り cancel される", () => {
    const speech = makeSpeech();
    const { result } = renderHook(() => usePlayer(pairs, speech));
    act(() => result.current.play());
    act(() => result.current.stop());
    expect(result.current.state.kind).toBe("idle");
    expect(speech.cancel).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: 実装**

Create `src/hooks/usePlayer.ts`:
```ts
import { useCallback, useEffect, useRef, useState } from "react";
import type { Pair, PlayerState } from "@/types";
import type { Speech } from "@/lib/speech";
import {
  LANG_JA,
  LANG_EN,
  SILENCE_JA_TO_EN_MS,
  SILENCE_BETWEEN_ROWS_MS,
} from "@/config";

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function usePlayer(pairs: Pair[], speech: Speech) {
  const [state, setState] = useState<PlayerState>({ kind: "idle" });
  const [index, setIndex] = useState(0);
  const runIdRef = useRef(0);

  const stop = useCallback(() => {
    runIdRef.current++;
    speech.cancel();
    setState({ kind: "idle" });
  }, [speech]);

  const runFrom = useCallback(
    async (startIndex: number) => {
      if (pairs.length === 0) return;
      const myRunId = ++runIdRef.current;
      let i = startIndex;
      while (i < pairs.length) {
        if (runIdRef.current !== myRunId) return;
        setState({ kind: "playing", index: i, phase: "ja" });
        setIndex(i);
        await speech.speak(pairs[i].ja, LANG_JA);
        if (runIdRef.current !== myRunId) return;
        await sleep(SILENCE_JA_TO_EN_MS);
        if (runIdRef.current !== myRunId) return;
        setState({ kind: "playing", index: i, phase: "en" });
        await speech.speak(pairs[i].en, LANG_EN);
        if (runIdRef.current !== myRunId) return;
        if (i < pairs.length - 1) await sleep(SILENCE_BETWEEN_ROWS_MS);
        i++;
      }
      if (runIdRef.current === myRunId) {
        setState({ kind: "idle" });
      }
    },
    [pairs, speech],
  );

  const play = useCallback(() => {
    void runFrom(index);
  }, [runFrom, index]);

  const next = useCallback(() => {
    setIndex((i) => Math.min(i + 1, Math.max(pairs.length - 1, 0)));
  }, [pairs.length]);

  const prev = useCallback(() => {
    setIndex((i) => Math.max(i - 1, 0));
  }, []);

  useEffect(() => {
    return () => {
      runIdRef.current++;
      speech.cancel();
    };
  }, [speech]);

  return { state, index, play, stop, next, prev };
}
```

- [ ] **Step 3: テスト実行 → 全合格**

Run: `pnpm test:run src/hooks/usePlayer.test.ts`
Expected: 6 passed.

- [ ] **Step 4: コミット**

```bash
git add -A
git commit -m "feat: add usePlayer hook with state machine"
```

---

## Task 12: AppHeader コンポーネント

**Files:**
- Create: `src/components/AppHeader.tsx`

- [ ] **Step 1: 実装**

Create `src/components/AppHeader.tsx`:
```tsx
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  onOpenSettings: () => void;
};

export function AppHeader({ onOpenSettings }: Props) {
  return (
    <header className="sticky top-0 z-10 h-14 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-full max-w-2xl items-center justify-between px-4 sm:px-6">
        <h1 className="text-sm font-semibold tracking-tight">
          English Audio PWA
        </h1>
        <Button
          variant="ghost"
          size="icon"
          aria-label="設定を開く"
          onClick={onOpenSettings}
        >
          <Settings className="size-5" />
        </Button>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: コミット**

```bash
git add -A
git commit -m "feat: add AppHeader component"
```

---

## Task 13: EmptyState コンポーネント

**Files:**
- Create: `src/components/EmptyState.tsx`

- [ ] **Step 1: 実装**

Create `src/components/EmptyState.tsx`:
```tsx
import { BookOpen, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  onPickFile: () => void;
};

export function EmptyState({ onPickFile }: Props) {
  return (
    <section className="mx-auto flex max-w-2xl flex-col items-center px-4 pt-16 text-center sm:px-6">
      <div className="flex size-16 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <BookOpen className="size-7" aria-hidden />
      </div>
      <h2 className="mt-6 text-2xl font-semibold tracking-tight">
        デッキがありません
      </h2>
      <p className="mt-2 max-w-sm text-base text-muted-foreground leading-relaxed">
        2列のCSV（1列目: 日本語、2列目: 英語）を読み込んで始めましょう。
      </p>
      <Button size="lg" className="mt-8 h-12 px-6" onClick={onPickFile}>
        <FileUp className="size-5" />
        CSVを読み込む
      </Button>
      <div className="mt-10 w-full max-w-sm">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          フォーマット例
        </p>
        <pre className="mt-2 rounded-md border bg-card p-3 text-left text-xs text-card-foreground">
{`おはよう,Good morning
ありがとう,Thank you
いただきます,Let's eat`}
        </pre>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: コミット**

```bash
git add -A
git commit -m "feat: add EmptyState component"
```

---

## Task 14: DeckCard と UpcomingList コンポーネント

**Files:**
- Create: `src/components/DeckCard.tsx`, `src/components/UpcomingList.tsx`

- [ ] **Step 1: DeckCard 実装**

Create `src/components/DeckCard.tsx`:
```tsx
import { BookOpen, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Deck } from "@/types";

type Props = {
  deck: Deck;
  onReimport: () => void;
};

function formatDate(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function DeckCard({ deck, onReimport }: Props) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
            <BookOpen className="size-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{deck.name}</p>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {deck.pairs.length} phrases · {formatDate(deck.importedAt)}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="別のCSVを読み込む"
          onClick={onReimport}
        >
          <RefreshCw className="size-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: UpcomingList 実装**

Create `src/components/UpcomingList.tsx`:
```tsx
import type { Pair } from "@/types";

type Props = {
  pairs: Pair[];
  startIndex: number;
  limit?: number;
};

export function UpcomingList({ pairs, startIndex, limit = 5 }: Props) {
  const items = pairs.slice(startIndex, startIndex + limit);
  if (items.length === 0) return null;

  return (
    <section className="mt-8">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Next up
      </p>
      <ul className="mt-3 space-y-4">
        {items.map((p, i) => {
          const idx = startIndex + i;
          return (
            <li key={idx} className="flex gap-4">
              <span className="w-8 shrink-0 pt-0.5 text-xs tabular-nums text-muted-foreground">
                {String(idx + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <p lang="ja" className="text-base leading-snug">
                  {p.ja}
                </p>
                <p
                  lang="en"
                  className="mt-0.5 text-sm leading-snug text-muted-foreground"
                >
                  {p.en}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
```

- [ ] **Step 3: コミット**

```bash
git add -A
git commit -m "feat: add DeckCard and UpcomingList components"
```

---

## Task 15: CsvFileInput と上書き確認ダイアログ

**Files:**
- Create: `src/components/CsvFileInput.tsx`

- [ ] **Step 1: 実装**

Create `src/components/CsvFileInput.tsx`:
```tsx
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Props = {
  hasExistingDeck: boolean;
  onImport: (filename: string, content: string) => Promise<void>;
  children: (open: () => void) => React.ReactNode;
};

export function CsvFileInput({ hasExistingDeck, onImport, children }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ name: string; content: string } | null>(null);

  const openPicker = () => inputRef.current?.click();

  const handleFile = async (file: File) => {
    try {
      const content = await file.text();
      if (hasExistingDeck) {
        setPending({ name: file.name, content });
      } else {
        await importNow(file.name, content);
      }
    } catch (e) {
      toast.error("読み込めませんでした", { description: String(e) });
    }
  };

  const importNow = async (name: string, content: string) => {
    try {
      await onImport(name, content);
      toast.success("CSVを読み込みました");
    } catch (e) {
      toast.error("読み込めませんでした", { description: String(e) });
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void handleFile(file);
        }}
      />
      {children(openPicker)}
      <AlertDialog
        open={pending !== null}
        onOpenChange={(o) => !o && setPending(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>既存のデッキを上書きしますか？</AlertDialogTitle>
            <AlertDialogDescription>
              現在のデッキは削除され、新しいCSVに置き換わります。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!pending) return;
                const { name, content } = pending;
                setPending(null);
                await importNow(name, content);
              }}
            >
              上書きする
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
```

- [ ] **Step 2: コミット**

```bash
git add -A
git commit -m "feat: add CsvFileInput with overwrite confirmation"
```

---

## Task 16: NowPlayingHero コンポーネント

**Files:**
- Create: `src/components/NowPlayingHero.tsx`

- [ ] **Step 1: アニメーション用CSS追加**

Edit `src/index.css` — 末尾に追記:
```css
@keyframes pulse-soft {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.15); }
}

.pulse-dot {
  animation: pulse-soft 2.2s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .pulse-dot { animation: none; }
}
```

- [ ] **Step 2: 実装**

Create `src/components/NowPlayingHero.tsx`:
```tsx
import type { Pair, PlayerState } from "@/types";

type Props = {
  state: PlayerState;
  pair: Pair;
  total: number;
};

export function NowPlayingHero({ state, pair, total }: Props) {
  const isPlaying = state.kind === "playing" || state.kind === "paused";
  const activePhase = isPlaying && "phase" in state ? state.phase : null;
  const currentIndex = "index" in state ? state.index : 0;

  return (
    <section
      className="mx-auto max-w-2xl px-4 pt-8 sm:px-6"
      aria-live="polite"
    >
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {String(currentIndex + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </p>
      <div className="mt-4 space-y-3">
        <div className="flex items-start gap-3">
          <span
            className={`mt-3 inline-block size-2.5 shrink-0 rounded-full ${activePhase === "ja" ? "bg-primary pulse-dot" : "bg-muted"}`}
            aria-hidden
          />
          <p
            lang="ja"
            className={`text-3xl font-medium leading-snug sm:text-4xl ${activePhase === "ja" ? "text-foreground" : "text-muted-foreground"}`}
          >
            {pair.ja}
          </p>
        </div>
        <div className="flex items-start gap-3">
          <span
            className={`mt-3 inline-block size-2.5 shrink-0 rounded-full ${activePhase === "en" ? "bg-primary pulse-dot" : "bg-muted"}`}
            aria-hidden
          />
          <p
            lang="en"
            className={`text-2xl leading-snug sm:text-3xl ${activePhase === "en" ? "text-foreground" : "text-muted-foreground"}`}
          >
            {pair.en}
          </p>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: コミット**

```bash
git add -A
git commit -m "feat: add NowPlayingHero component"
```

---

## Task 17: PlayerBar（長押しで停止）

**Files:**
- Create: `src/components/PlayerBar.tsx`

- [ ] **Step 1: 実装**

Create `src/components/PlayerBar.tsx`:
```tsx
import { useEffect, useRef, useState } from "react";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { STOP_LONG_PRESS_MS } from "@/config";
import type { PlayerState } from "@/types";

type Props = {
  state: PlayerState;
  index: number;
  total: number;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onPrev: () => void;
  onNext: () => void;
};

export function PlayerBar({
  state,
  index,
  total,
  onPlay,
  onPause,
  onStop,
  onPrev,
  onNext,
}: Props) {
  const isPlaying = state.kind === "playing";
  const percent = total > 0 ? Math.round(((index + 1) / total) * 100) : 0;
  const timerRef = useRef<number | null>(null);
  const [pressing, setPressing] = useState(false);

  const startPress = () => {
    setPressing(true);
    timerRef.current = window.setTimeout(() => {
      onStop();
      setPressing(false);
    }, STOP_LONG_PRESS_MS);
  };

  const endPress = (fired: boolean) => {
    setPressing(false);
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
      if (!fired) {
        if (isPlaying) onPause();
        else onPlay();
      }
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const disabled = total === 0;

  return (
    <div className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/85 backdrop-blur">
      <div className="mx-auto max-w-2xl px-4 pt-2 pb-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Progress value={percent} className="h-1 flex-1" />
          <span className="text-xs tabular-nums text-muted-foreground">
            {percent}%
          </span>
        </div>
        <div className="mt-2 flex items-center justify-center gap-6">
          <Button
            variant="ghost"
            size="icon"
            className="size-12"
            disabled={disabled}
            onClick={onPrev}
            aria-label="前へ"
          >
            <SkipBack className="size-5" />
          </Button>
          <button
            type="button"
            aria-label={isPlaying ? "一時停止" : "再生"}
            disabled={disabled}
            onPointerDown={startPress}
            onPointerUp={() => endPress(false)}
            onPointerLeave={() => endPress(false)}
            onPointerCancel={() => endPress(false)}
            className={`relative flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform active:scale-95 disabled:opacity-40 disabled:pointer-events-none ${pressing ? "ring-4 ring-primary/30" : ""}`}
          >
            {isPlaying ? <Pause className="size-7" /> : <Play className="size-7 translate-x-0.5" />}
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="size-12"
            disabled={disabled}
            onClick={onNext}
            aria-label="次へ"
          >
            <SkipForward className="size-5" />
          </Button>
        </div>
        <p className="mt-1 text-center text-[10px] text-muted-foreground">
          長押しで停止
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: コミット**

```bash
git add -A
git commit -m "feat: add PlayerBar with long-press-to-stop"
```

---

## Task 18: SettingsSheet コンポーネント

**Files:**
- Create: `src/components/SettingsSheet.tsx`

- [ ] **Step 1: 実装**

Create `src/components/SettingsSheet.tsx`:
```tsx
import { useState } from "react";
import { Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Theme } from "@/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  hasDeck: boolean;
  onClearDeck: () => void;
};

export function SettingsSheet({
  open,
  onOpenChange,
  theme,
  onThemeChange,
  hasDeck,
  onClearDeck,
}: Props) {
  const [confirmingClear, setConfirmingClear] = useState(false);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>設定</SheetTitle>
            <SheetDescription>テーマとデッキの管理</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-6 px-4">
            <div>
              <p className="text-sm font-medium">テーマ</p>
              <RadioGroup
                className="mt-3 gap-3"
                value={theme}
                onValueChange={(v) => onThemeChange(v as Theme)}
              >
                {(["system", "light", "dark"] as Theme[]).map((t) => (
                  <label
                    key={t}
                    className="flex cursor-pointer items-center gap-3 rounded-md border p-3 hover:bg-accent"
                  >
                    <RadioGroupItem value={t} />
                    <span className="text-sm capitalize">{t}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium">デッキ</p>
              <Button
                variant="destructive"
                className="mt-3 w-full"
                disabled={!hasDeck}
                onClick={() => setConfirmingClear(true)}
              >
                <Trash2 className="size-4" />
                デッキを削除
              </Button>
            </div>
          </div>
          <SheetFooter className="mt-auto">
            <p className="text-center text-xs text-muted-foreground">
              English Audio PWA v0.1.0
            </p>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <AlertDialog open={confirmingClear} onOpenChange={setConfirmingClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>デッキを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              現在のデッキは完全に消えます。元に戻すには再度CSVを読み込んでください。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmingClear(false);
                onClearDeck();
              }}
            >
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
```

- [ ] **Step 2: コミット**

```bash
git add -A
git commit -m "feat: add SettingsSheet with theme switcher and deck clear"
```

---

## Task 19: App.tsx で全体を統合

**Files:**
- Modify: `src/App.tsx`, `src/main.tsx`

- [ ] **Step 1: speech インスタンスをモジュールスコープで作る**

Create `src/lib/speechInstance.ts`:
```ts
import { createSpeech } from "./speech";

export const speech = createSpeech();
```

- [ ] **Step 2: App.tsx を統合実装に置換**

Replace `src/App.tsx`:
```tsx
import { useState } from "react";
import { Toaster, toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { EmptyState } from "@/components/EmptyState";
import { DeckCard } from "@/components/DeckCard";
import { UpcomingList } from "@/components/UpcomingList";
import { NowPlayingHero } from "@/components/NowPlayingHero";
import { PlayerBar } from "@/components/PlayerBar";
import { SettingsSheet } from "@/components/SettingsSheet";
import { CsvFileInput } from "@/components/CsvFileInput";
import { useDeck } from "@/hooks/useDeck";
import { useTheme } from "@/hooks/useTheme";
import { usePlayer } from "@/hooks/usePlayer";
import { speech } from "@/lib/speechInstance";

export default function App() {
  const { deck, importCsv, clear } = useDeck();
  const { theme, setTheme } = useTheme();
  const pairs = deck?.pairs ?? [];
  const { state, index, play, stop, next, prev } = usePlayer(pairs, speech);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const supported = speech.isSupported();
  const handlePlay = () => {
    if (!supported) {
      toast.error("この端末はTTSに対応していません");
      return;
    }
    play();
  };

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
      <main className="pb-32">
        {!deck && (
          <CsvFileInput hasExistingDeck={false} onImport={importCsv}>
            {(open) => <EmptyState onPickFile={open} />}
          </CsvFileInput>
        )}
        {deck && (
          <div className="mx-auto max-w-2xl space-y-6 px-4 pt-6 sm:px-6">
            <CsvFileInput hasExistingDeck={true} onImport={importCsv}>
              {(open) => <DeckCard deck={deck} onReimport={open} />}
            </CsvFileInput>
            {state.kind === "idle" ? (
              <UpcomingList pairs={pairs} startIndex={index} />
            ) : (
              <>
                <NowPlayingHero state={state} pair={pairs[index]} total={pairs.length} />
                <UpcomingList pairs={pairs} startIndex={index + 1} limit={2} />
              </>
            )}
          </div>
        )}
      </main>
      {deck && (
        <PlayerBar
          state={state}
          index={index}
          total={pairs.length}
          onPlay={handlePlay}
          onPause={stop}
          onStop={stop}
          onPrev={prev}
          onNext={next}
        />
      )}
      <SettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        theme={theme}
        onThemeChange={setTheme}
        hasDeck={!!deck}
        onClearDeck={clear}
      />
      <Toaster position="top-center" richColors closeButton />
    </div>
  );
}
```

注: 現状の `usePlayer` には `pause/resume` が無く、`onPause` には `stop` を渡している。シンプル優先のため、長押し停止以外は「停止/再生」の2状態だけにする。仕様の `paused` 状態は将来拡張用に型だけ残す。

- [ ] **Step 3: dev で起動して全フローを手動確認**

Run: `pnpm dev`

以下を確認:
1. 初回表示で EmptyState が出る
2. CSVを選択して読み込めること（テスト用CSVを `tests/fixtures/sample.csv` に置くと便利）
3. 読込後、DeckCardとUpcomingListが見える
4. 再生ボタンで日→英の発話が始まる
5. 再度タップで一時停止（実際は停止）
6. 長押しで停止
7. 設定アイコン → Sheet が開き、テーマ切替が動く
8. リロード後もデッキが残っている

確認後 Ctrl+C。

- [ ] **Step 4: テストを全実行**

Run: `pnpm test:run`
Expected: 全テスト合格

- [ ] **Step 5: コミット**

```bash
git add -A
git commit -m "feat: wire all components in App.tsx"
```

---

## Task 20: PWA 化（vite-plugin-pwa）とアイコン

**Files:**
- Modify: `vite.config.ts`, `index.html`
- Create: `public/icon-192.png`, `public/icon-512.png`, `public/icon-maskable.png`

- [ ] **Step 1: プラグインをインストール**

Run:
```bash
pnpm add -D vite-plugin-pwa
```

- [ ] **Step 2: アイコンを生成**

仮アイコンとして単色のPNGを用意する。`public/` に下記3ファイルを置く:
- `icon-192.png`: 192x192 violet 単色（後で本番デザインに差し替え可）
- `icon-512.png`: 512x512
- `icon-maskable.png`: 512x512、中央60%領域に図案

簡易に生成する場合は `npx pwa-asset-generator` か、手作業で配置。なければ以下のコマンドで色付き単色PNGを生成:

```bash
node -e "
const fs = require('fs');
const { PNG } = require('pngjs');
function make(size, color) {
  const png = new PNG({ width: size, height: size });
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = color[0];
    png.data[i+1] = color[1];
    png.data[i+2] = color[2];
    png.data[i+3] = 255;
  }
  return PNG.sync.write(png);
}
fs.writeFileSync('public/icon-192.png', make(192, [124, 58, 237]));
fs.writeFileSync('public/icon-512.png', make(512, [124, 58, 237]));
fs.writeFileSync('public/icon-maskable.png', make(512, [124, 58, 237]));
" || pnpm add -D pngjs && node -e "$(以上のスクリプト)"
```

うまく行かない場合は手作業で 192/512 のPNGを用意し `public/` に配置。

- [ ] **Step 3: `vite.config.ts` に PWA プラグインを追加**

Replace `vite.config.ts`:
```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "English Audio PWA",
        short_name: "EnglishAudio",
        description: "日本語と英語の例文を読み上げる学習用PWA",
        theme_color: "#7c3aed",
        background_color: "#09090b",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icon-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

- [ ] **Step 4: `index.html` に theme-color と lang を追加**

Replace `index.html` の `<head>` 内容:
```html
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
<meta name="theme-color" content="#09090b" media="(prefers-color-scheme: dark)" />
<title>English Audio PWA</title>
```

また `<html lang="en">` を `<html lang="ja">` に変更。

- [ ] **Step 5: ビルドして動作確認**

Run:
```bash
pnpm build
pnpm preview
```
Expected: `dist/` に `manifest.webmanifest` と `sw.js` が含まれる。`pnpm preview` の URL で DevTools → Application → Manifest を確認。

確認後 Ctrl+C。

- [ ] **Step 6: コミット**

```bash
git add -A
git commit -m "feat: add PWA support with manifest and service worker"
```

---

## Task 21: Vercel デプロイ設定と README

**Files:**
- Create: `vercel.json`, `README.md`, `CLAUDE.md`, `.gitignore` 更新

- [ ] **Step 1: `vercel.json` 作成**

Create `vercel.json`:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }
      ]
    }
  ]
}
```

- [ ] **Step 2: README 作成**

Create `README.md`:
````markdown
# English Audio PWA

CSVの日英例文を読み上げるオフライン対応のPWA。

## 開発

```bash
pnpm install
pnpm dev
```

## ビルド

```bash
pnpm build
pnpm preview
```

## テスト

```bash
pnpm test:run
```

## デプロイ

GitHubと連携し Vercel に自動デプロイ。`vercel.json` で SPA fallback を設定済み。

## CSV フォーマット

```
日本語,英語
おはよう,Good morning
ありがとう,Thank you
```

ヘッダ行（`日本語,英語` や `ja,en` 等）は自動でスキップ。

## 技術スタック

Vite + React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui + Web Speech API + vite-plugin-pwa
````

- [ ] **Step 3: CLAUDE.md 作成**

Create `CLAUDE.md`:
```markdown
# english-audio-pwa

## プロジェクト概要

日本語/英語2列CSVを読み込み、ブラウザ内蔵TTSで「日→英→次行」と読み上げるPWA。

## 技術スタック

Vite + React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui（new-york, Zinc + Violet） + Web Speech API + vite-plugin-pwa + Vercel

## ディレクトリ規約

- `src/lib/*` 純粋関数とAPIラッパ
- `src/hooks/*` Reactフック
- `src/components/ui/*` shadcn/ui生成（直接編集しない）
- `src/components/*` プロダクトコンポーネント
- `src/types.ts` 全モデル
- `src/config.ts` 定数

## コーディング規約

- 型ヒント必須、`strict: true`
- 関数は `function` 宣言、コンポーネントも同様
- ファイルパス操作は使用しない（クライアントのみ）
- shadcn/ui コンポーネントは `pnpm dlx shadcn@latest add` で追加

## TDD方針

- `lib/` と `hooks/` は必ずテストから書く
- `components/*` は手動確認（snapshot/visual test不要）
```

- [ ] **Step 4: `.gitignore` を確認・追加**

Edit `.gitignore` — 以下が含まれていることを確認。無ければ追記:
```
node_modules
dist
.DS_Store
*.local
.vercel
```

- [ ] **Step 5: 最終ビルドとテスト**

Run:
```bash
pnpm test:run
pnpm build
```
Expected: 全テスト合格、`dist/` 生成

- [ ] **Step 6: コミット**

```bash
git add -A
git commit -m "chore: add vercel config, README, and CLAUDE.md"
```

- [ ] **Step 7: GitHub にプッシュ（手動）**

ユーザー自身で GitHub リポジトリを作成し、リモートを設定してプッシュ:
```bash
gh repo create english-audio-pwa --public --source=. --remote=origin --push
```
または:
```bash
git remote add origin <URL>
git push -u origin main
```

- [ ] **Step 8: Vercel に接続（手動）**

Vercel のWebコンソールで:
1. New Project → GitHub から `english-audio-pwa` を選択
2. Framework Preset: Vite（自動検出）
3. Build Command: `pnpm build`
4. Output Directory: `dist`
5. Deploy

Expected: 数分後に `https://english-audio-pwa.vercel.app` で公開

---

## Task 22: 実機受け入れテスト

**Files:** なし（手動確認）

- [ ] **Step 1: Vercel Preview URL を iPhone Safari で開く**

- [ ] **Step 2: ホーム画面に追加 → standalone 表示で起動**

- [ ] **Step 3: 仕様の手動受け入れテストを全て実施**

仕様 §15 の手動受け入れテストリストに基づき：
1. CSV（28行）を読み込む → デッキ表示が出ること
2. 再生 → 1行目JA→EN→2行目…の順に発話されること
3. 再生→もう一度タップ（停止扱い）が動くこと
4. 長押しで停止できること
5. リロード → デッキが残っていて再生できること
6. ホーム画面追加 → standalone表示で再生できること
7. システムテーマ切替に追従すること
8. 設定からテーマを手動切替できること
9. 歩きながら聴いて、ペース・音量が実用に耐えるか

- [ ] **Step 4: 問題があれば issue として記録、無ければ完了**

---

## 補足

- 仕様で言及した `paused` 状態は今回未実装。`Pause/Resume` は将来 Web Speech API の `pause()/resume()` を用いて追加可能（iOS Safariは互換性に注意）
- 倍速・音声選択・複数デッキは MVP 外
- shadcn/ui コンポーネントを追加・更新する場合は `pnpm dlx shadcn@latest add <name>` を再実行（既存ファイルは上書き確認される）
