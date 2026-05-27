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
