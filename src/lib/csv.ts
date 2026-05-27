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
