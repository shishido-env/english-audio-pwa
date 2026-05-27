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
