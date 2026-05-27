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
