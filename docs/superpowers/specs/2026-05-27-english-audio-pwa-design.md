# English Audio PWA — 設計仕様書

- **作成日**: 2026-05-27
- **プロジェクト名**: english-audio-pwa
- **配置先**: `~/dev-study/english-audio-pwa`
- **ステータス**: ドラフト（ユーザーレビュー前）
- **改訂履歴**:
  - 2026-05-27 v1: 初版（Vanilla TS）
  - 2026-05-27 v2: UI方針変更によりReact + Tailwind + shadcn/ui へ移行、Vercelデプロイ追加

## 1. 目的とコンセプト

日本語と英語の2列CSVをアップロードすると、ブラウザ内蔵TTSで「日→英→日→英…」と行ごとに読み上げるオフライン対応PWA。外出先で歩きながら英語例文を暗唱することが主目的。

- 一度CSVを取り込めば localStorage に保存され、次回からはCSV再アップロード不要
- API・サーバー処理は不要（音声生成は端末内蔵）
- Vercelで配信、iPhone Safari でホーム画面に追加して standalone 利用
- **UIは shadcn/ui ベースの第一線品質を目指す**

## 2. スコープ

### MVP に含むもの

- CSVファイルアップロード（2列: 日本語, 英語）
- localStorageへのデッキ永続化
- 再生／一時停止／停止／前へ／次へ
- 行ごとに 日→英 をセットで読み、次の行へ進む
- 進行状況の可視化（current index / total）
- PWA化（manifest + Service Worker）
- ライト/ダーク自動切替（システム設定追従）
- Vercelへのデプロイ

### MVP に含まないもの

- ユーザー認証・クラウド同期
- 複数デッキの保持と切替（デッキは1つだけ）
- 倍速再生・音声選択UI
- 例文編集機能
- レッスン番号などのメタデータ列
- 暗記管理（既習/未習などのトラッキング）

## 3. 技術スタック

| 層 | 採用 | 理由 |
|---|---|---|
| 言語 | TypeScript（strict） | 型安全 |
| ビルド | Vite | 高速HMR、React/Tailwind/PWAいずれもファーストクラス |
| UIフレームワーク | React 19 | shadcn/ui の必須要件 |
| スタイル | Tailwind CSS v4 | shadcn/ui の標準。デザイントークンをCSS変数で持てる |
| UIコンポーネント | shadcn/ui | アクセシビリティ・可読性・カスタマイズ性の総合品質が高い |
| アイコン | lucide-react | shadcn/ui の標準アイコン |
| トースト | sonner（shadcn/uiが採用） | 軽量で見た目が洗練されている |
| PWA | vite-plugin-pwa | manifest と Service Worker を自動生成 |
| 音声 | Web Speech API（SpeechSynthesis） | サーバー・API不要、オフライン動作 |
| 永続化 | localStorage | 単一デッキで容量も小さいため十分 |
| テスト | Vitest + React Testing Library + jsdom | Viteと一体・コンポーネントテスト可能 |
| デプロイ | Vercel | Vite のゼロコンフィグデプロイ。PR毎にPreview URL発行 |
| Lint/Format | ESLint + Prettier（shadcn/ui推奨設定） | 一貫したコード品質 |

## 4. ディレクトリ構成

```
english-audio-pwa/
├── README.md
├── CLAUDE.md
├── package.json
├── vite.config.ts                  PWAプラグイン・パスエイリアス
├── tsconfig.json
├── tsconfig.node.json
├── tailwind.config.ts
├── postcss.config.js
├── components.json                 shadcn/ui 設定（生成コードの置き場・スタイル）
├── vercel.json                     SPA fallback など Vercel 設定
├── index.html
├── public/
│   ├── icon-192.png                PWAアイコン
│   ├── icon-512.png
│   ├── icon-maskable.png
│   └── favicon.svg
├── src/
│   ├── main.tsx                    React エントリポイント
│   ├── App.tsx                     ルートコンポーネント
│   ├── index.css                   Tailwind directives + テーマCSS変数
│   ├── types.ts                    Pair / Deck / PlayerState
│   ├── config.ts                   タイミング定数
│   ├── lib/
│   │   ├── csv.ts                  CSVパース（純粋関数）
│   │   ├── storage.ts              localStorage 読み書き
│   │   ├── speech.ts               Web Speech API ラッパ
│   │   └── utils.ts                shadcn/ui の cn() ヘルパ
│   ├── hooks/
│   │   ├── usePlayer.ts            再生状態フック（speechを注入可能）
│   │   ├── useDeck.ts              デッキ読み込み+永続化フック
│   │   └── useTheme.ts             ライト/ダーク切替
│   ├── components/
│   │   ├── ui/                     shadcn/ui 生成コンポーネント
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── alert-dialog.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── sonner.tsx
│   │   │   └── badge.tsx
│   │   ├── AppHeader.tsx           ロゴ + 設定ボタン
│   │   ├── EmptyState.tsx          デッキ無し時のオンボーディング
│   │   ├── DeckCard.tsx            デッキ情報カード
│   │   ├── NowPlayingHero.tsx      現在発話中のヒーロー
│   │   ├── UpcomingList.tsx        近い行のプレビュー
│   │   ├── PlayerBar.tsx           固定下部の再生コントロール
│   │   ├── CsvFileInput.tsx        ファイル選択 + 上書きダイアログ
│   │   └── SettingsSheet.tsx       設定ドロワ（テーマ切替など）
│   └── test/
│       └── setup.ts                Vitest セットアップ
├── tests/
│   ├── csv.test.ts
│   ├── storage.test.ts
│   ├── usePlayer.test.ts           hooks をRTLの renderHook でテスト
│   └── speech.test.ts
└── docs/
    └── superpowers/specs/2026-05-27-english-audio-pwa-design.md
```

### モジュール責務（1ファイル1責務）

| モジュール | 責務 | 依存 |
|---|---|---|
| `lib/csv.ts` | CSV文字列のパースと検証（純粋関数） | なし |
| `lib/storage.ts` | localStorage 読み書き | なし |
| `lib/speech.ts` | `speak(text, lang)` を Promise で返すラッパ | Web Speech API |
| `hooks/usePlayer.ts` | 再生状態の管理と行進行ロジック（speech を引数で受け取りDI可能） | lib/speech |
| `hooks/useDeck.ts` | デッキの読込/永続化/上書き確認 | lib/csv, lib/storage |
| `hooks/useTheme.ts` | システムテーマ追従 + 手動切替 | なし |
| `components/*` | プレゼンテーション（プロップ駆動、状態は持たない原則） | hooks経由 |
| `App.tsx` | ページ全体のレイアウト・状態合成 | hooks + components |

## 5. データモデル

```ts
type Pair = { ja: string; en: string };

type Deck = {
  name: string;          // ファイル名（拡張子なし）
  pairs: Pair[];
  importedAt: number;    // unix ms
};

type Phase = "ja" | "en";

type PlayerState =
  | { kind: "idle" }
  | { kind: "playing"; index: number; phase: Phase }
  | { kind: "paused";  index: number; phase: Phase };

type Theme = "light" | "dark" | "system";
```

## 6. CSV仕様

- 区切り: `,`（カンマ）
- ヘッダー行: あり/なし両対応。判定ルールは「先頭行の1列目または2列目に、`日本語` `英語` `japanese` `english` `ja` `en` のいずれかが大文字小文字無視で含まれる場合のみスキップ」。それ以外は1行目もデータとして扱う
- 列順: 1列目=日本語、2列目=英語（固定）
- 改行を含むセルは未対応
- ダブルクォート囲みは最低限処理（`"a,b","c"` → `[a,b, c]`）
- 3列目以降は無視
- 空行はスキップ

## 7. 永続化

- localStorage キー: `english-audio-pwa:deck`
- 値: `JSON.stringify(Deck)`
- 既存デッキがある状態で新規取り込み時は `AlertDialog` で上書き確認
- 取り込み失敗時は既存デッキを保持

## 8. 再生フロー

### ステートマシン

```
[idle]
  │ load + play(0)
  ▼
[playing index=0 phase=ja]
  │ speak完了
  ▼
[playing index=0 phase=en]
  │ speak完了 → 行間ディレイ
  ▼
[playing index=1 phase=ja]
  │ ...
  ▼
最終行のen完了 → [idle]

pause  → [paused {index, phase}]
resume → [playing {index, phase}] でその発話から再開
stop   → [idle]
prev/next → indexを±1し、phaseを`ja`にリセット
```

### タイミング（`config.ts`）

- 日→英の間: 400ms
- 行間（あるenの完了→次行のja開始）: 800ms

### Web Speech 注意事項

- iOS Safari の制約: `speechSynthesis.speak()` は最初の呼び出しがユーザー操作イベント内である必要がある。再生開始ボタン押下時に初期化する
- 言語タグ: 日本語 `ja-JP`、英語 `en-US`
- 端末側のvoice一覧から第一候補を採用するが、無くてもブラウザに任せる
- 発話の完了は `utterance.onend` で検出、`onerror` で異常終了を処理

## 9. デザインシステム

### 9.1 デザイン原則（プロのUI/UX観点）

1. **Hero優先の情報階層**: 現在発話中の例文を画面の主役にし、フォントサイズ・色・余白で階層を作る
2. **常時アクセス可能な再生コントロール**: ポッドキャストアプリと同様、画面下部に固定。歩行中の親指リーチを考慮
3. **状態ごとに異なる画面**: `Empty`（デッキ無し）、`Ready`（停止中）、`Playing`（再生中）の3状態でレイアウトを切替
4. **Single primary CTA**: 各画面で主要アクションは1つに絞る（Empty=CSV読込、Ready/Playing=再生/一時停止）
5. **モーションは情報を運ぶ場合のみ**: 発話中のセンテンスにのみ控えめなパルス。`prefers-reduced-motion` を尊重
6. **アクセシビリティ**: 全インタラクティブ要素は `h-12` (48px) 以上、明示的なfocus ring、`aria-live="polite"` で発話中の文を読み上げ環境にも通知
7. **タイポ階層**: 現在文は `text-3xl/4xl`、補助文は `text-base text-muted-foreground`、メタ情報は `text-xs uppercase tracking-wider`

### 9.2 デザイントークン（Tailwind/shadcn テーマ）

shadcn/ui の `new-york` スタイル + `Zinc` ベースに、アクセントは `Violet` を採用：

| トークン | 用途 | light | dark |
|---|---|---|---|
| `--background` | 全体背景 | zinc-50 | zinc-950 |
| `--foreground` | 標準テキスト | zinc-950 | zinc-50 |
| `--card` | カード背景 | white | zinc-900 |
| `--muted-foreground` | 補助テキスト | zinc-500 | zinc-400 |
| `--primary` | プライマリアクション | violet-600 | violet-500 |
| `--accent` | ホバー/選択 | zinc-100 | zinc-800 |
| `--destructive` | 破壊的操作 | red-600 | red-500 |
| `--ring` | フォーカスリング | violet-500 | violet-400 |

`index.css` で CSS変数として定義し、`tailwind.config.ts` の `theme.extend.colors` から参照。`useTheme` で `<html class="dark">` を切替。

### 9.3 タイポグラフィ

- 日本語: `'Hiragino Sans', 'Yu Gothic UI', system-ui, sans-serif`
- 英語: `'Inter', system-ui, sans-serif`
- 現在文（hero）: `text-3xl sm:text-4xl font-medium leading-snug`
- 補助文: `text-base text-muted-foreground leading-relaxed`
- ラベル: `text-xs font-medium uppercase tracking-wider text-muted-foreground`

### 9.4 スペーシング

- ベース単位: 4px（Tailwind既定）
- 主要セクション間: `space-y-8`（32px）
- カード内パディング: `p-6`（24px）
- 画面外周: `px-4 sm:px-6`、`pb-32`（下部 PlayerBar 分の余白）

### 9.5 モーション

- ベーストランジション: `transition-all duration-200 ease-out`
- 発話中パルス: `animate-pulse-slow`（カスタム、2.5s）。ドット表示のみで、テキスト自体は動かさない
- ボタンプレス: `active:scale-95 transition-transform duration-100`
- 画面遷移: 状態切替時に `opacity-0 → opacity-100` を 150ms（Fade のみ、Slide は使わない）

## 10. UI画面設計

画面は **1ページ + 設定ドロワ**。状態に応じてメイン領域のコンポーネントを差し替える。

### 10.1 共通レイアウト

```
┌─────────────────────────────────────┐
│ AppHeader                            │  sticky top, h-14
│  English Audio PWA            [⚙]   │
├─────────────────────────────────────┤
│                                      │
│   <Main: 状態に応じて切替>           │  flex-1, overflow-y-auto
│                                      │
├─────────────────────────────────────┤
│ PlayerBar                            │  fixed bottom, h-24
│  (デッキ有のときのみ表示)             │
└─────────────────────────────────────┘
```

### 10.2 状態 1: Empty State（デッキ無し）

```
┌────────────────────────────────────┐
│  English Audio PWA            ⚙    │
├────────────────────────────────────┤
│                                     │
│                                     │
│              ┌───┐                  │
│              │📚 │  ← lucide BookOpen
│              └───┘                  │
│                                     │
│       デッキがありません            │  text-2xl font-medium
│                                     │
│   2列のCSV（日本語, 英語）を         │  text-muted-foreground
│   読み込んで始めましょう            │  text-center max-w-sm
│                                     │
│       ┌────────────────────┐        │
│       │  + CSVを読み込む   │        │  Button variant=default size=lg
│       └────────────────────┘        │
│                                     │
│   サンプル形式を見る ↓               │  Button variant=link, アコーディオン
│   ┌───────────────────────────┐    │
│   │ おはよう,Good morning      │    │  pre + code block
│   │ ありがとう,Thank you      │    │
│   └───────────────────────────┘    │
│                                     │
└────────────────────────────────────┘
```

### 10.3 状態 2: Ready State（デッキ有・停止中）

```
┌────────────────────────────────────┐
│  English Audio PWA            ⚙    │
├────────────────────────────────────┤
│                                     │
│   ┌──────────────────────────────┐  │
│   │ 📚 lessons_28.csv            │  │  Card
│   │ ─────                        │  │
│   │ 28 PHRASES · IMPORTED 14:32 │  │  text-xs muted uppercase
│   │                              │  │
│   │ [▶ 先頭から再生]  [↻]      │  │  Button + IconButton (再読込)
│   └──────────────────────────────┘  │
│                                     │
│   NEXT UP                           │  Section label
│   ───                                │
│                                     │
│   01                                │  index muted tabular-nums
│   おはようございます                │
│   Good morning.                     │  muted
│                                     │
│   02                                │
│   ありがとうございます              │
│   Thank you.                        │
│                                     │
│   03                                │
│   …                                 │
│                                     │
├────────────────────────────────────┤
│ ──────────────────────              │  Progress (0%)
│       ◀◀     ▶     ▶▶               │  PlayerBar
└────────────────────────────────────┘
```

### 10.4 状態 3: Playing State（再生中・一時停止中）

```
┌────────────────────────────────────┐
│  English Audio PWA            ⚙    │
├────────────────────────────────────┤
│                                     │
│   12 / 28          ROW 12           │  meta line
│   ─────                              │
│                                     │
│   ●  おはようございます             │  HERO: text-3xl/4xl, ● = pulsing dot
│                                     │
│      Good morning.                  │  muted, text-xl, 上下で言語切替
│                                     │
│   ────                              │  Divider
│                                     │
│   NEXT                              │  Section label
│   ありがとうございます              │  text-base
│   Thank you.                        │  muted
│                                     │
├────────────────────────────────────┤
│ ▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░          │  Progress (43%)
│       ◀◀    ⏸    ▶▶                 │  PlayerBar（再生中は⏸）
│       長押し で 停止                │  hint text 極小
└────────────────────────────────────┘
```

### 10.5 PlayerBar 詳細

- 高さ `h-24`、`fixed bottom-0 inset-x-0`
- 背景: `bg-background/80 backdrop-blur border-t`
- 上段: `Progress` コンポーネント（`h-1`）+ パーセント表示（小）
- 下段: 中央に大きな再生/一時停止ボタン（`size-16 rounded-full`）、左右に prev/next（`size-12 ghost`）
- 停止ボタンは別配置でなく**再生ボタン長押し1.5秒で停止**（誤操作防止 + 画面の簡潔化）。長押し中はリングが回転表示
- 停止のヒントテキストを下部に極小で常時表示

### 10.6 AppHeader

- 高さ `h-14`、`sticky top-0 bg-background/80 backdrop-blur border-b`
- 左: ロゴテキスト（小）
- 右: 設定 IconButton（Settings アイコン）。タップで `Sheet` を右からスライドイン

### 10.7 SettingsSheet

shadcn/ui の `Sheet` で実装。中身:

- テーマ切替（`light` / `dark` / `system`）— `RadioGroup`
- デッキ削除ボタン（`Button variant=destructive`）。タップで `AlertDialog` 確認
- バージョン情報（フッタ）

### 10.8 CSV読み込みフロー

1. 「CSVを読み込む」ボタンタップ → `<input type="file" accept=".csv,text/csv">`
2. ファイル選択 → FileReader 読込 → `csv.ts` でパース
3. 既存デッキがあれば `AlertDialog` で「上書きしますか？」確認
4. 確認 OK → `storage.save()` → toast「28件読み込みました」
5. パース失敗 → toast「読み込めませんでした: <理由>」

### 10.9 トースト（sonner）

- 位置: `top-center`（PlayerBar と被らない）
- 種類: `success` / `error` / `info`（色のみ差別化、アイコンは同一）
- 自動消失: 3秒
- ライブリージョン: `aria-live="polite"`

## 11. アクセシビリティ

- すべてのインタラクティブ要素に `aria-label`（アイコンのみのボタンに必須）
- 現在発話中の文に `aria-live="polite"` を持つ非表示テキストを併設
- フォーカスリングは常時可視（`focus-visible:ring-2 focus-visible:ring-ring`）
- 配色は WCAG AA 準拠（shadcn/ui の Zinc + Violet で達成済み）
- スクリーンリーダーで状態遷移を読み上げ（「再生中」「一時停止」など）

## 12. PWA設定

- `vite-plugin-pwa` で `manifest.webmanifest` と Service Worker を自動生成
- `display: "standalone"`、ホーム画面追加で全画面表示
- アイコン: 192/512/maskable の3種
- Service Worker は静的アセット（HTML/CSS/JS/icon）のみキャッシュ
- 音声は端末内蔵TTSなのでキャッシュ対象なし
- `theme_color`: 動的にダーク/ライト対応する `meta[name="theme-color"]` を両方記述

## 13. デプロイ

### Vercel構成

- リポジトリを GitHub に push → Vercel と連携
- ビルドコマンド: `pnpm build` （または `npm run build`）
- 出力ディレクトリ: `dist/`
- 環境変数: なし（完全クライアントサイドのため）
- `vercel.json` で SPA fallback を設定:
  ```json
  {
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
  }
  ```
- PR毎の Preview URL を実機テストに活用
- 本番ドメインは `english-audio-pwa.vercel.app`（仮）

## 14. エラーハンドリング

「内部コードは信頼、外部境界だけ検証」原則で必要最小限。

| 発生場所 | ケース | 対応 |
|---|---|---|
| CSV読み込み | 空ファイル / 2列に満たない行ばかり | toast「有効な行がありません」/ 既存デッキは保持 |
| CSV読み込み | UTF-8でないバイナリ | FileReaderエラーを拾って toast 表示 |
| Web Speech | `'speechSynthesis' in window === false` | 起動時に検出し、再生ボタンを無効化＋警告バナー |
| Web Speech | 日英voiceが見つからない | 警告 toast を一度だけ表示、再生は試みる |
| Web Speech | 発話中に異常終了 | `onerror` を受け、状態を idle に戻す + toast |
| localStorage | 容量上限/プライベートモード | try/catch、失敗時に toast。デッキは取込済 |

モーダル使用は「デッキ上書き確認」と「デッキ削除確認」のみ（いずれも `AlertDialog`）。

## 15. テスト方針

Vitest + React Testing Library + jsdom。TDDでロジック層と主要フックをカバー。UIの見た目は実機・ブラウザでの手動確認。

| 対象 | テスト内容 | 優先度 |
|---|---|:---:|
| `lib/csv.ts` | ヘッダ自動判定、空行スキップ、3列以上の無視、クォート処理、不正データ | 必須 |
| `lib/storage.ts` | save → load の往復、デッキ無し時に `null`、保存失敗時の例外 | 必須 |
| `hooks/usePlayer.ts` | 状態遷移（idle→playing→paused→playing→idle）、next/prev、終端到達でidle復帰。`speech` をモック注入 | 必須 |
| `lib/speech.ts` | speak の Promise が resolve/reject すること（モック `SpeechSynthesisUtterance`） | 推奨 |
| `hooks/useDeck.ts` | CSV読込 → 永続化 → 再ハイドレートのフロー | 推奨 |
| `components/*` | スナップショット/見た目 | テスト対象外（手動確認） |

`usePlayer` は `speech` を引数として受け取る形にして、テスト時はモックを注入できる設計にする。

### 手動受け入れテスト

1. CSV（28行）を読み込む → デッキ表示が出ること
2. 再生 → 1行目JA→EN→2行目…の順に発話されること
3. 一時停止/再開 → その発話から再開できること
4. リロード → デッキが残っていて再生できること
5. iPhone Safari でホーム画面追加 → standalone表示で再生できること
6. システムテーマ切替に追従してダーク/ライトが切り替わること
7. 設定からテーマを手動切替できること
8. Vercel Preview URL を iPhone で開いて全フローが動作すること
9. 実機で歩きながら聴いて、ペースや音量バランスが実用に耐えるか確認

## 16. 想定スケジュール（参考）

実装計画書は本仕様承認後に writing-plans スキルで別途作成。

## 17. 将来の拡張余地（MVP外）

- レッスン番号列のサポートと範囲指定再生
- シャッフル / 倍速 / 音声選択UI
- 複数デッキ管理
- 既習/未習のチェック
- Google Sheets URL直接取り込み
- IndexedDB への移行（音声ファイル同梱が必要になった場合）
