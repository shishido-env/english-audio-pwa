# English Audio PWA — 設計仕様書

- **作成日**: 2026-05-27
- **プロジェクト名**: english-audio-pwa
- **配置先**: `~/dev-study/english-audio-pwa`
- **ステータス**: ドラフト（ユーザーレビュー前）

## 1. 目的とコンセプト

日本語と英語の2列CSVをアップロードすると、ブラウザ内蔵TTSで「日→英→日→英…」と行ごとに読み上げるオフライン対応PWA。外出先で歩きながら英語例文を暗唱することが主目的。

- 一度CSVを取り込めば localStorage に保存され、次回からはCSV再アップロード不要
- サーバー不要・API代金不要・完全クライアントサイド
- iPhone Safari でホーム画面に追加して standalone 利用

## 2. スコープ

### MVP に含むもの

- CSVファイルアップロード（2列: 日本語, 英語）
- localStorageへのデッキ永続化
- 再生／一時停止／停止／前へ／次へ
- 行ごとに 日→英 をセットで読み、次の行へ進む
- 進行状況の可視化（current index / total）
- PWA化（manifest + Service Worker）

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
| 言語 | TypeScript | 型安全 |
| ビルド | Vite | 一般的・ホットリロード・PWAプラグインあり |
| PWA | vite-plugin-pwa | manifest と Service Worker を自動生成 |
| UI | Vanilla（フレームワーク無し） | 画面が単一・状態がシンプルなため |
| 音声 | Web Speech API（SpeechSynthesis） | 端末内蔵TTS、サーバー・API不要、オフライン動作 |
| 永続化 | localStorage | 単一デッキで容量も小さいため十分 |
| テスト | Vitest | Viteと一体・TypeScript対応 |

## 4. ディレクトリ構成

```
english-audio-pwa/
├── README.md
├── CLAUDE.md
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
├── public/
│   ├── icon-192.png
│   └── icon-512.png
├── src/
│   ├── main.ts          エントリポイント（DOM結線）
│   ├── csv.ts           CSV文字列 → Pair[] の純粋関数
│   ├── storage.ts       localStorage 読み書き
│   ├── speech.ts        Web Speech API ラッパ（speak を Promise で返す）
│   ├── player.ts        再生ステートマシン
│   ├── ui.ts            DOM更新
│   └── config.ts        間（ま）の長さなど定数
├── tests/
│   ├── csv.test.ts
│   ├── storage.test.ts
│   └── player.test.ts
└── docs/
    └── superpowers/specs/2026-05-27-english-audio-pwa-design.md
```

### モジュール責務（1ファイル1責務）

| モジュール | 責務 | 依存 |
|---|---|---|
| `csv.ts` | CSV文字列のパースと検証（純粋関数） | なし |
| `storage.ts` | localStorageからの読み書きのみ | なし |
| `speech.ts` | `speak(text, lang)` を Promise で返すラッパ | Web Speech API |
| `player.ts` | 再生状態の管理と行進行ロジック（speech.tsをDIで受ける） | speech.ts |
| `ui.ts` | ボタン・進捗・トーストのDOM操作 | なし |
| `main.ts` | 各モジュールを組み立ててイベント結線 | 全部 |
| `config.ts` | タイミング定数 | なし |

## 5. データモデル

```ts
type Pair = { ja: string; en: string };

type Deck = {
  name: string;          // ファイル名（拡張子なし）
  pairs: Pair[];
  importedAt: number;    // unix ms
};

type PlayerState =
  | { kind: "idle" }
  | { kind: "playing"; index: number; phase: "ja" | "en" }
  | { kind: "paused";  index: number; phase: "ja" | "en" };
```

## 6. CSV仕様

- 区切り: `,`（カンマ）
- ヘッダー行: あり/なし両対応。先頭行が「日本語/英語」「ja/en」などの典型ヘッダなら自動スキップ
- 列順: 1列目=日本語、2列目=英語（固定）
- 改行を含むセルは未対応
- ダブルクォート囲みは最低限処理（`"a,b","c"` → `[a,b, c]`）
- 3列目以降は無視
- 空行はスキップ

## 7. 永続化

- localStorage キー: `english-audio-pwa:deck`
- 値: `JSON.stringify(Deck)`
- 既存デッキがある状態で新規取り込み時は上書き確認ダイアログ
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
prev/next → indexを±1、再生中なら次の発話から続行
```

### タイミング（`config.ts`）

- 日→英の間: 400ms
- 行間（あるenの完了→次行のja開始）: 800ms

### Web Speech 注意事項

- iOS Safari の制約: `speechSynthesis.speak()` は最初の呼び出しがユーザー操作イベント内である必要がある。再生開始ボタン押下時に初期化する
- 言語タグ: 日本語 `ja-JP`、英語 `en-US`
- 端末側のvoice一覧から第一候補を採用するが、無くてもブラウザに任せる
- 発話の完了は `utterance.onend` で検出、`onerror` で異常終了を処理

## 9. UI設計

画面は **1ページ**。状態に応じてセクションの表示/非表示を切り替える。

### 画面構成（縦スクロール / モバイル基準）

```
┌────────────────────────────────────┐
│  English Audio PWA                 │  ← ヘッダ
├────────────────────────────────────┤
│  📚 現在のデッキ                    │
│  lessons_28  (28件)                 │
│  取り込み: 2026-05-27 14:32         │
│  [ CSV を読み込む ]                 │
├────────────────────────────────────┤
│  ▶ 再生コントロール                  │
│   ◀◀   [ ▶ 再生 ]   ▶▶              │
│         [ ⏸ 一時停止 ]              │
│         [ ⏹ 停止 ]                  │
│  進行: 12 / 28                      │
│  ▓▓▓▓▓▓▓▓░░░░░░░░░░░ 43%           │
├────────────────────────────────────┤
│  📖 いま読んでいる行                 │
│   JA  おはようございます            │
│   EN  Good morning.       ◀ now    │
└────────────────────────────────────┘
```

### UI要素の表示条件と動作

| 要素 | 表示条件 | 動作 |
|---|---|---|
| 「CSV を読み込む」 | 常時 | `<input type="file" accept=".csv">` を開く |
| デッキ情報 | デッキ有 | ファイル名 + 件数 + 取込日時 |
| ▶ 再生 | デッキ有 & 非再生 | 現在indexから再生開始（初回は0） |
| ⏸ 一時停止 | 再生中 | `speechSynthesis.pause()` |
| ⏹ 停止 | 再生中/一時停止中 | idleにリセット |
| ◀◀ / ▶▶ | デッキ有 | indexを±1。再生中なら次の発話から続行 |
| 進行プログレス | デッキ有 | `index / pairs.length` |
| 現在行表示 | 再生中/一時停止 | 該当行のJA/EN、発話中の側をハイライト |

### スタイル方針

- ダーク基調（外で歩きながら使う想定）
- ボタンは最低 44×44 px（iOSヒット領域基準）
- システムフォント（`-apple-system`）
- スクロール無しで主要操作が画面に収まる

### PWA設定

- `vite-plugin-pwa` で `manifest.webmanifest` と Service Worker を自動生成
- `display: "standalone"`、ホーム画面追加で全画面表示
- Service Worker は静的アセット（HTML/CSS/JS/icon）のみキャッシュ
- 音声は端末内蔵TTSなのでキャッシュ対象なし

## 10. エラーハンドリング

「内部コードは信頼、外部境界だけ検証」原則で必要最小限。

| 発生場所 | ケース | 対応 |
|---|---|---|
| CSV読み込み | 空ファイル / 2列に満たない行ばかり | トースト「有効な行がありません」/ 既存デッキは保持 |
| CSV読み込み | UTF-8でないバイナリ | FileReaderエラーを拾ってトースト表示 |
| Web Speech | `'speechSynthesis' in window === false` | 起動時に検出し、再生ボタンを無効化＋警告表示 |
| Web Speech | 日英voiceが見つからない | 警告表示するだけで再生は試みる |
| Web Speech | 発話中に異常終了 | `onerror` を受け、状態を idle に戻す |
| localStorage | 容量上限/プライベートモード | try/catch、失敗時にトースト表示。デッキは取込済 |

トースト1種類のみ（成功/エラー兼用、3秒で消える）。モーダルは「デッキ上書き」確認のみ。

## 11. テスト方針

Vitest を使い、TDDでロジック層を優先カバー。UI / Web Speech は手動確認。

| 対象 | テスト内容 | 優先度 |
|---|---|:---:|
| `csv.ts` | ヘッダ自動判定、空行スキップ、3列以上の無視、クォート処理、不正データ | 必須 |
| `storage.ts` | save → load の往復、デッキ無し時に `null`、保存失敗時の例外 | 必須 |
| `player.ts` | 状態遷移（idle→playing→paused→playing→idle）、next/prev、終端到達でidle復帰 | 必須 |
| `speech.ts` | speak の Promise が resolve/reject すること（モック `SpeechSynthesisUtterance`） | 推奨 |
| `ui.ts` | DOM操作 | テスト対象外（手動確認） |

`player.ts` は `speech.ts` をコンストラクタで受け取る形にして、テスト時はモックを注入できる設計にする。

### 手動受け入れテスト

1. CSV（28行）を読み込む → デッキ表示が出ること
2. 再生 → 1行目JA→EN→2行目…の順に発話されること
3. 一時停止/再開 → その発話から再開できること
4. リロード → デッキが残っていて再生できること
5. iPhone Safari でホーム画面追加 → standalone表示で再生できること
6. 実機で歩きながら聴いて、ペースや音量バランスが実用に耐えるか確認

## 12. 想定スケジュール（参考）

実装計画書は本仕様承認後に writing-plans スキルで別途作成。

## 13. 将来の拡張余地（MVP外）

- レッスン番号列のサポートと範囲指定再生
- シャッフル / 倍速 / 音声選択UI
- 複数デッキ管理
- 既習/未習のチェック
- Google Sheets URL直接取り込み
